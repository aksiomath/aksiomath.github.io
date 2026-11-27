// AKSIOMA Knots pages: the theme switch, the menu on small screens, recordings that play while in
// view, pictures that open large, and the contents of the manual and docs.

(function () {
  'use strict';

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------- dark and light */

  const themeBtn = $('.theme-btn');

  if (themeBtn) {
    const root = document.documentElement;
    const meta = $('meta[name="theme-color"]');
    const isLight = () => root.getAttribute('data-theme') === 'light';

    const show = () => {
      const label = isLight() ? 'Switch to the dark theme' : 'Switch to the light theme';
      themeBtn.setAttribute('aria-label', label);
      themeBtn.title = label;
      if (meta) meta.content = isLight() ? '#ffffff' : '#1c1f27';
    };

    const apply = (light) => {
      if (light) root.setAttribute('data-theme', 'light');
      else root.removeAttribute('data-theme');
      show();
    };

    themeBtn.addEventListener('click', () => {
      const light = !isLight();
      apply(light);
      try {
        localStorage.setItem('knots-theme', light ? 'light' : 'dark');
      } catch (e) { /* the choice then lasts for this page only */ }
    });

    // another tab of these pages was switched, or this one came back from history
    const stored = () => {
      try {
        apply(localStorage.getItem('knots-theme') === 'light');
      } catch (e) { /* keep what is shown */ }
    };

    window.addEventListener('storage', (e) => { if (e.key === 'knots-theme') stored(); });
    window.addEventListener('pageshow', (e) => { if (e.persisted) stored(); });

    themeBtn.hidden = false;
    show();
  }

  /* ---------------------------------------------------------- menu */

  const menuBtn = $('.menu-btn');
  const nav = $('.nav');

  if (menuBtn && nav) {
    menuBtn.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', (e) => {
      if (e.target.closest('a')) {
        nav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------------------------------------------------------- recordings: play only in view */

  const clips = $$('video[data-clip]');

  if (clips.length) {
    if (calm || !('IntersectionObserver' in window)) {
      clips.forEach((v) => { v.controls = true; });
    } else {
      const watch = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const v = entry.target;
          if (entry.isIntersecting) {
            const p = v.play();
            // a browser that refuses to start by itself gets the controls
            if (p) p.catch(() => { v.controls = true; });
          } else {
            v.pause();
          }
        });
      }, { threshold: 0.35 });

      clips.forEach((v) => watch.observe(v));
    }

    // a click pauses and plays
    clips.forEach((v) => v.addEventListener('click', () => {
      if (v.controls) return;
      if (v.paused) v.play(); else v.pause();
    }));
  }

  /* ---------------------------------------------------------- pictures open large */

  const zoomable = $$('img.zoom');

  if (zoomable.length && typeof HTMLDialogElement === 'function') {
    const box = document.createElement('dialog');
    box.className = 'light';
    box.setAttribute('aria-label', 'Enlarged picture');
    box.innerHTML = '<img alt=""><button type="button" class="btn btn-small">Close</button>';
    document.body.appendChild(box);

    const big = $('img', box);
    box.addEventListener('click', () => box.close());

    zoomable.forEach((img) => {
      img.tabIndex = 0;
      img.setAttribute('role', 'button');
      const open = () => {
        big.src = img.currentSrc || img.src;
        big.alt = img.alt;
        box.showModal();
      };
      img.addEventListener('click', open);
      img.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      });
    });
  }

  /* ---------------------------------------------------------- manual and docs: contents */

  const toc = $('.toc');

  if (toc) {
    const links = $$('ol a', toc);
    const sections = links.map((a) => document.getElementById(a.hash.slice(1)));
    const search = $('input[type="search"]', toc);
    const none = $('.none', toc);
    const toggle = $('.toc-toggle', toc);

    if (toggle) {
      toggle.addEventListener('click', () => {
        const open = toc.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(open));
      });
      links.forEach((a) => a.addEventListener('click', () => {
        toc.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }));
    }

    if (search) {
      search.addEventListener('input', () => {
        const q = search.value.trim().toLowerCase();
        let found = 0;
        links.forEach((a, i) => {
          const hit = !q || (sections[i] && sections[i].textContent.toLowerCase().includes(q));
          a.parentElement.hidden = !hit;
          if (hit) found++;
        });
        none.hidden = found > 0;
      });

      search.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        const first = links.find((a) => !a.parentElement.hidden);
        if (first) first.click();
      });
    }

    // mark the section being read
    let waiting = false;
    const mark = () => {
      waiting = false;
      let current = 0;
      sections.forEach((s, i) => {
        if (s && s.getBoundingClientRect().top < 160) current = i;
      });
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) current = sections.length - 1;
      links.forEach((a, i) => {
        a.classList.toggle('on', i === current);
        if (i === current) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    };

    window.addEventListener('scroll', () => {
      if (!waiting) {
        waiting = true;
        requestAnimationFrame(mark);
      }
    }, { passive: true });
    mark();
  }
})();
