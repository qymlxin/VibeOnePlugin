import React,{useEffect,useRef,useState} from 'react';
import {FileText} from 'lucide-react';
import {SplitHandle} from './SplitHandle.jsx';
import {PierreFile} from './PierreCode.jsx';
import {ChangeStack} from './ChangeStack.jsx';
import './file-explorer.css';
import {FilePanelHeader,FilePanelTree} from './FilePanel.jsx';
const clean=path=>path.replace(/^\.\//,'');
function changeTree(files){
 const root={children:new Map()};
 for(const file of files){const parts=file.path.split(/[\\/]/).filter(Boolean);let node=root;
  parts.forEach((name,index)=>{if(!node.children.has(name))node.children.set(name,{name,path:parts.slice(0,index+1).join('/'),children:new Map()});node=node.children.get(name);if(index===parts.length-1)node.file={...file,name};});
 }
 return [...root.children.values()];
}

export function FileExplorer({session,workbench,tab,fileTarget,artifactCapture:capture,onTitle}){
 const [treeWidth,setTreeWidth]=useState(()=>{try{const width=Number(localStorage.getItem('vibeone-file-tree-width'));return width>=160&&width<=1200?width:240;}catch{return 240;}});
 useEffect(()=>{try{localStorage.setItem('vibeone-file-tree-width',String(treeWidth));}catch{}},[treeWidth]);
 const online=workbench.phase==='online';
 const [directories,setDirectories]=useState(()=>Object.create(null)),[expanded,setExpanded]=useState(new Set(['.'])),[result,setResult]=useState(null),[preview,setPreview]=useState(null),[selected,setSelected]=useState(null),[filter,setFilter]=useState(''),[showTree,setShowTree]=useState(true),[path,setPath]=useState('.'),[pathDraft,setPathDraft]=useState('.'),[navigating,setNavigating]=useState(false),[directoryErrors,setDirectoryErrors]=useState(()=>Object.create(null)),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const generation=useRef(0),selectionId=useRef(0),pending=useRef(new Map()),navigationId=useRef(0);
 const root=useRef(null);
 async function directory(path='.',epoch=generation.current){
   path=clean(path).replace(/\/$/,'')||'.';
   if(pending.current.has(path))return pending.current.get(path);
   setDirectoryErrors(previous=>{const next=Object.assign(Object.create(null),previous);delete next[path];return next;});
   const reading=Promise.resolve().then(async()=>{
     try{
       const value=await workbench.call(`/sessions/${session.id}/tree?path=${encodeURIComponent(path)}`);
       const normalized={...value,entries:value.entries.map(item=>({...item,path:clean(item.path)}))};
       if(epoch===generation.current)setDirectories(previous=>Object.assign(Object.create(null),previous,{[path]:normalized}));
       return normalized;
     }catch(reason){
       if(epoch===generation.current){const message=reason.message??String(reason);setError(message);setDirectoryErrors(previous=>Object.assign(Object.create(null),previous,{[path]:message}));}
       return null;
     }finally{if(epoch===generation.current)pending.current.delete(path);}
   });
   pending.current.set(path,reading);return reading;
 }
 async function navigate(target){
   const epoch=generation.current,id=++navigationId.current;
   setNavigating(true);setError('');
   const value=await directory(target||'.',epoch);
   if(epoch!==generation.current||id!==navigationId.current)return;
   if(value){setPath(target||'.');setPathDraft(target||'.');setExpanded(previous=>new Set([...previous,target||'.']));setFilter('');}
   setNavigating(false);
 }
 async function load(epoch=generation.current,rootPath=path){
   setBusy(true);setError('');
   try{if(tab==='changes'){const value=await workbench.call(`/sessions/${session.id}/changes`);if(epoch===generation.current)setResult(value);}else await directory(rootPath,epoch);}
   catch(reason){if(epoch===generation.current)setError(reason.message??String(reason));}
   finally{if(epoch===generation.current)setBusy(false);}
 }
 useEffect(()=>{const epoch=++generation.current;selectionId.current++;pending.current=new Map();navigationId.current++;setNavigating(false);setDirectoryErrors(Object.create(null));setDirectories(Object.create(null));setExpanded(new Set(['.']));setResult(null);setPreview(null);setSelected(null);setPath('.');setPathDraft('.');setFilter('');void load(epoch,'.');return()=>{generation.current++;selectionId.current++;};},[session.id,tab]);
 async function inspect(file,staged=false){
   if(tab==='changes'){setSelected(file);return;}
   const id=++selectionId.current,epoch=generation.current;
   setSelected({...file,stagedView:staged});setPreview(null);setError('');
   try{const value=await workbench.call(`/sessions/${session.id}/${tab==='changes'&&!file.untracked?'diff':'file'}?path=${encodeURIComponent(file.path)}&staged=${staged}`);if(id===selectionId.current&&epoch===generation.current)setPreview({...value,isDiff:tab==='changes'&&!file.untracked});}
   catch(reason){if(id===selectionId.current&&epoch===generation.current)setError(reason.message??String(reason));}
 }
 useEffect(()=>{if(fileTarget?.path&&tab==='files')void inspect({path:clean(fileTarget.path)});},[fileTarget,tab,session.id]);
 const toggle=rawPath=>{const path=clean(rawPath).replace(/\/$/,'')||'.';setExpanded(previous=>{const next=new Set(previous);if(next.has(path))next.delete(path);else next.add(path);return next;});if(!directories[path]){setError('');void directory(path);}};

 const changedNodes=nodes=>nodes.map(node=>node.children.size?{...node,kind:'directory',children:changedNodes([...node.children.values()])}:{...node.file,kind:'file'});
 const directoryNodes=directoryPath=>(directories[directoryPath]?.entries??[]).map(file=>({...file,children:file.kind==='directory'?directoryNodes(file.path):undefined}));
 const [panelMenu,setPanelMenu]=useState(false);
 const finishedRun=session.runs?.at(-1)?.finishedAt;const previousFinish=useRef(finishedRun);
 useEffect(()=>{if(previousFinish.current===finishedRun)return;previousFinish.current=finishedRun;void load();if(selected)void inspect(selected,selected.stagedView);},[finishedRun]);
 useEffect(()=>{if(tab==='files'&&selected?.path)onTitle?.(selected.path.split(/[\\/]/).at(-1));},[selected?.path,onTitle]);
 return <section ref={root} className="desktop-inspector explorer" aria-label={tab==='changes'?'变更浏览器':'文件浏览器'}>
  <FilePanelHeader file={selected?.path??(tab==='changes'?'工作区变更':path==='.'?'工作区文件':path)} changes={tab==='changes'} status={selected?.status?.trim()==='??'?'U':selected?.status?.trim()} tree={showTree} onToggle={()=>setShowTree(!showTree)} onMenu={()=>setPanelMenu(!panelMenu)}/>
  {panelMenu&&<div className="file-panel-menu"><button onClick={()=>{void load();if(selected)void inspect(selected,selected.stagedView);for(const path of expanded)if(path!=='.')void directory(path);setPanelMenu(false);}} disabled={busy||navigating}>刷新</button>{selected&&<button onClick={()=>{selectionId.current++;setSelected(null);setPreview(null);setPanelMenu(false);}}>关闭预览</button>}{tab==='files'&&<form onSubmit={event=>{event.preventDefault();void navigate(pathDraft);setPanelMenu(false);}}><input aria-label="浏览目录" value={pathDraft} disabled={navigating} onChange={event=>setPathDraft(event.target.value)}/><button disabled={busy||navigating}>打开目录</button></form>}{tab==='files'&&preview&&!preview.binary&&(!workbench.device||workbench.device.role==='operator')&&<button disabled={!online||capture.busy||!!capture.failure} onClick={()=>void capture.save(preview.path)}>保存为文本产物</button>}</div>}
  {error&&<p role="alert">{error}</p>}{(busy||navigating)&&<p role="status">正在读取…</p>}
  {capture.busy&&<p role="status">正在确认产物保存…</p>}
  {capture.notice&&<p role="status">{capture.notice}</p>}
  {capture.failure&&<div className="explorer-capture-failure" role="alert"><p>保存 {capture.failure.path} 未确认：{capture.failure.message}</p><button disabled={!online||capture.busy} onClick={()=>void capture.retry()}>重试保存产物</button><button disabled={capture.busy} aria-label="关闭产物保存提示" onClick={capture.dismiss}>关闭提示</button></div>}
  <div className={`file-workspace ${showTree?'with-tree':''}`} style={{'--file-tree-width':`${treeWidth}px`}}>
   <div className="code-view">
    {tab==='changes'?<ChangeStack files={(result?.files??[]).filter(file=>file.path.toLowerCase().includes(filter.toLowerCase()))} selected={selected} onSelect={setSelected} sessionId={session.id} workbench={workbench} revision={result?.collectedAt}/>:selected?<>
     {tab==='changes'&&!selected.untracked&&<div className="explorer-diff-modes"><button aria-pressed={!selected.stagedView} onClick={()=>void inspect(selected,false)}>未暂存差异</button><button aria-pressed={!!selected.stagedView} onClick={()=>void inspect(selected,true)}>已暂存差异</button></div>}
     {!preview&&!error&&<p role="status">正在读取文件…</p>}
     {preview&&<>{preview.binary?<p>二进制文件 · {preview.size} 字节</p>:<>
       <div className="code-label explorer-code-heading"><span>{preview.isDiff?'统一差异':'UTF-8 · 只读'}</span>{preview.isDiff&&<span>真实 Git 差异</span>}</div>
       <PierreFile path={selected.path} text={preview.text??''}/>
       <div className="code-end">{preview.isDiff?'其余内容未变化':'文件结束'}</div>

     </>}{preview.truncated&&<p>内容超过显示上限，已截断。</p>}</>}
    </>:<div className="explorer-empty"><FileText size={22}/><p>选择文件{tab==='changes'?'查看真实差异':'查看内容'}。</p>{!showTree&&<button onClick={()=>setShowTree(true)}>显示文件列表</button>}</div>}
   </div>
   {showTree&&<><SplitHandle scope="tree" minimum={160} collapseAt={96} label="调整文件列表宽度" onResize={setTreeWidth} onCollapse={()=>setShowTree(false)}/><FilePanelTree key={`${session.id}:${tab}:${path}`} entries={tab==='changes'?changedNodes(changeTree(result?.files??[])):directoryNodes(path)} selected={selected?.path} filter={filter} onFilter={setFilter} changes={tab==='changes'} count={result?.files?.length??0} onFile={file=>void inspect(file,tab==='changes'&&file.staged&&!file.unstaged)} onFolder={toggle}/></>}

  </div>
  <footer className="panel-status"><span>{tab==='changes'?`${result?.files?.length??0} 个文件变更${result?.statsAvailable?`  +${result.added} −${result.removed}`:''}`:path==='.'?'工作区文件':path}</span><span>只读预览</span></footer>
 </section>;
}
