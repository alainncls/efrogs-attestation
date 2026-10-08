import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    env: {
      VITE_WALLETCONNECT_PROJECT_ID: 'placeholder',
      VITE_INFURA_API_KEY: 'placeholder',
    },
  },
});
