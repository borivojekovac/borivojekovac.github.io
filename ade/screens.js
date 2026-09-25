// ADE v3 lo-fi prototype · routes, shell and screens. Every screen is composed from core.js primitives.
// Rendering is pure: it reads state and returns HTML; route effects happen in ADE.visit().
(function (root) {
  const ADE = (root.ADE = root.ADE || {});
  const F = ADE.fixtures;
  const { esc, icon, eur, range } = ADE;
  const S = () => ADE.state;
  const section = (title, body, { id, action = '', sub = '' } = {}) => `<section class="section"${id ? ` id="${id}"` : ''}><div class="section__head"><h2>${esc(title)}</h2>${action}</div>${sub ? `<p class="section__sub">${sub}</p>` : ''}${body}</section>`;
  const tabs = (items, current) => `<nav class="tabs" aria-label="Views">${items.map(([id, text, hash]) => `<a class="tab${id === current ? ' is-active' : ''}" href="${esc(hash)}" ${id === current ? 'aria-current="page"' : ''}>${esc(text)}</a>`).join('')}</nav>`;
  const chipLink = (text, hash, on) => `<a class="chip chip--link${on ? ' is-on' : ''}" href="${esc(hash)}" aria-pressed="${!!on}">${esc(text)}</a>`;
  const para = (text, empty = 'Not written yet.') => (text && text.trim() ? `<p>${esc(text)}</p>` : `<p class="meta">${esc(empty)}</p>`);

  /* ------------------------------------------------------------------ shell */
  const AREAS = [
    ['', 'Home', 'view_quilt'], ['releases', 'Releases', 'flag'], ['work', 'Work', 'account_tree'], ['inbox', 'Inbox', 'inbox'],
    ['knowledge', 'Knowledge', 'menu_book'], ['risks', 'Risks', 'report_problem'], ['activity', 'Activity', 'smart_toy'], ['config', 'Configuration', 'tune'],
  ];
  // Inbox count: the pending requests for the signed-in person (assignments, reviews and decisions). No unread state.
  ADE.inboxCount = (p) => { const me = S().persona; return p.assignments.filter((a) => a.to === me && a.status === 'assigned').length + p.decisions.filter((d) => d.decider === me && d.status === 'open').length; };
  const firstVisit = (p) => ((S().invited[S().persona] || []).includes(p.id));
  ADE.shell = function (pid, area, main) {
    const p = pid && ADE.P(pid); const me = ADE.persona();
    const projects = ADE.myProjects();
    const alts = ADE.ui.omniAlternatives;
    return `<div class="app">
      <header class="topbar">
        <a class="brand" href="#/"><span class="brand__mark">A</span>ADE</a>
        <details class="project-menu">
          <summary>${icon('folder_open')}<span>${p ? esc(p.name) : 'No project'}</span>${icon('expand_more')}</summary>
          <div class="menu" role="menu">
            <p class="menu__label">Your projects</p>
            ${projects.map((x) => `<a role="menuitem" class="menu__item${x.id === pid ? ' is-active' : ''}" href="${esc(ADE.plink(x.id))}">${icon('folder_open')}<span>${esc(x.name)}<small>${esc(x.kind)} · ${firstVisit(x) ? 'first visit' : `last visit ${esc(x.lastSeen)}`}</small></span></a>`).join('') || '<p class="meta menu__none">None yet</p>'}
            <hr><a role="menuitem" class="menu__item" href="#/new">${icon('add')}Create project</a><a role="menuitem" class="menu__item" href="#/import">${icon('source')}Import existing project</a><a role="menuitem" class="menu__item" href="#/access">${icon('person_add')}Request access</a>
          </div>
        </details>
        <form class="omni" data-form data-submit="omni" role="search">
          ${icon('search')}<input name="q" autocomplete="off" value="${esc(ADE.ui.omniQuery)}" placeholder="Where do you want to go? e.g. “risks that affect cost”, “what is the agent doing”" aria-label="Navigate by describing what you want to see (Ctrl+K)">
          <kbd>Ctrl K</kbd>
          ${alts ? `<div class="omni__alts" role="listbox" aria-label="Where I can take you"><p class="meta">I can't open exactly that. Pick one:</p>${alts.map((a) => `<a role="option" class="omni__alt" href="${esc(a.hash)}" data-act="omniPick" data-hash="${esc(a.hash)}">${icon('north_east')}<span>${esc(a.label)}${a.why ? `<small>${esc(a.why)}</small>` : ''}</span></a>`).join('')}<button class="link" type="button" data-act="omniClose">Close</button></div>` : ''}
        </form>
        <button class="profile-btn" type="button" data-act="profileOpen" aria-label="Your profile: ${esc(me.name)}"><span class="avatar">${esc(me.initials)}</span><span class="profile-btn__name">${esc(me.name)}<small>${esc(me.role)}</small></span></button>
      </header>
      <div class="body">
        ${p ? `<nav class="rail" aria-label="Project areas">${AREAS.map(([sub, text, ic]) => `<a class="rail__link${sub === area ? ' is-active' : ''}" href="${esc(ADE.plink(pid, sub))}" ${sub === area ? 'aria-current="page"' : ''}>${icon(ic)}<span>${esc(text)}</span>${sub === 'inbox' && ADE.inboxCount(p) ? `<span class="count" aria-label="${ADE.inboxCount(p)} pending">${ADE.inboxCount(p)}</span>` : ''}</a>`).join('')}</nav>` : ''}
        <main id="main" class="main${p ? '' : ' main--wide'}" tabindex="-1">${ADE.omniBanner()}${main}</main>
      </div>
    </div>`;
  };
  ADE.omniBanner = function () {
    const o = ADE.state.omniApplied;
    if (!o || o.hash !== ADE.currentHash) return '';
    return `<p class="omni-banner">${icon('auto_awesome')}<span>Opened for “${esc(o.query)}”: ${esc(o.label)}.</span><a class="link" href="${esc(ADE.currentHash.split('?')[0])}">Clear view settings</a></p>`;
  };

  /* ------------------------------------------------------------------ router (pure) */
  ADE.render = function (hash = ADE.currentHash) {
    ADE.currentHash = hash;
    const { parts, q } = ADE.parse(hash);
    const st = S(); const mine = ADE.myProjects();
    ADE.useProject(null);
    if (!parts.length) {
      if (!mine.length) return ADE.render('#/start');
      const last = st.lastProject[st.persona];
      const pid = last && mine.some((p) => p.id === last) ? last : mine[0].id;
      return ADE.render(ADE.plink(pid));
    }
    if (parts[0] === 'start') return { hash, html: ADE.shell(null, null, ADE.screens.start()) };
    if (parts[0] === 'new') return { hash, html: ADE.shell(null, null, ADE.screens.create(q)) };
    if (parts[0] === 'import') return { hash, html: ADE.shell(null, null, ADE.screens.import(q)) };
    if (parts[0] === 'access') return { hash, html: ADE.shell(null, null, ADE.screens.access()) };
    if (parts[0] === 'p' && parts[1]) {
      const p = ADE.P(parts[1]);
      if (!p || !p.access.includes(st.persona)) return { hash, html: ADE.shell(null, null, ADE.empty('lock', 'You don\'t have access to this project', `${p ? `${ADE.persona().name} is not a member of ${p.name}.` : 'It may not exist.'} Ask its owner for access.`, ADE.a('Request access', '#/access', 'btn btn--primary'))) };
      ADE.useProject(p);
      const area = parts[2] === 'mywork' ? 'inbox' : parts[2] || '';
      const fn = {
        '': () => ADE.screens.dashboard(p),
        releases: () => (parts[3] ? ADE.screens.release(p, parts[3]) : ADE.screens.releases(p, q)),
        work: () => (parts[3] ? (parts[4] === 'split' ? ADE.screens.split(p, parts[3]) : ADE.screens.workItem(p, parts[3])) : ADE.screens.work(p, q)),
        inbox: () => ADE.screens.inbox(p, q), knowledge: () => ADE.screens.knowledge(p, q), risks: () => ADE.screens.risks(p, q),
        activity: () => ADE.screens.activity(p, q), config: () => ADE.screens.config(p, q),
      }[area];
      if (!fn) return { hash, html: ADE.shell(p.id, '', ADE.empty('help_outline', 'No such page', 'Use the navigation on the left.')) };
      return { hash, html: ADE.shell(p.id, area, fn()), routePopup: q.risk ? { kind: 'risk', args: { pid: p.id, rid: q.risk } } : null };
    }
    return { hash, html: ADE.shell(null, null, ADE.empty('help_outline', 'No such page', 'Go back to your home.', ADE.a('Home', '#/', 'btn btn--primary'))) };
  };

  ADE.screens = {};
  const scr = ADE.screens;

  /* ------------------------------------------------------------------ empty home, access */
  scr.start = function () {
    const pending = S().access;
    return `${ADE.pageHeader({ eyebrow: `Welcome to ADE, ${ADE.persona().name.split(' ')[0]}`, title: 'You don\'t have a project yet', sub: 'ADE works one project at a time. Everything it knows — repositories, documents, decisions — belongs to a project. Start one of three ways.' })}
      <div class="grid grid--3">
        <a class="card start-card" href="#/new">${icon('add')}<h2>Create a project</h2><p>Start from a description. ADE asks the questions that matter and proposes risks and a first release with its work items for you to accept or change.</p><span class="btn btn--primary">Create project</span></a>
        <a class="card start-card" href="#/import">${icon('source')}<h2>Import an existing project</h2><p>Connect the code and documentation repositories, add documents, and see what ADE understood — and what it couldn't.</p><span class="btn btn--outline">Import project</span></a>
        <a class="card start-card" href="#/access">${icon('person_add')}<h2>Join a project</h2><p>Ask the owner of an existing project for access.</p><span class="btn btn--outline">Request access</span></a>
      </div>
      ${pending.length ? section('Access requests', `<table class="table"><thead><tr><th>Project</th><th>Reason</th><th>State</th></tr></thead><tbody>${pending.map((r) => `<tr><td>${esc(r.name)}</td><td>${esc(r.reason)}</td><td>${ADE.tone('Waiting for owner', 'warn', 'hourglass_empty')}</td></tr>`).join('')}</tbody></table>`) : ''}`;
  };
  scr.access = function () {
    const mine = new Set(ADE.myProjects().map((p) => p.id)); const pending = new Set(S().access.map((a) => a.id));
    return `${ADE.pageHeader({ crumbs: [['Home', '#/'], ['Request access']], title: 'Request access to a project', sub: 'Project owners decide who joins. You will see the project in your menu once the owner accepts.' })}
      <table class="table"><thead><tr><th>Project</th><th>Owner</th><th>About</th><th></th></tr></thead><tbody>
      ${F.directory.map((d) => `<tr><td><strong>${esc(d.name)}</strong></td><td>${esc(d.owner)}</td><td>${esc(d.about)}</td><td class="num">${mine.has(d.id) ? ADE.a('Open', ADE.plink(d.id), 'btn btn--quiet') : pending.has(d.id) ? ADE.tone('Requested', 'warn', 'hourglass_empty') : ADE.btn('Request access', 'accessOpen', { id: d.id }, 'outline')}</td></tr>`).join('')}
      </tbody></table>`;
  };

  /* ------------------------------------------------------------------ dashboard */
  scr.dashboard = function (p) {
    const me = S().persona; const t = ADE.projectTotals(p);
    const lastId = ADE.lastWorkFor(p.id); const last = lastId && ADE.item(p, lastId);
    const decisions = p.decisions.filter((d) => d.status === 'open' && d.decider === me);
    const asks = p.assignments.filter((a) => a.status === 'assigned' && a.to === me);
    const others = p.decisions.filter((d) => d.status === 'open' && d.decider !== me);
    const risks = ADE.openRisks(p).filter((r) => r.status !== 'monitoring' && r.status !== 'accepted').sort((a, b) => b.now[0] * b.now[1] - a.now[0] * a.now[1]);
    const runs = p.runs.filter((r) => ADE.ACTIVE.includes(r.state) || (r.attention && !['complete'].includes(r.state)));
    const ready = p.work.filter((w) => ADE.ready(p, w) === 'ready' && !ADE.activeRun(p, w.id));
    const sum = ADE.summary(p, 'project');
    const invited = firstVisit(p);
    const resume = last ? `<article class="card resume">
        <p class="eyebrow">Continue where you left off</p>
        <h2>${ADE.a(last.title, ADE.plink(p.id, `work/${last.id}`))}</h2>
        <p class="crumbs crumbs--small">${ADE.ancestors(p, last.id).map((a) => esc(a.title)).join(' / ') || 'Top level'}</p>
        <p>${esc(ADE.workSummary(p, last).text)}${ADE.gen(`work:${p.id}:${last.id}`)}</p>
        <div class="row-actions">${ADE.a('Open work item', ADE.plink(p.id, `work/${last.id}`), 'btn btn--primary')}${ADE.workState(p, last)}</div>
      </article>` : '';
    const welcome = invited ? `<div class="callout callout--info">${icon('person_add')}<div><strong>${esc(ADE.personName(p.owner))} invited you to ${esc(p.name)}</strong><p>You are the designated person for ${esc(Object.entries(p.contracts.routing.json.categories).filter(([, v]) => v.designated === me).map(([k]) => F.categories[k].label.toLowerCase()).join(' and ') || 'contributions')}. Your Inbox shows what is waiting for you; everything else here is for context.</p></div>${ADE.a('Open Inbox', ADE.plink(p.id, 'inbox'), 'btn btn--primary')}</div>` : '';
    const needs = [...decisions.map((d) => `<article class="card need">
        <p class="need__kind">${icon('gavel')}Decision · ${esc(d.id)}</p><h3>${esc(d.title)}</h3><p>${esc(d.why)}</p>
        <div class="row-actions">${ADE.btn('Decide', 'decideOpen', { pid: p.id, did: d.id }, 'primary', 'gavel')}${d.subject && ADE.item(p, d.subject) ? ADE.a('Open work item', ADE.plink(p.id, `work/${d.subject}`), 'btn btn--quiet') : d.subject ? ADE.a('Open release', ADE.plink(p.id, `releases/${d.subject}`), 'btn btn--quiet') : ''}</div>
      </article>`), ...asks.map((a) => `<article class="card need">
        <p class="need__kind">${icon(F.categories[a.category].icon)}${esc(F.categories[a.category].label)} · ${esc(a.id)}</p><h3>${esc(a.ask)}</h3><p class="meta">Blocks: ${esc(a.blocks)}</p>
        <div class="row-actions">${a.run ? ADE.btn('Review output', 'reviewOpen', { pid: p.id, run: a.run }, 'primary', 'visibility') : ADE.btn('Answer', 'answerOpen', { pid: p.id, aid: a.id }, 'primary', 'send')}${ADE.a('Inbox', ADE.plink(p.id, 'inbox'), 'btn btn--quiet')}</div>
      </article>`), ...ready.slice(0, 2).map((w) => { const e = ADE.evaluate(p, w); return `<article class="card need">
        <p class="need__kind">${icon('play_circle')}Ready for an agent</p><h3>${esc(w.title)}</h3>${ADE.policyRow(p, w)}
        <div class="row-actions">${e.verdict === 'deny' ? `<button class="btn btn--primary" type="button" disabled>${icon('block')}Start agent</button>` : ADE.btn(ADE.startLabel(e), 'startOpen', { pid: p.id, wid: w.id }, 'primary', 'smart_toy')}${ADE.a('Open', ADE.plink(p.id, `work/${w.id}`), 'btn btn--quiet')}</div>
      </article>`; })];
    const spend = ADE.spendOf(p, ADE.roots(p).map((w) => w.id));
    return `${ADE.pageHeader({
      eyebrow: `Project · ${p.kind}`, title: p.name, sub: sum.text, subKey: `project:${p.id}`, outdated: sum.outdated,
      below: `<div class="project-description"><small>Description</small><div class="fact-edit"><p class="clamp">${esc(p.description)}</p>${ADE.editBtn(ADE.can(p, 'description'), 'descriptionOpen', { pid: p.id }, 'project description')}</div></div>`,
      factCards: true,
      facts: [['Budget', `${ADE.costRisk(t, p.budget.amount)}`], ['Time', ADE.timeRisk({ timeRatio: p.budget.timeRatio, planned: p.budget.planned })], ['Policy', `<a class="link" href="${esc(ADE.plink(p.id, 'config', { contract: 'policy' }))}">Revision ${p.contracts.policy.revision}</a>`], ['Agents', `${ADE.capacity(p).used} of ${ADE.capacity(p).slots} slots busy`]],
    })}
    ${welcome}
    <div class="dash">
      <div class="dash__main">
        ${invited ? '' : resume}
        ${section(`Needs you (${needs.length})`, needs.length ? `<div class="grid grid--2">${needs.join('')}</div>` : ADE.empty('task_alt', 'Nothing needs you right now', 'Agents keep working inside policy. You will see decisions here when they need you.'), { sub: others.length ? `Also open, with someone else: ${others.map((d) => `${esc(d.title)} (${esc(ADE.personName(d.decider))})`).join(' · ')}` : '' })}
        ${section('Risks that matter now', `<div class="grid grid--3">${risks.slice(0, 3).map((r) => ADE.riskCard(p, r)).join('')}</div>`, { action: ADE.a(`All risks (${ADE.openRisks(p).length})`, ADE.plink(p.id, 'risks'), 'btn btn--quiet') })}
        ${section('Agents now', runs.length ? runs.map((r) => ADE.runRow(p, r)).join('') : ADE.empty('smart_toy', 'No agent is running', 'Start one from a ready work item.'), { action: ADE.a('All activity', ADE.plink(p.id, 'activity'), 'btn btn--quiet') })}
      </div>
      <aside class="dash__side">
        ${section('Cost and time', `<div class="card cost">
            <div class="cost__head"><h3>Whole project</h3>${ADE.costRisk(t, p.budget.amount)}</div>
            ${ADE.costGauge(t, p.budget.amount)}
            ${ADE.timeGauge({ timeRatio: p.budget.timeRatio, planned: p.budget.planned, forecastFinish: p.budget.forecastFinish })}
            ${ADE.spendKv(spend)}
          </div>
          ${p.releases.map((r) => { const rt = ADE.releaseTotals(p, r); return `<div class="card cost-row"><div class="cost-row__head">${ADE.a(r.name, ADE.plink(p.id, `releases/${r.id}`))}${ADE.costRisk(rt, r.budget)}</div>${ADE.costGauge(rt, r.budget, true, ADE.plink(p.id, `releases/${r.id}`))}<div class="cost-row__time">${ADE.timeRisk(r)}</div></div>`; }).join('')}`)}
        ${section('Since you were here', `<p class="section__sub">${invited ? 'First visit: recent events for context' : `Last visit ${esc(p.lastSeen)}`}</p>${p.events.slice(0, 6).map((e) => ADE.eventRow(p, e)).join('')}`, { action: ADE.a('All events', ADE.plink(p.id, 'activity', { tab: 'events' }), 'btn btn--quiet') })}
      </aside>
    </div>`;
  };

  /* ------------------------------------------------------------------ releases */
  scr.releases = function (p, q) {
    let list = [...p.releases];
    if (q.sort === 'variance') list.sort((a, b) => (ADE.releaseTotals(p, b).hi - b.budget) - (ADE.releaseTotals(p, a).hi - a.budget));
    return `${ADE.pageHeader({ eyebrow: p.name, title: 'Releases', sub: 'Each release is a customer outcome: something nameable and valuable that you can ship. It pulls in selected work and everything beneath it, counted once.', actions: ADE.gbtn(ADE.can(p, 'create-release'), 'New release', 'newReleaseOpen', { pid: p.id }, 'primary', 'add') })}
      <div class="toolbar">${chipLink('Plan order', ADE.plink(p.id, 'releases'), !q.sort)}${chipLink('Most at risk on cost', ADE.plink(p.id, 'releases', { sort: 'variance' }), q.sort === 'variance')}</div>
      <div class="grid grid--3">${list.map((r) => { const t = ADE.releaseTotals(p, r); const s = ADE.summary(p, `release:${r.id}`); return `<article class="card release-card">
        <p class="release-card__tags">${r.outcome ? ADE.outcomeTag() : ADE.tone('Internal grouping', 'neutral', 'layers')}<span class="meta">${esc(r.id)} · planned ${esc(ADE.date(r.planned))}</span></p>
        <h2>${ADE.a(r.name, ADE.plink(p.id, `releases/${r.id}`))}</h2>
        <p class="${s.outdated ? 'is-outdated' : ''}">${esc(s.text)}${ADE.gen(`release:${p.id}:${r.id}`, false, s.outdated)}</p>
        <div class="row-actions">${ADE.costRisk(t, r.budget)}${ADE.timeRisk(r)}</div>
        <p class="meta">${t.done} of ${t.leaves} leaf items done${t.unknown ? ` · ${t.unknown} unestimated` : ''}</p>
        <div class="release-card__foot">${ADE.costGauge(t, r.budget, true, ADE.plink(p.id, `releases/${r.id}`))}</div>
      </article>`; }).join('')}</div>`;
  };
  scr.release = function (p, rid) {
    const r = p.releases.find((x) => x.id === rid);
    if (!r) return ADE.empty('help_outline', 'Release not found', 'It may have been removed.', ADE.a('All releases', ADE.plink(p.id, 'releases'), 'btn btn--outline'));
    const t = ADE.releaseTotals(p, r); const rows = ADE.membership(p, r);
    const sum = ADE.summary(p, `release:${r.id}`);
    const risks = ADE.openRisks(p).filter((x) => x.affects.some((w) => rows.some((m) => m.id === w || ADE.descendants(p, m.id).some((d) => d.id === w))));
    const dec = p.decisions.find((d) => d.subject === r.id && d.status === 'open');
    const gm = ADE.can(p, 'release-membership');
    const spend = ADE.spendOf(p, rows.filter((m) => m.counted).map((m) => m.id));
    return `${ADE.pageHeader({
      crumbs: [[p.name, ADE.plink(p.id)], ['Releases', ADE.plink(p.id, 'releases')], [r.name]], title: r.name, sub: sum.text, subKey: `release:${p.id}:${r.id}`, outdated: sum.outdated,
      factCards: true,
      facts: [['Kind', r.outcome ? ADE.outcomeTag() : ADE.tone('Internal grouping', 'neutral', 'layers')], ['Cost', ADE.costRisk(t, r.budget)], ['Time', ADE.timeRisk(r)], ['Progress', `${t.done} of ${t.leaves} leaf items`]],
      actions: ADE.gbtn(gm, 'Add work', 'releaseAddOpen', { pid: p.id, rid: r.id }, 'primary', 'add') + ADE.gbtn(ADE.can(p, 'customer-outcome'), r.outcome ? 'Unmark customer outcome' : 'Mark as customer outcome', 'releaseOutcomeOpen', { pid: p.id, rid: r.id }, 'quiet', 'flag'),
    })}
      ${dec ? `<div class="callout">${icon('gavel')}<div><strong>${esc(dec.title)}</strong><p>${esc(dec.why)}</p></div>${ADE.btn('Decide', 'decideOpen', { pid: p.id, did: dec.id }, 'primary')}</div>` : ''}
      <div class="dash"><div class="dash__main">
        ${section('What this release pulls in', `<div id="members-${esc(r.id)}" class="fs-target"><div class="section__tools"><button class="icon-btn" type="button" data-fs="#members-${esc(r.id)}" aria-label="Full screen">${icon('fullscreen')}</button></div>
          <table class="table"><thead><tr><th>Work</th><th>State</th><th>Forecast</th><th>Spent</th><th>Counting</th><th></th></tr></thead><tbody>
          ${rows.map((m) => { const w = ADE.item(p, m.id); const ds = ADE.descendants(p, m.id); return `<tr class="${m.counted ? '' : 'is-inside'}"><td>${ADE.a(w.title, ADE.plink(p.id, `work/${w.id}`))}<small class="meta"> ${esc(w.id)}${ds.length ? ` · with ${ds.length} descendants` : ''}</small></td><td>${ADE.workState(p, w)}</td><td class="num">${m.r.lo || m.r.hi ? range([m.r.lo, m.r.hi]) : '—'}${m.r.unknown ? ` +${m.r.unknown}?` : ''}</td><td class="num">${eur(m.r.actual)}</td><td>${m.counted ? ADE.tone('Counted', 'ok', 'check') : ADE.tone(`Inside ${m.insideOf}`, 'neutral', 'subdirectory_arrow_right')}</td><td class="num">${gm.ok ? ADE.btn('Remove', 'releaseRemove', { pid: p.id, rid: r.id, wid: m.id }, 'quiet') : ''}</td></tr>`; }).join('')}
          </tbody><tfoot><tr><th>Total (counted rows only)</th><th></th><th class="num">${range([t.lo, t.hi])}${t.unknown ? ` +${t.unknown}?` : ''}</th><th class="num">${eur(t.actual)}</th><th colspan="2"></th></tr></tfoot></table>
          <p class="meta">Rows marked “Inside …” are listed for context; their cost is already in their parent and is never added twice.${gm.ok ? '' : ` ${esc(gm.why)}`}</p></div>`)}
        ${section('Risks to this outcome', risks.length ? `<div class="grid grid--2">${risks.map((x) => ADE.riskCard(p, x)).join('')}</div>` : ADE.empty('task_alt', 'No open risks', 'Nothing in the register affects this release.'))}
      </div><aside class="dash__side">
        ${section('Cost and time', `<div class="card cost"><div class="cost__head"><h3>${esc(r.name)}</h3></div>${ADE.costGauge(t, r.budget)}${ADE.timeGauge(r)}${ADE.spendKv(spend)}<p class="meta">Unestimated: ${t.unknown || 'none'}</p></div>`)}
      </aside></div>`;
  };

  /* ------------------------------------------------------------------ work tree */
  scr.work = function (p, q) {
    const rf = q.readiness || '';
    const f = (v) => ADE.plink(p.id, 'work', { ...q, readiness: v || undefined });
    return `${ADE.pageHeader({ eyebrow: p.name, title: 'Work', sub: 'One recursive structure. Items can be as deep as the work needs; nothing forces epics, stories or tasks. Sibling order is priority; dependencies are separate.', actions: ADE.gbtn(ADE.can(p, 'create-work'), 'New work item', 'newWorkOpen', { pid: p.id }, 'primary', 'add') })}
      <div class="toolbar">
        <form class="filter" data-form data-submit="workFilter" data-pid="${esc(p.id)}">${icon('filter_list')}<input name="filter" value="${esc(q.filter || '')}" placeholder="Filter by title or ID" aria-label="Filter work"></form>
        ${chipLink('All', f(''), !rf)}${chipLink('Ready', f('ready'), rf === 'ready')}${chipLink('Needs decision', f('needs-decision'), rf === 'needs-decision')}${chipLink('Blocked or waiting', f('blocked,needs-decision'), rf === 'blocked,needs-decision')}${chipLink('Not ready', f('not-ready'), rf === 'not-ready')}
        ${chipLink('Mine', ADE.plink(p.id, 'work', { ...q, mine: q.mine ? undefined : '1' }), !!q.mine)}
        <span class="toolbar__gap"></span>
        ${chipLink(q.reorder ? 'Done reordering' : 'Reorder', ADE.plink(p.id, 'work', { ...q, reorder: q.reorder ? undefined : '1' }), !!q.reorder)}
        ${ADE.btn('Expand all', 'treeAll', { pid: p.id, open: '1' }, 'quiet', 'unfold_more')}${ADE.btn('Collapse all', 'treeAll', { pid: p.id, open: '0' }, 'quiet', 'unfold_less')}
        <label class="depth">Depth <select data-input="treeDepth" data-pid="${esc(p.id)}">${['', '1', '2', '3', '9'].map((d) => `<option value="${d}" ${String(q.depth || '') === d ? 'selected' : ''}>${d === '' ? 'Default' : d === '9' ? 'All' : d}</option>`).join('')}</select></label>
      </div>
      ${q.reorder ? `<p class="meta">${icon('info')}Move items up or down among their siblings to set priority. You can move items you own${S().persona === p.owner ? ' (as accountable owner: any item)' : ''}. A warning appears when an item is ordered before an unfinished dependency.</p>` : ''}
      ${ADE.tree(p, { filter: q.filter || '', readiness: rf, expand: q.expand, depth: q.depth, mine: q.mine, reorder: q.reorder })}`;
  };

  /* ------------------------------------------------------------------ work item */
  // "Done when" is computed: acceptance criteria, the checks and gates of the default profile's workflow,
  // the human steps policy requires, and anything added by hand.
  ADE.doneWhen = function (p, w) {
    const out = w.criteria.map((c) => ({ text: `${c.id} is satisfied: ${c.text}`, from: 'Acceptance criteria' }));
    const profId = ADE.defaultProfile(p, w); const prof = ADE.profile(p, profId);
    if (prof) ADE.effectiveSteps(p, profId, w).forEach((st) => {
      if (st.kind === 'check') out.push({ text: `${st.command} passes`, from: `${prof.title} · ${st.title} step` });
      if (st.gate) out.push({ text: `Gate “${st.gate}” passes`, from: `${prof.title} · ${st.title} step` });
      if (st.addedBy) out.push({ text: 'A person reviews and accepts the output', from: st.addedBy });
    });
    w.doneExtra.forEach((t, i) => out.push({ text: t, from: 'Added by hand', idx: i }));
    return out;
  };
  // Owner review (Phase 6, round 2): collapsed, a section shows its heading and a short count ("3 items"); its edit
  // button is a regular button at the bottom of the expanded section, so a collapsed section cannot be edited.
  const docSection = (title, body, open = true, preview = '', edit = '') => `<details class="doc-section" ${open ? 'open' : ''}><summary>${icon('expand_more')}<span class="doc-section__title">${esc(title)}</span>${preview ? `<span class="doc-section__preview">${esc(preview)}</span>` : ''}</summary><div class="doc-section__body">${body}${edit ? `<div class="doc-section__actions">${edit}</div>` : ''}</div></details>`;
  const count = (n, one, many = `${one}s`, none = `No ${many}`) => (n ? `${n} ${n === 1 ? one : many}` : none);
  // Section edit button: opens the section's edit popup. Visible but disabled, with the reason, for people without the grant.
  ADE.editBtn = (grant, act, data, label) => (grant.ok ? `<button class="icon-btn section-edit" type="button" data-act="${act}" ${Object.entries(data).map(([k, v]) => `data-${k}="${esc(v)}"`).join(' ')} aria-label="Edit ${esc(label)}" title="Edit ${esc(label)}">${icon('edit_note')}</button>` : `<button class="icon-btn section-edit" type="button" disabled aria-label="Edit ${esc(label)}: ${esc(grant.why)}" title="${esc(grant.why)}">${icon('edit_note')}</button>`);
  const bullets = (items, empty, fmt = (t) => esc(t)) => (items.length ? `<ul class="scope-list">${items.map((t) => `<li>${fmt(t)}</li>`).join('')}</ul>` : `<p class="meta">${esc(empty)}</p>`);
  scr.workItem = function (p, wid) {
    const it = ADE.item(p, wid);
    if (!it) return ADE.empty('help_outline', 'Work item not found', 'It may have been removed or never existed.', ADE.a('Work tree', ADE.plink(p.id, 'work'), 'btn btn--outline'));
    const me = S().persona; const ch = ADE.kids(p, it.id); const sm = ADE.workSummary(p, it); const r = ADE.roll(p, it.id);
    const run = ADE.activeRun(p, it.id); const ev = ADE.evaluate(p, it, me); const cap = ADE.capacity(p);
    const rels = ADE.releasesOf(p, it.id); const rd = ADE.readiness(p, it); const failing = rd.failing || [];
    const G = (a) => ADE.can(p, a, { work: it });
    const leaf = !ch.length; const open = it.status === 'open';
    const onlyConfirm = failing.length === 1 && failing[0].id === 'confirm';
    let primary = '';
    if (open && leaf && !it.decisionItem) {
      if (run) primary = ADE.a('See the run', ADE.plink(p.id, 'activity', { run: run.id }), 'btn btn--primary');
      else if (rd.state === 'ready') primary = ev.verdict === 'deny' ? ADE.gbtn({ ok: false, why: ev.reason }, 'Start agent', 'startOpen', { wid: it.id }, 'primary', 'block') : ADE.btn(ADE.startLabel(ev), 'startOpen', { pid: p.id, wid: it.id }, 'primary', 'smart_toy');
      else if (onlyConfirm) primary = ADE.gbtn(G('mark-ready'), 'Mark ready', 'markReady', { pid: p.id, wid: it.id }, 'primary', 'check_circle');
      else primary = ADE.gbtn({ ok: false, why: failing[0] ? failing[0].fix : ADE.label(rd.state) }, 'Start agent', 'startOpen', { wid: it.id }, 'primary', 'smart_toy');
    }
    const doneGrant = G('mark-done'); const cc = ADE.canComplete(p, it);
    const markDone = open && !run ? ADE.gbtn(cc.ok ? doneGrant : { ok: false, why: cc.why }, leaf && cc.ok ? 'Record human contribution' : 'Mark done', 'doneOpen', { pid: p.id, wid: it.id }, 'quiet', 'task_alt') : '';
    const sibs = it.parentId ? ADE.kids(p, it.parentId) : ADE.roots(p); const si = sibs.indexOf(it);
    // Split and Add child act on the item's children, so they live in the Children section (owner review round 9).
    const childActions = `${it.status !== 'done' ? (G('split').ok ? ADE.a('Split…', ADE.plink(p.id, `work/${it.id}/split`), 'btn btn--outline') : ADE.gbtn(G('split'), 'Split…', 'noop', { wid: it.id }, 'outline')) : ''}${ADE.gbtn(G('add-child'), 'Add child', 'newWorkOpen', { pid: p.id, parent: it.id }, 'quiet', 'add')}`;
    const actions = `${primary}${ADE.gbtn(ADE.can(p, 'request-contribution'), 'Request contribution', 'contributionOpen', { pid: p.id, wid: it.id }, 'quiet', 'forward_to_inbox')}${markDone}${ADE.gbtn(ADE.can(p, 'release-membership'), 'Add to release', 'addToReleaseOpen', { pid: p.id, wid: it.id }, 'quiet', 'flag')}${G('order').ok && sibs.length > 1 ? `${si > 0 ? ADE.btn('Move up', 'workMove', { pid: p.id, wid: it.id, dir: -1 }, 'quiet', 'arrow_upward') : ''}${si < sibs.length - 1 ? ADE.btn('Move down', 'workMove', { pid: p.id, wid: it.id, dir: 1 }, 'quiet', 'arrow_downward') : ''}` : ''}`;
    const margin = [
      ...(it.questions || []).map((qq) => {
        const a = p.assignments.find((x) => x.id === qq.assignment); const d = qq.decision && p.decisions.find((x) => x.id === qq.decision);
        const resolved = (d && d.status === 'decided') || qq.resolved;
        return `<div class="card margin-card${resolved ? ' is-resolved' : ''}"><p class="margin-card__kind">${icon(resolved ? 'task_alt' : 'help_outline')}${resolved ? 'Resolved' : 'Open question'} · ${esc(F.categories[qq.category].label)}</p><p>${esc(qq.text)}</p>
          ${a ? `<p class="meta">${a.status === 'answered' ? `${esc(ADE.personName(a.answeredBy || a.to))} answered: “${esc(a.answer)}”` : `Assigned to ${esc(ADE.personName(a.to))}${a.delegatedFrom ? ` (delegated by ${esc(ADE.personName(a.delegatedFrom))})` : ''}`}</p>` : ''}
          ${d && d.status === 'decided' ? `<p class="meta">Decided by ${esc(ADE.personName(d.decider))}: ${esc(d.options.find((o) => o.id === d.chosen)?.title || 'own option')}</p>` : d && d.decider === me ? ADE.btn('Decide', 'decideOpen', { pid: p.id, did: d.id }, 'primary') : a && a.to === me && a.status === 'assigned' ? ADE.btn('Answer', 'answerOpen', { pid: p.id, aid: a.id }, 'primary') : d ? `<p class="meta">Waiting for ${esc(ADE.personName(d.decider))}</p>` : ''}</div>`;
      }),
      open && leaf ? `<div class="card margin-card margin-card--next"><p class="margin-card__kind">${icon('play_circle')}Next step</p><p>${esc(run ? `Run ${run.id.replace('RUN-', '')} is ${ADE.label(run.state).toLowerCase()}.` : it.decisionItem ? 'This item finishes when its answer is adopted as a decision.' : rd.state === 'ready' ? (ev.verdict === 'allow' ? 'Policy allows an agent to start now.' : ev.youDecide ? 'Policy needs your decision to start; you can approve it in the start dialog.' : ev.verdict === 'deny' ? 'Policy denies an agent run.' : `Policy needs ${ADE.personName(ev.decider)} to decide.`) : failing[0] ? failing[0].fix : 'Complete the item.')}</p>${it.decisionItem ? '' : ADE.btn('Why?', 'policyEval', { pid: p.id, wid: it.id }, 'quiet')}</div>` : '',
    ].join('');
    const anchor = (text) => { const qq = (it.questions || []).find((x) => x.anchor && text.includes(x.anchor)); return qq ? esc(text).replace(esc(qq.anchor), `<mark class="anchor">${esc(qq.anchor)}</mark>`) : esc(text); };
    const E = (field, label) => (it.status === 'done' ? '' : ADE.editBtn(G('edit'), 'fieldOpen', { pid: p.id, wid: it.id, field }, label));
    // Section edit: a regular button at the bottom of the expanded section (never on a done item).
    const Es = (field, label) => (it.status === 'done' ? '' : ADE.gbtn(G('edit'), `Edit ${label}`, 'fieldOpen', { pid: p.id, wid: it.id, field }, 'outline', 'edit_note'));
    const doneList = ADE.doneWhen(p, it);
    const gAttach = G('attach'); const gDeps = G('deps');
    return `<article class="doc">
      <div class="doc__main">
        ${ADE.pageHeader({
          // Breadcrumb lists the project and the ancestors by title; the item's own id sits in the eyebrow above its title.
          crumbs: [[p.name, ADE.plink(p.id)], ...ADE.ancestors(p, it.id).map((a) => [a.title, ADE.plink(p.id, `work/${a.id}`)])], eyebrow: `Work item · ${it.id}`,
          title: it.title, titleEdit: E('details', 'title, owner and customer-visible flag'), sub: sm.text, subKey: `work:${p.id}:${it.id}`,
          facts: [
            ['Readiness', open && leaf ? ADE.badge(rd.state) : ADE.workState(p, it)],
            ['Policy', open && leaf && !it.decisionItem ? `<button class="linkish" type="button" data-act="policyEval" data-pid="${esc(p.id)}" data-wid="${esc(it.id)}">${ADE.badge(ev.verdict === 'allow' ? 'allow' : ev.verdict, ev.verdict === 'allow' ? (ev.requires.length ? 'Allowed with review' : 'Allowed') : ev.verdict === 'deny' ? 'Denied' : ev.youDecide ? 'Needs your decision' : 'Needs decision')}</button>` : '<span class="meta">—</span>'],
            ['Capacity', cap.free ? ADE.tone(`Agent slot free (${cap.used}/${cap.slots})`, 'ok', 'memory') : ADE.tone(`All ${cap.slots} slots busy`, 'warn', 'memory')],
            ['Owner', ADE.person(it.owner)],
            ['Releases', rels.length ? rels.map((x) => ADE.a(x.name, ADE.plink(p.id, `releases/${x.id}`))).join(', ') : '<span class="meta">None</span>'],
          ],
          factCards: true,
          actions,
        })}
        ${docSection('Purpose', para(it.purpose, 'Not written yet.'), true, it.purpose ? '' : 'Not written yet', Es('purpose', 'purpose'))}
        ${docSection('In scope', bullets(it.inScope, 'Nothing listed yet.', anchor), true, count(it.inScope.length, 'item'), Es('inScope', 'in scope'))}
        ${docSection('Out of scope', bullets(it.outScope, 'Nothing excluded yet.'), !!it.outScope.length, count(it.outScope.length, 'item'), Es('outScope', 'out of scope'))}
        ${docSection('Acceptance criteria', it.criteria.length ? `<ol class="criteria">${it.criteria.map((c) => `<li><span class="meta">${esc(c.id)}</span> ${esc(c.text)}</li>`).join('')}</ol>` : para('', 'No acceptance criteria yet. Readiness needs at least one.'), true, count(it.criteria.length, 'criterion', 'criteria'), Es('criteria', 'acceptance criteria'))}
        ${docSection('Done when', `<ul class="checks done-when">${doneList.map((d) => `<li class="${it.status === 'done' ? 'is-ok' : ''}">${icon(it.status === 'done' ? 'check_circle' : 'radio_button_unchecked')}<span>${esc(d.text)}<small>${esc(d.from)}</small></span></li>`).join('')}</ul><p class="meta">Computed from the acceptance criteria, the ${esc((ADE.profile(p, ADE.defaultProfile(p, it)) || {}).title || '')} profile's workflow and the human steps policy requires. You can add conditions by hand.</p>`, false, count(doneList.length, 'condition'), Es('doneExtra', 'extra conditions'))}
        ${docSection('Children', ch.length ? `<ul class="tree tree--inline" role="tree" aria-label="Children">${ch.map((c) => `<li class="tree__item" role="treeitem" aria-level="1"><div class="tree__row"><span class="tree__leaf"></span><span class="tree__main">${ADE.a(c.title, ADE.plink(p.id, `work/${c.id}`), 'tree__title')}</span><span class="meta tree__id">${esc(c.id)}</span>${ADE.person(c.owner, true)}${ADE.workState(p, c)}<span class="tree__cost meta">${(() => { const cr = ADE.roll(p, c.id); return cr.lo || cr.hi ? range([cr.lo, cr.hi]) : 'No estimate'; })()}</span></div></li>`).join('')}</ul>${it.status === 'done' && !cc.ok ? '' : ''}<p class="meta">A parent can be marked done only when every child is done or deferred. Adding a child to a done item reopens it.</p>` : `<p class="meta">No child items. Split this item into children, or add one.</p>`, !!ch.length, ch.length ? `${count(ch.length, 'item')} · ${r.done} of ${r.leaves} leaf items done` : 'None yet · split or add a child', childActions)}
        ${leaf ? docSection('Readiness checks', `<ul class="checks">${rd.checks.map((c) => `<li class="${c.ok ? 'is-ok' : 'is-missing'}" data-check="${esc(c.id)}">${icon(c.ok ? 'check_circle' : 'radio_button_unchecked')}<span>${esc(c.text)}${!c.ok && c.fix ? `<small>${esc(c.fix)}</small>` : ''}</span></li>`).join('')}</ul><p class="meta">Readiness, policy and capacity are separate: an item can be ready while policy still needs a decision, or while every agent slot is busy. Every dependency must be done before an item is ready.</p>`, open, `${rd.checks.filter((c) => c.ok).length} of ${rd.checks.length} met`) : ''}
        ${docSection('Dependencies', `<ul class="plain dep-list">${it.deps.map((d) => ADE.item(p, d)).filter(Boolean).map((d) => `<li>${d.status === 'done' ? ADE.badge('done') : ADE.tone(`Waiting · ${ADE.label(d.status)}`, 'warn', 'hourglass_empty')} ${ADE.a(`${d.id} ${d.title}`, ADE.plink(p.id, `work/${d.id}`))} ${gDeps.ok ? ADE.btn('Remove', 'depRemove', { pid: p.id, wid: it.id, dep: d.id }, 'quiet', 'remove') : ''}</li>`).join('') || '<li class="meta">Depends on nothing.</li>'}</ul>
          ${ADE.orderWarnings(p, it).length ? `<p class="meta">${icon('warning_amber')}This item is ordered before ${esc(ADE.orderWarnings(p, it).join(', '))}, which it depends on.</p>` : ''}
          <p class="meta">Depending on an item means waiting until that item is done. A parent is done only when all its children are done or deferred.</p>
          <div class="row-actions">${ADE.gbtn(gDeps, 'Add dependency', 'depOpen', { pid: p.id, wid: it.id }, 'outline', 'add')}</div>`, !!it.deps.length, it.deps.length ? `${count(it.deps.length, 'item')}${ADE.openDeps(p, it).length ? ` · waiting for ${ADE.openDeps(p, it).map((d) => d.id).join(', ')}` : ' · all done'}` : 'None')}
        ${docSection('Attachments', `<ul class="plain attach-list">${it.attachments.map((a) => { const s = ADE.source(p, a.src); if (!s) return ''; const newer = ADE.newerRevision(p, a); return `<li><button class="link" type="button" data-act="sourceOpen" data-pid="${esc(p.id)}" data-src="${esc(s.id)}">${esc(s.title)}</button> <span class="meta">pinned @ ${esc(a.rev)}</span> ${ADE.badge(s.status)}${newer ? ` ${ADE.tone(`Newer revision ${newer} available`, 'info', 'history')} ${gAttach.ok ? ADE.btn(`Use ${newer}`, 'attachRefresh', { pid: p.id, wid: it.id, src: s.id }, 'quiet', 'sync') : ''}` : ''} ${gAttach.ok ? ADE.btn('Remove', 'detachOpen', { pid: p.id, wid: it.id, src: s.id }, 'quiet', 'remove') : ''}</li>`; }).join('') || '<li class="meta">Nothing attached. Attach a PRD, designs, architecture notes or requirements; they become project sources.</li>'}</ul>
          <p class="meta">Attachments are project sources: the same file attached twice is one source, and a new version becomes a new revision. Items stay pinned to the revision they used until you choose the newer one.</p>
          <div class="row-actions">${ADE.gbtn(gAttach, 'Attach', 'attachOpen', { pid: p.id, wid: it.id }, 'outline', 'add')}</div>`, false, count(it.attachments.length, 'document', 'documents', 'None'))}
        ${docSection('Forecast and actuals', `<div class="card cost cost--inline">${ADE.costGauge(r, Math.max(r.hi, 1) * 1.1)}<p class="meta">${ch.length ? 'Rolled up from children; each child counted once.' : it.forecast ? `Forecast ${range(it.forecast)} · spent ${eur(r.actual)}` : 'No estimate yet — shown as unknown, not zero.'}</p>${ADE.spendKv(ADE.spend(p, it.id))}${it.evidence ? `<p><strong>Evidence recorded:</strong> ${esc(it.evidence)}</p>` : ''}</div>`, false, ch.length ? `${range([r.lo, r.hi])}${r.unknown ? ` + ${r.unknown} unestimated` : ''}` : it.forecast ? `${range(it.forecast)} · spent ${eur(it.actual)}` : 'No estimate', ch.length ? '' : Es('forecast', 'forecast'))}
        ${(it.risks || []).length ? docSection('Risks', `<div class="grid grid--2">${it.risks.map((id) => ADE.riskById(p, id)).filter(Boolean).map((x) => ADE.riskCard(p, x)).join('')}</div>`, false, count(it.risks.length, 'risk')) : ''}
        ${ADE.runsOf(p, it.id).length ? docSection('Agent runs', ADE.runsOf(p, it.id).map((x) => ADE.runRow(p, x)).join(''), !!run, count(ADE.runsOf(p, it.id).length, 'run')) : ''}
        ${docSection('Comments', ADE.comments(p, 'work', it.id, it.comments || []), false, count((it.comments || []).length, 'comment'))}
      </div>
      <aside class="doc__margin" aria-label="Questions and next step">${margin}</aside>
    </article>`;
  };

  /* ------------------------------------------------------------------ split */
  scr.split = function (p, wid) {
    const it = ADE.item(p, wid);
    if (!it) return ADE.empty('help_outline', 'Work item not found', '', '');
    const g = ADE.can(p, 'split', { work: it });
    if (!g.ok) return ADE.empty('lock', 'You can\'t split this item', g.why, ADE.a('Back to the item', ADE.plink(p.id, `work/${wid}`), 'btn btn--outline'));
    const d = S().drafts.split[`${p.id}:${wid}`] || {};
    const fixture = p.split[wid];
    const strategies = fixture ? fixture.strategies : [
      { id: 'outcome', title: 'By visible outcome', desc: 'One child per behaviour a user can see.', pros: 'Each child is demonstrable.', cons: 'Shared plumbing repeats.', chips: ['Estimated after generation'] },
      { id: 'layer', title: 'Risk first', desc: 'Start with the most uncertain part as a small spike.', pros: 'Unknowns resolved early.', cons: 'Visible progress later.', chips: ['Estimated after generation'] },
    ];
    const head = ADE.pageHeader({ crumbs: [[p.name, ADE.plink(p.id)], [it.title, ADE.plink(p.id, `work/${it.id}`)], ['Split']], title: `Split “${it.title}”`, sub: `The agent studied this item, its ${it.attachments.length} attachments, its parents and project knowledge, and proposes these strategies. Pick one, add notes on any of them, or describe your own. Nothing is created until you accept the proposed children.`, subKey: `work:${p.id}:${it.id}` });
    if (d.stage === 'review') {
      const total = d.children.reduce((a, c) => (c.forecast ? [a[0] + c.forecast[0], a[1] + c.forecast[1]] : a), [0, 0]);
      const unknown = d.children.filter((c) => !c.forecast).length;
      const field = (i, k, lbl) => { const v = d.children[i][k]; const n = Array.isArray(v) ? ` (${v.length})` : ''; return `<button class="chip chip--link" type="button" data-act="fieldOpen" data-pid="${esc(p.id)}" data-wid="${esc(wid)}" data-child="${i}" data-field="${k}">${icon('edit_note')}${esc(lbl)}${n}</button>`; };
      return `${head}
        <ol class="stepper"><li class="is-done">Choose a strategy</li><li class="is-now">Review proposed children</li><li>Accept</li></ol>
        <div class="callout callout--gen">${icon('auto_awesome')}<div><strong>Proposed by the planning agent from “${esc(d.strategyTitle)}”</strong><p>${d.notesSummary ? `Your notes were applied: ${esc(d.notesSummary)}` : 'No notes given.'} Each child has a generated purpose, scope and acceptance criteria from the parent, its ancestors and project knowledge. Edit, reorder, remove or add children, then accept. The parent stays open until its children are done.</p></div></div>
        <table class="table child-table"><thead><tr><th>#</th><th>Proposed child</th><th>Forecast</th><th></th></tr></thead><tbody>
        ${d.children.map((c, i) => `<tr><td>${i + 1}</td><td><input class="input" value="${esc(c.title)}" data-input="splitChildTitle" data-pid="${esc(p.id)}" data-wid="${esc(wid)}" data-idx="${i}" aria-label="Child ${i + 1} title">${c.note ? `<small class="meta">${esc(c.note)}</small>` : ''}
          <div class="child-fields"><small class="meta">${esc(c.purpose || 'No purpose yet')}</small><span class="chips">${field(i, 'purpose', 'Purpose')}${field(i, 'inScope', 'In scope')}${field(i, 'outScope', 'Out of scope')}${field(i, 'criteria', 'Acceptance criteria')}</span></div></td>
          <td class="num">${c.forecast ? range(c.forecast) : ADE.tone('Unestimated', 'unknown', 'help_outline')}</td><td class="num">${i > 0 ? ADE.btn('Up', 'splitMove', { pid: p.id, wid, idx: i, dir: -1 }, 'quiet', 'arrow_upward') : ''}${i < d.children.length - 1 ? ADE.btn('Down', 'splitMove', { pid: p.id, wid, idx: i, dir: 1 }, 'quiet', 'arrow_downward') : ''}${ADE.btn('Remove', 'splitRemove', { pid: p.id, wid, idx: i }, 'quiet', 'remove')}</td></tr>`).join('')}
        </tbody><tfoot><tr><th></th><th>${ADE.btn('Add a child', 'splitAdd', { pid: p.id, wid }, 'quiet', 'add')}</th><th class="num">${range(total)}${unknown ? ` + ${unknown} unestimated` : ''}</th><th></th></tr></tfoot></table>
        <p class="meta">Current parent forecast was ${range(it.forecast)}. Policy run limit is ${eur(p.contracts.policy.json.limits.agentRunMax)}: children above it will need a decision to start.</p>
        <div class="page-actions">${ADE.btn('Accept and create children', 'splitAccept', { pid: p.id, wid }, 'primary', 'done_all')}${ADE.btn('Back to strategies', 'splitBack', { pid: p.id, wid }, 'quiet')}${ADE.a('Cancel', ADE.plink(p.id, `work/${wid}`), 'btn btn--quiet')}</div>`;
    }
    return `${head}
      <ol class="stepper"><li class="is-now">Choose a strategy</li><li>Review proposed children</li><li>Accept</li></ol>
      ${ADE.optionCards(`split:${p.id}:${wid}`, strategies, d)}
      <div class="page-actions">${ADE.btn('Generate proposed children', 'splitGenerate', { pid: p.id, wid }, 'primary', 'call_split')}<span class="meta">${ADE.optionReady(d) ? 'Notes on every option go to the agent, including the ones you did not pick.' : d.choice === 'own' ? 'Describe your own strategy to continue.' : 'Choose a strategy to continue.'}</span></div>`;
  };

  /* ------------------------------------------------------------------ inbox */
  scr.inbox = function (p, q) {
    const me = S().persona; const tab = q.tab || 'assigned';
    const assigned = p.assignments.filter((a) => a.to === me && a.status === 'assigned');
    const decisions = p.decisions.filter((d) => d.decider === me && d.status === 'open');
    const delegated = p.assignments.filter((a) => a.delegatedFrom === me);
    const done = p.assignments.filter((a) => (a.answeredBy || a.to) === me && a.status !== 'assigned').concat(p.decisions.filter((d) => d.decider === me && d.status === 'decided'));
    const all = p.assignments.filter((a) => a.status === 'assigned');
    const body = tab === 'decisions' ? (decisions.length ? `<div class="grid grid--2">${decisions.map((d) => `<article class="card need"><p class="need__kind">${icon('gavel')}Decision · ${esc(d.id)}</p><h3>${esc(d.title)}</h3><p>${esc(d.why)}</p><div class="row-actions">${ADE.btn('Decide', 'decideOpen', { pid: p.id, did: d.id }, 'primary', 'gavel')}</div></article>`).join('')}</div>` : ADE.empty('task_alt', 'No decisions waiting for you', 'Decisions appear here when policy names you as the decider.'))
      : tab === 'delegated' ? (delegated.length ? `<div class="grid grid--2">${delegated.map((a) => ADE.assignmentCard(p, a, me)).join('')}</div>` : ADE.empty('forward_to_inbox', 'Nothing delegated', 'When you delegate a request it stays visible here.'))
      : tab === 'done' ? (done.length ? `<table class="table"><tbody>${done.map((x) => `<tr><td>${esc(x.ask || x.title)}</td><td>${ADE.badge(x.status)}</td></tr>`).join('')}</tbody></table>` : ADE.empty('history', 'Nothing completed yet', ''))
      : tab === 'all' ? (all.length ? `<div class="grid grid--2">${all.map((a) => ADE.assignmentCard(p, a, me)).join('')}</div>` : ADE.empty('task_alt', 'No open requests', ''))
      : (assigned.length ? `<div class="grid grid--2">${assigned.map((a) => ADE.assignmentCard(p, a, me)).join('')}</div>` : ADE.empty('task_alt', 'Nothing assigned to you', 'Requests for your expertise appear here, with what they block and what waiting costs.'));
    const cats = Object.entries(p.contracts.routing.json.categories).filter(([, v]) => v.designated === me).map(([k]) => F.categories[k].label);
    return `${ADE.pageHeader({ eyebrow: p.name, title: 'Inbox', sub: `Requests routed to ${ADE.persona().name}${cats.length ? ` as the designated person for ${cats.join(', ')}` : ''}: answers, decisions, reviews and delegations. Each says exactly what is needed and what it blocks.` })}
      ${firstVisit(p) ? `<div class="callout callout--info">${icon('person_add')}<div><strong>Welcome to ${esc(p.name)}</strong><p>${esc(ADE.personName(p.owner))} invited you. These are the questions waiting for your expertise.</p></div></div>` : ''}
      ${tabs([['assigned', `Assigned (${assigned.length})`, ADE.plink(p.id, 'inbox')], ['decisions', `Decisions (${decisions.length})`, ADE.plink(p.id, 'inbox', { tab: 'decisions' })], ['delegated', `Delegated by me (${delegated.length})`, ADE.plink(p.id, 'inbox', { tab: 'delegated' })], ['done', 'Done', ADE.plink(p.id, 'inbox', { tab: 'done' })], ['all', `All open (${all.length})`, ADE.plink(p.id, 'inbox', { tab: 'all' })]], tab)}
      ${body}`;
  };

  /* ------------------------------------------------------------------ knowledge */
  // Grounded Q&A: two or more keyword hits give an answer; one hit is shown as a weak match; none gives no answer.
  ADE.answer = function (p, question) {
    const q = question.toLowerCase();
    const scored = p.questions.map((k) => ({ k, hits: k.keys.filter((x) => new RegExp(`\\b${x}`).test(q)).length })).sort((a, b) => b.hits - a.hits);
    const top = scored[0];
    if (!top || top.hits < 1) return null;
    const k = top.k; const d = k.decision && p.decisions.find((x) => x.id === k.decision && x.status === 'decided');
    const dFact = d && p.facts.find((f) => f.decision === d.id);
    const excl = k.fromWork ? p.work.filter((w) => w.outScope.length && w.status !== 'deferred').sort((a, b) => ADE.ancestors(p, a.id).length - ADE.ancestors(p, b.id).length) : [];
    const text = k.fromWork ? (excl.length ? `Out of scope, as listed on the work items: ${excl.slice(0, 5).map((w) => `${w.id} ${w.title} — ${w.outScope.join('; ')}`).join('. ')}${excl.length > 5 ? `. ${excl.length - 5} more items list exclusions.` : '.'}` : 'No work item lists anything out of scope yet.') : d ? `Decided in ${d.id}: ${(d.options.find((o) => o.id === d.chosen) || {}).title || d.note || 'own option'}. ${(d.options.find((o) => o.id === d.chosen) || {}).desc || ''}`.trim() : k.answer;
    const facts = [...(dFact ? [dFact.id] : []), ...k.facts];
    return { ...k, text, weak: top.hits < 2, facts, decided: d, before: d ? k.answer : null, fromWork: k.fromWork, excl: excl.map((w) => w.id) };
  };
  scr.knowledge = function (p, q) {
    const tab = q.tab || 'ask'; const cur = ADE.currentFacts(p);
    const counts = { sources: p.sources.length, facts: cur.length, conflict: cur.filter((f) => f.kind === 'Conflict').length, superseded: p.facts.length - cur.length, stale: p.sources.filter((s) => s.freshness === 'stale').length, inaccessible: p.sources.filter((s) => s.status === 'inaccessible').length, decisions: cur.filter((f) => f.kind === 'Decision').length, proposed: cur.filter((f) => f.kind === 'Proposed').length };
    const chain = `<div class="chain">
      <a class="chain__step" href="${esc(ADE.plink(p.id, 'knowledge', { tab: 'sources' }))}"><strong>${counts.sources}</strong> sources<small>${counts.stale} stale · ${counts.inaccessible} inaccessible</small></a>${icon('arrow_forward')}
      <a class="chain__step" href="${esc(ADE.plink(p.id, 'knowledge', { tab: 'facts' }))}"><strong>${counts.facts}</strong> current facts<small>${counts.conflict} in conflict · ${counts.superseded} superseded</small></a>${icon('arrow_forward')}
      <a class="chain__step" href="${esc(ADE.plink(p.id, 'knowledge', { tab: 'facts', kind: 'Proposed' }))}"><strong>${counts.proposed}</strong> proposals<small>agent interpretations</small></a>${icon('arrow_forward')}
      <a class="chain__step" href="${esc(ADE.plink(p.id, 'knowledge', { tab: 'facts', kind: 'Decision' }))}"><strong>${counts.decisions}</strong> decisions<small>accepted by people</small></a>
    </div>`;
    const head = ADE.pageHeader({ eyebrow: p.name, title: 'Knowledge', sub: `Everything ADE knows about ${p.name} comes from these project sources and decisions. Nothing here is shared with other projects. Answers are read-only: they never change scope, work or policy.`, actions: ADE.btn('Add document', 'attachOpen', { pid: p.id }, 'primary', 'add') + ADE.btn('Connect repository', 'addRepoOpen', { pid: p.id }, 'quiet', 'link') });
    const nav = tabs([['ask', 'Ask', ADE.plink(p.id, 'knowledge')], ['facts', 'Facts', ADE.plink(p.id, 'knowledge', { tab: 'facts' })], ['sources', 'Sources', ADE.plink(p.id, 'knowledge', { tab: 'sources' })]], tab);
    if (tab === 'sources') { const pg = ADE.pager(p.sources, { page: q.page, label: 'Sources', link: (n) => ADE.plink(p.id, 'knowledge', { tab: 'sources', page: n > 1 ? n : undefined }) }); return `${head}${chain}${nav}
      <table class="table"><thead><tr><th>Source</th><th>Kind</th><th>Where from</th><th>Revision</th><th>State</th><th>Used by</th></tr></thead><tbody>
      ${pg.rows.map((s) => { const att = ADE.attachedTo(p, s.id); return `<tr><td><button class="link" type="button" data-act="sourceOpen" data-pid="${esc(p.id)}" data-src="${esc(s.id)}">${esc(s.title)}</button><br><small class="meta">${esc(s.purpose)}</small>${s.overlaps ? `<br>${ADE.tone(`Possibly overlaps ${(ADE.source(p, s.overlaps) || {}).title || s.overlaps}`, 'warn', 'compare')}` : ''}</td><td>${esc(s.kind)}</td><td class="meta">${esc(s.provenance)}</td><td><code>${esc(s.revision)}</code>${(s.revisions || []).length > 1 ? `<small class="meta"> · ${s.revisions.length} revisions</small>` : ''}</td><td>${ADE.badge(s.status)}${s.freshness === 'stale' ? ADE.badge('stale') : ''}</td><td>${ADE.currentFacts(p).filter((f) => f.source === s.id).length} facts${att.length ? `<br><small class="meta">attached to ${att.map((w) => ADE.a(w.id, ADE.plink(p.id, `work/${w.id}`))).join(', ')}</small>` : ''}${s.status === 'inaccessible' ? ADE.btn('Request access', 'sourceAccess', { pid: p.id, src: s.id }, 'quiet') : ''}${s.status === 'extracting' ? ADE.tone('Extracting…', 'info', 'sync') : ''}</td></tr>`; }).join('')}
      </tbody></table>${pg.html}`; }
    const factTable = (facts) => `<div id="facts-${esc(p.id)}" class="fs-target"><div class="section__tools"><button class="icon-btn" type="button" data-fs="#facts-${esc(p.id)}" aria-label="Full screen">${icon('fullscreen')}</button></div><table class="table"><thead><tr><th>Fact</th><th>Kind</th><th>Source</th><th>Used by</th></tr></thead><tbody>
      ${facts.map((f) => { const s = ADE.source(p, f.source); const d = f.decision && p.decisions.find((x) => x.id === f.decision); return `<tr class="${f.superseded ? 'is-superseded' : f.kind === 'Conflict' ? 'is-conflict' : ''}"><td>${esc(f.text)}${f.conflictWith ? `<small class="meta"> conflicts with ${esc(f.conflictWith)}</small>` : ''}${f.superseded ? `<br>${ADE.badge('superseded', `Superseded by ${f.superseded}${f.supersededBy ? ` (${f.supersededBy})` : ''}`)}` : ''}</td><td>${ADE.kind(f.kind)}</td><td>${s ? `<button class="link" type="button" data-act="sourceOpen" data-pid="${esc(p.id)}" data-src="${esc(s.id)}">${esc(s.title)}</button>${f.rev ? ` <span class="meta">@ ${esc(f.rev)}</span>` : ''} ${s.freshness !== 'current' ? ADE.badge(s.freshness) : ''}` : d ? `<button class="link" type="button" data-act="decideOpen" data-pid="${esc(p.id)}" data-did="${esc(d.id)}">Decision ${esc(d.id)}</button> <span class="meta">by ${esc(ADE.personName(d.by || d.decider))}</span>` : esc(f.source || '—')}</td><td>${(f.usedBy || []).map((u) => (u.startsWith('W-') ? ADE.a(u, ADE.plink(p.id, `work/${u}`)) : u.startsWith('R-') ? ADE.a(u, ADE.plink(p.id, 'risks', { risk: u })) : ADE.a(u, ADE.plink(p.id, `releases/${u}`)))).join(' ') || '<span class="meta">—</span>'}</td></tr>`; }).join('') || `<tr><td colspan="4">${ADE.empty('search', 'No facts of this kind', 'Clear the filter.')}</td></tr>`}
      </tbody></table></div>`;
    const kinds = ['Source-grounded', 'Observed', 'Proposed', 'Decision', 'Conflict', 'Open question', 'Unknown', 'Forecast'];
    const kindChips = (base) => `<div class="toolbar">${chipLink('All', ADE.plink(p.id, 'knowledge', { ...base, kind: undefined }), !q.kind)}${kinds.map((k) => chipLink(k, ADE.plink(p.id, 'knowledge', { ...base, kind: k }), q.kind === k)).join('')}<span class="toolbar__gap"></span>${chipLink(q.superseded ? 'Hide superseded' : `Show superseded (${counts.superseded})`, ADE.plink(p.id, 'knowledge', { ...base, kind: q.kind, superseded: q.superseded ? undefined : '1' }), !!q.superseded)}</div>`;
    const pool = q.superseded ? p.facts : cur;
    if (tab === 'facts') { const pg = ADE.pager(pool.filter((f) => !q.kind || f.kind === q.kind), { page: q.page, label: 'Facts', link: (n) => ADE.plink(p.id, 'knowledge', { tab: 'facts', kind: q.kind, superseded: q.superseded, page: n > 1 ? n : undefined }) }); return `${head}${chain}${nav}${kindChips({ tab: 'facts' })}${factTable(pg.rows)}${pg.html}`; }
    const ans = q.q ? ADE.answer(p, q.q) : null;
    const facts = ans ? ans.facts.map((id) => p.facts.find((f) => f.id === id)).filter(Boolean).filter((f) => (q.superseded || !f.superseded) && (!q.kind || f.kind === q.kind)) : [];
    return `${head}${chain}${nav}
      <form class="qa" data-form data-submit="knowledgeAsk" data-pid="${esc(p.id)}">
        <label for="qa-input" class="qa__label">Ask ${esc(p.name)} a question</label>
        <div class="qa__suggestions">${p.questions.map((k) => `<a class="card qa__suggestion${q.q === k.q ? ' is-on' : ''}" href="${esc(ADE.plink(p.id, 'knowledge', { q: k.q }))}"${q.q === k.q ? ' aria-current="true"' : ''}>${icon('chat_bubble_outline')}<span>${esc(k.q)}</span></a>`).join('')}</div>
        <div class="qa__row"><input id="qa-input" class="input" name="q" value="${esc(q.q || '')}" placeholder="Or ask your own question">${ADE.btn('Ask', 'knowledgeAskBtn', { pid: p.id }, 'primary', 'search')}</div>
        <p class="meta">${icon('lock')}Read-only. Answers cite current project sources and decisions, and never change the project.</p>
      </form>
      ${q.q ? (ans ? `<section class="answer-block"><h2>${esc(ans.q)}</h2>
        ${ans.weak ? `<div class="callout">${icon('warning_amber')}<div><strong>Weak match</strong><p>Only one keyword of your question matched this answer. It may not answer what you asked.</p></div></div>` : ''}
        <p class="answer-block__text">${esc(ans.text)}${ADE.gen(`qa:${p.id}:${ans.id}`)}</p>
        ${ans.fromWork ? `<p class="meta">Collected from the out-of-scope lists of ${ans.excl.map((id) => ADE.a(id, ADE.plink(p.id, `work/${id}`))).join(', ') || 'no work item'}.</p>` : ''}
        ${ans.before ? `<p class="meta">Before decision ${esc(ans.decided.id)} the answer was: “${esc(ans.before)}”</p>` : ''}
        <h3>Every fact considered</h3>${kindChips({ q: q.q })}${factTable(facts)}</section>`
        : ADE.empty('search', 'No grounded answer', `No project source covers “${q.q}”. Try one of the questions above, or look at the Facts tab. ADE doesn't guess.`, ADE.a('See all facts', ADE.plink(p.id, 'knowledge', { tab: 'facts' }), 'btn btn--outline'))) : ''}`;
  };

  /* ------------------------------------------------------------------ risks */
  scr.risks = function (p, q) {
    const dims = ['customer', 'cost', 'time', 'scope', 'authority', 'evidence', 'capacity'];
    let list = p.risks.filter((r) => (!q.dim || r.dims[q.dim]) && (!q.status || r.status === q.status) && (q.status === 'closed' || r.status !== 'closed'));
    list = list.sort((a, b) => b.now[0] * b.now[1] - a.now[0] * a.now[1]);
    const all = list;
    // cell=<likelihood>-<impact> narrows the cards to one matrix cell (set by the hi-fi RiskLayout; shareable in the URL).
    if (q.cell) { const [l, i] = q.cell.split('-').map(Number); list = list.filter((r) => r.now[0] === l && r.now[1] === i); }
    const L = (v) => ADE.plink(p.id, 'risks', { ...q, risk: undefined, cell: undefined, ...v });
    const needOwner = p.risks.filter((r) => r.status === 'needs-owner').length;
    return `${ADE.pageHeader({ eyebrow: p.name, title: 'Risks', sub: `${ADE.openRisks(p).length} open risks; ${needOwner} ${needOwner === 1 ? 'needs' : 'need'} an owner decision. The biggest exposure is “${all[0] ? all[0].title : '—'}”.`, subKey: `risks:${p.id}`, actions: ADE.gbtn(ADE.can(p, 'raise-risk'), 'Raise a risk', 'raiseRiskOpen', { pid: p.id }, 'primary', 'add') })}
      <div class="toolbar"><span class="meta">Dimension</span>${chipLink('All', L({ dim: undefined }), !q.dim)}${dims.map((d) => chipLink(d, L({ dim: d }), q.dim === d)).join('')}</div>
      <div class="toolbar"><span class="meta">Status</span>${chipLink('Open', L({ status: undefined }), !q.status)}${['needs-owner', 'monitoring', 'accepted', 'closed'].map((s) => chipLink(ADE.label(s), L({ status: s }), q.status === s)).join('')}</div>
      ${ADE.riskLayout(p, list, q, all)}`;
  };

  /* ------------------------------------------------------------------ activity */
  scr.activity = function (p, q) {
    const tab = q.run ? 'runs' : q.tab || 'runs';
    const nav = tabs([['runs', `Agent runs (${p.runs.length})`, ADE.plink(p.id, 'activity')], ['events', 'Events and triggers', ADE.plink(p.id, 'activity', { tab: 'events' })], ['automations', `Automations (${p.automations.length})`, ADE.plink(p.id, 'activity', { tab: 'automations' })]], tab);
    const head = ADE.pageHeader({ eyebrow: p.name, title: 'Activity', sub: `${((n) => `${n} run${n === 1 ? '' : 's'}`)(p.runs.filter((r) => r.state === 'running').length)} in progress, ${p.runs.filter((r) => r.state === 'awaiting-review').length} waiting for review, ${p.runs.filter((r) => r.state === 'awaiting-input').length} waiting for a person. Every automatic action shows what triggered it, which rule allowed it and when it will stop.`, subKey: `activity:${p.id}` });
    if (tab === 'events') return `${head}${nav}${p.events.map((e) => ADE.eventRow(p, e)).join('')}`;
    const ga = ADE.can(p, 'automation');
    if (tab === 'automations') return `${head}${nav}<p class="section__sub">Automations react to changes in the project. Each one can only do what the active policy allows; when policy says “needs decision”, it stops and asks.</p>
      <div class="grid grid--2">${p.automations.map((a) => `<article class="card automation"><p class="need__kind">${icon('bolt')}${esc(a.id)} ${a.state === 'active' ? ADE.tone('Active', 'ok', 'play_circle') : ADE.tone('Paused', 'warn', 'pause_circle')}</p><h3>${esc(a.title)}</h3>
        <dl class="kv kv--tight"><div><dt>When</dt><dd>${esc(a.trigger)}</dd></div><div><dt>Then</dt><dd>${esc(ADE.fill(a.action, p))}</dd></div><div><dt>Allowed by</dt><dd><a class="link" href="${esc(ADE.plink(p.id, 'config', { contract: 'policy' }))}">${esc(a.rule)}</a> · revision ${p.contracts.policy.revision}</dd></div><div><dt>Limit</dt><dd>${esc(ADE.fill(a.limit, p))}</dd></div><div><dt>Last fired</dt><dd>${esc(a.last)}</dd></div></dl>
        <div class="row-actions">${ADE.gbtn(ga, a.state === 'active' ? 'Pause' : 'Resume', 'automationToggle', { pid: p.id, id: a.id }, 'quiet', a.state === 'active' ? 'pause_circle' : 'play_circle')}</div></article>`).join('')}</div>`;
    const list = p.runs.filter((r) => q.state !== 'active' || ADE.ACTIVE.includes(r.state));
    return `${head}${nav}<div class="toolbar">${chipLink('All runs', ADE.plink(p.id, 'activity'), q.state !== 'active' && !q.run)}${chipLink('Active or waiting', ADE.plink(p.id, 'activity', { tab: 'runs', state: 'active' }), q.state === 'active')}</div>
      ${list.map((r) => ADE.runRow(p, r, q.run === r.id)).join('') || ADE.empty('smart_toy', 'No runs match', 'Start an agent from a ready work item.', ADE.a('Ready work', ADE.plink(p.id, 'work', { readiness: 'ready', expand: 'all' }), 'btn btn--outline'))}`;
  };

  /* ------------------------------------------------------------------ configuration: one JSON contract control for every contract */
  const CONTRACTS = {
    policy: { title: 'Project policy', sub: 'Decides when agents and people may act without asking, and who decides otherwise.', example: 'e.g. Let agents start runs up to 350 without asking me' },
    routing: { title: 'Contribution routing', sub: 'Names who answers each kind of question and who may delegate.', example: 'e.g. Let Matej delegate architecture questions to Sofia' },
    agents: { title: 'Agent profiles', sub: 'How agents work: model, runner, MCP servers, limits and a bounded step workflow per profile.', example: 'e.g. Use synthetic-model-XL for the plan step · Allow 5 build attempts in direct build · Start the build step with a new session' },
    skills: { title: 'Skills', sub: 'Pinned, versioned instructions the ade-skills MCP server hands to agent steps.', example: 'e.g. Pin build to 2.2.0' },
    settings: { title: 'Project settings', sub: 'Currency, time zone, hours in a working day and an optional human day rate. Date and number formats are personal (your profile).', example: 'e.g. Use GBP as currency · A working day is 7.5 hours · Day rate 520' },
  };
  ADE.CONTRACTS = CONTRACTS;
  ADE.contractSentences = function (p, key) {
    const j = p.contracts[key].json;
    if (key === 'policy') return ADE.policySentences(p);
    if (key === 'routing') return ADE.routingSentences(p);
    if (key === 'agents') return Object.entries(j.profiles).map(([id, pr]) => ({ text: `${pr.title}: ${pr.model} on ${pr.runner}${pr.limits.readOnly ? ', read-only' : ''}. Steps: ${ADE.stepSummary(p, id)}.`, rule: id })).concat([{ text: `Implementation items use “${j.profiles[j.defaults.implementation].title}” by default; investigation items use “${j.profiles[j.defaults.investigation].title}”.`, rule: 'defaults' }]);
    if (key === 'skills') return Object.entries(j.skills).map(([id, s]) => ({ text: `${id} ${s.version}${s.pinned ? ' (pinned)' : ''}: ${s.purpose}`, rule: id }));
    return [{ text: `Money is shown in ${j.currency}.`, rule: 'currency' }, { text: `Times and dates use ${j.timeZone}.`, rule: 'timeZone' }, { text: `A working day is ${j.workingDayHours} hours; logged human hours are shown as days.`, rule: 'workingDayHours' }, { text: j.humanDayRate ? `Human effort is also shown in money at ${eur(j.humanDayRate)} per day.` : 'Human effort is shown in days only.', rule: 'humanDayRate' }];
  };
  scr.config = function (p, q) {
    const key = CONTRACTS[q.contract] ? q.contract : 'policy'; const c = p.contracts[key]; const meta = CONTRACTS[key];
    const draft = S().drafts.config[`${p.id}:${key}`] || {};
    const nav = tabs(Object.entries(CONTRACTS).map(([k, v]) => [k, v.title, ADE.plink(p.id, 'config', { contract: k })]), key);
    const summary = ADE.contractSentences(p, key);
    const prop = c.proposal;
    const ga = ADE.can(p, 'activate');
    return `${ADE.pageHeader({ eyebrow: `${p.name} · configuration`, title: meta.title, sub: meta.sub })}
      ${nav}
      <section class="section"><div class="section__head"><h2>What revision ${c.revision} says</h2><span class="row-actions">${ADE.btn('Active JSON', 'contractJson', { pid: p.id, key }, 'quiet', 'code')}${ADE.btn('README', 'contractReadme', { pid: p.id, key }, 'quiet', 'menu_book')}${ADE.btn('History', 'contractHistory', { pid: p.id, key }, 'quiet', 'history')}</span></div>
        <ul class="sentences">${summary.map((s) => `<li data-rule="${esc(s.rule)}">${esc(s.text)}</li>`).join('')}</ul><p class="meta">Plain-language summary generated from the active contract.${ADE.gen(`contract:${p.id}:${key}`)}</p></section>
      <section class="section"><div class="section__head"><h2>Describe a change</h2></div>
        <form data-form data-submit="configPropose" data-pid="${esc(p.id)}" data-key="${esc(key)}"><textarea class="input" name="text" rows="3" placeholder="${esc(meta.example)}">${esc(draft.text || '')}</textarea>
        <div class="row-actions">${ADE.btn('Propose change', 'configProposeBtn', { pid: p.id, key }, 'primary', 'auto_awesome')}<span class="meta">The assistant only edits this contract, states the assumptions it made and never activates anything. To change an assumption, edit your request and propose again.</span></div></form>
      </section>
      ${prop ? `<section class="card proposal"><div class="section__head"><h2>${prop.ok ? 'Proposal' : 'No proposal'}</h2>${prop.ok ? ADE.badge(prop.state === 'active' ? 'complete' : 'proposed', prop.state === 'active' ? `Active as revision ${prop.newRevision}` : 'Validated · waiting for activation') : ADE.tone(prop.invalid ? 'Rejected by validation' : 'Could not map the request', prop.invalid ? 'bad' : 'warn', 'warning_amber')}</div>
        ${prop.ok ? `<p><strong>Now:</strong> ${esc(prop.now)}</p><p><strong>After this change:</strong> ${esc(prop.after)}${ADE.gen(`proposal:${p.id}:${key}`)}</p>
        <h3>Assumptions I made</h3><ul class="plain">${prop.assumptions.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>
        <h3>Effect on current work</h3><ul class="plain">${prop.effects.map((a) => `<li>${esc(a)}</li>`).join('') || '<li class="meta">No open work changes verdict.</li>'}</ul>
        <div class="tabs-inline" data-tabs>${['changes', 'before', 'after'].map((t) => `<button type="button" class="tab${(draft.tab || 'changes') === t ? ' is-active' : ''}" data-act="configTab" data-pid="${esc(p.id)}" data-key="${esc(key)}" data-tab="${t}">${t === 'changes' ? 'JSON changes' : t === 'before' ? 'Before' : 'After'}</button>`).join('')}</div>
        <div id="diff-${esc(key)}" class="fs-target"><div class="section__tools"><button class="icon-btn" type="button" data-fs="#diff-${esc(key)}" aria-label="Full screen">${icon('fullscreen')}</button></div><pre class="code">${esc((draft.tab || 'changes') === 'changes' ? prop.diff.join('\n') : JSON.stringify((draft.tab === 'before' ? prop.before : prop.afterJson), null, 2))}</pre></div>
        <h3>Validation</h3><ul class="checks">${prop.validation.map((v) => `<li class="is-ok">${icon('check_circle')}<span>${esc(v)}</span></li>`).join('')}</ul>
        ${prop.state === 'active' ? `<p class="meta">Activated by ${esc(ADE.personName(prop.activatedBy))}. Work already started keeps revision ${prop.newRevision - 1}.</p>` : `<div class="row-actions">${ADE.gbtn(ga, `Activate as revision ${c.revision + 1}`, 'configActivate', { pid: p.id, key }, 'primary', 'verified')}${ADE.btn('Discard', 'configDiscard', { pid: p.id, key }, 'quiet')}</div>`}`
        : `<p>${esc(prop.message)}</p>${prop.invalid ? `<ul class="checks">${prop.invalid.map((v) => `<li class="is-missing">${icon('error_outline')}<span>${esc(v)}</span></li>`).join('')}</ul>` : ''}<p class="meta">Nothing changed. ${prop.invalid ? 'The request maps to a change validation does not allow.' : 'Rephrase the request with the value you want.'}</p>`}
      </section>` : ''}
      ${key === 'policy' ? `<p class="meta">${icon('info')}Policy decides when an action may run. Who may take an action at all is a separate, fixed grant: <button class="link" type="button" data-act="grantsOpen">Who may do what</button></p>` : ''}`;
  };
  ADE.policySentences = function (p) {
    const j = p.contracts.policy.json; const out = [];
    j.rules.forEach((r) => {
      const t = { P1: 'Agents never act on targets outside the project\'s grants.', P2: `Runs whose forecast could exceed ${eur(j.limits.agentRunMax)}, or is unknown, need ${ADE.personName(p.owner)}.`, P3: `A contributor starting a customer-visible change needs ${ADE.personName(p.owner)} to decide.`, P4: 'Otherwise agents may start when linked risk is at most medium; a person reviews the output (a human step no profile can remove).', P5: 'If a linked risk is high, architecture must agree first.', P6: 'When a contribution is answered, readiness is re-checked automatically.', P7: 'When a source changes, summaries are regenerated automatically.' }[r.id] || `Custom rule ${r.id}: ${JSON.stringify(r.when)} gives ${r.outcome}.`;
      out.push({ text: t, rule: r.id });
    });
    out.push({ text: `Running agents pause at ${j.limits.pauseAtReservationPct} % of their reservation.`, rule: 'limits' });
    return out;
  };
  ADE.routingSentences = function (p) {
    return Object.entries(p.contracts.routing.json.categories).map(([k, v]) => ({ text: `${F.categories[k].label} questions go to ${ADE.personName(v.designated)}${v.canDelegate ? `, who may delegate to ${v.eligible.map(ADE.personName).join(', ')}` : ', who may not delegate'}.`, rule: k }));
  };

  /* ------------------------------------------------------------------ create project (greenfield) */
  // First release proposal follows the answers: description choice, "what must the first release prove" and "who may borrow".
  ADE.proposeRelease = function (d) {
    const C = F.createScene; const goal = (d.goalChoice || {}).choice; const first = (d.refine.first || {}).choice;
    const key = goal === 'staff' ? 'staff' : first === 'search' ? 'search' : 'loan';
    const base = ADE.clone(C.releases[key]);
    if ((d.refine.who || {}).choice === 'anyone' && !base.items.some((x) => x.title === C.releases.anyone.title)) base.items.push(ADE.clone(C.releases.anyone));
    if (first === 'own' && ((d.refine.first.notes || {}).own || '').trim()) base.name = d.refine.first.notes.own.trim().replace(/^./, (c) => c.toUpperCase()).slice(0, 70);
    base.forecast = base.items.reduce((a, x) => [a[0] + x.forecast[0], a[1] + x.forecast[1]], [0, 0]);
    base.why = [goal === 'staff' ? 'staff-outcome description' : 'member-outcome description', first === 'search' ? '“see what is on the shelf” first' : first === 'own' ? 'your own first-release answer' : '“borrow and see it lent” first', (d.refine.who || {}).choice === 'anyone' ? 'anyone may register (adds online registration)' : 'card holders only'].join(' · ');
    return base;
  };
  const CREATE_STEPS = ['Name and description', 'First questions', 'Sources', 'Risks', 'First release and budget'];
  scr.create = function (q) {
    const d = S().drafts.create || ADE.actions.createInit();
    const step = Math.max(1, Math.min(CREATE_STEPS.length, Number(q.step || d.step || 1)));
    const C = F.createScene;
    const nav = `<ol class="stepper">${CREATE_STEPS.map((s, i) => `<li class="${i + 1 < step ? 'is-done' : i + 1 === step ? 'is-now' : ''}">${esc(s)}</li>`).join('')}</ol>`;
    const foot = (canNext, hint = '') => `<div class="page-actions">${step > 1 ? ADE.a('Back', ADE.link('new', { step: step - 1 }), 'btn btn--quiet') : ADE.a('Cancel', '#/', 'btn btn--quiet')}${step < CREATE_STEPS.length ? (canNext ? ADE.a('Continue', ADE.link('new', { step: step + 1 }), 'btn btn--primary') : '<button class="btn btn--primary" type="button" disabled>Continue</button>') : ADE.btn('Create project', 'createFinish', {}, 'primary', 'done_all')}<span class="meta">${esc(hint)}</span></div>`;
    let body = '';
    if (step === 1) body = `<div class="form" data-form><label>Project name<input class="input" data-input="createField" data-field="name" value="${esc(d.name)}"></label>
      <label>What is this project about? (in your own words)<textarea class="input" rows="2" data-input="createField" data-field="description">${esc(d.description)}</textarea></label></div>
      <h2 class="h-small">Sharper descriptions proposed from your words</h2><p class="meta">Pick one as the project description, or keep your own words. The choice shapes the proposed first release. Scope is defined on each work item, not on the project.</p>
      ${ADE.optionCards('create:goal', C.descriptionOptions, d.goalChoice || {}, { ownLabel: 'Use my own words' })}
      ${foot(!!d.name.trim() && ADE.optionReady(d.goalChoice), !d.name.trim() ? 'A name is required.' : 'Pick a description to continue.')}`;
    if (step === 2) body = `<p class="section__sub">Only the questions that change what happens next. Your answers change the proposed first release.</p>
      ${C.refine.map((r) => `<section class="section"><h2 class="h-small">${esc(r.q)}</h2><p class="meta">${esc(r.why)}</p>${ADE.optionCards(`create:refine:${r.id}`, r.options, d.refine[r.id] || {}, { ownLabel: 'Something else' })}</section>`).join('')}
      ${foot(C.refine.every((r) => ADE.optionReady(d.refine[r.id])), 'Answer both questions to continue.')}`;
    if (step === 3) body = `<p class="section__sub">Sources become this project's knowledge. You can add more at any time from Knowledge or attach them to work items.</p>
      <h2 class="h-small">Documents</h2><table class="table"><tbody>${C.documents.map((doc) => `<tr><td>${icon('description')} ${esc(doc.title)} <small class="meta">${esc(doc.note)}</small></td><td class="num">${d.docs.includes(doc.id) ? ADE.tone('Added', 'ok', 'check') : ADE.btn('Add', 'createDoc', { id: doc.id }, 'outline', 'add')}</td></tr>`).join('')}</tbody></table>
      <h2 class="h-small">Repositories</h2>
      <div class="grid grid--2">${['code', 'docs'].map((k) => `<div class="card"><h3>${k === 'code' ? 'Code repository' : 'Documentation repository'}</h3>${d.repos[k] ? `<p>${ADE.tone('Created', 'ok', 'check')} <code>git.example/${esc(d.name.toLowerCase().replace(/\W+/g, '-'))}/${k === 'code' ? 'app' : 'docs'}</code> · empty, revision <code>0000000</code></p>` : `<p class="meta">None yet. Agents can refine and plan without one, but cannot implement.</p><div class="row-actions">${ADE.btn('Create empty repository', 'createRepo', { k }, 'outline', 'add')}</div>`}</div>`).join('')}</div>
      ${foot(true, d.docs.length ? '' : 'You can continue without sources; answers will say they have no grounding.')}`;
    if (step === 4) body = `<p class="section__sub">Risks proposed from your description and sources. Keep, dismiss or add. Each kept risk gets an owner.</p>
      <div class="grid grid--3">${C.risks.map((r) => { const v = d.risks[r.id] || 'keep'; return `<article class="card risk-card${v === 'dismiss' ? ' is-dismissed' : ''}"><h3 class="risk-card__title">${esc(r.title)}</h3><div class="risk-card__dims">${Object.entries(r.dims).map(([k, lv]) => ADE.level(k, lv)).join('')}</div><p class="meta">${esc(r.why)}</p><span class="seg">${['keep', 'dismiss'].map((x) => `<button type="button" class="seg__btn${v === x ? ' is-on' : ''}" data-act="createRisk" data-id="${esc(r.id)}" data-v="${x}" aria-pressed="${v === x}">${x === 'keep' ? 'Keep' : 'Dismiss'}</button>`).join('')}</span></article>`; }).join('')}</div>
      ${foot(true)}`;
    if (step === 5) { const rel = ADE.proposeRelease(d); body = `<p class="section__sub">A release is a customer outcome: something a member would notice. The agent proposed the first one from your answers (${esc(rel.why)}).</p>
      <div class="card"><p>${ADE.outcomeTag()}</p><label>Release name<input class="input" data-input="createField" data-field="releaseName" value="${esc(d.releaseNameEdited ? d.releaseName : rel.name)}"></label>
      <p class="meta">Pulls in:</p><ul class="plain">${rel.items.map((x) => `<li>${icon('subdirectory_arrow_right')}${esc(x.title)} <span class="meta">${range(x.forecast)}</span></li>`).join('')}</ul><p>Forecast ${range(rel.forecast)} ${ADE.kind('Forecast')}</p>
      <div class="grid grid--2"><label>First release budget (${esc(ADE.fmtCtx.currency)})<input class="input" type="number" data-input="createField" data-field="releaseBudget" value="${esc(d.releaseBudget ?? Math.ceil((rel.forecast[1] * 1.1) / 100) * 100)}"></label><label>First release date<input class="input" data-input="createField" data-field="releasePlanned" value="${esc(d.releasePlanned || '')}" placeholder="e.g. 14 Oct"></label></div></div>
      <h2 class="h-small">Whole project</h2>
      <div class="grid grid--2"><label>Project budget (${esc(ADE.fmtCtx.currency)})<input class="input" type="number" data-input="createField" data-field="budget" value="${esc(d.budget)}"></label><label>Planned end<input class="input" data-input="createField" data-field="planned" value="${esc(d.planned)}"></label></div>
      ${foot(true, d.releasePlanned ? '' : 'Leave the release date empty to record it as not set.')}`; }
    return `${ADE.pageHeader({ crumbs: [['Home', '#/'], ['Create project']], eyebrow: `Step ${step} of ${CREATE_STEPS.length}`, title: 'Create a project', sub: 'Start from a description. At each step the agent proposes, you choose. You can change everything later.' })}${nav}${body}`;
  };

  /* ------------------------------------------------------------------ import existing project */
  const IMPORT_STEPS = ['Project', 'Code repository', 'Documentation repository', 'Documents', 'What ADE understood', 'Starting structure'];
  scr.import = function (q) {
    const d = S().drafts.import || ADE.actions.importInit();
    const step = Math.max(1, Math.min(IMPORT_STEPS.length, Number(q.step || 1)));
    const I = F.importScene;
    const nav = `<ol class="stepper">${IMPORT_STEPS.map((s, i) => `<li class="${i + 1 < step ? 'is-done' : i + 1 === step ? 'is-now' : ''}">${esc(s)}</li>`).join('')}</ol>`;
    const foot = (canNext, hint = '') => `<div class="page-actions">${step > 1 ? ADE.a('Back', ADE.link('import', { step: step - 1 }), 'btn btn--quiet') : ADE.a('Cancel', '#/', 'btn btn--quiet')}${step < IMPORT_STEPS.length ? (canNext ? ADE.a('Continue', ADE.link('import', { step: step + 1 }), 'btn btn--primary') : '<button class="btn btn--primary" type="button" disabled>Continue</button>') : ADE.btn('Create project from import', 'importFinish', {}, 'primary', 'done_all')}<span class="meta">${esc(hint)}</span></div>`;
    const repoCard = (k, title, optional) => { const r = I.repos[k]; const st = d.repos[k]; return `<div class="card repo"><h3>${esc(title)}</h3>
      <div class="form"><label>Repository URL<input class="input" value="${esc(r.url)}" readonly></label><label>Branch<input class="input" value="${esc(r.branch)}" readonly></label></div>
      ${!st ? `<div class="row-actions">${ADE.btn('Connect and inspect', 'importConnect', { k }, 'primary', 'link')}${optional ? ADE.btn(optional, 'importSkip', { k }, 'quiet') : ''}</div>` : st.skipped && !st.result ? `<p>${ADE.tone('Skipped', 'neutral', 'do_not_disturb_on')} No repository of this kind is connected.</p>` : st.result === 'ok' ? `<p>${ADE.tone('Connected', 'ok', 'link')} at <code>${esc(r.revision)}</code> <span class="meta">(synthetic revision)</span></p><p class="meta">${esc(r.detail)}</p>` : `<p>${ADE.tone('Not connected', 'bad', 'lock')} ${esc(r.detail)}</p><p class="meta">Attempt ${st.attempts}. No baseline was recorded for this repository.</p><div class="row-actions">${ADE.btn('Retry', 'importConnect', { k }, 'outline', 'sync')}${st.skipped ? ADE.tone('Continuing without it', 'neutral', 'do_not_disturb_on') : ADE.btn('Continue without it', 'importSkip', { k }, 'quiet')}</div>`}
    </div>`; };
    const codeOk = d.repos.code && (d.repos.code.result === 'ok' || d.repos.code.skipped);
    let body = '';
    if (step === 1) body = `<div class="form"><label>Project name<input class="input" data-input="importField" data-field="name" value="${esc(d.name)}"></label><label>Why are you bringing it into ADE?<textarea class="input" rows="2" data-input="importField" data-field="outcome">${esc(d.outcome)}</textarea></label></div><p class="meta">This becomes the project's first goal. You can refine it after ADE has read the sources.</p>${foot(!!d.name.trim() && !!d.outcome.trim(), 'Name and reason are required.')}`;
    if (step === 2) body = `<p class="section__sub">ADE reads the code at an exact revision. Nothing is changed in the repository. A documentation-only import is possible: agents can then answer and plan, but not implement.</p>${repoCard('code', 'Code repository', 'Import documents only')}${repoCard('ops', 'Additional code repository (optional)')}${foot(codeOk, 'Connect the main code repository, or choose a documents-only import.')}`;
    if (step === 3) body = `<p class="section__sub">Documentation lives in its own repository so code and docs keep separate histories.</p>${repoCard('docs', 'Documentation repository')}${foot(!!d.repos.docs, 'Connect the documentation repository, or continue once it has been tried.')}`;
    if (step === 4) body = `<p class="section__sub">Add manuals, specifications and notes. Originals are kept unchanged; ADE shows what it could and couldn't read.</p>
      <table class="table"><thead><tr><th></th><th>Document</th><th>Size</th><th>Result</th></tr></thead><tbody>${I.documents.map((doc) => { const on = d.docs.includes(doc.id); return `<tr><td><input type="checkbox" data-input="importDoc" value="${esc(doc.id)}" ${on ? 'checked' : ''} ${d.docsImported ? 'disabled' : ''} aria-label="Include ${esc(doc.title)}"></td><td>${esc(doc.title)}</td><td class="meta">${esc(doc.size)}</td><td>${d.docsImported && on ? `${ADE.badge(doc.result === 'ok' ? 'accepted' : doc.result === 'excluded' ? 'blocked' : doc.result, doc.result === 'ok' ? 'Read' : doc.result === 'excluded' ? 'Excluded' : ADE.label(doc.result))} <small class="meta">${esc(doc.detail)}</small>` : '<span class="meta">—</span>'}</td></tr>`; }).join('')}</tbody></table>
      ${d.docsImported ? '' : `<div class="row-actions">${ADE.btn(`Import ${d.docs.length} documents`, 'importDocs', {}, 'primary', 'source')}</div>`}
      ${foot(d.docsImported, 'Import the selected documents to continue.')}`;
    if (step === 5) body = `<p class="section__sub">What ADE read, what it inferred and what it could not establish. Nothing here is assumed true: conflicts and unknowns stay visible and go to the right person.</p>
      <div class="chain"><span class="chain__step"><strong>${Object.values(d.repos).filter((r) => r && r.result === 'ok').length}</strong> repositories<small>${Object.values(d.repos).filter((r) => r && r.result && r.result !== 'ok').length} unavailable${d.repos.code && d.repos.code.skipped && !d.repos.code.result ? ' · documents only' : ''}</small></span>${icon('arrow_forward')}<span class="chain__step"><strong>${d.docs.filter((x) => x !== 'secrets').length}</strong> documents<small>${d.docs.includes('secrets') ? '1 excluded' : 'none excluded'}</small></span>${icon('arrow_forward')}<span class="chain__step"><strong>${I.findings.length}</strong> findings<small>1 conflict · 1 unknown · 1 stale</small></span></div>
      <table class="table"><thead><tr><th>Finding</th><th>Kind</th><th>Sources</th><th>What happens next</th></tr></thead><tbody>${I.findings.map((f) => `<tr class="${f.kind === 'Conflict' ? 'is-conflict' : ''}"><td>${esc(f.text)}</td><td>${ADE.kind(f.kind)}</td><td class="meta">${esc(f.sources)}</td><td>${esc(f.action)}</td></tr>`).join('')}</tbody></table>
      <h2 class="h-small">Project brief</h2><p class="subtitle">${esc(I.brief)}${ADE.gen('import-brief')}</p>
      ${foot(true)}`;
    if (step === 6) body = `<p class="section__sub">How should the work start? The first release is the customer outcome you gave in step 1.</p>${ADE.optionCards('import:structure', I.structures, d.structure || {}, { ownLabel: 'Something else' })}
      <div class="grid grid--2"><label>Budget (${esc(ADE.fmtCtx.currency)})<input class="input" type="number" data-input="importField" data-field="budget" value="${esc(d.budget)}"></label><label>Planned end<input class="input" data-input="importField" data-field="planned" value="${esc(d.planned)}"></label></div>
      <p class="meta">Budget and date are your inputs. Leaving the defaults records them as placeholders to review after the investigation.</p>
      ${foot(ADE.optionReady(d.structure), 'Choose a starting structure.')}`;
    return `${ADE.pageHeader({ crumbs: [['Home', '#/'], ['Import existing project']], eyebrow: `Step ${step} of ${IMPORT_STEPS.length}`, title: 'Import an existing project', sub: 'Connect what exists, see what ADE understood, and start with gaps visible instead of guessed.' })}${nav}${body}`;
  };
})(typeof window !== 'undefined' ? window : globalThis);
