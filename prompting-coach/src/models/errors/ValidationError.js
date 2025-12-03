/**
 * ValidationError
 * Error thrown when input validation fails
 */
export class ValidationError extends Error {
  /** @type {string} Field that failed validation */
  field;
  
  /** @type {*} Value that failed validation */
  value;
  
  /** @type {string} Validation rule that failed */
  rule;

  /**
   * Creates a new ValidationError
   * @param {string} message - Error message
   * @param {Object} [options] - Error options
   * @param {string} [options.field] - Field name
   * @param {*} [options.value] - Invalid value
   * @param {string} [options.rule] - Validation rule
   */
  constructor(message, { field, value, rule } = {}) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
    this.rule = rule;
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }

  /**
   * Creates error for required field
   * @param {string} field - Field name
   * @returns {ValidationError}
   */
  static required(field) {
    return new ValidationError(
      `${field} is required`,
      { field, rule: 'required' }
    );
  }

  /**
   * Creates error for minimum length
   * @param {string} field - Field name
   * @param {number} minLength - Minimum length
   * @param {number} actualLength - Actual length
   * @returns {ValidationError}
   */
  static minLength(field, minLength, actualLength) {
    return new ValidationError(
      `${field} must be at least ${minLength} characters (got ${actualLength})`,
      { field, value: actualLength, rule: 'minLength' }
    );
  }

  /**
   * Creates error for maximum length
   * @param {string} field - Field name
   * @param {number} maxLength - Maximum length
   * @param {number} actualLength - Actual length
   * @returns {ValidationError}
   */
  static maxLength(field, maxLength, actualLength) {
    return new ValidationError(
      `${field} must be at most ${maxLength} characters (got ${actualLength})`,
      { field, value: actualLength, rule: 'maxLength' }
    );
  }

  /**
   * Creates error for invalid type
   * @param {string} field - Field name
   * @param {string} expectedType - Expected type
   * @param {string} actualType - Actual type
   * @returns {ValidationError}
   */
  static invalidType(field, expectedType, actualType) {
    return new ValidationError(
      `${field} must be of type ${expectedType} (got ${actualType})`,
      { field, value: actualType, rule: 'type' }
    );
  }

  /**
   * Creates error for invalid format
   * @param {string} field - Field name
   * @param {string} format - Expected format
   * @returns {ValidationError}
   */
  static invalidFormat(field, format) {
    return new ValidationError(
      `${field} must be in ${format} format`,
      { field, rule: 'format' }
    );
  }

  /**
   * Creates error for file too large
   * @param {string} filename - File name
   * @param {number} maxSize - Max size in bytes
   * @param {number} actualSize - Actual size in bytes
   * @returns {ValidationError}
   */
  static fileTooLarge(filename, maxSize, actualSize) {
    const maxKB = Math.round(maxSize / 1024);
    const actualKB = Math.round(actualSize / 1024);
    return new ValidationError(
      `File "${filename}" is too large (${actualKB}KB). Maximum size is ${maxKB}KB.`,
      { field: 'file', value: actualSize, rule: 'maxSize' }
    );
  }

  /**
   * Creates error for invalid file type
   * @param {string} filename - File name
   * @param {string} mimeType - Actual MIME type
   * @param {string[]} allowedTypes - Allowed MIME types
   * @returns {ValidationError}
   */
  static invalidFileType(filename, mimeType, allowedTypes) {
    return new ValidationError(
      `File "${filename}" has invalid type (${mimeType}). Allowed types: ${allowedTypes.join(', ')}`,
      { field: 'file', value: mimeType, rule: 'fileType' }
    );
  }
}
