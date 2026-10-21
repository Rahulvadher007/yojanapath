// Admin review: search official sites, add verified candidates, manage the dataset.
(function (g) {
  function onReady(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  onReady(function () {
    var agoBtn = document.getElementById('ago');
    if (!agoBtn) return;
    var domain = function () {
      var ad = document.getElementById('adomain');
      return ad ? ad.value : 'startup-funding';
    };

    var adstats = document.getElementById('adstats');
    var acats = document.getElementById('acats');
    var alist = document.getElementById('alist');
    var astatus = document.getElementById('astatus');
    var aresults = document.getElementById('aresults');

    function loadStats() {
      g.YPApi.schemes().then(function (data) {
        var list = data || [];
        var byCat = {};
        list.forEach(function (s) { var c = s.category || 'uncategorised'; byCat[c] = (byCat[c] || 0) + 1; });
        if (adstats) {
          adstats.textContent = list.length + ' record(s): ' +
            list.filter(function (s) { return s.domain === 'startup-funding'; }).length + ' startup, ' +
            list.filter(function (s) { return s.domain === 'health-coverage'; }).length + ' health · ' +
            list.filter(function (s) { return s.verificationStatus === 'verified'; }).length + ' verified · ' +
            list.filter(function (s) { return !(s.eligibilityRules || []).length; }).length + ' awaiting conditions';
        }
        if (acats) {
          acats.innerHTML = Object.keys(byCat).sort().map(function (c) {
            return '<span class="badge">' + g.esc(c) + ' · ' + byCat[c] + '</span>';
          }).join('');
        }
        if (alist) {
          alist.innerHTML = list.map(function (s) {
            var hasRules = (s.eligibilityRules || []).length > 0;
            return '<div class="admin-rec" data-id="' + g.esc(s.id) + '">' +
              '<div class="admin-row">' +
              '<span class="badge ' + (hasRules ? 'match' : 'na') + '">' + (hasRules ? 'Has rules' : 'No rules yet') + '</span>' +
              '<span class="badge ' + (s.verificationStatus === 'verified' ? 'verify' : 'info') + '">' + g.esc(s.verificationStatus) + '</span>' +
              '<span class="admin-name">' + g.esc(s.name) + '</span>' +
              '<span class="admin-cat">' + g.esc(s.category || 'uncategorised') + '</span>' +
              '<button class="btn small ghost" data-edit>Edit</button>' +
              '<button class="btn small ghost" data-rm="' + g.esc(s.id) + '">Remove</button></div>' +
              '<p class="admin-desc">' + g.esc((s.benefit && s.benefit.summary) || 'No description yet — use Edit to add one.') + '</p>' +
              '<p class="admin-host">' + g.esc(String(s.officialInfoUrl || '').replace(/^https?:\/\//, '')) + '</p>' +
              '<form class="admin-edit" hidden>' +
              '<label for="nm-' + g.esc(s.id) + '">Scheme name</label>' +
              '<input id="nm-' + g.esc(s.id) + '" type="text" value="' + g.esc(s.name) + '">' +
              '<label for="ds-' + g.esc(s.id) + '">Description shown to users</label>' +
              '<textarea id="ds-' + g.esc(s.id) + '" rows="3">' + g.esc((s.benefit && s.benefit.summary) || '') + '</textarea>' +
              '<label for="ct-' + g.esc(s.id) + '">Category</label>' +
              '<input id="ct-' + g.esc(s.id) + '" type="text" value="' + g.esc(s.category || '') + '">' +
              '<label for="if-' + g.esc(s.id) + '">Who it is for</label>' +
              '<input id="if-' + g.esc(s.id) + '" type="text" value="' + g.esc(s.intendedFor || '') + '">' +
              '<p><button class="btn small" type="button" data-save-edit="' + g.esc(s.id) + '">Save changes</button> ' +
              '<button class="btn small ghost" type="button" data-verify="' + g.esc(s.id) + '">' + (s.verificationStatus === 'verified' ? 'Un-verify' : 'Mark verified (I checked the source)') + '</button></p>' +
              '</form></div>';
          }).join('');
        }
      }).catch(function () {
        if (adstats) adstats.textContent = 'Could not load the dataset.';
      });
    }
    loadStats();

    if (alist) {
      alist.addEventListener('click', function (e) {
        var editBtn = e.target.closest('[data-edit]');
        if (editBtn) {
          var rec = editBtn.closest('.admin-rec');
          var editForm = rec.querySelector('.admin-edit');
          if (editForm) editForm.hidden = !editForm.hidden;
          return;
        }

        var saveEditBtn = e.target.closest('[data-save-edit]');
        if (saveEditBtn) {
          var id = saveEditBtn.getAttribute('data-save-edit');
          var row = saveEditBtn.closest('.admin-rec');
          var nameInput = row.querySelector('input[id^="nm-"]');
          var descText = row.querySelector('textarea');
          var catInput = row.querySelector('input[id^="ct-"]');
          var forInput = row.querySelector('input[id^="if-"]');
          var payload = {
            id: id,
            name: nameInput ? nameInput.value : '',
            description: descText ? descText.value : '',
            category: catInput ? catInput.value : '',
            intendedFor: forInput ? forInput.value : ''
          };
          saveEditBtn.disabled = true;
          saveEditBtn.textContent = 'Saving…';
          fetch('/api/admin/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
          .then(function (res) {
            if (!res.ok) {
              return res.json().catch(function () { return {}; }).then(function (x) { throw x; });
            }
            return res.json();
          })
          .then(function () {
            if (astatus) astatus.textContent = 'Saved. ' + payload.name + ' updated.';
            loadStats();
          })
          .catch(function (x) {
            saveEditBtn.disabled = false;
            saveEditBtn.textContent = 'Save changes';
            if (astatus) astatus.textContent = 'Could not save: ' + (x.error || 'error');
          });
          return;
        }

        var verifyBtn = e.target.closest('[data-verify]');
        if (verifyBtn) {
          var id = verifyBtn.getAttribute('data-verify');
          var wasVerified = verifyBtn.textContent.indexOf('Un-verify') === 0;
          fetch('/api/admin/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id, reviewed: !wasVerified })
          })
          .then(function (res) {
            if (!res.ok) throw new Error();
            return res.json();
          })
          .then(function () {
            if (astatus) astatus.textContent = wasVerified ? 'Marked as needs-review.' : 'Marked verified — you confirmed you opened the source.';
            loadStats();
          })
          .catch(function () {
            if (astatus) astatus.textContent = 'Could not update verification.';
          });
          return;
        }

        var rmBtn = e.target.closest('[data-rm]');
        if (rmBtn) {
          var id = rmBtn.getAttribute('data-rm');
          if (!confirm('Remove this record from data/schemes.json?')) return;
          fetch('/api/admin/remove', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
          })
          .then(function (res) {
            if (!res.ok) {
              return res.json().catch(function () { return {}; }).then(function (x) { throw x; });
            }
            return res.json();
          })
          .then(function (r) {
            if (astatus) astatus.textContent = 'Removed. ' + r.total + ' record(s) left.';
            loadStats();
          })
          .catch(function (x) {
            if (astatus) astatus.textContent = 'Could not remove: ' + (x.error || 'error');
          });
          return;
        }
      });
    }

    agoBtn.addEventListener('click', function () {
      agoBtn.disabled = true;
      if (astatus) astatus.innerHTML = '<span class="load-dots" aria-hidden="true"><i></i><i></i><i></i></span> Searching official sites…';
      if (aresults) {
        aresults.innerHTML = g.ypSkel(2);
        aresults.setAttribute('aria-busy', 'true');
      }

      var siteInput = document.getElementById('asite');
      var siteVal = siteInput ? siteInput.value : '';
      var controller = new AbortController();
      var timer = setTimeout(function () { controller.abort(); }, 25000);

      fetch('/api/admin/search?domain=' + encodeURIComponent(domain()) + '&site=' + encodeURIComponent(siteVal), {
        signal: controller.signal
      })
      .then(function (res) {
        clearTimeout(timer);
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(function (res) {
        agoBtn.disabled = false;
        if (aresults) aresults.removeAttribute('aria-busy');
        if (astatus) astatus.textContent = (res.note || '') + (res.searched ? '  —  source: ' + res.searched : '');
        var list = res.results || [];
        if (!list.length) {
          if (aresults) aresults.innerHTML = '<div class="alert">No candidates returned.</div>';
          return;
        }
        if (aresults) {
          aresults.innerHTML = list.map(function (r) {
            return '<article class="card admin-card">' +
              '<h3>' + g.esc(r.title) + '</h3>' +
              '<p><span class="badge ' + (r.official ? 'match' : 'nomatch') + '">' + (r.official ? 'Official domain' : 'Not official') + '</span> <span class="meta">' + g.esc(r.host) + '</span></p>' +
              '<p class="meta">' + g.esc(r.snippet || '') + '</p>' +
              '<p><a href="' + g.esc(r.link) + '" target="_blank" rel="noopener">Open original source</a></p>' +
              (r.official ? '<p><button class="btn small" data-add data-name="' + g.esc(r.title) + '" data-url="' + g.esc(r.link) + '" data-snip="' + g.esc(r.snippet || '') + '">Add to dataset</button></p>' : '') +
              '</article>';
          }).join('');
        }
      })
      .catch(function () {
        agoBtn.disabled = false;
        if (aresults) {
          aresults.innerHTML = '';
          aresults.removeAttribute('aria-busy');
        }
        if (astatus) astatus.textContent = 'Search unavailable (key missing, quota, or timeout).';
      });
    });

    if (aresults) {
      aresults.addEventListener('click', function (e) {
        var addBtn = e.target.closest('[data-add]');
        if (addBtn) {
          addBtn.disabled = true;
          addBtn.textContent = 'Adding…';
          fetch('/api/admin/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: addBtn.getAttribute('data-name'),
              url: addBtn.getAttribute('data-url'),
              domain: domain(),
              summary: addBtn.getAttribute('data-snip')
            })
          })
          .then(function (res) {
            if (!res.ok) {
              return res.json().catch(function () { return {}; }).then(function (x) { throw x; });
            }
            return res.json();
          })
          .then(function (r) {
            addBtn.textContent = 'Added ✓';
            if (astatus) astatus.textContent = 'Added "' + r.added.name + '" as conditions-not-verified. Dataset now has ' + r.total + ' record(s).';
            loadStats();
          })
          .catch(function (x) {
            addBtn.disabled = false;
            addBtn.textContent = 'Add to dataset';
            if (astatus) astatus.textContent = 'Could not add: ' + (x.error || 'error');
          });
        }
      });
    }
  });
})(window);