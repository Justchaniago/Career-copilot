import { describe, expect, it, jest } from '@jest/globals';

import { InvalidCvTextError } from '../../domain/cv-analysis/cv-text';

import {
  AnalyzeCvUseCase,
  InvalidCvAnalysisRepositoryError,
} from './analyze-cv-use-case';

describe('AnalyzeCvUseCase', () => {
  it('requires a repository implementation', () => {
    expect(() => new AnalyzeCvUseCase()).toThrow(
      InvalidCvAnalysisRepositoryError,
    );
  });

  it.each([undefined, null, 123, '', '   '])(
    'rejects invalid CV text: %p',
    async (cvText) => {
      const repository = { analyze: jest.fn() };
      const useCase = new AnalyzeCvUseCase(repository);

      await expect(useCase.execute({ cvText })).rejects.toThrow(
        InvalidCvTextError,
      );
      expect(repository.analyze).not.toHaveBeenCalled();
    },
  );

  it('normalizes input and delegates analysis to the repository', async () => {
    const result = { status: 'accepted', requestId: 'request-1' };
    const repository = {
      analyze: jest.fn().mockResolvedValue(result),
    };
    const useCase = new AnalyzeCvUseCase(repository);

    await expect(
      useCase.execute({ cvText: '  Pengalaman sebagai kasir  ' }),
    ).resolves.toBe(result);
    expect(repository.analyze).toHaveBeenCalledWith({
      cvText: 'Pengalaman sebagai kasir',
    });
  });
});
