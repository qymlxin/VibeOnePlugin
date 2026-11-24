import React, { useState } from 'react';
import { ServicesProvider } from './services.jsx';
import { BrowserPreview } from './BrowserPreview.jsx';

function Browser({ initialUrl, visible, onNavigate, emptyState, params, config }) {
  const configuredHome = typeof config?.homeUrl === 'string' ? config.homeUrl.trim() : '';
  const seedUrl =
    (typeof params?.url === 'string' ? params.url.trim() : '') ||
    initialUrl ||
    configuredHome;

  const [history, setHistory] = useState({
    urls: seedUrl ? [seedUrl] : [],
    index: seedUrl ? 0 : -1,
  });

  return (
    <BrowserPreview
      visible={visible}
      url={history.urls[history.index]}
      emptyState={emptyState}
      canBack={history.index > 0}
      canForward={history.index < history.urls.length - 1}
      onBack={() => setHistory((h) => ({ ...h, index: h.index - 1 }))}
      onForward={() => setHistory((h) => ({ ...h, index: h.index + 1 }))}
      onNavigate={
        onNavigate ??
        ((url) =>
          setHistory((h) => {
            const urls = [...h.urls.slice(0, h.index + 1), url].slice(-100);
            return { urls, index: urls.length - 1 };
          }))
      }
    />
  );
}

export default {
  apiVersion: '0.1',
  activate(ctx) {
    ctx.panels.register('browser', (props) => (
      <ServicesProvider value={ctx.services}>
        <Browser {...props} config={ctx.config} />
      </ServicesProvider>
    ));
  },
};
