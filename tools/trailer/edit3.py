import json, os, subprocess, sys, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
sys.path.insert(0, os.path.dirname(__file__)); import synth
from synth import SR
W, H, FPS = 1920, 1080, 30

CLIPS = os.environ.get('CLIPS', 'clips')
def font(*paths):
    for p in paths:
        if os.path.exists(p): return p
    raise SystemExit(f'none of these fonts found: {paths}')
SUP = '/System/Library/Fonts/Supplemental/'
SERIF_B = font(SUP + 'Georgia Bold.ttf', '/usr/share/fonts/truetype/crosextra/Caladea-Bold.ttf')
SERIF_I = font(SUP + 'Georgia Italic.ttf', '/usr/share/fonts/truetype/crosextra/Caladea-Italic.ttf')
BLACK = font(SUP + 'Arial Black.ttf', '/usr/share/fonts/opentype/inter/InterDisplay-ExtraBold.otf')
SANS = font(SUP + 'Arial.ttf', '/usr/share/fonts/opentype/inter/Inter-Medium.otf')
CREAM = (246, 239, 224, 255); OCHRE = (222, 166, 96, 255)
BEAT = 60 / 100; BAR = 4 * BEAT

def png_text(path, lines, spacing=0):
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    fonts = [ImageFont.truetype(f, s) for _, f, s, _, _ in lines]
    def width(t, f, ls): return sum(d.textlength(c, font=f) for c in t) + ls * (len(t) - 1)
    hs = [f.getbbox('HgÅ')[3] - f.getbbox('HgÅ')[1] for f in fonts]
    gaps = [l[4] for l in lines]
    total = sum(hs) + sum(gaps[1:])
    y = (H - total) / 2
    sh = Image.new('RGBA', (W, H), (0, 0, 0, 0)); sd = ImageDraw.Draw(sh)
    draws = []
    for (t, _, _, col, gap), f, h in zip(lines, fonts, hs):
        y += gap if draws else 0
        ls = f.size * 0.06 if f.path == BLACK else 0
        x = (W - width(t, f, ls)) / 2; top = y - f.getbbox('HgÅ')[1]
        xx = x
        for c in t:
            sd.text((xx + 2, top + 4), c, font=f, fill=(0, 0, 0, 210)); draws.append((xx, top, c, f, col)); xx += d.textlength(c, font=f) + ls
        y += h
    sh = sh.filter(ImageFilter.GaussianBlur(6))
    img = Image.alpha_composite(sh, img); d = ImageDraw.Draw(img)
    for xx, top, c, f, col in draws: d.text((xx, top), c, font=f, fill=col)
    img.save(path)

def beat_text(t): return [(t, BLACK, 92, CREAM, 0)]
def small_text(t): return [(t, SERIF_I, 56, CREAM, 0)]
LOGO = [('OVER THE CAPE', SERIF_B, 150, CREAM, 0), ('THE CREB TRACK  ·  CAPE YORK  ·  1986', BLACK, 32, OCHRE, 40),
        ('Play free in your browser', SANS, 38, (226, 220, 206, 255), 64), ('reidstephen11.github.io/over-the-cape', SANS, 32, (190, 184, 170, 255), 16)]
TITLE = [('OVER THE CAPE', SERIF_B, 150, CREAM, 0)]

def load(name):
    return json.load(open(f'{CLIPS}/{name}.json'))

def build(TL, out='trailer.mp4'):
    os.makedirs('seg', exist_ok=True)
    segs = []; t = 0.0
    for i, it in enumerate(TL):
        dur = it['dur']; o = f'seg/{i:02d}.mp4'
        if 'clip' in it:
            start = int(round(it.get('from', 0) * FPS))
            src = ['-framerate', str(FPS), '-start_number', str(start), '-i', f"{CLIPS}/{it['clip']}/%05d.jpg"]
            vf = f'scale={W}:{H},eq=contrast=1.08:saturation=1.15:gamma=0.97,vignette=PI/4.5'
        else:
            src = ['-f', 'lavfi', '-i', f'color=c=0x0a0908:s={W}x{H}:r={FPS}:d={dur}']
            vf = 'null'
        fades = []
        if it.get('fin'): fades.append(f"fade=in:st=0:d={it['fin']}")
        if it.get('fout'): fades.append(f"fade=out:st={dur - it['fout']:.3f}:d={it['fout']}")
        vf = ','.join([vf, 'setsar=1', *fades])
        args = ['ffmpeg', '-loglevel', 'error', '-y', *src]
        if it.get('text'):
            png = f'seg/{i:02d}.png'; png_text(png, it['text'])
            ts, te = it.get('tin', 0.15), it.get('tout', dur - 0.1)
            args += ['-loop', '1', '-framerate', str(FPS), '-t', str(dur), '-i', png, '-filter_complex',
                     f"[0:v]{vf}[b];[1:v]format=rgba,fade=in:st={ts}:d=0.18:alpha=1,fade=out:st={te - 0.22:.3f}:d=0.22:alpha=1[x];[b][x]overlay=0:0,format=yuv420p[v]", '-map', '[v]']
        else:
            args += ['-vf', vf + ',format=yuv420p']
        args += ['-t', f'{dur:.4f}', '-r', str(FPS), '-c:v', 'libx264', '-crf', '15', '-preset', 'medium', o]
        subprocess.run(args, check=True)
        it['t0'] = t; t += dur; segs.append(o)
    with open('seg/list.txt', 'w') as f:
        for s in segs: f.write(f"file '{os.path.abspath(s)}'\n")
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', 'seg/list.txt', '-c', 'copy', 'video.mp4'], check=True)
    return t

def audio(TL, total, cues):
    N = int((total + 0.5) * SR)
    mus = np.zeros((N, 2)); fx = np.zeros((N, 2))
    def add(buf, sig, t, gain=1.0, pan=0.0):
        i = int(t * SR)
        if i >= N or i < 0: return
        sig = sig[: N - i] * gain
        buf[i:i + len(sig), 0] += sig * np.sqrt(0.5 * (1 - pan)); buf[i:i + len(sig), 1] += sig * np.sqrt(0.5 * (1 + pan))
    # Engine and effects, per clip.
    for it in TL:
        if 'clip' not in it or it.get('mute'): continue
        lg = load(it['clip']); log = lg['log']; slow = lg.get('slow', 1)
        a = int(round(it.get('from', 0) * FPS)); b = a + int(round(it['dur'] * FPS))
        part = log[a:b]
        if not part: continue
        rpm = [l['rpm'] for l in part]; thr = [l['thr'] for l in part]
        cyl = {'unimog': 6, 'lc79': 8, 'sooty80': 6, 'hj60': 6, 'shortie': 6, 'troopy': 6, 'patrol': 6, 'hilux': 4, 'perentie': 6, 'camel': 4}.get(lg['shot']['veh'], 6)
        sig = synth.engine(rpm, thr, cyl=cyl, pitch=0.55 if slow < 1 else 1.0, gain=it.get('eng', 1.0))
        fl = int(0.03 * SR); sig[:fl] *= np.linspace(0, 1, fl); sig[-fl:] *= np.linspace(1, 0, fl)
        add(fx, sig, it['t0'], 0.5, it.get('pan', 0.0))
        for st, g in it.get('splash', []): add(fx, synth.splash(2.2 if slow < 1 else 1.4, g), it['t0'] + st, 0.9)
    # Music.
    c = cues
    prog = [[50, 57, 62, 65, 69], [46, 53, 58, 62, 65], [41, 53, 57, 60, 65], [48, 55, 60, 64, 67]]
    add(mus, synth.drone(synth.hz(38), c['hit1'] + 0.5, 2.5), 0, 0.8)
    add(mus, synth.riser(c['hit1'] - 0.6), 0.6, 0.6)
    add(mus, synth.boom(), c['hit1'], 1.0)
    # soft plucks from the title until the drums
    tt = c['hit1'] + 1.2; k = 0
    while tt < c['drums'] - 0.05:
        ch = prog[(k // 8) % 4]; add(mus, synth.pluck(synth.hz(ch[[1, 3, 4, 3, 2, 3, 4, 2][k % 8]] + 12), 1.4, 0.6), tt, 0.32, -0.3 + 0.08 * (k % 8)); tt += BEAT / 2; k += 1
    add(mus, synth.riser(BAR), c['drums'] - BAR, 0.5)
    add(mus, synth.drone(synth.hz(38), c['brk'] - c['drums'] + 1, 1.0), c['drums'], 0.6)
    def groove(t0, t1, full):
        b = 0; t = t0
        while t < t1 - 0.01:
            ch = prog[b % 4]
            for q in range(4):
                tq = t + q * BEAT
                if tq >= t1 - 0.01: break
                add(mus, synth.kick(), tq, 0.9 if q % 2 == 0 else 0.7)
                if q % 2 == 1: add(mus, synth.snare(), tq, 0.45)
                add(mus, synth.bass(synth.hz(ch[0] - 12), BEAT * 0.9), tq, 1.0)
                for e in range(2):
                    add(mus, synth.hat(), tq + e * BEAT / 2, 1.0, 0.3)
                    add(mus, synth.pluck(synth.hz(ch[[0, 2, 3, 4, 3, 2, 1, 2][(q * 2 + e) % 8]] + 12), 1.2, 0.6), tq + e * BEAT / 2, 0.3, -0.35)
                    if full: add(mus, synth.pluck(synth.hz(ch[(q + e + 2) % 5] + 24), 0.9, 0.85), tq + e * BEAT / 2 + BEAT / 4, 0.14, 0.45)
            if full: [add(mus, synth.tom(f), t + q * BEAT, 0.35, -0.2) for q, f in ((2.5, 120), (3, 100), (3.5, 80))]
            t += BAR; b += 1
    groove(c['drums'], c['part2'], False)
    groove(c['part2'], c['brk'], True)
    add(mus, synth.boom(2.5), c['brk'], 0.5)
    add(mus, synth.drone(synth.hz(41), c['final'] - c['brk'] + 0.5, 1.5), c['brk'], 0.9)
    tt = c['brk'] + BAR / 2; k = 0
    while tt < c['final'] - 0.05:
        add(mus, synth.pluck(synth.hz([65, 69, 72, 69][k % 4]), 2.4, 0.5), tt, 0.25, 0.3 * ((-1) ** k)); tt += BEAT * 2; k += 1
    add(mus, synth.riser(BAR * 1.5), c['final'] - BAR * 1.5, 0.8)
    for q in range(4): add(mus, synth.kick(), c['final'] - BEAT + q * BEAT / 4, 0.5 + 0.15 * q)
    add(mus, synth.boom(4.5), c['final'], 1.1)
    groove(c['final'], c['logo'], True)
    add(mus, synth.boom(5.0), c['logo'], 1.0)
    for m in [38, 50, 57, 62, 65, 69, 74]: add(mus, synth.pluck(synth.hz(m), 5, 0.7), c['logo'], 0.26, (m - 56) / 30)
    add(mus, synth.drone(synth.hz(38), total - c['logo'] + 0.3, 1.0), c['logo'], 1.2)
    mus /= np.max(np.abs(mus)) + 1e-9; fx /= np.max(np.abs(fx)) + 1e-9
    # duck the effects under the music in the groove, keep them up in the cold open and breakdown
    duck = np.ones(N)
    for a, b, g in ((c['drums'], c['brk'], 0.45), (c['final'], total + 1, 0.4)):
        duck[int(a * SR):int(b * SR)] = g
    mix = mus * 0.85 + fx * (duck[:, None] * 0.75)
    mix /= np.max(np.abs(mix)) * 1.1
    fade = int(1.2 * SR); mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
    with wave.open('audio.wav', 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype('<i2').tobytes())

def finish(total, out):
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', 'video.mp4', '-i', 'audio.wav', '-map', '0:v', '-map', '1:a',
                    '-c:v', 'libx264', '-crf', '18', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k',
                    '-movflags', '+faststart', '-t', f'{total:.3f}', out], check=True)
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', out, '-vf', 'scale=960:540', '-c:v', 'libx264', '-preset', 'slow',
                    '-b:v', '750k', '-maxrate', '1000k', '-bufsize', '2000k', '-profile:v', 'main', '-pix_fmt', 'yuv420p',
                    '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', out.replace('.mp4', '-phone.mp4')], check=True)
