/* ═══════════════════════════════════════════════
   Лендинг «Косметология с 0»
   ═══════════════════════════════════════════════ */

/* ──────────────────────────────────────────────
   НАСТРОЙКА: замените на реальный ник Telegram
   ────────────────────────────────────────────── */
const TG_USERNAME = 'dr_shanicosm';
const TG_TEXT = 'Добрый день! Хочу записаться на обучение';

const TG_LINK = `https://t.me/${TG_USERNAME}?text=${encodeURIComponent(TG_TEXT)}`;

document.querySelectorAll('.js-tg').forEach(el => {
  el.href = TG_LINK;
  el.target = '_blank';
  el.rel = 'noopener';
});

/* ── Дата ближайшего потока: следующее 7-е число ── */
(() => {
  const MONTHS = ['января','февраля','марта','апреля','мая','июня',
                  'июля','августа','сентября','октября','ноября','декабря'];
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), 7);

  // если 7-е уже прошло — берём следующий месяц
  if (d < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
    d.setMonth(d.getMonth() + 1);
  }

  const label = `7 ${MONTHS[d.getMonth()]}`;
  document.querySelectorAll('.js-stream').forEach(el => { el.textContent = label; });
})();

/* ── Полоса прогресса чтения ── */
(() => {
  const bar = document.getElementById('progress');
  if (!bar) return;

  let ticking = false;
  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = max > 0 ? `${(window.scrollY / max) * 100}%` : '0%';
    ticking = false;
  };

  addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();
})();

/* ── Появление блоков при скролле ──
   Важно: анимация здесь — украшение, а не условие видимости.
   Если наблюдатель не сработает, всё раскрывается по таймеру. */
(() => {
  // первый экран анимируется на загрузке (CSS), наблюдатель ему не нужен
  const items = [...document.querySelectorAll('.reveal:not(.hero .reveal)')];
  const show = el => el.classList.add('is-in');
  const showAll = () => items.forEach(show);

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) { showAll(); return; }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      show(entry.target);
      io.unobserve(entry.target);
    });
  }, { rootMargin: '200px 0px 0px 0px', threshold: 0 });

  items.forEach(el => io.observe(el));

  // всё, что уже в зоне видимости на момент загрузки — показываем сразу
  const sweep = () => {
    const limit = innerHeight + 200;
    items.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < limit && r.bottom > -200) show(el);
    });
  };
  addEventListener('load', sweep);
  requestAnimationFrame(sweep);

  // страховка: что бы ни случилось, через 2 секунды контент виден
  setTimeout(showAll, 2000);
})();

/* ── Sticky-кнопка: появляется после первого экрана ── */
(() => {
  const sticky = document.getElementById('sticky');
  const hero = document.querySelector('.hero');
  if (!sticky || !hero || !('IntersectionObserver' in window)) return;

  new IntersectionObserver(([entry]) => {
    sticky.classList.toggle('is-on', !entry.isIntersecting);
  }, { threshold: 0 }).observe(hero);
})();

/* ── Подсветка активного пункта навигации ── */
(() => {
  const links = [...document.querySelectorAll('.hdr__nav a')];
  const map = new Map();

  links.forEach(link => {
    const section = document.querySelector(link.getAttribute('href'));
    if (section) map.set(section, link);
  });
  if (!map.size || !('IntersectionObserver' in window)) return;

  const visible = new Set();

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => e.isIntersecting ? visible.add(e.target) : visible.delete(e.target));

    // активен самый верхний из видимых разделов
    const top = [...visible].sort((a, b) => a.offsetTop - b.offsetTop)[0];
    links.forEach(l => l.classList.toggle('is-active', top ? map.get(top) === l : false));
  }, { rootMargin: '-20% 0px -60% 0px' });

  map.forEach((_, section) => io.observe(section));
})();

/* ── Аккордеон модулей: плавное раскрытие, открыт только один пункт ──
   <details> по умолчанию переключается мгновенно — высоту анимируем
   вручную (Web Animations API), сам браузер отвечает только за то,
   что доступ к контенту закрытого модуля скрыт от скринридеров/поиска. */
(() => {
  const modules = [...document.querySelectorAll('#modules .mod')];
  if (!modules.length) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DURATION = 380;
  const EASE = 'cubic-bezier(.22,.68,.24,1)';
  const running = new WeakMap();

  const animateHeight = (el, from, to, onDone) => {
    running.get(el)?.cancel();
    if (reduced) { onDone(); return; }
    el.style.overflow = 'hidden';
    const anim = el.animate(
      [{ height: `${from}px` }, { height: `${to}px` }],
      { duration: DURATION, easing: EASE, fill: 'both' }
    );
    running.set(el, anim);
    anim.onfinish = () => {
      running.delete(el);
      onDone();
      anim.cancel();
      el.style.overflow = '';
    };
    anim.oncancel = () => running.delete(el);
  };

  const collapse = item => {
    const inner = item.querySelector('.mod__in');
    if (!inner || !item.open) return;
    const from = inner.offsetHeight;
    animateHeight(inner, from, 0, () => { item.open = false; });
  };

  const expand = item => {
    item.open = true;
    const inner = item.querySelector('.mod__in');
    if (!inner) return;
    const to = inner.scrollHeight;
    animateHeight(inner, 0, to, () => {});
  };

  modules.forEach(item => {
    const head = item.querySelector('.mod__head');
    head.addEventListener('click', e => {
      e.preventDefault();
      if (item.open) { collapse(item); return; }
      modules.forEach(other => { if (other !== item && other.open) collapse(other); });
      expand(item);
    });
  });
})();

/* ── Лайтбокс отзывов: открыть, листать стрелками/свайпом/клавиатурой ── */
(() => {
  const lb = document.getElementById('lightbox');
  const revs = document.getElementById('revs');
  if (!lb || !revs) return;

  const items = [...revs.querySelectorAll('.ph__zoom img')];
  if (!items.length) return;

  const img = lb.querySelector('.lb__img');
  const count = lb.querySelector('.lb__count');
  const btnClose = lb.querySelector('.lb__x');
  const btnPrev = lb.querySelector('.lb__prev');
  const btnNext = lb.querySelector('.lb__next');

  let index = 0;
  let trigger = null;

  const show = i => {
    index = (i + items.length) % items.length;
    const src = items[index];
    img.src = src.currentSrc || src.src;
    img.alt = src.alt;
    count.textContent = `${index + 1} / ${items.length}`;
  };

  const open = i => {
    trigger = document.activeElement;
    show(i);
    lb.classList.add('is-open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    btnClose.focus();
  };

  const close = () => {
    lb.classList.remove('is-open');
    lb.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    trigger?.focus();
  };

  items.forEach((image, i) => {
    image.closest('.ph__zoom').addEventListener('click', () => open(i));
  });

  btnClose.addEventListener('click', close);
  btnPrev.addEventListener('click', () => show(index - 1));
  btnNext.addEventListener('click', () => show(index + 1));

  lb.addEventListener('click', e => {
    if (e.target === lb) close();
  });

  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(index - 1);
    if (e.key === 'ArrowRight') show(index + 1);
  });

  // свайп по фото
  let touchX = null;
  const frame = lb.querySelector('.lb__frame');
  frame.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  frame.addEventListener('touchend', e => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) show(index + (dx < 0 ? 1 : -1));
    touchX = null;
  });
})();

/* ── Плавный скролл с учётом высоты шапки ── */
(() => {
  const header = document.querySelector('.hdr');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (id === '#' || id.length < 2) return;

      const target = document.querySelector(id);
      if (!target) return;

      e.preventDefault();
      const offset = (header?.offsetHeight ?? 0) + 12;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
    });
  });
})();
