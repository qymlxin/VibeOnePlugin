import {useRef,useState} from 'react';
const captureArtifact=(id,path,key)=>[`/sessions/${encodeURIComponent(id)}/artifacts`,{path,...(key?{key}:{})}];

export function useArtifactCapture(workbench,sessionId) {
  const intent=useRef(null),pending=useRef(false);
  const [busy,setBusy]=useState(false),[failure,setFailure]=useState(null),[notice,setNotice]=useState('');
  const save=async path=>{
    if(pending.current||(intent.current&&intent.current.path!==path))return null;
    if(intent.current?.path!==path)intent.current={path,key:crypto.randomUUID()};
    const current=intent.current;pending.current=true;setBusy(true);setFailure(null);setNotice('');
    try {
      const record=await workbench.call(...captureArtifact(sessionId,path,workbench.features?.includes('artifactCaptureIdempotency')?current.key:undefined));
      intent.current=null;setNotice(`已保存文本产物：${record.path}${record.content?.truncated?'（内容已截断）':''}`);return record;
    }catch(error){setFailure({path:current.path,message:error instanceof TypeError?'连接失败，保存结果尚未确认。':error.message??String(error)});return null;}
    finally{pending.current=false;setBusy(false);}
  };
  return {save,busy,failure,notice,retry:()=>failure?save(failure.path):Promise.resolve(null),dismiss:()=>{intent.current=null;setFailure(null);}};
}
