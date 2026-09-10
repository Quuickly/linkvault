import { store } from '../store.js';

export function setupCardDrag(cardElement, linkId) {
  cardElement.setAttribute('draggable', 'true');
  
  cardElement.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', linkId);
    e.dataTransfer.effectAllowed = 'move';
    cardElement.classList.add('dragging');
  });

  cardElement.addEventListener('dragend', () => {
    cardElement.classList.remove('dragging');
  });
}

export function setupCategoryDrop(categoryElement, categoryId) {
  categoryElement.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    categoryElement.classList.add('drag-over');
  });

  categoryElement.addEventListener('dragleave', () => {
    categoryElement.classList.remove('drag-over');
  });

  categoryElement.addEventListener('drop', (e) => {
    e.preventDefault();
    categoryElement.classList.remove('drag-over');
    const linkId = e.dataTransfer.getData('text/plain');
    if (linkId) {
      store.moveLink(linkId, categoryId);
    }
  });
}

export function setupMainContentDrop(mainElement) {
  mainElement.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  });

  mainElement.addEventListener('drop', (e) => {
    const linkId = e.dataTransfer.getData('text/plain');
    if (linkId) {
      store.moveLink(linkId, null);
    }
  });
}

export function initDragDrop() {
  // Can be extended if a global initializer is needed
}
