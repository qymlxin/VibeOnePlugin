import React,{useEffect,useMemo,useState} from 'react';
import {File,FileDiff,MultiFileDiff,Virtualizer} from '@pierre/diffs/react';
import {parsePatchFiles} from '@pierre/diffs';
export {Virtualizer};

// Appearance is owned by the workbench; shadow roots receive the same mode.
export function usePierreTheme(){
 const read=()=>document.querySelector('.review-app')?.classList.contains('light')?'light':'dark';
 const [mode,setMode]=useState(read);
 useEffect(()=>{const root=document.querySelector('.review-app');if(!root)return;const observer=new MutationObserver(()=>setMode(read()));observer.observe(root,{attributes:true,attributeFilter:['class','style']});return()=>observer.disconnect();},[]);
 return mode;
}
const shared={theme:{dark:'pierre-dark',light:'pierre-light'},diffStyle:'unified',diffIndicators:'bars',hunkSeparators:'line-info',overflow:'scroll',stickyHeader:true,unsafeCSS:':host { --diffs-dark-bg:var(--bg,#181818); --diffs-light-bg:var(--bg,#fff); }'};
export function PierreDiff({patch,path='file',oldText,newText,collapsed=false,renderHeaderPrefix}){
 const themeType=usePierreTheme();
 const options=useMemo(()=>({...shared,themeType,collapsed}),[themeType,collapsed]);
 const parsed=useMemo(()=>{try{return {files:patch?parsePatchFiles(patch.startsWith('@@')?`--- a/${path}\n+++ b/${path}\n${patch}`:patch).flatMap(group=>group.files):[]};}catch{return {files:[],error:true};}},[patch,path]);
 const files=parsed.files;
 if(parsed.error||(patch&&!files.length))return <details className="pierre-notice"><summary>差异格式无法解析，查看文本</summary><pre>{patch}</pre></details>;
 if(patch&&files.length)return files.map((file,index)=><FileDiff key={`${file.name}:${index}`} fileDiff={file} options={options} renderHeaderPrefix={renderHeaderPrefix} disableWorkerPool className="pierre-diff"/>);
 if(oldText!=null||newText!=null)return <MultiFileDiff oldFile={oldText==null?null:{name:path,contents:oldText}} newFile={newText==null?null:{name:path,contents:newText}} options={options} renderHeaderPrefix={renderHeaderPrefix} disableWorkerPool className="pierre-diff"/>;
 return <p className="pierre-notice">当前范围没有文本差异。</p>;
}
export function PierreFile({path,text}){
 const themeType=usePierreTheme();
 const options=useMemo(()=>({...shared,themeType,disableFileHeader:true}),[themeType]);
 const file=useMemo(()=>({name:path,contents:text}),[path,text]);
 return <File file={file} options={options} disableWorkerPool className="pierre-file"/>;
}
