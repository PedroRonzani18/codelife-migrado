module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: 'tsconfig.json' }] },
  moduleNameMapper: { '^@codelife/contracts$': '<rootDir>/../../packages/contracts/src/index.ts' },
  collectCoverageFrom: ['src/**/*.ts'],
  testEnvironment: 'node'
};
