import { spawn } from 'node:child_process';
import { config } from '../config';

export async function runFfmpeg(args: string[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(config.ffmpegPath, args, { shell: false, windowsHide: true });
    child.once('error', () => reject(new Error('FFMPEG_UNAVAILABLE')));
    child.once('close', (code) => code === 0 ? resolve() : reject(new Error('FFMPEG_FAILED')));
  });
}