// Live official-source search. Never alters the deterministic results above it —
// these are candidate links to verify, not eligibility decisions.
(function (g) {
  function onReady(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  onReady(function () {
    var btn = document.getElementById('liveBtn');
    if (!btn) return;
    var domain = new URLSearchParams(location.search).get('domain') || 'startup-funding';
    var a = g.YPStore.getAnswers();
    var qs = [
      'domain=' + encodeURIComponent(domain),
      'state=' + encodeURIComponent(a.state || ''),
      'stage=' + encodeURIComponent(a.businessStage || a.ageBand || ''),
      'purpose=' + encodeURIComponent(a.fundingPurpose || ''),
      'category=' + encodeURIComponent(a.beneficiaryCategory || '')
    ].join('&');

    var liveStatus = document.getElementById('liveStatus');
    var liveResults = document.getElementById('liveResults');
    var liveSummary = document.getElementById('liveSummary');

    btn.addEventListener('click', function () {
      btn.disabled = true;
      btn.classList.add('is-loading');
      if (liveStatus) liveStatus.innerHTML = '<span class="load-dots" aria-hidden="true"><i></i><i></i><i></i></span> Searching official government sites…';
      if (liveResults) {
        liveResults.innerHTML = g.ypSkel(3);
        liveResults.setAttribute('aria-busy', 'true');
      }
      if (liveSummary) liveSummary.textContent = '';

      var controller = new AbortController();
      var timer = setTimeout(function () { controller.abort(); }, 20000);

      fetch('/api/search/live?' + qs, { signal: controller.signal })
        .then(function (res) {
          clearTimeout(timer);
          if (!res.ok) {
            var err = new Error('HTTP ' + res.status);
            err.status = res.status;
            throw err;
          }
          return res.json();
        })
        .then(function (r) {
          if (liveResults) liveResults.removeAttribute('aria-busy');
          btn.disabled = false;
          btn.classList.remove('is-loading');
          if (!r.configured) {
            if (liveStatus) liveStatus.textContent = '';
            if (liveResults) liveResults.innerHTML = '<div class="alert">' + g.esc(r.note) + '</div>';
            return;
          }
          var list = r.results || [];
          if (liveStatus) liveStatus.textContent = list.length ? (list.length + ' page(s) found' + (r.cached ? ' · cached' : '')) : 'Nothing returned.';
          if (r.note && liveSummary) liveSummary.textContent = r.note;
          if (!list.length) {
            if (liveResults) liveResults.innerHTML = '<div class="alert">No pages returned for these answers. Try the official sites linked on each scheme above.</div>';
            return;
          }
          if (liveResults) {
            liveResults.innerHTML = '<ul class="live-list">' + list.map(function (x) {
              return '<li class="live-item"><span class="badge ' + (x.official ? 'match' : 'nomatch') + '">' + (x.official ? 'Official' : 'Unverified domain') + '</span>' +
                '<a class="live-link" href="' + g.esc(x.link) + '" target="_blank" rel="noopener">' + g.esc(x.title) + '</a>' +
                '<span class="live-host">' + g.esc(x.domain) + '</span>' +
                (x.snippet ? '<span class="live-snip">' + g.esc(x.snippet) + '</span>' : '') + '</li>';
            }).join('') + '</ul>';
          }
        })
        .catch(function (xhr) {
          if (liveResults) {
            liveResults.removeAttribute('aria-busy');
            liveResults.innerHTML = '';
          }
          btn.disabled = false;
          btn.classList.remove('is-loading');
          if (liveStatus) liveStatus.textContent = '';
          var msg = xhr.status === 502 ? 'Live search is unavailable or out of quota. The verified results above are unaffected.' : 'Live search failed. The verified results above are unaffected.';
          if (liveResults) liveResults.innerHTML = '<div class="alert error">' + g.esc(msg) + '</div>';
        });
    });
  });
})(window);