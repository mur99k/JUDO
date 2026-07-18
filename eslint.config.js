module.exports = [
  {
    ignores: ['node_modules/**', 'client/**', 'scripts/**', 'data/**', 'backups/**', 'deploy/**', 'logo/**', 'uploads/**'],
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'script',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        __dirname: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'no-console': 'off',
      semi: ['warn', 'always'],
      quotes: ['warn', 'single', { avoidEscape: true }],
    },
  },
];
