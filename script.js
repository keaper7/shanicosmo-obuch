/* ═══════════════════════════════════════════════
   Лендинг «Косметология с 0»
   ═══════════════════════════════════════════════ */

/* ──────────────────────────────────────────────
   НАСТРОЙКА: замените на реальный ник Telegram
   ────────────────────────────────────────────── */
const TG_USERNAME = 'dr_shanicosmo';
const TG_TEXT = 'Здравствуйте! Пишу с сайта — хочу забронировать место на курс «Косметология с 0».';

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

/* ── Аккордеон модулей: открыт только один пункт ── */
(() => {
  const modules = document.querySelectorAll('#modules .acc__item');
  modules.forEach(item => {
    item.addEventListener('toggle', () => {
      if (!item.open) return;
      modules.forEach(other => { if (other !== item) other.open = false; });
    });
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
