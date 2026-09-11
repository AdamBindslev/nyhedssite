// Lokal dev server til at teste dashboard og /api/news uden Vercel CLI
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import newsHandler from './api/news.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  let pathname = parsedUrl.pathname;

  // Håndter Vercel API routes
  if (pathname === '/api/news' || pathname === '/api/news.js') {
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (data) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
      return res;
    };
    return newsHandler(req, res);
  }

  // Statiske filer fra public/
  if (pathname === '/') pathname = '/index.html';
  let filePath = path.join(__dirname, 'public', pathname);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, pathname);
  }
  const ext = path.extname(filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Ikke fundet');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('500 Serverfejl');
      }
      return;
    }
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`✨ Celestial Dashboard kører lokalt på: http://localhost:${PORT}`);
});
