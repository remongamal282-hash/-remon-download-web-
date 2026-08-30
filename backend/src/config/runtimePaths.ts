import fs from 'node:fs';
import path from 'node:path';

export interface RuntimePathOptions {
  envPath?: string;
  resourcesPath?: string;
  projectRuntimeDirectory: string;
  fileName: string;
  pathFallback: string;
  exists?: (filePath: string) => boolean;
}

export function resolveRuntimePath(options: RuntimePathOptions): string {
  const exists = options.exists || fs.existsSync;
  if (options.envPath) return options.envPath;
  const candidates = [
    options.resourcesPath && path.join(options.resourcesPath, 'runtime', options.fileName),
    path.join(options.projectRuntimeDirectory, options.fileName),
  ].filter((candidate): candidate is string => Boolean(candidate));
  return candidates.find(exists) || options.pathFallback;
}