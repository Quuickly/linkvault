import { store } from './store.js';
import { initHeader, focusSearch } from './ui/header.js';
import { initSidebar, renderSidebar, closeSidebar, openSidebar, setActiveItem } from './ui/sidebar.js';
import { initLinkList, renderLinks, updateLinks, getCurrentFilters } from './ui/linkList.js';
import { openModal, closeModal } from './ui/modal.js';
import { initSettings, renderSettings } from './ui/settings.js';
import { getFilteredLinks } from './utils/search.js';
import { initKeyboardShortcuts } from './utils/keyboard.js';

let currentView = 'all'; // all, favorites, recent, category, settings
let currentCategoryId = null;
let currentSearchQuery = '';

function applyTheme() {
  const theme = store.getSetting('theme') || 'light';
  document.documentElement.dataset.theme = theme;
}

function refreshContent() {
  const mainContent = document.getElementById('mainContent');
  
  if (currentView === 'settings') {
    renderSettings(mainContent);
    setActiveItem('view', 'settings');
    return;
  }

  const filters = getCurrentFilters();
  const sortBy = filters.sortBy || 'newest';
  const typeFilter = filters.type || 'all';

  let links;
  let title = 'All Links';

  if (currentView === 'recent') {
    // Recent view: show last 10 accessed links
    links = store.getRecentLinks(10);
    title = 'Recent Links';
  } else if (currentView === 'favorites') {
    links = getFilteredLinks({
      query: currentSearchQuery,
      favoritesOnly: true,
      type: typeFilter !== 'all' ? typeFilter : null,
      sortBy
    });
    title = 'Favorites';
  } else if (currentView === 'category' && currentCategoryId) {
    const cat = store.getCategory(currentCategoryId);
    links = getFilteredLinks({
      query: currentSearchQuery,
      categoryId: currentCategoryId,
      type: typeFilter !== 'all' ? typeFilter : null,
      sortBy
    });
    title = cat ? cat.name : 'Category';
  } else {
    // 'all' view
    links = getFilteredLinks({
      query: currentSearchQuery,
      type: typeFilter !== 'all' ? typeFilter : null,
      sortBy
    });
    title = 'All Links';
  }

  if (currentSearchQuery) {
    title = `Search: "${currentSearchQuery}"`;
  }

  renderLinks(links, title);
  
  if (currentView === 'category') {
    setActiveItem('category', currentCategoryId);
  } else {
    setActiveItem('view', currentView);
  }
}

function initApp() {
  applyTheme();

  initHeader({
    onSearch: (query) => {
      currentSearchQuery = query;
      if (currentView === 'settings') {
        currentView = 'all';
      }
      refreshContent();
    },
    onAddLink: () => {
      openModal();
    },
    onToggleSidebar: () => {
      const sidebar = document.getElementById('sidebar');
      if (sidebar.classList.contains('open')) {
        closeSidebar();
      } else {
        openSidebar();
      }
    }
  });

  initSidebar({
    onNavigate: (view) => {
      currentView = view;
      currentCategoryId = null;
      currentSearchQuery = '';
      document.getElementById('searchInput').value = '';
      refreshContent();
      closeSidebar(); // for mobile
    },
    onCategorySelect: (categoryId) => {
      currentView = 'category';
      currentCategoryId = categoryId;
      currentSearchQuery = '';
      document.getElementById('searchInput').value = '';
      refreshContent();
      closeSidebar();
    }
  });

  initLinkList();
  initSettings();

  // Keyboard shortcuts with proper callbacks
  initKeyboardShortcuts({
    onSearch: () => focusSearch(),
    onAddLink: () => openModal(),
    onCloseModal: () => closeModal(),
    onToggleHelp: () => {
      // Navigate to settings to show shortcuts
      currentView = 'settings';
      refreshContent();
    }
  });

  // Wire up link list refresh callback
  updateLinks(() => refreshContent());

  // Listen to store changes
  store.addEventListener('change', (e) => {
    if (e.detail.type === 'settings') {
      applyTheme();
    }
    if (currentView !== 'settings') {
      refreshContent();
    }
  });

  // Initial render
  refreshContent();
}

document.addEventListener('DOMContentLoaded', initApp);
