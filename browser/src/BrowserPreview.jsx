import React,{useEffect,useState,useRef} from 'react';
import {ArrowLeft,ArrowRight,ExternalLink,RotateCw} from 'lucide-react';
import {useServices} from './services.jsx';
import {NativeBrowserSurface} from './NativeBrowserSurface.jsx';
import {previewUrl,browserAddress} from './preview-links.js';
export function BrowserPreview({url,onNavigate,canBack,canForward,onBack,onForward,visible=true,emptyState}){
 const {desktop}=useServices(),isNative=()=>desktop.available,openExternal=url=>desktop.invoke('open_external',{url});
 const native=isNative(),controller=useRef(null);
 const [locationUrl,setLocationUrl]=useState(url??'');
 const [draft,setDraft]=useState(url??''),[attempt,setAttempt]=useState(0),[state,setState]=useState('idle'),[error,setError]=useState('');
 useEffect(()=>{setDraft(url??'');setLocationUrl(url??'');},[url]);
 useEffect(()=>{if(!url)return;setState('loading');const timeout=setTimeout(()=>setState(current=>current==='loading'?'timeout':current),12000);return()=>clearTimeout(timeout);},[url,attempt]);
 const safe=previewUrl(url);
 return <section className="desktop-browser"><form className="browser-toolbar" onSubmit={event=>{event.preventDefault();const next=browserAddress(draft);if(!next){setError('请输入完整的 HTTP 或 HTTPS 地址。');return;}if(new URL(next).origin===location.origin){setError('应用自身页面请在当前窗口操作。');return;}setError('');onNavigate(next);}}><button type="button" aria-label="返回上一网页" disabled={!safe||(!native&&!canBack)} onClick={()=>native?controller.current?.('back'):onBack()}><ArrowLeft size={14}/></button><button type="button" aria-label="前进到下一网页" disabled={!safe||(!native&&!canForward)} onClick={()=>native?controller.current?.('forward'):onForward()}><ArrowRight size={14}/></button><input aria-label="预览网址" value={draft} onChange={event=>setDraft(event.target.value)} placeholder="搜索或输入网址"/><button aria-label="打开网址预览">打开</button><button type="button" aria-label="重新加载网页" disabled={!safe} onClick={()=>setAttempt(value=>value+1)}><RotateCw size={14}/></button></form>{error&&<p role="alert">{error}</p>}
 {safe?<><div className="desktop-browser-notice"><span role="status">{({loading:'正在加载网页…',timeout:native?'网页仍未就绪，请检查地址或网络后重试。':'网页仍未就绪，站点可能不允许内嵌。',error:'网页加载失败。',loaded:native?'加载完成':'网页已请求加载；内容可用性取决于站点。'})[state]}</span><a href={locationUrl||safe} target="_blank" rel="noopener noreferrer" onClick={event=>{if(isNative()){event.preventDefault();void openExternal(locationUrl||safe).catch(error=>setError(String(error)));}}}>在浏览器打开<ExternalLink size={12}/></a></div>{native?<NativeBrowserSurface url={safe} attempt={attempt} visible={visible} controller={controller} onState={(value,message)=>{setState(value);if(message)setError(message);}} onLocation={value=>{setLocationUrl(value);setDraft(value);}}/>:<iframe key={`${safe}:${attempt}`} title="网页预览" src={safe} sandbox="allow-scripts allow-forms" referrerPolicy="no-referrer" onLoad={()=>setState('loaded')} onError={()=>setState('error')}/>}<p className="desktop-browser-help">{native?'网页独立加载，可直接浏览与操作。':'网站可能限制内嵌，无法显示时请在浏览器中打开。'}</p></>:emptyState??<p className="desktop-browser-help">点击答案中的网页链接，或输入地址，在旁边预览。</p>}
 </section>;
}
