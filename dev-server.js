const fs = require("fs");
const http = require("http");
const path = require("path");

const root = __dirname;
const preferredPorts = [5173, 5174, 5175, 8080, 8081, 3000, 3001];
const clients = new Set();

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
};

function sendReload() {
  for (const client of clients) {
    client.write("event: reload\ndata: reload\n\n");
  }
}

function safePath(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0]);
  const target = clean === "/" ? "index.html" : clean.slice(1);
  const full = path.resolve(root, target);
  return full.startsWith(root) ? full : null;
}

const server = http.createServer((req, res) => {
  if (req.url === "/__live-reload") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    res.write("\n");
    clients.add(res);
    req.on("close", () => clients.delete(res));
    return;
  }

  const file = safePath(req.url || "/");
  if (!file || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  const ext = path.extname(file).toLowerCase();
  res.writeHead(200, {
    "Content-Type": types[ext] || "application/octet-stream",
    "Cache-Control": "no-store",
  });
  fs.createReadStream(file).pipe(res);
});

function watchDir(dir) {
  fs.watch(dir, { recursive: true }, (_event, filename) => {
    if (!filename || filename.includes("dev-server.js")) return;
    sendReload();
  });
}

function listenOn(index = 0) {
  const port = preferredPorts[index];
  server.once("error", () => listenOn(index + 1));
  server.listen(port, () => {
    watchDir(root);
    console.log(`pokecare live: http://localhost:${port}`);
  });
}

listenOn();
