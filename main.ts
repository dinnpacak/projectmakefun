// Assemble an offline, self-contained judge dossier from this entry's own assets.
import {cpSync,existsSync,mkdirSync,writeFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildDossier} from './vendor/makefun-threejs.ts';
const root=fileURLToPath(new URL('.',import.meta.url));
const output=process.env.MAKEFUN_OUTPUT_DIR??'/output';
const game=join(root,'game');
const captures=join(root,'screenshots');
if(!existsSync(join(game,'index.html')))throw Error('Missing offline game entry');
mkdirSync(output,{recursive:true});
cpSync(game,join(output,'game'),{recursive:true});
mkdirSync(join(output,'screenshots'),{recursive:true});
// Copy only committed presentation images, never temporary browser output.
for(const name of ['1-start.png','2-play.png','3-relay.png','4-end.png']){
 const source=join(captures,name);
 if(!existsSync(source))throw Error('Missing browser capture: '+name);
 cpSync(source,join(output,'screenshots',name));
}
const limits={
 text_max_bytes:163840,
 screenshots:{max:4,max_bytes:262144},
 game_max_files:993,
 game_max_bytes:50331648,
};
const dossier=buildDossier(output,limits);
writeFileSync(join(output,'dossier.json'),dossier);
console.log('Offline game and browser captures assembled into dossier.json');
