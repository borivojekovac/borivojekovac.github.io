// ADE v3 lo-fi prototype · deterministic prototype actions and popup content. No action calls a backend.
// Every action checks its grant; unauthorised calls change nothing and explain why.
(function (root) {
  const ADE = (root.ADE = root.ADE || {});
  const F = ADE.fixtures;
  const { esc, icon, eur, range } = ADE;
  const S = () => ADE.state;
  const me = () => S().persona;
  const now = () => `Today ${String(10 + Math.floor(S().clock / 6)).padStart(2, '0')}:${String((S().clock * 10) % 60).padStart(2, '0')}`;
  const event = (p, ic, text, triggered, outcome = 'none') => p.events.unshift({ at: now(), icon: ic, text, triggered, outcome });
  const toast = (t) => { ADE.ui.toast = t; };
  const popup = (kind, args = {}) => { ADE.ui.popup = { kind, args }; };
  ADE.nav = (hash) => { ADE.pendingNav = hash; };
  const A = (ADE.actions = {});
  const W = (pid, wid) => ADE.item(ADE.P(pid), wid);
  // Grant gate for actions: returns true when allowed; otherwise explains and changes nothing.
  const allowed = (p, action, ctx) => { const g = ADE.can(p, action, ctx); if (!g.ok) toast(g.why); return g.ok; };
  const lines = (text) => String(text || '').split('\n').map((s) => s.trim()).filter(Boolean);
  const draftFor = (group) => {
    const [kind, ...rest] = group.split(':');
    const d = S().drafts;
    if (kind === 'split') return (d.split[rest.join(':')] = d.split[rest.join(':')] || {});
    if (kind === 'create') { const c = d.create || A.createInit(); if (rest[0] === 'goal') return (c.goalChoice = c.goalChoice || {}); if (rest[0] === 'refine') return (c.refine[rest[1]] = c.refine[rest[1]] || {}); }
    if (kind === 'import') { const i = d.import || A.importInit(); return (i.structure = i.structure || {}); }
    d.options = d.options || {};
    return (d.options[group] = d.options[group] || {});
  };

  /* ------------------------------------------------------------------ generic UI */
  A.toggle = ({ key, default: def }) => { const e = ADE.ui.expanded; e[key] = !(key in e ? e[key] : def === '1'); };
  A.noop = () => {};
  A.popupClose = () => { const pop = ADE.ui.popup; ADE.ui.popup = null; if (pop && pop.kind === 'risk') { const { parts, q } = ADE.parse(); delete q.risk; ADE.nav(ADE.link(parts.join('/'), q)); } };
  A.optionPick = ({ group, option }) => { draftFor(group).choice = option; };
  A.optionNote = ({ group, option, value }) => { const d = draftFor(group); d.notes = d.notes || {}; d.notes[option] = value; };
  A.basis = ({ key }) => popup('basis', { key });
  A.policyEval = ({ pid, wid }) => popup('policy', { pid, wid });
  A.runPolicy = ({ pid, run }) => popup('runPolicy', { pid, run });
  A.sourceOpen = ({ pid, src }) => popup('source', { pid, src });
  A.profileOpen = () => popup('profile');
  A.grantsOpen = () => popup('grants');
  A.profileSave = ({ form }) => { S().profiles[me()] = form.expertise; S().prefs[me()] = { number: form.number || 'en-GB', date: form.date || 'dmy' }; ADE.ui.popup = null; toast('Profile saved. Replies to your @agent comments use your expertise; number and date formats follow your preference. Summaries, facts, permissions and policy outcomes do not change.'); };
  A.journeysOpen = () => popup('journeys');
  A.regenerate = ({ key }) => {
    const [kind, pid] = (key || '').split(':'); const p = pid && ADE.P(pid);
    if (p && (kind === 'project' || kind === 'release')) { const was = ADE.outdatedSummaries(p).length; ADE.regenerateSummaries(p); toast(was ? `Regenerated ${was} outdated summar${was === 1 ? 'y' : 'ies'} from the current state.` : 'Regenerated from the same state. Nothing changed, so the text is identical.'); return; }
    toast('Regenerated from the same sources. Nothing changed, so the text is identical (deterministic prototype).');
  };

  /* ------------------------------------------------------------------ prototype bar (outside product chrome) */
  A.protoStart = ({ v }) => { ADE.reset(v); const st = ADE.STARTS[S().start]; ADE.nav(st.land || '#/'); if (st.land) ADE.visit(st.land); toast(`Prototype reset: ${st.label}.`); };
  A.protoPersona = ({ value, v }) => { S().persona = value || v; toast(`Signed in as ${ADE.personName(S().persona)} (prototype switch).`); };
  A.protoReset = () => { A.protoStart({ v: S().start }); };
  A.protoTick = () => {
    S().clock += 1; const moved = [];
    Object.values(S().projects).forEach((p) => ADE.withProject(p, () => {
      p.runs.filter((r) => r.state === 'stop-requested').forEach((r) => { r.state = 'stopped'; r.attention = 'Stopped. Kept: branch, console log and spend so far. Nothing was merged.'; const w = ADE.item(p, r.work); if (w && w.status === 'in-progress') w.status = 'open'; event(p, 'stop_circle', `Run ${r.id.replace('RUN-', '')} confirmed stopped`, 'Branch and logs kept; work item back to open', 'none'); moved.push('a stop'); });
      p.runs.filter((r) => r.state === 'running').forEach((r) => { advanceRun(p, r); moved.push(`run ${r.id.replace('RUN-', '')}`); });
      p.runs.filter((r) => r.state === 'queued').forEach((r) => { if (ADE.capacity(p).free) { r.state = 'running'; event(p, 'play_circle', `Run ${r.id.replace('RUN-', '')} left the queue`, 'An agent slot became free', 'allow'); } });
      p.sources.filter((s) => s.status === 'extracting').forEach((s) => {
        const facts = ADE.finishExtraction(p, s);
        const risk = s.resolvesRisk && ADE.riskById(p, s.resolvesRisk); if (risk) risk.status = 'closed';
        const pinned = ADE.attachedTo(p, s.id).filter((w) => w.attachments.some((a) => a.src === s.id && a.rev !== s.revision));
        event(p, 'sync', `${s.title} extracted at ${s.revision}: ${facts.length} facts`, `${s.revisions.length > 1 ? `Older facts from ${s.id} marked superseded. ` : ''}${pinned.length ? `${pinned.map((w) => w.id).join(', ')} stay pinned to their revision and show a newer one. ` : ''}AU-2 re-checked readiness${risk ? `; ${risk.id} closed` : ''}`, 'allow');
        moved.push(`extraction of ${s.title}`);
      });
      ADE.settle(p);
      const out = ADE.outdatedSummaries(p);
      if (out.length) { ADE.regenerateSummaries(p); const au = p.automations.find((a) => a.id === 'AU-1'); if (au && au.state === 'active') au.last = now(); event(p, 'auto_awesome', `${out.length} summar${out.length === 1 ? 'y was' : 'ies were'} outdated`, `AU-1 regenerated ${out.map((k) => (k === 'project' ? 'the project summary' : k.replace('release:', ''))).join(', ')} from the current state`, 'allow'); moved.push(`${out.length} summaries`); }
    }));
    toast(`Next tick simulated: ${moved.length ? [...new Set(moved)].join(', ') : 'nothing was waiting'}.`);
  };

  /* ------------------------------------------------------------------ omni-navigation */
  A.omni = ({ form }) => {
    const q = (form.q || '').trim(); ADE.ui.omniQuery = q;
    const { parts } = ADE.parse(); const pid = parts[0] === 'p' ? parts[1] : null;
    const r = ADE.omni(q, pid);
    if (!r) return;
    if (r.go) { S().omniApplied = { query: q, label: r.go.label, hash: r.go.hash }; ADE.ui.omniAlternatives = null; ADE.ui.omniQuery = ''; ADE.nav(r.go.hash); } else ADE.ui.omniAlternatives = r.alternatives;
  };
  A.omniPick = ({ hash }) => { const alt = (ADE.ui.omniAlternatives || []).find((a) => a.hash === hash); S().omniApplied = { query: ADE.ui.omniQuery, label: alt ? alt.label : 'chosen view', hash }; ADE.ui.omniAlternatives = null; ADE.ui.omniQuery = ''; ADE.nav(hash); };
  A.omniClose = () => { ADE.ui.omniAlternatives = null; };

  /* ------------------------------------------------------------------ decisions */
  A.decideOpen = ({ pid, did }) => popup('decide', { pid, did });
  A.decide = ({ pid, did }) => {
    const p = ADE.P(pid); const d = p.decisions.find((x) => x.id === did);
    if (d.decider !== me()) { toast(`Only ${ADE.personName(d.decider)} can decide ${d.id}.`); return; }
    const draft = draftFor(`decide:${pid}:${did}`);
    if (!ADE.optionReady(draft)) return;
    d.status = 'decided'; d.chosen = draft.choice; d.note = (draft.notes || {})[draft.choice] || ''; d.by = me();
    const chosen = d.options.find((o) => o.id === draft.choice);
    const fact = ADE.decisionFact(p, d, chosen ? (d.effects && d.effects.startsWith('adopt-answer') && chosen.id === 'adopt' ? chosen.desc : chosen.title) : `own option — ${d.note}`);
    event(p, 'gavel', `${ADE.personName(me())} decided ${d.id}: ${chosen ? chosen.title : `own option — ${d.note}`}`, `Recorded as knowledge fact ${fact.id}; AU-2 re-evaluated the work it blocked`, 'allow');
    applyEffect(p, d, draft.choice);
    ADE.ui.popup = null;
    toast(`Decision ${d.id} recorded and added to project knowledge.`);
  };
  function applyEffect(p, d, choice) {
    const eff = d.effects || '';
    if (eff === 'adopt-correction-rule') {
      const w123 = ADE.item(p, 'W-123');
      if (choice === 'b') { w123.status = 'deferred'; w123.evidence = `Deferred by decision ${d.id}: no corrections in the first release`; }
      else { w123.forecast = [180, 300]; w123.confirmed = false; }
      const r8 = ADE.riskById(p, 'R-08'); if (r8) r8.status = 'closed';
    } else if (eff === 'estimate-staff-release') {
      const r12 = ADE.riskById(p, 'R-12'); if (r12) r12.status = 'closed';
      if (choice === 'cut') { const w = ADE.item(p, 'W-322'); w.status = 'deferred'; }
      else { [['W-311', [150, 260]], ['W-3122', [40, 90]], ['W-322', [200, 340]]].forEach(([id, f]) => { const w = ADE.item(p, id); if (w) w.forecast = f; }); p.runs.unshift({ id: ADE.nextId('RUN'), work: null, state: 'complete', attempt: 1, agent: 'Planning agent', model: 'synthetic-model-M', runner: 'ADE service', profile: null, system: 'Estimate work', repo: '—', branch: '—', spent: 6, reserved: 10, started: now(), elapsed: '2 min', wf: { at: null, visits: {}, trail: [{ step: 'Estimate 3 items', outcome: 'done' }] }, trigger: `Decision ${d.id}`, policy: 'P4 allowed: reservation within the run limit.', stop: [], console: ['W-311 150–260', 'W-3122 40–90', 'W-322 200–340'], context: [], excluded: [], files: [] }); }
    } else if (eff.startsWith('start-run:')) {
      const w = ADE.item(p, eff.split(':')[1]);
      if (choice === 'approve' && w) startRun(p, w, { trigger: `Approved by ${ADE.personName(me())} in decision ${d.id}`, by: d.requestedBy || me(), profile: d.profile });
    } else if (eff.startsWith('adopt-answer:')) {
      const w = ADE.item(p, eff.split(':')[1]);
      if (choice === 'adopt' && w) {
        (w.questions || []).forEach((q) => { q.resolved = true; });
        if (w.decisionItem && w.status === 'open') { w.status = 'done'; w.evidence = `Decision ${d.id} adopted the answer`; event(p, 'task_alt', `${w.id} “${w.title}” done`, `Human contribution recorded as evidence: decision ${d.id}`, 'allow'); }
        p.risks.filter((r) => r.status === 'needs-owner' && r.affects.includes(w.id)).forEach((r) => { r.status = 'closed'; });
      }
    } else if (eff === 'none' && d.subject) {
      p.risks.filter((r) => r.status === 'needs-owner' && r.affects.includes(d.subject)).forEach((r) => { r.status = 'closed'; });
    } else if (eff.startsWith('risk-response:')) {
      const [, rid, resp] = eff.split(':'); if (choice === 'approve') applyRiskResponse(p, ADE.riskById(p, rid), resp);
    }
  }

  /* ------------------------------------------------------------------ agent runs and workflows */
  function startRun(p, w, { trigger, by, profile, reserve } = {}) {
    const profId = profile && ADE.profile(p, profile) ? profile : ADE.defaultProfile(p, w); const prof = ADE.profile(p, profId);
    const free = ADE.capacity(p).free; const e = ADE.evaluate(p, w, by === 'automation' ? 'automation' : by);
    const repo = p.sources.find((s) => s.kind === 'Code repository' && s.status === 'connected');
    const res = reserve || (w.forecast ? w.forecast[1] : 50);
    const run = { id: `RUN-0${ADE.nextId('X').split('-')[1]}`, work: w.id, state: free ? 'running' : 'queued', attempt: ADE.runsOf(p, w.id).length + 1, agent: prof.title, model: prof.model, runner: prof.runner, profile: profId, repo: repo ? `${repo.title} @ ${repo.revision}` : 'no repository', branch: prof.limits.readOnly ? '— (read-only)' : `ade/${w.id.toLowerCase()}`, spent: 0, reserved: res, started: now(), elapsed: '0 min', wf: ADE.newWorkflow(prof), trigger, policy: `${e.rule || '—'} ${e.verdict}: ${e.reason}`, eval: { verdict: e.verdict, rule: e.rule, reason: e.reason, facts: e.facts, revision: e.revision, requires: e.requires }, requires: e.requires, stop: [`${eur(res)} reservation reached`, 'A step reaches its visit limit', 'A question needs a person'], console: ['$ ade context compile', `mcp servers: ${prof.mcps.join(', ')}`, `context: ${w.attachments.length} attachments pinned to their revisions; stale sources excluded`], context: w.attachments.map((a) => ({ a, s: ADE.source(p, a.src) })).filter((x) => x.s && x.s.freshness !== 'stale').map((x) => ({ label: `${x.s.title} @ ${x.a.rev}`, src: x.s.id })).concat([{ label: `${w.id} purpose, scope and acceptance criteria`, work: w.id }]), excluded: w.attachments.map((a) => ADE.source(p, a.src)).filter((s) => s && s.freshness === 'stale').map((s) => ({ label: s.title, why: 'Stale source' })), files: [] };
    const pred = ADE.runsOf(p, w.id).find((x) => x.state === 'changes-requested' && !x.next);
    if (pred) { run.prev = pred.id; pred.next = run.id; run.attempt = pred.attempt + 1; run.console.push(`review note from ${pred.id}: ${(pred.attention || '').replace(/^Changes requested by [^:]+: /, '')}`); }
    p.runs.unshift(run); w.status = 'in-progress';
    event(p, 'smart_toy', `${by === 'automation' ? 'Automation' : ADE.personName(by)} started run ${run.id.replace('RUN-', '')} on ${w.id} (${prof.title})`, `${free ? 'Running' : 'Queued: all agent slots busy'} · reserved ${eur(run.reserved)} · policy ${e.rule || '—'}`, 'allow');
    return run;
  }
  ADE.startRun = startRun;
  // AU-3: when internal work becomes ready (every check passes, every dependency done), start it within policy.
  ADE.onReady = function (p, w) {
    if (ADE.activeRun(p, w.id)) return;
    const e = ADE.evaluate(p, w, 'automation');
    const au3 = p.automations.find((a) => a.id === 'AU-3');
    if (!w.customerVisible && e.verdict === 'allow' && au3 && au3.state === 'active' && ADE.can(p, 'start-agent', {}, p.owner).ok) {
      const r = startRun(p, w, { trigger: 'Automation AU-3: internal work became ready', by: 'automation' });
      au3.last = now();
      event(p, 'bolt', `${w.id} “${w.title}” became ready`, `AU-3 ${r.state === 'queued' ? 'queued' : 'started'} ${ADE.profile(p, r.profile).title} (rule ${e.rule}, ${range(w.forecast)})`, 'allow');
    } else event(p, 'rule', `${w.id} “${w.title}” is ready`, w.customerVisible ? `AU-3 not applied: customer-visible work waits for a person to start it (policy ${e.rule}: ${e.verdict})` : `AU-3 not applied: policy ${e.rule || '—'} says ${e.verdict}`, e.verdict === 'allow' ? 'none' : e.verdict);
  };
  function goTo(p, r, next) {
    const prof = ADE.profile(p, r.profile); const steps = prof.workflow.steps; let n = next;
    r.wf.visits[n] = (r.wf.visits[n] || 0) + 1;
    const s = steps[n];
    if (s && s.maxVisits && r.wf.visits[n] > s.maxVisits) {
      r.wf.visits[n] -= 1; r.wf.trail.push({ step: n, outcome: 'exhausted', note: `reached its limit of ${s.maxVisits} visits` });
      r.console.push(`workflow: ${s.title} reached its limit of ${s.maxVisits} visits → ${steps[s.onExhausted].title}`);
      event(p, 'rule', `Run ${r.id.replace('RUN-', '')}: ${s.title} reached its limit of ${s.maxVisits} visits`, `Workflow routed to “${steps[s.onExhausted].title}” (maxVisits, not a model choice)`, 'needs-decision');
      n = s.onExhausted; r.wf.visits[n] = (r.wf.visits[n] || 0) + 1;
    }
    r.wf.at = n; const t = steps[n]; const w = ADE.item(p, r.work);
    if (t.kind === 'human') { r.state = 'awaiting-input'; r.attention = `Waiting for ${w ? ADE.personName(w.owner) : 'the work owner'} at “${t.title}”: ${Object.keys(t.on).map(ADE.label).join(' or ')}.`; event(p, 'person', `Run ${r.id.replace('RUN-', '')} waits for a person at “${t.title}”`, `${w ? ADE.personName(w.owner) : 'Work owner'} chooses ${Object.keys(t.on).join(' or ')}`, 'needs-decision'); }
    if (t.kind === 'end') finishRun(p, r, t);
  }
  function finishRun(p, r, t) {
    const w = ADE.item(p, r.work);
    if (t.outcome === 'stopped') { r.state = 'stopped'; r.attention = 'The workflow ended at “Stop”. Branch and logs kept; nothing submitted.'; if (w) w.status = 'open'; event(p, 'stop_circle', `Run ${r.id.replace('RUN-', '')} ended at its stop step`, 'Work item back to open', 'none'); return; }
    const requires = r.requires || ['human-review'];
    if (requires.includes('human-review')) {
      r.state = 'awaiting-review'; r.files = r.files.length ? r.files : (ADE.profile(p, r.profile).limits.readOnly ? [] : [{ path: 'src/loans/save-loan.ts', add: 64, del: 9 }, { path: 'tests/loans/concurrency.test.ts', add: 48, del: 0 }, { path: 'docs/loans.md', add: 12, del: 1 }]);
      const reviewer = p.contracts.routing.json.categories.engineering.designated;
      const aid = ADE.nextId('A');
      p.assignments.push({ id: aid, category: 'engineering', to: reviewer, status: 'assigned', subject: r.work, ask: `Review the agent output for “${w ? w.title : r.profile}” (run ${r.id.replace('RUN-', '')}).`, why: `Policy ${(r.eval && r.eval.rule) || 'P4'} requires human review of agent output; no profile can remove that step.`, blocks: w ? w.title : '—', waiting: 'Contribution held in review', can: 'Accept, request changes or reject', cannot: 'Accept the release', run: r.id });
      r.attention = `Waiting for ${ADE.personName(reviewer)}'s review (${aid}).`;
      if (w) w.status = 'review';
      event(p, 'task_alt', `Run ${r.id.replace('RUN-', '')} submitted its output${t.outcome === 'complete' ? ' (the profile would complete without review)' : ''}`, `Review ${aid} assigned to ${ADE.personName(reviewer)}: policy adds a human review step the profile cannot remove`, 'allow');
    } else { r.state = 'complete'; if (w) { w.status = 'done'; w.actual = Math.round((w.actual || 0) + r.spent); } event(p, 'task_alt', `Run ${r.id.replace('RUN-', '')} completed`, 'No human step required by policy', 'allow'); }
  }
  function advanceRun(p, r) {
    const prof = ADE.profile(p, r.profile); if (!prof || !r.wf.at) return;
    const st = prof.workflow.steps[r.wf.at]; if (!st) return;
    const pauseAt = p.contracts.policy.json.limits.pauseAtReservationPct / 100;
    r.elapsed = `${20 + S().clock * 25} min`;
    if (st.kind === 'agent') {
      const spent = Math.round((r.spent + r.reserved * 0.25) * 100) / 100;
      if (spent >= r.reserved * pauseAt && r.spent < r.reserved * pauseAt) { r.spent = Math.round(r.reserved * pauseAt * 100) / 100; r.state = 'paused'; r.attention = `Paused by AU-4 at ${Math.round(pauseAt * 100)} % of its reservation. Resume to continue, or stop.`; event(p, 'pause_circle', `Run ${r.id.replace('RUN-', '')} reached ${Math.round(pauseAt * 100)} % of its reservation`, 'AU-4 paused it and asked the work owner', 'allow'); return; }
      r.spent = Math.min(spent, Math.round(r.reserved * 0.95));
      const model = st.model || prof.model;
      r.wf.trail.push({ step: r.wf.at, outcome: 'done', model, session: st.session });
      r.console.push(`[${st.title}] skill ${st.skill} · model ${model} · ${st.session} session`, `  ade-knowledge: fetched ${(st.knowledge || []).join(', ') || 'nothing'}`);
      if (st.produces) { r.artifacts = [...new Set([...(r.artifacts || []), ...st.produces])]; r.console.push(`  produced ${st.produces.join(', ')}${st.gate ? ` · gate ${st.gate}: pass` : ''}`); }
      goTo(p, r, st.next);
    } else if (st.kind === 'check') {
      const n = r.wf.visits[r.wf.at] || 1; const outcome = ((r.wf.script || {})[r.wf.at] || [])[n - 1] || 'pass';
      r.wf.trail.push({ step: r.wf.at, outcome, note: outcome === 'fail' ? 'a test failed' : '' });
      r.console.push(`$ ${st.command} → ${outcome.toUpperCase()}`);
      if (outcome === 'fail') event(p, 'error_outline', `Run ${r.id.replace('RUN-', '')}: ${st.title} failed`, `Workflow loops back to “${prof.workflow.steps[st.on.fail].title}” (visit ${(r.wf.visits[st.on.fail] || 0) + 1}${prof.workflow.steps[st.on.fail].maxVisits ? ` of ${prof.workflow.steps[st.on.fail].maxVisits}` : ''})`, 'none');
      goTo(p, r, st.on[outcome]);
    }
  }
  ADE.advanceRun = advanceRun;
  A.startOpen = ({ pid, wid }) => popup('start', { pid, wid });
  A.startProfile = ({ pid, wid, value }) => { S().drafts.start[`${pid}:${wid}`] = value; };
  A.startRun = ({ pid, wid, form = {} }) => {
    const p = ADE.P(pid); const w = ADE.item(p, wid); const e = ADE.evaluate(p, w, me());
    if (!allowed(p, 'start-agent')) return;
    if (e.verdict === 'deny' || ADE.ready(p, w) !== 'ready') { toast(ADE.ready(p, w) !== 'ready' ? `${w.id} is not ready: ${ADE.readiness(p, w).failing[0].fix}.` : 'Denied by policy. Nothing will run.'); return; }
    if (e.verdict === 'needs-decision' && !e.youDecide) return;
    if (e.verdict === 'needs-decision' && !form.approve) { toast('Tick the approval box: policy needs your decision for this run.'); return; }
    const profile = form.profile || S().drafts.start[`${pid}:${wid}`] || ADE.defaultProfile(p, w);
    const run = startRun(p, w, { trigger: `Started by ${ADE.personName(me())}${e.youDecide ? ` (approved as decider under rule ${e.rule})` : ''}`, by: me(), profile, reserve: Number(form.reserve) || undefined });
    ADE.ui.popup = null; ADE.ui.expanded[run.id] = true;
    toast(`Run ${run.id.replace('RUN-', '')} ${run.state === 'queued' ? 'queued' : 'started'}. Use “Simulate next tick” in the prototype bar to watch it move through its workflow.`);
  };
  A.startAsk = ({ pid, wid, form = {} }) => {
    const p = ADE.P(pid); const w = ADE.item(p, wid); const e = ADE.evaluate(p, w, me());
    if (!allowed(p, 'start-agent')) return;
    const profile = form.profile || S().drafts.start[`${pid}:${wid}`] || ADE.defaultProfile(p, w);
    const id = ADE.nextId('D');
    p.decisions.push({ id, title: `Approve an agent run on “${w.title}”`, subject: w.id, decider: e.decider, status: 'open', requestedBy: me(), profile, why: `${ADE.personName(me())} wants to start “${ADE.profile(p, profile).title}”. Policy ${e.rule}: ${e.reason}`, personal: { tomas: `In short: up to ${range(w.forecast)} of agent spend; output is reviewed before it counts.` }, options: [{ id: 'approve', title: 'Approve the run', desc: `Start now with a ${eur(w.forecast ? w.forecast[1] : 50)} reservation.`, chips: [range(w.forecast)] }, { id: 'hold', title: 'Not now', desc: 'Keep the item ready without starting.', chips: [eur(0)] }], effects: `start-run:${w.id}` });
    event(p, 'help_outline', `${ADE.personName(me())} asked to start an agent on ${w.id}`, `Decision ${id} routed to ${ADE.personName(e.decider)} (policy ${e.rule})`, 'needs-decision');
    ADE.ui.popup = null; toast(`Asked ${ADE.personName(e.decider)} to decide (${id}).`);
  };
  const run = (p, id) => p.runs.find((r) => r.id === id);
  const runGrant = (p, r) => allowed(p, 'run-control', { work: ADE.item(p, r.work) });
  A.runPause = ({ pid, run: id }) => { const p = ADE.P(pid); const r = run(p, id); if (!runGrant(p, r)) return; r.state = 'paused'; r.attention = `Paused by ${ADE.personName(me())}. Nothing is lost; resume to continue.`; event(p, 'pause_circle', `${ADE.personName(me())} paused run ${id.replace('RUN-', '')}`, 'Reservation held; no further spend', 'none'); };
  A.runResume = ({ pid, run: id }) => { const p = ADE.P(pid); const r = run(p, id); if (!runGrant(p, r)) return; r.state = ADE.capacity(p).free ? 'running' : 'queued'; r.attention = null; if (r.spent >= r.reserved * 0.8) r.reserved = Math.round(r.reserved * 1.25); event(p, 'play_circle', `${ADE.personName(me())} resumed run ${id.replace('RUN-', '')}`, r.state === 'queued' ? 'Queued for a free slot' : `Running · reservation ${eur(r.reserved)}`, 'allow'); };
  A.runStopAsk = ({ pid, run: id }) => { const p = ADE.P(pid); if (runGrant(p, run(p, id))) popup('stop', { pid, run: id }); };
  A.runStop = ({ pid, run: id }) => { const p = ADE.P(pid); const r = run(p, id); if (!runGrant(p, r)) return; r.state = r.state === 'queued' ? 'stopped' : 'stop-requested'; r.attention = r.state === 'stopped' ? 'Cancelled before it started. Nothing spent.' : 'Stop requested. Waiting for the runner to confirm; the branch and logs will be kept.'; if (r.state === 'stopped') { const w = ADE.item(p, r.work); if (w) w.status = 'open'; } event(p, 'stop_circle', `${ADE.personName(me())} ${r.state === 'stopped' ? 'cancelled' : 'asked to stop'} run ${id.replace('RUN-', '')}`, r.state === 'stopped' ? 'Nothing spent' : 'Runner confirmation pending', 'none'); ADE.ui.popup = null; };
  // A human workflow step: the work owner records the outcome; the workflow follows that named branch.
  A.runHuman = ({ pid, run: id, outcome }) => {
    const p = ADE.P(pid); const r = run(p, id); const w = ADE.item(p, r.work);
    if (!allowed(p, 'run-human', { work: w })) return;
    const prof = ADE.profile(p, r.profile); const st = prof.workflow.steps[r.wf.at];
    if (r.state !== 'awaiting-input' || !st || st.kind !== 'human' || !st.on[outcome]) return;
    r.wf.trail.push({ step: r.wf.at, outcome, by: me() }); r.attention = null;
    r.state = ADE.capacity(p).free ? 'running' : 'queued';
    event(p, 'person', `${ADE.personName(me())} chose “${ADE.label(outcome)}” at “${st.title}” in run ${id.replace('RUN-', '')}`, `Workflow continues to “${prof.workflow.steps[st.on[outcome]].title}”`, 'allow');
    goTo(p, r, st.on[outcome]);
  };
  A.reviewOpen = ({ pid, run: id }) => popup('review', { pid, run: id });
  A.reviewSection = ({ key }) => { const e = ADE.ui.expanded; e[key] = !e[key]; };
  const reviewGate = (p, r) => { const a = ADE.reviewAssignment(p, r.id); return allowed(p, 'review', { reviewer: a ? a.to : null }) ? a : null; };
  A.reviewAccept = ({ pid, run: id }) => {
    const p = ADE.P(pid); const r = run(p, id); const a = reviewGate(p, r); if (!a) return; const w = ADE.item(p, r.work);
    r.state = 'complete'; r.attention = null; a.status = 'answered'; a.answeredBy = me();
    if (w) { w.status = 'done'; w.actual = Math.round((w.actual || 0) + r.spent); }
    const rels = w ? ADE.releasesOf(p, w.id) : [];
    const open = rels.map((rel) => { const t = ADE.releaseTotals(p, rel); return `${rel.name}: ${t.leaves - t.done} leaf items still open`; });
    event(p, 'task_alt', `${ADE.personName(me())} accepted the contribution from run ${id.replace('RUN-', '')}`, `${w ? w.id : ''} done. ${open.join('; ') || 'No release affected'} — the release is not complete by this alone.`, 'allow');
    ADE.ui.popup = null; toast('Contribution accepted. The work item is done; its release is not accepted by this.');
  };
  A.reviewChanges = ({ pid, run: id, form = {} }) => {
    const p = ADE.P(pid); const r = run(p, id); const a = reviewGate(p, r); if (!a) return; const w = ADE.item(p, r.work);
    if (!(form.note || '').trim()) { toast('Say what should change: the note goes to the next attempt.'); return; }
    r.state = 'changes-requested'; r.attention = `Changes requested by ${ADE.personName(me())}: ${form.note.trim()}`; a.status = 'answered'; a.answeredBy = me(); a.answer = `Changes requested: ${form.note.trim()}`;
    w.status = 'open';
    const e = ADE.evaluate(p, w, 'automation');
    if (e.verdict === 'allow' && ADE.ready(p, w) === 'ready') startRun(p, w, { trigger: `Retry after review requested changes (attempt ${r.attempt}: ${r.id})`, by: 'automation', profile: r.profile });
    else event(p, 'rule', `Retry of ${w.id} not started automatically`, `Policy ${e.rule || '—'}: ${e.verdict}; a person starts the next attempt`, e.verdict);
    ADE.ui.popup = null; toast(r.next ? `Changes requested. Attempt ${r.attempt + 1} (${r.next}) started with your note; both runs link to each other.` : 'Changes requested. The next attempt needs a person to start it.');
  };
  A.reviewReject = ({ pid, run: id, form = {} }) => {
    const p = ADE.P(pid); const r = run(p, id); const a = reviewGate(p, r); if (!a) return; const w = ADE.item(p, r.work);
    if (!(form.note || '').trim()) { toast('Give a reason to reject: it is recorded on the run.'); return; }
    r.state = 'rejected'; r.attention = `Rejected by ${ADE.personName(me())}: ${form.note.trim()}. Nothing was merged; no retry was started.`; a.status = 'answered'; a.answeredBy = me(); a.answer = `Rejected: ${form.note.trim()}`;
    if (w) w.status = 'open';
    event(p, 'block', `${ADE.personName(me())} rejected the output of run ${id.replace('RUN-', '')}`, `${w ? w.id : ''} back to open; no automatic retry`, 'none');
    ADE.ui.popup = null; toast('Output rejected. The item is open again; no new attempt was started.');
  };

  /* ------------------------------------------------------------------ contributions */
  A.answerOpen = ({ pid, aid }) => popup('answer', { pid, aid });
  A.answerSend = ({ pid, aid, form = {} }) => {
    const p = ADE.P(pid); const a = p.assignments.find((x) => x.id === aid);
    if (a.to !== me()) { toast(`Only ${ADE.personName(a.to)} can answer ${a.id}.`); return; }
    if (!(form.answer || '').trim()) { toast('Write an answer first.'); return; }
    a.status = 'answered'; a.answer = form.answer.trim(); a.answeredBy = me();
    const w = ADE.item(p, a.subject);
    let routed = '';
    if (a.category === 'domain' || a.category === 'product') {
      const id = ADE.nextId('D');
      p.decisions.push({ id, title: `Adopt ${ADE.personName(me()).split(' ')[0]}'s answer: ${a.ask.replace(/\?$/, '')}?`, subject: a.subject, decider: p.owner, status: 'open', from: aid, why: `${ADE.personName(me())} answered: “${a.answer}”. Adopting it resolves the question on ${w ? w.title : a.subject}.`, personal: { tomas: 'In short: adopting turns the answer into a project rule and unblocks the work it held.' }, options: [{ id: 'adopt', title: 'Adopt as the project rule', desc: a.answer, chips: ['Unblocks work'] }, { id: 'more', title: 'Ask for more evidence', desc: 'Keep the question open and request an example.', chips: ['Work stays blocked'] }], effects: `adopt-answer:${a.subject}` });
      a.decision = id; routed = ` · decision ${id} routed to ${ADE.personName(p.owner)}`;
    }
    event(p, 'task_alt', `${ADE.personName(me())} answered ${aid}`, `AU-2 re-evaluated ${a.subject}${routed}`, routed ? 'needs-decision' : 'allow');
    ADE.ui.popup = null; toast(`Answer recorded${routed}.`);
  };
  A.delegateOpen = ({ pid, aid }) => popup('delegate', { pid, aid });
  A.delegateSend = ({ pid, aid, form = {} }) => {
    const p = ADE.P(pid); const a = p.assignments.find((x) => x.id === aid);
    if (!form.to) { toast('Choose who should answer.'); return; }
    a.delegatedFrom = me(); a.to = form.to; a.delegateNote = form.note || '';
    event(p, 'forward_to_inbox', `${ADE.personName(me())} delegated ${aid} to ${ADE.personName(form.to)}`, `Allowed by routing revision ${p.contracts.routing.revision}`, 'allow');
    ADE.ui.popup = null; toast(`Delegated to ${ADE.personName(form.to)}. It stays in your “Delegated by me” list.`);
  };
  function requestContribution(p, { cat, ask, subject, blocks, waiting, origin }) {
    const to = p.contracts.routing.json.categories[cat].designated; const id = ADE.nextId('A');
    p.assignments.push({ id, category: cat, to, status: 'assigned', subject, ask, why: `${F.categories[cat].label} contribution requested on ${origin} by ${ADE.personName(me())}.`, blocks: blocks || '—', waiting: waiting || 'Not stated', can: 'Answer, delegate if routing allows', cannot: 'Change the item or its owner' });
    event(p, 'forward_to_inbox', `${F.categories[cat].label} contribution requested on ${origin}`, `${id} routed to ${ADE.personName(to)} (routing revision ${p.contracts.routing.revision})`, 'allow');
    return { id, to };
  }
  A.contributionOpen = ({ pid, wid }) => popup('contribution', { pid, wid });
  A.contributionSend = ({ pid, wid, form = {} }) => {
    const p = ADE.P(pid); const w = ADE.item(p, wid); if (!allowed(p, 'request-contribution')) return;
    if (!(form.ask || '').trim()) { toast('Say exactly what you need.'); return; }
    const r = requestContribution(p, { cat: form.category || 'domain', ask: form.ask.trim(), subject: wid, blocks: w.title, waiting: form.waiting, origin: wid });
    ADE.ui.popup = null; toast(`Sent to ${ADE.personName(r.to)} as ${r.id}.`);
  };

  /* ------------------------------------------------------------------ work items */
  A.markReady = ({ pid, wid }) => {
    const p = ADE.P(pid); const w = ADE.item(p, wid); if (!allowed(p, 'mark-ready', { work: w })) return;
    const others = ADE.readiness(p, w).failing.filter((c) => c.id !== 'confirm');
    if (others.length) { toast(`Not yet: ${others[0].fix}.`); return; }
    w.confirmed = true;
    event(p, 'check_circle', `${ADE.personName(me())} marked ${wid} ready`, 'AU-2 re-evaluated readiness and policy', 'allow');
    ADE.settle(p);
    toast(`${w.title} is ${ADE.label(ADE.ready(p, w) || w.status).toLowerCase()}.`);
  };
  A.treeAll = ({ pid, open }) => { const p = ADE.P(pid); p.work.forEach((w) => { if (ADE.kids(p, w.id).length) ADE.ui.expanded[`tree:${pid}:${w.id}`] = open === '1'; }); };
  A.treeDepth = ({ pid, value }) => { Object.keys(ADE.ui.expanded).filter((k) => k.startsWith(`tree:${pid}:`)).forEach((k) => delete ADE.ui.expanded[k]); const { q } = ADE.parse(); ADE.nav(ADE.plink(pid, 'work', { ...q, depth: value || undefined, expand: undefined })); };
  A.workFilter = ({ pid, form }) => { const { q } = ADE.parse(); ADE.nav(ADE.plink(pid, 'work', { ...q, filter: form.filter || undefined })); };
  const blank = (p, id, parentId, title, extra = {}) => ({ id, parentId, title, status: 'open', purpose: '', inScope: [], outScope: [], criteria: [], doneExtra: [], customerVisible: false, owner: me(), forecast: null, actual: 0, provider: 0, humanDays: 0, risks: [], attachments: [], deps: [], questions: [], comments: [], checks: [], confirmed: false, ...extra });
  // Adding a child to a done item reopens it; dependents that have not started go back to not ready by themselves.
  function reopenIfDone(p, parentId) {
    const par = parentId && ADE.item(p, parentId);
    if (par && par.status === 'done') {
      par.status = 'open';
      const waiting = p.work.filter((x) => (x.deps || []).includes(par.id) && x.status === 'open');
      event(p, 'history', `${par.id} “${par.title}” reopened: a child was added`, waiting.length ? `Dependents not started go back to not ready: ${waiting.map((x) => x.id).join(', ')}; started work is unaffected` : 'No open dependents', 'none');
    }
  }
  A.newWorkOpen = ({ pid, parent }) => popup('newWork', { pid, parent });
  A.newWorkSave = ({ pid, form = {} }) => {
    const p = ADE.P(pid); const parent = form.parent && ADE.item(p, form.parent);
    if (!(parent ? allowed(p, 'add-child', { work: parent }) : allowed(p, 'create-work'))) return;
    if (!(form.title || '').trim()) { toast('A title is required.'); return; }
    const id = ADE.nextId('W');
    reopenIfDone(p, form.parent);
    p.work.push(blank(p, id, form.parent || null, form.title.trim(), { purpose: (form.purpose || '').trim(), customerVisible: form.visible === 'on', owner: parent ? parent.owner : me() }));
    event(p, 'add', `${ADE.personName(me())} created ${id} “${form.title.trim()}”`, 'AU-5 will include it in the nightly forecast', 'none');
    ADE.ui.popup = null; ADE.nav(ADE.plink(pid, `work/${id}`));
  };
  // Section editor: one popup per section of a work item (or of a proposed split child).
  // Purpose is one text field; in scope, out of scope, acceptance criteria and extra done-when items are item lists.
  const LIST = ['inScope', 'outScope', 'criteria', 'doneExtra'];
  const FIELD_LABEL = { purpose: 'Purpose', inScope: 'In scope', outScope: 'Out of scope', criteria: 'Acceptance criteria', doneExtra: 'Extra “done when” conditions', details: 'Title, owner and visibility', forecast: 'Forecast' };
  ADE.FIELD_LABEL = FIELD_LABEL;
  const fieldKey = ({ pid, wid, child, field }) => `${pid}:${wid}:${child ?? ''}:${field}`;
  const fieldTarget = (p, wid, child) => (child != null && child !== '' ? (splitDraft(p.id, wid) || { children: [] }).children[Number(child)] : ADE.item(p, wid));
  const fieldGrant = (p, wid, child) => ADE.can(p, child != null && child !== '' ? 'split' : 'edit', { work: ADE.item(p, wid) });
  const asItems = (t, field) => (field === 'criteria' ? (t.criteria || []).map((c) => (typeof c === 'string' ? c : c.text)) : [...(t[field] || [])]);
  A.fieldOpen = ({ pid, wid, field, child }) => {
    const p = ADE.P(pid); const g = fieldGrant(p, wid, child); if (!g.ok) { toast(g.why); return; }
    const t = fieldTarget(p, wid, child); if (!t) return;
    const d = { pid, wid, child: child ?? '', field };
    if (LIST.includes(field)) d.items = asItems(t, field).concat(asItems(t, field).length ? [] : ['']);
    S().drafts.field = S().drafts.field || {}; S().drafts.field[fieldKey(d)] = d;
    popup('field', { key: fieldKey(d) });
  };
  const fd = (key) => (S().drafts.field || {})[key];
  A.fieldItem = ({ key, idx, value }) => { const d = fd(key); if (d) d.items[Number(idx)] = value; };
  A.fieldAdd = ({ key }) => { const d = fd(key); if (d) d.items.push(''); ADE.ui.focusLast = `fieldItem|${key}|${d.items.length - 1}`; };
  A.fieldRemove = ({ key, idx }) => { const d = fd(key); if (d) d.items.splice(Number(idx), 1); };
  A.fieldMove = ({ key, idx, dir }) => { const d = fd(key); const i = Number(idx); const j = i + Number(dir); if (d && j >= 0 && j < d.items.length) [d.items[i], d.items[j]] = [d.items[j], d.items[i]]; };
  A.fieldSave = ({ key, form = {} }) => {
    const d = fd(key); if (!d) return; const p = ADE.P(d.pid); const g = fieldGrant(p, d.wid, d.child); if (!g.ok) { toast(g.why); return; }
    const t = fieldTarget(p, d.wid, d.child); const isChild = d.child !== '';
    const before = JSON.stringify(t);
    if (d.field === 'purpose') t.purpose = (form.text || '').trim();
    else if (d.field === 'details') {
      if (!(form.title || '').trim()) { toast('A title is required.'); return; }
      t.title = form.title.trim(); if (form.owner && p.access.includes(form.owner)) t.owner = form.owner; t.customerVisible = form.visible === 'on';
    } else if (d.field === 'forecast') {
      const lo = Number(form.lo); const hi = Number(form.hi);
      if (form.lo === '' && form.hi === '') t.forecast = null; else if (!(hi >= lo && hi > 0)) { toast('The high end must be at least the low end and above zero.'); return; } else t.forecast = [lo, hi];
    } else {
      const items = d.items.map((x) => x.trim()).filter(Boolean);
      t[d.field] = d.field === 'criteria' && !isChild ? items.map((text, i) => ({ id: `AC${i + 1}`, text })) : items;
    }
    delete S().drafts.field[key]; ADE.ui.popup = null;
    const changed = before !== JSON.stringify(t);
    if (changed && !isChild) event(p, 'edit_note', `${ADE.personName(me())} edited ${FIELD_LABEL[d.field].toLowerCase()} of ${d.wid}`, 'AU-2 re-checked readiness; AU-1 will refresh summaries that depend on it', 'none');
    toast(changed ? `${FIELD_LABEL[d.field]} saved.` : 'Nothing changed.');
  };
  // Project description: the only project-level text; scope lives on the work items.
  A.descriptionOpen = ({ pid }) => { const p = ADE.P(pid); if (allowed(p, 'description')) popup('description', { pid }); };
  A.descriptionSave = ({ pid, form = {} }) => {
    const p = ADE.P(pid); if (!allowed(p, 'description')) return;
    if (!(form.text || '').trim()) { toast('A project needs a description.'); return; }
    const changed = p.description !== form.text.trim(); p.description = form.text.trim(); ADE.ui.popup = null;
    if (changed) event(p, 'edit_note', `${ADE.personName(me())} changed the project description`, 'AU-1 refreshes summaries on the next tick', 'none');
    toast(changed ? 'Description saved.' : 'Nothing changed.');
  };
  // Dependencies: add with a picker, reject cycles (including through parents), remove.
  A.depOpen = ({ pid, wid }) => { if (allowed(ADE.P(pid), 'deps', { work: W(pid, wid) })) popup('deps', { pid, wid }); };
  A.depAdd = ({ pid, wid, form = {} }) => {
    const p = ADE.P(pid); const w = ADE.item(p, wid); if (!allowed(p, 'deps', { work: w })) return;
    if (!form.dep) { toast('Choose the item this one waits for.'); return; }
    if (w.deps.includes(form.dep)) { toast(`${wid} already depends on ${form.dep}.`); return; }
    const cyc = ADE.wouldCycle(p, wid, form.dep);
    if (cyc) { ADE.ui.popup = { kind: 'deps', args: { pid, wid, error: cyc } }; return; }
    w.deps.push(form.dep);
    event(p, 'link', `${ADE.personName(me())} made ${wid} depend on ${form.dep}`, ADE.item(p, form.dep).status === 'done' ? 'Dependency already done' : `${wid} is not ready until ${form.dep} is done`, 'none');
    ADE.ui.popup = null; toast(`${wid} now waits for ${form.dep}.`);
  };
  A.depRemove = ({ pid, wid, dep }) => { const p = ADE.P(pid); const w = ADE.item(p, wid); if (!allowed(p, 'deps', { work: w })) return; w.deps = w.deps.filter((d) => d !== dep); event(p, 'link', `${ADE.personName(me())} removed the dependency ${wid} → ${dep}`, 'AU-2 re-checked readiness', 'none'); };
  A.workMove = ({ pid, wid, dir }) => {
    const p = ADE.P(pid); const w = ADE.item(p, wid); if (!allowed(p, 'order', { work: w })) return;
    const sibs = p.work.filter((x) => x.parentId === w.parentId); const i = sibs.indexOf(w); const j = i + Number(dir);
    if (j < 0 || j >= sibs.length) return;
    const a = p.work.indexOf(w); const b = p.work.indexOf(sibs[j]); [p.work[a], p.work[b]] = [p.work[b], p.work[a]];
    const warn = ADE.orderWarnings(p, w).concat(ADE.orderWarnings(p, sibs[j]));
    toast(`${wid} moved ${Number(dir) < 0 ? 'up' : 'down'}.${warn.length ? ` Warning: now ordered before unfinished dependency ${warn.join(', ')}.` : ''}`);
  };
  // Mark done with evidence: a human contribution, or a parent whose children are all done or deferred.
  A.doneOpen = ({ pid, wid }) => { const p = ADE.P(pid); const w = ADE.item(p, wid); if (!allowed(p, 'mark-done', { work: w })) return; const cc = ADE.canComplete(p, w); if (!cc.ok) { toast(cc.why); return; } popup('done', { pid, wid }); };
  A.doneSave = ({ pid, wid, form = {} }) => {
    const p = ADE.P(pid); const w = ADE.item(p, wid); if (!allowed(p, 'mark-done', { work: w })) return;
    const cc = ADE.canComplete(p, w); if (!cc.ok) { toast(cc.why); return; }
    if (ADE.activeRun(p, wid)) { toast('An agent run is still active on this item.'); return; }
    if (!(form.evidence || '').trim()) { toast('Record the evidence: what shows it is done.'); return; }
    const hours = Number(form.hours) || 0; const days = hours / ADE.fmtCtx.dayHours;
    w.status = 'done'; w.evidence = form.evidence.trim(); w.humanDays = Math.round(((w.humanDays || 0) + days) * 100) / 100; w.doneBy = me();
    const unblocked = p.work.filter((x) => (x.deps || []).includes(wid) && x.status === 'open');
    event(p, 'task_alt', `${ADE.personName(me())} marked ${wid} done with evidence`, `${hours ? `${ADE.num(hours)} h logged (${ADE.days(days)}). ` : ''}${unblocked.length ? `Dependents re-checked: ${unblocked.map((x) => x.id).join(', ')}` : 'No dependents'}`, 'allow');
    ADE.ui.popup = null; toast(`${w.title} is done.`);
  };
  A.addToReleaseOpen = ({ pid, wid }) => { if (allowed(ADE.P(pid), 'release-membership')) popup('addToRelease', { pid, wid }); };
  A.addToReleaseSave = ({ pid, wid, form = {} }) => { const p = ADE.P(pid); if (!allowed(p, 'release-membership')) return; const r = p.releases.find((x) => x.id === form.rel); if (!r) return; if (!r.members.includes(wid)) r.members.push(wid); event(p, 'flag', `${wid} added to “${r.name}”`, 'Release forecast recalculated (descendants counted once)', 'none'); ADE.ui.popup = null; toast(`Added to ${r.name}.`); };
  A.releaseAddOpen = ({ pid, rid }) => { if (allowed(ADE.P(pid), 'release-membership')) popup('releaseAdd', { pid, rid }); };
  A.releaseAddSave = ({ pid, rid, form = {} }) => { const p = ADE.P(pid); if (!allowed(p, 'release-membership')) return; const r = p.releases.find((x) => x.id === rid); const picks = [].concat(form.pick || []); picks.forEach((w) => { if (!r.members.includes(w)) r.members.push(w); }); if (picks.length) event(p, 'flag', `${picks.length} items added to “${r.name}”`, 'Release forecast recalculated', 'none'); ADE.ui.popup = null; };
  A.releaseRemove = ({ pid, rid, wid }) => { const p = ADE.P(pid); if (!allowed(p, 'release-membership')) return; const r = p.releases.find((x) => x.id === rid); r.members = r.members.filter((m) => m !== wid); event(p, 'flag', `${wid} removed from “${r.name}”`, 'Release forecast recalculated; the work item itself is unchanged', 'none'); toast(`${wid} removed from ${r.name}. The work item itself is unchanged.`); };
  A.releaseOutcomeOpen = ({ pid, rid }) => { const p = ADE.P(pid); if (!allowed(p, 'customer-outcome')) return; const r = p.releases.find((x) => x.id === rid); if (r.outcome) popup('releaseOutcome', { pid, rid }); else { r.outcome = true; event(p, 'flag', `${ADE.personName(me())} marked “${r.name}” as a customer outcome`, 'Shown with the customer-outcome tag', 'none'); } };
  A.releaseOutcomeSave = ({ pid, rid, form = {} }) => { const p = ADE.P(pid); if (!allowed(p, 'customer-outcome')) return; if (!(form.reason || '').trim()) { toast('Give a reason: it is recorded with the change.'); return; } const r = p.releases.find((x) => x.id === rid); r.outcome = false; r.outcomeNote = form.reason.trim(); event(p, 'flag', `${ADE.personName(me())} unmarked “${r.name}” as a customer outcome`, `Reason: ${form.reason.trim()}`, 'none'); ADE.ui.popup = null; };
  A.newReleaseOpen = ({ pid }) => { if (allowed(ADE.P(pid), 'create-release')) popup('newRelease', { pid }); };
  A.newReleaseSave = ({ pid, form = {} }) => { const p = ADE.P(pid); if (!allowed(p, 'create-release')) return; if (!(form.name || '').trim()) { toast('A name is required.'); return; } const id = `REL-${p.releases.length + 1}`; p.releases.push({ id, name: form.name.trim(), outcome: form.outcome === 'on', members: [], budget: Number(form.budget) || 0, planned: form.planned || 'Not set', forecastFinish: 'Unknown', timeRatio: null }); p.summaries[`release:${id}`] = ADE.releaseSummaryFresh(p, p.releases[p.releases.length - 1]); event(p, 'flag', `${ADE.personName(me())} created release ${id} “${form.name.trim()}”`, 'No work yet; add work to get a forecast', 'none'); ADE.ui.popup = null; ADE.nav(ADE.plink(pid, `releases/${id}`)); };

  /* ------------------------------------------------------------------ attachments and sources */
  // One popup for attaching to a work item or adding a document from Knowledge.
  A.attachOpen = ({ pid, wid }) => { const p = ADE.P(pid); if (wid && !allowed(p, 'attach', { work: W(pid, wid) })) return; S().drafts.attach[pid] = { wid: wid || null, tab: wid ? 'existing' : 'new' }; popup('attach', { pid }); };
  A.attachTab = ({ pid, tab }) => { S().drafts.attach[pid].tab = tab; };
  const attachTarget = (p) => { const d = S().drafts.attach[p.id]; return { d, w: d.wid ? ADE.item(p, d.wid) : null }; };
  A.attachExisting = ({ pid, form = {} }) => {
    const p = ADE.P(pid); const { d, w } = attachTarget(p); if (w && !allowed(p, 'attach', { work: w })) return;
    if (!form.src) { toast('Choose a source.'); return; }
    const ok = !!w && ADE.attach(p, w, form.src);
    if (ok) event(p, 'link', `${ADE.source(p, form.src).title} attached to ${w ? w.id : p.name}`, 'Pinned to its current revision; no new source created', 'none');
    ADE.ui.popup = null; toast(ok ? 'Attached. No new source was created.' : 'Already attached.');
  };
  // Uploads are a queue: a sample file, or any number of real files read in the browser. Each goes through the same
  // fingerprinting (same content → link, same name → "new revision?"); a revision question pauses the queue.
  const drainUploads = (p, d, w, choice) => {
    while (d.queue.length) {
      const up = d.queue[0]; const res = ADE.ingest(p, up, choice, me());
      if (res.kind === 'ask') { d.ask = res.source.id; d.up = up; d.choice = undefined; ADE.ui.popup = { kind: 'attach', args: { pid: p.id } }; return; }
      choice = undefined; d.queue.shift(); delete d.ask; delete d.up; delete d.choice;
      const src = res.source;
      if (w) ADE.attach(p, w, src.id);
      const words = { linked: `Same content as ${src.title} @ ${src.revision}: linked to it instead of creating a new source`, fill: `${src.title} was unreadable; this file fills it as its first readable revision`, revision: `Recorded as revision ${src.revision} of ${src.title}; its older facts are superseded when extraction finishes`, overlap: `Added as a separate source ${src.id}, labelled as possibly overlapping`, new: `Added as source ${src.id}` }[res.kind];
      event(p, res.kind === 'linked' ? 'link' : 'source', `${ADE.personName(me())} ${w ? `attached ${up.title} to ${w.id}` : `added ${up.title}`}`, `${words}${res.kind === 'linked' ? '' : '; extraction runs on the next tick'}`, 'none');
      d.done.push(words);
    }
    const done = d.done; delete S().drafts.attach[p.id]; ADE.ui.popup = null;
    toast(done.length === 1 ? `${done[0]}.` : `${done.length} files: ${done.join('; ')}.`);
  };
  A.attachUpload = ({ pid, form = {} }) => {
    const p = ADE.P(pid); const { d, w } = attachTarget(p); if (w && !allowed(p, 'attach', { work: w })) return;
    if (!d.queue) {
      const up = (F.uploads[pid] || F.uploads.default).find((u) => u.id === (form.file || d.file));
      if (!up) { toast('Choose a file.'); return; }
      d.queue = [up]; d.done = [];
    }
    drainUploads(p, d, w, form.choice || d.choice);
  };
  // Real files, read locally by the browser (never sent anywhere). Text is kept for the source viewer; other files keep
  // a placeholder, since the prototype does not simulate extraction from binary formats.
  const MAX_TEXT = 60000;
  A.attachFiles = ({ pid, files = [] }) => {
    const p = ADE.P(pid); const { d, w } = attachTarget(p); if (w && !allowed(p, 'attach', { work: w })) return;
    if (!files.length) { toast('Choose at least one file.'); return; }
    d.queue = files.map((f) => {
      const text = typeof f.text === 'string' ? f.text.slice(0, MAX_TEXT) : '';
      const first = (text.split('\n').find((l) => l.trim()) || '').replace(/^#+\s*/, '').trim();
      return { id: `file:${f.name}`, title: f.name, label: f.name, purpose: first ? first.slice(0, 120) : `Uploaded file (${f.size || 0} bytes).`, markdown: text || `# ${f.name}\n\nBinary file, ${f.size || 0} bytes. The prototype does not extract text from this format.`, facts: [] };
    });
    d.done = [];
    drainUploads(p, d, w);
  };
  A.attachChoice = ({ pid, choice }) => { S().drafts.attach[pid].choice = choice; };
  A.attachRefresh = ({ pid, wid, src }) => {
    const p = ADE.P(pid); const w = ADE.item(p, wid); if (!allowed(p, 'attach', { work: w })) return;
    const a = w.attachments.find((x) => x.src === src); const s = ADE.source(p, src); const old = a.rev;
    a.rev = s.revision; w.confirmed = false;
    event(p, 'sync', `${wid} now uses ${s.title} @ ${s.revision} (was ${old})`, 'Readiness re-checked: the owner confirms the scope again against the new revision', 'none');
    toast(`${wid} uses the new revision. Confirm the scope again with “Mark ready”.`);
  };
  A.detachOpen = ({ pid, wid, src }) => { if (allowed(ADE.P(pid), 'attach', { work: W(pid, wid) })) popup('detach', { pid, wid, src }); };
  A.detachConfirm = ({ pid, wid, src }) => { const p = ADE.P(pid); const w = ADE.item(p, wid); if (!allowed(p, 'attach', { work: w })) return; ADE.detach(p, w, src); event(p, 'remove', `${ADE.source(p, src).title} detached from ${wid}`, 'The source stays in project knowledge; future runs of this item no longer receive it', 'none'); ADE.ui.popup = null; };
  A.addRepoOpen = ({ pid }) => popup('addRepo', { pid });
  A.addRepoSave = ({ pid, form = {} }) => { const p = ADE.P(pid); if (!(form.url || '').trim()) return; const id = `S-${Math.max(...p.sources.map((s) => Number(s.id.split('-')[1]) || 0)) + 1}`; p.sources.push({ id, title: form.url.split('/').pop(), kind: form.kind === 'docs' ? 'Documentation repository' : 'Code repository', provenance: form.url, revision: 'a1b2c3d', freshness: 'current', status: 'connected', purpose: 'Connected from Knowledge.', markdown: `# ${form.url} @ a1b2c3d (synthetic)`, digest: null, revisions: [] }); event(p, 'link', `Repository connected: ${form.url}`, 'Read at revision a1b2c3d (synthetic); nothing was changed in it', 'none'); ADE.ui.popup = null; };
  A.sourceAccess = ({ pid, src }) => { const s = ADE.source(ADE.P(pid), src); s.status = 'access-requested'; toast('Access request prepared for the source owner (prototype: no message sent).'); };
  A.knowledgeAsk = ({ pid, form = {} }) => ADE.nav(ADE.plink(pid, 'knowledge', { q: (form.q || '').trim() || undefined }));
  A.knowledgeAskBtn = A.knowledgeAsk;

  /* ------------------------------------------------------------------ split */
  A.splitGenerate = ({ pid, wid }) => {
    const p = ADE.P(pid); const key = `${pid}:${wid}`; const d = S().drafts.split[key] || {};
    if (!ADE.optionReady(d)) return;
    const fixture = p.split[wid]; const strat = fixture && fixture.strategies.find((s) => s.id === d.choice);
    const w = ADE.item(p, wid);
    const raw = strat ? ADE.clone(strat.children) : d.choice === 'own' ? d.notes.own.split(/[.;\n]/).map((t) => t.trim()).filter(Boolean).slice(0, 5).map((t) => ({ title: t.charAt(0).toUpperCase() + t.slice(1), forecast: null, note: 'From your strategy; estimate after creation' })) : [{ title: `${w.title}: first visible behaviour`, forecast: null }, { title: `${w.title}: remaining behaviour`, forecast: null }];
    const facts = ADE.currentFacts(p).filter((f) => w.attachments.some((a) => a.src === f.source) && f.kind === 'Source-grounded');
    const children = raw.map((c, i) => ({ ...c, purpose: `${c.title} — part of “${w.title}”: ${(w.purpose || w.title).replace(/\.$/, '')}.`, inScope: [c.title, ...(facts[i] ? [`Grounded in: ${facts[i].text}`] : [])], outScope: [...raw.filter((x) => x !== c).map((x) => `${x.title} (sibling)`), ...w.outScope], criteria: [`${c.title} works as described and is covered by a test.`] }));
    const notes = Object.entries(d.notes || {}).filter(([k, v]) => v && k !== 'own').map(([k, v]) => `${k}: ${v}`).join('; ');
    Object.assign(d, { stage: 'review', children, strategyTitle: strat ? strat.title : d.choice === 'own' ? 'Your own strategy' : 'Generic strategy', notesSummary: notes });
    S().drafts.split[key] = d;
  };
  const splitDraft = (pid, wid) => S().drafts.split[`${pid}:${wid}`];
  A.splitBack = ({ pid, wid }) => { splitDraft(pid, wid).stage = 'choose'; };
  A.splitChildTitle = ({ pid, wid, idx, value }) => { splitDraft(pid, wid).children[idx].title = value; };
  A.splitMove = ({ pid, wid, idx, dir = -1 }) => { const c = splitDraft(pid, wid).children; const i = Number(idx); const j = i + Number(dir); if (j >= 0 && j < c.length) [c[i], c[j]] = [c[j], c[i]]; };
  A.splitRemove = ({ pid, wid, idx }) => { splitDraft(pid, wid).children.splice(Number(idx), 1); };
  A.splitAdd = ({ pid, wid }) => { splitDraft(pid, wid).children.push({ title: 'New child', forecast: null, purpose: '', inScope: [], outScope: [], criteria: [] }); };
  A.splitAccept = ({ pid, wid }) => {
    const p = ADE.P(pid); const w = ADE.item(p, wid); const d = splitDraft(pid, wid);
    if (!allowed(p, 'split', { work: w })) return;
    if (!d || !d.children.length) return;
    reopenIfDone(p, wid);
    const ids = d.children.map((c) => {
      const id = ADE.nextId('W');
      p.work.push(blank(p, id, wid, c.title, { purpose: c.purpose, inScope: c.inScope, outScope: c.outScope, criteria: (c.criteria || []).map((t, i) => ({ id: `AC${i + 1}`, text: t })), customerVisible: w.customerVisible, owner: w.owner, forecast: c.forecast, risks: [...(w.risks || [])], attachments: ADE.clone(w.attachments) }));
      return id;
    });
    w.forecast = null; w.checks = [];
    event(p, 'call_split', `${ADE.personName(me())} split ${wid} into ${ids.length} children (${d.strategyTitle})`, 'Each child got a generated purpose, scope and acceptance criteria; parent stays open until its children are done', 'none');
    delete S().drafts.split[`${pid}:${wid}`];
    ADE.nav(ADE.plink(pid, `work/${ids[0]}`)); toast(`${ids.length} children created under “${w.title}”. You are on the first one.`);
  };

  /* ------------------------------------------------------------------ risks */
  function applyRiskResponse(p, r, respId) {
    const resp = r.responses.find((x) => x.id === respId);
    if (resp && resp.creates) {
      const id = ADE.nextId('W');
      p.work.push(blank(p, id, resp.creates.parent, resp.creates.title, { purpose: `Response to risk ${r.id}: ${r.title}.`, inScope: [resp.desc], outScope: ['Changing the item the risk affects'], criteria: [{ id: 'AC1', text: `${resp.chips.find((c) => /Risk|Evidence/.test(c)) || 'The risk is reduced'} with recorded evidence.` }], owner: r.owner || p.owner, forecast: resp.creates.forecast, risks: [r.id], attachments: r.evidence.map((s) => ({ src: s, rev: (ADE.source(p, s) || {}).revision })) }));
      reopenIfDone(p, resp.creates.parent);
      r.affects.push(id); r.status = 'monitoring'; r.chosen = respId;
      event(p, 'report_problem', `Response “${resp.title}” chosen for ${r.id}`, `Created ${id} (${range(resp.creates.forecast)}) inside the release; forecast updated`, 'allow');
    } else {
      r.status = respId === 'accept' ? 'accepted' : 'monitoring'; r.chosen = respId;
      event(p, 'report_problem', `Response “${resp ? resp.title : respId}” chosen for ${r.id}`, respId === 'grant' ? 'Grant request prepared for library IT (prototype: no message sent)' : 'Risk kept visible with its rationale', 'allow');
    }
  }
  A.riskRespond = ({ pid, rid }) => {
    const p = ADE.P(pid); const r = ADE.riskById(p, rid); const d = draftFor(`risk:${pid}:${rid}`);
    if (!ADE.optionReady(d)) { toast('Choose a response first.'); return; }
    if (d.choice === 'own') { r.treatment = d.notes.own; r.status = 'monitoring'; event(p, 'report_problem', `${ADE.personName(me())} set an own response for ${rid}`, 'Recorded as the treatment', 'none'); A.popupClose(); return; }
    const resp = r.responses.find((x) => x.id === d.choice);
    const costs = resp && resp.chips.some((c) => /^\+€/.test(c));
    if (costs && me() !== p.owner) {
      const id = ADE.nextId('D');
      p.decisions.push({ id, title: `Approve the response to ${rid}: ${resp.title}`, subject: resp.creates ? resp.creates.parent : null, decider: p.owner, status: 'open', requestedBy: me(), why: `${ADE.personName(me())} proposes “${resp.title}” (${resp.chips.join(', ')}). Spending needs the accountable owner.`, personal: { tomas: `In short: ${resp.desc}` }, options: [{ id: 'approve', title: 'Approve', desc: resp.desc, chips: resp.chips }, { id: 'hold', title: 'Not now', desc: 'Keep the risk open.', chips: [eur(0)] }], effects: `risk-response:${rid}:${resp.id}` });
      event(p, 'help_outline', `${ADE.personName(me())} proposed a paid response to ${rid}`, `Decision ${id} routed to ${ADE.personName(p.owner)}: cost needs the accountable owner`, 'needs-decision');
      A.popupClose(); toast(`Needs ${ADE.personName(p.owner)}: decision ${id} created.`); return;
    }
    applyRiskResponse(p, r, d.choice); A.popupClose(); toast('Response recorded.');
  };
  A.riskOwner = ({ pid, rid, form = {} }) => { const p = ADE.P(pid); if (!allowed(p, 'risk-owner')) return; const r = ADE.riskById(p, rid); if (!form.owner) return; r.owner = form.owner; if (r.status === 'needs-owner') r.status = 'open'; event(p, 'person_add', `${ADE.personName(form.owner)} now owns ${rid}`, 'Owner notified in their Inbox (prototype)', 'none'); toast('Owner set.'); };
  A.riskContribution = ({ pid, rid, form = {} }) => {
    const p = ADE.P(pid); if (!allowed(p, 'request-contribution')) return; const r = ADE.riskById(p, rid);
    const res = requestContribution(p, { cat: form.category || 'architecture', ask: form.ask || `What should we do about “${r.title}”?`, subject: r.affects[0] || null, blocks: r.affects.map((w) => (ADE.item(p, w) || {}).title).filter(Boolean).join(', '), waiting: r.costImpact, origin: rid });
    toast(`Sent to ${ADE.personName(res.to)} as ${res.id}.`);
  };
  A.raiseRiskOpen = ({ pid }) => { if (allowed(ADE.P(pid), 'raise-risk')) popup('raiseRisk', { pid }); };
  A.raiseRiskSave = ({ pid, form = {} }) => {
    const p = ADE.P(pid); if (!allowed(p, 'raise-risk')) return; if (!(form.title || '').trim()) { toast('Describe the risk.'); return; }
    const id = `R-${p.risks.length + 20}`;
    const owner = me() === p.owner ? form.owner || null : null;
    p.risks.push({ id, title: form.title.trim(), consequence: (form.consequence || '').trim(), status: owner ? 'open' : 'needs-owner', dims: { [form.dim || 'customer']: form.level || 'medium' }, now: [Number(form.likelihood) || 0, Number(form.impact) || 2], target: [1, 1], owner, treatment: 'Not decided yet.', costImpact: 'Unknown', timeImpact: 'Unknown', affects: form.work ? [form.work] : [], evidence: [], responses: [], comments: [] });
    if (form.work) { const w = ADE.item(p, form.work); if (w) w.risks.push(id); }
    event(p, 'report_problem', `${ADE.personName(me())} raised ${id}`, owner ? `Owner ${ADE.personName(owner)}` : `Needs an owner: ${ADE.personName(p.owner)} assigns one`, owner ? 'none' : 'needs-decision');
    ADE.ui.popup = null; ADE.nav(ADE.plink(pid, 'risks', { risk: id }));
  };

  /* ------------------------------------------------------------------ comments */
  // @agent replies are built from this project's item: its purpose, criteria, attachments, forecast and risks.
  ADE.explainReply = function (p, subj, persona, type) {
    if (type === 'risk') return { tomas: `In plain words: “${subj.title}” could cost ${subj.costImpact} and ${subj.timeImpact.toLowerCase()} in ${p.name}. The current treatment is: ${subj.treatment}`, sofia: `${subj.id} affects ${subj.affects.join(', ') || 'no work yet'}; evidence: ${subj.evidence.map((s) => (ADE.source(p, s) || {}).title).filter(Boolean).join(', ') || 'none linked'}.`, elena: `Example from ${p.name}: ${subj.title.toLowerCase()}. ${subj.treatment}`, matej: `${subj.id}: likelihood ${subj.now[0] || 'unknown'} × impact ${subj.now[1]}, target ${subj.target.join(' × ')}; treatment: ${subj.treatment}` }[persona] || subj.treatment;
    const crit = subj.criteria && subj.criteria[0]; const att = subj.attachments.map((a) => `${(ADE.source(p, a.src) || {}).title} @ ${a.rev}`).filter(Boolean);
    const risk = (subj.risks || []).map((id) => ADE.riskById(p, id)).find((r) => r && r.status !== 'closed');
    return {
      tomas: `In plain words: “${subj.title}” is about ${(subj.purpose || p.description).charAt(0).toLowerCase()}${(subj.purpose || p.description).slice(1).replace(/\.$/, '')}. ${subj.forecast ? `It should cost ${range(subj.forecast)}.` : 'Its cost is not estimated yet.'}${risk ? ` The main risk: ${risk.title.toLowerCase()}.` : ''}`,
      sofia: `${subj.id} in ${p.name}: in scope — ${subj.inScope.join('; ') || 'nothing listed'}. Sources: ${att.join(', ') || 'none attached'}.${crit ? ` First criterion ${crit.id}: ${crit.text}` : ''}`,
      elena: crit ? `Example: ${crit.text} That is what “${subj.title}” must make true at the desk.` : `“${subj.title}” has no acceptance criteria yet, so I can't give a concrete example.`,
      matej: `${subj.id}: ${subj.criteria.length} acceptance criteria, ${subj.deps.length} dependencies (${subj.deps.join(', ') || 'none'})${risk ? `, linked risk ${risk.id} (${ADE.exposure(risk)})` : ''}. Evidence comes from the Done-when list.`,
    }[persona] || subj.purpose;
  };
  A.comment = ({ pid, type, id, form = {} }) => {
    const p = ADE.P(pid); if (!allowed(p, 'comment')) return; const text = (form.text || '').trim(); if (!text) return;
    const subj = type === 'risk' ? ADE.riskById(p, id) : ADE.item(p, id);
    subj.comments = subj.comments || [];
    subj.comments.push({ by: me(), at: 'Just now', text });
    if (/@agent/i.test(text)) {
      const persona = me(); let reply; let proposal = null;
      if (/estimat/i.test(text) && type === 'work') { reply = subj.forecast ? `It already has an estimate of ${range(subj.forecast)}. I can re-estimate from the current sources if you want.` : `From ${subj.attachments.length} attached sources and similar finished items in ${p.name}, I estimate ${range([120, 240])}.`; proposal = { label: subj.forecast ? 'Re-estimate' : `Record estimate ${range([120, 240])}`, text: 'Records the estimate on this item; you can change it later.', effect: 'estimate' }; }
      else if (/split|break/i.test(text) && type === 'work') { reply = 'I can propose split strategies with consequences for you to choose from.'; proposal = { label: 'Open split strategies', text: 'Opens the split step; nothing is created until you accept.', effect: 'nav-split' }; }
      else if (/mitigat|respon|what should/i.test(text) && type === 'risk') { reply = subj.responses.length ? `The strongest response is “${subj.responses[0].title}” (${subj.responses[0].chips.join(', ')}).` : 'There is no proposed response yet; the owner should describe one.'; }
      else if (/explain|what|why|mean/i.test(text)) reply = ADE.explainReply(p, subj, persona, type);
      else reply = 'I can estimate this, propose a split, explain it for you or draft a response. I won\'t change anything without a visible confirmation.';
      subj.comments.push({ agent: true, to: persona, at: 'Just now', text: reply, proposal });
    }
  };
  A.commentApply = ({ pid, type, id, idx }) => {
    const p = ADE.P(pid); const subj = type === 'risk' ? ADE.riskById(p, id) : ADE.item(p, id); const c = subj.comments[Number(idx)];
    if (!c || !c.proposal) return;
    if (c.proposal.effect === 'estimate') { if (!allowed(p, 'edit', { work: subj })) return; subj.forecast = subj.forecast || [120, 240]; event(p, 'euro_symbol', `Estimate recorded on ${id}: ${range(subj.forecast)}`, `Confirmed by ${ADE.personName(me())} from an agent proposal`, 'none'); }
    if (c.proposal.effect === 'nav-split') ADE.nav(ADE.plink(pid, `work/${id}/split`));
    c.proposal.done = true;
  };

  /* ------------------------------------------------------------------ configuration (one propose → validate → activate path for every contract) */
  A.contractJson = ({ pid, key }) => popup('contractJson', { pid, key });
  A.contractReadme = ({ pid, key }) => popup('contractReadme', { pid, key });
  A.contractHistory = ({ pid, key }) => popup('contractHistory', { pid, key });
  A.configTab = ({ pid, key, tab }) => { const d = (S().drafts.config[`${pid}:${key}`] = S().drafts.config[`${pid}:${key}`] || {}); d.tab = tab; };
  A.configDiscard = ({ pid, key }) => { ADE.P(pid).contracts[key].proposal = null; };
  const MAP = {
    policy(p, before, after, lower, out) {
      const pct = lower.match(/(\d{1,3})\s*%/); const amount = lower.replace(/,/g, '').match(/(?:€|\$|£)\s*(\d+)|(\d+)\s*(?:€|eur|euro|usd|gbp|dollars?|pounds?)?(?:\s|$)/);
      if (pct && /pause/.test(lower)) { after.limits.pauseAtReservationPct = Number(pct[1]); out.diff.push(`- limits.pauseAtReservationPct: ${before.limits.pauseAtReservationPct}`, `+ limits.pauseAtReservationPct: ${pct[1]}`); out.now = `Runs pause at ${before.limits.pauseAtReservationPct} % of their reservation.`; out.after = `Runs pause at ${pct[1]} % of their reservation.`; out.assumptions.push('Applies to runs started after activation; running runs keep their revision.'); }
      else if (/(remove|drop|no longer|don't|do not).*(customer|contributor)/.test(lower)) { after.rules = after.rules.filter((r) => r.id !== 'P3'); out.diff.push(`- rules[P3]: ${JSON.stringify(before.rules.find((r) => r.id === 'P3'))}`); out.now = 'A contributor starting a customer-visible change needs the accountable owner.'; out.after = 'Contributors may start customer-visible changes within the other rules.'; out.assumptions.push('You meant rule P3 only; the run limit and review requirement are unchanged.'); }
      else if (amount && /run|limit|agent|without asking/.test(lower)) { const n = Number(amount[1] || amount[2]); after.limits.agentRunMax = n; out.diff.push(`- limits.agentRunMax: ${before.limits.agentRunMax}`, `+ limits.agentRunMax: ${n}`); out.now = `Runs above ${eur(before.limits.agentRunMax)} need ${ADE.personName(p.owner)}.`; out.after = `Runs up to ${eur(n)} may start without asking; above that they need ${ADE.personName(p.owner)}.`; out.assumptions.push(`You meant the per-run limit (limits.agentRunMax) in ${p.contracts.settings.json.currency}, not the release reserve.`, 'All other rules stay as they are: customer-visible changes started by contributors still need the accountable owner, and output is still reviewed.', `Applies to every agent run in ${p.name}.`); }
    },
    routing(p, before, after, lower, out) {
      const names = Object.keys(F.people).filter((n) => lower.includes(n)); const cat = Object.keys(F.categories).find((k) => lower.includes(k) || lower.includes(F.categories[k].label.toLowerCase()));
      if (cat && names.length >= 2 && /delegat/.test(lower)) { const [from, to] = names.sort((a, b) => lower.indexOf(a) - lower.indexOf(b)); after.categories[cat].canDelegate = true; after.categories[cat].eligible = [...new Set([...after.categories[cat].eligible, to])]; out.diff.push(`- categories.${cat}: ${JSON.stringify(before.categories[cat])}`, `+ categories.${cat}: ${JSON.stringify(after.categories[cat])}`); out.now = ADE.routingSentences(p).find((s) => s.rule === cat).text; out.after = `${F.categories[cat].label} questions go to ${ADE.personName(after.categories[cat].designated)}, who may delegate to ${after.categories[cat].eligible.map(ADE.personName).join(', ')}.`; out.assumptions.push(`${ADE.personName(from)} stays the designated person.`, 'Requests already answered are not reassigned.'); }
      else if (cat && names.length) { after.categories[cat].designated = names[0]; out.diff.push(`- categories.${cat}.designated: ${before.categories[cat].designated}`, `+ categories.${cat}.designated: ${names[0]}`); out.now = ADE.routingSentences(p).find((s) => s.rule === cat).text; out.after = `${F.categories[cat].label} questions go to ${ADE.personName(names[0])}.`; out.assumptions.push('Open requests move to the new person after activation; answered ones stay.'); }
    },
    agents(p, before, after, lower, out) {
      const profId = Object.keys(after.profiles).find((id) => lower.includes(after.profiles[id].title.toLowerCase().split(',')[0]) || lower.includes(id)) || (lower.includes('spec') ? 'spec-tdd' : lower.includes('direct') ? 'direct' : lower.includes('investigat') ? 'investigate' : null);
      const prof = profId && after.profiles[profId];
      if (/(remove|skip|drop|without|no)\b.*\b(human )?review/.test(lower)) { out.invalid = [`Policy ${p.contracts.policy.json.rules.find((r) => (r.requires || []).includes('human-review')).id} requires human review of agent output. A profile cannot remove a human step that policy requires.`]; out.message = 'This change would remove a human step that policy requires, so validation rejects it.'; return; }
      if (!prof) return;
      const stepId = Object.keys(prof.workflow.steps).find((s) => new RegExp(`\\b${s}\\b`).test(lower) || lower.includes(prof.workflow.steps[s].title.toLowerCase()));
      const model = lower.match(/synthetic-model-(xl|l|m|s)\b/);
      const tries = lower.match(/(\d+)\s*(build )?(attempts|tries|times|visits)/);
      const session = /new session/.test(lower) ? 'new' : /compact/.test(lower) ? 'compact' : /continue/.test(lower) ? 'continue' : null;
      if (model && stepId) { const m = `synthetic-model-${model[1].toUpperCase()}`; const was = prof.workflow.steps[stepId].model || `(profile default ${prof.model})`; prof.workflow.steps[stepId].model = m; out.diff.push(`- profiles.${profId}.workflow.steps.${stepId}.model: ${was}`, `+ profiles.${profId}.workflow.steps.${stepId}.model: ${m}`); out.now = `${prof.title}: ${prof.workflow.steps[stepId].title} uses ${was}.`; out.after = `${prof.title}: ${prof.workflow.steps[stepId].title} uses ${m}; other steps keep their models.`; out.assumptions.push('A per-step model override; the profile default model is unchanged.'); }
      else if (model) { const m = `synthetic-model-${model[1].toUpperCase()}`; out.diff.push(`- profiles.${profId}.model: ${prof.model}`, `+ profiles.${profId}.model: ${m}`); out.now = `${prof.title} uses ${prof.model} by default.`; prof.model = m; out.after = `${prof.title} uses ${m} by default; per-step overrides stay.`; out.assumptions.push('Steps with their own model override keep it.'); }
      else if (tries) { const sid = stepId && prof.workflow.steps[stepId].maxVisits ? stepId : Object.keys(prof.workflow.steps).find((s) => prof.workflow.steps[s].maxVisits && prof.workflow.steps[s].kind === 'agent'); const n = Number(tries[1]); if (n < 1 || n > 10) { out.invalid = ['maxVisits must be between 1 and 10: every loop stays bounded.']; out.message = 'Loops must stay bounded.'; return; } out.diff.push(`- profiles.${profId}.workflow.steps.${sid}.maxVisits: ${prof.workflow.steps[sid].maxVisits}`, `+ profiles.${profId}.workflow.steps.${sid}.maxVisits: ${n}`); out.now = `${prof.title}: ${prof.workflow.steps[sid].title} may run up to ${prof.workflow.steps[sid].maxVisits} times.`; prof.workflow.steps[sid].maxVisits = n; out.after = `${prof.title}: ${prof.workflow.steps[sid].title} may run up to ${n} times, then “${prof.workflow.steps[prof.workflow.steps[sid].onExhausted].title}”.`; out.assumptions.push('The run reservation still bounds the loop.'); }
      else if (session && stepId && prof.workflow.steps[stepId].kind === 'agent') { out.diff.push(`- profiles.${profId}.workflow.steps.${stepId}.session: ${prof.workflow.steps[stepId].session}`, `+ profiles.${profId}.workflow.steps.${stepId}.session: ${session}`); out.now = `${prof.title}: ${prof.workflow.steps[stepId].title} uses a ${prof.workflow.steps[stepId].session} session.`; prof.workflow.steps[stepId].session = session; out.after = `${prof.title}: ${prof.workflow.steps[stepId].title} uses a ${session} session.`; out.assumptions.push('Only this step changes; the previous step\'s session is unaffected.'); }
    },
    skills(p, before, after, lower, out) {
      const id = Object.keys(after.skills).find((s) => lower.includes(s)); const v = lower.match(/(\d+\.\d+\.\d+)/);
      if (id && v) { out.diff.push(`- skills.${id}.version: ${before.skills[id].version}`, `+ skills.${id}.version: ${v[1]}`); after.skills[id].version = v[1]; out.now = `${id} is pinned to ${before.skills[id].version}.`; out.after = `${id} is pinned to ${v[1]}.`; out.assumptions.push('Profiles that name this skill use the new version for runs started after activation.', 'Running work keeps the version it started with.'); Object.values(p.contracts.agents.json.profiles).forEach((pr) => Object.values(pr.workflow.steps).forEach((st) => { if (st.skill && st.skill.startsWith(`${id}@`)) out.effects.push(`${pr.title} · ${st.title} will use ${id}@${v[1]} (agents contract references are updated with it)`); })); }
    },
    settings(p, before, after, lower, out) {
      const cur = lower.match(/\b(eur|usd|gbp|chf|sek)\b/); const hours = lower.match(/(\d+(?:\.\d+)?)\s*hours?/); const rate = lower.match(/rate\D*(\d+)/); const tz = lower.match(/\b([a-z]+\/[a-z_]+)\b/i);
      if (cur) { const c = cur[1].toUpperCase(); after.currency = c; out.diff.push(`- currency: ${before.currency}`, `+ currency: ${c}`); out.now = `Money is shown in ${before.currency}.`; out.after = `Money is shown in ${c}.`; out.assumptions.push('Amounts are relabelled, not converted: the prototype has no exchange rates. A real change of currency needs one.', 'Policy limits and budgets keep their numbers in the new currency.'); }
      else if (hours && /day/.test(lower)) { after.workingDayHours = Number(hours[1]); out.diff.push(`- workingDayHours: ${before.workingDayHours}`, `+ workingDayHours: ${hours[1]}`); out.now = `A working day is ${before.workingDayHours} hours.`; out.after = `A working day is ${hours[1]} hours; logged human hours are converted to days with it.`; out.assumptions.push('Days already recorded stay as recorded.'); }
      else if (rate) { after.humanDayRate = Number(rate[1]); out.diff.push(`- humanDayRate: ${before.humanDayRate}`, `+ humanDayRate: ${rate[1]}`); out.now = before.humanDayRate ? `Human effort is also shown at ${before.humanDayRate} per day.` : 'Human effort is shown in days only.'; out.after = `Human effort is also shown at ${rate[1]} per day.`; out.assumptions.push('Budgets still count agent and provider spend only.'); }
      else if (tz) { after.timeZone = tz[1].replace(/\b\w/g, (m) => m.toUpperCase()); out.diff.push(`- timeZone: ${before.timeZone}`, `+ timeZone: ${after.timeZone}`); out.now = `Times use ${before.timeZone}.`; out.after = `Times use ${after.timeZone}.`; out.assumptions.push('Recorded times keep their instant; only display changes.'); }
    },
  };
  A.configPropose = ({ pid, key, form = {} }) => {
    const p = ADE.P(pid); const c = p.contracts[key]; const text = (form.text || '').trim();
    (S().drafts.config[`${pid}:${key}`] = S().drafts.config[`${pid}:${key}`] || {}).text = text;
    if (!text) return;
    const before = ADE.clone(c.json); const after = ADE.clone(c.json);
    const out = { diff: [], assumptions: [], effects: [], now: '', after: '' };
    MAP[key](p, before, after, text.toLowerCase(), out);
    if (out.invalid) { c.proposal = { ok: false, invalid: out.invalid, message: out.message }; return; }
    if (!out.diff.length) { c.proposal = { ok: false, message: { policy: 'I could not map this to a value in the policy contract. It has a per-run limit, a pause threshold and rules P1–P7.', routing: 'I could not map this to the routing contract. It names a designated person and eligible delegates per category.', agents: 'I could not map this to the agents contract. Name a profile and a step, and a model, a number of attempts or a session mode.', skills: 'I could not map this to the skills contract. Name a skill and a version such as 2.2.0.', settings: 'I could not map this to project settings: currency (EUR, USD, GBP…), working-day hours, day rate or time zone.' }[key] }; return; }
    if (key === 'agents') { const loops = Object.entries(after.profiles).flatMap(([id, pr]) => ADE.unboundedLoops(pr).map((s) => `${id}.${s}`)); if (loops.length) { c.proposal = { ok: false, invalid: [`Unbounded loop through ${loops.join(', ')}: every loop needs a step with maxVisits and onExhausted.`], message: 'Loops must stay bounded.' }; return; } }
    after.revision = String(c.revision + 1);
    if (key === 'policy') p.work.filter((w) => ADE.ready(p, w) === 'ready').forEach((w) => { const b = ADE.evaluate(p, w, me()).verdict; const saved = p.contracts.policy.json; p.contracts.policy.json = after; const a = ADE.evaluate(p, w, me()).verdict; p.contracts.policy.json = saved; if (b !== a) out.effects.push(`${w.id} “${w.title}” changes from ${ADE.label(b)} to ${ADE.label(a)}`); });
    if (key === 'agents') p.runs.filter((r) => ADE.ACTIVE.includes(r.state) && r.profile).forEach((r) => out.effects.push(`Run ${r.id.replace('RUN-', '')} keeps revision ${c.revision} of its profile`));
    c.proposal = { ok: true, state: 'validated', now: out.now, after: out.after, assumptions: out.assumptions, effects: out.effects, diff: out.diff, before, afterJson: after, validation: ['Matches the contract shape', 'Every rule stays inside this project', ...(key === 'agents' ? ['Every loop is bounded (maxVisits and onExhausted)', 'No human step required by policy is removed'] : []), 'Running work keeps its recorded revision', `Activation needs ${ADE.personName(p.owner)} (accountable owner)`] };
  };
  A.configProposeBtn = A.configPropose;
  A.configActivate = ({ pid, key }) => {
    const p = ADE.P(pid); const c = p.contracts[key]; if (!c.proposal || !c.proposal.ok || !allowed(p, 'activate')) return;
    c.json = c.proposal.afterJson; c.revision += 1; c.history.push({ revision: c.revision, date: 'Today', by: me(), change: c.proposal.after });
    Object.assign(c.proposal, { state: 'active', newRevision: c.revision, activatedBy: me() });
    if (key === 'settings') ADE.withProject(p, () => ADE.regenerateSummaries(p));
    if (key === 'skills') Object.values(p.contracts.agents.json.profiles).forEach((pr) => Object.values(pr.workflow.steps).forEach((st) => { if (st.skill) { const [id] = st.skill.split('@'); if (c.json.skills[id]) st.skill = `${id}@${c.json.skills[id].version}`; } }));
    event(p, 'verified', `${ADE.CONTRACTS[key].title} revision ${c.revision} activated by ${ADE.personName(me())}`, key === 'policy' ? `AU-2 re-evaluated open work${c.proposal.effects.length ? `: ${c.proposal.effects.length} verdicts changed` : ': no verdict changed'}` : 'Work already started keeps its recorded revision', 'allow');
    toast(`Revision ${c.revision} is active.`);
  };
  A.automationToggle = ({ pid, id }) => { const p = ADE.P(pid); if (!allowed(p, 'automation')) return; const a = p.automations.find((x) => x.id === id); a.state = a.state === 'active' ? 'paused' : 'active'; event(p, a.state === 'active' ? 'play_circle' : 'pause_circle', `${ADE.personName(me())} ${a.state === 'active' ? 'resumed' : 'paused'} ${id} “${a.title}”`, 'Takes effect for the next trigger', 'none'); };

  /* ------------------------------------------------------------------ create project */
  A.createInit = () => { const C = F.createScene.defaults; const exists = !!S().projects.borrowbox; S().drafts.create = { name: exists ? '' : C.name, description: C.description, budget: C.budget, planned: C.planned, goalChoice: {}, refine: {}, docs: [], repos: {}, risks: {}, releaseName: '', releaseNameEdited: false }; return S().drafts.create; };
  const cd = () => S().drafts.create || A.createInit();
  A.createField = ({ field, value }) => { const d = cd(); d[field] = value; if (field === 'releaseName') d.releaseNameEdited = true; };
  A.createDoc = ({ id }) => { const d = cd(); if (!d.docs.includes(id)) d.docs.push(id); };
  A.createRepo = ({ k }) => { cd().repos[k] = true; };
  A.createRisk = ({ id, v }) => { cd().risks[id] = v; };
  A.createFinish = () => {
    const d = cd(); const C = F.createScene; if (!d.name.trim()) { toast('A name is required.'); ADE.nav(ADE.link('new', { step: 1 })); return; }
    let id = d.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'project'; while (S().projects[id]) id += '-2';
    const owner = me();
    const descOpt = C.descriptionOptions.find((o) => o.id === d.goalChoice.choice);
    const bb = F.projects.borrowbox; const srcMap = { policy: 'S-1', survey: 'S-5', domain: 'S-3' };
    const sources = d.docs.map((doc, i) => ({ ...ADE.clone(bb.sources.find((s) => s.id === srcMap[doc])), id: `S-${i + 1}`, provenance: `uploaded by ${ADE.personName(owner)}` }));
    ['code', 'docs'].forEach((k) => { if (d.repos[k]) sources.push({ id: `S-${sources.length + 1}`, title: `${id}-${k === 'code' ? 'app' : 'docs'}`, kind: k === 'code' ? 'Code repository' : 'Documentation repository', provenance: `git.example/${id}/${k === 'code' ? 'app' : 'docs'} · main`, revision: '0000000', freshness: 'current', status: 'connected', purpose: 'Created empty with the project.', markdown: '# Empty repository (synthetic)' }); });
    const rel = ADE.proposeRelease(d);
    const docIds = sources.filter((s) => s.kind === 'Document').map((s) => s.id);
    const work = rel.items.map((x, i) => ({ id: `W-${i + 1}`, parentId: null, title: x.title, status: 'open', purpose: x.purpose, inScope: x.inScope, outScope: x.outScope, ac: x.ac, customerVisible: true, owner, forecast: x.forecast, actual: 0, risks: [], sources: docIds, deps: i === 1 && rel.items[0].title === 'Find a book to borrow' ? ['W-1'] : [], questions: [], comments: [], checks: [], readiness: 'not-ready' }));
    const kept = C.risks.filter((r) => (d.risks[r.id] || 'keep') === 'keep');
    const risks = kept.map((r, i) => ({ id: r.id, title: r.title, status: i === 0 ? 'open' : 'needs-owner', dims: r.dims, now: i === 0 ? [2, 3] : i === 1 ? [0, 2] : [1, 3], target: [1, 1], owner: i === 0 ? owner : null, treatment: 'Proposed at project creation; not decided yet.', costImpact: 'Unknown', timeImpact: 'Unknown', affects: i === 0 && work[1] ? [work[1].id] : [], evidence: [], responses: [], comments: [] }));
    if (risks[0] && work[1]) work[1].risks = [risks[0].id];
    const facts = C.refine.map((r, i) => { const ch = d.refine[r.id] || {}; const o = r.options.find((x) => x.id === ch.choice); return { id: `F-${i + 1}`, text: `${r.q} ${o ? o.title : (ch.notes || {}).own || '—'}`, kind: 'Decision', source: null, decision: 'project-setup', usedBy: [] }; });
    const budget = Number(d.budget) || 0; const relBudget = Number(d.releaseBudget ?? Math.ceil((rel.forecast[1] * 1.1) / 100) * 100) || 0;
    const routing = Object.fromEntries(Object.keys(F.categories).map((k) => [k, { designated: owner, canDelegate: false, eligible: [] }]));
    const p = {
      id, name: d.name.trim(), kind: 'Greenfield', owner, access: [owner], description: descOpt ? descOpt.desc : ((d.goalChoice.notes || {}).own || d.description || '').trim(),
      budget: { amount: budget, planned: d.planned, start: 'Today', forecastFinish: 'Unknown', timeRatio: null }, capacity: { slots: 1 }, lastSeen: 'just now',
      sources, facts, questions: [{ id: 'KQ-1', q: 'What is out of scope?', keys: ['scope', 'out', 'excluded', 'included'], fromWork: 'outScope', answer: '', facts: [] }],
      work, releases: [{ id: 'REL-1', name: d.releaseNameEdited && d.releaseName.trim() ? d.releaseName.trim() : rel.name, outcome: true, members: work.map((w) => w.id), budget: relBudget, planned: (d.releasePlanned || '').trim() || 'Not set', forecastFinish: 'Unknown', timeRatio: null }],
      risks, assignments: [], decisions: [], runs: [],
      events: [{ at: now(), icon: 'add', text: `${ADE.personName(owner)} created ${d.name.trim()}`, triggered: `Planning agent proposed ${work.length} work items and 1 release from your answers (${rel.why}), and ${kept.length} risks`, outcome: 'none' }],
      automations: F.automations(), contracts: { policy: F.policyContract(d.name.trim(), 150), routing: F.routingContract(routing), agents: F.agentsContract(), skills: F.skillsContract(), settings: F.settingsContract() }, split: {},
    };
    p.contracts.policy.history = [{ revision: 7, date: 'Today', by: owner, change: 'Default policy applied at creation.' }]; p.contracts.routing.history = [{ revision: 3, date: 'Today', by: owner, change: 'Every category routed to the owner until others join.' }];
    ADE.normalizeProject(p);
    S().projects[id] = p; S().order.push(id); (S().lastWork[owner] = S().lastWork[owner] || {})[id] = work[1] ? work[1].id : work[0].id; S().drafts.create = null;
    ADE.nav(ADE.plink(id)); toast(`${p.name} created. Start with “${(work[1] || work[0]).title}”.`);
  };

  /* ------------------------------------------------------------------ import project */
  A.importInit = () => { S().drafts.import = { name: F.importScene.name, outcome: F.importScene.outcome, repos: {}, docs: F.importScene.documents.map((d) => d.id), docsImported: false, structure: {}, budget: 9000, planned: '20 Nov' }; return S().drafts.import; };
  const idr = () => S().drafts.import || A.importInit();
  A.importField = ({ field, value }) => { idr()[field] = value; };
  A.importConnect = ({ k }) => { const d = idr(); const r = F.importScene.repos[k]; const prev = d.repos[k]; d.repos[k] = { result: r.result, attempts: (prev ? prev.attempts || 0 : 0) + 1 }; };
  A.importSkip = ({ k }) => { const d = idr(); d.repos[k] = { ...(d.repos[k] || {}), skipped: true }; toast(k === 'code' ? 'Documents-only import: agents can answer and plan, but not implement until a code repository is connected.' : 'Continuing without it. It stays listed as unavailable.'); };
  A.importDoc = ({ value, checked }) => { const d = idr(); d.docs = checked ? [...new Set([...d.docs, value])] : d.docs.filter((x) => x !== value); };
  A.importDocs = () => { idr().docsImported = true; };
  A.importFinish = () => {
    const d = idr(); if (!ADE.optionReady(d.structure)) return;
    const p = F.servoraProject(d.structure.choice === 'capability' ? 'capability' : 'outcome');
    const map = { handbook: 'S-4', api: 'S-5', runbook: 'S-6', legacy: 'S-7', partner: 'S-8' };
    p.sources = p.sources.filter((s) => !Object.entries(map).some(([doc, sid]) => sid === s.id && !d.docs.includes(doc)));
    if (!d.repos.ops || !d.repos.ops.result) p.sources = p.sources.filter((s) => s.id !== 'S-3');
    if (!d.repos.code || d.repos.code.result !== 'ok') { p.sources = p.sources.filter((s) => s.id !== 'S-1'); p.facts = p.facts.filter((f) => f.source !== 'S-1'); p.kind = 'Imported · documents only'; }
    p.facts = p.facts.filter((f) => p.sources.some((s) => s.id === f.source));
    p.work.forEach((w) => { w.sources = (w.sources || []).filter((s) => p.sources.some((x) => x.id === s)); });
    p.risks.forEach((r) => { r.evidence = r.evidence.filter((s) => p.sources.some((x) => x.id === s)); });
    p.name = d.name.trim() || p.name; p.description = d.outcome.trim() || p.description;
    const budget = Number(d.budget) || 0; const placeholder = budget === 9000 && d.planned === '20 Nov';
    p.budget.eur = budget; p.budget.planned = d.planned || 'Not set'; p.releases[0].budget = budget; p.releases[0].planned = d.planned || 'Not set';
    if (!placeholder) p.risks = p.risks.filter((r) => r.id !== 'R-4');
    let id = 'servora'; while (S().projects[id]) id += '-2'; p.id = id;
    ADE.normalizeProject(p);
    S().projects[id] = p; S().order.push(id); (S().lastWork[me()] = S().lastWork[me()] || {})[id] = 'W-120'; S().drafts.import = null;
    ADE.nav(ADE.plink(id)); toast(`${p.name} imported with gaps visible. Next: Matej's read-only investigation${ADE.hasRepo(p) ? ' is ready' : ' needs a code repository first'}.`);
  };

  /* ------------------------------------------------------------------ access */
  A.accessOpen = ({ id }) => popup('access', { id });
  A.accessSend = ({ id, form = {} }) => { const d = F.directory.find((x) => x.id === id); S().access.push({ id, name: d.name, reason: form.reason || '—' }); ADE.ui.popup = null; toast(`Request sent to ${d.owner} (prototype: no message sent).`); };

  /* ================================================================== popups */
  const P = (ADE.popups = {});
  const ranked = (facts) => `<ol class="ranked">${facts.map((f) => `<li><strong>${esc(f.text)}</strong><small>${ADE.kind(f.kind)} ${esc(f.source)}</small></li>`).join('')}</ol>`;
  const plain = (xs) => (xs.length ? `<ul class="plain">${xs.map((x) => `<li><strong>${esc(x.text)}</strong><small class="meta"> ${esc(x.why)}</small></li>`).join('')}</ul>` : '<p class="meta">Nothing.</p>');
  function basisBody(text, b, extra = '') {
    return `<blockquote class="basis__quote">${esc(text)}</blockquote><div class="cols"><div><h3>Facts that made the cut</h3>${ranked(b.facts || [])}</div><div><h3>Considered, left out</h3>${plain(b.omitted || [])}<h3>Uncertain</h3>${plain(b.uncertain || [])}</div></div>${extra}`;
  }
  const withP = (pid, fn) => { const p = pid && ADE.P(pid); return p ? ADE.withProject(p, () => fn(p)) : fn(null); };
  P.basis = ({ key }) => {
    const [kind, pid, a, b, c] = key.split(':');
    return withP(pid, (p) => {
      let title = 'Why this summary'; let body = ''; let outdated = false;
      if (kind === 'project' || kind === 'release') {
        const sk = kind === 'project' ? 'project' : `release:${a}`; const s = ADE.summary(p, sk); outdated = s.outdated;
        title = kind === 'project' ? p.name : p.releases.find((x) => x.id === a).name;
        body = (outdated ? `<div class="callout">${icon('history')}<div><strong>Outdated</strong><p>The state changed after this summary was generated. The current state would read:</p><p><em>${esc(s.fresh.text)}</em></p><p class="meta">AU-1 regenerates it on the next tick, or regenerate now.</p></div></div>` : '') + basisBody(s.text, s, kind === 'project' ? `<h3>Sources</h3><table class="table"><tbody>${p.sources.slice(0, 6).map((x) => `<tr><td><button class="link" type="button" data-act="sourceOpen" data-pid="${esc(p.id)}" data-src="${esc(x.id)}">${esc(x.title)}</button></td><td><code>${esc(x.revision)}</code></td><td>${ADE.badge(x.freshness === 'current' ? 'current' : x.freshness)}</td></tr>`).join('')}</tbody></table>` : '');
      } else if (kind === 'work') { const w = ADE.item(p, a); const s = ADE.workSummary(p, w); title = w.title; body = basisBody(s.text, s); }
      else if (kind === 'qa') { const k = ADE.answer(p, p.questions.find((x) => x.id === a).q); title = k.q; body = basisBody(k.text, { facts: k.facts.map((id) => p.facts.find((f) => f.id === id)).filter((f) => f && !f.superseded).map((f) => ({ text: f.text, kind: f.kind, source: f.decision ? `Decision ${f.decision}` : (ADE.source(p, f.source) || {}).title || f.source })), omitted: p.facts.filter((f) => f.superseded && k.facts.includes(f.id)).map((f) => ({ text: f.text, why: `Superseded by ${f.superseded}.` })).concat(ADE.currentFacts(p).filter((f) => !k.facts.includes(f.id)).slice(0, 3).map((f) => ({ text: f.text, why: 'Not about this question.' }))), uncertain: [] }); }
      else if (kind === 'risks') { title = 'Risks summary'; const open = ADE.openRisks(p).sort((x, y) => y.now[0] * y.now[1] - x.now[0] * x.now[1]); body = basisBody('Risk count, owner gaps and the biggest exposure.', { facts: open.slice(0, 3).map((r) => ({ text: `${r.id} ${r.title}`, kind: 'Risk', source: `exposure ${ADE.exposure(r)}` })), omitted: open.slice(3).map((r) => ({ text: r.title, why: 'Lower exposure.' })), uncertain: open.filter((r) => !r.now[0]).map((r) => ({ text: r.title, why: 'Likelihood unknown.' })) }); }
      else if (kind === 'activity') { title = 'Activity summary'; body = basisBody('Counts of runs by state.', { facts: p.runs.slice(0, 4).map((r) => ({ text: `${r.id}: ${ADE.label(r.state)}`, kind: 'Observed', source: r.trigger })), omitted: [], uncertain: [] }); }
      else if (kind === 'contract') { title = `${ADE.CONTRACTS[a].title} in plain words`; const sent = ADE.contractSentences(p, a); body = basisBody('Each sentence is generated from one part of the active contract.', { facts: sent.map((s) => ({ text: s.text, kind: 'Source-grounded', source: `${s.rule} · revision ${p.contracts[a].revision}` })), omitted: [], uncertain: [] }); }
      else if (kind === 'proposal') { title = 'Why this proposal'; const pr = p.contracts[a].proposal; body = basisBody(pr.after, { facts: [{ text: `Your request: “${(S().drafts.config[`${pid}:${a}`] || {}).text || ''}”`, kind: 'Observed', source: 'Request' }, ...pr.diff.map((d) => ({ text: d, kind: 'Proposed', source: 'JSON change' }))], omitted: [], uncertain: pr.assumptions.map((x) => ({ text: x, why: 'Assumption — edit the request to change it.' })) }); }
      else if (kind === 'comment') { title = 'Why this reply'; const subj = a === 'risk' ? ADE.riskById(p, b) : ADE.item(p, b); const cm = subj.comments[Number(c)]; body = basisBody(cm.text, { facts: [{ text: `Personalised for ${ADE.personName(cm.to)}: “${ADE.expertise(cm.to)}”`, kind: 'Observed', source: 'Profile' }, { text: `${subj.id} ${subj.title}${subj.purpose ? ` — ${subj.purpose}` : ''}`, kind: 'Source-grounded', source: `${p.name} · ${subj.id}` }], omitted: [], uncertain: [] }) + '<p class="meta">Personalisation changes wording and depth only. Facts, permissions and policy outcomes are the same for everyone.</p>'; }
      else if (kind === 'decision') { const d = p.decisions.find((x) => x.id === a); const txt = d.personal[me()]; title = 'Why this explanation'; body = basisBody(txt || d.why, { facts: [...(txt ? [{ text: `Personalised for ${ADE.personName(me())}: “${ADE.expertise(me())}”`, kind: 'Observed', source: 'Profile' }] : []), ...d.options.map((o) => ({ text: `${o.title}: ${(o.chips || []).join(', ')}`, kind: 'Proposed', source: `Option ${o.id}` }))], omitted: [{ text: d.why, why: 'Shown above the explanation.' }], uncertain: [] }) + '<p class="meta">Personalisation changes wording and depth only. The options, their costs and the decider are the same for everyone.</p>'; }
      else if (kind === 'import-brief') { title = 'Why this brief'; body = basisBody(F.importScene.brief, { facts: F.importScene.findings.slice(0, 3).map((f) => ({ text: f.text, kind: f.kind, source: f.sources })), omitted: [{ text: F.importScene.findings[3].text, why: 'Observed; not affected by the first slice.' }], uncertain: [{ text: 'ops-scripts could not be read.', why: 'Access denied.' }] }); }
      const foot = `<span class="meta">Prototype: generated deterministically from state and fixture facts. Shows grounds, not hidden reasoning.</span>${ADE.btn(outdated ? 'Regenerate now' : 'Regenerate', 'regenerate', { key }, 'outline', 'sync')}`;
      return { eyebrow: [outdated ? 'history' : 'auto_awesome', outdated ? 'Outdated summary' : 'Why this summary'], title, body, footer: foot, wide: true };
    });
  };
  const verdictBody = (e, rule, w) => `<div class="policy-verdict">${ADE.badge(e.verdict === 'allow' ? 'allow' : e.verdict, { allow: 'Allowed', 'needs-decision': 'Needs decision', deny: 'Denied' }[e.verdict])}<p>${esc(e.reason)}${e.requires.length ? ` Requires: ${esc(e.requires.join(', '))}.` : ''}${e.decider ? ` Decider: ${esc(ADE.personName(e.decider))}${e.youDecide ? ' (you)' : ''}.` : ''}</p></div>
        ${w ? (() => { const rd = ADE.readiness(ADE.P(w.pid), w.it); const f = (rd.failing || [])[0]; return rd.state === 'ready' || w.it.status !== 'open' ? '' : `<p class="meta">${icon('info')}${esc(w.it.id)} isn't ready yet${f ? `: ${esc(f.fix.charAt(0).toLowerCase() + f.fix.slice(1).replace(/\.$/, ''))}` : ''}. Nothing starts until it is ready; then this verdict applies.</p>`; })() : ''}
        <h3>Facts used</h3><table class="table"><thead><tr><th>Fact</th><th>Value</th><th>From</th></tr></thead><tbody>${e.facts.map((f) => `<tr><td>${esc(f.name)}</td><td><strong>${esc(f.value)}</strong></td><td class="meta">${esc(f.source)}</td></tr>`).join('')}</tbody></table>
        <h3>Matched rule</h3><pre class="code">${esc(rule ? JSON.stringify(rule, null, 2) : 'No rule matched.')}</pre>
        <p class="meta">Deterministic: the same facts and revision always give the same verdict. Rules are checked in order; the first match wins.</p>`;
  P.policy = ({ pid, wid }) => withP(pid, (p) => {
    const w = ADE.item(p, wid); const e = ADE.evaluate(p, w, me()); const rule = p.contracts.policy.json.rules.find((r) => r.id === e.rule);
    return { eyebrow: ['shield', `Policy evaluation · revision ${e.revision}`], title: e.verdict === 'allow' ? 'Why the agent may start' : e.verdict === 'deny' ? 'Why nothing may run' : 'Why a person must decide', wide: true,
      body: verdictBody(e, rule, { pid, it: w }), footer: `<a class="btn btn--quiet" href="${esc(ADE.plink(pid, 'config', { contract: 'policy' }))}" data-act="popupClose">Open project policy</a>` };
  });
  P.runPolicy = ({ pid, run: id }) => withP(pid, (p) => {
    const r = run(p, id); const w = r.work && ADE.item(p, r.work);
    if (r.eval) { const rule = p.contracts.policy.history && p.contracts.policy.json.rules.find((x) => x.id === r.eval.rule); return { eyebrow: ['shield', `Run ${id.replace('RUN-', '')} · recorded evaluation · revision ${r.eval.revision}`], title: 'Why this run was allowed to start', wide: true, body: `${verdictBody({ ...r.eval, youDecide: false, decider: null }, rule)}<p class="meta">Recorded when the run started. Later policy revisions do not change it.</p>`, footer: w ? ADE.btn('Evaluate now instead', 'policyEval', { pid, wid: w.id }, 'quiet') : '' }; }
    return { eyebrow: ['shield', `Run ${id.replace('RUN-', '')} · recorded policy`], title: 'Policy recorded for this run', body: `<p>${esc(r.policy)}</p><p class="meta">This fixture run records the verdict as text only; the facts table was not captured.</p>`, footer: w ? ADE.btn('Evaluate now', 'policyEval', { pid, wid: w.id }, 'quiet') : '' };
  });
  P.source = ({ pid, src }) => withP(pid, (p) => {
    const s = ADE.source(p, src); const used = p.facts.filter((f) => f.source === s.id);
    const risks = p.risks.filter((r) => r.evidence.includes(s.id)); const att = ADE.attachedTo(p, s.id);
    return { eyebrow: ['description', `${s.kind} · ${ADE.label(s.status)}`], title: s.title, wide: true,
      body: `<p>${esc(s.purpose)}</p><dl class="kv"><div><dt>Where from</dt><dd>${esc(s.provenance)}</dd></div><div><dt>Revision</dt><dd><code>${esc(s.revision)}</code>${(s.revisions || []).length > 1 ? ` <span class="meta">(${s.revisions.map((x) => x.rev).join(' → ')})</span>` : ''}</dd></div><div><dt>Freshness</dt><dd>${ADE.badge(s.freshness === 'current' ? 'current' : s.freshness)}</dd></div>${s.overlaps ? `<div><dt>Note</dt><dd>${ADE.tone(`Possibly overlaps ${(ADE.source(p, s.overlaps) || {}).title}`, 'warn', 'compare')}</dd></div>` : ''}<div><dt>Attached to</dt><dd>${att.map((w) => `${ADE.a(w.id, ADE.plink(pid, `work/${w.id}`))} <span class="meta">@ ${esc(w.attachments.find((a) => a.src === s.id).rev)}</span>`).join(', ') || '<span class="meta">No work item</span>'}</dd></div><div><dt>Evidence for</dt><dd>${risks.map((r) => ADE.a(`${r.id} ${r.title}`, ADE.plink(pid, 'risks', { risk: r.id }))).join(', ') || '<span class="meta">No risk</span>'}</dd></div></dl>
        ${s.status === 'inaccessible' ? ADE.empty('lock', 'You can\'t read this source', 'ADE knows it exists but has no access. Facts that depend on it stay unknown.', ADE.btn('Request access', 'sourceAccess', { pid, src }, 'outline')) : s.status === 'extracting' ? ADE.empty('sync', 'Extracting…', 'Simulate the next tick to finish extraction.') : `<div class="md">${ADE.md(s.markdown)}</div>`}
        ${used.length ? `<h3>Facts from this source</h3><ul class="plain">${used.map((f) => `<li>${ADE.kind(f.kind)} ${esc(f.text)}${f.superseded ? ` ${ADE.badge('superseded', `Superseded by ${f.superseded}`)}` : ''} ${(f.usedBy || []).map((u) => (u.startsWith('W-') ? ADE.a(u, ADE.plink(pid, `work/${u}`)) : u.startsWith('R-') ? ADE.a(u, ADE.plink(pid, 'risks', { risk: u })) : '')).join(' ')}</li>`).join('')}</ul>` : ''}`,
      footer: '<span class="meta">Highlighted passages are the ones cited. Read-only.</span>' };
  });
  P.decide = ({ pid, did }) => withP(pid, (p) => {
    const d = p.decisions.find((x) => x.id === did); const draft = draftFor(`decide:${pid}:${did}`);
    const personal = d.personal && d.personal[me()];
    const mine = d.decider === me() && d.status === 'open';
    return { eyebrow: ['gavel', `Decision ${d.id}${d.requestedBy ? ` · asked by ${ADE.personName(d.requestedBy)}` : ''} · ${ADE.label(d.status)}`], title: d.title, wide: true,
      body: `<p>${esc(d.why)}</p>${personal ? `<p class="for-you">${esc(personal)}${ADE.gen(`decision:${pid}:${did}`, true)}</p>` : ''}
        ${d.from ? (() => { const a = p.assignments.find((x) => x.id === d.from); return a ? `<blockquote class="answer"><strong>${esc(ADE.personName(a.answeredBy || a.to))} (${esc(F.categories[a.category].label)}):</strong> ${esc(a.answer)}</blockquote>` : ''; })() : ''}
        ${d.status === 'decided' ? `<p>${ADE.badge('decided')} ${esc(ADE.personName(d.by || d.decider))} chose: <strong>${esc((d.options.find((o) => o.id === d.chosen) || {}).title || d.note)}</strong></p>` : mine ? ADE.optionCards(`decide:${pid}:${did}`, d.options, draft, { ownLabel: 'Something else' }) : `<p class="meta">Only ${esc(ADE.personName(d.decider))} can decide. You can comment on the work item.</p>`}`,
      footer: mine ? `<span class="meta">${ADE.optionReady(draft) ? 'Recorded with your notes and added to project knowledge. Blocked work is re-checked automatically (AU-2).' : 'Choose an option.'}</span>${ADE.optionReady(draft) ? ADE.btn('Record decision', 'decide', { pid, did }, 'primary', 'gavel') : '<button class="btn btn--primary" type="button" disabled>Record decision</button>'}` : '' };
  });
  P.start = ({ pid, wid }) => withP(pid, (p) => {
    const w = ADE.item(p, wid); const e = ADE.evaluate(p, w, me()); const cap = ADE.capacity(p);
    const can = e.verdict === 'allow' || e.youDecide;
    const profId = S().drafts.start[`${pid}:${wid}`] || ADE.defaultProfile(p, w); const prof = ADE.profile(p, profId);
    const ctx = w.attachments.map((a) => ({ a, s: ADE.source(p, a.src) })).filter((x) => x.s);
    return { eyebrow: ['smart_toy', `Start an agent · ${w.id}`], title: w.title, wide: true,
      body: `<div class="policy-verdict">${ADE.badge(e.verdict === 'allow' ? 'allow' : e.verdict, e.verdict === 'allow' ? 'Allowed' : e.verdict === 'deny' ? 'Denied' : e.youDecide ? 'Needs your decision' : 'Needs decision')}<p>${esc(e.reason)} <button class="link" type="button" data-act="policyEval" data-pid="${esc(pid)}" data-wid="${esc(wid)}">Rule ${esc(e.rule || '—')}</button></p></div>
        <div class="form grid grid--2"><label>Agent profile<select class="input" name="profile" data-input="startProfile" data-pid="${esc(pid)}" data-wid="${esc(wid)}">${Object.entries(ADE.profiles(p)).map(([id, x]) => `<option value="${esc(id)}" ${id === profId ? 'selected' : ''}>${esc(x.title)}${id === ADE.defaultProfile(p, w) ? ' (default for this item)' : ''}</option>`).join('')}</select></label><label>Reservation (${esc(ADE.fmtCtx.currency)})<input class="input" type="number" name="reserve" value="${esc(w.forecast ? w.forecast[1] : 50)}"></label></div>
        <dl class="kv"><div><dt>Model</dt><dd>${esc(prof.model)}${Object.values(prof.workflow.steps).some((s) => s.model && s.model !== prof.model) ? ' <span class="meta">(some steps override it)</span>' : ''}</dd></div><div><dt>Steps</dt><dd>${esc(ADE.stepSummary(p, profId, w))}</dd></div><div><dt>Runner</dt><dd>${esc(prof.runner)} (synthetic)</dd></div><div><dt>Forecast</dt><dd>${esc(range(w.forecast))}</dd></div><div><dt>Capacity</dt><dd>${cap.free ? `Slot free (${cap.used}/${cap.slots})` : `All ${cap.slots} slots busy — the run will queue`}</dd></div><div><dt>Stops by itself if</dt><dd>Reservation reached · a step reaches its visit limit · a question needs a person · AU-4 pauses at ${p.contracts.policy.json.limits.pauseAtReservationPct} %</dd></div><div><dt>After it finishes</dt><dd>${e.requires.includes('human-review') ? `${esc(ADE.personName(p.contracts.routing.json.categories.engineering.designated))} reviews the output before it counts (added by policy; the profile cannot remove it)` : 'Output is checked automatically'}</dd></div></dl>
        <h3>Context it will get</h3><ul class="plain">${ctx.map(({ a, s }) => `<li>${s.freshness === 'stale' ? `${icon('block')}<s>${esc(s.title)}</s> <span class="meta">excluded: stale</span>` : `${icon('check')}${esc(s.title)} @ ${esc(a.rev)}${ADE.newerRevision(p, a) ? ` <span class="meta">(pinned; ${esc(ADE.newerRevision(p, a))} is newer)</span>` : ''}`}</li>`).join('')}<li>${icon('check')}${esc(w.id)} purpose, scope and ${w.criteria.length} acceptance criteria</li></ul>
        ${e.youDecide ? `<label class="approve"><input type="checkbox" name="approve"> I approve this run as ${esc(e.rule === 'P2' ? 'the decider for spend above the run limit' : 'the decider named by policy')}.</label>` : ''}`,
      footer: e.verdict === 'deny' ? '<span class="meta">Denied by policy. Nothing will run.</span>' : can ? `<span class="meta">Starting reserves the amount from the release budget.</span>${ADE.btn(cap.free ? 'Start agent' : 'Queue agent', 'startRun', { pid, wid }, 'primary', 'play_circle')}` : `<span class="meta">Policy needs ${esc(ADE.personName(e.decider))}. Asking creates a decision in their Inbox.</span>${ADE.btn(`Ask ${ADE.personName(e.decider)} to decide`, 'startAsk', { pid, wid }, 'primary', 'send')}` };
  });
  P.stop = ({ pid, run: id }) => withP(pid, (p) => { const r = run(p, id); return { eyebrow: ['stop_circle', `Stop run ${id.replace('RUN-', '')}`], title: 'Stop the agent now?', body: `<p>The runner is asked to stop. Until it confirms, the run shows “Stop requested”.</p><p><strong>Kept:</strong> branch <code>${esc(r.branch)}</code>, console log, ${esc(eur(r.spent))} spent so far. <strong>Not kept:</strong> nothing is merged or submitted.</p>`, footer: `${ADE.btn('Keep running', 'popupClose', {}, 'quiet')}${ADE.btn('Stop run', 'runStop', { pid, run: id }, 'primary', 'stop_circle')}` }; });
  // Review: progressive disclosure. Summary open; everything else collapsed until asked for.
  P.review = ({ pid, run: id }) => withP(pid, (p) => {
    const r = run(p, id); const w = ADE.item(p, r.work) || { title: r.profile, criteria: [], comments: [], risks: [], id: '—' };
    const a = ADE.reviewAssignment(p, id); const reviewer = a ? a.to : null; const g = ADE.can(p, 'review', { reviewer });
    const sec = (k, title, body, open) => `<details class="review-section" ${open ? 'open' : ''}><summary>${icon('expand_more')}<strong>${esc(title)}</strong></summary><div class="review-section__body">${body}</div></details>`;
    const arts = (r.artifacts || []).length ? r.artifacts : [];
    const artBody = arts.length ? arts.map((f) => `<h4><code>${esc(f)}</code> <span class="meta">(synthetic)</span></h4><div class="md">${f === 'spec.md' ? `<p><strong>Spec for ${esc(w.id)}.</strong> ${esc(w.purpose)}</p>${w.criteria.map((c) => `<p class="md-li">• ${esc(c.id)} ${esc(c.text)}</p>`).join('')}` : f === 'plan.md' ? `<p><strong>Plan.</strong> ${r.files.map((x) => `<code>${esc(x.path)}</code>`).join(', ') || 'Files decided in build.'}</p>` : `<p>${esc(w.inScope)}</p>`}</div>`).join('') : '<p class="meta">This profile produced no document artifacts.</p>';
    const risks = (w.risks || []).map((rid) => ADE.riskById(p, rid)).filter((x) => x && x.status !== 'closed');
    const testRuns = r.wf.trail.filter((t) => t.step === 'test');
    return { eyebrow: ['visibility', `Review · run ${id.replace('RUN-', '')} · attempt ${r.attempt}`], title: w.title, wide: true,
      body: `${sec('summary', 'Summary', `<p>${esc(ADE.profile(p, r.profile) ? ADE.profile(p, r.profile).title : r.profile)} produced ${r.files.length} changed files${arts.length ? ` and ${arts.join(', ')}` : ''} for ${esc(w.id)}. ${testRuns.length ? `Tests ran ${testRuns.length}× (last: ${esc(testRuns[testRuns.length - 1].outcome)}).` : ''} Spent ${esc(eur(r.spent))} of ${esc(eur(r.reserved))}.</p><p class="meta">${esc(r.policy)}${r.prev ? ` · follows ${esc(r.prev)}` : ''}</p><p class="meta">Accepting marks the work item's contribution done. It does not accept the release or the engineering version.</p>`, true)}
        ${sec('steps', 'Workflow steps', ADE.stepLine(p, r))}
        ${sec('artifacts', `Artifacts (${arts.length})`, artBody)}
        ${sec('files', `Changed files (${r.files.length})`, r.files.length ? ADE.changedFiles(p, r, 'review') : '<p class="meta">No files changed (read-only profile).</p>')}
        ${sec('criteria', `Acceptance criteria and required checks (${w.criteria.length + 2})`, `<ul class="checks">${w.criteria.map((c) => `<li class="is-ok">${icon('check_circle')}<span>${esc(c.id)} ${esc(c.text)}<small>Evidence: covered by ${esc((r.files.find((f) => /test/.test(f.path)) || { path: 'the submitted change' }).path)} (synthetic)</small></span></li>`).join('')}<li class="${testRuns.length && testRuns[testRuns.length - 1].outcome === 'pass' ? 'is-ok' : 'is-missing'}">${icon(testRuns.length && testRuns[testRuns.length - 1].outcome === 'pass' ? 'check_circle' : 'radio_button_unchecked')}<span>Tests pass<small>${testRuns.length ? `Test step: ${testRuns.map((t) => t.outcome).join(' → ')}` : 'No test step in this profile'}</small></span></li><li class="is-missing">${icon('radio_button_unchecked')}<span>Human review (policy)<small>This review</small></span></li></ul>`)}
        ${sec('risks', `Risks raised or linked (${risks.length})`, risks.length ? risks.map((x) => `<p>${ADE.badge(x.status)} ${ADE.a(`${x.id} ${x.title}`, ADE.plink(pid, 'risks', { risk: x.id }))}</p>`).join('') : '<p class="meta">No open risks on this item.</p>')}
        ${sec('comments', `Comments (${(w.comments || []).length})`, (w.comments || []).map((c) => `<p><strong>${esc(c.agent ? 'Agent' : ADE.personName(c.by))}:</strong> ${esc(c.text)}</p>`).join('') || '<p class="meta">No comments.</p>')}
        ${g.ok ? '<label>Note — required to request changes or reject<textarea class="input" name="note" rows="2"></textarea></label>' : ''}`,
      footer: r.state !== 'awaiting-review' ? `<span class="meta">This run is ${esc(ADE.label(r.state).toLowerCase())}.</span>` : `${g.ok ? '' : `<span class="meta">${icon('lock')}${esc(g.why)} Switch the signed-in person in the prototype bar to review.</span>`}${ADE.gbtn(g, 'Reject', 'reviewReject', { pid, run: id }, 'quiet', 'block')}${ADE.gbtn(g, 'Request changes', 'reviewChanges', { pid, run: id }, 'outline', 'edit_note')}${ADE.gbtn(g, 'Accept contribution', 'reviewAccept', { pid, run: id }, 'primary', 'task_alt')}` };
  });
  P.answer = ({ pid, aid }) => withP(pid, (p) => { const a = p.assignments.find((x) => x.id === aid); return { eyebrow: [F.categories[a.category].icon, `${F.categories[a.category].label} · ${a.id}`], title: a.ask, wide: true, body: `<dl class="kv"><div><dt>Why you</dt><dd>${esc(a.why)}</dd></div><div><dt>Blocks</dt><dd>${esc(a.blocks)}</dd></div><div><dt>You can't</dt><dd>${esc(a.cannot)}</dd></div></dl><label>Your answer<textarea class="input" name="answer" rows="4" placeholder="Answer in your own words. An example helps."></textarea></label><p class="meta">Your answer is recorded with your name. It does not decide the product rule by itself; ${esc(ADE.personName(p.owner))} adopts it.</p>`, footer: ADE.btn('Send answer', 'answerSend', { pid, aid }, 'primary', 'send') }; });
  P.delegate = ({ pid, aid }) => withP(pid, (p) => { const a = p.assignments.find((x) => x.id === aid); const r = p.contracts.routing.json.categories[a.category]; return { eyebrow: ['forward_to_inbox', 'Delegate'], title: 'Who should answer instead?', body: `<p>${esc(a.ask)}</p>${r.eligible.map((id) => `<label class="radio"><input type="radio" name="to" value="${esc(id)}"> ${ADE.person(id)} <span class="meta">${esc(F.people[id].role)}</span></label>`).join('') || '<p class="meta">Nobody is eligible under current routing.</p>'}<label>Note<textarea class="input" name="note" rows="2"></textarea></label><p class="meta">Only people listed in contribution routing revision ${p.contracts.routing.revision} are shown.</p>`, footer: ADE.btn('Delegate', 'delegateSend', { pid, aid }, 'primary', 'forward_to_inbox') }; });
  P.contribution = ({ pid, wid }) => withP(pid, (p) => { const w = ADE.item(p, wid); return { eyebrow: ['forward_to_inbox', `Request contribution · ${wid}`], title: w.title, wide: true, body: `<label>Kind of expertise<select class="input" name="category">${Object.entries(F.categories).map(([k, v]) => `<option value="${k}">${esc(v.label)}: ${esc(ADE.personName(p.contracts.routing.json.categories[k].designated))}</option>`).join('')}</select></label><label>What exactly do you need?<textarea class="input" name="ask" rows="3" placeholder="One question or one piece of evidence"></textarea></label><label>What does waiting cost? (optional)<input class="input" name="waiting"></label><p class="meta">Routed by contribution routing revision ${p.contracts.routing.revision}. The request says what it blocks: “${esc(w.title)}”.</p>`, footer: ADE.btn('Send request', 'contributionSend', { pid, wid }, 'primary', 'send') }; });
  P.risk = ({ pid, rid }) => withP(pid, (p) => {
    const r = ADE.riskById(p, rid);
    if (!r) return { eyebrow: ['report_problem', 'Risk'], title: 'Risk not found', body: '', footer: '' };
    const draft = draftFor(`risk:${pid}:${rid}`); const isOwner = me() === p.owner; const pol = ADE.riskPolicyLine(p, r);
    const go = ADE.can(p, 'risk-owner');
    return { eyebrow: ['report_problem', `Risk ${r.id} · ${ADE.label(r.status)}`], title: r.title, wide: true,
      body: `${r.consequence ? `<p class="risk-detail__lead">${esc(r.consequence)}</p>` : ''}<div class="risk-detail"><aside class="risk-detail__side" aria-label="Dimensions and exposure"><div class="risk-card__dims">${Object.entries(r.dims).map(([d, lv]) => ADE.level(d, lv)).join('')}</div>${ADE.riskExposure(r)}</aside>
        <dl class="kv risk-detail__main"><div><dt>Treatment</dt><dd>${esc(r.treatment)}</dd></div><div><dt>Cost impact</dt><dd>${esc(r.costImpact)}</dd></div><div><dt>Time impact</dt><dd>${esc(r.timeImpact)}</dd></div><div><dt>Effect on agents</dt><dd>${esc(pol.text)}${pol.wid ? ` <button class="link" type="button" data-act="policyEval" data-pid="${esc(pid)}" data-wid="${esc(pol.wid)}">Why?</button>` : ''}</dd></div><div><dt>Affects</dt><dd>${r.affects.map((w) => ADE.item(p, w)).filter(Boolean).map((w) => ADE.a(w.title, ADE.plink(pid, `work/${w.id}`))).join(', ') || '—'}</dd></div><div><dt>Evidence</dt><dd>${r.evidence.map((s) => ADE.source(p, s)).filter(Boolean).map((s) => `<button class="link" type="button" data-act="sourceOpen" data-pid="${esc(pid)}" data-src="${esc(s.id)}">${esc(s.title)}</button>`).join(', ') || '<span class="meta">None linked</span>'}</dd></div></dl></div>
        ${r.status !== 'closed' ? `<h3>Proposed responses</h3>${ADE.optionCards(`risk:${pid}:${rid}`, r.responses, draft, { ownLabel: r.responses.length ? 'Own response' : 'Describe a response' })}
        <p class="meta">${isOwner ? 'You can approve spending as the accountable owner.' : `Responses that cost money become a decision for ${esc(ADE.personName(p.owner))}.`}</p>
        <div class="row-actions">${ADE.btn('Record response', 'riskRespond', { pid, rid }, 'primary', 'task_alt')}</div>
        <div class="grid grid--2" data-form><div><h3>Owner</h3><div class="field-row">${go.ok ? `<select class="input" name="owner" aria-label="Risk owner"><option value="">Choose…</option>${Object.values(F.people).filter((x) => p.access.includes(x.id)).map((x) => `<option value="${x.id}" ${r.owner === x.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select>` : `<p>${ADE.person(r.owner)}</p>`}${ADE.gbtn(go, 'Set owner', 'riskOwner', { pid, rid }, 'outline')}</div></div>
        <div><h3>Ask an expert</h3><div class="field-stack"><select class="input" name="category" aria-label="Kind of expertise">${Object.entries(F.categories).map(([k, v]) => `<option value="${k}">${esc(v.label)}: ${esc(ADE.personName(p.contracts.routing.json.categories[k].designated))}</option>`).join('')}</select><div class="field-row"><input class="input" name="ask" placeholder="What exactly do you need?" aria-label="What exactly do you need?">${ADE.btn('Request', 'riskContribution', { pid, rid }, 'outline', 'forward_to_inbox')}</div></div></div></div>` : '<p class="meta">Closed.</p>'}
        <h3>Comments</h3>${ADE.comments(p, 'risk', rid, r.comments || [])}`,
      footer: '' };
  });
  // The fixed grant table, reached from the project policy tab: not part of any contract, so not a configuration tab.
  P.grants = () => ({ eyebrow: ['lock', 'Grants · fixed in this prototype'], title: 'Who may do what', wide: true,
    body: `<table class="table"><thead><tr><th>Role</th><th>May do</th></tr></thead><tbody>${ADE.grantTable().map(([r, t]) => `<tr><td><strong>${esc(r)}</strong></td><td>${esc(t)}</td></tr>`).join('')}</tbody></table><p class="meta">Grants are separate from policy verdicts: a member may start an agent, and policy then allows it, routes it for a decision or denies it. Actions a person may not take stay visible, disabled, with the reason.</p>`,
    footer: ADE.btn('Close', 'popupClose', {}, 'quiet') });
  P.profile = () => { const x = ADE.persona(); const pr = ADE.prefs(); return { eyebrow: ['person', 'Your profile'], title: x.name, body: `<p class="meta">${esc(x.role)}</p><label>Describe your expertise<textarea class="input" name="expertise" rows="4">${esc(ADE.expertise(x.id))}</textarea></label><p class="meta">Agents use this to adapt replies to your @agent comments. Summaries, facts, navigation, permissions and policy outcomes stay the same for everyone.</p>
      <h3>Preferences</h3><div class="grid grid--2"><label>Number format<select class="input" name="number"><option value="en-GB" ${pr.number === 'en-GB' ? 'selected' : ''}>1,234.50</option><option value="de-DE" ${pr.number === 'de-DE' ? 'selected' : ''}>1.234,50</option></select></label><label>Date format<select class="input" name="date"><option value="dmy" ${pr.date === 'dmy' ? 'selected' : ''}>14 Oct</option><option value="mdy" ${pr.date === 'mdy' ? 'selected' : ''}>Oct 14</option><option value="numeric" ${pr.date === 'numeric' ? 'selected' : ''}>14.10.</option></select></label></div><p class="meta">Currency, time zone and the working day are project settings (Configuration → Project settings).</p>`, footer: ADE.btn('Save', 'profileSave', {}, 'primary') }; };
  P.newWork = ({ pid, parent }) => withP(pid, (p) => ({ eyebrow: ['add', 'New work item'], title: 'Add work', wide: true, body: `<label>Title<input class="input" name="title"></label><label>Inside<select class="input" name="parent">${ADE.can(p, 'create-work').ok ? '<option value="">Top level</option>' : ''}${p.work.filter((w) => ADE.can(p, 'add-child', { work: w }).ok).map((w) => `<option value="${esc(w.id)}" ${w.id === parent ? 'selected' : ''}>${'· '.repeat(ADE.ancestors(p, w.id).length)}${esc(w.title)}${w.status === 'done' ? ' (done — adding reopens it)' : ''}</option>`).join('')}</select></label><label>Purpose (why)<input class="input" name="purpose"></label><label class="radio"><input type="checkbox" name="visible"> Customer-visible change</label><p class="meta">Add scope and acceptance criteria on the item with the edit button next to each section. The item is not ready until purpose, in scope and one criterion are written.</p>`, footer: ADE.btn('Create', 'newWorkSave', { pid }, 'primary', 'add') }));
  P.addToRelease = ({ pid, wid }) => withP(pid, (p) => ({ eyebrow: ['flag', 'Add to release'], title: ADE.item(p, wid).title, body: `${p.releases.map((r) => `<label class="radio"><input type="radio" name="rel" value="${esc(r.id)}" ${r.members.includes(wid) ? 'disabled' : ''}> ${esc(r.name)} ${r.members.includes(wid) ? '<span class="meta">already in</span>' : ''}</label>`).join('')}<p class="meta">The item and all its descendants are pulled in and counted once.</p>`, footer: ADE.btn('Add', 'addToReleaseSave', { pid, wid }, 'primary') }));
  P.releaseAdd = ({ pid, rid }) => withP(pid, (p) => { const r = p.releases.find((x) => x.id === rid); return { eyebrow: ['flag', r.name], title: 'Add work to this release', wide: true, body: `<p class="meta">Pick items; each brings its descendants. Items already inside a picked parent are shown as “Inside” and never double-counted.</p>${ADE.tree(p, { expand: 'all', selectable: true, selected: r.members })}`, footer: ADE.btn('Add selected', 'releaseAddSave', { pid, rid }, 'primary') }; });
  P.releaseOutcome = ({ pid, rid }) => withP(pid, (p) => { const r = p.releases.find((x) => x.id === rid); return { eyebrow: ['flag', r.name], title: 'Unmark as customer outcome?', body: `<p>The release stays, with its work and forecast. It is shown as an internal grouping instead of a customer outcome.</p><label>Why? (recorded in the event)<textarea class="input" name="reason" rows="2"></textarea></label>`, footer: ADE.btn('Unmark', 'releaseOutcomeSave', { pid, rid }, 'primary', 'flag') }; });
  P.newRelease = ({ pid }) => withP(pid, () => ({ eyebrow: ['flag', 'New release'], title: 'Name a customer outcome', body: `<label>Name — what will the customer notice?<input class="input" name="name"></label><label class="radio"><input type="checkbox" name="outcome" checked> This is a customer outcome</label><div class="grid grid--2"><label>Budget (${esc(ADE.fmtCtx.currency)})<input class="input" type="number" name="budget"></label><label>Planned date<input class="input" name="planned"></label></div>`, footer: ADE.btn('Create release', 'newReleaseSave', { pid }, 'primary') }));
  P.description = ({ pid }) => withP(pid, (p) => ({ eyebrow: ['edit_note', 'Project description'], title: p.name, wide: true, body: `<label>Description — what this project is for<textarea class="input" name="text" rows="8">${esc(p.description)}</textarea></label><p class="meta">The project has a description and its work items. Goals, scope and acceptance criteria are defined on the work items.</p>`, footer: `${ADE.btn('Cancel', 'popupClose', {}, 'quiet')}${ADE.btn('Save', 'descriptionSave', { pid }, 'primary', 'check')}` }));
  P.attach = ({ pid }) => withP(pid, (p) => {
    const d = S().drafts.attach[pid] || { tab: 'new' }; const w = d.wid && ADE.item(p, d.wid);
    const target = w ? `${w.id} “${w.title}”` : 'project knowledge';
    const ups = F.uploads[pid] || F.uploads.default;
    const tabsHtml = w ? `<div class="tabs-inline">${[['existing', 'Existing project source'], ['new', 'New file']].map(([t, l]) => `<button type="button" class="tab${d.tab === t ? ' is-active' : ''}" data-act="attachTab" data-pid="${esc(pid)}" data-tab="${t}">${l}</button>`).join('')}</div>` : '';
    if (d.ask) {
      const s = ADE.source(p, d.ask); const up = d.up;
      return { eyebrow: ['compare', `Attach to ${target}`], title: `Is this a new revision of ${s.title}?`, wide: true,
        body: `<p><strong>${esc(up.label)}</strong> has the same name as <strong>${esc(s.title)}</strong> @ ${esc(s.revision)} but different content.</p>
          <label class="radio"><input type="radio" name="choice" value="revision" data-act="attachChoice" data-pid="${esc(pid)}" data-choice="revision" ${d.choice === 'revision' ? 'checked' : ''}> Yes — record it as the next revision of ${esc(s.title)}. Facts from the older revision are marked superseded, not duplicated; items pinned to the older revision keep it until someone chooses the new one.</label>
          <label class="radio"><input type="radio" name="choice" value="new" data-act="attachChoice" data-pid="${esc(pid)}" data-choice="new" ${d.choice === 'new' ? 'checked' : ''}> No — keep it as a separate source, labelled as possibly overlapping ${esc(s.title)}.</label>`,
        footer: d.choice ? ADE.btn('Continue', 'attachUpload', { pid }, 'primary', 'source') : '<button class="btn btn--primary" type="button" disabled>Continue</button>' };
    }
    const existing = p.sources.filter((s) => !(w && w.attachments.some((a) => a.src === s.id)));
    const body = d.tab === 'existing' ? `${tabsHtml}<p class="meta">Link a source the project already has. No new source is created.</p>${existing.map((s) => `<label class="radio"><input type="radio" name="src" value="${esc(s.id)}"> ${icon('description')}${esc(s.title)} <span class="meta">${esc(s.kind)} @ ${esc(s.revision)}</span></label>`).join('') || '<p class="meta">Every project source is already attached.</p>'}`
      : `${tabsHtml}<label class="dropzone" data-dropzone data-pid="${esc(pid)}">${icon('upload_file')}<strong>Drop files here, or choose files</strong><span class="meta">Any number of files. They are read in your browser and stay on this computer. ADE fingerprints each one: the same content becomes a link, a changed file with the same name asks whether it is a new revision.</span><input class="visually-hidden" type="file" multiple data-files="attachFiles" data-pid="${esc(pid)}"></label>
        <h3 class="h-small">Or use a sample file</h3>${ups.map((u) => { const c = ADE.classifyUpload(p, u); return `<label class="radio"><input type="radio" name="file" value="${esc(u.id)}"> ${icon('description')}${esc(u.label)} <span class="meta">${esc(u.purpose)}</span>${c.kind === 'linked' ? ` ${ADE.tone(`Already in project as ${c.source.title}`, 'info', 'link')}` : c.kind === 'ask' ? ` ${ADE.tone(`Same name as ${c.source.id}`, 'warn', 'compare')}` : ''}</label>`; }).join('')}<p class="meta">Every attachment becomes a project source; the original is kept unchanged and extraction runs on the next tick.</p>`;
    return { eyebrow: ['add', `Attach to ${target}`], title: w ? 'Attach a document' : 'Add a document to project knowledge', wide: true, body, footer: d.tab === 'existing' ? ADE.btn('Attach', 'attachExisting', { pid }, 'primary', 'link') : ADE.btn('Add sample file', 'attachUpload', { pid }, 'primary', 'source') };
  });
  P.detach = ({ pid, wid, src }) => withP(pid, (p) => {
    const w = ADE.item(p, wid); const s = ADE.source(p, src);
    const facts = p.facts.filter((f) => f.source === src && (f.usedBy || []).includes(wid));
    const runs = p.runs.filter((r) => r.work === wid && r.context.some((c) => c.src === src));
    return { eyebrow: ['remove', `Detach from ${wid}`], title: `Remove ${s.title} from “${w.title}”?`, wide: true,
      body: `<p>The source stays in project knowledge. This item and its future runs stop receiving it.</p><h3>Facts it fed into this item (${facts.length})</h3><ul class="plain">${facts.map((f) => `<li>${ADE.kind(f.kind)} ${esc(f.text)}</li>`).join('') || '<li class="meta">None.</li>'}</ul><h3>Runs that received it as context (${runs.length})</h3><ul class="plain">${runs.map((r) => `<li>${esc(r.id)} ${ADE.badge(r.state)}</li>`).join('') || '<li class="meta">None.</li>'}</ul><p class="meta">Past runs keep their recorded context.</p>`,
      footer: `${ADE.btn('Keep it', 'popupClose', {}, 'quiet')}${ADE.btn('Remove attachment', 'detachConfirm', { pid, wid, src }, 'primary', 'remove')}` };
  });
  P.deps = ({ pid, wid, error }) => withP(pid, (p) => {
    const w = ADE.item(p, wid);
    const options = p.work.filter((x) => x.id !== wid && !w.deps.includes(x.id));
    return { eyebrow: ['link', `Dependencies · ${wid}`], title: `What must be done before “${w.title}”?`, wide: true,
      body: `${error ? `<div class="callout callout--bad">${icon('block')}<div><strong>Cycle rejected</strong><p>${esc(error)}</p></div></div>` : ''}<label>Waits for<select class="input" name="dep"><option value="">Choose a work item…</option>${options.map((x) => `<option value="${esc(x.id)}">${'· '.repeat(ADE.ancestors(p, x.id).length)}${esc(x.id)} ${esc(x.title)} — ${esc(ADE.label(x.status))}</option>`).join('')}</select></label><p class="meta">Depending on an item means waiting until that item is done. A parent is done only when all its children are done or deferred, so depending on your own parent would be a cycle and is rejected.</p>`,
      footer: ADE.btn('Add dependency', 'depAdd', { pid, wid }, 'primary', 'link') };
  });
  // Section editor popup: a text field for purpose; an item list (add, remove, reorder) for scope, criteria and extra conditions.
  P.field = ({ key }) => {
    const d = (S().drafts.field || {})[key]; if (!d) return { eyebrow: ['edit_note', 'Edit'], title: 'Nothing to edit', body: '', footer: '' };
    return withP(d.pid, (p) => {
      const isChild = d.child !== ''; const t = isChild ? ((S().drafts.split[`${d.pid}:${d.wid}`] || { children: [] }).children[Number(d.child)] || {}) : ADE.item(p, d.wid);
      const label = ADE.FIELD_LABEL[d.field];
      const hint = { purpose: 'Why this item exists, in one or two sentences.', inScope: 'What this item covers. One item per row.', outScope: 'What it deliberately leaves out. One item per row.', criteria: 'Checkable statements the result must satisfy. They are numbered AC1, AC2… in this order; reviews and gates refer to them by number.', doneExtra: 'Conditions added by hand to the computed “Done when” list.', details: '', forecast: 'A range in the project currency. Leave both empty for “no estimate” (shown as unknown, not zero).' }[d.field];
      let body = '';
      if (d.field === 'purpose') body = `<label>${esc(label)}<textarea class="input" name="text" rows="3">${esc(t.purpose || '')}</textarea></label>`;
      else if (d.field === 'details') body = `<label>Title<input class="input" name="title" value="${esc(t.title)}"></label><label>Owner<select class="input" name="owner">${Object.values(F.people).filter((x) => p.access.includes(x.id)).map((x) => `<option value="${x.id}" ${t.owner === x.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label><label class="radio"><input type="checkbox" name="visible" ${t.customerVisible ? 'checked' : ''}> Customer-visible change</label>`;
      else if (d.field === 'forecast') body = `<div class="grid grid--2"><label>Low (${esc(ADE.fmtCtx.currency)})<input class="input" type="number" name="lo" value="${esc(t.forecast ? t.forecast[0] : '')}"></label><label>High (${esc(ADE.fmtCtx.currency)})<input class="input" type="number" name="hi" value="${esc(t.forecast ? t.forecast[1] : '')}"></label></div>`;
      else body = `<ol class="list-editor" aria-label="${esc(label)}">${d.items.map((v, i) => `<li class="list-editor__row">${d.field === 'criteria' ? `<span class="list-editor__id">AC${i + 1}</span>` : `<span class="list-editor__id" aria-hidden="true">•</span>`}<input class="input" value="${esc(v)}" data-input="fieldItem" data-key="${esc(key)}" data-idx="${i}" aria-label="${esc(label)} item ${i + 1}"><span class="list-editor__tools">${ADE.btn('', 'fieldMove', { key, idx: i, dir: -1 }, 'quiet', 'arrow_upward').replace('<button', `<button aria-label="Move item ${i + 1} up"${i === 0 ? ' disabled' : ''}`)}${ADE.btn('', 'fieldMove', { key, idx: i, dir: 1 }, 'quiet', 'arrow_downward').replace('<button', `<button aria-label="Move item ${i + 1} down"${i === d.items.length - 1 ? ' disabled' : ''}`)}${ADE.btn('', 'fieldRemove', { key, idx: i }, 'quiet', 'close').replace('<button', `<button aria-label="Remove item ${i + 1}"`)}</span></li>`).join('')}</ol>${ADE.btn('Add item', 'fieldAdd', { key }, 'outline', 'add')}`;
      return { eyebrow: ['edit_note', `${isChild ? 'Proposed child' : d.wid} · ${label}`], title: t.title || label, wide: d.field !== 'purpose' && d.field !== 'forecast', body: `${hint ? `<p class="meta">${esc(hint)}</p>` : ''}${body}`, footer: `${ADE.btn('Cancel', 'popupClose', {}, 'quiet')}${ADE.btn('Save', 'fieldSave', { key }, 'primary', 'check')}` };
    });
  };
  P.done = ({ pid, wid }) => withP(pid, (p) => { const w = ADE.item(p, wid); const leaf = ADE.isLeaf(p, w); return { eyebrow: ['task_alt', `${leaf ? 'Record human contribution' : 'Mark done'} · ${wid}`], title: w.title, wide: true, body: `<p>${leaf ? 'Use this when a person did the work, or the item is settled without an agent run.' : 'All children are done or deferred.'} Record what shows it is done.</p><label>Evidence (required)<textarea class="input" name="evidence" rows="3" placeholder="e.g. Rule agreed with the library board on 12 Oct; written into domain-notes.md @ 18aa"></textarea></label><label>Human effort in hours (optional)<input class="input" type="number" name="hours" step="0.5" min="0"></label><p class="meta">Hours are shown as days using the project's ${esc(ADE.fmtCtx.dayHours)}-hour working day. Items that depend on this one are re-checked.</p>`, footer: ADE.btn('Mark done', 'doneSave', { pid, wid }, 'primary', 'task_alt') }; });
  P.addRepo = () => ({ eyebrow: ['link', 'Connect repository'], title: 'Connect a repository', body: '<label>URL<input class="input" name="url" placeholder="git.example/team/repo"></label><label class="radio"><input type="radio" name="kind" value="code" checked> Code repository</label><label class="radio"><input type="radio" name="kind" value="docs"> Documentation repository</label><p class="meta">ADE reads at an exact revision and never writes to the repository from here.</p>', footer: ADE.btn('Connect', 'addRepoSave', { pid: ADE.parse().parts[1] }, 'primary', 'link') });
  P.raiseRisk = ({ pid }) => withP(pid, (p) => ({ eyebrow: ['report_problem', 'Raise a risk'], title: 'What could derail outcome, cost or time?', wide: true, body: `<label>Risk<input class="input" name="title"></label><label>What happens if it occurs?<input class="input" name="consequence" placeholder="Who is affected, and how"></label><div class="grid grid--2"><label>Main dimension<select class="input" name="dim">${['customer', 'cost', 'time', 'scope', 'authority', 'evidence', 'capacity'].map((d) => `<option>${d}</option>`).join('')}</select></label><label>Level<select class="input" name="level"><option>low</option><option selected>medium</option><option>high</option><option>unknown</option></select></label><label>Likelihood<select class="input" name="likelihood"><option value="0">Unknown</option><option value="1">Low</option><option value="2" selected>Medium</option><option value="3">High</option></select></label><label>Impact<select class="input" name="impact"><option value="1">Low</option><option value="2" selected>Medium</option><option value="3">High</option></select></label>${me() === p.owner ? `<label>Owner<select class="input" name="owner"><option value="">Nobody yet</option>${Object.values(F.people).filter((x) => p.access.includes(x.id)).map((x) => `<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select></label>` : `<p class="meta">${esc(ADE.personName(p.owner))} (accountable owner) assigns the owner.</p>`}<label>Affects<select class="input" name="work"><option value="">—</option>${p.work.filter((w) => w.status !== 'done').map((w) => `<option value="${esc(w.id)}">${esc(w.title)}</option>`).join('')}</select></label></div>`, footer: ADE.btn('Raise risk', 'raiseRiskSave', { pid }, 'primary') }));
  P.contractJson = ({ pid, key }) => { const c = ADE.P(pid).contracts[key]; return { eyebrow: ['code', `Active · revision ${c.revision}`], title: ADE.CONTRACTS[key].title, wide: true, body: `<pre class="code">${esc(JSON.stringify(c.json, null, 2))}</pre>`, footer: '<span class="meta">Read-only. Change it by describing the change.</span>' }; };
  P.contractReadme = ({ pid, key }) => { const c = ADE.P(pid).contracts[key]; return { eyebrow: ['menu_book', 'README'], title: `How ${ADE.CONTRACTS[key].title.toLowerCase()} work${key === 'settings' || key === 'skills' || key === 'agents' ? '' : 's'}`, body: `<ul class="plain">${c.readme.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>`, footer: '' }; };
  P.contractHistory = ({ pid, key }) => { const c = ADE.P(pid).contracts[key]; return { eyebrow: ['history', 'History'], title: 'Revisions', body: `<table class="table"><tbody>${[...c.history].reverse().map((h) => `<tr><td>Revision ${h.revision}</td><td>${esc(h.date)}</td><td>${esc(ADE.personName(h.by))}</td><td>${esc(h.change)}</td></tr>`).join('')}</tbody></table>`, footer: '' }; };
  P.access = ({ id }) => { const d = F.directory.find((x) => x.id === id); return { eyebrow: ['person_add', 'Request access'], title: d.name, body: `<p>${esc(d.about)} Owner: ${esc(d.owner)}.</p><label>Why do you need access?<textarea class="input" name="reason" rows="3"></textarea></label>`, footer: ADE.btn('Send request', 'accessSend', { id }, 'primary', 'send') }; };
  P.journeys = () => ({ eyebrow: ['science', 'Prototype guide · not part of ADE'], title: 'Walk the v3 journeys', wide: true, body: ADE.journeyGuide(), footer: '<span class="meta">All data is synthetic. Actions are deterministic prototype transitions; no backend, repository, agent or policy engine is called.</span>' });

  ADE.journeys = [
    { id: 'J1', title: 'Continue recent work (Tomas)', start: ['protoStart', 'returning'], steps: ['Home opens the Borrowbox dashboard; the subtitle is generated from state.', 'Open “Save a loan and update availability”: purpose, in-scope and out-of-scope items, acceptance criteria and a computed “Done when”; each section has an edit button.', 'In the margin, Decide D-12 (pick Elena\'s answer) — readiness turns Ready; the decision becomes a knowledge fact and the dashboard subtitle shows “Outdated”.', 'Click “Start agent…”: choose a profile, read its steps and model, start the run.', 'Prototype bar: Simulate next tick twice (Build → Test → Submit; AU-1 regenerates the summary). Switch to Sofia; Review output: open the collapsed sections, then Accept.', 'As Tomas, the review buttons are disabled with the reason. Back on the release: posture updated; release not complete.'] },
    { id: 'J2', title: 'Import an existing project (Servora)', start: ['nav', '#/import'], steps: ['Project menu, then Import existing project.', 'Connect the code repository (or choose documents only); try ops-scripts — it fails; Retry, then Continue without it.', 'Connect the documentation repository; import documents: partial, stale and excluded results.', 'Review findings; choose a structure; set budget and date yourself.', 'Dashboard with gaps visible. As Elena answer A-1; as Tomas adopt it — W-110 is done with evidence and W-130 still waits for W-120.'] },
    { id: 'J3', title: 'Start a greenfield project (Nina)', start: ['protoStart', 'empty'], steps: ['Empty home, then Create a project.', 'Name and description: pick the staff or member outcome as the description.', 'Answer the two first questions — they change the proposed first release.', 'Add documents and create empty repositories; keep or dismiss risks.', 'Set the first release budget and date, then create: the dashboard shows the proposed release.'] },
    { id: 'J4', title: 'Edit, depend and decompose', start: ['nav', '#/p/borrowbox/work/W-122'], steps: ['“Return a book” waits for W-121: the chip, the readiness check and the disabled Mark ready say so.', 'Add a dependency on W-120 (its parent): rejected as a cycle.', 'Open “Send due-date reminders”: use the edit button on In scope — add, reorder and remove items in the popup; save.', 'Split…, compare strategies, generate children with purpose, scope and criteria; accept.', 'On a child: Mark ready; above the run limit policy needs your decision. Work → Reorder moves items; Mine filters.'] },
    { id: 'J5', title: 'Surface and manage risk and cost', start: ['nav', '#/p/borrowbox/risks'], steps: ['Risks: filter by dimension; each card shows the live policy line.', 'Open R-07: responses; as Sofia a paid response becomes a decision for Tomas.', 'Tomas approves: spike item created inside the release; forecast updates.', 'Dashboard: cost by kind (agent, provider, human days) and the project time posture.', 'Configuration → Project settings: “Use GBP as currency”, propose, activate: every amount relabels.'] },
    { id: 'J6', title: 'Initiate or supervise agent work', start: ['nav', '#/p/borrowbox/work/W-3121'], steps: ['As Tomas or Elena, Mark ready on “Record a damage note”: AU-3 starts the default profile within policy.', 'Activity: run 0142 (spec-kit) shows Specify ✓ → Approve spec ✓ → Plan ✓ → Build (2/4) → Test ✗; Simulate next tick to watch the loop pass.', 'Pause, resume or stop (confirm) a run; Sofia can\'t pause Elena\'s run (disabled with the reason).', 'Configuration → Agents: “Use synthetic-model-XL for the plan step in spec-kit”; “skip the human review” is rejected by validation.', 'Configuration → Policy: “Let agents start runs up to 350 without asking me”, propose, activate; verdicts change.'] },
    { id: 'J7', title: 'Review grounded knowledge', start: ['nav', '#/p/borrowbox/knowledge'], steps: ['Ask “How fast must a book show as unavailable?”; ask “Is the logo out yet?” — a weak match is labelled.', 'Ask “What is out of scope?” — collected from the work items\' out-of-scope lists.', 'Knowledge → Add document: the loan-policy copy links to S-1; the edited loan-policy asks “new revision?”.', 'Say yes, Simulate next tick: old facts show “Superseded”; W-121 shows “Newer revision available”.', 'Add barcode-format.txt, Simulate next tick: the blocked scan item\'s check turns satisfied and R-14 closes.'] },
  ];
  ADE.journeyGuide = () => `<p>Use these paths to review the lo-fi functional model. Each starts from a real application route; the prototype bar only resets state, switches the signed-in person or simulates the next tick.</p>${ADE.journeys.map((j) => `<section class="guide"><h3>${esc(j.id)} · ${esc(j.title)}</h3><ol>${j.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>${j.start[0] === 'protoStart' ? ADE.btn(`Reset to “${ADE.STARTS[j.start[1]].label}” and start`, 'protoStart', { v: j.start[1] }, 'outline', 'play_circle') : `<a class="btn btn--outline" href="${esc(j.start[1])}" data-act="popupClose">Go to start</a>`}</section>`).join('')}`;
})(typeof window !== 'undefined' ? window : globalThis);
