import React,{useEffect,useRef} from 'react';

export function SplitHandle({onResize,onCollapse,scope='panel',minimum=280,collapseAt=180,label='调整右侧预览宽度'}){
 const drag=useRef(null);
 const finish=()=>{
  const active=drag.current;drag.current=null;
  if(active){delete document.documentElement.dataset.panelResizing;window.dispatchEvent(new CustomEvent('vibeone:panel-resize',{detail:{active:false}}));}
 };
 useEffect(()=>()=>finish(),[]);
 const maximum=node=>{
  if(scope==='tree')return Math.max(0,node.parentElement.clientWidth-164);
  const app=node.closest('.review-app');
  const sidebar=app.querySelector(':scope > .session-sidebar');
  return Math.max(0,app.clientWidth-(sidebar?.getBoundingClientRect().width??0)-324);
 };
 const resize=(node,raw,original)=>{
  if(raw<collapseAt&&onCollapse){finish();onResize(original);onCollapse();return;}
  const max=maximum(node);onResize(Math.round(Math.max(Math.min(minimum,max),Math.min(max,raw))));
 };
 return <div className={`split-handle ${scope==='tree'?'file-tree-resize':'panel-resize desktop-split-handle'}`} role="separator" aria-label={label} aria-orientation="vertical" tabIndex={0} title="拖动调整宽度，向右拖窄可收起；双击收起" onDoubleClick={onCollapse}
  onKeyDown={event=>{
   const node=event.currentTarget,width=node.nextElementSibling.getBoundingClientRect().width;
   if(event.key==='Home'||event.key==='ArrowRight'&&width<=minimum){event.preventDefault();onCollapse?.();}
   else if(['ArrowLeft','ArrowRight','End'].includes(event.key)){event.preventDefault();resize(node,event.key==='End'?maximum(node):width+(event.key==='ArrowLeft'?24:-24),width);}
  }}
  onPointerDown={event=>{if(event.button!==0)return;event.preventDefault();const node=event.currentTarget;node.setPointerCapture(event.pointerId);drag.current={x:event.clientX,width:node.nextElementSibling.getBoundingClientRect().width};document.documentElement.dataset.panelResizing='true';window.dispatchEvent(new CustomEvent('vibeone:panel-resize',{detail:{active:true}}));}}
  onPointerMove={event=>{const active=drag.current;if(active)resize(event.currentTarget,active.width+active.x-event.clientX,active.width);}}
  onPointerUp={finish} onPointerCancel={event=>{const active=drag.current;finish();if(active)onResize(active.width);}} onLostPointerCapture={finish}/ >;
}
