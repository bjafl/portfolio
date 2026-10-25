import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  use: { baseURL: 'http://localhost:4321' },
  webServer: {
    command: 'pnpm build && pnpm preview --port 4321',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Astro 7 daemonizes `preview` when it detects an AI agent environment; Playwright needs it in the foreground.
    env: { AI_AGENT: '', CLAUDECODE: '' },
  },
});
