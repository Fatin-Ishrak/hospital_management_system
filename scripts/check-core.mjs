// Checks that the SHARED CORE (src/core and src/app) is identical for everybody.
// Why: the three members must not change shared files on their own, otherwise their modules
// stop fitting together. If a shared file really has to change, tell the team lead; the lead
// changes it, runs  npm run core:seal  and commits core.manifest.json.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, walk, fingerprint, ownerOf, OWNERS, color } from './lib/project.mjs';

const MANIFEST = path.join(ROOT, 'core.manifest.json');
const inCore = (f) => f.startsWith('src/core/') || f.startsWith('src/app/');
const current = walk().filter(inCore);

if (process.argv.includes('--seal')) {
  const files = Object.fromEntries(current.map((f) => [f, fingerprint(f)]));
  fs.writeFileSync(MANIFEST, JSON.stringify({ coreVersion: 1, files }, null, 2) + '\n');
  console.log(color.green(`Sealed ${current.length} core files into core.manifest.json`));
  process.exit(0);
}

if (!fs.existsSync(MANIFEST)) {
  console.error(color.red('core.manifest.json is missing. Ask the team lead to add it (the starter files contain it).'));
  process.exit(1);
}
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8')).files;
const problems = [];
for (const [file, hash] of Object.entries(manifest)) {
  if (!fs.existsSync(path.join(ROOT, file))) {
    problems.push(`MISSING   ${file}\n          -> belongs to ${OWNERS[ownerOf(file)]}. It has probably not been pushed or pulled yet.`);
  } else if (fingerprint(file) !== hash) {
    problems.push(`CHANGED   ${file}\n          -> shared core files must not be edited (owner: ${OWNERS[ownerOf(file)]}). Undo your change or ask the team lead.`);
  }
}
for (const file of current) {
  if (!(file in manifest)) problems.push(`NEW FILE  ${file}\n          -> new files in src/core or src/app are not allowed. Put module code in src/modules/<your module>/.`);
}
if (problems.length) {
  console.error(color.red(color.bold(`\nCore check FAILED (${problems.length} problem${problems.length > 1 ? 's' : ''}):\n`)));
  console.error(problems.join('\n') + '\n');
  process.exit(1);
}
console.log(color.green(`Core check passed: ${Object.keys(manifest).length} shared files are unchanged.`));
