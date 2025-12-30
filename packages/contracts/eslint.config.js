import globals from 'globals';
import tseslint from 'typescript-eslint';
import { baseConfig } from '../../eslint.config.js';

export default tseslint.config(...baseConfig, {
  files: ['**/*.ts'],
  languageOptions: {
    globals: {
      ...globals.node,
    },
  },
  rules: {
    // Allow console.log in deployment scripts
    'no-console': 'off',
  },
});
