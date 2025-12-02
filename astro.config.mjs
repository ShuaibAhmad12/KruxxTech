import { defineConfig } from "astro/config";
import sanity from "@sanity/astro";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";

// [https://astro.build/config](https://astro.build/config)
export default defineConfig({
  integrations: [
    react(),
    sanity({
      projectId: "gra6ykxj", // Paste your real ID here
      dataset: "production",
      useCdn: true,
    }),
    tailwind(),
  ],
  site: "https://kruxxtech.com",
});
