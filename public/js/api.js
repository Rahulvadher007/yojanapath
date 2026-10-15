// jQuery AJAX helpers. All data comes from our own Node server.
(function (g, $) {
  function get(path) { return $.ajax({ url: path, method: 'GET', dataType: 'json', timeout: 10000 }); }
  g.YPApi = {
    health: function () { return get('/api/health'); },
    categories: function () { return get('/api/categories'); },
    schemes: function (domain) { return get('/api/schemes' + (domain ? '?domain=' + encodeURIComponent(domain) : '')); }
  };
})(window, jQuery);
