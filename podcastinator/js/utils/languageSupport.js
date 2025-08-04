// Podcastinator App - Language Support Utility

/**
 * Provides language support information for TTS models
 */
class LanguageSupport {
    constructor() {
        // Map of TTS models to their supported languages
        this.modelLanguageMap = {
            'tts-1': [
                'english', 'spanish', 'french', 'german', 'italian', 'portuguese', 'dutch',
                'japanese', 'chinese', 'arabic', 'hindi', 'korean', 'russian', 'polish',
                'turkish', 'swedish', 'danish', 'norwegian', 'finnish', 'czech', 'romanian'
            ],
            'tts-1-hd': [
                'english', 'spanish', 'french', 'german', 'italian', 'portuguese', 'dutch',
                'japanese', 'chinese', 'arabic', 'hindi', 'korean', 'russian', 'polish',
                'turkish', 'swedish', 'danish', 'norwegian', 'finnish', 'czech', 'romanian'
            ]
        };
        
        // Language display names (for UI)
        this.languageDisplayNames = {
            'english': 'English',
            'spanish': 'Spanish (Español)',
            'french': 'French (Français)',
            'german': 'German (Deutsch)',
            'italian': 'Italian (Italiano)',
            'portuguese': 'Portuguese (Português)',
            'dutch': 'Dutch (Nederlands)',
            'japanese': 'Japanese (日本語)',
            'chinese': 'Chinese (中文)',
            'arabic': 'Arabic (العربية)',
            'hindi': 'Hindi (हिन्दी)',
            'korean': 'Korean (한국어)',
            'russian': 'Russian (Русский)',
            'polish': 'Polish (Polski)',
            'turkish': 'Turkish (Türkçe)',
            'swedish': 'Swedish (Svenska)',
            'danish': 'Danish (Dansk)',
            'norwegian': 'Norwegian (Norsk)',
            'finnish': 'Finnish (Suomi)',
            'czech': 'Czech (Čeština)',
            'romanian': 'Romanian (Română)'
        };
    }
    
    /**
     * Get supported languages for a specific TTS model
     * @param {string} model - TTS model name
     * @returns {Array} - Array of supported language codes
     */
    getSupportedLanguages(model) {
        return this.modelLanguageMap[model] || ['english'];
    }
    
    /**
     * Get display name for a language code
     * @param {string} languageCode - Language code
     * @returns {string} - Display name for the language
     */
    getLanguageDisplayName(languageCode) {
        return this.languageDisplayNames[languageCode] || languageCode;
    }
    
    /**
     * Get all supported languages as options for a select element
     * @param {string} model - TTS model name
     * @returns {Array} - Array of objects with value and text properties
     */
    getLanguageOptions(model) {
        const languages = this.getSupportedLanguages(model);
        
        return languages.map(lang => ({
            value: lang,
            text: this.getLanguageDisplayName(lang)
        }));
    }
}

export default LanguageSupport;
