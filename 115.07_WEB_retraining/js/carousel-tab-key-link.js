(function () {
  "use strict";

const root = document.getElementById('heroCarousel');
      const slides = Array.from(root.querySelectorAll('.slide'));
      const prevBtn = root.querySelector('.prev');
      const nextBtn = root.querySelector('.next');
      const dots = Array.from(root.querySelectorAll('.dot'));
      const toggleBtn = document.getElementById('togglePlay');

      const total = slides.length;
      let index = 0;
      let interval = null;

      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const cfgAutoplay = root.dataset.autoplay === 'true';
      const cfgInterval = Math.max(parseInt(root.dataset.interval || '3600', 10), 1500);
      let userPrefAutoPlay = cfgAutoplay && !reduceMotion;

      slides.forEach((slide, i) => {
        const a = slide.querySelector('a');
        const img = slide.querySelector('img');
        const h2 = slide.querySelector('h2');
        const p = slide.querySelector('p');

        if (a && img) {
          if (!img.id) img.id = `slide${i + 1}-img`;
          const ids = [img.id];
          if (h2) { if (!h2.id) h2.id = `slide${i + 1}-h2`; ids.push(h2.id); }
          if (p) { if (!p.id) p.id = `slide${i + 1}-p`; ids.push(p.id); }
          a.setAttribute('aria-labelledby', ids.join(' '));
          a.tabIndex = 0;
        }
      });

      function setActive(newIndex) {
        index = (newIndex + total) % total;

        slides.forEach((el, i) => {
          const active = (i === index);
          el.classList.toggle('is-active', active);
        });

        dots.forEach((d, i) => d.setAttribute('aria-current', i === index ? 'true' : 'false'));
      }

      function next() { setActive(index + 1); }
      function prev() { setActive(index - 1); }

      function startAutoPlay() {
        if (interval || !userPrefAutoPlay) return;
        interval = setInterval(next, cfgInterval);
        toggleBtn.setAttribute('aria-pressed', 'true');
        toggleBtn.textContent = '⏸';
      }
      function stopAutoPlay() {
        if (interval) { clearInterval(interval); interval = null; }
        toggleBtn.setAttribute('aria-pressed', 'false');
        toggleBtn.textContent = '▶';
      }

      prevBtn.addEventListener('click', prev);
      nextBtn.addEventListener('click', next);
      toggleBtn.addEventListener('click', () => {
        userPrefAutoPlay = !userPrefAutoPlay;
        if (userPrefAutoPlay) { startAutoPlay(); } else { stopAutoPlay(); }
      });
      dots.forEach((d, i) => d.addEventListener('click', () => setActive(i)));

      slides.forEach((slide, i) => {
        const a = slide.querySelector('a');
        if (a) {
          a.addEventListener('focus', () => {
            stopAutoPlay();
            setActive(i);
          });
        }
      });

      root.addEventListener('focusout', (e) => {
        if (!root.contains(e.relatedTarget)) {
          if (userPrefAutoPlay) { startAutoPlay(); }
        }
      });
      root.addEventListener('mouseenter', stopAutoPlay);
      root.addEventListener('mouseleave', () => { if (userPrefAutoPlay) { startAutoPlay(); } });

      setActive(0);
      if (!reduceMotion && userPrefAutoPlay) { startAutoPlay(); }
})();
