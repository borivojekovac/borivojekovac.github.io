// ADE v3 lo-fi prototype · state, routing, derived facts, policy evaluation, omni-navigation and primitives.
// Pure functions only: the DOM layer lives in dom.js so that check.mjs can walk the journeys in Node.
// Rendering never changes state; the DOM layer calls ADE.visit() when the route changes.
(function (root) {
  const ADE = (root.ADE = root.ADE || {});
  const F = ADE.fixtures;
  // Bump STATE_VERSION whenever the stored state shape changes: older saved state is discarded instead of crashing the screens.
  const STATE_VERSION = 3;
  // The hi-fi package sets ADE.flavor = 'hifi' before loading these scripts, so the two prototypes keep separate saved state.
  const STORE = `ade-v3-${ADE.flavor || 'lofi'}-state-${STATE_VERSION}`;

  /* ------------------------------------------------------------------ helpers */
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = (n) => `<i class="icon" data-icon="${n}" aria-hidden="true"></i>`;
  // Money and ranges are formatted in the current project's currency and the viewer's number format (model.js).
  const eur = (n) => ADE.money(n);
  const range = (r) => ADE.moneyRange(r);
  const clone = (v) => JSON.parse(JSON.stringify(v));
  const attrs = (o) => Object.entries(o).filter(([, v]) => v != null && v !== false).map(([k, v]) => (v === true ? k : `${k}="${esc(v)}"`)).join(' ');
  Object.assign(ADE, { esc, icon, eur, range, clone });

  /* ------------------------------------------------------------------ state */
  // Start states of the prototype bar. Each names who is signed in and where they begin.
  ADE.STARTS = {
    returning: { label: 'Tomas returning (Borrowbox, Skillhaven)', persona: 'tomas' },
    elena: { label: 'Elena invited as domain expert', persona: 'elena', land: '#/p/borrowbox/inbox' },
    sofia: { label: 'Sofia reviewing agent output', persona: 'sofia', land: '#/p/borrowbox/inbox' },
    empty: { label: 'New user, no projects (Nina)', persona: 'nina' },
  };
  function initialState(start = 'returning') {
    const st = ADE.STARTS[start] ? start : 'returning';
    const s = { v: STATE_VERSION, start: st, persona: ADE.STARTS[st].persona, projects: {}, order: [], lastProject: {}, lastWork: { tomas: { borrowbox: 'W-121', skillhaven: 'W-1122' }, sofia: { borrowbox: 'W-112' }, matej: { skillhaven: 'W-1123' } }, invited: st === 'elena' ? { elena: ['borrowbox'] } : {}, prefs: {}, profiles: {}, drafts: { create: null, import: null, split: {}, config: {}, field: {}, attach: {}, start: {} }, access: [], seq: 500, clock: 0, omniApplied: null };
    ADE.state = s;
    if (st !== 'empty') { s.projects = clone(F.projects); s.order = Object.keys(s.projects); Object.values(s.projects).forEach((p) => ADE.normalizeProject(p)); }
    return s;
  }
  ADE.ui = { popup: null, toast: null, expanded: {}, omniAlternatives: null, omniQuery: '', editing: null };
  ADE.load = function () {
    try {
      const saved = root.localStorage && JSON.parse(root.localStorage.getItem(STORE));
      if (saved && saved.v === STATE_VERSION) ADE.state = saved; else initialState();
    } catch { initialState(); }
    return ADE.state;
  };
  ADE.save = function () { try { root.localStorage && root.localStorage.setItem(STORE, JSON.stringify(ADE.state)); } catch { /* storage unavailable: session-only */ } };
  ADE.reset = function (start) { initialState(start); ADE.ui.popup = null; ADE.ui.expanded = {}; ADE.ui.editing = null; ADE.save(); };
  ADE.initialState = initialState;
  ADE.nextId = (prefix) => `${prefix}-${++ADE.state.seq}`;
  ADE.persona = () => F.people[ADE.state.persona];
  ADE.personName = (id) => (id && F.people[id] ? F.people[id].name : 'Unassigned');
  ADE.expertise = (id) => ADE.state.profiles[id] ?? F.people[id].expertise;
  // Projects the signed-in person is a member of, in menu order.
  ADE.myProjects = () => ADE.state.order.map((id) => ADE.state.projects[id]).filter((p) => p && p.access.includes(ADE.state.persona));
  ADE.lastWorkFor = (pid) => ((ADE.state.lastWork[ADE.state.persona] || {})[pid]);
  // Route effect, called by the DOM layer (and check.mjs) after navigation: remembers where each person was.
  ADE.visit = function (hash) {
    const { parts } = ADE.parse(hash); const st = ADE.state; const me = st.persona;
    // The omni-navigation banner belongs to the view it opened; leaving that view ends it, so coming back later
    // (e.g. by a tab) never shows a stale “Opened for …” banner.
    if (st.omniApplied && st.omniApplied.hash !== hash) st.omniApplied = null;
    if (parts[0] !== 'p' || !st.projects[parts[1]] || !st.projects[parts[1]].access.includes(me)) return;
    st.lastProject[me] = parts[1];
    if (parts[2] === 'work' && parts[3] && ADE.item(st.projects[parts[1]], parts[3])) (st.lastWork[me] = st.lastWork[me] || {})[parts[1]] = parts[3];
  };

  /* ------------------------------------------------------------------ routing */
  ADE.currentHash = '#/';
  ADE.parse = function (hash = ADE.currentHash) {
    const [path, query = ''] = hash.replace(/^#/, '').split('?');
    const q = Object.fromEntries(new URLSearchParams(query));
    return { parts: path.split('/').filter(Boolean), q, hash };
  };
  ADE.link = (path, q) => { const s = q ? new URLSearchParams(Object.entries(q).filter(([, v]) => v != null && v !== '')).toString() : ''; return `#/${path}${s ? `?${s}` : ''}`; };
  ADE.plink = (pid, sub = '', q) => ADE.link(`p/${pid}${sub ? `/${sub}` : ''}`, q);

  /* ------------------------------------------------------------------ project model */
  const P = (pid) => ADE.state.projects[pid];
  const item = (p, wid) => p.work.find((w) => w.id === wid);
  const kids = (p, wid) => p.work.filter((w) => w.parentId === wid);
  const roots = (p) => p.work.filter((w) => !w.parentId);
  function ancestors(p, wid) { const out = []; let cur = item(p, wid); while (cur && cur.parentId) { cur = item(p, cur.parentId); if (cur) out.unshift(cur); } return out; }
  function descendants(p, wid) { return kids(p, wid).flatMap((k) => [k, ...descendants(p, k.id)]); }
  function roll(p, wid) {
    const it = item(p, wid); const ch = kids(p, wid);
    if (it.status === 'deferred') return { lo: 0, hi: 0, actual: it.actual || 0, unknown: 0, leaves: 0, done: 0 };
    if (!ch.length) return { lo: it.forecast ? it.forecast[0] : 0, hi: it.forecast ? it.forecast[1] : 0, actual: it.actual || 0, unknown: it.forecast || it.status === 'done' ? 0 : 1, leaves: 1, done: it.status === 'done' ? 1 : 0 };
    return ch.map((c) => roll(p, c.id)).reduce((a, b) => ({ lo: a.lo + b.lo, hi: a.hi + b.hi, actual: a.actual + b.actual, unknown: a.unknown + b.unknown, leaves: a.leaves + b.leaves, done: a.done + b.done }), { lo: 0, hi: 0, actual: 0, unknown: 0, leaves: 0, done: 0 });
  }
  function membership(p, rel) {
    return rel.members.filter((id) => item(p, id)).map((id) => {
      const insideOf = ancestors(p, id).find((a) => rel.members.includes(a.id));
      return { id, counted: !insideOf, insideOf: insideOf && insideOf.id, r: roll(p, id) };
    });
  }
  const sum = (rows) => rows.reduce((a, b) => ({ lo: a.lo + b.lo, hi: a.hi + b.hi, actual: a.actual + b.actual, unknown: a.unknown + b.unknown, leaves: a.leaves + b.leaves, done: a.done + b.done }), { lo: 0, hi: 0, actual: 0, unknown: 0, leaves: 0, done: 0 });
  const releaseTotals = (p, rel) => sum(membership(p, rel).filter((m) => m.counted).map((m) => m.r));
  const projectTotals = (p) => sum(roots(p).map((r) => roll(p, r.id)));
  const releasesOf = (p, wid) => p.releases.filter((r) => r.members.includes(wid) || ancestors(p, wid).some((a) => r.members.includes(a.id)));
  const riskById = (p, id) => p.risks.find((r) => r.id === id);
  const exposure = (r) => { const [l, i] = r.now; if (!l) return 'unknown'; const s = l * i; return s >= 7 ? 'high' : s >= 3 ? 'medium' : 'low'; };
  const openRisks = (p) => p.risks.filter((r) => r.status !== 'closed');
  const source = (p, id) => p.sources.find((s) => s.id === id);
  const runsOf = (p, wid) => p.runs.filter((r) => r.work === wid);
  const ACTIVE = ['queued', 'running', 'paused', 'stop-requested', 'awaiting-review', 'awaiting-input'];
  const activeRun = (p, wid) => runsOf(p, wid).find((r) => ACTIVE.includes(r.state));
  Object.assign(ADE, { P, item, kids, roots, ancestors, descendants, roll, membership, releaseTotals, projectTotals, releasesOf, riskById, exposure, openRisks, source, runsOf, activeRun, ACTIVE });
  ADE.reviewAssignment = (p, runId) => p.assignments.find((a) => a.run === runId && a.status === 'assigned');

  /* ------------------------------------------------------------------ policy evaluation (deterministic) */
  const LEVEL = { low: 1, medium: 2, high: 3, unknown: 2 };
  // `without` evaluates as if one risk were not linked: that is how a risk card tells whether the risk changes a verdict.
  ADE.evaluate = function (p, it, actorId = ADE.state.persona, { without } = {}) {
    const pol = p.contracts.policy.json; const limit = pol.limits.agentRunMax;
    const linked = (it.risks || []).filter((id) => id !== without).map((id) => riskById(p, id)).filter((r) => r && r.status !== 'closed');
    const maxRisk = linked.reduce((m, r) => (LEVEL[exposure(r)] > LEVEL[m] ? exposure(r) : m), 'low');
    const hi = it.forecast ? it.forecast[1] : null;
    const authority = actorId === p.owner ? 'accountable-owner' : actorId === 'automation' ? 'automation' : 'contributor';
    // Readiness is not a policy fact: no rule reads it. The explanation states it separately, in words.
    const facts = [
      { name: 'Forecast (high end)', value: hi == null ? 'Unknown' : eur(hi), source: 'Recorded estimate' },
      { name: 'Run limit', value: eur(limit), source: `Policy revision ${pol.revision} · limits.agentRunMax` },
      { name: 'Highest linked risk', value: linked.length ? `${maxRisk} (${linked.map((r) => r.id).join(', ')})` : 'none', source: 'Risk register' },
      { name: 'Customer-visible change', value: it.customerVisible ? 'yes' : 'no', source: 'Work item' },
      { name: 'Who is acting', value: `${actorId === 'automation' ? 'Automation' : ADE.personName(actorId)} · ${authority}`, source: 'Project access' },
      { name: 'Target inside grant', value: it.outsideGrant ? 'no' : 'yes', source: 'Project grants' },
    ];
    const test = {
      action: (v) => v === 'start-agent',
      targetOutsideGrant: (v) => !!it.outsideGrant === v,
      forecastHighAboveLimit: (v) => (hi == null || hi > limit) === v,
      customerVisibleChange: (v) => !!it.customerVisible === v,
      authority: (v) => (v === 'contributor' ? authority !== 'accountable-owner' : authority === v),
      riskAtMost: (v) => LEVEL[maxRisk] <= LEVEL[v],
      riskAbove: (v) => LEVEL[maxRisk] > LEVEL[v],
    };
    const rule = pol.rules.find((r) => r.when.action === 'start-agent' && Object.entries(r.when).every(([k, v]) => (test[k] ? test[k](v) : false)));
    const verdict = rule ? rule.outcome : 'needs-decision';
    const assign = rule && rule.assign;
    const decider = assign === 'accountable-owner' ? p.owner : assign ? p.contracts.routing.json.categories[assign]?.designated : null;
    const reason = !rule ? 'No rule matched, so a person must decide.'
      : rule.id === 'P1' ? 'The target is outside what this project is granted. Nothing will run.'
      : rule.id === 'P2' ? (hi == null ? 'The forecast is unknown, so its cost cannot be judged.' : `The forecast high end ${eur(hi)} is above the ${eur(limit)} run limit.`)
      : rule.id === 'P3' ? 'A contributor is starting a customer-visible change; the accountable owner decides.'
      : rule.id === 'P5' ? `A linked risk is high (${linked.filter((r) => exposure(r) === 'high').map((r) => r.id).join(', ')}); architecture must agree first.`
      : `Forecast within ${eur(limit)} and linked risk at most medium.${rule.requires ? ' A person reviews the output.' : ''}`;
    return { verdict, rule: rule ? rule.id : null, reason, facts, requires: (rule && rule.requires) || [], decider, revision: pol.revision, youDecide: verdict === 'needs-decision' && decider === actorId };
  };
  ADE.capacity = (p) => { const used = p.runs.filter((r) => r.state === 'running').length; return { used, slots: p.capacity.slots, free: used < p.capacity.slots }; };
  // Effect on agents: does this risk change what policy lets an agent do on the open work it affects? Each affected item
  // is evaluated with and without the risk; only a difference is reported as an effect. Generated from the evaluator.
  ADE.riskPolicyLine = function (p, r) {
    const open = r.affects.map((id) => item(p, id)).filter((x) => x && x.status === 'open' && ADE.isLeaf(p, x));
    if (!open.length) return { text: 'Not linked to open work, so it doesn\'t change what agents may do.', changes: false };
    const verdictWords = (e) => ({ allow: 'is allowed', 'needs-decision': `needs ${e.decider ? `${ADE.personName(e.decider)}'s agreement` : 'a decision'}`, deny: 'is denied' }[e.verdict]);
    for (const w of open) {
      const e = ADE.evaluate(p, w); const e0 = ADE.evaluate(p, w, undefined, { without: r.id });
      if (e.verdict !== e0.verdict || e.rule !== e0.rule || e.decider !== e0.decider) {
        return { text: `Because this risk is ${exposure(r)}, starting an agent on ${w.id} ${verdictWords(e)} (rule ${e.rule || '—'}). Without it, it ${verdictWords(e0)}.`, wid: w.id, changes: true };
      }
    }
    return { text: `Doesn't change what agents may do on ${open.map((w) => w.id).join(', ')}.`, wid: open[0].id, changes: false };
  };

  /* ------------------------------------------------------------------ generated work summary (prototype stand-in, always live) */
  ADE.workSummary = function (p, it) {
    const facts = []; const omitted = []; const uncertain = [];
    const ch = kids(p, it.id); const r = roll(p, it.id); const run = activeRun(p, it.id);
    const rd = ADE.readiness(p, it); const failing = (rd.failing || [])[0];
    let lead;
    if (it.status === 'done') lead = `Done${it.evidence ? ` with recorded evidence: ${it.evidence}` : ''}${r.actual ? `; spent ${eur(r.actual)}` : ''}${it.forecast ? ` against a ${range(it.forecast)} forecast` : ''}.`;
    else if (it.status === 'deferred') lead = 'Deferred; not counted in forecasts.';
    else if (run && run.state === 'awaiting-review') lead = `Agent output from run ${run.id.replace('RUN-', '')} is waiting for review.`;
    else if (run && run.state === 'awaiting-input') lead = `Run ${run.id.replace('RUN-', '')} is waiting for a person at “${(ADE.profile(p, run.profile).workflow.steps[run.wf.at] || {}).title}”.`;
    else if (run) lead = `Run ${run.id.replace('RUN-', '')} is ${ADE.label(run.state).toLowerCase()} at “${(ADE.profile(p, run.profile)?.workflow.steps[run.wf.at] || {}).title || '—'}”.`;
    else if (it.status === 'review') lead = 'Output is waiting for review.';
    else if (ch.length) lead = `${ch.length} child items, ${r.done} of ${r.leaves} leaf items done.`;
    else if (rd.state === 'ready') lead = 'Ready for an agent run.';
    else if (rd.state === 'needs-decision') lead = `Waiting on a decision${failing ? `: ${failing.fix.charAt(0).toLowerCase()}${failing.fix.slice(1)}` : ''}.`;
    else if (rd.state === 'blocked') lead = `Blocked${failing ? `: ${failing.fix}` : ''}.`;
    else lead = `Not ready yet${failing ? `: ${failing.fix.charAt(0).toLowerCase()}${failing.fix.slice(1)}` : ''}.`;
    facts.push({ text: lead, kind: it.status === 'done' ? 'Actual' : 'Observed', source: run ? `Run ${run.id}` : 'Readiness checks' });
    const money = ch.length ? (r.unknown ? `Forecast ${range([r.lo, r.hi])} plus ${r.unknown} unestimated.` : `Forecast ${range([r.lo, r.hi])}.`) : it.forecast ? `Forecast ${range(it.forecast)}.` : 'No estimate yet.';
    if (!['done', 'deferred'].includes(it.status)) facts.push({ text: money, kind: 'Forecast', source: 'Estimates' });
    const risk = (it.risks || []).map((id) => riskById(p, id)).filter((x) => x && x.status !== 'closed').sort((a, b) => LEVEL[exposure(b)] - LEVEL[exposure(a)])[0];
    if (risk) facts.push({ text: `Main risk: ${risk.title.charAt(0).toLowerCase()}${risk.title.slice(1)} (${exposure(risk)}).`, kind: 'Risk', source: `Risk ${risk.id}` });
    it.attachments.forEach((a) => { const s = source(p, a.src); if (s) omitted.push({ text: `Grounded in ${s.title} @ ${a.rev}`, why: s.freshness === 'stale' ? 'Stale source; excluded.' : 'Supports scope; not decisive for the summary.' }); });
    if ((it.comments || []).length) omitted.push({ text: `${it.comments.length} comments`, why: 'Discussion, not state.' });
    if (!it.forecast && !ch.length && it.status === 'open' && !it.decisionItem) uncertain.push({ text: 'Cost is unknown.', why: 'No estimate recorded; not zero.' });
    if (r.unknown && ch.length) uncertain.push({ text: `${r.unknown} child items have no estimate.`, why: 'Forecast is partial.' });
    return { text: facts.map((f) => f.text).join(' '), facts, omitted, uncertain };
  };

  /* ------------------------------------------------------------------ omni-navigation (navigational only) */
  const has = (q, ...words) => words.some((w) => q.includes(w));
  ADE.omni = function (raw, pid) {
    const q = raw.toLowerCase().trim();
    if (!q) return null;
    const p = pid && P(pid);
    const out = [];
    const add = (score, label, hash, why) => out.push({ score, label, hash, why });
    if (!p) {
      if (has(q, 'import', 'existing', 'repo')) add(9, 'Import an existing project', ADE.link('import'), 'Connect repositories and documents');
      if (has(q, 'new', 'create', 'start')) add(9, 'Create a project', ADE.link('new'), 'Describe it and get a first release');
      if (has(q, 'access', 'join')) add(9, 'Request access to a project', ADE.link('access'), 'Ask an owner');
      return pick(out, q, [{ label: 'Create a project', hash: ADE.link('new') }, { label: 'Import an existing project', hash: ADE.link('import') }, { label: 'Request access', hash: ADE.link('access') }]);
    }
    const dims = ['cost', 'time', 'customer', 'scope', 'authority', 'evidence', 'capacity'];
    const dim = dims.find((d) => q.includes(d)) || (has(q, 'budget', 'money', 'spend') ? 'cost' : has(q, 'late', 'deadline', 'date') ? 'time' : null);
    if (has(q, 'risk', 'threat', 'derail', 'danger')) add(8 + (dim ? 1 : 0), dim ? `Risks affecting ${dim}` : 'All risks', ADE.plink(pid, 'risks', { dim }), dim ? `Risks filtered to the ${dim} dimension` : 'Risk register as a matrix and cards');
    if (has(q, 'agent', 'run', 'doing', 'running', 'working on')) add(8, 'Agents running now', ADE.plink(pid, 'activity', { tab: 'runs', state: 'active' }), 'Runs in progress, paused or waiting');
    if (has(q, 'automat', 'daemon', 'trigger', 'why did', 'started by itself')) add(8, 'Automations and triggers', ADE.plink(pid, 'activity', { tab: 'automations' }), 'What starts by itself and under which rule');
    if (has(q, 'happened', 'changed', 'since', 'history', 'event')) add(7, 'What changed recently', ADE.plink(pid, 'activity', { tab: 'events' }), 'Events and what they triggered');
    if (has(q, 'over budget', 'budget', 'forecast', 'spend', 'cost', 'money', 'late')) add(7, 'Releases by forecast against budget', ADE.plink(pid, 'releases', { sort: 'variance' }), 'Release cost and time posture');
    if (has(q, 'assigned', 'my work', 'inbox', 'to do', 'for me', 'my ')) add(8, 'Your inbox', ADE.plink(pid, 'inbox'), `Requests for ${ADE.persona().name}`);
    if (has(q, 'mine', 'i own', 'my items')) add(8, 'Work you own', ADE.plink(pid, 'work', { mine: '1', expand: 'all' }), 'Work tree filtered to your items');
    if (has(q, 'decide', 'decision', 'waiting for me', 'approve', 'needs me')) add(8, 'Decisions waiting', ADE.plink(pid, 'inbox', { tab: 'decisions' }), 'Decisions where you are the decider');
    if (has(q, 'blocked', 'stuck', 'waiting', 'not ready')) add(7, 'Blocked or waiting work', ADE.plink(pid, 'work', { readiness: 'blocked,needs-decision', expand: 'all' }), 'Work tree filtered to blocked and needs-decision');
    if (has(q, 'ready')) add(7, 'Work ready for an agent', ADE.plink(pid, 'work', { readiness: 'ready', expand: 'all' }), 'Work tree filtered to ready items');
    if (has(q, 'policy', 'allowed', 'autonomy', 'permission', 'rule')) add(8, 'Project policy', ADE.plink(pid, 'config', { contract: 'policy' }), 'What agents may do without asking');
    if (has(q, 'profile', 'workflow', 'model', 'skill')) add(8, 'Agent profiles and workflows', ADE.plink(pid, 'config', { contract: 'agents' }), 'Models, steps and loops per profile');
    if (has(q, 'currency', 'setting', 'time zone', 'working day')) add(8, 'Project settings', ADE.plink(pid, 'config', { contract: 'settings' }), 'Currency, time zone, working day');
    if (has(q, 'who answers', 'routing', 'delegate', 'expert')) add(7, 'Contribution routing', ADE.plink(pid, 'config', { contract: 'routing' }), 'Who answers each kind of question');
    if (has(q, 'source', 'document', 'repo', 'repository', 'upload', 'connect')) add(7, 'Project sources', ADE.plink(pid, 'knowledge', { tab: 'sources' }), 'Connected repositories and documents');
    if (has(q, 'stale', 'conflict', 'disagree', 'outdated')) add(7, 'Conflicting or stale knowledge', ADE.plink(pid, 'knowledge', { tab: 'facts', kind: 'Conflict' }), 'Facts that disagree');
    if (has(q, 'release', 'outcome', 'milestone')) add(6, 'Releases', ADE.plink(pid, 'releases'), 'Customer outcomes');
    if (has(q, 'tree', 'all work', 'backlog', 'structure')) add(6, 'Work tree', ADE.plink(pid, 'work', { expand: 'all' }), 'Everything, expanded');
    const words = q.split(/[^a-z0-9-]+/).filter((w) => w.length > 3);
    p.work.forEach((w) => { const t = w.title.toLowerCase(); const hits = words.filter((x) => t.includes(x)).length + (q.includes(w.id.toLowerCase()) ? 3 : 0); if (hits) add(4 + hits * 2, `Work: ${w.title}`, ADE.plink(pid, `work/${w.id}`), `${w.id} · ${w.status === 'open' ? ADE.label(ADE.ready(p, w) || 'open') : ADE.label(w.status)}`); });
    p.risks.forEach((r) => { const t = r.title.toLowerCase(); const hits = words.filter((x) => t.includes(x)).length + (q.includes(r.id.toLowerCase()) ? 3 : 0); if (hits) add(4 + hits * 2, `Risk: ${r.title}`, ADE.plink(pid, 'risks', { risk: r.id }), `${r.id} · ${r.status}`); });
    p.releases.forEach((r) => { const t = r.name.toLowerCase(); const hits = words.filter((x) => t.includes(x)).length; if (hits) add(4 + hits * 2, `Release: ${r.name}`, ADE.plink(pid, `releases/${r.id}`), 'Customer outcome'); });
    const kq = p.questions.map((k) => ({ k, hits: k.keys.filter((x) => q.includes(x)).length })).sort((a, b) => b.hits - a.hits)[0];
    if (has(q, 'how', 'what', 'why', 'can ', 'who', 'when', '?')) add(kq && kq.hits >= 2 ? 7 : 5, `Ask project knowledge: “${raw.trim()}”`, ADE.plink(pid, 'knowledge', { q: raw.trim() }), 'Read-only answer from project sources');
    return pick(out, q, [
      { label: `Ask project knowledge: “${raw.trim()}”`, hash: ADE.plink(pid, 'knowledge', { q: raw.trim() }), why: 'Read-only answer from project sources' },
      { label: `Search work for “${raw.trim()}”`, hash: ADE.plink(pid, 'work', { filter: raw.trim(), expand: 'all' }), why: 'Work tree filtered by title' },
      { label: 'Project dashboard', hash: ADE.plink(pid), why: 'Start again from the overview' },
    ]);
  };
  function pick(out, q, fallback) {
    const sorted = out.sort((a, b) => b.score - a.score).filter((x, i, arr) => arr.findIndex((y) => y.hash === x.hash) === i);
    if (sorted.length && sorted[0].score >= 8 && (!sorted[1] || sorted[0].score - sorted[1].score >= 2)) return { go: sorted[0] };
    const alts = (sorted.length ? sorted : fallback).slice(0, 4);
    return { alternatives: alts.length ? alts : fallback };
  }

  /* ------------------------------------------------------------------ primitives (HTML) */
  const TONE = { ready: 'ok', done: 'ok', allow: 'ok', current: 'ok', accepted: 'ok', connected: 'ok', complete: 'ok', 'needs-decision': 'warn', 'not-ready': 'neutral', review: 'info', 'awaiting-review': 'info', 'awaiting-input': 'warn', 'in-progress': 'info', running: 'info', queued: 'neutral', paused: 'warn', blocked: 'bad', deny: 'bad', failed: 'bad', stale: 'warn', partial: 'warn', disputed: 'warn', inaccessible: 'bad', unknown: 'unknown', proposed: 'gen', open: 'neutral', 'needs-owner': 'warn', monitoring: 'info', closed: 'ok', 'stop-requested': 'warn', stopped: 'neutral', assigned: 'warn', answered: 'ok', delegated: 'neutral', deferred: 'neutral', decided: 'ok', extracting: 'info', 'access-requested': 'warn', 'changes-requested': 'warn', rejected: 'bad', superseded: 'neutral' };
  const LABEL = { 'needs-decision': 'Needs decision', 'not-ready': 'Not ready', 'in-progress': 'In progress', 'awaiting-review': 'Awaiting review', 'awaiting-input': 'Waiting for a person', 'needs-owner': 'Needs owner', 'stop-requested': 'Stop requested', 'changes-requested': 'Changes requested', allow: 'Allowed', deny: 'Denied' };
  const ICON = { ready: 'check_circle', done: 'task_alt', allow: 'shield', 'needs-decision': 'help_outline', 'not-ready': 'radio_button_unchecked', review: 'visibility', 'awaiting-review': 'visibility', 'awaiting-input': 'person', 'in-progress': 'sync', running: 'sync', queued: 'hourglass_empty', paused: 'pause_circle', blocked: 'block', deny: 'block', failed: 'error_outline', stale: 'history', partial: 'warning_amber', disputed: 'compare', inaccessible: 'lock', unknown: 'help_outline', proposed: 'auto_awesome', open: 'radio_button_unchecked', 'needs-owner': 'person_add', monitoring: 'visibility', closed: 'check_circle', current: 'check_circle', accepted: 'verified', connected: 'link', complete: 'task_alt', 'stop-requested': 'stop_circle', stopped: 'stop_circle', assigned: 'inbox', answered: 'task_alt', delegated: 'forward_to_inbox', deferred: 'do_not_disturb_on', decided: 'task_alt', extracting: 'sync', 'access-requested': 'hourglass_empty', 'changes-requested': 'edit_note', rejected: 'block', superseded: 'history' };
  const label = (s) => LABEL[s] || (s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ') : '');
  ADE.badge = (state, text) => `<span class="badge badge--${TONE[state] || 'neutral'}">${icon(ICON[state] || 'info')}${esc(text || label(state))}</span>`;
  ADE.tone = (text, tone, ic = 'info') => `<span class="badge badge--${tone}">${icon(ic)}${esc(text)}</span>`;
  ADE.outcomeTag = () => ADE.tone('Customer outcome', 'outcome', 'flag');
  ADE.label = label;
  // State badge for a work item: readiness for open leaves, child progress for open parents, else the status.
  ADE.workState = function (p, it) {
    if (it.status !== 'open') return ADE.badge(it.status === 'review' ? 'review' : it.status);
    if (!ADE.isLeaf(p, it)) { const r = roll(p, it.id); return ADE.badge('open', `Open · ${r.done}/${r.leaves} done`); }
    return ADE.badge(ADE.ready(p, it));
  };
  ADE.level = (dim, lv) => `<span class="dim dim--${lv}" aria-label="${esc(dim)}: ${esc(lv)}"><span class="dim__meter"><i></i><i></i><i></i></span>${esc(dim)} · ${esc(lv)}</span>`;
  ADE.person = (id, compact) => (id ? (compact ? `<span class="person person--compact" title="${esc(F.people[id].name)}"><span class="avatar">${esc(F.people[id].initials)}</span><span class="visually-hidden">Owner ${esc(F.people[id].name)}</span></span>` : `<span class="person"><span class="avatar">${esc(F.people[id].initials)}</span>${esc(F.people[id].name)}</span>`) : '<span class="person person--none">Unassigned</span>');
  // GeneratedMark: plain, personalised (only when the text was written for this person) or outdated (basis changed since generation).
  ADE.gen = (key, personal, outdated) => `<button class="gen${personal ? ' gen--personal' : ''}${outdated ? ' gen--stale' : ''}" type="button" data-act="basis" data-key="${esc(key)}" aria-label="${outdated ? 'Generated summary is outdated' : personal ? 'Generated for you' : 'Generated'}. Show basis">${icon(outdated ? 'history' : 'auto_awesome')}${outdated ? 'Outdated' : personal ? 'Generated for you' : 'Generated'}${icon('info')}</button>`;
  ADE.btn = (text, act, data = {}, variant = 'outline', ic) => `<button type="button" class="btn btn--${variant}" ${attrs({ 'data-act': act, ...Object.fromEntries(Object.entries(data).map(([k, v]) => [`data-${k}`, v])) })}>${ic ? icon(ic) : ''}${esc(text)}</button>`;
  // Grant-disabled pattern: an unauthorised action stays visible, disabled, with the reason next to it.
  ADE.gbtn = (grant, text, act, data = {}, variant = 'outline', ic) => (grant.ok ? ADE.btn(text, act, data, variant, ic) : `<span class="granted-off"><button type="button" class="btn btn--${variant}" disabled aria-describedby="why-${esc(act)}-${esc(data.wid || data.run || data.rid || '')}">${ic ? icon(ic) : ''}${esc(text)}</button><small class="granted-off__why" id="why-${esc(act)}-${esc(data.wid || data.run || data.rid || '')}" data-for="${esc(text)}">${icon('lock')}${esc(grant.why)}</small></span>`);
  ADE.a = (text, hash, cls = 'link') => `<a class="${cls}" href="${esc(hash)}">${esc(text)}</a>`;
  ADE.kind = (k) => `<span class="kind kind--${esc(k.toLowerCase().replace(/[^a-z]+/g, '-'))}">${esc(k)}</span>`;
  ADE.empty = (ic, title, text, action = '') => `<div class="empty">${icon(ic)}<div><strong>${esc(title)}</strong><p>${esc(text)}</p>${action}</div></div>`;

  // `factCards` renders the facts as a strip of small cards (work item); `below` is a block after the facts (the
  // project description, so the short facts keep their place however long it grows).
  ADE.pageHeader = function ({ eyebrow, crumbs = [], title, titleEdit = '', sub, subKey, personal, outdated, facts = [], factCards = false, below = '', actions = '' }) {
    return `<header class="page-header">
      ${crumbs.length ? `<p class="crumbs">${crumbs.map(([t, h]) => (h ? ADE.a(t, h) : `<span>${esc(t)}</span>`)).join(icon('chevron_right'))}</p>` : ''}
      ${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ''}
      <h1>${esc(title)}${titleEdit}</h1>
      ${sub ? `<p class="subtitle${outdated ? ' is-outdated' : ''}">${esc(sub)}${subKey ? ADE.gen(subKey, personal, outdated) : ''}</p>` : ''}
      ${outdated ? `<p class="meta outdated-note">${icon('history')}The basis changed after this was generated. AU-1 regenerates it on the next tick.</p>` : ''}
      ${facts.length ? `<div class="facts${factCards ? ' facts--cards' : ''}">${facts.map(([k, v]) => `<span class="facts__item"><small>${esc(k)}</small>${v}</span>`).join('')}</div>` : ''}
      ${below}
      ${actions ? `<div class="page-actions">${actions}</div>` : ''}
    </header>`;
  };

  ADE.gauge = function ({ title, lo, hi, fill, mark, unknown, labels, compact }) {
    const pct = (v) => `${Math.max(0, Math.min(100, v * 100)).toFixed(1)}%`;
    if (unknown) return `<div class="gauge gauge--unknown"><div class="gauge__head"><strong>${esc(title)}</strong></div><div class="gauge__track"></div><div class="gauge__labels"><span>${esc(labels.fill || '')}</span><span>Forecast unknown</span></div></div>`;
    return `<div class="gauge${compact ? ' gauge--compact' : ''}" role="img" aria-label="${esc(`${title}: ${labels.fill}, ${labels.range}, ${labels.mark}`)}">
      ${title ? `<div class="gauge__head"><strong>${esc(title)}</strong></div>` : ''}
      <div class="gauge__track"><span class="gauge__range" style="left:${pct(lo)};width:${pct(hi - lo)}"></span><span class="gauge__fill" style="width:${pct(fill)}"></span><span class="gauge__mark" style="left:${pct(mark)}"></span></div>
      <div class="gauge__labels"><span>${esc(labels.fill)}</span><span>${esc(labels.range)}</span><span>${esc(labels.mark)}</span></div>
    </div>`;
  };
  ADE.costRisk = function (t, budget) {
    if (t.actual > budget) return ADE.tone(`Over budget by ${eur(t.actual - budget)}`, 'bad', 'error_outline');
    if (t.lo > budget) return ADE.tone(`Forecast exceeds budget by ${range([t.lo - budget, t.hi - budget])}`, 'bad', 'error_outline');
    if (t.hi > budget) return ADE.tone(`Forecast may exceed budget by up to ${eur(t.hi - budget)}`, 'warn', 'warning_amber');
    return ADE.tone('Within budget', 'ok', 'check_circle');
  };
  ADE.costGauge = function (t, budget, compact, href) {
    const max = Math.max(budget, t.hi, t.actual) * 1.12 || 1;
    return ADE.gauge({ title: compact ? '' : 'Cost', compact, href, lo: t.lo / max, hi: t.hi / max, fill: t.actual / max, mark: budget / max, labels: { fill: `Spent ${eur(t.actual)}`, range: `Forecast ${range([t.lo, t.hi])}${t.unknown ? ` + ${t.unknown} unestimated` : ''}`, mark: `Budget ${eur(budget)}` } });
  };
  ADE.timeGauge = function (rel, title = 'Time') {
    if (!rel.timeRatio) return ADE.gauge({ title, unknown: true, labels: { fill: `Planned ${ADE.date(rel.planned)}` } });
    const [lo, hi, fill, mark] = rel.timeRatio;
    return ADE.gauge({ title, lo, hi, fill, mark, labels: { fill: 'Today', range: `Forecast finish ${ADE.date(rel.forecastFinish)}`, mark: `Planned ${ADE.date(rel.planned)}` } });
  };
  ADE.timeRisk = (rel) => (!rel.timeRatio ? ADE.tone('Finish date unknown', 'unknown', 'help_outline') : rel.timeRatio[0] > rel.timeRatio[3] ? ADE.tone('Forecast finish after plan', 'bad', 'schedule') : rel.timeRatio[1] > rel.timeRatio[3] ? ADE.tone(`May finish after ${ADE.date(rel.planned)}`, 'warn', 'schedule') : ADE.tone('On plan', 'ok', 'schedule'));
  // Spend by kind: agent and provider money, human effort in days (and money at the optional day rate).
  ADE.spendKv = function (s) {
    const rate = ADE.fmtCtx.dayRate;
    return `<dl class="kv kv--split"><div><dt>Agent</dt><dd>${eur(s.agent)}<small class="meta"> · ${ADE.agentTime(s.agentMin)}</small></dd></div><div><dt>Provider</dt><dd>${eur(s.provider)}</dd></div><div><dt>Human</dt><dd>${ADE.days(s.humanDays)}${rate ? `<small class="meta"> ≈ ${eur(s.humanDays * rate)}</small>` : ''}</dd></div></dl><p class="meta">Budget gauges count agent and provider spend. Human effort is shown in days${rate ? ` and at the ${eur(rate)} day rate` : ''}, not added to the budget.</p>`;
  };

  ADE.riskMatrix = function (risks, pid, small) {
    const cells = [];
    for (let i = 3; i >= 1; i--) for (let l = 1; l <= 3; l++) {
      const here = risks.filter((r) => r.now[0] === l && r.now[1] === i);
      const tgt = risks.filter((r) => r.target[0] === l && r.target[1] === i);
      const sev = l * i >= 7 ? 'high' : l * i >= 3 ? 'medium' : 'low';
      cells.push(`<div class="matrix__cell matrix__cell--${sev}">${here.map((r) => (small ? `<span class="matrix__dot" title="${esc(r.id)} now"></span>` : `<a class="matrix__chip" href="${esc(ADE.plink(pid, 'risks', { risk: r.id }))}" title="${esc(r.title)}">${esc(r.id)}</a>`)).join('')}${small ? tgt.map((r) => `<span class="matrix__ring" title="${esc(r.id)} target"></span>`).join('') : ''}</div>`);
    }
    const unknown = risks.filter((r) => !r.now[0]);
    return `<div class="matrix${small ? ' matrix--small' : ''}" role="img" aria-label="Likelihood by impact matrix">
      ${small ? '' : '<span class="matrix__axis matrix__axis--y">Impact</span>'}
      <div class="matrix__grid">${cells.join('')}</div>
      ${small ? '' : `<span class="matrix__axis matrix__axis--x">Likelihood</span>${unknown.length ? `<p class="matrix__unknown">Likelihood unknown: ${unknown.map((r) => `<a class="matrix__chip" href="${esc(ADE.plink(pid, 'risks', { risk: r.id }))}">${esc(r.id)}</a>`).join(' ')}</p>` : ''}`}
    </div>`;
  };
  // Exposure as words: now → target, each as severity with likelihood · impact. Used in the risk popup.
  const LIK = { 1: 'unlikely', 2: 'possible', 3: 'likely' }; const IMP = { 1: 'minor', 2: 'moderate', 3: 'major' };
  const sevOf = ([l, i]) => (!l ? 'unknown' : l * i >= 7 ? 'high' : l * i >= 3 ? 'medium' : 'low');
  ADE.riskExposureParts = (r) => [['Now', r.now], ['Target', r.target]].map(([k, v]) => ({ k, sev: sevOf(v), lik: v[0] ? LIK[v[0]] : 'likelihood unknown', imp: IMP[v[1]] || '?', text: v[0] ? `${LIK[v[0]]} · ${IMP[v[1]]}` : `likelihood unknown · ${IMP[v[1]] || '?'}` }));
  ADE.riskExposure = (r) => `<p class="risk-exposure">${ADE.riskExposureParts(r).map((x) => `<span><small>${x.k}</small> <strong>${esc(x.sev)}</strong> ${esc(x.text)}</span>`).join(' → ')}</p>`;
  // One impact line for cards: time and cost impact, skipping the ones that say nothing.
  ADE.riskImpact = (r) => [r.timeImpact, r.costImpact].filter((x) => x && !/^(none|unknown|€0|none directly|none yet)$/i.test(x)).join(' · ') || ([r.timeImpact, r.costImpact].some((x) => /unknown/i.test(x || '')) ? 'Impact not yet estimated' : 'No cost or time impact yet');
  ADE.riskCard = function (p, r) {
    const dims = Object.entries(r.dims).slice(0, 3).map(([d, lv]) => ADE.level(d, lv)).join('');
    return `<article class="card risk-card">
      <div class="risk-card__head">${ADE.badge(r.status)}<span class="meta">${esc(r.id)}</span></div>
      <h3 class="risk-card__title">${esc(r.title)}</h3>
      <div class="risk-card__dims">${dims}</div>
      <p class="risk-card__impact meta">${esc(ADE.riskImpact(r))}</p>
      <div class="risk-card__foot">${ADE.person(r.owner)}${ADE.a('Details', ADE.plink(p.id, 'risks', { ...ADE.parse().q, risk: r.id }), 'btn btn--quiet')}</div>
    </article>`;
  };

  ADE.optionCards = function (group, options, draft = {}, { own = true, ownLabel = 'Own strategy' } = {}) {
    const all = own ? [...options, { id: 'own', title: ownLabel, desc: '', own: true }] : options;
    return `<div class="options" data-group="${esc(group)}">${all.map((o) => {
      const sel = draft.choice === o.id; const note = (draft.notes || {})[o.id] || '';
      return `<label class="card option${sel ? ' is-selected' : ''}">
        <span class="option__head"><input type="radio" name="${esc(group)}" value="${esc(o.id)}" ${sel ? 'checked' : ''} data-act="optionPick" data-group="${esc(group)}" data-option="${esc(o.id)}"><strong>${esc(o.title)}</strong></span>
        ${o.desc ? `<span class="option__desc">${esc(o.desc)}</span>` : ''}
        ${o.pros || o.cons ? `<span class="option__pc">${o.pros ? `<span>${icon('trending_up')}${esc(o.pros)}</span>` : ''}${o.cons ? `<span>${icon('trending_down')}${esc(o.cons)}</span>` : ''}</span>` : ''}
        ${o.chips ? `<span class="chips">${o.chips.map((c) => `<span class="chip">${esc(c)}</span>`).join('')}</span>` : ''}
        <textarea class="option__note${o.own && sel && !note.trim() ? ' is-required' : ''}" rows="${o.own ? 3 : 1}" placeholder="${o.own ? 'Describe your own option (required)' : 'Note for the agent (optional)'}" data-input="optionNote" data-group="${esc(group)}" data-option="${esc(o.id)}">${esc(note)}</textarea>
      </label>`;
    }).join('')}</div>`;
  };
  ADE.optionReady = (draft) => !!draft && !!draft.choice && (draft.choice !== 'own' || !!((draft.notes || {}).own || '').trim());

  ADE.policyRow = function (p, it, actor) {
    const e = ADE.evaluate(p, it, actor);
    const words = { allow: 'Allowed', 'needs-decision': e.youDecide ? 'Needs your decision' : 'Needs decision', deny: 'Denied' }[e.verdict];
    return `<div class="policy-row">${ADE.badge(e.verdict === 'allow' ? 'allow' : e.verdict, words)}<span>${esc(e.reason)}</span>${ADE.btn(e.rule ? `Rule ${e.rule} · why?` : 'Why?', 'policyEval', { pid: p.id, wid: it.id }, 'quiet')}</div>`;
  };
  // Start button label follows the viewer's verdict: start when allowed or when they decide, ask otherwise.
  ADE.startLabel = (e) => (e.verdict === 'allow' || e.youDecide ? 'Start agent…' : 'Ask to start…');

  // Step line: the run's workflow as one line of steps with status, visits and policy-added steps.
  ADE.stepLine = function (p, run) {
    const steps = ADE.runSteps(p, run);
    if (!steps.length) return `<p class="step-line step-line--empty meta">${run.deniedBeforeStart ? 'Denied before the first step.' : 'No workflow steps.'}</p>`;
    const mark = { done: '✓', fail: '✗', now: '●', todo: '' };
    return `<ol class="step-line" aria-label="Workflow steps">${steps.map((s) => `<li class="step-line__step is-${s.status}${s.addedBy ? ' is-policy' : ''}"><span>${esc(s.title)}${s.max && s.visits > 1 ? ` (${s.visits}/${s.max})` : ''}</span>${mark[s.status] ? `<span aria-hidden="true"> ${mark[s.status]}</span>` : ''}<span class="visually-hidden"> ${s.status === 'todo' ? 'not started' : s.status === 'now' ? 'current' : s.status}</span>${s.addedBy ? `<small>${esc(s.addedBy)}</small>` : ''}</li>`).join('')}</ol>`;
  };

  // Run controls follow the state; every control is grant-checked. Shared by the lo-fi and hi-fi run rows.
  ADE.runControls = function (p, run) {
    const w = run.work && item(p, run.work); const g = ADE.can(p, 'run-control', { work: w });
    const prof = run.profile && ADE.profile(p, run.profile); const st = prof && run.wf.at ? prof.workflow.steps[run.wf.at] : null;
    return run.state === 'running' ? ADE.gbtn(g, 'Pause', 'runPause', { pid: p.id, run: run.id }, 'quiet', 'pause_circle') + ADE.gbtn(g, 'Stop', 'runStopAsk', { pid: p.id, run: run.id }, 'quiet', 'stop_circle')
      : run.state === 'paused' ? ADE.gbtn(g, 'Resume', 'runResume', { pid: p.id, run: run.id }, 'quiet', 'play_circle') + ADE.gbtn(g, 'Stop', 'runStopAsk', { pid: p.id, run: run.id }, 'quiet', 'stop_circle')
      : run.state === 'queued' ? ADE.gbtn(g, 'Cancel', 'runStopAsk', { pid: p.id, run: run.id }, 'quiet', 'stop_circle')
      : run.state === 'awaiting-input' && st ? Object.keys(st.on || {}).map((o, i) => ADE.gbtn(ADE.can(p, 'run-human', { work: w }), ADE.label(o), 'runHuman', { pid: p.id, run: run.id, outcome: o }, i ? 'quiet' : 'primary')).join('')
      : run.state === 'awaiting-review' ? ADE.btn('Review output', 'reviewOpen', { pid: p.id, run: run.id }, 'primary', 'visibility') : '';
  };
  ADE.runRow = function (p, run, forceOpen) {
    const open = !!ADE.ui.expanded[run.id] || forceOpen; const w = run.work && item(p, run.work);
    const pct = Math.min(100, Math.round((run.spent / run.reserved) * 100));
    const prof = run.profile && ADE.profile(p, run.profile);
    const st = prof && run.wf.at ? prof.workflow.steps[run.wf.at] : null;
    const controls = ADE.runControls(p, run);
    return `<div class="run${open ? ' is-open' : ''}" id="run-${esc(run.id)}">
      <div class="run__row">
        <button class="icon-btn" type="button" data-act="toggle" data-key="${esc(run.id)}" data-default="${forceOpen ? '1' : '0'}" aria-expanded="${!!open}" aria-label="${open ? 'Hide' : 'Show'} run details">${icon(open ? 'expand_more' : 'chevron_right')}</button>
        ${ADE.badge(run.state)}<span class="meta">${esc(run.id.replace('RUN-', 'Run '))} · attempt ${run.attempt}</span>
        <span class="run__work">${w ? ADE.a(w.title, ADE.plink(p.id, `work/${w.id}`)) : esc(run.system || run.profile)}</span>
        <span class="run__step">${esc(st ? st.title : run.state === 'awaiting-review' ? 'Human review' : '—')}</span>
        <span class="run__agent meta">${esc(prof ? prof.title : run.agent)} · ${esc(st && st.model ? st.model : prof ? prof.model : run.model)}</span>
        <span class="run__spend"><span class="minibar"><i style="width:${pct}%"></i></span>${esc(eur(run.spent))} / ${esc(eur(run.reserved))}</span>
        <span class="run__controls">${controls}</span>
      </div>
      <div class="run__line">${ADE.stepLine(p, run)}</div>
      ${run.attention ? `<p class="run__attention">${icon('warning_amber')}${esc(run.attention)}</p>` : ''}
      ${open ? ADE.runDetail(p, run) : ''}
    </div>`;
  };
  // Expanded run: trigger and policy, predecessor/successor, facts, steps, context, console and changed files.
  ADE.runDetail = function (p, run) {
    const prof = run.profile && ADE.profile(p, run.profile); const reviewA = ADE.reviewAssignment(p, run.id);
    const prev = run.prev && p.runs.find((r) => r.id === run.prev); const next = run.next && p.runs.find((r) => r.id === run.next);
    return `<div class="run__detail">
        <div class="cols"><div><h4>Why it started</h4><p>${esc(run.trigger)}.</p></div><div><h4>Policy</h4><p>${esc(run.policy)} <button class="link" type="button" data-act="runPolicy" data-pid="${esc(p.id)}" data-run="${esc(run.id)}">Policy explanation</button></p></div></div>
        ${prev || next || run.prev ? `<p class="meta">${run.prev ? `Follows ${prev ? `<a class="link" href="${esc(ADE.plink(p.id, 'activity', { run: prev.id }))}">${esc(prev.id)}</a> (${esc(ADE.label(prev.state))})` : esc(run.prev)}` : ''}${run.prev && next ? ' · ' : ''}${next ? `Followed by <a class="link" href="${esc(ADE.plink(p.id, 'activity', { run: next.id }))}">${esc(next.id)}</a> (${esc(ADE.label(next.state))})` : ''}</p>` : ''}
        <dl class="kv"><div><dt>Run</dt><dd>${esc(run.id.replace('RUN-', ''))} · attempt ${run.attempt}</dd></div><div><dt>Profile</dt><dd>${prof ? `<a class="link" href="${esc(ADE.plink(p.id, 'config', { contract: 'agents' }))}">${esc(prof.title)}</a>` : esc(run.system || run.profile || '—')}</dd></div><div><dt>Model</dt><dd>${esc((() => { const st = prof && run.wf.at ? prof.workflow.steps[run.wf.at] : null; return st && st.model ? `${st.model} (this step)` : prof ? prof.model : run.model || '—'; })())}</dd></div><div><dt>Runner</dt><dd>${esc(run.runner)}</dd></div><div><dt>Repository</dt><dd><code>${esc(run.repo)}</code> · <code>${esc(run.branch)}</code></dd></div><div><dt>Started</dt><dd>${esc(run.started)} · ${esc(run.elapsed)}</dd></div><div><dt>Stops by itself if</dt><dd>${run.stop.length ? esc(run.stop.join(' · ')) : '—'}</dd></div>${reviewA ? `<div><dt>Reviewer</dt><dd>${esc(ADE.personName(reviewA.to))} (${esc(reviewA.id)})</dd></div>` : ''}</dl>
        <div class="cols"><div><h4>Steps</h4>${ADE.stepList(p, run)}</div>
        <div><h4>Context supplied</h4><ul class="plain">${run.context.map((c) => `<li>${c.src ? `<button class="link" type="button" data-act="sourceOpen" data-pid="${esc(p.id)}" data-src="${esc(c.src)}">${esc(c.label)}</button>` : ADE.a(c.label, ADE.plink(p.id, `work/${c.work}`))}</li>`).join('') || '<li class="meta">None recorded</li>'}</ul>
        ${run.excluded.length ? `<h4>Excluded</h4><ul class="plain">${run.excluded.map((c) => `<li>${esc(c.label)} <span class="meta">— ${esc(c.why)}</span></li>`).join('')}</ul>` : ''}</div></div>
        <div class="console" id="console-${esc(run.id)}"><div class="console__bar"><span>${icon('terminal')}Console</span><button class="icon-btn" type="button" data-fs="#console-${esc(run.id)}" aria-label="Full screen">${icon('fullscreen')}</button></div><pre>${esc(run.console.join('\n'))}</pre></div>
        ${run.files.length ? `<h4>Changed files</h4>${ADE.changedFiles(p, run, 'run')}` : ''}
      </div>`;
  };

  /* ------------------------------------------------------------------ overridable compositions
     The lo-fi renders these states plainly. The hi-fi package (hifi/hifi.js) replaces them with the layouts the
     primitive contracts reserve for it (StepDetail, DiffViewer, Pager, RiskLayout, drag reordering). */
  ADE.stepList = (p, run) => `<ul class="plain step-status">${ADE.runSteps(p, run).map((s) => `<li>${ADE.badge(s.status === 'done' ? 'done' : s.status === 'fail' ? 'failed' : s.status === 'now' ? (run.state === 'awaiting-input' ? 'awaiting-input' : 'running') : 'queued', s.status === 'todo' ? 'Not started' : s.status === 'now' ? 'Now' : s.status === 'fail' ? 'Failed' : 'Done')} ${esc(s.title)}${s.visits > 1 ? ` <span class="meta">visited ${s.visits}×</span>` : ''}${s.note ? ` <span class="meta">— ${esc(s.note)}</span>` : ''}</li>`).join('') || '<li class="meta">—</li>'}</ul>`;
  ADE.changedFiles = (p, run, where) => `<table class="table"><tbody>${run.files.map((f) => `<tr><td><code>${esc(f.path)}</code></td><td class="num">+${f.add} −${f.del}</td></tr>`).join('')}</tbody></table>${where === 'review' ? '<p class="meta">Per-file diffs come with the hi-fi prototype.</p>' : ''}`;
  // Pager: the lo-fi shows every row. `opts` = { page, link(n), label }.
  ADE.pager = (rows) => ({ rows, html: '' });
  ADE.riskLayout = (p, list) => `<div class="risk-layout">
        <div class="risk-layout__matrix"><h2 class="h-small">Exposure now</h2>${ADE.riskMatrix(list, p.id)}<p class="meta">Chips sit at current likelihood × impact. Open a card for target, evidence and responses.</p></div>
        <div class="grid grid--2 risk-layout__cards">${list.map((r) => ADE.riskCard(p, r)).join('') || ADE.empty('task_alt', 'No risks match', 'Clear the filters.')}</div>
      </div>`;
  ADE.treeMove = (p, w, idx, sibs) => `<span class="tree__move">${idx > 0 ? `<button class="icon-btn" type="button" data-act="workMove" data-pid="${esc(p.id)}" data-wid="${esc(w.id)}" data-dir="-1" aria-label="Move ${esc(w.title)} up">${icon('arrow_upward')}</button>` : ''}${idx < sibs.length - 1 ? `<button class="icon-btn" type="button" data-act="workMove" data-pid="${esc(p.id)}" data-wid="${esc(w.id)}" data-dir="1" aria-label="Move ${esc(w.title)} down">${icon('arrow_downward')}</button>` : ''}</span>`;
  // Event rows link every run, work item, decision, risk and contribution they name.
  ADE.linkRefs = function (p, text) {
    return esc(text).replace(/\b(W-\d+|D-\d+|R-\d+|A-\d+|RUN-\d+|[Rr]un (\d{4}))\b/g, (m, id, runNo) => {
      if (runNo || id.startsWith('RUN-')) { const rid = runNo ? `RUN-${runNo}` : id; return p.runs.some((r) => r.id === rid) ? `<a class="link" href="${esc(ADE.plink(p.id, 'activity', { run: rid }))}">${m}</a>` : m; }
      if (id.startsWith('W-')) return item(p, id) ? `<a class="link" href="${esc(ADE.plink(p.id, `work/${id}`))}">${m}</a>` : m;
      if (id.startsWith('R-')) return riskById(p, id) ? `<a class="link" href="${esc(ADE.plink(p.id, 'risks', { risk: id }))}">${m}</a>` : m;
      if (id.startsWith('D-')) return p.decisions.some((d) => d.id === id) ? `<button class="link" type="button" data-act="decideOpen" data-pid="${esc(p.id)}" data-did="${esc(id)}">${m}</button>` : m;
      if (id.startsWith('A-')) return p.assignments.some((a) => a.id === id) ? `<a class="link" href="${esc(ADE.plink(p.id, 'inbox', { tab: 'all' }))}">${m}</a>` : m;
      return m;
    });
  };
  ADE.eventRow = (p, e) => `<div class="event">${icon(e.icon)}<span class="event__at meta">${esc(e.at)}</span><span class="event__text">${ADE.linkRefs(p, e.text)}<small>${icon('subdirectory_arrow_right')}<span>${ADE.linkRefs(p, e.triggered)}</span></small></span>${e.outcome && e.outcome !== 'none' ? ADE.badge(e.outcome === 'allow' ? 'allow' : e.outcome) : '<span class="badge badge--neutral">No action</span>'}</div>`;

  ADE.assignmentCard = function (p, a, viewer) {
    const cat = F.categories[a.category]; const w = item(p, a.subject);
    const mine = a.to === viewer;
    const actions = a.status === 'assigned' && mine
      ? (a.run ? ADE.btn('Review output', 'reviewOpen', { pid: p.id, run: a.run }, 'primary', 'visibility') : ADE.btn('Answer', 'answerOpen', { pid: p.id, aid: a.id }, 'primary', 'send')) + (p.contracts.routing.json.categories[a.category]?.canDelegate ? ADE.btn('Delegate', 'delegateOpen', { pid: p.id, aid: a.id }, 'quiet', 'forward_to_inbox') : '')
      : a.status === 'answered' && a.decision && P(p.id).decisions.find((d) => d.id === a.decision && d.status === 'open') ? `<span class="meta">Answer given · decision ${esc(a.decision)} is with ${esc(ADE.personName(p.owner))}</span>` : '';
    return `<article class="card assignment">
      <p class="assignment__cat">${icon(cat.icon)}${esc(cat.label)} · ${esc(a.id)} ${ADE.badge(a.status)}</p>
      <h3>${esc(a.ask)}</h3>
      <dl class="kv kv--tight"><div><dt>Why you</dt><dd>${esc(a.why)}</dd></div><div><dt>Blocks</dt><dd>${w ? ADE.a(a.blocks, ADE.plink(p.id, `work/${w.id}`)) : esc(a.blocks)}</dd></div><div><dt>Cost of waiting</dt><dd>${esc(a.waiting)}</dd></div><div><dt>You can</dt><dd>${esc(a.can)}</dd></div><div><dt>You can't</dt><dd>${esc(a.cannot)}</dd></div></dl>
      ${a.answer ? `<blockquote class="answer"><strong>${esc(ADE.personName(a.answeredBy || a.to))} answered:</strong> ${esc(a.answer)}</blockquote>` : ''}
      ${a.delegatedFrom ? `<p class="meta">Delegated by ${esc(ADE.personName(a.delegatedFrom))}${a.delegateNote ? `: “${esc(a.delegateNote)}”` : ''}</p>` : ''}
      <div class="assignment__foot">${ADE.person(a.to)}<span class="row-actions">${actions}</span></div>
    </article>`;
  };

  ADE.comments = function (p, type, id, list) {
    const g = ADE.can(p, 'comment');
    return `<div class="comments">
      ${list.length ? list.map((c) => `<div class="comment${c.agent ? ' comment--agent' : ''}"><span class="avatar">${c.agent ? icon('smart_toy') : esc(F.people[c.by].initials)}</span><div><p class="meta"><strong>${esc(c.agent ? 'Agent' : ADE.personName(c.by))}</strong> · ${esc(c.at)}${c.to ? ` · reply to ${esc(ADE.personName(c.to))}` : ''}</p><p>${esc(c.text)}${c.agent ? ADE.gen(`comment:${p.id}:${type}:${id}:${list.indexOf(c)}`, true) : ''}</p>${c.proposal ? `<div class="comment__proposal">${icon('auto_awesome')}<span>${esc(c.proposal.text)}</span>${c.proposal.done ? '<span class="badge badge--ok">Applied</span>' : ADE.btn(c.proposal.label, 'commentApply', { pid: p.id, type, id, idx: list.indexOf(c) }, 'outline')}</div>` : ''}</div></div>`).join('') : '<p class="meta">No comments yet.</p>'}
      <div class="comment-form" data-form>
        <textarea name="text" rows="2" placeholder="Comment for people, or mention @agent to ask it to do something with this ${type === 'risk' ? 'risk' : 'work item'}"></textarea>
        <div class="row-actions"><span class="meta">Comments stay on this ${type === 'risk' ? 'risk' : 'work item'}. There is no project-wide chat.</span>${ADE.gbtn(g, 'Comment', 'comment', { pid: p.id, type, id }, 'outline', 'send')}</div>
      </div>
    </div>`;
  };

  ADE.tree = function (p, { filter = '', readiness = '', expand = '', depth = '', select = '', selectable = false, selected = [], mine = '', reorder = '' } = {}) {
    const exp = ADE.ui.expanded; const me = ADE.state.persona;
    const rf = readiness ? readiness.split(',') : null;
    const f = filter.toLowerCase();
    const matches = (w) => (!f || w.title.toLowerCase().includes(f) || w.id.toLowerCase().includes(f)) && (!rf || (w.status === 'open' && rf.includes(ADE.ready(p, w)))) && (!mine || w.owner === me);
    const visible = (w) => matches(w) || descendants(p, w.id).some(matches);
    const isOpen = (w, d) => { const key = `tree:${p.id}:${w.id}`; if (key in exp) return exp[key]; if (expand === 'all' || f || rf || mine) return true; if (depth) return d < Number(depth); return d < 1; };
    const row = (w, d, sibs, idx) => {
      if (!visible(w)) return '';
      const ch = kids(p, w.id); const open = ch.length && isOpen(w, d); const r = roll(p, w.id);
      const waiting = w.status === 'open' ? ADE.openDeps(p, w) : [];
      const warn = w.status === 'open' ? ADE.orderWarnings(p, w) : [];
      const mv = reorder && ADE.can(p, 'order', { work: w }).ok ? ADE.treeMove(p, w, idx, sibs) : '';
      return `<li class="tree__item${select === w.id ? ' is-selected' : ''}" role="treeitem" ${ch.length ? `aria-expanded="${!!open}"` : ''} aria-level="${d + 1}" style="--d:${d}" data-wid="${esc(w.id)}" data-parent="${esc(w.parentId || '')}">
        <div class="tree__row">
          ${ch.length ? `<button class="icon-btn tree__toggle" type="button" data-act="toggle" data-key="tree:${esc(p.id)}:${esc(w.id)}" data-default="${open ? '1' : '0'}" aria-expanded="${!!open}" aria-label="${open ? 'Collapse' : 'Expand'} ${esc(w.title)}">${icon(open ? 'expand_more' : 'chevron_right')}</button>` : '<span class="tree__leaf"></span>'}
          ${selectable ? `<input type="checkbox" name="pick" value="${esc(w.id)}" ${selected.includes(w.id) ? 'checked' : ''} aria-label="Select ${esc(w.title)}">` : ''}
          <span class="tree__main"><a class="tree__title${matches(w) ? '' : ' is-context'}" href="${esc(ADE.plink(p.id, `work/${w.id}`))}">${esc(w.title)}</a>${waiting.length ? `<span class="chip chip--wait">${icon('hourglass_empty')}Waiting for ${esc(waiting.map((x) => x.id).join(', '))}</span>` : ''}${warn.length ? `<span class="chip chip--warn" title="Ordered before an unfinished dependency">${icon('warning_amber')}Ordered before ${esc(warn.join(', '))}</span>` : ''}</span>
          <span class="meta tree__id">${esc(w.id)}${ch.length ? ` · ${ch.length}` : ''}</span>
          ${ADE.person(w.owner, true)}
          ${ADE.workState(p, w)}
          <span class="tree__cost meta">${ch.length ? `${r.lo || r.hi ? range([r.lo, r.hi]) : '—'}${r.unknown ? ` +${r.unknown}?` : ''}` : w.forecast ? range(w.forecast) : w.status === 'done' ? eur(w.actual) : 'No estimate'}</span>
          ${mv}
        </div>
        ${open ? `<ul role="group">${ch.map((c, i) => row(c, d + 1, ch, i)).join('')}</ul>` : ''}
      </li>`;
    };
    const top = roots(p);
    const body = top.map((w, i) => row(w, 0, top, i)).join('');
    return `<ul class="tree${reorder ? ' tree--reorder' : ''}" role="tree" aria-label="Work items">${body || `<li role="none">${ADE.empty('search', 'No work matches', 'Clear the filter to see the whole tree.')}</li>`}</ul>`;
  };

  ADE.md = function (text) {
    if (!text) return '';
    const lines = text.split('\n'); let html = ''; let inCode = false; let table = [];
    const inline = (s) => esc(s).replace(/==(.+?)==/g, '<mark>$1</mark>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>');
    const flush = () => { if (table.length) { html += `<table class="table"><tbody>${table.filter((r) => !/^\|[-| ]+\|$/.test(r)).map((r) => `<tr>${r.split('|').slice(1, -1).map((c) => `<td>${inline(c.trim())}</td>`).join('')}</tr>`).join('')}</tbody></table>`; table = []; } };
    lines.forEach((l) => {
      if (l.startsWith('```')) { flush(); html += inCode ? '</pre>' : '<pre>'; inCode = !inCode; return; }
      if (inCode) { html += `${esc(l)}\n`; return; }
      if (l.startsWith('|')) { table.push(l); return; }
      flush();
      if (/^#{1,3} /.test(l)) { const n = l.match(/^#+/)[0].length + 2; html += `<h${n}>${inline(l.replace(/^#+ /, ''))}</h${n}>`; } else if (l.startsWith('- ')) html += `<p class="md-li">• ${inline(l.slice(2))}</p>`; else if (l.trim()) html += `<p>${inline(l)}</p>`;
    });
    flush();
    return html;
  };
})(typeof window !== 'undefined' ? window : globalThis);
