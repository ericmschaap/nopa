// Minimal lint until ESLint is set up (see the chore issue): every plain JS file must parse,
// and product-facing copy must not use the old name "corner".
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const roots = ['supporter', 'e2e', 'scripts'];
const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (name === 'node_modules') continue;
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(m?js)$/.test(name)) files.push(p);
  }
};
roots.forEach(walk);

let failed = 0;
for (const f of files) {
  try {
    execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' });
  } catch (e) {
    failed++;
    console.error(`${f}: does not parse\n${e.stderr}`);
  }
}

// User-visible copy lives in supporter/index.html; specs/product.md sets the words.
const copy = readFileSync('supporter/index.html', 'utf8').replace(/<script[\s\S]*?<\/script>/g, '');
if (/\bcorners?\b/i.test(copy.replace(/<[^>]+>/g, ' '))) {
  failed++;
  console.error('supporter/index.html: visible copy says "corner"; say "circle" or "goal".');
}

console.log(`lint: ${files.length} files checked, ${failed} problem(s)`);
process.exit(failed ? 1 : 0);
