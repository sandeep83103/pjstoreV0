const fs = require('fs');
const path = require('path');

const html = fs.readFileSync('parnika-jewellers-store.html', 'utf-8');

// 1. Extract texture
const texMatch = html.match(/--tex:url\("data:image\/jpeg;base64,([^"]+)"\)/);
if (texMatch) {
  const buf = Buffer.from(texMatch[1], 'base64');
  fs.writeFileSync('public/brand/texture.jpg', buf);
  console.log('Saved public/brand/texture.jpg:', buf.length, 'bytes');
}

// 2. Extract images from window.__IMGS
const m = html.match(/window\.__IMGS\s*=\s*(\{.*?\});/s);
if (m) {
  const imgs = JSON.parse(m[1]);
  fs.mkdirSync('public/brand', { recursive: true });
  fs.mkdirSync('public/images/products', { recursive: true });

  for (const [k, v] of Object.entries(imgs)) {
    const match = v.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
    if (match) {
      const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
      const buf = Buffer.from(match[2], 'base64');
      const outPath = (k === 'emblem' || k === 'crest')
        ? path.join('public', 'brand', `${k}.${ext}`)
        : path.join('public', 'images', 'products', `${k}.${ext}`);
      fs.writeFileSync(outPath, buf);
      console.log('Saved:', outPath, buf.length, 'bytes');
    }
  }
}
