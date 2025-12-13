const fs = require("fs");
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
