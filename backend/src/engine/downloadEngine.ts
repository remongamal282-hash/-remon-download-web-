import { mkdir, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config';
import { runYtDlp, ProcessHandle } from './ytDlpExecutor';
import { DownloadRecord } from '../types/download';

export interface DownloadEngineHooks { progress: (progress: number) => Promise<void>; state: (state: DownloadRecord['status']) => Promise<void>; }
export interface DownloadEngineResult { filePath: string; fileSize: number; }

export class DownloadEngine {
  private readonly active = new Map<string, ProcessHandle>();

  async start(record: DownloadRecord, hooks: DownloadEngineHooks): Promise<DownloadEngineResult> {
    await mkdir(config.downloadDirectory, { recursive: true });
    const safeName = record.id;
    const output = path.join(config.downloadDirectory, `${safeName}.%(ext)s`);
    const args = ['--newline', '--continue', '--restrict-filenames', '-f', record.format || 'bestvideo+bestaudio/best', '--merge-output-format', 'mp4', '-o', output, record.url];
    await hooks.state('analyzing');
    const handle = runYtDlp(args, (line) => {
      const match = line.match(/(\d+(?:\.\d+)?)%/); if (match) void hooks.progress(Math.min(100, Number(match[1])));
    });
    this.active.set(record.id, handle);
    try {
      await hooks.state('downloading');
      await handle.promise;
      const files = await readdir(config.downloadDirectory);
      const finalPath = files
        .filter((file) => file.startsWith(`${safeName}.`) && !file.endsWith('.part') && !file.endsWith('.ytdl'))
        .map((file) => path.join(config.downloadDirectory, file))[0];
      if (!finalPath) throw new Error('DOWNLOAD_OUTPUT_MISSING');
      const fileStats = await stat(finalPath);
      await hooks.progress(100);
      await hooks.state('completed');
      return { filePath: finalPath, fileSize: fileStats.size };
    }
    finally { this.active.delete(record.id); }
  }

  pause(id: string): void { this.active.get(id)?.process.kill('SIGSTOP'); }
  resume(id: string): void { this.active.get(id)?.process.kill('SIGCONT'); }
  stop(id: string): void { this.active.get(id)?.process.kill('SIGTERM'); }
  cancel(id: string): void { this.stop(id); }

  async cleanup(id: string): Promise<void> {
    await rm(path.join(config.downloadDirectory, `${id}.part`), { force: true });
    // Also clean up .ytdl metadata files
    await rm(path.join(config.downloadDirectory, `${id}.ytdl`), { force: true });
  }

  // Startup cleanup: scan for orphan .part files from crashed/terminated downloads
  async cleanupOrphanFiles(): Promise<void> {
    try {
      await mkdir(config.downloadDirectory, { recursive: true });
      const files = await readdir(config.downloadDirectory);
      const orphanParts = files.filter(f => f.endsWith('.part') || f.endsWith('.ytdl'));

      for (const file of orphanParts) {
        try {
          await rm(path.join(config.downloadDirectory, file), { force: true });
        } catch (error) {
          // Ignore individual file cleanup errors, log but continue
          console.warn(`Could not clean up orphan file ${file}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      if (orphanParts.length > 0) {
        console.log(`Cleaned up ${orphanParts.length} orphan temporary files on startup`);
      }
    } catch (error) {
      console.warn(`Error during orphan file cleanup: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}