const fs = require('fs');
const path = 'web/app/shop/page.tsx';
let code = fs.readFileSync(path, 'utf8');
code = code.replace(
  "            )}      {(modalOpen || modalClosing) && selectedProduct && (",
  "            )}\n          </div>\n        </div>\n      )}\n\n      {(modalOpen || modalClosing) && selectedProduct && ("
);
fs.writeFileSync(path, code);
console.log('fixed missing cart wrapper closings');
