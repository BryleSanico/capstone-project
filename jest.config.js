module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Automatically clear mock calls and instances before every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',

  // An array of glob patterns indicating a set of files for which coverage
  // information should be collected.
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/types/**/*.{ts,tsx}', // Don't test type definitions
    '!src/navigation/**/*.{ts,tsx}', // Navigation is better for E2E tests
    '!src/App.tsx', // Entry point
    '!src/index.js', // Entry point
  ],

    // A map from regular expressions to paths to transformers.
  // This ensures .ts and .tsx files are processed by babel-jest.
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  // The test environment that will be used for testing
  testEnvironment: 'node',
  // An array of regexp pattern strings that are matched against all source file paths,
  // matched files will skip transformation
  // This is critical for RN. We must NOT ignore react-native or other monorepo packages.
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?@?react-native|@react-native-community|@react-navigation|@notifee|react-native-vector-icons|nativewind|react-native-reanimated|react-native-haptic-feedback|react-native-image-picker|react-native-permissions|react-native-quick-base64|react-native-url-polyfill|@supabase/supabase-js|react-native-gesture-handler|react-native-linear-gradient|react-native-paper|react-native-qrcode-svg|react-native-screens|react-native-svg|zustand)',
  ],

  // A map from regular expressions to module names or to arrays of module names
  // that allow to stub out resources with a single module.
  moduleNameMapper: {
    // Handle TypeScript path alias
    '^@/(.*)$': '<rootDir>/$1',

  },

  // An array of file extensions your modules use.
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};

