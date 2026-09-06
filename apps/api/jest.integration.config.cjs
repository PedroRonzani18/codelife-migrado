module.exports = {
  ...require('./jest.config.cjs'),
  setupFiles: ['<rootDir>/test/setup.integration.cjs'],
  testRegex: '.*\\.integration-spec\\.ts$'
};
