// Renders the PNG app icons from public/icons/icon.svg with the preinstalled Chromium.
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");
(async () => {
  const svg = fs.readFileSync(path.join(__dirname, "../public/icons/icon.svg"), "utf8");
  const b = await chromium.launch(); const p = await b.newPage();
  const shot = async (size, file, pad, bg) => {
    await p.setViewportSize({ width: size, height: size });
    await p.setContent(`<html><body style="margin:0;background:${bg || "transparent"}"><div style="width:${size}px;height:${size}px;display:grid;place-items:center">${svg.replace("<svg ", `<svg width="${size - pad * 2}" height="${size - pad * 2}" `)}</div></body></html>`);
    await p.screenshot({ path: path.join(__dirname, "../public/icons/" + file), omitBackground: !bg });
  };
  await shot(192, "icon-192.png", 0);
  await shot(512, "icon-512.png", 0);
  await shot(512, "icon-maskable-512.png", 72, "#2B55F0");
  await shot(180, "apple-touch-icon.png", 0, "#2B55F0");
  await b.close();
})();
