import { store } from '../store.js';

// Search links by query (matches title, url, description)
export function searchLinks(links, query) {
  if (!query || !query.trim()) return links;
  const q = query.toLowerCase().trim();
  return links.filter(link =>
    link.title.toLowerCase().includes(q) ||
    link.url.toLowerCase().includes(q) ||
    (link.description && link.description.toLowerCase().includes(q))
  );
}

// Filter links by criteria
export function filterLinks(links, { categoryId = null, type = null, favoritesOnly = false, pinnedOnly = false } = {}) {
  return links.filter(link => {
    if (categoryId && link.categoryId !== categoryId) return false;
    if (type && link.type !== type) return false;
    if (favoritesOnly && !link.isFavorite) return false;
    if (pinnedOnly && !link.isPinned) return false;
    return true;
  });
}

// Sort links — pinned first, then apply chosen sort, with optional favorites bubble-up
export function sortLinks(links, sortBy = 'newest', favoritesFirst = false) {
  const sorted = [...links];
  switch (sortBy) {
    case 'name-asc': sorted.sort((a, b) => a.title.localeCompare(b.title)); break;
    case 'name-desc': sorted.sort((a, b) => b.title.localeCompare(a.title)); break;
    case 'newest': sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
    case 'oldest': sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); break;
    case 'recent': sorted.sort((a, b) => {
      const aDate = a.lastAccessedAt ? new Date(a.lastAccessedAt) : new Date(0);
      const bDate = b.lastAccessedAt ? new Date(b.lastAccessedAt) : new Date(0);
      return bDate - aDate;
    }); break;
  }
  // Priority: pinned=2, favorite (when favoritesFirst)=1, normal=0
  return sorted.sort((a, b) => {
    const aPriority = a.isPinned ? 2 : (favoritesFirst && a.isFavorite ? 1 : 0);
    const bPriority = b.isPinned ? 2 : (favoritesFirst && b.isFavorite ? 1 : 0);
    return bPriority - aPriority;
  });
}

// Combined: search + filter + sort
// favoritesFirst: when true, favorites bubble to the top (used in "All Links" view)
export function getFilteredLinks({ query = '', categoryId = null, type = null, favoritesOnly = false, favoritesFirst = false, sortBy = 'newest' } = {}) {
  let links = store.getLinks();
  links = searchLinks(links, query);
  links = filterLinks(links, { categoryId, type, favoritesOnly });
  links = sortLinks(links, sortBy, favoritesFirst);
  return links;
}
