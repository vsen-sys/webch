const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");

const PORT = process.env.PORT || 8080;
const PUBLIC_DIR = path.join(__dirname, "public");
const DOWNLOADS_DIR = path.join(__dirname, "downloads");

function getLanIps() {
  const ips = [];
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) {
        ips.push({ ip: net.address, iface: name });
      }
    }
  }
  return ips;
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".zip": "application/zip",
  ".rar": "application/x-rar-compressed",
  ".txt": "text/plain; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".cfg": "text/plain; charset=utf-8",
  ".lua": "text/plain; charset=utf-8",
  ".mp4": "video/mp4",
};

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || "application/octet-stream";
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("404 - Arquivo nao encontrado");
      return;
    }
    res.writeHead(200, {
      "Content-Type": type,
      "Cache-Control": "no-store",
    });
    res.end(data);
  });
}

function sanitize(p) {
  const parts = p.split("/").filter(Boolean);
  const clean = parts.join(path.sep);
  return path.normalize(clean);
}

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  const lanternas = getLanIps();
  const primary = lanternas[0] ? lanternas[0].ip : "localhost";

  if (url === "/" || url === "/index.html") {
    fs.readFile(path.join(PUBLIC_DIR, "index.html"), "utf-8", (err, html) => {
      if (err) {
        res.writeHead(500);
        res.end("ERRO: index.html nao encontrado");
        return;
      }
      const injected = html
        .replace(/__IP__/g, primary)
        .replace(/__IP_LIST__/g, JSON.stringify(lanternas).replace(/</g, "\\u003c"));
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(injected);
    });
    return;
  }

  if (url.startsWith("/downloads/")) {
    const rel = sanitize(url.slice("/downloads/".length));
    const target = path.join(DOWNLOADS_DIR, rel);
    if (!target.startsWith(DOWNLOADS_DIR)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
    serveFile(res, target);
    return;
  }

  if (url.startsWith("/api/ip")) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ips: lanternas, primary }));
    return;
  }

  let filePath = path.join(PUBLIC_DIR, sanitize(url));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  fs.stat(filePath, (err, st) => {
    if (!err && st.isDirectory()) filePath = path.join(filePath, "index.html");
    serveFile(res, filePath);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("==================================");
  console.log("  SITE NO AR! Porta: " + PORT);
  console.log("==================================");
  for (const n of getLanIps()) {
    console.log(`  LAN:  http://${n.ip}:${PORT}`);
  }
  console.log(`  LOCAL: http://localhost:${PORT}`);
  console.log("==================================");
});