// Podcastinator App - Script Generator
import NotificationsManager from '../ui/notifications.js';
import ProgressManager from '../ui/progressManager.js';

/**
 * Handles the generation of podcast scripts using OpenAI
 */
class ScriptGenerator {
    constructor(storageManager, contentStateManager, apiManager) {
        this.storageManager = storageManager;
        this.contentStateManager = contentStateManager;
        this.apiManager = apiManager;
        this.notifications = new NotificationsManager();
        this.progressManager = new ProgressManager();
        
        // Generation state
        this.isGenerating = false;
        this.cancelGeneration = false;
        this.currentSection = 0;
        this.totalSections = 0;
        
        // Conversation tracking for continuity
        this.conversationSummary = '';
        this.lastSectionSummary = '';
        this.lastDialogueExchanges = ''; // Store actual dialogue exchanges for continuity
        this.topicsSummary = ''; // Store structured topics summary
        this.generatedSections = [];
        
        // Load existing script data from storage
        const savedData = this.storageManager.load('scriptData', {});
        this.scriptData = savedData.script || '';
    }

    /**
     * Initialize the script generator
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
        this.scriptTextarea = document.getElementById('script-text');
        this.generateButton = document.getElementById('generate-script');
        this.progressContainer = document.getElementById('script-progress');
        this.progressBar = this.progressContainer.querySelector('.progress-bar .progress-fill');
        this.cancelButton = document.getElementById('cancel-script');
        
        // Make sure progress bar is initially hidden
        if (this.progressContainer) {
            this.progressContainer.style.display = 'none';
        }
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
    
        // Generate script button
        if (this.generateButton) {
            this.generateButton.addEventListener('click', this.handleGenerateScript.bind(this));
        }
        
        // Cancel generation button
        if (this.cancelButton) {
            this.cancelButton.addEventListener('click', this.handleCancelGeneration.bind(this));
        }
        
        // Listen for changes to script text
        if (this.scriptTextarea) {
            this.scriptTextarea.addEventListener('input', this.handleScriptChange.bind(this));
        }
    }
    
    /**
     * Restore saved data if it exists
     */
    restoreSavedData() {
    
        if (this.scriptData && this.scriptTextarea) {
            this.scriptTextarea.value = this.scriptData;
            
            // Update state if we have valid script data
            if (this.scriptData.trim()) {
                this.contentStateManager.updateState('hasScript', true);
            }
        }
    }
    
    /**
     * Handle generate script button click
     */
    async handleGenerateScript() {
    
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
            
            // Get document and outline data
            const data = this.storageManager.load('data', {});
            const outlineData = this.storageManager.load('outlineData', {});
            
            if (!outlineData.outline) {
                throw new Error('No outline found. Please generate an outline first.');
            }
            
            // Get character data
            const characterData = {
                host: data.host || {},
                guest: data.guest || {}
            };
            
            if (!characterData.host || !characterData.guest) {
                throw new Error('Host and guest character data is required. Please complete character creation first.');
            }
            
            // Parse outline sections
            const sections = this.parseOutlineSections(outlineData.outline);
            this.totalSections = sections.length;
            
            if (this.totalSections === 0) {
                throw new Error('Could not parse any sections from the outline. Please check the outline format.');
            }
            
            // Reset script content before generation
            this.scriptTextarea.value = '';
            this.saveScriptData();
            
            // Generate script section by section
            await this.generateFullScript(sections, characterData, apiData);
            
        } catch (error) {
            console.error('Script generation error:', error);
            this.notifications.showError(error.message || 'Failed to generate script. Please try again.');
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
        this.notifications.showInfo('Cancelling script generation...');
    }
    
    /**
     * Handle script text changes
     */
    handleScriptChange() {
    
        // Save to storage
        this.saveScriptData();
        
        // Update content state
        const hasScript = this.scriptTextarea.value.trim().length > 0;
        this.contentStateManager.updateState('hasScript', hasScript);
    }
    
    /**
     * Parse outline into sections for script generation
     * @param {string} outlineText - The outline text to parse
     * @returns {Array} - Array of outline sections
     */
    parseOutlineSections(outlineText) {
    
        console.log('Parsing outline sections, length:', outlineText.length);
        
        // Split by horizontal rule separators - more forgiving of whitespace
        const sectionStrings = outlineText.split(/^\s*---\s*$/m).filter(section => section.trim());
        
        console.log('Found', sectionStrings.length, 'sections');
        
        // Track total duration for validation
        let totalDuration = 0;
        
        const sections = sectionStrings.map((sectionStr, index) => {
            // Extract section number and title
            const titleMatch = sectionStr.match(/^\s*(\d+(?:\.\d+)*)\.\s+([^\r\n]+)/m);
            
            // Extract duration
            const durationMatch = sectionStr.match(/Duration:\s*(\d+(?:\.\d+)?)/m);
            const durationMinutes = durationMatch ? parseFloat(durationMatch[1]) : 0;
            
            // Extract overview
            const overviewMatch = sectionStr.match(/Overview:\s*([^\r\n]+)/m);
            
            // Add to total duration
            totalDuration += durationMinutes;
            
            const section = {
                id: index + 1,
                number: titleMatch ? titleMatch[1] : `${index + 1}`,
                title: titleMatch ? titleMatch[2] : `Section ${index + 1}`,
                durationMinutes: durationMinutes,
                overview: overviewMatch ? overviewMatch[1] : 'No overview provided',
                content: sectionStr.trim()
            };
            
            console.log(`Section ${index + 1}:`, section.title, '(', section.durationMinutes, 'min)');
            
            return section;
        });
        
        // Store the total duration for use in prompts
        this.totalPodcastDuration = totalDuration;
        
        return sections;
    }
    
    /**
     * Generate full podcast script using OpenAI API
     * @param {Array} sections - Parsed outline sections
     * @param {Object} characterData - Host and guest character data
     * @param {Object} apiData - API credentials and model data
     */
    async generateFullScript(sections, characterData, apiData) {
    
        try {
            // Initialize progress tracking and conversation context
            this.currentSection = 0;
            this.conversationSummary = '';
            this.lastSectionSummary = '';
            this.topicsSummary = '';
            this.generatedSections = [];
            
            // First, generate the intro
            await this.generateScriptIntro(characterData, apiData);
            
            // After intro, create initial conversation summary
            await this.updateConversationSummary(apiData);
            
            // Generate each section
            for (let i = 0; i < sections.length; i++) {
                // Check if cancelled
                if (this.cancelGeneration) {
                    this.cancelGeneration = false;
                    throw new Error('Script generation cancelled');
                }
                
                // Update progress
                this.currentSection = i + 1;
                const progressPercentage = Math.floor((this.currentSection / (this.totalSections + 2)) * 100);
                this.progressManager.updateProgress('script-progress', progressPercentage);
                
                // Check if this is the last section
                const isLastSection = (i === sections.length - 1);
                
                // Generate section
                await this.generateScriptSection(sections[i], characterData, apiData, isLastSection);
                
                // Update conversation summary after each section (except the last one)
                if (!isLastSection) {
                    await this.updateConversationSummary(apiData);
                }
            }
            
            // Generate outro only if we have more than one section (otherwise it's included in the last section)
            if (sections.length > 1) {
                await this.generateScriptOutro(characterData, apiData);
            }
            
            // Update progress for script verification
            this.progressManager.updateProgress('script-progress', 85);
            
            // Get document and outline data
            const documentData = this.storageManager.load('data', {});
            const outlineData = this.storageManager.load('outlineData', {});
            const documentContent = documentData.document?.content || '';
            
            // Set up iterative verification and improvement
            let currentScript = this.scriptData;
            let isValid = false;
            let feedback = '';
            let iterationCount = 0;
            const maxIterations = 3;
            
            // Iterative verification and improvement loop
            while (!isValid && iterationCount < maxIterations) {
                iterationCount++;
                
                // Show verification notification with iteration count
                const verificationNotificationId = Date.now();
                this.notifications.showInfo(`Verifying script quality (attempt ${iterationCount}/${maxIterations})...`, verificationNotificationId);
                
                // Verify the script
                const verificationResult = await this.verifyScript(
                    currentScript,
                    outlineData.outline,
                    documentContent,
                    characterData,
                    apiData
                );
                
                // Clear the verification notification
                this.notifications.clearNotification(verificationNotificationId);
                
                // Log verification feedback to console
                this.logVerificationFeedback(`Script Verification (Iteration ${iterationCount})`, verificationResult);
                
                // Update status based on verification result
                isValid = verificationResult.isValid;
                feedback = verificationResult.feedback;
                
                // If still not valid and we haven't reached max iterations, improve the script
                if (!isValid && iterationCount < maxIterations) {
                    this.progressManager.updateProgress('script-progress', 85 + (iterationCount * 5));
                    const improvementNotificationId = Date.now();
                    this.notifications.showInfo(`Improving script (attempt ${iterationCount}/${maxIterations})...`, improvementNotificationId);
                    
                    // Attempt to improve the script
                    const improvedScript = await this.improveScript(
                        currentScript,
                        feedback,
                        outlineData.outline,
                        documentContent,
                        characterData,
                        apiData
                    );
                    
                    // Clear the improvement notification
                    this.notifications.clearNotification(improvementNotificationId);
                    
                    if (improvedScript) {
                        currentScript = improvedScript;
                        this.notifications.showInfo(`Script improvement ${iterationCount} complete. Re-verifying...`);
                    } else {
                        // If improvement failed, break the loop
                        break;
                    }
                }
            }
            
            // Update the textarea with the final script
            this.scriptTextarea.value = currentScript;
            this.saveScriptData();
            
            // Show final status notification
            if (isValid) {
                this.notifications.showSuccess('Script verification successful!');
            } else if (iterationCount >= maxIterations) {
                this.notifications.showSuccess(`Script improved ${iterationCount} times. Best possible version achieved.`);
            } else {
                this.notifications.showSuccess('Script improvement complete.');
            }
            
            // Update state
            this.contentStateManager.updateState('hasScript', true);
            
            // Show success message
            this.notifications.showSuccess('Script generated successfully!');
            
            // Update progress to complete
            this.progressManager.updateProgress('script-progress', 100);
            
        } catch (error) {
            // If not cancelled, rethrow
            if (error.message !== 'Script generation cancelled') {
                throw error;
            }
        }
    }
    
    /**
     * Generate script introduction
     * @param {Object} characterData - Host and guest character data
     * @param {Object} apiData - API credentials and model data
     */
    async generateScriptIntro(characterData, apiData) {
    
        try {
            // Build system prompt for introduction
            const systemPrompt = this.buildSystemPrompt(characterData, 'intro');
            
            // Get document data
            const data = this.storageManager.load('data', {});
            const outlineData = this.storageManager.load('outlineData', {});
            const documentName = data.document?.name || 'this topic';
            const podcastFocus = outlineData.podcastFocus || '';
            
            // Get language setting
            const scriptLanguage = apiData.models.scriptLanguage || 'english';
            
            // Build user prompt for introduction
            const userPrompt = `Generate a podcast introduction where the host welcomes the listeners and introduces the guest. 
The topic of the podcast is "${documentName}".

Remember this is the FIRST section of the podcast, so the host should be welcoming the listeners and introducing the guest for the first time.`;
            
            // Add language instruction to system prompt
            const languageSystemPrompt = `${systemPrompt}\n\nGenerate the script in ${scriptLanguage} language.`;
            
            // Call OpenAI API
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiData.apiKey}`
                },
                body: JSON.stringify({
                    model: apiData.models.script,
                    messages: [
                        { role: 'system', content: languageSystemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    max_tokens: 1000,
                    temperature: 0.7
                })
            });
            
            if (!response.ok) {
                this.handleApiError(response);
            }
            
            const responseData = await response.json();
            const introText = responseData.choices[0]?.message?.content?.trim();
            
            // Track token usage if available
            if (responseData.usage) {
                const modelName = apiData.models.script;
                const promptTokens = responseData.usage.prompt_tokens || 0;
                const completionTokens = responseData.usage.completion_tokens || 0;
                
                // Track usage via API manager
                this.apiManager.trackCompletionUsage(modelName, promptTokens, completionTokens);
            }
            
            if (introText) {
                // Process the text to remove stage directions and ensure proper formatting
                const processedText = this.processScriptText(introText);
                
                // Store the last dialogue exchanges for continuity with first section
                this.lastDialogueExchanges = this.extractLastExchanges(processedText, 2);
                
                // Add intro content (no separators needed for TTS processing)
                this.appendToScript(processedText);
                
                // Save to storage
                this.saveScriptData();
            } else {
                throw new Error('No introduction content received from API');
            }
            
        } catch (error) {
            throw error;
        }
    }
    
    /**
     * Generate script section
     * @param {Object} section - Section data from outline
     * @param {Object} characterData - Host and guest character data
     * @param {Object} apiData - API credentials and model data
     * @param {boolean} isLastSection - Whether this is the final section
     */
    async generateScriptSection(section, characterData, apiData, isLastSection = false) {
    
        try {
            // Get the full document content first
            const data = this.storageManager.load('data', {});
            const outlineData = this.storageManager.load('outlineData', {});
            const documentContent = data.document?.content || '';
            const documentName = data.document?.name || 'this document';
            const podcastFocus = outlineData.podcastFocus || '';
            
            // Build system prompt for section with document content
            const systemPrompt = this.buildSystemPrompt(characterData, isLastSection ? 'lastSection' : 'section', documentContent);
            
            // Get language setting
            const scriptLanguage = apiData.models.scriptLanguage || 'english';
            
            // Build user prompt with conversation context
            let userPrompt = `Generate the podcast script for the topic: "${section.title}".

Overview: ${section.overview}

Target Duration: ${section.durationMinutes} minutes

Full outline section:
${section.content}
`;
            
            // Add information about total podcast duration for context
            if (this.totalPodcastDuration) {
                userPrompt += `
This section should be approximately ${section.durationMinutes} minutes long out of the total ${this.totalPodcastDuration} minute podcast. Adjust the depth and detail accordingly.
`;
            }
            
            // Add conversation context for continuity if we have previous dialogue
            if (this.lastDialogueExchanges) {
                userPrompt += `

## Previous Dialogue (Continue DIRECTLY from here)
${this.lastDialogueExchanges}

## CRITICAL: Conversation Continuity Instructions
1. Continue the dialogue EXACTLY from where it left off above
2. DO NOT restart the conversation or introduce new topics abruptly
3. NEVER have the host re-introduce the guest or the podcast
4. NEVER have the guest thank the host for introducing them
5. Maintain the same speaking style and tone established above
6. This is NOT a new podcast - it's the SAME ongoing conversation`;
            } else {
                userPrompt += `

This is the first content section of the podcast. The host should transition naturally from the introduction to this topic without restarting the conversation.`;
            }
            
            // Add enhanced continuity instructions with topic-specific guidance
            if (this.topicsSummary) {
                userPrompt += `

## PREVIOUS TOPICS COVERED:
${this.topicsSummary}

## CRITICAL: Topic Continuity Instructions
1. When referencing previously covered topics, ALWAYS acknowledge they were discussed earlier
2. NEVER have the host say "I've heard that..." about topics already covered above
3. Use natural references like:
   - HOST: "As we discussed earlier about [topic]..."
   - HOST: "Building on what we covered about [topic]..."
   - GUEST: "As I mentioned when we talked about [topic]..."
   - GUEST: "To expand on my earlier point about [topic]..."
4. If adding new details to a previously mentioned topic, explicitly acknowledge this:
   - "We touched on [topic] earlier, but there's another aspect worth exploring..."
   - "Building on our discussion of [topic], another interesting consideration is..."
5. For any topics listed in CARRYOVER for this section, explicitly connect to previous discussion`;
            }
            
            // Enhance the section-specific content guidance
            userPrompt += `

## FOCUS FOR THIS SECTION:
Title: ${section.title}
Overview: ${section.overview}

KEY FACTS TO COVER:
${this.extractKeyFacts(section.content)}

UNIQUE FOCUS:
${this.extractUniqueFocus(section.content)}

CARRYOVER:
${this.extractCarryover(section.content)}`;
            
            if (isLastSection) {
                userPrompt += `

IMPORTANT: This is the FINAL section of the podcast. The host should begin wrapping up the conversation and provide a sense of closure. Include some concluding thoughts, but the actual formal goodbye will be in a separate outro.`;
            } else {
                userPrompt += `

This is NOT the final section. The conversation should feel ongoing and not conclude completely, as there are more sections to follow.`;
            }
            
            // Add language instruction to system prompt
            const languageSystemPrompt = `${systemPrompt}\n\nGenerate the script in ${scriptLanguage} language.`;
            
            // Call OpenAI API
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiData.apiKey}`
                },
                body: JSON.stringify({
                    model: apiData.models.script,
                    messages: [
                        { role: 'system', content: languageSystemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    max_tokens: 2000,
                    temperature: 0.7
                })
            });
            
            if (!response.ok) {
                this.handleApiError(response);
            }
            
            const responseData = await response.json();
            const sectionText = responseData.choices[0]?.message?.content?.trim();
            
            // Track token usage if available
            if (responseData.usage) {
                const modelName = apiData.models.script;
                const promptTokens = responseData.usage.prompt_tokens || 0;
                const completionTokens = responseData.usage.completion_tokens || 0;
                
                // Track usage via API manager
                this.apiManager.trackCompletionUsage(modelName, promptTokens, completionTokens);
            }
            
            if (sectionText) {
                // Process the text to remove stage directions and ensure proper formatting
                const processedText = this.processScriptText(sectionText);
                
                // Store this section for summary generation
                this.generatedSections.push({
                    number: section.number,
                    title: section.title,
                    content: processedText
                });
                
                // Store the last dialogue exchanges for continuity
                this.lastDialogueExchanges = this.extractLastExchanges(processedText, 2); // Get last 2 exchanges
                
                // Add section content (no separators needed for TTS processing)
                this.appendToScript(processedText);
                
                // Save to storage
                this.saveScriptData();
            } else {
                throw new Error(`No content received from API for section ${section.number}`);
            }
            
        } catch (error) {
            throw error;
        }
    }
    
    /**
     * Generate script outro
     * @param {Object} characterData - Host and guest character data
     * @param {Object} apiData - API credentials and model data
     */
    async generateScriptOutro(characterData, apiData) {
    
        try {
            // Build system prompt for outro
            const systemPrompt = this.buildSystemPrompt(characterData, 'outro');
            
            // Get document and outline data
            const outlineData = this.storageManager.load('outlineData', {});
            const podcastFocus = outlineData.podcastFocus || '';
            
            // Get language setting
            const scriptLanguage = apiData.models.scriptLanguage || 'english';
            
            // Build user prompt for outro with previous dialogue for continuity
            let userPrompt = `Generate a podcast conclusion where the host thanks the guest and says goodbye to the listeners.`;
            
            // Add previous dialogue exchanges if available to maintain continuity
            if (this.lastDialogueExchanges) {
                userPrompt = `Continue the podcast conversation to a natural conclusion where the host thanks the guest and says goodbye to the listeners.

## Previous Dialogue (Continue DIRECTLY from here)
${this.lastDialogueExchanges}

## CRITICAL: Conversation Continuity Instructions
1. Continue the dialogue EXACTLY from where it left off above
2. This is the END of the same ongoing conversation - NOT a new segment
3. Naturally transition to closing remarks and goodbyes
4. Maintain the same speaking style and tone established above`;  
            }
            
            // Add language instruction to system prompt
            const languageSystemPrompt = `${systemPrompt}\n\nGenerate the script in ${scriptLanguage} language.`;
            
            // Call OpenAI API
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiData.apiKey}`
                },
                body: JSON.stringify({
                    model: apiData.models.script,
                    messages: [
                        { role: 'system', content: languageSystemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    max_tokens: 1000,
                    temperature: 0.7
                })
            });
            
            if (!response.ok) {
                this.handleApiError(response);
            }
            
            const responseData = await response.json();
            const outroText = responseData.choices[0]?.message?.content?.trim();
            
            if (outroText) {
                // Process the text to remove stage directions and ensure proper formatting
                const processedText = this.processScriptText(outroText);
                
                // Add outro content (no separators needed for TTS processing)
                this.appendToScript(processedText);
                
                // Save to storage
                this.saveScriptData();
            } else {
                throw new Error('No conclusion content received from API');
            }
            
        } catch (error) {
            throw error;
        }
    }
    
    /**
     * Build system prompt based on part type
     * @param {Object} characterData - Host and guest character data
     * @param {string} partType - Part type (intro, section, lastSection, outro)
     * @param {string} documentContent - Content of the document (optional)
     * @returns {string} - System prompt
     */
    buildSystemPrompt(characterData, partType, documentContent = '') {
    
        const host = characterData.host || {};
        const guest = characterData.guest || {};
        
        // Get podcast focus from outline data
        const outlineData = this.storageManager.load('outlineData', {});
        const podcastFocus = outlineData.podcastFocus || '';
        
        let basePrompt = `# Podcast Script Generator Instructions

## Characters

### Host: "${host.name || 'Host'}"
${host.personality ? `- **Personality**: ${host.personality}` : ''}
${host.backstory ? `- **Backstory**: 

\`\`\`
${host.backstory}
\`\`\`` : ''}

### Guest: "${guest.name || 'Guest'}"
${guest.personality ? `- **Personality**: ${guest.personality}` : ''}
${guest.backstory ? `- **Backstory**: 

\`\`\`
${guest.backstory}
\`\`\`` : ''}

## Role Knowledge Separation (CRITICAL)

- The **HOST** only knows the podcast outline and cannot reference specific document details unless the GUEST mentions them first
- The **HOST** should guide the conversation based on the outline topics only
- The **GUEST** has full knowledge of the document content and can provide detailed insights, examples, and quotes from it
- The **GUEST** should share expertise from the document without mentioning that it comes from "the document" - it should sound like their own knowledge

${podcastFocus ? `## Podcast Focus/Steer

${podcastFocus}
` : ''}`;
        
        // Add document content if provided
        if (documentContent) {
            // Truncate very long documents if needed (to help with context limits)
            const maxDocLength = 40000; // Adjust based on model capabilities
            const truncatedDoc = documentContent.length > maxDocLength ? 
                documentContent.substring(0, maxDocLength) + '\n[Document truncated due to length...]' : 
                documentContent;
                
            basePrompt += `

## Document Content (Only the GUEST has knowledge of this information)

\`\`\`
${truncatedDoc}
\`\`\``;
        }
        
        basePrompt += `

## Formatting Requirements (CRITICAL)

- Begin each speaker's dialogue with "---" followed by either "HOST:" or "GUEST:" on its own line
- DO NOT include character names, descriptions, or any other text after HOST: or GUEST:
- DO NOT include ANY stage directions, action descriptions, or non-verbal cues [like this]
- DO NOT include ANY section markers, separators, or titles
- Create natural-sounding conversational dialogue suitable for text-to-speech
- Text should contain only what would be actually spoken aloud
- NEVER refer to "segments", "sections", or "parts" of the podcast - the conversation should flow naturally as a single discussion
- Pay close attention to the target duration for this section and aim to generate dialogue that would take approximately that amount of time to speak aloud
- Adjust the level of detail and depth based on the allocated time for this section

## Conversation Guidelines

- Ensure the host guides the conversation and asks thoughtful questions based on the outline
- Ensure the guest provides insightful responses drawing from the document content
- Make personalities and speaking styles match character descriptions
- Keep the conversation engaging and flowing naturally

## Character Speaking Styles

### Host Speaking Style (${host.personality || 'default'})
${this.getPersonalityDescription(host.personality)}

### Guest Speaking Style (${guest.personality || 'default'})
${this.getPersonalityDescription(guest.personality)}

## Example Mid-Conversation Output Format

\`\`\`
---
HOST:
I find that perspective on the data really insightful. It makes me wonder about the implications for future development in this area.

---
GUEST:
Absolutely. When we look at the trends over the past few years, we can see that several key factors are converging to create new opportunities.

---
HOST:
Could you elaborate on which of those factors you think will have the biggest impact?

---
GUEST:
I'd say the most significant one is probably the shift in how we're approaching the fundamental challenge of...
\`\`\``;

        if (partType === 'intro') {
            return `${basePrompt}
            
## Conversation Flow: Opening

This begins the podcast conversation:

- Begin with the host welcoming the audience to the podcast
- Introduce the podcast topic
- Introduce the guest with relevant credentials
- Brief exchange to establish rapport
- Explain what listeners will learn

> **Note:** Remember this is the FIRST part of the conversation, so it should establish the podcast context.`;
        } else if (partType === 'lastSection') {
            return `${basePrompt}
            
## Conversation Flow: Moving Toward Conclusion

This is the concluding portion of the ongoing podcast conversation:

- Begin wrapping up the major discussion points
- Include some reflective comments on what was discussed
- Start moving toward a sense of closure
- Keep the conversation focused on concluding thoughts
- Do NOT include final goodbyes yet

> **Note:** The conversation should be winding down but not completely finished.`;
        } else if (partType === 'outro') {
            return `${basePrompt}
            
## Conversation Flow: Final Closing

This concludes the podcast conversation:

- Host thanks the guest for their insights and participation
- Guest gives brief final thoughts or appreciation
- Host provides closing remarks to the audience
- Include a final sign-off line
- Keep it concise and natural`;
        } else if (partType === 'improvement') {
            return `${basePrompt}
            
## Conversation Flow: Script Improvement

You are improving an existing podcast script based on feedback:

- Fix any issues mentioned in the feedback while maintaining the conversation flow
- Keep the same characters and their personalities
- Maintain the proper HOST: and GUEST: format for speakers
- Ensure the dialogue sounds natural and engaging
- Remove any redundancy or repetitiveness, particularly:
  * Convert host saying "I've heard that..." about topics already discussed to natural references
  * Fix topics introduced as new when they've been covered before
  * Connect related topics across sections with explicit acknowledgments
- Make sure the script follows the provided outline structure
- Do NOT add any stage directions or descriptions in [brackets]
- Produce a complete, improved version of the script that can be used as a drop-in replacement
- CRITICAL: When fixing redundancy, use natural references like "As we discussed earlier..." or "Building on our previous point..."`;  
        } else if (partType === 'section') {
            return `${basePrompt}
            
## Conversation Flow: Continuing Discussion

This is part of an ongoing podcast conversation:

- Create a focused conversation on the specific topic from the outline
- Ensure back-and-forth dialogue with natural transitions
- Include thoughtful questions from the host based only on the outline information
- Include detailed, informative responses from the guest drawing from the document content
- Maintain the conversational flow and continuity from previous dialogue
- Do NOT mention that this is a "section" or "segment" - treat it as a natural part of an ongoing conversation
- Do NOT introduce the podcast or guest again
- Do NOT conclude the podcast or say goodbye`;
        }
    }
    
    /**
     * Get personality description based on type
     * @param {string} personalityType - Personality type
     * @returns {string} - Personality description
     */
    getPersonalityDescription(personalityType) {
    
        const personalities = {
            'enthusiastic': 'energetic, passionate, uses exclamations, asks excited questions',
            'analytical': 'logical, methodical, uses precise language, asks probing questions',
            'compassionate': 'empathetic, warm, uses supportive language, asks caring questions',
            'humorous': 'witty, light-hearted, uses jokes, asks playful questions',
            'authoritative': 'confident, direct, uses assertive language, asks challenging questions',
            'curious': 'inquisitive, open-minded, uses wondering language, asks many questions',
            'skeptical': 'questioning, doubtful, uses cautious language, asks critical questions',
            'visionary': 'imaginative, forward-thinking, uses inspirational language, asks big-picture questions'
        };
        
        return personalities[personalityType] || 'uses natural, conversational language and asks thoughtful questions';
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
            this.progressManager.resetProgress('script-progress');
            this.cancelGeneration = false;
        } else {
            // Reset UI
            this.generateButton.disabled = false;
            this.progressContainer.style.display = 'none';
        }
    }
    
    /**
     * Process script text to remove stage directions and ensure proper formatting
     * @param {string} text - Script text to process
     * @returns {string} - Processed text
     */
    processScriptText(text) {
    
        // Replace speaker lines with the required format
        let processedText = text
            // Replace standard speaker format with our format
            .replace(/HOST\s*\([^)]*\):/g, '---\nHOST:')
            .replace(/GUEST\s*\([^)]*\):/g, '---\nGUEST:')
            // Remove any stage directions [like this]
            .replace(/\[[^\]]*\]/g, '')
            // Remove any remaining character attributions
            .replace(/(HOST|GUEST)\s*\([^)]*\)/g, '$1:')
            // Ensure proper spacing
            .replace(/\n{3,}/g, '\n\n');
            
        // Ensure the script starts with the --- marker
        if (!processedText.trim().startsWith('---')) {
            processedText = '---\n' + processedText.trim();
        }
        
        return processedText;
    }
    
    /**
     * Extract the last few exchanges between HOST and GUEST from a dialogue
     * @param {string} text - The dialogue text to extract from
     * @param {number} exchangeCount - Number of exchanges to extract (an exchange is HOST+GUEST)
     * @returns {string} - The extracted exchanges
     */
    extractLastExchanges(text, exchangeCount = 2) {
    
        if (!text || typeof text !== 'string') {
            return '';
        }
        
        // Split by speaker markers
        const speakerSegments = text.split(/---\s*\n(HOST:|GUEST:)/g);
        
        // Reconstruct properly formatted segments
        const formattedSegments = [];
        for (let i = 1; i < speakerSegments.length; i += 2) {
            if (i+1 < speakerSegments.length) {
                formattedSegments.push(`---\n${speakerSegments[i]}${speakerSegments[i+1].trim()}`);
            }
        }
        
        // Get the last N exchanges (HOST+GUEST pairs)
        const totalPairs = Math.floor(formattedSegments.length / 2);
        const pairsToKeep = Math.min(exchangeCount, totalPairs);
        
        if (pairsToKeep === 0) {
            return '';
        }
        
        const startIdx = formattedSegments.length - (pairsToKeep * 2);
        const lastExchanges = formattedSegments.slice(startIdx);
        
        return lastExchanges.join('\n\n');
    }
    
    /**
     * Update conversation summary for context in next section
     * @param {Object} apiData - API credentials and model data
     */
    async updateConversationSummary(apiData) {
    
        try {
            // If we don't have any generated sections yet, skip
            if (this.generatedSections.length === 0) {
                return;
            }
            
            // Get the most recent section
            const lastSection = this.generatedSections[this.generatedSections.length - 1];
            
            // Enhanced prompt for structured summarization
            const prompt = `Analyze the following podcast conversation section and create a structured summary:

1. GENERAL SUMMARY: Brief overview of the conversation (max 50 words)

2. KEY TOPICS COVERED: 
   - List the specific topics, concepts, terminology, and facts discussed
   - Use precise language that matches how they were discussed
   - Include 5-8 key topics/facts maximum

3. TOPIC CONTEXT: 
   - For each topic, note HOW it was discussed (e.g., introduced, explained in depth, briefly mentioned)

Format your response exactly as:

SUMMARY: [General summary text]

TOPICS COVERED:
- [Topic 1]: [Brief context]
- [Topic 2]: [Brief context]
- [Topic 3]: [Brief context]
...

This summary will be used to maintain continuity in an ongoing podcast, so be specific.

Conversation Section:
${lastSection.content}`;
            
            // Call OpenAI API for summarization
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiData.apiKey}`
                },
                body: JSON.stringify({
                    model: apiData.models.outline, // Using outline model for summarization
                    messages: [
                        { role: 'system', content: 'You are a structured analyzer of podcast conversations, creating detailed topic summaries to prevent redundancy in future sections.' },
                        { role: 'user', content: prompt }
                    ],
                    max_tokens: 300,
                    temperature: 0.5
                })
            });
            
            if (!response.ok) {
                // Just log the error but don't fail the whole process
                console.error('Failed to generate section summary');
                return;
            }
            
            const responseData = await response.json();
            const summary = responseData.choices[0]?.message?.content?.trim();
            
            // Track token usage if available
            if (responseData.usage) {
                const modelName = apiData.models.outline;
                const promptTokens = responseData.usage.prompt_tokens || 0;
                const completionTokens = responseData.usage.completion_tokens || 0;
                
                // Track usage via API manager
                this.apiManager.trackCompletionUsage(modelName, promptTokens, completionTokens);
            }
            
            if (summary) {
                // Parse the structured summary
                const summaryMatch = summary.match(/SUMMARY:\s*(.*?)(?=\n\n|\n?TOPICS COVERED:)/s);
                const topicsMatch = summary.match(/TOPICS COVERED:\s*([\s\S]*?)(?=\n\n|$)/s);
                
                const generalSummary = summaryMatch ? summaryMatch[1].trim() : summary;
                const topicsText = topicsMatch ? topicsMatch[1].trim() : '';
                
                // Store both general summary and structured topics
                this.conversationSummary = generalSummary;
                this.topicsSummary = topicsText; // New property to store topics
                
                // Store the last section summary
                this.lastSectionSummary = generalSummary;
            }
            
        } catch (error) {
            // Just log the error but don't fail the whole process
            console.error('Error generating conversation summary:', error);
        }
    }
    
    /**
     * Extract key facts from outline section content
     * @param {string} sectionContent - Section content from outline
     * @returns {string} - Extracted key facts
     */
    extractKeyFacts(sectionContent) {
    
        const keyFactsMatch = sectionContent.match(/KEY FACTS:\s*([\s\S]*?)(?=\n\nUNIQUE FOCUS:|\n\nCARRYOVER:|$)/s);
        return keyFactsMatch ? keyFactsMatch[1].trim() : 'No specific key facts provided';
    }
    
    /**
     * Extract unique focus from outline section content
     * @param {string} sectionContent - Section content from outline
     * @returns {string} - Extracted unique focus
     */
    extractUniqueFocus(sectionContent) {
    
        const uniqueFocusMatch = sectionContent.match(/UNIQUE FOCUS:\s*(.*?)(?=\n\nCARRYOVER:|\n\n|$)/s);
        return uniqueFocusMatch ? uniqueFocusMatch[1].trim() : 'No unique focus specified';
    }
    
    /**
     * Extract carryover topics from outline section content
     * @param {string} sectionContent - Section content from outline
     * @returns {string} - Extracted carryover topics
     */
    extractCarryover(sectionContent) {
    
        const carryoverMatch = sectionContent.match(/CARRYOVER:\s*(.*?)(?=\n\n|$)/s);
        return carryoverMatch ? carryoverMatch[1].trim() : 'No carryover topics';
    }
    
    /**
     * Append text to script textarea
     * @param {string} text - Text to append
     */
    appendToScript(text) {
    
        if (this.scriptTextarea) {
            if (this.scriptTextarea.value && !this.scriptTextarea.value.endsWith('\n\n')) {
                this.scriptTextarea.value += '\n\n';
            }
            this.scriptTextarea.value += text;
            
            // Scroll to bottom
            this.scriptTextarea.scrollTop = this.scriptTextarea.scrollHeight;
        }
    }
    
    /**
     * Save script data to storage
     */
    saveScriptData() {
    
        const scriptData = {
            script: this.scriptTextarea.value,
            timestamp: new Date().toISOString()
        };
        
        this.storageManager.save('scriptData', scriptData);
        this.scriptData = this.scriptTextarea.value;
    }
    
    /**
     * Handle API error response
     * @param {Response} response - Fetch API response
     */
    async handleApiError(response) {
    
        let errorMessage = 'Failed to generate script';
        
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
     * Verify the generated script against the outline and target duration
     * @param {string} scriptText - The generated script text
     * @param {string} outlineText - Original outline content
     * @param {string} documentContent - Original document content
     * @param {Object} characterData - Host and guest character data
     * @param {Object} apiData - API credentials and model data
     * @returns {Object} - Verification result with isValid flag and feedback
     */
    async verifyScript(scriptText, outlineText, documentContent, characterData, apiData) {
    
        try {
            // Get model name in lowercase for easier comparison
            const modelName = apiData.models.scriptVerify.toLowerCase();
            const isAnthropicStyle = modelName.includes('o3') || modelName.includes('o4');
            
            // Create system prompt for verification
            const systemPrompt = `You are a podcast script quality checker and fact verifier. Your job is to analyze a generated podcast script against the outline and original document content for:

1. FACTUAL ACCURACY: Ensure all claims and information in the script are supported by the original document
2. OUTLINE ADHERENCE: Ensure the script follows the structure and topics in the outline
3. DURATION ACCURACY: Check if the script's length is appropriate for the target podcast duration
4. REDUNDANCY CHECK (HIGH PRIORITY): Identify any redundant content or repetitive dialogue, particularly:
   - Host saying "I've heard that..." about topics already discussed
   - Topics covered in multiple sections without acknowledgment
   - Same facts or examples repeated in different parts of the script
   - Topics introduced as new when they've been discussed before
5. CONVERSATIONAL FLOW: Verify that the dialogue feels natural and flows well between speakers
6. CHARACTER CONSISTENCY: Ensure host and guest voices maintain consistent personalities

For redundancy issues, provide specific examples of the redundant content and how it should be fixed.

Respond with a JSON object containing:
- "isValid": true if the script meets quality criteria, false otherwise
- "feedback": specific issues found (if isValid is false) or confirmation (if isValid is true)
- "redundancyIssues": array of specific redundancy problems (empty if none found)

If the script is high quality and follows the outline well, respond with {"isValid": true, "feedback": "Script is well-structured and follows the outline appropriately.", "redundancyIssues": []}`;
            
            // Parse outline to get duration and structure
            const parsedOutline = this.parseOutlineSections(outlineText);
            const targetDuration = this.totalPodcastDuration;
            
            // Build user prompt for verification
            const userPrompt = `Please review this podcast script for quality and coherence against the outline and original document.

Target Podcast Duration: ${targetDuration} minutes

--- OUTLINE STRUCTURE ---
${outlineText}

--- GENERATED SCRIPT ---
${scriptText}

--- ORIGINAL DOCUMENT CONTENT ---
${documentContent}

Verify if this script is factually accurate (comparing to the document), follows the outline structure, maintains appropriate pacing for the target duration, avoids redundancy, and maintains good conversational flow. Respond in the required JSON format.`;
            
            // Prepare request body with model-specific parameters
            const requestBody = {
                model: apiData.models.scriptVerify,
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
                console.error('Script verification failed:', response.status);
                return { isValid: true, feedback: 'Verification skipped due to API error. Using original script.' };
            }
            
            const data = await response.json();
            const verificationText = data.choices[0]?.message?.content?.trim();
            
            // Track token usage if available
            if (data.usage) {
                const modelName = apiData.models.scriptVerify;
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
                                      verificationText.toLowerCase().includes('coherent') ||
                                      verificationText.toLowerCase().includes('good');
                    return {
                        isValid: isPositive,
                        feedback: verificationText.substring(0, 200) + '...'
                    };
                }
            } catch (error) {
                console.error('Error parsing verification result:', error);
                // Default to assuming it's valid to avoid blocking workflow
                return { isValid: true, feedback: 'Unable to parse verification result. Using original script.' };
            }
            
        } catch (error) {
            console.error('Error during script verification:', error);
            // Default to assuming it's valid to avoid blocking workflow
            return { isValid: true, feedback: 'Verification error. Using original script.' };
        }
    }
    
    /**
     * Improve the script based on verification feedback
     * @param {string} originalScriptText - The original script text
     * @param {string} feedback - Feedback from verification
     * @param {string} outlineText - Original outline content
     * @param {string} documentContent - Original document content
     * @param {Object} characterData - Host and guest character data
     * @param {Object} apiData - API credentials and model data
     * @returns {string} - Improved script text
     */
    async improveScript(originalScriptText, feedback, outlineText, documentContent, characterData, apiData) {
    
        try {
            // Calculate original script length to ensure we maintain comparable size
            const originalScriptLength = originalScriptText.length;
            console.log(`Original script length: ${originalScriptLength} characters`);
            
            // Get model name in lowercase for easier comparison
            const modelName = apiData.models.script.toLowerCase(); // Use the main script generation model
            const isAnthropicStyle = modelName.includes('o3') || modelName.includes('o4');
            
            // Create enhanced system prompt for improvement with clear preservation instructions
            const systemPrompt = `${this.buildSystemPrompt(characterData, 'improvement')}

IMPORTANT INSTRUCTIONS FOR SCRIPT IMPROVEMENT:

1. MAKE TARGETED CHANGES ONLY - Only modify specific sections mentioned in the feedback. Do not rewrite or summarize unaffected sections.

2. PRESERVE ORIGINAL CONTENT - Keep all dialogue that isn't directly mentioned in the feedback exactly as it is.

3. MAINTAIN EQUIVALENT LENGTH - Your response MUST be approximately the same length as the original script (within 10%). Do not shorten or summarize the content.

4. PRESERVE DETAILED DIALOGUE - Keep the same level of conversational detail and depth as the original script.

5. PRESERVE FORMAT - Maintain section headers, speaker identifiers (HOST/GUEST), and overall structure.

Warning: If your response is significantly shorter than the original script, it will be rejected. Your task is precise editing, not summarization.`;
            
            // Get language setting
            const scriptLanguage = apiData.models.scriptLanguage || 'english';
            
            // Build enhanced user prompt for targeted improvement
            const targetDuration = this.totalPodcastDuration;
            const userPrompt = `You are a podcast script editor. I have a podcast script that needs targeted improvements based on specific feedback. Your job is to make PRECISE EDITS to address the feedback while preserving the original content, format, and length.

Target Podcast Duration: ${targetDuration} minutes

--- ORIGINAL SCRIPT ---
${originalScriptText}

--- FEEDBACK ON ISSUES ---
${feedback}

--- OUTLINE STRUCTURE ---
${outlineText}

--- ORIGINAL DOCUMENT CONTENT ---
${documentContent}

IMPORTANT INSTRUCTIONS:

1. DO NOT REWRITE the entire script. Make surgical changes ONLY to the specific parts mentioned in the feedback.

2. If the feedback points to issues in specific sections, ONLY modify those sections.

3. MAINTAIN ORIGINAL LENGTH - Your improved script should be approximately ${originalScriptLength} characters (within 10%). Scripts that are significantly shorter will be rejected.

4. PRESERVE all dialogue exchanges, conversational depth, and detail level from the original script. DO NOT summarize or condense content.

5. Ensure proper HOST and GUEST speaker formatting is preserved.

6. If addressing factual inaccuracies, ensure corrections are supported by the original document.

7. Return the COMPLETE script with your targeted improvements incorporated.`;
            
            // Add language instruction to system prompt
            const languageSystemPrompt = `${systemPrompt}\n\nGenerate the script in ${scriptLanguage} language.`;
            
            // Prepare request body with model-specific parameters
            const requestBody = {
                model: apiData.models.script,
                messages: [
                    { role: 'system', content: languageSystemPrompt },
                    { role: 'user', content: userPrompt }
                ]
            };
            
            // Handle model-specific parameters with lower temperature for more conservative editing
            if (isAnthropicStyle) {
                //requestBody.max_completion_tokens = 4000;
            } else {
                //requestBody.max_tokens = 4000;
                requestBody.temperature = 0.4; // Lower temperature for more conservative edits
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
                console.error('Script improvement failed:', response.status);
                return originalScriptText; // Return original script if improvement fails
            }
            
            const data = await response.json();
            let improvedScriptText = data.choices[0]?.message?.content?.trim();
            
            // Track token usage if available
            if (data.usage) {
                const modelName = apiData.models.script;
                const promptTokens = data.usage.prompt_tokens || 0;
                const completionTokens = data.usage.completion_tokens || 0;
                
                // Track usage via API manager
                this.apiManager.trackCompletionUsage(modelName, promptTokens, completionTokens);
            }
            
            if (improvedScriptText) {
                // Process the text to remove stage directions and ensure proper formatting
                improvedScriptText = this.processScriptText(improvedScriptText);
                return improvedScriptText;
            } else {
                return originalScriptText; // Return original script if improvement fails
            }
            
        } catch (error) {
            console.error('Error during script improvement:', error);
            return originalScriptText; // Return original script if improvement fails
        }
    }

}

export default ScriptGenerator;
