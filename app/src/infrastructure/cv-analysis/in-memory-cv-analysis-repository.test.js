import { describe, expect, it, jest } from '@jest/globals';

import { InMemoryCvAnalysisRepository } from './in-memory-cv-analysis-repository';

describe('InMemoryCvAnalysisRepository', () => {
  it('requires an analyzer function', () => {
    expect(() => new InMemoryCvAnalysisRepository()).toThrow(TypeError);
  });

  it('delegates requests without adding provider-specific behavior', async () => {
    const request = { cvText: 'Pengalaman sebagai cook helper' };
    const expectedResult = { status: 'accepted' };
    const analyzer = jest.fn().mockResolvedValue(expectedResult);
    const repository = new InMemoryCvAnalysisRepository(analyzer);

    await expect(repository.analyze(request)).resolves.toBe(expectedResult);
    expect(analyzer).toHaveBeenCalledWith(request);
  });
});
