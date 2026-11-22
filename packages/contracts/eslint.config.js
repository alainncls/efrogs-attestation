import { defineConfig } from 'eslint/config';
import globals from 'globals';
import { baseConfig, prettier } from '../../eslint.config.js';

export default defineConfig(
  baseConfig,
  {
    languageOptions: {
      globals: globals.node,
      parserOptions: { tsconfigRootDir: import.meta.dirname },
    },
  },
  prettier,
);
