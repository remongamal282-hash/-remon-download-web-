export interface QueueTask { id: string; run: () => Promise<void>; }

export class DownloadQueue {
  private readonly pending: QueueTask[] = [];
  private active = 0;
  constructor(private readonly concurrency = 3) { }
  add(task: QueueTask): void { this.pending.push(task); void this.drain(); }
  private async drain(): Promise<void> { while (this.active < this.concurrency && this.pending.length) { const task = this.pending.shift() as QueueTask; this.active += 1; void task.run().catch(() => undefined).finally(() => { this.active -= 1; void this.drain(); }); } }
  get activeCount(): number { return this.active; }
  get pendingCount(): number { return this.pending.length; }
}