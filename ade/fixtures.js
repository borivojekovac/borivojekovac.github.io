// ADE v3 lo-fi prototype · deterministic synthetic fixtures. No value here is produced by an ADE runtime.
(function (root) {
  const ADE = (root.ADE = root.ADE || {});

  const people = {
    tomas: { id: 'tomas', name: 'Tomas Weber', initials: 'TW', role: 'Product owner', expertise: 'Product owner. Comfortable with budgets, customer outcomes and release planning. Not a developer: explain technical terms in one plain sentence and lead with cost and risk.' },
    sofia: { id: 'sofia', name: 'Sofia Lindberg', initials: 'SL', role: 'Delivery lead', expertise: 'Delivery lead and hands-on engineer. Knows the repositories, CI and agent runners. Wants exact files, commands and evidence.' },
    elena: { id: 'elena', name: 'Elena Rossi', initials: 'ER', role: 'Domain expert', expertise: 'Runs day-to-day library and service operations. Knows the real process and exceptions. Prefers concrete examples over diagrams.' },
    matej: { id: 'matej', name: 'Matej Novak', initials: 'MN', role: 'Architect', expertise: 'Software architect. Cares about boundaries, consistency, concurrency and adequate evidence. Wants the technical detail first.' },
    nina: { id: 'nina', name: 'Nina Petrović', initials: 'NP', role: 'New member', expertise: 'New to ADE. Runs a small team and wants to start a first project.' },
  };

  const categories = {
    product: { label: 'Product', icon: 'flag' },
    domain: { label: 'Business domain', icon: 'menu_book' },
    architecture: { label: 'Architecture', icon: 'account_tree' },
    engineering: { label: 'Engineering review', icon: 'code' },
    commercial: { label: 'Commercial', icon: 'euro_symbol' },
  };

  const policyReadme = [
    'Project policy decides when agents and people may act without asking, and who must decide otherwise.',
    'Active values are bound to a revision. Every evaluation records the revision it used.',
    'Typed language creates a proposal. It never changes the active policy by itself.',
    'Validation checks the shape of the contract and that every rule stays inside the project.',
    'Activation by the accountable owner creates a new revision. Work already started keeps the revision it was evaluated with.',
    'An agent may propose policy, but never becomes the policy authority. Verdicts are deterministic: the same facts and revision always give the same outcome.',
  ];
  const routingReadme = [
    'Contribution routing names who answers each kind of question and who may delegate.',
    'Each category has one designated person. Delegation is allowed only to people listed as eligible.',
    'Changing routing never reassigns work already answered; open requests move only after activation.',
  ];

  function policyContract(scope, limit) {
    return {
      revision: 7,
      json: {
        revision: '7',
        scope,
        limits: { agentRunMax: limit, pauseAtReservationPct: 80, releaseReserveMaxPct: 90 },
        rules: [
          { id: 'P1', when: { action: 'start-agent', targetOutsideGrant: true }, outcome: 'deny' },
          { id: 'P2', when: { action: 'start-agent', forecastHighAboveLimit: true }, outcome: 'needs-decision', assign: 'accountable-owner' },
          { id: 'P3', when: { action: 'start-agent', customerVisibleChange: true, authority: 'contributor' }, outcome: 'needs-decision', assign: 'accountable-owner' },
          { id: 'P4', when: { action: 'start-agent', riskAtMost: 'medium' }, outcome: 'allow', requires: ['human-review'] },
          { id: 'P5', when: { action: 'start-agent', riskAbove: 'medium' }, outcome: 'needs-decision', assign: 'architecture' },
          { id: 'P6', when: { trigger: 'contribution-completed' }, outcome: 'allow', action: 're-evaluate-readiness' },
          { id: 'P7', when: { trigger: 'source-changed', materiality: 'low' }, outcome: 'allow', action: 'regenerate-summaries' },
        ],
      },
      readme: policyReadme,
      history: [
        { revision: 6, date: '2 Sep', by: 'tomas', change: 'Added the pause at 80 % of a run reservation.' },
        { revision: 7, date: '11 Sep', by: 'tomas', change: 'Customer-visible changes started by contributors need the accountable owner.' },
      ],
      proposal: null,
    };
  }
  function routingContract(map) {
    return {
      revision: 3,
      json: { revision: '3', categories: map },
      readme: routingReadme,
      history: [{ revision: 3, date: '4 Sep', by: 'tomas', change: 'Elena may delegate business-domain questions to Sofia.' }],
      proposal: null,
    };
  }

  const agentsReadme = [
    'Agent profiles say how an agent works on a work item: which model and runner it uses, which MCP servers it may call, its limits, and its workflow.',
    'A workflow is a small graph of steps. Step kinds: agent (runs a skill with a model), check (a deterministic command such as the tests), human (a person chooses an outcome) and end.',
    'Transitions use `next`, or `on` with a named deterministic outcome (pass/fail, approved/changes-requested). A model never chooses the branch.',
    'A step that can be visited again has `maxVisits` and `onExhausted`. The run reservation also bounds every loop.',
    'An agent step may override the profile model and says whether it starts a new session, continues the previous one, or continues from a compacted summary.',
    'Project policy wins: it can add a human step (for example human review before output counts). A profile cannot remove a step that policy requires.',
    'Draft decision P5-D1: this graph relaxes the "no general workflow language" line of SPEC-ARCH-08 and is not yet an approved requirement.',
  ];
  const skillsReadme = [
    'Skills are the instructions the ade-skills MCP server hands to an agent step. Each skill is pinned to an exact version.',
    'A profile step names a skill by id and version. Changing a pin creates a new revision; running work keeps the version it started with.',
    'Knowledge is not a skill: agents fetch project facts and sources from the ade-knowledge MCP server, scoped to this project.',
  ];
  const settingsReadme = [
    'Project settings hold values that every screen uses to show amounts and time: currency, time zone, hours in a working day and an optional human day rate.',
    'Human time is shown in days (logged hours divided by the working-day hours). Agent time is shown in hours and minutes. Money is shown in the project currency.',
    'Date and number formats are personal preferences in your profile, not project settings.',
    'Changing the currency relabels amounts; the prototype has no exchange rates and converts nothing.',
  ];
  const step = (kind, title, p = {}) => ({ kind, title, ...p });
  function agentsContract() {
    return {
      revision: 2,
      json: {
        revision: '2',
        defaults: { implementation: 'direct', investigation: 'investigate' },
        profiles: {
          'spec-tdd': {
            title: 'Spec-kit, test-driven', model: 'synthetic-model-L', runner: 'Local sandbox · container, no network', mcps: ['ade-knowledge', 'ade-skills'], limits: { maxMinutes: 180 }, budget: { reservation: 'forecast-high' },
            workflow: {
              start: 'specify',
              steps: {
                specify: step('agent', 'Specify', { skill: 'specify@1.2.0', knowledge: ['work-item', 'acceptance-criteria', 'attachments'], session: 'new', produces: ['spec.md'], gate: 'spec-present', next: 'approve-spec' }),
                'approve-spec': step('human', 'Approve spec', { who: 'work-owner', on: { approved: 'plan', 'changes-requested': 'specify' }, maxVisits: 3, onExhausted: 'give-up' }),
                plan: step('agent', 'Plan', { skill: 'plan@1.0.3', knowledge: ['spec.md', 'code-map'], session: 'continue', produces: ['plan.md'], gate: 'plan-present', next: 'build' }),
                build: step('agent', 'Build', { skill: 'build@2.1.0', knowledge: ['plan.md', 'code-map'], session: 'compact', model: 'synthetic-model-XL', next: 'test', maxVisits: 4, onExhausted: 'help' }),
                test: step('check', 'Test', { command: 'npm test', on: { pass: 'document', fail: 'build' } }),
                document: step('agent', 'Document', { skill: 'document@1.0.0', knowledge: ['spec.md', 'docs-map'], session: 'new', model: 'synthetic-model-S', next: 'submit' }),
                submit: step('end', 'Submit', { outcome: 'submitted' }),
                help: step('human', 'Ask the work owner', { who: 'work-owner', on: { retry: 'build', stop: 'give-up' } }),
                'give-up': step('end', 'Stop', { outcome: 'stopped' }),
              },
            },
          },
          direct: {
            title: 'Direct build', model: 'synthetic-model-L', runner: 'Local sandbox · container, no network', mcps: ['ade-knowledge', 'ade-skills'], limits: { maxMinutes: 90 }, budget: { reservation: 'forecast-high' },
            workflow: {
              start: 'build',
              steps: {
                build: step('agent', 'Build', { skill: 'build@2.1.0', knowledge: ['work-item', 'acceptance-criteria', 'attachments', 'code-map'], session: 'new', next: 'test', maxVisits: 3, onExhausted: 'help' }),
                test: step('check', 'Test', { command: 'npm test', on: { pass: 'submit', fail: 'build' } }),
                submit: step('end', 'Submit', { outcome: 'submitted' }),
                help: step('human', 'Ask the work owner', { who: 'work-owner', on: { retry: 'build', stop: 'give-up' } }),
                'give-up': step('end', 'Stop', { outcome: 'stopped' }),
              },
            },
          },
          investigate: {
            title: 'Investigate (read-only)', model: 'synthetic-model-M', runner: 'Local sandbox · read-only checkout, no network', mcps: ['ade-knowledge', 'ade-skills'], limits: { maxMinutes: 60, readOnly: true }, budget: { reservation: 'forecast-high' },
            workflow: {
              start: 'investigate',
              steps: {
                investigate: step('agent', 'Investigate', { skill: 'investigate@0.9.1', knowledge: ['work-item', 'attachments', 'code-map'], session: 'new', produces: ['findings.md'], gate: 'findings-cite-sources', next: 'report' }),
                report: step('end', 'Record findings', { outcome: 'complete' }),
              },
            },
          },
        },
      },
      readme: agentsReadme,
      history: [
        { revision: 1, date: '1 Sep', by: 'tomas', change: 'Direct build and read-only investigation profiles.' },
        { revision: 2, date: '8 Sep', by: 'tomas', change: 'Added the spec-kit, test-driven profile with per-step models and sessions.' },
      ],
      proposal: null,
    };
  }
  function skillsContract() {
    return {
      revision: 4,
      json: {
        revision: '4',
        server: 'ade-skills',
        skills: {
          specify: { version: '1.2.0', pinned: true, purpose: 'Turn a work item and its attachments into a short spec with numbered acceptance criteria.' },
          plan: { version: '1.0.3', pinned: true, purpose: 'Plan the change against the spec and the code map; list files and tests.' },
          build: { version: '2.1.0', pinned: true, purpose: 'Implement the plan with tests, inside the item scope.' },
          document: { version: '1.0.0', pinned: true, purpose: 'Update the documentation repository for the change.' },
          investigate: { version: '0.9.1', pinned: true, purpose: 'Answer a question from code and sources without changing anything; cite every claim.' },
        },
      },
      readme: skillsReadme,
      history: [{ revision: 4, date: '8 Sep', by: 'sofia', change: 'Pinned specify 1.2.0.' }],
      proposal: null,
    };
  }
  function settingsContract(timeZone = 'Europe/Ljubljana') {
    return {
      revision: 1,
      json: { revision: '1', currency: 'EUR', timeZone, workingDayHours: 8, humanDayRate: 480 },
      readme: settingsReadme,
      history: [{ revision: 1, date: '1 Sep', by: 'tomas', change: 'Project settings created.' }],
      proposal: null,
    };
  }

  // Money in automation texts is written as {limit} (the policy run limit) or {m:N}; screens format it in the project currency.
  const automations = () => [
    { id: 'AU-1', title: 'Keep summaries current', trigger: 'A source, decision or work state changes', action: 'Mark affected project and release summaries outdated, then regenerate them on the next tick', rule: 'P7', limit: 'Up to {m:1} per regeneration', state: 'active', last: 'Today 09:52' },
    { id: 'AU-2', title: 'Re-check readiness after answers', trigger: 'A contribution, decision or dependency is completed', action: 'Re-evaluate readiness and policy for the work it blocked', rule: 'P6', limit: 'No spend', state: 'active', last: 'Yesterday 16:20' },
    { id: 'AU-3', title: 'Start eligible internal work', trigger: 'Internal work becomes ready (all checks pass, every dependency done)', action: 'Start the default implementation profile if the forecast is at most {limit}', rule: 'P4', limit: '{limit} per run · human review required', state: 'active', last: 'Mon 11:05' },
    { id: 'AU-4', title: 'Pause runs near their reservation', trigger: 'A run reaches 80 % of its reservation', action: 'Pause the run and ask the work owner', rule: 'limits.pauseAtReservationPct', limit: 'Always', state: 'active', last: 'Never fired' },
    { id: 'AU-5', title: 'Refresh forecasts', trigger: 'Every night at 02:00', action: 'Recompute forecasts from actuals and flag variance', rule: 'P7', limit: 'No spend', state: 'active', last: 'Today 02:00' },
  ];

  // Work item fixture. purpose: one sentence. inScope, outScope: lists of items. ac: acceptance criteria (numbered AC1…). doneExtra: hand-added "done when" items.
  // checks: only item-specific blocking checks, typed by kind (decision | source | grant | manual). Standard checks are computed in model.js.
  // readiness here is a fixture hint only: model.js derives `confirmed` from it and then computes readiness from state.
  // spend: provider money and human days are separate kinds; agent money = actual - provider.
  const W = (id, parentId, title, p = {}) => ({ id, parentId, title, status: 'open', readiness: 'not-ready', checks: [], forecast: null, actual: 0, provider: 0, humanDays: 0, risks: [], sources: [], deps: [], questions: [], comments: [], customerVisible: false, purpose: '', inScope: [], outScope: [], ac: [], doneExtra: [], ...p });
  const chk = {
    decision: (ref, text, state) => ({ id: `decision:${ref}`, kind: 'decision', ref, text, ...(state ? { state } : {}) }),
    source: (ref, text) => ({ id: `source:${ref}`, kind: 'source', ref, text }),
    grant: () => ({ id: 'grant', kind: 'grant', text: 'Deploy target inside the project grant', fix: 'Request the pilot environment grant (risk R-10)' }),
    manual: (id, text, fix, state) => ({ id, kind: 'manual', ok: false, text, fix, ...(state ? { state } : {}) }),
    assignment: (ref, text) => ({ id: `assignment:${ref}`, kind: 'assignment', ref, text, state: 'needs-decision' }),
  };

  /* ------------------------------------------------------------------ Borrowbox */
  const borrowbox = {
    id: 'borrowbox', name: 'Borrowbox', kind: 'Greenfield', owner: 'tomas', access: ['tomas', 'sofia', 'elena', 'matej'],
    description: 'Let the Riverside community library lend books without paper cards: members find a book, see whether a copy is on the shelf, borrow and return it and get due-date reminders, and staff always know where every copy is.',
    budget: { eur: 12000, planned: '18 Dec', start: '1 Sep', forecastFinish: '18–30 Dec', timeRatio: [0.9, 0.97, 0.28, 0.9] },
    capacity: { slots: 2 },
    lastSeen: 'yesterday 17:40',
    sources: [
      { id: 'S-1', title: 'loan-policy.md', kind: 'Document', provenance: 'borrowbox-docs · docs/policy/', revision: '42c9', freshness: 'current', status: 'accepted', purpose: 'Accepted lending rules for members and staff.', markdown: '# Loan policy\n\n## 1 Who may borrow\nAny member with an active library card may borrow up to **5 books** at a time.\n\n## 2 Availability\n==A book must show as unavailable in the same operation that saves the loan.== A second member searching the same title must never see a lent copy as available.\n\n## 3 Due dates\nThe standard loan period is 21 days. Staff may extend once.\n\n## 4 Out of scope\nFines and payments are handled outside Borrowbox.' },
      { id: 'S-2', title: 'release-plan.md', kind: 'Document', provenance: 'borrowbox-docs · docs/plan/', revision: 'e7b1', freshness: 'current', status: 'accepted', purpose: 'Releases, budgets and planned dates.', markdown: '# Release plan\n\n| Release | Budget | Planned |\n|---|---|---|\n| First loan, clearly available | €3,600 | 14 Oct |\n| Never miss a due date | €2,800 | 18 Nov |\n| Staff see every copy | €4,200 | 18 Dec |\n\n==€1,120 of the first release budget is unallocated.==' },
      { id: 'S-3', title: 'domain-notes.md', kind: 'Document', provenance: 'borrowbox-docs · docs/domain/', revision: '18aa', freshness: 'current', status: 'accepted', purpose: 'How the library actually works day to day.', markdown: '# Domain notes\n\nMembers often ask staff to move a due date when they are ill. ==Staff do this today on paper and write the reason on the card.==\n\nDamaged copies are set aside at the returns desk; whether the member pays is decided case by case.' },
      { id: 'S-4', title: 'legacy-notes.md', kind: 'Document', provenance: 'imported · shared drive', revision: '03d1', freshness: 'stale', status: 'stale', purpose: 'Notes from the previous paper process.', markdown: '# Legacy notes\n\n==Availability is refreshed every night from the card index.==\n\n(Written before the loan policy was accepted.)' },
      { id: 'S-5', title: 'member-survey-2026.pdf', kind: 'Import', provenance: 'uploaded by Tomas · 3 Sep', revision: 'b210', freshness: 'current', status: 'partial', purpose: 'What 212 members said they want.', markdown: '# Member survey 2026 (extracted text)\n\n- 71 % want to see if a book is on the shelf before walking in.\n- ==64 % would like a reminder two days before the due date.==\n- Table on page 4 could not be extracted.' },
      { id: 'S-6', title: 'borrowbox-app', kind: 'Code repository', provenance: 'git.example/borrowbox/app · main', revision: '9f3a1c2', freshness: 'current', status: 'connected', purpose: 'Application code.', markdown: '# borrowbox-app @ 9f3a1c2 (synthetic)\n\n```\nsrc/loans/save-loan.ts\nsrc/catalogue/search.ts\nsrc/members/sign-in.ts\ntests/loans/save-loan.test.ts\n```' },
      { id: 'S-7', title: 'borrowbox-docs', kind: 'Documentation repository', provenance: 'git.example/borrowbox/docs · main', revision: '5c77e10', freshness: 'current', status: 'connected', purpose: 'Authored documentation, separate from code.', markdown: '# borrowbox-docs @ 5c77e10 (synthetic)\n\n```\ndocs/policy/loan-policy.md\ndocs/plan/release-plan.md\ndocs/domain/domain-notes.md\n```' },
      { id: 'S-8', title: 'staff-interview-notes.md', kind: 'Document', provenance: 'borrowbox-docs · docs/domain/', revision: 'a91f', freshness: 'current', status: 'accepted', purpose: 'Interview with two library staff members.', markdown: '# Staff interview notes\n\n"We scan returns in batches at 5 pm." ==Returns are scanned in batches, so availability can lag at the desk.==' },
      { id: 'S-9', title: 'barcode-format.txt', kind: 'Document', provenance: 'Matej · private drive', revision: '—', freshness: 'unknown', status: 'inaccessible', purpose: 'Format of the existing copy barcodes.', markdown: '' },
      { id: 'S-10', title: 'api-sketch.yaml', kind: 'Document', provenance: 'proposed by agent · run 0138', revision: 'p-02', freshness: 'current', status: 'proposed', purpose: 'Proposed loan and catalogue endpoints.', markdown: '# API sketch (proposed)\n\n```yaml\nPOST /loans\n  body: { memberId, copyId, dueDate }\n  effect: saves loan and marks copy unavailable atomically\n```' },
    ],
    facts: [
      { id: 'F-1', text: 'A lent copy must show as unavailable in the same operation that saves the loan.', kind: 'Source-grounded', source: 'S-1', usedBy: ['W-121', 'R-07'] },
      { id: 'F-2', text: 'Availability is refreshed nightly from the card index.', kind: 'Conflict', source: 'S-4', conflictWith: 'F-1', usedBy: [] },
      { id: 'F-3', text: 'Staff move due dates today and write the reason on the card.', kind: 'Observed', source: 'S-3', usedBy: ['W-123'] },
      { id: 'F-4', text: 'Standard loan period is 21 days; staff may extend once.', kind: 'Source-grounded', source: 'S-1', usedBy: ['W-121'] },
      { id: 'F-5', text: '64 % of surveyed members want a reminder two days before the due date.', kind: 'Source-grounded', source: 'S-5', usedBy: ['W-210'] },
      { id: 'F-6', text: 'Returns are scanned in batches at 5 pm.', kind: 'Observed', source: 'S-8', usedBy: ['W-311', 'R-07'] },
      { id: 'F-7', text: 'Fines and payments are handled outside Borrowbox.', kind: 'Source-grounded', source: 'S-1', usedBy: ['W-3122'] },
      { id: 'F-8', text: 'POST /loans saves the loan and marks the copy unavailable atomically.', kind: 'Proposed', source: 'S-10', usedBy: ['W-121'] },
      { id: 'F-9', text: 'Whether a member pays for a damaged copy is decided case by case.', kind: 'Open question', source: 'S-3', usedBy: ['W-3122'] },
      { id: 'F-10', text: 'Barcode format of existing copies.', kind: 'Unknown', source: 'S-9', usedBy: ['W-311'] },
      { id: 'F-11', text: '€1,120 of the first release budget is unallocated.', kind: 'Forecast', source: 'S-2', usedBy: ['REL-1'] },
      { id: 'F-12', text: 'Members may borrow up to 5 books at a time.', kind: 'Source-grounded', source: 'S-1', usedBy: ['W-121'] },
    ],
    questions: [
      { id: 'KQ-1', q: 'How fast must a book show as unavailable?', keys: ['unavailable', 'availability', 'fast', 'lent', 'available'], answer: 'In the same operation that saves the loan. The accepted loan policy requires it; an older note saying availability refreshes nightly is stale and conflicts with it.', facts: ['F-1', 'F-2', 'F-8', 'F-6'] },
      { id: 'KQ-2', q: 'Can a borrower correct a due date?', keys: ['correct', 'due', 'date', 'extend'], answer: 'Today staff move due dates on paper and note a reason; policy allows one extension. Whether members may correct it themselves in Borrowbox is still a pending decision.', facts: ['F-3', 'F-4'], decision: 'D-12' },
      { id: 'KQ-3', q: 'What is out of scope?', keys: ['scope', 'out', 'excluded', 'included'], fromWork: 'outScope', answer: '', facts: ['F-7', 'F-11'] },
      { id: 'KQ-4', q: 'Who decides if a member pays for a damaged copy?', keys: ['damaged', 'pay', 'charge', 'replacement'], answer: 'Nobody in Borrowbox yet: staff decide case by case, and fines are out of scope. This is an open question assigned to the business domain.', facts: ['F-9', 'F-7'] },
    ],
    work: [
      W('W-100', null, 'Lending basics', { purpose: 'Members can find, borrow and return books without paper cards.', inScope: ['Catalogue search with live availability', 'Loans and returns', 'Member accounts with library-card sign-in'], outScope: ['Fines and payments: staff handle them outside Borrowbox', 'Inter-library loans: they need other libraries\' systems', 'E-books: separate licensing'], owner: 'sofia' }),
      W('W-110', 'W-100', 'Find a book to borrow', { purpose: 'Members see what is on the shelf before they walk in.', owner: 'sofia', customerVisible: true }),
      W('W-111', 'W-110', 'Search by title', { status: 'done', forecast: [450, 600], actual: 720, provider: 30, humanDays: 2, owner: 'sofia', customerVisible: true, sources: ['S-1'], risks: ['R-11'], purpose: 'Members find a book by typing part of its title.', inScope: ['Title search over the catalogue with partial matches'], outScope: ['Author and series search (W-112)'], ac: ['Typing part of a title lists matching books within one second.'] }),
      W('W-112', 'W-110', 'Search by author and series', { status: 'review', forecast: [380, 520], actual: 410, humanDays: 1.5, owner: 'sofia', customerVisible: true, purpose: 'Members find books by an author or in a series.', inScope: ['Author and series filters on the search page'], outScope: ['Recommendations'], ac: ['Searching an author lists all their books.', 'A series shows its books in order.'] }),
      W('W-113', 'W-110', 'Show availability in search results', { status: 'in-progress', readiness: 'ready', forecast: [250, 420], actual: 38, humanDays: 1, owner: 'sofia', customerVisible: true, risks: ['R-07'], sources: ['S-1', 'S-8'], purpose: 'Members see whether a copy is on the shelf before they walk in.', inScope: ['An available/lent marker per book in search results, read from the loan records'], outScope: ['Reservations and holds'], ac: ['A lent copy shows as lent in search results.', 'A returned copy shows as available after its return is saved.'] }),
      W('W-120', 'W-100', 'Track loans and due dates', { purpose: 'Every loan has a borrower, a copy and a due date staff can trust.', owner: 'sofia', customerVisible: true }),
      W('W-121', 'W-120', 'Save a loan and update availability', {
        readiness: 'needs-decision', forecast: [65, 130], humanDays: 2, owner: 'sofia', customerVisible: true, risks: ['R-07', 'R-08'], sources: ['S-1', 'S-2', 'S-3', 'S-10'], deps: ['W-111'],
        purpose: 'Borrowers must never see a book as available once it has been lent. This is the first step of the first-loan outcome and the base for reminders later.',
        inScope: ['Record the loan against the borrower, lower the copy\'s availability in the same operation, and keep the original reason if a due date is corrected later'],
        outScope: ['Reminders (W-210) and fines', 'Returning a book is its own item (W-122)'],
        ac: ['A saved loan is visible on the borrower\'s page.', 'A second borrower searching the same title sees it as unavailable within the same request.', 'The due-date correction rule decided by the owner is implemented.'],
        doneExtra: ['Matej\'s two-borrower concurrency test passes.'],
        checks: [chk.decision('D-12', 'Due-date correction rule decided')],
        questions: [{ id: 'Q-31', text: 'Can a borrower correct the due date after the loan is saved, and does that change availability?', category: 'domain', assignment: 'A-31', decision: 'D-12', anchor: 'keep the original reason if a due date is corrected later' }],
        comments: [
          { by: 'sofia', at: 'Mon 10:02', text: 'Keeping this at one transaction; the API sketch already does it.' },
          { by: 'matej', at: 'Mon 11:40', text: 'Agree. Please add the two-borrowers concurrency test to the done definition.' },
        ],
      }),
      W('W-122', 'W-120', 'Return a book', {
        readiness: 'not-ready', forecast: [90, 160], owner: 'sofia', customerVisible: true, sources: ['S-1', 'S-8'], deps: ['W-121'],
        purpose: 'Returning a book makes the copy available again straight away.', inScope: ['Mark the loan returned and raise availability in one operation'], outScope: ['Batch scanning at the desk is handled by W-311'],
        ac: ['A returned copy is available to the next member immediately.', 'The loan shows as returned on the member\'s page.'],
      }),
      W('W-123', 'W-120', 'Correct a due date with a reason', { readiness: 'blocked', forecast: [120, 240], owner: 'sofia', customerVisible: true, risks: ['R-08'], sources: ['S-3'], purpose: 'Staff can move a due date when a member is ill, without losing why.', inScope: ['Staff change a due date and record a reason; the history keeps every change'], outScope: ['Members changing their own due dates'], ac: ['A corrected due date shows the new date and the reason.', 'The previous due date stays in the history.'], checks: [chk.decision('D-12', 'Due-date correction rule decided', 'blocked')] }),
      W('W-130', 'W-100', 'Member accounts', { owner: 'sofia', customerVisible: true }),
      W('W-131', 'W-130', 'Sign in with library card number', { status: 'done', forecast: [300, 420], actual: 340, humanDays: 1.5, owner: 'sofia', customerVisible: true, purpose: 'Members sign in with the card they already have.', inScope: ['Card number and PIN sign-in'], outScope: ['Online registration'], ac: ['A member signs in with card number and PIN.'] }),
      W('W-132', 'W-130', 'Member loan history page', { readiness: 'not-ready', forecast: [200, 380], owner: 'sofia', customerVisible: true }),
      W('W-200', null, 'Never miss a due date', { purpose: 'Members return books on time without staff chasing them.', owner: 'tomas', customerVisible: true }),
      W('W-210', 'W-200', 'Send due-date reminders', {
        readiness: 'not-ready', forecast: [600, 1400], humanDays: 1, owner: 'tomas', customerVisible: true, risks: ['R-09'], sources: ['S-5'],
        purpose: 'Remind members before a book is due so fewer loans run late.', inScope: ['A reminder two days before the due date and on the day, by email first'], outScope: ['Text messages stay undecided until a provider is chosen'], ac: ['Late returns fall.', 'Members can see which reminders were sent.'],
        checks: [chk.manual('size', 'Small enough for one agent run', 'Split it: the forecast range is wide (€600–1,400)'), chk.manual('channel', 'Delivery channel decided', 'Covered by the split strategies')],
      }),
      W('W-220', 'W-200', 'Reminder preferences', { readiness: 'not-ready', forecast: [180, 300], owner: 'tomas', customerVisible: true }),
      W('W-300', null, 'Staff operations', { purpose: 'Staff always know where every copy is.', owner: 'elena' }),
      W('W-310', 'W-300', 'Returns desk', { owner: 'elena' }),
      W('W-311', 'W-310', 'Scan a returned copy', { readiness: 'blocked', owner: 'elena', risks: ['R-14'], sources: ['S-8', 'S-9'], purpose: 'Staff scan a returned copy instead of writing it down.', inScope: ['Scanning a copy barcode at the desk marks the loan returned'], outScope: ['Self-service return machines'], ac: ['Scanning a returned copy marks its loan returned.', 'An unknown barcode shows a clear message.'], checks: [chk.source('S-9', 'Barcode format known')] }),
      W('W-312', 'W-310', 'Handle a damaged copy', { owner: 'elena' }),
      W('W-3121', 'W-312', 'Record a damage note', { readiness: 'not-ready', forecast: [60, 110], owner: 'elena', purpose: 'Staff note what is damaged when a copy comes back.', inScope: ['A free-text note and a photo on the copy record'], outScope: ['Charges: whether a member pays is decided in W-3122'], ac: ['The next member and staff can see the damage note.'] }),
      W('W-3122', 'W-312', 'Decide a replacement charge', { readiness: 'needs-decision', owner: 'elena', decisionItem: true, sources: ['S-3'], purpose: 'Settle whether a member pays for a damaged copy and who decides.', inScope: ['A written rule staff can apply at the desk'], outScope: ['Taking payments: fines and payments stay outside Borrowbox'], ac: ['The rule is adopted as a project decision.'], questions: [{ id: 'Q-33', text: 'Does a member pay for a damaged copy, and who decides?', category: 'domain', assignment: 'A-33' }] }),
      W('W-320', 'W-300', 'Inventory overview', { owner: 'elena' }),
      W('W-321', 'W-320', 'Copies per title', { readiness: 'not-ready', forecast: [240, 400], owner: 'elena' }),
      W('W-322', 'W-320', 'Missing copy report', { readiness: 'not-ready', owner: 'elena', risks: ['R-12'] }),
      W('W-400', null, 'Platform foundations', { owner: 'matej' }),
      W('W-410', 'W-400', 'Loan data model and storage', { status: 'done', forecast: [200, 300], actual: 260, humanDays: 1.5, owner: 'matej', purpose: 'A storage model for loans and copies.', inScope: ['Tables for members, copies and loans'], outScope: ['Reporting views'], ac: ['A loan references one member and one copy.'] }),
      W('W-420', 'W-400', 'Deploy pilot environment', { outsideGrant: true, readiness: 'blocked', forecast: [150, 260], owner: 'matej', risks: ['R-10'], purpose: 'A pilot environment the library can try.', inScope: ['Deploy the app to the pilot host'], outScope: ['Production hosting'], ac: ['The pilot URL serves the current build.'], checks: [chk.grant()] }),
    ],
    releases: [
      { id: 'REL-1', name: 'First loan, clearly available', outcome: true, members: ['W-110', 'W-120', 'W-121', 'W-131', 'W-410'], budget: 3600, planned: '14 Oct', forecastFinish: '14–21 Oct', timeRatio: [0.54, 0.83, 0.375, 0.54] },
      { id: 'REL-2', name: 'Never miss a due date', outcome: true, members: ['W-200', 'W-132'], budget: 2800, planned: '18 Nov', forecastFinish: '18–28 Nov', timeRatio: [0.62, 0.78, 0.1, 0.62] },
      { id: 'REL-3', name: 'Staff see every copy', outcome: true, members: ['W-300', 'W-420'], budget: 4200, planned: '18 Dec', forecastFinish: 'Unknown', timeRatio: null },
    ],
    risks: [
      { id: 'R-07', title: 'A book can look available after it has been lent', consequence: 'Two members can be told the same copy is theirs; staff then have to call one of them back and the loan demo loses credibility.', status: 'open', dims: { customer: 'high', time: 'medium', evidence: 'medium' }, now: [2, 3], target: [1, 2], owner: 'sofia', treatment: 'Save the loan and availability in one transaction and add a two-borrower concurrency test.', costImpact: '+€120 if a spike is needed', timeImpact: '+2 days', affects: ['W-121', 'W-113'], evidence: ['S-1', 'S-8'],
        responses: [
          { id: 'mitigate', title: 'Add a concurrency spike before the run', desc: 'A one-day agent spike proves the transaction under two parallel borrowers.', chips: ['+€120', '+1 day', 'Risk to low'], creates: { title: 'Spike: prove loan save under two parallel borrowers', forecast: [80, 120], parent: 'W-120' } },
          { id: 'accept', title: 'Accept and cover it in the done definition', desc: 'Keep the concurrency test in W-121\'s done definition; no extra work.', chips: ['€0', '0 days', 'Risk stays medium'] },
        ],
        comments: [{ by: 'elena', at: 'Tue 09:12', text: 'At the desk, returns are scanned at 5 pm, so a copy can look lent for hours too.' }] },
      { id: 'R-08', title: 'Due-date correction rule is undecided', consequence: 'Until the rule is chosen, due dates may be corrected differently at the desk and online, and two loan items cannot be finished.', status: 'needs-owner', dims: { scope: 'medium', time: 'medium', authority: 'high' }, now: [3, 2], target: [1, 1], owner: 'tomas', treatment: 'Decide the rule (decision D-12).', costImpact: '€0–240 depending on the rule', timeImpact: 'Blocks W-121 and W-123', affects: ['W-121', 'W-123'], evidence: ['S-3'], responses: [], comments: [] },
      { id: 'R-09', title: 'Reminder email deliverability is unknown', consequence: 'Reminders may land in spam, so members miss due dates and fines complaints reach the desk.', status: 'open', dims: { customer: 'medium', evidence: 'unknown' }, now: [0, 2], target: [1, 1], owner: 'sofia', treatment: 'Pick a sending provider and test with 20 member addresses.', costImpact: '€15–40 per month provider cost', timeImpact: 'Unknown', affects: ['W-210'], evidence: ['S-5'], responses: [{ id: 'test', title: 'Run a deliverability test', desc: 'Send to 20 volunteer members through a trial provider account.', chips: ['+€40', '+2 days', 'Evidence to medium'], creates: { title: 'Test reminder deliverability with 20 members', forecast: [40, 80], parent: 'W-200' } }], comments: [] },
      { id: 'R-10', title: 'Pilot environment has no deploy grant', consequence: 'Nothing can be deployed for the pilot, so the Staff release cannot be shown to librarians on time.', status: 'needs-owner', dims: { capacity: 'high', time: 'high', authority: 'high' }, now: [3, 3], target: [1, 2], owner: null, treatment: 'Request the pilot environment grant from the library IT contact.', costImpact: 'None directly', timeImpact: 'Blocks the Staff release; may delay First loan demo', affects: ['W-420'], evidence: [], responses: [{ id: 'grant', title: 'Request the pilot grant', desc: 'Ask library IT for a deploy grant limited to the pilot environment.', chips: ['€0', '3–5 days wait', 'Unblocks W-420'] }], comments: [] },
      { id: 'R-11', title: 'Search finished €120 over forecast', consequence: 'Search itself is done; the overrun only matters if similar work is forecast the same way again.', status: 'monitoring', dims: { cost: 'medium' }, now: [3, 1], target: [3, 1], owner: 'tomas', treatment: 'Nightly forecast refresh now weights search work higher.', costImpact: '€120 spent', timeImpact: 'None', affects: ['W-111'], evidence: ['S-2'], responses: [], comments: [] },
      { id: 'R-12', title: 'Staff release scope is not estimated', consequence: 'The Staff release has no reliable cost, so the budget could be exceeded without warning.', status: 'open', dims: { cost: 'unknown', scope: 'medium' }, now: [2, 2], target: [1, 1], owner: 'elena', treatment: 'Estimate the four unestimated items.', costImpact: 'Unknown', timeImpact: 'Unknown', affects: ['W-322', 'W-311'], evidence: [], responses: [], comments: [] },
      { id: 'R-13', title: 'Member data retention period is unclear', consequence: 'Member data could be kept longer than the library allows, which the board would have to answer for.', status: 'open', dims: { authority: 'high', evidence: 'low' }, now: [1, 3], target: [1, 1], owner: 'tomas', treatment: 'Ask the library board for a retention period.', costImpact: '€0', timeImpact: 'None yet', affects: ['W-132'], evidence: [], responses: [], comments: [] },
      { id: 'R-14', title: 'Only one person knows the barcode format', consequence: 'If Matej is away, scanning existing copies stops because nobody else can read the barcodes.', status: 'open', dims: { capacity: 'medium', evidence: 'low' }, now: [2, 2], target: [1, 1], owner: 'matej', treatment: 'Get barcode-format.txt into the docs repository.', costImpact: '€0', timeImpact: '+1 day if Matej is away', affects: ['W-311'], evidence: ['S-9'], responses: [], comments: [] },
    ],
    assignments: [
      { id: 'A-31', category: 'domain', to: 'elena', status: 'answered', subject: 'W-121', ask: 'Can a borrower correct the due date after the loan is saved, and does that change availability?', why: 'Elena runs the lending desk and knows how corrections happen today.', blocks: 'Save a loan and update availability', waiting: 'Agent run held · about €0 per day, 1 day of release time', can: 'Answer, attach an example, delegate to Sofia', cannot: 'Approve the product rule or start the agent', answer: 'Yes, but only staff can do it, and they must record a reason. Availability does not change: the book is still lent.', decision: 'D-12' },
      { id: 'A-32', category: 'engineering', to: 'sofia', status: 'assigned', subject: 'W-112', ask: 'Review the agent output for “Search by author and series” (run 0139).', why: 'Policy P4 requires human review of agent output.', blocks: 'Search by author and series', waiting: 'Release item held in review', can: 'Accept the contribution or request changes', cannot: 'Accept the release', run: 'RUN-0139' },
      { id: 'A-33', category: 'domain', to: 'elena', status: 'assigned', subject: 'W-3122', ask: 'Does a member pay for a damaged copy, and who decides?', why: 'Fines are out of scope, but staff charge replacements today.', blocks: 'Decide a replacement charge', waiting: 'Staff release scope unclear', can: 'Answer, delegate to Sofia', cannot: 'Change project scope' },
      { id: 'A-34', category: 'architecture', to: 'matej', status: 'assigned', subject: 'W-121', ask: 'Confirm the loan save must be one transaction, and name the evidence you need.', why: 'Risk R-07 is customer-visible and touches concurrency.', blocks: 'Nothing yet · advisory', waiting: 'None', can: 'Answer, add a required check', cannot: 'Start the agent' },
    ],
    decisions: [
      { id: 'D-12', title: 'Choose the due-date correction rule', subject: 'W-121', decider: 'tomas', status: 'open', from: 'A-31', why: 'Elena answered the domain question. The rule changes what the agent builds in “Save a loan” and unblocks “Correct a due date”.',
        personal: { tomas: 'In short: letting staff correct dates with a reason matches what they do today and adds about €60 of work. Blocking corrections is cheaper now but staff would keep a paper workaround.', sofia: 'Option A adds a `correction_reason` column and one audit row per change; availability logic is untouched.', elena: 'Option A is what you described: staff only, reason required.', matej: 'Option A keeps availability derivation unchanged; the audit row is append-only.' },
        options: [
          { id: 'a', title: 'Staff may correct, reason required (Elena\'s answer)', desc: 'Only staff can move a due date; each change stores a reason. Availability is unchanged.', pros: 'Matches today\'s practice.', cons: '+€60 forecast on W-123.', chips: ['+€60', '0 days', 'Risk R-08 closed'] },
          { id: 'b', title: 'No corrections in the first release', desc: 'Due dates are fixed; staff keep using paper for exceptions.', pros: 'Cheapest.', cons: 'Paper workaround stays; W-123 is removed from the release.', chips: ['−€180', '−1 day', 'Customer risk medium'] },
        ],
        effects: 'adopt-correction-rule' },
      { id: 'D-15', title: 'Staff release forecast is partial', subject: 'REL-3', decider: 'tomas', status: 'open', why: 'Four items have no estimate; the known part already uses 52 % of the €4,200 budget.',
        personal: { tomas: 'In short: you can ask for estimates now (small cost, one day), or accept not knowing until January.' },
        options: [
          { id: 'estimate', title: 'Ask the agent to estimate the four items', desc: 'A planning agent reads the items and sources and records ranges.', pros: 'Forecast becomes complete.', cons: 'About €6 and one day.', chips: ['+€6', '+1 day', 'Cost unknown to known'] },
          { id: 'cut', title: 'Move the missing-copy report to a later release', desc: 'Keeps the release to what is estimated.', pros: 'Smaller, clearer release.', cons: 'Staff lose the report until next year.', chips: ['−scope', '0 days'] },
        ],
        effects: 'estimate-staff-release' },
    ],
    runs: [
      { id: 'RUN-0142', work: 'W-113', state: 'running', attempt: 1, agent: 'Implementation agent', model: 'synthetic-model-L', runner: 'Local sandbox · container, no network', profile: 'spec-tdd', repo: 'borrowbox-app @ 9f3a1c2', branch: 'ade/w-113-availability', spent: 38, reserved: 90, started: '10:02', elapsed: '42 min', wf: { at: 'build', visits: { specify: 1, 'approve-spec': 1, plan: 1, build: 2, test: 1 }, trail: [{ step: 'specify', outcome: 'done' }, { step: 'approve-spec', outcome: 'approved', by: 'sofia' }, { step: 'plan', outcome: 'done' }, { step: 'build', outcome: 'done' }, { step: 'test', outcome: 'fail', note: '1 of 7 availability tests failed' }], script: { test: ['fail', 'pass'] } }, trigger: 'Started by Sofia on Mon 10:02', policy: 'P4 allowed: forecast €250–420 within the release reserve; risk medium; human review required.', stop: ['€90 reservation reached', 'A test outside src/catalogue fails', 'Any change to src/loans'], console: ['$ npm test -- catalogue', 'PASS tests/catalogue/search.test.ts (12)', 'RUN  tests/catalogue/availability.test.ts', '  ✓ shows lent copy as unavailable', '  … 3 of 7'], context: [{ label: 'loan-policy.md @ 42c9', src: 'S-1' }, { label: 'staff-interview-notes.md @ a91f', src: 'S-8' }, { label: 'W-113 contract', work: 'W-113' }], excluded: [{ label: 'legacy-notes.md', why: 'Stale; conflicts with S-1' }], files: [{ path: 'src/catalogue/results.tsx', add: 42, del: 7 }, { path: 'tests/catalogue/availability.test.ts', add: 61, del: 0 }] },
      { id: 'RUN-0139', work: 'W-112', state: 'awaiting-review', attempt: 1, agent: 'Implementation agent', model: 'synthetic-model-L', runner: 'Local sandbox · container, no network', profile: 'direct', repo: 'borrowbox-app @ 71be004', branch: 'ade/w-112-author-search', spent: 54, reserved: 80, started: 'Fri 14:10', elapsed: '1 h 5 min', wf: { at: 'submit', visits: { build: 1, test: 1, submit: 1 }, trail: [{ step: 'build', outcome: 'done' }, { step: 'test', outcome: 'pass' }, { step: 'submit', outcome: 'submitted' }] }, trigger: 'Started by Sofia on Fri 14:10', policy: 'P4 allowed; human review required (A-32).', stop: ['€80 reservation reached'], console: ['PASS tests/catalogue/author.test.ts (9)', 'Candidate submitted: 6 files'], context: [{ label: 'W-112 contract', work: 'W-112' }], excluded: [], files: [{ path: 'src/catalogue/search.ts', add: 88, del: 12 }, { path: 'src/catalogue/series.ts', add: 40, del: 0 }, { path: 'docs/catalogue.md', add: 14, del: 2 }], attention: 'Waiting for Sofia\'s review (A-32).' },
      { id: 'RUN-0137', work: 'W-111', state: 'complete', attempt: 2, agent: 'Implementation agent', model: 'synthetic-model-L', runner: 'Local sandbox', profile: 'direct', repo: 'borrowbox-app @ 3aa91e0', branch: 'ade/w-111-title-search', spent: 72, reserved: 80, started: '9 Sep', elapsed: '58 min', wf: { at: 'submit', visits: { build: 2, test: 2, submit: 1 }, trail: [{ step: 'build', outcome: 'done' }, { step: 'test', outcome: 'fail' }, { step: 'build', outcome: 'done' }, { step: 'test', outcome: 'pass' }, { step: 'submit', outcome: 'submitted' }] }, prev: 'RUN-0131', trigger: 'Retry after review requested changes (attempt 1: RUN-0131)', policy: 'P4 allowed.', stop: [], console: ['Contribution accepted by Sofia'], context: [], excluded: [], files: [] },
      { id: 'RUN-0143', work: 'W-420', state: 'failed', attempt: 1, agent: 'Deployment agent', model: 'synthetic-model-M', runner: 'Local sandbox', profile: 'direct', repo: 'borrowbox-app @ 9f3a1c2', branch: '—', spent: 0, reserved: 20, started: 'Tue 08:30', elapsed: '0 min', wf: { at: null, visits: {}, trail: [] }, deniedBeforeStart: true, trigger: 'Started by Matej on Tue 08:30', policy: 'P1 denied: the pilot environment is outside the project grant.', stop: [], console: ['policy: deny (P1 targetOutsideGrant)'], context: [], excluded: [], files: [], attention: 'Denied by policy. Nothing was deployed. Request the grant (risk R-10).' },
      { id: 'RUN-0141', work: null, state: 'complete', attempt: 1, agent: 'Summary agent', model: 'synthetic-model-S', runner: 'ADE service', profile: null, system: 'Regenerate summaries', repo: '—', branch: '—', spent: 0.4, reserved: 1, started: 'Today 09:52', elapsed: '20 s', wf: { at: null, visits: {}, trail: [{ step: 'Regenerate 3 summaries', outcome: 'done' }] }, trigger: 'Automation AU-1: legacy-notes.md marked stale', policy: 'P7 allowed: low materiality.', stop: [], console: ['3 summaries regenerated'], context: [], excluded: [], files: [] },
    ],
    events: [
      { at: 'Today 09:52', icon: 'sync', text: 'legacy-notes.md marked stale', triggered: 'AU-1 regenerated 3 summaries', outcome: 'allow' },
      { at: 'Yesterday 16:20', icon: 'task_alt', text: 'Elena answered A-31 (due-date corrections)', triggered: 'AU-2 re-evaluated W-121: decision D-12 now needed from Tomas', outcome: 'needs-decision' },
      { at: 'Tue 08:30', icon: 'block', text: 'Matej started the pilot deploy', triggered: 'Run 0143 denied by P1: target outside grant', outcome: 'deny' },
      { at: 'Mon 11:05', icon: 'play_circle', text: 'Internal item “Loan data model and storage” became ready', triggered: 'AU-3 started the implementation agent (internal, forecast €200–300 approved by Tomas)', outcome: 'allow' },
      { at: 'Mon 10:02', icon: 'smart_toy', text: 'Sofia started run 0142 on W-113', triggered: 'Reserved €90 of the release budget', outcome: 'allow' },
      { at: 'Fri 15:15', icon: 'task_alt', text: 'Run 0139 submitted a candidate', triggered: 'Review A-32 assigned to Sofia (P4 requires human review)', outcome: 'allow' },
      { at: 'Today 02:00', icon: 'trending_up', text: 'Nightly forecast refresh', triggered: 'First loan time forecast moved to 14–21 Oct', outcome: 'none' },
    ],
    automations: automations(),
    contracts: {
      policy: policyContract('Borrowbox', 150),
      agents: agentsContract(),
      skills: skillsContract(),
      settings: settingsContract(),
      routing: routingContract({ product: { designated: 'tomas', canDelegate: true, eligible: ['sofia'] }, domain: { designated: 'elena', canDelegate: true, eligible: ['sofia'] }, architecture: { designated: 'matej', canDelegate: false, eligible: [] }, engineering: { designated: 'sofia', canDelegate: true, eligible: ['matej'] }, commercial: { designated: 'tomas', canDelegate: false, eligible: [] } }),
    },
    split: {
      'W-210': {
        strategies: [
          { id: 'channel', title: 'By delivery channel', desc: 'One child per channel: email now, text messages later.', pros: 'Email ships first; text messages can wait for the provider decision.', cons: 'Scheduling logic is shared, so the second child reuses the first.', chips: ['€620–1,050', 'Risk R-09 isolated'], children: [
            { title: 'Schedule reminders two days before and on the due date', forecast: [180, 320] },
            { title: 'Send reminder emails through the trial provider', forecast: [160, 300] },
            { title: 'Show sent reminders on the member page', forecast: [90, 160] },
            { title: 'Send reminder text messages', forecast: null, note: 'Unestimated until the provider is chosen' },
          ] },
          { id: 'risk', title: 'Risk first: prove deliverability, then build', desc: 'Start with a deliverability test; build only after it passes.', pros: 'Resolves the unknown evidence dimension of R-09 before spending.', cons: 'Adds 2 days before visible progress.', chips: ['€540–900', '+2 days', 'Evidence to medium'], children: [
            { title: 'Test reminder deliverability with 20 members', forecast: [40, 80] },
            { title: 'Schedule and send email reminders', forecast: [300, 520] },
            { title: 'Show sent reminders on the member page', forecast: [90, 160] },
          ] },
          { id: 'journey', title: 'By member journey step', desc: 'Before due, on the due day, overdue.', pros: 'Each child is a visible behaviour.', cons: 'Every child touches the same scheduler.', chips: ['€700–1,250', 'More coupling'], children: [
            { title: 'Remind two days before the due date', forecast: [220, 380] },
            { title: 'Remind on the due date', forecast: [140, 260] },
            { title: 'Notify when a loan is overdue', forecast: [200, 340] },
          ] },
        ],
      },
    },
  };

  /* ------------------------------------------------------------------ Skillhaven */
  const S = (id, parentId, title, p) => W(id, parentId, title, p);
  const skillhaven = {
    id: 'skillhaven', name: 'Skillhaven', kind: 'Greenfield · complex', owner: 'tomas', access: ['tomas', 'sofia', 'elena', 'matej'],
    description: 'Replace email coordination of training sessions for a professional-education provider: coordinators publish sessions with a fixed capacity, learners get a trustworthy answer about whether they have a place, and trainers see their rosters.',
    budget: { eur: 48000, planned: '27 Feb', start: '1 Jul', forecastFinish: '27 Feb–12 Mar', timeRatio: [0.7, 0.78, 0.36, 0.7] }, capacity: { slots: 3 }, lastSeen: 'Tue 12:10',
    sources: [
      { id: 'S-1', title: 'booking-glossary.md', kind: 'Document', provenance: 'skillhaven-docs', revision: '7d2e', freshness: 'current', status: 'disputed', purpose: 'Meaning of booking terms.', markdown: '# Booking glossary\n\n==**Confirmed**: the learner has a place (Elena) · the server has committed the seat (Matej).==\n\nBoth readings are recorded until the owner decides.' },
      { id: 'S-2', title: 'session-rules.md', kind: 'Document', provenance: 'skillhaven-docs', revision: '1c09', freshness: 'current', status: 'accepted', purpose: 'Session capacity, time zone and trainer rules.', markdown: '# Session rules\n\nA session has a positive fixed capacity, one trainer, a future start and a declared time zone. ==Changes to time, capacity or trainer after publishing are rejected in the first slice.==' },
      { id: 'S-3', title: 'partner-status.md', kind: 'Document', provenance: 'skillhaven-docs', revision: '44a0', freshness: 'stale', status: 'stale', purpose: 'Notification partner onboarding.', markdown: '# Partner status\n\n==Sandbox promised for 1 Sep.== (not delivered)' },
      { id: 'S-4', title: 'skillhaven-app', kind: 'Code repository', provenance: 'git.example/skillhaven/app', revision: 'e02d9b4', freshness: 'current', status: 'connected', purpose: 'Services and web client.', markdown: '# skillhaven-app @ e02d9b4 (synthetic)' },
      { id: 'S-5', title: 'skillhaven-docs', kind: 'Documentation repository', provenance: 'git.example/skillhaven/docs', revision: '8810ac3', freshness: 'current', status: 'connected', purpose: 'Architecture and domain docs.', markdown: '# skillhaven-docs @ 8810ac3 (synthetic)' },
      { id: 'S-6', title: 'coordinator-workshop.md', kind: 'Document', provenance: 'skillhaven-docs', revision: '0b3f', freshness: 'current', status: 'accepted', purpose: 'Workshop with three coordinators.', markdown: '# Coordinator workshop\n\n==Coordinators spend about 6 hours a week answering "do I have a place?" emails.==' },
    ],
    facts: [
      { id: 'F-1', text: '“Confirmed” means the learner has a place.', kind: 'Conflict', source: 'S-1', conflictWith: 'F-2', usedBy: ['W-120'] },
      { id: 'F-2', text: '“Confirmed” means the server committed the seat.', kind: 'Conflict', source: 'S-1', conflictWith: 'F-1', usedBy: ['W-120'] },
      { id: 'F-3', text: 'Changes after publishing are rejected in the first slice.', kind: 'Source-grounded', source: 'S-2', usedBy: ['W-210'] },
      { id: 'F-4', text: 'Notification sandbox was promised for 1 Sep and not delivered.', kind: 'Unknown', source: 'S-3', usedBy: ['W-140'] },
      { id: 'F-5', text: 'Coordinators spend about 6 hours a week on place-check emails.', kind: 'Observed', source: 'S-6', usedBy: ['REL-1'] },
    ],
    questions: [
      { id: 'KQ-1', q: 'What does “booking confirmed” mean?', keys: ['confirmed', 'booking', 'mean', 'place'], answer: 'It is disputed: Elena reads it as “the learner has a place”, Matej as “the server committed the seat”. Both readings are recorded; the owner has not decided.', facts: ['F-1', 'F-2'] },
      { id: 'KQ-2', q: 'Can a session change after it is published?', keys: ['change', 'published', 'session', 'capacity', 'trainer'], answer: 'Not in the first slice: time, capacity and trainer changes after publishing are rejected.', facts: ['F-3'] },
    ],
    work: [
      S('W-100', null, 'Learners know they have a place', { owner: 'sofia', customerVisible: true, purpose: 'Learners get a trustworthy answer about whether they have a place.', inScope: ['Booking with fixed capacity', 'Confirmation and notification'], outScope: ['Payments', 'Waitlists', 'Room scheduling'] }),
      S('W-110', 'W-100', 'Book a place', { owner: 'sofia', customerVisible: true }),
      S('W-111', 'W-110', 'Show sessions with free places', { status: 'done', forecast: [900, 1300], actual: 1420, humanDays: 4, owner: 'sofia', customerVisible: true }),
      S('W-112', 'W-110', 'Reserve the last seat safely', { owner: 'matej', customerVisible: true }),
      S('W-1121', 'W-112', 'Seat counter with optimistic locking', { status: 'done', forecast: [700, 1100], actual: 1680, humanDays: 5, owner: 'matej' }),
      S('W-1122', 'W-112', 'Retry after a lost response', { status: 'in-progress', readiness: 'ready', forecast: [500, 800], actual: 610, humanDays: 3, purpose: 'A learner who retries after a lost response keeps one booking.', inScope: ['Idempotent booking submit with a client key'], outScope: ['Cancellation'], ac: ['A duplicate submit returns the same booking.', 'The partner stub contract tests pass.'], owner: 'matej' }),
      S('W-1123', 'W-112', 'Concurrency evidence for 50 parallel learners', { readiness: 'needs-decision', forecast: [300, 600], owner: 'matej', risks: ['R-2'], purpose: 'Prove the last seat cannot be sold twice under load.', inScope: ['A staging load test with 50 parallel learners booking the last seats'], outScope: ['Performance tuning'], ac: ['No session is ever overbooked in the test.', 'The evidence Matej names is recorded.'], checks: [chk.assignment('A-4', 'Architecture named the required evidence')] }),
      S('W-113', 'W-110', 'Booking receipt page', { status: 'done', forecast: [400, 600], actual: 520, humanDays: 3, owner: 'sofia', customerVisible: true }),
      S('W-120', 'W-100', 'Tell the learner the booking is confirmed', { readiness: 'blocked', forecast: [800, 1400], owner: 'sofia', customerVisible: true, risks: ['R-1'], purpose: 'Learners get a message they can rely on.', inScope: ['A confirmation message on screen and by email'], outScope: ['Payment receipts'], ac: ['The message says exactly what “confirmed” means as decided in D-4.'], checks: [chk.decision('D-4', 'Meaning of “confirmed” decided', 'blocked')] }),
      S('W-130', 'W-100', 'Learner booking history', { readiness: 'not-ready', forecast: [600, 900], owner: 'sofia', customerVisible: true }),
      S('W-140', 'W-100', 'Notification partner integration', { owner: 'matej' }),
      S('W-141', 'W-140', 'Partner sandbox contract tests', { readiness: 'blocked', forecast: [400, 700], owner: 'matej', risks: ['R-3'], checks: [chk.manual('sandbox', 'Partner sandbox available', 'The partner has not delivered a sandbox (R-3)', 'blocked')] }),
      S('W-142', 'W-140', 'Send booking notifications', { readiness: 'blocked', forecast: [700, 1200], owner: 'matej', risks: ['R-3'], deps: ['W-141'], checks: [chk.manual('sandbox', 'Partner sandbox available', 'The partner has not delivered a sandbox (R-3)', 'blocked')] }),
      S('W-200', null, 'Coordinators publish sessions', { owner: 'elena', customerVisible: true }),
      S('W-210', 'W-200', 'Create and publish a session', { status: 'done', forecast: [1200, 1700], actual: 1650, humanDays: 7, owner: 'elena', customerVisible: true }),
      S('W-220', 'W-200', 'Import sessions from spreadsheet', { status: 'in-progress', readiness: 'ready', forecast: [600, 1000], actual: 740, humanDays: 5, purpose: 'Coordinators bring existing sessions over in one step.', inScope: ['CSV import with a preview and row errors'], outScope: ['Two-way sync'], ac: ['A valid spreadsheet creates its sessions.', 'Invalid rows are listed with a reason.'], owner: 'elena' }),
      S('W-230', 'W-200', 'Coordinator dashboard', { owner: 'elena', customerVisible: true }),
      S('W-231', 'W-230', 'Sessions filling up', { readiness: 'ready', forecast: [400, 700], owner: 'elena', customerVisible: true, purpose: 'Coordinators see which sessions are nearly full.', inScope: ['A dashboard list of sessions above 80 % capacity'], outScope: ['Automatic extra sessions'], ac: ['Sessions above 80 % capacity appear in the list.'] }),
      S('W-232', 'W-230', 'Sessions without a trainer', { readiness: 'not-ready', forecast: [300, 500], owner: 'elena', customerVisible: true }),
      S('W-300', null, 'Trainers see their roster', { owner: 'sofia', customerVisible: true }),
      S('W-310', 'W-300', 'Roster for a session', { owner: 'sofia', customerVisible: true }),
      S('W-311', 'W-310', 'Roster list', { status: 'done', forecast: [500, 800], actual: 930, humanDays: 3, owner: 'sofia', customerVisible: true }),
      S('W-312', 'W-310', 'Export roster to PDF', { readiness: 'ready', forecast: [200, 400], owner: 'sofia', customerVisible: true, purpose: 'Trainers print a roster for rooms without a screen.', inScope: ['A PDF export of the session roster'], outScope: ['Attendance marking (W-313)'], ac: ['The PDF lists every booked learner.'] }),
      S('W-313', 'W-310', 'Attendance marking', { readiness: 'not-ready', forecast: null, owner: 'sofia', customerVisible: true }),
      S('W-320', 'W-300', 'Trainer sign-in', { status: 'done', forecast: [600, 900], actual: 1040, humanDays: 3, owner: 'matej' }),
      S('W-400', null, 'Phone booking (future capability concept)', { owner: 'tomas', customerVisible: true }),
      S('W-410', 'W-400', 'Android and iOS booking clients', { readiness: 'not-ready', forecast: null, owner: 'matej', customerVisible: true }),
      S('W-500', null, 'Platform', { owner: 'matej' }),
      S('W-510', 'W-500', 'Service boundaries and API gateway', { status: 'done', forecast: [2000, 2800], actual: 3100, humanDays: 8, owner: 'matej' }),
      S('W-520', 'W-500', 'Observability baseline', { status: 'done', forecast: [800, 1200], actual: 1150, provider: 60, humanDays: 3, owner: 'matej' }),
      S('W-530', 'W-500', 'Staging environment', { status: 'done', forecast: [1500, 2200], actual: 2350, provider: 180, humanDays: 5, owner: 'matej' }),
    ],
    releases: [
      { id: 'REL-1', name: 'Learners know they have a place', outcome: true, members: ['W-100', 'W-510', 'W-520', 'W-530'], budget: 22000, planned: '30 Oct', forecastFinish: '6–20 Nov', timeRatio: [0.62, 0.8, 0.5, 0.55] },
      { id: 'REL-2', name: 'Coordinators publish sessions', outcome: true, members: ['W-200'], budget: 9000, planned: '14 Nov', forecastFinish: '10–17 Nov', timeRatio: [0.46, 0.52, 0.4, 0.49] },
      { id: 'REL-3', name: 'Trainers see their roster', outcome: true, members: ['W-300'], budget: 7000, planned: '12 Dec', forecastFinish: '5–19 Dec', timeRatio: [0.55, 0.75, 0.2, 0.6] },
    ],
    risks: [
      { id: 'R-1', title: '“Booking confirmed” means different things to domain and architecture', consequence: 'Learners may see “confirmed” for a seat the trainer has not accepted, and turn up to a full session.', status: 'needs-owner', dims: { customer: 'high', scope: 'medium', authority: 'high' }, now: [3, 3], target: [1, 2], owner: 'tomas', treatment: 'Decide the meaning (decision D-4).', costImpact: '€0–1,200 depending on meaning', timeImpact: 'Holds W-120', affects: ['W-120'], evidence: ['S-1'], responses: [], comments: [] },
      { id: 'R-2', title: 'Last-seat race under load not yet evidenced', consequence: 'Under load two learners can book the last seat; one is turned away on the day.', status: 'open', dims: { customer: 'high', evidence: 'low' }, now: [2, 3], target: [1, 2], owner: 'matej', treatment: 'Run a 50-learner concurrency test in staging.', costImpact: '+€300–600', timeImpact: '+2 days', affects: ['W-1123'], evidence: [], responses: [], comments: [] },
      { id: 'R-3', title: 'Notification partner sandbox not delivered', consequence: 'Session reminders cannot be tested, so the notifications work slips by weeks.', status: 'open', dims: { time: 'high', capacity: 'medium', evidence: 'unknown' }, now: [3, 2], target: [1, 1], owner: 'tomas', treatment: 'Escalate to partner account manager.', costImpact: 'Unknown', timeImpact: '2–4 weeks', affects: ['W-141', 'W-142'], evidence: ['S-3'], responses: [], comments: [] },
      { id: 'R-4', title: 'Booking branch 14 % over forecast', consequence: 'The booking branch keeps costing more than planned, eating into the release budget.', status: 'monitoring', dims: { cost: 'medium' }, now: [3, 2], target: [2, 1], owner: 'tomas', treatment: 'Forecast refresh weights concurrency work higher.', costImpact: '€2,400 so far', timeImpact: 'None', affects: ['W-112'], evidence: [], responses: [], comments: [] },
      { id: 'R-5', title: 'Attendance marking is unestimated', consequence: 'Attendance marking has no forecast, so the release total understates the real cost.', status: 'open', dims: { cost: 'unknown', scope: 'low' }, now: [2, 1], target: [1, 1], owner: 'sofia', treatment: 'Estimate W-313.', costImpact: 'Unknown', timeImpact: 'Unknown', affects: ['W-313'], evidence: [], responses: [], comments: [] },
      { id: 'R-6', title: 'Time-zone handling across regions', consequence: 'Learners in other regions may see the wrong session time and miss it.', status: 'open', dims: { customer: 'medium', evidence: 'medium' }, now: [2, 2], target: [1, 1], owner: 'matej', treatment: 'Add time-zone examples to session rules.', costImpact: '+€150', timeImpact: '+1 day', affects: ['W-210'], evidence: ['S-2'], responses: [], comments: [] },
      { id: 'R-7', title: 'Phone clients depend on unresolved authentication', consequence: 'Phone booking cannot be planned until authentication is settled; accepted for now because phone booking is not scheduled.', status: 'accepted', dims: { scope: 'medium', evidence: 'unknown' }, now: [2, 2], target: [2, 2], owner: 'matej', treatment: 'Accepted until phone booking is planned.', costImpact: 'Unknown', timeImpact: 'Future', affects: ['W-410'], evidence: [], responses: [], comments: [] },
      { id: 'R-8', title: 'Coordinator adoption depends on spreadsheet import', consequence: 'Without importing their spreadsheets, coordinators may keep using them and never switch to Skillhaven.', status: 'open', dims: { customer: 'medium', time: 'low' }, now: [2, 2], target: [1, 2], owner: 'elena', treatment: 'Pilot import with two coordinators.', costImpact: '€0', timeImpact: 'None', affects: ['W-220'], evidence: ['S-6'], responses: [], comments: [] },
    ],
    assignments: [
      { id: 'A-4', category: 'architecture', to: 'matej', status: 'assigned', subject: 'W-1123', ask: 'What evidence is enough to trust the last-seat logic under load?', why: 'Risk R-2 affects learners and has little evidence. The item\'s forecast is above the run limit, so Tomas approves any run; Matej first names the evidence that run must produce.', blocks: 'Concurrency evidence for 50 parallel learners', waiting: '≈ €0/day · holds release 1 evidence', can: 'Answer, add a required check', cannot: 'Accept the release' },
      { id: 'A-5', category: 'domain', to: 'elena', status: 'assigned', subject: 'W-120', ask: 'When a learner sees “confirmed”, what can they rely on?', why: 'The glossary has two meanings.', blocks: 'Tell the learner the booking is confirmed', waiting: 'Holds notification slice', can: 'Answer, delegate to Sofia', cannot: 'Decide the product meaning' },
      { id: 'A-6', category: 'product', to: 'tomas', status: 'assigned', subject: 'W-313', ask: 'Is attendance marking needed for the roster release?', why: 'It is unestimated and may be optional.', blocks: 'Roster release forecast', waiting: 'Forecast stays partial', can: 'Answer, delegate to Sofia', cannot: '—' },
    ],
    decisions: [
      { id: 'D-4', title: 'Decide what “booking confirmed” means', subject: 'W-120', decider: 'tomas', status: 'open', why: 'Domain and architecture read it differently; the notification slice waits on it.',
        personal: { tomas: 'In short: “server committed” is safer to promise; “you have a place” is what learners expect but needs a retry path.' },
        options: [
          { id: 'server', title: 'Confirmed = the seat is committed', desc: 'Show confirmed only after the server commits; otherwise “pending”.', pros: 'Never wrong.', cons: 'Learners see “pending” briefly.', chips: ['€0', '0 days'] },
          { id: 'place', title: 'Confirmed = the learner has a place', desc: 'Show confirmed immediately; reconcile on failure with an apology message.', pros: 'Feels instant.', cons: 'Rare false promises; +€1,200.', chips: ['+€1,200', '+4 days', 'Customer risk medium'] },
        ], effects: 'none' },
    ],
    runs: [
      { id: 'RUN-0311', work: 'W-1122', state: 'running', attempt: 3, agent: 'Implementation agent', model: 'synthetic-model-L', runner: 'Linux runner · staging', profile: 'direct', repo: 'skillhaven-app @ e02d9b4', branch: 'ade/w-1122-retry', spent: 71, reserved: 90, started: '09:40', elapsed: '1 h 10 min', wf: { at: 'build', visits: { build: 2, test: 1 }, trail: [{ step: 'build', outcome: 'done' }, { step: 'test', outcome: 'fail', note: 'contract test: duplicate submit returned a second booking' }], script: { test: ['fail', 'pass'] } }, prev: 'RUN-0304', trigger: 'Retry after failed contract test (attempt 2: RUN-0304)', policy: 'P4 allowed; human review required.', stop: ['€90 reservation reached'], console: ['RUN contract tests (partner stub)', '  ✓ duplicate submit returns same booking'], context: [{ label: 'session-rules.md @ 1c09', src: 'S-2' }], excluded: [], files: [{ path: 'services/booking/retry.ts', add: 77, del: 20 }], attention: 'Spend at 79 % of reservation — AU-4 pauses at 80 %.' },
      { id: 'RUN-0309', work: 'W-220', state: 'running', attempt: 1, agent: 'Implementation agent', model: 'synthetic-model-L', runner: 'Linux runner', profile: 'direct', repo: 'skillhaven-app @ e02d9b4', branch: 'ade/w-220-import', spent: 22, reserved: 70, started: '10:15', elapsed: '35 min', wf: { at: 'build', visits: { build: 1 }, trail: [] }, trigger: 'AU-3: internal work became ready', policy: 'P4 allowed.', stop: ['€70 reservation reached'], console: ['editing services/sessions/import.ts'], context: [], excluded: [], files: [] },
      { id: 'RUN-0304', work: 'W-1122', state: 'failed', attempt: 2, agent: 'Implementation agent', model: 'synthetic-model-L', runner: 'Linux runner', profile: 'direct', repo: 'skillhaven-app @ d17aa20', branch: 'ade/w-1122-retry', spent: 64, reserved: 80, started: 'Mon', elapsed: '50 min', wf: { at: null, visits: { build: 3, test: 3 }, trail: [{ step: 'build', outcome: 'done' }, { step: 'test', outcome: 'fail' }, { step: 'build', outcome: 'done' }, { step: 'test', outcome: 'fail' }, { step: 'build', outcome: 'done' }, { step: 'test', outcome: 'fail', note: 'duplicate submit created two bookings' }] }, next: 'RUN-0311', trigger: 'Retry', policy: 'P4 allowed.', stop: [], console: ['FAIL contract: duplicate submit created two bookings'], context: [], excluded: [], files: [] },
    ],
    events: [
      { at: 'Today 10:15', icon: 'play_circle', text: 'W-220 became ready (internal)', triggered: 'AU-3 started run 0309 (€70 reserved)', outcome: 'allow' },
      { at: 'Today 09:40', icon: 'sync', text: 'Run 0304 failed a contract test', triggered: 'Retry run 0311 started within policy (attempt 3)', outcome: 'allow' },
      { at: 'Today 02:00', icon: 'trending_up', text: 'Nightly forecast refresh', triggered: 'Booking branch flagged 14 % over forecast (R-4)', outcome: 'none' },
      { at: 'Mon 15:00', icon: 'help_outline', text: 'Glossary edit recorded two meanings of “confirmed”', triggered: 'Decision D-4 raised for Tomas', outcome: 'needs-decision' },
    ],
    automations: automations(),
    contracts: {
      policy: policyContract('Skillhaven', 120),
      agents: agentsContract(),
      skills: skillsContract(),
      settings: settingsContract('Europe/Vienna'),
      routing: routingContract({ product: { designated: 'tomas', canDelegate: true, eligible: ['sofia'] }, domain: { designated: 'elena', canDelegate: true, eligible: ['sofia'] }, architecture: { designated: 'matej', canDelegate: false, eligible: [] }, engineering: { designated: 'sofia', canDelegate: true, eligible: ['matej'] }, commercial: { designated: 'tomas', canDelegate: false, eligible: [] } }),
    },
    split: {},
  };

  /* ------------------------------------------------------------------ Servora import scene */
  const importScene = {
    name: 'Servora',
    outcome: 'Customers can reschedule a confirmed visit before dispatch begins without calling staff.',
    repos: {
      code: { url: 'git.example/servora/servora-app', branch: 'main', result: 'ok', revision: 'c41f0e2', detail: '3 services, 1 web client, 412 files, tests in 2 of 3 services' },
      docs: { url: 'git.example/servora/servora-docs', branch: 'main', result: 'ok', revision: '6b0d2a9', detail: 'Architecture notes, API description, handbook source' },
      ops: { url: 'git.example/servora/ops-scripts', branch: 'main', result: 'fail', detail: 'Access denied: your credential has no read grant for this repository.', retryResult: 'fail' },
    },
    documents: [
      { id: 'handbook', title: 'dispatcher-handbook-2023.pdf', size: '4.1 MB', result: 'partial', detail: 'Text extracted; 3 tables on pages 12–14 could not be read.' },
      { id: 'api', title: 'visit-api-v2.yaml', size: '88 KB', result: 'ok', detail: '41 operations' },
      { id: 'runbook', title: 'dispatch-runbook.md', size: '12 KB', result: 'stale', detail: 'Last changed 14 months ago; references a retired queue.' },
      { id: 'legacy', title: 'legacy-rescheduling-notes.md', size: '6 KB', result: 'ok', detail: 'Conflicts with the handbook on when rescheduling stops.' },
      { id: 'partner', title: 'partner-contract-summary.md', size: '9 KB', result: 'ok', detail: 'Dispatch partner SLA and message formats.' },
      { id: 'secrets', title: 'env-production.txt', size: '1 KB', result: 'excluded', detail: 'Excluded: looks like credentials. Not stored.' },
    ],
    findings: [
      { id: 'FN-1', kind: 'Conflict', text: 'Handbook: rescheduling stops when a technician is assigned. API: allowed until dispatch starts. Code: visit service rejects only when status is DISPATCHED.', sources: 'handbook p.7 · visit-api-v2.yaml · servora-app visit/reschedule.ts', action: 'Ask Elena (business domain)' },
      { id: 'FN-2', kind: 'Unknown', text: 'No code in the connected repositories writes the DISPATCHED status. The writer may be in ops-scripts or the partner.', sources: 'servora-app search · ops-scripts unavailable', action: 'Ask Matej (architecture)' },
      { id: 'FN-3', kind: 'Stale', text: 'dispatch-runbook.md references a queue retired last year.', sources: 'dispatch-runbook.md', action: 'Keep as history; exclude from agent context' },
      { id: 'FN-4', kind: 'Observed', text: 'Notification worker sends SMS on every visit change.', sources: 'servora-app notify/worker.ts', action: 'None' },
    ],
    brief: 'Servora is an inherited appointment system with three services and a web portal. Rescheduling rules disagree across handbook, API and code, and nothing connected writes the dispatch status, so the first slice can be investigated but not implemented yet.',
    structures: [
      { id: 'outcome', title: 'Outcome first', desc: 'One release “Reschedule before dispatch”; inherited capabilities kept as observed context only.', pros: 'Small, focused start.', cons: 'Inherited areas stay undocumented.', chips: ['1 release', '6 work items'] },
      { id: 'capability', title: 'Map inherited capabilities', desc: 'Record portal, dispatch and notifications as observed work, then add the new release.', pros: 'Whole system visible.', cons: 'More review now.', chips: ['1 release', '14 work items'] },
    ],
  };

  function servoraProject(structure) {
    const inherited = structure === 'capability';
    const work = [
      W('W-100', null, 'Reschedule a confirmed visit before dispatch', { owner: 'sofia', customerVisible: true, purpose: 'Customers change an appointment without calling staff.', inScope: ['Rescheduling before dispatch begins'], outScope: ['Changes after dispatch has started', 'A redesign of the portal'] }),
      W('W-110', 'W-100', 'Decide when rescheduling stops', { readiness: 'needs-decision', owner: 'tomas', customerVisible: true, decisionItem: true, risks: ['R-1'], purpose: 'Settle the one rule the handbook, API and code disagree on.', inScope: ['A single adopted rule for when a customer can no longer reschedule'], outScope: ['Changing the dispatch process itself'], ac: ['The rule is adopted as a project decision.'], questions: [{ id: 'Q-1', text: 'When must rescheduling stop: technician assigned or dispatch started?', category: 'domain', assignment: 'A-1' }] }),
      W('W-120', 'W-100', 'Find the writer of the dispatch status', { readiness: 'ready', forecast: [20, 60], owner: 'matej', risks: ['R-2'], investigation: true, purpose: 'Read-only investigation of who sets DISPATCHED.', inScope: ['Search the connected code and documents for every writer of the visit status'], outScope: ['Changing any code or configuration'], ac: ['Every writer found is listed with a file and line.', 'If ops-scripts is still unreadable, the answer says so.'] }),
      W('W-130', 'W-100', 'Reschedule endpoint and portal button', { readiness: 'blocked', forecast: null, owner: 'sofia', customerVisible: true, deps: ['W-110', 'W-120'], purpose: 'Customers reschedule from the portal.', inScope: ['A reschedule endpoint that applies the adopted rule and a portal button'], outScope: ['Changes after dispatch has started'], ac: ['A visit before the cut-off can be moved to a free slot.', 'A visit after the cut-off shows why it cannot be moved.'] }),
      W('W-140', 'W-100', 'Notify the dispatch partner of a new time', { readiness: 'not-ready', forecast: null, owner: 'matej' }),
      W('W-150', 'W-100', 'Race: reschedule while dispatch starts', { readiness: 'not-ready', forecast: null, owner: 'matej', risks: ['R-3'] }),
    ];
    if (inherited) {
      work.push(
        W('W-900', null, 'Inherited: customer portal (observed)', { status: 'done', owner: 'sofia', purpose: 'Observed in servora-app; not assessed.' }),
        W('W-910', 'W-900', 'View appointments (observed)', { status: 'done', owner: 'sofia' }),
        W('W-920', 'W-900', 'Cancel an appointment (observed)', { status: 'done', owner: 'sofia' }),
        W('W-930', null, 'Inherited: dispatch (observed)', { status: 'done', owner: 'matej' }),
        W('W-931', 'W-930', 'Assign a technician (observed)', { status: 'done', owner: 'matej' }),
        W('W-932', 'W-930', 'Partner sync (observed · writer unknown)', { status: 'done', owner: 'matej' }),
        W('W-940', null, 'Inherited: notifications (observed)', { status: 'done', owner: 'matej' }),
        W('W-941', 'W-940', 'SMS on visit change (observed)', { status: 'done', owner: 'matej' }),
      );
    }
    return {
      id: 'servora', name: 'Servora', kind: 'Imported', owner: 'tomas', access: ['tomas', 'sofia', 'elena', 'matej'],
      description: importScene.outcome,
      budget: { eur: 9000, planned: '20 Nov', start: '24 Sep', forecastFinish: 'Unknown', timeRatio: null }, capacity: { slots: 1 }, lastSeen: 'just now',
      sources: [
        { id: 'S-1', title: 'servora-app', kind: 'Code repository', provenance: 'git.example/servora/servora-app · main', revision: 'c41f0e2', freshness: 'current', status: 'connected', purpose: 'Services and portal.', markdown: '# servora-app @ c41f0e2 (synthetic)\n\n```ts\n// visit/reschedule.ts\nif (visit.status === "DISPATCHED") reject("too late");\n```' },
        { id: 'S-2', title: 'servora-docs', kind: 'Documentation repository', provenance: 'git.example/servora/servora-docs · main', revision: '6b0d2a9', freshness: 'current', status: 'connected', purpose: 'Architecture and API docs.', markdown: '# servora-docs @ 6b0d2a9 (synthetic)' },
        { id: 'S-3', title: 'ops-scripts', kind: 'Code repository', provenance: 'git.example/servora/ops-scripts', revision: '—', freshness: 'unknown', status: 'inaccessible', purpose: 'Operational scripts; may write dispatch status.', markdown: '' },
        { id: 'S-4', title: 'dispatcher-handbook-2023.pdf', kind: 'Import', provenance: 'uploaded during import', revision: 'h-01', freshness: 'current', status: 'partial', purpose: 'How dispatchers work.', markdown: '# Dispatcher handbook (extracted)\n\n==p.7 Customers may reschedule until a technician is assigned.==\n\nTables on pages 12–14 could not be extracted.' },
        { id: 'S-5', title: 'visit-api-v2.yaml', kind: 'Import', provenance: 'uploaded during import', revision: 'a-02', freshness: 'current', status: 'accepted', purpose: 'Visit API description.', markdown: '# visit-api-v2.yaml\n\n```yaml\nPOST /visits/{id}/reschedule\n  description: allowed until dispatch starts\n```' },
        { id: 'S-6', title: 'dispatch-runbook.md', kind: 'Import', provenance: 'uploaded during import', revision: 'r-14', freshness: 'stale', status: 'stale', purpose: 'Operational runbook.', markdown: '# Dispatch runbook\n\n==Messages go through the dispatch-q queue.== (retired)' },
        { id: 'S-7', title: 'legacy-rescheduling-notes.md', kind: 'Import', provenance: 'uploaded during import', revision: 'l-03', freshness: 'current', status: 'disputed', purpose: 'Old notes on rescheduling.', markdown: '# Legacy notes\n\n==Rescheduling is allowed until the partner confirms dispatch.==' },
        { id: 'S-8', title: 'partner-contract-summary.md', kind: 'Import', provenance: 'uploaded during import', revision: 'p-01', freshness: 'current', status: 'accepted', purpose: 'Partner SLA and formats.', markdown: '# Partner contract summary\n\nPartner must receive time changes at least 2 hours before the visit.' },
      ],
      facts: [
        { id: 'F-1', text: 'Customers may reschedule until a technician is assigned.', kind: 'Conflict', source: 'S-4', conflictWith: 'F-2', usedBy: ['W-110'] },
        { id: 'F-2', text: 'Reschedule is allowed until dispatch starts.', kind: 'Conflict', source: 'S-5', conflictWith: 'F-1', usedBy: ['W-110'] },
        { id: 'F-3', text: 'Visit service rejects rescheduling only when status is DISPATCHED.', kind: 'Observed', source: 'S-1', usedBy: ['W-110', 'W-130'] },
        { id: 'F-4', text: 'Writer of the DISPATCHED status.', kind: 'Unknown', source: 'S-3', usedBy: ['W-120'] },
        { id: 'F-5', text: 'Partner must receive time changes at least 2 hours before the visit.', kind: 'Source-grounded', source: 'S-8', usedBy: ['W-140'] },
        { id: 'F-6', text: 'Messages go through the dispatch-q queue.', kind: 'Conflict', source: 'S-6', conflictWith: 'F-3', usedBy: [] },
      ],
      questions: [{ id: 'KQ-1', q: 'When does rescheduling stop?', keys: ['reschedule', 'rescheduling', 'stop', 'dispatch', 'technician'], answer: 'The sources disagree: the handbook says when a technician is assigned, the API says when dispatch starts, and the code only rejects DISPATCHED visits. Elena has been asked.', facts: ['F-1', 'F-2', 'F-3'] }],
      work,
      releases: [{ id: 'REL-1', name: 'Reschedule before dispatch', outcome: true, members: ['W-100'], budget: 9000, planned: '20 Nov', forecastFinish: 'Unknown', timeRatio: null }],
      risks: [
        { id: 'R-1', title: 'Sources disagree on when rescheduling stops', consequence: 'Customers may be allowed to reschedule after dispatch has started, sending a technician to a cancelled visit.', status: 'needs-owner', dims: { customer: 'high', scope: 'high', evidence: 'medium' }, now: [3, 3], target: [1, 2], owner: 'tomas', treatment: 'Get Elena\'s answer, then decide.', costImpact: 'Unknown', timeImpact: 'Blocks W-130', affects: ['W-110', 'W-130'], evidence: ['S-4', 'S-5', 'S-1'], responses: [], comments: [] },
        { id: 'R-2', title: 'Dispatch status writer unknown', consequence: 'A change to dispatch status could break a script nobody knows about, and the investigation cannot finish.', status: 'open', dims: { evidence: 'unknown', scope: 'medium' }, now: [0, 3], target: [1, 1], owner: 'matej', treatment: 'Read-only investigation W-120; request ops-scripts access.', costImpact: '€20–60', timeImpact: '+2 days', affects: ['W-120'], evidence: ['S-3'], responses: [], comments: [] },
        { id: 'R-3', title: 'Race between reschedule and dispatch start', consequence: 'A reschedule landing just as dispatch starts can leave a visit both moved and dispatched.', status: 'open', dims: { customer: 'high', evidence: 'low' }, now: [2, 3], target: [1, 2], owner: 'matej', treatment: 'Specify the race test before implementation.', costImpact: 'Unknown', timeImpact: 'Unknown', affects: ['W-150'], evidence: [], responses: [], comments: [] },
        { id: 'R-4', title: 'Budget and date are import placeholders', consequence: 'The imported budget and date are guesses, so every cost and time warning may be wrong.', status: 'open', dims: { cost: 'unknown', time: 'unknown' }, now: [2, 2], target: [1, 1], owner: 'tomas', treatment: 'Review after investigation.', costImpact: 'Unknown', timeImpact: 'Unknown', affects: [], evidence: [], responses: [], comments: [] },
      ],
      assignments: [
        { id: 'A-1', category: 'domain', to: 'elena', status: 'assigned', subject: 'W-110', ask: 'When must rescheduling stop: when a technician is assigned, or when dispatch starts?', why: 'Handbook, API and code disagree (FN-1).', blocks: 'Reschedule endpoint and portal button', waiting: 'Slice cannot be estimated', can: 'Answer, delegate to Sofia', cannot: 'Decide the product rule' },
        { id: 'A-2', category: 'architecture', to: 'matej', status: 'assigned', subject: 'W-120', ask: 'Who writes DISPATCHED? Approve a read-only investigation and request ops-scripts access if needed.', why: 'FN-2: no connected code writes it.', blocks: 'Implementation plan', waiting: 'Forecast unknown', can: 'Answer, request access', cannot: 'Grant repository access' },
      ],
      decisions: [],
      runs: [],
      events: [
        { at: 'Just now', icon: 'source', text: 'Servora imported: 2 repositories connected, 1 unavailable, 5 documents registered, 1 excluded', triggered: 'Knowledge established with 1 conflict, 1 unknown and 1 stale source', outcome: 'none' },
        { at: 'Just now', icon: 'forward_to_inbox', text: 'Import findings routed', triggered: 'A-1 to Elena (domain), A-2 to Matej (architecture) by routing rev 3', outcome: 'allow' },
      ],
      automations: automations(),
      contracts: { policy: policyContract('Servora', 100), agents: agentsContract(), skills: skillsContract(), settings: settingsContract('Europe/Berlin'), routing: routingContract({ product: { designated: 'tomas', canDelegate: true, eligible: ['sofia'] }, domain: { designated: 'elena', canDelegate: true, eligible: ['sofia'] }, architecture: { designated: 'matej', canDelegate: false, eligible: [] }, engineering: { designated: 'sofia', canDelegate: true, eligible: ['matej'] }, commercial: { designated: 'tomas', canDelegate: false, eligible: [] } }) },
      split: {},
    };
  }

  /* ------------------------------------------------------------------ Greenfield create scene */
  const createScene = {
    defaults: { name: 'Borrowbox', description: 'Let our community library lend books without paper cards.', budget: 12000, planned: '18 Dec' },
    descriptionOptions: [
      { id: 'members', title: 'Member outcome', desc: 'Members find, borrow and return books without paper cards, and staff always know where every copy is.', pros: 'Names who benefits and a measurable end state.', cons: 'Broader than a first release.', chips: ['Clear success test'] },
      { id: 'staff', title: 'Staff outcome', desc: 'Staff stop keeping paper cards and can answer “where is this copy?” in seconds.', pros: 'Easy to measure at the desk.', cons: 'Members\' experience is secondary.', chips: ['Narrower'] },
    ],
    refine: [
      { id: 'who', q: 'Who may borrow?', why: 'Changes sign-in and the first release size.', options: [{ id: 'card', title: 'Members with a library card', chips: ['Smallest'] }, { id: 'anyone', title: 'Anyone who registers online', chips: ['+€900', 'Identity risk'] }] },
      { id: 'first', q: 'What must the first release prove?', why: 'Sets the customer outcome for release 1.', options: [{ id: 'loan', title: 'A member can borrow a book and others see it is lent', chips: ['€3–4k'] }, { id: 'search', title: 'Members can see what is on the shelf', chips: ['€1.5–2k', 'No loans yet'] }] },
    ],
    documents: [
      { id: 'policy', title: 'loan-policy.md', note: 'Lending rules' },
      { id: 'survey', title: 'member-survey-2026.pdf', note: 'What members want' },
      { id: 'domain', title: 'domain-notes.md', note: 'How the desk works' },
    ],
    risks: [
      { id: 'R-1', title: 'A book can look available after it has been lent', dims: { customer: 'high', evidence: 'medium' }, why: 'Proposed from the member-outcome goal and loan policy.' },
      { id: 'R-2', title: 'Barcode format of existing copies is unknown', dims: { evidence: 'unknown', time: 'medium' }, why: 'No source describes it yet.' },
      { id: 'R-3', title: 'Member data retention period is unclear', dims: { authority: 'high' }, why: 'Member accounts store personal data.' },
    ],
    // First release proposals keyed by the answer to “What must the first release prove?”; the description choice and “Who may borrow?” adjust them.
    releases: {
      loan: { name: 'First loan, clearly available', items: [
        { title: 'Find a book to borrow', purpose: 'Members see what is on the shelf.', inScope: ['Title search with an available/lent marker'], outScope: ['Author and series search'], ac: ['Searching a title shows whether a copy is available.'], forecast: [900, 1200] },
        { title: 'Save a loan and update availability', purpose: 'A lent copy never shows as available.', inScope: ['Record the loan and lower availability in the same operation'], outScope: ['Reminders and fines'], ac: ['A saved loan is visible on the member\'s page.', 'A second member sees the copy as unavailable in the same request.'], forecast: [65, 130] },
        { title: 'Sign in with library card number', purpose: 'Members sign in with the card they have.', inScope: ['Card number and PIN sign-in'], outScope: ['Online registration'], ac: ['A member signs in with card number and PIN.'], forecast: [300, 420] },
      ] },
      search: { name: 'See what is on the shelf', items: [
        { title: 'Find a book to borrow', purpose: 'Members see what is on the shelf.', inScope: ['Title and author search'], outScope: ['Loans'], ac: ['Searching a title lists matching books.'], forecast: [900, 1200] },
        { title: 'Show availability in search results', purpose: 'Members know before they walk in.', inScope: ['An available/lent marker from the card index import'], outScope: ['Live loan updates'], ac: ['Each result shows available or lent.'], forecast: [400, 600] },
        { title: 'Import the card index', purpose: 'Search starts with the real catalogue.', inScope: ['A one-off import of the paper card index transcription'], outScope: ['Ongoing sync'], ac: ['Every transcribed card becomes a catalogue entry.'], forecast: [200, 350] },
      ] },
      staff: { name: 'Staff find any copy in seconds', items: [
        { title: 'Scan copies into the inventory', purpose: 'Every copy has a barcode record.', inScope: ['Scanning existing copies at the desk'], outScope: ['Member-facing search'], ac: ['A scanned copy appears in the inventory.'], forecast: [500, 800] },
        { title: 'Find a copy by barcode or title', purpose: 'Staff answer “where is this copy?”.', inScope: ['Staff search with shelf location'], outScope: ['Member search'], ac: ['Staff find a copy and its location in one search.'], forecast: [300, 500] },
        { title: 'Save a loan and update availability', purpose: 'Staff record a loan at the desk.', inScope: ['Record the loan and lower availability in one operation'], outScope: ['Reminders and fines'], ac: ['A saved loan changes the copy to lent.'], forecast: [65, 130] },
      ] },
      anyone: { title: 'Register online and verify identity', purpose: 'Anyone can register without visiting the library.', inScope: ['Online registration with identity verification'], outScope: ['Payments'], ac: ['A registered person can borrow after verification.'], forecast: [600, 900] },
    },
  };

  const directory = [
    { id: 'skillhaven', name: 'Skillhaven', owner: 'Tomas Weber', about: 'Training-session booking for learners, trainers and coordinators.' },
    { id: 'harbour', name: 'Harbour Clinic Rota', owner: 'Matej Novak', about: 'Shift rota for a small clinic (synthetic).' },
    { id: 'borrowbox', name: 'Borrowbox', owner: 'Tomas Weber', about: 'Community library lending.' },
  ];

  // Synthetic "files on your computer" for the attach popup. Content decides identity (model.js fingerprints the markdown):
  // the same bytes as an existing source link to it; the same name with other bytes asks whether it is a new revision.
  const bbPolicy = borrowbox.sources.find((s) => s.id === 'S-1').markdown;
  const uploads = {
    borrowbox: [
      { id: 'up-policy-copy', title: 'loan-policy.md', label: 'loan-policy.md (copy from the shared drive)', purpose: 'Accepted lending rules for members and staff.', markdown: bbPolicy, facts: [] },
      { id: 'up-policy-v2', title: 'loan-policy.md', label: 'loan-policy.md (edited 30 Sep: 28-day loans)', purpose: 'Accepted lending rules for members and staff.', markdown: bbPolicy.replace('The standard loan period is 21 days.', '==The standard loan period is 28 days.=='), facts: ['A lent copy must show as unavailable in the same operation that saves the loan.', 'Standard loan period is 28 days; staff may extend once.', 'Members may borrow up to 5 books at a time.', 'Fines and payments are handled outside Borrowbox.'] },
      { id: 'up-barcode', title: 'barcode-format.txt', label: 'barcode-format.txt (now shared by Matej)', purpose: 'Format of the existing copy barcodes.', facts: ['Copy barcodes are Code 39 with an 8-digit copy number.'], resolvesRisk: 'R-14', markdown: '# Barcode format\n\n==Code 39, 8-digit copy number, prefix BB.==' },
      { id: 'up-returns', title: 'returns-desk-procedure.md', label: 'returns-desk-procedure.md', purpose: 'How staff process returns.', facts: ['Returned copies are shelved within 24 hours.', 'Damaged copies go to a separate shelf with a note.'], markdown: '# Returns desk procedure\n\n==Returned copies are shelved within 24 hours.==' },
    ],
    default: [{ id: 'up-notes', title: 'meeting-notes.md', label: 'meeting-notes.md', purpose: 'Notes from the last project meeting.', facts: ['The team agreed to review scope weekly.'], markdown: '# Meeting notes\n\n==Review scope weekly.==' }],
  };

  ADE.fixtures = { people, categories, projects: { borrowbox, skillhaven }, importScene, servoraProject, createScene, directory, uploads, agentsContract, skillsContract, settingsContract, policyContract, routingContract, automations };
})(typeof window !== 'undefined' ? window : globalThis);
