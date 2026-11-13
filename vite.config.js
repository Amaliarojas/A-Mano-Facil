
import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  base: "/A-Mano-Facil/",

  build: {
    rollupOptions: {
      input: {
        tienda: resolve(process.cwd(), "index.html"),
        admin: resolve(process.cwd(), "admin.html"),
      },
    },
  },
});
