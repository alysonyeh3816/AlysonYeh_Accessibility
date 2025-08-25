// ../js/accordion.js
(function (global) {
  /**
 * Accordion 函式庫：動態渲染並綁定互動
 * @param {string} containerId - 容器 ID
 * @param {Array<{title:string, content:string}>} data - 資料
 */
  function initializeAccordion(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Accordion container with ID '${containerId}' not found.`);
      return;
    }

    let accordionHtml = '';

    data.forEach((item, index) => {
      const triggerId = `trigger${index + 1}`;
      const contentId = `content${index + 1}`;

      accordionHtml += `
        <div class="accordion-item">
          <h3>
            <button 
              class="accordion-trigger" 
              aria-expanded="false" 
              aria-controls="${contentId}"
              id="${triggerId}"
              aria-label="${item.title}"
            >
              ${item.title}
            </button>
          </h3>
          <div 
            class="accordion-content" 
            id="${contentId}" 
            role="region" 
            aria-labelledby="${triggerId}"
            hidden
          >
            ${item.content}
          </div>
        </div>
      `;
    });

    container.innerHTML = `<div class="accordion-container">${accordionHtml}</div>`;

    const triggers = container.querySelectorAll('.accordion-trigger');

    triggers.forEach(trigger => {
      trigger.addEventListener('click', () => {
        const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
        const content = document.getElementById(trigger.getAttribute('aria-controls'));

        trigger.setAttribute('aria-expanded', (!isExpanded).toString());
        content.hidden = isExpanded;
        content.classList.toggle('is-open');
      });

      trigger.addEventListener('keydown', (e) => {
        const parent = trigger.closest('.accordion-container');
        const allTriggers = parent.querySelectorAll('.accordion-trigger');
        const currentIndex = Array.from(allTriggers).indexOf(trigger);

        if (e.key === 'ArrowDown' && currentIndex < allTriggers.length - 1) {
          allTriggers[currentIndex + 1].focus();
        } else if (e.key === 'ArrowUp' && currentIndex > 0) {
          allTriggers[currentIndex - 1].focus();
        }
      });
    });
  }

  // 將函式掛到 global，供頁面呼叫
  global.initializeAccordion = initializeAccordion;
})(window);
