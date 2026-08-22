module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: 'tsconfig.spec.json' }] },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@codelife/contracts$': '<rootDir>/../../packages/contracts/src/index.ts',
    '^@codelife/contracts/(.*)$': '<rootDir>/../../packages/contracts/src/$1.ts',
    '^\\./common\\.js$': '<rootDir>/../../packages/contracts/src/common.ts',
    '^\\./learning\\.js$': '<rootDir>/../../packages/contracts/src/learning.ts'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/main.ts',
    '!src/**/*.module.ts',
    '!src/**/*.controller.ts',
    '!src/**/*.integration-spec.ts',
    '!src/**/authenticated-request.ts',
    '!src/**/public.decorator.ts',
    '!src/bootstrap/configure-app.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  coverageThreshold: {
    global: { branches: 80, functions: 80, lines: 80, statements: 80 }
  },
  testEnvironment: 'node'
};
