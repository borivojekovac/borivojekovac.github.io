/**
 * File validation utilities
 */

import { 
  AttachedFile, 
  ALLOWED_MIME_TYPES, 
  MAX_FILE_SIZE, 
  MAX_TOTAL_SIZE 
} from '../models/AttachedFile.js';

/**
 * Validates a single file before attachment
 * @param {File} file - The file to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateFile(file) {
  const errors = [];

  // Check size
  if (file.size > MAX_FILE_SIZE) {
    errors.push(`File "${file.name}" exceeds maximum size of ${MAX_FILE_SIZE / 1024}KB (${(file.size / 1024).toFixed(1)}KB)`);
  }

  // Check type
  if (!isAllowedFileType(file)) {
    errors.push(`File type "${file.type || 'unknown'}" is not supported. Allowed types: text files, JSON, CSV, Markdown`);
  }

  // Check if file is empty
  if (file.size === 0) {
    errors.push(`File "${file.name}" is empty`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates adding files to existing attachments
 * @param {File[]} newFiles - Files to add
 * @param {AttachedFile[]} existingFiles - Already attached files
 * @returns {{ valid: boolean, errors: string[], validFiles: File[] }}
 */
export function validateFileAddition(newFiles, existingFiles = []) {
  const errors = [];
  const validFiles = [];
  
  const existingTotalSize = existingFiles.reduce((sum, f) => sum + f.size, 0);
  let runningTotal = existingTotalSize;

  for (const file of newFiles) {
    const fileValidation = validateFile(file);
    
    if (!fileValidation.valid) {
      errors.push(...fileValidation.errors);
      continue;
    }

    // Check if adding this file would exceed total limit
    if (runningTotal + file.size > MAX_TOTAL_SIZE) {
      errors.push(`Adding "${file.name}" would exceed total attachment limit of ${MAX_TOTAL_SIZE / 1024}KB`);
      continue;
    }

    // Check for duplicate names
    const isDuplicate = existingFiles.some(ef => ef.name === file.name) ||
                        validFiles.some(vf => vf.name === file.name);
    if (isDuplicate) {
      errors.push(`File "${file.name}" is already attached`);
      continue;
    }

    validFiles.push(file);
    runningTotal += file.size;
  }

  return {
    valid: validFiles.length > 0 || errors.length === 0,
    errors,
    validFiles,
  };
}

/**
 * Checks if a file type is allowed
 * @param {File} file
 * @returns {boolean}
 */
export function isAllowedFileType(file) {
  // Check MIME type
  if (file.type && ALLOWED_MIME_TYPES.includes(file.type)) {
    return true;
  }

  // Check by extension for common text files
  const ext = file.name.split('.').pop()?.toLowerCase();
  const textExtensions = [
    'txt', 'md', 'json', 'csv', 
    'js', 'ts', 'jsx', 'tsx',
    'html', 'css', 'scss', 'less',
    'xml', 'yaml', 'yml', 'toml',
    'py', 'java', 'c', 'cpp', 'h', 'hpp',
    'go', 'rs', 'rb', 'php', 
    'sh', 'bat', 'ps1',
    'sql', 'log', 'env',
    'gitignore', 'dockerignore',
  ];
  
  return textExtensions.includes(ext);
}

/**
 * Gets the total size of attached files
 * @param {AttachedFile[]} files
 * @returns {number}
 */
export function getTotalFileSize(files) {
  return files.reduce((sum, f) => sum + f.size, 0);
}

/**
 * Gets remaining attachment capacity
 * @param {AttachedFile[]} files
 * @returns {number}
 */
export function getRemainingCapacity(files) {
  return MAX_TOTAL_SIZE - getTotalFileSize(files);
}

/**
 * Formats bytes to human readable string
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Gets file icon based on extension
 * @param {string} filename
 * @returns {string}
 */
export function getFileIcon(filename) {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  const iconMap = {
    js: '📜',
    ts: '📜',
    jsx: '⚛️',
    tsx: '⚛️',
    json: '📋',
    md: '📝',
    txt: '📄',
    csv: '📊',
    html: '🌐',
    css: '🎨',
    py: '🐍',
    java: '☕',
    sql: '🗃️',
    xml: '📰',
    yaml: '⚙️',
    yml: '⚙️',
  };

  return iconMap[ext] || '📄';
}
