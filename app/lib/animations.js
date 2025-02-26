'use client';

/**
 * Creates a staggered animation for child elements
 * @param {Array} elements - Array of DOM elements
 * @param {Object} options - Animation options
 */
export function staggerAnimation(elements, options = {}) {
  const { delay = 0.1, initialDelay = 0, className = 'fade-in' } = options;
  
  elements.forEach((element, index) => {
    setTimeout(() => {
      element.classList.add(className);
    }, initialDelay * 1000 + index * delay * 1000);
  });
}

/**
 * Adds animation classes when element comes into view
 * @param {HTMLElement} element - The element to observe
 * @param {string} animationClass - The animation class to add
 */
export function animateOnScroll(element, animationClass = 'fade-in') {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add(animationClass);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );
  
  observer.observe(element);
  
  return () => {
    if (element) observer.unobserve(element);
  };
}

/**
 * Creates a parallax effect on scroll
 * @param {HTMLElement} element - The element to apply parallax to
 * @param {number} speed - The parallax speed
 */
export function parallaxEffect(element, speed = 0.5) {
  function updatePosition() {
    const scrollPosition = window.pageYOffset;
    const elementOffset = element.offsetTop;
    const distance = scrollPosition - elementOffset;
    
    element.style.transform = `translateY(${distance * speed}px)`;
  }
  
  window.addEventListener('scroll', updatePosition);
  
  return () => {
    window.removeEventListener('scroll', updatePosition);
  };
}

/**
 * Applies a typewriter effect to text
 * @param {HTMLElement} element - The element to apply the effect to
 * @param {string} text - The text to type
 * @param {Object} options - Typewriter options
 */
export function typewriterEffect(element, text, options = {}) {
  const { speed = 50, delay = 0 } = options;
  let index = 0;
  
  element.textContent = '';
  
  setTimeout(() => {
    const interval = setInterval(() => {
      if (index < text.length) {
        element.textContent += text.charAt(index);
        index++;
      } else {
        clearInterval(interval);
      }
    }, speed);
    
    return () => clearInterval(interval);
  }, delay);
}

/**
 * Creates a ripple effect on element click
 * @param {HTMLElement} element - The element to apply the ripple to
 */
export function rippleEffect(element) {
  element.addEventListener('click', (e) => {
    const rect = element.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    
    element.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  });
}