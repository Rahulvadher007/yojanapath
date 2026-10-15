// Problem-first conditional questionnaire. Goal cards first, then only the
// follow-up questions that can change the recommendation, then an answer review.
(function ($, g) {
  var NONE = '__none';
  var ICONS = {
    idea: '<path d="M20 8a9 9 0 0 0-5 16.5V28h10v-3.5A9 9 0 0 0 20 8z"/><path d="M16 32h8"/>',
    early: '<path d="M20 5c5 4.5 7 10 7 15l-4 5h-6l-4-5c0-5 2-10.5 7-15z"/><circle cx="20" cy="17" r="2.5"/><path d="M13 28l-3 5 6-1.5M27 28l3 5-6-1.5"/>',
    equipment: '<rect x="8" y="14" width="24" height="18" rx="2"/><path d="M8 20h24M16 14v6M24 14v6"/>',
    seed: '<path d="M20 32V18"/><path d="M20 20c0-5 4-8 9-8 0 5-4 8-9 8z"/><path d="M20 25c0-4-3-6-7-6 0 4 3 6 7 6z"/>',
    loan: '<rect x="6" y="11" width="28" height="18" rx="2"/><circle cx="20" cy="20" r="3.5"/>',
    hospital: '<rect x="7" y="7" width="26" height="26" rx="4"/><path d="M20 15v10M15 20h10"/>',
    myself: '<circle cx="20" cy="14" r="5"/><path d="M10 32c0-5.5 4.5-10 10-10s10 4.5 10 10"/>',
    family: '<circle cx="15" cy="14" r="4.5"/><circle cx="27" cy="16" r="3.5"/><path d="M6 32c0-5 4-9 9-9s9 4 9 9"/><path d="M26 32c0-4 3-7 7-7"/>',
    understand: '<circle cx="20" cy="20" r="12"/><path d="M17 16.5a3 3 0 1 1 3.5 3V22"/><path d="M20.5 26h.01"/>'
  };
  function icon(v) { return ICONS[v] ? '<svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + ICONS[v] + '</svg>' : ''; }
  var GOALS = {
    'startup-funding': [
      { value: 'idea', title: 'Turn an idea into a business', desc: 'I need initial capital to get started.' },
      { value: 'early', title: 'Fund an early-stage startup', desc: 'My young business needs funding.' },
      { value: 'equipment', title: 'Purchase equipment or expand', desc: 'I need a loan or support to grow operations.' },
      { value: 'seed', title: 'Find seed or innovation support', desc: 'I need seed funding or incubation linkage.' },
      { value: 'loan', title: 'Find a business loan or subsidy', desc: 'I need a loan, grant or expansion support.' }
    ],
    'health-coverage': [
      { value: 'hospital', title: 'Help with hospital costs', desc: 'I want to understand government health coverage.' },
      { value: 'myself', title: 'Coverage for myself', desc: 'I want to check what may apply to me.' },
      { value: 'family', title: 'Coverage for my family', desc: 'I want to check which family programs may apply.' },
      { value: 'understand', title: 'Understand a health scheme', desc: 'Just exploring — skip the personal questions.' }
    ]
  };
var FIELDS = {
    state: { label: 'Where will it operate?', labelHealth: 'Which state do you live in?', options: [['Gujarat', 'Gujarat'], ['Maharashtra', 'Maharashtra'], ['Delhi', 'Delhi'], ['Karnataka', 'Karnataka'], ['Other', 'Another state']], help: 'Some schemes are state-specific.' },
    applicantType: { label: 'Who is applying?', options: [['individual', 'Individual founder'], ['startup', 'A recognised startup'], ['msme', 'MSME or registered business']], help: 'Schemes cover different applicant types.' },
    businessStage: { label: 'Where is the business now?', options: [['idea', 'Just an idea'], ['early-stage', 'Early-stage startup'], ['operating', 'Already operating']], help: 'Seed programs cover idea and early-stage; loans cover all.' },
    recognitionStatus: { label: 'Do you have DPIIT recognition?', options: [['recognised', 'Yes, recognised'], ['applied', 'Applied, awaiting decision'], ['not-recognised', 'No recognition']], help: 'Only some seed schemes require this.' },
    fundingPurpose: { label: 'What is the support for?', options: [['seed', 'Getting started'], ['equipment', 'Buying equipment'], ['working-capital', 'Day-to-day working capital'], ['incubation', 'Incubation support']], help: 'Loans, grants and seed programs cover different uses.' },
    ageBand: { label: 'Age of the person needing cover?', options: [['0-18', 'Child (0–18)'], ['18-25', '18–25'], ['26-40', '26–40'], ['41-59', '41–59'], ['60+', '60 and above']], help: 'Used for senior-citizen support and schemes with an upper age limit.' },
    beneficiaryCategory: { label: 'Which category fits best?', options: [['low-income', 'Low-income family'], ['general', 'General or other'], ['senior-citizen', 'Senior citizen'], ['worker-family', 'Worker family']], help: 'Confirm the exact category with the authority.' },
    hasGovtCoverage: { label: 'Already have government cover?', options: [['yes', 'Yes'], ['no', 'No']], help: 'Helps avoid duplicate suggestions.' },
    occupation: { label: 'Occupation category', labelHealth: 'What is your work category?', options: [['salaried', 'Salaried / private job'], ['self-employed', 'Self-employed / business'], ['agriculture', 'Agriculture'], ['daily-wage', 'Daily wage / labour'], ['not-working', 'Not currently working']], help: 'Schemes such as ESIC cover specific worker categories.' },
    incomeBand: { label: 'Annual family income', labelHealth: 'Approximate annual family income', options: [['below-1lakh', 'Below ₹1 lakh'], ['1-3lakh', '₹1–3 lakh'], ['3-6lakh', '₹3–6 lakh'], ['above-6lakh', 'Above ₹6 lakh']], help: 'State health schemes usually cap family income. You may skip this.' },
    fundingAmount: { label: 'How much do you need to raise?', type: 'number', unit: '₹ lakh', min: 0, max: 100, step: 0.5, options: [['', '— Choose one —'], ['below-5lakh', 'Under 5 lakh'], ['5-25lakh', '5–25 lakh'], ['25lakh-1crore', '25 lakh – 1 crore'], ['above-1crore', 'Above 1 crore']], help: 'Enter in lakhs — 10 means Rs. 10 lakh. A rough figure is enough.', placeholder: '10' },
    incorporationStatus: { label: 'Is the business registered?', options: [['not-registered', 'Not registered yet'], ['proprietorship', 'Proprietorship / sole trader'], ['partnership', 'Partnership'], ['private-limited', 'Private limited company']], help: 'Some credit and guarantee schemes only fund registered entities.' },
    msmeUdyam: { label: 'Registered on Udyam (MSME) portal?', options: [['yes', 'Yes'], ['no', 'No'], ['not-sure', 'Not sure']], help: 'Udyam registration is often a precondition for loan and subsidy schemes.' },
    urgency: { label: 'When do you need it?', type: 'radio', options: [['immediate', 'Within a month'], ['few-months', 'Within a few months'], ['planning', 'Just planning ahead']], help: 'Some schemes have fixed intake windows.' },
    hospitalizationType: { label: 'What kind of care are you planning for?', labelHealth: 'What kind of care would you need?', options: [['any-treatment', 'Any treatment, if it arises'], ['planned-surgery', 'A planned surgery or procedure'], ['ongoing', 'Ongoing treatment for a condition'], ['check-only', 'Just checking what exists']], help: 'Cashless cover and reimbursement work differently for planned and unplanned care.' },
    rationCard: { label: 'Does your family hold a ration card?', labelHealth: 'Does your family hold a ration card?', options: [['yes', 'Yes'], ['no', 'No'], ['not-sure', 'Not sure']], help: 'Many state schemes use the ration card as an income proxy. You may skip this.' },
    gender: { label: 'Gender', labelHealth: 'Gender', options: [['female', 'Female'], ['male', 'Male'], ['other', 'Prefer not to say']], help: 'A few schemes target women specifically.' },
    familySize: { label: 'How many people live in your family?', labelHealth: 'How many people are in your family?', options: [['1-2', '1–2'], ['3-4', '3–4'], ['5+', '5 or more']], help: 'A few schemes depend on family size as well as income.' }
  };
  // Value reader that handles select, number and radio controls alike.
  function readField(f) {
    var cfg = FIELDS[f];
    if (cfg.type === 'radio') {
      var c = $('#qform input[type=radio][data-field="' + f + '"]:checked');
      return c.length ? c.val() : null;
    }
    var el = $('#qform [data-field="' + f + '"]').first();
    if (!el.length) return null;
    var v = el.val();
    return (v === undefined || v === '') && cfg.type === 'number' ? '' : v;
  }
  function markInvalid(f, on) {
    $('#qform [data-field="' + f + '"]').attr('aria-invalid', on ? 'true' : 'false');
  }
  function qIndexOf(f) {
    var st = steps();
    var cur = st[stepIdx];
    if (cur && cur.kind === 'fields') { var i = cur.fields.indexOf(f); return i > -1 ? i : 0; }
    return 0;
  }
  function flowFor(d, ans) {
    if (d === 'startup-funding') {
      var steps = [{ kind: 'goal', stage: 'Your goal' }];
      steps.push({ kind: 'fields', stage: 'About the business', fields: ['state', 'applicantType', 'businessStage'] });
      if (['idea', 'early', 'seed'].indexOf(ans.goal) > -1) steps.push({ kind: 'fields', stage: 'Recognition', fields: ['recognitionStatus'] });
      steps.push({ kind: 'fields', stage: 'Narrow it down', fields: ['fundingPurpose', 'fundingAmount', 'urgency', 'occupation'] });
      steps.push({ kind: 'fields', stage: 'Registration', fields: ['incorporationStatus', 'msmeUdyam'] });
      steps.push({ kind: 'review', stage: 'Review' });
      return steps;
    }
    var h = [{ kind: 'goal', stage: 'Your goal' }];
    h.push({ kind: 'fields', stage: 'Household basics', fields: ['state', 'ageBand', 'beneficiaryCategory'] });
    if (['hospital', 'myself', 'family'].indexOf(ans.goal) > -1) h.push({ kind: 'fields', stage: 'Existing cover', fields: ['hasGovtCoverage'] });
    h.push({ kind: 'fields', stage: 'Family circumstances', fields: ['occupation', 'incomeBand', 'familySize', 'rationCard', 'gender'] });
    h.push({ kind: 'fields', stage: 'Care needed', fields: ['hospitalizationType'] });
    h.push({ kind: 'review', stage: 'Review' });
    return h;
  }
  function purposeOptions(goal) {
    var all = FIELDS.fundingPurpose.options;
    if (goal === 'equipment') return all.filter(function (o) { return o[0] === 'equipment' || o[0] === 'working-capital'; });
    if (goal === 'loan') return all.filter(function (o) { return o[0] !== 'incubation'; });
    return all;
  }
  // Render one question using the control type the field declares.
  function fieldControl(f, i, opts) {
    var cfg = FIELDS[f];
    var list = opts || cfg.options || [];
    var cur = ans[f] === undefined ? NONE : ans[f];
    var common = 'id="qf' + i + '" data-field="' + f + '" aria-describedby="qfh' + i + ' qfe' + i + '"';
    var html;
    if (cfg.type === 'number') {
      html = '<div class="q-affix">' +
        '<input ' + common + ' type="number" inputmode="decimal" min="' + cfg.min + '" max="' + cfg.max + '" step="' + cfg.step + '" placeholder="' + g.esc(cfg.placeholder || '') + '" value="' + (cur === NONE ? '' : g.esc(cur)) + '">' +
        '<span class="q-affix-unit">' + g.esc(cfg.unit || '') + '</span></div>';
    } else if (cfg.type === 'radio') {
      html = '<div class="q-radio" role="radiogroup" aria-labelledby="qstep' + i + '">' + list.map(function (o) {
        return '<label class="q-chip"><input type="radio" ' + common.replace('id="qf' + i + '" ', 'id="qf' + i + '-' + o[0] + '" ') + ' name="f' + i + '" value="' + g.esc(o[0]) + '"' + (cur === o[0] ? ' checked' : '') + '><span>' + g.esc(o[1]) + '</span></label>';
      }).join('') + '</div>';
    } else {
      html = '<select ' + common + '>' + list.map(function (o) {
        return '<option value="' + g.esc(o[0]) + '"' + (cur === o[0] ? ' selected' : '') + '>' + g.esc(o[1]) + '</option>';
      }).join('') + '<option value=""' + (cur === '' ? ' selected' : '') + '>I’m not sure — skip for now</option></select>';
    }
    return html;
  }
  function domain() { return new URLSearchParams(location.search).get('domain') === 'health-coverage' ? 'health-coverage' : 'startup-funding'; }
  // Shared state lives at module scope: fieldControl/readField/markInvalid are
  // module-level helpers and cannot see anything declared inside the DOM-ready block.
  var d, ans, stepIdx = 0;
  function steps() { return flowFor(d, ans); }
  $(function () {
    if (!$('#qform').length) return;
    d = domain(); ans = $.extend({ domain: d }, g.YPStore.getDraft(d)); stepIdx = 0;
    g.YPStore.setLastDomain(d);
    // Keep the nav CTA pointed at this pathway so results never fall back to startup.
    $('#qresults').attr('href', 'results.html?domain=' + encodeURIComponent(d));
    function showSummary(msg, anchor) {
      $('#qsummary').html('<div class="error-summary" role="alert" tabindex="-1" id="qsumbox"><h2 style="font-size:20px;margin:0 0 8px">There is a problem</h2><p style="margin:0"><a href="' + (anchor || '#qstep0') + '">' + g.esc(msg) + '</a></p></div>');
      $('#qsumbox').focus();
    }
    function clearSummary() { $('#qsummary').empty(); }
    function fieldLabel(f) { return (d === 'health-coverage' && FIELDS[f].labelHealth) ? FIELDS[f].labelHealth : FIELDS[f].label; }
    // Show the human label the user actually picked, not the stored value.
    function fieldValue(f) {
      var v = ans[f];
      if (v === undefined || v === null || v === '' || v === NONE) return 'Not sure';
      var hit = (FIELDS[f].options || []).filter(function (o) { return o[0] === v; })[0];
      return hit ? hit[1] : v;
    }
    function render() {
      var st = steps();
      if (stepIdx >= st.length) stepIdx = st.length - 1;
      var s = st[stepIdx];
      clearSummary();
      $('#qstep').text('Stage ' + (stepIdx + 1) + ' of ' + st.length + ' · ' + s.stage);
      $('#qprog').attr({ max: st.length, value: stepIdx + 1 });
      if (s.kind === 'goal') {
        $('#qform').html('<div class="goal-stage"><h2 class="goal-title" id="qstep0" tabindex="-1">What do you need help with?</h2>' +
          '<div class="picker goal-grid" role="radiogroup" aria-labelledby="qstep0">' +
          GOALS[d].map(function (gl) {
            var on = ans.goal === gl.value;
            return '<button type="button" class="pick-card' + (on ? ' selected' : '') + '" data-goal="' + gl.value + '" role="radio" aria-checked="' + on + '">' +
              '<span class="pick-art">' + icon(gl.value) + '</span>' +
              '<span class="pick-title">' + g.esc(gl.title) + '</span>' +
              '<span class="pick-desc">' + g.esc(gl.desc) + '</span></button>';
          }).join('') + '</div></div>');
        $('#backBtn').toggle(stepIdx > 0);
        $('#nextBtn').text('Next →');
      } else if (s.kind === 'review') {
        var rows = [];
        var gl = GOALS[d].filter(function (x) { return x.value === ans.goal; })[0];
        rows.push(['Goal', gl ? gl.title : 'Not sure']);
        Object.keys(FIELDS).forEach(function (f) { if (ans[f] !== undefined) rows.push([fieldLabel(f), fieldValue(f)]); });
        $('#qform').html('<p class="lead" id="qstep0" tabindex="-1">Check your answers</p>' + g.ypTable('<table class="compare"><thead><tr><th scope="col">Question</th><th scope="col">Your answer</th></tr></thead><tbody>' +
          rows.map(function (r) { return '<tr><th scope="row">' + g.esc(r[0]) + '</th><td>' + g.esc(r[1]) + '</td></tr>'; }).join('') + '</tbody></table>') +
          '<p class="meta">“Not sure” is fine — those conditions become “needs confirmation” in your results.</p>');
        $('#backBtn').show();
        $('#nextBtn').text('See results');
      } else {
        $('#qform').html('<div class="q-fieldset">' + s.fields.map(function (f, i) {
          var opts = (f === 'fundingPurpose' && d === 'startup-funding') ? purposeOptions(ans.goal) : FIELDS[f].options;
          var cur = ans[f] === undefined ? NONE : ans[f];
          return '<label for="qf' + i + '" id="qstep' + i + '">' + g.esc(fieldLabel(f)) + '</label>' +
            fieldControl(f, i, opts) +
            '<p class="q-help" id="qfh' + i + '"><span class="q-help-tag">Why</span>' + g.esc(FIELDS[f].help) + '</p><p class="field-error" id="qfe' + i + '" role="alert"></p>';
        }).join('') + '</div>');
        if (!$('#qform').children().length) { $('#qstep').text('This step could not be displayed — please go back and try again.'); return; }
        $('#backBtn').toggle(stepIdx > 0);
        $('#nextBtn').text(stepIdx === st.length - 2 ? 'Review answers' : 'Continue');
      }
    }
    $('#qform').on('click', '[data-goal]', function () {
      ans.goal = $(this).attr('data-goal'); g.YPStore.setDraft(d, ans);
      $('#qform [data-goal]').each(function () {
        var on = $(this).attr('data-goal') === ans.goal;
        $(this).attr('aria-checked', on ? 'true' : 'false').toggleClass('selected', on);
      });
    });
    $('#backBtn').on('click', function () { if (stepIdx > 0) { stepIdx--; render(); } });
    $('#nextBtn').on('click', function () {
      var st = steps(), s = st[stepIdx];
      if (s.kind === 'goal') {
        if (!ans.goal) { showSummary('Please choose what you need help with.'); return; }
        stepIdx++; render(); return;
      }
      if (s.kind === 'review') { g.YPStore.setAnswers(ans); location.href = 'results.html?domain=' + d; return; }
      var bad = null;
      s.fields.forEach(function (f, i) {
        var v = readField(f);
        if (v === null || v === NONE) {
          bad = { f: f, i: i };
          markInvalid(f, true);
          $('#qfe' + i).text('Please answer this, or leave it as “not sure”.');
        } else {
          ans[f] = v; markInvalid(f, false); $('#qfe' + i).empty();
        }
      });
      if (bad) { showSummary('Please answer: ' + fieldLabel(bad.f), '#qstep' + bad.i); return; }
      g.YPStore.setDraft(d, ans);
      stepIdx++;
      render();
    });
    $('#qform').on('change', '[data-field]', function () {
      var f = $(this).attr('data-field');
      var v = readField(f);
      if (v !== null && v !== NONE) { ans[f] = v; g.YPStore.setDraft(d, ans); markInvalid(f, false); $('#qfe' + qIndexOf(f)).empty(); }
    });
    render();
  });
})(jQuery, window);
