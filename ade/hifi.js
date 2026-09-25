// ADE v3 hi-fi prototype · design-system rendering over the lo-fi state model.
// Loaded after the lo-fi fixtures, core, model, screens and actions. It changes no state and adds no route or action:
// it replaces primitive renderers with the gallery's markup, supplies the hi-fi-only compositions reserved in
// primitive-contracts.md (Pager, RiskLayout, DiffViewer, StepDetail, drag reordering) and declares the trace from
// every route and popup to its journeys and primitives. Browser-only behaviour (drag, hover) is guarded for Node.
(function (root) {
  const ADE = root.ADE;
  const F = ADE.fixtures;
  const { esc, icon } = ADE;
  const pct = (v) => `${(Math.max(0, Math.min(1, v)) * 100).toFixed(1)}%`;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const LIKELY = { 1: 'unlikely', 2: 'possible', 3: 'likely' };
  const IMPACT = { 1: 'minor', 2: 'moderate', 3: 'major' };
  const sev = (l, i) => (!l ? 'unknown' : l * i >= 7 ? 'high' : l * i >= 3 ? 'medium' : 'low');
  ADE.PAGE_SIZE = 10;

  /* ------------------------------------------------------------------ people */
  ADE.person = (id, compact) => {
    if (!id || !F.people[id]) return '<span class="person person--none">Unassigned</span>';
    const pp = F.people[id]; const av = `<span class="avatar avatar--${esc(id)}">${esc(pp.initials)}</span>`;
    return compact ? `<span class="person person--compact" title="${esc(pp.name)}">${av}<span class="visually-hidden">Owner ${esc(pp.name)}</span></span>` : `<span class="person">${av}${esc(pp.name)}</span>`;
  };

  /* ------------------------------------------------------------------ DimensionBadge: gallery level ramp */
  // Owner review round 4: the badge shows the dimension only; the level is carried by the shade and the three-step meter
  // (never colour alone), and stays in the accessible name and the tooltip.
  ADE.level = (dim, lv) => `<span class="dim level--${esc(lv)}" role="img" aria-label="${esc(dim)}: ${esc(lv)}" title="${esc(dim)}: ${esc(lv)}"><span class="dim__meter" aria-hidden="true"><i></i><i></i><i></i></span><span aria-hidden="true">${esc(dim)}</span></span>`;

  /* ------------------------------------------------------------------ PolicyOutcome: verdict stamp */
  const STAMP = { allow: 'allow', 'needs-decision': 'decision', deny: 'deny' };
  ADE.stamp = (verdict, text) => `<span class="stamp stamp--${STAMP[verdict] || 'decision'}">${icon(verdict === 'allow' ? 'shield' : verdict === 'deny' ? 'block' : 'help_outline')}${esc(text)}</span>`;
  ADE.policyRow = function (p, it, actor) {
    const e = ADE.evaluate(p, it, actor);
    const words = { allow: 'Allowed', 'needs-decision': e.youDecide ? 'Your decision' : 'Needs decision', deny: 'Denied' }[e.verdict];
    // Verdict and rule on the first line, the reason as a sentence beneath (owner review round 3).
    return `<div class="policy-row"><div class="policy-row__head">${ADE.stamp(e.verdict, words)}<button type="button" class="rule-link" data-act="policyEval" data-pid="${esc(p.id)}" data-wid="${esc(it.id)}" aria-label="Show the policy evaluation${e.rule ? ` for rule ${esc(e.rule)}` : ''}">${e.rule ? `Rule ${esc(e.rule)}` : 'Why?'}</button></div><p class="policy-row__reason">${esc(e.reason)}</p></div>`;
  };

  /* ------------------------------------------------------------------ Spend by kind: value, then its detail on its own line */
  ADE.spendKv = function (s) {
    const rate = ADE.fmtCtx.dayRate;
    return `<dl class="kv kv--split"><div><dt>Agent</dt><dd>${ADE.eur(s.agent)}<small>${ADE.agentTime(s.agentMin)}</small></dd></div><div><dt>Provider</dt><dd>${ADE.eur(s.provider)}</dd></div><div><dt>Human</dt><dd>${ADE.days(s.humanDays)}${rate ? `<small>≈ ${ADE.eur(s.humanDays * rate)}</small>` : ''}</dd></div></dl><p class="meta">Budget gauges count agent and provider spend. Human effort is shown in days${rate ? ` and at the ${ADE.eur(rate)} day rate` : ''}, not added to the budget.</p>`;
  };

  /* ------------------------------------------------------------------ CostPosture gauge (gallery markup) */
  ADE.gauge = function ({ title, lo, hi, fill, mark, unknown, labels, compact }) {
    const head = title ? `<div class="gauge__head"><strong>${esc(title)}</strong></div>` : '';
    if (unknown) return `<div class="gauge gauge--unknown${compact ? ' gauge--compact' : ''}" role="img" aria-label="${esc(`${title || 'Forecast'}: unknown. ${labels.fill || ''}`)}">${head}<div class="gauge__track"><span class="gauge__unknown">Forecast unknown</span></div><div class="gauge__below"><span class="gauge__tag" style="left:0">${esc(labels.fill || '')}</span></div></div>`;
    const past = fill > mark;
    const cls = ['gauge', compact && 'gauge--compact', past && 'gauge--fill-past-mark', !past && fill < 0.22 && 'gauge--fill-start', !past && mark > 0.78 && 'gauge--mark-end', past && fill > 0.78 && 'gauge--fill-end'].filter(Boolean).join(' ');
    // Owner review (Phase 6): no forecast label or bracket above the track; the forecast range is the part of the
    // track framed by a top and bottom border. The range stays in the accessible name and the tooltip.
    const style = `--lo:${pct(lo)};--hi:${pct(hi)};--fill:${pct(fill)};--mark:${pct(mark)}`;
    return `<div class="${cls}" style="${style}" role="img" aria-label="${esc(`${title || 'Gauge'}: ${labels.fill}, ${labels.range}, ${labels.mark}`)}" title="${esc(labels.range)}">${head}
      <div class="gauge__track" aria-hidden="true"><span class="gauge__zones"></span><span class="gauge__rest"></span><span class="gauge__range"></span><span class="gauge__mark"></span></div>
      <div class="gauge__below" aria-hidden="true"><span class="gauge__tag gauge__tag--fill">${esc(labels.fill)}</span><span class="gauge__tag gauge__tag--mark">${esc(labels.mark)}</span></div>
    </div>`;
  };

  /* ------------------------------------------------------------------ StepLine: Material icons, no text glyphs */
  const STEP_ICON = { done: 'check_circle', fail: 'error_outline', now: 'radio_button_checked', todo: 'radio_button_unchecked' };
  ADE.stepLine = function (p, run) {
    const steps = ADE.runSteps(p, run);
    if (!steps.length) return `<p class="step-line step-line--empty meta">${run.deniedBeforeStart ? 'Denied before the first step.' : 'No workflow steps.'}</p>`;
    return `<ol class="step-line" aria-label="Workflow steps">${steps.map((s, i) => `<li class="step-line__step is-${s.status}${s.addedBy ? ' is-policy' : ''}"${s.addedBy ? ` title="Added by ${esc(s.addedBy)}"` : ''}>${i ? `<i class="icon step-line__sep" data-icon="chevron_right" aria-hidden="true"></i>` : ''}${icon(s.status === 'now' && run.state === 'awaiting-input' ? 'person' : STEP_ICON[s.status])}<span>${esc(s.title)}${s.max && s.visits > 1 ? ` (${s.visits}/${s.max})` : ''}</span><span class="visually-hidden"> ${s.status === 'todo' ? 'not started' : s.status === 'now' ? 'current' : s.status === 'fail' ? 'failed' : 'done'}${s.addedBy ? `, added by ${esc(s.addedBy)}` : ''}</span></li>`).join('')}</ol>`;
  };

  /* ------------------------------------------------------------------ AgentRun row: aligned columns, attention as a line, not a banner */
  ADE.runRow = function (p, run, forceOpen) {
    const open = !!ADE.ui.expanded[run.id] || forceOpen; const w = run.work && ADE.item(p, run.work);
    const pct = Math.min(100, Math.round((run.spent / run.reserved) * 100));
    const prof = run.profile && ADE.profile(p, run.profile); const st = prof && run.wf.at ? prof.workflow.steps[run.wf.at] : null;
    const bad = ['failed', 'rejected', 'stopped'].includes(run.state) || run.deniedBeforeStart;
    return `<div class="run${open ? ' is-open' : ''}" id="run-${esc(run.id)}">
      <div class="run__row">
        <button class="icon-btn run__toggle" type="button" data-act="toggle" data-key="${esc(run.id)}" data-default="${forceOpen ? '1' : '0'}" aria-expanded="${!!open}" aria-label="${open ? 'Hide' : 'Show'} run details">${icon(open ? 'expand_more' : 'chevron_right')}</button>
        <div class="run__state">${ADE.badge(run.state)}<small>${esc(run.id.replace('RUN-', 'Run '))} · attempt ${run.attempt}</small></div>
        <div class="run__main"><span class="run__title">${w ? ADE.a(w.title, ADE.plink(p.id, `work/${w.id}`)) : esc(run.system || run.profile)}</span>${ADE.stepLine(p, run)}${run.attention ? `<p class="run__note${bad ? ' is-bad' : ''}">${icon(bad ? 'block' : 'warning_amber')}<span>${esc(run.attention)}</span></p>` : ''}</div>
        <div class="run__agent"><span>${esc(prof ? prof.title : run.agent)}</span><small>${esc(st && st.model ? st.model : prof ? prof.model : run.model)}</small></div>
        <div class="run__spend"><span class="minibar" aria-hidden="true"><i style="width:${pct}%"></i></span><small>${esc(ADE.eur(run.spent))} of ${esc(ADE.eur(run.reserved))}</small></div>
        <div class="run__controls">${ADE.runControls(p, run)}</div>
      </div>
      ${open ? ADE.runDetail(p, run) : ''}
    </div>`;
  };

  /* ------------------------------------------------------------------ EventRow: icon, what happened and what it triggered, time and outcome on the right */
  ADE.eventRow = (p, e) => `<div class="event"><span class="event__icon">${icon(e.icon)}</span><div class="event__text"><span>${ADE.linkRefs(p, e.text)}</span><small>${icon('subdirectory_arrow_right')}<span>${ADE.linkRefs(p, e.triggered)}</span></small></div><div class="event__side">${e.outcome && e.outcome !== 'none' ? ADE.badge(e.outcome === 'allow' ? 'allow' : e.outcome) : '<span class="badge badge--neutral">No action</span>'}<span class="event__at">${esc(e.at)}</span></div></div>`;

  /* ------------------------------------------------------------------ RiskMatrix (mini on cards, full in RiskLayout) */
  const miniMatrix = (r) => {
    const cells = [];
    for (let i = 3; i >= 1; i--) for (let l = 1; l <= 3; l++) {
      const s = l * i; const lv = s >= 7 ? 'l3' : s >= 3 ? 'l2' : s >= 2 ? 'l1' : 'l0';
      const now = r.now[0] === l && r.now[1] === i; const tgt = r.target[0] === l && r.target[1] === i;
      cells.push(`<span class="c ${lv}${now ? ' now' : tgt ? ' target' : ''}"></span>`);
    }
    return `<div class="matrix" role="img" aria-label="${esc(`${r.id}: now ${r.now[0] ? `${LIKELY[r.now[0]]}, ${IMPACT[r.now[1]]}` : 'likelihood unknown'}; target ${LIKELY[r.target[0]]}, ${IMPACT[r.target[1]]}`)}">${cells.join('')}</div>`;
  };
  const fullMatrix = (risks, pid, opts = {}) => {
    const rows = [];
    for (let i = 3; i >= 1; i--) {
      rows.push(`<span class="risk-matrix__y">${esc(IMPACT[i])}</span>`);
      for (let l = 1; l <= 3; l++) {
        const here = risks.filter((r) => r.now[0] === l && r.now[1] === i); const key = `${l}-${i}`; const sel = opts.cell === key;
        rows.push(`<div class="risk-matrix__cell risk-matrix__cell--${sev(l, i)}${sel ? ' is-selected' : ''}">${opts.link && here.length ? `<a class="risk-matrix__filter" href="${esc(opts.link(key))}" aria-label="${esc(`${sel ? 'Clear filter' : 'Show only'}: ${here.length} risk${here.length > 1 ? 's' : ''}, ${LIKELY[l]}, ${IMPACT[i]} impact`)}"${sel ? ' aria-current="true"' : ''}></a>` : ''}${here.map((r) => `<a class="risk-matrix__chip" data-risk="${esc(r.id)}" href="${esc(ADE.plink(pid, 'risks', { ...(opts.q || {}), risk: r.id }))}" title="${esc(r.title)}">${esc(r.id)}</a>`).join('')}</div>`);
      }
    }
    const unknown = risks.filter((r) => !r.now[0]);
    return `<div class="risk-matrix" role="group" aria-label="Likelihood by impact matrix">
      <span class="risk-matrix__axis risk-matrix__axis--y">Impact</span>
      <div class="risk-matrix__grid">${rows.join('')}<span></span>${[1, 2, 3].map((l) => `<span class="risk-matrix__x">${esc(LIKELY[l])}</span>`).join('')}</div>
      <span class="risk-matrix__axis risk-matrix__axis--x">Likelihood</span>
      ${unknown.length ? `<p class="risk-matrix__unknown">${icon('help_outline')}Likelihood unknown: ${unknown.map((r) => `<a class="risk-matrix__chip" data-risk="${esc(r.id)}" href="${esc(ADE.plink(pid, 'risks', { ...(opts.q || {}), risk: r.id }))}">${esc(r.id)}</a>`).join(' ')}</p>` : ''}
    </div>`;
  };
  ADE.riskMatrix = (risks, pid, small, opts) => (small && risks.length === 1 ? miniMatrix(risks[0]) : fullMatrix(risks, pid, opts));

  const states = (r) => `<dl class="risk__states">
      <div><dt>Now</dt><dd>${r.now[0] ? `<span class="lvl level--${sev(r.now[0], r.now[1])}">${esc(sev(r.now[0], r.now[1]))}</span>${esc(LIKELY[r.now[0]])} · ${esc(IMPACT[r.now[1]])}` : '<span class="lvl level--unknown">unknown</span>likelihood unknown'}</dd></div>
      <div><dt>Target</dt><dd><span class="lvl level--${sev(r.target[0], r.target[1])}">${esc(sev(r.target[0], r.target[1]))}</span>${esc(LIKELY[r.target[0]])} · ${esc(IMPACT[r.target[1]])}</dd></div>
    </dl>`;
  ADE.riskCard = function (p, r) {
    const dims = Object.entries(r.dims).slice(0, 3).map(([d, lv]) => ADE.level(d, lv)).join('');
    const pol = ADE.riskPolicyLine(p, r);
    return `<article class="card risk" data-risk="${esc(r.id)}">
      <div class="risk__top">${ADE.badge(r.status)}<span class="meta">${esc(r.id)}</span></div>
      <h3 class="risk__title">${esc(r.title)}</h3>
      <div class="risk__dims">${dims}</div>
      <div class="risk__level">${miniMatrix(r)}${states(r)}</div>
      <p class="risk__policy">${icon('shield')}<span>${esc(pol.text)}</span></p>
      <div class="risk__foot">${ADE.person(r.owner)}${ADE.a('Details', ADE.plink(p.id, 'risks', { ...ADE.parse().q, risk: r.id }), 'btn btn--quiet')}</div>
    </article>`;
  };

  /* ------------------------------------------------------------------ RiskLayout (hi-fi only) */
  ADE.riskLayout = function (p, list, q, all = list) {
    const link = (key) => ADE.plink(p.id, 'risks', { ...q, risk: undefined, cell: q.cell === key ? undefined : key });
    const [l, i] = q.cell ? q.cell.split('-').map(Number) : [];
    return `<div class="risk-layout">
      <div class="risk-layout__cards">
        ${q.cell ? `<p class="risk-layout__filter" role="status">${icon('filter_list')}<span>Showing ${list.length} of ${all.length} risks: ${esc(LIKELY[l] || '?')} likelihood, ${esc(IMPACT[i] || '?')} impact.</span><a class="link" href="${esc(link(q.cell))}">Show all</a></p>` : ''}
        <div class="risk-grid">${list.map((r) => ADE.riskCard(p, r)).join('') || ADE.empty('task_alt', 'No risks match', 'Clear the filters.')}</div>
      </div>
      <aside class="risk-layout__matrix" aria-labelledby="exposure-h"><h2 class="h-small" id="exposure-h">Exposure now</h2>${fullMatrix(all, p.id, { link, cell: q.cell, q: { ...q, cell: q.cell } })}<p class="meta">Select a cell to show only its risks; select it again to show all. Hover a card to find its chip.</p></aside>
    </div>`;
  };

  /* ------------------------------------------------------------------ Pager (hi-fi only) */
  ADE.pager = function (rows, { page, link, label = 'Rows' } = {}) {
    const size = ADE.PAGE_SIZE; const n = Math.max(1, Math.ceil(rows.length / size));
    if (rows.length <= size || !link) return { rows, html: '' };
    const cur = clamp(Number(page) || 1, 1, n); const from = (cur - 1) * size;
    const nums = [...new Set([1, cur - 1, cur, cur + 1, n].filter((x) => x >= 1 && x <= n))].sort((a, b) => a - b);
    const out = []; nums.forEach((x, k) => { if (k && x - nums[k - 1] > 1) out.push('<span class="pager__gap" aria-hidden="true">…</span>'); out.push(x === cur ? `<span class="pager__page is-current" aria-current="page" aria-label="Page ${x}, current">${x}</span>` : `<a class="pager__page" href="${esc(link(x))}" aria-label="Page ${x}">${x}</a>`); });
    const nav = (x, ic, text, off) => (off ? `<span class="pager__step is-off" aria-hidden="true">${icon(ic)}</span>` : `<a class="pager__step" href="${esc(link(x))}" aria-label="${esc(text)}">${icon(ic)}</a>`);
    return {
      rows: rows.slice(from, from + size),
      html: `<nav class="pager" aria-label="${esc(label)} pages"><span class="pager__range" aria-live="polite">${from + 1}–${Math.min(from + size, rows.length)} of ${rows.length}</span>${nav(1, 'first_page', 'First page', cur === 1)}${nav(cur - 1, 'chevron_left', 'Previous page', cur === 1)}${out.join('')}${nav(cur + 1, 'chevron_right', 'Next page', cur === n)}${nav(n, 'last_page', 'Last page', cur === n)}</nav>`,
    };
  };

  /* ------------------------------------------------------------------ DiffViewer (hi-fi only, synthetic) */
  const camel = (s) => s.replace(/[^a-zA-Z0-9]+(.)/g, (m, c) => c.toUpperCase());
  ADE.syntheticDiff = function (f) {
    const name = f.path.split('/').pop(); const base = camel(name.replace(/\.[^.]+$/, '').replace(/\.test$/, ''));
    const isTest = /test/.test(f.path); const isDoc = /\.md$/.test(f.path);
    const addLine = (k) => (isDoc ? `- ${base}: documented behaviour ${k + 1}` : isTest ? `  it('${base} case ${k + 1}', () => expect(${base}(fixture${k + 1})).toMatchSnapshot());` : `export const ${base}Part${k + 1} = (input) => ${base}Rule${k + 1}(input);`);
    const delLine = (k) => (isDoc ? `- ${base}: old note ${k + 1}` : `// removed: legacy ${base} branch ${k + 1}`);
    const start = 10 + (name.length % 17); const lines = [];
    const dels = Math.min(f.del, 3); const adds = Math.min(f.add, 6);
    lines.push(`<span class="ln"></span><span class="c-dim">@@ -${start},${dels + 2} +${start},${adds + 2} @@ ${esc(base)}</span>`);
    lines.push(`<span class="ln">${start}</span> ${esc(isDoc ? `## ${base}` : isTest ? `describe('${base}', () => {` : `import { ${base}Rule } from './rules';`)}`);
    for (let k = 0; k < dels; k++) lines.push(`<span class="ln">${start + 1 + k}</span><span class="del">-${esc(delLine(k))}</span>`);
    for (let k = 0; k < adds; k++) lines.push(`<span class="ln">${start + 1 + k}</span><span class="add">+${esc(addLine(k))}</span>`);
    const more = f.add - adds + (f.del - dels);
    if (more > 0) lines.push(`<span class="ln"></span><span class="c-dim">… ${more} more changed lines (synthetic excerpt)</span>`);
    return lines.join('\n');
  };
  ADE.changedFiles = function (p, run, where) {
    const id = `diff-${run.id}-${where}`;
    return `<div class="diff-viewer" id="${esc(id)}">
      <div class="diff-viewer__bar"><span class="meta">${icon('difference')}${run.files.length} files · synthetic excerpts, not the evidence of record</span><button class="icon-btn" type="button" data-fs="#${esc(id)}" aria-label="Full screen">${icon('fullscreen')}</button></div>
      ${run.files.map((f) => `<details class="diff-file"><summary>${icon('expand_more')}<code>${esc(f.path)}</code><span class="diffstat"><span class="add">+${f.add}</span><span class="del">−${f.del}</span></span></summary><pre class="code diff">${ADE.syntheticDiff(f)}</pre></details>`).join('')}
      ${where === 'review' ? '<p class="meta">Diffs are shown for reading. Acceptance rests on the criteria, checks and evidence below, never on the diff alone.</p>' : ''}
    </div>`;
  };

  /* ------------------------------------------------------------------ StepDetail (hi-fi only) */
  const GATE = { done: 'passed', fail: 'failed', now: 'pending', todo: 'not run' };
  const fetches = (p, run, w, st) => (st.knowledge || []).flatMap((k) => {
    if (k === 'attachments') return run.context.filter((c) => c.src).map((c) => ({ ic: 'description', html: `<button class="link" type="button" data-act="sourceOpen" data-pid="${esc(p.id)}" data-src="${esc(c.src)}">${esc(c.label)}</button>`, via: 'ade-knowledge' }));
    if (k === 'work-item' && w) return [{ ic: 'account_tree', html: `${ADE.a(`${w.id} purpose and scope`, ADE.plink(p.id, `work/${w.id}`))}`, via: 'ade-knowledge' }];
    if (k === 'acceptance-criteria' && w) return [{ ic: 'checklist', html: `${esc(w.id)} acceptance criteria (${w.criteria.length})`, via: 'ade-knowledge' }];
    if (/\.md$/.test(k)) return [{ ic: 'article', html: `<code>${esc(k)}</code> from an earlier step`, via: 'run workspace' }];
    return [{ ic: 'folder_open', html: `${esc(k.replace('-', ' '))} of <code>${esc(run.repo)}</code>`, via: 'ade-knowledge' }];
  });
  const prompt = (p, run, w, st, s) => [
    `# ${st.title} — ${st.skill || st.kind}${st.session ? ` · ${st.session} session` : ''}`,
    w ? `Work item ${w.id}: ${w.title}` : `System task: ${run.system || run.profile}`,
    w && w.purpose ? `Purpose: ${w.purpose}` : null,
    ...(w ? w.criteria.map((c) => `${c.id}: ${c.text}`) : []),
    (st.knowledge || []).length ? `Fetch: ${st.knowledge.join(', ')}` : null,
    st.produces ? `Produce: ${st.produces.join(', ')}` : null,
    run.stop.length ? `Stop if: ${run.stop.join('; ')}` : null,
    s.note ? `Last outcome: ${s.note}` : null,
  ].filter(Boolean).join('\n');
  ADE.stepList = function (p, run) {
    const steps = ADE.runSteps(p, run);
    if (!steps.length) return `<p class="meta">${run.deniedBeforeStart ? 'Denied before the first step.' : 'No workflow steps.'}</p>`;
    const prof = run.profile && ADE.profile(p, run.profile); const w = run.work && ADE.item(p, run.work);
    const badge = (s) => ADE.badge(s.status === 'done' ? 'done' : s.status === 'fail' ? 'failed' : s.status === 'now' ? (run.state === 'awaiting-input' ? 'awaiting-input' : 'running') : 'queued', s.status === 'todo' ? 'Not started' : s.status === 'now' ? 'Now' : s.status === 'fail' ? 'Failed' : 'Done');
    return `<ol class="step-detail">${steps.map((s) => {
      const st = (prof && prof.workflow.steps[s.id]) || { kind: s.kind || 'agent', title: s.title };
      const outcomes = run.wf.trail.filter((t) => t.step === s.id);
      const kv = [
        ['Kind', `${esc(s.kind || st.kind)}${s.addedBy ? ` · added by ${esc(s.addedBy)}` : ''}`],
        st.kind === 'agent' ? ['Model', `${esc(s.model || (prof && prof.model) || run.model)}${st.model ? ' <span class="meta">(step override)</span>' : ''}`] : null,
        st.session ? ['Session', esc(st.session)] : null,
        st.skill ? ['Skill', `<code>${esc(st.skill)}</code> <span class="meta">via ade-skills</span>`] : null,
        st.gate ? ['Gate', `<code>${esc(st.gate)}</code> · ${esc(GATE[s.status])}`] : null,
        st.command ? ['Command', `<code>${esc(st.command)}</code>`] : null,
        st.who ? ['Who', esc({ 'work-owner': 'Work owner' }[st.who] || st.who)] : null,
        st.maxVisits ? ['Visits', `${s.visits} of ${st.maxVisits}; then ${esc(st.onExhausted)}`] : s.visits > 1 ? ['Visits', String(s.visits)] : null,
        outcomes.length ? ['Outcomes', outcomes.map((t) => `${esc(t.outcome)}${t.by ? ` (${esc(ADE.personName(t.by))})` : ''}`).join(' → ')] : null,
      ].filter(Boolean);
      const fx = st.kind === 'agent' ? fetches(p, run, w, st) : [];
      return `<li class="step-detail__item is-${s.status}"><details><summary><span class="step-detail__dot" aria-hidden="true"></span><strong>${esc(s.title)}</strong>${s.max && s.visits > 1 ? `<span class="meta">(${s.visits}/${s.max})</span>` : ''}${badge(s)}${s.note ? `<small>${esc(s.note)}</small>` : ''}</summary>
        <div class="step-detail__body"><dl class="kv kv--tight">${kv.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
        ${fx.length ? `<h5>Knowledge fetched</h5><ul class="ctx">${fx.map((x) => `<li>${icon(x.ic)}<span>${x.html} <span class="meta">· ${esc(x.via)}</span></span></li>`).join('')}</ul>` : ''}
        ${st.kind === 'agent' ? `<h5>Compiled prompt <span class="meta">(synthetic)</span></h5><pre class="code">${esc(prompt(p, run, w, st, s))}</pre>` : ''}</div></details></li>`;
    }).join('')}</ol>`;
  };

  /* ------------------------------------------------------------------ WorkTree: drag handle beside move up/down */
  ADE.treeMove = (p, w, idx, sibs) => `<span class="tree__move"><span class="tree__drag" draggable="true" data-drag="${esc(w.id)}" title="Drag to reorder among siblings (move up/down stays available)" aria-hidden="true">${icon('drag_indicator')}</span>${idx > 0 ? `<button class="icon-btn" type="button" data-act="workMove" data-pid="${esc(p.id)}" data-wid="${esc(w.id)}" data-dir="-1" aria-label="Move ${esc(w.title)} up">${icon('arrow_upward')}</button>` : '<span class="tree__move-gap"></span>'}${idx < sibs.length - 1 ? `<button class="icon-btn" type="button" data-act="workMove" data-pid="${esc(p.id)}" data-wid="${esc(w.id)}" data-dir="1" aria-label="Move ${esc(w.title)} down">${icon('arrow_downward')}</button>` : '<span class="tree__move-gap"></span>'}</span>`;
  // Reorder by drag = the same deterministic workMove action, dispatched once per sibling position.
  ADE.dragMoves = function (p, wid, targetWid) {
    const w = ADE.item(p, wid); const t = ADE.item(p, targetWid);
    if (!w || !t || w === t || (w.parentId || '') !== (t.parentId || '')) return [];
    const sibs = p.work.filter((x) => x.parentId === w.parentId); const d = sibs.indexOf(t) - sibs.indexOf(w);
    return Array.from({ length: Math.abs(d) }, () => ({ pid: p.id, wid, dir: Math.sign(d) }));
  };

  /* ------------------------------------------------------------------ trace: route and popup → journeys and primitives */
  ADE.HIFI_TRACE = {
    routes: [
      { id: 'start', match: /^#\/start/, journeys: ['J3'], state: 'New user with no project', primitives: ['WorkspaceShell', 'PageHeader', 'Card'] },
      { id: 'create', match: /^#\/new/, journeys: ['J3'], state: 'Create: description, questions, sources, risks, first release', primitives: ['Stepper', 'OptionCard', 'RiskCard', 'CostPosture'] },
      { id: 'import', match: /^#\/import/, journeys: ['J2'], state: 'Import: repositories, documents, findings, structure', primitives: ['Stepper', 'OptionCard', 'StatusBadge', 'Callout'] },
      { id: 'access', match: /^#\/access/, journeys: ['J3'], state: 'Entry alternative: join an existing project', primitives: ['PageHeader', 'Table', 'GrantDisabled'] },
      { id: 'dashboard', match: /^#\/p\/[^/?]+(\?|$)/, journeys: ['J1', 'J2', 'J3', 'J5'], state: 'Project home: continue, needs you, risks, agents, cost and time', primitives: ['PageHeader', 'GeneratedMark', 'ContinueCard', 'NeedsYouCard', 'RiskCard', 'AgentRun', 'CostPosture', 'EventRow'] },
      { id: 'releases', match: /^#\/p\/[^/]+\/releases(\?|$)/, journeys: ['J5'], state: 'Releases by plan or cost risk', primitives: ['PageHeader', 'ReleaseSummary', 'CostPosture'] },
      { id: 'release', match: /^#\/p\/[^/]+\/releases\/[^/?]+/, journeys: ['J1', 'J5'], state: 'Release posture after accepted work', primitives: ['ReleaseSummary', 'MembershipTable', 'RiskCard', 'CostPosture'] },
      { id: 'work', match: /^#\/p\/[^/]+\/work(\?|$)/, journeys: ['J4'], state: 'Work tree: filter, mine, reorder (drag or move)', primitives: ['WorkTree', 'DependencyChip', 'StatusBadge'] },
      { id: 'split', match: /^#\/p\/[^/]+\/work\/[^/]+\/split/, journeys: ['J4'], state: 'Split: strategies, generated children, edit, accept', primitives: ['OptionCard', 'Stepper', 'SectionEditButton', 'Callout'] },
      { id: 'workItem', match: /^#\/p\/[^/]+\/work\/[^/?]+(\?|$)/, journeys: ['J1', 'J4', 'J6'], state: 'Live document: sections, readiness, policy, capacity, margin', primitives: ['LiveDocument', 'PageHeader', 'MarginCard', 'ReadinessChecklist', 'DoneWhenList', 'AttachmentList', 'AgentRun', 'CommentThread', 'PolicyOutcome'] },
      { id: 'inbox', match: /^#\/p\/[^/]+\/(inbox|mywork)/, journeys: ['J1', 'J2'], state: 'Inbox: answers, decisions, reviews for the signed-in person', primitives: ['ContributionAssignment', 'NeedsYouCard', 'StatusBadge'] },
      { id: 'knowledge', match: /^#\/p\/[^/]+\/knowledge/, journeys: ['J7'], state: 'Ask, facts (paged), sources (paged)', primitives: ['GroundedQA', 'KnowledgeResultsTable', 'KnowledgeChain', 'Pager'] },
      { id: 'risks', match: /^#\/p\/[^/]+\/risks/, journeys: ['J5'], state: 'Risk register: card grid with sticky matrix, cell filter', primitives: ['RiskLayout', 'RiskCard', 'RiskMatrix', 'DimensionBadge'] },
      { id: 'activity', match: /^#\/p\/[^/]+\/activity/, journeys: ['J6'], state: 'Runs with step detail, events, automations', primitives: ['AgentRun', 'StepLine', 'StepDetail', 'DiffViewer', 'EventRow', 'AutomationCard'] },
      { id: 'config', match: /^#\/p\/[^/]+\/config/, journeys: ['J5', 'J6'], state: 'One JSON contract control for five contracts', primitives: ['ConfigJsonControl', 'PolicySentenceList'] },
      { id: 'fallback', match: /^#\//, journeys: ['any'], state: 'No access or no such page (blocked state of any journey)', primitives: ['Empty'] },
    ],
    popups: {
      basis: [['J1', 'J7'], 'SummaryBasisPopup'], policy: [['J1', 'J4', 'J6'], 'PolicyOutcome'], runPolicy: [['J6'], 'PolicyOutcome'], source: [['J7'], 'SourceViewer'],
      decide: [['J1', 'J5'], 'OptionCard'], start: [['J1', 'J4', 'J6'], 'PolicyOutcome'], stop: [['J6'], 'AgentRun'], review: [['J1'], 'ReviewSections'],
      answer: [['J2'], 'ContributionAssignment'], delegate: [['J2'], 'ContributionAssignment'], contribution: [['J4'], 'ContributionAssignment'], risk: [['J5'], 'RiskCard'],
      profile: [['J1'], 'KeyValueList'], newWork: [['J4'], 'SectionEditPopup'], addToRelease: [['J5'], 'MembershipTable'], releaseAdd: [['J5'], 'MembershipTable'],
      releaseOutcome: [['J5'], 'ReleaseSummary'], newRelease: [['J5'], 'CostPosture'], description: [['J3'], 'SectionEditPopup'], attach: [['J7'], 'RevisionPrompt'],
      detach: [['J7'], 'AttachmentList'], deps: [['J4'], 'DependencyChip'], field: [['J4'], 'ItemListEditor'], done: [['J2', 'J4'], 'SectionEditPopup'],
      addRepo: [['J7'], 'SourceViewer'], raiseRisk: [['J5'], 'RiskCard'], contractJson: [['J5', 'J6'], 'ConfigJsonControl'], contractReadme: [['J5', 'J6'], 'ConfigJsonControl'],
      contractHistory: [['J5', 'J6'], 'ConfigJsonControl'], access: [['J3'], 'SectionEditPopup'], journeys: [['J1', 'J2', 'J3', 'J4', 'J5', 'J6', 'J7'], 'Guide (prototype only)'],
    },
    // Every class the hi-fi renders belongs to a primitive, composition or the foundation layer. check.mjs fails on any other class,
    // so a page cannot grow its own special component unnoticed. Entries ending in '-' match a class prefix.
    classes: {
      Foundation: ['app', 'field-row', 'field-stack', 'icon', 'meta', 'visually-hidden', 'link', 'linkish', 'num', 'code', 'md', 'md-li', 'plain', 'ranked', 'h-small', 'section', 'section__', 'grid', 'grid--', 'cols', 'dash', 'dash__', 'toolbar', 'toolbar__gap', 'row-actions', 'form', 'input', 'radio', 'approve', 'seg', 'seg__btn', 'depth', 'filter', 'tabs', 'tabs-inline', 'tab', 'table', 'fs-target', 'clamp', 'is-', 'chips', 'chip', 'chip--', 'btn', 'btn--', 'icon-btn', 'kv', 'kv--', 'count', 'sentences', 'guide', 'basis__quote', 'diff', 'ln', 'add', 'del', 'c-dim', 'eyebrow', 'crumbs', 'crumbs--small', 'subtitle', 'kind', 'kind--', 'lvl', 'level--', 'c', 'l0', 'l1', 'l2', 'l3', 'now', 'target', 'answer', 'for-you'],
      WorkspaceShell: ['topbar', 'brand', 'brand__mark', 'project-menu', 'menu', 'menu__', 'omni', 'omni__', 'omni-banner', 'profile-btn', 'profile-btn__name', 'body', 'rail', 'rail__link', 'main', 'main--wide'],
      PageHeader: ['page-header', 'facts', 'facts__item', 'page-actions', 'outdated-note'],
      GeneratedMark: ['gen', 'gen--personal', 'gen--stale'], StatusBadge: ['badge', 'badge--'], DimensionBadge: ['dim', 'dim__meter'],
      PolicyOutcome: ['policy-row', 'policy-row__', 'policy-verdict', 'stamp', 'stamp--', 'rule-link'], GrantDisabled: ['granted-off', 'granted-off__why'],
      Card: ['card', 'repo'], Callout: ['callout', 'callout--'], Empty: ['empty'], Stepper: ['stepper'], ContinueCard: ['resume'], NeedsYouCard: ['need', 'need__kind'],
      CostPosture: ['cost', 'cost__head', 'cost--inline', 'cost-row', 'cost-row__head', 'cost-row__time', 'gauge', 'gauge__', 'gauge--'],
      ReleaseSummary: ['release-card', 'release-card__tags'], MembershipTable: [],
      RiskCard: ['risk', 'risk__', 'risk-card', 'risk-card__', 'risk-detail', 'matrix'], RiskMatrix: ['risk-matrix', 'risk-matrix__'], RiskLayout: ['risk-layout', 'risk-layout__', 'risk-grid'],
      WorkTree: ['tree', 'tree--inline', 'tree--reorder', 'tree__', 'person', 'person--', 'avatar', 'avatar--'], LiveDocument: ['doc', 'doc__main', 'doc__margin', 'doc-section', 'doc-section__', 'scope-list', 'criteria', 'section-edit', 'fact-edit', 'child-fields', 'child-table', 'dep-list', 'attach-list', 'anchor'],
      MarginCard: ['margin-card', 'margin-card__', 'margin-card--next'], ReadinessChecklist: ['checks'], DoneWhenList: ['done-when'], ItemListEditor: ['list-editor', 'list-editor__'],
      ContributionAssignment: ['assignment', 'assignment__cat', 'assignment__foot'], CommentThread: ['comments', 'comment', 'comment--agent', 'comment__proposal', 'comment-form'],
      OptionCard: ['options', 'option', 'option__'], GroundedQA: ['qa', 'qa__label', 'qa__row', 'answer-block', 'answer-block__text'], KnowledgeChain: ['chain', 'chain__step'],
      AgentRun: ['run', 'run__', 'minibar', 'console', 'console__bar', 'ctx'], StepLine: ['step-line', 'step-line__step', 'step-line__sep', 'step-line--empty', 'step-status'], StepDetail: ['step-detail', 'step-detail__'],
      DiffViewer: ['diff-viewer', 'diff-viewer__bar', 'diff-file', 'diffstat'], Pager: ['pager', 'pager__'], EventRow: ['event', 'event__'], AutomationCard: ['automation'],
      ConfigJsonControl: ['proposal'], ReviewSections: ['review-section', 'review-section__body'], SummaryBasisPopup: [], Popup: ['popup', 'popup__', 'popup--wide'], StartCard: ['start-card'],
    },
  };
  ADE.traceRoute = (hash) => ADE.HIFI_TRACE.routes.find((r) => r.match.test(hash));
  ADE.primitiveOf = function (cls) {
    for (const [name, list] of Object.entries(ADE.HIFI_TRACE.classes)) if (list.some((x) => (x.endsWith('-') || x.endsWith('__') ? cls.startsWith(x) : cls === x))) return name;
    return null;
  };

  /* ------------------------------------------------------------------ browser-only behaviour */
  if (typeof document === 'undefined') return;
  let dragging = null;
  const sameParent = (li) => li && dragging && li.dataset.parent === dragging.parent && li.dataset.wid !== dragging.wid;
  document.addEventListener('dragstart', (e) => {
    const h = e.target.closest && e.target.closest('[data-drag]'); if (!h) return;
    const li = h.closest('li[data-wid]'); dragging = { wid: li.dataset.wid, parent: li.dataset.parent };
    e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', dragging.wid); li.classList.add('is-dragging');
  });
  document.addEventListener('dragover', (e) => {
    const li = e.target.closest && e.target.closest('li[data-wid]');
    document.querySelectorAll('.is-drop-target').forEach((x) => x !== li && x.classList.remove('is-drop-target'));
    if (!sameParent(li)) return; e.preventDefault(); li.classList.add('is-drop-target');
  });
  document.addEventListener('drop', (e) => {
    const li = e.target.closest && e.target.closest('li[data-wid]'); if (!sameParent(li)) return; e.preventDefault();
    const p = ADE.P(ADE.parse(location.hash).parts[1]); const moves = p ? ADE.dragMoves(p, dragging.wid, li.dataset.wid) : [];
    const wid = dragging.wid; dragging = null; if (!moves.length) return;
    moves.slice(0, -1).forEach((m) => ADE.dispatch('workMove', m));
    ADE.run('workMove', moves[moves.length - 1]);
    const live = document.getElementById('live'); if (live) live.textContent = `${wid} moved ${moves.length} position${moves.length > 1 ? 's' : ''} ${moves[0].dir < 0 ? 'up' : 'down'}.`;
  });
  document.addEventListener('dragend', () => { dragging = null; document.querySelectorAll('.is-dragging, .is-drop-target').forEach((x) => x.classList.remove('is-dragging', 'is-drop-target')); });
  // CostPosture: labels sit on their marks, but a label never leaves its gauge. After each render (and on resize) any tag
  // that would overflow is pinned to the nearer edge; if the spent and budget labels would then collide, the budget label
  // moves to the forecast row's far side instead. Purely presentational: the accessible name already carries every value.
  const fitGauges = (scope = document) => scope.querySelectorAll('.gauge:not(.gauge--unknown)').forEach((g) => {
    const box = g.getBoundingClientRect(); if (!box.width) return;
    g.querySelectorAll('.gauge__tag').forEach((t) => { t.style.left = ''; t.style.right = ''; t.style.transform = ''; t.style.padding = ''; });
    g.querySelectorAll('.gauge__tag').forEach((t) => {
      const r = t.getBoundingClientRect();
      if (r.left < box.left) Object.assign(t.style, { left: '0', right: 'auto', transform: 'none', padding: '0' });
      else if (r.right > box.right) Object.assign(t.style, { left: 'auto', right: '0', transform: 'none', padding: '0' });
    });
    const [f, m] = [...g.querySelectorAll('.gauge__below .gauge__tag')]; if (!f || !m) return;
    const a = f.getBoundingClientRect(); const b = m.getBoundingClientRect();
    if (a.right > b.left && b.right > a.left) Object.assign(m.style, { left: 'auto', right: '0', transform: 'none', padding: '0' });
  });
  ADE.afterRender = (app) => { fitGauges(app); const pop = document.getElementById('popup'); if (pop && pop.open) fitGauges(pop); };
  // Re-fit when any width changes (window resize, scrollbar appearing, late font metrics).
  let fitTimer = null; const refit = () => { clearTimeout(fitTimer); fitTimer = setTimeout(() => fitGauges(), 60); };
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(refit).observe(document.documentElement); else window.addEventListener('resize', refit);
  if (document.fonts) { document.fonts.ready.then(refit); document.fonts.addEventListener('loadingdone', refit); }
  // RiskLayout: hovering or focusing a card highlights its chip in the matrix.
  const hot = (e, on) => { const card = e.target.closest && e.target.closest('.risk[data-risk]'); if (!card) return; document.querySelectorAll(`.risk-matrix__chip[data-risk="${card.dataset.risk}"]`).forEach((c) => c.classList.toggle('is-hot', on)); };
  document.addEventListener('mouseover', (e) => hot(e, true)); document.addEventListener('mouseout', (e) => hot(e, false));
  document.addEventListener('focusin', (e) => hot(e, true)); document.addEventListener('focusout', (e) => hot(e, false));
})(typeof window !== 'undefined' ? window : globalThis);
