'use client';
import anime from 'animejs';

/**
 * Creates a staggered animation for child elements using anime.js
 * @param {Array} elements - Array of DOM elements
 * @param {Object} options - Animation options
 */
export function staggerAnimation(elements, options = {}) {
  anime({
    targets: elements,
    opacity: [0, 1],
    translateY: [20, 0],
    delay: anime.stagger(options.delay * 1000 || 100, { start: options.initialDelay * 1000 || 0 }),
    easing: 'easeOutQuad',
    duration: 800
  });
}

/**
 * Adds animation when element comes into view using anime.js
 * @param {HTMLElement} element - The element to observe
 * @param {Object} options - Animation options
 */
export function animateOnScroll(element, options = {}) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        anime({
          targets: entry.target,
          opacity: [0, 1],
          translateY: [20, 0],
          duration: 1000,
          easing: 'easeOutQuad'
        });
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  observer.observe(element);
  return () => observer.unobserve(element);
}

/**
 * Creates a parallax effect on scroll using anime.js
 * @param {HTMLElement} element - The element to apply parallax to
 * @param {number} speed - The parallax speed
 */
export function parallaxEffect(element, speed = 0.5) {
  function updatePosition() {
    anime({
      targets: element,
      translateY: window.pageYOffset * speed,
      duration: 0,
      easing: 'linear'
    });
  }

  window.addEventListener('scroll', updatePosition);
  return () => window.removeEventListener('scroll', updatePosition);
}

/**
 * Applies a typewriter effect to text using anime.js
 * @param {HTMLElement} element - The element to apply the effect to
 * @param {string} text - The text to type
 * @param {Object} options - Typewriter options
 */
export function typewriterEffect(element, text, options = {}) {
  element.textContent = '';

  anime({
    targets: element,
    textContent: text,
    round: 1,
    duration: text.length * (options.speed || 50),
    easing: 'linear',
    delay: options.delay || 0
  });
}

/**
 * Creates a ripple effect on element click using anime.js
 * @param {HTMLElement} element - The element to apply the ripple to
 */
export function rippleEffect(element) {
  element.addEventListener('click', (e) => {
    const rect = element.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
    
    ripple.style.left = `${e.clientX - rect.left}px`;
    ripple.style.top = `${e.clientY - rect.top}px`;

    element.appendChild(ripple);

    anime({
      targets: ripple,
      scale: [0, 4],
      opacity: [1, 0],
      duration: 600,
      easing: 'easeOutQuad',
      complete: () => ripple.remove()
    });
  });
}
