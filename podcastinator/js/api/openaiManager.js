// Podcastinator App - OpenAI API Manager
import NotificationsManager from '../ui/notifications.js';
import LanguageSupport from '../utils/languageSupport.js';

class OpenAIManager {
    constructor(storageManager, contentStateManager) {
        this.storageManager = storageManager;
        this.contentStateManager = contentStateManager;
        this.notifications = new NotificationsManager();
        
        // Load models data from storage
        const savedData = this.storageManager.load('data', {});
        this.languageSupport = new LanguageSupport();
        
        // Use empty object for models if not in storage
        // We'll initialize from the DOM selected attributes during init()
        this.data = {
            apiKey: savedData.apiKey || '',
            models: savedData.models || {}
        };
    }

    /**
     * Initialize OpenAI API manager
     */
    init() {
    
        // Initialize models from DOM if no stored values exist
        this.initializeModelsFromDOM();
        this.setupModelSelectionListeners();
        this.setupApiKeyValidation();
    }
    
    /**
     * Initialize models from DOM elements with selected attributes
     */
    initializeModelsFromDOM() {
    
        // Only initialize from DOM if we don't have stored models
        if (Object.keys(this.data.models).length > 0) {
            return;
        }
        
        // Default values in case elements aren't found
        this.data.models = {
            outline: this.getSelectedValue('outline-model', 'gpt-4o'),
            outlineVerify: this.getSelectedValue('outline-verify-model', 'o4-mini'),
            script: this.getSelectedValue('script-model', 'gpt-4o'),
            scriptVerify: this.getSelectedValue('script-verify-model', 'o4-mini'),
            backstory: this.getSelectedValue('backstory-model', 'gpt-4o-mini'),
            tts: this.getSelectedValue('tts-model', 'tts-1'),
            scriptLanguage: this.getSelectedValue('script-language', 'english')
        };
        
        // Persist these initial values to storage
        this.saveToStorage();
    }
    
    /**
     * Get the selected value from a select element in the DOM
     * @param {string} elementId - ID of the select element
     * @param {string} defaultValue - Default value if element not found
     * @returns {string} - Selected value or default
     */
    getSelectedValue(elementId, defaultValue) {
    
        const element = document.getElementById(elementId);
        if (!element) {
            return defaultValue;
        }
        
        // Check for options with selected attribute
        const selectedOption = element.querySelector('option[selected]');
        if (selectedOption) {
            return selectedOption.value;
        }
        
        // If no option has selected attribute, use the first option
        if (element.options.length > 0) {
            return element.options[0].value;
        }
        
        return defaultValue;
    }

    /**
     * Setup API key validation listener
     */
    setupApiKeyValidation() {
    
        const self = this;
        const validateKeyButton = document.getElementById('validate-key');
        
        if (validateKeyButton) {
            validateKeyButton.addEventListener('click', function() {
                self.validateApiKey();
            });
        }

        // Populate the API key if available
        if (this.data.apiKey) {
            document.getElementById('api-key').value = this.data.apiKey;
        }
    }

    /**
     * Setup model selection listeners
     */
    setupModelSelectionListeners() {
    
        const self = this;
        const modelSelectors = [
            'outline-model',
            'outline-verify-model',
            'script-model', 
            'script-verify-model',
            'backstory-model',
            'tts-model',
            'script-language'
        ];

        modelSelectors.forEach(function(selectorId) {
        
            const element = document.getElementById(selectorId);
            if (element) {
                element.addEventListener('change', function() {
                    self.saveModelSelection(selectorId, this.value);
                });
            }
        });

        // Populate the model selections if available
        if (this.data.models) {
            // Set values if both the element and model value exist
            this.setSelectValueIfExists('outline-model', this.data.models.outline);
            this.setSelectValueIfExists('script-model', this.data.models.script);
            this.setSelectValueIfExists('backstory-model', this.data.models.backstory);
            this.setSelectValueIfExists('tts-model', this.data.models.tts);
            this.setSelectValueIfExists('outline-verify-model', this.data.models.outlineVerify);
            this.setSelectValueIfExists('script-verify-model', this.data.models.scriptVerify);
            
            // Set up language selector if it exists
            const languageSelector = document.getElementById('script-language');
            if (languageSelector) {
                this.populateLanguageOptions(languageSelector);
                languageSelector.value = this.data.models.scriptLanguage || 'english';
            }
        }
        
        // Add listener for TTS model changes to update language options
        const ttsModelSelector = document.getElementById('tts-model');
        if (ttsModelSelector) {
            ttsModelSelector.addEventListener('change', function() {
                const languageSelector = document.getElementById('script-language');
                if (languageSelector) {
                    self.populateLanguageOptions(languageSelector);
                }
            });
        }
    }

    /**
     * Save model selection
     * @param {string} selectorId - ID of model selector element
     * @param {string} value - Selected model value
     */
    saveModelSelection(selectorId, value) {
    
        const modelMap = {
            'outline-model': 'outline',
            'outline-verify-model': 'outlineVerify',
            'script-model': 'script',
            'script-verify-model': 'scriptVerify',
            'backstory-model': 'backstory', 
            'tts-model': 'tts',
            'script-language': 'scriptLanguage'
        };

        const modelKey = modelMap[selectorId];
        if (modelKey) {
        
            this.data.models[modelKey] = value;
            this.saveToStorage();
            console.log(`Model selection saved: ${modelKey} = ${value}`);
        }
    }

    /**
     * Save all model selections from form elements
     */
    saveAllModelSelections() {
    
        const selectors = {
            'outline-model': 'outline',
            'outline-verify-model': 'outlineVerify',
            'script-model': 'script',
            'script-verify-model': 'scriptVerify',
            'backstory-model': 'backstory',
            'tts-model': 'tts',
            'script-language': 'scriptLanguage'
        };

        Object.entries(selectors).forEach(([elementId, modelKey]) => {
        
            const element = document.getElementById(elementId);
            if (element && element.value) {
                this.data.models[modelKey] = element.value;
            }
        });
        
        this.saveToStorage();
    }

    /**
     * Save data to storage
     */
    saveToStorage() {
    
        const existingData = this.storageManager.load('data', {});
        const updatedData = {
            ...existingData,
            apiKey: this.data.apiKey,
            models: this.data.models
        };
        this.storageManager.save('data', updatedData);
    }

    /**
     * Validate OpenAI API key
     */
    async validateApiKey() {
    
        const apiKey = document.getElementById('api-key').value.trim();
        const validateButton = document.getElementById('validate-key');
        const validateText = document.getElementById('validate-text');
        const validateSpinner = document.getElementById('validate-spinner');
        
        if (!apiKey) {
            this.notifications.showError('Please enter your OpenAI API key');
            return;
        }

        if (!apiKey.startsWith('sk-')) {
            this.notifications.showError('Invalid API key format. OpenAI keys start with "sk-"');
            return;
        }

        // Show loading state
        validateButton.disabled = true;
        validateText.style.display = 'none';
        validateSpinner.style.display = 'inline-block';

        try {
            // Test API key with real OpenAI API call
            const response = await fetch('https://api.openai.com/v1/models', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                // Save all form data including models
                this.data.apiKey = apiKey;
                this.saveAllModelSelections();
                this.notifications.showSuccess('API key validated successfully! Settings saved.');
                
                // Update content state to indicate we have valid API key
                this.contentStateManager.updateState('hasApiKey', true);
                
                setTimeout(function() {
                    // Content state manager will handle enabling the appropriate sections
                    this.contentStateManager.updateSections();
                }.bind(this), 1500);
            } else {
                let errorMsg = 'Invalid API key';
                if (response.status === 401) {
                    errorMsg = 'Invalid API key. Please check your key and try again.';
                } else if (response.status === 429) {
                    errorMsg = 'API rate limit exceeded. Please try again later.';
                } else if (response.status >= 500) {
                    errorMsg = 'OpenAI API is currently unavailable. Please try again later.';
                }
                this.notifications.showError(errorMsg);
            }
        } catch (error) {
            console.error('API validation error:', error);
            this.notifications.showError('Network error. Please check your connection and try again.');
        } finally {
            // Reset button state
            validateButton.disabled = false;
            validateText.style.display = 'inline';
            validateSpinner.style.display = 'none';
        }
    }

    /**
     * Get current API data
     * @returns {Object} - API data including key and models
     */
    getApiData() {
    
        return {
            apiKey: this.data.apiKey,
            models: this.data.models
        };
    }
    
    /**
     * Populate language options in a select element based on current TTS model
     * @param {HTMLSelectElement} selectElement - The select element to populate
     */
    populateLanguageOptions(selectElement) {
    
        if (!selectElement) {
            return;
        }
        
        // Clear existing options
        selectElement.innerHTML = '';
        
        // Get current TTS model
        const ttsModel = this.data.models.tts;
        
        // Get language options for this model
        const languageOptions = this.languageSupport.getLanguageOptions(ttsModel);
        
        // Add options to select element
        languageOptions.forEach(function addOption(option) {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.text;
            selectElement.appendChild(optionElement);
        });
        
        // Set current value if available
        if (this.data.models.scriptLanguage) {
            // Check if the current language is supported by the model
            const isSupported = languageOptions.some(option => option.value === this.data.models.scriptLanguage);
            
            if (isSupported) {
                selectElement.value = this.data.models.scriptLanguage;
            } else {
                // Default to English if current language not supported
                selectElement.value = 'english';
                this.data.models.scriptLanguage = 'english';
                this.saveToStorage();
            }
        }
    }
    
    /**
     * Set value of a select element if it exists
     * @param {string} elementId - ID of select element
     * @param {string} value - Value to set
     */
    setSelectValueIfExists(elementId, value) {
    
        const element = document.getElementById(elementId);
        if (element && value) {
            // Check if this value exists as an option
            const optionExists = Array.from(element.options).some(option => option.value === value);
            
            if (optionExists) {
                element.value = value;
            } else {
                // If the value doesn't exist, find and use the selected option
                const selectedOption = element.querySelector('option[selected]');
                if (selectedOption) {
                    element.value = selectedOption.value;
                    // Update the model value to match
                    const modelKey = {
                        'outline-model': 'outline',
                        'outline-verify-model': 'outlineVerify',
                        'script-model': 'script',
                        'script-verify-model': 'scriptVerify',
                        'backstory-model': 'backstory',
                        'tts-model': 'tts',
                        'script-language': 'scriptLanguage'
                    }[elementId];
                    
                    if (modelKey) {
                        this.data.models[modelKey] = selectedOption.value;
                    }
                }
            }
        }
    }
    
    /**
     * Set the usage counter
     * @param {UsageCounter} usageCounter - Instance of UsageCounter
     */
    setUsageCounter(usageCounter) {
    
        this.usageCounter = usageCounter;
    }
    
    /**
     * Track completion usage
     * @param {string} model - Model name
     * @param {number} promptTokens - Number of input tokens
     * @param {number} completionTokens - Number of output tokens
     */
    trackCompletionUsage(model, promptTokens, completionTokens) {
    
        if (this.usageCounter) {
            this.usageCounter.trackTokenUsage(model, promptTokens, completionTokens);
        }
    }
    
    /**
     * Track TTS usage
     * @param {string} model - TTS model name
     * @param {number} characters - Number of characters processed
     */
    trackTTSUsage(model, characters) {
    
        if (this.usageCounter) {
            this.usageCounter.trackTTSUsage(model, characters);
        }
    }
}

export default OpenAIManager;
