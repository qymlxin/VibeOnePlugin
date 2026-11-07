import React from 'react';
import {Atom,Braces,FileText,FileCode,Cog,ArrowDown,Plus,Minus} from 'lucide-react';
export function FileTypeIcon({path='',size=14}){
 const extension=path.split('.').at(-1)?.toLowerCase();
 if(['jsx','tsx'].includes(extension))return <Atom size={size} className="file-type-icon react-file" aria-hidden="true"/>;
 if(['js','mjs','cjs','ts','css'].includes(extension))return <span className={`file-type-icon type-badge ${extension==='css'?'css-file':['ts'].includes(extension)?'ts-file':'js-file'}`} style={{width:size,height:size}} aria-hidden="true">{extension==='css'?'CSS':extension==='ts'?'TS':'JS'}</span>;
 if(extension==='rs')return <span className="file-type-icon rust-file rust-icon" style={{width:size,height:size}} aria-hidden="true"><Cog size={size}/><b>R</b></span>;
 const Icon=extension==='json'?Braces:['md','txt'].includes(extension)?FileText:FileCode;
 return <Icon size={size} className={`file-type-icon ${extension==='json'?'json-file':''}`} aria-hidden="true"/>;
}
export function ChangeStatus({file}){
 const status=file.status?.trim()??'';const added=file.untracked||status==='A',deleted=status==='D';
 return <><span className={`change-status ${deleted?'deleted':added?'new':'modified'}`} title={added?'新增':deleted?'删除':'已修改'}>{added?'A':deleted?'D':'M'}{!added&&!deleted&&<ArrowDown size={9}/>}</span></>;
}
export function ChangeMarker({file}){
 const added=file.untracked||file.status?.trim()==='A',deleted=file.status?.trim()==='D';
 return <span className={`change-marker ${added?'new':deleted?'deleted':'modified'}`} aria-label={added?'新增':deleted?'删除':'修改'}>{added?<Plus size={9}/>:deleted?<Minus size={9}/>:<span/>}</span>;
}
