/**
 * Draws the picture at a lower resolution while the graphics chip can't keep up, and puts it
 * back once it can (a phone under the Bloomfield forest). It only steps down when the frames
 * are slow and the game's own code is not what takes the time, since a smaller picture
 * doesn't help a busy processor.
 */
export class RenderScale {
  scale = 1;
  private frameMs = 1000 / 60;
  private slowFor = 0;
  private fastFor = 0;
  /** No step back up until this many seconds after a step down. */
  private hold = 0;

  constructor(
    private readonly min: number,
    private readonly step = 0.1,
  ) {}

  /** Call once a frame. Returns true when the scale changed. */
  update(frameDt: number, cpuMs: number): boolean {
    if (frameDt <= 0) return false;
    this.frameMs += (frameDt * 1000 - this.frameMs) * 0.1;
    this.hold = Math.max(0, this.hold - frameDt);
    // Under about 36 frames a second with the code taking under 60% of the frame.
    const slow = this.frameMs > 28 && cpuMs < this.frameMs * 0.6;
    const fast = this.frameMs < 19;
    this.slowFor = slow ? this.slowFor + frameDt : 0;
    this.fastFor = fast ? this.fastFor + frameDt : 0;
    if (this.slowFor > 1 && this.scale > this.min) {
      this.scale = Math.max(this.min, this.scale - this.step);
      this.slowFor = 0;
      this.hold = 10;
      return true;
    }
    if (this.fastFor > 4 && this.hold === 0 && this.scale < 1) {
      this.scale = Math.min(1, this.scale + this.step);
      this.fastFor = 0;
      return true;
    }
    return false;
  }
}
