import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  // Log available diagnostic keys (no values for safety)
  console.log("VITE_CONFIG: Detected Keys:", Object.keys(process.env).filter(k => k.includes('GEMINI') || k.includes('CLOUDINARY')));
  
  // Prioritize VITE_ prefix from either process.env (Platform Secrets) or .env files
  const apiKey = 
    process.env.VITE_GEMINI_API_KEY || 
    env.VITE_GEMINI_API_KEY || 
    process.env.GEMINI_API_KEY || 
    env.GEMINI_API_KEY || 
    "";

  const cloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME || env.VITE_CLOUDINARY_CLOUD_NAME || "";
  const uploadPreset = process.env.VITE_CLOUDINARY_UPLOAD_PRESET || env.VITE_CLOUDINARY_UPLOAD_PRESET || "";
  
  return {
    base: './',
    plugins: [react(), tailwindcss()],
    build: {
      target: 'es2015',
    },
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(apiKey),
      'process.env.VITE_GEMINI_API_KEY': JSON.stringify(apiKey),
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(apiKey),
      'import.meta.env.GEMINI_API_KEY': JSON.stringify(apiKey),
      'import.meta.env.VITE_CLOUDINARY_CLOUD_NAME': JSON.stringify(cloudName),
      'import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET': JSON.stringify(uploadPreset)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
