import React,{useEffect,useRef,useState} from 'react';
import {Terminal} from '@xterm/xterm';
import {FitAddon} from '@xterm/addon-fit';
import {useServices,useWorkbench} from './services.jsx';

import '@xterm/xterm/css/xterm.css';
export default function TerminalPanel({session,onTitle}){
 const {desktop}=useServices();const invoke=desktop.invoke,streamChannel=desktop.streamChannel,isNative=()=>desktop.available;
 const container=useRef(null),title=useRef(onTitle);title.current=onTitle;
 const [error,setError]=useState(''),[exit,setExit]=useState(null),[attempt,setAttempt]=useState(0);
 useEffect(()=>{
  if(!isNative())return;
  const id=crypto.randomUUID(),element=container.current;let disposed=false,started=false,inputQueue=Promise.resolve();setError('');setExit(null);
  const term=new Terminal({cursorBlink:true,fontFamily:'Menlo, Monaco, Consolas, monospace',fontSize:12,lineHeight:1.25,scrollback:5000,allowProposedApi:false});const fit=new FitAddon();term.loadAddon(fit);term.open(element);
  const theme=()=>{const style=getComputedStyle(element);term.options.theme={background:style.getPropertyValue('--bg').trim()||'#181818',foreground:style.getPropertyValue('--fg').trim()||'#fff',cursor:style.getPropertyValue('--fg').trim()||'#fff',selectionBackground:'#3564f566'};};theme();
  const resize=()=>{if(disposed||element.clientWidth<20||element.clientHeight<20)return;fit.fit();if(started)void invoke('terminal_resize',{id,cols:term.cols,rows:term.rows}).catch(reason=>{if(!disposed)setError(String(reason));});};
  resize();const {events,dispose:disposeEvents}=streamChannel();events.onmessage=event=>{if(disposed)return;if(event.type==='data')term.write(new Uint8Array(event.data));if(event.type==='exit')setExit(event.code??'未知');};
  const ready=invoke('terminal_open',{id,cwd:session.workspace,cols:term.cols,rows:term.rows,events}).then(name=>{started=true;if(!disposed){title.current?.(name);resize();term.focus();}}).catch(reason=>{if(!disposed)setError(String(reason));});
  const listener=term.onData(data=>{inputQueue=inputQueue.then(()=>ready).then(()=>{if(started&&!disposed)return invoke('terminal_write',{id,data});}).catch(reason=>{if(!disposed)setError(String(reason));});});
  const observer=new ResizeObserver(resize);observer.observe(element);const root=element.closest('.review-app');const appearance=new MutationObserver(theme);if(root)appearance.observe(root,{attributes:true,attributeFilter:['class','style']});
  return()=>{disposed=true;disposeEvents();observer.disconnect();appearance.disconnect();listener.dispose();void ready.then(()=>invoke('terminal_close',{id})).catch(()=>{});term.dispose();};
 },[session.id,session.workspace,attempt]);
 return <section className="interactive-terminal" aria-label="交互终端">{!isNative()?<p>交互终端在桌面应用中使用。</p>:<>{error&&<div role="alert" className="terminal-status">{error}<button onClick={()=>setAttempt(a=>a+1)}>重新打开终端</button></div>}{exit!=null&&<div className="terminal-status">Shell已退出 · {exit}<button onClick={()=>setAttempt(a=>a+1)}>重新打开</button></div>}<div ref={container} className="terminal-screen"/></>}</section>;
}
