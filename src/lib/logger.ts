type Level = 'debug' | 'info' | 'warn' | 'error';

const LEVELS: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const threshold = LEVELS[(process.env.LOG_LEVEL as Level) ?? 'info'] ?? LEVELS.info;

function write(level: Level, message: string, meta: Record<string, unknown> = {}): void {
  if (LEVELS[level] < threshold) return;
  const line = JSON.stringify({ level, time: new Date().toISOString(), message, ...meta });
  (level === 'error' ? process.stderr : process.stdout).write(line + '\n');
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => write('debug', message, meta),
  info: (message: string, meta?: Record<string, unknown>) => write('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => write('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => write('error', message, meta),
};
