import { spawn, ChildProcess } from 'node:child_process';
import { config } from '../config';

export interface ProcessHandle { process: ChildProcess; promise: Promise<void>; }

export function runYtDlp(args: string[], onProgress: (line: string) => void): ProcessHandle {
  const child = spawn(config.ytDlpPath, args, { shell: false, windowsHide: true });
  const promise = new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => { child.kill('SIGTERM'); reject(new Error('DOWNLOAD_TIMEOUT')); }, config.downloadTimeoutMs);
    child.stdout?.on('data', (chunk: Buffer) => chunk.toString().split(/\r?\n/).filter(Boolean).forEach(onProgress));
    child.stderr?.on('data', () => undefined);
    child.once('error', (error: NodeJS.ErrnoException) => { clearTimeout(timer); reject(new Error(error.code === 'ENOENT' ? 'YTDLP_UNAVAILABLE' : 'DOWNLOAD_FAILED')); });
    child.once('close', (code) => { clearTimeout(timer); if (code === 0) resolve(); else reject(new Error('DOWNLOAD_FAILED')); });
  });
  return { process: child, promise };
}