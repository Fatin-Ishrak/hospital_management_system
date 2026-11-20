// Regenerates OWNERSHIP.md from OWNERSHIP.json and the real files.   Run: npm run ownership:md
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, walk, ownerOf, OWNERS } from './lib/project.mjs';

const files = walk();
const groups = {};
for (const f of files) (groups[ownerOf(f)] ||= []).push(f);
const loc = (f) => (/\.(jsx?|mjs|css)$/.test(f) ? fs.readFileSync(path.join(ROOT, f), 'utf8').split('\n').length : 0);
const names = { member1: 'Member 1', member2: 'Member 2', member3: 'Member 3', lead: 'Repository owner (team lead)' };

let md = `# Ownership: who owns which files

This file is generated from \`OWNERSHIP.json\` (run \`npm run ownership:md\` after changing it).
**Rule:** you commit only the files you own. Shared files (\`src/core/**\`, \`src/app/**\`) are frozen: they are checked by \`npm run build\`.
To list your files on your own computer: \`npm run my-files -- member1\` (or member2, member3, lead).

## Summary

| Owner | Responsibility | Files | Lines of code |
|---|---|---|---|
`;
for (const k of ['member1', 'member2', 'member3', 'lead']) {
  const total = (groups[k] || []).reduce((s, f) => s + loc(f), 0);
  md += `| ${names[k]} | ${OWNERS[k].replace(/^[^:]+: /, '')} | ${(groups[k] || []).length} | ${total} |\n`;
}
md += `\nTotal: ${files.length} files.\n\n`;
md += `## Folder map

| Folder | Owner |
|---|---|
| \`src/modules/admin/\` | Member 1 |
| \`src/modules/doctor/\` | Member 2 |
| \`src/modules/patient/\` | Member 3 |
| \`src/app/\` (app shell, module registry) | Member 1 |
| \`src/core/auth/\`, \`src/core/supabase/\` | Member 1 |
| \`src/core/ui/\`, \`src/core/layout/\`, \`src/core/hooks/\`, \`src/core/toast/\` | Member 2 |
| \`src/core/components/PatientDetails.jsx\`, \`src/core/components/InvoiceView.jsx\` | Member 2 |
| \`src/core/api/\`, \`src/core/utils/\` | Member 3 |
| \`src/core/components/SlotPicker.jsx\`, \`src/core/components/RescheduleModal.jsx\` | Member 3 |
| \`docs/contributions/Member-N-Contribution.md\` | the matching member |
| everything else (configuration, \`scripts/\`, \`sql/\`, guides, README) | Repository owner |

Shared core files can only change through the file's owner and the team lead (see \`docs/INTEGRATION_GUIDE.md\`).

`;
for (const k of ['member1', 'member2', 'member3', 'lead']) {
  md += `## ${names[k]}: ${(groups[k] || []).length} files\n\n| File | Lines |\n|---|---|\n`;
  for (const f of groups[k] || []) md += `| \`${f}\` | ${loc(f) || ''} |\n`;
  md += '\n';
}
fs.writeFileSync(path.join(ROOT, 'OWNERSHIP.md'), md);
console.log(`OWNERSHIP.md written (${files.length} files).`);
