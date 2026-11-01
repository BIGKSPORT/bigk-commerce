import {readdir,writeFile} from 'node:fs/promises';
const files=await readdir(new URL('../public/products/',import.meta.url),{recursive:true});
const paths=files.filter(p=>!p.startsWith('drive/')&&/\.(webp|png|jpe?g)$/.test(p)&&/^[a-zA-Z0-9_./-]+$/.test(p)).map(p=>'/products/'+p).sort();
await writeFile(new URL('../lib/static-product-media.json',import.meta.url),JSON.stringify(paths,null,2)+'\n');
