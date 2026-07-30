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

      function setActive(newIndex) {
        index = (newIndex + total) % total;
        slides.forEach((el, i) => {
          el.classList.toggle('is-active', i === index);
          // el.setAttribute('aria-label', `${i+1} / ${total}`);
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
        slide.addEventListener('focus', () => {
          stopAutoPlay();
          setActive(i);
        });
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
