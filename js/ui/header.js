import { debounce } from '../utils/helpers.js';

let searchInput;

export function initHeader({ onSearch, onAddLink, onToggleSidebar }) {
  searchInput = document.getElementById('searchInput');
  const addLinkBtn = document.getElementById('addLinkBtn');
  const hamburgerBtn = document.getElementById('hamburgerBtn');

  if (searchInput) {
    const debouncedSearch = debounce((e) => {
      onSearch(e.target.value);
    }, 300);
    searchInput.addEventListener('input', debouncedSearch);
  }

  if (addLinkBtn) {
    addLinkBtn.addEventListener('click', onAddLink);
  }

  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', onToggleSidebar);
  }
}

export function focusSearch() {
  if (searchInput) {
    searchInput.focus();
  }
}

export function clearSearch() {
  if (searchInput) {
    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input'));
  }
}
