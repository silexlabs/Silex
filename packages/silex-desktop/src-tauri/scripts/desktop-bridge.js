(() => {
  // Only activate in Tauri context
  if (!window.__TAURI__) return;

  const { invoke } = window.__TAURI__.core;
  const { listen } = window.__TAURI__.event;

  // Frontend error tracking (GlitchTip / Sentry-compatible).
  // DSN is read from the same GLITCHTIP_DSN env var via a Tauri command.
  invoke('get_glitchtip_dsn').then((dsn) => {
    if (!dsn) return;
    const script = document.createElement('script');
    script.src = 'https://browser.sentry-cdn.com/8.46.0/bundle.tracing.min.js';
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      if (window.Sentry) {
        window.Sentry.init({
          dsn,
          release: '0.1.0',
          environment: 'production',
          tracesSampleRate: 1.0,
          integrations: [window.Sentry.browserTracingIntegration()],
        });
        window.Sentry.setTag('os', navigator.platform);
        window.Sentry.setTag('context', 'webview');
      }
    };
    document.head.appendChild(script);
  }).catch(() => { /* GLITCHTIP_DSN not set — telemetry disabled */ });

  const TEXT_TAGS = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'a', 'li', 'td', 'th', 'label', 'blockquote'];

  // Expose debug logging for silex-lib client code
  window.__silexDebug = (msg) => invoke('log_debug', { message: msg });
  invoke('log_debug', { message: '[bridge] desktop-bridge loaded, page=' + window.location.href });

  // MCP helpers (available globally for eval_js calls)
  window.__silexMcp = {
    findComponent(editor, id) {
      const walk = (c) => {
        if (c.ccid === id || c.getId() === id) return c;
        for (const child of c.components().models) {
          const r = walk(child);
          if (r) return r;
        }
        return null;
      };
      return walk(editor.getWrapper());
    },

    getDataSourceApi() {
      return window.silex?.dataSource ?? null;
    },

    resolveExpression(editor, dotPath) {
      const dsApi = this.getDataSourceApi();
      if (!dsApi?.getAllDataSources) {
        return { error: 'Data source plugin not available. No CMS configured.' };
      }

      const parts = dotPath.split('.');
      if (parts.length < 2) return { error: 'Expression must have at least 2 segments: "source.field"' };

      const [dsId, ...fieldParts] = parts;
      const ds = dsApi.getDataSource(dsId);
      if (!ds) {
        const available = dsApi.getAllDataSources().map(d => d.id);
        return { error: `Data source not found: ${dsId}`, available };
      }

      const tokens = [];
      let currentTypeIds = [];

      // First field segment: look up in queryables (root entry points)
      const fieldId = fieldParts[0];
      const queryables = ds.getQueryables?.() ?? [];
      const rootField = queryables.find(q => q.id === fieldId);
      if (!rootField) {
        return {
          error: `Field not found: ${fieldId}`,
          available: queryables.map(f => f.id)
        };
      }

      tokens.push({
        type: 'property',
        propType: 'field',
        dataSourceId: dsId,
        fieldId: rootField.id,
        label: rootField.label ?? rootField.id,
        typeIds: rootField.typeIds ?? [],
        kind: rootField.kind ?? 'object'
      });
      currentTypeIds = rootField.typeIds ?? [];

      // Remaining segments: traverse nested fields through types
      for (let seg = 1; seg < fieldParts.length; seg++) {
        const nextFieldId = fieldParts[seg];
        let found = false;
        const availableFields = [];
        const allTypes = ds.getTypes?.() ?? [];

        for (const t of allTypes) {
          if (!currentTypeIds.includes(t.id)) continue;

          for (const field of (t.fields ?? [])) {
            availableFields.push(field.id);
            if (field.id === nextFieldId) {
              tokens.push({
                type: 'property',
                propType: 'field',
                fieldId: field.id,
                label: field.label ?? field.id,
                typeIds: field.typeIds ?? [],
                kind: field.kind ?? 'scalar'
              });
              currentTypeIds = field.typeIds ?? [];
              found = true;
              break;
            }
          }
          if (found) break;
        }

        if (!found) {
          return {
            error: `Field not found at segment ${seg + 1}: ${nextFieldId}`,
            path_so_far: parts.slice(0, seg + 2).join('.'),
            available: availableFields
          };
        }
      }

      return tokens;
    },

    setState(component, stateId, state, exported) {
      const dsApi = this.getDataSourceApi();
      if (dsApi?.setState) {
        dsApi.setState(component, stateId, state, exported);
        return;
      }
      // Fallback: direct component manipulation (no change callbacks)
      const key = exported ? 'publicStates' : 'privateStates';
      const states = component.get(key) ?? [];
      const entry = { id: stateId, label: state.label, hidden: state.hidden, expression: state.expression };
      const idx = states.findIndex(s => s.id === stateId);
      component.set(key, idx >= 0
        ? states.map(s => s.id === stateId ? entry : s)
        : [...states, entry]
      );
    },

    removeState(component, stateId, exported) {
      const dsApi = this.getDataSourceApi();
      if (dsApi?.removeState) {
        dsApi.removeState(component, stateId, exported);
        return;
      }
      const key = exported ? 'publicStates' : 'privateStates';
      component.set(key, (component.get(key) ?? []).filter(s => s.id !== stateId));
    },

    getState(component, stateId, exported) {
      const dsApi = this.getDataSourceApi();
      if (dsApi?.getState) return dsApi.getState(component, stateId, exported);
      const key = exported ? 'publicStates' : 'privateStates';
      return (component.get(key) ?? []).find(s => s.id === stateId) ?? null;
    },

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

      // Add hierarchy warnings so SLMs know what's missing
      const warnings = [];
      if (!state.page) warnings.push("No page selected — use page(action:'select') first");
      if (!state.component) warnings.push("No element selected — use component(action:'select') before selector/style/symbol operations");
      if (!state.selector) warnings.push("No selector active — use selector(action:'select') before style(action:'set')");
      if (warnings.length > 0) state.warnings = warnings;

      return state;
    },

    _log(tool, action, msg) {
      console.log(`[MCP ${tool}:${action}] ${msg}`);
    },

    getOrCreatePersistantId(component) {
      const dsApi = this.getDataSourceApi();
      if (dsApi?.getOrCreatePersistantId) return dsApi.getOrCreatePersistantId(component);
      const id = component.get('id-plugin-data-source');
      if (id) return id;
      const newId = `${component.ccid}-${Math.round(Math.random() * 10000)}`;
      component.set('id-plugin-data-source', newId);
      return newId;
    },

    // Query capabilities registry and return as JSON-serializable tool definitions
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
    listen('menu-save', () => editor.store());
    listen('menu-undo', () => editor.UndoManager.undo());
    listen('menu-redo', () => editor.UndoManager.redo());
    listen('menu-close-project', () => { window.location.href = '/'; });
  });
})();
