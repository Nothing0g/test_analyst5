(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const root = document.documentElement;
  const body = document.body;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  const applyTheme = (theme) => {
    root.dataset.theme = theme;
    localStorage.setItem('portfolio-theme-v2', theme);
    const button = $('#themeToggle');
    if (button) button.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
  };
  applyTheme(localStorage.getItem('portfolio-theme-v2') || 'light');

  const themeButton = $('#themeToggle');
  themeButton?.addEventListener('click', () => applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));

  const dot = $('#cursorDot');
  const ring = $('#cursorRing');
  const cursorLabel = $('#cursorLabel');
  if (finePointer && dot && ring && cursorLabel) {
    root.classList.add('custom-cursor');
    let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y, frame = 0;
    const move = (event) => {
      tx = event.clientX; ty = event.clientY;
      dot.style.opacity = '1'; ring.style.opacity = '1';
      if (!frame) frame = requestAnimationFrame(() => {
        x += (tx - x) * .22; y += (ty - y) * .22;
        dot.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%)`;
        ring.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%)`;
        cursorLabel.style.transform = `translate3d(${x + 15}px,${y + 15}px,0)`;
        frame = 0;
      });
      const surface = event.target.closest('.interactive-surface');
      if (surface) {
        const rect = surface.getBoundingClientRect();
        surface.style.setProperty('--pointer-x', `${event.clientX - rect.left}px`);
        surface.style.setProperty('--pointer-y', `${event.clientY - rect.top}px`);
      }
    };
    window.addEventListener('mousemove', move, { passive: true });
    document.addEventListener('mouseover', (event) => {
      const target = event.target.closest('[data-cursor],a,button');
      if (!target) return;
      body.classList.add('cursor-hover');
      cursorLabel.textContent = target.dataset.cursor || target.getAttribute('aria-label') || (target.tagName === 'A' ? 'Open' : 'Select');
    });
    document.addEventListener('mouseout', (event) => {
      const from = event.target.closest('[data-cursor],a,button');
      const to = event.relatedTarget?.closest?.('[data-cursor],a,button');
      if (from && from !== to) body.classList.remove('cursor-hover');
    });
    window.addEventListener('mouseleave', () => { dot.style.opacity = '0'; ring.style.opacity = '0'; body.classList.remove('cursor-hover'); });
  }

  const progress = $('#readProgress');
  let scrollFrame = 0;
  const updateScroll = () => {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      const max = document.documentElement.scrollHeight - innerHeight;
      if (progress) progress.style.width = `${max > 0 ? (scrollY / max) * 100 : 0}%`;
      const sections = $$('main section[id]');
      const current = sections.reduce((active, section) => section.getBoundingClientRect().top <= innerHeight * .35 ? section : active, sections[0]);
      $$('[data-nav]').forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${current?.id}`));
      scrollFrame = 0;
    });
  };
  addEventListener('scroll', updateScroll, { passive: true });
  addEventListener('resize', updateScroll, { passive: true });
  updateScroll();

  const revealItems = $$('.hero-copy,.hero-instrument,.signal-band>div,.section-heading,.case-card,.method-card,.tool-ribbon,.about-copy,.about-side,.contact-panel');
  revealItems.forEach((item, index) => { item.classList.add('reveal'); item.style.transitionDelay = `${Math.min(index * 38, 320)}ms`; });
  const revealObserver = new IntersectionObserver((entries) => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target); } }), { threshold: .12, rootMargin: '0px 0px -8% 0px' });
  revealItems.forEach(item => revealObserver.observe(item));

  const lensCopy = {
    question: { heading: 'Every chart should earn its place.', copy: 'Start with the decision that could change if the number moves.' },
    evidence: { heading: 'Make the signal inspectable.', copy: 'Use rates, segments, and models that expose how the claim was built.' },
    decision: { heading: 'Leave with a next move.', copy: 'The useful output is not certainty—it is a better question for the team.' }
  };
  const reading = $('#instrumentReading');
  const instrumentCopy = $('#instrumentCopy');
  const setLens = (lens) => {
    const text = lensCopy[lens] || lensCopy.question;
    [reading, instrumentCopy].forEach(node => { if (!node) return; node.animate([{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(5px)' }], { duration: 110, easing: 'ease-in', fill: 'forwards' }).finished.then(() => { node.textContent = node === reading ? text.heading : text.copy; node.animate([{ opacity: 0, transform: 'translateY(-5px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 210, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' }); }); });
    $$('.instrument-control').forEach(button => { const active = button.dataset.lens === lens; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); });
  };
  $$('.instrument-control').forEach(button => button.addEventListener('click', () => setLens(button.dataset.lens)));

  const cards = $$('.case-card');
  const filterTabs = $$('.filter-tab');
  const resultCount = $('#resultCount');
  const setFilter = (filter) => {
    let visible = 0;
    cards.forEach((card, index) => {
      const show = filter === 'all' || card.dataset.case === filter;
      card.dataset.hidden = String(!show);
      card.setAttribute('aria-hidden', String(!show));
      if (show) { visible += 1; card.animate([{ opacity: .35, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 240, delay: index * 40, easing: 'cubic-bezier(.2,.8,.2,1)' }); }
    });
    filterTabs.forEach(tab => { const active = tab.dataset.filter === filter; tab.classList.toggle('active', active); tab.setAttribute('aria-pressed', String(active)); });
    if (resultCount) resultCount.textContent = `${String(visible).padStart(2, '0')} CASE${visible === 1 ? '' : 'S'} / 02 VISIBLE`;
  };
  filterTabs.forEach(tab => tab.addEventListener('click', () => setFilter(tab.dataset.filter)));

  const toast = $('#toast');
  const showToast = (message) => { if (!toast) return; toast.textContent = message; toast.classList.add('is-visible'); setTimeout(() => toast.classList.remove('is-visible'), 2400); };
  $$('[data-copy]').forEach(button => button.addEventListener('click', async () => { try { await navigator.clipboard.writeText(button.dataset.copy); showToast('Email copied to clipboard'); } catch { showToast(button.dataset.copy); } }));

  const drawer = $('#mobileMenu');
  const menuButton = $('#menuToggle');
  const closeMenu = () => { drawer?.classList.remove('is-open'); drawer?.setAttribute('aria-hidden','true'); menuButton?.setAttribute('aria-expanded','false'); document.body.classList.remove('drawer-open'); };
  const openMenu = () => { drawer?.classList.add('is-open'); drawer?.setAttribute('aria-hidden','false'); menuButton?.setAttribute('aria-expanded','true'); document.body.classList.add('drawer-open'); };
  menuButton?.addEventListener('click', openMenu); $('#mobileClose')?.addEventListener('click', closeMenu); $$('[data-mobile-nav]').forEach(link => link.addEventListener('click', closeMenu));

  const commandOverlay = $('#commandOverlay');
  const commandInput = $('#commandInput');
  const commandResults = $('#commandResults');
  const commands = [
    { label: 'Selected work', meta: 'Section 01', href: '#work' },
    { label: 'Working method', meta: 'Section 02', href: '#method' },
    { label: 'About Shubham', meta: 'Section 03', href: '#about' },
    { label: 'Start a conversation', meta: 'Section 04', href: '#contact' },
    { label: 'Uber ride demand case', meta: 'Operations', href: 'projects/uber-ride-demand/' },
    { label: 'HR employee attrition case', meta: 'People analytics', href: 'projects/hr-employee-attrition/' }
  ];
  let activeCommand = 0;
  const renderCommands = (query = '') => { const q = query.trim().toLowerCase(); const matches = commands.filter(command => `${command.label} ${command.meta}`.toLowerCase().includes(q)); activeCommand = 0; if (commandResults) commandResults.innerHTML = matches.map((command, index) => `<a class="command-result${index === 0 ? ' is-active' : ''}" href="${command.href}" data-command-href="${command.href}"><span>${command.label}</span><small>${command.meta}</small></a>`).join(''); };
  const openCommands = () => { commandOverlay?.classList.add('is-open'); commandOverlay?.setAttribute('aria-hidden','false'); renderCommands(); setTimeout(() => commandInput?.focus(), 30); };
  const closeCommands = () => { commandOverlay?.classList.remove('is-open'); commandOverlay?.setAttribute('aria-hidden','true'); };
  $('#commandTrigger')?.addEventListener('click', openCommands); $('#commandClose')?.addEventListener('click', closeCommands); commandOverlay?.addEventListener('click', event => { if (event.target === commandOverlay) closeCommands(); }); commandInput?.addEventListener('input', event => renderCommands(event.target.value));
  commandResults?.addEventListener('click', event => { const link = event.target.closest('[data-command-href]'); if (!link) return; const href = link.dataset.commandHref; if (href.startsWith('#')) { event.preventDefault(); closeCommands(); document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } });
  document.addEventListener('keydown', event => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); openCommands(); }
    if (event.key === 'Escape') { closeCommands(); closeMenu(); }
    if (!commandOverlay?.classList.contains('is-open')) return;
    const results = $$('.command-result');
    if (event.key === 'ArrowDown') { event.preventDefault(); activeCommand = Math.min(activeCommand + 1, results.length - 1); results.forEach((r,i) => r.classList.toggle('is-active', i === activeCommand)); results[activeCommand]?.scrollIntoView({ block:'nearest' }); }
    if (event.key === 'ArrowUp') { event.preventDefault(); activeCommand = Math.max(activeCommand - 1, 0); results.forEach((r,i) => r.classList.toggle('is-active', i === activeCommand)); results[activeCommand]?.scrollIntoView({ block:'nearest' }); }
    if (event.key === 'Enter') { event.preventDefault(); results[activeCommand]?.click(); }
  });

  $$('[data-route]').forEach(link => link.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const href = link.getAttribute('href'); if (!href) return;
    event.preventDefault();
    body.classList.add('page-exit');
    setTimeout(() => { location.href = href; }, 260);
  }));

  setTimeout(() => body.classList.add('page-ready'), 30);
})();
