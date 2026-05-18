const moduleFileExtensions = ['js', 'json', 'ts'];
const rootDir = '.';
const testMatch = ['**/*.e2e-spec.ts'];
const transform = {
  '^.+\\.(t|j)s$': 'ts-jest',
};
const moduleNameMapper = {
  '^@/(.*)$': '<rootDir>/src/$1',
  '^@shared/(.*)$': '<rootDir>/../../packages/shared/src/$1',
};
const testEnvironment = 'node';

module.exports = {
  moduleFileExtensions,
  rootDir,
  testMatch,
  transform,
  moduleNameMapper,
  testEnvironment,
};
