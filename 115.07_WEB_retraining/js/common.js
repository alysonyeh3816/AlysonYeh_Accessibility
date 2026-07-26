(function () {
  "use strict";

  function initializeSkipLink() {
    const skipLink = document.querySelector(".skip-link");
    if (!skipLink) return;

    skipLink.addEventListener("click", () => {
      const target = document.querySelector(skipLink.getAttribute("href"));
      if (!target) return;

      if (!target.hasAttribute("tabindex"))
        target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: false });
    });
  }

  function initializeAuditAccordion() {
    const container = document.getElementById("accordionContainer");
    if (!container) return;

    if (typeof window.initializeAccordion !== "function") {
      console.error("手風琴程式尚未載入。");
      return;
    }

    window.initializeAccordion(
      "accordionContainer",
      window.auditAccordionData || [],
    );
  }

  initializeSkipLink();
  initializeAuditAccordion();
})();
