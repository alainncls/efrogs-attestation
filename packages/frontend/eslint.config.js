import { defineConfig } from 'eslint/config';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { baseConfig, prettier } from '../../eslint.config.js';

export default defineConfig(
  baseConfig,
  {
    ignores: ['public', 'playwright-report', 'test-results'],
  },
  {
    languageOptions: {
      parserOptions: { tsconfigRootDir: import.meta.dirname },
    },
  },
  {
    files: ['src/**/*.{ts,tsx}', 'e2e/modal-harness.tsx'],
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['*.config.{ts,js}', 'e2e/**/*.spec.ts'],
    languageOptions: { globals: globals.node },
  },
  prettier,
);
