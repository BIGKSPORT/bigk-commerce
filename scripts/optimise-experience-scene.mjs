import sharp from 'sharp';
import {mkdir} from 'node:fs/promises';
const input=process.argv[2];if(!input)throw Error('Usage: node scripts/optimise-experience-scene.mjs /path/to/approved-scene.png');
await mkdir('public/experience',{recursive:true});
for(const [name,width,height] of [['desktop',1600,900],['mobile',1120,630]]){
 for(const format of ['webp','avif'])await sharp(input).resize(width,height,{fit:'cover'}).toFormat(format,{quality:format==='avif'?52:78,effort:5}).toFile(`public/experience/gear-room-${name}.${format}`);
}
console.log('Created desktop 1600×900 and mobile 1120×630 AVIF/WebP scene assets.');
