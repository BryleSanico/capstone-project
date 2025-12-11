module.exports = {
  root: true,
  extends: [
    '@react-native',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
  },
  plugins: ['@typescript-eslint', 'react', 'react-native'],
  ignorePatterns: [
    'jest.config.js',
    'jest.setup.js',
    'metro.config.js',
    'babel.config.js',
    '__tests__/',
    'coverage/',
    'android/',
    'ios/',
    'node_modules/',
    '*.config.js',
    '.eslintrc.js',
    'supabase/',
    '__mocks__/',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],

    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',

    // Relaxed: Allow 'any' with warning
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',

    // Relaxed: Warn instead of error for promises
    '@typescript-eslint/no-floating-promises': 'off', // Disabled
    '@typescript-eslint/no-misused-promises': 'off', // Disabled
    '@typescript-eslint/await-thenable': 'warn',
    '@typescript-eslint/no-unnecessary-type-assertion': 'warn',

    '@typescript-eslint/prefer-nullish-coalescing': 'warn',
    '@typescript-eslint/prefer-optional-chain': 'warn',
    '@typescript-eslint/consistent-type-imports': 'off',

    // Relaxed: Turn off unsafe rules for gradual typing
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',

    '@typescript-eslint/require-await': 'warn',
    '@typescript-eslint/prefer-promise-reject-errors': 'off',
    '@typescript-eslint/no-redundant-type-constituents': 'warn',

    // Allow require() for assets (images, fonts, animations)
    '@typescript-eslint/no-require-imports': 'off',
    '@typescript-eslint/no-var-requires': 'off',

    // ---------- REACT ----------
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'warn',
    'react/jsx-uses-react': 'warn',
    'react/jsx-uses-vars': 'error',

    // ---------- REACT HOOKS ----------
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // ---------- REACT NATIVE ----------
    'react-native/no-inline-styles': 'error',
    'react-native/no-unused-styles': 'error',
    'react-native/no-color-literals': 'warn',

    // ---------- GENERAL ----------
    'no-console': ['warn', { allow: ['warn', 'error', 'info', 'debug'] }],
    'no-shadow': 'off',
    '@typescript-eslint/no-shadow': ['error'],
    'no-undef': 'off',
    'prefer-const': 'error',
    'no-var': 'error',
    eqeqeq: 'off',
    curly: ['error', 'multi-line'], 
  },
  settings: {
    react: { version: 'detect' },
  },
};
