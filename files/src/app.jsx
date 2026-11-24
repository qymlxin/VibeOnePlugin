import React from 'react';
import { FileExplorer } from './FileExplorer.jsx';
import { useArtifactCapture } from './use-artifact-capture.js';
import { ServicesProvider, useWorkbench } from './services.jsx';

function Panel(props) {
  const workbench = useWorkbench();
  const session = workbench.sessions.find((s) => s.id === props.sessionId);
  const capture = useArtifactCapture(workbench, props.sessionId);
  const fileTarget =
    props.fileTarget ??
    (typeof props.params?.path === 'string'
      ? { path: props.params.path }
      : undefined);

  return session ? (
    <FileExplorer
      {...props}
      fileTarget={fileTarget}
      session={session}
      workbench={workbench}
      tab="files"
      artifactCapture={capture}
    />
  ) : (
    <p role="status">请选择已授权工作目录中的会话。</p>
  );
}

export default {
  apiVersion: '0.1',
  activate(ctx) {
    ctx.panels.register('files', (props) => (
      <ServicesProvider value={ctx.services}>
        <Panel {...props} config={ctx.config} />
      </ServicesProvider>
    ));
  },
};
