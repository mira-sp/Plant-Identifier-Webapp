/**
 * Formats a date string to a readable format
 * @param {string} dateString - The date string to format
 * @returns {string} - The formatted date string
 */
export function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  }
  
  /**
   * Truncates a string to a specified length and adds ellipsis
   * @param {string} str - The string to truncate
   * @param {number} length - The maximum length
   * @returns {string} - The truncated string
   */
  export function truncateString(str, length = 100) {
    if (str.length <= length) return str;
    return str.slice(0, length) + '...';
  }
  
  /**
   * Generates a unique ID
   * @returns {string} - A unique ID
   */
  export function generateId() {
    return Math.random().toString(36).substring(2, 9);
  }
  
  /**
   * Debounce function to limit function calls
   * @param {Function} func - The function to debounce
   * @param {number} wait - The wait time in milliseconds
   * @returns {Function} - The debounced function
   */
  export function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  /**
   * Converts an array buffer to a base64 string
   * @param {ArrayBuffer} buffer - The array buffer to convert
   * @returns {string} - The base64 string
   */
  export function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }