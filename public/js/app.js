// Shared header/footer + safe text escaping.
(function (g) {
  function onReady(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  onReady(function () {
    // Back control lives in the page, not the navbar — skipped on the landing page.
    var isHome = /(^|\/)index\.html$/.test(location.pathname) || /\/$/.test(location.pathname);
    if (!isHome) {
      var back = '<nav class="crumbs" aria-label="Back"><button type="button" class="link-back" id="pageBack"><svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg> Back</button></nav>';
      var m = document.getElementById('main');
      if (m) {
        if (m.classList.contains('wrap')) {
          m.insertAdjacentHTML('afterbegin', back);
        } else {
          m.insertAdjacentHTML('afterbegin', '<div class="wrap page-back">' + back + '</div>');
        }
      }
      var pageBack = document.getElementById('pageBack');
      if (pageBack) {
        pageBack.addEventListener('click', function () {
          if (document.referrer && history.length > 1) history.back();
          else location.href = 'index.html';
        });
      }
    }
    var menuBtn = document.getElementById('menuBtn');
    if (menuBtn) {
      menuBtn.addEventListener('click', function () {
        var nav = document.querySelector('nav.main');
        if (nav) {
          var open = nav.classList.toggle('open');
          menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        }
      });
      // Vector menu icon (consistent, themeable); hide from AT as label sits on the button.
      menuBtn.innerHTML = '<svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true"><path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
    }

    document.addEventListener('keydown', function (e) {
      var nav = document.querySelector('nav.main');
      if (e.key === 'Escape' && nav && nav.classList.contains('open')) {
        nav.classList.remove('open');
        if (menuBtn) {
          menuBtn.setAttribute('aria-expanded', 'false');
          menuBtn.focus();
        }
      }
    });

    // Active nav state from current page (action buttons are not nav locations).
    var page = (location.pathname.split('/').pop() || 'index.html').split('?')[0];
    document.querySelectorAll('nav.main a').forEach(function (el) {
      var href = el.getAttribute('href') || '';
      if (el.classList.contains('btn')) return;
      if (href.split('?')[0] === page) el.setAttribute('aria-current', 'page');
    });
  });

  // Skeleton placeholder (stable layout while AJAX loads; pair with aria-busy).
  g.ypSkel = function (n) {
    var h = '';
    for (var i = 0; i < (n || 3); i++) h += '<div class="skel" aria-hidden="true"><i class="w60"></i><i class="w80"></i><i class="w40"></i></div>';
    return h;
  };
  // Wide data tables scroll horizontally instead of breaking the layout.
  g.ypTable = function (html) { return '<div class="table-scroll">' + html + '</div>'; };
  g.esc = function (s) { return String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  // Evidence-based condition explanation: requirement, answer, verdict, evidence, next action.
  g.ypStateLabel = function (st) { return st === 'met' ? 'Matched' : st === 'not_met' ? 'Not matched' : st === 'unknown' ? 'Needs confirmation' : 'Not applicable'; };
  g.ypStateClass = function (st) { return st === 'met' ? 'match' : st === 'not_met' ? 'nomatch' : st === 'not_applicable' ? 'na' : 'info'; };
  g.ypAnswerText = function (v) { return (v === undefined || v === null || v === '') ? 'Not sure / skipped' : String(v); };
  g.ypCond = function (x, answerVal) {
    var r = x.rule, cls = g.ypStateClass(x.status);
    var h = '<li><span class="badge ' + cls + '">' + g.ypStateLabel(x.status) + '</span> <b>' + g.esc(r.description) + '</b><br>';
    h += '<span class="meta">Your answer: ' + g.esc(g.ypAnswerText(answerVal)) + '.</span>';
    if (r.sourceUrl) h += '<br><span class="meta">Evidence: <a href="' + g.esc(r.sourceUrl) + '" target="_blank" rel="noopener">official source</a> (checked ' + g.esc(r.sourceCheckedAt || 'unrecorded') + ').</span>';
    if (x.status === 'unknown' && r.unknownNextStep) h += '<br><span>Next step: ' + g.esc(r.unknownNextStep) + '</span>';
    if (x.status === 'not_met') h += '<br><span>Consequence: rules out this scheme under the known rules.</span>';
    return h + '</li>';
  };
  // Compact condition row, kept for the rule-evidence list on the details page.
  g.ypCondCompact = function (x, answerVal) {
    var r = x.rule;
    return '<li class="cond"><span class="badge ' + g.ypStateClass(x.status) + '">' + g.ypStateLabel(x.status) + '</span>' +
      '<span class="cond-text">' + g.esc(r.description) + '</span>' +
      '<span class="cond-ans">Your answer: <b>' + g.esc(g.ypAnswerText(answerVal)) + '</b></span></li>';
  };
})(window);
