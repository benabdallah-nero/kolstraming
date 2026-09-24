import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import app from './api/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Mount Vite or serve static files
async function startServer() {
  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  if (!process.env.VERCEL && !process.env.NOW_REGION) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[DLHD Server] Running on http://localhost:${PORT}`);
    });
  }
}

if (!process.env.VERCEL && !process.env.NOW_REGION) {
  startServer();
}

export default app;
