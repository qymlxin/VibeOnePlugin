import React,{useEffect,useMemo,useRef} from 'react';
import {FileTree,useFileTree} from '@pierre/trees/react';
import {Search} from 'lucide-react';
import {usePierreTheme} from './PierreCode.jsx';
function indexEntries(entries){const nodes=new Map(),paths=[];const walk=items=>items.forEach(node=>{if(node.kind==='symlink')return;nodes.set(node.path,node);paths.push(node.path+(node.kind==='directory'?'/':''));if(node.children)walk(node.children);});walk(entries);return {nodes,paths};}
function status(file){if(file.untracked)return 'untracked';if(file.status?.includes('D'))return 'deleted';if(file.status?.includes('A'))return 'added';if(file.status?.includes('R'))return 'renamed';return 'modified';}
export function PierreFileTree({entries,selected,filter,onFilter,onFile,onFolder,changes,count}){
 const index=useMemo(()=>indexEntries(entries),[entries]);
 const latest=useRef(null);latest.current={index,selected,onFile,onFolder};
 const knownDirectories=useRef(new Set());
 const requested=useRef(new Set());const syncing=useRef(false);
 const {model}=useFileTree({paths:index.paths,initialExpansion:changes?'open':'closed',flattenEmptyDirectories:false,icons:{set:'complete',colored:true},density:'default',search:false,fileTreeSearchMode:'hide-non-matches',stickyFolders:true,
  onSelectionChange:paths=>{if(syncing.current)return;const current=latest.current,node=current.index.nodes.get(paths.at(-1));if(node?.kind==='file'&&node.path!==current.selected)current.onFile(node);},
  renderRowDecoration:({row})=>{const node=latest.current.index.nodes.get(row.path);return node?.added!=null?{text:`+${node.added} −${node.removed}`,parts:[{text:`+${node.added}`,color:'var(--diff-green)'},{text:` −${node.removed}`,color:'var(--diff-red)'}]}:null;}
 });
 useEffect(()=>{const expanded=model.getVisibleRows(0,model.getVisibleCount()).filter(row=>row.isExpanded).map(row=>row.path);const directories=[...index.nodes.values()].filter(node=>node.kind==='directory').map(node=>node.path);if(changes)expanded.push(...directories.filter(path=>!knownDirectories.current.has(path)));knownDirectories.current=new Set(directories);syncing.current=true;model.resetPaths(index.paths,{initialExpandedPaths:expanded});model.setGitStatus([...index.nodes.values()].filter(node=>node.kind==='file'&&node.status).map(file=>({path:file.path,status:status(file)})));syncing.current=false;},[model,index,changes]);
 useEffect(()=>model.subscribe(()=>{if(changes)return;const rows=model.getVisibleRows(0,model.getVisibleCount()).filter(row=>row.kind==='directory'&&row.isExpanded);const open=new Set(rows.map(row=>row.path));for(const path of requested.current)if(!open.has(path))requested.current.delete(path);for(const row of rows)if(!requested.current.has(row.path)){requested.current.add(row.path);latest.current.onFolder(row.path);}}),[model,changes]);
 useEffect(()=>{model.setSearch(filter||null);},[model,filter,index]);
 useEffect(()=>{syncing.current=true;for(const path of model.getSelectedPaths())if(path!==selected)model.getItem(path)?.deselect();if(selected){model.getItem(selected)?.select();model.scrollToPath(selected,{focus:false,offset:'nearest'});}syncing.current=false;},[model,selected,index]);
 const mode=usePierreTheme();
 return <div className="file-tree pierre-tree-panel" style={{colorScheme:mode}}><label><Search size={12}/><input aria-label="筛选文件" placeholder="筛选文件…" value={filter} onChange={event=>onFilter(event.target.value)}/></label><div className="tree-heading">{changes?`已更改文件 · ${count}`:'项目文件'}</div><FileTree model={model} className="pierre-tree" style={{'--trees-theme-sidebar-bg':'var(--bg)','--trees-theme-sidebar-fg':'var(--fg)','--trees-theme-list-active-selection-bg':'var(--selected)','--trees-theme-list-active-selection-fg':'var(--fg)','--trees-theme-list-hover-bg':'var(--hover)','--trees-theme-git-added-fg':'var(--diff-green)','--trees-theme-git-modified-fg':'var(--accent)','--trees-theme-git-deleted-fg':'var(--diff-red)'}}/></div>;
}
