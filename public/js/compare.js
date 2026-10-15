// Compare up to 3 + saved list.
(function ($, g) {
  function load(ids, cb) { g.YPApi.schemes().done(function (d) { cb((d || []).filter(function (s) { return ids.indexOf(s.id) > -1; })); }).fail(function () { cb([]); }); }
  $(function () {
    if ($('#compare').length) {
      var ids = g.YPStore.getCompare();
      if (!ids.length) { $('#compare').html('<div class="alert">No schemes in comparison yet. <a href="results.html">Go to results</a> and add up to 3.</div>'); return; }
      $('#compare').html(g.ypSkel(2)).attr('aria-busy', 'true');
      load(ids, function (list) {
        $('#compare').removeAttr('aria-busy');
        var rows = [['Benefit', 'benefit'], ['Beneficiary', 'admin'], ['Scope', 'coverage'], ['Key eligibility', 'eligibility'], ['Missing info', 'missing'], ['Documents', 'docs'], ['Application steps', 'steps'], ['Source', 'source'], ['Verified', 'verified']];
        function cell(s, k) {
          if (k === 'benefit') return g.esc(s.benefit.type + ' — ' + s.benefit.summary);
          if (k === 'admin') return g.esc(s.administeringAuthority);
          if (k === 'coverage') return g.esc(s.coverage.type + (s.coverage.states.length ? ' (' + s.coverage.states.join(', ') + ')' : ''));
          if (k === 'eligibility') return g.esc((s.eligibilityRules || []).map(function (r) { return r.description; }).join('; '));
          if (k === 'missing') { var a = g.YPStore.getAnswers(); if (!g.YPRules || !a || !a.domain) return '— answer the questionnaire to see'; var e = g.YPRules.evaluate(s, a); return e.unknown.length ? g.esc(e.unknown.map(function (x) { return x.rule.description; }).join('; ')) : 'None known'; }
          if (k === 'docs') return g.esc((s.documents || []).join('; '));
          if (k === 'steps') return g.esc((s.applicationSteps || []).join('; '));
          if (k === 'source') return '<a href="' + g.esc(s.officialInfoUrl) + '" target="_blank" rel="noopener">Official link</a>';
          return g.esc(s.lastVerified + ' / ' + s.verificationStatus);
        }
        $('#compare').html(g.ypTable('<table class="compare"><thead><tr><th scope="col">Aspect</th>' + list.map(function (s) { return '<th scope="col">' + g.esc(s.name) + '</th>'; }).join('') + '</tr></thead><tbody>' +
          rows.map(function (r) { return '<tr><th scope="row">' + r[0] + '</th>' + list.map(function (s) { return '<td>' + cell(s, r[1]) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>'));
      });
    }
    if ($('#saved').length) {
      var sv = g.YPStore.getSaved();
      if (!sv.length) { $('#saved').html('<div class="alert">No saved schemes yet. <a href="index.html">Explore support</a> to find some.</div><p class="meta">Saved items stay in this browser only.</p>'); return; }
      $('#saved').html(g.ypSkel(2)).attr('aria-busy', 'true');
      load(sv, function (list) {
        $('#saved').removeAttr('aria-busy');
        $('#saved').html(list.map(function (s) {
          return '<article class="card"><h3>' + g.esc(s.name) + '</h3><p>' + g.esc(s.benefit.summary) + '</p>' +
            '<p><a class="btn small" href="scheme-details.html?id=' + encodeURIComponent(s.id) + '">Open details</a> ' +
            '<a class="btn small ghost" href="checklist.html?id=' + encodeURIComponent(s.id) + '">Checklist</a> ' +
            '<button class="btn small ghost" data-rm="' + g.esc(s.id) + '">Remove</button></p></article>';
        }).join(''));
        $('#saved').on('click', '[data-rm]', function () { g.YPStore.toggleSaved($(this).attr('data-rm')); location.reload(); });
      });
    }
  });
})(jQuery, window);
