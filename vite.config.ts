import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const isUat = mode === 'uat';
  return {
    plugins: [react(), tsconfigPaths()],
    base: isUat ? '/amosave/' : '/',
    server: {
      port: 3000,
    },
  };
});
