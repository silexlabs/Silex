(() => {
  // Only activate in Tauri context
  if (!window.__TAURI__) return;

  const { invoke } = window.__TAURI__.core;
  const { listen } = window.__TAURI__.event;

  // Frontend error tracking (GlitchTip / Sentry-compatible).
  // Real version, channel, anonymous install id and OS/arch come from Rust so the
  // webview reports the same identity as the native side (not a hardcoded 0.1.0).
  invoke('get_telemetry_context').then((ctx) => {
    if (!ctx?.dsn) return;
    const script = document.createElement('script');
    script.src = 'https://browser.sentry-cdn.com/8.46.0/bundle.tracing.min.js';
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      if (!window.Sentry) return;
      window.Sentry.init({
        dsn: ctx.dsn,
        release: ctx.release,
        environment: ctx.environment,
        tracesSampleRate: 1.0,
        integrations: [window.Sentry.browserTracingIntegration()],
      });
      window.Sentry.setUser({ id: ctx.user_id });
      window.Sentry.setTag('os', ctx.os);
      window.Sentry.setTag('arch', ctx.arch);
      window.Sentry.setTag('context', 'webview');
    };
    document.head.appendChild(script);
  }).catch(() => { /* no consent / DSN not set — telemetry disabled */ });

  // Wrap listen() so a rejected Tauri IPC (plugin:event|listen) becomes a breadcrumb +
  // handled capture with a culprit, instead of an UnhandledRejection with an empty one.
  const safeListen = (event, handler) => {
    window.Sentry?.addBreadcrumb?.({ category: 'tauri', message: `listen ${event}`, level: 'info' });
    return listen(event, handler).catch((err) => {
      window.Sentry?.captureException?.(err, { tags: { tauri_command: `plugin:event|listen:${event}` } });
    });
  };

  // Expose debug logging for silex-lib client code
  window.__silexDebug = (msg) => invoke('log_debug', { message: msg });
  invoke('log_debug', { message: '[bridge] desktop-bridge loaded, page=' + window.location.href });

  // MCP helpers, called by the Rust side through eval_js.
  // Nothing else belongs here: a capability's own logic lives in its plugin.
  window.__silexMcp = {
    // Context joined to every dynamic tool response, so the agent knows what is selected.
    getSelectionState(editor) {
      const dev = editor.Devices.getSelected();
      const page = editor.Pages.getSelected();
      const sel = editor.getSelected();
      const rule = editor.StyleManager?.getSelected?.();

      const state = {
        breakpoint: dev?.get('name') ?? dev?.id ?? 'Desktop',
        page: page?.get('name') ?? page?.id ?? null,
        component: sel?.ccid ?? null,
        selector: rule?.selectorsToString?.() ?? null
      };

      // Add hierarchy warnings so SLMs know what is missing
      const warnings = [];
      if (!state.page) warnings.push("No page selected — use page(action:'select') first");
      if (!state.component) warnings.push("No element selected — use component(action:'select') before selector/style/symbol operations");
      if (!state.selector) warnings.push("No selector active — use selector(action:'select') before style(action:'set')");
      if (warnings.length > 0) state.warnings = warnings;

      return state;
    },

    // Capabilities the current page exposes, turned into MCP tools by the Rust side.
    getCapabilities() {
      const caps = window.grapesjsAiCapabilities;
      if (!caps?.getAllCapabilities) return [];
      return caps.getAllCapabilities();
    },
  };

  // Poll for the silex editor to be available
  const waitForEditor = (callback) => {
    const interval = setInterval(() => {
      try {
        const editor = window.silex?.getEditor?.();
        if (editor) {
          clearInterval(interval);
          callback(editor);
        }
      } catch { /* Editor not ready yet */ }
    }, 300);
  };

  // Intercept file:// links and open in OS file manager.
  // macOS WKWebView may strip file:// from href attributes, so we match
  // any <a> click and check the resolved .href property.
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;
    // Prefer getAttribute (raw, unencoded) over .href (browser-resolved,
    // percent-encodes spaces) so that file:// paths reach open_folder intact.
    const url = link.getAttribute('href') || link.href || '';
    if (url.startsWith('file://')) {
      e.preventDefault();
      invoke('open_folder', { path: url });
    } else if (url.startsWith('http://') || url.startsWith('https://')) {
      // External URLs open in OS default browser; same-origin URLs stay in webview
      try {
        const parsed = new URL(url);
        if (parsed.origin !== window.location.origin) {
          e.preventDefault();
          invoke('open_folder', { path: url });
        }
      } catch { /* malformed URL, let browser handle */ }
    }
  });

  const params = new URLSearchParams(window.location.search);
  const websiteId = params.get('id');

  // On the dashboard (no ?id=), clear the project state
  if (!websiteId) {
    invoke('clear_current_project');
    return;
  }

  // Track project_open: from navigation to editor ready
  const openStart = Date.now() / 1000;

  // On the editor page, wire up the bridge
  waitForEditor((editor) => {
    // Finish project_open transaction
    if (window.Sentry?.startInactiveSpan) {
      const span = window.Sentry.startInactiveSpan({ name: 'project_open', op: 'lifecycle', startTime: openStart, forceTransaction: true });
      span?.end();
    }

    // Report current project to Tauri
    fetch(`/api/website/meta?websiteId=${encodeURIComponent(websiteId)}`)
      .then(r => r.json())
      .then(meta => {
        invoke('set_current_project', {
          websiteId,
          websiteName: meta.name ?? websiteId,
        });
      })
      .catch(() => {
        invoke('set_current_project', {
          websiteId,
          websiteName: websiteId,
        });
      });

    // Track unsaved changes
    editor.on('change:changesCount', () => invoke('mark_unsaved'));

    // Track project_save
    editor.on('storage:start:store', () => {
      editor.__saveSpan = window.Sentry?.startInactiveSpan?.({ name: 'project_save', op: 'lifecycle', forceTransaction: true });
    });
    editor.on('storage:end:store', () => {
      editor.__saveSpan?.end();
      editor.__saveSpan = null;
    });
    editor.on('storage:error:store', () => {
      if (editor.__saveSpan) { editor.__saveSpan.setStatus({ code: 2, message: 'internal_error' }); editor.__saveSpan.end(); editor.__saveSpan = null; }
    });

    // Track project_publish
    editor.on('silex:publish:start', () => {
      editor.__publishSpan = window.Sentry?.startInactiveSpan?.({ name: 'project_publish', op: 'lifecycle', forceTransaction: true });
    });
    editor.on('silex:publish:end', () => {
      editor.__publishSpan?.end();
      editor.__publishSpan = null;
    });
    editor.on('silex:publish:error', () => {
      if (editor.__publishSpan) { editor.__publishSpan.setStatus({ code: 2, message: 'internal_error' }); editor.__publishSpan.end(); editor.__publishSpan = null; }
    });

    // Listen for menu events from Tauri (triggered by MCP or quit dialog)
    safeListen('menu-save', () => editor.store());
    safeListen('menu-undo', () => editor.UndoManager.undo());
    safeListen('menu-redo', () => editor.UndoManager.redo());
    safeListen('menu-close-project', () => { window.location.href = '/'; });
  });
})();
