// Results: fetch schemes via AJAX, run rules locally, render + AND filters/sort.
(function ($, g) {
  var LABEL = { 'potential-match': ['Potential match', 'match'], 'needs-info': ['Needs more information', 'info'], 'does-not-match': ['Does not match known rules', 'nomatch'], 'rules-pending': ['Conditions not yet verified', 'na'] };
  $(function () {
    if (!$('#results').length) return;
    var saved = g.YPStore.getAnswers();
    var domain = new URLSearchParams(location.search).get('domain') || saved.domain || g.YPStore.getLastDomain() || 'startup-funding';
    var answers = saved;
    if (answers.domain !== domain) answers = $.extend({ domain: domain }, g.YPStore.getDraft(domain));
    $('#editBtn').attr('href', 'questionnaire.html?domain=' + encodeURIComponent(domain));
    $('#status').text('Loading schemes…');
    $('#results').html(g.ypSkel(3)).attr('aria-busy', 'true');
    g.YPApi.schemes(domain).done(function (data) {
      $('#results').removeAttr('aria-busy');
      if (!Array.isArray(data)) { $('#results').empty(); $('#status').text('Invalid data from server.'); return; }
      var evaluated = g.YPRules.rank(data.map(function (s) { return g.YPRules.evaluate(s, answers); }));
      if (!evaluated.length) {
        $('#results').removeAttr('aria-busy')
          .html('<div class="alert">No current record matched. <a href="questionnaire.html?domain=' + encodeURIComponent(domain) + '">Revise answers</a> or check official sources — this does not mean no government support exists.</div>');
        $('#status').text('No records in this dataset.');
        return;
      }
      window._yp = { all: evaluated, visible: null, answers: answers, ai: null };
      rankWithAi(true);
    }).fail(function () { $('#results').empty().removeAttr('aria-busy'); $('#status').text('Could not load schemes. Check the server is running (node server.js) and retry.'); });
    $('#fStatus,#fBenefit,#fCoverage').on('change', applyFilters);
    $('#sort').on('change', applyFilters);
    function applyFilters() {
      var fs = $('#fStatus').val(), fb = $('#fBenefit').val(), fc = $('#fCoverage').val();
      var list = baseList().filter(function (r) {
        return (fs === 'all' || r.status === fs) && (fb === 'all' || r.scheme.benefit.type === fb) && (fc === 'all' || r.scheme.coverage.type === fc);
      });
      if ($('#sort').val() === 'name') list = list.slice().sort(function (a, b) { return a.scheme.name.localeCompare(b.scheme.name); });
      render(list);
    }
    function card(r, answers) {
      var id = r.scheme.id;
      var savedList = g.YPStore.getSaved ? g.YPStore.getSaved() : [];
      var isSaved = savedList.indexOf(id) > -1;
      var ai = window._yp && window._yp.ai && window._yp.ai[id];
      var score = ai ? Math.max(0, Math.min(100, Math.round(ai.score))) : null;
      var scoreBlock = '<div class="rc-score"><span class="score-val">' + (score === null ? '—' : score) + '</span>' +
        '<span class="score-label">AI relevance</span></div>' +
        '<div class="score-bar"><i style="width:' + (score === null ? 0 : score) + '%"></i></div>';
      var verify = r.scheme.verificationStatus === 'verified'
        ? '<p class="rc-verify"><span class="dot-ok"></span> Verified ' + g.esc(r.scheme.lastVerified) + '</p>' : '';
      var next = r.unknown.length && r.unknown[0].rule.unknownNextStep
        ? '<p class="rc-next"><span class="next-tag">Next</span>' + g.esc(r.unknown[0].rule.unknownNextStep) + '</p>' : '';
      return '<article class="card result-card">' +
        '<div class="rc-top">' + scoreBlock + '<div class="rc-top-right"><span class="rc-meta">' + g.esc(r.scheme.coverage.type) + ' · ' + g.esc(r.scheme.benefit.type) + '</span>' +
        '<button class="icon-btn' + (isSaved ? ' is-saved' : '') + '" data-save="' + g.esc(r.scheme.id) + '" aria-label="Save ' + g.esc(r.scheme.name) + '" aria-pressed="' + (isSaved ? 'true' : 'false') + '">' +
        '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5h8v11l-4-3-4 3v-11z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg></button></div></div>' +
        '<h3 class="rc-title">' + g.esc(r.scheme.name) + '</h3>' +
        '<p class="rc-auth">' + g.esc(r.scheme.administeringAuthority) + '</p>' +
        '<p class="rc-sum">' + g.esc(r.scheme.benefit.summary) + '</p>' +
        (r.scheme.intendedFor ? '<p class="rc-for"><b>For</b> ' + g.esc(r.scheme.intendedFor) + '</p>' : '') +
        verify + next +
        '<div class="rc-actions">' +
        '<a class="btn small" href="scheme-details.html?id=' + encodeURIComponent(r.scheme.id) + '">Deep dive into</a>' +
        '<button class="btn small ghost" data-cmp="' + g.esc(r.scheme.id) + '">Compare</button></div></article>';
    }
    function render(list) {
      var a = (window._yp && window._yp.answers) || {};
      $('#results').html(list.map(function (r) { return card(r, a); }).join('') || '<div class="alert">Nothing matches these filters. <button class="btn small ghost" id="clearF">Clear filters</button> <a href="questionnaire.html?domain=' + encodeURIComponent(domain) + '">Revise answers</a>.</div>');
    }
    // Show only schemes the AI scored at or above this threshold.
var AI_MIN = 60;
    // `visible` is what the user sees and what the filters operate on.
    // `all` is every record in the pathway.
    g.YPResults = {
      applyAiOrder: function (map) {
        if (!window._yp) return;
        var list = window._yp.all.slice();
        if (map) {
          list = list.filter(function (r) { var a = map[r.scheme.id]; return a && a.score >= AI_MIN; });
          list.sort(function (x, y) { return map[y.scheme.id].score - map[x.scheme.id].score; });
        } else {
          list = g.YPRules.rank(list);
        }
        window._yp.visible = list;
        applyFilters();
      }
    };
    function baseList() { return (window._yp && window._yp.visible) ? window._yp.visible : []; }
    function rankWithAi(auto) {
      // Only a loading skeleton is visible while scoring — no schemes until the AI replies.
      $('#results').html(g.ypSkel(3)).attr('aria-busy', 'true');
      $('#status').html('<span class="load-dots" aria-hidden="true"><i></i><i></i><i></i></span> Scoring your schemes…');
      var answers = $.extend({}, window._yp.answers, { domain: domain });
      $.ajax({ url: '/api/ai/suggest', method: 'POST', contentType: 'application/json', data: JSON.stringify({ domain: domain, answers: answers }), dataType: 'json', timeout: 40000 })
        .done(function (r) {
          if (!r.configured) {
            $('#results').removeAttr('aria-busy');
            $('#status').text('');
            g.YPResults.applyAiOrder(null);
            return;
          }
          var map = {};
          (r.ranked || []).forEach(function (x) { map[x.id] = x; });
          window._yp.ai = map;
          $('#results').removeAttr('aria-busy');
          g.YPResults.applyAiOrder(map);
          var kept = baseList().length;
          $('#status').text('Showing ' + kept + ' of ' + window._yp.all.length + ' schemes with AI relevance ' + AI_MIN + '+. Scores are relevance, not eligibility.');
          var top = (r.ranked || []).filter(function (x) { return x.score >= AI_MIN; })[0];
          if (top) $('#filterNote').html('Most relevant: <b>' + g.esc(top.name) + '</b>' + (top.verify ? ' &mdash; check: ' + g.esc(top.verify) : '') + '. Filters below apply to these ' + kept + ' schemes.');
        })
        .fail(function (xhr) {
          var j = xhr.responseJSON || {};
          if (xhr.status === 429) {
            var wait = j.retryAfter || 10;
            $('#status').text('Free-tier rate limit — retrying in ' + wait + 's…');
            if (auto) setTimeout(rankWithAi, (wait + 1) * 1000);
            return;
          }
          $('#results').removeAttr('aria-busy');
          $('#status').text('');
          g.YPResults.applyAiOrder(null);
        });
    }
    $('#results').on('click', '#clearF', function () { $('#fStatus,#fBenefit,#fCoverage').val('all'); applyFilters(); });
    $('#results').on('click', '[data-save]', function () {
      var btn = $(this);
      var list = g.YPStore.toggleSaved(btn.attr('data-save')) || [];
      var on = list.indexOf(btn.attr('data-save')) > -1;
      btn.toggleClass('is-saved', on).attr('aria-pressed', on ? 'true' : 'false');
    });
    $('#results').on('click', '[data-cmp]', function () {
      if (g.YPCompare) g.YPCompare.open($(this).attr('data-cmp'));
    });
  });
})(jQuery, window);
