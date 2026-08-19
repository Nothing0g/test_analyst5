(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const root = document.documentElement;
  const body = document.body;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const type = body.dataset.report || 'uber';
  const applyTheme = (theme) => {
    root.dataset.theme = theme;
    localStorage.setItem('portfolio-theme-v2', theme);
    const top = $('#reportThemeToggle');
    if (top) top.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
  };
  applyTheme(localStorage.getItem('portfolio-theme-v2') || 'light');

  const themeIcon = (theme) => theme === 'dark' ? '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"/>' : '<path d="M20.5 15.2A8.7 8.7 0 019.8 4.5 8.7 8.7 0 1020.5 15.2z"/>';
  const syncThemeIcons = () => { $$('#reportThemeIcon,#dockThemeIcon').forEach(icon => icon.innerHTML = themeIcon(root.dataset.theme)); };
  const toggleTheme = () => { applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'); syncThemeIcons(); };
  $('#reportThemeToggle')?.addEventListener('click', toggleTheme); $('#dockThemeBtn')?.addEventListener('click', toggleTheme); syncThemeIcons();

  const canvas = $('#bgCanvas');
  if (canvas && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const ctx = canvas.getContext('2d');
    let width = 0, height = 0, dpr = Math.min(devicePixelRatio || 1, 2), particles = [];
    const resize = () => { width = innerWidth; height = innerHeight; canvas.width = width * dpr; canvas.height = height * dpr; canvas.style.width = `${width}px`; canvas.style.height = `${height}px`; ctx.setTransform(dpr,0,0,dpr,0,0); particles = Array.from({length: Math.min(42, Math.floor(width / 28))}, (_, index) => ({ x: (index * 83) % width, y: (index * 137) % height, r: index % 5 === 0 ? 1.8 : .9, drift: .08 + (index % 4) * .025, alpha: .18 + (index % 5) * .035 })); };
    const tick = () => { ctx.clearRect(0,0,width,height); particles.forEach(p => { p.y += p.drift; if (p.y > height + 8) p.y = -8; ctx.beginPath(); ctx.fillStyle = `rgba(36,87,214,${p.alpha})`; ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill(); }); requestAnimationFrame(tick); };
    addEventListener('resize', resize, {passive:true}); resize(); tick();
  }

  const dot = $('#cursorDot'); const follow = $('#cursorFollow');
  if (finePointer && dot && follow) {
    root.classList.add('custom-cursor');
    let x=innerWidth/2,y=innerHeight/2,tx=x,ty=y,frame=0;
    const move = (event) => { tx=event.clientX;ty=event.clientY;dot.style.opacity='1'; if(!frame) frame=requestAnimationFrame(()=>{x+=(tx-x)*.22;y+=(ty-y)*.22;dot.style.transform=`translate3d(${x}px,${y}px,0) translate(-50%,-50%)`;follow.style.transform=`translate3d(${x+15}px,${y+15}px,0)`;frame=0;}); const surface=event.target.closest('.interactive-surface'); if(surface){const rect=surface.getBoundingClientRect();surface.style.setProperty('--pointer-x',`${event.clientX-rect.left}px`);surface.style.setProperty('--pointer-y',`${event.clientY-rect.top}px`);} };
    window.addEventListener('mousemove',move,{passive:true});
    document.addEventListener('mouseover',event=>{const target=event.target.closest('[data-cursor-text],a,button');if(!target)return;body.classList.add('cursor-hover');follow.textContent=target.dataset.cursorText||target.getAttribute('aria-label')||(target.tagName==='A'?'Open':'Select');});
    document.addEventListener('mouseout',event=>{const from=event.target.closest('[data-cursor-text],a,button');const to=event.relatedTarget?.closest?.('[data-cursor-text],a,button');if(from&&from!==to)body.classList.remove('cursor-hover');});
    window.addEventListener('mouseleave',()=>{dot.style.opacity='0';body.classList.remove('cursor-hover');});
  }

  const progress = $('#scrollProgress'); let scrollFrame=0;
  const updateScroll = () => { if(scrollFrame)return; scrollFrame=requestAnimationFrame(()=>{const max=document.documentElement.scrollHeight-innerHeight;if(progress)progress.style.width=`${max>0?(scrollY/max)*100:0}%`;const sections=$$('.report-page>section[id]');const current=sections.reduce((active,section)=>section.getBoundingClientRect().top<=innerHeight*.34?section:active,sections[0]);$$('[data-report-nav]').forEach(link=>link.classList.toggle('active',link.getAttribute('href')===`#${current?.id}`));scrollFrame=0;});};
  addEventListener('scroll',updateScroll,{passive:true});addEventListener('resize',updateScroll,{passive:true});updateScroll();
  $$('[data-report-nav]').forEach(link=>link.addEventListener('click',event=>{const href=link.getAttribute('href');if(href?.startsWith('#')){event.preventDefault();document.querySelector(href)?.scrollIntoView({behavior:'smooth',block:'start'});}}));

  const overlay = $('#commandOverlay'); const input = $('#commandInput'); const results = $('#commandResults');
  const commands=[{label:'Case brief',meta:'Section 01',href:'#report'},{label:'Executive snapshot',meta:'Section 02',href:'#snapshot'},{label:'Interactive dashboard',meta:'Section 03',href:'#dashboard'},{label:'Analytical readout',meta:'Section 04',href:'#insights'},{label:'Method and source',meta:'Section 05',href:'#method'},{label:'Portfolio home',meta:'Back',href:'../../index.html'}]; let active=0;
  const render=(query='')=>{const q=query.toLowerCase().trim();const list=commands.filter(item=>`${item.label} ${item.meta}`.toLowerCase().includes(q));active=0;if(results)results.innerHTML=list.map((item,index)=>`<a class="command-result${index===0?' is-active':''}" href="${item.href}" data-command-href="${item.href}"><span>${item.label}</span><small>${item.meta}</small></a>`).join('');};
  const open=()=>{overlay?.classList.add('is-open');overlay?.setAttribute('aria-hidden','false');render();setTimeout(()=>input?.focus(),30)}; const close=()=>{overlay?.classList.remove('is-open');overlay?.setAttribute('aria-hidden','true');};
  $('#reportSearch')?.addEventListener('click',open);$('#commandClose')?.addEventListener('click',close);overlay?.addEventListener('click',event=>{if(event.target===overlay)close();});input?.addEventListener('input',event=>render(event.target.value));results?.addEventListener('click',event=>{const link=event.target.closest('[data-command-href]');if(!link)return;const href=link.dataset.commandHref;if(href.startsWith('#')){event.preventDefault();close();document.querySelector(href)?.scrollIntoView({behavior:'smooth'});}});
  document.addEventListener('keydown',event=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();open();}if(event.key==='Escape')close();if(!overlay?.classList.contains('is-open'))return;const items=$$('.command-result');if(event.key==='ArrowDown'){event.preventDefault();active=Math.min(active+1,items.length-1);items.forEach((item,index)=>item.classList.toggle('is-active',index===active));}if(event.key==='ArrowUp'){event.preventDefault();active=Math.max(active-1,0);items.forEach((item,index)=>item.classList.toggle('is-active',index===active));}if(event.key==='Enter'){event.preventDefault();items[active]?.click();}});

  $$('[data-transition]').forEach(link=>link.addEventListener('click',event=>{if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;const href=link.getAttribute('href');if(!href)return;event.preventDefault();body.classList.add('page-exit');setTimeout(()=>location.href=href,260);}));
  setTimeout(()=>body.classList.add('page-ready'),30);
})();
