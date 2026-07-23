import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        setup: "index.html",
        game: "baloons.html",
      },
    },
  },
});
