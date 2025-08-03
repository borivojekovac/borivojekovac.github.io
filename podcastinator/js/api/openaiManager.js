// Podcastor App - OpenAI API Manager
import NotificationsManager from '../ui/notifications.js';

class OpenAIManager {
    constructor(storageManager, contentStateManager) {
        this.storageManager = storageManager;
        this.contentStateManager = contentStateManager;
        this.notifications = new NotificationsManager();
        
        // Load models data from storage
        const savedData = this.storageManager.load('data', {});
        this.data = {
            apiKey: savedData.apiKey || '',
            models: savedData.models || {
                // Default model selections based on recommendations from memory
                outline: 'gpt-4o',          // GPT-4o recommended for outline generation
                script: 'gpt-4o',           // GPT-4o recommended for script generation
                backstory: 'gpt-4o-mini',   // GPT-4o Mini recommended for character backstories
                tts: 'tts-1',               // TTS-1 standard for text-to-speech
                audioQuality: 'standard'     // Standard audio quality
            }
        };
    }

    /**
     * Initialize OpenAI API manager
     */
    init() {
    
        this.setupModelSelectionListeners();
        this.setupApiKeyValidation();
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
            'script-model', 
            'backstory-model',
            'tts-model',
            'audio-quality'
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
            document.getElementById('outline-model').value = this.data.models.outline;
            document.getElementById('script-model').value = this.data.models.script;
            document.getElementById('backstory-model').value = this.data.models.backstory;
            document.getElementById('tts-model').value = this.data.models.tts;
            document.getElementById('audio-quality').value = this.data.models.audioQuality;
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
            'script-model': 'script',
            'backstory-model': 'backstory', 
            'tts-model': 'tts',
            'audio-quality': 'audioQuality'
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
            'script-model': 'script',
            'backstory-model': 'backstory',
            'tts-model': 'tts',
            'audio-quality': 'audioQuality'
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
