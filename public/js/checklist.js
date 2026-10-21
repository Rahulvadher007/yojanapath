// Checklist generated from scheme documents + steps, persisted per scheme.
(function (g) {
  function onReady(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  onReady(function () {
    var checklistEl = document.getElementById('checklist');
    if (!checklistEl) return;
    var statusEl = document.getElementById('status');
    var id = new URLSearchParams(location.search).get('id');
    if (statusEl) statusEl.textContent = 'Loading checklist…';
    checklistEl.innerHTML = g.ypSkel(1);
    checklistEl.setAttribute('aria-busy', 'true');
    g.YPApi.schemes().then(function (data) {
      checklistEl.removeAttribute('aria-busy');
      var s = (data || []).find(function (x) { return x.id === id; });
      if (!s) {
        checklistEl.innerHTML = '';
        if (statusEl) statusEl.textContent = 'Scheme not found.';
        return;
      }
      if (statusEl) statusEl.textContent = '';
      var items = (s.documents || []).map(function (d) { return 'Document: ' + d; }).concat((s.applicationSteps || []).map(function (d) { return 'Step: ' + d; }));
      var done = g.YPStore.getCheck(id);
      var titleEl = document.getElementById('clistTitle');
      if (titleEl) titleEl.textContent = 'Checklist — ' + s.name;
      checklistEl.innerHTML = '<ul class="checklist card">' + items.map(function (t, i) {
        return '<li><label><input type="checkbox" data-i="' + i + '"' + (done[i] ? ' checked' : '') + '> ' + g.esc(t) + '</label></li>';
      }).join('') + '</ul><p id="prog" class="meta"></p><p class="meta">Commonly required by this scheme record — confirm with the official authority. Not exhaustive unless verified.</p>';
      function prog() {
        var n = checklistEl.querySelectorAll('input:checked').length;
        var progEl = document.getElementById('prog');
        if (progEl) progEl.textContent = n + ' of ' + items.length + ' done';
      }
      checklistEl.addEventListener('change', function (e) {
        var inp = e.target.closest('input[data-i]');
        if (inp) {
          done[inp.getAttribute('data-i')] = inp.checked;
          g.YPStore.setCheck(id, done);
          prog();
        }
      });
      prog();
    }).catch(function () {
      checklistEl.innerHTML = '';
      checklistEl.removeAttribute('aria-busy');
      if (statusEl) statusEl.textContent = 'Could not load checklist. Check the server is running and retry.';
    });
  });
})(window);
