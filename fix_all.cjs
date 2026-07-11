const fs = require('fs');
const path = require('path');

function fix(dir) {
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      fix(p);
    } else if (p.endsWith('.js')) {
      let c = fs.readFileSync(p, 'utf8');
      c = c.replace(/\\`/g, '`').replace(/\\\$/g, '$');
      fs.writeFileSync(p, c);
      console.log('Fixed', p);
    }
  });
}
fix('src');
