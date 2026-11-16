(() => {
  'use strict';

  const root = document.documentElement;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- theme ---------- */

  const themeBtn = $('[data-theme-toggle]');
  const themeMeta = $('meta[name="theme-color"]');

  const applyTheme = (theme, persist = true) => {
    root.dataset.theme = theme;
    const isLight = theme === 'light';
    if (themeMeta) themeMeta.setAttribute('content', isLight ? '#f4f0ea' : '#0b0b0c');
    if (themeBtn) {
      themeBtn.setAttribute('aria-pressed', String(isLight));
      themeBtn.setAttribute('aria-label', isLight ? 'Switch to dark theme' : 'Switch to light theme');
    }
    if (persist) {
      try {
        localStorage.setItem('ng-theme', theme);
      } catch (e) {}
    }
  };

  let storedTheme = null;
  try {
    storedTheme = localStorage.getItem('ng-theme');
  } catch (e) {}
  applyTheme(storedTheme === 'light' ? 'light' : 'dark', false);

  themeBtn?.addEventListener('click', () => {
    applyTheme(root.dataset.theme === 'light' ? 'dark' : 'light');
  });

  /* ---------- nav + progress ---------- */

  const nav = $('#nav');
  const progress = $('#progress-bar');
  const navLinks = $$('[data-nav]');
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    nav?.classList.toggle('is-scrolled', y > 8);

    if (y < 120) {
      navLinks.forEach((link) => link.removeAttribute('aria-current'));
    }

    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(y / max, 1) : 0;
      progress.style.width = `${ratio * 100}%`;
    }
    ticking = false;
  };

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScroll);
      }
    },
    { passive: true }
  );
  onScroll();

  /* ---------- mobile menu ---------- */

  const menuBtn = $('[data-menu-toggle]');
  const menu = $('#mobile-menu');
  const pageRegions = $$('main, footer');
  let menuOpen = false;

  const setMenu = (open) => {
    menuOpen = open;
    document.body.classList.toggle('menu-open', open);
    pageRegions.forEach((region) => {
      region.inert = open;
    });
    if (menuBtn) {
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }
    if (menu) menu.setAttribute('aria-hidden', String(!open));
    if (open) {
      const firstLink = $('a', menu);
      window.setTimeout(() => firstLink?.focus({ preventScroll: true }), 80);
    } else if (document.activeElement === menuBtn) {
      menuBtn.focus({ preventScroll: true });
    }
  };

  menuBtn?.addEventListener('click', () => setMenu(!menuOpen));

  menu?.addEventListener('click', (e) => {
    if (e.target.closest('a')) setMenu(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuOpen) {
      setMenu(false);
      menuBtn?.focus();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 960 && menuOpen) setMenu(false);
  });

  /* ---------- reveal ---------- */

  const revealEls = $$('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('is-in'));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  }

  /* ---------- counters ---------- */

  const counters = $$('[data-count]');
  const animateCount = (el) => {
    const target = Number(el.dataset.count);
    if (!Number.isFinite(target)) return;
    if (reduceMotion) {
      el.textContent = String(target);
      return;
    }
    const duration = 1400;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = String(target);
    };
    requestAnimationFrame(tick);
  };

  if ('IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((el) => counterObserver.observe(el));
  } else {
    counters.forEach(animateCount);
  }

  /* ---------- spotlight ---------- */

  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (finePointer && !reduceMotion) {
    $$('.spot').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const rect = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${e.clientX - rect.left}px`);
        el.style.setProperty('--my', `${e.clientY - rect.top}px`);
      });
    });
  }

  /* ---------- clock ---------- */

  const clocks = $$('[data-clock]');
  if (clocks.length) {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Mogadishu',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const paintClock = () => {
      const time = formatter.format(new Date());
      clocks.forEach((el) => (el.textContent = time));
    };
    paintClock();
    setInterval(paintClock, 30000);
  }

  /* ---------- active nav ---------- */

  const sections = ['work', 'studio', 'stack', 'contact']
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((link) => {
            if (link.dataset.nav === entry.target.id) {
              link.setAttribute('aria-current', 'true');
            } else {
              link.removeAttribute('aria-current');
            }
          });
        });
      },
      { rootMargin: '-40% 0px -52% 0px', threshold: 0 }
    );
    sections.forEach((section) => sectionObserver.observe(section));
  }

  /* ---------- year ---------- */

  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
