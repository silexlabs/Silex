(function () {
  // Only activate in Tauri context
  if (!window.__TAURI__) return;

  var invoke = window.__TAURI__.core.invoke;
  var listen = window.__TAURI__.event.listen;

  // Poll for the silex editor to be available
  function waitForEditor(callback) {
    var interval = setInterval(function () {
      if (window.silex && window.silex.getEditor) {
        try {
          var editor = window.silex.getEditor();
          if (editor) {
            clearInterval(interval);
            callback(editor);
          }
        } catch (e) {
          // Editor not ready yet
        }
      }
    }, 300);
  }

  // On the welcome page, clear the project state
  if (
    window.location.pathname === "/welcome" ||
    window.location.pathname === "/"
  ) {
    invoke("clear_current_project");
  }

  // On the editor page, wire up the bridge
  var params = new URLSearchParams(window.location.search);
  var websiteId = params.get("id");

  if (!websiteId) return;

  waitForEditor(function (editor) {
    // Report current project to Tauri
    fetch("/api/website/meta?websiteId=" + encodeURIComponent(websiteId))
      .then(function (r) {
        return r.json();
      })
      .then(function (meta) {
        invoke("set_current_project", {
          websiteId: websiteId,
          websiteName: meta.name || websiteId,
        });
      })
      .catch(function () {
        invoke("set_current_project", {
          websiteId: websiteId,
          websiteName: websiteId,
        });
      });

    // Track unsaved changes
    editor.on("change:changesCount", function () {
      invoke("mark_unsaved");
    });

    // Listen for save event (triggered by quit dialog)
    listen("menu-save", function () {
      editor.store();
    });

  });
})();
