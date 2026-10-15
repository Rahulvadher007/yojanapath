// Checklist generated from scheme documents + steps, persisted per scheme.
(function ($, g) {
  $(function () {
    if (!$('#checklist').length) return;
    var id = new URLSearchParams(location.search).get('id');
    $('#status').text('Loading checklist…');
    $('#checklist').html(g.ypSkel(1)).attr('aria-busy', 'true');
    g.YPApi.schemes().done(function (data) {
      $('#checklist').removeAttr('aria-busy');
      var s = (data || []).find(function (x) { return x.id === id; });
      if (!s) { $('#checklist').empty(); $('#status').text('Scheme not found.'); return; }
      $('#status').text('');
      var items = (s.documents || []).map(function (d) { return 'Document: ' + d; }).concat((s.applicationSteps || []).map(function (d) { return 'Step: ' + d; }));
      var done = g.YPStore.getCheck(id);
      $('#clistTitle').text('Checklist — ' + s.name);
      $('#checklist').html('<ul class="checklist card">' + items.map(function (t, i) {
        return '<li><label><input type="checkbox" data-i="' + i + '"' + (done[i] ? ' checked' : '') + '> ' + g.esc(t) + '</label></li>';
      }).join('') + '</ul><p id="prog" class="meta"></p><p class="meta">Commonly required by this scheme record — confirm with the official authority. Not exhaustive unless verified.</p>');
      function prog() { var n = $('#checklist input:checked').length; $('#prog').text(n + ' of ' + items.length + ' done'); }
      $('#checklist').on('change', 'input', function () { done[$(this).attr('data-i')] = this.checked; g.YPStore.setCheck(id, done); prog(); });
      prog();
    }).fail(function () { $('#checklist').empty().removeAttr('aria-busy'); $('#status').text('Could not load checklist. Check the server is running and retry.'); });
  });
})(jQuery, window);
