import { store } from '../store.js';
import { icons } from './icons.js';
import { setupCardDrag } from '../utils/dragdrop.js';
import { openModal } from './modal.js';
import { toast } from './toast.js';
import { formatDate, escapeHtml } from '../utils/helpers.js';

let currentView = 'grid';
let currentLinks = [];
let currentTitle = 'All Links';
let currentFilters = { sortBy: 'newest', type: 'all' };
let updateCallback = null;

export function initLinkList() {
  currentView = store.getSetting('view') || 'grid';
}

export function setView(view) {
  currentView = view;
  store.setSetting('view', view);
  renderLinks(currentLinks, currentTitle);
}

export function renderLinks(links, title) {
  currentLinks = links;
  currentTitle = title;

  const mainContent = document.getElementById('mainContent');
  if (!mainContent) return;

  // Always render the header + filter pills regardless of whether links are empty.
  // This ensures user can always navigate back to "All" type.
  const filterPillsHtml = `
    <div class="filter-pills">
      ${['all', 'website', 'document', 'tool', 'other'].map(type =>
        `<button class="filter-pill ${currentFilters.type === type ? 'active' : ''}" data-type="${type}">${type.charAt(0).toUpperCase() + type.slice(1)}</button>`
      ).join('')}
    </div>
  `;

  const headerHtml = `
    <div class="content-header">
      <h1>${escapeHtml(title)} <span class="badge badge-category">${links.length}</span></h1>
      <div class="content-actions">
        <select id="sortSelect" class="form-select">
          <option value="newest" ${currentFilters.sortBy === 'newest' ? 'selected' : ''}>Newest</option>
          <option value="oldest" ${currentFilters.sortBy === 'oldest' ? 'selected' : ''}>Oldest</option>
          <option value="name-asc" ${currentFilters.sortBy === 'name-asc' ? 'selected' : ''}>Name A-Z</option>
          <option value="name-desc" ${currentFilters.sortBy === 'name-desc' ? 'selected' : ''}>Name Z-A</option>
          <option value="recent" ${currentFilters.sortBy === 'recent' ? 'selected' : ''}>Recently Accessed</option>
        </select>
        <div class="view-toggle">
          <button class="btn-icon ${currentView === 'grid' ? 'active' : ''}" id="gridViewBtn" title="Grid view">${icons.grid}</button>
          <button class="btn-icon ${currentView === 'list' ? 'active' : ''}" id="listViewBtn" title="List view">${icons.list}</button>
        </div>
      </div>
    </div>
    ${filterPillsHtml}
  `;

  if (links.length === 0) {
    mainContent.innerHTML = `
      ${headerHtml}
      <div class="empty-state">
        <div class="empty-state-icon">${icons.folder}</div>
        <h2 class="empty-state-title">No links found</h2>
        <p class="empty-state-text">Tidak ada link di tampilan ini. Tambahkan link baru atau ubah filter.</p>
        <button class="btn btn-primary" id="emptyAddBtn">
          ${icons.plus} Add Link
        </button>
      </div>
    `;
    document.getElementById('emptyAddBtn')?.addEventListener('click', () => openModal());
    attachHeaderEvents();
    return;
  }

  const cardsHtml = links.map(link => renderLinkCard(link)).join('');

  mainContent.innerHTML = `
    ${headerHtml}
    <div class="${currentView === 'grid' ? 'link-cards-grid' : 'link-cards-list'}">
      ${cardsHtml}
    </div>
  `;

  attachEvents();
}

function renderLinkCard(link) {
  const category = link.categoryId ? store.getCategory(link.categoryId) : null;
  const catColor = category ? category.color : '#94A3B8';
  const catName = category ? category.name : 'Uncategorized';
  const pinnedClass = link.isPinned ? ' pinned' : '';
  const favIcon = link.isFavorite ? icons.starFilled : icons.star;
  const favClass = link.isFavorite ? ' active' : '';
  const lastAccessed = link.lastAccessedAt ? formatDate(link.lastAccessedAt) : '';

  return `
    <div class="link-card${pinnedClass}" data-id="${link.id}" draggable="true">
      <div class="link-card-header">
        <div class="link-card-info">
          <div class="link-card-title">${escapeHtml(link.title)}</div>
          <div class="link-card-url" title="${escapeHtml(link.url)}">${escapeHtml(link.url)}</div>
        </div>
        <div class="link-card-actions">
          <button class="btn-icon favorite-btn${favClass}" data-id="${link.id}" title="Toggle favorite">
            ${favIcon}
          </button>
          <button class="btn-icon more-btn" data-id="${link.id}" title="More actions">
            ${icons.moreVertical}
          </button>
        </div>
      </div>
      ${link.description ? `
        <div class="link-card-body">
          <div class="link-card-description">${escapeHtml(link.description)}</div>
        </div>
      ` : ''}
      <div class="link-card-footer">
        <div class="link-card-tags">
          <span class="badge badge-category" style="background: ${catColor}15; color: ${catColor}; border: 1px solid ${catColor}40">${escapeHtml(catName)}</span>
          <span class="badge badge-type" data-type="${link.type}">${escapeHtml(link.type)}</span>
        </div>
        ${lastAccessed ? `<span class="link-card-meta">${lastAccessed}</span>` : ''}
      </div>
      <div class="link-card-watermark">${icons.link}</div>
    </div>
  `;
}

function attachHeaderEvents() {
  // Attach only header/filter events (used when links are empty)
  document.getElementById('gridViewBtn')?.addEventListener('click', () => setView('grid'));
  document.getElementById('listViewBtn')?.addEventListener('click', () => setView('list'));

  document.getElementById('sortSelect')?.addEventListener('change', (e) => {
    currentFilters.sortBy = e.target.value;
    if (updateCallback) updateCallback();
  });

  const filterPills = document.querySelectorAll('.filter-pill');
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      currentFilters.type = pill.dataset.type;
      if (updateCallback) updateCallback();
    });
  });
}

function attachEvents() {
  const container = document.querySelector('.link-cards-grid, .link-cards-list');
  if (!container) return;

  const cards = container.querySelectorAll('.link-card');
  cards.forEach(card => {
    const linkId = card.dataset.id;

    setupCardDrag(card, linkId);

    card.addEventListener('click', (e) => {
      if (!e.target.closest('button') && !e.target.closest('a')) {
        const link = store.getLink(linkId);
        if (link) {
          store.recordAccess(linkId);
          window.open(link.url, '_blank');
        }
      }
    });
  });

  // Favorite buttons
  const favBtns = document.querySelectorAll('.favorite-btn');
  favBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      store.toggleFavorite(btn.dataset.id);
    });
  });

  // More action buttons
  const moreBtns = document.querySelectorAll('.more-btn');
  moreBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      showContextMenu(e, btn.dataset.id);
    });
  });

  // Also attach header events
  attachHeaderEvents();
}

function showContextMenu(e, id) {
  document.querySelectorAll('.context-menu').forEach(m => m.remove());

  const link = store.getLink(id);
  if (!link) return;

  const menu = document.createElement('div');
  menu.className = 'context-menu';

  menu.innerHTML = `
    <div class="context-menu-item" data-action="edit">${icons.edit} <span>Edit</span></div>
    <div class="context-menu-item" data-action="duplicate">${icons.copy} <span>Duplicate</span></div>
    <div class="context-menu-item" data-action="pin">${icons.pin} <span>${link.isPinned ? 'Unpin' : 'Pin to top'}</span></div>
    <div class="context-menu-item" data-action="open">${icons.externalLink} <span>Open in new tab</span></div>
    <div class="context-menu-divider"></div>
    <div class="context-menu-item danger" data-action="delete">${icons.trash} <span>Delete</span></div>
  `;

  document.body.appendChild(menu);

  const rect = e.currentTarget.getBoundingClientRect();
  let top = rect.bottom + 4;
  let left = rect.right - menu.offsetWidth;

  if (top + menu.offsetHeight > window.innerHeight) {
    top = rect.top - menu.offsetHeight - 4;
  }
  if (left < 0) left = 8;

  menu.style.top = `${top}px`;
  menu.style.left = `${left}px`;

  menu.addEventListener('click', (event) => {
    const action = event.target.closest('.context-menu-item')?.dataset.action;
    if (!action) return;

    switch (action) {
      case 'edit':
        openModal(link);
        break;
      case 'duplicate':
        store.duplicateLink(id);
        toast.success('Link duplicated');
        break;
      case 'pin':
        store.togglePin(id);
        toast.success(link.isPinned ? 'Link unpinned' : 'Link pinned');
        break;
      case 'open':
        store.recordAccess(id);
        window.open(link.url, '_blank');
        break;
      case 'delete':
        if (confirm('Hapus link ini?')) {
          store.deleteLink(id);
          toast.success('Link deleted');
        }
        break;
    }
    menu.remove();
  });

  const closeMenu = (evt) => {
    if (!menu.contains(evt.target)) {
      menu.remove();
      document.removeEventListener('click', closeMenu);
    }
  };

  setTimeout(() => {
    document.addEventListener('click', closeMenu);
  }, 0);
}

export function updateLinks(callback) {
  updateCallback = callback;
}

export function getCurrentFilters() {
  return { ...currentFilters };
}
