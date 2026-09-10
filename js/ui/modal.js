import { store } from '../store.js';
import { toast } from './toast.js';
import { isValidUrl, escapeHtml } from '../utils/helpers.js';
import { icons } from './icons.js';

let modalEl = null;

export function openModal(link = null) {
  if (modalEl) closeModal();

  const isEdit = !!link;
  const categories = store.getCategories();
  
  modalEl = document.createElement('div');
  modalEl.className = 'modal-overlay';
  
  modalEl.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2>${isEdit ? 'Edit Link' : 'Add New Link'}</h2>
        <button class="btn-icon close-modal-btn" title="Close">${icons.x}</button>
      </div>
      <div class="modal-body">
        <form id="linkForm" novalidate>
          <div class="form-group">
            <label class="form-label">URL <span style="color: var(--color-danger)">*</span></label>
            <input type="url" id="linkUrl" class="form-input" required value="${isEdit ? escapeHtml(link.url) : ''}" placeholder="https://example.com">
          </div>
          <div class="form-group">
            <label class="form-label">Title <span style="color: var(--color-danger)">*</span></label>
            <input type="text" id="linkTitle" class="form-input" required value="${isEdit ? escapeHtml(link.title) : ''}" placeholder="My awesome link">
          </div>
          <div class="form-group">
            <label class="form-label">Category</label>
            <select id="linkCategory" class="form-select">
              <option value="">Uncategorized</option>
              ${categories.map(c => `<option value="${c.id}" ${isEdit && link.categoryId === c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}
              <option value="__new__">+ Create New Category</option>
            </select>
            <input type="text" id="newCategoryInput" class="form-input" style="display:none; margin-top: 8px;" placeholder="New category name">
          </div>
          <div class="form-group">
            <label class="form-label">Type</label>
            <select id="linkType" class="form-select">
              ${['website', 'document', 'tool', 'other'].map(t => 
                `<option value="${t}" ${isEdit && link.type === t ? 'selected' : ''}>${t.charAt(0).toUpperCase() + t.slice(1)}</option>`
              ).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Description <span style="color: var(--color-text-muted)">(optional)</span></label>
            <textarea id="linkDesc" class="form-textarea" rows="3" placeholder="Add a note about this link...">${isEdit ? escapeHtml(link.description || '') : ''}</textarea>
          </div>
          <div class="form-group">
            <label class="form-checkbox-label">
              <input type="checkbox" class="form-checkbox" id="linkFav" ${isEdit && link.isFavorite ? 'checked' : ''}>
              <span>Add to Favorites</span>
            </label>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary cancel-modal-btn">Cancel</button>
        <button class="btn btn-primary save-modal-btn">${isEdit ? 'Save Changes' : 'Add Link'}</button>
      </div>
    </div>
  `;

  document.body.appendChild(modalEl);
  
  // Trigger animation
  requestAnimationFrame(() => {
    modalEl.classList.add('active');
  });

  // Focus first input
  setTimeout(() => {
    const firstInput = modalEl.querySelector('#linkUrl');
    if (firstInput) firstInput.focus();
  }, 200);

  // Category "Create New" toggle
  const catSelect = modalEl.querySelector('#linkCategory');
  const newCatInput = modalEl.querySelector('#newCategoryInput');
  catSelect.addEventListener('change', (e) => {
    if (e.target.value === '__new__') {
      newCatInput.style.display = 'block';
      newCatInput.focus();
    } else {
      newCatInput.style.display = 'none';
      newCatInput.value = '';
    }
  });

  // Close handlers
  modalEl.querySelector('.close-modal-btn').addEventListener('click', closeModal);
  modalEl.querySelector('.cancel-modal-btn').addEventListener('click', closeModal);
  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl) closeModal();
  });

  // Save handler
  modalEl.querySelector('.save-modal-btn').addEventListener('click', handleSave);
  
  // Enter key on form
  modalEl.querySelector('#linkForm').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      handleSave();
    }
  });

  function handleSave() {
    const url = modalEl.querySelector('#linkUrl').value.trim();
    const title = modalEl.querySelector('#linkTitle').value.trim();
    let categoryId = catSelect.value;
    const type = modalEl.querySelector('#linkType').value;
    const description = modalEl.querySelector('#linkDesc').value.trim();
    const isFavorite = modalEl.querySelector('#linkFav').checked;

    // Validation
    if (!url) {
      toast.error('URL is required');
      modalEl.querySelector('#linkUrl').focus();
      return;
    }

    if (!isValidUrl(url)) {
      toast.error('Please enter a valid URL (e.g., https://example.com)');
      modalEl.querySelector('#linkUrl').focus();
      return;
    }

    if (!title) {
      toast.error('Title is required');
      modalEl.querySelector('#linkTitle').focus();
      return;
    }

    // Handle new category creation
    if (categoryId === '__new__') {
      const catName = newCatInput.value.trim();
      if (catName) {
        const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#84CC16'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const newCat = store.addCategory({ name: catName, color });
        categoryId = newCat.id;
      } else {
        categoryId = null;
      }
    }

    // Empty string means uncategorized
    if (categoryId === '') categoryId = null;

    const data = { url, title, categoryId, type, description, isFavorite };

    if (isEdit) {
      store.updateLink(link.id, data);
      toast.success('Link updated successfully');
    } else {
      store.addLink(data);
      toast.success('Link added successfully');
    }

    closeModal();
  }
}

export function closeModal() {
  if (modalEl) {
    modalEl.classList.remove('active');
    setTimeout(() => {
      if (modalEl && modalEl.parentNode) {
        modalEl.parentNode.removeChild(modalEl);
        modalEl = null;
      }
    }, 300);
  }
}
