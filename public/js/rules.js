// Rule-based engine: met / not_met / unknown / not_applicable. No AI.
(function (g) {
  function evalRule(ans, rule) {
    var v = ans ? ans[rule.field] : undefined;
    if (v === undefined || v === null || v === '') return rule.required ? 'unknown' : 'not_applicable';
    switch (rule.operator) {
      case 'equals': return String(v) === String(rule.value) ? 'met' : 'not_met';
      case 'in': return Array.isArray(rule.value) && rule.value.map(String).indexOf(String(v)) > -1 ? 'met' : 'not_met';
      case 'gte': return Number(v) >= Number(rule.value) ? 'met' : 'not_met';
      case 'lte': return Number(v) <= Number(rule.value) ? 'met' : 'not_met';
      default: return 'unknown';
    }
  }
  function evaluate(scheme, answers) {
    var met = [], failed = [], unknown = [], na = [];
    var rules = scheme.eligibilityRules || [];
    (rules).forEach(function (r) {
      var s = evalRule(answers, r);
      var row = { rule: r, status: s };
      if (s === 'met') met.push(row);
      else if (s === 'not_met') failed.push(row);
      else if (s === 'unknown') unknown.push(row);
      else na.push(row);
    });
    // A record with no stored conditions proves nothing. Never let it read as a match.
    var status;
    if (!rules.length) status = 'rules-pending';
    else if (failed.length) status = 'does-not-match';
    else if (unknown.length) status = 'needs-info';
    else status = 'potential-match';
    return { scheme: scheme, status: status, met: met, failed: failed, unknown: unknown, na: na };
  }
  function rank(results) {
    var order = { 'potential-match': 0, 'needs-info': 1, 'rules-pending': 2, 'does-not-match': 3 };
    return results.slice().sort(function (a, b) {
      return (order[a.status] - order[b.status]) || String(a.scheme.name).localeCompare(String(b.scheme.name));
    });
  }
  g.YPRules = { evaluate: evaluate, rank: rank, evalRule: evalRule };
})(window);
