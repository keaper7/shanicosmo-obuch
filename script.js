/* ==========================================================================
   SHANICOSMO — ИНТЕРАКТИВ (V2)
   --------------------------------------------------------------------------
   1.  Настройки и утилиты
   2.  Прелоадер
   3.  Разбивка заголовков на слова
   4.  Появление при скролле (+ каскад)
   5.  Хидер
   6.  Прогресс скролла и кнопка «наверх»
   7.  Параллакс
   8.  Мобильное меню
   9.  Счётчики
   10. Магнитные кнопки
   11. Таймлайн с заливкой
   12. Единый скролл-цикл
   13. Аура курсора
   14. Аккордеоны
   ========================================================================== */

(function () {
    'use strict';

    /* ======================================================================
       1. НАСТРОЙКИ И УТИЛИТЫ
       ====================================================================== */
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(pointer: fine)').matches;

    const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.prototype.slice.call(root.querySelectorAll(sel));

    // страница всегда открывается сверху
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    window.addEventListener('beforeunload', () => window.scrollTo(0, 0));

    /* ======================================================================
       2. ПРЕЛОАДЕР
       ====================================================================== */
    const preloader = $('#preloader');
    const MIN_PRELOAD = reduceMotion ? 0 : 700;
    const startedAt = Date.now();
    let introDone = false;

    function finishIntro() {
        if (introDone) return;
        introDone = true;
        document.body.classList.add('is-ready');
        if (!preloader) return;
        preloader.classList.add('is-done');
        setTimeout(() => preloader.remove(), 800);
    }

    function scheduleIntro() {
        const waited = Date.now() - startedAt;
        setTimeout(finishIntro, Math.max(MIN_PRELOAD - waited, 0));
    }

    window.addEventListener('load', scheduleIntro);
    // подстраховка: не держим прелоадер дольше 2.5 с, даже если ресурс зависнет
    setTimeout(finishIntro, 2500);

    // Предохранитель: если что-то упадёт, контент всё равно должен стать видимым,
    // иначе посетитель увидит пустую страницу вместо сайта.
    function revealEverything() {
        $$('[data-reveal], [data-split]').forEach((el) => {
            el.classList.add('is-in');
            if (el.hasAttribute('data-split')) el.classList.add('is-split-in');
        });
        $$('[data-reveal-stagger]').forEach((el) => el.classList.add('is-ready'));
        finishIntro();
    }
    window.addEventListener('error', revealEverything);

    /* ======================================================================
       3. РАЗБИВКА ЗАГОЛОВКОВ НА СЛОВА
       Обходим только текстовые узлы, поэтому <br> и <span> сохраняются.
       ====================================================================== */
    let wordIndex = 0;

    function splitNode(node) {
        Array.prototype.slice.call(node.childNodes).forEach((child) => {
            if (child.nodeType === Node.TEXT_NODE) {
                const words = child.textContent.split(/(\s+)/);
                if (!words.length) return;
                const frag = document.createDocumentFragment();
                words.forEach((chunk) => {
                    if (!chunk) return;
                    if (/^\s+$/.test(chunk)) {
                        frag.appendChild(document.createTextNode(' '));
                        return;
                    }
                    const outer = document.createElement('span');
                    outer.className = 'w';
                    const inner = document.createElement('span');
                    inner.className = 'w-in';
                    inner.textContent = chunk;
                    inner.style.setProperty('--i', wordIndex++);
                    outer.appendChild(inner);
                    frag.appendChild(outer);
                });
                child.parentNode.replaceChild(frag, child);
            } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'BR') {
                splitNode(child);
            }
        });
    }

    const splitTargets = $$('[data-split]');
    splitTargets.forEach((el) => {
        wordIndex = 0;
        splitNode(el);
    });

    /* ======================================================================
       4. ПОЯВЛЕНИЕ ПРИ СКРОЛЛЕ (+ КАСКАД)
       ====================================================================== */
    // раскладываем задержки по детям каскадных контейнеров
    $$('[data-reveal-stagger]').forEach((parent) => {
        const variant = parent.getAttribute('data-reveal-stagger') || 'up';
        let i = 0;
        Array.prototype.slice.call(parent.children).forEach((child) => {
            if (child.hasAttribute('data-reveal')) return;
            child.setAttribute('data-reveal', variant);
            child.style.setProperty('--rd', (i * 0.09).toFixed(2) + 's');
            i += 1;
        });
        parent.classList.add('is-ready');
    });

    // индивидуальные задержки
    $$('[data-reveal-delay]').forEach((el) => {
        el.style.setProperty('--rd', parseFloat(el.getAttribute('data-reveal-delay')) + 's');
    });

    const revealTargets = $$('[data-reveal], [data-split]');

    if (!('IntersectionObserver' in window) || reduceMotion) {
        revealTargets.forEach((el) => {
            el.classList.add('is-in');
            if (el.hasAttribute('data-split')) el.classList.add('is-split-in');
        });
    } else {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const el = entry.target;
                el.classList.add('is-in');
                if (el.hasAttribute('data-split')) el.classList.add('is-split-in');
                revealObserver.unobserve(el);
            });
        }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

        revealTargets.forEach((el) => revealObserver.observe(el));
    }

    /* ======================================================================
       5. ХИДЕР
       ====================================================================== */
    const header = $('.header');
    let lastScroll = window.pageYOffset;

    function updateHeader(scrollY) {
        if (!header) return;
        header.classList.toggle('is-scrolled', scrollY > 40);

        const menuOpen = nav && nav.classList.contains('open');
        const goingDown = scrollY > lastScroll;
        if (!menuOpen && goingDown && scrollY > 260) {
            header.classList.add('is-hidden');
        } else {
            header.classList.remove('is-hidden');
        }
        lastScroll = scrollY;
    }

    /* ======================================================================
       6. ПРОГРЕСС СКРОЛЛА И КНОПКА «НАВЕРХ»
       ====================================================================== */
    const progressBar = $('#scrollProgress');
    const backToTop = $('#backToTop');
    const bttBar = $('.btt-bar');
    const RING = 126; // длина окружности r=20

    function updateProgress(scrollY) {
        const doc = document.documentElement;
        const max = doc.scrollHeight - doc.clientHeight;
        const ratio = max > 0 ? clamp(scrollY / max, 0, 1) : 0;

        if (progressBar) progressBar.style.width = (ratio * 100).toFixed(2) + '%';
        if (bttBar) bttBar.style.strokeDashoffset = (RING - RING * ratio).toFixed(1);
        if (backToTop) backToTop.classList.toggle('visible', scrollY > 520);
    }

    if (backToTop) {
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
        });
    }

    /* ======================================================================
       7. ПАРАЛЛАКС
       ====================================================================== */
    const parallaxItems = $$('[data-parallax]').map((el) => ({
        el: el,
        speed: parseFloat(el.getAttribute('data-parallax')) || 0.08
    }));

    function updateParallax() {
        if (reduceMotion) return;
        const vh = window.innerHeight;
        parallaxItems.forEach((item) => {
            const rect = item.el.getBoundingClientRect();
            if (rect.bottom < -240 || rect.top > vh + 240) return;
            const centerOffset = rect.top + rect.height / 2 - vh / 2;
            item.el.style.setProperty('--py', (-centerOffset * item.speed).toFixed(2) + 'px');
        });
    }

    /* ======================================================================
       8. МОБИЛЬНОЕ МЕНЮ
       ====================================================================== */
    const nav = $('#mainNav');
    const navToggle = $('#navToggle');
    const navBackdrop = $('#navBackdrop');

    function setNav(open) {
        if (!nav) return;
        nav.classList.toggle('open', open);
        if (navToggle) {
            navToggle.classList.toggle('active', open);
            navToggle.setAttribute('aria-expanded', String(open));
        }
        if (navBackdrop) navBackdrop.classList.toggle('open', open);
        document.body.style.overflow = open ? 'hidden' : '';
    }

    if (navToggle) {
        navToggle.addEventListener('click', () => setNav(!nav.classList.contains('open')));
    }
    if (navBackdrop) navBackdrop.addEventListener('click', () => setNav(false));
    if (nav) $$('a', nav).forEach((a) => a.addEventListener('click', () => setNav(false)));

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') setNav(false);
    });
    window.addEventListener('resize', () => {
        if (window.innerWidth > 600) setNav(false);
    });

    /* ======================================================================
       9. СЧЁТЧИКИ
       ====================================================================== */
    const counters = $$('.count-up');
    if (counters.length && 'IntersectionObserver' in window) {
        const countObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const el = entry.target;
                const target = parseInt(el.getAttribute('data-target'), 10) || 0;
                const suffix = el.getAttribute('data-suffix') || '';
                countObserver.unobserve(el);

                if (reduceMotion) {
                    el.textContent = target + suffix;
                    return;
                }

                const duration = 1700;
                const start = performance.now();
                (function tick(now) {
                    const p = clamp((now - start) / duration, 0, 1);
                    const eased = 1 - Math.pow(1 - p, 3);
                    el.textContent = Math.round(eased * target) + suffix;
                    if (p < 1) requestAnimationFrame(tick);
                })(start);
            });
        }, { threshold: 0.5 });
        counters.forEach((el) => countObserver.observe(el));
    }

    /* ======================================================================
       10. МАГНИТНЫЕ КНОПКИ
       ====================================================================== */
    if (finePointer && !reduceMotion) {
        $$('.magnetic').forEach((btn) => {
            btn.addEventListener('mousemove', (e) => {
                const r = btn.getBoundingClientRect();
                const x = (e.clientX - r.left - r.width / 2) * 0.18;
                const y = (e.clientY - r.top - r.height / 2) * 0.28;
                btn.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = '';
            });
        });
    }

    /* ======================================================================
       11. ТАЙМЛАЙН С ЗАЛИВКОЙ
       ====================================================================== */
    const timeline = $('.timeline');
    const timelineFill = $('.timeline-fill');
    const timelineItems = $$('.timeline-item');

    function updateTimeline() {
        if (!timeline || !timelineFill) return;
        const rect = timeline.getBoundingClientRect();
        const anchor = window.innerHeight * 0.72;
        const progress = clamp((anchor - rect.top) / rect.height, 0, 1);
        timelineFill.style.height = (progress * 100).toFixed(1) + '%';

        timelineItems.forEach((item) => {
            const top = item.getBoundingClientRect().top;
            item.classList.toggle('lit', top < anchor);
        });
    }

    /* ======================================================================
       12. ЕДИНЫЙ СКРОЛЛ-ЦИКЛ
       ====================================================================== */
    let ticking = false;
    let velocity = 0;
    let prevScroll = window.pageYOffset;

    function onFrame() {
        const scrollY = window.pageYOffset;

        // сглаженная скорость прокрутки в диапазоне -1..1 (для бегущей строки)
        const raw = clamp((scrollY - prevScroll) / 44, -1, 1);
        velocity += (raw - velocity) * 0.14;
        prevScroll = scrollY;
        document.documentElement.style.setProperty('--vel', velocity.toFixed(3));

        updateProgress(scrollY);
        updateHeader(scrollY);
        updateParallax();
        updateTimeline();

        ticking = false;

        // пока строка «оттягивается», продолжаем кадры до полного затухания
        if (Math.abs(velocity) > 0.004) requestFrame();
    }

    function requestFrame() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(onFrame);
    }

    window.addEventListener('scroll', requestFrame, { passive: true });
    window.addEventListener('resize', requestFrame);
    requestFrame();

    /* ======================================================================
       13. АУРА КУРСОРА
       ====================================================================== */
    const aura = $('#cursorAura');
    if (aura && finePointer && !reduceMotion) {
        let tx = -100, ty = -100, cx = -100, cy = -100, auraRunning = false;

        function auraFrame() {
            cx += (tx - cx) * 0.18;
            cy += (ty - cy) * 0.18;
            aura.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
            if (Math.abs(tx - cx) > 0.3 || Math.abs(ty - cy) > 0.3) {
                requestAnimationFrame(auraFrame);
            } else {
                auraRunning = false;
            }
        }

        window.addEventListener('mousemove', (e) => {
            tx = e.clientX;
            ty = e.clientY;
            aura.classList.add('is-on');
            if (!auraRunning) {
                auraRunning = true;
                requestAnimationFrame(auraFrame);
            }
        }, { passive: true });

        document.addEventListener('mouseleave', () => aura.classList.remove('is-on'));

        const hotSelector = 'a, button, .accordion-header, .service-mini-card';
        document.addEventListener('mouseover', (e) => {
            if (e.target.closest(hotSelector)) aura.classList.add('is-hot');
        });
        document.addEventListener('mouseout', (e) => {
            if (e.target.closest(hotSelector)) aura.classList.remove('is-hot');
        });
    }

    /* ======================================================================
       14. АККОРДЕОНЫ
       ====================================================================== */
    // нумеруем строки внутри каждой группы — CSS раскрывает их каскадом
    $$('.accordion-item').forEach((item) => {
        $$('.price-list li, .sub-group', item).forEach((row, i) => {
            row.style.setProperty('--i', i);
        });
    });

    window.toggleAccordion = function (element) {
        const item = element.parentElement;
        const isOpen = item.classList.contains('active');

        $$('.accordion-item').forEach((other) => other.classList.remove('active'));
        if (isOpen) return;

        item.classList.add('active');

        // если раскрытый блок ушёл за край экрана — аккуратно подводим к нему
        setTimeout(() => {
            const rect = item.getBoundingClientRect();
            if (rect.top < 90) {
                window.scrollTo({
                    top: rect.top + window.pageYOffset - 110,
                    behavior: reduceMotion ? 'auto' : 'smooth'
                });
            }
        }, 260);
    };
})();
