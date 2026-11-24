import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { useServices } from './services.jsx';
import '@xterm/xterm/css/xterm.css';

function clampNumber(value, fallback, min, max) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
}

export default function TerminalPanel({ session, onTitle, config, theme: themeProp }) {
  const { desktop } = useServices();
  const invoke = desktop.invoke;
  const streamChannel = desktop.streamChannel;
  const isNative = () => desktop.available;
  const container = useRef(null);
  const title = useRef(onTitle);
  title.current = onTitle;
  const termRef = useRef(null);
  const [error, setError] = useState('');
  const [exit, setExit] = useState(null);
  const [attempt, setAttempt] = useState(0);

  const fontSize = clampNumber(config?.fontSize, 12, 10, 24);
  const scrollback = clampNumber(config?.scrollback, 5000, 500, 50000);
  const cursorBlink = typeof config?.cursorBlink === 'boolean' ? config.cursorBlink : true;

  const applyTheme = (element, term) => {
    if (!element || !term) return;
    const style = getComputedStyle(element);
    term.options.theme = {
      background: style.getPropertyValue('--bg').trim() || (themeProp === 'light' ? '#ffffff' : '#181818'),
      foreground: style.getPropertyValue('--fg').trim() || (themeProp === 'light' ? '#1a1c1f' : '#ffffff'),
      cursor: style.getPropertyValue('--fg').trim() || (themeProp === 'light' ? '#1a1c1f' : '#ffffff'),
      selectionBackground: '#3564f566',
    };
  };

  useEffect(() => {
    applyTheme(container.current, termRef.current);
  }, [themeProp]);

  useEffect(() => {
    if (!isNative()) return;
    const id = crypto.randomUUID();
    const element = container.current;
    let disposed = false;
    let started = false;
    let inputQueue = Promise.resolve();
    setError('');
    setExit(null);

    const term = new Terminal({
      cursorBlink,
      fontFamily: 'Menlo, Monaco, Consolas, monospace',
      fontSize,
      lineHeight: 1.25,
      scrollback,
      allowProposedApi: false,
    });
    termRef.current = term;
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(element);

    const refreshTheme = () => applyTheme(element, term);
    refreshTheme();

    const resize = () => {
      if (disposed || element.clientWidth < 20 || element.clientHeight < 20) return;
      fit.fit();
      if (started) {
        void invoke('terminal_resize', { id, cols: term.cols, rows: term.rows }).catch((reason) => {
          if (!disposed) setError(String(reason));
        });
      }
    };
    resize();

    const { events, dispose: disposeEvents } = streamChannel();
    events.onmessage = (event) => {
      if (disposed) return;
      if (event.type === 'data') term.write(new Uint8Array(event.data));
      if (event.type === 'exit') setExit(event.code ?? '未知');
    };

    const ready = invoke('terminal_open', {
      id,
      cwd: session.workspace,
      cols: term.cols,
      rows: term.rows,
      events,
    })
      .then((name) => {
        started = true;
        if (!disposed) {
          title.current?.(name);
          resize();
          term.focus();
        }
      })
      .catch((reason) => {
        if (!disposed) setError(String(reason));
      });

    const listener = term.onData((data) => {
      inputQueue = inputQueue
        .then(() => ready)
        .then(() => {
          if (started && !disposed) return invoke('terminal_write', { id, data });
        })
        .catch((reason) => {
          if (!disposed) setError(String(reason));
        });
    });

    const observer = new ResizeObserver(resize);
    observer.observe(element);
    const root = element.closest('.review-app');
    const appearance = new MutationObserver(refreshTheme);
    if (root) {
      appearance.observe(root, { attributes: true, attributeFilter: ['class', 'style', 'data-theme'] });
    }

    return () => {
      disposed = true;
      termRef.current = null;
      disposeEvents();
      observer.disconnect();
      appearance.disconnect();
      listener.dispose();
      void ready.then(() => invoke('terminal_close', { id })).catch(() => {});
      term.dispose();
    };
  }, [session.id, session.workspace, attempt, fontSize, scrollback, cursorBlink]);

  return (
    <section className="interactive-terminal" aria-label="交互终端">
      {!isNative() ? (
        <p>交互终端在桌面应用中使用。</p>
      ) : (
        <>
          {error && (
            <div role="alert" className="terminal-status">
              {error}
              <button onClick={() => setAttempt((a) => a + 1)}>重新打开终端</button>
            </div>
          )}
          {exit != null && (
            <div className="terminal-status">
              Shell已退出 · {exit}
              <button onClick={() => setAttempt((a) => a + 1)}>重新打开</button>
            </div>
          )}
          <div ref={container} className="terminal-screen" />
        </>
      )}
    </section>
  );
}
