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

// Sort links
export function sortLinks(links, sortBy = 'newest') {
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
  // Always put pinned items first
  return sorted.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
}

// Combined: search + filter + sort
export function getFilteredLinks({ query = '', categoryId = null, type = null, favoritesOnly = false, sortBy = 'newest' } = {}) {
  let links = store.getLinks();
  links = searchLinks(links, query);
  links = filterLinks(links, { categoryId, type, favoritesOnly });
  links = sortLinks(links, sortBy);
  return links;
}
