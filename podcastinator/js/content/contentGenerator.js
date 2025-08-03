// Podcastor App - Content Generator
import NotificationsManager from '../ui/notifications.js';
import ProgressManager from '../ui/progressManager.js';

class ContentGenerator {
    constructor(storageManager, contentStateManager, apiManager) {
        this.storageManager = storageManager;
        this.contentStateManager = contentStateManager;
        this.apiManager = apiManager;
        this.notifications = new NotificationsManager();
        this.progressManager = new ProgressManager();
        
        // Load content data from storage
        const savedData = this.storageManager.load('data', {});
        this.data = {
            outline: savedData.outline || '',
            script: savedData.script || '',
            audioUrl: savedData.audioUrl || '',
            document: savedData.document || null,
            host: savedData.host || {},
            guest: savedData.guest || {}
        };
    }

    /**
     * Initialize content generator
     */
    init() {
    
        this.setupEventListeners();
        this.populateContentData();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
    
        const self = this;
        
        // Outline generation
        const generateOutlineButton = document.getElementById('generate-outline');
        if (generateOutlineButton) {
            generateOutlineButton.addEventListener('click', function() {
                self.generateOutline();
            });
        }

        // Script generation
        const generateScriptButton = document.getElementById('generate-script');
        if (generateScriptButton) {
            generateScriptButton.addEventListener('click', function() {
                self.generateScript();
            });
        }

        // Audio generation
        const generateAudioButton = document.getElementById('generate-audio');
        if (generateAudioButton) {
            generateAudioButton.addEventListener('click', function() {
                self.generateAudio();
            });
        }

        // Audio download
        const downloadAudioButton = document.getElementById('download-audio');
        if (downloadAudioButton) {
            downloadAudioButton.addEventListener('click', function() {
                self.downloadAudio();
            });
        }
    }

    /**
     * Populate content data in form elements
     */
    populateContentData() {
    
        // Outline content
        if (this.data.outline) {
            document.getElementById('outline-text').value = this.data.outline;
            document.getElementById('generate-script').disabled = false;
            this.contentStateManager.updateState('hasOutline', true);
        }

        // Script content
        if (this.data.script) {
            document.getElementById('script-text').value = this.data.script;
            document.getElementById('generate-audio').disabled = false;
            this.contentStateManager.updateState('hasScript', true);
        }

        // Audio content
        if (this.data.audioUrl) {
            document.getElementById('audio-source').src = this.data.audioUrl;
            document.getElementById('audio-result').style.display = 'block';
            this.contentStateManager.updateState('hasAudio', true);
        }
        
        // Update sections based on our current state
        this.contentStateManager.updateSections();
    }

    /**
     * Generate podcast outline
     */
    async generateOutline() {
    
        this.progressManager.showProgress('outline-progress');
        
        // In a real implementation, this would call the OpenAI API
        // For now, it's a placeholder that simulates API call
        const self = this;
        setTimeout(function() {
            const outline = `PODCAST OUTLINE - "${self.data.document?.name || 'Document'}"\n\n1. Introduction\n   - Host welcomes listeners\n   - Guest introduction\n\n2. Main Topic Discussion\n   - Key points from the document\n   - Expert insights from guest\n\n3. Deep Dive Sections\n   - Detailed analysis\n   - Real-world applications\n\n4. Conclusion\n   - Key takeaways\n   - Call to action`;
            
            document.getElementById('outline-text').value = outline;
            self.data.outline = outline;
            self.saveToStorage();
            
            // Update content state to indicate we have an outline
            self.contentStateManager.updateState('hasOutline', true);
            
            self.progressManager.hideProgress('outline-progress');
            self.notifications.showSuccess('Outline generated successfully!');
            document.getElementById('generate-script').disabled = false;
        }, 2000);
    }

    /**
     * Generate podcast script - now handled by ScriptGenerator
     * This is kept as a reference for the ContentGenerator interface
     */
    async generateScript() {
    
        this.notifications.showInfo('Script generation is now handled by the dedicated ScriptGenerator.');
    }

    /**
     * Generate podcast audio
     */
    async generateAudio() {
    
        this.progressManager.showProgress('audio-progress');
        
        // In a real implementation, this would call the OpenAI TTS API
        // For now, it's a placeholder that simulates API call
        const self = this;
        setTimeout(function() {
            // In real implementation, would generate actual audio
            const audioUrl = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmseAj+W4PTFeCMFKHzJ8tmOOggTZ7rs6KROBAd5l+O90h4QHnq77OygUhUIQ6Hj6qF'; // Placeholder
            
            document.getElementById('audio-source').src = audioUrl;
            document.getElementById('audio-result').style.display = 'block';
            self.data.audioUrl = audioUrl;
            self.saveToStorage();
            
            // Update content state to indicate we have audio
            self.contentStateManager.updateState('hasAudio', true);
            
            self.progressManager.hideProgress('audio-progress');
            self.notifications.showSuccess('Audio generated successfully!');
        }, 4000);
    }

    /**
     * Download generated audio
     */
    downloadAudio() {
    
        // Placeholder download functionality
        this.notifications.showSuccess('Download functionality will be implemented with real audio generation');
    }

    /**
     * Save data to storage
     */
    saveToStorage() {
    
        const existingData = this.storageManager.load('data', {});
        const updatedData = {
            ...existingData,
            outline: this.data.outline,
            script: this.data.script,
            audioUrl: this.data.audioUrl
        };
        this.storageManager.save('data', updatedData);
    }

    /**
     * Get content data
     * @returns {Object} - Content data including outline, script and audio URL
     */
    getContentData() {
    
        return {
            outline: this.data.outline,
            script: this.data.script,
            audioUrl: this.data.audioUrl
        };
    }
}

export default ContentGenerator;
