/**
 * FileUploadDialog
 * Dialog for managing file attachments
 */

import { BaseComponent } from './BaseComponent.js';
import { AttachedFile, MAX_FILE_SIZE, MAX_TOTAL_SIZE } from '../models/AttachedFile.js';
import { 
  validateFileAddition, 
  formatFileSize, 
  getFileIcon 
} from '../utils/fileValidation.js';

export class FileUploadDialog extends BaseComponent {
  /** @type {HTMLDialogElement|null} */
  #dialog = null;

  /** @type {AttachedFile[]} */
  #files = [];

  /** @type {string[]} */
  #errors = [];

  /** @type {boolean} */
  #isDragging = false;

  /** @type {Function|null} */
  #onFilesChange = null;

  /**
   * Creates a new FileUploadDialog
   * @param {HTMLDialogElement} dialogElement
   * @param {Object} appState
   * @param {Object} options
   * @param {Function} [options.onFilesChange]
   */
  constructor(dialogElement, appState, options = {}) {
    super(dialogElement, appState);
    this.#dialog = dialogElement;
    this.#onFilesChange = options.onFilesChange || null;
    this.watchState(['attachedFiles']);
  }

  /**
   * Opens the dialog
   */
  open() {
    // Load files from state
    const savedFiles = this.appState?.get('attachedFiles') || [];
    this.#files = savedFiles.map(f => f instanceof AttachedFile ? f : AttachedFile.fromJSON(f));
    this.#errors = [];
    
    if (this.#dialog) {
      this.#dialog.showModal();
      this.render();
    }
  }

  /**
   * Closes the dialog
   */
  close() {
    this.#dialog?.close();
    if (this.container) {
      this.container.innerHTML = '';
    }
  }

  /**
   * Gets the attached files
   * @returns {AttachedFile[]}
   */
  getFiles() {
    return [...this.#files];
  }

  template() {
    if (!this.#dialog?.open) {
      return null;
    }

    const totalSize = this.#files.reduce((sum, f) => sum + f.size, 0);
    const hasFiles = this.#files.length > 0;

    return `
      <div class="dialog-header">
        <h2>Attach Files</h2>
        <button class="btn btn-icon" id="close-dialog-btn" aria-label="Close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
      
      <div class="dialog-content">
        <div class="file-upload-dialog ${this.#isDragging ? 'dragging' : ''}">
          <div class="file-upload-dropzone" id="dropzone">
            <div class="dropzone-content">
              <svg class="dropzone-icon" width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"/>
              </svg>
              <p class="dropzone-text">
                Drop files here or <button class="btn btn-link" id="browse-btn">browse</button>
              </p>
              <p class="dropzone-hint">
                Supported: .txt, .md, .json, .csv, .js, .ts, .html, .css, .xml, .yaml, .py, .java, .sql, .log
              </p>
              <p class="dropzone-hint">
                Max ${formatFileSize(MAX_FILE_SIZE)} per file, ${formatFileSize(MAX_TOTAL_SIZE)} total
              </p>
            </div>
            <input type="file" id="file-input" multiple accept=".txt,.md,.json,.csv,.js,.ts,.html,.css,.xml,.yaml,.yml,.py,.java,.sql,.log" hidden />
          </div>

          ${this.#renderErrors()}

          ${hasFiles ? this.#renderFileList(totalSize) : this.#renderEmptyState()}
        </div>
      </div>
      
      <div class="dialog-actions">
        <button class="btn btn-secondary" id="clear-all-btn" ${!hasFiles ? 'disabled' : ''}>
          Clear All
        </button>
        <button class="btn btn-primary" id="done-btn">
          Done ${hasFiles ? `(${this.#files.length} file${this.#files.length !== 1 ? 's' : ''})` : ''}
        </button>
      </div>
    `;
  }

  #renderErrors() {
    if (this.#errors.length === 0) return '';
    
    return `
      <div class="file-upload-errors">
        ${this.#errors.map(err => `
          <div class="error-message">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
            </svg>
            <span>${err}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  #renderEmptyState() {
    return `
      <div class="file-upload-empty">
        <p>No files attached yet</p>
      </div>
    `;
  }

  #renderFileList(totalSize) {
    return `
      <div class="file-upload-list">
        <div class="file-list-header">
          <span class="file-count">${this.#files.length} file${this.#files.length !== 1 ? 's' : ''}</span>
          <span class="file-size">${formatFileSize(totalSize)} / ${formatFileSize(MAX_TOTAL_SIZE)}</span>
        </div>
        <ul class="file-list">
          ${this.#files.map(file => this.#renderFileItem(file)).join('')}
        </ul>
      </div>
    `;
  }

  #renderFileItem(file) {
    return `
      <li class="file-item" data-file-id="${file.id}">
        <span class="file-icon">${getFileIcon(file.name)}</span>
        <span class="file-name" title="${file.name}">${file.name}</span>
        <span class="file-size">${file.getFormattedSize()}</span>
        <button class="btn btn-icon btn-small file-remove" data-file-id="${file.id}" aria-label="Remove ${file.name}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </li>
    `;
  }

  onRender() {
    const dropzone = this.$('#dropzone');
    const fileInput = this.$('#file-input');
    const browseBtn = this.$('#browse-btn');

    // Browse button
    if (browseBtn) {
      browseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        fileInput?.click();
      });
    }

    // File input change
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        this.#handleFiles(e.target.files);
        e.target.value = '';
      });
    }

    // Drag and drop
    this.#setupDragAndDrop(dropzone);

    // Close button
    this.on('#close-dialog-btn', 'click', () => this.close());

    // Clear all button
    this.on('#clear-all-btn', 'click', () => {
      this.#files = [];
      this.#errors = [];
      this.#notifyChange();
      this.render();
    });

    // Done button
    this.on('#done-btn', 'click', () => this.close());

    // Remove individual files
    this.$$('.file-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const fileId = e.currentTarget.dataset.fileId;
        this.#removeFile(fileId);
      });
    });
  }

  #setupDragAndDrop(dropzone) {
    if (!dropzone) return;

    dropzone.addEventListener('dragenter', (e) => {
      e.preventDefault();
      this.#isDragging = true;
      this.render();
    });

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    dropzone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      if (!dropzone.contains(e.relatedTarget)) {
        this.#isDragging = false;
        this.render();
      }
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.#isDragging = false;
      this.#handleFiles(e.dataTransfer.files);
    });
  }

  async #handleFiles(fileList) {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    this.#errors = [];

    const validation = validateFileAddition(files, this.#files);
    
    if (validation.errors.length > 0) {
      this.#errors = validation.errors;
    }

    if (validation.validFiles.length > 0) {
      try {
        const newAttachments = await Promise.all(
          validation.validFiles.map(f => AttachedFile.fromFile(f))
        );
        
        this.#files = [...this.#files, ...newAttachments];
        this.#notifyChange();
      } catch (error) {
        this.log.error('Failed to read files', {}, error);
        this.#errors.push('Failed to read one or more files');
      }
    }

    this.render();
  }

  #removeFile(fileId) {
    this.#files = this.#files.filter(f => f.id !== fileId);
    this.#errors = [];
    this.#notifyChange();
    this.render();
  }

  #notifyChange() {
    if (this.#onFilesChange) {
      this.#onFilesChange(this.#files);
    }

    if (this.appState) {
      this.appState.update({
        attachedFiles: this.#files.map(f => f.toJSON()),
      });
    }
  }
}
