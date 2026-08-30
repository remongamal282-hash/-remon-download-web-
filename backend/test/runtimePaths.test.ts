import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import { resolveRuntimePath } from '../src/config/runtimePaths';

test('runtime resolver prioritizes explicit environment paths', () => {
  assert.equal(resolveRuntimePath({ envPath: 'custom.exe', resourcesPath: 'resources', projectRuntimeDirectory: 'runtime', fileName: 'tool.exe', pathFallback: 'tool' }), 'custom.exe');
});

test('runtime resolver uses resourcesPath, project runtime, then PATH fallback', () => {
  const existing = new Set<string>();
  const options = { resourcesPath: 'resources', projectRuntimeDirectory: 'project-runtime', fileName: 'tool.exe', pathFallback: 'tool', exists: (filePath: string) => existing.has(filePath) };
  existing.add(path.join('resources', 'runtime', 'tool.exe')); assert.equal(resolveRuntimePath(options), path.join('resources', 'runtime', 'tool.exe'));
  existing.clear(); existing.add(path.join('project-runtime', 'tool.exe')); assert.equal(resolveRuntimePath(options), path.join('project-runtime', 'tool.exe'));
  existing.clear(); assert.equal(resolveRuntimePath(options), 'tool');
});