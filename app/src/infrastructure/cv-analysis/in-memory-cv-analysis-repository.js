import { CvAnalysisRepository } from '../../domain/cv-analysis/cv-analysis-repository';

export class InMemoryCvAnalysisRepository extends CvAnalysisRepository {
  constructor(analyze) {
    super();

    if (typeof analyze !== 'function') {
      throw new TypeError('An analyzer function is required');
    }

    this.analyzer = analyze;
  }

  async analyze(request) {
    return this.analyzer(request);
  }
}
