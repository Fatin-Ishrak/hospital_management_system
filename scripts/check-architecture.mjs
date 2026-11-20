// Checks the architecture rules and looks for secrets before every build.
//  1. A module may import only itself and src/core.   (no module imports another module)
//  2. src/core may not import src/modules or src/app. (no circular dependencies on modules)
//  3. No import cycles anywhere in src.
//  4. Every module has an index.jsx with the required fields.
//  5. No secret keys in the source code, and .env.local is ignored by Git.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, walk, toPosix, color } from './lib/project.mjs';

const srcFiles = walk().filter((f) => f.startsWith('src/') && /\.(jsx?|mjs)$/.test(f));
const set = new Set(srcFiles);
const errors = [];

const areaOf = (f) => {
  if (f.startsWith('src/core/')) return 'core';
  if (f.startsWith('src/app/')) return 'app';
  const m = f.match(/^src\/modules\/([^/]+)\//);
  return m ? `module:${m[1]}` : 'other';
};
function resolve(from, spec) {
  let base;
  if (spec.startsWith('@/')) base = 'src/' + spec.slice(2);
  else if (spec.startsWith('.')) base = toPosix(path.normalize(path.join(path.dirname(from), spec)));
  else return null; // npm package
  for (const c of [base, base + '.js', base + '.jsx', base + '/index.js', base + '/index.jsx']) if (set.has(c)) return c;
  errors.push(`UNRESOLVED IMPORT in ${from}: '${spec}'`);
  return null;
}

const graph = new Map();
for (const f of srcFiles) {
  // ignore comments so that example code inside comments is not mistaken for an import
  const code = fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const deps = [];
  for (const m of code.matchAll(/(?:from\s+|import\s*\(\s*)['"]([^'"]+)['"]/g)) {
    const target = resolve(f, m[1]);
    if (target) deps.push(target);
  }
  graph.set(f, deps);
  const a = areaOf(f);
  for (const t of deps) {
    const b = areaOf(t);
    if (a === 'core' && (b === 'app' || b.startsWith('module:'))) errors.push(`RULE 2: core file ${f} imports ${t}`);
    if (a.startsWith('module:') && b.startsWith('module:') && a !== b) errors.push(`RULE 1: ${f} imports another module (${t})`);
    if (a.startsWith('module:') && b === 'app') errors.push(`RULE 1: ${f} imports the app shell (${t})`);
  }
}

// cycle detection
const state = new Map();
function dfs(n, stack) {
  state.set(n, 1);
  for (const d of graph.get(n) || []) {
    if (state.get(d) === 1) errors.push(`RULE 3: import cycle ${[...stack.slice(stack.indexOf(d)), n, d].join(' -> ')}`);
    else if (!state.has(d)) dfs(d, [...stack, n]);
  }
  state.set(n, 2);
}
for (const f of srcFiles) if (!state.has(f)) dfs(f, []);

// module descriptors
for (const f of srcFiles.filter((x) => /^src\/modules\/[^/]+\/index\.jsx$/.test(x))) {
  const id = f.split('/')[2];
  const code = fs.readFileSync(path.join(ROOT, f), 'utf8');
  for (const key of ['id', 'role', 'home', 'nav', 'routes']) {
    if (!new RegExp(`\\b${key}\\s*:`).test(code)) errors.push(`RULE 4: ${f} is missing the field "${key}"`);
  }
  if (!new RegExp(`id:\\s*'${id}'`).test(code)) errors.push(`RULE 4: ${f} must have id: '${id}' (same as its folder name)`);
}

// secrets
const secretPatterns = [/service_role/i, /sb_secret_/i, /SERVICE_ROLE/, /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\./];
for (const f of walk().filter((x) => /^(src\/|index\.html$|vite\.config\.js$|\.env\.(example|admin|doctor|patient)$)/.test(x))) {
  const code = fs.readFileSync(path.join(ROOT, f), 'utf8');
  for (const p of secretPatterns) if (p.test(code)) errors.push(`RULE 5: possible secret in ${f} (pattern ${p})`);
}
const gi = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8');
if (!/^\.env\.local$/m.test(gi) || !/^\.env$/m.test(gi)) errors.push('RULE 5: .gitignore must list .env and .env.local');
const ex = fs.readFileSync(path.join(ROOT, '.env.example'), 'utf8');
if (!/YOUR-PROJECT-REF/.test(ex)) errors.push('RULE 5: .env.example must contain placeholders only');

if (errors.length) {
  console.error(color.red(color.bold(`\nArchitecture check FAILED (${errors.length}):\n`)));
  console.error(errors.map((e) => '  - ' + e).join('\n') + '\n');
  process.exit(1);
}
console.log(color.green(`Architecture check passed: ${srcFiles.length} source files, no cross-module imports, no cycles, no secrets.`));
