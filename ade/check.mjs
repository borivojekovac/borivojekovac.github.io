// ADE v3 hi-fi prototype · checks run by `node lofi/check.mjs --hifi` after the shared J1–J7 walk has passed with the
// hi-fi renderers loaded. They prove the Phase 6 exit test statically — every route and popup traces to a journey and to
// primitives that exist in primitive-contracts.md, and every rendered class belongs to a registered primitive — plus the
// hi-fi-only compositions (Pager, RiskLayout, DiffViewer, StepDetail, drag reordering) and the token discipline.
// A pass proves rendered markup and deterministic state, not browser layout, keyboard use or accessibility.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const read = (f) => readFileSync(join(root, f), 'utf8');

export default function hifiChecks({ ADE, ok, go, act, pop, html, popupHtml, P, as, classes, routes }) {
  const T = ADE.HIFI_TRACE;
  ok('hi-fi: flavour is hifi (separate saved state and bar label)', ADE.flavor === 'hifi' && /HI-FI PROTOTYPE/.test(read('lofi/dom.js')));

  /* ---------------- trace: routes and popups → journeys and primitives ---------------- */
  const contracts = read('primitive-contracts.md');
  const generic = new Set(['Card', 'Table', 'Empty', 'Guide (prototype only)']);
  const named = new Set([...T.routes.flatMap((r) => r.primitives), ...Object.values(T.popups).map((x) => x[1])]);
  const unknownPrims = [...named].filter((n) => !generic.has(n) && !contracts.includes(`\`${n}\``));
  ok(`trace: all ${named.size} primitives named by routes and popups exist in primitive-contracts.md`, !unknownPrims.length, unknownPrims.join(', '));
  const J = new Set(['J1', 'J2', 'J3', 'J4', 'J5', 'J6', 'J7']);
  ok('trace: every route entry names J1–J7 journeys (fallback: any) and a state', T.routes.every((r) => r.state && r.journeys.length && r.journeys.every((j) => J.has(j) || (r.id === 'fallback' && j === 'any'))));
  const fallbackOk = new Set(['#/does-not-exist', '#/p/nope']);
  const untraced = [...new Set(routes)].filter((h) => { const t = ADE.traceRoute(h); return !t || (t.id === 'fallback' && !fallbackOk.has(h)); });
  ok(`trace: all ${new Set(routes).size} rendered routes map to a journey route (only the two error routes to fallback)`, !untraced.length, untraced.slice(0, 5).join(' '));
  const used = new Set([...new Set(routes)].map((h) => ADE.traceRoute(h)?.id));
  const idle = T.routes.filter((r) => !used.has(r.id)).map((r) => r.id);
  ok('trace: every route entry is exercised by the walk', !idle.length, idle.join(', '));
  const kinds = Object.keys(ADE.popups); const tk = Object.keys(T.popups);
  ok(`trace: all ${kinds.length} popup kinds trace to journeys and a primitive, and no trace entry is stale`, kinds.every((k) => tk.includes(k)) && tk.every((k) => kinds.includes(k)), [...kinds.filter((k) => !tk.includes(k)), ...tk.filter((k) => !kinds.includes(k))].join(', '));
  const journeysCovered = new Set([...T.routes.flatMap((r) => r.journeys), ...Object.values(T.popups).flatMap((x) => x[0])]);
  ok('trace: J1–J7 are each reached by at least two traced screens or popups', [...J].every((j) => T.routes.filter((r) => r.journeys.includes(j)).length + Object.values(T.popups).filter((x) => x[0].includes(j)).length >= 2) && [...J].every((j) => journeysCovered.has(j)));

  /* ---------------- class registry: no page-specific components ---------------- */
  const orphans = [...classes.entries()].filter(([c]) => !ADE.primitiveOf(c));
  ok(`classes: all ${classes.size} rendered classes belong to a registered primitive, composition or the foundation`, !orphans.length, orphans.slice(0, 12).map(([c, where]) => `${c} (${where})`).join(', '));
  const css = read('hifi/hifi.css');
  const styled = new Set([...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/\.([a-z][a-z0-9_-]*)/gi)].map((m) => m[1]));
  const unstyled = [...classes.keys()].filter((c) => !styled.has(c) && !/^(is-|l[0-3]$|c$|now$|target$|add$|del$|md-li$|app$|tree__item$|tree--inline$|tree--reorder$|dash__main$|doc__main$|risk-layout__cards$|gauge--fill-start$|gauge--mark-end$|gauge--fill-end$)/.test(c));
  ok('classes: every rendered class (except state/structural hooks) is styled by hifi.css', !unstyled.length, unstyled.join(', '));

  /* ---------------- tokens ---------------- */
  const tokensCss = read('tokens.css'); const tokensJson = JSON.parse(read('tokens.json'));
  ok('tokens: hifi.css imports the shared tokens.css and styles.css imports the same file', /@import url\("\.\.\/tokens\.css"\)/.test(css) && /@import url\("tokens\.css"\)/.test(read('styles.css')));
  ok('tokens: hifi.css uses no hex colour literals', !/#[0-9a-fA-F]{3,8}\b/.test(css.replace(/\/\*[\s\S]*?\*\//g, '')));
  const defined = new Set([...tokensCss.matchAll(/--([a-z0-9-]+):/g)].map((m) => m[1]));
  const local = new Set(['lo', 'hi', 'fill', 'mark', 'range-at', 'd']);
  const undef = [...new Set([...css.matchAll(/var\(--([a-z0-9-]+)\)/g)].map((m) => m[1]))].filter((v) => !defined.has(v) && !local.has(v));
  ok('tokens: every custom property hifi.css reads is defined in tokens.css', !undef.length, undef.join(', '));
  const kebab = (k) => k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
  const hex6 = (v) => { const h = v.trim().toLowerCase(); return /^#[0-9a-f]{3}$/.test(h) ? `#${[...h.slice(1)].map((c) => c + c).join('')}` : h; };
  const cssVal = (name) => { const m = tokensCss.match(new RegExp(`--${name}:\\s*([^;]+);`)); return m ? hex6(m[1]) : null; };
  const drift = Object.entries(tokensJson.color).filter(([k, v]) => cssVal(kebab(k)) !== hex6(v));
  ok(`tokens: all ${Object.keys(tokensJson.color).length} tokens.json colours are mirrored in tokens.css`, !drift.length, drift.map(([k]) => k).join(', '));
  const idx = read('hifi/index.html');
  ok('hi-fi index: flavour first, shared lo-fi scripts, hifi.js before dom.js, no lo-fi skin', /flavor\.js[\s\S]*lofi\/fixtures\.js[\s\S]*lofi\/actions\.js[\s\S]*hifi\.js[\s\S]*lofi\/dom\.js/.test(idx) && !/lofi\.css/.test(idx));

  /* ---------------- primitives in the design-system markup ---------------- */
  ADE.reset('returning'); go('#/p/borrowbox');
  const dash = html();
  ok('CostPosture: forecast-coloured zones, progress veil, budget mark and a framed forecast range (no forecast label or bracket)', /gauge__zones/.test(dash) && /gauge__rest/.test(dash) && /gauge__mark/.test(dash) && /gauge__range/.test(dash) && !/gauge__bracket|gauge__tag--range|gauge__above/.test(dash) && /--lo:[\d.]+%;--hi:/.test(dash));
  ok('AgentRun: step line uses Material icons, no ✓ ✗ ● → glyphs; attention is a note line, not a banner', /class="icon step-line__sep" data-icon="chevron_right"/.test(dash) && !/[✓✗●→]/.test(dash.replace(/<pre[\s\S]*?<\/pre>/g, '')) && /class="run__note/.test(dash) && !/run__attention/.test(dash));
  ok('EventRow: icon, text with trigger, outcome and time on the right', /class="event__icon"/.test(dash) && /class="event__side"/.test(dash));
  ADE.reset('returning'); go('#/p/borrowbox/work/W-100');
  ok('LiveDocument: children render in the aligned tree grid (title, id, owner, state, forecast)', /class="tree tree--inline"/.test(html()) && /class="meta tree__id"/.test(html()));
  const basisHtml = popupHtml({ kind: 'basis', args: { key: 'project:borrowbox' } });
  ok('SummaryBasisPopup: ranked facts and left-out reasons are separate elements (layout stacks them)', /<li><strong>[^<]+<\/strong><small>/.test(basisHtml) && /<small class="meta"> /.test(basisHtml));
  ADE.reset('returning'); go('#/p/borrowbox');
  ok('CostPosture: gauges keep text equivalents in their accessible name', /class="gauge[^"]*"[^>]*role="img" aria-label="Cost: Spent [^"]+Forecast[^"]+Budget/.test(dash));
  const unknownRel = ADE.state.projects.borrowbox.releases.find((r) => !r.timeRatio);
  go(`#/p/borrowbox/releases/${unknownRel.id}`);
  ok(`CostPosture: ${unknownRel.id} with no finish forecast renders “Forecast unknown”, never zero`, /class="gauge gauge--unknown"[\s\S]*?Forecast unknown/.test(html()));
  const bbp = ADE.state.projects.borrowbox; const row = ADE.policyRow(bbp, bbp.work.find((w) => w.status === 'open' && ADE.isLeaf(bbp, w)));
  ok('PolicyOutcome: verdict stamp with a rule link that opens the evaluation', /class="stamp stamp--(allow|decision|deny)"/.test(row) && /class="rule-link" data-act="policyEval"/.test(row));
  ok('RiskCard: gallery card with mini matrix (now/target), level chips and generated policy line', /class="card risk" data-risk="R-/.test(dash) && /class="c l\d now"/.test(dash) && /risk__states/.test(dash) && /class="risk__policy"/.test(dash));
  ok('DimensionBadge: gallery level ramp with meter', /class="dim level--(low|medium|high|unknown)"/.test(dash));
  ok('DimensionBadge: shows the dimension only; level in the accessible name and tooltip, never in the visible text', /<span class="dim level--high" role="img" aria-label="(\w+): high" title="\1: high"><span class="dim__meter" aria-hidden="true"><i><\/i><i><\/i><i><\/i><\/span><span aria-hidden="true">\1<\/span><\/span>/.test(ADE.level('customer', 'high')) && !/ · (low|medium|high|unknown)</.test(dash));
  ok('WorkspaceShell: person avatars carry their tint', /avatar avatar--tomas/.test(dash));

  /* ---------------- RiskLayout ---------------- */
  go('#/p/borrowbox/risks');
  const rh = html(); const p = P('borrowbox');
  ok('RiskLayout: cards first, sticky matrix aside after them', rh.indexOf('risk-layout__cards') > -1 && rh.indexOf('risk-layout__cards') < rh.indexOf('risk-layout__matrix'));
  const cell = p.risks.filter((r) => r.status !== 'closed' && r.now[0]).map((r) => `${r.now[0]}-${r.now[1]}`)[0];
  const inCell = p.risks.filter((r) => r.status !== 'closed' && `${r.now[0]}-${r.now[1]}` === cell).length;
  ok('RiskLayout: occupied cells are filter links; chips and cards share data-risk for hover', /class="risk-matrix__filter" href="#\/p\/borrowbox\/risks\?cell=/.test(rh) && /class="risk-matrix__chip" data-risk="R-/.test(rh));
  go(`#/p/borrowbox/risks?cell=${cell}`);
  const fh = html(); const cards = (fh.match(/class="card risk" data-risk=/g) || []).length;
  ok(`RiskLayout: ?cell=${cell} shows only that cell's ${inCell} card(s), says so and offers Show all`, cards === inCell && /Showing \d+ of \d+ risks/.test(fh) && /Show all/.test(fh) && /aria-current="true"/.test(fh));
  ok('RiskLayout: the matrix keeps every open risk while the cards are filtered', (fh.match(/class="risk-matrix__chip"/g) || []).length >= (rh.match(/class="risk-matrix__chip"/g) || []).length);
  go('#/p/borrowbox/risks?cell=1-1');
  ok('RiskLayout: an empty cell filter shows the empty state, not an error', /No risks match|Showing 0 of/.test(html()));
  go(`#/p/borrowbox/risks?cell=${cell}&risk=R-07`);
  ok('RiskLayout: the risk popup opens over a filtered view', /class="matrix"/.test(popupHtml({ kind: 'risk', args: { pid: 'borrowbox', rid: 'R-07' } })));

  /* ---------------- Pager ---------------- */
  go('#/p/borrowbox/knowledge?tab=facts&superseded=1');
  const total = p.facts.length;
  ok(`Pager: facts (${total}) page 1 shows 1–${ADE.PAGE_SIZE} of ${total}, current page announced`, total > ADE.PAGE_SIZE && new RegExp(`1–${ADE.PAGE_SIZE} of ${total}`).test(html()) && /aria-current="page" aria-label="Page 1, current"/.test(html()) && (html().match(/<tr class="[^"]*"><td>/g) || []).length === ADE.PAGE_SIZE);
  go('#/p/borrowbox/knowledge?tab=facts&superseded=1&page=2');
  ok('Pager: page 2 shows the remainder and keeps filters in its links', new RegExp(`${ADE.PAGE_SIZE + 1}–${total} of ${total}`).test(html()) && /href="#\/p\/borrowbox\/knowledge\?tab=facts&amp;superseded=1"/.test(html()));
  go('#/p/borrowbox/knowledge?tab=facts&superseded=1&page=99');
  ok('Pager: an out-of-range page clamps to the last page', new RegExp(`${ADE.PAGE_SIZE + 1}–${total} of ${total}`).test(html()));
  go('#/p/skillhaven/knowledge?tab=facts');
  ok('Pager: absent when the rows fit one page', !/class="pager"/.test(html()));
  const src = ADE.pager(Array.from({ length: 23 }, (_, i) => i), { page: 2, label: 'Sources', link: (n) => `#/x?page=${n}` });
  ok('Pager: 23 sources → 11–20, first/previous/next/last links, gaps collapse', src.rows[0] === 10 && src.rows.length === 10 && /11–20 of 23/.test(src.html) && /aria-label="First page"/.test(src.html) && /aria-label="Last page"/.test(src.html));

  /* ---------------- DiffViewer ---------------- */
  ADE.reset('returning'); as('sofia');
  const run139 = p && ADE.state.projects.borrowbox.runs.find((r) => r.id === 'RUN-0139');
  act('reviewOpen', { pid: 'borrowbox', run: 'RUN-0139' });
  const rv = pop();
  ok(`DiffViewer: review → changed files shows ${run139.files.length} collapsed per-file diffs with line numbers`, (rv.match(/<details class="diff-file">/g) || []).length === run139.files.length && /class="code diff"/.test(rv) && /class="ln">\d+/.test(rv));
  ok('DiffViewer: labelled synthetic, full screen available, never the only evidence', /synthetic excerpts, not the evidence of record/.test(rv) && /data-fs="#diff-RUN-0139-review"/.test(rv) && /Acceptance rests on the criteria, checks and evidence/.test(rv) && /Acceptance criteria and required checks/.test(rv) && !/Per-file diffs come with the hi-fi/.test(rv));
  const d = ADE.syntheticDiff({ path: 'src/a/b.ts', add: 42, del: 7 });
  ok('DiffViewer: synthetic excerpt is deterministic and states the lines it omits', d === ADE.syntheticDiff({ path: 'src/a/b.ts', add: 42, del: 7 }) && /… 40 more changed lines/.test(d));
  act('popupClose');

  /* ---------------- StepDetail ---------------- */
  ADE.reset('returning'); go('#/p/borrowbox/activity?run=RUN-0142');
  const sd = html();
  ok('StepDetail: every effective step of RUN-0142 expands', (sd.match(/class="step-detail__item is-/g) || []).length === ADE.runSteps(ADE.state.projects.borrowbox, ADE.state.projects.borrowbox.runs.find((r) => r.id === 'RUN-0142')).length);
  ADE.reset('returning'); go('#/p/borrowbox/activity?run=RUN-0139');
  const reviewStep = ADE.runSteps(ADE.state.projects.borrowbox, ADE.state.projects.borrowbox.runs.find((r) => r.id === 'RUN-0139')).find((s) => s.addedBy);
  ok('StepDetail: a policy-added human step says who added it', !reviewStep || new RegExp(`added by ${reviewStep.addedBy}`).test(html()));
  ok('StepDetail: Build shows the step model override, compact session, pinned skill and visits 2 of 4', /synthetic-model-XL <span class="meta">\(step override\)/.test(sd) && /<dt>Session<\/dt><dd>compact/.test(sd) && /build@2\.1\.0/.test(sd) && /2 of 4; then help/.test(sd));
  ok('StepDetail: Specify shows its gate result, each knowledge fetch and a synthetic compiled prompt', /spec-present<\/code> · passed/.test(sd) && /Knowledge fetched/.test(sd) && /data-src="S-1"/.test(sd) && /Compiled prompt <span class="meta">\(synthetic\)/.test(sd) && /AC1:/.test(sd));
  ok('StepDetail: Test shows its command and recorded outcomes', /<code>npm test<\/code>/.test(sd) && /<dt>Outcomes<\/dt><dd>fail/.test(sd));
  ok('StepDetail: console and run diff keep full screen', /data-fs="#console-RUN-0142"/.test(sd) && /data-fs="#diff-RUN-0142-run"/.test(sd));

  /* ---------------- drag reordering ---------------- */
  ADE.reset('returning'); go('#/p/borrowbox/work?reorder=1');
  const tr = html();
  ok('Drag: reorder mode adds a drag handle beside move up/down (keyboard path kept)', /class="tree__drag" draggable="true" data-drag="W-/.test(tr) && /data-act="workMove"/.test(tr) && /data-wid="W-100" data-parent=""/.test(tr));
  const bb = ADE.state.projects.borrowbox; const rootsBefore = ADE.roots(bb).map((w) => w.id);
  const moves = ADE.dragMoves(bb, rootsBefore[0], rootsBefore[2]);
  moves.forEach((m) => ADE.dispatch('workMove', m));
  const rootsAfter = ADE.roots(bb).map((w) => w.id);
  ok(`Drag: dropping ${rootsBefore[0]} on ${rootsBefore[2]} = ${moves.length} workMove steps, same result as moving down twice`, moves.length === 2 && rootsAfter[2] === rootsBefore[0] && rootsAfter[0] === rootsBefore[1]);
  const kid = bb.work.find((w) => w.parentId); ok('Drag: dropping onto a non-sibling moves nothing', ADE.dragMoves(bb, rootsAfter[0], kid.id).length === 0);
  as('elena'); go('#/p/borrowbox/work?reorder=1');
  const own = bb.work.filter((w) => w.owner === 'elena').map((w) => w.id); const handles = [...html().matchAll(/data-drag="(W-\d+)"/g)].map((m) => m[1]);
  ok('Drag: handles only on items the viewer may order (grant-checked like the buttons)', handles.length > 0 && handles.every((h) => own.includes(h)));
  const before = JSON.stringify(ADE.roots(bb).map((w) => w.id)); ADE.dispatch('workMove', { pid: 'borrowbox', wid: rootsAfter[0], dir: 1 });
  ok('Drag: a denied move changes nothing and explains', JSON.stringify(ADE.roots(bb).map((w) => w.id)) === before && /Only/.test(ADE.ui.toast || ''));
  ADE.reset('returning');
}
