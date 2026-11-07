import {build} from 'esbuild';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
for(const name of process.argv.slice(2).length?process.argv.slice(2):['files','changes','terminal','browser']){
 if(!['files','changes','terminal','browser'].includes(name))throw Error('Unknown package');
 const directory=path.join(root,name),outfile=path.join(directory,'dist/app.mjs');
 await mkdir(path.dirname(outfile),{recursive:true});
 const result=await build({entryPoints:[path.join(directory,'src/app.jsx')],bundle:true,format:'esm',platform:'browser',target:'chrome120',outfile,write:false,minify:true,legalComments:'inline',external:['react','react-dom','react-dom/client','react/jsx-runtime'],define:{'process.env.NODE_ENV':'"production"'}});
 const js=result.outputFiles.find(file=>file.path.endsWith('.mjs')).text;
 const css=result.outputFiles.find(file=>file.path.endsWith('.css'))?.text??'';
 const styles=await readFile(path.join(directory,'src/styles.css'),'utf8');
 // Scope style lifetime to this generation. Bundle is one ESM resource, no CDN or desktop imports.
 const entry=js.replace(/export\{([^}]+) as default\};?\s*$/,(_,binding)=>`const definition=${binding};export default {apiVersion:definition.apiVersion,async activate(ctx){const style=document.createElement('style');style.dataset.plugin=ctx.identity.pluginId;style.textContent=${JSON.stringify(css+'\n'+styles)};document.head.append(style);ctx.scope.add(()=>style.remove());return definition.activate(ctx);}};`);
 if(entry===js)throw Error('Missing default export');
 await writeFile(outfile,entry);
 console.log(name,Math.round(Buffer.byteLength(entry)/1024)+' KiB');
}
