(function () {
  "use strict";

const carousel = document.getElementById('carousel_1kind');
    const liveRegionContainer = document.getElementById('live-region');
    const slides = carousel.querySelectorAll('.pic_big li');
    const prevBtn = carousel.querySelector('.btn_pre');
    const nextBtn = carousel.querySelector('.btn_next');
    const dots = carousel.querySelectorAll('.carousel_1_tab button');
    const toggleBtn = document.getElementById('togglePlay');

    let currentIndex = 0;
    let interval = null;
    let isPlaying = true;
    let userIntendedToPlay = true;

    function goToSlide(index, isUserAction = false) {
      slides.forEach((slide, i) => {
        slide.setAttribute('id', i === index ? 'now' : '');
        slide.querySelector('img').setAttribute('aria-hidden', i === index ? 'false' : 'true');
      });

      dots.forEach((dot, i) => {
        dot?.classList?.toggle('active', i === index);
        dot?.setAttribute?.('aria-pressed', i === index ? 'true' : 'false');
      });

      currentIndex = index;

      if (isUserAction) {
        liveRegionContainer.setAttribute('aria-live', 'polite');
        const alt = slides[index].querySelector('img').alt;
        liveRegionContainer.textContent = `第 ${index + 1} 張，共 ${slides.length} 張：${alt}`;
      }
    }

    function nextSlide() {
      goToSlide((currentIndex + 1) % slides.length);
    }
    function prevSlide() {
      goToSlide((currentIndex - 1 + slides.length) % slides.length);
    }

    function startAutoPlay() {
      if (interval) return;
      interval = setInterval(nextSlide, 3600);
      toggleBtn.textContent = '播放中';
      toggleBtn.setAttribute('aria-pressed', 'true');
      isPlaying = true;
    }
    function stopAutoPlay() {
      clearInterval(interval);
      interval = null;
      toggleBtn.textContent = '暫停中';
      toggleBtn.setAttribute('aria-pressed', 'false');
      isPlaying = false;
    }
    function resetAutoPlay() {
      if (isPlaying) {
        clearInterval(interval);
        interval = setInterval(nextSlide, 3600);
      }
    }

    toggleBtn.addEventListener('click', () => {
      userIntendedToPlay = toggleBtn.getAttribute('aria-pressed') !== 'true';
      userIntendedToPlay ? startAutoPlay() : stopAutoPlay();
    });
    prevBtn.addEventListener('click', () => {
      prevSlide();
      goToSlide(currentIndex, true);
      resetAutoPlay();
    });
    nextBtn.addEventListener('click', () => {
      nextSlide();
      goToSlide(currentIndex, true);
      resetAutoPlay();
    });
    dots.forEach((dot, i) => {
      dot.setAttribute('aria-pressed', 'false');
      dot.addEventListener('click', () => {
        goToSlide(i, true);
        resetAutoPlay();
      });
    });

    carousel.addEventListener('focusin', () => {
      stopAutoPlay();
    });
    carousel.addEventListener('focusout', () => {
      setTimeout(() => {
        if (!carousel.contains(document.activeElement)) {
          if (userIntendedToPlay) startAutoPlay(); else stopAutoPlay();
          liveRegionContainer.setAttribute('aria-live', 'off');
          liveRegionContainer.textContent = '';
        }
      }, 0);
    });

    goToSlide(0);
    startAutoPlay();
})();
