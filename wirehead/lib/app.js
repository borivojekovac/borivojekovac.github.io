const APP_CONFIG = {
    preloadRecentMonths: 12,
    initialAutoExpandCount: 0,
    unloadedHintText: 'Click to load',
    searchHighlightClass: 'search-highlight',
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'sr']
};

class WireheadBlog {
    constructor() {
        this.posts = [];
        this.expandedPosts = new Set();
        this.db = null;
        this.currentSearchQuery = '';
        this.currentArticleSlug = null;
        this.expandedStateKey = 'wireheadExpandedPosts';
        this.languageKey = 'wireheadLanguage';
        this.currentLanguage = APP_CONFIG.defaultLanguage;
        this.postContainer = null;
        this.isSearchActive = false;
        this.searchTerms = [];
        this.availableTranslations = {};
        this.init();
    }

    async init() {
        try {
            this.restoreLanguagePreference();
            await this.initDatabase();
            await this.loadPosts();
            await this.loadCachedContent();
            await this.preloadRecentPosts();
            this.renderPosts();
            this.setupPostHandlers();
            this.setupHeroObserver();
            this.setupRouting();
            this.setupLanguageSelector();
            await this.handleInitialRoute();
            this.setupSearchHandlers();
        } catch (error) {
            console.error('Failed to initialize:', error);
            this.showError('Failed to load blog posts: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    restoreLanguagePreference() {
        try {
            const stored = localStorage.getItem(this.languageKey);
            if (stored && APP_CONFIG.supportedLanguages.includes(stored)) {
                this.currentLanguage = stored;
            }
        } catch (error) {
            console.warn('Failed to restore language preference:', error);
        }
    }

    persistLanguagePreference() {
        try {
            localStorage.setItem(this.languageKey, this.currentLanguage);
        } catch (error) {
            console.warn('Failed to persist language preference:', error);
        }
    }

    setupLanguageSelector() {
        const selector = document.getElementById('language-selector');
        const toggle = document.getElementById('language-toggle');
        const dropdown = document.getElementById('language-dropdown');
        const currentLabel = document.getElementById('language-current');
        
        if (!selector || !toggle || !dropdown || !currentLabel) return;

        // Set initial state
        currentLabel.textContent = this.currentLanguage;
        this.updateLanguageOptionStyles();

        // Toggle dropdown
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            selector.classList.toggle('open');
            toggle.setAttribute('aria-expanded', selector.classList.contains('open'));
        });

        // Handle option selection
        dropdown.addEventListener('click', async (e) => {
            const option = e.target.closest('.language-option');
            if (!option) return;
            
            const newLanguage = option.dataset.lang;
            if (newLanguage === this.currentLanguage) {
                selector.classList.remove('open');
                return;
            }
            
            this.currentLanguage = newLanguage;
            currentLabel.textContent = newLanguage;
            this.persistLanguagePreference();
            this.updateLanguageOptionStyles();
            selector.classList.remove('open');
            
            await this.handleLanguageChange();
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!selector.contains(e.target)) {
                selector.classList.remove('open');
            }
        });
    }

    updateLanguageOptionStyles() {
        const options = document.querySelectorAll('.language-option');
        options.forEach(option => {
            if (option.dataset.lang === this.currentLanguage) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        });
    }

    async handleLanguageChange() {
        const slug = this.getRequestedSlug();
        
        if (slug) {
            // Re-navigate to same article with new language
            this.navigateToArticle(slug, true);
        } else {
            // Update URL to reflect language change
            let url = window.location.pathname;
            if (this.currentLanguage !== 'en') {
                url = `?lang=${this.currentLanguage}`;
            }
            window.history.replaceState({}, '', url);
            
            // Reload all expanded posts with new language
            await this.reloadExpandedPosts();
        }
    }

    async reloadExpandedPosts() {
        // Get currently expanded post indices
        const expandedIndices = Array.from(this.expandedPosts);
        
        // Force reload each expanded post with new language
        for (const index of expandedIndices) {
            await this.expandPost(index, { updateUrl: false, persist: false, force: true });
        }
    }

    async initDatabase() {
        // Delete old database to recover from stuck upgrade
        await new Promise((resolve) => {
            const deleteRequest = indexedDB.deleteDatabase('WireheadBlog');
            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onerror = () => resolve();
            deleteRequest.onblocked = () => resolve();
        });
        
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('WireheadBlog', 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('articles')) {
                    const store = db.createObjectStore('articles', { keyPath: 'id' });
                    store.createIndex('file', 'file', { unique: false });
                }
            };
        });
    }
    
    getArticleCacheId(filename, language) {
        return `${filename}|${language}`;
    }

    async loadPosts() {
        const response = await fetch('posts.json');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        
        // Store available translations
        this.availableTranslations = data.translations || {};
        
        // Convert filename array to post objects with extracted data
        this.posts = data.posts.map(filename => ({
            file: filename,
            title: this.extractTitleFromFilename(filename),
            date: this.extractDateFromFilename(filename),
            translations: {}
        }));
        
        // Sort posts by date (newest first)
        this.posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    async loadCachedContent() {
        if (!this.db) return;
        
        const transaction = this.db.transaction(['articles'], 'readonly');
        const store = transaction.objectStore('articles');
        
        for (const post of this.posts) {
            try {
                // Load content for current language
                const cacheId = this.getArticleCacheId(post.file, this.currentLanguage);
                const cached = await new Promise((resolve, reject) => {
                    const request = store.get(cacheId);
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });
                
                if (cached) {
                    if (this.currentLanguage === 'en') {
                        post.content = cached.content;
                        if (cached.title && cached.title !== post.title) {
                            post.title = cached.title;
                        }
                    } else {
                        post.translations[this.currentLanguage] = {
                            content: cached.content,
                            title: cached.title
                        };
                    }
                }
                
                // Also try to load English version if not current language
                if (this.currentLanguage !== 'en') {
                    const enCacheId = this.getArticleCacheId(post.file, 'en');
                    const cachedEn = await new Promise((resolve, reject) => {
                        const request = store.get(enCacheId);
                        request.onsuccess = () => resolve(request.result);
                        request.onerror = () => reject(request.error);
                    });
                    
                    if (cachedEn) {
                        post.content = cachedEn.content;
                        if (cachedEn.title && cachedEn.title !== post.title) {
                            post.title = cachedEn.title;
                        }
                    }
                }
            } catch (error) {
                console.warn(`Failed to load cached content for ${post.file}:`, error);
            }
        }
    }

    async preloadRecentPosts() {
        if (!this.posts.length || APP_CONFIG.preloadRecentMonths <= 0) return;

        const cutoff = new Date();
        cutoff.setMonth(cutoff.getMonth() - APP_CONFIG.preloadRecentMonths);

        for (const post of this.posts) {
            if (!post.date) continue;
            const postDate = new Date(post.date);
            if (Number.isNaN(postDate.getTime()) || postDate < cutoff) continue;

            // Load content in current language
            if (this.currentLanguage !== 'en') {
                const hasTranslation = post.translations[this.currentLanguage];
                if (!hasTranslation && this.isTranslationAvailable(post.file, this.currentLanguage)) {
                    try {
                        const translationPath = `posts/${this.currentLanguage}/${post.file}`;
                        const response = await fetch(translationPath);
                        if (response.ok) {
                            const content = await response.text();
                            const { title } = this.extractTitleFromMarkdown(content);
                            post.translations[this.currentLanguage] = {
                                content: content,
                                title: title || post.title
                            };
                            await this.cacheArticle(post, this.currentLanguage);
                        }
                    } catch (error) {
                        console.warn(`Failed to preload translation ${post.file} (${this.currentLanguage}):`, error);
                    }
                }
            }

            // Load English version if not already loaded
            if (!post.content) {
                try {
                    const response = await fetch(`posts/${post.file}`);
                    if (!response.ok) {
                        throw new Error(`Failed to load ${post.file}`);
                    }
                    post.content = await response.text();
                    const { title } = this.extractTitleFromMarkdown(post.content);
                    if (title) {
                        post.title = title;
                    }
                    await this.cacheArticle(post, 'en');
                } catch (error) {
                    console.warn(`Failed to preload ${post.file}:`, error);
                }
            }
        }
    }

    isTranslationAvailable(filename, language) {
        if (language === 'en') return true;
        const translations = this.availableTranslations[language];
        return translations && translations.includes(filename);
    }

    getDisplayTitle(post) {
        if (this.currentLanguage !== 'en') {
            const translation = post.translations[this.currentLanguage];
            if (translation && translation.title) {
                return translation.title;
            }
        }
        return post.title;
    }

    setupRouting() {
        // Handle browser back/forward buttons
        window.addEventListener('popstate', (e) => {
            this.handleRouteChange();
        });
    }

    getRequestedSlug() {
        const urlParams = new URLSearchParams(window.location.search);
        const postParam = urlParams.get('post');
        if (!postParam) return null;
        return postParam.replace(/\.md$/i, '');
    }

    getRequestedLanguage() {
        const urlParams = new URLSearchParams(window.location.search);
        const langParam = urlParams.get('lang');
        if (langParam && APP_CONFIG.supportedLanguages.includes(langParam)) {
            return langParam;
        }
        return null;
    }

    async handleInitialRoute() {
        const slug = this.getRequestedSlug();
        const urlLang = this.getRequestedLanguage();
        
        // If URL has language parameter, update current language
        if (urlLang && urlLang !== this.currentLanguage) {
            this.currentLanguage = urlLang;
            this.persistLanguagePreference();
            const currentLabel = document.getElementById('language-current');
            if (currentLabel) {
                currentLabel.textContent = this.currentLanguage;
            }
            this.updateLanguageOptionStyles();
        }
        
        if (slug) {
            this.navigateToArticle(slug, false);
        } else {
            const restoredCount = await this.restoreExpandedState();
            if (!restoredCount) {
                // Default behavior - expand initial posts
                this.autoExpandFirstTwo();
            }
        }
    }

    handleRouteChange() {
        const slug = this.getRequestedSlug();
        if (slug) {
            this.navigateToArticle(slug, false);
        } else {
            this.currentArticleSlug = null;
            this.updatePageMeta();
        }
    }

    getArticleSlug(filename) {
        return filename.replace('.md', '');
    }

    navigateToArticle(slug, updateHistory = true) {
        const postIndex = this.posts.findIndex(post => this.getArticleSlug(post.file) === slug);
        
        if (postIndex !== -1) {
            // Collapse all other posts
            this.expandedPosts.forEach((index) => {
                if (index !== postIndex) {
                    this.collapsePost(index, { updateUrl: false, persist: false });
                }
            });
            
            // Expand the target post
            this.expandPost(postIndex, { updateUrl: false, persist: true, force: true });
            this.updateRouteForPost(this.posts[postIndex], updateHistory);
        }
    }

    updateRouteForPost(post, updateHistory = true) {
        const slug = this.getArticleSlug(post.file);
        this.currentArticleSlug = slug;
        if (updateHistory) {
            let url = `?post=${slug}`;
            if (this.currentLanguage !== 'en') {
                url += `&lang=${this.currentLanguage}`;
            }
            window.history.pushState({ slug, lang: this.currentLanguage }, '', url);
        }
        this.updatePageMeta(post);
        this.scrollToPost(slug);
    }

    scrollToPost(slug) {
        setTimeout(() => {
            const postElement = document.querySelector(`#post-${slug}`);
            if (postElement) {
                postElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    }

    updatePageMeta(post = null) {
        if (post) {
            document.title = `${post.title} - Wirehead`;
            
            // Update meta description
            let description = 'Cutting through the AI static';
            if (post.content) {
                // Extract first paragraph as description
                const firstParagraph = post.content.split('\n\n')[1] || post.content.split('\n')[2];
                if (firstParagraph && firstParagraph.length > 10) {
                    description = firstParagraph.replace(/[#*`]/g, '').substring(0, 160) + '...';
                }
            }
            
            this.updateMetaTag('description', description);
            this.updateMetaTag('og:title', `${post.title} - Wirehead`);
            this.updateMetaTag('og:description', description);
            const slug = this.getArticleSlug(post.file);
            this.updateMetaTag('og:url', `${window.location.origin}/?post=${slug}`);
            this.updateMetaTag('og:type', 'article');
            
                // Update canonical URL
                this.updateCanonicalUrl(`${window.location.origin}/?post=${slug}`);
        } else {
            document.title = 'Wirehead - Cutting through the AI static';
            this.updateMetaTag('description', 'Cutting through the AI static');
            this.updateMetaTag('og:title', 'Wirehead - Cutting through the AI static');
            this.updateMetaTag('og:description', 'Cutting through the AI static');
            this.updateMetaTag('og:url', window.location.origin);
            this.updateMetaTag('og:type', 'website');
                
                // Update canonical URL
                this.updateCanonicalUrl(window.location.origin);
        }
    }

    updateCanonicalUrl(url) {
        let canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) {
            canonical = document.createElement('link');
            canonical.setAttribute('rel', 'canonical');
            document.head.appendChild(canonical);
        }
        canonical.setAttribute('href', url);
    }

    updateMetaTag(name, content) {
        let meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
        if (!meta) {
            meta = document.createElement('meta');
            if (name.startsWith('og:')) {
                meta.setAttribute('property', name);
            } else {
                meta.setAttribute('name', name);
            }
            document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
    }

            setupSearchHandlers() {
                const searchButton = document.getElementById('search-button');
                const searchInput = document.getElementById('search-input');
                const searchDialog = document.getElementById('search-dialog');
                const searchCancel = document.getElementById('search-cancel');
                const searchProceed = document.getElementById('search-proceed');
        
        searchButton.addEventListener('click', () => this.showSearchDialog());
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.showSearchDialog();
            }
        });
        
        searchCancel.addEventListener('click', () => this.hideSearchDialog());
        searchProceed.addEventListener('click', () => this.executeSearch());
        
        // Close dialog when clicking outside
        searchDialog.addEventListener('click', (e) => {
            if (e.target === searchDialog) {
                this.hideSearchDialog();
                    }
                });
            }

            setupHeroObserver() {
                const hero = document.getElementById('hero');
                const appBar = document.getElementById('app-bar');
                if (!hero || !appBar || !('IntersectionObserver' in window)) {
                    if (appBar) {
                        appBar.classList.add('is-visible');
                    }
                    return;
                }

                const observer = new IntersectionObserver(
                    ([entry]) => {
                        appBar.classList.toggle('is-visible', entry.intersectionRatio <= 0.25);
                    },
                    { threshold: [0, 0.25, 1] }
                );

                observer.observe(hero);
            }

            setupPostHandlers() {
                this.postContainer = document.getElementById('posts-container');
                if (!this.postContainer) return;
        this.postContainer.addEventListener('click', (event) => {
            const clearButton = event.target.closest('.search-clear-button, .search-results-button');
            if (clearButton && this.postContainer.contains(clearButton)) {
                this.clearSearch();
                return;
            }
            const header = event.target.closest('.post-header');
            if (!header || !this.postContainer.contains(header)) return;
            const index = Number(header.dataset.index);
            if (Number.isInteger(index)) {
                this.togglePost(index);
            }
        });
    }

    renderPosts() {
        const container = document.getElementById('posts-container');
        container.innerHTML = '';

        this.posts.forEach((post, index) => {
            const postElement = this.createPostElement(post, index);
            container.appendChild(postElement);
        });

        this.applyExpandedStateToDom();
    }

    createPostElement(post, index) {
        const slug = this.getArticleSlug(post.file);
        const postDiv = document.createElement('div');
        postDiv.className = 'post-card';
        postDiv.id = `post-${slug}`;
        postDiv.dataset.index = index;
        const displayTitle = this.getDisplayTitle(post);
        const loadHint = post.content ? '' : `<span class="post-load-hint">${APP_CONFIG.unloadedHintText}</span>`;
        postDiv.innerHTML = `
            <div class="post-header" data-index="${index}">
                <div class="post-info">
                    <div class="post-title-row">
                        <h1 class="post-title"><span class="post-title-text" id="title-text-${index}">${this.escapeHtml(displayTitle)}</span> <span class="material-icons expand-icon" id="icon-${index}">expand_more</span></h1>
                    </div>
                    <div class="post-meta">${loadHint}${loadHint ? ' ' : ''}${this.formatDate(post.date)}</div>
                </div>
            </div>
            <div class="post-content" id="content-${index}">
                <div class="markdown-content" id="markdown-${index}"></div>
            </div>
        `;
        return postDiv;
    }

    async togglePost(index, updateUrl = true) {
        if (this.expandedPosts.has(index)) {
            // Collapse
            this.collapsePost(index, { updateUrl, persist: true });
        } else {
            // Expand
            await this.expandPost(index, { updateUrl, persist: true, force: false });
        }
    }

    autoExpandFirstTwo() {
        const initialCount = Math.min(APP_CONFIG.initialAutoExpandCount, this.posts.length);
        for (let i = 0; i < initialCount; i++) {
            setTimeout(() => this.expandPost(i, { updateUrl: false, persist: true, force: false }), i * 100);
        }
    }

    async expandPost(index, { updateUrl = true, persist = true, force = false } = {}) {
        if (this.expandedPosts.has(index) && !force) return;

        const post = this.posts[index];
        const contentElement = document.getElementById(`content-${index}`);
        const iconElement = document.getElementById(`icon-${index}`);
        const markdownElement = document.getElementById(`markdown-${index}`);

        if (!post || !contentElement || !iconElement || !markdownElement) return;

        try {
            if (!markdownElement.innerHTML.trim()) {
                markdownElement.innerHTML = '<div class="loading"><div class="spinner"></div>Loading content...</div>';
            }

            contentElement.classList.add('expanded');
            iconElement.classList.add('expanded');
            this.expandedPosts.add(index);

            let contentToDisplay = null;
            let titleToDisplay = null;
            let languageUsed = this.currentLanguage;

            // Try to load translation if not English
            if (this.currentLanguage !== 'en') {
                const translation = post.translations[this.currentLanguage];
                
                if (translation && translation.content) {
                    contentToDisplay = translation.content;
                    titleToDisplay = translation.title;
                } else if (this.isTranslationAvailable(post.file, this.currentLanguage)) {
                    // Try to fetch translation
                    try {
                        const translationPath = `posts/${this.currentLanguage}/${post.file}`;
                        const response = await fetch(translationPath);
                        if (response.ok) {
                            const content = await response.text();
                            const { title } = this.extractTitleFromMarkdown(content);
                            post.translations[this.currentLanguage] = {
                                content: content,
                                title: title || post.title
                            };
                            contentToDisplay = content;
                            titleToDisplay = title;
                            await this.cacheArticle(post, this.currentLanguage);
                        }
                    } catch (error) {
                        console.warn(`Failed to load translation for ${post.file} (${this.currentLanguage}):`, error);
                    }
                }
            }

            // Fallback to English if translation not available
            if (!contentToDisplay) {
                languageUsed = 'en';
                if (!post.content) {
                    const response = await fetch(`posts/${post.file}`);
                    if (!response.ok) {
                        throw new Error(`Failed to load ${post.file}`);
                    }
                    post.content = await response.text();
                    await this.cacheArticle(post, 'en');
                }
                contentToDisplay = post.content;
            }

            // Extract title from first heading and remove it from content
            const { title, content } = this.extractTitleFromMarkdown(contentToDisplay);

            // Update post title if we found one in the markdown
            if (title) {
                titleToDisplay = title;
                if (languageUsed === 'en') {
                    post.title = title;
                }
                // Update the title text in the UI
                const titleTextElement = document.getElementById(`title-text-${index}`);
                if (titleTextElement) {
                    titleTextElement.textContent = titleToDisplay || post.title;
                }
            }

            // Render markdown to HTML (with first heading removed)
            const htmlContent = marked.parse(content);
            markdownElement.innerHTML = htmlContent;

            // Make all links open in new windows
            const links = markdownElement.querySelectorAll('a');
            links.forEach(link => {
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');
            });

            if (this.isSearchActive && this.searchTerms.length) {
                this.highlightSearchTerms(markdownElement, this.searchTerms);
            }

            // Update URL and metadata if this is a user-initiated action
            if (updateUrl) {
                this.updateRouteForPost(post, true);
            }

            if (persist) {
                this.persistExpandedState();
            }

            const loadHint = document.querySelector(`#post-${this.getArticleSlug(post.file)} .post-load-hint`);
            if (loadHint) {
                loadHint.remove();
            }
        } catch (error) {
            markdownElement.innerHTML = `<div class="error">Error loading post: ${error.message}</div>`;
            const errorElement = markdownElement.querySelector('.error');
            if (errorElement) {
                errorElement.addEventListener('animationend', () => {
                    errorElement.remove();
                });
            }
        }
    }

    collapsePost(index, { updateUrl = true, persist = true } = {}) {
        const post = this.posts[index];
        const contentElement = document.getElementById(`content-${index}`);
        const iconElement = document.getElementById(`icon-${index}`);
        if (!post || !contentElement || !iconElement) return;

        contentElement.classList.remove('expanded');
        iconElement.classList.remove('expanded');
        this.expandedPosts.delete(index);

        // Update URL to home if this was the current article
        if (updateUrl && this.currentArticleSlug === this.getArticleSlug(post.file)) {
            this.currentArticleSlug = null;
            window.history.pushState({}, '', window.location.pathname);
            this.updatePageMeta();
        }

        if (persist) {
            this.persistExpandedState();
        }
    }

    persistExpandedState() {
        try {
            const slugs = [...this.expandedPosts]
                .map((index) => this.getArticleSlug(this.posts[index]?.file))
                .filter(Boolean);
            localStorage.setItem(this.expandedStateKey, JSON.stringify(slugs));
        } catch (error) {
            console.warn('Failed to persist expanded state:', error);
        }
    }

    async restoreExpandedState() {
        try {
            const stored = localStorage.getItem(this.expandedStateKey);
            if (!stored) return 0;
            const slugs = JSON.parse(stored);
            if (!Array.isArray(slugs) || !slugs.length) return 0;

            const slugToIndex = new Map();
            this.posts.forEach((post, index) => {
                slugToIndex.set(this.getArticleSlug(post.file), index);
            });

            let restored = 0;
            for (const slug of slugs) {
                const index = slugToIndex.get(slug);
                if (typeof index === 'number') {
                    await this.expandPost(index, { updateUrl: false, persist: false, force: true });
                    restored += 1;
                }
            }

            return restored;
        } catch (error) {
            console.warn('Failed to restore expanded state:', error);
            return 0;
        }
    }

    applyExpandedStateToDom() {
        this.expandedPosts.forEach((index) => {
            this.expandPost(index, { updateUrl: false, persist: false, force: true });
        });
    }

    getSearchableText(post) {
        if (!post.content) return '';
        if (post.searchText && post.searchTextSource === post.content) {
            return post.searchText;
        }
        const { content } = this.extractTitleFromMarkdown(post.content);
        const htmlContent = marked.parse(content);
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const textContent = (doc.body.textContent || '').toLowerCase();
        post.searchText = textContent;
        post.searchTextSource = post.content;
        return textContent;
    }

    highlightSearchTerms(container, terms) {
        if (!container || !terms.length) return;
        this.clearHighlights(container);
        const escapedTerms = terms.map((term) => this.escapeRegExp(term)).filter(Boolean);
        if (!escapedTerms.length) return;

        const wordMatchRegex = new RegExp(`\\b\\w*(?:${escapedTerms.join('|')})\\w*\\b`, 'gi');
        const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
        const nodes = [];

        while (walker.nextNode()) {
            const node = walker.currentNode;
            if (!node.nodeValue || !wordMatchRegex.test(node.nodeValue)) continue;
            if (node.parentNode && node.parentNode.closest(`.${APP_CONFIG.searchHighlightClass}`)) {
                continue;
            }
            wordMatchRegex.lastIndex = 0;
            nodes.push(node);
        }

        nodes.forEach((node) => {
            const text = node.nodeValue;
            const fragment = document.createDocumentFragment();
            let lastIndex = 0;
            let match;
            
            wordMatchRegex.lastIndex = 0;
            while ((match = wordMatchRegex.exec(text)) !== null) {
                if (match.index > lastIndex) {
                    fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
                }
                
                const span = document.createElement('span');
                span.className = APP_CONFIG.searchHighlightClass;
                span.textContent = match[0];
                fragment.appendChild(span);
                
                lastIndex = match.index + match[0].length;
            }
            
            if (lastIndex < text.length) {
                fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
            }
            
            node.parentNode.replaceChild(fragment, node);
        });
    }

    clearHighlights(container) {
        const highlights = container.querySelectorAll(`.${APP_CONFIG.searchHighlightClass}`);
        highlights.forEach((node) => {
            const text = document.createTextNode(node.textContent);
            node.parentNode.replaceChild(text, node);
        });
    }

    escapeRegExp(value) {
        return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    async cacheArticle(post, language = 'en') {
        if (!this.db) return;
        
        try {
            const transaction = this.db.transaction(['articles'], 'readwrite');
            const store = transaction.objectStore('articles');
            
            let content, title;
            if (language === 'en') {
                if (!post.content) return;
                content = post.content;
                title = post.title;
            } else {
                const translation = post.translations[language];
                if (!translation || !translation.content) return;
                content = translation.content;
                title = translation.title || post.title;
            }
            
            const articleData = {
                id: this.getArticleCacheId(post.file, language),
                file: post.file,
                language: language,
                title: title,
                content: content,
                date: post.date,
                cachedAt: new Date().toISOString()
            };
            
            await new Promise((resolve, reject) => {
                const request = store.put(articleData);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.warn(`Failed to cache article ${post.file} (${language}):`, error);
        }
    }

    showSearchDialog() {
        const query = document.getElementById('search-input').value.trim();
        if (!query) {
            document.getElementById('search-input').focus();
            return;
        }
        
        this.currentSearchQuery = query;
        
        // Update dialog counts
        const loadedCount = this.posts.filter(p => p.content).length;
        const totalCount = this.posts.length;

        if (loadedCount === totalCount) {
            this.performSearch(query, 'loaded');
            return;
        }

        document.getElementById('loaded-count').textContent = 
            `Search through ${loadedCount} articles you've already viewed (faster)`;
        document.getElementById('all-count').textContent = 
            `Load and search through all ${totalCount} articles (${totalCount - loadedCount} will be loaded)`;
        
        document.getElementById('search-dialog').classList.add('show');
    }

    hideSearchDialog() {
        document.getElementById('search-dialog').classList.remove('show');
    }

    async executeSearch() {
        const scope = document.querySelector('input[name="search-scope"]:checked').value;
        this.hideSearchDialog();
        
        if (scope === 'all') {
            await this.loadAllArticles();
        }
        
        this.performSearch(this.currentSearchQuery, scope);
    }

    async loadAllArticles() {
        const unloadedPosts = this.posts.filter(p => !p.content);
        
        if (unloadedPosts.length === 0) return;
        
        // Show loading indicator
        const container = document.getElementById('posts-container');
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading';
        loadingDiv.innerHTML = `
            <div class="spinner"></div>
            Loading ${unloadedPosts.length} articles for search...
        `;
        container.insertBefore(loadingDiv, container.firstChild);
        
        try {
            for (const post of unloadedPosts) {
                const response = await fetch(`posts/${post.file}`);
                if (response.ok) {
                    post.content = await response.text();
                    
                    // Extract title and cache
                    const { title } = this.extractTitleFromMarkdown(post.content);
                    if (title) {
                        post.title = title;
                    }
                    
                    await this.cacheArticle(post);
                }
            }
            
            // Update UI with new titles
            this.renderPosts();
        } finally {
            loadingDiv.remove();
        }
    }

    performSearch(query, scope) {
        const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
        this.isSearchActive = true;
        this.searchTerms = searchTerms;
        
        const results = [];
        
        for (let index = 0; index < this.posts.length; index++) {
            const post = this.posts[index];
            if (scope === 'loaded' && !post.content) {
                continue;
            }
            const titleMatch = searchTerms.some(term => 
                post.title.toLowerCase().includes(term)
            );
            
            let contentMatch = false;
            if (post.content) {
                const searchableText = this.getSearchableText(post);
                contentMatch = searchTerms.some(term => 
                    searchableText.includes(term)
                );
            }
            
            if (titleMatch || contentMatch) {
                results.push({
                    post,
                    index,
                    titleMatch,
                    contentMatch
                });
            }
        }
        
        this.displaySearchResults(results, query);
    }

    displaySearchResults(results, query) {
        const container = document.getElementById('posts-container');
        
        if (results.length === 0) {
            container.innerHTML = `
                <div class="search-results-empty">
                    <h3>No results found</h3>
                    <p>No articles match your search for "${this.escapeHtml(query)}"</p>
                    <button class="search-results-button">Show all articles</button>
                </div>
            `;
            return;
        }
        
        // Show search results header
        const header = document.createElement('div');
        header.className = 'search-results-header';
        header.innerHTML = `
            <h3 class="search-results-title">Search Results</h3>
            <p class="search-results-subtitle">Found ${results.length} article${results.length !== 1 ? 's' : ''} matching "${this.escapeHtml(query)}"</p>
            <button class="search-clear-button">Clear search</button>
        `;
        
        container.innerHTML = '';
        container.appendChild(header);
        
        // Show filtered posts without mutating the master list
        results.forEach((result, index) => {
            const postElement = this.createPostElement(result.post, result.index);
            container.appendChild(postElement);
        });

        this.applyExpandedStateToDom();
    }

    clearSearch() {
        // Restore full list without touching expanded state
        this.isSearchActive = false;
        this.searchTerms = [];
        this.renderPosts();
        
        // Clear search input
        document.getElementById('search-input').value = '';
    }

    extractTitleFromFilename(filename) {
        // Extract title from filename after date: YYYY-MM-DD-title.md or YYYY-MM-title.md
        const titleMatch = filename.match(/^\d{4}-\d{2}(?:-\d{2})?-(.+)\.md$/);
        
        if (!titleMatch) {
            // Fallback to filename without extension
            return filename.replace(/\.md$/, '');
        }
        
        // Convert dashes to spaces and title case each word
        return titleMatch[1]
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    extractTitleFromMarkdown(markdownContent) {
        // Find the first heading (# Title)
        const lines = markdownContent.split('\n');
        let title = null;
        let contentLines = [...lines];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('# ')) {
                title = line.substring(2).trim();
                // Remove this line from content
                contentLines.splice(i, 1);
                break;
            }
            // Stop looking if we hit non-empty content that's not a heading
            if (line && !line.startsWith('#')) {
                break;
            }
        }
        
        return {
            title: title,
            content: contentLines.join('\n')
        };
    }

    extractDateFromFilename(filename) {
        // Extract date from filename format: YYYY-MM-DD or YYYY-MM
        const dateMatch = filename.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
        
        if (!dateMatch) {
            // Fallback to current date if no match
            return new Date().toISOString().split('T')[0];
        }
        
        const year = parseInt(dateMatch[1]);
        const month = parseInt(dateMatch[2]);
        let day = dateMatch[3] ? parseInt(dateMatch[3]) : null;
        
        // If no day specified, use the last day of the month
        if (!day) {
            // Create date with first day of next month, then subtract 1 day
            const lastDayOfMonth = new Date(year, month, 0).getDate();
            day = lastDayOfMonth;
        }
        
        // Create date string in YYYY-MM-DD format
        const dateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        return dateString;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const locale = this.currentLanguage === 'sr' ? 'sr-RS' : 'en-US';
        return date.toLocaleDateString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showError(message) {
        const errorContainer = document.getElementById('error-container');
        errorContainer.innerHTML = `<div class="error">${this.escapeHtml(message)}</div>`;
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        loading.style.display = 'none';
    }
}

// Initialize the blog
const blog = new WireheadBlog();

// Register service worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// PWA Install Prompt
let deferredPrompt = null;
const installBanner = document.getElementById('install-banner');
const installDismissBtn = document.getElementById('install-dismiss');
const installAcceptBtn = document.getElementById('install-accept');
const INSTALL_DISMISSED_KEY = 'wireheadInstallDismissed';

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    const dismissed = localStorage.getItem(INSTALL_DISMISSED_KEY);
    if (dismissed) {
        const dismissedTime = parseInt(dismissed, 10);
        const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
        if (daysSinceDismissed < 7) {
            return;
        }
    }
    
    setTimeout(() => {
        installBanner.classList.add('show');
    }, 3000);
});

installDismissBtn?.addEventListener('click', () => {
    installBanner.classList.remove('show');
    localStorage.setItem(INSTALL_DISMISSED_KEY, Date.now().toString());
    deferredPrompt = null;
});

installAcceptBtn?.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    
    installBanner.classList.remove('show');
    deferredPrompt.prompt();
    
    const { outcome } = await deferredPrompt.userChoice;
    console.log('Install prompt outcome:', outcome);
    deferredPrompt = null;
});

window.addEventListener('appinstalled', () => {
    installBanner.classList.remove('show');
    deferredPrompt = null;
    localStorage.removeItem(INSTALL_DISMISSED_KEY);
    console.log('PWA installed');
});
