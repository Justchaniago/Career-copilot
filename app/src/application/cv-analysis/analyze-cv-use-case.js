import { createCvText } from '../../domain/cv-analysis/cv-text';

export class InvalidCvAnalysisRepositoryError extends Error {
  constructor() {
    super('A CV analysis repository with an analyze method is required');
    this.name = 'InvalidCvAnalysisRepositoryError';
  }
}

export class AnalyzeCvUseCase {
  constructor(cvAnalysisRepository) {
    if (typeof cvAnalysisRepository?.analyze !== 'function') {
      throw new InvalidCvAnalysisRepositoryError();
    }

    this.cvAnalysisRepository = cvAnalysisRepository;
  }

  async execute({ cvText } = {}) {
    const normalizedCvText = createCvText(cvText);

    return this.cvAnalysisRepository.analyze({ cvText: normalizedCvText });
  }
}
