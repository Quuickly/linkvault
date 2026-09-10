import { generateId, now, getFaviconUrl } from './utils/helpers.js';

const STORAGE_KEYS = {
  links: 'linkVault_links',
  categories: 'linkVault_categories',
  settings: 'linkVault_settings'
};

class Store extends EventTarget {
  constructor() {
    super();
    this._init();
  }

  _init() {
    // Seed defaults if first run
    if (!localStorage.getItem(STORAGE_KEYS.categories)) {
      const DEFAULT_CATEGORIES = [
        { id: generateId(), name: 'Finance', icon: 'wallet', color: '#10B981', order: 0 },
        { id: generateId(), name: 'IT', icon: 'monitor', color: '#3B82F6', order: 1 },
        { id: generateId(), name: 'HR', icon: 'users', color: '#8B5CF6', order: 2 },
        { id: generateId(), name: 'General', icon: 'folder', color: '#64748B', order: 3 },
      ];
      this._save('categories', DEFAULT_CATEGORIES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.links)) {
      this._save('links', []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.settings)) {
      this._save('settings', { theme: 'light', view: 'grid' });
    }
  }

  _load(key) { return JSON.parse(localStorage.getItem(STORAGE_KEYS[key]) || '[]'); }
  _save(key, data) { localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(data)); }
  _emit(type) { this.dispatchEvent(new CustomEvent('change', { detail: { type } })); }

  // ---- LINKS ----
  getLinks() { return this._load('links'); }
  getLink(id) { return this.getLinks().find(l => l.id === id); }
  
  addLink({ url, title, categoryId = null, type = 'website', description = '', isFavorite = false }) {
    const links = this.getLinks();
    const link = {
      id: generateId(),
      url,
      title,
      categoryId,
      type,
      description,
      isFavorite,
      isPinned: false,
      favicon: getFaviconUrl(url),
      createdAt: now(),
      updatedAt: now(),
      lastAccessedAt: null
    };
    links.push(link);
    this._save('links', links);
    this._emit('links');
    return link;
  }

  updateLink(id, data) {
    const links = this.getLinks();
    const index = links.findIndex(l => l.id === id);
    if (index === -1) return null;
    // Update favicon if URL changed
    if (data.url && data.url !== links[index].url) {
      data.favicon = getFaviconUrl(data.url);
    }
    links[index] = { ...links[index], ...data, updatedAt: now() };
    this._save('links', links);
    this._emit('links');
    return links[index];
  }

  deleteLink(id) {
    const links = this.getLinks().filter(l => l.id !== id);
    this._save('links', links);
    this._emit('links');
  }

  duplicateLink(id) {
    const original = this.getLink(id);
    if (!original) return null;
    return this.addLink({
      url: original.url,
      title: `${original.title} (copy)`,
      categoryId: original.categoryId,
      type: original.type,
      description: original.description,
      isFavorite: false
    });
  }

  toggleFavorite(id) {
    const link = this.getLink(id);
    if (!link) return null;
    return this.updateLink(id, { isFavorite: !link.isFavorite });
  }

  togglePin(id) {
    const link = this.getLink(id);
    if (!link) return null;
    return this.updateLink(id, { isPinned: !link.isPinned });
  }

  recordAccess(id) {
    return this.updateLink(id, { lastAccessedAt: now() });
  }

  getRecentLinks(limit = 10) {
    return this.getLinks()
      .filter(l => l.lastAccessedAt)
      .sort((a, b) => new Date(b.lastAccessedAt) - new Date(a.lastAccessedAt))
      .slice(0, limit);
  }

  getFavoriteLinks() {
    return this.getLinks().filter(l => l.isFavorite);
  }

  getPinnedLinks() {
    return this.getLinks().filter(l => l.isPinned);
  }

  // Move link to a different category
  moveLink(linkId, categoryId) {
    return this.updateLink(linkId, { categoryId });
  }

  // ---- CATEGORIES ----
  getCategories() {
    const cats = this._load('categories');
    return cats.sort((a, b) => a.order - b.order);
  }
  getCategory(id) { return this.getCategories().find(c => c.id === id); }
  
  addCategory({ name, icon = 'folder', color = '#64748B' }) {
    const categories = this.getCategories();
    const category = {
      id: generateId(),
      name,
      icon,
      color,
      order: categories.length,
      createdAt: now()
    };
    categories.push(category);
    this._save('categories', categories);
    this._emit('categories');
    return category;
  }

  updateCategory(id, data) {
    const categories = this.getCategories();
    const index = categories.findIndex(c => c.id === id);
    if (index === -1) return null;
    categories[index] = { ...categories[index], ...data };
    this._save('categories', categories);
    this._emit('categories');
    return categories[index];
  }

  deleteCategory(id) {
    const categories = this.getCategories().filter(c => c.id !== id);
    this._save('categories', categories);
    // Move links from deleted category to uncategorized
    const links = this.getLinks().map(l => 
      l.categoryId === id ? { ...l, categoryId: null } : l
    );
    this._save('links', links);
    this._emit('categories');
    this._emit('links');
  }

  reorderCategories(orderedIds) {
    const categories = this.getCategories();
    orderedIds.forEach((id, index) => {
      const cat = categories.find(c => c.id === id);
      if (cat) cat.order = index;
    });
    this._save('categories', categories);
    this._emit('categories');
  }

  getLinkCountByCategory(categoryId) {
    return this.getLinks().filter(l => l.categoryId === categoryId).length;
  }

  // ---- SETTINGS ----
  getSettings() {
    const raw = localStorage.getItem(STORAGE_KEYS.settings);
    return raw ? JSON.parse(raw) : { theme: 'light', view: 'grid' };
  }
  getSetting(key) { return this.getSettings()[key]; }
  setSetting(key, value) {
    const settings = this.getSettings();
    settings[key] = value;
    this._save('settings', settings);
    this._emit('settings');
  }

  // ---- IMPORT/EXPORT ----
  exportJSON() {
    return JSON.stringify({
      links: this.getLinks(),
      categories: this.getCategories(),
      settings: this.getSettings(),
      exportedAt: now(),
      version: '1.0'
    }, null, 2);
  }

  importJSON(jsonString) {
    const data = JSON.parse(jsonString);
    if (data.links) this._save('links', data.links);
    if (data.categories) this._save('categories', data.categories);
    if (data.settings) this._save('settings', data.settings);
    this._emit('links');
    this._emit('categories');
    this._emit('settings');
  }

  clearAll() {
    localStorage.removeItem(STORAGE_KEYS.links);
    localStorage.removeItem(STORAGE_KEYS.categories);
    localStorage.removeItem(STORAGE_KEYS.settings);
    this._init();
    this._emit('links');
    this._emit('categories');
    this._emit('settings');
  }
}

export const store = new Store();
