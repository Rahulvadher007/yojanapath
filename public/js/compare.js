// Compare up to YPStore.MAX_COMPARE + saved list.
(function (g) {
  var MAX = (g.YPStore && g.YPStore.MAX_COMPARE) ? g.YPStore.MAX_COMPARE : 5;
  function load(ids, cb) {
    g.YPApi.schemes().then(function (d) {
      cb((d || []).filter(function (s) { return ids.indexOf(s.id) > -1; }));
    }).catch(function () {
      cb([]);
    });
  }

  function onReady(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  onReady(function () {
    var compareEl = document.getElementById('compare');
    if (compareEl) {
      var ids = g.YPStore.getCompare();
      var titleEl = document.getElementById('compareTitle');
      if (titleEl) titleEl.textContent = 'Compare schemes (up to ' + MAX + ')';
      if (!ids.length) {
        compareEl.innerHTML = '<div class="alert">No schemes in comparison yet. <a href="results.html">Go to results</a> and add up to ' + MAX + '.</div>';
        return;
      }
      compareEl.innerHTML = g.ypSkel(2);
      compareEl.setAttribute('aria-busy', 'true');
      load(ids, function (list) {
        compareEl.removeAttribute('aria-busy');
        var rows = [
          ['Benefit', 'benefit'],
          ['Beneficiary', 'admin'],
          ['Scope', 'coverage'],
          ['Key eligibility', 'eligibility'],
          ['Missing info', 'missing'],
          ['Documents', 'docs'],
          ['Application steps', 'steps'],
          ['Source', 'source'],
          ['Verified', 'verified']
        ];
        function cell(s, k) {
          if (k === 'benefit') return g.esc(s.benefit.type + ' — ' + s.benefit.summary);
          if (k === 'admin') return g.esc(s.administeringAuthority);
          if (k === 'coverage') return g.esc(s.coverage.type + (s.coverage.states.length ? ' (' + s.coverage.states.join(', ') + ')' : ''));
          if (k === 'eligibility') return g.esc((s.eligibilityRules || []).map(function (r) { return r.description; }).join('; '));
          if (k === 'missing') {
            var a = g.YPStore.getAnswers();
            if (!g.YPRules || !a || !a.domain) return '— answer the questionnaire to see';
            var e = g.YPRules.evaluate(s, a);
            return e.unknown.length ? g.esc(e.unknown.map(function (x) { return x.rule.description; }).join('; ')) : 'None known';
          }
          if (k === 'docs') return g.esc((s.documents || []).join('; '));
          if (k === 'steps') return g.esc((s.applicationSteps || []).join('; '));
          if (k === 'source') return '<a href="' + g.esc(s.officialInfoUrl) + '" target="_blank" rel="noopener">Official link</a>';
          return g.esc(s.lastVerified + ' / ' + s.verificationStatus);
        }
        compareEl.innerHTML = g.ypTable('<table class="compare"><thead><tr><th scope="col">Aspect</th>' + list.map(function (s) { return '<th scope="col">' + g.esc(s.name) + '</th>'; }).join('') + '</tr></thead><tbody>' +
          rows.map(function (r) { return '<tr><th scope="row">' + r[0] + '</th>' + list.map(function (s) { return '<td>' + cell(s, r[1]) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>');
      });
    }

    var savedEl = document.getElementById('saved');
    if (savedEl) {
      var sv = g.YPStore.getSaved();
      if (!sv.length) {
        savedEl.innerHTML = '<div class="alert">No saved schemes yet. <a href="index.html">Explore support</a> to find some.</div><p class="meta">Saved items stay in this browser only.</p>';
        return;
      }
      savedEl.innerHTML = g.ypSkel(2);
      savedEl.setAttribute('aria-busy', 'true');
      load(sv, function (list) {
        savedEl.removeAttribute('aria-busy');
        savedEl.innerHTML = list.map(function (s) {
          return '<article class="card"><h3>' + g.esc(s.name) + '</h3><p>' + g.esc(s.benefit.summary) + '</p>' +
            '<p><a class="btn small" href="scheme-details.html?id=' + encodeURIComponent(s.id) + '">Open details</a> ' +
            '<a class="btn small ghost" href="checklist.html?id=' + encodeURIComponent(s.id) + '">Checklist</a> ' +
            '<button class="btn small ghost" data-rm="' + g.esc(s.id) + '">Remove</button></p></article>';
        }).join('');
        savedEl.addEventListener('click', function (e) {
          var btn = e.target.closest('[data-rm]');
          if (btn) {
            g.YPStore.toggleSaved(btn.getAttribute('data-rm'));
            location.reload();
          }
        });
      });
    }
  });
})(window);
