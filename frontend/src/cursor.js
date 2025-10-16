// Simple scroll animations and card stagger effects
// No custom cursor - using native browser cursors only

document.addEventListener('DOMContentLoaded', function() {
  // Add scroll animations for better UX
  window.addEventListener('scroll', () => {
    const elements = document.querySelectorAll('.card, .btn, .table');
    
    elements.forEach(element => {
      const elementTop = element.getBoundingClientRect().top;
      const elementVisible = 150;
      
      if (elementTop < window.innerHeight - elementVisible) {
        element.classList.add('fade-in');
      }
    });
  });

  // Add stagger animation for cards
  const cards = document.querySelectorAll('.card');
  
  cards.forEach((card, index) => {
    card.style.animationDelay = `${index * 0.1}s`;
  });
});