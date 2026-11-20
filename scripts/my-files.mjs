// Lists the files that belong to one member (or to the team lead), so you can check what GitHub Desktop shows.
//   npm run my-files -- member1      (or member2, member3, lead)
//   npm run my-files                 (summary of everybody)
import { walk, ownerOf, OWNERS, color } from './lib/project.mjs';

const files = walk().filter((f) => !f.startsWith('node_modules/'));
const groups = {};
for (const f of files) (groups[ownerOf(f)] ||= []).push(f);
const who = process.argv[2];
if (!who) {
  for (const k of Object.keys(OWNERS)) console.log(`${k.padEnd(8)} ${String((groups[k] || []).length).padStart(3)} files   ${OWNERS[k]}`);
  console.log(`\nTotal: ${files.length} files.  Details: npm run my-files -- member1`);
} else if (!OWNERS[who]) {
  console.error(color.red(`Unknown name "${who}". Use: ${Object.keys(OWNERS).join(', ')}`));
  process.exit(1);
} else {
  console.log(color.bold(`${OWNERS[who]}\n${(groups[who] || []).length} files:\n`));
  console.log((groups[who] || []).map((f) => '  ' + f).join('\n'));
}
