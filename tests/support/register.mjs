import {registerHooks} from 'node:module';
import {existsSync} from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=new URL('../../',import.meta.url),runtime=new URL('./runtime.mjs',import.meta.url).href;
registerHooks({resolve(specifier,context,next){if(specifier==='@/db'||specifier==='@/lib/server')return{url:runtime,shortCircuit:true};if(specifier.startsWith('@/'))specifier=new URL(specifier.slice(2)+'.ts',root).href;if(specifier.startsWith('.')&&context.parentURL?.startsWith(root.href)){const u=new URL(specifier,context.parentURL);if(!existsSync(fileURLToPath(u))&&existsSync(fileURLToPath(u)+'.ts'))specifier=u.href+'.ts';}return next(specifier,context);}});
