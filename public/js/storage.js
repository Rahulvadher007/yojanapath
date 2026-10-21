// localStorage helpers. Stores IDs only, never sensitive data.
(function (g) {
  function read(key, fb) { try { var v = JSON.parse(localStorage.getItem(key)); return v === null || v === undefined ? fb : v; } catch { return fb; } }
  function write(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} }
  var K = { saved: 'yojanapath.savedSchemeIds', compare: 'yojanapath.compareSchemeIds', draft: 'yojanapath.questionnaireDraft', answers: 'yojanapath.lastAnswers', check: 'yojanapath.checklist', lastDomain: 'yojanapath.lastDomain' };
  // Single source of truth for how many schemes can be compared at once. The compare
  // drawer and the standalone compare page both read this, so the two cannot disagree.
  var MAX_COMPARE = 5;
  g.YPStore = {
    MAX_COMPARE: MAX_COMPARE,
    getSaved: function () { return read(K.saved, []); },
    toggleSaved: function (id) { var l = read(K.saved, []); l = l.indexOf(id) > -1 ? l.filter(function (x) { return x !== id; }) : l.concat([id]); write(K.saved, l); return l; },
    getCompare: function () { return read(K.compare, []); },
    setCompare: function (ids) { write(K.compare, ids || []); return ids || []; },
    toggleCompare: function (id) { var l = read(K.compare, []); if (l.indexOf(id) > -1) l = l.filter(function (x) { return x !== id; }); else { if (l.length >= MAX_COMPARE) return { list: l, limited: true }; l.push(id); } write(K.compare, l); return { list: l }; },
    getDraft: function (d) { return read(K.draft + '.' + d, {}); },
    setDraft: function (d, v) { write(K.draft + '.' + d, v); },
    getAnswers: function () { return read(K.answers, {}); },
    setAnswers: function (v) { write(K.answers, v); },
    getCheck: function (id) { return read(K.check + '.' + id, {}); },
    setCheck: function (id, v) { write(K.check + '.' + id, v); },
    getLastDomain: function () { return read(K.lastDomain, ''); },
    setLastDomain: function (v) { write(K.lastDomain, v); },
    resetDemo: function () { try { Object.keys(localStorage).filter(function (k) { return k.indexOf('yojanapath.') === 0; }).forEach(function (k) { localStorage.removeItem(k); }); } catch {} }
  };
})(window);
