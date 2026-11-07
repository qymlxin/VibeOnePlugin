import React,{useEffect,useRef,useState} from 'react';
import {ChevronDown,ChevronRight} from 'lucide-react';
import {PierreDiff,Virtualizer} from './PierreCode.jsx';
function ChangeFile({file,sessionId,workbench,selected,onSelect,revision,initialOpen}){
 const [open,setOpen]=useState(initialOpen),[result,setResult]=useState(null),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
 const ref=useRef(null);
 useEffect(()=>{if(selected){setOpen(true);ref.current?.scrollIntoView({block:'nearest'});}},[selected]);
 useEffect(()=>{let stale=false;setError('');setResult(null);const range=file.staged&&!file.unstaged;
 workbench.call(`/sessions/${sessionId}/${file.untracked?'file':'diff'}?path=${encodeURIComponent(file.path)}&staged=${range}`).then(value=>{if(!stale)setResult(value);}).catch(reason=>{if(!stale)setError(reason.message??String(reason));});return()=>{stale=true;};},[file.path,file.status,sessionId,revision,attempt]);
 const prefix=()=> <button className="pierre-collapse" aria-label={`${open?'收起':'展开'} ${file.path}`} aria-expanded={open} onClick={()=>{setOpen(value=>!value);if(!open)onSelect(file);}}>{open?<ChevronDown size={14}/>:<ChevronRight size={14}/>}</button>;
 return <article ref={ref} className="pierre-change-file">{error?<p role="alert">{file.path}：{error} <button onClick={()=>setAttempt(a=>a+1)}>重试</button></p>:!result?<p role="status">正在读取 {file.path}…</p>:result.binary?<p>{file.path} · 二进制文件 · {result.size} 字节</p>:<PierreDiff path={file.path} patch={file.untracked?undefined:result.text} newText={file.untracked?result.text:undefined} collapsed={!open} renderHeaderPrefix={prefix}/ >}{result?.truncated&&<p>内容超过显示上限，已截断。</p>}</article>;
}
export function ChangeStack({files,selected,onSelect,sessionId,workbench,revision}){
 return <Virtualizer className="change-stack pierre-change-stack">{files.length?files.map((file,index)=><ChangeFile key={file.path} file={file} selected={selected?.path===file.path} onSelect={onSelect} sessionId={sessionId} workbench={workbench} revision={revision} initialOpen={index===0}/>):<div className="explorer-empty">当前没有文件变更。</div>}</Virtualizer>;
}
