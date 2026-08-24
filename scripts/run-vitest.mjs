import path from 'node:path';
import { startVitest } from 'vitest/node';

const filters = process.argv.slice(2);
const instance = await startVitest(
  'test',
  filters,
  { run: true, config: false },
  { resolve: { alias: { '@': path.resolve(process.cwd(), 'src') } } },
);

if (!instance) process.exitCode = 1;
