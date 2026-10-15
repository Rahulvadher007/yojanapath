// Compare drawer: pick a starting scheme, tick others from the current 60+ set,
// confirm to get a side-by-side feature matrix with tick marks.
(function ($, g) {
  var MAX_COLS = 5;
  var sourceId = null;
  var picked = {};
  var view = 'pick';
  var lastFocus = null;

  // Every row is computed from real record fields — nothing is invented.
  var FEATURES = [
    { label: 'Cashless treatment cover', hint: 'benefit.type = health-cover', test: function (s) { return s.benefit.type === 'health-cover'; } },
    { label: 'Loan or credit support', hint: 'benefit.type = loan', test: function (s) { return s.benefit.type === 'loan'; } },
    { label: 'Grant or seed support', hint: 'grant, seed-funding, fund-of-funds', test: function (s) { return ['grant', 'seed-funding', 'fund-of-funds'].indexOf(s.benefit.type) > -1; } },
    { label: 'Advisory or guidance only', hint: 'benefit.type = advisory', test: function (s) { return s.benefit.type === 'advisory'; } },
    { label: 'Pan-India (central)', hint: 'coverage.type = central', test: function (s) { return s.coverage.type === 'central'; } },
    { label: 'State-specific', hint: 'coverage.type = state', test: function (s) { return s.coverage.type === 'state'; } },
    { label: 'Eligibility rules stored', hint: 'checkable rules present', test: function (s) { return (s.eligibilityRules || []).length > 0; } },
    { label: 'Documents listed', hint: 'documents array populated', test: function (s) { return (s.documents || []).length > 0; } },
    { label: 'Source verified', hint: 'verificationStatus = verified', test: function (s) { return s.verificationStatus === 'verified'; } }
  ];

  var TEXT_ROWS = [
    { label: 'Benefit', get: function (s) { return s.benefit.type; } },
    { label: 'Coverage', get: function (s) { return s.coverage.type; } },
    { label: 'Authority', get: function (s) { return s.administeringAuthority; } }
  ];

  function rec(id) {
    var all = (window._yp && window._yp.all) || [];
    for (var i = 0; i < all.length; i++) if (all[i].scheme.id === id) return all[i].scheme;
    return null;
  }
  function pool() {
    var vis = (window._yp && window._yp.visible) || [];
    return vis.map(function (r) { return r.scheme; }).filter(function (s) { return s.id !== sourceId; });
  }
  function scoreOf(id) {
    var m = window._yp && window._yp.ai;
    return m && m[id] ? Math.round(m[id].score) : null;
  }
  function tick(on) {
    return on
      ? '<span class="tick on" role="img" aria-label="Included"><svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2.5 7.4l3 3 6-6.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>'
      : '<span class="tick off" role="img" aria-label="Not included">&mdash;</span>';
  }

  function build() {
    var src = rec(sourceId);
    if (!src) return;
    var d = $('#cmpDrawer'), b = $('#cmpBody'), f = $('#cmpFoot');
    if (view === 'pick') {
      var opts = pool();
      d.find('.cmp-sub').text('Choose up to ' + (MAX_COLS - 1) + ' more from your ' + opts.length + ' matching schemes.');
      var n = Object.keys(picked).filter(function (k) { return picked[k]; }).length;
      var full = n >= MAX_COLS - 1;
      b.html('<div class="cmp-inner">' +
        '<div class="cmp-src">' +
        '<p class="cmp-sec">Starting from</p>' +
        '<div class="cmp-src-card">' +
        '<div class="cmp-src-top"><span class="score-val sm">' + (scoreOf(src.id) === null ? '—' : scoreOf(src.id)) + '</span><span class="score-label">AI relevance</span></div>' +
        '<h3>' + g.esc(src.name) + '</h3>' +
        '<p>' + g.esc(src.administeringAuthority) + '</p>' +
        '</div>' +
        '</div>' +
        '<div class="cmp-sec-row"><p class="cmp-sec">Add schemes to compare</p>' +
        '<span class="cmp-counter">' + n + ' of ' + (MAX_COLS - 1) + ' selected</span></div>' +
        (opts.length
          ? '<ul class="cmp-opts">' + opts.map(function (s) {
              var on = !!picked[s.id];
              var dis = !on && full;
              var sc = scoreOf(s.id);
              return '<li><label class="cmp-opt' + (on ? ' on' : '') + (dis ? ' is-off' : '') + '">' +
                '<input type="checkbox" data-pick="' + g.esc(s.id) + '"' + (on ? ' checked' : '') + (dis ? ' disabled' : '') + '>' +
                '<span class="cmp-opt-main">' +
                '<span class="cmp-opt-name">' + g.esc(s.name) + '</span>' +
                '<span class="cmp-opt-meta">' + g.esc(s.coverage.type) + ' · ' + g.esc(s.benefit.type) + '</span>' +
                '</span>' +
                '<span class="cmp-opt-side"><span class="score-val xs">' + (sc === null ? '—' : sc) + '</span>' +
                '<span class="opt-bar"><i style="width:' + (sc === null ? 0 : sc) + '%"></i></span></span>' +
                '</label></li>';
            }).join('') + '</ul>' +
            (full ? '<p class="cmp-limit">Maximum of ' + MAX_COLS + ' schemes reached. Deselect one to swap it out.</p>' : '')
          : '<p class="cmp-empty">No other schemes in the current results to compare.</p>') +
        '</div>');
      f.html('<span class="cmp-count">' + (n ? n + ' selected' : 'None selected') + '</span>' +
        '<button class="btn small" id="cmpConfirm"' + (n ? '' : ' disabled') + '>Compare ' + (n ? n + ' scheme' + (n > 1 ? 's' : '') : '') + '</button>');
    } else {
      var cols = [src].concat(Object.keys(picked).filter(function (k) { return picked[k]; }).map(rec).filter(Boolean));
      d.find('.cmp-sub').text('Comparing ' + cols.length + ' schemes side by side.');
      b.html('<div class="cmp-inner"><div class="cmp-scroll"><table class="cmp-table">' +
        '<thead><tr><th class="cmp-corner">Property</th>' + cols.map(function (s, i) {
          return '<th><span class="cmp-col-tag">' + (i === 0 ? 'Starting from' : 'Selected') + '</span>' +
            '<span class="cmp-col-name">' + g.esc(s.name) + '</span></th>';
        }).join('') + '</tr></thead><tbody>' +
        TEXT_ROWS.map(function (r) {
          return '<tr class="cmp-trow"><th>' + r.label + '</th>' + cols.map(function (s) {
            return '<td>' + g.esc(r.get(s)) + '</td>';
          }).join('') + '</tr>';
        }).join('') +
        FEATURES.map(function (f) {
          var hits = cols.map(function (s) { return !!f.test(s); });
          var same = hits.every(function (h) { return h === hits[0]; });
          return '<tr class="' + (same ? 'cmp-unanimous' : '') + '"><th>' + f.label + '<span class="cmp-hint">' + g.esc(f.hint) + '</span></th>' + cols.map(function (s, ci) {
            return '<td>' + tick(hits[ci]) + '</td>';
          }).join('') + '</tr>';
        }).join('') +
        '</tbody></table></div></div>');
      f.html('<button class="btn small ghost" id="cmpBack">Choose different schemes</button>' +
        '<button class="btn small" id="cmpDone">Done</button>');
    }
  }

  function open(id) {
    sourceId = id;
    picked = {};
    view = 'pick';
    lastFocus = document.activeElement;
    $('#cmpOverlay').addClass('on');
    $('#cmpDrawer').addClass('on').attr('aria-hidden', 'false');
    $('body').addClass('drawer-open');
    build();
    $('#cmpBody input').first().trigger('focus');
  }
  function close() {
    $('#cmpOverlay').removeClass('on');
    $('#cmpDrawer').removeClass('on').attr('aria-hidden', 'true');
    $('body').removeClass('drawer-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  $(function () {
    $('#cmpOverlay,#cmpClose,#cmpDone').on('click', close);
    $('#cmpBody').on('change', 'input[data-pick]', function () {
      var id = $(this).attr('data-pick');
      var n = Object.keys(picked).filter(function (k) { return picked[k]; }).length;
      if (this.checked && n >= MAX_COLS - 1) { this.checked = false; return; }
      if (this.checked) picked[id] = true; else delete picked[id];
      build();
    });
    $('#cmpFoot').on('click', '#cmpConfirm', function () { view = 'matrix'; build(); });
    $('#cmpFoot').on('click', '#cmpBack', function () { view = 'pick'; build(); });
    $(document).on('keydown', function (e) { if (e.key === 'Escape' && $('#cmpDrawer').hasClass('on')) close(); });

    g.YPCompare = { open: open, close: close };
  });
})(jQuery, window);