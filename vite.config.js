import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      input: {
        setup: "index.html",
        game: "baloons.html",
      },
    },
  },
});
