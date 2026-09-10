export function initKeyboardShortcuts({ onSearch, onAddLink, onCloseModal, onToggleHelp }) {
  document.addEventListener('keydown', (e) => {
    // Don't trigger shortcuts when typing in inputs
    const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.target.isContentEditable;
    
    // Ctrl/Cmd + K = Focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      onSearch();
    }
    // Ctrl/Cmd + N = Add new link
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      onAddLink();
    }
    // Escape = Close modal
    if (e.key === 'Escape') {
      onCloseModal();
    }
    // ? = Toggle shortcuts help (only when not in input)
    if (e.key === '?' && !isInput) {
      e.preventDefault();
      onToggleHelp();
    }
  });
}

// Returns an array of shortcut definitions for the help modal
export function getShortcuts() {
  return [
    { keys: ['Ctrl', 'K'], description: 'Focus search bar' },
    { keys: ['Ctrl', 'N'], description: 'Add new link' },
    { keys: ['Escape'], description: 'Close modal / panel' },
    { keys: ['?'], description: 'Show keyboard shortcuts' },
  ];
}
