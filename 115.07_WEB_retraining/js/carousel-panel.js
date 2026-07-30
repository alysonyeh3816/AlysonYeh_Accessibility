(function () {
  "use strict";

class CarouselPreviousNext {
      constructor(node) {
        this.node = node;
        this.items = [...node.querySelectorAll('.carousel-item')];
        this.liveRegion = node.querySelector('.carousel-items');
        this.rotationButton = node.querySelector('.rotation');
        this.previousButton = node.querySelector('.previous');
        this.nextButton = node.querySelector('.next');
        this.tabs = [...node.querySelectorAll('[role="tab"]')];

        this.currentIndex = 0;
        this.interval = 4500; // 自動換圖間隔：5000 毫秒＝5 秒。
        this.timer = null;
        this.hasFocus = false;
        this.hasHover = false;
        // 尊重使用者的「減少動態效果」系統設定。
        this.isPlaying = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        this.rotationButton.addEventListener('click', () => this.togglePlayback());
        this.previousButton.addEventListener('click', () => this.showPrevious());
        this.nextButton.addEventListener('click', () => this.showNext());

        this.tabs.forEach((tab, index) => {
          tab.addEventListener('click', () => this.show(index));
          tab.addEventListener('keydown', (event) => this.handleTabKeydown(event, index));
        });

        node.addEventListener('focusin', (event) => {
          // 焦點只停在「停止／開始自動輪播」按鈕時，不暫停輪播；
          // 焦點進入投影片、上一張或下一張時，則暫停自動換圖。
          this.hasFocus = event.target !== this.rotationButton;
          this.liveRegion.setAttribute(
            'aria-live',
            this.isPlaying && !this.hasFocus ? 'off' : 'polite'
          );
        });

        node.addEventListener('focusout', (event) => {
          if (!node.contains(event.relatedTarget)) {
            this.hasFocus = false;
            if (this.isPlaying) this.liveRegion.setAttribute('aria-live', 'off');
          }
        });

        node.addEventListener('mouseenter', () => { this.hasHover = true; });
        node.addEventListener('mouseleave', () => { this.hasHover = false; });

        this.show(0);
        this.updatePlaybackButton();
        this.scheduleNext();
      }

      show(index) {
        this.currentIndex = (index + this.items.length) % this.items.length;

        this.items.forEach((item, itemIndex) => {
          const active = itemIndex === this.currentIndex;
          item.classList.toggle('active', active);
          item.setAttribute('aria-hidden', String(!active));

          // 隱藏投影片內的連結不可進入 Tab 順序。
          const link = item.querySelector('a');
          link.tabIndex = active ? 0 : -1;
        });

        this.tabs.forEach((tab, tabIndex) => {
          const selected = tabIndex === this.currentIndex;
          tab.setAttribute('aria-selected', String(selected));
          tab.tabIndex = selected ? 0 : -1;
        });
      }

      showPrevious() { this.show(this.currentIndex - 1); }
      showNext() { this.show(this.currentIndex + 1); }

      handleTabKeydown(event, index) {
        let targetIndex = index;

        switch (event.key) {
          case 'ArrowLeft':
          case 'ArrowUp':
            targetIndex = (index - 1 + this.tabs.length) % this.tabs.length;
            break;
          case 'ArrowRight':
          case 'ArrowDown':
            targetIndex = (index + 1) % this.tabs.length;
            break;
          case 'Home':
            targetIndex = 0;
            break;
          case 'End':
            targetIndex = this.tabs.length - 1;
            break;
          default:
            return;
        }

        event.preventDefault();
        this.show(targetIndex);
        this.tabs[targetIndex].focus();
      }

      togglePlayback() {
        this.isPlaying = !this.isPlaying;
        this.liveRegion.setAttribute('aria-live', this.isPlaying ? 'off' : 'polite');
        this.updatePlaybackButton();
        this.scheduleNext();
      }

      updatePlaybackButton() {
        const symbol = this.rotationButton.querySelector('span');
        symbol.textContent = this.isPlaying ? '❚❚' : '▶';
        this.rotationButton.setAttribute(
          'aria-pressed',
          this.isPlaying ? 'false' : 'true'
        );
      }

      scheduleNext() {
        window.clearTimeout(this.timer);
        this.timer = window.setTimeout(() => {
          // 焦點在停止／開始按鈕時，hasFocus 為 false，因此仍會繼續輪播；
          // 焦點進入上一張、下一張或投影片時，hasFocus 為 true，因此暫停。
          if (this.isPlaying && !this.hasFocus && !this.hasHover) {
            this.showNext();
          }
          this.scheduleNext();
        }, this.interval);
      }
    }

    new CarouselPreviousNext(document.querySelector('#myCarousel'));
})();
