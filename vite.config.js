import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({

  plugins: [react()],
  base: "/chatbot",
  css: {
    postcss: true
  }
  
})


// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";
// import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

// export default defineConfig({
//   plugins: [
//     react(),
//     cssInjectedByJsPlugin(), // inject CSS into JS
//   ],
//   define: {
//     "process.env": {}
//   },
//   build: {
//     lib: {
//       entry: "./src/widget-entry.jsx",
//       name: "ChatbotWidget",
//       fileName: "widget",
//       formats: ["iife"],
//     },
//     // force all assets into JS (as base64)
//     assetsInlineLimit: Infinity,
//     rollupOptions: {
//       output: {
//         // prevent extra hashed filenames
//         assetFileNames: "widget.[ext]"
//       }
//     }
//   },
// });
