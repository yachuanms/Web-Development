const fs = require("fs");
const path = require("path");

function ensure200Html() {
  const distDir = path.resolve(__dirname, "../dist");
  const indexPath = path.join(distDir, "index.html");
  const fallbackPath = path.join(distDir, "200.html");

  if (!fs.existsSync(indexPath)) {
    console.error("postbuild: dist/index.html not found. Did the build succeed?");
    process.exit(1);
  }

  fs.copyFileSync(indexPath, fallbackPath);
  console.log("postbuild: created dist/200.html for Surge fallback routing.");
}

ensure200Html();
