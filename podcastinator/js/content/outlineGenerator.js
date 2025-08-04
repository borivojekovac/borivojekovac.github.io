// Podcastor App - Outline Generator
import NotificationsManager from '../ui/notifications.js';
import ProgressManager from '../ui/progressManager.js';

/**
 * Handles the generation of podcast outlines using OpenAI
 */
class OutlineGenerator {
    constructor(storageManager, contentStateManager, apiManager) {
        this.storageManager = storageManager;
        this.contentStateManager = contentStateManager;
        this.apiManager = apiManager;
        this.notifications = new NotificationsManager();
        this.progressManager = new ProgressManager();
        
        // Generation state
        this.isGenerating = false;
        this.cancelGeneration = false;
        
        // Load existing outline data from storage
        const savedData = this.storageManager.load('outlineData', {});
        this.outlineData = savedData.outline || '';
        
        // Load podcast settings or use defaults
        this.podcastDuration = savedData.podcastDuration || 30;
        this.podcastFocus = savedData.podcastFocus || '';
    }

    /**
     * Initialize the outline generator
     */
    init() {
    
        // Initialize UI components
        this.initializeUI();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Restore saved data if it exists
        this.restoreSavedData();
    }
    
    /**
     * Initialize UI components
     */
    initializeUI() {
    
        // Get UI elements
        this.outlineTextarea = document.getElementById('outline-text');
        this.generateButton = document.getElementById('generate-outline');
        this.progressContainer = document.getElementById('outline-progress');
        this.progressBar = this.progressContainer.querySelector('.progress-bar .progress-fill');
        this.cancelButton = document.getElementById('cancel-outline');
        
        // Get new podcast configuration elements
        this.podcastDurationInput = document.getElementById('podcast-duration');
        this.podcastFocusInput = document.getElementById('podcast-focus');
        
        // Set initial values if we have saved data
        if (this.podcastDurationInput) {
            this.podcastDurationInput.value = this.podcastDuration;
        }
        
        if (this.podcastFocusInput) {
            this.podcastFocusInput.value = this.podcastFocus;
        }
        
        // Make sure progress bar is initially hidden
        if (this.progressContainer) {
            this.progressContainer.style.display = 'none';
        }
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
    
        // Generate outline button
        if (this.generateButton) {
            this.generateButton.addEventListener('click', this.handleGenerateOutline.bind(this));
        }
        
        // Cancel generation button
        if (this.cancelButton) {
            this.cancelButton.addEventListener('click', this.handleCancelGeneration.bind(this));
        }
        
        // Listen for changes to outline text
        if (this.outlineTextarea) {
            this.outlineTextarea.addEventListener('input', this.handleOutlineChange.bind(this));
        }
        
        // Listen for changes to podcast duration
        if (this.podcastDurationInput) {
            this.podcastDurationInput.addEventListener('change', this.handlePodcastSettingsChange.bind(this));
        }
        
        // Listen for changes to podcast focus
        if (this.podcastFocusInput) {
            this.podcastFocusInput.addEventListener('input', this.handlePodcastSettingsChange.bind(this));
        }
    }
    
    /**
     * Restore saved data if it exists
     */
    restoreSavedData() {
    
        if (this.outlineData && this.outlineTextarea) {
            this.outlineTextarea.value = this.outlineData;
            
            // Update state if we have valid outline data
            if (this.outlineData.trim()) {
                this.contentStateManager.updateState('hasOutline', true);
            }
        }
    }
    
    /**
     * Handle generate outline button click
     */
    async handleGenerateOutline() {
    
        // Check if we're already generating
        if (this.isGenerating) {
            return;
        }
        
        try {
            // Get API data
            const apiData = this.apiManager.getApiData();
            if (!apiData.apiKey) {
                this.notifications.showError('OpenAI API key is required. Please configure it in step 1.');
                return;
            }
            
            // Set generating state
            this.setGeneratingState(true);
            
            // Get document data from the main data store
            const data = this.storageManager.load('data', {});
            if (!data.document || !data.document.content) {
                throw new Error('No document content found. Please upload a document first.');
            }
            
            const documentData = data.document;
            
            // Get character data
            const characterData = this.storageManager.load('data', {});
            if (!characterData.host || !characterData.guest) {
                throw new Error('Host and guest character data is required. Please complete character creation first.');
            }
            
            // Generate outline
            await this.generateOutline(documentData, characterData, apiData);
            
        } catch (error) {
            console.error('Outline generation error:', error);
            this.notifications.showError(error.message || 'Failed to generate outline. Please try again.');
        } finally {
            // Reset generating state
            this.setGeneratingState(false);
        }
    }
    
    /**
     * Handle cancel generation button click
     */
    handleCancelGeneration() {
    
        this.cancelGeneration = true;
        this.notifications.showInfo('Cancelling outline generation...');
    }
    
    /**
     * Handle outline text changes
     */
    handleOutlineChange() {
    
        // Save to storage
        this.saveOutlineData();
        
        // Update content state
        const hasOutline = this.outlineTextarea.value.trim().length > 0;
        this.contentStateManager.updateState('hasOutline', hasOutline);
    }
    
    /**
     * Handle podcast settings changes
     */
    handlePodcastSettingsChange() {
    
        // Update the podcast settings
        if (this.podcastDurationInput) {
            this.podcastDuration = parseInt(this.podcastDurationInput.value, 10) || 30;
        }
        
        if (this.podcastFocusInput) {
            this.podcastFocus = this.podcastFocusInput.value.trim();
        }
        
        // Save the updated settings
        this.saveOutlineData();
    }
    
    /**
     * Generate podcast outline using OpenAI API
     * @param {Object} documentData - Document data including content
     * @param {Object} characterData - Host and guest character data
     * @param {Object} apiData - API credentials and model data
     */
    async generateOutline(documentData, characterData, apiData) {
    
        try {
            // Update progress
            this.progressManager.updateProgress('outline-progress', 10);
            
            // Get the document content (now stored as plain text)
            let documentContent = '';
            
            if (documentData.content) {
                // Plain text content, no need to decode
                documentContent = documentData.content;
            } else {
                throw new Error('Invalid document content format');
            }
            
            // Truncate if too long for API limits
            const maxLength = 32000;
            if (documentContent.length > maxLength) {
                documentContent = documentContent.substring(0, maxLength) + '... [Content truncated due to length]';
            }
            
            // Build system prompt
            const systemPrompt = this.buildSystemPrompt(characterData);
            
            // Build user prompt with document content
            const userPrompt = this.buildUserPrompt(documentContent);
            
            // Get model name in lowercase for easier comparison
            const modelName = apiData.models.outline.toLowerCase();
            const isAnthropicStyle = modelName.includes('o3') || modelName.includes('o4');
            
            // Prepare request body with model-specific parameters
            const requestBody = {
                model: apiData.models.outline,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ]
            };
            
            // Handle model-specific parameters
            if (isAnthropicStyle) {
                // Anthropic-style models use max_completion_tokens and only support default temperature (1.0)
                requestBody.max_completion_tokens = 3000;
                // Don't set temperature for Anthropic models as they only support default (1.0)
            } else {
                // OpenAI models use max_tokens and support custom temperature
                requestBody.max_tokens = 3000;
                requestBody.temperature = 0.7; // Only set for non-Anthropic models
            }
            
            // Create API request
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiData.apiKey}`
                },
                body: JSON.stringify(requestBody)
            });
            
            // Handle API response
            if (!response.ok) {
                let errorMessage = 'Failed to generate outline';
                
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
            
            // Update progress
            this.progressManager.updateProgress('outline-progress', 50);
            
            // Check if cancelled
            if (this.cancelGeneration) {
                this.cancelGeneration = false;
                throw new Error('Outline generation cancelled');
            }
            
            const data = await response.json();
            const outlineText = data.choices[0]?.message?.content?.trim();
            
            // Track token usage if available
            if (data.usage) {
                const modelName = apiData.models.outline;
                const promptTokens = data.usage.prompt_tokens || 0;
                const completionTokens = data.usage.completion_tokens || 0;
                
                // Track usage via API manager
                this.apiManager.trackCompletionUsage(modelName, promptTokens, completionTokens);
            }
            
            if (outlineText) {
                // Update progress - now we'll verify
                this.progressManager.updateProgress('outline-progress', 60);
                
                // Set up iterative verification and improvement
                let currentOutline = outlineText;
                let isValid = false;
                let feedback = '';
                let iterationCount = 0;
                const maxIterations = 3;
                
                // Iterative verification and improvement loop
                while (!isValid && iterationCount < maxIterations) {
                    iterationCount++;
                    
                    // Show verification notification with iteration count
                    const verificationNotificationId = Date.now();
                    this.notifications.showInfo(`Verifying outline quality (attempt ${iterationCount}/${maxIterations})...`, verificationNotificationId);
                    
                    // Verify the outline with a second model
                    const verificationResult = await this.verifyOutline(currentOutline, documentContent, characterData, apiData);
                    
                    // Clear the verification notification
                    this.notifications.clearNotification(verificationNotificationId);
                    
                    // Log verification feedback to console
                    this.logVerificationFeedback(`Outline Verification (Iteration ${iterationCount})`, verificationResult);
                    
                    // Update status based on verification result
                    isValid = verificationResult.isValid;
                    feedback = verificationResult.feedback;
                    
                    // If still not valid and we haven't reached max iterations, improve the outline
                    if (!isValid && iterationCount < maxIterations) {
                        this.progressManager.updateProgress('outline-progress', 60 + (iterationCount * 10));
                        const improvementNotificationId = Date.now();
                        this.notifications.showInfo(`Improving outline (attempt ${iterationCount}/${maxIterations})...`, improvementNotificationId);
                        
                        // Attempt to improve the outline
                        const improvedOutline = await this.improveOutline(currentOutline, feedback, documentContent, characterData, apiData);
                        
                        // Clear the improvement notification
                        this.notifications.clearNotification(improvementNotificationId);
                        
                        if (improvedOutline) {
                            currentOutline = improvedOutline;
                            this.notifications.showInfo(`Outline improvement ${iterationCount} complete. Re-verifying...`);
                        } else {
                            // If improvement failed, break the loop
                            break;
                        }
                    }
                }
                
                // Set final outline text
                let finalOutlineText = currentOutline;
                
                // Show final status notification
                if (isValid) {
                    this.notifications.showSuccess('Outline verification successful!');
                } else if (iterationCount >= maxIterations) {
                    this.notifications.showSuccess(`Outline improved ${iterationCount} times. Best possible version achieved.`);
                } else {
                    this.notifications.showSuccess('Outline improvement complete.');
                }
                
                // Set outline in textarea
                this.outlineTextarea.value = finalOutlineText;
                
                // Save to storage
                this.saveOutlineData();
                
                // Update content state
                this.contentStateManager.updateState('hasOutline', true);
                
                // Show success message
                this.notifications.showSuccess('Outline generated successfully!');
                
                // Update progress to complete
                this.progressManager.updateProgress('outline-progress', 100);
            } else {
                throw new Error('No outline content received from API');
            }
            
        } catch (error) {
            throw error;
        }
    }
    
    /**
     * Build system prompt for outline generation
     * @param {Object} characterData - Host and guest character data
     * @returns {string} - System prompt
     */
    buildSystemPrompt(characterData) {
    
        const host = characterData.host || {};
        const guest = characterData.guest || {};
        const targetDurationMinutes = this.podcastDuration;
        
        return `You are a podcast outline generator.
        
Create a structured outline for a podcast discussion between a host named "${host.name || 'Host'}" 
(${host.personality ? `personality: ${host.personality}` : ''}) 
and a guest named "${guest.name || 'Guest'}" (${guest.personality ? `personality: ${guest.personality}` : ''}).

IMPORTANT: The target duration for the entire podcast is ${targetDurationMinutes} minutes. You must structure the outline so that each section has an appropriate amount of time allocation, adding up to ${targetDurationMinutes} minutes total.

The outline MUST follow this EXACT format with section separators and duration for easy parsing:

---
1. [Section Title]
Duration: [Target duration in minutes]
Overview: [Brief summary of the discussion points and topics for this section]
---
1.1. [Subsection Title]
Duration: [Target duration in minutes]
Overview: [Brief summary of the discussion points for this subsection]
---
2. [Section Title]
Duration: [Target duration in minutes]
Overview: [Brief summary of the discussion points and topics for this section]
---

IMPORTANT: Each main section (with a whole number like 1, 2, 3) MUST start and end with a horizontal rule separator (---) on its own line. This is mandatory for parsing purposes.

The outline should include:
- Appropriate hierarchical numbering (1, 1.1, 1.2, 2, etc.)
- Clear, informative section titles
- Target duration in minutes for each section and subsection (durations should be realistic and including intro and outro, add up to ${targetDurationMinutes} minutes total)
- Comprehensive overviews that summarize the key points without getting into dialogue
- Natural flow that builds from introduction to conclusion

Here is a complete example of the REQUIRED format:

---
1. Introduction and Topic Overview
Duration: 3 minutes
Overview: A brief welcome to listeners, introduction of the guest, and overview of today's topic.
---
1.1. Host and Guest Introduction
Duration: 1 minute
Overview: Brief exchange of credentials and establishing expertise.
---
1.2. Topic Relevance
Duration: 2 minutes
Overview: Discussion of why this topic matters to the audience.
---
2. Main Topic Section
Duration: 7 minutes
Overview: Detailed exploration of the central theme with expert insights.
---
2.1. Key Concept Explanation
Duration: 5 minutes
Overview: Breaking down the main concept for the audience.
---

DO NOT include actual dialogue or script. This is only an outline with clear section separators for parsing, and is not indicative of actual sections or duration structure.`;
    }
    
    /**
     * Build user prompt with document content
     * @param {string} documentContent - Document content
     * @returns {string} - User prompt
     */
    buildUserPrompt(documentContent) {
    
        // Base prompt
        let prompt = `Generate a podcast outline based on the following`;
        
        // Add focus if provided
        if (this.podcastFocus && this.podcastFocus.trim().length > 0) {
            prompt += ` focus & overall instructions: "${this.podcastFocus.trim()}"

Document content:

${documentContent}

Create a well-organized outline that focuses specifically on the requested topic in a conversational podcast format. Remember that the entire podcast must be exactly ${this.podcastDuration} minutes long, and each section should have an appropriate duration specified.`;
        } else {
            prompt += ` document content:

${documentContent}

Create a well-organized outline that covers the key information from this document in a conversational podcast format. Remember that the entire podcast must be exactly ${this.podcastDuration} minutes long, and each section should have an appropriate duration specified.`;
        }
        
        return prompt;
    }
    
    /**
     * Set generating state and update UI
     * @param {boolean} isGenerating - Whether generation is in progress
     */
    setGeneratingState(isGenerating) {
    
        this.isGenerating = isGenerating;
        
        if (isGenerating) {
            // Update UI for generating state
            this.generateButton.disabled = true;
            this.progressContainer.style.display = 'flex';
            this.progressManager.resetProgress('outline-progress');
            this.cancelGeneration = false;
        } else {
            // Reset UI
            this.generateButton.disabled = false;
            this.progressContainer.style.display = 'none';
        }
    }
    
    /**
     * Save outline data to storage
     */
    saveOutlineData() {
    
        const outlineData = {
            outline: this.outlineTextarea.value,
            podcastDuration: this.podcastDuration,
            podcastFocus: this.podcastFocus,
            timestamp: new Date().toISOString()
        };
        
        this.storageManager.save('outlineData', outlineData);
        this.outlineData = this.outlineTextarea.value;
    }
    
    /**
     * Log verification feedback to console in a nicely formatted way
     * @param {string} title - Title for the log group
     * @param {Object} result - Verification result object with isValid and feedback properties
     */
    logVerificationFeedback(title, result) {
    
        // Create styled console output
        const titleStyle = 'font-weight: bold; font-size: 14px; color: #3498db;';
        const validStyle = result.isValid ? 'color: #2ecc71; font-weight: bold;' : 'color: #e74c3c; font-weight: bold;';
        const feedbackStyle = 'color: #333; background: #f8f9fa; padding: 4px; border-left: 3px solid #3498db;';
        
        // Open a console group with the title
        console.group(`%c${title}`, titleStyle);
        
        // Log the validation status
        console.log(
            `%cValidation: ${result.isValid ? 'PASSED ✅' : 'NEEDS IMPROVEMENT ⚠️'}`,
            validStyle
        );
        
        // Log the feedback with nice formatting
        console.log('%cFeedback:', 'font-weight: bold;');
        console.log(`%c${result.feedback}`, feedbackStyle);
        
        // Close the console group
        console.groupEnd();
    }
    
    /**
     * Verify the generated outline against the original document
     * @param {string} outlineText - The generated outline text
     * @param {string} documentContent - Original document content
     * @param {Object} characterData - Host and guest character data
     * @param {Object} apiData - API credentials and model data
     * @returns {Object} - Verification result with isValid flag and feedback
     */
    async verifyOutline(outlineText, documentContent, characterData, apiData) {
    
        try {
            // Get model name in lowercase for easier comparison
            const modelName = apiData.models.outlineVerify.toLowerCase();
            const isAnthropicStyle = modelName.includes('o3') || modelName.includes('o4');
            
            // Create system prompt for verification
            const systemPrompt = `You are a podcast outline quality checker. Your job is to analyze a generated podcast outline for:

1. STRUCTURE QUALITY: Ensure the outline has a logical structure with appropriate sections
2. TIMING ACCURACY: Verify that section durations add up to the target podcast duration
3. TOPICAL COVERAGE: Check that the outline appears to cover the main topics with appropriate emphasis
4. FOCUS ALIGNMENT: Confirm the outline aligns with any user-specified focus/steer
5. FORMAT CORRECTNESS: Ensure the outline follows the required section numbering and separator format

Respond with a JSON object containing:
- "isValid": true if the outline meets all quality criteria, false otherwise
- "feedback": specific issues found (if isValid is false) or confirmation (if isValid is true)

If the outline is high quality and factually accurate, respond with {"isValid": true, "feedback": "Outline is accurate and well-structured."}`;
            
            // Build user prompt for verification
            const podcastDuration = this.podcastDuration;
            const podcastFocus = this.podcastFocus;
            let userPrompt = `Please review this podcast outline for quality and structure.

Target Podcast Duration: ${podcastDuration} minutes
${podcastFocus ? `Podcast Focus: ${podcastFocus}\n` : ''}

--- GENERATED OUTLINE ---
${outlineText}

--- ORIGINAL DOCUMENT CONTENT ---
${documentContent}

Verify if this outline has a logical structure, well-balanced sections, and aligns with the target duration and focus. Respond in the required JSON format.`;
            
            // Prepare request body with model-specific parameters
            const requestBody = {
                model: apiData.models.outlineVerify,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ]
            };
            
            // Handle model-specific parameters
            if (isAnthropicStyle) {
                //requestBody.max_completion_tokens = 1500;
            } else {
                //requestBody.max_tokens = 1500;
                requestBody.temperature = 0.3; // Lower temperature for more consistent evaluation
            }
            
            // Create API request
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiData.apiKey}`
                },
                body: JSON.stringify(requestBody)
            });
            
            // Handle API response
            if (!response.ok) {
                console.error('Outline verification failed:', response.status);
                return { isValid: true, feedback: 'Verification skipped due to API error. Using original outline.' };
            }
            
            const data = await response.json();
            const verificationText = data.choices[0]?.message?.content?.trim();
            
            // Track token usage if available
            if (data.usage) {
                const modelName = apiData.models.outlineVerify;
                const promptTokens = data.usage.prompt_tokens || 0;
                const completionTokens = data.usage.completion_tokens || 0;
                
                // Track usage via API manager
                this.apiManager.trackCompletionUsage(modelName, promptTokens, completionTokens);
            }
            
            // Parse verification result
            try {
                // Extract JSON from the response (handling cases where there might be text before/after JSON)
                const jsonMatch = verificationText.match(/{[\s\S]*}/m);
                if (jsonMatch) {
                    const resultJson = JSON.parse(jsonMatch[0]);
                    return {
                        isValid: !!resultJson.isValid, // Ensure boolean
                        feedback: resultJson.feedback || 'No specific feedback provided.'
                    };
                } else {
                    // Fallback if no JSON found
                    const isPositive = verificationText.toLowerCase().includes('valid') || 
                                      verificationText.toLowerCase().includes('accurate') ||
                                      verificationText.toLowerCase().includes('good');
                    return {
                        isValid: isPositive,
                        feedback: verificationText.substring(0, 200) + '...'
                    };
                }
            } catch (error) {
                console.error('Error parsing verification result:', error);
                // Default to assuming it's valid to avoid blocking workflow
                return { isValid: true, feedback: 'Unable to parse verification result. Using original outline.' };
            }
            
        } catch (error) {
            console.error('Error during outline verification:', error);
            // Default to assuming it's valid to avoid blocking workflow
            return { isValid: true, feedback: 'Verification error. Using original outline.' };
        }
    }
    
    /**
     * Improve the outline based on verification feedback
     * @param {string} originalOutlineText - The original outline text
     * @param {string} feedback - Feedback from verification
     * @param {string} documentContent - Original document content
     * @param {Object} characterData - Host and guest character data
     * @param {Object} apiData - API credentials and model data
     * @returns {string} - Improved outline text
     */
    async improveOutline(originalOutlineText, feedback, documentContent, characterData, apiData) {
    
        try {
            // Get model name in lowercase for easier comparison
            const modelName = apiData.models.outline.toLowerCase(); // Use the main outline generation model
            const isAnthropicStyle = modelName.includes('o3') || modelName.includes('o4');
            
            // Create system prompt for improvement
            const systemPrompt = this.buildSystemPrompt(characterData);
            
            // Build user prompt for improvement
            const podcastDuration = this.podcastDuration;
            const podcastFocus = this.podcastFocus;
            const userPrompt = `Please improve this podcast outline based on the feedback provided. The outline has some issues that need to be addressed.

Target Podcast Duration: ${podcastDuration} minutes
${podcastFocus ? `Podcast Focus: ${podcastFocus}\n` : ''}

--- ORIGINAL OUTLINE ---
${originalOutlineText}

--- FEEDBACK ON ISSUES ---
${feedback}

--- ORIGINAL DOCUMENT CONTENT ---
${documentContent}

Please create an improved version of the outline that addresses the feedback while maintaining the required format with section separators (---), section numbers, titles, durations, and overviews. Focus on creating a well-structured outline with logical sections and appropriate coverage of topics. Make sure section durations add up to exactly ${podcastDuration} minutes.`;
            
            // Prepare request body with model-specific parameters
            const requestBody = {
                model: apiData.models.outline,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ]
            };
            
            // Handle model-specific parameters
            if (isAnthropicStyle) {
                //requestBody.max_completion_tokens = 3000;
            } else {
                //requestBody.max_tokens = 3000;
                requestBody.temperature = 0.7;
            }
            
            // Create API request
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiData.apiKey}`
                },
                body: JSON.stringify(requestBody)
            });
            
            // Handle API response
            if (!response.ok) {
                console.error('Outline improvement failed:', response.status);
                return originalOutlineText; // Return original outline if improvement fails
            }
            
            const data = await response.json();
            const improvedOutlineText = data.choices[0]?.message?.content?.trim();
            
            // Track token usage if available
            if (data.usage) {
                const modelName = apiData.models.outline;
                const promptTokens = data.usage.prompt_tokens || 0;
                const completionTokens = data.usage.completion_tokens || 0;
                
                // Track usage via API manager
                this.apiManager.trackCompletionUsage(modelName, promptTokens, completionTokens);
            }
            
            return improvedOutlineText || originalOutlineText;
            
        } catch (error) {
            console.error('Error during outline improvement:', error);
            return originalOutlineText; // Return original outline if improvement fails
        }
    }
}

export default OutlineGenerator;
