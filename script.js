/* Portfolio Template — based on diyor.design */

const REVEAL_THRESHOLD = 0.15;

/* --- Scroll Reveal --- */

let observer;

function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: REVEAL_THRESHOLD }
  );

  reveals.forEach((el, i) => {
    el.style.transitionDelay = `${i * 50}ms`;
    observer.observe(el);
  });
}

/* --- Case Tabs --- */

function initCaseTabs() {
  const tabs = document.querySelectorAll('.case-tab');
  if (!tabs.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => activateTab(tab));
    tab.addEventListener('keydown', (e) => {
      const allTabs = Array.from(tab.closest('[role="tablist"]').querySelectorAll('[role="tab"]'));
      const idx = allTabs.indexOf(tab);
      let next;
      if (e.key === 'ArrowRight') next = allTabs[(idx + 1) % allTabs.length];
      else if (e.key === 'ArrowLeft') next = allTabs[(idx - 1 + allTabs.length) % allTabs.length];
      if (next) { e.preventDefault(); next.focus(); next.click(); }
    });
  });

  function activateTab(tab) {
    const targetId = tab.getAttribute('data-tab');
    const container = tab.closest('main');
    container.querySelectorAll('.case-tab').forEach((t) => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
      t.setAttribute('tabindex', '-1');
    });
    container.querySelectorAll('.case-tab-panel').forEach((p) => p.classList.remove('active'));
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    tab.setAttribute('tabindex', '0');
    const panel = container.querySelector(`.case-tab-panel[data-panel="${targetId}"]`);
    if (panel) panel.classList.add('active');
  }
}

/* --- Slideshows --- */

function initSlideshows() {
  document.querySelectorAll('[data-slideshow]').forEach(wrap => {
    const track = wrap.querySelector('.case-slideshow-track');
    const imgs = track.querySelectorAll('img');
    const counter = wrap.querySelector('[data-counter]');
    const prev = wrap.querySelector('[data-prev]');
    const next = wrap.querySelector('[data-next]');
    if (!track || imgs.length < 2) return;

    let current = 0;
    const total = imgs.length;

    function go(idx) {
      current = (idx + total) % total;
      track.style.transform = 'translateX(-' + (current * 100) + '%)';
      if (counter) counter.textContent = (current + 1) + '/' + total;
    }

    if (prev) prev.addEventListener('click', () => go(current - 1));
    if (next) next.addEventListener('click', () => go(current + 1));
  });
}

/* --- External links inside project cards (stop bubbling to parent <a>) --- */

function initProjectLinks() {
  document.querySelectorAll('.project-name-link[data-href]').forEach((link) => {
    function openLink(e) {
      e.stopPropagation();
      e.preventDefault();
      window.open(link.dataset.href, '_blank');
    }
    link.addEventListener('click', openLink);
    link.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') openLink(e);
    });
  });
}

/* --- GoatCounter Events --- */

function initGoatCounterEvents() {
  if (!window.goatcounter || !window.goatcounter.count) return;

  function gc(name, title) {
    window.goatcounter.count({ path: name, title: title, event: true });
  }

  /* External project links */
  document.querySelectorAll('.project-name-link').forEach((el) => {
    el.addEventListener('click', () => {
      const name = el.closest('.project-item')
        ?.querySelector('.project-name-title')?.textContent?.trim() || 'unknown';
      gc('ext-' + name.toLowerCase().replace(/\s+/g, '-'), 'External: ' + name);
    });
  });

  /* Contact links on about page */
  document.querySelectorAll('.about-links a').forEach((el) => {
    el.addEventListener('click', () => {
      const channel = el.textContent.trim().toLowerCase();
      gc('contact-' + channel, 'Contact: ' + channel);
    });
  });

  /* Scroll depth on case pages (fire once at 90%) */
  if (document.querySelector('.main--case')) {
    let scrollFired = false;
    window.addEventListener('scroll', () => {
      if (scrollFired) return;
      const pct = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;
      if (pct >= 0.9) {
        scrollFired = true;
        const caseName = document.title.split('\u2014')[0].trim().toLowerCase().replace(/\s+/g, '-');
        gc('read-complete-' + caseName, 'Read complete: ' + caseName);
      }
    });
  }
}

/* Shared observer reference for re-observing on tab switch (scoped via initScrollReveal) */

/* --- Lightbox --- */

function initLightbox() {
  const overlay = document.createElement('div');
  overlay.className = 'case-lightbox';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-label', 'Image viewer');
  overlay.innerHTML = '<img alt=""><button class="lb-close" aria-label="Close">&times;</button>';
  document.body.appendChild(overlay);
  let previousFocus = null;

  const lbImg = overlay.querySelector('img');
  let scale = 1, panX = 0, panY = 0;
  const SCALE_MIN = 1, SCALE_MAX = 5, SCALE_STEP = 0.15;

  let isDragging = false, dragStartX = 0, dragStartY = 0, dragMoved = false;

  function applyTransform() {
    if (scale > 1) {
      lbImg.style.transform = 'scale(' + scale + ') translate(' + (panX / scale) + 'px,' + (panY / scale) + 'px)';
      lbImg.style.cursor = 'grab';
    } else {
      lbImg.style.transform = '';
      lbImg.style.cursor = 'zoom-in';
      panX = 0; panY = 0;
    }
  }

  function resetZoom() {
    scale = 1; panX = 0; panY = 0;
    applyTransform();
  }

  function openOverlay(src) {
    lbImg.src = src;
    lbImg.style.maxWidth = '95vw';
    lbImg.style.maxHeight = '95vh';
    lbImg.style.width = 'auto';
    lbImg.style.height = 'auto';
    resetZoom();
    overlay.classList.add('open');
    overlay.style.touchAction = 'none';
    overlay.setAttribute('aria-modal', 'true');
    previousFocus = document.activeElement;
    overlay.querySelector('.lb-close').focus();
  }

  function closeOverlay() {
    overlay.classList.remove('open');
    overlay.style.touchAction = '';
    overlay.removeAttribute('aria-modal');
    resetZoom();
    if (previousFocus) previousFocus.focus();
  }

  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const closeBtn = overlay.querySelector('.lb-close');
      closeBtn.focus();
    }
    if (e.key === 'Escape') {
      closeOverlay();
    }
  });

  document.addEventListener('click', (e) => {
    const img = e.target.closest('.case-img-full, .case-img-row img');
    if (!img) return;
    let src = img.src;
    const picture = img.closest('picture');
    if (picture) {
      const source = picture.querySelector('source[srcset]');
      if (source) src = source.getAttribute('srcset');
    }
    openOverlay(src);
  });

  overlay.addEventListener('click', (e) => {
    if (dragMoved) { dragMoved = false; return; }
    closeOverlay();
  });

  overlay.addEventListener('mousedown', (e) => {
    if (scale <= 1) return;
    isDragging = true; dragMoved = false;
    dragStartX = e.clientX - panX;
    dragStartY = e.clientY - panY;
    lbImg.style.cursor = 'grabbing';
    e.preventDefault();
  });

  overlay.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    panX = e.clientX - dragStartX;
    panY = e.clientY - dragStartY;
    dragMoved = true;
    applyTransform();
  });

  overlay.addEventListener('mouseup', () => {
    isDragging = false;
    if (scale > 1) lbImg.style.cursor = 'grab';
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeOverlay();
  });

  overlay.addEventListener('wheel', (e) => {
    if (!overlay.classList.contains('open')) return;
    e.preventDefault();
    if (e.deltaY < 0) {
      scale = Math.min(SCALE_MAX, scale + SCALE_STEP);
    } else {
      scale = Math.max(SCALE_MIN, scale - SCALE_STEP);
    }
    applyTransform();
  }, { passive: false });
}

/* --- Mobile burger menu --- */

function initBurger() {
  const burger = document.querySelector('.nav-burger');
  const mobile = document.querySelector('.nav-mobile');
  if (!burger || !mobile) return;

  const links = document.querySelector('.nav-links');
  const lang = document.querySelector('.nav-lang');
  if (links) {
    links.querySelectorAll('a').forEach(a => {
      const clone = a.cloneNode(true);
      mobile.appendChild(clone);
    });
  }
  if (lang) {
    const langDiv = document.createElement('div');
    langDiv.className = 'nav-mobile-lang';
    langDiv.innerHTML = lang.innerHTML;
    mobile.appendChild(langDiv);
  }

  burger.addEventListener('click', () => {
    const open = burger.classList.toggle('open');
    mobile.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    mobile.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
  });

  mobile.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') {
      burger.classList.remove('open');
      mobile.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      mobile.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobile.classList.contains('open')) {
      burger.click();
    }
  });
}

/* --- Terminal Easter Egg (press ~) --- */

function initTerminal() {
  let el = null;
  const history = [];
  let historyIdx = -1;

  const fortunes = [
    '"Good design is as little design as possible." \u2014 Dieter Rams',
    '"Design is not just what it looks like. Design is how it works." \u2014 Steve Jobs',
    '"Simplicity is the ultimate sophistication." \u2014 Leonardo da Vinci',
    '"The details are not the details. They make the design." \u2014 Charles Eames',
    '"Less, but better." \u2014 Dieter Rams',
    '"Design is intelligence made visible." \u2014 Alina Wheeler',
    '"White space is to be regarded as an active element, not a passive background." \u2014 Jan Tschichold',
    '"Typography is the craft of endowing human language with a durable visual form." \u2014 Robert Bringhurst',
    '"Have no fear of perfection \u2014 you\'ll never reach it." \u2014 Salvador Dal\u00ed',
    '"Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away." \u2014 Antoine de Saint-Exup\u00e9ry',
    '"Make it simple, but significant." \u2014 Don Draper',
    '"Design creates culture. Culture shapes values. Values determine the future." \u2014 Robert L. Peters',
    '"People ignore design that ignores people." \u2014 Frank Chimero',
    '"Styles come and go. Good design is a language, not a style." \u2014 Massimo Vignelli',
    '"Design is thinking made visual." \u2014 Saul Bass',
  ];

  const commandNames = ['help', 'projects', 'contact', 'skills', 'about', 'fortune', 'sudo', 'clear', 'exit'];

  const commands = {
    help: () => 'projects\ncontact\nskills\nabout\nfortune          design quote\nsudo\nclear\nexit',
    projects: () => 'Project Alpha \u00b7 Project Beta \u00b7 Project Gamma',
    contact: () => 'email: hello@example.com\ntelegram: @janesmith',
    skills: () =>
      'Design:  Product, Brand, UI/UX\nCode:    HTML, CSS, JavaScript',
    about: () => 'Jane Smith \u2014 product designer.',
    fortune: () => {
      if (!commands._fortunePool || !commands._fortunePool.length)
        commands._fortunePool = fortunes.slice().sort(() => Math.random() - 0.5);
      return commands._fortunePool.pop();
    },
    sudo: () => 'Permission denied. But you have great taste.',
    clear: () => '__CLEAR__',
    exit: () => '__EXIT__',
  };

  function create() {
    el = document.createElement('div');
    el.id = 'terminal';
    el.innerHTML =
      '<div id="term-header"><span>~/portfolio</span><button id="term-close">&times;</button></div>' +
      '<div id="term-body"><div id="term-output"></div>' +
      '<div id="term-line"><span id="term-prompt">\u2192</span><input id="term-input" type="text" autocomplete="off" spellcheck="false"></div></div>' +
      '<div id="term-footer">\u2191\u2193 history \u00b7 Tab autocomplete \u00b7 clear \u00b7 Esc close</div>';
    document.body.appendChild(el);

    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#F8401C';
    const style = document.createElement('style');
    style.textContent =
      '#terminal{position:fixed;bottom:24px;right:24px;width:500px;max-width:calc(100vw - 32px);' +
      'background:#1a1a1a;border-radius:12px;box-shadow:0 16px 48px rgba(0,0,0,.35);z-index:9999;' +
      'font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;overflow:hidden;' +
      'animation:termIn .25s ease}' +
      '@keyframes termIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}' +
      '#term-header{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;' +
      'background:#252525;color:#888;font-size:12px;user-select:none}' +
      '#term-close{background:none;border:none;color:#666;font-size:18px;cursor:pointer;padding:0 4px;line-height:1}' +
      '#term-close:hover{color:#fff}' +
      '#term-body{padding:12px 14px 14px;max-height:320px;overflow-y:auto}' +
      '#term-output{color:#ccc;white-space:pre-wrap;word-break:break-word;line-height:1.5}' +
      '#term-output .cmd{color:' + accent + '}' +
      '#term-output .out{color:#aaa}' +
      '#term-line{display:flex;align-items:center;gap:8px;margin-top:8px}' +
      '#term-prompt{color:' + accent + ';flex-shrink:0}' +
      '#term-input{flex:1;background:none;border:none;color:#fff;font:inherit;outline:none;caret-color:' + accent + '}' +
      '#term-footer{padding:8px 14px;background:#252525;color:#555;font-size:11px;border-top:1px solid #333}';
    document.head.appendChild(style);

    const input = el.querySelector('#term-input');
    const output = el.querySelector('#term-output');
    const welcome = 'Hi. Type help for available commands.';
    output.innerHTML = '<span class="out">' + welcome + '</span>\n';
    input.focus();

    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (history.length && historyIdx < history.length - 1) {
          historyIdx++;
          input.value = history[history.length - 1 - historyIdx];
        }
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIdx > 0) {
          historyIdx--;
          input.value = history[history.length - 1 - historyIdx];
        } else {
          historyIdx = -1;
          input.value = '';
        }
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        const partial = input.value.trim().toLowerCase();
        if (!partial) return;
        const match = commandNames.find(c => c.startsWith(partial));
        if (match) input.value = match;
        return;
      }

      if (e.key !== 'Enter') return;
      const raw = input.value.trim();
      const cmd = raw.toLowerCase();
      input.value = '';
      if (!cmd) return;

      history.push(raw);
      historyIdx = -1;

      output.innerHTML += '<span class="cmd">\u2192 ' + raw + '</span>\n';

      const fn = commands[cmd];
      if (fn) {
        const result = fn();
        if (result === '__CLEAR__') { output.innerHTML = ''; return; }
        if (result === '__EXIT__') { destroy(); return; }
        output.innerHTML += '<span class="out">' + result + '</span>\n';
      } else {
        const msg = 'Unknown command. Type help.';
        output.innerHTML += '<span class="out">' + msg + '</span>\n';
      }
      el.querySelector('#term-body').scrollTop = 9999;
    });

    el.querySelector('#term-close').addEventListener('click', destroy);
  }

  function destroy() {
    if (el) { el.remove(); el = null; }
  }

  document.addEventListener('keydown', (e) => {
    if (e.code === 'Backquote' || e.key === '`' || e.key === '\u0451' || e.key === '\u0401') {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      e.preventDefault();
      if (el) destroy(); else create();
    }
    if (e.key === 'Escape' && el) {
      destroy();
    }
  });
}

/* --- Email copy with tooltip --- */

function initEmailCopy() {
  const emailLink = document.querySelector('a[href^="mailto:"]');
  if (!emailLink) return;

  emailLink.addEventListener('click', (e) => {
    e.preventDefault();
    const email = emailLink.href.replace('mailto:', '');
    navigator.clipboard.writeText(email).then(() => {
      const tip = document.createElement('span');
      tip.textContent = document.documentElement.lang === 'en' ? 'Copied!' : '\u0421\u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u043d\u043e!';
      tip.style.cssText =
        'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);' +
        'background:#222;color:#fff;padding:8px 20px;border-radius:8px;font-family:var(--font-sans);' +
        'font-size:14px;z-index:10000;animation:tipFade 1.5s ease forwards;pointer-events:none';
      if (!document.getElementById('tip-fade-style')) {
        var style = document.createElement('style');
        style.id = 'tip-fade-style';
        style.textContent = '@keyframes tipFade{0%{opacity:0;transform:translate(-50%,-50%) scale(.9)}10%{opacity:1;transform:translate(-50%,-50%) scale(1)}70%{opacity:1}100%{opacity:0;transform:translate(-50%,-60%)}}';
        document.head.appendChild(style);
      }
      document.body.appendChild(tip);
      setTimeout(() => { tip.remove(); }, 1600);
    }).catch(() => {
      window.location.href = emailLink.href;
    });
  });
}

/* --- Vanilla Badge --- */

function initVanillaBadge() {
  const badge = document.createElement('div');
  badge.innerHTML =
    '<a class="badge-link" href="mailto:miacarilli@gmail.com" aria-label="Email Maria Carilli">' +
      '<span>email</span>' +
      '<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16v12H4z"/><path d="m4 7 8 6 8-6"/></svg>' +
    '</a>' +
    '<span class="badge-sep">&bull;</span>' +
    '<a class="badge-link" href="https://www.linkedin.com/in/maria-carilli-21b107190/" target="_blank" rel="noopener" aria-label="Maria Carilli on LinkedIn">' +
      '<span>linkedin</span>' +
      '<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M6.94 8.98H3.85v10.17h3.09V8.98ZM5.4 4.85a1.78 1.78 0 1 0 0 3.56 1.78 1.78 0 0 0 0-3.56Zm13.75 8.48c0-2.73-1.46-4-3.4-4-1.57 0-2.27.86-2.66 1.47V8.98h-3.08c.04.97 0 10.17 0 10.17h3.08v-5.68c0-.3.02-.61.11-.82.25-.61.8-1.24 1.74-1.24 1.23 0 1.72.94 1.72 2.31v5.43h3.08v-5.82h-.59Z"/></svg>' +
    '</a>' +
    '<span class="badge-sep">&bull;</span>' +
    '<a class="badge-link" href="https://github.com/mtcarilli" target="_blank" rel="noopener" aria-label="Maria Carilli on GitHub">' +
      '<span>github</span>' +
      '<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5A11.5 11.5 0 0 0 8.36 22.9c.58.1.79-.25.79-.56v-2c-3.22.7-3.9-1.38-3.9-1.38-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.78 1.2 1.78 1.2 1.04 1.77 2.72 1.26 3.38.96.1-.75.4-1.26.73-1.55-2.57-.29-5.27-1.29-5.27-5.72 0-1.26.45-2.3 1.2-3.1-.12-.3-.52-1.48.11-3.07 0 0 .98-.31 3.17 1.18A10.94 10.94 0 0 1 12 6.07c.98 0 1.95.13 2.86.39 2.18-1.49 3.16-1.18 3.16-1.18.64 1.59.24 2.77.12 3.07.75.8 1.2 1.84 1.2 3.1 0 4.45-2.7 5.43-5.28 5.72.42.36.79 1.07.79 2.16v3.01c0 .31.2.67.8.56A11.5 11.5 0 0 0 12 .5Z"/></svg>' +
    '</a>';

  badge.style.cssText =
    'position:fixed;bottom:16px;left:50%;transform:translateX(-50%) translateY(20px);' +
    'font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;' +
    'color:#999;background:rgba(255,255,255,.55);padding:8px 16px;border-radius:6px;' +
    '-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);' +
    'border:1px solid rgba(0,0,0,.06);' +
    'pointer-events:auto;white-space:nowrap;display:flex;align-items:center;gap:10px;' +
    'transition:all .3s;z-index:1;cursor:default;opacity:0';

  badge.querySelectorAll('.badge-link').forEach((link) => {
    link.style.cssText =
      'display:inline-flex;align-items:center;gap:5px;color:inherit;text-decoration:none;opacity:.7;transition:opacity .2s,color .2s';
    link.addEventListener('mouseenter', () => { link.style.opacity = '1'; link.style.color = 'var(--accent)'; });
    link.addEventListener('mouseleave', () => { link.style.opacity = '.7'; link.style.color = 'inherit'; });
  });

  badge.querySelectorAll('.badge-sep').forEach((sep) => {
    sep.style.cssText = 'opacity:.35';
  });

  document.body.appendChild(badge);

  setTimeout(() => {
    badge.style.opacity = '1';
    badge.style.transform = 'translateX(-50%) translateY(0)';
  }, 2000);

  document.addEventListener('mousemove', (e) => {
    const hot = e.clientY > window.innerHeight - 80;
    const isDark = document.documentElement.classList.contains('dark') ||
      (!document.documentElement.classList.contains('light') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    badge.style.background = hot
      ? (isDark ? 'rgba(40,40,40,1)' : 'rgba(255,255,255,1)')
      : (isDark ? 'rgba(40,40,40,.55)' : 'rgba(255,255,255,.55)');
    badge.style.color = hot ? (isDark ? '#fff' : '#000') : '#999';
  });
}

/* --- Design System Toggle (Shift+G) --- */

function initDesignSystemToggle() {
  let overlay = null;
  let styleEl = null;

  function create() {
    overlay = document.createElement('div');
    overlay.id = 'ds-overlay';

    styleEl = document.createElement('style');
    styleEl.id = 'ds-style';
    styleEl.textContent =
      '#ds-overlay{position:fixed;inset:0;z-index:9990;pointer-events:none;animation:dsIn .2s ease}' +
      '@keyframes dsIn{from{opacity:0}to{opacity:1}}' +
      '#ds-grid{position:absolute;inset:0;max-width:calc(var(--content-max) + var(--side-padding)*2);' +
      'margin:0 auto;padding:0 var(--side-padding);display:flex;gap:20px}' +
      '#ds-grid .col{flex:1;background:rgba(248,64,28,0.04);border-left:1px solid rgba(248,64,28,0.1);' +
      'border-right:1px solid rgba(248,64,28,0.1)}' +
      '#ds-panel{position:fixed;bottom:52px;left:50%;transform:translateX(-50%);' +
      'background:#1a1a1a;color:#ccc;border-radius:12px;padding:14px 20px;' +
      'font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;' +
      'display:flex;gap:20px;align-items:center;pointer-events:auto;' +
      'box-shadow:0 12px 40px rgba(0,0,0,.3);white-space:nowrap}' +
      '#ds-panel .sw{width:14px;height:14px;border-radius:3px;display:inline-block;' +
      'vertical-align:middle;margin-right:5px;box-shadow:0 0 0 1px rgba(255,255,255,.15)}' +
      '#ds-panel .sep{width:1px;height:20px;background:rgba(255,255,255,.12)}' +
      '#ds-panel .lb{color:#666;font-size:9px;text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:1px}';
    document.head.appendChild(styleEl);

    const root = getComputedStyle(document.documentElement);
    const bg = root.getPropertyValue('--bg').trim();
    const accent = root.getPropertyValue('--accent').trim();
    const text = root.getPropertyValue('--text').trim();
    const dim = root.getPropertyValue('--text-dim').trim();
    const font = root.getPropertyValue('--font-sans').trim().split(',')[0].replace(/'/g, '');
    const mono = root.getPropertyValue('--font-mono').trim().split(',')[0].replace(/'/g, '');

    let gridHTML = '<div id="ds-grid">';
    for (let i = 0; i < 12; i++) gridHTML += '<div class="col"></div>';
    gridHTML += '</div>';

    overlay.innerHTML = gridHTML +
      '<div id="ds-panel">' +
        '<div><span class="lb">Colors</span>' +
        `<span class="sw" style="background:${bg}"></span>bg ` +
        `<span class="sw" style="background:${accent}"></span>accent ` +
        `<span class="sw" style="background:${text}"></span>text ` +
        `<span class="sw" style="background:${dim}"></span>dim</div>` +
        '<div class="sep"></div>' +
        `<div><span class="lb">Type</span>${font} \u00b7 ${mono}</div>` +
        '<div class="sep"></div>' +
        '<div><span class="lb">Layout</span>1156px \u00b7 12 col \u00b7 20px gap</div>' +
      '</div>';

    document.body.appendChild(overlay);
  }

  function destroy() {
    if (overlay) { overlay.remove(); overlay = null; }
    if (styleEl) { styleEl.remove(); styleEl = null; }
  }

  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.shiftKey && e.code === 'KeyG') {
      e.preventDefault();
      if (overlay) destroy(); else create();
    }
  });
}

/* --- Nav active state (auto-detect from URL) --- */

function initNavActive() {
  const links = document.querySelectorAll('.nav-links a');
  if (!links.length) return;
  const path = location.pathname.replace(/\/+$/, '') || '/';
  links.forEach(a => {
    const href = a.getAttribute('href');
    const target = new URL(href || '.', location.href).pathname.replace(/\/+$/, '') || '/';
    const isHome = target === '/' || target.endsWith('/index.html');
    if ((path.includes('/projects/') || path === '/' || path.endsWith('/index.html')) && isHome) {
      a.classList.add('active');
    } else if (path === target) {
      a.classList.add('active');
    }
  });
}

/* --- Nav scroll line --- */

function initNavScrollLine() {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });
}

/* --- Reading Progress Bar --- */

function initReadingProgress() {
  if (!document.querySelector('.main--case')) return;

  const bar = document.createElement('div');
  bar.className = 'reading-progress';
  document.body.appendChild(bar);

  function update() {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? Math.min(window.scrollY / docHeight, 1) * 100 : 0;
    bar.style.width = pct + '%';
  }

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => { update(); ticking = false; });
      ticking = true;
    }
  }, { passive: true });
  update();
}

/* --- Cursor trail on 404 --- */

function initCursorTrail() {
  if (!document.querySelector('.e404')) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const CELL = 24;
  const POOL_SIZE = 30;
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#F8401C';
  const pool = [];
  let idx = 0;
  const visited = new Set();
  let lastMove = 0;

  for (let i = 0; i < POOL_SIZE; i++) {
    const px = document.createElement('div');
    px.style.cssText =
      'position:fixed;width:' + CELL + 'px;height:' + CELL + 'px;pointer-events:none;z-index:9990;' +
      'opacity:0;transition:opacity 1.2s ease;';
    document.body.appendChild(px);
    pool.push(px);
  }

  document.addEventListener('mousemove', (e) => {
    const now = performance.now();
    if (now - lastMove < 16) return;
    lastMove = now;

    const gx = Math.floor(e.clientX / CELL) * CELL;
    const gy = Math.floor(e.clientY / CELL) * CELL;
    const key = gx + ',' + gy;

    if (visited.has(key)) return;
    visited.add(key);
    setTimeout(() => visited.delete(key), 1200);

    const px = pool[idx];
    idx = (idx + 1) % POOL_SIZE;

    px.style.transition = 'none';
    px.style.background = accent;
    px.style.left = gx + 'px';
    px.style.top = gy + 'px';
    px.style.opacity = '0.25';

    requestAnimationFrame(() => {
      px.style.transition = 'opacity 1.2s ease';
      px.style.opacity = '0';
    });
  });
}

/* --- Animated stat counters --- */

function initStatCounters() {
  const stats = document.querySelectorAll('.case-stat-value');
  if (!stats.length) return;

  const ob = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      ob.unobserve(entry.target);
      animateStat(entry.target);
    });
  }, { threshold: 0.5 });

  stats.forEach(el => ob.observe(el));
}

function animateStat(el) {
  const raw = el.textContent.trim();
  const match = raw.match(/^([+\u2212\u2212-]?)(\d+(?:[.,]\d+)?)(.*)$/);
  if (!match) return;

  const prefix = match[1];
  const target = parseFloat(match[2].replace(',', '.'));
  const suffix = match[3];
  const isFloat = match[2].includes('.') || match[2].includes(',');
  const duration = 1200;
  const start = performance.now();

  function tick(now) {
    const t = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    const val = target * ease;
    el.textContent = prefix + (isFloat ? val.toFixed(1) : Math.round(val)) + suffix;
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* --- Skeleton cleanup --- */

function initSkeletonCleanup() {
  document.querySelectorAll('.case-img-full, .case-img-row img, picture img').forEach(img => {
    if (img.complete) { img.dataset.loaded = ''; return; }
    img.addEventListener('load', () => { img.dataset.loaded = ''; }, { once: true });
  });
}

/* --- Theme Toggle --- */

function initThemeToggle() {
  const root = document.documentElement;
  const stored = localStorage.getItem('theme');

  if (stored === 'dark') root.classList.add('dark');
  else if (stored === 'light') root.classList.add('light');

  const navActions = document.querySelector('.nav-actions');
  if (!navActions) return;

  const btn = document.createElement('button');
  btn.className = 'theme-toggle';
  btn.setAttribute('aria-label', 'Toggle dark mode');
  btn.innerHTML =
    '<span class="icon-moon" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 14.5A8.2 8.2 0 0 1 9.5 3.5a8.7 8.7 0 1 0 11 11Z"/></svg></span>' +
    '<span class="icon-sun" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg></span>';
  navActions.appendChild(btn);

  const mobileNav = document.querySelector('.nav-mobile');
  if (mobileNav) {
    const mBtn = btn.cloneNode(true);
    mBtn.style.fontSize = '28px';
    mBtn.style.marginRight = '0';
    mBtn.style.marginTop = '8px';
    mobileNav.appendChild(mBtn);
    mBtn.addEventListener('click', toggle);
  }

  function isDark() {
    return root.classList.contains('dark') ||
      (!root.classList.contains('light') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }

  function toggle() {
    if (isDark()) {
      root.classList.remove('dark');
      root.classList.add('light');
      localStorage.setItem('theme', 'light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  }

  btn.addEventListener('click', toggle);
}

/* --- Init --- */

document.addEventListener('DOMContentLoaded', () => {
  initNavActive();
  initThemeToggle();
  initNavScrollLine();
  initScrollReveal();
  initCaseTabs();
  initSlideshows();
  initProjectLinks();
  initLightbox();
  initBurger();
  initTerminal();
  initEmailCopy();
  initDesignSystemToggle();
  initVanillaBadge();
  initReadingProgress();
  initStatCounters();
  initCursorTrail();
  initSkeletonCleanup();

  /* GoatCounter loads async */
  try {
    const gcInterval = setInterval(() => {
      if (window.goatcounter && window.goatcounter.count) {
        clearInterval(gcInterval);
        initGoatCounterEvents();
      }
    }, 500);
    setTimeout(() => clearInterval(gcInterval), 5000);
  } catch (_) {}
});

/* Suppress View Transitions AbortError */
window.addEventListener('unhandledrejection', (e) => {
  if (e.reason && e.reason.name === 'AbortError') e.preventDefault();
});
