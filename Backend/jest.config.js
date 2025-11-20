module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./tests/setup.js'],
  verbose: true,
  // 📊 ENABLE COVERAGE REPORTING
  collectCoverage: true,
  collectCoverageFrom: [
    "routes/*.js",          // We want to test all routes
    "middleware/*.js",      // We want to test auth middleware
    "utils/*.js",           // We want to test helpers
    "!utils/socket.js"      // Exclude socket (hard to test with Jest)
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "html"]
};