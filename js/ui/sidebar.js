import { store } from '../store.js';
import { icons } from './icons.js';
import { setupCategoryDrop } from '../utils/dragdrop.js';
import { escapeHtml } from '../utils/helpers.js';
import { toast } from './toast.js';

let callbacks = {};

export function initSidebar({ onNavigate, onCategorySelect }) {
  callbacks = { onNavigate, onCategorySelect };
  
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', closeSidebar);
  }

  renderSidebar();

  store.addEventListener('change', (e) => {
    if (e.detail.type === 'categories' || e.detail.type === 'links') {
      renderSidebar();
    }
  });
}

export function renderSidebar() {
  const sidebarNav = document.getElementById('sidebarNav');
  if (!sidebarNav) return;

  const totalLinks = store.getLinks().length;
  const favCount = store.getFavoriteLinks().length;
  const recentCount = store.getRecentLinks(10).length;

  let html = `
    <div class="sidebar-nav-item" data-view="all">
      <span class="nav-icon">${icons.link}</span>
      <span>All Links</span>
      <span class="nav-count">${totalLinks}</span>
    </div>
    <div class="sidebar-nav-item" data-view="favorites">
      <span class="nav-icon">${icons.star}</span>
      <span>Favorites</span>
      <span class="nav-count">${favCount}</span>
    </div>
    <div class="sidebar-nav-item" data-view="recent">
      <span class="nav-icon">${icons.clock}</span>
      <span>Recent</span>
      ${recentCount > 0 ? `<span class="nav-count">${recentCount}</span>` : ''}
    </div>
    <div class="sidebar-divider"></div>
    <div class="sidebar-section-title">CATEGORIES</div>
  `;

  const categories = store.getCategories();
  categories.forEach(cat => {
    const count = store.getLinkCountByCategory(cat.id);
    html += `
      <div class="sidebar-nav-item category-item" data-category-id="${cat.id}">
        <span class="category-color-dot" style="background-color: ${cat.color || '#64748B'}"></span>
        <span>${escapeHtml(cat.name)}</span>
        <span class="nav-count">${count}</span>
      </div>
    `;
  });

  html += `
    <div class="add-category-btn" id="addCategoryBtn">
      <span class="nav-icon">${icons.plus}</span>
      <span>Add Category</span>
    </div>
    <div id="addCategoryForm" style="display:none; padding: 4px 8px;">
      <input type="text" class="add-category-input" id="newCategoryInput" placeholder="Category name...">
    </div>
    <div class="sidebar-divider"></div>
    <div class="sidebar-nav-item" data-view="settings">
      <span class="nav-icon">${icons.settings}</span>
      <span>Settings</span>
    </div>
  `;

  sidebarNav.innerHTML = html;
  attachEvents();
}

function attachEvents() {
  const sidebarNav = document.getElementById('sidebarNav');

  // Navigation items (All, Favorites, Recent, Settings)
  const navItems = sidebarNav.querySelectorAll('.sidebar-nav-item[data-view]');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      if (callbacks.onNavigate) {
        callbacks.onNavigate(item.dataset.view);
      }
    });
  });

  // Category items
  const categoryItems = sidebarNav.querySelectorAll('.category-item');
  categoryItems.forEach(item => {
    const categoryId = item.dataset.categoryId;
    
    // Click to filter by category
    item.addEventListener('click', () => {
      if (callbacks.onCategorySelect) {
        callbacks.onCategorySelect(categoryId);
      }
    });

    // Setup drag & drop with proper categoryId
    setupCategoryDrop(item, categoryId);

    // Right-click context menu for categories
    item.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      showCategoryContextMenu(e, categoryId);
    });
  });

  // Add Category button
  const addCategoryBtn = document.getElementById('addCategoryBtn');
  const addCategoryForm = document.getElementById('addCategoryForm');
  const newCategoryInput = document.getElementById('newCategoryInput');

  if (addCategoryBtn && addCategoryForm && newCategoryInput) {
    addCategoryBtn.addEventListener('click', () => {
      addCategoryForm.style.display = 'block';
      addCategoryBtn.style.display = 'none';
      newCategoryInput.focus();
    });

    newCategoryInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const name = newCategoryInput.value.trim();
        if (name) {
          // Assign a random color from a preset palette
          const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#84CC16'];
          const color = colors[Math.floor(Math.random() * colors.length)];
          store.addCategory({ name, color });
          toast.success(`Category "${name}" created`);
        }
        newCategoryInput.value = '';
        addCategoryForm.style.display = 'none';
        addCategoryBtn.style.display = 'flex';
      } else if (e.key === 'Escape') {
        newCategoryInput.value = '';
        addCategoryForm.style.display = 'none';
        addCategoryBtn.style.display = 'flex';
      }
    });

    newCategoryInput.addEventListener('blur', () => {
      setTimeout(() => {
        newCategoryInput.value = '';
        addCategoryForm.style.display = 'none';
        addCategoryBtn.style.display = 'flex';
      }, 150);
    });
  }
}

function showCategoryContextMenu(e, categoryId) {
  // Remove existing menus
  document.querySelectorAll('.context-menu').forEach(m => m.remove());

  const category = store.getCategory(categoryId);
  if (!category) return;

  const menu = document.createElement('div');
  menu.className = 'context-menu';
  
  menu.innerHTML = `
    <div class="context-menu-item" data-action="rename">${icons.edit} <span>Rename</span></div>
    <div class="context-menu-item" data-action="color">${icons.filter} <span>Change color</span></div>
    <div class="context-menu-divider"></div>
    <div class="context-menu-item danger" data-action="delete">${icons.trash} <span>Delete</span></div>
  `;

  document.body.appendChild(menu);

  menu.style.top = `${e.clientY}px`;
  menu.style.left = `${e.clientX}px`;

  // Ensure menu stays in viewport
  const rect = menu.getBoundingClientRect();
  if (rect.right > window.innerWidth) {
    menu.style.left = `${window.innerWidth - rect.width - 8}px`;
  }
  if (rect.bottom > window.innerHeight) {
    menu.style.top = `${window.innerHeight - rect.height - 8}px`;
  }

  menu.addEventListener('click', (event) => {
    const action = event.target.closest('.context-menu-item')?.dataset.action;
    if (!action) return;

    switch (action) {
      case 'rename': {
        const newName = prompt('Rename category:', category.name);
        if (newName && newName.trim()) {
          store.updateCategory(categoryId, { name: newName.trim() });
          toast.success('Category renamed');
        }
        break;
      }
      case 'color': {
        const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#84CC16', '#64748B'];
        const currentIndex = colors.indexOf(category.color);
        const nextColor = colors[(currentIndex + 1) % colors.length];
        store.updateCategory(categoryId, { color: nextColor });
        toast.success('Category color changed');
        break;
      }
      case 'delete': {
        const count = store.getLinkCountByCategory(categoryId);
        const msg = count > 0 
          ? `Delete "${category.name}"? ${count} link(s) will be moved to Uncategorized.`
          : `Delete "${category.name}"?`;
        if (confirm(msg)) {
          store.deleteCategory(categoryId);
          toast.success('Category deleted');
          if (callbacks.onNavigate) callbacks.onNavigate('all');
        }
        break;
      }
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

export function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('active');
}

export function openSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (sidebar) sidebar.classList.add('open');
  if (overlay) overlay.classList.add('active');
}

export function setActiveItem(type, id) {
  const items = document.querySelectorAll('#sidebarNav .sidebar-nav-item, #sidebarNav .category-item');
  items.forEach(item => item.classList.remove('active'));

  if (type === 'view') {
    const item = document.querySelector(`#sidebarNav .sidebar-nav-item[data-view="${id}"]`);
    if (item) item.classList.add('active');
  } else if (type === 'category') {
    const item = document.querySelector(`#sidebarNav .category-item[data-category-id="${id}"]`);
    if (item) item.classList.add('active');
  }
}
