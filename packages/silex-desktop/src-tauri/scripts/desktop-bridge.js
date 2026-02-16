(() => {
  // Only activate in Tauri context
  if (!window.__TAURI__) return;

  const { invoke } = window.__TAURI__.core;
  const { listen } = window.__TAURI__.event;

  const TEXT_TAGS = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'a', 'li', 'td', 'th', 'label', 'blockquote'];

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

    getAdvancedSelectorApi() {
      return window.silex?.advancedSelector ?? null;
    },

    getSelectionState(editor) {
      const dev = editor.Devices.getSelected();
      const page = editor.Pages.getSelected();
      const sel = editor.getSelected();
      const rule = editor.StyleManager?.getSelected?.();

      return {
        breakpoint: dev?.get('name') ?? dev?.id ?? 'Desktop',
        page: page?.get('name') ?? page?.id ?? null,
        component: sel?.ccid ?? null,
        selector: rule?.selectorsToString?.() ?? null
      };
    },

    validateCssProperties(props) {
      const valid = [];
      const invalid = [];
      const dummy = document.createElement('div');

      for (const [prop, value] of Object.entries(props)) {
        dummy.style.cssText = '';
        dummy.style.setProperty(prop, value);
        (dummy.style.getPropertyValue(prop) ? valid : invalid).push({ property: prop, value });
      }

      return { valid, invalid };
    },

    listComponentSelectors(editor) {
      const asApi = this.getAdvancedSelectorApi();
      if (!asApi) return { error: 'Advanced selector plugin not available' };

      const comp = editor.getSelected();
      if (!comp) return { error: 'No component selected' };

      let componentSelector = null;
      if (asApi.getComponentSelector) {
        try {
          const cs = asApi.getComponentSelector(comp);
          if (cs && asApi.complexSelectorToString) {
            componentSelector = asApi.complexSelectorToString(cs);
          } else if (cs?.mainSelector?.selectors) {
            componentSelector = cs.mainSelector.selectors.map(s => {
              if (s.type === 'class') return `.${s.value}`;
              if (s.type === 'id') return `#${s.value}`;
              if (s.type === 'tag') return s.value;
              return s.value ?? '';
            }).join('');
          }
        } catch { /* ignore */ }
      }

      let matchingRules = [];
      if (asApi.getSelectors) {
        try {
          matchingRules = asApi.getSelectors(editor).map(cs => {
            try {
              return asApi.complexSelectorToString?.(cs) ?? JSON.stringify(cs);
            } catch { return JSON.stringify(cs); }
          });
        } catch { /* ignore */ }
      }

      return { componentSelector, matchingRules, classes: comp.getClasses() };
    },

    // =================================================================
    // MCP Tool helpers — called from mcp.rs via eval_js
    // =================================================================

    _log(tool, action, msg) {
      console.log(`[MCP ${tool}:${action}] ${msg}`);
    },

    parseCssString(cssStr) {
      const props = {};
      for (const decl of cssStr.split(';')) {
        const colonIdx = decl.indexOf(':');
        if (colonIdx < 0) continue;
        const prop = decl.slice(0, colonIdx).trim();
        const val = decl.slice(colonIdx + 1).trim();
        if (prop && val) props[prop] = val;
      }
      return props;
    },

    // -- Component helpers --

    getTree(editor, maxDepth, maxCount) {
      let count = 0;
      const walk = (c, d) => {
        if (count >= maxCount) return null;
        count++;
        const tag = c.get('tagName') ?? '';
        const node = {
          id: c.ccid, tag, type: c.get('type') ?? '',
          classes: c.getClasses().join(' '), children: []
        };
        if (c.get('type') === 'text' && c.get('content')) {
          node.text = c.get('content').substring(0, 80);
        }
        if (d < maxDepth) {
          for (const ch of c.components().models) {
            const cn = walk(ch, d + 1);
            if (cn) node.children.push(cn);
          }
        } else {
          node.children_count = c.components().length;
        }
        return node;
      };
      return walk(editor.getWrapper(), 0);
    },

    getComponent(editor) {
      const c = editor.getSelected();
      if (!c) return { error: 'No component selected. Use component(action:select, component_id:...) first.' };
      return {
        id: c.ccid, tag: c.get('tagName') ?? '', type: c.get('type') ?? '',
        classes: c.getClasses().join(' '), attributes: c.getAttributes(),
        content: c.get('content') ?? '', editable: !!c.get('editable'),
        children_count: c.components().length
      };
    },

    addComponent(editor, html, position) {
      const sel = editor.getSelected();
      let parent, opts = {};

      if (!sel) {
        parent = editor.getWrapper();
        this._log('component', 'add', 'No selection, appending to wrapper');
      } else if (position === 'inside') {
        parent = sel;
        this._log('component', 'add', `Adding inside ${sel.ccid}`);
      } else {
        parent = sel.parent();
        if (!parent) return { error: 'Selected component has no parent' };
        let idx = parent.components().indexOf(sel);
        if (position === 'after') idx++;
        opts = { at: idx };
        this._log('component', 'add', `Adding ${position} ${sel.ccid} at index ${idx}`);
      }

      let added = parent.components().add(html, opts);
      if (!Array.isArray(added)) added = [added];

      const warnings = [];
      const strip = (c) => {
        const s = c.getStyle();
        if (s && Object.keys(s).length > 0) {
          warnings.push(`Stripped inline styles from ${c.ccid}`);
          c.setStyle({});
        }
        c.components().forEach(strip);
      };
      const setEditable = (c) => {
        const tag = (c.get('tagName') ?? '').toLowerCase();
        if (TEXT_TAGS.includes(tag)) {
          c.set('type', 'text');
          c.set('editable', true);
        }
        c.components().forEach(setEditable);
      };

      added.forEach(strip);
      added.forEach(setEditable);
      if (added.length > 0) editor.select(added[0]);

      const ids = added.map(c => c.ccid);
      this._log('component', 'add', `Added ${ids.length} components: ${ids.join(', ')}`);
      return { success: true, component_ids: ids, warnings };
    },

    updateComponent(editor, content, attributes) {
      const c = editor.getSelected();
      if (!c) return { error: 'No component selected. Use component(action:select, component_id:...) first.' };
      if (content != null) c.set('content', content);
      if (attributes != null) c.addAttributes(attributes);
      this._log('component', 'update', `Updated ${c.ccid}`);
      return { success: true, id: c.ccid };
    },

    moveComponent(editor, targetId, position) {
      const c = editor.getSelected();
      if (!c) return { error: 'No component selected to move. Use component(action:select, component_id:...) first.' };
      const target = this.findComponent(editor, targetId);
      if (!target) return { error: 'Target component not found' };

      if (position === 'inside') {
        c.move(target, {});
      } else {
        const parent = target.parent();
        if (!parent) return { error: 'Target has no parent' };
        let idx = parent.components().indexOf(target);
        if (position === 'after') idx++;
        c.move(parent, { at: idx });
      }
      this._log('component', 'move', `Moved ${c.ccid} ${position} ${targetId}`);
      return { success: true, id: c.ccid };
    },

    removeComponent(editor) {
      const c = editor.getSelected();
      if (!c) return { error: 'No component selected. Use component(action:select, component_id:...) first.' };
      const { ccid } = c;
      c.remove();
      this._log('component', 'remove', `Removed ${ccid}`);
      return { success: true, removed: ccid };
    },

    selectComponent(editor, componentId) {
      const c = this.findComponent(editor, componentId);
      if (!c) return { error: `Component not found: ${componentId}` };
      editor.select(c);
      const tag = c.get('tagName') ?? '';
      this._log('component', 'select', `Selected ${c.ccid} <${tag}>`);
      return { success: true, id: c.ccid, tag, classes: c.getClasses().join(' ') };
    },

    // -- Selector helpers --

    selectSelector(editor, selectorStr) {
      const c = editor.getSelected();
      if (!c) return { error: 'No component selected. Use component(action:select) first.' };

      const asApi = this.getAdvancedSelectorApi();
      if (!asApi?.editStyle) return { error: 'Advanced selector plugin not available' };

      if (asApi.complexSelectorFromString) {
        try {
          const cs = asApi.complexSelectorFromString(selectorStr, '');
          if (!cs) return { error: `Invalid selector: ${selectorStr}` };
        } catch (ex) {
          return { error: `Invalid selector syntax: ${ex.message}` };
        }
      }

      if (asApi.matchSelectorAll) {
        const matches = asApi.matchSelectorAll(selectorStr, [c]);
        if (!matches) {
          this._log('selector', 'select', `matchSelectorAll returned false for ${selectorStr} on ${c.ccid}, classes: ${c.getClasses().join(' ')}`);
          return { error: `Selector does not match the selected component: ${selectorStr}` };
        }
      }

      asApi.editStyle(editor, selectorStr);
      this._log('selector', 'select', `Activated ${selectorStr}`);
      return { success: true, selector: selectorStr };
    },

    createSelector(editor, className) {
      const c = editor.getSelected();
      if (!c) return { error: 'No component selected. Use component(action:select) first.' };
      if (!/^[a-zA-Z_-][a-zA-Z0-9_-]*$/.test(className)) {
        return { error: `Invalid CSS class name: ${className}` };
      }
      c.addClass(className);
      this._log('selector', 'create', `Added class "${className}" to ${c.ccid}`);
      return { success: true, class_name: className, all_classes: c.getClasses() };
    },

    deleteSelector(editor, className) {
      const c = editor.getSelected();
      if (!c) return { error: 'No component selected. Use component(action:select) first.' };
      c.removeClass(className);
      const rules = editor.Css.getRules(`.${className}`);
      rules?.forEach(r => r.setStyle({}));
      this._log('selector', 'delete', `Removed class "${className}" from ${c.ccid}`);
      return { success: true, removed: className, remaining_classes: c.getClasses() };
    },

    // -- Style helpers --

    getStyle(editor) {
      const rule = editor.StyleManager?.getSelected?.();
      if (!rule) return { error: 'No selector active. Use selector(action:select, selector:.classname) first.' };
      return {
        selector: rule.selectorsToString?.() ?? '',
        style: rule.getStyle(),
        mediaText: rule.get('mediaText') ?? ''
      };
    },

    setStyle(editor, props) {
      const rule = editor.StyleManager?.getSelected?.();
      if (!rule) return { error: 'No selector active. Use selector(action:select, selector:.classname) first.' };

      const { invalid } = this.validateCssProperties(props);
      if (invalid.length > 0) return { error: 'Invalid CSS properties', invalid };

      const existing = rule.getStyle?.() ?? {};
      this._log('style', 'set', `Before: ${JSON.stringify(existing)}`);
      const merged = { ...existing, ...props };
      this._log('style', 'set', `Merged: ${JSON.stringify(merged)}`);
      rule.setStyle(merged);
      const after = rule.getStyle();
      this._log('style', 'set', `After: ${JSON.stringify(after)}`);

      return {
        success: true,
        selector: rule.selectorsToString?.() ?? '',
        applied: props,
        resulting_style: after
      };
    },

    deleteStyleProperty(editor, property) {
      const rule = editor.StyleManager?.getSelected?.();
      if (!rule) return { error: 'No selector active. Use selector(action:select, selector:.classname) first.' };
      const style = rule.getStyle();
      this._log('style', 'delete', `Removing "${property}" from ${JSON.stringify(style)}`);
      delete style[property];
      rule.setStyle(style);
      return { success: true, removed: property };
    },

    // -- Symbol helpers --

    findAllSymbols(editor) {
      const syms = editor.Components.getSymbols() ?? [];
      const result = syms.map(s => ({
        label: s.get('label') ?? s.get('custom-name') ?? '',
        id: s.ccid,
        placed: false
      }));
      const seen = new Set(result.map(r => r.label));

      const walk = (c) => {
        const lbl = c.get('label') ?? c.get('custom-name') ?? '';
        if (lbl && c.get('symbolId') && !seen.has(lbl)) {
          result.push({ label: lbl, id: c.ccid, placed: true });
          seen.add(lbl);
        }
        c.components().forEach(ch => walk(ch));
      };

      const saved = editor.Pages.getSelected();
      for (const pg of editor.Pages.getAll()) {
        editor.Pages.select(pg);
        walk(editor.getWrapper());
      }
      editor.Pages.select(saved);

      return result;
    },

    findSymbolByLabel(editor, label) {
      this._log('symbol', 'find', `Looking for: "${label}"`);

      const syms = editor.Components.getSymbols() ?? [];
      this._log('symbol', 'find', `Orphan symbols (${syms.length}): ${syms.map(s => `"${s.get('label') ?? s.get('custom-name') ?? ''}"`).join(', ')}`);

      const orphan = syms.find(s => (s.get('label') ?? s.get('custom-name')) === label);
      if (orphan) {
        this._log('symbol', 'find', 'Found in orphan list');
        return orphan;
      }

      // Search component tree across all pages
      const findInTree = (c) => {
        if ((c.get('label') ?? c.get('custom-name') ?? '') === label) return c;
        for (const child of c.components().models) {
          const r = findInTree(child);
          if (r) return r;
        }
        return null;
      };

      let found = null;
      const saved = editor.Pages.getSelected();
      for (const pg of editor.Pages.getAll()) {
        editor.Pages.select(pg);
        found = findInTree(editor.getWrapper());
        if (found) break;
      }
      editor.Pages.select(saved);

      this._log('symbol', 'find', found
        ? `Found in tree: ${found.ccid}`
        : 'NOT FOUND in orphan list or tree'
      );
      return found;
    },

    createSymbol(editor, label, icon) {
      const c = editor.getSelected();
      if (!c) return { error: 'No component selected. Select a component first with component(action:select).' };
      editor.runCommand('symbols:add', { label, icon: icon ?? 'fa fa-diamond' });
      this._log('symbol', 'create', `Created symbol "${label}" from ${c.ccid}`);
      return { success: true, label };
    },

    placeSymbol(editor, label, position) {
      const sym = this.findSymbolByLabel(editor, label);
      if (!sym) {
        const all = this.findAllSymbols(editor);
        return { error: 'Symbol not found', available: all.map(s => s.label) };
      }

      const sel = editor.getSelected();
      let parent, opts = {};

      if (!sel) {
        parent = editor.getWrapper();
      } else if (position === 'inside') {
        parent = sel;
      } else {
        parent = sel.parent() ?? editor.getWrapper();
        let idx = parent.components().indexOf(sel);
        if (idx < 0) idx = 0;
        if (position === 'after') idx++;
        opts = { at: idx };
      }

      parent.components().add(sym, opts);
      this._log('symbol', 'place', `Placed "${label}" ${position} selected`);
      return { success: true, label };
    },

    deleteSymbol(editor, label) {
      const sym = this.findSymbolByLabel(editor, label);
      if (!sym) return { error: 'Symbol not found' };

      try {
        editor.runCommand('symbols:remove', { component: sym });
        this._log('symbol', 'delete', 'Removed via symbols:remove command');
      } catch (ex) {
        this._log('symbol', 'delete', `symbols:remove failed (${ex.message}), falling back to remove()`);
        sym.remove();
      }
      return { success: true, deleted: label };
    },

    // -- Page helpers --

    listPages(editor) {
      const sel = editor.Pages.getSelected();
      return {
        pages: editor.Pages.getAll().map((p, i) => {
          const name = p.get('name') || p.getName?.() || (i === 0 ? 'main' : p.id);
          return { id: p.id, name, selected: p === sel };
        }),
        selected: sel?.id ?? null
      };
    },

    selectPage(editor, pageId) {
      let p = editor.Pages.get(pageId)
        ?? editor.Pages.getAll().find(pg => (pg.get('name') ?? pg.id) === pageId);
      if (!p) return { error: 'Page not found', available: editor.Pages.getAll().map(pg => pg.id) };
      editor.Pages.select(p);
      return { success: true, id: p.id };
    },

    addPage(editor, name, slug) {
      const p = editor.Pages.add({ name, id: slug });
      editor.Pages.select(p);
      this._log('page', 'add', `Created page ${p.id} (${name})`);
      return { success: true, id: p.id, name: p.get('name') ?? p.id };
    },

    removePage(editor, pageId) {
      const r = editor.Pages.remove(pageId);
      this._log('page', 'remove', `Removed page ${pageId}: ${!!r}`);
      return { success: !!r };
    },

    updatePageSettings(editor, pageId, settings) {
      let p;
      if (pageId) {
        p = editor.Pages.get(pageId)
          ?? editor.Pages.getAll().find(pg => (pg.get('name') ?? pg.id) === pageId);
      } else {
        p = editor.Pages.getSelected();
      }
      if (!p) return { error: 'Page not found' };
      // Handle page-level properties (name) separately from nested settings (SEO)
      if (settings.name != null) {
        p.set('name', settings.name);
        this._log('page', 'update_settings', `Renamed page ${p.id} to "${settings.name}"`);
      }
      const { name: _, ...seoSettings } = settings;
      if (Object.keys(seoSettings).length > 0) {
        const s = { ...(p.get('settings') ?? {}), ...seoSettings };
        p.set('settings', s);
      }
      this._log('page', 'update_settings', `Updated settings for ${p.id}`);
      return { success: true, name: p.get('name') ?? p.id, settings: p.get('settings') ?? {} };
    },

    // -- Device helpers --

    listDevices(editor) {
      const devs = editor.Devices.getDevices();
      const sel = editor.Devices.getSelected();
      return {
        devices: devs.map(d => ({
          id: d.id, name: d.get('name'),
          width: d.get('width'), widthMedia: d.get('widthMedia')
        })),
        selected: sel?.id ?? null
      };
    },

    setDevice(editor, name) {
      const dev = editor.Devices.get(name)
        ?? editor.Devices.getDevices().find(d => d.get('name') === name);
      if (!dev) {
        return { error: 'Device not found', available: editor.Devices.getDevices().map(d => d.get('name')) };
      }
      editor.Devices.select(dev);
      return { success: true, device: dev.get('name') };
    },

    // -- Site settings helpers --

    getSiteSettings(editor) {
      return editor.getModel().get('settings') ?? {};
    },

    setSiteSettings(editor, settings) {
      const m = editor.getModel();
      const s = { ...(m.get('settings') ?? {}), ...settings };
      m.set('settings', s);
      this._log('site_settings', 'set', 'Updated site settings');
      return { success: true, settings: s };
    },

    getOrCreatePersistantId(component) {
      const dsApi = this.getDataSourceApi();
      if (dsApi?.getOrCreatePersistantId) return dsApi.getOrCreatePersistantId(component);
      const id = component.get('id-plugin-data-source');
      if (id) return id;
      const newId = `${component.ccid}-${Math.round(Math.random() * 10000)}`;
      component.set('id-plugin-data-source', newId);
      return newId;
    }
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

  // Intercept file:// links and open in OS file manager
  document.addEventListener('click', (e) => {
    const link = e.target.closest("a[href^='file://']");
    if (link) {
      e.preventDefault();
      invoke('open_folder', { path: link.href });
    }
  });

  const params = new URLSearchParams(window.location.search);
  const websiteId = params.get('id');

  // On the dashboard (no ?id=), clear the project state
  if (!websiteId) {
    invoke('clear_current_project');
    return;
  }

  // On the editor page, wire up the bridge
  waitForEditor((editor) => {
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

    // Listen for menu events from Tauri (triggered by MCP or quit dialog)
    listen('menu-save', () => editor.store());
    listen('menu-undo', () => editor.UndoManager.undo());
    listen('menu-redo', () => editor.UndoManager.redo());
    listen('menu-close-project', () => { window.location.href = '/'; });
  });
})();
