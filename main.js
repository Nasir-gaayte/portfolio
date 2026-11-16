(function () {
  'use strict';

  var $ = function (selector, scope) {
    return (scope || document).querySelector(selector);
  };
  var $$ = function (selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  };

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  /* ---------- theme ---------- */

  var themeToggle = $('[data-theme-toggle]');
  var themeColor = $('meta[name="theme-color"]');
  var themeColors = { dark: '#0b0b0c', light: '#f4f0ea' };

  function syncThemeUI() {
    var theme = root.dataset.theme === 'light' ? 'light' : 'dark';
    if (themeToggle) {
      var next = theme === 'dark' ? 'light' : 'dark';
      themeToggle.setAttribute('aria-label', 'Switch to ' + next + ' theme');
      themeToggle.setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false');
      themeToggle.title = 'Switch to ' + next + ' theme';
    }
    if (themeColor) themeColor.setAttribute('content', themeColors[theme]);
  }

  if (themeToggle) {
    syncThemeUI();
    themeToggle.addEventListener('click', function () {
      var next = root.dataset.theme === 'light' ? 'dark' : 'light';
      root.dataset.theme = next;
      try {
        localStorage.setItem('ng-theme', next);
      } catch (e) {}
      syncThemeUI();
    });
  }

  window.addEventListener('storage', function (event) {
    if (event.key !== 'ng-theme') return;
    root.dataset.theme = event.newValue === 'light' ? 'light' : 'dark';
    syncThemeUI();
  });

  /* ---------- progress + nav state ---------- */

  var nav = $('#nav');
  var progressBar = $('#progress-bar');
  var navLinks = $$('.nav__links a[data-nav]');
  var sections = navLinks
    .map(function (link) {
      var section = document.getElementById(link.getAttribute('data-nav'));
      return section ? { link: link, section: section } : null;
    })
    .filter(Boolean);

  var scrollQueued = false;

  function onScrollFrame() {
    scrollQueued = false;
    var y = window.scrollY || window.pageYOffset;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var progress = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;

    if (progressBar) progressBar.style.width = (progress * 100).toFixed(2) + '%';
    if (nav) nav.classList.toggle('is-scrolled', y > 12);

    var current = null;
    if (y > 120) {
      var line = y + 160;
      sections.forEach(function (item) {
        if (item.section.offsetTop <= line) current = item;
      });
    }
    navLinks.forEach(function (link) {
      if (current && link === current.link) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  function onScroll() {
    if (scrollQueued) return;
    scrollQueued = true;
    window.requestAnimationFrame(onScrollFrame);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScrollFrame();

  /* ---------- mobile menu ---------- */

  var menu = $('#mobile-menu');
  var menuBtn = $('[data-menu-toggle]');
  var pageRegions = $$('main, footer');
  var menuOpen = false;

  function setMenu(open, returnFocus) {
    if (!menu || !menuBtn || open === menuOpen) return;
    menuOpen = open;
    document.body.classList.toggle('menu-open', open);
    menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    pageRegions.forEach(function (region) {
      region.inert = open;
    });

    if (open) {
      var firstLink = $('a', menu);
      window.setTimeout(function () {
        if (menuOpen && firstLink) firstLink.focus({ preventScroll: true });
      }, 80);
    } else if (returnFocus) {
      menuBtn.focus({ preventScroll: true });
    }
  }

  if (menu && menuBtn) {
    menuBtn.addEventListener('click', function () {
      setMenu(!menuOpen, true);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && menuOpen) {
        event.preventDefault();
        setMenu(false, true);
      }
    });

    $$('a', menu).forEach(function (link) {
      link.addEventListener('click', function () {
        setMenu(false, false);
      });
    });

    var wide = window.matchMedia('(min-width: 961px)');
    var onWide = function (event) {
      if (event.matches) setMenu(false, false);
    };
    if (wide.addEventListener) wide.addEventListener('change', onWide);
    else if (wide.addListener) wide.addListener(onWide);
  }

  /* ---------- reveal ---------- */

  var revealItems = $$('.reveal');

  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          revealObserver.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );
    revealItems.forEach(function (item) {
      revealObserver.observe(item);
    });
  } else {
    revealItems.forEach(function (item) {
      item.classList.add('is-in');
    });
  }

  /* ---------- counters ---------- */

  var counters = $$('[data-count]');

  function settle(counter) {
    counter.textContent = counter.getAttribute('data-count');
  }

  function animate(counter) {
    var target = parseInt(counter.getAttribute('data-count'), 10);
    if (isNaN(target)) return;
    if (reduceMotion.matches) {
      settle(counter);
      return;
    }
    var start = null;
    var duration = 1400;
    counter.textContent = '0';
    function tick(now) {
      if (start === null) start = now;
      var t = Math.min(1, (now - start) / duration);
      var eased = 1 - Math.pow(1 - t, 3);
      counter.textContent = String(Math.round(target * eased));
      if (t < 1) {
        window.requestAnimationFrame(tick);
      } else {
        settle(counter);
      }
    }
    window.requestAnimationFrame(tick);
  }

  if (counters.length) {
    if ('IntersectionObserver' in window) {
      var counterObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            animate(entry.target);
            counterObserver.unobserve(entry.target);
          });
        },
        { threshold: 0.6 }
      );
      counters.forEach(function (counter) {
        counterObserver.observe(counter);
      });
    } else {
      counters.forEach(settle);
    }
  }

  /* ---------- spotlight ---------- */

  if (finePointer.matches && !reduceMotion.matches) {
    $$('.spot').forEach(function (el) {
      el.addEventListener(
        'pointermove',
        function (event) {
          var rect = el.getBoundingClientRect();
          el.style.setProperty('--mx', event.clientX - rect.left + 'px');
          el.style.setProperty('--my', event.clientY - rect.top + 'px');
        },
        { passive: true }
      );
    });
  }

  /* ---------- Bosaso clock ---------- */

  var clocks = $$('[data-clock]');
  if (clocks.length) {
    var timeFormat = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Mogadishu',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    });

    function tickClock() {
      var value = timeFormat.format(new Date());
      clocks.forEach(function (clock) {
        clock.textContent = value;
      });
    }

    tickClock();
    window.setInterval(tickClock, 15000);
  }

  /* ---------- year ---------- */

  var year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
