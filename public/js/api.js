// Native fetch API helpers. All data comes from our own Node server.
(function (g) {
  function get(path, timeoutMs) {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, timeoutMs || 10000);
    var p = fetch(path, { signal: controller.signal })
      .then(function (res) {
        clearTimeout(timer);
        if (!res.ok) {
          var err = new Error('HTTP ' + res.status);
          err.status = res.status;
          throw err;
        }
        return res.json();
      });
    p.done = function (fn) { p.then(fn); return p; };
    p.fail = function (fn) { p.catch(fn); return p; };
    return p;
  }
  g.YPApi = {
    health: function () { return get('/api/health'); },
    categories: function () { return get('/api/categories'); },
    schemes: function (domain) { return get('/api/schemes' + (domain ? '?domain=' + encodeURIComponent(domain) : '')); }
  };
})(window);
