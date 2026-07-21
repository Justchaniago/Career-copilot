import { afterEach, describe, expect, it, jest } from '@jest/globals';

import { logger } from './logger';

describe('logger', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([
    ['info', logger.info],
    ['warn', logger.warn],
    ['error', logger.error],
  ])('writes a structured %s entry', (level, log) => {
    const consoleSpy = jest
      .spyOn(console, level)
      .mockImplementation(() => undefined);

    log('baseline ready', { component: 'workspace' });

    expect(consoleSpy).toHaveBeenCalledTimes(1);

    const entry = JSON.parse(consoleSpy.mock.calls[0][0]);

    expect(entry).toEqual({
      timestamp: expect.any(String),
      level,
      message: 'baseline ready',
      context: { component: 'workspace' },
    });
    expect(Number.isNaN(Date.parse(entry.timestamp))).toBe(false);
  });

  it('uses an empty context when none is provided', () => {
    const consoleSpy = jest
      .spyOn(console, 'info')
      .mockImplementation(() => undefined);

    logger.info('without context');

    expect(JSON.parse(consoleSpy.mock.calls[0][0]).context).toEqual({});
  });
});
