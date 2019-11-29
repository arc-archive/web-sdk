module.exports = {
  extends: ['@advanced-rest-client/eslint-config', 'eslint-config-prettier'].map(require.resolve),
  overrides: [
    {
      files: ['./server/**/*.js'],
      rules: {
        'no-console': 'off',
        'no-unused-expressions': 'off',
        'class-methods-use-this': 'off',
        'import/no-extraneous-dependencies': 'off'
      }
    }
  ]
};
