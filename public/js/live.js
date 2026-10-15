// Live official-source search. Never alters the deterministic results above it —
// these are candidate links to verify, not eligibility decisions.
(function ($, g) {
  $(function () {
    if (!$('#liveBtn').length) return;
    var domain = new URLSearchParams(location.search).get('domain') || 'startup-funding';
    var a = g.YPStore.getAnswers();
    var qs = [
      'domain=' + encodeURIComponent(domain),
      'state=' + encodeURIComponent(a.state || ''),
      'stage=' + encodeURIComponent(a.businessStage || a.ageBand || ''),
      'purpose=' + encodeURIComponent(a.fundingPurpose || ''),
      'category=' + encodeURIComponent(a.beneficiaryCategory || '')
    ].join('&');

    $('#liveBtn').on('click', function () {
      var btn = $(this);
      btn.prop('disabled', true).addClass('is-loading');
      $('#liveStatus').html('<span class="load-dots" aria-hidden="true"><i></i><i></i><i></i></span> Searching official government sites…');
      $('#liveResults').html(g.ypSkel(3)).attr('aria-busy', 'true');
      $('#liveSummary').text('');

      $.ajax({ url: '/api/search/live?' + qs, method: 'GET', dataType: 'json', timeout: 20000 })
        .done(function (r) {
          $('#liveResults').removeAttr('aria-busy');
          btn.prop('disabled', false).removeClass('is-loading');
          if (!r.configured) {
            $('#liveStatus').text('');
            $('#liveResults').html('<div class="alert">' + g.esc(r.note) + '</div>');
            return;
          }
          var list = r.results || [];
          $('#liveStatus').text(list.length ? (list.length + ' page(s) found' + (r.cached ? ' · cached' : '')) : 'Nothing returned.');
          if (r.note) $('#liveSummary').text(r.note);
          if (!list.length) { $('#liveResults').html('<div class="alert">No pages returned for these answers. Try the official sites linked on each scheme above.</div>'); return; }
          $('#liveResults').html('<ul class="live-list">' + list.map(function (x) {
            return '<li class="live-item"><span class="badge ' + (x.official ? 'match' : 'nomatch') + '">' + (x.official ? 'Official' : 'Unverified domain') + '</span>' +
              '<a class="live-link" href="' + g.esc(x.link) + '" target="_blank" rel="noopener">' + g.esc(x.title) + '</a>' +
              '<span class="live-host">' + g.esc(x.domain) + '</span>' +
              (x.snippet ? '<span class="live-snip">' + g.esc(x.snippet) + '</span>' : '') + '</li>';
          }).join('') + '</ul>');
        })
        .fail(function (xhr) {
          $('#liveResults').removeAttr('aria-busy').empty();
          btn.prop('disabled', false).removeClass('is-loading');
          $('#liveStatus').text('');
          var msg = xhr.status === 502 ? 'Live search is unavailable or out of quota. The verified results above are unaffected.' : 'Live search failed. The verified results above are unaffected.';
          $('#liveResults').html('<div class="alert error">' + g.esc(msg) + '</div>');
        });
    });
  });
})(jQuery, window);