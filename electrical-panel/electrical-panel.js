/**
 * Electrical Panel Interactive Logic
 */
    const scrollArea = document.querySelector('.scroll-area');
    const dinRail = document.getElementById('din-rail');

    // Scroll vertical către card
    function scrollToCard(card) {
      const scrollAreaRect = scrollArea.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const targetOffset = (cardRect.top - scrollAreaRect.top) + scrollArea.scrollTop - 8;

      scrollArea.scrollTo({
        top: Math.max(0, targetOffset),
        behavior: 'smooth'
      });
    }

    // Scroll orizontal către siguranță (MCB)
    function scrollToMcb(mcb) {
      const railRect = dinRail.getBoundingClientRect();
      const mcbRect = mcb.getBoundingClientRect();
      const targetOffset = (mcbRect.left - railRect.left) + dinRail.scrollLeft - (railRect.width / 2) + (mcbRect.width / 2);

      dinRail.scrollTo({
        left: Math.max(0, targetOffset),
        behavior: 'smooth'
      });
    }

    function clearHighlights() {
      document.querySelectorAll('.circuit-card.linked').forEach(c => c.classList.remove('linked'));
      document.querySelectorAll('.mcb.active').forEach(m => m.classList.remove('active'));
    }

    // Click pe un MCB de sus
    function handleMcbClick(cardId) {
      const card = document.getElementById(cardId);
      if (!card) return;

      const breakerId = card.getAttribute('data-breaker-id');
      const mcb = document.getElementById(breakerId);

      clearHighlights();
      card.classList.add('linked');
      if (mcb) mcb.classList.add('active');

      scrollToCard(card);

      const detailsPanel = card.querySelector('.details-panel');
      if (detailsPanel && !card.classList.contains('open')) {
        card.classList.add('open');
      }
    }

    // Click pe descriere / card
    function handleCardClick(cardId) {
      const card = document.getElementById(cardId);
      if (!card) return;

      const breakerId = card.getAttribute('data-breaker-id');
      const mcb = document.getElementById(breakerId);

      clearHighlights();
      card.classList.add('linked');

      if (mcb) {
        mcb.classList.add('active');
        scrollToMcb(mcb);
      }

      // Deschide/închide detaliile dacă există
      const detailsPanel = card.querySelector('.details-panel');
      if (detailsPanel) {
        card.classList.toggle('open');
      }
    }
