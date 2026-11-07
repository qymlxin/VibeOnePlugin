import React,{createContext,useContext,useSyncExternalStore} from 'react';
const Context=createContext(null);
export const ServicesProvider=Context.Provider;
export const useServices=()=>useContext(Context);
export function useWorkbench(){const services=useServices();const snapshot=useSyncExternalStore(services.workbench.subscribe,services.workbench.snapshot);return {...snapshot,phase:'online',features:['artifactCaptureIdempotency'],call:services.workbench.request,read:services.workbench.request};}
