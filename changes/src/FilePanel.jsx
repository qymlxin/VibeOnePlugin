// Production binding of the file panel markup in prototype/src/review.jsx @ 57bccce.
// Keep the prototype classes and hierarchy; inputs and callbacks replace demo data.
import React from 'react';
import {ChevronDown,PanelRight,GitBranch} from 'lucide-react';
import {FileTypeIcon} from './FileTypeIcon.jsx';
import {IconButton} from './IconButton.jsx';
export function FilePanelHeader({file,changes,status,tree,onToggle,onMenu}){
 return <><div className="file-tabbar"><span><FileTypeIcon path={file} size={13}/>{file.split(/[\\/]/).at(-1)}{changes&&status&&<i>{status}</i>}</span><IconButton label={tree?'收起文件列表':'显示文件列表'} active={tree} onClick={onToggle}><PanelRight size={14}/></IconButton></div><div className="file-toolbar"><span title={file}>{file}</span><button onClick={onMenu}><GitBranch size={12}/>{changes?'工作区变更':'工作区'}<ChevronDown size={11}/></button></div></>;
}
export {PierreFileTree as FilePanelTree} from './PierreFileTree.jsx';
