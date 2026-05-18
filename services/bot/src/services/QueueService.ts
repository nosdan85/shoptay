import { Logger } from 'pino';

export class QueueService {
  private queue: Array<() => Promise<void>> = [];
  private isProcessing = false;
  private lastRunTime = 0;
  private minGapMs: number;

  constructor(minGapMs: number = 3500) {
    this.minGapMs = minGapMs;
  }

  async enqueue<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (!task) continue;

      // Ensure minimum gap between tasks
      const now = Date.now();
      const timeSinceLastRun = now - this.lastRunTime;
      if (timeSinceLastRun < this.minGapMs) {
        await this.sleep(this.minGapMs - timeSinceLastRun);
      }

      this.lastRunTime = Date.now();
      await task();
    }

    this.isProcessing = false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  setMinGap(ms: number): void {
    this.minGapMs = ms;
  }

  getQueueLength(): number {
    return this.queue.length;
  }
}

// Singleton instance
let ticketQueueInstance: QueueService | null = null;

export function getTicketQueue(minGapMs: number = 3500): QueueService {
  if (!ticketQueueInstance) {
    ticketQueueInstance = new QueueService(minGapMs);
  }
  return ticketQueueInstance;
}

export function resetTicketQueue(): void {
  ticketQueueInstance = null;
}
