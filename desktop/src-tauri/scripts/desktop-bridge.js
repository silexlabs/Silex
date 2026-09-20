// Pure MCP helpers. Required by desktop-bridge.test.js (Node) and used in the webview.
var __silexMcpDynamic = (function () {
  var FONTS_PAGE_SIZE = 20;
  var PUBLISH_STARTED = 'Publication started. Call publish with action status to follow it.';
  var PUBLISH_STILL = 'Still publishing. Call publish with action status again. Do not tell the user it is done.';
  var NO_HOSTING = 'No hosting is set for this website. Ask the user to choose where to publish in the Publish dialog, then retry.';
  var NO_PUBLICATION = 'No publication is in progress. Call publish with action start first.';

  function lastLogLines(groups, n) {
    n = n || 20;
    var lines = [];
    if (!groups) return lines;
    for (var i = 0; i < groups.length; i++) {
      var group = groups[i];
      if (Array.isArray(group)) {
        for (var j = 0; j < group.length; j++) {
          if (group[j]) lines.push(String(group[j]));
        }
      } else if (group) {
        lines.push(String(group));
      }
    }
    return lines.slice(-n);
  }

  function hostingHint(message, status) {
    var m = message == null ? '' : String(message);
    if (
      status === 'STATUS_AUTH_ERROR' ||
      /please login/i.test(m) ||
      /not logged in to a hosting/i.test(m) ||
      /hosting connector/i.test(m) ||
      /no hosting/i.test(m)
    ) {
      return NO_HOSTING;
    }
    if (/not logged in to a storage/i.test(m)) {
      return 'Not signed in to storage. Ask the user to sign in, then retry.';
    }
    return m || 'Publication failed.';
  }

  function pageFontsAvailable(result) {
    var list = null;
    if (Array.isArray(result)) list = result;
    else if (result && Array.isArray(result.result)) list = result.result;
    else if (result && Array.isArray(result.fonts) && typeof result.remaining === 'number') return result;
    else if (result && Array.isArray(result.fonts)) list = result.fonts;
    if (!list) return result;
    var remaining = Math.max(0, list.length - FONTS_PAGE_SIZE);
    var paged = {
      fonts: list.slice(0, FONTS_PAGE_SIZE),
      remaining: remaining,
    };
    if (remaining > 0) {
      paged.hint = remaining + ' more fonts available. Use search to narrow the list.';
    }
    if (result && typeof result === 'object' && !Array.isArray(result)) {
      Object.keys(result).forEach(function (key) {
        if (key !== 'result' && key !== 'fonts' && key !== 'remaining' && key !== 'hint') {
          paged[key] = result[key];
        }
      });
    }
    return paged;
  }

  function publishStartAnswer() {
    return { status: 'pending', message: PUBLISH_STARTED };
  }

  function beginPublication(runCommand, onError) {
    try {
      var result = runCommand('publish');
      if (result && typeof result.then === 'function') {
        result.catch(function (ex) {
          if (onError) onError(ex);
        });
      }
    } catch (ex) {
      if (onError) onError(ex);
      return {
        status: 'error',
        message: hostingHint(ex && ex.message),
        errors: [String((ex && ex.message) || ex)],
        logs: [],
      };
    }
    return publishStartAnswer();
  }

  function publishStatusAnswer(snapshot) {
    snapshot = snapshot || {};
    var logs = lastLogLines(snapshot.logs);
    var errors = lastLogLines(snapshot.errors);
    var st = snapshot.managerStatus;
    var jobStatus = snapshot.jobStatus;
    var url = snapshot.url || null;
    if (st === 'STATUS_PENDING') {
      return { status: 'pending', message: PUBLISH_STILL, errors: errors, logs: logs };
    }
    if (st === 'STATUS_SUCCESS') {
      return {
        status: 'success',
        message: snapshot.message || 'Publication succeeded.',
        url: url,
        errors: errors,
        logs: logs,
      };
    }
    if (st === 'STATUS_ERROR' || st === 'STATUS_AUTH_ERROR') {
      return {
        status: 'error',
        message: hostingHint(snapshot.message, st),
        errors: errors,
        logs: logs,
      };
    }
    if (jobStatus === 'pending') {
      return { status: 'pending', message: PUBLISH_STILL, errors: errors, logs: logs };
    }
    if (jobStatus === 'success') {
      return {
        status: 'success',
        message: snapshot.message || 'Publication succeeded.',
        url: url,
        errors: errors,
        logs: logs,
      };
    }
    if (jobStatus === 'error') {
      return {
        status: 'error',
        message: hostingHint(snapshot.message, st),
        errors: errors,
        logs: logs,
      };
    }
    return { status: 'error', message: NO_PUBLICATION, errors: errors, logs: logs };
  }

  function wrapDynamicResult(result, selection, isError) {
    var payload;
    if (typeof result === 'undefined' || result === null) payload = {};
    else if (typeof result === 'string') {
      try { payload = JSON.parse(result); } catch (e) { payload = { raw: result }; }
    } else if (Array.isArray(result)) payload = { result: result };
    else if (typeof result === 'object') payload = Object.assign({}, result);
    else payload = { result: result };
    var sel = selection && typeof selection === 'object' ? Object.assign({}, selection) : selection;
    if (sel && typeof sel === 'object' && !isError && sel.warnings) {
      delete sel.warnings;
    }
    payload.selection = sel;
    if (!isError && payload.warnings) delete payload.warnings;
    return payload;
  }

  function isCommandError(payload) {
    if (!payload || typeof payload !== 'object') return false;
    if (payload.error != null) return true;
    if (payload.success === false) return true;
    if (payload.status === 'error') return true;
    return false;
  }

  return {
    FONTS_PAGE_SIZE: FONTS_PAGE_SIZE,
    PUBLISH_STARTED: PUBLISH_STARTED,
    PUBLISH_STILL: PUBLISH_STILL,
    NO_HOSTING: NO_HOSTING,
    NO_PUBLICATION: NO_PUBLICATION,
    lastLogLines: lastLogLines,
    hostingHint: hostingHint,
    pageFontsAvailable: pageFontsAvailable,
    publishStartAnswer: publishStartAnswer,
    beginPublication: beginPublication,
    publishStatusAnswer: publishStatusAnswer,
    wrapDynamicResult: wrapDynamicResult,
    isCommandError: isCommandError,
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = __silexMcpDynamic;
}

(() => {
  // Only activate in Tauri context
  if (typeof window === 'undefined' || !window.__TAURI__) return;

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
    publishJob: { status: 'idle', message: null, url: null, errors: [], logs: [] },

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
      return caps.getAllCapabilities().map((cap) => this.enrichCapability(cap));
    },

    enrichCapability(cap) {
      if (cap.id === 'fonts:available') {
        return Object.assign({}, cap, {
          description: 'List available Google Fonts (at most 20). The response includes how many remain; use search to narrow the list.',
        });
      }
      if (cap.id === 'publish') {
        return Object.assign({}, cap, {
          description: 'Publish the website. action=start begins publication and returns immediately. action=status follows it: pending, success with the URL, or error with what to do, job errors, and the last log lines. While it is running, call status again. Do not tell the user it is done until status is success.',
          inputSchema: {
            type: 'object',
            properties: {
              action: {
                type: 'string',
                enum: ['start', 'status'],
                description: 'start begins publication; status follows the current one. There is only one publication at a time.',
              },
            },
          },
        });
      }
      return cap;
    },

    watchPublish(editor) {
      const helpers = window.__silexMcpDynamic;
      const refreshFromManager = (patch) => {
        const pm = editor.PublicationManager;
        const job = pm && pm.job;
        this.publishJob = Object.assign({}, this.publishJob, {
          url: (pm && pm.settings && pm.settings.options && pm.settings.options.websiteUrl) || this.publishJob.url,
          errors: helpers.lastLogLines(job && job.errors),
          logs: helpers.lastLogLines(job && job.logs),
        }, patch);
      };
      editor.on('silex:publish:start', () => {
        refreshFromManager({ status: 'pending', message: helpers.PUBLISH_STILL });
      });
      editor.on('silex:publish:end', (result) => {
        const success = !!(result && result.success);
        refreshFromManager({
          status: success ? 'success' : 'error',
          message: success
            ? ((result && result.message) || 'Publication succeeded.')
            : helpers.hostingHint(result && result.message),
        });
      });
      editor.on('silex:publish:error', (result) => {
        refreshFromManager({
          status: 'error',
          message: helpers.hostingHint(result && result.message),
        });
      });
    },

    runPublish(editor, params) {
      const action = (params && params.action) || 'start';
      if (action === 'start') return this.startPublish(editor);
      if (action === 'status') return this.publishStatus(editor);
      return {
        status: 'error',
        error: 'Unknown publish action. Use action start or action status.',
        message: 'Unknown publish action. Use action start or action status.',
      };
    },

    startPublish(editor) {
      const helpers = window.__silexMcpDynamic;
      this.publishJob = { status: 'pending', message: helpers.PUBLISH_STARTED, url: null, errors: [], logs: [] };
      const started = helpers.beginPublication(
        (name) => editor.runCommand(name),
        (ex) => {
          this.publishJob = {
            status: 'error',
            message: helpers.hostingHint(ex && ex.message),
            url: null,
            errors: [String((ex && ex.message) || ex)],
            logs: [],
          };
        },
      );
      if (started.status === 'error') {
        this.publishJob = {
          status: 'error',
          message: started.message,
          url: null,
          errors: started.errors,
          logs: [],
        };
      }
      return started;
    },

    publishStatus(editor) {
      const helpers = window.__silexMcpDynamic;
      const pm = editor.PublicationManager;
      const job = pm && pm.job;
      return helpers.publishStatusAnswer({
        managerStatus: pm && pm.status,
        jobStatus: this.publishJob.status,
        message: (job && job.message) || this.publishJob.message,
        url: (pm && pm.settings && pm.settings.options && pm.settings.options.websiteUrl) || this.publishJob.url,
        errors: (job && job.errors) || this.publishJob.errors,
        logs: (job && job.logs) || this.publishJob.logs,
      });
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

    window.__silexMcp.watchPublish(editor);

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
    safeListen('menu-save', async () => {
      try {
        await editor.store();
      } finally {
        // Said even when the save failed: quitting waits on this, and silence
        // would hold the app open until its own timeout
        invoke('saved_everything');
      }
    });
    safeListen('menu-undo', () => editor.UndoManager.undo());
    safeListen('menu-redo', () => editor.UndoManager.redo());
    safeListen('menu-close-project', () => { window.location.href = '/'; });
  });
})();
