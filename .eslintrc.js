module.exports = {
  extends: 'expo',
  overrides: [
    {
      files: ['metro.config.js'],
      env: {
        node: true,
      },
    },
  ],
  settings: {
    'import/resolver': {
      typescript: {},
    },
  },
};
