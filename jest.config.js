/** @type {import('jest').Config} */
const config = {
    rootDir: 'Portfolio.Web/UI/ts',
    collectCoverage: true,
    collectCoverageFrom: [
        '**/*.{js,jsx}',
        '!**/node_modules/**'
    ],
    coverageReporters: [
        "lcov"
    ],
    reporters: [
        'summary'
    ],
  };
  
  module.exports = config;