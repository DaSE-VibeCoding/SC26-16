import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  use: { baseURL: "http://localhost:3000", channel: "chrome", headless: true },
  webServer: { command: "npm.cmd run dev", url: "http://localhost:3000", reuseExistingServer: true, timeout: 30_000 },
});
