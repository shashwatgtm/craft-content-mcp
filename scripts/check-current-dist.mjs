import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,readdirSync} from 'node:fs';
// A current build must be complete in Git, not merely match the subset already tracked.
execFileSync(process.execPath,['scripts/build-profile.mjs'],{env:{...process.env,HELIX_PROFILE:'current'},stdio:'inherit'});
const files=execFileSync('git',['ls-files','dist'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
const committed=new Set(files);
const expected=readdirSync('src').filter(name=>name.endsWith('.ts')&&!name.endsWith('.d.ts')).flatMap(name=>['.js','.js.map','.d.ts','.d.ts.map'].map(ext=>'dist/'+name.slice(0,-3)+ext));
assert.deepEqual(expected.filter(file=>!committed.has(file)),[], 'Generated runtime files are missing from Git');
for(const file of files)assert.deepEqual(readFileSync(file),execFileSync('git',['show',`HEAD:${file}`],{maxBuffer:20*1024*1024}),`Committed current build differs: ${file}`);
console.log(`PASS ${files.length} committed dist files equal a fresh current build`);
