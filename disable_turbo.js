const fs = require("fs");
let cfg = fs.readFileSync("web/next.config.ts","utf8");
cfg = cfg.replace("turbopack: { root: __dirname, },", "");
fs.writeFileSync("web/next.config.ts", cfg);
console.log("disabled turbopack");
