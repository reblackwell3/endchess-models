// jest.config.cjs
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  testMatch: ['**/tests/**/*.test.ts', '**/tests/**/*.test.js'],
  moduleNameMapper: {
    '^(src/.+).js$': '<rootDir>/$1.ts',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
      },
    ],
  },
  coverageDirectory: './coverage',
  collectCoverageFrom: ['src/**/*.ts'],
};
