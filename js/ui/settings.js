import { store } from '../store.js';
import { downloadFile, readFile } from '../utils/helpers.js';
import { getShortcuts } from '../utils/keyboard.js';
import { toast } from './toast.js';
import { icons } from './icons.js';

export function initSettings() {
  // Settings are rendered on demand when navigated to
}

export function renderSettings(container) {
  const theme = store.getSetting('theme') || 'light';
  const isDark = theme === 'dark';
  
  const shortcuts = getShortcuts();
  const shortcutsHtml = shortcuts.map(s => 
    `<div class="settings-item">
      <span>${s.description}</span>
      <div>
        ${s.keys.map(k => `<span class="shortcut-key">${k}</span>`).join(' + ')}
      </div>
    </div>`
  ).join('');

  const totalLinks = store.getLinks().length;
  const totalCategories = store.getCategories().length;

  container.innerHTML = `
    <div class="content-header">
      <h1>${icons.settings} Settings</h1>
    </div>
    <div class="settings-panel">
      <div class="settings-group">
        <div class="settings-group-title">Appearance</div>
        <div class="settings-item">
          <div>
            <div class="settings-item-label">Dark Mode</div>
            <div class="settings-item-desc">Switch between light and dark theme</div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="themeToggle" ${isDark ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group-title">Data Management</div>
        <div class="settings-item">
          <div>
            <div class="settings-item-label">Export Data</div>
            <div class="settings-item-desc">Download all links and categories as JSON (${totalLinks} links, ${totalCategories} categories)</div>
          </div>
          <button class="btn btn-secondary" id="exportBtn">${icons.download} Export</button>
        </div>
        <div class="settings-item">
          <div>
            <div class="settings-item-label">Import Data</div>
            <div class="settings-item-desc">Restore data from a previously exported JSON file</div>
          </div>
          <div>
            <input type="file" id="importFile" accept=".json" style="display:none">
            <button class="btn btn-secondary" id="importBtn">${icons.upload} Import</button>
          </div>
        </div>
        <div class="settings-item">
          <div>
            <div class="settings-item-label" style="color: var(--color-danger)">Clear All Data</div>
            <div class="settings-item-desc">Permanently delete all links and categories</div>
          </div>
          <button class="btn btn-danger" id="clearBtn">${icons.trash} Clear</button>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group-title">Keyboard Shortcuts</div>
        ${shortcutsHtml}
      </div>

      <div class="settings-group">
        <div class="settings-group-title">About</div>
        <div style="padding: 12px 0; color: var(--color-text-secondary); font-size: var(--font-size-sm);">
          <p><strong>Personal Link Vault</strong> v1.0</p>
          <p style="margin-top: 8px;">A local-first, privacy-focused link manager. All data is stored in your browser's localStorage — nothing is sent to any server.</p>
          <p style="margin-top: 8px; color: var(--color-text-muted);">Built with vanilla HTML, CSS, and JavaScript.</p>
        </div>
      </div>
    </div>
  `;

  attachSettingsEvents();
}

function attachSettingsEvents() {
  // Dark mode toggle
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('change', (e) => {
      const theme = e.target.checked ? 'dark' : 'light';
      store.setSetting('theme', theme);
      document.documentElement.dataset.theme = theme;
      toast.info(`${theme === 'dark' ? 'Dark' : 'Light'} mode enabled`);
    });
  }

  // Export
  document.getElementById('exportBtn')?.addEventListener('click', () => {
    const data = store.exportJSON();
    const date = new Date().toISOString().split('T')[0];
    downloadFile(data, `link-vault-export-${date}.json`, 'application/json');
    toast.success('Data exported successfully');
  });

  // Import
  const importFile = document.getElementById('importFile');
  const importBtn = document.getElementById('importBtn');
  
  if (importBtn && importFile) {
    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          const content = await readFile(file);
          const parsed = JSON.parse(content);
          if (!parsed.links && !parsed.categories) {
            throw new Error('Invalid file format');
          }
          store.importJSON(content);
          toast.success(`Data imported: ${parsed.links?.length || 0} links, ${parsed.categories?.length || 0} categories`);
          // Re-render settings to update counts
          renderSettings(document.getElementById('mainContent'));
        } catch (err) {
          toast.error('Failed to import: Invalid JSON file');
        }
        // Reset file input for re-import
        importFile.value = '';
      }
    });
  }

  // Clear all
  document.getElementById('clearBtn')?.addEventListener('click', () => {
    if (confirm('⚠️ Are you sure you want to clear ALL data?\n\nThis will delete all links and categories. This action cannot be undone.\n\nTip: Export your data first as a backup.')) {
      store.clearAll();
      toast.success('All data has been cleared');
      // Re-render settings
      renderSettings(document.getElementById('mainContent'));
    }
  });
}
