// ADE v3 lo-fi prototype · state model added in the Phase 5 correction pass (pure functions, no DOM).
// Readiness computed from typed checks and dependencies, parent completion, dependency cycles, per-action grants,
// agent-profile workflows, deduplicated and revisioned sources, decisions as knowledge, computed summaries with an
// outdated state, and project settings. Loaded after core.js; check.mjs runs it in Node.
(function (root) {
  const ADE = root.ADE;
  const F = ADE.fixtures;
  const { item, kids, clone } = ADE;
  const S = () => ADE.state;

  /* ------------------------------------------------------------------ fingerprints */
  ADE.digest = (text) => { let h = 5381; const s = String(text || ''); for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return `d${h.toString(16).padStart(8, '0')}`; };

  /* ------------------------------------------------------------------ normalisation (fixture → state) */
  ADE.normalizeProject = function (p) {
    if (p.budget.amount == null) { p.budget.amount = p.budget.eur; delete p.budget.eur; }
    p.description = p.description || p.goal || '';
    ['goal', 'inScope', 'outScope', 'attachments', 'scopeIn', 'scopeOut', 'summary'].forEach((k) => delete p[k]);
    p.contracts.agents = p.contracts.agents || F.agentsContract();
    p.contracts.skills = p.contracts.skills || F.skillsContract();
    p.contracts.settings = p.contracts.settings || F.settingsContract();
    p.sources.forEach((s) => { if (s.digest === undefined) s.digest = s.markdown ? ADE.digest(s.markdown) : null; if (!s.revisions) s.revisions = s.digest ? [{ rev: s.revision, digest: s.digest, date: 'first import' }] : []; });
    p.work.forEach((w) => {
      if (!w.criteria) w.criteria = (w.ac || []).map((text, i) => ({ id: `AC${i + 1}`, text }));
      delete w.ac;
      if (!w.attachments) w.attachments = (w.sources || []).map((src) => ({ src, rev: (ADE.source(p, src) || {}).revision || '—' }));
      delete w.sources;
      if (w.confirmed === undefined) w.confirmed = w.readiness !== 'not-ready' || w.status !== 'open';
      delete w.readiness;
      w.checks = (w.checks || []).filter((c) => c.kind);
      w.purpose = w.purpose || '';
      ['inScope', 'outScope'].forEach((k) => { w[k] = Array.isArray(w[k]) ? w[k] : w[k] ? [w[k]] : []; });
      w.doneExtra = w.doneExtra || []; w.deps = w.deps || []; w.provider = w.provider || 0; w.humanDays = w.humanDays || 0;
    });
    p.runs.forEach((r) => { r.wf = r.wf || { at: null, visits: {}, trail: [] }; });
    p.releases.forEach((r) => { delete r.summary; delete r.humanDays; });
    p.risks.forEach((r) => { delete r.policy; });
    ADE.withProject(p, () => { p.work.forEach((w) => { w._r = ADE.readiness(p, w).state; }); ADE.regenerateSummaries(p); });
    return p;
  };

  /* ------------------------------------------------------------------ units and formats */
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  ADE.fmtCtx = { currency: 'EUR', number: 'en-GB', date: 'dmy', dayHours: 8, dayRate: null };
  ADE.prefs = (id = S().persona) => ({ number: 'en-GB', date: 'dmy', ...((S().prefs || {})[id] || {}) });
  ADE.withProject = function (p, fn) {
    const prev = ADE.fmtCtx; ADE.useProject(p);
    try { return fn(); } finally { ADE.fmtCtx = prev; }
  };
  ADE.useProject = function (p) { const set = p && p.contracts && p.contracts.settings ? p.contracts.settings.json : {}; const pr = S() ? ADE.prefs() : {}; ADE.fmtCtx = { currency: set.currency || 'EUR', number: pr.number, date: pr.date, dayHours: set.workingDayHours || 8, dayRate: set.humanDayRate || null }; };
  const nf = (opts) => new Intl.NumberFormat(ADE.fmtCtx.number, opts);
  ADE.money = (n) => (n == null ? 'Unknown' : nf({ style: 'currency', currency: ADE.fmtCtx.currency, maximumFractionDigits: n < 10 && n % 1 ? 2 : 0 }).format(n));
  ADE.num = (n) => nf({ maximumFractionDigits: 2 }).format(n);
  ADE.moneyRange = (r) => {
    if (!r) return 'No estimate';
    const parts = nf({ style: 'currency', currency: ADE.fmtCtx.currency, maximumFractionDigits: 0 }).formatToParts(r[0]);
    const trailing = parts.findIndex((x) => x.type === 'currency') > parts.findIndex((x) => x.type === 'integer');
    return trailing ? `${ADE.money(r[0])}–${ADE.money(r[1])}` : `${ADE.money(r[0])}–${ADE.num(r[1])}`;
  };
  ADE.days = (d) => `${ADE.num(Math.round(d * 10) / 10)} ${d === 1 ? 'day' : 'days'}`;
  ADE.agentTime = (min) => (min < 60 ? `${Math.round(min)} min` : `${Math.floor(min / 60)} h ${Math.round(min % 60)} min`);
  ADE.date = (text) => String(text ?? '').replace(/(\d{1,2})(?:–(\d{1,2}))? (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/g, (m, a, b, mon) => {
    const style = ADE.fmtCtx.date;
    if (style === 'mdy') return `${mon} ${a}${b ? `–${b}` : ''}`;
    if (style === 'numeric') { const mm = String(MON.indexOf(mon) + 1).padStart(2, '0'); return `${a}.${b ? `–${b}.` : ''}${mm}.`; }
    return m;
  });
  ADE.fill = (text, p) => String(text).replace(/\{limit\}/g, () => ADE.money(p.contracts.policy.json.limits.agentRunMax)).replace(/\{m:([\d.]+)\}/g, (m, n) => ADE.money(Number(n)));

  /* ------------------------------------------------------------------ spend by kind */
  ADE.spend = function (p, wid) {
    const w = item(p, wid); const ch = kids(p, wid);
    if (!ch.length) { const agent = Math.max(0, (w.actual || 0) - (w.provider || 0)); return { agent, provider: w.provider || 0, humanDays: w.humanDays || 0, agentMin: Math.round(agent * 0.8) }; }
    return ch.map((c) => ADE.spend(p, c.id)).reduce((a, b) => ({ agent: a.agent + b.agent, provider: a.provider + b.provider, humanDays: a.humanDays + b.humanDays, agentMin: a.agentMin + b.agentMin }), { agent: 0, provider: 0, humanDays: (w.humanDays || 0), agentMin: 0 });
  };
  ADE.spendOf = (p, ids) => ids.map((id) => ADE.spend(p, id)).reduce((a, b) => ({ agent: a.agent + b.agent, provider: a.provider + b.provider, humanDays: a.humanDays + b.humanDays, agentMin: a.agentMin + b.agentMin }), { agent: 0, provider: 0, humanDays: 0, agentMin: 0 });

  /* ------------------------------------------------------------------ readiness (typed checks, dependencies) */
  const isLeaf = (p, w) => !kids(p, w.id).length;
  ADE.isLeaf = isLeaf;
  ADE.hasRepo = (p) => p.sources.some((s) => s.kind === 'Code repository' && s.status === 'connected');
  ADE.openDeps = (p, w) => (w.deps || []).map((id) => item(p, id)).filter((d) => d && d.status !== 'done');
  ADE.readiness = function (p, w) {
    const checks = [];
    const missing = [!w.purpose.trim() && 'purpose', !w.inScope.length && 'in scope', !w.criteria.length && 'acceptance criteria'].filter(Boolean);
    checks.push({ id: 'fields', text: 'Purpose, scope and acceptance criteria written', ok: !missing.length, fix: `Missing: ${missing.join(', ')}. Use the edit button on the section.` });
    if (w.deps.length) {
      const open = ADE.openDeps(p, w);
      checks.push({ id: 'deps', text: `Depends on ${w.deps.join(', ')}: every dependency done`, ok: !open.length, fix: `Waiting for ${open.map((d) => `${d.id} (${ADE.label(d.status === 'open' ? 'open' : d.status).toLowerCase()})`).join(', ')}` });
    }
    if (w.decisionItem) checks.push({ id: 'answer', text: 'Answer adopted by the accountable owner', ok: (w.questions || []).every((q) => q.resolved), fix: 'An answer is waiting to be given or adopted', state: 'needs-decision' });
    else {
      checks.push({ id: 'forecast', text: w.forecast ? `Forecast recorded (${ADE.moneyRange(w.forecast)})` : 'Forecast recorded', ok: !!w.forecast, fix: 'Ask @agent for an estimate in the comments, or use Edit' });
      checks.push({ id: 'repo', text: 'Code repository connected at a known revision', ok: ADE.hasRepo(p), fix: 'Connect or create a repository from Knowledge' });
    }
    (w.checks || []).forEach((c) => {
      let ok = false; let fix = c.fix;
      if (c.kind === 'decision') { const d = p.decisions.find((x) => x.id === c.ref); ok = !!d && d.status === 'decided'; fix = d ? `Decision ${d.id} is waiting for ${ADE.personName(d.decider)}` : `Decision ${c.ref} not found`; }
      else if (c.kind === 'assignment') { const a = p.assignments.find((x) => x.id === c.ref); ok = !!a && a.status === 'answered'; fix = a ? `${a.id} is with ${ADE.personName(a.to)}` : `${c.ref} not found`; }
      else if (c.kind === 'source') { const s = ADE.source(p, c.ref); ok = !!s && !['inaccessible', 'access-requested', 'extracting'].includes(s.status); fix = s ? `${s.title} is ${ADE.label(s.status).toLowerCase()}` : `${c.ref} not found`; }
      else if (c.kind === 'grant') ok = !w.outsideGrant;
      else ok = !!c.ok;
      checks.push({ ...c, ok, fix, state: c.state || (c.kind === 'source' || c.kind === 'grant' ? 'blocked' : c.kind === 'decision' || c.kind === 'assignment' ? 'needs-decision' : undefined) });
    });
    if (!w.decisionItem) checks.push({ id: 'confirm', text: 'Owner confirmed the scope', ok: !!w.confirmed, fix: `${ADE.personName(w.owner)} confirms with “Mark ready”` });
    if (w.status !== 'open' || !isLeaf(p, w)) return { state: null, checks };
    const failing = checks.filter((c) => !c.ok);
    const state = !failing.length ? 'ready' : failing.some((c) => c.state === 'blocked') ? 'blocked' : failing.some((c) => c.state === 'needs-decision') ? 'needs-decision' : 'not-ready';
    return { state, checks, failing };
  };
  ADE.ready = (p, w) => ADE.readiness(p, w).state;

  /* ------------------------------------------------------------------ parent completion and dependency graph */
  ADE.canComplete = function (p, w) {
    const open = kids(p, w.id).filter((c) => !['done', 'deferred'].includes(c.status));
    return open.length ? { ok: false, why: `${open.length} child item${open.length === 1 ? ' is' : 's are'} not done or deferred (${open.slice(0, 3).map((c) => c.id).join(', ')}${open.length > 3 ? '…' : ''})` } : { ok: true };
  };
  // "A waits for B" edges: dependencies, and a parent waiting for each child.
  const waitsFor = (p, id) => { const w = item(p, id); return w ? [...(w.deps || []), ...kids(p, id).map((c) => c.id)] : []; };
  ADE.wouldCycle = function (p, from, to) {
    if (from === to) return 'An item cannot depend on itself.';
    const seen = new Set(); const stack = [to];
    while (stack.length) { const cur = stack.pop(); if (cur === from) return `${to} already waits for ${from}${ADE.ancestors(p, from).some((a) => a.id === to) ? ' (it contains it)' : ''}, so this would be a cycle.`; if (seen.has(cur)) continue; seen.add(cur); stack.push(...waitsFor(p, cur)); }
    return null;
  };
  ADE.treeOrder = (p) => { const out = []; const walk = (w) => { out.push(w.id); kids(p, w.id).forEach(walk); }; ADE.roots(p).forEach(walk); return out; };
  ADE.orderWarnings = function (p, w) {
    const order = ADE.treeOrder(p); const i = order.indexOf(w.id);
    return (w.deps || []).filter((d) => order.indexOf(d) > i && item(p, d) && item(p, d).status !== 'done');
  };

  /* ------------------------------------------------------------------ grants per action */
  const VERB = { edit: 'edit this item', split: 'split this item', 'add-child': 'add children here', deps: 'change dependencies', attach: 'change attachments', order: 'reorder this item', 'mark-ready': 'mark this item ready', 'mark-done': 'mark this item done', 'run-control': 'pause or stop this run', 'release-membership': 'change release membership', 'customer-outcome': 'change the customer-outcome flag', 'create-release': 'create releases', 'risk-owner': 'set risk owners', activate: 'activate configuration', automation: 'pause automations', description: 'edit the project description', 'create-work': 'create top-level work', comment: 'comment', 'request-contribution': 'request a contribution', 'raise-risk': 'raise a risk', 'start-agent': 'start an agent', review: 'review this output', 'run-human': 'answer this workflow step' };
  const OWNER_ONLY = new Set(['release-membership', 'customer-outcome', 'create-release', 'risk-owner', 'activate', 'automation', 'description', 'create-work']);
  const WORK_OWNER = new Set(['edit', 'split', 'add-child', 'deps', 'attach', 'order', 'mark-ready', 'mark-done', 'run-control', 'run-human']);
  const MEMBER = new Set(['comment', 'request-contribution', 'raise-risk', 'start-agent']);
  ADE.can = function (p, action, ctx = {}, actor = S().persona) {
    const verb = VERB[action] || action; const owner = ADE.personName(p.owner);
    if (!p.access.includes(actor)) return { ok: false, why: `You are not a member of ${p.name}.` };
    if (actor === p.owner && action !== 'review') return { ok: true };
    if (OWNER_ONLY.has(action)) return { ok: false, why: `Only ${owner} (accountable owner) can ${verb}.` };
    if (WORK_OWNER.has(action)) { const w = ctx.work; return w && w.owner === actor ? { ok: true } : { ok: false, why: `Only ${w ? ADE.personName(w.owner) : 'the work owner'} (work owner) or ${owner} (accountable owner) can ${verb}.` }; }
    if (MEMBER.has(action)) return { ok: true };
    if (action === 'review') return ctx.reviewer === actor ? { ok: true } : { ok: false, why: `Only ${ADE.personName(ctx.reviewer)} (assigned reviewer) can ${verb}.` };
    return { ok: false, why: `No grant covers “${verb}”.` };
  };
  ADE.grantTable = () => [
    ['Accountable owner', 'Everything, including release membership, the customer-outcome flag, creating releases, risk owners, the project description, configuration activation and automations'],
    ['Work owner', 'On their own items: edit any section, split and add children, dependencies, attachments, order, mark ready, mark done, pause or stop runs, answer workflow steps'],
    ['Any member', 'Comment, request a contribution, raise a risk, start an agent (policy then allows it, routes it for a decision or denies it)'],
    ['Reviewer', 'Accept, request changes or reject the output assigned to them by contribution routing'],
  ];

  /* ------------------------------------------------------------------ agent profiles and workflows */
  ADE.profiles = (p) => p.contracts.agents.json.profiles;
  ADE.profile = (p, id) => ADE.profiles(p)[id];
  ADE.defaultProfile = (p, w) => { const d = p.contracts.agents.json.defaults; return (w && w.investigation ? d.investigation : d.implementation) || Object.keys(ADE.profiles(p))[0]; };
  // The happy path from start to end: `next`, else the first `on` outcome (pass/approved/retry), never revisiting a step.
  ADE.mainPath = function (prof) {
    const steps = prof.workflow.steps; const out = []; const seen = new Set(); let cur = prof.workflow.start;
    while (cur && steps[cur] && !seen.has(cur)) { seen.add(cur); const st = steps[cur]; out.push({ id: cur, ...st }); if (st.kind === 'end') break; cur = st.next || (st.on && (st.on.pass || st.on.approved || st.on.retry || Object.values(st.on)[0])); }
    return out;
  };
  ADE.policyRequires = (p, w) => (w ? ADE.evaluate(p, w).requires : ['human-review']);
  // Effective workflow = profile path + human steps policy requires. A profile can never remove them.
  ADE.effectiveSteps = function (p, profId, w) {
    const prof = ADE.profile(p, profId); if (!prof) return [];
    const path = ADE.mainPath(prof); const req = ADE.policyRequires(p, w);
    if (req.includes('human-review')) path.push({ id: '@review', kind: 'human', title: 'Human review', addedBy: `policy ${w ? ADE.evaluate(p, w).rule || '' : 'P4'}`.trim() });
    return path;
  };
  ADE.stepDetail = function (p, prof, st) {
    const bits = [];
    if (st.kind === 'agent') { bits.push(st.skill); if (st.model && st.model !== prof.model) bits.push(st.model); bits.push(`${st.session} session`); }
    if (st.kind === 'check') bits.push(st.command);
    if (st.kind === 'human') bits.push(st.addedBy ? `added by ${st.addedBy}` : ({ 'work-owner': 'work owner' }[st.who] || st.who));
    if (st.maxVisits) bits.push(`up to ${st.maxVisits}×`);
    return bits.filter(Boolean).join(' · ');
  };
  ADE.stepSummary = function (p, profId, w) {
    const prof = ADE.profile(p, profId); if (!prof) return 'Unknown profile';
    const steps = ADE.effectiveSteps(p, profId, w);
    return steps.map((st, i) => { const back = st.kind === 'check' && st.on && Object.values(st.on).some((t) => steps.findIndex((x) => x.id === t) > -1 && steps.findIndex((x) => x.id === t) < i); return `${back ? '⇄ ' : i ? '→ ' : ''}${st.title}${st.kind === 'end' ? '' : ` (${ADE.stepDetail(p, prof, st)})`}`; }).join(' ');
  };
  // Step line entries for a run: each main-path step with a status.
  ADE.runSteps = function (p, r) {
    if (r.system || !r.profile) return r.wf.trail.map((t) => ({ id: t.step, title: t.step, status: 'done' }));
    const w = r.work && item(p, r.work); const prof = ADE.profile(p, r.profile);
    if (!prof) return [];
    return ADE.effectiveSteps(p, r.profile, w).map((st) => {
      const last = [...r.wf.trail].reverse().find((t) => t.step === st.id);
      const visits = r.wf.visits[st.id] || 0;
      let status = 'todo';
      if (st.id === '@review') status = r.state === 'awaiting-review' ? 'now' : ['complete'].includes(r.state) ? 'done' : ['changes-requested', 'rejected'].includes(r.state) ? 'fail' : 'todo';
      else if (r.wf.at === st.id && !['complete', 'failed', 'stopped', 'awaiting-review', 'changes-requested', 'rejected'].includes(r.state)) status = 'now';
      else if (last) status = ['fail', 'exhausted', 'changes-requested'].includes(last.outcome) ? 'fail' : 'done';
      return { id: st.id, title: st.title, kind: st.kind, status, visits, max: st.maxVisits, model: st.model || prof.model, session: st.session, addedBy: st.addedBy, note: last && last.note };
    });
  };
  // Every cycle in a workflow must pass through a step with maxVisits and onExhausted. Returns the unbounded cycles' steps.
  ADE.unboundedLoops = function (prof) {
    const steps = prof.workflow.steps; const bounded = (id) => steps[id] && steps[id].maxVisits && steps[id].onExhausted;
    const edges = (id) => [steps[id].next, ...Object.values(steps[id].on || {})].filter((x) => x && steps[x] && !bounded(x));
    const bad = new Set(); const state = {};
    const visit = (id, stack) => { state[id] = 1; stack.push(id); edges(id).forEach((n) => { if (state[n] === 1) stack.slice(stack.indexOf(n)).forEach((x) => bad.add(x)); else if (!state[n]) visit(n, stack); }); stack.pop(); state[id] = 2; };
    Object.keys(steps).filter((id) => !bounded(id)).forEach((id) => { if (!state[id]) visit(id, []); });
    return [...bad];
  };
  ADE.newWorkflow = (prof) => ({ at: prof.workflow.start, visits: { [prof.workflow.start]: 1 }, trail: [] });

  /* ------------------------------------------------------------------ attachments, revisions, deduplication */
  ADE.attach = function (p, w, srcId) {
    const s = ADE.source(p, srcId); if (!s) return false;
    if (w) { if (w.attachments.some((a) => a.src === srcId)) return false; w.attachments.push({ src: srcId, rev: s.revision }); p.facts.filter((f) => f.source === srcId && !f.superseded).forEach((f) => { f.usedBy = f.usedBy || []; if (!f.usedBy.includes(w.id)) f.usedBy.push(w.id); }); }
    return true;
  };
  ADE.detach = function (p, w, srcId) {
    if (w) { w.attachments = w.attachments.filter((a) => a.src !== srcId); p.facts.filter((f) => f.source === srcId).forEach((f) => { f.usedBy = (f.usedBy || []).filter((u) => u !== w.id); }); }
  };
  ADE.attachedTo = (p, srcId) => p.work.filter((w) => w.attachments.some((a) => a.src === srcId));
  // Classify an upload against the project's sources. Same bytes → link; same name, other bytes → ask; unreadable same-name source → fill.
  ADE.classifyUpload = function (p, up) {
    const d = ADE.digest(up.markdown);
    const same = p.sources.find((s) => (s.revisions || []).some((r) => r.digest === d));
    if (same) return { kind: 'linked', source: same, digest: d };
    const named = p.sources.find((s) => s.title === up.title);
    if (named && ['inaccessible', 'access-requested'].includes(named.status)) return { kind: 'fill', source: named, digest: d };
    if (named) return { kind: 'ask', source: named, digest: d };
    return { kind: 'new', digest: d };
  };
  ADE.ingest = function (p, up, choice, by) {
    const c = ADE.classifyUpload(p, up); const rev = `r-${S().seq + 1}`; S().seq += 1;
    if (c.kind === 'linked') return { ...c };
    const base = { kind: 'Document', freshness: 'current', status: 'extracting', purpose: up.purpose, markdown: up.markdown, pendingFacts: up.facts || [], resolvesRisk: up.resolvesRisk };
    if (c.kind === 'fill') { Object.assign(c.source, base, { revision: rev, digest: c.digest, provenance: `uploaded by ${ADE.personName(by)}` }); c.source.revisions.push({ rev, digest: c.digest, date: 'today' }); return c; }
    if (c.kind === 'ask' && !choice) return c;
    if (c.kind === 'ask' && choice === 'revision') {
      const s = c.source; Object.assign(s, base, { revision: rev, digest: c.digest, supersedeOnExtract: true, provenance: `${s.provenance} · revision by ${ADE.personName(by)}` }); s.revisions.push({ rev, digest: c.digest, date: 'today' });
      return { kind: 'revision', source: s };
    }
    const id = `S-${Math.max(0, ...p.sources.map((s) => Number(s.id.split('-')[1]) || 0)) + 1}`;
    const src = { id, title: up.title, provenance: `uploaded by ${ADE.personName(by)}`, revision: rev, digest: c.digest, revisions: [{ rev, digest: c.digest, date: 'today' }], ...base, overlaps: c.kind === 'ask' ? c.source.id : undefined };
    p.sources.push(src);
    return { kind: c.kind === 'ask' ? 'overlap' : 'new', source: src };
  };
  // Extraction finishes on the next tick: facts land, superseded facts are marked, items pinned to older revisions see it.
  ADE.finishExtraction = function (p, s) {
    s.status = 'accepted';
    const newFacts = (s.pendingFacts || []).map((text) => ({ id: ADE.nextId('F'), text, kind: 'Source-grounded', source: s.id, rev: s.revision, usedBy: [] }));
    if (s.supersedeOnExtract) p.facts.filter((f) => f.source === s.id && !f.superseded).forEach((f) => { const match = newFacts.find((n) => n.text === f.text) || newFacts[0]; f.superseded = `revision ${s.revision}`; f.supersededBy = match ? match.id : null; if (match) match.usedBy = [...new Set([...match.usedBy, ...(f.usedBy || [])])]; });
    p.facts.push(...newFacts);
    delete s.pendingFacts; delete s.supersedeOnExtract;
    return newFacts;
  };
  ADE.newerRevision = (p, att) => { const s = ADE.source(p, att.src); return s && s.revision !== att.rev && s.status !== 'extracting' ? s.revision : null; };

  /* ------------------------------------------------------------------ decisions feed knowledge */
  ADE.decisionFact = function (p, d, chosenText) {
    const fact = { id: ADE.nextId('F'), text: `${d.title.replace(/[.?]$/, '')}: ${chosenText}`, kind: 'Decision', source: null, decision: d.id, usedBy: d.subject ? [d.subject] : [] };
    p.facts.filter((f) => !f.superseded && ['Conflict', 'Open question'].includes(f.kind) && (f.usedBy || []).includes(d.subject)).forEach((f) => { f.superseded = `decision ${d.id}`; f.supersededBy = fact.id; });
    p.facts.push(fact);
    return fact;
  };
  ADE.currentFacts = (p) => p.facts.filter((f) => !f.superseded);

  /* ------------------------------------------------------------------ computed summaries with an outdated state */
  const costPhrase = (t, budget) => (t.actual > budget ? `is over budget by ${ADE.money(t.actual - budget)}` : t.lo > budget ? 'is forecast above budget' : t.hi > budget ? `may exceed its ${ADE.money(budget)} budget` : `is within its ${ADE.money(budget)} budget`);
  const timePhrase = (r) => (!r.timeRatio ? 'its finish date is unknown' : r.timeRatio[0] > r.timeRatio[3] ? 'it is forecast to finish after plan' : r.timeRatio[1] > r.timeRatio[3] ? `it may finish after ${ADE.date(r.planned)}` : 'it is on plan');
  ADE.projectSummaryFresh = function (p) {
    const facts = []; const omitted = []; const uncertain = [];
    const rels = p.releases.map((r) => ({ r, t: ADE.releaseTotals(p, r) }));
    const next = rels.find((x) => x.t.done < x.t.leaves) || rels[0];
    const parts = [];
    if (next) { parts.push(`${next.r.name} ${costPhrase(next.t, next.r.budget)} and ${timePhrase(next.r)}`); facts.push({ text: `${next.r.name}: forecast ${ADE.moneyRange([next.t.lo, next.t.hi])}${next.t.unknown ? ` plus ${next.t.unknown} unestimated` : ''} against ${ADE.money(next.r.budget)}; finish ${ADE.date(next.r.forecastFinish)} against ${ADE.date(next.r.planned)}.`, kind: 'Forecast', source: `Release ${next.r.id} roll-up` }); }
    const open = p.decisions.filter((d) => d.status === 'open');
    if (open.length) { parts.push(`${open.length === 1 ? 'one decision waits' : `${open.length} decisions wait`}, first “${open[0].title}” with ${ADE.personName(open[0].decider)}`); facts.push({ text: `${open[0].title} (${open[0].id}) waits for ${ADE.personName(open[0].decider)}.`, kind: 'Open question', source: `Decision ${open[0].id}` }); open.slice(1).forEach((d) => omitted.push({ text: d.title, why: 'Counted, not named.' })); }
    else parts.push('no decision is waiting');
    const blocked = p.work.filter((w) => ADE.ready(p, w) === 'blocked');
    if (blocked.length) { const f = ADE.readiness(p, blocked[0]).failing[0]; parts.push(`${blocked.length === 1 ? 'one item is' : `${blocked.length} items are`} blocked, for example “${blocked[0].title}”: ${f.fix.charAt(0).toLowerCase()}${f.fix.slice(1)}`); facts.push({ text: `${blocked[0].id} is blocked: ${f.fix}.`, kind: 'Observed', source: 'Readiness checks' }); }
    const review = p.runs.filter((r) => r.state === 'awaiting-review').length;
    if (review) facts.push({ text: `${review} agent output${review === 1 ? '' : 's'} waiting for review.`, kind: 'Observed', source: 'Agent runs' });
    rels.filter((x) => x !== next).forEach((x) => omitted.push({ text: `${x.r.name}: ${ADE.moneyRange([x.t.lo, x.t.hi])} against ${ADE.money(x.r.budget)}.`, why: 'Later release; not the next outcome.' }));
    rels.filter((x) => x.t.unknown).forEach((x) => uncertain.push({ text: `${x.r.name} has ${x.t.unknown} unestimated item${x.t.unknown === 1 ? '' : 's'}.`, why: 'Its forecast is partial, not zero.' }));
    const text = parts.length ? `${parts.join('; ')}.`.replace(/^./, (c) => c.toUpperCase()) : 'No releases yet.';
    return { text, facts, omitted, uncertain };
  };
  ADE.releaseSummaryFresh = function (p, rel) {
    const t = ADE.releaseTotals(p, rel); const rows = ADE.membership(p, rel);
    const inRel = (id) => rows.some((m) => m.id === id || ADE.descendants(p, m.id).some((d) => d.id === id));
    const decs = p.decisions.filter((d) => d.status === 'open' && (d.subject === rel.id || inRel(d.subject)));
    const blocked = p.work.filter((w) => inRel(w.id) && ADE.ready(p, w) === 'blocked');
    const risks = ADE.openRisks(p).filter((r) => r.affects.some(inRel)).sort((a, b) => b.now[0] * b.now[1] - a.now[0] * a.now[1]);
    const parts = [`${t.done} of ${t.leaves} leaf items done; forecast ${ADE.moneyRange([t.lo, t.hi])}${t.unknown ? ` plus ${t.unknown} unestimated` : ''} against ${ADE.money(rel.budget)}`];
    parts.push(decs.length ? `${decs.length === 1 ? 'one open decision holds it' : `${decs.length} open decisions hold it`}: “${decs[0].title}”` : 'no decision holds it');
    if (blocked.length) parts.push(`${blocked.length} blocked item${blocked.length === 1 ? '' : 's'}`);
    const facts = [{ text: `Forecast ${ADE.moneyRange([t.lo, t.hi])}${t.unknown ? ` plus ${t.unknown} unestimated` : ''} against ${ADE.money(rel.budget)}; spent ${ADE.money(t.actual)}.`, kind: 'Forecast', source: 'Release roll-up (descendants counted once)' }, { text: `${t.done} of ${t.leaves} leaf items done.`, kind: 'Observed', source: 'Work tree' }, ...decs.slice(0, 1).map((d) => ({ text: `${d.title} waits for ${ADE.personName(d.decider)}.`, kind: 'Open question', source: `Decision ${d.id}` })), ...risks.slice(0, 2).map((r) => ({ text: r.title, kind: 'Risk', source: `Risk ${r.id}` }))];
    return { text: `${parts.join('; ')}.`.replace(/^./, (c) => c.toUpperCase()), facts, omitted: risks.slice(2).map((r) => ({ text: r.title, why: 'Lower exposure.' })), uncertain: t.unknown ? [{ text: `${t.unknown} items unestimated.`, why: 'Forecast is partial, not zero.' }] : [] };
  };
  ADE.regenerateSummaries = function (p) {
    p.summaries = { project: ADE.projectSummaryFresh(p) };
    p.releases.forEach((r) => { p.summaries[`release:${r.id}`] = ADE.releaseSummaryFresh(p, r); });
  };
  ADE.summary = function (p, key) {
    const fresh = key === 'project' ? ADE.projectSummaryFresh(p) : ADE.releaseSummaryFresh(p, p.releases.find((r) => `release:${r.id}` === key));
    const cached = (p.summaries || {})[key];
    return cached ? { ...cached, outdated: cached.text !== fresh.text, fresh } : { ...fresh, outdated: false, fresh };
  };
  ADE.outdatedSummaries = (p) => ['project', ...p.releases.map((r) => `release:${r.id}`)].filter((k) => ADE.summary(p, k).outdated);

  /* ------------------------------------------------------------------ settle: readiness transitions after every action */
  ADE.settle = function (p) {
    p.work.forEach((w) => {
      const r = ADE.ready(p, w);
      if (r === 'ready' && w._r !== 'ready' && ADE.onReady) ADE.onReady(p, w);
      w._r = ADE.ready(p, w);
    });
  };
  ADE.settleAll = () => Object.values(S().projects).forEach((p) => ADE.withProject(p, () => ADE.settle(p)));
  ADE.dispatch = function (name, args) {
    const fn = ADE.actions[name];
    if (!fn) throw new Error(`No action ${name}`);
    fn(args);
    ADE.settleAll();
  };

  ADE.cloneContract = (c) => clone(c);
})(typeof window !== 'undefined' ? window : globalThis);
