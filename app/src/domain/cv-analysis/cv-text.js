export class InvalidCvTextError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidCvTextError';
  }
}

export const createCvText = (value) => {
  if (typeof value !== 'string') {
    throw new InvalidCvTextError('CV text must be a string');
  }

  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    throw new InvalidCvTextError('CV text must not be empty');
  }

  return normalizedValue;
};
