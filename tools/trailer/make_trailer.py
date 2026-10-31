# Over The Cape trailer v3. Run from the folder that holds clips/<name>/%05d.jpg and clips/<name>.json:
#   python3 make_trailer.py           -> over-the-cape-trailer.mp4, -phone.mp4, check_*.jpg contact sheets
import os, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from edit3 import *
B = BAR
T = beat_text
TL = [
    dict(clip='tyre', **{'from': 0.2}, dur=B, fin=0.5, text=small_text('Cape York, 1986'), tin=0.5),
    dict(card=1, dur=2.0, text=TITLE, tin=0.0, tout=1.85),
    dict(clip='aerial2', **{'from': 0.5}, dur=2.2, text=small_text('The CREB Track'), tin=0.3),
    dict(clip='crawl', dur=B),
    # drums
    dict(clip='splash2', **{'from': 0.5}, dur=B, text=T('CROSS THE CREEKS'), splash=[(0.0, 0.8), (1.0, 0.7)]),
    dict(clip='slowmo', dur=B, splash=[(0.1, 1.0)]),
    dict(clip='bigred', dur=B, text=T('CLIMB THE RED CLAY')),
    dict(clip='shortcut', dur=B, text=T('HOLD YOUR LINE')),
    # part 2
    dict(clip='concrete', dur=B, text=T('DOWN THE CONCRETE')),
    dict(clip='sideling', dur=B),
    dict(clip='lockers', dur=B / 2, text=T('TEN'), tin=0.05, tout=B / 2),
    dict(clip='hilux', dur=B / 2, text=T('CLASSIC'), tin=0.05, tout=B / 2),
    dict(clip='perentie', dur=B / 2, text=T('4WDs'), tin=0.05, tout=B / 2),
    dict(clip='washout', dur=B / 2),
    # breakdown: getting bogged
    dict(clip='bog', **{'from': 0.8}, dur=1.5 * B, text=T('GET BOGGED'), tin=1.4, eng=1.3),
    dict(clip='bogrear', **{'from': 1.5}, dur=B, eng=1.3),
    # full send
    dict(clip='send4', dur=B, text=T('OR SEND IT'), tin=0.1),
    dict(clip='send1', **{'from': 1.8}, dur=B, splash=[(0.9, 1.0)]),
    dict(clip='send4', **{'from': 1.0}, dur=B / 2),
    dict(clip='shortcut', **{'from': 0.4}, dur=B / 2),
    dict(clip='send5', dur=B / 2),
    dict(clip='send3', dur=B / 2),
    # night
    dict(clip='dusk', dur=B, text=T('BEAT THE DARK'), tin=0.3),
    dict(clip='nightrig', dur=B),
    dict(clip='nightcab', **{'from': 0.8}, dur=B, text=T('OR DRIVE INTO THE NIGHT'), tin=0.3),
    dict(clip='nightcab2', **{'from': 0.4}, dur=B, gamma=1.3),
    # finale
    dict(clip='send1', **{'from': 2.4}, dur=B / 2),
    dict(clip='shortcut', **{'from': 1.2}, dur=B / 2),
    dict(clip='bigred', **{'from': 1.6}, dur=B / 2),
    dict(clip='send4', **{'from': 1.5}, dur=B / 2, fout=0.25),
    dict(card=1, dur=6.0, text=LOGO, tin=0.3, tout=5.8),
]
for it in TL:
    if 'clip' in it:
        it['from'] = max(it.get('from', 0), 1 / FPS)  # frame 0 of every clip is black
        n = len([f for f in os.listdir(f"{CLIPS}/{it['clip']}") if f.endswith('.jpg')])
        if (it['from'] + it['dur']) * FPS > n:
            print(f"warning: {it['clip']} has {n} frames, needs {(it['from'] + it['dur']) * FPS:.0f}; starting earlier")
            it['from'] = max(1 / FPS, n / FPS - it['dur'])
total = build(TL)
acc = 0
for it in TL:
    it['t0'] = acc; acc += it['dur']
idx = lambda clip: next(i for i, it in enumerate(TL) if it.get('clip') == clip)
cues = dict(hit1=TL[1]['t0'], drums=TL[idx('splash2')]['t0'], part2=TL[idx('concrete')]['t0'], brk=TL[idx('bog')]['t0'],
            final=TL[idx('send4')]['t0'], logo=TL[-1]['t0'])
print('total', round(total, 2), cues)
audio(TL, total, cues)
finish(total, 'over-the-cape-trailer.mp4')
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', 'over-the-cape-trailer.mp4', '-vf',
                'fps=4,scale=320:-1,tile=6x6', '-frames:v', '9', 'check_%d.jpg'], check=True)
print('done')
