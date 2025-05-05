/**
 * Remove a filter from the current URL and reload the page
 * @param {string} paramName - The query parameter to remove
 */
function removeFilter(paramName) {
  // Get current URL and create URL object
  const currentUrl = new URL(window.location.href);
  const searchParams = currentUrl.searchParams;
  
  // Remove specified parameter
  searchParams.delete(paramName);
  
  // Redirect to the new URL
  window.location.href = currentUrl.toString();
}

/**
 * Initialize filter form event handlers
 */
function initFilterForms() {
  document.addEventListener('DOMContentLoaded', function() {
    // Handle direct change for specialty filter (if it's a standalone filter)
    const specialtyFilter = document.getElementById('specialty');
    if (specialtyFilter && specialtyFilter.hasAttribute('onchange')) {
      // Already has onchange handler, don't override
    } else if (specialtyFilter) {
      specialtyFilter.addEventListener('change', function() {
        const form = this.closest('form');
        if (form) {
          form.submit();
        }
      });
    }
  });
} 