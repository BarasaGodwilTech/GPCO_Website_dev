// ============================================================
// Green Pasture Christian Outreach — main.js
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- header scroll state ---------- */
  const header = document.querySelector('.site-header');
  const setHeaderState = () => {
    if (!header) return;
    if (window.scrollY > 40) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  };
  setHeaderState();
  window.addEventListener('scroll', setHeaderState, { passive: true });

  /* ---------- mobile nav ---------- */
  const toggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  const scrim = document.querySelector('.nav-scrim');
  const root = document.documentElement;

  const setNav = (open) => {
    toggle?.classList.toggle('open', open);
    navLinks?.classList.toggle('open', open);
    scrim?.classList.toggle('open', open);
    root.classList.toggle('nav-open', open);            // locks page scroll + tidies the header (CSS)
    toggle?.setAttribute('aria-expanded', String(open));
    toggle?.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  const isNavOpen = () => !!navLinks?.classList.contains('open');
  const closeNav = () => setNav(false);

  toggle?.addEventListener('click', () => setNav(!isNavOpen()));
  scrim?.addEventListener('click', closeNav);
  navLinks?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeNav));

  // Esc closes the menu and hands focus back to the button
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isNavOpen()){ closeNav(); toggle?.focus(); }
  });
  // swipe the drawer to the right to close it
  let touchX = null, touchY = null;
  navLinks?.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; touchY = e.touches[0].clientY; }, { passive: true });
  navLinks?.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    const dy = Math.abs(e.changedTouches[0].clientY - touchY);
    if (dx > 70 && dy < 60) closeNav();
    touchX = touchY = null;
  }, { passive: true });
  // rotating a tablet / resizing to desktop: never leave the menu "stuck" open
  window.matchMedia('(min-width: 861px)').addEventListener('change', (e) => { if (e.matches) closeNav(); });

  /* ---------- mobile-friendly dropdowns ----------
     Each <select> gets a custom list that is exactly as wide as its field, so it can never
     run off-screen. The native <select> stays in the page as the real form value
     (CSS only shows the custom version at <= 860px). */
  document.querySelectorAll('.form-field select').forEach((select, n) => {
    const field = select.closest('.form-field');
    const label = field?.querySelector('label');
    const uid = select.id || `select-${n}`;
    if (label && !label.id) label.id = `${uid}-label`;

    const wrap = document.createElement('div');
    wrap.className = 'cselect';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cselect-btn';
    btn.id = `${uid}-btn`;
    btn.setAttribute('role', 'combobox');
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', `${uid}-list`);
    if (label) btn.setAttribute('aria-labelledby', `${label.id} ${btn.id}`);
    btn.innerHTML = '<span></span><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const btnText = btn.querySelector('span');

    const list = document.createElement('ul');
    list.className = 'cselect-list';
    list.id = `${uid}-list`;
    list.setAttribute('role', 'listbox');
    if (label) list.setAttribute('aria-labelledby', label.id);

    const items = Array.from(select.options).map((opt, i) => {
      const li = document.createElement('li');
      li.id = `${uid}-opt-${i}`;
      li.setAttribute('role', 'option');
      li.textContent = opt.textContent;
      li.dataset.index = i;
      list.appendChild(li);
      return li;
    });

    let active = select.selectedIndex;

    const render = () => {
      btnText.textContent = select.options[select.selectedIndex]?.textContent || '';
      items.forEach((li, i) => {
        li.setAttribute('aria-selected', String(i === select.selectedIndex));
        li.classList.toggle('is-active', i === active);
      });
    };
    const setActive = (i) => {
      active = Math.max(0, Math.min(items.length - 1, i));
      items.forEach((li, k) => li.classList.toggle('is-active', k === active));
      btn.setAttribute('aria-activedescendant', items[active].id);
      items[active].scrollIntoView({ block: 'nearest' });
    };
    const isOpen = () => wrap.classList.contains('open');
    const open = () => {
      // open upward if there isn't room below the field
      const r = btn.getBoundingClientRect();
      const need = Math.min(list.scrollHeight, Math.min(240, window.innerHeight * 0.45)) + 16;
      const below = window.innerHeight - r.bottom, above = r.top;
      wrap.classList.toggle('up', below < need && above > below);
      wrap.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      setActive(select.selectedIndex);
    };
    const close = () => {
      wrap.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      btn.removeAttribute('aria-activedescendant');
    };
    const choose = (i) => {
      select.selectedIndex = i;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      active = i;
      render();
      close();
    };

    btn.addEventListener('click', () => (isOpen() ? close() : open()));
    btn.addEventListener('keydown', (e) => {
      switch (e.key){
        case 'ArrowDown': e.preventDefault(); isOpen() ? setActive(active + 1) : open(); break;
        case 'ArrowUp':   e.preventDefault(); isOpen() ? setActive(active - 1) : open(); break;
        case 'Home':      if (isOpen()){ e.preventDefault(); setActive(0); } break;
        case 'End':       if (isOpen()){ e.preventDefault(); setActive(items.length - 1); } break;
        case 'Enter':
        case ' ':         e.preventDefault(); isOpen() ? choose(active) : open(); break;
        case 'Escape':    if (isOpen()){ e.preventDefault(); close(); } break;
        case 'Tab':       close(); break;
      }
    });
    list.addEventListener('click', (e) => {
      const li = e.target.closest('li');
      if (li) choose(Number(li.dataset.index));
    });
    document.addEventListener('pointerdown', (e) => { if (isOpen() && !wrap.contains(e.target)) close(); });
    window.addEventListener('resize', close);
    // tapping the <label> should focus the visible control on mobile
    label?.addEventListener('click', (e) => {
      if (getComputedStyle(wrap).display !== 'none'){ e.preventDefault(); btn.focus(); }
    });
    // keep in sync when the form is reset (the contact form resets itself after "sending")
    select.form?.addEventListener('reset', () => setTimeout(() => { active = select.selectedIndex; render(); }, 0));

    wrap.append(btn, list);
    select.classList.add('has-cselect');
    select.after(wrap);
    render();
  });

  /* ---------- scroll reveals ---------- */
  const revealEls = document.querySelectorAll('.reveal, .reveal-stagger, .dusk');
  if ('IntersectionObserver' in window && revealEls.length){
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting){
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  /* ---------- dusk starfield (founding-story section) ---------- */
  const starLayer = document.querySelector('.dusk-stars');
  if (starLayer){
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 1000 600');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    svg.style.width = '100%';
    svg.style.height = '100%';

    const STAR_COUNT = 90;
    for (let i = 0; i < STAR_COUNT; i++){
      const cx = Math.random() * 1000;
      const cy = Math.random() * 600;
      const r = (Math.random() * 1.1 + 0.3).toFixed(2);
      const dot = document.createElementNS(NS, 'circle');
      dot.setAttribute('cx', cx.toFixed(1));
      dot.setAttribute('cy', cy.toFixed(1));
      dot.setAttribute('r', r);
      dot.setAttribute('fill', '#E8C77E');
      dot.style.opacity = (Math.random() * 0.6 + 0.25).toFixed(2);
      dot.style.animation = `twinkle ${(4 + Math.random() * 5).toFixed(1)}s ease-in-out ${(Math.random()*4).toFixed(1)}s infinite`;
      svg.appendChild(dot);
    }
    starLayer.appendChild(svg);

    const styleTag = document.createElement('style');
    styleTag.textContent = `@keyframes twinkle{0%,100%{opacity:.15;}50%{opacity:.85;}}`;
    document.head.appendChild(styleTag);
  }

  /* ---------- animated stat counters ---------- */
  const stats = document.querySelectorAll('[data-count]');
  if (stats.length && 'IntersectionObserver' in window){
    const counted = new WeakSet();
    const statIO = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !counted.has(entry.target)){
          counted.add(entry.target);
          animateCount(entry.target);
        }
      });
    }, { threshold: 0.5 });
    stats.forEach(s => statIO.observe(s));
  }
  function animateCount(el){
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const duration = 1400;
    const start = performance.now();
    function tick(now){
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.round(target * eased);
      el.textContent = val + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ---------- current year ---------- */
  document.querySelectorAll('.js-year').forEach(el => el.textContent = new Date().getFullYear());

  /* ---------- contact form (static site — friendly no-op) ---------- */
  const form = document.querySelector('.contact-form');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const original = btn.textContent;
    btn.textContent = 'Message sent — thank you';
    btn.disabled = true;
    setTimeout(() => { btn.textContent = original; btn.disabled = false; form.reset(); }, 3200);
  });
});
