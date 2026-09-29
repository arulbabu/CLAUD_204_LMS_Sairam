/*
 * Minimal SCORM 1.2 API wrapper.
 * Finds the SCORM API in the parent/opener window chain (LMS-provided),
 * and degrades gracefully (no-ops) when run standalone outside an LMS.
 */
var ScormAPI = (function () {
  var api = null;
  var initialized = false;

  function findAPI(win) {
    var attempts = 0;
    while (win && !win.API && win.parent && win.parent !== win && attempts < 10) {
      win = win.parent;
      attempts++;
    }
    return win ? win.API : null;
  }

  function getAPI() {
    if (api) return api;
    api = findAPI(window);
    if (!api && window.opener) api = findAPI(window.opener);
    return api;
  }

  function init() {
    var a = getAPI();
    if (a) {
      initialized = a.LMSInitialize("") === "true";
    }
    return initialized;
  }

  function setValue(key, value) {
    var a = getAPI();
    if (a && initialized) a.LMSSetValue(key, value);
  }

  function commit() {
    var a = getAPI();
    if (a && initialized) a.LMSCommit("");
  }

  function finish(scorePercent, passed) {
    var a = getAPI();
    if (a && initialized) {
      a.LMSSetValue("cmi.core.score.raw", String(scorePercent));
      a.LMSSetValue("cmi.core.lesson_status", passed ? "passed" : "failed");
      a.LMSCommit("");
      a.LMSFinish("");
    }
  }

  function isAvailable() {
    return !!getAPI();
  }

  return { init: init, setValue: setValue, commit: commit, finish: finish, isAvailable: isAvailable };
})();
