// Scheme details: overview, eligibility, application, document checklist, sources.
// Content is rendered from the stored record only. Nothing is invented — where the
// record has no verified detail, the section says so and points at the official page.
(function (g) {
  // Placeholder steps we seeded for records we have not transcribed yet.
  var PLACEHOLDER_STEPS = [
    'open the official source',
    'open the official page linked below',
    'read the published eligibility and application conditions',
    'read the eligibility and application conditions published there'
  ];
  function isPlaceholder(t) {
    return PLACEHOLDER_STEPS.indexOf(String(t || '').trim().toLowerCase().replace(/\.+$/, '')) > -1;
  }
  function host(u) { try { return new URL(u).hostname; } catch { return u; } }

  function onReady(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  onReady(function () {
    var detailEl = document.getElementById('detail');
    if (!detailEl) return;
    var statusEl = document.getElementById('status');
    var id = new URLSearchParams(location.search).get('id'), answers = g.YPStore.getAnswers();
    if (statusEl) statusEl.textContent = 'Loading…';
    detailEl.innerHTML = g.ypSkel(1);
    detailEl.setAttribute('aria-busy', 'true');
    g.YPApi.schemes().then(function (data) {
      detailEl.removeAttribute('aria-busy');
      var s = (data || []).find(function (x) { return x.id === id; });
      if (!s) {
        detailEl.innerHTML = '';
        if (statusEl) statusEl.textContent = 'Scheme not found.';
        return;
      }
      if (statusEl) statusEl.textContent = '';
      var ev = g.YPRules.evaluate(s, answers);
      var official = '<a href="' + g.esc(s.officialInfoUrl) + '" target="_blank" rel="noopener">' + g.esc(host(s.officialInfoUrl)) + '</a>';

      function group(title, list) {
        if (!list.length) return '';
        return '<h4>' + title + ' (' + list.length + ')</h4><ul class="reason">' +
          list.map(function (x) { return g.ypCond(x, answers[x.rule.field]); }).join('') + '</ul>';
      }

      /* ---------- Eligibility ---------- */
      var rules = s.eligibilityRules || [];
      var quoted = s.documentedEligibility || [];
      var elig;
      if (rules.length) {
        elig = '<ul class="elig-list">' + rules.map(function (r) {
          return '<li><span class="elig-text">' + g.esc(r.description) + '</span>' +
            (r.sourceUrl ? '<span class="elig-src">From ' + g.esc(host(r.sourceUrl)) + ' · checked ' + g.esc(r.sourceCheckedAt || s.lastVerified) + '</span>' : '') +
            '</li>';
        }).join('') + '</ul>' +
          '<p class="prov">Transcribed from the official page on ' + g.esc(s.eligibilityExtractedAt || s.lastVerified) + '. The authority decides.</p>' +
          group('Matches your answers', ev.met) + group('Does not match your answers', ev.failed) +
          group('Needs a confirmation from you', ev.unknown) + group('Not applicable to you', ev.na);
      } else if (quoted.length) {
        elig = '<ul class="elig-list">' + quoted.map(function (e) { return '<li><span class="elig-text">' + g.esc(e) + '</span></li>'; }).join('') + '</ul>' +
          '<p class="prov">Quoted from ' + official + ' on ' + g.esc(s.eligibilityExtractedAt || s.lastVerified) + '. These are the page\'s own words, not conditions we have encoded — read them in context.</p>';
      } else {
        elig = '<p class="gap">We have not recorded this scheme\'s eligibility conditions yet. Treat them as unknown until you read them on ' + official + '.</p>';
      }

      /* ---------- How to apply ---------- */
      var steps = (s.applicationSteps || []).filter(function (x) { return !isPlaceholder(x); });
      var apply = steps.length
        ? '<ol class="steps">' + steps.map(function (x) { return '<li>' + g.esc(x) + '</li>'; }).join('') + '</ol>' +
          '<p class="prov">Transcribed from ' + official + ' on ' + g.esc(s.lastVerified) + '.</p>'
        : '<p class="gap">We have not recorded the specific application steps for this scheme yet. Follow the process published on ' + official + '.</p>';
      if (s.nextStep) apply += '<p class="next-step"><b>Your next step</b> ' + g.esc(s.nextStep) + '</p>';

      /* ---------- Documents checklist ---------- */
      var docs = s.documents || [];
      var chk = g.YPStore.getCheck(s.id) || {};
      var docSec = docs.length
        ? '<p class="prov" id="docProgress">' + docs.filter(function (_, i) { return chk[i]; }).length + ' of ' + docs.length + ' ready</p>' +
          '<ul class="doc-check">' + docs.map(function (d, i) {
            return '<li><label class="doc-row"><input type="checkbox" data-doc="' + i + '"' + (chk[i] ? ' checked' : '') + '>' +
              '<span class="doc-text">' + g.esc(d) + '</span></label></li>';
          }).join('') + '</ul>' +
          '<p class="prov">Listed for this scheme on ' + official + '. Confirm the exact list before you apply — requirements change.</p>'
        : '<p class="gap">We have not recorded a document list for this scheme yet. Check what ' + official + ' asks for before applying.</p>';

      /* ---------- Sources ---------- */
      var srcs = s.sources && s.sources.length ? s.sources : [{ url: s.officialInfoUrl, sourceType: 'official', checkedAt: s.lastVerified }];
      var srcSec = '<ul class="src-list">' + srcs.map(function (x) {
        return '<li><a href="' + g.esc(x.url) + '" target="_blank" rel="noopener">' + g.esc(host(x.url)) + '</a>' +
          '<span class="src-meta">' + g.esc(x.sourceType || 'official') + ' · checked ' + g.esc(x.checkedAt || s.lastVerified) + '</span></li>';
      }).join('') + '</ul>' + (s.officialApplicationUrl ? '<p class="prov">Apply: <a href="' + g.esc(s.officialApplicationUrl) + '" target="_blank" rel="noopener">' + g.esc(host(s.officialApplicationUrl)) + '</a></p>' : '');

      detailEl.innerHTML = '<article class="card detail">' +
        '<header class="detail-hero">' +
          '<p class="detail-kicker">' + g.esc(s.coverage.type) + ' · ' + g.esc(s.benefit.type) + '</p>' +
          '<h2>' + g.esc(s.name) + '</h2>' +
          '<p class="detail-auth">' + g.esc(s.administeringAuthority) + '</p>' +
          '<p class="detail-sum">' + g.esc(s.benefit.summary) + '</p>' +
          (s.intendedFor ? '<p class="detail-for">' + g.esc(s.intendedFor) + '</p>' : '') +
        '</header>' +

        '<section class="detail-sec"><h3>Eligibility</h3>' + elig + '</section>' +
        '<section class="detail-sec"><h3>How to apply</h3>' + apply + '</section>' +
        '<section class="detail-sec"><h3>Documents checklist</h3>' + docSec + '</section>' +
        '<section class="detail-sec"><h3>Sources</h3>' + srcSec + '</section>' +

        '<footer class="detail-foot">' +
          '<a class="btn" href="checklist.html?id=' + encodeURIComponent(s.id) + '">Build checklist</a>' +
          '<p class="prov">Rule results (ours), source transcription (our review) and the official decision (the authority) are three different things. Only the authority decides.</p>' +
        '</footer>' +
      '</article>';

      detailEl.addEventListener('change', function (e) {
        var inp = e.target.closest('input[data-doc]');
        if (inp) {
          var i = inp.getAttribute('data-doc');
          chk[i] = inp.checked;
          g.YPStore.setCheck(s.id, chk);
          var docProg = document.getElementById('docProgress');
          if (docProg) docProg.textContent = docs.filter(function (_, k) { return chk[k]; }).length + ' of ' + docs.length + ' ready';
        }
      });
    }).catch(function () {
      detailEl.innerHTML = '';
      detailEl.removeAttribute('aria-busy');
      if (statusEl) statusEl.textContent = 'Could not load scheme.';
    });
  });
})(window);