// Podcastor App - Character Manager
import NotificationsManager from '../ui/notifications.js';
import ProgressManager from '../ui/progressManager.js';

class CharacterManager {
    constructor(storageManager, contentStateManager, apiManager) {
        this.storageManager = storageManager;
        this.contentStateManager = contentStateManager;
        this.apiManager = apiManager;
        this.notifications = new NotificationsManager();
        this.progressManager = new ProgressManager();
        
        // Define character types
        this.types = ['host', 'guest'];
        
        // Define personality types with descriptions
        this.personalities = {
            'enthusiastic': 'Energetic and passionate about the topic',
            'professional': 'Formal and authoritative with expert knowledge',
            'casual': 'Relaxed, conversational and approachable',
            'analytical': 'Detail-oriented and logical with thoughtful insights',
            'humorous': 'Light-hearted with a good sense of humor',
            'empathetic': 'Understanding and compassionate about others\'s perspectives'
        };
        
        // Define voice types with descriptions (from OpenAI TTS voices)
        this.voices = {
            'alloy': 'Alloy (Male, versatile and balanced)',
            'echo': 'Echo (Male, deep and resonant)',
            'fable': 'Fable (Female, warm and gentle)',
            'onyx': 'Onyx (Male, authoritative and confident)',
            'nova': 'Nova (Female, energetic and professional)',
            'shimmer': 'Shimmer (Female, bright and expressive)'
        };
        
        // Load characters data from storage
        const savedData = this.storageManager.load('data', {});
        this.data = {
            host: savedData.host || {},
            guest: savedData.guest || {}
        };
        
        // Status flags for API calls
        this.isGeneratingBackstory = {
            host: false,
            guest: false
        };
    }

    /**
     * Initialize character manager
     */
    init() {
    
        // Setup options first, then populate data
        this.populatePersonalityOptions();
        this.populateVoiceOptions();
        
        // After dropdowns are populated, set saved values and update UI
        this.populateCharacterData();
        
        // Set up event listeners last
        this.setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
    
        const self = this;
        
        // Set up event listeners for each character type
        this.types.forEach(function(type) {
        
            // Backstory generation button
            const generateBackstoryBtn = document.getElementById(`generate-${type}-backstory`);
            if (generateBackstoryBtn) {
                generateBackstoryBtn.addEventListener('click', function() {
                    self.generateBackstory(type);
                });
            }

            // Save character button
            const saveButton = document.getElementById(`save-${type}`);
            if (saveButton) {
                saveButton.addEventListener('click', function() {
                    self.saveCharacter(type);
                });
            }
            
            // Real-time updates for form fields
            const formFields = [`${type}-name`, `${type}-personality`, `${type}-voice`, `${type}-backstory`];
            formFields.forEach(function(fieldId) {
            
                const field = document.getElementById(fieldId);
                if (field) {
                    field.addEventListener('change', function() {
                        self.updateFormStatus(type);
                    });
                    
                    if (field.tagName === 'INPUT' || field.tagName === 'TEXTAREA') {
                        field.addEventListener('input', function() {
                            self.updateFormStatus(type);
                        });
                    }
                }
            });
        });
    }

    /**
     * Populate personality select options for both characters
     */
    populatePersonalityOptions() {
    
        this.types.forEach(function(type) {
        
            const select = document.getElementById(`${type}-personality`);
            if (select) {
                // Clear existing options except the first placeholder
                while (select.options.length > 1) {
                    select.remove(1);
                }
                
                // Add personality options
                Object.entries(this.personalities).forEach(function([value, description]) {
                
                    const option = document.createElement('option');
                    option.value = value;
                    option.text = description;
                    select.appendChild(option);
                });
            }
        }.bind(this));
    }
    
    /**
     * Populate voice select options for both characters
     */
    populateVoiceOptions() {
    
        this.types.forEach(function(type) {
        
            const select = document.getElementById(`${type}-voice`);
            if (select) {
                // Clear existing options except the first placeholder
                while (select.options.length > 1) {
                    select.remove(1);
                }
                
                // Add voice options
                Object.entries(this.voices).forEach(function([value, description]) {
                
                    const option = document.createElement('option');
                    option.value = value;
                    option.text = description;
                    select.appendChild(option);
                });
            }
        }.bind(this));
    }

    /**
     * Populate character data in form elements
     */
    populateCharacterData() {
    
        this.types.forEach(function(type) {
        
            const characterData = this.data[type];
            if (characterData && characterData.name) {
                document.getElementById(`${type}-name`).value = characterData.name;
                
                // Get the personality select and set its value if it exists in the saved data
                const personalitySelect = document.getElementById(`${type}-personality`);
                if (personalitySelect && characterData.personality) {
                    personalitySelect.value = characterData.personality;
                }
                
                // Get the voice select and set its value if it exists in the saved data
                const voiceSelect = document.getElementById(`${type}-voice`);
                if (voiceSelect && characterData.voice) {
                    voiceSelect.value = characterData.voice;
                }
                
                // Set backstory
                document.getElementById(`${type}-backstory`).value = characterData.backstory || '';
                
                // Force character preview update
                this.updateCharacterPreview(type);
            }
            
            // Always update form status to set buttons correctly
            this.updateFormStatus(type);
        }.bind(this));
    }

    /**
     * Update form status based on field values
     * @param {string} type - Character type ('host' or 'guest') 
     */
    updateFormStatus(type) {
    
        const requiredFields = [
            `${type}-name`,
            `${type}-personality`,
            `${type}-voice`
        ];
        
        // Check if all required fields have values
        const isComplete = requiredFields.every(function(fieldId) {
        
            const field = document.getElementById(fieldId);
            return field && field.value.trim() !== '';
        });
        
        // Update save button state
        const saveButton = document.getElementById(`save-${type}`);
        if (saveButton) {
            saveButton.disabled = !isComplete;
        }
        
        // Update character preview
        this.updateCharacterPreview(type);
        
        return isComplete;
    }
    
    /**
     * Update character preview UI
     * @param {string} type - Character type ('host' or 'guest')
     */
    updateCharacterPreview(type) {
    
        const name = document.getElementById(`${type}-name`).value.trim();
        const personality = document.getElementById(`${type}-personality`).value;
        const voice = document.getElementById(`${type}-voice`).value;
        const preview = document.getElementById(`${type}-preview`);
        const traits = document.getElementById(`${type}-traits`);
        
        // No preview if name is empty
        if (!name) {
            preview.style.display = 'none';
            return;
        }
        
        // Create traits HTML
        let traitsHTML = '';
        
        // Add name if available
        if (name) {
            traitsHTML += `<div class="character-trait">${name}</div>`;
        }
        
        // Add personality if selected
        if (personality) {
            const personalityText = this.personalities[personality] || personality;
            traitsHTML += `<div class="character-trait">${personalityText}</div>`;
        }
        
        // Add voice if selected
        if (voice) {
            const voiceText = this.voices[voice] || voice;
            traitsHTML += `<div class="character-trait voice">${voiceText.split('(')[0].trim()}</div>`;
        }
        
        // Check if we have at least some traits to show
        if (traitsHTML) {
            traits.innerHTML = traitsHTML;
            preview.style.display = 'block';
            
            // Update status
            const isComplete = name && personality && voice;
            const statusDiv = document.getElementById(`${type}-status`);
            const statusText = document.getElementById(`${type}-status-text`);
            
            if (isComplete) {
                statusDiv.className = 'character-status complete';
                statusText.textContent = 'Character complete';
            } else {
                statusDiv.className = 'character-status incomplete';
                statusText.textContent = 'Character incomplete';
            }
        } else {
            preview.style.display = 'none';
        }
    }
    
    /**
     * Save character data
     * @param {string} type - Character type ('host' or 'guest')
     */
    saveCharacter(type) {
    
        const character = {
            name: document.getElementById(`${type}-name`).value.trim(),
            personality: document.getElementById(`${type}-personality`).value,
            voice: document.getElementById(`${type}-voice`).value,
            backstory: document.getElementById(`${type}-backstory`).value.trim() || ''
        };

        if (!character.name || !character.personality || !character.voice) {
            this.notifications.showError(`Please fill in all required ${type} character fields`);
            return;
        }

        this.data[type] = character;
        this.saveToStorage();
        
        // Show success notification with capitalized character type
        const typeName = type.charAt(0).toUpperCase() + type.slice(1);
        this.notifications.showSuccess(`${typeName} character saved!`);

        // Update content state based on character type
        if (type === 'host') {
            this.contentStateManager.updateState('hasHostCharacter', true);
            setTimeout(function() {
                this.contentStateManager.updateSections();
            }.bind(this), 1000);
        } else if (type === 'guest') {
            this.contentStateManager.updateState('hasGuestCharacter', true);
            setTimeout(function() {
                this.contentStateManager.updateSections();
            }.bind(this), 1000);
        }
    }

    /**
     * Generate character backstory using OpenAI API
     * @param {string} type - Character type ('host' or 'guest')
     */
    async generateBackstory(type) {
    
        // Get user prompt
        const prompt = document.getElementById(`${type}-backstory-prompt`).value.trim();
        if (!prompt) {
            this.notifications.showError('Please enter a prompt for backstory generation');
            return;
        }
        
        // Get API data
        const apiData = this.apiManager.getApiData();
        if (!apiData.apiKey) {
            this.notifications.showError('OpenAI API key is required. Please configure it in step 1.');
            return;
        }
        
        // Get personality selection
        const personalitySelect = document.getElementById(`${type}-personality`);
        const personality = personalitySelect.value || '';
        const personalityText = personality ? this.personalities[personality] || personality : '';
        
        // Set up UI for loading state
        const backstoryArea = document.getElementById(`${type}-backstory`);
        const generateButton = document.getElementById(`generate-${type}-backstory`);
        const originalButtonText = generateButton.textContent;
        
        // Prevent multiple simultaneous calls
        if (this.isGeneratingBackstory[type]) {
            return;
        }
        
        try {
            // Set loading state
            this.isGeneratingBackstory[type] = true;
            generateButton.disabled = true;
            generateButton.innerHTML = '<span class="spinner"></span> Generating...';
            backstoryArea.classList.add('loading');
            
            // Build context for more interesting results
            let characterName = document.getElementById(`${type}-name`).value.trim();
            if (!characterName) {
                characterName = `${type.charAt(0).toUpperCase() + type.slice(1)} character`;
            }
            
            // Build system prompt and user prompt
            const systemPrompt = `You are a creative character developer for podcasts. 
            Create a detailed backstory for a podcast ${type} character named ${characterName}.
            ${personalityText ? `Their personality is ${personalityText}.` : ''}
            The backstory should include their background, expertise, communication style, and unique traits.
            Keep it concise (250-300 words max) but rich in personality.`;
            
            const userPrompt = `Based on this brief description, create a backstory for ${characterName}: "${prompt}"`;
            
            // Create API request
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiData.apiKey}`
                },
                body: JSON.stringify({
                    model: apiData.models.backstory,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    max_tokens: 1000,
                    temperature: 0.7
                })
            });
            
            // Handle API response
            if (!response.ok) {
                let errorMessage = 'Failed to generate backstory';
                
                if (response.status === 401) {
                    errorMessage = 'Invalid API key. Please check your credentials.';
                } else if (response.status === 429) {
                    errorMessage = 'API rate limit exceeded. Please try again later.';
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    errorMessage = errorData.error?.message || errorMessage;
                }
                
                throw new Error(errorMessage);
            }
            
            const data = await response.json();
            const backstory = data.choices[0]?.message?.content?.trim();
            
            // Track token usage if available
            if (data.usage) {
                const modelName = apiData.models.backstory;
                const promptTokens = data.usage.prompt_tokens || 0;
                const completionTokens = data.usage.completion_tokens || 0;
                
                // Track usage via API manager
                this.apiManager.trackCompletionUsage(modelName, promptTokens, completionTokens);
            }
            
            if (backstory) {
                backstoryArea.value = backstory;
                this.notifications.showSuccess('Backstory generated! You can edit it if needed.');
                this.updateFormStatus(type);
            } else {
                throw new Error('No backstory content received from API');
            }
            
        } catch (error) {
            console.error('Backstory generation error:', error);
            this.notifications.showError(error.message || 'Failed to generate backstory. Please try again.');
        } finally {
            // Reset UI state
            this.isGeneratingBackstory[type] = false;
            generateButton.disabled = false;
            generateButton.textContent = originalButtonText;
            backstoryArea.classList.remove('loading');
        }
    }

    /**
     * Save data to storage
     */
    saveToStorage() {
    
        const existingData = this.storageManager.load('data', {});
        const updatedData = {
            ...existingData,
            host: this.data.host,
            guest: this.data.guest
        };
        this.storageManager.save('data', updatedData);
    }

    /**
     * Get character data
     * @returns {Object} - Character data for host and guest
     */
    getCharacterData() {
    
        return {
            host: this.data.host,
            guest: this.data.guest
        };
    }
    
    /**
     * Check if both characters are complete
     * @returns {boolean} - True if both characters are complete and valid
     */
    areCharactersComplete() {
    
        // Check if both host and guest have required fields
        return this.types.every(function(type) {
        
            const character = this.data[type];
            return character && 
                   character.name && 
                   character.personality && 
                   character.voice;
        }.bind(this));
    }
}

export default CharacterManager;
