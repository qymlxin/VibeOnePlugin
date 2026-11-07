import React from 'react';import TerminalPanel from './TerminalPanel.jsx';import {ServicesProvider,useWorkbench} from './services.jsx';
function Panel(props){const workbench=useWorkbench(),session=workbench.sessions.find(s=>s.id===props.sessionId);return session?<TerminalPanel {...props} session={session}/>:<p role="status">请选择已授权工作目录中的会话。</p>;}
export default {apiVersion:'0.1',activate(ctx){ctx.panels.register('terminal',props=><ServicesProvider value={ctx.services}><Panel {...props}/></ServicesProvider>);}};
