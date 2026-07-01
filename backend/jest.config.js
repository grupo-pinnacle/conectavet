/** @type {import('ts-jest').JestConfigWithTsJest} */
const sharedConfig = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'clover'],
  coveragePathIgnorePatterns: ['/node_modules/', '/__tests__/', '/dist/'],
  coverageThreshold: {
    global: {
      branches: 45,
      functions: 65,
      lines: 72,
      statements: 72,
    },
  },
  testTimeout: 30000,
  moduleDirectories: ['node_modules', '<rootDir>/../node_modules'],
  setupFiles: ['<rootDir>/src/__tests__/setup-env.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};

module.exports = {
  projects: [
    {
      ...sharedConfig,
      displayName: 'unit',
      testMatch: ['**/__tests__/(utils|cache).test.ts'],
      globalSetup: undefined,
      globalTeardown: undefined,
    },
    {
      ...sharedConfig,
      displayName: 'integration',
      testMatch: ['**/__tests__/!(utils|cache).test.ts'],
      globalSetup: '<rootDir>/jest-global-setup.js',
      globalTeardown: '<rootDir>/jest-global-teardown.js',
    },
  ],
};
