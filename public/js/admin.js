// Admin review: search official sites, add verified candidates, manage the dataset.
(function ($, g) {
  $(function () {
    if (!$('#ago').length) return;
    var domain = function () { return $('#adomain').val(); };

    function loadStats() {
      g.YPApi.schemes().done(function (data) {
        var list = data || [];
        var byCat = {};
        list.forEach(function (s) { var c = s.category || 'uncategorised'; byCat[c] = (byCat[c] || 0) + 1; });
        $('#adstats').text(list.length + ' record(s): ' +
          list.filter(function (s) { return s.domain === 'startup-funding'; }).length + ' startup, ' +
          list.filter(function (s) { return s.domain === 'health-coverage'; }).length + ' health · ' +
          list.filter(function (s) { return s.verificationStatus === 'verified'; }).length + ' verified · ' +
          list.filter(function (s) { return !(s.eligibilityRules || []).length; }).length + ' awaiting conditions');
        $('#acats').html(Object.keys(byCat).sort().map(function (c) {
          return '<span class="badge">' + g.esc(c) + ' · ' + byCat[c] + '</span>';
        }).join(''));
        $('#alist').html(list.map(function (s) {
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
        }).join(''));
      }).fail(function () { $('#adstats').text('Could not load the dataset.'); });
    }
    loadStats();

    $('#alist').on('click', '[data-edit]', function () { $(this).closest('.admin-rec').find('.admin-edit').prop('hidden', !$(this).closest('.admin-rec').find('.admin-edit').prop('hidden')); });
    $('#alist').on('click', '[data-save-edit]', function () {
      var id = $(this).attr('data-save-edit'), row = $(this).closest('.admin-rec');
      var payload = { id: id, name: row.find('input[id^="nm-"]').val(), description: row.find('textarea').val(), category: row.find('input[id^="ct-"]').val(), intendedFor: row.find('input[id^="if-"]').val() };
      $(this).prop('disabled', true).text('Saving…');
      $.post('/api/admin/update', JSON.stringify(payload), 'json')
        .done(function () { $('#astatus').text('Saved. ' + payload.name + ' updated.'); loadStats(); })
        .fail(function (x) { $('#astatus').text('Could not save: ' + ((x.responseJSON && x.responseJSON.error) || 'error')); });
    });
    $('#alist').on('click', '[data-verify]', function () {
      var id = $(this).attr('data-verify');
      var wasVerified = $(this).text().indexOf('Un-verify') === 0;
      $.post('/api/admin/update', JSON.stringify({ id: id, reviewed: !wasVerified }), 'json')
        .done(function () { $('#astatus').text(wasVerified ? 'Marked as needs-review.' : 'Marked verified — you confirmed you opened the source.'); loadStats(); })
        .fail(function () { $('#astatus').text('Could not update verification.'); });
    });

    $('#alist').on('click', '[data-rm]', function () {
      var id = $(this).attr('data-rm');
      if (!confirm('Remove this record from data/schemes.json?')) return;
      $.post('/api/admin/remove', JSON.stringify({ id: id }), 'json')
        .done(function (r) { $('#astatus').text('Removed. ' + r.total + ' record(s) left.'); loadStats(); })
        .fail(function (x) { $('#astatus').text('Could not remove: ' + ((x.responseJSON && x.responseJSON.error) || 'error')); });
    });

    $('#ago').on('click', function () {
      var btn = $(this);
      btn.prop('disabled', true);
      $('#astatus').html('<span class="load-dots" aria-hidden="true"><i></i><i></i><i></i></span> Searching official sites…');
      $('#aresults').html(g.ypSkel(2)).attr('aria-busy', 'true');
      $.ajax({
        url: '/api/admin/search?domain=' + encodeURIComponent(domain()) + '&site=' + encodeURIComponent($('#asite').val()),
        method: 'GET', dataType: 'json', timeout: 25000
      })
        .done(function (res) {
          btn.prop('disabled', false);
          $('#aresults').removeAttr('aria-busy');
          $('#astatus').text((res.note || '') + (res.searched ? '  —  source: ' + res.searched : ''));
          var list = res.results || [];
          if (!list.length) { $('#aresults').html('<div class="alert">No candidates returned.</div>'); return; }
          $('#aresults').html(list.map(function (r) {
            return '<article class="card admin-card">' +
              '<h3>' + g.esc(r.title) + '</h3>' +
              '<p><span class="badge ' + (r.official ? 'match' : 'nomatch') + '">' + (r.official ? 'Official domain' : 'Not official') + '</span> <span class="meta">' + g.esc(r.host) + '</span></p>' +
              '<p class="meta">' + g.esc(r.snippet || '') + '</p>' +
              '<p><a href="' + g.esc(r.link) + '" target="_blank" rel="noopener">Open original source</a></p>' +
              (r.official ? '<p><button class="btn small" data-add data-name="' + g.esc(r.title) + '" data-url="' + g.esc(r.link) + '" data-snip="' + g.esc(r.snippet || '') + '">Add to dataset</button></p>' : '') +
              '</article>';
          }).join(''));
        })
        .fail(function () {
          btn.prop('disabled', false);
          $('#aresults').empty().removeAttr('aria-busy');
          $('#astatus').text('Search unavailable (key missing, quota, or timeout).');
        });
    });

    $('#aresults').on('click', '[data-add]', function () {
      var btn = $(this);
      btn.prop('disabled', true).text('Adding…');
      $.post('/api/admin/add', JSON.stringify({
        name: btn.attr('data-name'),
        url: btn.attr('data-url'),
        domain: domain(),
        summary: btn.attr('data-snip')
      }), 'json')
        .done(function (r) {
          btn.text('Added ✓');
          $('#astatus').text('Added "' + r.added.name + '" as conditions-not-verified. Dataset now has ' + r.total + ' record(s).');
          loadStats();
        })
        .fail(function (x) {
          btn.prop('disabled', false).text('Add to dataset');
          $('#astatus').text('Could not add: ' + ((x.responseJSON && x.responseJSON.error) || 'error'));
        });
    });
  });
})(jQuery, window);