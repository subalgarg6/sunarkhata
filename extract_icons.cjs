const fs = require('fs');
const path = require('path');
function getFiles(dir) {
  let res = [];
  for(const f of fs.readdirSync(dir)){
    const fp = path.join(dir, f);
    if(fs.statSync(fp).isDirectory()) res = res.concat(getFiles(fp));
    else if(fp.endsWith('.js') || fp.endsWith('.html')) res.push(fp);
  }
  return res;
}
const files = getFiles('./src');
files.push('./index.html');
const icons = new Set();
const rx = /<span[^>]*class=["'][^"']*material-symbols-outlined[^"']*["'][^>]*>\s*([\w_]+)\s*<\/span>/g;
for(const file of files) {
  const c = fs.readFileSync(file, 'utf8');
  let m;
  while((m = rx.exec(c)) !== null) {
    icons.add(m[1]);
  }
}
console.log(Array.from(icons).sort().join('\n'));
