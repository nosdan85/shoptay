const fs = require('fs');

function patchFile(file, kind) {
  let code = fs.readFileSync(file,'utf8');
  code = code.replace(/const body = method === "POST" \? await request\.json\(\) : undefined;\s*/g, '');
  if (kind === 'POST') {
    if (!code.includes('const body = await request.json()')) {
      code = code.replace('try {\n', 'try {\n    const body = await request.json();\n');
    }
  } else {
    // GET: ensure we don't add body
    code = code.replace(/\.\.\.\(body \? \{ body: JSON\.stringify\(body\) \} : \{\}\),\s*/g, '');
  }

  // In POST route keep body spread
  if (kind === 'POST') {
    if (!code.includes('...(body ? { body: JSON.stringify(body) } : {})')) {
      code = code.replace(/headers:\s*\{([\s\S]*?)\},\s*\);/m, (m) => m); // no-op
      // naive: if spread removed earlier somehow, re-add before closing fetch options
      code = code.replace(/\}\s*\);\s*\n\s*\n\s*const data/m, '      ...(body ? { body: JSON.stringify(body) } : {}),\n    });\n\n    const data');
    }
  }

  fs.writeFileSync(file, code);
  console.log('patched', file);
}

patchFile('web/app/api/shop/fingerprint/route.ts', 'POST');
patchFile('web/app/api/shop/my-referral-code/route.ts', 'GET');
patchFile('web/app/api/shop/my-coupons/route.ts', 'GET');
