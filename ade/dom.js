// ADE v3 lo-fi prototype · DOM glue: rendering, event delegation, popup, full screen, toast and the prototype bar.
(function () {
  const ADE = window.ADE;
  const $ = (s, r = document) => r.querySelector(s);
  const app = $('#app'); const proto = $('#proto'); const dialog = $('#popup'); const toastEl = $('#toast'); const live = $('#live');
  let toastTimer = null;

  function gather(el) {
    const scope = el.closest('[data-form]'); const out = {};
    if (!scope) return out;
    const fields = [...scope.querySelectorAll('input[name], select[name], textarea[name]')].filter((f) => f.closest('[data-form]') === scope);
    const counts = fields.reduce((m, f) => ((m[f.name] = (m[f.name] || 0) + 1), m), {});
    fields.forEach((f) => {
      if (f.type === 'radio') { if (f.checked) out[f.name] = f.value; return; }
      if (f.type === 'checkbox') { if (counts[f.name] > 1 || f.name === 'pick') { out[f.name] = out[f.name] || []; if (f.checked) out[f.name].push(f.value); } else if (f.checked) out[f.name] = f.value || 'on'; return; }
      out[f.name] = f.value;
    });
    return out;
  }

  function focusKey(el) { return el && el.dataset && el.dataset.input ? ['input', el.dataset.input, el.dataset.group, el.dataset.option, el.dataset.idx, el.dataset.field].join('|') : el && el.id ? `id|${el.id}` : null; }
  function restoreFocus(key, sel) {
    if (!key) return;
    const [kind, ...rest] = key.split('|');
    const el = kind === 'id' ? document.getElementById(rest[0]) : [...document.querySelectorAll('[data-input]')].find((x) => focusKey(x) === key);
    if (!el) return;
    el.focus({ preventScroll: true });
    if (sel && typeof el.setSelectionRange === 'function') try { el.setSelectionRange(sel[0], sel[1]); } catch { /* not a text field */ }
  }

  function protoBar() {
    const s = ADE.state; const people = ADE.fixtures.people;
    proto.innerHTML = `<span class="proto__tag">${ADE.flavor === 'hifi' ? 'HI-FI PROTOTYPE' : 'LO-FI PROTOTYPE'}</span><span class="proto__note">Synthetic data · deterministic actions · no backend, agent or policy engine</span>
      <label>Start state <select data-input="protoStartSel">${Object.entries(ADE.STARTS).map(([k, v]) => `<option value="${k}" ${s.start === k ? 'selected' : ''}>${v.label}</option>`).join('')}</select></label>
      <label>Signed in as <select data-input="protoPersona">${Object.values(people).map((p) => `<option value="${p.id}" ${s.persona === p.id ? 'selected' : ''}>${p.name} · ${p.role}</option>`).join('')}</select></label>
      <button type="button" data-act="protoTick" title="Prototype only. Moves every project one deterministic step: running agent workflows advance one step (with AU-4 pauses), queued runs start when a slot frees, requested stops confirm, document extraction finishes, readiness is re-checked and AU-1 regenerates outdated summaries." aria-describedby="tick-help"><i class="icon" data-icon="timer" aria-hidden="true"></i>Simulate next tick</button><span id="tick-help" class="visually-hidden">Moves runs, queues, stops, extractions and outdated summaries one deterministic step.</span>
      <button type="button" data-act="journeysOpen"><i class="icon" data-icon="science" aria-hidden="true"></i>Journeys</button>
      <button type="button" data-act="protoReset"><i class="icon" data-icon="sync" aria-hidden="true"></i>Reset</button>`;
  }

  function renderPopup(spec) {
    const content = ADE.popups[spec.kind](spec.args);
    const [ic, eyebrow] = content.eyebrow;
    const wasFull = dialog.classList.contains('is-fullscreen');
    const scroll = $('.popup__body', dialog)?.scrollTop || 0;
    dialog.className = `popup${content.wide ? ' popup--wide' : ''}${wasFull ? ' is-fullscreen' : ''}`;
    dialog.innerHTML = `<div data-form class="popup__frame"><header class="popup__header"><div><p class="popup__eyebrow"><i class="icon" data-icon="${ic}" aria-hidden="true"></i>${ADE.esc(eyebrow)}</p><h2 class="popup__title" id="popup-title">${ADE.esc(content.title)}</h2></div>
      <div class="popup__tools"><button class="icon-btn" type="button" data-popup-fs aria-pressed="${wasFull}" aria-label="${wasFull ? 'Exit full screen' : 'Full screen'}"><i class="icon" data-icon="${wasFull ? 'fullscreen_exit' : 'fullscreen'}"></i></button><button class="icon-btn" type="button" data-act="popupClose" aria-label="Close"><i class="icon" data-icon="close"></i></button></div></header>
      <div class="popup__body">${content.body}</div>${content.footer ? `<footer class="popup__footer">${content.footer}</footer>` : ''}</div>`;
    dialog.setAttribute('aria-labelledby', 'popup-title');
    $('.popup__body', dialog).scrollTop = scroll;
    if (!dialog.open) { popupTrigger = document.activeElement; dialog.showModal(); }
  }
  let popupTrigger = null;

  function render() {
    const active = document.activeElement; const key = focusKey(active);
    const sel = active && typeof active.selectionStart === 'number' ? [active.selectionStart, active.selectionEnd] : null;
    const scrollY = window.scrollY;
    const hash = location.hash || '#/';
    const r = ADE.render(hash);
    if (r.hash !== hash) { history.replaceState(null, '', r.hash); ADE.visit(r.hash); }
    app.innerHTML = r.html;
    protoBar();
    if (!ADE.ui.popup && r.routePopup) ADE.ui.popup = r.routePopup;
    if (ADE.ui.popup) renderPopup(ADE.ui.popup); else if (dialog.open) { dialog.close(); popupTrigger?.focus?.(); }
    if (ADE.ui.toast) { toastEl.textContent = ADE.ui.toast; toastEl.hidden = false; live.textContent = ADE.ui.toast; ADE.ui.toast = null; clearTimeout(toastTimer); toastTimer = setTimeout(() => { toastEl.hidden = true; }, 6000); }
    window.scrollTo(0, scrollY);
    restoreFocus(key, sel);
    if (ADE.ui.focusLast) { const [, k, i] = ADE.ui.focusLast.split('|'); ADE.ui.focusLast = null; [...document.querySelectorAll('[data-input="fieldItem"]')].find((x) => x.dataset.key === k && x.dataset.idx === i)?.focus(); }
    document.title = `${$('h1', app)?.textContent || 'ADE'} · ADE v3 ${ADE.flavor === 'hifi' ? 'hi-fi' : 'lo-fi'}`;
    if (ADE.afterRender) ADE.afterRender(app);
  }

  function run(name, args) {
    if (!ADE.actions[name]) { console.warn('No action', name); return; }
    ADE.dispatch(name, args);
    ADE.save();
    const next = ADE.pendingNav; ADE.pendingNav = null;
    if (next && next !== location.hash) { location.hash = next; return; }
    render();
  }
  // Browser-only enhancements (hi-fi drag reordering) dispatch through the same path as clicks.
  ADE.run = run;

  document.addEventListener('click', (e) => {
    const fsBtn = e.target.closest('[data-fs]');
    if (fsBtn) { const t = $(fsBtn.dataset.fs); if (t) { const on = !t.classList.contains('is-fullscreen'); t.classList.toggle('is-fullscreen', on); fsBtn.setAttribute('aria-label', on ? 'Exit full screen' : 'Full screen'); live.textContent = on ? 'Full screen on. Press Escape to exit.' : 'Full screen off.'; } return; }
    if (e.target.closest('[data-popup-fs]')) { const on = !dialog.classList.contains('is-fullscreen'); dialog.classList.toggle('is-fullscreen', on); const b = e.target.closest('[data-popup-fs]'); b.setAttribute('aria-pressed', String(on)); b.setAttribute('aria-label', on ? 'Exit full screen' : 'Full screen'); b.querySelector('.icon').dataset.icon = on ? 'fullscreen_exit' : 'fullscreen'; return; }
    const el = e.target.closest('[data-act]');
    if (!el) { if (!e.target.closest('.project-menu')) document.querySelectorAll('.project-menu[open]').forEach((d) => d.removeAttribute('open')); if (!e.target.closest('.omni') && ADE.ui.omniAlternatives) { ADE.ui.omniAlternatives = null; render(); } return; }
    if (el.matches('input[type=radio]')) return; // handled on change
    if (el.tagName === 'A' || el.tagName === 'BUTTON') e.preventDefault();
    const args = { ...el.dataset, form: gather(el) };
    if (el.tagName === 'A' && el.getAttribute('href') && el.dataset.act === 'popupClose') { ADE.actions.popupClose(args); ADE.save(); ADE.pendingNav = null; location.hash = el.getAttribute('href'); return; }
    run(el.dataset.act, args);
  });
  document.addEventListener('change', (e) => {
    const el = e.target;
    if (el.matches('input[type=radio][data-act]')) { run(el.dataset.act, { ...el.dataset }); return; }
    if (el.matches('select[data-input], input[type=checkbox][data-input]')) handleInput(el);
  });
  document.addEventListener('input', (e) => { const el = e.target; if (el.matches('input[data-input]:not([type=checkbox]), textarea[data-input]')) handleInput(el); });
  function handleInput(el) {
    const name = el.dataset.input;
    if (name === 'protoStartSel') { run('protoStart', { v: el.value }); return; }
    if (name === 'protoPersona') { run('protoPersona', { value: el.value }); return; }
    run(name, { ...el.dataset, value: el.value, checked: el.checked });
  }
  document.addEventListener('submit', (e) => { const f = e.target.closest('[data-submit]'); if (!f) return; e.preventDefault(); run(f.dataset.submit, { ...f.dataset, form: gather(f.querySelector('input,textarea') || f) }); });
  dialog.addEventListener('cancel', (e) => { e.preventDefault(); if (dialog.classList.contains('is-fullscreen')) { dialog.classList.remove('is-fullscreen'); return; } run('popupClose', {}); });
  dialog.addEventListener('click', (e) => { if (e.target === dialog) run('popupClose', {}); });
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); $('.omni input')?.focus(); return; }
    if (e.key === 'Enter' && e.target.matches('input[data-input="fieldItem"]')) { e.preventDefault(); run('fieldAdd', { key: e.target.dataset.key }); return; }
    if (e.key === 'Escape') {
      // Innermost first: an element in full screen (also inside the popup), then the popup's full screen, then the popup itself (cancel).
      const fs = document.querySelector('.is-fullscreen:not(dialog)'); if (fs) { e.preventDefault(); fs.classList.remove('is-fullscreen'); return; }
      if (dialog.open && dialog.classList.contains('is-fullscreen')) { e.preventDefault(); dialog.classList.remove('is-fullscreen'); return; }
      if (ADE.ui.omniAlternatives) { ADE.ui.omniAlternatives = null; render(); }
    }
  });
  // A new page starts at the top; a change of view on the same page (tab, filter, pager, matrix cell, risk popup:
  // only the query differs) keeps the scroll position.
  let lastPath = (location.hash || '#/').split('?')[0];
  window.addEventListener('hashchange', () => { if (ADE.ui.popup && ADE.ui.popup.kind === 'risk' && !/[?&]risk=/.test(location.hash)) ADE.ui.popup = null; ADE.ui.editing = null; ADE.visit(location.hash); ADE.save(); const path = location.hash.split('?')[0]; const same = path === lastPath; lastPath = path; const y = window.scrollY; render(); $('#main')?.focus({ preventScroll: true }); window.scrollTo(0, same ? y : 0); });

  ADE.load();
  ADE.visit(location.hash || '#/');
  render();
})();
