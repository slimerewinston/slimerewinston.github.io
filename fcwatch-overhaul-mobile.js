// FCWatch Overhaul v6 - Ultimate iOS Bookmarklet Port
// Compiled: 2026-03-10T20:51:23.998Z


// === IOS_SHIM.JS ===
// === FCWatch Overhaul — iOS API Shim ===
// Provides polyfills for Chrome Extension APIs so scripts can run natively as a bookmarklet.

(function initIOSShim() {
    'use strict';

    if (typeof window.chrome !== 'undefined' && window.chrome.runtime && window.chrome.runtime.id) {
        // We are actually in a Chrome Extension environment, don't shim
        return;
    }

    console.log('[FCW iOS Shim] Initializing Chrome API Polyfills for Bookmarklet');

    window.chrome = window.chrome || {};
    window.chrome.runtime = window.chrome.runtime || {};
    window.chrome.storage = window.chrome.storage || {};
    window.chrome.storage.local = window.chrome.storage.local || {};

    // 1. Storage Polyfill (using localStorage)
    const STORAGE_PREFIX = 'fcw_ext_';

    window.chrome.storage.local.get = function (keys, callback) {
        return new Promise((resolve) => {
            let result = {};
            if (typeof keys === 'string') keys = [keys];
            if (Array.isArray(keys)) {
                keys.forEach(k => {
                    const val = localStorage.getItem(STORAGE_PREFIX + k);
                    if (val !== null) {
                        try {
                            result[k] = JSON.parse(val);
                        } catch (e) {
                            result[k] = val;
                        }
                    }
                });
            } else if (typeof keys === 'object' && keys !== null) {
                // Default values
                Object.keys(keys).forEach(k => {
                    const val = localStorage.getItem(STORAGE_PREFIX + k);
                    if (val !== null) {
                        try {
                            result[k] = JSON.parse(val);
                        } catch (e) {
                            result[k] = val;
                        }
                    } else {
                        result[k] = keys[k];
                    }
                });
            } else if (keys === null) {
                // Get all
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key.startsWith(STORAGE_PREFIX)) {
                        const originalKey = key.substring(STORAGE_PREFIX.length);
                        try {
                            result[originalKey] = JSON.parse(localStorage.getItem(key));
                        } catch (e) {
                            result[originalKey] = localStorage.getItem(key);
                        }
                    }
                }
            }
            if (callback) callback(result);
            resolve(result);
        });
    };

    window.chrome.storage.local.set = function (items, callback) {
        return new Promise((resolve) => {
            if (typeof items === 'object' && items !== null) {
                Object.keys(items).forEach(k => {
                    localStorage.setItem(STORAGE_PREFIX + k, JSON.stringify(items[k]));
                });
            }
            if (callback) callback();
            resolve();
        });
    };

    window.chrome.storage.local.remove = function (keys, callback) {
        return new Promise((resolve) => {
            if (typeof keys === 'string') keys = [keys];
            if (Array.isArray(keys)) {
                keys.forEach(k => {
                    localStorage.removeItem(STORAGE_PREFIX + k);
                });
            }
            if (callback) callback();
            resolve();
        });
    };

    // 2. Asset URL Polyfill
    // In a bookmarklet, we don't have local assets. We must use a hosted CDN or GitHub Pages absolute URL.
    const BASE_URL = 'https://slimerewinston.github.io/FCWatch-Overhaul/';
    window.chrome.runtime.getURL = function (path) {
        if (path.startsWith('/')) path = path.substring(1);
        return BASE_URL + path;
    };

    // 3. Messaging Stub (to prevent crashes)
    window.chrome.runtime.sendMessage = function (message, callback) {
        console.log('[FCW iOS Shim] Suppressed sendMessage:', message);
        if (callback) callback({ success: true, shimmed: true });
        return { then: (cb) => { cb({ success: true, shimmed: true }); return { catch: () => { } }; } };
    };

    window.chrome.runtime.onMessage = {
        addListener: function (callback) {
            console.log('[FCW iOS Shim] Registered dummy onMessage listener');
        },
        removeListener: function (callback) { }
    };

    console.log('[FCW iOS Shim] Ready Setup Complete!');
})();


// === MOBILE_CSS.JS ===
// === FCWatch Overhaul — Global Mobile Responsiveness (V2) ===
// Injects CSS rules to force Bootstrap grids, tables, and containers to fit on mobile screens.
// V2: Fixes oversized logo, card grid collapse, and viewport zoom level.

(function initMobileCSS() {
    'use strict';

    const isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (!isMobile && window.innerWidth > 768) return;

    if (document.getElementById('fcw-mobile-responsive-css')) return;

    // 1. Fix viewport meta tag to zoom out properly
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
        viewport = document.createElement('meta');
        viewport.name = 'viewport';
        document.head.appendChild(viewport);
    }
    viewport.content = 'width=device-width, initial-scale=0.85, maximum-scale=5.0, user-scalable=yes';

    const style = document.createElement('style');
    style.id = 'fcw-mobile-responsive-css';
    style.textContent = `
        /* --- GLOBAL IOS RESPONSIVENESS (V2) --- */
        @media (max-width: 768px) {
            /* Fix horizontal scrolling */
            html, body { 
                overflow-x: hidden !important; 
                width: 100vw !important;
                max-width: 100% !important;
                position: relative;
            }
            
            /* Squeeze main containers */
            .container, .container-fluid { 
                width: 100% !important; 
                max-width: 100% !important; 
                padding-left: 8px !important; 
                padding-right: 8px !important; 
                box-sizing: border-box !important; 
            }
            
            /* Responsive Tables (Leaderboards, Transactions) */
            .table-responsive { 
                overflow-x: auto !important; 
                -webkit-overflow-scrolling: touch; 
                margin-bottom: 15px !important;
                border: none !important;
            }
            table { 
                width: 100% !important; 
                font-size: 0.8rem !important; 
            }
            th, td { 
                padding: 8px 5px !important; 
                word-wrap: break-word;
            }
            
            /* Bootstrap rows */
            .row { 
                margin-left: -5px !important; 
                margin-right: -5px !important; 
                display: flex !important;
                flex-wrap: wrap !important;
            }

            /* === COLUMN OVERRIDES ===
               Only stack LARGE columns (md-6+) to single-column.
               Leave small columns (col-md-3, col-sm-4, col-xs-6) as 2-across 
               so card grids render properly instead of collapsing. */
            .col-md-12, .col-lg-12 {
                width: 100% !important; flex: 0 0 100% !important; max-width: 100% !important;
            }
            .col-md-8, .col-md-9, .col-md-10, .col-md-11,
            .col-lg-8, .col-lg-9, .col-lg-10, .col-lg-11 {
                width: 100% !important; flex: 0 0 100% !important; max-width: 100% !important;
            }
            .col-md-6, .col-lg-6 {
                width: 50% !important; flex: 0 0 50% !important; max-width: 50% !important;
            }
            .col-md-4, .col-lg-4 {
                width: 50% !important; flex: 0 0 50% !important; max-width: 50% !important;
            }
            .col-md-3, .col-lg-3 {
                width: 50% !important; flex: 0 0 50% !important; max-width: 50% !important;
            }
            .col-md-2, .col-lg-2 {
                width: 50% !important; flex: 0 0 50% !important; max-width: 50% !important;
            }
            /* xs/sm columns keep their native widths */
            .col-xs-6, .col-sm-6 { flex: 0 0 50% !important; max-width: 50% !important; }
            .col-xs-4, .col-sm-4 { flex: 0 0 33.333% !important; max-width: 33.333% !important; }
            .col-xs-3, .col-sm-3 { flex: 0 0 25% !important; max-width: 25% !important; }

            /* All columns need padding fix */
            [class*="col-"] {
                padding-left: 5px !important; 
                padding-right: 5px !important; 
                box-sizing: border-box !important;
            }

            /* === NAVBAR LOGO FIX ===
               The logonav.png was expanding to fill the entire container.
               Cap it explicitly. */
            img[src*="logonav"] {
                max-width: 50px !important;
                width: 50px !important;
                height: auto !important;
                padding: 0 5px !important;
            }
            /* General navbar image sizing */
            .navbar-brand img, .navbar-header img {
                max-width: 50px !important;
                height: auto !important;
            }

            /* === CARD GRID FIX ===
               Player cards need to show in a 2-column grid, not get stacked.
               The previous V1 rule [class*="col-"] { width:100% } was killing them. */
            .playercard, .player-card, .card-container, .card-item,
            .fut-card, .ut-card {
                display: inline-block !important;
                vertical-align: top !important;
                box-sizing: border-box !important;
                margin-bottom: 10px !important;
            }

            /* Images: cap normal images but NOT card background images */
            img:not([src*="cards/"]):not([src*="headshot"]):not([src*="head_"]):not([src*="flag"]):not([src*="club"]):not([src*="nation"]) { 
                max-width: 100% !important; 
                height: auto !important; 
            }
            
            /* Modals */
            .modal-dialog {
                margin: 10px auto !important;
                width: 95% !important;
            }
            
            /* Forms and inputs - 16px prevents iOS auto-zoom */
            input, select, textarea {
                max-width: 100% !important;
                font-size: 16px !important;
            }
            
            /* Dynamic Header/Title scaling */
            h1, h2, h3 {
                font-size: clamp(1.2rem, 4.5vw, 2rem) !important;
                word-wrap: break-word;
                text-align: center;
            }
            h4, h5, h6 {
                font-size: clamp(0.9rem, 3.5vw, 1.4rem) !important;
            }

            /* Reduce overall padding and margins on mobile */
            .panel, .well, .jumbotron {
                padding: 12px !important;
                margin-bottom: 10px !important;
            }
        }
    `;

    document.head.appendChild(style);
    console.log('[FCW Mobile] Global responsiveness CSS V2 injected.');
})();


// === PERSIST.JS ===
// === FCWatch Overhaul — Mobile SPA Persistence ===
// Intercepts navigation to prevent Safari from killing the bookmarklet sandbox.

(function initPersistence() {
    'use strict';

    if (window.__fcwPersistActive) return;
    window.__fcwPersistActive = true;

    document.addEventListener('click', function (e) {
        // Find closest anchor tag
        const a = e.target.closest('a');
        if (!a) return;

        const href = a.getAttribute('href');
        if (!href || href.startsWith('javascript:') || href.startsWith('#')) return;

        // Ignore external hosts or blank targets
        if (a.host && a.host !== window.location.host) return;
        if (a.target === '_blank') return;
        if (e.ctrlKey || e.metaKey || e.shiftKey) return;

        // Ignore modal triggers or specific UI elements
        const cls = a.className || '';
        if (cls.includes('card') || cls.includes('inspect') || a.closest('.playercard') || a.closest('.fcw-cloned-card')) {
            return;
        }

        // It's a valid internal navigation. Intercept it!
        e.preventDefault();

        // Visual loading feedback (subtle)
        document.body.style.opacity = '0.6';
        document.body.style.transition = 'opacity 0.2s';

        fetch(href)
            .then(res => res.text())
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');

                // 1. Update Title and URL
                document.title = doc.title;
                window.history.pushState({}, '', href);

                // 2. Replace the entire Body content.
                // Note: document.head is untouched, meaning all injected <style> tags persist perfectly!
                document.body.innerHTML = doc.body.innerHTML;
                document.body.style.opacity = '1';

                // 3. Re-inject FC-Watch Overhaul components
                // We use a global bootstrap function (defined in build_bookmarklet.js) to re-run all extension logic
                if (typeof window.__fcwBoot === 'function') {
                    console.log('[FCW SPA] Page injected. Re-booting extension modules...');
                    window.__fcwBoot();
                } else {
                    console.warn('[FCW SPA] __fcwBoot not found. Modules may not re-initialize properly.');
                }

                // Fire custom event just in case any standalone listeners need it
                window.dispatchEvent(new Event('fcw-page-loaded'));

            })
            .catch(err => {
                console.error('[FCW SPA] Fetch failed, falling back to hard navigation:', err);
                window.location.href = href;
            });
    });

    // Handle back/forward browser buttons
    window.addEventListener('popstate', function () {
        document.body.style.opacity = '0.6';
        fetch(window.location.href)
            .then(res => res.text())
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                document.title = doc.title;
                document.body.innerHTML = doc.body.innerHTML;
                document.body.style.opacity = '1';

                if (typeof window.__fcwBoot === 'function') {
                    window.__fcwBoot();
                }
            })
            .catch(() => window.location.reload());
    });

    console.log('[FCW SPA] Link Persistence Interceptor Active.');
})();


window.__fcwBoot = function() {

    // === DARK_UI.JS ===
﻿// ==UserScript==
// @name         FC Watch Dark Modern UI
// @namespace    http://tampermonkey.net/
// @version      1.52
// @description  Gives fc-watch.com a sleek, dark, Apple-style UI overhaul with customizable settings
// @author       You
// @match        https://www.fc-watch.com/*
// @match        https://fc-watch.com/*
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    // === KILLSWITCH CHECK ===
    // Wait for killswitch to set the state, then check
    // Prefers Promise-based approach when available, falls back to polling
    function waitForKillswitch(callback, maxWait = 500) {
        // Try Promise-based approach first (faster, no polling)
        if (window.__FCW_EXTENSION_STATE?.ready instanceof Promise) {
            window.__FCW_EXTENSION_STATE.ready.then(isEnabled => {
                if (isEnabled) callback();
                else console.log('[FCW Dark UI] Extension disabled, not running.');
            });
            return;
        }

        // Fallback: poll with reduced frequency (10ms instead of 3ms)
        let waited = 0;
        const check = () => {
            if (window.__FCW_EXTENSION_STATE?.loaded) {
                if (window.__FCW_EXTENSION_STATE.enabled) {
                    callback();
                } else {
                    console.log('[FCW Dark UI] Extension disabled, not running.');
                }
            } else if (waited < maxWait) {
                waited += 10;
                setTimeout(check, 10);
            } else {
                // Timeout - assume enabled (failsafe)
                callback();
            }
        };
        check();
    }

    // === PROACTIVE BACKGROUND LOADING ===
    // Run immediately to prevent FOUC/black screen
    function loadSavedBackground() {
        try {
            // 1. Check for Sync Preview First (Instant)
            const preview = localStorage.getItem('fcw_bg_preview');
            if (preview) {
                document.documentElement.style.setProperty('--custom-bg-image', `url("${preview}")`);
                // We continue to load the full quality version below
            }

            const bgMode = localStorage.getItem('fcw_bg_storage_mode');
            const defaultBg = 'https://cdn.fc-watch.com/img/26/homepage/bg.png';

            if (bgMode === 'local') {
                const savedBg = localStorage.getItem('fcw_bg_image');
                if (savedBg) {
                    document.documentElement.style.setProperty('--custom-bg-image', `url("${savedBg}")`);
                }
            } else if (bgMode === 'db') {
                // Open DB manually here since fcwDB inside init isn't available yet or strictly needed
                const req = indexedDB.open('FCW_Data', 1);
                req.onsuccess = (e) => {
                    const db = e.target.result;
                    if (db.objectStoreNames.contains('assets')) {
                        const tx = db.transaction('assets', 'readonly');
                        const store = tx.objectStore('assets');
                        const getReq = store.get('custom_bg');
                        getReq.onsuccess = () => {
                            const data = getReq.result;
                            if (data) {
                                let bgUrl;
                                if (data instanceof Blob) {
                                    bgUrl = URL.createObjectURL(data);
                                } else if (typeof data === 'string') {
                                    bgUrl = data;
                                }
                                if (bgUrl) {
                                    document.documentElement.style.setProperty('--custom-bg-image', `url("${bgUrl}")`);
                                }
                            }
                        };
                    }
                };
            }
        } catch (ex) {
            console.error("[FCW] Error pre-loading background:", ex);
        }
    }

    // Load saved background IMMEDIATELY to prevent FOUC
    // (killswitch.js will reset it if extension is disabled)
    loadSavedBackground();

    // === EARLY ACCENT COLOR PRELOAD ===
    // Set the accent color CSS variable immediately for real-time updates
    function preloadAccentColor() {
        try {
            let accent = '#0071e3'; // default
            const navSettings = localStorage.getItem('fcw_navbar_settings');
            if (navSettings) {
                const parsed = JSON.parse(navSettings);
                if (parsed && parsed.accent) accent = parsed.accent;
            }
            document.documentElement.style.setProperty('--fcw-accent', accent);
            document.documentElement.style.setProperty('--accent-blue', accent);
        } catch (e) {
            console.warn('[FCW Dark UI] Error preloading accent color:', e);
        }
    }
    preloadAccentColor();

    // Wrap ALL script logic in the killswitch check
    waitForKillswitch(initDarkUI);

    function initDarkUI() {

        // 1. Load saved preferences
        let savedAccent = '#0071e3';
        try {
            const navSettings = JSON.parse(localStorage.getItem('fcw_navbar_settings'));
            if (navSettings && navSettings.accent) savedAccent = navSettings.accent;
            else savedAccent = localStorage.getItem('fcw_accent_color') || '#0071e3';
        } catch (e) {
            savedAccent = localStorage.getItem('fcw_accent_color') || '#0071e3';
        }

        // === GLOBAL IndexedDB Helper (available throughout script) ===
        const DB_CONFIG = { name: 'FCW_Data', store: 'assets', version: 1 };
        const fcwDB = {
            _db: null,
            open: function () {
                if (this._db) return Promise.resolve(this._db);
                return new Promise((resolve, reject) => {
                    const req = indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);
                    req.onupgradeneeded = (e) => {
                        const db = e.target.result;
                        if (!db.objectStoreNames.contains(DB_CONFIG.store)) {
                            db.createObjectStore(DB_CONFIG.store);
                        }
                    };
                    req.onsuccess = (e) => {
                        this._db = e.target.result;
                        resolve(this._db);
                    };
                    req.onerror = (e) => reject(e.target.error);
                });
            },
            put: function (key, val) {
                return this.open().then(db => new Promise((resolve, reject) => {
                    const tx = db.transaction(DB_CONFIG.store, 'readwrite');
                    const store = tx.objectStore(DB_CONFIG.store);
                    store.put(val, key);
                    // CRITICAL: Wait for TRANSACTION complete, not just request success
                    tx.oncomplete = () => {
                        console.log('[FCW DB] Transaction committed for key:', key);
                        resolve();
                    };
                    tx.onerror = () => {
                        console.error('[FCW DB] Transaction error:', tx.error);
                        reject(tx.error);
                    };
                    tx.onabort = () => {
                        console.error('[FCW DB] Transaction aborted:', tx.error);
                        reject(tx.error || new Error('Transaction aborted'));
                    };
                }));
            },
            get: function (key) {
                return this.open().then(db => new Promise((resolve, reject) => {
                    const tx = db.transaction(DB_CONFIG.store, 'readonly');
                    const store = tx.objectStore(DB_CONFIG.store);
                    const req = store.get(key);
                    req.onsuccess = () => resolve(req.result);
                    req.onerror = () => reject(req.error);
                }));
            },
            delete: function (key) {
                return this.open().then(db => new Promise((resolve, reject) => {
                    const tx = db.transaction(DB_CONFIG.store, 'readwrite');
                    const store = tx.objectStore(DB_CONFIG.store);
                    store.delete(key);
                    tx.oncomplete = () => resolve();
                    tx.onerror = () => reject(tx.error);
                }));
            }
        };

        // === IMMEDIATE Background Loading (runs at document-start for speed) ===
        // This is now handled by loadSavedBackground() called at script start
        // We just need to ensure savedBg is correct for the main style injection

        const defaultBg = 'https://cdn.fc-watch.com/img/26/homepage/bg.png';
        const bgMode = localStorage.getItem('fcw_bg_storage_mode');
        let savedBg = defaultBg;

        if (bgMode === 'local') {
            savedBg = localStorage.getItem('fcw_bg_image') || defaultBg;
        } else if (bgMode === 'db') {
            // If DB, use whatever loadSavedBackground() already set (or will set)
            // Read current CSS variable value - if already set by async loader, use it
            const currentBg = getComputedStyle(document.documentElement).getPropertyValue('--custom-bg-image').trim();
            if (currentBg && currentBg !== 'none' && !currentBg.includes(defaultBg)) {
                // Already has a custom background from IndexedDB load
                savedBg = currentBg.replace(/^url\(["']?|["']?\)$/g, ''); // Extract URL from url("...")
            } else {
                // Fallback - the async loader will update the CSS variable later
                savedBg = defaultBg;
            }
        }

        const savedScale = localStorage.getItem('fcw_btn_scale') || '1';
        const savedVanilla = localStorage.getItem('fcw_vanilla_buttons') === 'true';

        // Glass Buttons Settings
        const savedGlass = localStorage.getItem('fcw_glass_buttons') === 'true';
        const savedGlassColor = localStorage.getItem('fcw_glass_color') || '#1c1c1e';
        const savedGlassOpacity = localStorage.getItem('fcw_glass_opacity') || '0.4';
        const savedGlassBlur = localStorage.getItem('fcw_glass_blur') || '5';

        // Apply vanilla class immediately if enabled
        if (savedVanilla) {
            if (document.documentElement) document.documentElement.classList.add('fcw-vanilla-buttons');
            // Also ensure body gets it eventually if not ready
            const applyVanillaBody = () => {
                if (document.body) document.body.classList.add('fcw-vanilla-buttons');
                else requestAnimationFrame(applyVanillaBody);
            };
            applyVanillaBody();
        }

        // Apply glass buttons class immediately if enabled
        if (savedGlass) {
            const applyGlassBody = () => {
                if (document.body) document.body.classList.add('fcw-glass-buttons');
                else requestAnimationFrame(applyGlassBody);
            };
            applyGlassBody();
        }

        // 2. Define the styles
        const appleCss = `
        /* --- Global Reset & Fonts --- */
        :root {
            --bg-body: #000000;
            --bg-card: #1c1c1e;
            --bg-card-hover: #2c2c2e;
            --text-primary: #f5f5f7;
            --text-secondary: #86868b;
            --accent-blue: ${savedAccent};
            --fcw-accent: ${savedAccent}; /* INTERLINKED: Sync with Navbar */
            --accent-hover: ${adjustColor(savedAccent, -20)};
            --border-color: rgba(255, 255, 255, 0.15);
            --font-stack: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            --glass-bg: rgba(28, 28, 30, 0.75);
            --custom-bg-image: url("${savedBg}");
            --btn-scale: ${savedScale};
            
            /* Glass Buttons Customization */
            --fcw-glass-color: ${savedGlassColor};
            --fcw-glass-opacity: ${savedGlassOpacity};
            --fcw-glass-blur: ${savedGlassBlur}px;
        }
        html, body {
            background-image: var(--custom-bg-image) !important;
            background-size: cover !important;
            background-attachment: fixed !important;
            background-position: center !important;
            background-color: var(--bg-body) !important;
            color: var(--text-primary) !important;
            font-family: var(--font-stack) !important;
            -webkit-font-smoothing: antialiased;
        }

        /* --- Z-Index Fixes --- */
        /* Don't override main navbar z-index - let SmartMenus handle it */
        .navbar-collapse {
            overflow: visible !important;
        }
        
        /* Style dropdown menus but don't override positioning */
        .dropdown-menu {
            background-color: var(--bg-card) !important;
            border: 1px solid var(--border-color) !important;
            border-radius: 12px !important;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            padding: 8px !important;
            z-index: 2147483647 !important;
        }
        
        /* SmartMenus scroll arrows need to be visible */
        .scroll-up, .scroll-down {
            z-index: 999999 !important;
            background-color: rgba(28, 28, 30, 0.95) !important;
            border-radius: 4px !important;
            pointer-events: none !important;
        }
        .scroll-up-arrow, .scroll-down-arrow {
            border-color: transparent transparent #fff transparent !important;
        }
        .scroll-down-arrow {
            border-color: #fff transparent transparent transparent !important;
        }
        
        /* Fix scroll locking in dropdowns */
        .dropdown-menu[style*="overflow-y: auto"],
        .dropdown-menu[style*="overflow-y:auto"],
        .dropdown-menu[style*="max-height"] {
            overscroll-behavior: contain !important;
            -webkit-overflow-scrolling: touch !important;
        }

        /* --- Navbar (Glassmorphism) --- */
        /* CRITICAL: backdrop-filter creates a stacking context, so we MUST set z-index
           higher than the filter bar (navbar-default has z-index: 999) 
           otherwise dropdowns from navbar-inverse get trapped behind navbar-default */
        nav.navbar.navbar-inverse {
            background-color: rgba(20, 20, 25, 0.4) !important; /* High transparency */
            backdrop-filter: saturate(180%) blur(25px);
            -webkit-backdrop-filter: saturate(180%) blur(25px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important; /* Subtle separator */
            margin-bottom: 0 !important;
            box-shadow: none !important; /* Unified shadow on bottom nav */
            border-radius: 0 !important;
            position: relative !important;
            z-index: 1060 !important; /* HIGHER THAN NAVBAR-DEFAULT TO FIX DROPDOWN CLIPPING */
        }

        nav.navbar.navbar-default {
            background-color: rgba(20, 20, 25, 0.4) !important;
            backdrop-filter: saturate(180%) blur(25px);
            -webkit-backdrop-filter: saturate(180%) blur(25px);
            border-top: none !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1) !important;
            margin-top: 0 !important;
            border-radius: 0 !important;
            position: relative !important; /* Ensure secondary nav acts as its own stacking context */
            z-index: 1050 !important; /* LOWER THAN NAVBAR-INVERSE */
        }
        .navbar-inverse .navbar-nav > li > a {
            color: var(--text-secondary) !important;
            font-weight: 500;
            transition: color 0.2s ease;
        }
        .navbar-inverse .navbar-nav > li > a:hover {
            color: var(--text-primary) !important;
        }
        
        /* =======================================================================
           BRUTE FORCE SMARTMENUS OVERRIDE (0ms Instant Hover)
           JavaScript is too slow to calculate and apply inline styles on massive
           dropdowns like 'Leaderboards'. We must use pure CSS to force instant display.
           ======================================================================= */
        ul.sm ul {
            display: block !important;
            visibility: hidden !important;
            opacity: 0 !important;
            transition: none !important;
            animation: none !important;
            /* Prevent clicks from passing through hidden menus */
            pointer-events: none; 
        }

        ul.sm li:hover > ul {
            visibility: visible !important;
            opacity: 1 !important;
            /* Re-enable clicks when visible */
            pointer-events: auto;
        }

        .dropdown-menu > li > a {
            color: var(--text-primary) !important;
            border-radius: 6px;
            padding: 8px 12px !important;
            transition: background-color 0.2s ease, color 0.2s ease !important;
        }
        .dropdown-menu > li > a:hover {
            background-color: var(--accent-blue) !important;
            color: white !important;
        }

        /* --- Vanilla Buttons Scaling --- */
        body.fcw-vanilla-buttons #page-wrapper .profileNav:not(.btn-primary):not(.fcw-settings-btn):not(#fcw-settings-panel *):not(.sb-sort-toggle),
        body.fcw-vanilla-buttons div.profileNav:not(.btn-primary):not(.fcw-settings-btn):not(#fcw-settings-panel *):not(.sb-sort-toggle),
        body.fcw-vanilla-buttons .profileNav:not(.btn-primary):not(.fcw-settings-btn):not(#fcw-settings-panel *):not(.sb-sort-toggle),
        body.fcw-vanilla-buttons .btn:not(.btn-primary):not(.fcw-settings-btn):not(#fcw-settings-panel *):not(.sb-sort-toggle),
        body.fcw-vanilla-buttons button:not(.btn-primary):not(.fcw-settings-btn):not(#fcw-settings-panel *):not(.sb-sort-toggle),
        body.fcw-vanilla-buttons input[type="submit"]:not(#fcw-settings-panel *),
        body.fcw-vanilla-buttons input[type="button"]:not(#fcw-settings-panel *),
        body.fcw-vanilla-buttons input[type="reset"]:not(#fcw-settings-panel *),
        body.fcw-vanilla-buttons #storeAllButton {
            /* Dynamic Scaling Only - Keep Vanilla Style */
            padding: calc(6px * var(--btn-scale)) calc(12px * var(--btn-scale)) !important;
            font-size: calc(100% * var(--btn-scale)) !important;
        }

        /* --- Buttons & Navigation Pills (SCALABLE) --- */
        /* ALL .profileNav buttons now use the filled accent style */
        body:not(.fcw-vanilla-buttons):not(.fcw-glass-buttons) .profileNav:not(#fcw-settings-panel *):not(.sb-sort-toggle) {
            background: var(--fcw-accent) !important;
            color: #ffffff !important;
            border: 1px solid var(--fcw-accent) !important;
            border-radius: 12px !important;
            /* Dynamic Scaling based on Settings */
            padding: calc(12px * var(--btn-scale)) !important;
            font-size: calc(100% * var(--btn-scale)) !important;
            font-weight: 600;
            letter-spacing: -0.01em;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: none !important;
            text-transform: none !important;
            margin-bottom: 12px !important;
            text-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }
        body:not(.fcw-vanilla-buttons):not(.fcw-glass-buttons) .profileNav:not(#fcw-settings-panel *):not(.sb-sort-toggle):hover {
            opacity: 0.9;
            transform: scale(1.02);
            box-shadow: 0 0 15px var(--fcw-accent) !important;
            text-decoration: none !important;
        }

        /* --- Glass Buttons Mode --- */
        body.fcw-glass-buttons:not(.fcw-vanilla-buttons) #page-wrapper .profileNav:not(.btn-primary):not(.fcw-settings-btn):not(#fcw-settings-panel *):not(.sb-sort-toggle),
        body.fcw-glass-buttons:not(.fcw-vanilla-buttons) div.profileNav:not(.btn-primary):not(.fcw-settings-btn):not(#fcw-settings-panel *):not(.sb-sort-toggle),
        body.fcw-glass-buttons:not(.fcw-vanilla-buttons) .profileNav:not(.btn-primary):not(.fcw-settings-btn):not(#fcw-settings-panel *):not(.sb-sort-toggle),
        body.fcw-glass-buttons:not(.fcw-vanilla-buttons) .btn:not(.btn-primary):not(.fcw-settings-btn):not(#fcw-settings-panel *):not(.sb-sort-toggle),
        body.fcw-glass-buttons:not(.fcw-vanilla-buttons) button:not(.btn-primary):not(.fcw-settings-btn):not(#fcw-settings-panel *):not(.sb-sort-toggle),
        body.fcw-glass-buttons:not(.fcw-vanilla-buttons) input[type="submit"]:not(#fcw-settings-panel *),
        body.fcw-glass-buttons:not(.fcw-vanilla-buttons) input[type="button"]:not(#fcw-settings-panel *),
        body.fcw-glass-buttons:not(.fcw-vanilla-buttons) input[type="reset"]:not(#fcw-settings-panel *),
        body.fcw-glass-buttons:not(.fcw-vanilla-buttons) #storeAllButton,
        body.fcw-glass-buttons:not(.fcw-vanilla-buttons) #LOESTH .profileNav,
        body.fcw-glass-buttons:not(.fcw-vanilla-buttons) #packSharebutton .profileNav {
            background: color-mix(in srgb, var(--fcw-glass-color) calc(var(--fcw-glass-opacity) * 100%), transparent) !important;
            backdrop-filter: blur(var(--fcw-glass-blur)) saturate(180%) !important;
            -webkit-backdrop-filter: blur(var(--fcw-glass-blur)) saturate(180%) !important;
            border: 1px solid rgba(255, 255, 255, 0.15) !important;
            color: #ffffff !important;
            text-shadow: 0 1px 2px rgba(0,0,0,0.2) !important;
            /* Dynamic Scaling */
            padding: calc(12px * var(--btn-scale)) !important;
            font-size: calc(100% * var(--btn-scale)) !important;
            border-radius: 8px !important;
        }
        body.fcw-glass-buttons:not(.fcw-vanilla-buttons) #page-wrapper .profileNav:not(.btn-primary):not(.fcw-settings-btn):not(#fcw-settings-panel *):not(.sb-sort-toggle):hover,
        body.fcw-glass-buttons:not(.fcw-vanilla-buttons) .profileNav:not(.btn-primary):not(.fcw-settings-btn):not(#fcw-settings-panel *):not(.sb-sort-toggle):hover,
        body.fcw-glass-buttons:not(.fcw-vanilla-buttons) .btn:not(.btn-primary):not(.fcw-settings-btn):not(#fcw-settings-panel *):not(.sb-sort-toggle):hover,
        body.fcw-glass-buttons:not(.fcw-vanilla-buttons) button:not(.btn-primary):not(.fcw-settings-btn):not(#fcw-settings-panel *):not(.sb-sort-toggle):hover,
        body.fcw-glass-buttons:not(.fcw-vanilla-buttons) input[type="submit"]:hover,
        body.fcw-glass-buttons:not(.fcw-vanilla-buttons) input[type="button"]:hover,
        body.fcw-glass-buttons:not(.fcw-vanilla-buttons) input[type="reset"]:hover,
        body.fcw-glass-buttons:not(.fcw-vanilla-buttons) #storeAllButton:hover,
        body.fcw-glass-buttons:not(.fcw-vanilla-buttons) #LOESTH .profileNav:hover,
        body.fcw-glass-buttons:not(.fcw-vanilla-buttons) #packSharebutton .profileNav:hover {
            background: color-mix(in srgb, var(--fcw-glass-color) calc(var(--fcw-glass-opacity) * 120%), transparent) !important;
            border-color: rgba(255, 255, 255, 0.25) !important;
        }
        body.fcw-glass-buttons:not(.fcw-vanilla-buttons) #page-wrapper .packStats,
        body.fcw-glass-buttons:not(.fcw-vanilla-buttons) .packStats {
            background: color-mix(in srgb, var(--fcw-glass-color) calc(var(--fcw-glass-opacity) * 100%), transparent) !important;
            backdrop-filter: blur(var(--fcw-glass-blur)) saturate(180%) !important;
            -webkit-backdrop-filter: blur(var(--fcw-glass-blur)) saturate(180%) !important;
            border: 1px solid rgba(255, 255, 255, 0.15) !important;
            color: #ffffff !important;
        }
        body.fcw-glass-buttons:not(.fcw-vanilla-buttons) .packStats h3 {
             color: #ffffff !important;
             border-bottom-color: rgba(255, 255, 255, 0.3) !important;
        }
        body.fcw-glass-buttons:not(.fcw-vanilla-buttons) .packStats li span:last-child {
             color: #ffffff !important;
        }


        /* --- Statistics Box --- */
        body:not(.fcw-glass-buttons) .packStats,
        .packStats:not(.fcw-glass-buttons) {
            background: var(--bg-card) !important;
            border-radius: 18px !important;
            border: 1px solid var(--fcw-accent) !important;
            padding: 24px !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            font-weight: 400 !important;
            backdrop-filter: blur(10px);
        }
        body:not(.fcw-glass-buttons) .packStats h3,
        .packStats:not(.fcw-glass-buttons) h3 {
            font-weight: 700;
            color: var(--text-primary);
            margin-top: 0;
            letter-spacing: -0.02em;
            border-bottom: 1px solid var(--fcw-accent);
            padding-bottom: 12px;
            margin-bottom: 16px;
        }

        /* --- UI Hiding Logic (Animation) --- */
        body.fcw-anim-playing .packStats,
        body.fcw-anim-playing div[style*="writing-mode:vertical-lr"],
        body.fcw-anim-pending div[style*="writing-mode:vertical-lr"] {
            display: none !important;
        }

        /* Default Transition for Navbar (Enable Smooth Reveal) */
        .navbar,
        .navbar-inverse,
        .navbar-fixed-top {
            transition: opacity 0.8s ease;
        }

        body.fcw-anim-playing .navbar,
        body.fcw-anim-playing .navbar-inverse,
        body.fcw-anim-playing .navbar-fixed-top {
            opacity: 0 !important;
            transition: opacity 0.5s ease !important;
            pointer-events: none !important;
        }

        /* --- Sort Options Overhaul (Glass Effect) --- */
        .sb-sort-toggle {
            /* High transparency for seamless blend */
            background: color-mix(in srgb, var(--fcw-glass-color) calc(var(--fcw-glass-opacity) * 50%), transparent) !important;
            backdrop-filter: blur(10px) saturate(120%) !important;
            -webkit-backdrop-filter: blur(10px) saturate(120%) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            color: #ffffff !important;
            border-radius: 12px !important;
            padding: 8px 16px !important;
            font-weight: 500 !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05) !important;
            text-shadow: 0 1px 2px rgba(0,0,0,0.1) !important;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
            margin-bottom: 10px !important; /* Spacing */
            
            /* Ensure it uses the correct width/display if needed, usually inline-block or block */
            display: inline-block !important; 
        }

        .sb-sort-toggle:hover {
            background: color-mix(in srgb, var(--fcw-glass-color) calc(var(--fcw-glass-opacity) * 70%), transparent) !important;
            border-color: rgba(255, 255, 255, 0.25) !important;
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(0,0,0,0.1) !important;
            color: #ffffff !important;
        }
        
        .sb-sort-toggle .caret {
            border-top-color: #ffffff !important;
            opacity: 0.8;
            margin-left: 6px !important;
        }
        
        /* --- Sort Menu Dropdown Overhaul --- */
        .sb-sort-menu {
            /* Remove dark backing, purely glass */
            background: color-mix(in srgb, var(--fcw-glass-color) calc(var(--fcw-glass-opacity) * 60%), transparent) !important;
            backdrop-filter: blur(15px) saturate(120%) !important;
            -webkit-backdrop-filter: blur(15px) saturate(120%) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            border-radius: 16px !important;
            padding: 8px !important;
            box-shadow: 0 15px 50px rgba(0,0,0,0.2) !important;
            margin-top: 8px !important;
            min-width: 180px !important;
            z-index: 1000 !important;
        }

        .sb-sort-btn {
            background: transparent !important;
            border: none !important;
            color: rgba(255, 255, 255, 0.75) !important;
            font-size: 13px !important;
            padding: 8px 12px !important;
            border-radius: 10px !important; /* Rounded pills */
            width: 100% !important;
            text-align: left !important;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
            margin-bottom: 3px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
        }

        .sb-sort-btn:hover {
            background: rgba(255, 255, 255, 0.1) !important;
            color: white !important;
            transform: translateX(3px);
            padding-left: 15px !important;
        }

        /* Active Sort Item */
        .sb-sort-btn.is-active {
            background: linear-gradient(135deg, var(--fcw-accent), color-mix(in srgb, var(--fcw-accent), black 20%)) !important;
            color: white !important;
            font-weight: 600 !important;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3) !important;
        }
        .sb-sort-btn.is-active:hover {
            transform: none !important;
            padding-left: 12px !important;
        }
        /* Descending Arrow Indicator for active item */
        .sb-sort-btn.is-active.is-desc::after {
            content: "▼";
            font-size: 0.8em;
            opacity: 0.8;
        }
        .sb-sort-btn.is-active:not(.is-desc)::after {
            content: "▲";
            font-size: 0.8em;
            opacity: 0.8;
        }

        /* Reset Button - Distinct Style */
        .sb-sort-btn.reset-btn {
            margin-top: 8px !important;
            border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
            border-radius: 0 0 10px 10px !important; /* Bottom radius only */
            padding-top: 12px !important;
            padding-bottom: 8px !important;
            justify-content: center !important;
            color: #ff6b6b !important;
            text-align: center !important;
            /* Higher opacity background to stand out */
            background: rgba(0, 0, 0, 0.3) !important;
        }
        .sb-sort-btn.reset-btn:hover {
            background: rgba(255, 87, 87, 0.25) !important;
            color: #ff4d4d !important;
            transform: none !important;
            padding-left: 12px !important; /* Keep the existing padding override or remove if center align is preferred */
            padding-left: 0 !important; /* Force center alignment on hover too since it is centered */
        }

        /* --- Log Out Button Overhaul --- */
        /* Remove vanilla blue container */
        .club-menu-dropdown {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
        }

        .club-menu-logout {
            background: color-mix(in srgb, var(--fcw-glass-color) calc(var(--fcw-glass-opacity) * 50%), transparent) !important;
            backdrop-filter: blur(10px) saturate(120%) !important;
            -webkit-backdrop-filter: blur(10px) saturate(120%) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            color: #ffffff !important;
            border-radius: 12px !important;
            padding: 10px 16px !important; /* Slightly larger padding */
            font-weight: 500 !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05) !important;
            text-shadow: 0 1px 2px rgba(0,0,0,0.1) !important;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
            margin-bottom: 10px !important;
            
            /* Make it seamless and blocky */
            display: block !important;
            width: 100% !important;
            text-align: center !important; /* Center text */
            text-decoration: none !important;
        }
        .club-menu-logout:hover {
            background: rgba(255, 87, 87, 0.25) !important; /* Red tint on hover for logout */
            border-color: rgba(255, 255, 255, 0.25) !important;
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(0,0,0,0.1) !important;
            color: #ffffff !important;
            text-decoration: none !important;
        }
        .club-menu-logout .glyphicon {
            margin-right: 8px;
            opacity: 0.8;
        }

        /* --- FC 26 Year Selector Fix --- */
        /* Override specific inline blue background to match glass navbar */
        .navbar-nav.navbar-right > li[style*="background:#003366"],
        .navbar-nav.navbar-right > li[style*="background: #003366"] {
            background: transparent !important;
            margin-left: 0 !important;
        }
        /* --- Club Menu Toggle: Liquid Glass Hover --- */
        /* --- Club Menu Toggle: Liquid Glass Hover --- */
        a.club-menu-toggle {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            border-radius: 10px !important;
            padding: 8px 12px !important;
            position: relative !important;
            text-decoration: none !important;
        }
        a.club-menu-toggle:hover,
        a.club-menu-toggle:hover span,
        a.club-menu-toggle:hover * {
            background: color-mix(in srgb, var(--fcw-glass-color) calc(var(--fcw-glass-opacity) * 70%), transparent) !important;
            backdrop-filter: blur(15px) saturate(150%) !important;
            -webkit-backdrop-filter: blur(15px) saturate(150%) !important;
            box-shadow: 
                0 4px 20px rgba(255, 255, 255, 0.1),
                inset 0 1px 0 rgba(255, 255, 255, 0.2),
                inset 0 -1px 0 rgba(0, 0, 0, 0.1) !important;
            transform: scale(1.03) !important;
            color: #ffffff !important; /* FORCE white text on glass */
            text-decoration: none !important;
        }
        .club-menu-toggle:active {
            transform: scale(0.98) !important;
            background: color-mix(in srgb, var(--fcw-glass-color) calc(var(--fcw-glass-opacity) * 90%), transparent) !important;
        }
        
        body:not(.fcw-glass-buttons) .packStats li,
        .packStats:not(.fcw-glass-buttons) li {
            padding: 6px 0;
            color: var(--text-secondary);
            font-size: 14px;
            display: flex;
            justify-content: space-between;
        }
        body:not(.fcw-glass-buttons) .packStats li span:last-child,
        .packStats:not(.fcw-glass-buttons) li span:last-child {
            color: var(--text-primary);
            font-weight: 600;
            font-family: monospace;
            font-size: 1.1em;
        }

        /* --- Player Cards Area --- */
        #playersblock {
            margin-top: -15px; /* Move cards up slightly to match vanilla */
        }
        .cardtype {
            transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .cardtype:hover {
            transform: translateY(-8px) scale(1.02);
            z-index: 100;
            filter: drop-shadow(0 10px 15px rgba(0,0,0,0.5));
        }

        /* Popovers */
        .popover {
            background-color: var(--bg-card) !important;
            border: 1px solid var(--border-color) !important;
            color: var(--text-primary) !important;
            border-radius: 12px !important;
            font-family: var(--font-stack) !important;
            z-index: 50000 !important;
        }
        .popover-title {
            background-color: var(--bg-card-hover) !important;
            border-bottom: 1px solid var(--border-color) !important;
            color: var(--text-primary) !important;
            font-weight: 600;
            border-radius: 11px 11px 0 0 !important;
        }
        .popover-content {
            color: var(--text-secondary);
        }

        /* --- Settings UI (Apple Style) --- */
        #fcw-settings-gear {
            position: fixed;
            bottom: 20px;
            left: 20px;
            width: 42px;
            height: 42px;
            background: rgba(28, 28, 30, 0.9);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 99999;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), 
                        background 0.2s ease,
                        box-shadow 0.2s ease;
            color: var(--text-primary);
        }
        #fcw-settings-gear:hover {
            transform: scale(1.08) translateY(-2px);
            background: rgba(44, 44, 46, 0.95);
            box-shadow: 0 6px 16px rgba(0,0,0,0.4);
        }
        #fcw-settings-gear:active {
            transform: scale(0.95);
        }
        #fcw-settings-gear.hidden {
            opacity: 0;
            pointer-events: none;
            transform: scale(0.8);
        }
        
        #fcw-settings-panel {
            position: fixed;
            bottom: 72px;
            left: 20px;
            width: 320px;
            background: rgba(22, 22, 24, 0.95);
            backdrop-filter: blur(12px) saturate(150%);
            -webkit-backdrop-filter: blur(12px) saturate(150%);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 18px;
            padding: 20px;
            z-index: 99999;
            display: none;
            box-shadow: 0 12px 32px rgba(0,0,0,0.5), 
                        inset 0 1px 0 rgba(255,255,255,0.05);
            opacity: 0;
            transform: translateY(8px) scale(0.96);
            transition: opacity 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), 
                        transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        #fcw-settings-panel.visible {
            display: block;
            opacity: 1;
            transform: translateY(0) scale(1);
        }
        
        .fcw-setting-row {
            margin-bottom: 16px;
        }
        .fcw-setting-row:last-child {
            margin-bottom: 0;
        }
        .fcw-setting-label {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.6);
            margin-bottom: 6px;
            display: flex;
            justify-content: space-between;
            font-weight: 500;
            letter-spacing: 0.02em;
        }

        /* Range Slider (Apple Style) */
        input[type=range] {
            -webkit-appearance: none;
            width: 100%;
            background: transparent;
            height: 20px;
        }
        input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none;
            height: 16px;
            width: 16px;
            border-radius: 6px;
            background: #fff;
            cursor: pointer;
            margin-top: -5px;
            box-shadow: 0 1px 4px rgba(0,0,0,0.3);
            transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        input[type=range]::-webkit-slider-thumb:hover {
            transform: scale(1.1);
        }
        input[type=range]::-webkit-slider-runnable-track {
            width: 100%;
            height: 6px;
            cursor: pointer;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
        }
        input[type=range]:focus {
            outline: none;
        }

        /* File Input (Apple Style) */
        .fcw-file-input {
            width: 100%;
            font-size: 11px;
            color: rgba(255, 255, 255, 0.5);
        }
        .fcw-file-input::-webkit-file-upload-button {
            visibility: hidden;
            width: 0;
        }
        .fcw-file-input::before {
            content: 'Choose Image';
            display: inline-block;
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 8px 14px;
            outline: none;
            white-space: nowrap;
            cursor: pointer;
            color: #fff;
            font-weight: 500;
            font-size: 12px;
            margin-right: 8px;
            transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .fcw-file-input:hover::before {
            background: rgba(255, 255, 255, 0.12);
            transform: scale(1.02);
        }
        
        .fcw-btn-small {
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #fff;
            padding: 6px 12px;
            border-radius: 8px;
            font-size: 11px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .fcw-btn-small:hover {
            background: rgba(255, 255, 255, 0.12);
            transform: scale(1.02);
        }

        /* Color Input (Apple Style) */
        input[type="color"] {
            -webkit-appearance: none;
            border: none;
            width: 100%;
            height: 32px;
            cursor: pointer;
            background: none;
            border-radius: 8px;
        }
        input[type="color"]::-webkit-color-swatch-wrapper {
            padding: 0;
            border-radius: 8px;
        }
        input[type="color"]::-webkit-color-swatch {
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
        }
        
        /* Checkbox (Apple Style) */
        #fcw-settings-panel input[type="checkbox"] {
            -webkit-appearance: none;
            appearance: none;
            width: 44px;
            height: 24px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            position: relative;
            cursor: pointer;
            transition: background 0.2s ease;
        }
        #fcw-settings-panel input[type="checkbox"]::after {
            content: '';
            position: absolute;
            top: 2px;
            left: 2px;
            width: 20px;
            height: 20px;
            background: #fff;
            border-radius: 10px;
            transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }
        #fcw-settings-panel input[type="checkbox"]:checked {
            background: var(--fcw-accent, #0A84FF);
        }
        #fcw-settings-panel input[type="checkbox"]:checked::after {
            transform: translateX(20px);
        }

        /* Prevent Settings Panel Buttons from Scaling */
        #fcw-settings-panel button,
        #fcw-settings-panel .fcw-btn-small,
        #fcw-settings-panel input[type="button"],
        #fcw-settings-panel input[type="submit"],
        #fcw-settings-panel input[type="reset"] {
            padding: 6px 12px !important;
            font-size: 11px !important;
            height: auto !important;
            width: auto !important;
            border-radius: 8px !important;
            transform: none !important; /* Stop scale transforms if unwanted */
        }
        #fcw-settings-panel button:hover,
        #fcw-settings-panel .fcw-btn-small:hover {
            transform: scale(1.02) !important; /* Keep small hover effect */
        }

        /* Hints (Apple Style) */
        .fcw-hint {
            font-size: 10px;
            color: rgba(255, 255, 255, 0.35);
            margin-top: 4px;
            line-height: 1.4;
        }
        .fcw-hint b {
            color: rgba(255, 255, 255, 0.5);
        }
        h1, h2, h3, h4, h5, h6 {
            font-family: var(--font-stack) !important;
            letter-spacing: -0.02em;
        }
        .text-muted {
            color: #6e6e73 !important;
        }
        input[type="text"] {
            background-color: #2c2c2e !important;
            border: none !important;
            border-radius: 8px !important;
            color: white !important;
            padding: 8px 12px !important;
            height: auto !important;
        }
        #nXErRzqyWFYJ, .profilead, .sidead {
            opacity: 0.1;
            transition: opacity 0.3s;
        }
        #nXErRzqyWFYJ:hover, .profilead:hover, .sidead:hover {
            opacity: 1;
        }
        #cookie-consent-banner {
            background: rgba(28, 28, 30, 0.95) !important;
            backdrop-filter: blur(10px);
            border-top: 1px solid var(--border-color);
        }

        /* --- Logout Confirmation Modal --- */
        #fcw-logout-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        #fcw-logout-modal-overlay.visible {
            opacity: 1;
        }
        #fcw-logout-modal {
            background: color-mix(in srgb, var(--fcw-glass-color, #1c1c1e) calc(var(--fcw-glass-opacity, 0.75) * 100%), transparent) !important;
            backdrop-filter: blur(var(--fcw-glass-blur, 15px)) saturate(180%) !important;
            -webkit-backdrop-filter: blur(var(--fcw-glass-blur, 15px)) saturate(180%) !important;
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 20px;
            padding: 30px;
            text-align: center;
            box-shadow: 0 20px 50px rgba(0,0,0,0.5);
            transform: scale(0.9) translateY(20px);
            transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            max-width: 400px;
            width: 90%;
            color: #fff;
        }
        #fcw-logout-modal-overlay.visible #fcw-logout-modal {
            transform: scale(1) translateY(0);
        }
        #fcw-logout-modal h2 {
            margin-top: 0;
            font-weight: 700;
            font-size: 1.5rem;
            margin-bottom: 10px;
            color: var(--fcw-accent, #ffffff) !important;
        }
        #fcw-logout-modal p {
            color: rgba(255,255,255,0.8);
            font-size: 1rem;
            margin-bottom: 25px;
            font-weight: 400;
        }
        .fcw-logout-buttons {
            display: flex;
            gap: 15px;
            justify-content: center;
        }
        .fcw-logout-btn {
            padding: 12px 24px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 1rem;
            cursor: pointer;
            border: none;
            transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
            flex: 1;
        }
        .fcw-logout-cancel {
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .fcw-logout-cancel:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: scale(1.02);
        }
        .fcw-logout-confirm {
            background: var(--fcw-accent, #ff4d4d);
            color: #fff;
            box-shadow: 0 4px 15px color-mix(in srgb, var(--fcw-accent, #ff4d4d) 40%, transparent);
            border: 1px solid color-mix(in srgb, var(--fcw-accent, #ff4d4d) 20%, white);
        }
        .fcw-logout-confirm:hover {
            filter: brightness(1.2);
            transform: translateY(-2px) scale(1.02);
            box-shadow: 0 8px 25px color-mix(in srgb, var(--fcw-accent, #ff4d4d) 60%, transparent);
        }

        /* --- Showcase Modal Styling (Glassmorphism) --- */
        body.fcw-glass-buttons:not(.fcw-vanilla-buttons) .showcase-modal__inner,
        .showcase-modal__inner {
            background: color-mix(in srgb, var(--fcw-glass-color, #1c1c1e) calc(var(--fcw-glass-opacity, 0.75) * 100%), transparent) !important;
            backdrop-filter: blur(var(--fcw-glass-blur, 15px)) saturate(180%) !important;
            -webkit-backdrop-filter: blur(var(--fcw-glass-blur, 15px)) saturate(180%) !important;
            border: 1px solid rgba(255, 255, 255, 0.15) !important;
            border-radius: 20px !important;
            box-shadow: 0 25px 60px rgba(0,0,0,0.6) !important;
            color: #ffffff !important;
        }
        
        .showcase-modal__header {
            border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
            padding-bottom: 15px !important;
            margin-bottom: 15px !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
        }
        
        .showcase-modal__header h4 {
            color: var(--fcw-accent, #ffffff) !important;
            font-weight: 700 !important;
            font-size: 1.3rem !important;
            letter-spacing: -0.01em !important;
        }
        
        .showcase-modal__close {
            background: rgba(255, 255, 255, 0.1) !important;
            border: none !important;
            color: #ffffff !important;
            width: 32px !important;
            height: 32px !important;
            border-radius: 50% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-size: 20px !important;
            line-height: 1 !important;
            transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
        }
        
        .showcase-modal__close:hover {
            background: rgba(255, 87, 87, 0.8) !important; /* Red close */
            transform: scale(1.1) rotate(90deg) !important;
        }

        .showcase-picker-toolbar {
            display: flex !important;
            gap: 10px !important;
            margin-bottom: 20px !important;
        }

        .showcase-picker-search {
            flex: 1 !important;
            background-color: rgba(0, 0, 0, 0.3) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            border-radius: 12px !important;
            color: white !important;
            padding: 10px 15px !important;
            transition: all 0.2s ease !important;
        }
        
        .showcase-picker-search:focus {
            border-color: var(--fcw-accent) !important;
            box-shadow: 0 0 0 2px color-mix(in srgb, var(--fcw-accent) 30%, transparent) !important;
            outline: none !important;
            background-color: rgba(0, 0, 0, 0.4) !important;
        }

        .showcase-picker-search-btn {
            background: var(--fcw-accent) !important;
            color: #ffffff !important;
            border: none !important;
            border-radius: 12px !important;
            padding: 10px 20px !important;
            font-weight: 600 !important;
            transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
            box-shadow: 0 4px 15px color-mix(in srgb, var(--fcw-accent) 40%, transparent) !important;
        }
        
        .showcase-picker-search-btn:hover {
            filter: brightness(1.1) !important;
            transform: translateY(-2px) !important;
            box-shadow: 0 6px 20px color-mix(in srgb, var(--fcw-accent) 60%, transparent) !important;
        }

        .showcase-picker-results {
            /* Better scrollbar for results */
            scrollbar-width: thin;
            scrollbar-color: rgba(255,255,255,0.2) transparent;
        }
        
        .showcase-picker-results::-webkit-scrollbar {
            width: 8px;
        }
        
        .showcase-picker-results::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.1);
            border-radius: 4px;
        }
        
        .showcase-picker-results::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 4px;
        }
        
        .showcase-picker-results::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.3);
        }

        /* Adjust cards in the modal */
        .showcase-picker-results .cardtype {
            transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
        }
        .showcase-picker-results .cardtype:hover {
            transform: translateY(-5px) scale(1.05) !important;
            z-index: 10 !important;
            filter: drop-shadow(0 10px 15px rgba(0,0,0,0.4)) !important;
        }

        /* ===========================================
           RESPONSIVE SCALING FOR MINIMIZED WINDOWS
           =========================================== */
        
        /* Medium screens (< 1200px) */
        @media screen and (max-width: 1199px) {
            #fcw-settings-panel {
                width: 280px;
                padding: 16px;
            }
            .packStats {
                padding: 18px !important;
            }
        }

        /* Small screens (< 992px) */
        @media screen and (max-width: 991px) {
            #fcw-settings-panel {
                width: 260px;
                padding: 14px;
                bottom: 65px;
            }
            #fcw-settings-gear {
                width: 38px;
                height: 38px;
            }
            .packStats {
                padding: 14px !important;
                font-size: 0.9em;
            }
        }

        /* Extra small screens (< 768px) */
        @media screen and (max-width: 767px) {
            #fcw-settings-panel {
                width: 240px;
                left: 10px;
                bottom: 60px;
                padding: 12px;
                font-size: 0.9em;
            }
            #fcw-settings-gear {
                width: 36px;
                height: 36px;
                left: 10px;
                bottom: 15px;
            }
            .packStats {
                padding: 12px !important;
                font-size: 0.85em;
            }
            .fcw-setting-row {
                margin-bottom: 12px;
            }
            .fcw-setting-label {
                font-size: 11px;
            }
        }

        /* Very small screens (< 576px) - Tiny Windows */
        @media screen and (max-width: 575px) {
            /* 
               REMOVED global scaling (html, body, p, span...) per user request.
               Scaling is now strictly scoped to FCW elements only.
            */
            
            /* Settings panel - make compact and SCALED seamlessly (no scroll) */
            #fcw-settings-panel {
                width: 280px;
                left: 10px;
                /* Remove scroll constraints */
                max-width: none;
                max-height: none;
                overflow: visible;
                padding: 14px; /* Increased from 10px for breathing room */
                
                /* Seamless Scaling: Shrink entire panel to fit */
                transform-origin: bottom left;
                transform: scale(0.60); /* Reduced by ~33% from 0.85 */
                bottom: 40px;
            }
            
            /* Tighter internal spacing */
            .fcw-setting-row {
                margin-bottom: 6px !important;
            }
            .fcw-setting-label {
                margin-bottom: 2px !important;
                font-size: 15px !important; /* Increased to compensate for 0.6 scale */
            }
            
            #fcw-settings-panel * {
                /* Let transform handle scaling, but keep base font reasonable */
                font-size: 15px !important; /* Increased to compensate for 0.6 scale */
            }
            #fcw-settings-panel h3, #fcw-settings-panel h4 {
                font-size: 17px !important; /* Increased from 16px */
                margin-bottom: 8px !important;
            }
            
            /* Smaller gear button */
            #fcw-settings-gear {
                width: 30px;
                height: 30px;
                left: 6px;
                bottom: 6px;
            }
            #fcw-settings-gear svg {
                width: 16px;
                height: 16px;
            }
            
            /* Compact stats box */
            .packStats {
                padding: 8px !important;
                font-size: 10px !important;
                margin: 8px !important;
            }
            .packStats * {
                font-size: 10px !important;
            }
            .packStats h3 {
                font-size: 12px !important;
            }
            
            /* Smaller buttons */
            .profileNav, .btn {
                padding: 6px 10px !important;
                font-size: 10px !important;
            }
            
            /* Navbar compact - REMOVED per user request to not affect navbar */
            /*
            .navbar-inverse {
                padding: 3px 0 !important;
            }
            .navbar-inverse a, .navbar-inverse span {
                font-size: 11px !important;
            }
            .navbar-brand img {
                height: 25px !important;
            }
            .dropdown-menu {
                font-size: 11px !important;
            }
            .dropdown-menu a {
                font-size: 11px !important;
                padding: 5px 10px !important;
            }
            */
        }

        /* Tiny height windows (< 600px tall) */
        @media screen and (max-height: 599px) {
            #fcw-settings-panel {
                /* Remove scroll - use scaling instead */
                max-height: none;
                overflow: visible;
                bottom: 35px;
                
                transform-origin: bottom left;
                transform: scale(0.50); /* Reduced for tiny windows */
            }
            #fcw-settings-gear {
                bottom: 6px;
            }
            .packStats {
                padding: 6px !important;
                font-size: 9px !important;
            }
            /* Cards area - reduce vertical space */
            #playersblock {
                margin-top: -25px;
            }
        }

        /* Very tiny windows (< 400px wide) */
        @media screen and (max-width: 399px) {
            /* GLOBAL html/body font rule REMOVED */
            
            #fcw-settings-panel {
                /* Explicitly override scaling for ultra-tiny width */
                transform: scale(0.50) !important; /* Reduced for tiny windows */
                width: 300px !important; /* Fixed width base to scale down */
                left: 5px;
                padding: 10px; /* Increased from 6px */
                font-size: 14px !important; /* Increased to compensate */
            }
            #fcw-settings-panel * {
                font-size: 14px !important; /* Increased to compensate */
            }
            #fcw-settings-gear {
                width: 24px;
                height: 24px;
                left: 4px;
            }
            .profileNav, .btn {
                padding: 4px 8px !important;
                font-size: 9px !important;
            }
            .packStats {
                font-size: 8px !important;
            }
        }
            /* Special Walkout Flare (87+) - Discreet Pulse + Ripple */
            .fcw-fw17-special-effect {
                position: absolute;
                top: 50%;
                left: 50%;
                width: 300px;
                height: 300px;
                background: radial-gradient(circle, var(--fcw-effect-color, #ffd700) 0%, transparent 70%);
                border-radius: 50%;
                transform: translate(-50%, -50%) scale(0);
                opacity: 0;
                z-index: 5;
                pointer-events: none;
                mix-blend-mode: screen;
            }
            .fcw-fw17-special-effect::before {
                /* Central Flash */
                content: '';
                position: absolute;
                top: 50%; left: 50%;
                width: 100px; height: 100px;
                background: radial-gradient(circle, #fff 0%, transparent 60%);
                transform: translate(-50%, -50%);
                opacity: 0;
                border-radius: 50%;
            }
            .fcw-fw17-special-effect::after {
                /* Ripple Ring */
                content: '';
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                border: 1px solid var(--fcw-effect-color, #ffd700);
                border-radius: 50%;
                opacity: 0;
            }

            .fcw-fw17-special-effect.active {
                animation: fcwDiscreetPulse 2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            .fcw-fw17-special-effect.active::before {
                animation: fcwQuickFlash 2s ease-out forwards;
            }
            .fcw-fw17-special-effect.active::after {
                animation: fcwRippleOnly 2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }

            @keyframes fcwDiscreetPulse {
                0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
                40% { opacity: 0.5; transform: translate(-50%, -50%) scale(1.5); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(2); }
            }
            @keyframes fcwQuickFlash {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                20% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.2); }
                50% { opacity: 0; transform: translate(-50%, -50%) scale(1.5); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(1.5); }
            }
            @keyframes fcwRippleOnly {
                0% { transform: scale(0.8); opacity: 0; border-width: 2px; }
                30% { opacity: 0.6; }
                100% { transform: scale(1.2); opacity: 0; border-width: 0px; }
            }
    `;

        const styleNode = document.createElement('style');
        styleNode.id = 'fcw-dark-ui-style';
        styleNode.appendChild(document.createTextNode(appleCss));
        (document.head || document.documentElement).appendChild(styleNode);

        // 2b. Reveal the page now that styles are loaded (removes FOUC)
        // The critical.css hides the page with opacity:0, we reveal it by adding the ready class
        document.documentElement.classList.add('fcw-ready');

        // 3. UI Helper Functions
        function adjustColor(color, amount) {
            return '#' + color.replace(/^#/, '').replace(/../g, color => ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
        }

        // Performance: Debounce utility for input handlers
        function debounce(fn, delay) {
            let timer;
            return function (...args) {
                clearTimeout(timer);
                timer = setTimeout(() => fn.apply(this, args), delay);
            };
        }

        // Performance: Cache root element reference
        const docRoot = document.documentElement;

        // 4. Create Settings Interface
        const initInterface = () => {
            // Check if already injected
            if (document.getElementById('fcw-settings-gear')) return;

            // ... (rest of the interface creation code will follow in the function body)

            // Gear Button
            const gearBtn = document.createElement('div');
            gearBtn.id = 'fcw-settings-gear';
            gearBtn.title = "Settings (Press 'H' to toggle)";

            const svgNS = "http://www.w3.org/2000/svg";
            const gearSvg = document.createElementNS(svgNS, "svg");
            gearSvg.setAttribute("width", "24");
            gearSvg.setAttribute("height", "24");
            gearSvg.setAttribute("viewBox", "0 0 24 24");
            gearSvg.setAttribute("fill", "none");
            gearSvg.setAttribute("stroke", "currentColor");
            gearSvg.setAttribute("stroke-width", "2");
            gearSvg.setAttribute("stroke-linecap", "round");
            gearSvg.setAttribute("stroke-linejoin", "round");

            const circle = document.createElementNS(svgNS, "circle");
            circle.setAttribute("cx", "12");
            circle.setAttribute("cy", "12");
            circle.setAttribute("r", "3");
            gearSvg.appendChild(circle);

            const path = document.createElementNS(svgNS, "path");
            path.setAttribute("d", "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z");
            gearSvg.appendChild(path);

            gearBtn.appendChild(gearSvg);
            document.body.appendChild(gearBtn);

            // Panel
            const panel = document.createElement('div');
            panel.id = 'fcw-settings-panel';

            // Header - Clean Apple Style
            const header = document.createElement('div');
            header.style.cssText = `
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 16px;
                padding-bottom: 14px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.06);
            `;

            try {
                const logoUrl = chrome.runtime.getURL('icon.png');
                const img = document.createElement('img');
                img.src = logoUrl;
                img.style.cssText = `
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                `;
                header.appendChild(img);
            } catch (e) { /* Fallback */ }

            const titleContainer = document.createElement('div');
            const title = document.createElement('div');
            title.style.cssText = `
                margin: 0;
                color: #fff;
                font-size: 15px;
                font-weight: 600;
                letter-spacing: -0.02em;
            `;
            title.textContent = 'FCW Overhaul';
            titleContainer.appendChild(title);

            const subtitle = document.createElement('div');
            subtitle.style.cssText = `
                font-size: 11px;
                color: rgba(255, 255, 255, 0.4);
                margin-top: 2px;
            `;
            subtitle.textContent = 'Customize your experience';
            titleContainer.appendChild(subtitle);

            header.appendChild(titleContainer);
            panel.appendChild(header);

            // Content Wrapper
            const content = document.createElement('div');
            content.style.cssText = 'display: flex; flex-direction: column; gap: 16px;';
            panel.appendChild(content);

            // TAB NAVIGATION
            const tabNav = document.createElement('div');
            tabNav.style.cssText = 'display: flex; gap: 4px; background: rgba(0,0,0,0.2); padding: 4px; border-radius: 8px; margin-bottom: 4px;';

            const createTabBtn = (id, text, active = false) => {
                const btn = document.createElement('button');
                btn.className = active ? 'fcw-tab-btn active' : 'fcw-tab-btn';
                btn.textContent = text;
                btn.dataset.tab = id;
                btn.style.cssText = `
                    flex: 1;
                    background: ${active ? 'var(--fcw-accent)' : 'transparent'};
                    color: ${active ? '#fff' : 'rgba(255,255,255,0.6)'};
                    border: none;
                    padding: 6px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                `;
                return btn;
            };

            const mainTabBtn = createTabBtn('main', 'Main', true);
            const animTabBtn = createTabBtn('anim', 'Animation', false);
            const wheelTabBtn = createTabBtn('wheel', 'Wheel', false);

            tabNav.appendChild(mainTabBtn);
            tabNav.appendChild(animTabBtn);
            tabNav.appendChild(wheelTabBtn);
            content.appendChild(tabNav);

            // TABS CONTAINER
            const mainTab = document.createElement('div');
            mainTab.id = 'fcw-tab-main';
            mainTab.style.display = 'block';

            const animTab = document.createElement('div');
            animTab.id = 'fcw-tab-anim';
            animTab.style.display = 'none';

            const wheelTab = document.createElement('div');
            wheelTab.id = 'fcw-tab-wheel';
            wheelTab.style.display = 'none';

            content.appendChild(mainTab);
            content.appendChild(animTab);
            content.appendChild(wheelTab);

            // TAB SWITCHING LOGIC
            const switchTab = (tabId) => {
                // Reset all tabs
                mainTab.style.display = 'none';
                animTab.style.display = 'none';
                wheelTab.style.display = 'none';
                mainTabBtn.style.background = 'transparent';
                mainTabBtn.style.color = 'rgba(255,255,255,0.6)';
                animTabBtn.style.background = 'transparent';
                animTabBtn.style.color = 'rgba(255,255,255,0.6)';
                wheelTabBtn.style.background = 'transparent';
                wheelTabBtn.style.color = 'rgba(255,255,255,0.6)';

                // Activate selected
                if (tabId === 'main') {
                    mainTab.style.display = 'block';
                    mainTabBtn.style.background = 'var(--fcw-accent)';
                    mainTabBtn.style.color = '#fff';
                } else if (tabId === 'anim') {
                    animTab.style.display = 'block';
                    animTabBtn.style.background = 'var(--fcw-accent)';
                    animTabBtn.style.color = '#fff';
                } else if (tabId === 'wheel') {
                    wheelTab.style.display = 'block';
                    wheelTabBtn.style.background = 'var(--fcw-accent)';
                    wheelTabBtn.style.color = '#fff';
                }
            };

            mainTabBtn.addEventListener('click', () => switchTab('main'));
            animTabBtn.addEventListener('click', () => switchTab('anim'));
            wheelTabBtn.addEventListener('click', () => switchTab('wheel'));


            // --- MAIN TAB CONTENT ---

            // 1. Appearance Section (Moved to Main Tab)
            const appearanceGroup = document.createElement('div');
            appearanceGroup.style.cssText = 'display: flex; flex-direction: column; gap: 20px;';

            // Row: Accent Color & Scale
            const appearRow = document.createElement('div');
            appearRow.style.cssText = 'display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 16px;';

            // Accent
            const accentDiv = document.createElement('div');
            accentDiv.style.cssText = 'display: flex; flex-direction: column; gap: 6px; width: 45%;';
            const accentLabel = document.createElement('label');
            accentLabel.className = 'fcw-setting-label';
            accentLabel.textContent = 'Accent Color';
            accentDiv.appendChild(accentLabel);

            const accentInput = document.createElement('input');
            accentInput.type = 'color';
            accentInput.id = 'fcw-accent-input';
            accentInput.value = savedAccent;
            accentDiv.appendChild(accentInput);
            appearRow.appendChild(accentDiv);

            // Scale
            const scaleDiv = document.createElement('div');
            scaleDiv.style.cssText = 'display: flex; flex-direction: column; gap: 6px; width: 55%;';
            const scaleLabel = document.createElement('label');
            scaleLabel.className = 'fcw-setting-label';
            const scaleTitle = document.createElement('span');
            scaleTitle.textContent = 'Button Size';
            scaleLabel.appendChild(scaleTitle);
            const scaleVal = document.createElement('span');
            scaleVal.id = 'fcw-scale-val';
            scaleVal.textContent = savedScale + 'x';
            scaleVal.style.color = '#fff';
            scaleLabel.appendChild(scaleVal);
            scaleDiv.appendChild(scaleLabel);
            scaleDiv.appendChild(scaleLabel);

            const sizeInput = document.createElement('input');
            sizeInput.type = 'range';
            sizeInput.id = 'fcw-scale-input';
            sizeInput.min = '0.8';
            sizeInput.max = '1.5';
            sizeInput.step = '0.1';
            sizeInput.value = savedScale;
            scaleDiv.appendChild(sizeInput);
            appearRow.appendChild(scaleDiv);

            appearanceGroup.appendChild(appearRow);

            // 2. Buttons Grid (Vanilla / Glass)
            const toggleGrid = document.createElement('div');
            toggleGrid.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 12px;';

            // Vanilla
            const vanillaDiv = document.createElement('div');
            vanillaDiv.style.cssText = 'background: rgba(255,255,255,0.05); border-radius: 12px; padding: 12px; display: flex; flex-direction: column; align-items: center; gap: 8px;';
            const vanillaLabel = document.createElement('label');
            vanillaLabel.className = 'fcw-setting-label';
            vanillaLabel.textContent = 'Vanilla Mode';
            vanillaDiv.appendChild(vanillaLabel);

            const vanillaInput = document.createElement('input');
            vanillaInput.type = 'checkbox';
            vanillaInput.id = 'fcw-vanilla-input';
            if (savedVanilla) vanillaInput.checked = true;
            vanillaDiv.appendChild(vanillaInput);
            toggleGrid.appendChild(vanillaDiv);

            // Glass
            const glassDiv = document.createElement('div');
            glassDiv.style.cssText = 'background: rgba(255,255,255,0.05); border-radius: 12px; padding: 12px; display: flex; flex-direction: column; align-items: center; gap: 8px;';
            const glassLabel = document.createElement('label');
            glassLabel.className = 'fcw-setting-label';
            glassLabel.textContent = 'Glass Mode';
            glassDiv.appendChild(glassLabel);

            const glassInput = document.createElement('input');
            glassInput.type = 'checkbox';
            glassInput.id = 'fcw-glass-input';
            if (savedGlass) glassInput.checked = true;
            glassDiv.appendChild(glassInput);
            toggleGrid.appendChild(glassDiv);

            appearanceGroup.appendChild(toggleGrid);
            mainTab.appendChild(appearanceGroup); // Append to Main Tab

            // 3. Glass Options
            const glassOptRow = document.createElement('div');
            glassOptRow.id = 'fcw-glass-options';
            glassOptRow.style.cssText = `
                display: ${savedGlass ? 'flex' : 'none'};
                flex-direction: column;
                gap: 12px;
                background: rgba(var(--fcw-accent-rgb), 0.1);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 12px;
                padding: 12px;
                margin-top: 10px;
            `;

            const gOptInner = document.createElement('div');
            gOptInner.style.cssText = 'display: flex; align-items: center; gap: 12px;';

            const glColorInput = document.createElement('input');
            glColorInput.type = 'color';
            glColorInput.id = 'fcw-glass-color-input';
            glColorInput.value = savedGlassColor;
            glColorInput.style.width = '40px';
            glColorInput.style.flex = '0 0 auto';
            gOptInner.appendChild(glColorInput);

            const gOpDiv = document.createElement('div');
            gOpDiv.style.cssText = 'flex: 1; display: flex; flex-direction: column; gap: 4px;';

            const gOpLabel = document.createElement('label');
            gOpLabel.className = 'fcw-setting-label';
            gOpLabel.style.marginBottom = '0';
            const gOpText = document.createElement('span');
            gOpText.textContent = 'Blur';
            gOpLabel.appendChild(gOpText);
            const glBlurVal = document.createElement('span');
            glBlurVal.id = 'fcw-glass-blur-val';
            glBlurVal.textContent = (savedGlassBlur || 5) + 'px';
            glBlurVal.style.color = '#fff';
            gOpLabel.appendChild(glBlurVal);
            gOpDiv.appendChild(gOpLabel);

            const glBlurInput = document.createElement('input');
            glBlurInput.type = 'range';
            glBlurInput.id = 'fcw-glass-blur-input';
            glBlurInput.min = '0';
            glBlurInput.max = '20';
            glBlurInput.step = '1';
            glBlurInput.value = savedGlassBlur || 5;
            gOpDiv.appendChild(glBlurInput);

            gOptInner.appendChild(gOpDiv);
            glassOptRow.appendChild(gOptInner);
            mainTab.appendChild(glassOptRow); // Append to Main Tab

            // 4. Background Section (Main Tab)
            const bgGroup = document.createElement('div');
            bgGroup.style.cssText = 'border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px; margin-top: 16px;';

            const bgLabel = document.createElement('label');
            bgLabel.className = 'fcw-setting-label';
            bgLabel.textContent = 'Custom Wallpaper';
            bgGroup.appendChild(bgLabel);

            const bgControls = document.createElement('div');
            bgControls.style.cssText = 'display: flex; gap: 10px; align-items: center;';

            const bgInput = document.createElement('input');
            bgInput.type = 'file';
            bgInput.id = 'fcw-bg-input';
            bgInput.accept = 'image/*';
            bgInput.className = 'fcw-file-input';
            bgControls.appendChild(bgInput);

            const bgResetBtn = document.createElement('button');
            bgResetBtn.id = 'fcw-reset-bg';
            bgResetBtn.className = 'fcw-btn-small';
            bgResetBtn.textContent = 'Reset';
            bgResetBtn.style.height = '32px';
            bgControls.appendChild(bgResetBtn);

            bgGroup.appendChild(bgControls);
            mainTab.appendChild(bgGroup); // Append to Main Tab

            // --- WHEEL TAB CONTENT ---
            wheelTab.style.paddingTop = '4px';
            const wheelGroup = document.createElement('div');
            wheelGroup.style.cssText = 'padding-top: 8px;';

            const wheelLabel = document.createElement('label');
            wheelLabel.className = 'fcw-setting-label';
            wheelLabel.textContent = 'Pointer Style';
            wheelGroup.appendChild(wheelLabel);

            const pointerOptions = [
                { label: 'Kylian Mbappe', url: '' },
                { label: 'Lamine Yamal', url: 'https://i.ibb.co/Qj6gLT83/pointer-2.png' },
                { label: 'Bukayo Saka', url: 'https://i.ibb.co/G41sZBxK/pointer-3.png' },
                { label: 'Lebron James', url: 'https://i.ibb.co/gK8GGmC/pointer-4.png' },
                { label: 'Bruno Fernandes', url: 'https://i.ibb.co/PZHjMXMK/pointer-5.png' },
                { label: 'Eden Hazard', url: 'https://i.ibb.co/hRYP2vsR/pointer-6.png' },
                { label: 'Mohamed Salah', url: 'https://i.ibb.co/ds3C8ymt/pointer-7.png' },
                { label: 'Kevin De Bruyne', url: 'https://i.ibb.co/Q3B5RcnG/pointer-8.png' },
            ];

            const savedPointer = localStorage.getItem('fcw_wheel_pointer') || '';

            const thumbRow = document.createElement('div');
            thumbRow.style.cssText = 'display: flex; gap: 10px; margin-top: 8px; flex-wrap: wrap;';

            pointerOptions.forEach(opt => {
                const thumb = document.createElement('div');
                const isSelected = (savedPointer === opt.url);
                thumb.style.cssText = `
                        padding: 8px 16px;
                        border-radius: 8px;
                        border: 2px solid ${isSelected ? 'var(--fcw-accent)' : 'rgba(255,255,255,0.1)'};
                        background: rgba(255,255,255,0.05);
                        cursor: pointer;
                        display: flex; align-items: center; justify-content: center;
                        transition: border-color 0.2s, transform 0.15s;
                        position: relative;
                        flex: 1 1 calc(50% - 10px);
                        min-width: 100px;
                    `;
                thumb.title = opt.label;

                const textSpan = document.createElement('span');
                textSpan.textContent = opt.label;
                textSpan.style.cssText = `
                    color: ${isSelected ? '#fff' : 'rgba(255,255,255,0.7)'}; 
                    font-size: 12px; 
                    font-weight: 600; 
                    text-align: center;
                `;
                thumb.appendChild(textSpan);

                // Hover effects
                thumb.addEventListener('mouseenter', () => {
                    thumb.style.borderColor = 'var(--fcw-accent)';
                    textSpan.style.color = '#fff';
                    thumb.style.transform = 'scale(1.02)';
                });
                thumb.addEventListener('mouseleave', () => {
                    const sel = localStorage.getItem('fcw_wheel_pointer') || '';
                    thumb.style.borderColor = (sel === opt.url) ? 'var(--fcw-accent)' : 'rgba(255,255,255,0.1)';
                    textSpan.style.color = (sel === opt.url) ? '#fff' : 'rgba(255,255,255,0.7)';
                    thumb.style.transform = 'scale(1)';
                });

                // Click handler
                thumb.addEventListener('click', () => {
                    localStorage.setItem('fcw_wheel_pointer', opt.url);
                    // Update borders and text colors on all thumbs
                    thumbRow.querySelectorAll('div').forEach((t) => {
                        t.style.borderColor = 'rgba(255,255,255,0.1)';
                        t.querySelector('span').style.color = 'rgba(255,255,255,0.7)';
                    });
                    thumb.style.borderColor = 'var(--fcw-accent)';
                    textSpan.style.color = '#fff';

                    // Apply pointer to page
                    const wpEl = document.querySelector('img.wheel-pointer');
                    if (wpEl) {
                        wpEl.src = opt.url || 'https://cdn.fc-watch.com/img/26/spin-the-wheel/pointer.png';
                    }
                });

                thumbRow.appendChild(thumb);
            });

            wheelGroup.appendChild(thumbRow);
            wheelTab.appendChild(wheelGroup);

            // Apply saved pointer on load
            const applyWheelPointer = () => {
                const saved = localStorage.getItem('fcw_wheel_pointer');
                if (saved) {
                    const wpEl = document.querySelector('img.wheel-pointer');
                    if (wpEl) {
                        wpEl.src = saved;
                    }
                }
            };

            // Try immediately, and also observe for when the wheel-pointer image is added
            applyWheelPointer();
            const wpObserver = new MutationObserver(() => {
                applyWheelPointer();
                if (document.querySelector('img.wheel-pointer')) {
                    wpObserver.disconnect();
                }
            });
            wpObserver.observe(document.body, { childList: true, subtree: true });

            // --- ANIMATION TAB CONTENT ---

            // 5. Animation Section
            const animGroup = document.createElement('div');
            animGroup.style.cssText = 'padding-top: 4px;';

            const animLabel = document.createElement('label');
            animLabel.className = 'fcw-setting-label';
            animLabel.textContent = 'Pack Animation Style';
            animGroup.appendChild(animLabel);

            const animOptions = document.createElement('div');
            animOptions.style.cssText = 'display: flex; flex-direction: column; gap: 12px; margin-top: 8px;';

            const savedAnimStyle = localStorage.getItem('fcw_pack_animation_style') || 'classic';

            // Classic -> FIFA 14 option
            const classicLabel = document.createElement('label');
            classicLabel.style.cssText = 'display: flex; align-items: center; gap: 12px; cursor: pointer; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 12px; transition: background 0.2s;';
            const classicRadio = document.createElement('input');
            classicRadio.type = 'radio';
            classicRadio.name = 'fcw-anim-style';
            classicRadio.value = 'fifa14';
            classicRadio.checked = (savedAnimStyle === 'classic' || savedAnimStyle === 'fifa14');
            classicRadio.style.cssText = 'accent-color: var(--fcw-accent); transform: scale(1.2);';
            classicLabel.appendChild(classicRadio);

            const classicInfo = document.createElement('div');
            classicInfo.style.display = 'flex';
            classicInfo.style.flexDirection = 'column';
            const classicTitle = document.createElement('span');
            classicTitle.textContent = 'FIFA 14';
            classicTitle.style.cssText = 'color: #fff; font-weight: 600; font-size: 14px;';
            const classicDesc = document.createElement('span');
            classicDesc.textContent = 'Classic hex tiles & gold ball animation';
            classicDesc.style.cssText = 'color: rgba(255,255,255,0.5); font-size: 11px; margin-top: 2px;';
            classicInfo.appendChild(classicTitle);
            classicInfo.appendChild(classicDesc);
            classicLabel.appendChild(classicInfo);

            animOptions.appendChild(classicLabel);

            // Walkout -> FW 17 option
            const walkoutLabel = document.createElement('label');
            walkoutLabel.style.cssText = 'display: flex; align-items: center; gap: 12px; cursor: pointer; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 12px; transition: background 0.2s;';
            const walkoutRadio = document.createElement('input');
            walkoutRadio.type = 'radio';
            walkoutRadio.name = 'fcw-anim-style';
            walkoutRadio.value = 'fw17';
            walkoutRadio.checked = (savedAnimStyle === 'walkout' || savedAnimStyle === 'fw17');
            walkoutRadio.style.cssText = 'accent-color: var(--fcw-accent); transform: scale(1.2);';
            walkoutLabel.appendChild(walkoutRadio);

            const walkoutInfo = document.createElement('div');
            walkoutInfo.style.display = 'flex';
            walkoutInfo.style.flexDirection = 'column';
            const walkoutTitle = document.createElement('span');
            walkoutTitle.textContent = 'FW 17';
            walkoutTitle.style.cssText = 'color: #fff; font-weight: 600; font-size: 14px;';
            const walkoutDesc = document.createElement('span');
            walkoutDesc.textContent = 'Layered card reveal with site background';
            walkoutDesc.style.cssText = 'color: rgba(255,255,255,0.5); font-size: 11px; margin-top: 2px;';
            walkoutInfo.appendChild(walkoutTitle);
            walkoutInfo.appendChild(walkoutDesc);
            walkoutLabel.appendChild(walkoutInfo);

            animOptions.appendChild(walkoutLabel);

            // Hover effects
            [classicLabel, walkoutLabel].forEach(lbl => {
                lbl.addEventListener('mouseenter', () => lbl.style.background = 'rgba(255,255,255,0.08)');
                lbl.addEventListener('mouseleave', () => lbl.style.background = 'rgba(255,255,255,0.05)');
            });

            animGroup.appendChild(animOptions);
            animTab.appendChild(animGroup); // Append to Animation Tab

            // Animation style change handlers
            classicRadio.addEventListener('change', () => {
                if (classicRadio.checked) localStorage.setItem('fcw_pack_animation_style', 'fifa14');
            });
            walkoutRadio.addEventListener('change', () => {
                if (walkoutRadio.checked) localStorage.setItem('fcw_pack_animation_style', 'fw17');
            });

            // Hints
            const hintDiv = document.createElement('div');
            hintDiv.className = 'fcw-hint';
            hintDiv.style.textAlign = 'center';
            hintDiv.style.marginTop = '4px';
            hintDiv.innerHTML = "Press <b>'H'</b> to toggle settings";
            content.appendChild(hintDiv);

            document.body.appendChild(panel);

            // Toggle visibility
            gearBtn.addEventListener('click', () => {
                panel.classList.toggle('visible');
            });

            // 5. Logic: Change Accent Color (debounced for performance)
            // const colorInput = document.getElementById('fcw-accent-input'); // Created above as accentInput
            // Helper: Debounce
            const debounce = (fn, delay) => {
                let timer;
                return (...args) => {
                    clearTimeout(timer);
                    timer = setTimeout(() => fn(...args), delay);
                };
            };

            // 5. Logic: Change Accent Color (debounced for performance)
            // const colorInput = document.getElementById('fcw-accent-input'); // Created above as accentInput
            const updateAccentColor = debounce((val) => {
                // Save to local (legacy)
                localStorage.setItem('fcw_accent_color', val);

                // Save to Navbar Settings (Master)
                try {
                    let current = JSON.parse(localStorage.getItem('fcw_navbar_settings')) || {};
                    current.accent = val;
                    if (!current.opacity) current.opacity = 0.90;
                    if (!current.blur) current.blur = 12;
                    if (!current.font) current.font = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
                    localStorage.setItem('fcw_navbar_settings', JSON.stringify(current));
                } catch (ex) {
                    console.error("Error syncing to navbar settings", ex);
                }
            }, 150); // Debounce localStorage writes

            let accentRafId = null;
            accentInput.addEventListener('input', (e) => {
                const val = e.target.value;

                // Optimized Visual Update (RAF)
                if (accentRafId) cancelAnimationFrame(accentRafId);
                accentRafId = requestAnimationFrame(() => {
                    docRoot.style.setProperty('--accent-blue', val);
                    docRoot.style.setProperty('--fcw-accent', val);
                    // Also set on body for maximum coverage
                    if (document.body) document.body.style.setProperty('--fcw-accent', val);
                    // Dispatch event for same-page sync (modernizer.js)
                    window.dispatchEvent(new CustomEvent('fcw-accent-changed', { detail: { accent: val } }));
                    accentRafId = null;
                });

                // Debounced storage
                updateAccentColor(val);
            });

            // 6. Logic: Button Scale (debounced storage)
            // const scaleInput = document.getElementById('fcw-scale-input'); // Created above as sizeInput
            // const scaleValDisplay = document.getElementById('fcw-scale-val'); // Created above as sizeVal
            const saveScale = debounce((val) => localStorage.setItem('fcw_btn_scale', val), 150);

            sizeInput.addEventListener('input', (e) => {
                const val = e.target.value;
                scaleVal.textContent = val + 'x'; // Corrected variable name
                docRoot.style.setProperty('--btn-scale', val);
                saveScale(val);
            });

            // 7. Logic: Background Image (Hybrid: LocalStorage < 3MB, IndexedDB > 3MB)
            // const fileInput = document.getElementById('fcw-bg-input'); // Created above as bgInput
            // const resetBtn = document.getElementById('fcw-reset-bg'); // Created above as bgResetBtn
            // const vanillaInput = document.getElementById('fcw-vanilla-input'); // Created above as vanillaInput

            // 7.5. Logic: Vanilla Buttons Toggle
            vanillaInput.addEventListener('change', (e) => {
                const isChecked = e.target.checked;
                localStorage.setItem('fcw_vanilla_buttons', isChecked);
                if (isChecked) {
                    document.documentElement.classList.add('fcw-vanilla-buttons');
                    document.body.classList.add('fcw-vanilla-buttons');
                } else {
                    document.documentElement.classList.remove('fcw-vanilla-buttons');
                    document.body.classList.remove('fcw-vanilla-buttons');
                }
            });


            // 7.6. Logic: Glass Buttons Toggle & Options
            // const glassInput = document.getElementById('fcw-glass-input'); // Created above as glassInput
            // const glassOptions = document.getElementById('fcw-glass-options'); // Created above as glassOptRow
            // const glassColorInput = document.getElementById('fcw-glass-color-input'); // Created above as glColorInput
            // const glassOpacityInput = document.getElementById('fcw-glass-opacity-input'); // Created above as glOpInput
            // const glassOpacityVal = document.getElementById('fcw-glass-opacity-val'); // Created above as glOpVal

            glassInput.addEventListener('change', (e) => {
                const isChecked = e.target.checked;
                localStorage.setItem('fcw_glass_buttons', isChecked);
                glassOptRow.style.display = isChecked ? 'block' : 'none';
                if (isChecked) {
                    document.body.classList.add('fcw-glass-buttons');
                } else {
                    document.body.classList.remove('fcw-glass-buttons');
                }
            });

            glColorInput.addEventListener('input', (e) => {
                const val = e.target.value;
                docRoot.style.setProperty('--fcw-glass-color', val);
                localStorage.setItem('fcw_glass_color', val);
            });

            glBlurInput.addEventListener('input', (e) => {
                const val = e.target.value;
                glBlurVal.textContent = val + 'px';
                docRoot.style.setProperty('--fcw-glass-blur', val + 'px');
                localStorage.setItem('fcw_glass_blur', val);
            });


            // (IndexedDB helper 'fcwDB' is defined globally at script start)

            bgInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;

                console.log('[FCW] File selected:', file.name, 'Size:', (file.size / 1024 / 1024).toFixed(2) + 'MB');

                // Updated Limit: 50MB
                if (file.size > 50 * 1024 * 1024) {
                    alert("Image too large (Max 50MB).");
                    return;
                }

                // For ALL files, create immediate preview using blob URL (fast, no memory issues)
                const blobUrl = URL.createObjectURL(file);
                document.documentElement.style.setProperty('--custom-bg-image', `url("${blobUrl}")`);
                console.log('[FCW] Preview set via blob URL');

                // 1. Generate Static Preview (Sync LocalStorage)
                // Mirrors logic from modernizer.js for seamless loading
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800; // Slightly larger for global bg
                    let width = img.width;
                    let height = img.height;

                    if (width > MAX_WIDTH) {
                        height = Math.round(height * (MAX_WIDTH / width));
                        width = MAX_WIDTH;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    const previewDataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    try {
                        localStorage.setItem('fcw_bg_preview', previewDataUrl);
                        console.log('[FCW] Static background preview saved to localStorage');
                    } catch (e) {
                        console.warn('[FCW] Failed to save bg preview', e);
                    }
                };
                img.src = blobUrl;

                if (file.size < 2.5 * 1024 * 1024) {
                    // Small file: Also save to LocalStorage for persistence
                    const reader = new FileReader();
                    reader.onload = function (evt) {
                        const result = evt.target.result;
                        try {
                            localStorage.setItem('fcw_bg_image', result);
                            localStorage.setItem('fcw_bg_storage_mode', 'local');
                            fcwDB.delete('custom_bg').catch(() => { }); // Cleanup DB silently
                            console.log('[FCW] Small file saved to LocalStorage');
                        } catch (err) {
                            console.warn("[FCW] LocalStorage full, saving to IndexedDB...", err);
                            saveToDB(file);
                        }
                    };
                    reader.readAsDataURL(file);
                } else {
                    // Large file: Store Blob in IndexedDB for persistence
                    console.log('[FCW] Large file - saving to IndexedDB...');
                    saveToDB(file);
                }
            });

            function saveToDB(blobData) {
                console.log('[FCW] saveToDB called, data type:', blobData instanceof Blob ? 'Blob' : typeof blobData);

                fcwDB.put('custom_bg', blobData).then(() => {
                    localStorage.setItem('fcw_bg_storage_mode', 'db');
                    localStorage.removeItem('fcw_bg_image');
                    console.log('[FCW] Successfully saved to IndexedDB!');
                }).catch(err => {
                    console.error('[FCW] IndexedDB save failed:', err);
                    // Image is still showing via blob URL, just won't persist
                    alert("Note: Image set but may not persist after page reload (storage error).");
                });
            }

            bgResetBtn.addEventListener('click', () => {
                // Clear stored custom background
                localStorage.removeItem('fcw_bg_image');
                localStorage.removeItem('fcw_bg_storage_mode');
                localStorage.removeItem('fcw_bg_preview'); // Clear static preview
                fcwDB.delete('custom_bg');
                // Restore the default FC-Watch background
                const defaultBg = 'https://cdn.fc-watch.com/img/26/homepage/bg.png';
                docRoot.style.setProperty('--custom-bg-image', `url("${defaultBg}")`);
                bgInput.value = '';
                console.log('[FCW] Background reset to default');
            });

            // 8. Logic: Hotkey 'H' to hide gear (passive for performance)
            document.addEventListener('keydown', (e) => {
                // Check if user is typing in an input field to avoid accidental toggles
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

                if (e.key.toLowerCase() === 'h') {
                    gearBtn.classList.toggle('hidden');
                    // If we hide the gear, also close the panel
                    if (gearBtn.classList.contains('hidden')) {
                        panel.classList.remove('visible');
                    }
                }
            }, { passive: true });
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initInterface);
        } else {
            initInterface();
        }

        // =====================================================
        // PACK ANIMATION FEATURE
        // =====================================================

        // --- CSS for Pack Animation (FUTGenie Style) ---
        const packAnimCss = `
            /* Pack Animation Toggle - Modern Apple Style */
            .fcw-pack-anim-container {
                margin-top: 16px;
                padding-top: 16px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }

            .fcw-pack-anim-toggle {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 12px 16px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.2s ease;
                border: 1px solid rgba(255, 255, 255, 0.08);
            }

            .fcw-pack-anim-toggle:hover {
                background: rgba(255, 255, 255, 0.08);
                border-color: rgba(255, 255, 255, 0.15);
            }

            .fcw-pack-anim-label {
                display: flex;
                align-items: center;
                gap: 10px;
                color: #fff;
                font-size: 13px;
                font-weight: 500;
                letter-spacing: 0.02em;
            }

            .fcw-pack-anim-icon {
                width: 20px;
                height: 20px;
                opacity: 0.8;
            }

            /* iOS-style Switch */
            .fcw-pack-anim-switch {
                position: relative;
                width: 48px;
                height: 28px;
                background: rgba(120, 120, 128, 0.32);
                border-radius: 14px;
                transition: background 0.3s ease;
                flex-shrink: 0;
            }

            .fcw-pack-anim-switch::after {
                content: '';
                position: absolute;
                top: 2px;
                left: 2px;
                width: 24px;
                height: 24px;
                background: #fff;
                border-radius: 50%;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .fcw-pack-anim-switch.active {
                background: var(--fcw-accent, #007aff);
            }

            .fcw-pack-anim-switch.active::after {
                transform: translateX(20px);
            }

            /* Card Animation Classes */
            .cardtype.fcw-anim-hidden {
                opacity: 0 !important;
                transform: scale(0.8) translateY(30px) !important;
                filter: blur(8px) !important;
                transition: transform 0.5s ease, opacity 0.5s ease !important;
            }

            .cardtype.fcw-anim-reveal {
                transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
                opacity: 1 !important;
                transform: scale(1) translateY(0) !important;
                filter: blur(0) !important;
            }

            .cardtype.fcw-anim-reveal-instant {
                opacity: 1 !important;
                transform: scale(1) translateY(0) !important;
                filter: blur(0) !important;
                transition: none !important;
            }

            body.fcw-pack-anim-on .cardtype:not(.fcw-anim-processed):not(.fcw-anim-hidden):not(.fcw-anim-reveal):not(.fcw-anim-reveal-instant) {
                opacity: 0 !important;
                visibility: hidden !important;
            }

            /* ========== FUTGENIE CLASSIC PACK ANIMATION ========== */
            .fcw-classic-pack-animation {
                position: fixed;
                inset: 0;
                z-index: 1000002;
                background: rgba(0,0,0,0.85);
                overflow: hidden;
                pointer-events: auto;
                cursor: pointer;
                opacity: 0;
                animation: fcwOverlayFadeIn 0.3s ease forwards;
            }
            @keyframes fcwOverlayFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            .fcw-classic-pack-animation.fade-out {
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            .fcw-classic-pack-animation .classic-pack-flash {
                position: absolute;
                inset: 0;
                background: #ffffff;
                opacity: 0;
            }
            .fcw-classic-pack-animation .classic-pack-flash.show {
                animation: fcwClassicPackFlash 0.3s ease;
            }
            @keyframes fcwClassicPackFlash {
                0% { opacity: 0; }
                30% { opacity: 0.9; }
                100% { opacity: 0; }
            }
            .fcw-classic-pack-animation .classic-pack-tiles {
                position: absolute;
                inset: 0;
            }
            .fcw-classic-pack-animation .classic-pack-ball {
                position: absolute;
                left: 50%;
                top: 50%;
                height: 70vh;
                width: auto;
                max-width: 90vw;
                max-height: 70vh;
                transform: translate(-50%,-50%);
                opacity: 0;
                transition: opacity 0.2s ease;
                object-fit: contain;
                pointer-events: none;
                z-index: 1;
            }
            .fcw-classic-pack-animation .classic-pack-ball.show {
                opacity: 1;
            }
            .fcw-classic-pack-animation .classic-pack-ball.fade-out {
                opacity: 0;
                transition: opacity 0.2s ease;
            }
            .fcw-classic-pack-animation .classic-pack-hex {
                position: absolute;
                width: 200px;
                height: 200px;
                transform: translate(-50%,-50%) scale(0.9);
                opacity: 0;
                transition: transform 0.8s ease, opacity 0.6s ease, left 1.1s ease, top 1.1s ease;
                filter: drop-shadow(0 12px 30px rgba(0,0,0,0.45));
                border-radius: 16px;
                object-fit: cover;
            }
            .fcw-classic-pack-animation .classic-pack-hex.show {
                opacity: 0.95;
                transform: translate(-50%,-50%) scale(1);
            }
            .fcw-classic-pack-animation .classic-pack-hex.reveal {
                opacity: 0;
                transform: translate(-50%,-50%) rotateY(180deg) scale(0.6);
            }
            .fcw-classic-pack-animation .classic-pack-hex.lineup {
                opacity: 0.95;
                transform: translate(-50%,-50%) scale(0.85);
            }
            .fcw-classic-pack-animation .classic-pack-card {
                position: absolute;
                transform: translate(-50%,-50%) scale(0);
                opacity: 0;
                transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
                z-index: 10;
            }
            .fcw-classic-pack-animation .classic-pack-card.show {
                opacity: 1;
                transform: translate(-50%,-50%) scale(1.2);
            }
            .fcw-classic-pack-animation .classic-pack-card.hide {
                opacity: 0;
                transform: translate(-50%,-50%) scale(1);
                transition: opacity 0.4s ease, transform 0.4s ease;
            }

            /* ========== FW 17 ANIMATION (Layered Reveal) ========== */
            .fcw-fw17-animation {
                position: fixed;
                inset: 0;
                z-index: 1000002;
                background: rgba(0,0,0,0.65); /* More transparent */
                backdrop-filter: blur(2px);
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                animation: fcwFW17FadeIn 0.3s ease forwards;
                pointer-events: auto;
                cursor: pointer;
            }
            @keyframes fcwFW17FadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            .fcw-fw17-animation.fade-out {
                opacity: 0;
                transition: opacity 0.4s ease;
            }

            .fcw-fw17-stage {
                position: relative;
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                perspective: 1000px;
            }

            /* The Card Container */
            .fcw-fw17-card {
                position: relative;
                transform: scale(1.6); /* Slightly larger */
                transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
                transform-style: preserve-3d;
                background-size: cover;
                background-position: center;
                /* Ensure visibility */
                opacity: 1 !important;
                visibility: visible !important;
                display: block !important;
            }

            
            /* Hide elements initially for reveal */
            .fcw-fw17-card .position26, 
            .fcw-fw17-card .flag26,
            .fcw-fw17-card .club26,
            .fcw-fw17-card .playerimagefifa26,
            .fcw-fw17-card .rating26,
            .fcw-fw17-card .name26,
            .fcw-fw17-card .attr {
                opacity: 0;
                transition: opacity 0.5s ease;
            }

            /* Reveal States - Force opacity override */
            .fcw-fw17-card.reveal-info .position26,
            .fcw-fw17-card.reveal-info .flag26 {
                opacity: 1 !important;
                transition: opacity 0.5s ease;
            }
            
            .fcw-fw17-card.reveal-club .club26 {
                opacity: 1 !important;
                transition: opacity 0.5s ease;
            }

            .fcw-fw17-card.reveal-face .playerimagefifa26 {
                opacity: 1 !important;
                transition: opacity 0.5s ease;
            }

            .fcw-fw17-card.reveal-full .rating26,
            .fcw-fw17-card.reveal-full .name26,
            .fcw-fw17-card.reveal-full .attr {
                opacity: 1 !important;
                transition: opacity 0.5s ease;
            }

            /* Pulsing silhouette (Behind player image) */
            .fcw-fw17-silhouette {
                position: absolute;
                top: 15%;
                left: 10%;
                width: 80%;
                height: 60%;
                background: linear-gradient(180deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.4) 50%, rgba(255,215,0,0.1) 100%);
                filter: blur(25px);
                border-radius: 50%;
                opacity: 0;
                z-index: 1;
                pointer-events: none;
            }
            .fcw-fw17-silhouette.show {
                animation: fcwSilhouettePulse 1.2s ease-in-out infinite;
            }

            .fcw-card-reveal {
                position: fixed;
                inset: 0;
                z-index: 1000001;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(0,0,0,0.9);
            }
            .fcw-card-reveal.fade-out {
                opacity: 0;
                transition: opacity 0.4s ease;
            }
            .fcw-card-reveal .card-reveal-vignette {
                position: absolute;
                inset: 0;
                background: radial-gradient(circle at center, transparent 20%, rgba(0,0,0,0.7) 70%);
                pointer-events: none;
            }
            .fcw-card-reveal .card-reveal-particles {
                position: absolute;
                inset: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 1;
            }
            .fcw-card-reveal .card-reveal-glow {
                --reveal-glow-color: #ffd700;
                position: absolute;
                width: 350px;
                height: 500px;
                border-radius: 20px;
                background: radial-gradient(ellipse at center, var(--reveal-glow-color) 0%, transparent 70%);
                opacity: 0;
                filter: blur(40px);
                z-index: 2;
                transition: opacity 0.5s ease;
            }
            .fcw-card-reveal .card-reveal-glow.pulse {
                animation: fcwCardRevealGlowPulse 1.5s ease-in-out;
            }
            @keyframes fcwCardRevealGlowPulse {
                0% { opacity: 0; transform: scale(0.8); }
                30% { opacity: 0.9; transform: scale(1.3); }
                60% { opacity: 0.6; transform: scale(1.1); }
                100% { opacity: 0.4; transform: scale(1); }
            }
            .fcw-card-reveal .card-reveal-container {
                position: relative;
                z-index: 3;
                transform: scale(0) rotateY(180deg) rotateX(20deg);
                opacity: 0;
                filter: brightness(2);
                transform-style: preserve-3d;
                perspective: 1000px;
            }
            .fcw-card-reveal .card-reveal-container.reveal-stage-1 {
                animation: fcwCardRevealEnter 0.8s cubic-bezier(0.34,1.56,0.64,1) forwards;
            }
            @keyframes fcwCardRevealEnter {
                0% { transform: scale(0) rotateY(180deg) rotateX(20deg); opacity: 0; filter: brightness(2); }
                50% { opacity: 1; filter: brightness(1.5); }
                100% { transform: scale(1.3) rotateY(0deg) rotateX(0deg); opacity: 1; filter: brightness(1.2); }
            }
            .fcw-card-reveal .card-reveal-container.reveal-stage-2 {
                animation: fcwCardRevealBurst 0.6s cubic-bezier(0.68,-0.55,0.265,1.55) forwards;
                opacity: 1;
            }
            @keyframes fcwCardRevealBurst {
                0% { transform: scale(1.3) rotateY(0deg); filter: brightness(1.2); }
                30% { transform: scale(1.3) rotateY(5deg); filter: brightness(1.5); }
                60% { transform: scale(1.15) rotateY(-3deg); filter: brightness(1.1); }
                100% { transform: scale(1.2) rotateY(0deg); filter: brightness(1); }
            }
            .fcw-card-reveal .card-reveal-container.reveal-stage-3 {
                animation: fcwCardRevealSettle 0.8s ease-out forwards;
                opacity: 1;
                filter: brightness(1);
            }
            @keyframes fcwCardRevealSettle {
                0% { transform: scale(1.2); }
                50% { transform: scale(1.15); }
                100% { transform: scale(1.1); }
            }



            /* WALKOUT OVERLAY STYLES - PREMIUM */
            #fcw-walkout-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: radial-gradient(ellipse at center, #1a1a2e 0%, #0f0f1a 50%, #000 100%);
                z-index: 99999;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.45s ease;
                overflow: hidden;
            }
            #fcw-walkout-overlay.active {
                opacity: 1;
                pointer-events: all;
            }
            
            /* Subtle Ambient Glow - inherits from overlay background */
            #fcw-walkout-overlay::before {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 120%;
                height: 120%;
                background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 60%);
                transform: translate(-50%, -50%);
                pointer-events: none;
                animation: fcw-ambient-pulse 3s ease-in-out infinite;
            }
            @keyframes fcw-ambient-pulse {
                0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
                50% { opacity: 0.6; transform: translate(-50%, -50%) scale(1.1); }
            }

            /* Spotlight Beams */
            .fcw-wo-spotlight {
                position: absolute;
                width: 200px;
                height: 100vh;
                background: linear-gradient(to top, rgba(255,215,0,0.3) 0%, transparent 70%);
                bottom: 0;
                transform-origin: bottom center;
                opacity: 0;
                filter: blur(30px);
            }
            .fcw-wo-spotlight-left {
                left: 25%;
                transform: rotate(-15deg);
                animation: fcw-spotlight-in 0.8s 0.3s ease-out forwards;
            }
            .fcw-wo-spotlight-right {
                right: 25%;
                transform: rotate(15deg);
                animation: fcw-spotlight-in 0.8s 0.5s ease-out forwards;
            }
            @keyframes fcw-spotlight-in {
                0% { opacity: 0; }
                100% { opacity: 0.6; }
            }
            
            /* ROTATING LIGHT RAYS - Behind everything */
            .fcw-wo-rays {
                position: absolute;
                top: 50%;
                left: 50%;
                width: 200%;
                height: 200%;
                transform: translate(-50%, -50%);
                background: conic-gradient(
                    from 0deg,
                    transparent 0deg,
                    rgba(255,215,0,0.08) 10deg,
                    transparent 20deg,
                    transparent 40deg,
                    rgba(255,215,0,0.08) 50deg,
                    transparent 60deg,
                    transparent 80deg,
                    rgba(255,215,0,0.08) 90deg,
                    transparent 100deg,
                    transparent 120deg,
                    rgba(255,215,0,0.08) 130deg,
                    transparent 140deg,
                    transparent 160deg,
                    rgba(255,215,0,0.08) 170deg,
                    transparent 180deg,
                    transparent 200deg,
                    rgba(255,215,0,0.08) 210deg,
                    transparent 220deg,
                    transparent 240deg,
                    rgba(255,215,0,0.08) 250deg,
                    transparent 260deg,
                    transparent 280deg,
                    rgba(255,215,0,0.08) 290deg,
                    transparent 300deg,
                    transparent 320deg,
                    rgba(255,215,0,0.08) 330deg,
                    transparent 340deg,
                    transparent 360deg
                );
                animation: fcw-rays-rotate 20s linear infinite;
                pointer-events: none;
                z-index: 1;
            }
            @keyframes fcw-rays-rotate {
                0% { transform: translate(-50%, -50%) rotate(0deg); }
                100% { transform: translate(-50%, -50%) rotate(360deg); }
            }
            
            /* PULSING RING Effect */
            .fcw-wo-ring {
                position: absolute;
                top: 50%;
                left: 50%;
                width: 300px;
                height: 300px;
                border: 3px solid rgba(255,215,0,0.4);
                border-radius: 50%;
                transform: translate(-50%, -50%) scale(0);
                opacity: 0;
                pointer-events: none;
                z-index: 2;
            }
            .fcw-wo-ring.pulse {
                animation: fcw-ring-pulse 1.5s ease-out forwards;
            }
            @keyframes fcw-ring-pulse {
                0% { transform: translate(-50%, -50%) scale(0); opacity: 1; border-width: 3px; }
                100% { transform: translate(-50%, -50%) scale(4); opacity: 0; border-width: 1px; }
            }
            
            /* FLOATING DUST Particles */
            .fcw-wo-dust {
                position: absolute;
                width: 4px;
                height: 4px;
                background: rgba(255,215,0,0.6);
                border-radius: 50%;
                pointer-events: none;
                z-index: 3;
                animation: fcw-dust-float 4s ease-in-out infinite;
            }
            @keyframes fcw-dust-float {
                0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
                25% { transform: translateY(-20px) translateX(10px); opacity: 0.8; }
                50% { transform: translateY(-40px) translateX(-5px); opacity: 0.5; }
                75% { transform: translateY(-20px) translateX(-10px); opacity: 0.8; }
            }

            /* Walkout Elements Container */
            .fcw-wo-container {
                position: relative;
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 10;
            }

            /* Individual Walkout Elements */
            .fcw-wo-elem {
                position: absolute;
                opacity: 0;
                transform: scale(0.5);
                transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }

            /* Nation Flag - Native Size, Sharp */
            .fcw-wo-nation {
                width: 100px;
                height: auto;
                z-index: 10;
                filter: drop-shadow(0 5px 20px rgba(0,0,0,0.9));
                image-rendering: -webkit-optimize-contrast;
                image-rendering: crisp-edges;
            }
            
            /* Club Badge - Native Size, Sharp */
            .fcw-wo-club {
                width: 120px;
                height: auto;
                z-index: 11;
                filter: drop-shadow(0 5px 20px rgba(0,0,0,0.9));
                image-rendering: -webkit-optimize-contrast;
                image-rendering: crisp-edges;
            }
            
            /* Position Text - Metallic Gold Gradient */
            .fcw-wo-position {
                font-family: 'Arial Black', 'Helvetica Neue', sans-serif;
                font-size: 180px;
                font-weight: 900;
                letter-spacing: 10px;
                background: linear-gradient(180deg, #fff 0%, #ffd700 30%, #b8860b 60%, #ffd700 80%, #fff 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                filter: drop-shadow(0 0 30px rgba(255,215,0,0.8)) drop-shadow(0 5px 15px rgba(0,0,0,0.5));
                z-index: 12;
                text-transform: uppercase;
            }

            /* Main Card in Walkout */
            .fcw-wo-card {
                transform: scale(3.5) translateY(-50px);
                opacity: 0;
                z-index: 20;
                filter: drop-shadow(0 0 60px rgba(255,215,0,0.8)) drop-shadow(0 0 120px rgba(255,165,0,0.4));
            }

            /* Animations */
            .fcw-wo-show-nation {
                animation: fcw-wo-reveal-dramatic 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards;
            }
            .fcw-wo-show-club {
                animation: fcw-wo-reveal-dramatic 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards;
            }
            .fcw-wo-show-pos {
                animation: fcw-wo-pos-slam 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            .fcw-wo-show-card {
                animation: fcw-wo-card-slam 1s cubic-bezier(0.22, 1, 0.36, 1) forwards;
            }
            
            /* Flash Effect - More Intense */
            .fcw-wo-flash {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: radial-gradient(circle, #fff 0%, rgba(255,215,0,0.5) 50%, transparent 70%);
                opacity: 0;
                pointer-events: none;
                z-index: 100;
            }
            .fcw-wo-flash-trigger {
                animation: fcw-wo-flash-boom 0.6s ease-out forwards;
            }
            
            /* Screen Shake Container */
            .fcw-wo-shake {
                animation: fcw-screen-shake 0.5s ease-out;
            }

            @keyframes fcw-wo-reveal-dramatic {
                0% { opacity: 0; transform: translateY(100px) scale(0.3); filter: blur(20px); }
                60% { opacity: 1; transform: translateY(-20px) scale(1.8); filter: blur(0); }
                100% { opacity: 1; transform: translateY(0) scale(1.6); filter: blur(0); }
            }
            @keyframes fcw-wo-pos-slam {
                0% { opacity: 0; transform: scale(3); filter: blur(10px); }
                50% { opacity: 1; transform: scale(0.9); }
                70% { transform: scale(1.1); }
                100% { opacity: 1; transform: scale(1); filter: blur(0); }
            }
            @keyframes fcw-wo-card-slam {
                0% { opacity: 0; transform: scale(3.5) translateY(-50px); }
                30% { opacity: 1; }
                70% { transform: scale(1.4) translateY(10px); }
                85% { transform: scale(1.55) translateY(-5px); }
                100% { opacity: 1; transform: scale(1.5) translateY(0); }
            }
            @keyframes fcw-wo-flash-boom {
                0% { opacity: 1; transform: scale(0.5); }
                30% { opacity: 1; transform: scale(1.5); }
                100% { opacity: 0; transform: scale(2); }
            }
            @keyframes fcw-screen-shake {
                0%, 100% { transform: translate(0, 0); }
                10% { transform: translate(-10px, -5px); }
                20% { transform: translate(10px, 5px); }
                30% { transform: translate(-8px, 3px); }
                40% { transform: translate(8px, -3px); }
                50% { transform: translate(-5px, 2px); }
                60% { transform: translate(5px, -2px); }
                70% { transform: translate(-3px, 1px); }
                80% { transform: translate(3px, -1px); }
            }
            
            /* Particles - Enhanced */
            .fcw-particle {
                position: absolute;
                border-radius: 50%;
                pointer-events: none;
                z-index: 50;
            }
            .fcw-particle-gold {
                background: radial-gradient(circle, #ffd700 0%, #ff8c00 100%);
                box-shadow: 0 0 10px #ffd700, 0 0 20px rgba(255,165,0,0.5);
            }
            .fcw-particle-white {
                background: radial-gradient(circle, #fff 0%, #ffd700 100%);
                box-shadow: 0 0 8px #fff;
            }
            
            /* Confetti */
            .fcw-confetti {
                position: absolute;
                width: 10px;
                height: 20px;
                pointer-events: none;
                z-index: 45;
            }
                background: gold;
                pointer-events: none;
            }
        `;

        const packAnimStyleNode = document.createElement('style');
        packAnimStyleNode.id = 'fcw-pack-anim-style';
        packAnimStyleNode.textContent = packAnimCss;
        document.head.appendChild(packAnimStyleNode);

        // --- Pack Animation Logic ---
        function initPackAnimation() {
            // Strictly only run animation logic on the main pack opening page
            if (!window.location.href.includes('/pack.php?p')) {
                return;
            }

            console.log('[FCW] initPackAnimation started');

            // 1. Inject Toggle (Needs to wait for Statistics container)
            injectToggleWithRetry();

            // 2. Setup MutationObserver for Card Animation (Handles AJAX loads)
            setupCardObserver();

            // 3. Initial Run (for first load if cards are already present/static)
            if (localStorage.getItem('fcw_pack_animation') === 'true') {
                // Slight delay to ensure layout is ready
                setTimeout(() => {
                    runPackAnimation(document.querySelectorAll('.cardtype'));
                }, 500);
            }
        }

        function injectToggleWithRetry(attempts = 0) {
            // Find the statistics container
            // Try standard class first
            let packStats = document.querySelector('.packStats');

            // Fallback: Look for "Statistics" header parent if class check fails
            if (!packStats) {
                const headers = document.querySelectorAll('h3');
                for (let h of headers) {
                    if (h.textContent.trim() === 'Statistics') {
                        packStats = h.parentNode;
                        break;
                    }
                }
            }

            if (!packStats) {
                if (attempts < 20) { // Retry for 10 seconds
                    setTimeout(() => injectToggleWithRetry(attempts + 1), 500);
                } else {
                    console.log('[FCW] Statistics container not found after 20 attempts');
                }
                return;
            }

            // Check if already injected
            if (packStats.querySelector('.fcw-pack-anim-container')) return;

            console.log('[FCW] Injecting Pack Animation Toggle');

            try {
                // Create the toggle container
                const container = document.createElement('div');
                container.className = 'fcw-pack-anim-container';

                const toggle = document.createElement('div');
                toggle.className = 'fcw-pack-anim-toggle';

                const labelDiv = document.createElement('div');
                labelDiv.className = 'fcw-pack-anim-label';

                // Icon (play button)
                const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                icon.setAttribute('class', 'fcw-pack-anim-icon');
                icon.setAttribute('viewBox', '0 0 24 24');
                icon.setAttribute('fill', 'none');
                icon.setAttribute('stroke', 'currentColor');
                icon.setAttribute('stroke-width', '2');
                const playPath = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                playPath.setAttribute('points', '5 3 19 12 5 21 5 3');
                icon.appendChild(playPath);
                labelDiv.appendChild(icon);

                const labelText = document.createElement('span');
                labelText.textContent = 'Pack Animation';
                labelDiv.appendChild(labelText);

                toggle.appendChild(labelDiv);

                // Add toggle switch
                const toggleHTML = `
                <div class="fcw-pack-anim-toggle" style="margin-left: 15px; display: inline-flex; align-items: center; cursor: pointer;">
                    <span style="font-size: 12px; font-weight: 600; color: #fff; margin-right: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Pack Animation</span>
                    <div class="fcw-pack-anim-switch ${localStorage.getItem('fcw_pack_animation') === 'true' ? 'active' : ''}"></div>
                </div>
                `;

                // Sync body class
                if (localStorage.getItem('fcw_pack_animation') === 'true') document.body.classList.add('fcw-pack-anim-on');
                else document.body.classList.remove('fcw-pack-anim-on');

                container.insertAdjacentHTML('beforeend', toggleHTML);

                const toggleEl = container.querySelector('.fcw-pack-anim-switch');
                toggleEl.parentElement.addEventListener('click', () => {
                    let isEnabled = toggleEl.classList.contains('active');
                    isEnabled = !isEnabled;
                    toggleEl.classList.toggle('active', isEnabled);
                    localStorage.setItem('fcw_pack_animation', isEnabled);

                    // Dispatch custom event for same-tab updates
                    window.dispatchEvent(new CustomEvent('fcw-storage-update', {
                        detail: { key: 'fcw_pack_animation', value: String(isEnabled) }
                    }));

                    // Toggle body class
                    if (isEnabled) {
                        document.body.classList.add('fcw-pack-anim-on');
                        // Mark all existing cards as processed so they don't disappear
                        document.querySelectorAll('.cardtype').forEach(c => {
                            c.classList.add('fcw-anim-processed');
                        });
                    } else {
                        document.body.classList.remove('fcw-pack-anim-on');
                    }

                    console.log('[FCW] Pack Animation toggled:', isEnabled);
                });
                packStats.appendChild(container);
            } catch (e) {
                console.warn('[FCW] Error injecting toggle:', e);
            }
        }

        // Mark existing cards as processed so they don't get hidden
        function markExistingCards() {
            document.querySelectorAll('.cardtype').forEach(c => c.classList.add('fcw-anim-processed'));
        }

        // Run once on load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', markExistingCards);
        } else {
            markExistingCards();
        }

        function setupCardObserver() {
            // Early bail-out: Only run on pack opening pages
            if (!window.location.href.includes('/pack.php?p')) {
                console.log('[FCW] Not a pack page, skipping card observer');
                return;
            }

            // Cache the animation preference to avoid repeated localStorage reads
            let animationEnabled = localStorage.getItem('fcw_pack_animation') === 'true';
            let animStyle = localStorage.getItem('fcw_pack_animation_style') || 'classic';

            // Listen for preference changes
            // Listen for preference changes (cross-tab)
            window.addEventListener('storage', (e) => {
                if (e.key === 'fcw_pack_animation') {
                    animationEnabled = e.newValue === 'true';
                } else if (e.key === 'fcw_pack_animation_style') {
                    animStyle = e.newValue || 'classic';
                }
            });

            // Listen for preference changes (same-tab)
            window.addEventListener('fcw-storage-update', (e) => {
                if (e.detail.key === 'fcw_pack_animation') {
                    animationEnabled = e.detail.value === 'true';
                } else if (e.detail.key === 'fcw_pack_animation_style') {
                    animStyle = e.detail.value || 'classic';
                }
            });

            // Collect cards in batch to reduce callback overhead
            let pendingCards = [];
            let batchTimeout = null;

            const processBatch = () => {
                document.body.classList.remove('fcw-anim-pending');
                if (pendingCards.length === 0 || window.fcwAnimationRunning) return;

                const cardToAnimate = pendingCards.filter(c =>
                    !c.classList.contains('fcw-animated') &&
                    !c.classList.contains('fcw-anim-processed')
                );

                if (cardToAnimate.length > 0) {
                    console.log('[FCW] New cards detected:', cardToAnimate.length);

                    // Pre-hide UI for animation
                    if (animStyle === 'walkout' || animStyle === 'fw17' || animStyle === 'classic' || animStyle === 'fifa14') {
                        document.body.classList.add('fcw-anim-playing');
                    }

                    runPackAnimation(cardToAnimate);
                }

                pendingCards = [];
            };

            const observer = new MutationObserver((mutations) => {
                if (!animationEnabled) return;

                mutations.forEach(mutation => {
                    if (mutation.addedNodes.length) {
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeType === 1) { // Element node
                                // Check if node is a card
                                if (node.classList && node.classList.contains('cardtype')) {
                                    node.classList.add('fcw-anim-hidden');
                                    node.style.position = 'relative';
                                    pendingCards.push(node);
                                    document.body.classList.add('fcw-anim-pending');
                                }
                                // Check children (if container was added)
                                else if (node.querySelectorAll) {
                                    const nestedCards = node.querySelectorAll('.cardtype');
                                    if (nestedCards.length) {
                                        nestedCards.forEach(c => {
                                            c.classList.add('fcw-anim-hidden');
                                            c.style.position = 'relative';
                                            pendingCards.push(c);
                                        });
                                        document.body.classList.add('fcw-anim-pending');
                                    }
                                }
                            }
                        });
                    }
                });

                // Debounce batch processing
                if (pendingCards.length > 0) {
                    if (batchTimeout) clearTimeout(batchTimeout);
                    batchTimeout = setTimeout(processBatch, 100);
                }
            });

            // Try to observe a more specific container if possible
            const playersBlock = document.getElementById('playersblock');
            const target = playersBlock || document.body;
            observer.observe(target, { childList: true, subtree: true });
            console.log('[FCW] Card Observer attached to:', target.id || 'body');
        }

        function runPackAnimation(cards) {
            if (!cards || cards.length === 0) return;

            // Don't run animation on pick pages
            if (window.location.href.includes('pick.php')) {
                console.log('[FCW] Skip animation on pick page');
                return;
            }

            // Check animation style preference
            const animStyle = localStorage.getItem('fcw_pack_animation_style') || 'classic';

            // Map legacy values if needed
            if (animStyle === 'walkout' || animStyle === 'fw17') {
                runFW17Animation(cards);
                return;
            }

            // Default fallback is 'classic'/'fifa14' which runs below
            // Prevent multiple animation triggers
            if (window.fcwAnimationRunning) {
                console.log('[FCW] Animation already running, skipping');
                return;
            }
            window.fcwAnimationRunning = true;

            const cardArray = Array.from(cards);
            console.log('[FCW] Running FUTGenie Classic Pack Animation on', cardArray.length, 'cards');

            // Mark all cards as processed immediately to prevent re-animation
            cardArray.forEach(card => {
                card.classList.add('fcw-anim-processed');
            });

            // 1. Identify Best Card (Highest Rating) using .rating26 selector
            let maxRating = 0;
            let bestCards = [];

            cardArray.forEach(c => {
                // Try rating26 first (FC26 cards), fallback to generic rating selector
                const rNode = c.querySelector('.rating26') || c.querySelector('[class*="rating"]');
                if (rNode) {
                    const r = parseInt(rNode.textContent.trim());
                    if (!isNaN(r)) {
                        if (r > maxRating) {
                            maxRating = r;
                            bestCards = [c];
                        } else if (r === maxRating) {
                            bestCards.push(c);
                        }
                    }
                }
            });

            console.log('[FCW] Best card rating:', maxRating, 'candidates:', bestCards.length);

            // Pick the first best card for the reveal
            const revealCard = bestCards.length > 0 ? bestCards[0] : cardArray[0];

            // 2. Hide ALL cards initially
            cardArray.forEach(card => {
                card.classList.add('fcw-anim-hidden');
            });

            // 3. Create Classic Pack Animation overlay
            const existingOverlay = document.getElementById('fcw-classic-pack-animation');
            if (existingOverlay) existingOverlay.remove();

            const overlay = document.createElement('div');
            overlay.id = 'fcw-classic-pack-animation';
            overlay.className = 'fcw-classic-pack-animation';

            // Flash element
            const flash = document.createElement('div');
            flash.className = 'classic-pack-flash';
            overlay.appendChild(flash);

            // Tiles container
            const tilesContainer = document.createElement('div');
            tilesContainer.className = 'classic-pack-tiles';
            overlay.appendChild(tilesContainer);

            document.body.appendChild(overlay);

            // Skip flag to stop all pending timeouts
            let animationSkipped = false;

            // 4. Create gold ball video (preload for faster start)
            const createBallVideo = () => {
                const ball = document.createElement('video');
                ball.className = 'classic-pack-ball';
                ball.src = `https://www.futgenie.gg/gold-ball.webm?ts=${Date.now()}`;
                ball.autoplay = true;
                ball.muted = true;
                ball.setAttribute('muted', '');
                ball.setAttribute('autoplay', '');
                ball.playsInline = true;
                ball.setAttribute('webkit-playsinline', 'true');
                ball.preload = 'auto'; // Changed from 'metadata' for faster loading
                overlay.appendChild(ball);

                // Show ball immediately when it can play
                ball.addEventListener('canplaythrough', () => {
                    ball.classList.add('show');
                }, { once: true });

                return ball;
            };

            // 5. Create hex tiles
            const hexCount = 10;
            const hexVideos = [];
            const hexPositions = [];

            // Generate random positions
            for (let i = 0; i < hexCount; i++) {
                const x = 10 + Math.random() * 80;
                const y = 12 + Math.random() * 76;
                hexPositions.push({
                    x: Math.max(10, Math.min(90, x)),
                    y: Math.max(12, Math.min(88, y))
                });
            }

            // Create hex video elements
            for (let i = 0; i < hexCount; i++) {
                const hex = document.createElement('video');
                hex.className = 'classic-pack-hex';
                hex.src = 'https://www.futgenie.gg/gold-hex.webm';
                hex.autoplay = true;
                hex.loop = true;
                hex.muted = true;
                hex.setAttribute('muted', '');
                hex.setAttribute('autoplay', '');
                hex.setAttribute('loop', '');
                hex.playsInline = true;
                hex.setAttribute('webkit-playsinline', 'true');
                hex.preload = 'auto';
                hex.style.left = '50%';
                hex.style.top = '50%';
                hex.dataset.targetLeft = `${hexPositions[i].x}%`;
                hex.dataset.targetTop = `${hexPositions[i].y}%`;
                tilesContainer.appendChild(hex);

                const safePlay = () => {
                    try {
                        const playPromise = hex.play();
                        if (playPromise && typeof playPromise.catch === 'function') {
                            playPromise.catch(() => { });
                        }
                    } catch (e) { }
                };

                hex.addEventListener('canplay', safePlay);
                hex.addEventListener('ended', () => {
                    try { hex.currentTime = 0; } catch (e) { }
                    safePlay();
                });
                hex.__fcwSafePlay = safePlay;
                hexVideos.push(hex);
            }

            // 6. Card element for reveal
            let cardElement = null;

            // 7. Reveal random hex with card - card flashes at random position on screen
            const revealRandomHex = () => {
                if (animationSkipped) return; // Skip check
                if (!hexVideos.length) {
                    finishAnimation();
                    return;
                }

                const randomIndex = Math.floor(Math.random() * hexVideos.length);
                const targetHex = hexVideos[randomIndex];

                targetHex.classList.add('reveal');

                // Create card element at RANDOM position on screen
                cardElement = document.createElement('div');
                cardElement.className = 'classic-pack-card';

                // Random position within visible area (avoid edges)
                const randomX = 20 + Math.random() * 60; // 20-80% of screen width
                const randomY = 20 + Math.random() * 50; // 20-70% of screen height
                cardElement.style.left = `${randomX}%`;
                cardElement.style.top = `${randomY}%`;

                overlay.appendChild(cardElement);

                // Clone the actual card content
                const cardClone = revealCard.cloneNode(true);
                cardClone.classList.remove('fcw-anim-hidden', 'fcw-anim-reveal', 'fcw-anim-processed');
                cardClone.style.cssText = 'opacity: 1 !important; transform: none !important; filter: none !important; visibility: visible !important;';
                cardElement.appendChild(cardClone);

                // Trigger flash effect
                flash.classList.add('show');
                setTimeout(() => flash.classList.remove('show'), 300);

                requestAnimationFrame(() => {
                    cardElement.classList.add('show');
                });

                // Keep card visible longer, then hide and finish
                setTimeout(() => {
                    if (cardElement) {
                        cardElement.classList.remove('show');
                        cardElement.classList.add('hide');
                    }
                    targetHex.classList.remove('reveal');

                    // Restart all hex videos
                    hexVideos.forEach(hv => {
                        hv.classList.remove('classic-pack-hex-freeze');
                        try { hv.play(); } catch (e) { }
                    });

                    if (cardElement) {
                        try { cardElement.remove(); } catch (e) { }
                        cardElement = null;
                    }
                }, 1000); // Faster display time

                // Finish animation after card show
                setTimeout(() => {
                    finishAnimation();
                }, 1200);
            };

            // 8. Finish animation - line up hexes and fade out
            const finishAnimation = () => {
                if (animationSkipped) return; // Skip check
                // Line up hexes at bottom
                const startX = 50 - (6 * (hexVideos.length - 1)) / 2;
                hexVideos.forEach((hv, idx) => {
                    hv.classList.add('lineup');
                    hv.style.left = `${Math.max(6, Math.min(94, startX + (6 * idx)))}%`;
                    hv.style.top = '84%';
                });

                setTimeout(() => {
                    overlay.classList.add('fade-out');

                    // Reveal all cards
                    cardArray.forEach(card => {
                        card.classList.remove('fcw-anim-hidden');
                        card.classList.add('fcw-anim-reveal-instant');
                        card.classList.add('fcw-anim-processed');
                    });

                    // Reveal UI
                    document.body.classList.remove('fcw-anim-playing');

                    setTimeout(() => {
                        try { overlay.remove(); } catch (e) { }
                        // Reset animation flag for next pack
                        window.fcwAnimationRunning = false;
                    }, 300);
                }, 800);
            };

            // 9. Animation timing (sped up)
            const timing = {
                ballIn: 100,
                tilesFreezeDelay: 600,
                revealDelay: 900
            };

            // 10. Start animation sequence
            const startAnimation = () => {
                const ball = createBallVideo();
                if (!ball) {
                    startTilesSequence();
                    return;
                }

                delete ball.dataset.fadeOut;
                ball.classList.remove('fade-out', 'show');

                try {
                    const playPromise = ball.play();
                    if (playPromise && typeof playPromise.catch === 'function') {
                        playPromise.catch(() => { });
                    }
                } catch (e) { }

                let tilesStarted = false;

                const startTilesOnce = () => {
                    if (!tilesStarted) {
                        tilesStarted = true;
                        try { ball.pause(); } catch (e) { }
                        try { ball.remove(); } catch (e) { }
                        startTilesSequence();
                    }
                };

                const onTimeUpdate = () => {
                    // Ball show is now handled by canplaythrough event
                    if (!ball.dataset.fadeOut && ball.currentTime >= 1.5) { // Faster transition
                        ball.dataset.fadeOut = 'true';
                        ball.classList.add('fade-out');
                    }
                    if (ball.currentTime >= 2.05) {
                        ball.removeEventListener('timeupdate', onTimeUpdate);
                        startTilesOnce();
                    }
                };

                ball.addEventListener('timeupdate', onTimeUpdate);
                setTimeout(startTilesOnce, 2150);
            };

            // Tiles sequence
            const startTilesSequence = () => {
                if (animationSkipped) return; // Skip check
                // Show and scatter tiles
                hexVideos.forEach(hv => {
                    hv.classList.remove('classic-pack-hex-freeze');
                    hv.classList.add('show');
                    hv.style.left = hv.dataset.targetLeft || '50%';
                    hv.style.top = hv.dataset.targetTop || '50%';
                    if (typeof hv.__fcwSafePlay === 'function') {
                        hv.__fcwSafePlay();
                    }
                });

                // Freeze tiles
                setTimeout(() => {
                    if (animationSkipped) return; // Skip check
                    hexVideos.forEach(hv => {
                        try {
                            hv.classList.add('classic-pack-hex-freeze');
                            hv.pause();
                        } catch (e) { }
                    });
                }, timing.tilesFreezeDelay);

                // Flash and reveal
                setTimeout(() => {
                    if (animationSkipped) return; // Skip check
                    flash.classList.add('show');
                    setTimeout(() => {
                        flash.classList.remove('show');
                    }, 300);
                    revealRandomHex();
                }, timing.revealDelay);
            };

            // Click to skip
            overlay.addEventListener('click', () => {
                animationSkipped = true; // Set skip flag to stop all pending timeouts
                overlay.classList.add('fade-out');

                // Reveal UI
                document.body.classList.remove('fcw-anim-playing');

                cardArray.forEach(card => {
                    card.classList.remove('fcw-anim-hidden');
                    card.classList.add('fcw-anim-reveal-instant');
                    card.classList.add('fcw-anim-processed');
                    card.classList.add('fcw-animated');
                });
                // Reset animation flag immediately
                window.fcwAnimationRunning = false;
                setTimeout(() => {
                    try { overlay.remove(); } catch (e) { }
                }, 300);
            }, { once: true });

            // Start after brief delay
            setTimeout(() => {
                startAnimation();
            }, timing.ballIn);
        }

        // ========== FW 17 ANIMATION (Measure-First Reconstruction) ==========
        function runFW17Animation_deprecated(cards) {
            if (!cards || cards.length === 0) return;
            if (window.fcwAnimationRunning) {
                console.log('[FCW] Animation already running, skipping');
                return;
            }
            window.fcwAnimationRunning = true;

            const cardArray = Array.from(cards);

            // Find Best Card
            let maxRating = 0;
            let bestCard = cardArray[0];
            cardArray.forEach(c => {
                let txt = c.innerText; // Get text before hiding
                const textNodes = txt.split('\n');
                for (let t of textNodes) {
                    const val = parseInt(t);
                    if (!isNaN(val) && val > 44 && val < 100 && val > maxRating) {
                        maxRating = val;
                        bestCard = c;
                    }
                }
            });
            const isWalkout = maxRating >= 87;

            // Extract Data BEFORE Hiding
            const rect = bestCard.getBoundingClientRect();
            const w = rect.width > 50 ? rect.width : 260; // Fallback
            const h = rect.height > 50 ? rect.height : 370;

            // Extract Images & Text Data
            const extractedData = {
                bg: null,
                face: null,
                icons: [],
                texts: []
            };

            // 1. Background
            const explicitBg = bestCard.querySelector('img[class*="card-bg"], img[src*="_gold"], img[src*="cards"]');
            if (explicitBg) extractedData.bg = explicitBg.src;
            else {
                const cs = window.getComputedStyle(bestCard);
                if (cs.backgroundImage && cs.backgroundImage !== 'none') extractedData.bgStyle = cs.backgroundImage;
            }

            // 2. Images (Face vs Icons)
            const imgs = bestCard.querySelectorAll('img');
            let maxImgArea = 0;
            imgs.forEach(img => {
                if (img === explicitBg) return; // Skip bg

                const r = img.getBoundingClientRect();
                if (r.width === 0) return;

                const relativeTop = r.top - rect.top;
                const relativeLeft = r.left - rect.left;

                // Icon Heuristic: small
                if (r.width < 90 && r.height < 90) {
                    extractedData.icons.push({ src: img.src, top: relativeTop, left: relativeLeft, w: r.width, h: r.height });
                } else {
                    // Potential Face
                    const area = r.width * r.height;
                    if (area > maxImgArea) {
                        maxImgArea = area;
                        extractedData.face = { src: img.src, top: relativeTop, left: relativeLeft, w: r.width, h: r.height };
                    }
                }
            });

            // 3. Text
            const treeWalker = document.createTreeWalker(bestCard, NodeFilter.SHOW_TEXT, null, false);
            let currentNode;
            while (currentNode = treeWalker.nextNode()) {
                if (currentNode.textContent.trim().length > 0) {
                    const range = document.createRange();
                    range.selectNode(currentNode);
                    const r = range.getBoundingClientRect();
                    if (r.width > 0) {
                        const style = window.getComputedStyle(currentNode.parentElement);
                        extractedData.texts.push({
                            text: currentNode.textContent.trim(),
                            top: r.top - rect.top,
                            left: r.left - rect.left,
                            color: style.color,
                            font: style.fontFamily,
                            size: style.fontSize,
                            weight: style.fontWeight
                        });
                    }
                }
            }

            // NOW Hide
            cardArray.forEach(card => {
                card.classList.add('fcw-anim-processed');
                card.classList.add('fcw-anim-hidden');
            });

            // Build UI
            const overlay = document.createElement('div');
            overlay.className = 'fcw-fw17-animation';
            const stage = document.createElement('div');
            stage.className = 'fcw-fw17-stage';
            overlay.appendChild(stage);

            const rc = document.createElement('div');
            rc.className = 'fcw-fw17-card';
            rc.style.cssText = `width:${w}px; height:${h}px; position:relative; border-radius:12px;`;

            // Apply BG
            if (extractedData.bg) {
                rc.style.backgroundImage = `url('${extractedData.bg}')`;
                rc.style.backgroundSize = 'cover';
            } else if (extractedData.bgStyle) {
                rc.style.backgroundImage = extractedData.bgStyle;
                rc.style.backgroundSize = 'cover';
            }

            // Helper
            const addLayer = (d, cls, extra = '') => {
                const el = document.createElement('div');
                el.className = `${cls} ${extra}`;
                el.style.cssText = `
                    position: absolute;
                    top: ${d.top}px; left: ${d.left}px; width: ${d.w}px; height: ${d.h}px;
                    background-image: url('${d.src}'); background-size: contain; background-repeat: no-repeat; background-position: center;
                    z-index: 2; opacity: 0; visibility: visible; transition: opacity 0.5s ease;
                 `;
                rc.appendChild(el);
            };

            if (extractedData.face) addLayer(extractedData.face, 'reveal-face', 'playerimagefifa26');

            extractedData.icons.forEach(icon => {
                let cls = 'reveal-full';
                if (icon.left < w * 0.5) {
                    if (icon.top < h * 0.5) cls = 'reveal-info';
                    else cls = 'reveal-club';
                }
                addLayer(icon, cls);
            });

            extractedData.texts.forEach(t => {
                const el = document.createElement('div');
                let cls = 'reveal-full';
                if (t.text.match(/^[0-9]{2,3}$/) && t.left < w * 0.4 && t.top < h * 0.4) cls = 'reveal-info';

                el.className = cls;
                el.textContent = t.text;
                el.style.cssText = `
                    position: absolute; top: ${t.top}px; left: ${t.left}px;
                    color: ${t.color}; font-family: ${t.font}; font-size: ${t.size}; font-weight: ${t.weight};
                    z-index: 3; opacity: 0; visibility: visible; transition: opacity 0.5s ease; white-space: nowrap;
                 `;
                rc.appendChild(el);
            });

            // Silhouette
            if (isWalkout) {
                const sil = document.createElement('div');
                sil.className = 'fcw-fw17-silhouette';
                rc.appendChild(sil);
            }

            stage.appendChild(rc);
            document.body.appendChild(overlay);

            // Animation Sequence
            let skipped = false;
            const finish = () => {
                if (skipped) return;
                overlay.classList.add('fade-out');
                cardArray.forEach(c => {
                    c.classList.remove('fcw-anim-hidden');
                    c.classList.add('fcw-anim-reveal-instant', 'fcw-animated');
                });
                setTimeout(() => { try { overlay.remove(); } catch (e) { }; window.fcwAnimationRunning = false; }, 400);
            };

            overlay.addEventListener('click', () => {
                skipped = true;
                rc.querySelectorAll('div').forEach(el => el.style.opacity = '1');
                const sil = rc.querySelector('.fcw-fw17-silhouette'); if (sil) sil.remove();
                overlay.classList.add('fade-out');
                cardArray.forEach(c => {
                    c.classList.remove('fcw-anim-hidden');
                    c.classList.add('fcw-anim-reveal-instant', 'fcw-animated');
                });
                window.fcwAnimationRunning = false;
                setTimeout(() => { try { overlay.remove(); } catch (e) { } }, 300);
            }, { once: true });

            if (isWalkout) setTimeout(() => { rc.querySelector('.fcw-fw17-silhouette')?.classList.add('show'); }, 100);
            setTimeout(() => { if (!skipped) rc.classList.add('reveal-info'); }, 800);
            setTimeout(() => { if (!skipped) rc.classList.add('reveal-club'); }, 1600);
            setTimeout(() => { if (!skipped) rc.classList.add('reveal-face'); }, 2400);
            setTimeout(() => { if (!skipped) { rc.classList.add('reveal-full'); rc.querySelector('.fcw-fw17-silhouette')?.classList.remove('show'); } }, 3200);
            setTimeout(() => { if (!skipped) finish(); }, 5500);
        }

        // Helper kept for potential future use













        // Helper kept for potential future use













        function createParticle(container, type = 'gold') {
            const p = document.createElement('div');
            const size = 4 + Math.random() * 12; // 4-16px
            p.className = `fcw-particle fcw-particle-${type}`;
            p.style.width = `${size}px`;
            p.style.height = `${size}px`;

            // Start from center, explode outward
            const angle = Math.random() * Math.PI * 2;
            const distance = 100 + Math.random() * 400;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance - 100; // Bias upward

            p.style.left = '50%';
            p.style.top = '50%';

            // Animate using Web Animation API
            p.animate([
                { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
                { opacity: 0, transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(0.2)` }
            ], {
                duration: 800 + Math.random() * 1200,
                easing: 'cubic-bezier(0, .9, .57, 1)',
                fill: 'forwards'
            });
            container.appendChild(p);
        }

        function revealGrid(cardArray) {
            // Simple reveal for the grid after walkout
            const delay = 100;
            cardArray.forEach((card, index) => {
                setTimeout(() => {
                    card.classList.remove('fcw-anim-hidden');
                    card.classList.add('fcw-anim-reveal');
                    card.classList.add('fcw-animated');
                }, index * delay);
            });
        }

        // Initialize pack animation after DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initPackAnimation);
        } else {
            // DOM already loaded, run immediately
            initPackAnimation();
        }


        // ========== FW 17 ANIMATION (Refined & Scaled) ==========
        function runFW17Animation_deprecated2(cards) {
            if (!cards || cards.length === 0) return;

            if (window.fcwAnimationRunning) {
                console.log('[FCW] Animation already running, skipping');
                return;
            }
            window.fcwAnimationRunning = true;

            const cardArray = Array.from(cards);

            // 1. Find Best Card
            let maxRating = 0;
            let bestCard = cardArray[0];

            cardArray.forEach(c => {
                // Try text content parsing for rating
                const textNodes = c.innerText.split('\n');
                for (let txt of textNodes) {
                    const val = parseInt(txt);
                    if (!isNaN(val) && val > 44 && val < 100 && val > maxRating) {
                        maxRating = val;
                        bestCard = c;
                    }
                }
            });

            // Measure original dimensions before hiding
            let rect = bestCard.getBoundingClientRect();
            // Fallback if measurement fails or is collapsed
            const w = rect.width > 50 ? rect.width : 260;
            const h = rect.height > 50 ? rect.height : 370;
            const isWalkout = maxRating >= 87;

            // Extract Data BEFORE Hiding
            const extractedData = {
                bg: null,
                bgStyle: null,
                face: null,
                icons: [],
                texts: []
            };

            // 1. Background
            const explicitBg = bestCard.querySelector('img.card-bg26') || bestCard.querySelector('img[class*="card-bg"]') || bestCard.querySelector('img[src*="_gold"]') || bestCard.querySelector('img[src*="cards"]');

            if (explicitBg) {
                extractedData.bg = explicitBg.src;
            } else {
                const cs = window.getComputedStyle(bestCard);
                if (cs.backgroundImage && cs.backgroundImage !== 'none') extractedData.bgStyle = cs.backgroundImage;
            }

            // 2. Images (Face vs Icons)
            const imgs = bestCard.querySelectorAll('img');
            let maxImgArea = 0;
            imgs.forEach(img => {
                if (img === explicitBg) return; // Skip bg
                if (img.src === extractedData.bg) return;

                // Ignore if invisible 
                const r = img.getBoundingClientRect();
                if (r.width <= 0) return;

                const relativeTop = r.top - rect.top;
                const relativeLeft = r.left - rect.left;

                // Icon Heuristic: small
                if (r.width < 90 && r.height < 90) {
                    extractedData.icons.push({ src: img.src, top: relativeTop, left: relativeLeft, w: r.width, h: r.height });
                } else {
                    // Potential Face
                    const area = r.width * r.height;
                    if (area > maxImgArea) {
                        maxImgArea = area;
                        extractedData.face = { src: img.src, top: relativeTop, left: relativeLeft, w: r.width, h: r.height };
                    }
                }
            });

            // 3. Text
            const treeWalker = document.createTreeWalker(bestCard, NodeFilter.SHOW_TEXT, null, false);
            let currentNode;
            while (currentNode = treeWalker.nextNode()) {
                const txt = currentNode.textContent.trim();
                if (txt.length > 0) {
                    const range = document.createRange();
                    range.selectNode(currentNode);
                    const r = range.getBoundingClientRect();
                    if (r.width > 0) {
                        const style = window.getComputedStyle(currentNode.parentElement);
                        extractedData.texts.push({
                            text: txt,
                            top: r.top - rect.top,
                            left: r.left - rect.left,
                            color: style.color,
                            font: style.fontFamily,
                            size: style.fontSize,
                            weight: style.fontWeight,
                            shadow: style.textShadow,
                            transform: style.textTransform
                        });
                    }
                }
            }

            // 2. Hide original cards
            cardArray.forEach(card => {
                card.classList.add('fcw-anim-processed');
                card.classList.add('fcw-anim-hidden');
            });

            // 3. Build Overlay
            const overlay = document.createElement('div');
            overlay.className = 'fcw-fw17-animation';
            const stage = document.createElement('div');
            stage.className = 'fcw-fw17-stage';
            overlay.appendChild(stage);

            const rc = document.createElement('div');
            rc.className = 'fcw-fw17-card';
            // SCALE 1.3
            rc.style.cssText = `
                width:${w}px; height:${h}px; 
                position:relative; 
                border-radius:12px;
                transform: scale(2.3); 
                transform-origin: center center;
            `;

            // Apply BG
            if (extractedData.bg) {
                rc.style.backgroundImage = `url('${extractedData.bg}')`;
                rc.style.backgroundSize = 'cover';
                rc.style.backgroundPosition = 'center';
            } else if (extractedData.bgStyle) {
                rc.style.backgroundImage = extractedData.bgStyle;
                rc.style.backgroundSize = 'cover';
            } else {
                rc.style.backgroundColor = '#1a1a1a';
            }

            // Helper
            const addLayer = (d, type, extra = '') => {
                const el = document.createElement('div');
                el.dataset.revealType = type;
                el.className = extra;
                el.style.cssText = `
                    position: absolute;
                    top: ${d.top}px; left: ${d.left}px; width: ${d.w}px; height: ${d.h}px;
                    background-image: url('${d.src}'); background-size: contain; background-repeat: no-repeat; background-position: center;
                    z-index: 2; opacity: 0; visibility: visible; transition: opacity 0.8s ease;
                 `;
                rc.appendChild(el);
                return el;
            };

            if (extractedData.face) addLayer(extractedData.face, 'face', 'playerimagefifa26');

            extractedData.icons.forEach(icon => {
                let type = 'full';
                if (icon.left < w * 0.5) {
                    if (icon.top < h * 0.5) type = 'info';
                    else type = 'club';
                }
                addLayer(icon, type);
            });

            extractedData.texts.forEach(t => {
                const el = document.createElement('div');
                let type = 'full';
                if (t.text.match(/^[0-9]{2,3}$/) && t.left < w * 0.4 && t.top < h * 0.4) type = 'info';

                el.dataset.revealType = type;
                el.textContent = t.text;
                el.style.cssText = `
                    position: absolute; top: ${t.top}px; left: ${t.left}px;
                    color: ${t.color}; font-family: ${t.font}; font-size: ${t.size}; font-weight: ${t.weight};
                    text-shadow: ${t.shadow}; text-transform: ${t.transform};
                    z-index: 3; opacity: 0; visibility: visible; transition: opacity 0.8s ease; white-space: nowrap; pointer-events: none;
                 `;
                rc.appendChild(el);
            });

            if (isWalkout) {
                const sil = document.createElement('div');
                sil.className = 'fcw-fw17-silhouette';
                rc.appendChild(sil);
            }

            stage.appendChild(rc);
            document.body.appendChild(overlay);

            // Animation Sequence
            let skipped = false;

            const reveal = (type) => {
                if (skipped) return;
                const layers = rc.querySelectorAll(`[data-reveal-type="${type}"]`);
                layers.forEach(l => l.style.opacity = '1');
            };

            const finish = () => {
                if (skipped) return;
                overlay.classList.add('fade-out');
                cardArray.forEach(c => {
                    c.classList.remove('fcw-anim-hidden');
                    c.classList.add('fcw-anim-reveal-instant', 'fcw-animated');
                });
                setTimeout(() => { try { overlay.remove(); } catch (e) { }; window.fcwAnimationRunning = false; }, 400);
            };

            overlay.addEventListener('click', () => {
                skipped = true;
                rc.querySelectorAll('div').forEach(el => el.style.opacity = '1');
                const sil = rc.querySelector('.fcw-fw17-silhouette'); if (sil) sil.remove();
                overlay.classList.add('fade-out');
                cardArray.forEach(c => {
                    c.classList.remove('fcw-anim-hidden');
                    c.classList.add('fcw-anim-reveal-instant', 'fcw-animated');
                });
                window.fcwAnimationRunning = false;
                setTimeout(() => { try { overlay.remove(); } catch (e) { } }, 300);
            }, { once: true });

            if (isWalkout) setTimeout(() => { rc.querySelector('.fcw-fw17-silhouette')?.classList.add('show'); }, 100);

            setTimeout(() => { reveal('info'); }, 800);
            setTimeout(() => { reveal('club'); }, 1600);
            setTimeout(() => { reveal('face'); }, 2400);
            setTimeout(() => {
                reveal('full');
                if (isWalkout) rc.querySelector('.fcw-fw17-silhouette')?.classList.remove('show');
            }, 3200);

            setTimeout(() => { finish(); }, 5500);
        }



        // ========== FW 17 ANIMATION (Refined Sequence v2) ==========
        function runFW17Animation(cards) {
            if (!cards || cards.length === 0) return;

            if (window.fcwAnimationRunning) {
                console.log('[FCW] Animation already running, skipping');
                return;
            }
            window.fcwAnimationRunning = true;

            const cardArray = Array.from(cards);

            // --- HIDE UI ELEMENTS ---
            // --- HIDE UI ELEMENTS ---
            // Handled via CSS class in MutationObserver
            // (document.body.classList.add('fcw-anim-playing'))

            // 1. Find Best Card
            // 1. Find Best Card
            let maxRating = 0;
            let bestCard = null;

            // Strict check: Only animate items with tooltip info (players) AND exclude coins
            const isValidCard = (c) => c.hasAttribute('data-original-title') && !c.querySelector('img[src*="coins"]');

            cardArray.forEach(c => {
                if (!isValidCard(c)) return;

                // Target the main rating element specifically (top-left of card)
                const ratingEl = c.querySelector('.rating26') || c.querySelector('[class*="rating"]');
                if (ratingEl) {
                    const val = parseInt(ratingEl.textContent.trim());
                    if (!isNaN(val) && val > 44 && val < 100 && val > maxRating) {
                        maxRating = val;
                        bestCard = c;
                    }
                }
            });

            // Fallback: Use first valid card
            if (!bestCard) {
                bestCard = cardArray.find(c => isValidCard(c));
            }

            // Abort if no valid cards (e.g. only coins)
            if (!bestCard) {
                console.log('[FCW] No valid cards for animation, skipping');
                window.fcwAnimationRunning = false;
                document.body.classList.remove('fcw-anim-playing');
                return;
            }

            // Measure original dimensions before hiding
            let rect = bestCard.getBoundingClientRect();
            // Fallback if measurement fails or is collapsed
            const w = rect.width > 50 ? rect.width : 260;
            const h = rect.height > 50 ? rect.height : 370;
            const isWalkout = maxRating >= 87;
            console.log('[FCW FW17] Best card rating:', maxRating, '| isWalkout:', isWalkout);

            // Extract Data BEFORE Hiding
            const extractedData = {
                bg: null,
                bgStyle: null,
                face: null,
                icons: [], // Will store {src, top, left, ...}
                texts: []
            };

            // 1. Background
            const explicitBg = bestCard.querySelector('img.card-bg26') || bestCard.querySelector('img[class*="card-bg"]') || bestCard.querySelector('img[src*="_gold"]') || bestCard.querySelector('img[src*="cards"]');

            if (explicitBg) {
                extractedData.bg = explicitBg.src;
            } else {
                const cs = window.getComputedStyle(bestCard);
                if (cs.backgroundImage && cs.backgroundImage !== 'none') extractedData.bgStyle = cs.backgroundImage;
            }

            // 2. Images (Face vs Icons)
            const imgs = bestCard.querySelectorAll('img');
            let maxImgArea = 0;
            imgs.forEach(img => {
                if (img === explicitBg) return; // Skip bg
                if (img.src === extractedData.bg) return;

                // Ignore if invisible 
                const r = img.getBoundingClientRect();
                if (r.width <= 0) return;

                const relativeTop = r.top - rect.top;
                const relativeLeft = r.left - rect.left;

                // Icon Heuristic: small
                if (r.width < 120 && r.height < 120) {
                    extractedData.icons.push({ src: img.src, top: relativeTop, left: relativeLeft, w: r.width, h: r.height });
                } else {
                    // Potential Face
                    const area = r.width * r.height;
                    if (area > maxImgArea) {
                        maxImgArea = area;
                        extractedData.face = { src: img.src, top: relativeTop, left: relativeLeft, w: r.width, h: r.height };
                    }
                }
            });

            // 3. Text
            const treeWalker = document.createTreeWalker(bestCard, NodeFilter.SHOW_TEXT, null, false);
            let currentNode;
            while (currentNode = treeWalker.nextNode()) {
                const txt = currentNode.textContent.trim();
                if (txt.length > 0) {
                    const range = document.createRange();
                    range.selectNode(currentNode);
                    const r = range.getBoundingClientRect();
                    if (r.width > 0) {
                        const style = window.getComputedStyle(currentNode.parentElement);
                        extractedData.texts.push({
                            text: txt,
                            top: r.top - rect.top,
                            left: r.left - rect.left,
                            color: style.color,
                            font: style.fontFamily,
                            size: style.fontSize,
                            weight: style.fontWeight,
                            shadow: style.textShadow,
                            transform: style.textTransform
                        });
                    }
                }
            }

            // 4. Hide original cards
            cardArray.forEach(card => {
                card.classList.add('fcw-anim-processed');
                card.classList.add('fcw-anim-hidden');
            });

            // 5. Build Overlay
            const overlay = document.createElement('div');
            overlay.className = 'fcw-fw17-animation';
            const stage = document.createElement('div');
            stage.className = 'fcw-fw17-stage';
            overlay.appendChild(stage);

            const rc = document.createElement('div');
            rc.className = 'fcw-fw17-card';
            // SCALE 2.3
            rc.style.cssText = `
                width:${w}px; height:${h}px; 
                position:relative; 
                border-radius:12px;
                transform: scale(2.3); 
                transform-origin: center center;
            `;

            // Apply BG
            if (extractedData.bg) {
                rc.style.backgroundImage = `url('${extractedData.bg}')`;
                rc.style.backgroundSize = 'cover';
                rc.style.backgroundPosition = 'center';
            } else if (extractedData.bgStyle) {
                rc.style.backgroundImage = extractedData.bgStyle;
                rc.style.backgroundSize = 'cover';
            } else {
                rc.style.backgroundColor = '#1a1a1a';
            }

            // Helper
            const addLayer = (d, type, extra = '') => {
                const el = document.createElement('div');
                el.dataset.revealType = type;
                el.className = extra;
                el.style.cssText = `
                    position: absolute;
                    top: ${d.top}px; left: ${d.left}px; width: ${d.w}px; height: ${d.h}px;
                    background-image: url('${d.src}'); background-size: contain; background-repeat: no-repeat; background-position: center;
                    z-index: 2; opacity: 0; visibility: visible; transition: opacity 0.8s ease;
                 `;
                rc.appendChild(el);
                return el;
            };

            // ADD FACE (Phase 3)
            if (extractedData.face) addLayer(extractedData.face, 'face', 'playerimagefifa26');

            // SORT ICONS
            // Use URL content for reliable classification (Nation vs Club/League)
            extractedData.icons.forEach(icon => {
                let type = 'full'; // Default to "Rest" (Phase 3)
                const s = icon.src.toLowerCase();

                if (s.includes('country') || s.includes('nation')) {
                    type = 'nation'; // Phase 1
                } else if (s.includes('club') || s.includes('league') || s.includes('team')) {
                    type = 'club'; // Phase 2
                } else if (icon.left < w * 0.5 && icon.top < h * 0.75) {
                    // Fallback: Top-Left unknown icons
                    if (icon.top < h * 0.4) type = 'nation';
                    else type = 'club';
                }

                addLayer(icon, type);
            });

            // TEXTS
            extractedData.texts.forEach(t => {
                const el = document.createElement('div');
                let type = 'full';

                // Heuristics
                const isTopLeft = t.left < w * 0.4 && t.top < h * 0.5;

                if (isTopLeft) {
                    if (t.text.match(/^[0-9]{2,3}$/)) {
                        type = 'rating'; // Phase 3 (Rest)
                    } else if (t.text.length <= 4 && t.text.match(/[A-Z]/)) {
                        type = 'pos'; // Phase 1 (Pos)
                    } else {
                        type = 'full';
                    }
                }

                el.dataset.revealType = type;
                el.textContent = t.text;
                el.style.cssText = `
                    position: absolute; top: ${t.top}px; left: ${t.left}px;
                    color: ${t.color}; font-family: ${t.font}; font-size: ${t.size}; font-weight: ${t.weight};
                    text-shadow: ${t.shadow}; text-transform: ${t.transform};
                    z-index: 3; opacity: 0; visibility: visible; transition: opacity 0.8s ease; white-space: nowrap; pointer-events: none;
                 `;
                rc.appendChild(el);
            });

            if (isWalkout) {
                const sil = document.createElement('div');
                sil.className = 'fcw-fw17-silhouette';
                rc.appendChild(sil);
            }

            stage.appendChild(rc);
            document.body.appendChild(overlay);

            // Animation Sequence
            let skipped = false;

            const reveal = (type) => {
                if (skipped) return;
                const layers = rc.querySelectorAll(`[data-reveal-type="${type}"]`);
                layers.forEach(l => l.style.opacity = '1');
            };

            const finish = () => {
                if (skipped) return;

                // Reveal UI
                // Reveal UI
                document.body.classList.remove('fcw-anim-playing');

                // 1. Smooth Fade Out Overlay
                overlay.style.transition = 'opacity 0.5s ease';
                overlay.style.opacity = '0';

                // 2. Reliable Fade In Original Cards
                cardArray.forEach(c => {
                    c.classList.remove('fcw-anim-hidden', 'fcw-anim-reveal', 'fcw-anim-reveal-instant');
                    c.classList.add('fcw-anim-processed');

                    // Reset to start state
                    c.style.transition = 'none';
                    c.style.opacity = '0';
                    c.style.visibility = 'visible';
                    c.style.transform = 'none';

                    void c.offsetWidth;

                    requestAnimationFrame(() => {
                        c.style.transition = 'opacity 1s ease';
                        c.style.setProperty('opacity', '1', 'important');
                    });

                    // Cleanup inline styles after transition to respect CSS hovers etc
                    setTimeout(() => {
                        c.style.transition = '';
                        c.style.opacity = '';
                        c.style.visibility = '';
                    }, 850);
                });


                setTimeout(() => { try { overlay.remove(); } catch (e) { }; window.fcwAnimationRunning = false; }, 500);
            };

            overlay.addEventListener('click', () => {
                skipped = true;

                // Reveal UI
                // Reveal UI
                document.body.classList.remove('fcw-anim-playing');

                rc.querySelectorAll('div').forEach(el => el.style.opacity = '1');
                const sil = rc.querySelector('.fcw-fw17-silhouette'); if (sil) sil.remove();
                const se = rc.querySelector('.fcw-fw17-special-effect'); if (se) se.remove();

                // Same smooth exit logic for skip
                overlay.style.transition = 'opacity 0.3s ease';
                overlay.style.opacity = '0';

                cardArray.forEach(c => {
                    c.classList.remove('fcw-anim-hidden', 'fcw-anim-reveal', 'fcw-anim-reveal-instant');
                    c.classList.add('fcw-anim-processed');

                    c.style.transition = 'none';
                    c.style.opacity = '0';
                    c.style.visibility = 'visible';
                    c.style.transform = 'none';
                    c.style.filter = 'none';

                    void c.offsetWidth;

                    requestAnimationFrame(() => {
                        c.style.transition = 'opacity 0.8s ease';
                        c.style.setProperty('opacity', '1', 'important');
                        setTimeout(() => {
                            c.style.transition = '';
                            c.style.opacity = '';
                            c.style.visibility = '';
                        }, 850);
                    });
                });

                window.fcwAnimationRunning = false;
                setTimeout(() => { try { overlay.remove(); } catch (e) { } }, 300);
            }, { once: true });

            // SEQUENCE
            // 0. Special Effect (Walkout 87+)
            let seqStart = 100;

            if (isWalkout) {
                // Determine dynamic color from text or fallback to white/gold
                const accentColor = (extractedData.texts[0] && extractedData.texts[0].color) ? extractedData.texts[0].color : '#ffd700';

                const specialEffect = document.createElement('div');
                specialEffect.className = 'fcw-fw17-special-effect';
                specialEffect.style.setProperty('--fcw-effect-color', accentColor);
                rc.appendChild(specialEffect);
                setTimeout(() => specialEffect.classList.add('active'), 50);

                // Delay the rest of the sequence by 2.0s to let the intro play out
                seqStart = 2000;
            }

            // 1. Silhouette
            if (isWalkout) setTimeout(() => { rc.querySelector('.fcw-fw17-silhouette')?.classList.add('show'); }, seqStart);

            // 2. Position & Nation
            setTimeout(() => {
                reveal('pos');
                reveal('nation');
            }, seqStart + 800);

            // 3. Club & League
            setTimeout(() => {
                reveal('club');
            }, seqStart + 1600);

            // 4. Face & Rating & Rest
            setTimeout(() => {
                reveal('face');
                reveal('rating');
                reveal('full');
                if (isWalkout) rc.querySelector('.fcw-fw17-silhouette')?.classList.remove('show');
            }, seqStart + 2400);

            // 5. Finish
            setTimeout(() => { finish(); }, seqStart + 4500);
        }





// --- Logout Interception ---
document.addEventListener('click', (e) => {
    const logoutBtn = e.target.closest('a.club-menu-logout') || e.target.closest('a[href*="logout.php"]');
    if (logoutBtn && !e.target.closest('#fcw-logout-modal')) {
        e.preventDefault();
        e.stopPropagation();

        // Prevent multiple modals
        if (document.getElementById('fcw-logout-modal-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'fcw-logout-modal-overlay';

        overlay.innerHTML = `
                    <div id="fcw-logout-modal">
                        <h2>Sign Out?</h2>
                        <p>Are you sure you want to log out of FCWatch?</p>
                        <div class="fcw-logout-buttons">
                            <button class="fcw-logout-btn fcw-logout-cancel" id="fcw-logout-cancel">Cancel</button>
                            <button class="fcw-logout-btn fcw-logout-confirm" id="fcw-logout-confirm">Log Out</button>
                        </div>
                    </div>
                `;

        document.body.appendChild(overlay);

        // Trigger reflow for animation
        void overlay.offsetWidth;
        overlay.classList.add('visible');

        const closeModal = () => {
            overlay.classList.remove('visible');
            setTimeout(() => overlay.remove(), 300);
        };

        document.getElementById('fcw-logout-cancel').addEventListener('click', closeModal);

        // Allow clicking outside to close
        overlay.addEventListener('click', (ev) => {
            if (ev.target === overlay) closeModal();
        });

        document.getElementById('fcw-logout-confirm').addEventListener('click', () => {
            // Send to logout page
            const btnStyles = document.getElementById('fcw-logout-confirm').style;
            btnStyles.opacity = '0.7';
            btnStyles.pointerEvents = 'none';
            document.getElementById('fcw-logout-confirm').textContent = 'Logging out...';
            window.location.href = logoutBtn.href;
        });
    }
}, true);

} // End initDarkUI
}) ();


    // === IOS_SUITE.JS ===
// ==UserScript==
// @name         FC Watch - Ultimate iOS Platinum Suite
// @namespace    http://tampermonkey.net/
// @version      6.1
// @description  Combines the iOS 26 Platinum Dashboard and Mystic's Glass Leaderboard into one ultimate UI overhaul.
// @author       You 
// @match        https://www.fc-watch.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=fc-watch.com
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    // === KILLSWITCH CHECK ===
    // Prefers Promise-based approach when available, falls back to polling
    function waitForKillswitch(callback, maxWait = 500) {
        // Try Promise-based approach first (faster, no polling)
        if (window.__FCW_EXTENSION_STATE?.ready instanceof Promise) {
            window.__FCW_EXTENSION_STATE.ready.then(isEnabled => {
                if (isEnabled) callback();
                else console.log('[FCW iOS Suite] Extension disabled, not running.');
            });
            return;
        }

        // Fallback: poll with reduced frequency
        let waited = 0;
        const check = () => {
            if (window.__FCW_EXTENSION_STATE?.loaded) {
                if (window.__FCW_EXTENSION_STATE.enabled) {
                    callback();
                } else {
                    console.log('[FCW iOS Suite] Extension disabled, not running.');
                }
            } else if (waited < maxWait) {
                waited += 10;
                setTimeout(check, 10);
            } else {
                // Timeout - Failsafe
                if (window.__FCW_EXTENSION_STATE?.enabled !== false) {
                    callback();
                }
            }
        };
        check();
    }

    waitForKillswitch(initIOSSuite);

    function initIOSSuite() {

        // =================================================================
        // GLOBAL: Initialize Accent Color from Navbar Settings
        // =================================================================
        function initAccentColor() {
            try {
                const navSettings = JSON.parse(localStorage.getItem('fcw_navbar_settings'));
                if (navSettings && navSettings.accent) {
                    document.documentElement.style.setProperty('--fcw-accent', navSettings.accent);
                }
            } catch (e) { }
        }
        initAccentColor();

        // Listen for accent changes from other scripts
        window.addEventListener('storage', (e) => {
            if (e.key === 'fcw_navbar_settings') {
                try {
                    const navSettings = JSON.parse(e.newValue);
                    if (navSettings && navSettings.accent) {
                        document.documentElement.style.setProperty('--fcw-accent', navSettings.accent);
                    }
                } catch (err) { }
            }
        });

        // Listen for same-page custom events
        window.addEventListener('fcw-accent-changed', (e) => {
            if (e.detail && e.detail.accent) {
                document.documentElement.style.setProperty('--fcw-accent', e.detail.accent);
            }
        });

        // =================================================================
        // PART 1: iOS 26 PLATINUM DASHBOARD (Club Stats)
        // =================================================================
        function initClubDashboard() {
            // 1. CONFIGURATION: iOS 26 Palette
            const config = {
                font: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',

                // Dark, deep glass
                glassBg: 'rgba(18, 18, 28, 0.65)',
                glassBorder: 'rgba(255, 255, 255, 0.1)',
                glassHighlight: 'rgba(255, 255, 255, 0.25)', // Border on hover

                // Solid accent color (no white mixing)
                accentColor: 'var(--fcw-accent, #8d124d)',

                // Label colors - uses accent with slight transparency
                labelColor: 'var(--fcw-accent, #8d124d)',
                labelColorHover: 'var(--fcw-accent, #8d124d)'
            };

            const headers = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6, strong, b, div.header'));
            const statsHeader = headers.find(el => el.textContent.trim().toLowerCase() === 'club stats');
            if (!statsHeader) return; // Exit if not on a page with stats

            let statsContainer = statsHeader.nextElementSibling;
            while (statsContainer && (statsContainer.tagName === 'BR' || statsContainer.nodeType === 3)) {
                statsContainer = statsContainer.nextElementSibling;
            }

            if (!statsContainer || statsContainer.classList.contains('glass-stats-hidden')) return;

            // 2. PARSE DATA
            let statsData = [];
            const clean = (text, isValue = false) => {
                if (!text) return '';
                let cleaned = text.replace(/:/g, '').trim();
                if (isValue && /^\d+$/.test(cleaned)) {
                    return parseInt(cleaned).toLocaleString();
                }
                return cleaned;
            };

            const parseItems = (container) => {
                if (container.tagName === 'TABLE') {
                    container.querySelectorAll('tr').forEach(row => {
                        const cells = row.querySelectorAll('td, th');
                        if (cells.length >= 2) statsData.push({ label: clean(cells[0].textContent), value: clean(cells[1].textContent, true) });
                    });
                } else {
                    const txt = container.innerText || container.textContent;
                    txt.split(/\n|<br>/).forEach(line => {
                        if (line.includes(':')) {
                            const parts = line.split(':');
                            statsData.push({ label: clean(parts[0]), value: clean(parts[1], true) });
                        }
                    });
                }
            };
            parseItems(statsContainer);

            if (statsData.length === 0) return;

            // 3. SEPARATE HERO STAT
            let heroStat = null;
            const otherStats = [];
            statsData.forEach(stat => {
                if (stat.label.toLowerCase().includes('club value')) heroStat = stat;
                else otherStats.push(stat);
            });
            if (!heroStat && statsData.length > 0) {
                heroStat = statsData[0];
                otherStats.shift();
            }

            // 4. INJECT CSS
            const style = document.createElement('style');
            style.textContent = `
            /* Wrapper */
            .glass-dashboard-wrapper {
                font-family: ${config.font};
                margin: 40px auto 70px auto;
                width: 100%;
                max-width: 1300px;
                padding: 0 20px;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 40px;
                contain: layout style; /* Performance: Isolate layout calculations */
            }

            /* --- HERO CARD (IOS 26 Style) --- */
            .glass-hero {
                position: relative;
                width: calc(100% - 40px);
                max-width: 620px;
                margin: 0 auto; /* Force horizontal centering */
                padding: 35px 30px; 

                /* Base Glass State */
                background: linear-gradient(180deg, rgba(30, 30, 40, 0.6) 0%, rgba(10, 10, 15, 0.8) 100%);
                backdrop-filter: blur(50px);
                -webkit-backdrop-filter: blur(50px);

                border-radius: 36px;
                border: 1px solid ${config.glassBorder};
                box-shadow: 0 15px 40px -15px rgba(0, 0, 0, 0.6);

                /* FLEX CENTERING */
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                
                text-align: center;
                overflow: hidden;
                cursor: default;
                transition: all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
            }

            /* --- HERO HOVER EFFECTS --- */
            .glass-hero:hover {
                transform: translateY(-4px) scale(1.02); /* Slight lift and grow */
                border-color: ${config.glassHighlight}; /* Brighten Border */
                box-shadow:
                    0 25px 60px -15px rgba(0, 0, 0, 0.7), /* Deep drop shadow */
                    inset 0 0 0 1px rgba(255,255,255,0.1); /* Inner glow */
                background: linear-gradient(180deg, rgba(40, 40, 55, 0.7) 0%, rgba(20, 20, 30, 0.85) 100%);
            }

            /* The "Sheen" Light Reflection on Hover */
            .glass-hero::after {
                content: '';
                position: absolute;
                top: 0; left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
                transform: skewX(-20deg);
                transition: none;
            }
            .glass-hero:hover::after {
                left: 100%;
                transition: left 0.7s ease-in-out; /* Woosh effect on hover */
            }

            /* Content Styling */
            .glass-hero-label {
                font-size: 0.85rem;
                text-transform: uppercase;
                letter-spacing: 4px;
                color: ${config.labelColor};
                margin-bottom: 10px;
                font-weight: 600;
                transition: color 0.3s, text-shadow 0.3s;
                text-shadow: 0 0 20px color-mix(in srgb, var(--fcw-accent, #8d124d), transparent 70%);
            }
            .glass-hero:hover .glass-hero-label {
                color: ${config.labelColorHover};
                text-shadow: 0 0 30px color-mix(in srgb, var(--fcw-accent, #8d124d), transparent 40%);
            }

            .glass-hero-value {
                /* Dynamic Size */
                font-size: clamp(2.5rem, 4vw, 3.8rem);
                font-weight: 800;

                /* Solid Accent Color */
                color: ${config.accentColor};

                filter: drop-shadow(0 4px 15px color-mix(in srgb, var(--fcw-accent, #8d124d), transparent 60%));
                white-space: nowrap;
                transition: filter 0.3s, transform 0.3s;
            }
            .glass-hero:hover .glass-hero-value {
                filter: drop-shadow(0 0 30px color-mix(in srgb, var(--fcw-accent, #8d124d), transparent 30%));
            }


            /* --- GRID STATS (Other Items) --- */
            .glass-grid {
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                gap: 16px;
                width: 100%;
            }
            
            /* Layout Variations */
            .glass-grid.fcw-layout-list {
                flex-direction: column;
                align-items: center;
            }
            .glass-grid.fcw-layout-list .glass-card {
                width: 100%;
                max-width: 600px;
                flex: none;
            }
            
            .glass-grid.fcw-layout-4x2 {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                grid-auto-rows: 1fr; /* Force all rows to same height */
                gap: 15px;
            }
            .glass-grid.fcw-layout-4x2 .glass-card {
                padding: 22px 18px;
                text-align: center;
                align-items: center;
                max-width: none; /* Remove max-width constraint in grid */
                flex: none; /* Override flex from default */
                min-height: 110px;
            }
            .glass-grid.fcw-layout-4x2 .glass-label {
                font-size: 0.725rem;
                letter-spacing: 0.8px;
                margin-bottom: 8px;
                min-height: 2.8em; /* Adjusted for slightly larger font */
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .glass-grid.fcw-layout-4x2 .glass-value {
                font-size: 1.45rem;
            }
            
            .glass-grid.fcw-layout-2x4 {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                grid-auto-rows: 1fr;
                gap: 16px;
            }
            .glass-grid.fcw-layout-2x4 .glass-card {
                text-align: center;
                align-items: center;
                max-width: none;
                flex: none;
            }
            
            /* Custom Glass Tint via CSS Variable */
            .glass-card.fcw-custom-tint {
                background: var(--fcw-stats-glass-tint, rgba(18, 18, 28, 0.65)) !important;
            }
            
            /* Corner Style: Sharp */
            .glass-card.fcw-sharp-corners {
                border-radius: 4px !important;
            }
            .glass-hero.fcw-sharp-corners {
                border-radius: 8px !important;
            }
            
            /* Drag-drop reorder mode */
            .glass-card.fcw-dragging {
                opacity: 0.7;
                transform: scale(1.05);
                box-shadow: 0 20px 40px rgba(0,0,0,0.5) !important;
                cursor: grabbing !important;
                z-index: 1000;
            }
            .glass-card.fcw-reorder-mode {
                cursor: grab;
                user-select: none;
            }
            .glass-card.fcw-reorder-mode:hover {
                outline: 2px solid var(--fcw-accent, #8d124d);
                outline-offset: 2px;
            }

            .glass-card {
                background: ${config.glassBg};
                backdrop-filter: blur(30px);
                -webkit-backdrop-filter: blur(30px);
                border: 1px solid ${config.glassBorder};
                border-radius: 20px;
                padding: 24px 28px;

                /* Width logic: Grow to fit, min width prevents wrapping */
                flex: 1 1 200px;
                max-width: 420px;

                display: flex;
                flex-direction: column;
                justify-content: center;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);

                transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), 
                            background 0.4s ease, 
                            border-color 0.4s ease,
                            box-shadow 0.4s ease;
                opacity: 0;
                animation: fadeUp 0.6s ease forwards;
                position: relative;
                overflow: visible;
                contain: layout paint; /* Performance: Isolate repaints */
            }

            /* Grid Card Hover - only animate GPU-friendly properties */
            .glass-card:hover {
                transform: translateY(-5px);
                background: rgba(30, 30, 45, 0.8);
                border-color: ${config.glassHighlight};
                box-shadow: 0 15px 30px -5px rgba(0,0,0,0.4);
            }

            /* Subtle gradient light on grid cards too */
            .glass-card::before {
                content: '';
                position: absolute;
                top: 0; left: 0; width: 100%; height: 100%;
                background: radial-gradient(circle at top right, rgba(255,255,255,0.03), transparent 60%);
                opacity: 0;
                transition: opacity 0.3s;
            }
            .glass-card:hover::before { opacity: 1; }

            .glass-label {
                font-size: 0.8rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1.5px;
                color: ${config.labelColor};
                margin-bottom: 10px;
                transition: color 0.3s, text-shadow 0.3s;
                
                /* Allow long text (like matchmakers) to wrap nicely */
                white-space: normal;
                word-wrap: break-word;
                line-height: 1.3;
            }
            
            .glass-card:hover .glass-label {
                color: ${config.labelColorHover};
                text-shadow: 0 0 15px color-mix(in srgb, var(--fcw-accent, #8d124d), transparent 60%);
            }

            .glass-value {
                font-size: clamp(1.4rem, 2vw, 2.1rem);
                font-weight: 700;
                white-space: nowrap;
                
                /* Solid Accent Color for all values */
                color: ${config.accentColor};
                filter: drop-shadow(0 2px 8px color-mix(in srgb, var(--fcw-accent, #8d124d), transparent 75%));
                transition: filter 0.3s;
            }
            
            .glass-card:hover .glass-value {
                filter: drop-shadow(0 0 15px color-mix(in srgb, var(--fcw-accent, #8d124d), transparent 50%));
            }

            /* Entry Animation */
            @keyframes fadeUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

            .glass-card:nth-child(1) { animation-delay: 0.1s; }
            .glass-card:nth-child(2) { animation-delay: 0.15s; }
            .glass-card:nth-child(3) { animation-delay: 0.2s; }
            .glass-card:nth-child(4) { animation-delay: 0.25s; }

            .glass-stats-hidden, .old-header-hidden { display: none !important; }
        `;
            document.head.appendChild(style);

            // 5. BUILD DOM
            const wrapper = document.createElement('div');
            wrapper.className = 'glass-dashboard-wrapper';

            // HERO
            if (heroStat) {
                const heroCard = document.createElement('div');
                heroCard.className = 'glass-hero';

                const labelDiv = document.createElement('div');
                labelDiv.className = 'glass-hero-label';
                labelDiv.textContent = heroStat.label;
                heroCard.appendChild(labelDiv);

                const valueDiv = document.createElement('div');
                valueDiv.className = 'glass-hero-value';
                valueDiv.textContent = heroStat.value;
                heroCard.appendChild(valueDiv);

                wrapper.appendChild(heroCard);
            }

            // GRID
            const grid = document.createElement('div');
            grid.className = 'glass-grid';

            // Apply saved order if exists
            let orderedStats = [...otherStats];
            try {
                const data = JSON.parse(localStorage.getItem('fcw_club_modernizer_data')) || {};
                const path = window.location.pathname;
                const search = window.location.search;
                let clubId = null;
                const pathMatch = path.match(/\/clubs\/(\d+)/);
                if (pathMatch) clubId = pathMatch[1];
                else {
                    const params = new URLSearchParams(search);
                    clubId = params.get('c') || params.get('id');
                }
                const clubSettings = (clubId && data.clubs && data.clubs[clubId]) || {};
                const savedOrder = clubSettings.statsOrder;

                if (savedOrder && Array.isArray(savedOrder) && savedOrder.length > 0) {
                    // Reorder stats based on saved order
                    orderedStats.sort((a, b) => {
                        const aIdx = savedOrder.indexOf(a.label);
                        const bIdx = savedOrder.indexOf(b.label);
                        // If not in saved order, put at end
                        if (aIdx === -1 && bIdx === -1) return 0;
                        if (aIdx === -1) return 1;
                        if (bIdx === -1) return -1;
                        return aIdx - bIdx;
                    });
                }
            } catch (e) { console.warn('[FCW iOS Suite] Order apply error:', e); }

            orderedStats.forEach(stat => {
                const card = document.createElement('div');
                card.className = 'glass-card';

                const l = stat.label.toLowerCase();
                if (l.includes('coin') || l.includes('cost') || l.includes('value')) {
                    card.setAttribute('data-type', 'accent');
                } else if (l.includes('win') || l.includes('pack') || l.includes('opened') || l.includes('goal')) {
                    card.setAttribute('data-type', 'win');
                }

                const labelDiv = document.createElement('div');
                labelDiv.className = 'glass-label';
                labelDiv.textContent = stat.label;
                card.appendChild(labelDiv);

                const valueDiv = document.createElement('div');
                valueDiv.className = 'glass-value';
                valueDiv.textContent = stat.value;
                card.appendChild(valueDiv);
                grid.appendChild(card);
            });

            wrapper.appendChild(grid);

            // 6. SWAP
            statsContainer.classList.add('glass-stats-hidden');
            statsHeader.classList.add('old-header-hidden');
            statsHeader.parentNode.insertBefore(wrapper, statsHeader);

            // 7. APPLY LAYOUT & GLASS TINT FROM SETTINGS
            function applyStatsSettings(e) {
                try {
                    const data = JSON.parse(localStorage.getItem('fcw_club_modernizer_data')) || {};
                    // Get active club ID from URL or default to globals
                    const path = window.location.pathname;
                    const search = window.location.search;
                    let clubId = null;
                    const pathMatch = path.match(/\/clubs\/(\d+)/);
                    if (pathMatch) clubId = pathMatch[1];
                    else {
                        const params = new URLSearchParams(search);
                        clubId = params.get('c') || params.get('id');
                    }

                    const clubSettings = (clubId && data.clubs && data.clubs[clubId]) || {};

                    // Allow event details to override clubSettings for immediate preview
                    const detail = e && e.detail ? e.detail : {};

                    const layout = detail.statsLayout || clubSettings.statsLayout || '4x2';
                    const glassColor = detail.statsGlassColor !== undefined ? detail.statsGlassColor : clubSettings.statsGlassColor;
                    // Default to 0.65 if not set
                    const opacity = detail.statsOpacity !== undefined ? detail.statsOpacity : (clubSettings.statsOpacity !== undefined ? clubSettings.statsOpacity : 0.65);
                    const cornerStyle = detail.statsCornerStyle || clubSettings.statsCornerStyle || 'rounded';

                    // Apply layout class
                    grid.classList.remove('fcw-layout-list', 'fcw-layout-3x2', 'fcw-layout-2x3', 'fcw-layout-4x2', 'fcw-layout-2x4');
                    let applyLayout = layout;
                    if (applyLayout === '3x2' || applyLayout === 'default') applyLayout = '4x2';
                    if (applyLayout === '2x3') applyLayout = '2x4';

                    if (applyLayout === 'list') grid.classList.add('fcw-layout-list');
                    else if (applyLayout === '4x2') grid.classList.add('fcw-layout-4x2');
                    else if (applyLayout === '2x4') grid.classList.add('fcw-layout-2x4');

                    // Apply glass tint & opacity
                    const allCards = wrapper.querySelectorAll('.glass-card, .glass-hero');

                    if (glassColor) {
                        const hex = glassColor.replace('#', '');
                        const r = parseInt(hex.substring(0, 2), 16);
                        const g = parseInt(hex.substring(2, 4), 16);
                        const b = parseInt(hex.substring(4, 6), 16);
                        document.documentElement.style.setProperty('--fcw-stats-glass-tint', `rgba(${r}, ${g}, ${b}, ${opacity})`);
                        allCards.forEach(c => {
                            c.classList.add('fcw-custom-tint');

                            if (c.classList.contains('glass-hero')) {
                                // Apply gradient using the color but with opacity
                                const endOpacity = Math.min(1, opacity + 0.2);
                                c.style.setProperty('background', `linear-gradient(180deg, rgba(${r}, ${g}, ${b}, ${opacity}) 0%, rgba(10, 10, 15, ${endOpacity}) 100%)`, 'important');
                            } else {
                                c.style.background = ''; // Clear inline background if using tint
                            }
                        });
                    } else {
                        document.documentElement.style.removeProperty('--fcw-stats-glass-tint');
                        allCards.forEach(c => {
                            c.classList.remove('fcw-custom-tint');
                            // Apply simple dark glass background with custom opacity
                            // Default is roughly rgba(30, 30, 40, 0.6) for hero and config.glassBg for cards which is similar
                            if (c.classList.contains('glass-hero')) {
                                c.style.background = `linear-gradient(180deg, rgba(30, 30, 40, ${opacity}) 0%, rgba(10, 10, 15, ${Math.min(1, opacity + 0.2)}) 100%)`;
                            } else {
                                c.style.background = `rgba(30, 30, 40, ${opacity})`;
                            }
                        });
                    }

                    // Apply corner style
                    allCards.forEach(c => {
                        if (cornerStyle === 'sharp') {
                            c.classList.add('fcw-sharp-corners');
                        } else {
                            c.classList.remove('fcw-sharp-corners');
                        }
                    });

                    // Store wrapper reference globally for reorder mode
                    window.__fcwStatsWrapper = wrapper;
                    window.__fcwStatsGrid = grid;
                } catch (err) { console.warn('[FCW iOS Suite] Stats settings error:', err); }
            }
            applyStatsSettings();

            // Listen for settings changes
            window.addEventListener('storage', (e) => {
                if (e.key === 'fcw_club_modernizer_data') applyStatsSettings();
            });
            window.addEventListener('fcw-stats-updated', applyStatsSettings);

            // Signal to modernizer that the stats swap is complete so it can remove the anti-flash cloak
            document.dispatchEvent(new CustomEvent('fcw-stats-ready'));
        }

        // =================================================================
        // PART 2: MYSTIC'S LEADERBOARD (Glass Table)
        // =================================================================
        function initLeaderboardTheme() {
            // 1. Define the CSS styles
            const css = `
            /* --- IOS 26 ULTRA GLASS THEME --- */
            :root {
                /* Clearer, more transparent background to let the image bleed through */
                --ios-glass-bg: rgba(15, 20, 35, 0.15); /* Much more transparent for better blending */
                /* Strong blur is key for the "seam" effect */
                --ios-blur: blur(50px);
                --ios-border: 1px solid rgba(255, 255, 255, 0.12);
                --ios-border-hover: 1px solid rgba(255, 255, 255, 0.25);
                --ios-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);

                /* Apple Spring Animation Curve */
                --ios-ease: cubic-bezier(0.25, 1, 0.5, 1);

                --ios-font: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, sans-serif;
                --ios-accent: var(--fcw-accent, #0A84FF); /* Interlinked */
                --ios-text: #FFFFFF;
                --ios-text-secondary: rgba(255, 255, 255, 0.55);
            }

            /* --- CONTAINER: The main glass pane --- */
            .leaderboard-container {
                font-family: var(--ios-font) !important;
                background: var(--ios-glass-bg) !important;

                /* The engine for the glass effect */
                backdrop-filter: var(--ios-blur) saturate(200%) !important;
                -webkit-backdrop-filter: var(--ios-blur) saturate(200%) !important;

                border: var(--ios-border) !important;
                border-top: 1px solid rgba(255, 255, 255, 0.25) !important; /* Top light highlight */
                border-radius: 32px !important;
                box-shadow: var(--ios-shadow) !important;

                padding: 40px !important;
                max-width: 950px !important;
                margin: 80px auto !important;
                color: var(--ios-text) !important;

                /* Smooth entry */
                opacity: 0;
                transform: scale(0.96) translateY(20px);
                animation: iosScaleIn 0.8s var(--ios-ease) forwards;
            }

            /* --- HEADER --- */
            .leaderboard-container h2 {
                font-weight: 700 !important;
                font-size: 2.2rem !important;
                color: #fff !important;
                text-align: center;
                margin-bottom: 40px !important;
                letter-spacing: -0.02em !important;
                text-shadow: 0 4px 20px rgba(0,0,0,0.3);
            }

            /* --- TABLE RESET --- */
            .leaderboard-table {
                border-collapse: separate !important;
                border-spacing: 0 8px !important; /* Space between rows */
                width: 100% !important;
                background: transparent !important;
                border: none !important;
                box-shadow: none !important;
            }

            .leaderboard-table thead th {
                background: transparent !important;
                color: var(--ios-text-secondary) !important;
                font-weight: 600 !important;
                text-transform: uppercase !important;
                font-size: 0.75rem !important;
                letter-spacing: 1.2px !important;
                padding: 0 24px 12px 24px !important;
                border: none !important;
            }

            /* --- ROW STYLING (Floating Glass Strips) --- */
            .leaderboard-table tbody tr {
                /* Extremely subtle background for rows to blend */
                background: rgba(255, 255, 255, 0.03) !important;
                border: 1px solid rgba(255, 255, 255, 0.05) !important;
                border-radius: 18px !important;

                transition: transform 0.4s var(--ios-ease), background 0.3s ease, border-color 0.3s ease !important;
                cursor: default;

                /* Initial state for stagger animation */
                opacity: 0;
                transform: translateY(20px);
                animation: iosSlideUp 0.6s var(--ios-ease) forwards;
            }

            /* Border Radius fix for table rows */
            .leaderboard-table tbody tr td:first-child { border-top-left-radius: 18px; border-bottom-left-radius: 18px; }
            .leaderboard-table tbody tr td:last-child { border-top-right-radius: 18px; border-bottom-right-radius: 18px; }

            /* Row Hover: Lifts up and brightens slightly */
            .leaderboard-table tbody tr:hover {
                background: rgba(255, 255, 255, 0.08) !important;
                border-color: rgba(255, 255, 255, 0.2) !important;
                transform: scale(1.015) translateY(-2px) !important;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2) !important;
                z-index: 10;
                position: relative;
            }

            /* --- CELLS --- */
            .leaderboard-table td {
                padding: 16px 24px !important;
                border: none !important;
                color: var(--ios-text) !important;
                vertical-align: middle !important;
                font-size: 1rem !important;
                font-weight: 500 !important;
            }

            /* Rank Column */
            .leaderboard-table .rank-column {
                font-weight: 700 !important;
                color: var(--ios-text-secondary) !important;
                width: 70px !important;
                text-align: center !important;
                font-feature-settings: "tnum";
                font-variant-numeric: tabular-nums;
            }

            /* Medal Colors - NOW HANDLED BY JS TO PREVENT PAGINATION ISSUES */
            .leaderboard-table .rank-gold .rank-column { color: #FFD60A !important; text-shadow: 0 0 20px rgba(255, 214, 10, 0.6); font-size: 1.3rem !important; }
            .leaderboard-table .rank-silver .rank-column { color: #E0E0E0 !important; text-shadow: 0 0 15px rgba(224, 224, 224, 0.4); font-size: 1.2rem !important; }
            .leaderboard-table .rank-bronze .rank-column { color: #FF9F0A !important; text-shadow: 0 0 15px rgba(255, 159, 10, 0.4); font-size: 1.1rem !important; }

            /* Links (Club Names) */
            .leaderboard-table a {
                color: #fff !important;
                text-decoration: none !important;
                font-weight: 600 !important;
                font-size: 1.05rem !important;
                transition: color 0.2s;
            }

            .leaderboard-table a:hover {
                color: var(--ios-accent) !important;
            }

            /* Value Column */
            .leaderboard-table td:last-child {
                font-family: -apple-system, BlinkMacSystemFont, "SF Pro Rounded", "SF Pro Display", sans-serif !important;
                font-weight: 600 !important;
                text-align: right !important;
                color: #64D2FF !important; /* iOS Light Blue */
                letter-spacing: 0.5px;
            }

            /* --- PAGINATION --- */
            .pagination {
                margin-top: 40px !important;
                display: flex !important;
                justify-content: center !important;
                gap: 20px !important;
            }

            .pagination button {
                background: rgba(255, 255, 255, 0.1) !important;
                backdrop-filter: blur(10px) !important;
                border: 1px solid rgba(255, 255, 255, 0.1) !important;
                color: #fff !important;
                padding: 10px 28px !important;
                border-radius: 100px !important; /* Pill shape */
                font-size: 0.9rem !important;
                font-weight: 600 !important;
                text-transform: none !important;
                letter-spacing: 0.5px !important;
                cursor: pointer !important;
                transition: all 0.3s var(--ios-ease) !important;
            }

            .pagination button:hover {
                background: rgba(255, 255, 255, 0.25) !important;
                transform: translateY(-2px) !important;
                box-shadow: 0 8px 20px rgba(0,0,0,0.3) !important;
            }

            /* --- ANIMATIONS --- */
            @keyframes iosScaleIn {
                to { opacity: 1; transform: scale(1) translateY(0); }
            }

            @keyframes iosSlideUp {
                to { opacity: 1; transform: translateY(0); }
            }
        `;

            // 2. Inject CSS
            const styleSheet = document.createElement('style');
            styleSheet.innerText = css;
            document.head.appendChild(styleSheet);

            // Signal that leaderboard custom CSS is ready (triggers reveal in critical.css)
            document.documentElement.classList.add('fcw-leaderboard-ready');

            // 3. Init Animations Logic
            const rows = document.querySelectorAll('.leaderboard-table tbody tr');
            rows.forEach((row, index) => {
                // Apple style cascading delay
                row.style.animationDelay = (index * 0.04) + 's';

                // CHECK ACTUAL RANK
                const rankCell = row.querySelector('.rank-column');
                if (rankCell) {
                    const rank = rankCell.textContent.trim();
                    if (rank === '1') {
                        row.classList.add('rank-gold');
                        row.style.background = "linear-gradient(90deg, rgba(255, 214, 10, 0.1) 0%, rgba(255,255,255,0.03) 100%) !important";
                    } else if (rank === '2') {
                        row.classList.add('rank-silver');
                        row.style.background = "linear-gradient(90deg, rgba(224, 224, 224, 0.08) 0%, rgba(255,255,255,0.03) 100%) !important";
                    } else if (rank === '3') {
                        row.classList.add('rank-bronze');
                        row.style.background = "linear-gradient(90deg, rgba(255, 159, 10, 0.08) 0%, rgba(255,255,255,0.03) 100%) !important";
                    }
                }
            });
        }


        // =================================================================
        // MASTER INITIALIZER
        // =================================================================
        function init() {
            // Attempt to run both.
            // The Club Dashboard has built-in checks and will only run if it finds specific headers.
            // The Leaderboard Theme applies global styles and looks for leaderboard classes.
            initClubDashboard();
            initLeaderboardTheme();
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    } // End initIOSSuite
})();

    // === MODERNIZER.JS ===
// ==UserScript==
// @name         FC Watch - Club Modernizer v3.2 (Fixed Init & Identity)
// @namespace    http://tampermonkey.net/
// @version      3.2
// @description  Modern UI with strict profile owner verification. Fixes black banner bugs and race conditions.
// @match        https://www.fc-watch.com/clubs/*
// @match        https://www.fc-watch.com/club.php*
// @match        https://www.fc-watch.com/myclub*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    // === KILLSWITCH CHECK ===
    // Prefers Promise-based approach when available, falls back to polling
    function waitForKillswitch(callback, maxWait = 500) {
        // Try Promise-based approach first (faster, no polling)
        if (window.__FCW_EXTENSION_STATE?.ready instanceof Promise) {
            window.__FCW_EXTENSION_STATE.ready.then(isEnabled => {
                if (isEnabled) callback();
                else {
                    console.log('[FCW Modernizer] Extension disabled, not running.');
                    // Still remove anti-flash to show default page
                    const af = document.getElementById('fcw-anti-flash');
                    if (af) af.remove();
                    const cf = document.getElementById('fcw-critical-css');
                    if (cf) cf.remove();
                    if (document.body) document.body.classList.add('fcw-ready');
                }
            });
            return;
        }

        // Fallback: poll with reduced frequency
        let waited = 0;
        const check = () => {
            if (window.__FCW_EXTENSION_STATE?.loaded) {
                if (window.__FCW_EXTENSION_STATE.enabled) {
                    callback();
                } else {
                    console.log('[FCW Modernizer] Extension disabled, not running.');
                    // Still remove anti-flash to show default page
                    const af = document.getElementById('fcw-anti-flash');
                    if (af) af.remove();
                    const cf = document.getElementById('fcw-critical-css');
                    if (cf) cf.remove();
                    if (document.body) document.body.classList.add('fcw-ready');
                }
            } else if (waited < maxWait) {
                waited += 10;
                setTimeout(check, 10);
            } else {
                callback(); // Failsafe - assume enabled
            }
        };
        check();
    }

    // === IndexedDB Helper for Large Banner Images (GIFs) ===
    const DB_CONFIG = { name: 'FCW_Data', store: 'assets', version: 1 };
    const fcwDB = {
        _db: null,
        open: function () {
            if (this._db) return Promise.resolve(this._db);
            return new Promise((resolve, reject) => {
                const req = indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);
                req.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains(DB_CONFIG.store)) {
                        db.createObjectStore(DB_CONFIG.store);
                    }
                };
                req.onsuccess = (e) => {
                    this._db = e.target.result;
                    resolve(this._db);
                };
                req.onerror = (e) => reject(e.target.error);
            });
        },
        put: function (key, val) {
            return this.open().then(db => new Promise((resolve, reject) => {
                const tx = db.transaction(DB_CONFIG.store, 'readwrite');
                const store = tx.objectStore(DB_CONFIG.store);
                store.put(val, key);
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            }));
        },
        get: function (key) {
            return this.open().then(db => new Promise((resolve, reject) => {
                const tx = db.transaction(DB_CONFIG.store, 'readonly');
                const store = tx.objectStore(DB_CONFIG.store);
                const req = store.get(key);
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            }));
        },
        delete: function (key) {
            return this.open().then(db => new Promise((resolve, reject) => {
                const tx = db.transaction(DB_CONFIG.store, 'readwrite');
                const store = tx.objectStore(DB_CONFIG.store);
                store.delete(key);
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            }));
        }
    };

    // === EARLY ACCENT COLOR PRELOAD (Runs Before Killswitch) ===
    // Ensures accent color is set immediately for anti-flash CSS
    function preloadAccentColor() {
        try {
            let accent = '#8d124d'; // default
            const navSettings = localStorage.getItem('fcw_navbar_settings');
            if (navSettings) {
                const parsed = JSON.parse(navSettings);
                if (parsed && parsed.accent) accent = parsed.accent;
            }
            document.documentElement.style.setProperty('--fcw-accent', accent);
        } catch (e) {
            console.warn('[FCW Modernizer] Error preloading accent color:', e);
        }
    }

    // Run accent preload immediately
    preloadAccentColor();

    // === EARLY BANNER PRELOAD (Runs Before Killswitch) ===
    // Prevents flash of default banner by loading custom banner immediately
    function preloadBanner() {
        try {
            // 1. Identify Club ID from URL
            const urlParams = new URLSearchParams(window.location.search);
            const currentClubId = urlParams.get('c');

            // Block running on visit.php pages specifically as requested
            if (window.location.href.includes('/clubs/visit.php')) return;

            if (!currentClubId) return; // Not a club page

            // 2. Check for Static Preview First (Instant - Synchronous)
            const previewKey = `fcw_banner_preview_${currentClubId}`;
            const previewData = localStorage.getItem(previewKey);

            if (previewData) {
                //Found instant preview! Set it immediately.
                document.documentElement.style.setProperty('--fcw-preloaded-banner', `url("${previewData}")`);
                // We still proceed to try and load the full quality version below (e.g. animated GIF)
                // which will override this variable once loaded.
            }

            const storageData = JSON.parse(localStorage.getItem('fcw_club_modernizer_data')) || {};
            const clubDataKey = `club_${currentClubId}`;
            const clubData = storageData[clubDataKey];

            if (clubData?.bannerUrl) {
                const mode = clubData.bannerStorageMode || 'local';

                if (mode === 'local' && clubData.bannerUrl) {
                    // Set CSS variable
                    document.documentElement.style.setProperty('--fcw-preloaded-banner', `url("${clubData.bannerUrl}")`);
                } else if (mode === 'url' && clubData.bannerUrl) {
                    // Direct URL
                    document.documentElement.style.setProperty('--fcw-preloaded-banner', `url("${clubData.bannerUrl}")`);
                } else if (mode === 'db') {
                    // Async load from IndexedDB
                    // (Takes some ms, but preview handles the initial gap now)
                    const req = indexedDB.open('FCW_Data', 1);
                    req.onsuccess = (e) => {
                        const db = e.target.result;
                        if (db.objectStoreNames.contains('assets')) {
                            const tx = db.transaction('assets', 'readonly');
                            const store = tx.objectStore('assets');
                            const getReq = store.get('banner_' + currentClubId);
                            getReq.onsuccess = () => {
                                const data = getReq.result;
                                if (data) {
                                    let url;
                                    if (data instanceof Blob) {
                                        url = URL.createObjectURL(data);
                                    } else if (typeof data === 'string') {
                                        url = data;
                                    }
                                    if (url) {
                                        document.documentElement.style.setProperty('--fcw-preloaded-banner', `url("${url}")`);
                                    }
                                }
                            };
                        }
                    };
                }
            }
        } catch (ex) {
            console.error('[FCW Modernizer] Error preloading banner:', ex);
        }
    }

    // Run preload immediately
    preloadBanner();

    // === CRITICAL CSS INJECTION (Runs Before Killswitch) ===
    // Inject all styling immediately to prevent any FOUC
    function injectCriticalCSS() {
        const criticalStyle = document.createElement('style');
        criticalStyle.id = 'fcw-critical-css';
        criticalStyle.innerHTML = `
        /* HIDE PAGE IMMEDIATELY - Reveal after styling is ready */
        body:not(.fcw-ready) {
            opacity: 0 !important;
            visibility: hidden !important;
        }
        body.fcw-ready {
            opacity: 1 !important;
            visibility: visible !important;
            transition: opacity 0.15s ease-out !important;
        }
        
        /* Base dark theme */
        html, body { 
            background-color: #1a1f29 !important; 
            color: #f0f0f0 !important;
        }
        
        /* Use preloaded banner if available */
        #page-wrapper > div > div > div[style*="height: 348px"],
        #page-wrapper > div > div > div[style*="height:348px"] {
            background-image: var(--fcw-preloaded-banner, none) !important;
            background-size: cover !important;
            background-position: center !important;
        }
        
        /* Button Row */
        div[style*="display:flex; justify-content:center; gap:10px;"] {
            background: rgba(15, 20, 30, 0.9) !important;
            padding: 15px !important;
            border-radius: 15px !important;
            border: 1px solid rgba(255, 255, 255, 0.15) !important;
            backdrop-filter: blur(10px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            margin-bottom: 30px !important;
            flex-wrap: wrap;
            align-items: center;
        }
        
        /* Buttons */
        body .btn-primary, body .fcw-settings-btn {
            background-color: rgba(255, 255, 255, 0.05) !important;
            border: 1px solid var(--fcw-accent, #8d124d) !important;
            color: #fff !important;
            border-radius: 8px !important;
            padding: 10px 20px !important;
            font-weight: 700 !important;
            text-transform: uppercase !important;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1) !important;
            margin: 0 5px !important;
            height: 44px !important;
            line-height: 1 !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
        }
        
        /* Stats Table, Leaderboard & Packs Table */
        .table, .table-striped, #packsTable {
            background-color: rgba(15, 20, 30, 0.9) !important;
            border-radius: 15px !important;
            overflow: hidden !important;
            border: 1px solid rgba(255, 255, 255, 0.15) !important;
            backdrop-filter: blur(20px) !important;
            box-shadow: 0 20px 50px rgba(0,0,0,0.5) !important;
            margin-top: 30px !important;
            max-width: 800px !important; /* Slightly wider for packs */
            width: 100% !important;
        }
        .table > tbody > tr,
        .table-striped > tbody > tr,
        #packsTable > tbody > tr {
            background-color: transparent !important;
        }
        /* Specific Modernization for Packs Table */
        #packsTable thead th {
            background-color: rgba(255, 255, 255, 0.05) !important;
            color: var(--fcw-accent, #d7ab04) !important; /* Uses accent color */
            border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
            padding: 15px !important;
            text-transform: uppercase !important;
            font-weight: 600 !important;
            letter-spacing: 0.5px !important;
        }
        #packsTable tbody td {
            padding: 12px 15px !important;
            border-top: 1px solid rgba(255, 255, 255, 0.05) !important;
            color: #e0e0e0 !important;
        }

        /* --- CLUB CONTROL PANEL STYLING (CRITICAL) --- */
        .club-control-panel {
            display: block !important;
            width: calc(100% - 40px) !important;
            max-width: 600px !important;
            margin: 0 auto 20px auto !important;
            text-align: center;
        }

        #club-control-panel-toggle {
            background: rgba(18, 18, 28, 0.65) !important;
            backdrop-filter: blur(30px) !important;
            -webkit-backdrop-filter: blur(30px) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            border-radius: 8px !important;
            color: var(--fcw-accent, #8d124d) !important;
            font-weight: 700 !important;
            font-size: 0.85rem !important;
            text-transform: uppercase !important;
            letter-spacing: 1.5px !important;
            padding: 14px 24px !important;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1) !important;
            transition: all 0.3s ease !important;
            width: 100% !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
        }

        #club-control-panel-toggle:hover {
            background: rgba(30, 30, 45, 0.8) !important;
            border-color: rgba(255, 255, 255, 0.25) !important;
            box-shadow: 0 10px 20px -5px rgba(0,0,0,0.4) !important;
            transform: translateY(-2px) !important;
        }

        #club-control-panel-toggle .caret {
            border-top-color: var(--fcw-accent, #8d124d) !important;
            border-width: 6px !important;
            margin-left: 10px !important;
        }

        .club-control-panel .dropdown-menu {
            background: rgba(18, 18, 28, 0.95) !important;
            backdrop-filter: blur(30px) !important;
            -webkit-backdrop-filter: blur(30px) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            border-radius: 8px !important;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5) !important;
            width: 100% !important;
            margin-top: 5px !important;
            padding: 5px 0 !important;
        }

        .club-control-panel .dropdown-menu li a {
            color: #fff !important;
            font-size: 0.85rem !important;
            font-weight: 600 !important;
            text-transform: uppercase !important;
            letter-spacing: 1px !important;
            padding: 12px 20px !important;
            transition: all 0.2s ease !important;
        }

        .club-control-panel .dropdown-menu li a:hover {
            background: rgba(255, 255, 255, 0.1) !important;
            color: var(--fcw-accent, #8d124d) !important;
            text-shadow: 0 0 10px color-mix(in srgb, var(--fcw-accent, #8d124d), transparent 50%) !important;
        }
        #packsTable tbody td a {
            color: var(--fcw-accent, #d7ab04) !important; /* Links use accent */
            text-decoration: none !important;
            font-weight: 600 !important;
            transition: filter 0.2s ease !important;
        }
        #packsTable tbody td a:hover {
            filter: brightness(1.3) !important;
        }
        #packsTable tbody tr:hover {
             background-color: rgba(255, 255, 255, 0.05) !important;
        }

        /* Leaderboard Table Specific */
        .leaderboard-table,
        #packsTable, /* Add to hide-list */
        body:not(.fcw-ready) .leaderboard-table,
        body:not(.fcw-ready) #packsTable {
             /* ... existing styles ... */
            background-color: rgba(15, 20, 30, 0.9) !important;
            border-radius: 15px !important;
            overflow: hidden !important;
            border: 1px solid rgba(255, 255, 255, 0.15) !important;
            backdrop-filter: blur(20px) !important;
            box-shadow: 0 20px 50px rgba(0,0,0,0.5) !important;
            margin: 30px auto !important;
            width: 100% !important;
            border-collapse: separate !important;
            border-spacing: 0 !important;
            /* Force hidden until ready to prevent partial rendering */
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        body.fcw-ready .leaderboard-table,
        body.fcw-ready #packsTable {
            opacity: 1 !important;
        }

        /* Leaderboard Specifics */
        .leaderboard-table thead {
            background: rgba(255, 255, 255, 0.05) !important;
        }
        .leaderboard-table tbody tr {
            background-color: transparent !important;
            transition: background-color 0.2s ease !important;
        }
        .leaderboard-table tbody tr:hover {
            background-color: rgba(255, 255, 255, 0.05) !important;
        }
        .leaderboard-table a {
            color: var(--fcw-accent, #8d124d) !important;
            text-decoration: none !important;
        }
        .leaderboard-table .rank-column {
            text-align: center !important;
            font-weight: 700 !important;
            color: var(--fcw-accent, #8d124d) !important;
        }
        
        /* Hide original navbar styling flash */
        .navbar-default {
            background-color: rgba(15, 20, 30, 0.9) !important;
            border-color: rgba(255, 255, 255, 0.1) !important;
            box-sizing: border-box !important;
            width: 100% !important;
            min-height: 50px !important;
            overflow: visible !important;
        }
        .navbar-default .navbar-nav > li > a {
            color: #f0f0f0 !important;
            white-space: nowrap !important;
        }
        .navbar-default * {
            box-sizing: border-box !important;
        }
        
        /* General text colors */
        h1, h2, h3, h4, h5, h6, p, span, a, div {
            color: inherit;
        }
        
        /* ============================================
           CRITICAL FIX: Navbar Dropdown Z-Index 
           Problem: Dropdowns extend upward (negative margin) 
           and get hidden behind navbars above them.
           Solution: Make the filter bar (navbar-default) the 
           HIGHEST stacking context on the page.
           ============================================ */
        
        /* Step 1: Top navbar (navbar-inverse) gets priority by default */
        nav.navbar.navbar-inverse {
            z-index: 1060 !important;
            position: relative !important;
        }
        
        /* Step 2: Filter bar (navbar-default) sits below by default */
        .navbar-default {
            z-index: 1050 !important;
            position: relative !important;
            overflow: visible !important;
        }
        
        /* Step 3: Ensure ALL dropdown parents allow overflow */
        .navbar-default .container-fluid,
        .navbar-default .navbar-collapse,
        .navbar-default .navbar-nav,
        .navbar-default .navbar-nav > li,
        .navbar-default .dropdown,
        nav.navbar .container-fluid,
        nav.navbar .navbar-collapse,
        nav.navbar .navbar-nav,
        nav.navbar .navbar-nav > li,
        nav.navbar .dropdown {
            overflow: visible !important;
        }
        
        /* Step 4: Force ALL dropdown menus to maximum z-index */
        .dropdown-menu,
        .sm-nowrap,
        ul[id^="sm-"],
        .navbar-nav .dropdown-menu,
        .navbar-default .dropdown-menu {
            z-index: 2147483647 !important;
            position: absolute !important;
            overflow: visible !important;
        }
        
        /* Step 5: Nested submenus - ALL levels must be visible */
        .dropdown-menu .dropdown-menu,
        .dropdown-menu ul,
        .dropdown-menu .dropdown-menu .dropdown-menu {
            z-index: 2147483647 !important;
            position: absolute !important;
            overflow: visible !important;
        }
        
        /* Step 6: SmartMenus specific - ensure scroll containers work */
        .sm-nowrap {
            z-index: 2147483647 !important;
        }
        
        /* ================================================
           FUTWATCH NESTED DROPDOWN FIX
           The Futwatch dropdown is nested multiple levels deep.
           Ensure all parent li elements allow overflow.
           ================================================ */
        
        /* All li elements in dropdowns must allow overflow for child menus */
        .dropdown-menu li,
        .dropdown-menu > li,
        .navbar-default .dropdown-menu li,
        #group-futwatch-sub li,
        [id*="futwatch"] li {
            position: relative !important;
            overflow: visible !important;
        }
        
        /* Submenu anchors with nested menus */
        .dropdown-menu li.open,
        .dropdown-menu li:hover {
            overflow: visible !important;
        }
        
        /* Submenus of submenus - position to the right */
        .dropdown-menu .dropdown-menu,
        .dropdown-menu ul.dropdown-menu {
            left: 100% !important;
            top: 0 !important;
            margin-left: 2px !important;
        }
        
        /* Ensure the specific Futwatch submenu structure works (Grid Layout) */
        #group-futwatch-sub[style*="block"],
        [id*="futwatch-sub"][style*="block"] {
            display: grid !important;
            grid-template-rows: repeat(14, auto) !important;
            grid-auto-flow: column !important;
            overflow: visible !important;
            width: max-content !important;
            max-width: none !important;
            height: auto !important;
            max-height: 80vh !important;
            gap: 2px 10px !important;
        }
        
        #group-futwatch-sub > li,
        [id*="futwatch-sub"] > li {
            width: 260px !important;
            min-width: 260px !important;
        }
        
        /* Leaf node massive submenus should scroll vertically so they don't widen off-screen */
        #group-daily-reward-pack-sub,
        [id*="daily-reward-pack-sub"] {
            overflow-y: auto !important;
            overflow-x: hidden !important;
            max-height: 75vh !important;
            overscroll-behavior: contain !important;
            width: max-content !important;
            pointer-events: auto !important;
            touch-action: pan-y !important;
            padding-bottom: 20px !important;
            scrollbar-width: thin !important;
        }
        
        #group-futwatch-sub .dropdown-menu,
        #group-futwatch-sub ul {
            z-index: 2147483647 !important;
            position: absolute !important;
            left: 100% !important;
            top: 0 !important;
        }
        `;
        (document.head || document.documentElement).appendChild(criticalStyle);
    }

    // Run critical CSS injection immediately
    injectCriticalCSS();

    // === EARLY FILTER INJECTION (Runs Before Killswitch) ===
    // Injects the Overhauled filter section immediately without waiting for killswitch
    function injectFiltersEarly() {
        // Load custom filters from localStorage
        let customFilters = [];
        try {
            const stored = localStorage.getItem('fc_watch_custom_filters_v4');
            customFilters = stored ? JSON.parse(stored) : [];
            customFilters.sort((a, b) => (a.order || 0) - (b.order || 0));
        } catch (e) {
            return; // No filters to inject
        }

        if (customFilters.length === 0) return;

        // Make setSBCardType available globally
        if (typeof window.fcwSetCardType !== 'function') {
            window.fcwSetCardType = function (id, imageUrl) {
                if (typeof window.setSBCardType === 'function') {
                    window.setSBCardType(id, imageUrl);
                } else {
                    const url = new URL(window.location.href);
                    url.searchParams.set('type', id);
                    window.location.href = url.toString();
                }
            };
        }

        const createSection = () => {
            // Check if already exists
            if (document.getElementById('fcw-overhauled-section')) return true;

            // Find the Card Type menu
            let cardTypeMenu = null;

            // Strategy 1: Find "Card Type" text
            const allLinks = document.querySelectorAll('a');
            for (const link of allLinks) {
                if (link.textContent && link.textContent.trim().startsWith('Card Type')) {
                    const parentLi = link.closest('li');
                    if (parentLi) {
                        cardTypeMenu = parentLi.querySelector('ul');
                        if (cardTypeMenu) break;
                    }
                }
            }

            // Strategy 2: Find group-futwatch
            if (!cardTypeMenu) {
                const futwatch = document.getElementById('group-futwatch');
                if (futwatch) cardTypeMenu = futwatch.closest('ul');
            }

            if (!cardTypeMenu) return false;

            // Build filter HTML
            const currentType = new URLSearchParams(window.location.search).get('type');
            let filtersHtml = '';
            customFilters.forEach(cf => {
                if (!cf.id || !cf.label || !cf.imageUrl) return;
                const isActive = currentType === cf.id;
                const activeStyle = isActive ? 'font-weight: bold; color: var(--fcw-accent, #8d124d);' : '';
                filtersHtml += `
                    <li>
                        <a href="#" onclick="if(typeof setSBCardType==='function'){setSBCardType('${cf.id}','${cf.imageUrl}');}else{window.fcwSetCardType('${cf.id}','${cf.imageUrl}');}return false;" style="display: flex; align-items: center; gap: 6px; ${activeStyle}">
                            <img class="cardicon" src="${cf.imageUrl}" style="height: 25px; width: auto;" onerror="this.style.display='none'">
                            ${cf.label}
                        </a>
                    </li>
                `;
            });

            // Create the section
            const overhauledLi = document.createElement('li');
            overhauledLi.id = 'fcw-overhauled-section';
            overhauledLi.innerHTML = `
                <a rel="nofollow" href="#" class="has-submenu" id="group-fcw-overhauled" aria-haspopup="true" aria-controls="fcw-overhauled-sub" aria-expanded="false">
                    <span style="color: #fff !important; font-weight: 700;">⚡ Overhauled</span>
                    <span class="caret"></span>
                </a>
                <ul class="dropdown-menu" id="fcw-overhauled-sub" style="display: none;">
                    ${filtersHtml}
                </ul>
            `;

            // Use CSS-based hover for immediate show/hide (no JS delays)
            // The submenu is initially hidden; CSS will show it on hover
            const subMenu = overhauledLi.querySelector('#fcw-overhauled-sub');
            if (subMenu) {
                // Position the submenu correctly
                subMenu.style.top = '-5px';
                subMenu.style.left = '88%';
                subMenu.style.position = 'absolute';
                subMenu.style.zIndex = '1000000';

                // Add inline CSS for hover behavior (works immediately, no delays)
                overhauledLi.style.position = 'relative';

                // CSS hover approach: toggle on mouseenter/leave without delay
                overhauledLi.onmouseenter = () => { subMenu.style.display = 'block'; };
                overhauledLi.onmouseleave = () => { subMenu.style.display = 'none'; };
            }

            cardTypeMenu.insertBefore(overhauledLi, cardTypeMenu.firstChild);
            console.log('[FCW Early] Injected Overhauled section with', customFilters.length, 'filters');
            return true;
        };

        // Try immediately
        if (createSection()) return;

        // Ultra-fast RAF polling
        let attempts = 0;
        const rafPoll = () => {
            attempts++;
            if (createSection()) return;
            if (attempts < 120) { // ~2 seconds at 60fps
                requestAnimationFrame(rafPoll);
            }
        };
        requestAnimationFrame(rafPoll);
    }

    // Run filter injection immediately
    injectFiltersEarly();

    // === NAVBAR Z-INDEX FIX ===
    // MOVED TO navbar.js TO RUN ON ALL PAGES GLOBALLY
    // setupNavbarZIndexFix() removed from here to prevent conflicts.

    // Run after DOM is ready
    if (document.readyState === 'loading') {
        // document.addEventListener('DOMContentLoaded', setupNavbarZIndexFix); 
    } else {
        // requestAnimationFrame(setupNavbarZIndexFix);
    }

    // Failsafe: Reveal page after 500ms even if initialization hasn't completed
    setTimeout(() => {
        if (document.body && !document.body.classList.contains('fcw-ready')) {
            document.body.classList.add('fcw-ready');
        }
    }, 500);

    waitForKillswitch(runModernizer);

    function runModernizer() {
        // --- 1. Anti-Flash Style Injection (Immediate) ---
        const antiFlashStyle = document.createElement('style');
        antiFlashStyle.id = 'fcw-anti-flash';
        antiFlashStyle.innerHTML = `
        /* Use preloaded banner if available */
        #page-wrapper > div > div > div[style*="height: 348px"],
        #page-wrapper > div > div > div[style*="height:348px"] {
            background-image: var(--fcw-preloaded-banner, none) !important;
            background-size: cover !important;
            background-position: center !important;
        }
        html, body { background-color: #1a1f29; }
        
        /* Immediate Button Row Styling (Optimization) */
        div[style*="display:flex; justify-content:center; gap:10px;"] {
            background: rgba(15, 20, 30, 0.9) !important;
            padding: 15px !important;
            border-radius: 15px !important;
            border: 1px solid rgba(255, 255, 255, 0.15) !important;
            backdrop-filter: blur(10px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            margin-bottom: 30px !important;
            flex-wrap: wrap;
            align-items: center;
        }
        body .btn-primary, body .fcw-settings-btn {
            background-color: rgba(255, 255, 255, 0.05) !important;
            border: 1px solid var(--fcw-accent, #8d124d) !important;
            color: #fff !important;
            border-radius: 8px !important;
            padding: 10px 20px !important;
            font-weight: 700 !important;
            text-transform: uppercase !important;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1) !important;
            margin: 0 5px !important;
            height: 44px !important;
            line-height: 1 !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
        }
        
        /* Immediate Stats Table Styling (Prevent FOUC) */
        .table-striped {
            background-color: rgba(15, 20, 30, 0.9) !important;
            border-radius: 15px !important;
            overflow: hidden !important;
            border: 1px solid rgba(255, 255, 255, 0.15) !important;
            backdrop-filter: blur(20px) !important;
            box-shadow: 0 20px 50px rgba(0,0,0,0.5) !important;
            margin-top: 30px !important;
            max-width: 600px !important;
            width: 100% !important;
        }
        .table-striped > tbody > tr {
            background-color: transparent !important;
        }
        .table-striped > tbody > tr:nth-of-type(odd),
        .table-striped > tbody > tr:nth-of-type(even) {
            background-color: transparent !important;
        }
        .table-striped > tbody > tr[style*="color: white"] {
            color: inherit !important;
        }
        .table > tbody > tr > th {
            color: #94a3b8 !important;
            font-weight: 600 !important;
            text-transform: uppercase !important;
            border-top: 1px solid rgba(255,255,255,0.08) !important;
            background: transparent !important;
        }
        .table > tbody > tr > td {
            font-family: 'Courier New', monospace !important;
            font-size: 1.1rem !important;
            color: #fff !important;
            text-align: right !important;
            font-weight: 700 !important;
            border-top: 1px solid rgba(255,255,255,0.08) !important;
            background: transparent !important;
        }
    `;
        (document.head || document.documentElement).appendChild(antiFlashStyle);

        // --- 2. Identity & ID Utilities ---

        /**
         * Scrapes the navigation bar to find the Logged-In User's Club ID.
         * Looks for links containing 'c=' or '/clubs/' that usually appear in the user menu.
         * Uses localStorage cache as fallback if live scrape fails (prevents race conditions).
         */
        function getLoggedInUserId() {
            const CACHE_KEY = 'fcw_cached_user_id';

            // Select links in the navbar. Adjust selector if the nav structure is specific (e.g. .navbar-right)
            const navLinks = document.querySelectorAll('nav a[href*="c="], nav a[href*="/clubs/"]');

            for (let link of navLinks) {
                const href = link.getAttribute('href');
                // Look for standard pattern: c=12345 or /clubs/12345
                const match = href.match(/[?&]c=(\d+)|clubs\/(\d+)/);
                if (match) {
                    // Group 1 is c=..., Group 2 is clubs/...
                    const userId = match[1] || match[2];
                    // Cache this ID for future fallback
                    try { localStorage.setItem(CACHE_KEY, userId); } catch (e) { }
                    return userId;
                }
            }

            // Fallback: use cached ID if live scrape failed
            try {
                const cached = localStorage.getItem(CACHE_KEY);
                if (cached) {
                    console.log('[FCW Modernizer] Using cached user ID:', cached);
                    return cached;
                }
            } catch (e) { }

            return null; // Not logged in or nav not found
        }

        /**
         * Gets the Club ID of the profile currently being VIEWED.
         */
        function getCurrentPageClubId() {
            const path = window.location.pathname;
            const search = window.location.search;

            // Case A: Standard URL /clubs/12345
            const pathMatch = path.match(/\/clubs\/(\d+)/);
            if (pathMatch) return pathMatch[1];

            // Case B: PHP Style club.php?c=12345
            const params = new URLSearchParams(search);
            const cParam = params.get('c') || params.get('id'); // Support 'c' or 'id'
            if (cParam) return cParam;

            // Case C: /myclub (Special)
            if (path.includes('/myclub')) return 'MYCLUB_PLACEHOLDER';

            return null;
        }

        // --- 3. Settings & Storage ---
        // (Preserved from v3.1)
        const globalKeys = ['bgUrl', 'accentColor', 'glassOpacity'];
        const localKeys = ['bannerUrl', 'hideBanner', 'bannerHeight', 'bannerWidth', 'bannerPosX', 'bannerPosY', 'bannerStorageMode', 'buttonBarTint', 'buttonBarOpacity', 'statsLayout', 'statsGlassColor', 'statsCornerStyle', 'statsOpacity'];

        const defaultGlobal = {
            accentColor: '#8d124d',
            glassOpacity: 0.15
        };

        const defaultLocal = {
            bannerUrl: null,
            hideBanner: false,
            bannerHeight: 400,
            bannerWidth: 95,
            bannerPosX: 50,
            bannerPosY: 50,
            bannerStorageMode: 'local', // 'local' or 'db'
            countryFlag: null, // ISO 3166-1 alpha-2 code
            flagSize: 40, // Default flag size in px
            buttonBarTint: null, // Glass tint color for button bar (rgba or hex)
            buttonBarOpacity: 0.85, // Default opacity
            statsLayout: 'default', // 'default' | 'list' | '3x2' | '2x3'
            statsGlassColor: null, // Glass tint for stats dashboard
            statsCornerStyle: 'rounded', // 'rounded' | 'sharp'
            statsOpacity: 0.65 // Default stats opacity
        };

        // We need to load settings *after* we determine the correct ID
        let settings = {};
        let storageData = {};
        let activeClubId = null; // The numeric ID we will use for saving/loading
        let isOwner = false; // Scope-level ownership flag
        let defaultBannerUrl = null; // Store original default banner

        function loadSettings(clubId) {
            // Block banner loading on visit.php pages specifically
            const isVisitPage = window.location.href.includes('/clubs/visit.php');

            storageData = JSON.parse(localStorage.getItem('fcw_club_modernizer_data')) || {};

            // Interlink: Read Global Accent from Navbar Settings
            let globalAccent = '#8d124d';
            try {
                const navSettings = JSON.parse(localStorage.getItem('fcw_navbar_settings'));
                if (navSettings && navSettings.accent) globalAccent = navSettings.accent;
            } catch (e) { }

            // Migration check (v3.0 -> v3.1)
            if (storageData.accentColor && !storageData.globals) {
                const oldSettings = JSON.parse(localStorage.getItem('fcw_club_settings')) || {};
                storageData = {
                    globals: {
                        bgUrl: oldSettings.bgUrl || null,
                        accentColor: globalAccent, // Use global
                        glassOpacity: 0.90
                    },
                    clubs: {}
                };
            }

            if (!storageData.globals) storageData.globals = { ...defaultGlobal, accentColor: globalAccent };
            else storageData.globals.accentColor = globalAccent; // Force sync

            if (!storageData.clubs) storageData.clubs = {};
            if (!storageData.clubs[clubId]) storageData.clubs[clubId] = { ...defaultLocal };

            settings = {
                ...defaultGlobal,
                ...defaultLocal,
                ...storageData.globals,
                ...storageData.clubs[clubId]
            };

            // Visitor Mode: Enforce defaults for banner
            if (!isOwner || isVisitPage) {
                settings.bannerUrl = null;
                settings.hideBanner = false;
                settings.bannerHeight = 400; // Default
                settings.bannerWidth = 95;   // Default
                settings.bannerPosX = 50;
                settings.bannerPosY = 50;
            }

            // Check if banner is stored in IndexedDB
            // Skip purely if on visit page to avoid console logs or flashes
            if (isOwner && settings.bannerStorageMode === 'db' && !isVisitPage) {
                const bannerDbKey = `banner_${clubId}`;
                fcwDB.get(bannerDbKey).then(data => {
                    if (data) {
                        let bannerUrl;
                        if (data instanceof Blob) {
                            bannerUrl = URL.createObjectURL(data);
                        } else if (typeof data === 'string') {
                            bannerUrl = data;
                        }
                        if (bannerUrl) {
                            settings.bannerUrl = bannerUrl;
                            updateStyles();
                            console.log('[FCW Modernizer] Banner loaded from IndexedDB');
                        }
                    }
                }).catch(err => {
                    console.warn('[FCW Modernizer] Failed to load banner from IndexedDB:', err);
                });
            }
        }

        function saveSetting(key, value) {
            settings[key] = value;
            if (globalKeys.includes(key)) {
                storageData.globals[key] = value;

                // Interlink: Save Accent to Navbar Settings
                if (key === 'accentColor') {
                    try {
                        let nav = JSON.parse(localStorage.getItem('fcw_navbar_settings')) || {};
                        nav.accent = value;
                        if (!nav.opacity) nav.opacity = 0.90;
                        if (!nav.blur) nav.blur = 12;
                        if (!nav.font) nav.font = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
                        localStorage.setItem('fcw_navbar_settings', JSON.stringify(nav));

                        // Update CSS var immediately
                        document.documentElement.style.setProperty('--fcw-accent', value);

                        // Dispatch custom event for same-page scripts (navbar.js, ios_suite.js)
                        window.dispatchEvent(new CustomEvent('fcw-accent-changed', { detail: { accent: value } }));
                    } catch (e) { }
                }

            } else {
                if (!storageData.clubs[activeClubId]) storageData.clubs[activeClubId] = {};
                storageData.clubs[activeClubId][key] = value;
            }
            localStorage.setItem('fcw_club_modernizer_data', JSON.stringify(storageData));
            updateStyles();
        }

        // --- 3b. Cross-Script Accent Color Syncing ---
        // Listen for accent changes from other tabs/windows
        window.addEventListener('storage', (e) => {
            if (e.key === 'fcw_navbar_settings') {
                try {
                    const navSettings = JSON.parse(e.newValue);
                    if (navSettings && navSettings.accent && navSettings.accent !== settings.accentColor) {
                        settings.accentColor = navSettings.accent;
                        if (storageData.globals) storageData.globals.accentColor = navSettings.accent;
                        document.documentElement.style.setProperty('--fcw-accent', navSettings.accent);
                        // Update the accent input if it exists
                        const accentInput = document.getElementById('fcw-accent-input');
                        if (accentInput) accentInput.value = navSettings.accent;
                    }
                } catch (err) { }
            }
        });

        // Listen for same-page custom events from navbar.js / dark_ui.js
        window.addEventListener('fcw-accent-changed', (e) => {
            if (e.detail && e.detail.accent && e.detail.accent !== settings.accentColor) {
                settings.accentColor = e.detail.accent;
                if (storageData.globals) storageData.globals.accentColor = e.detail.accent;
                // Set on BOTH html and body for maximum coverage
                document.documentElement.style.setProperty('--fcw-accent', e.detail.accent);
                if (document.body) document.body.style.setProperty('--fcw-accent', e.detail.accent);
                // Update the accent input if it exists
                const accentInput = document.getElementById('fcw-accent-input');
                if (accentInput) accentInput.value = e.detail.accent;
            }
        });

        // --- 4. CSS Injection (Preserved) ---
        // 700+ lines of CSS retained here
        const css = `
:root {
    --fcw-accent: #8d124d; /* Placeholder, updated by JS */
    --fcw-glass: rgba(15, 20, 30, 0.9);
    --fcw-glass-border: 1px solid rgba(255, 255, 255, 0.15);
    --fcw-text: #f0f0f0;
    --fcw-banner-url: none;
    --fcw-bg: inherit;

    /* Dynamic Banner Vars */
    --fcw-banner-h: 400px;
    --fcw-banner-w: 95%;
    --fcw-banner-pos-x: 50%;
    --fcw-banner-pos-y: 50%;
}

/* Fix for Go Button Resizing */
.btn-xs {
    padding: 2px 8px !important;
    font-size: 11px !important;
    line-height: 1.4 !important;
    width: auto !important; 
    height: auto !important;
    min-height: 0 !important;
    box-sizing: border-box !important;
    max-width: none !important;
}

/* Fix dropdown menu persistence - faster hide on mouseout */
.sm-nowrap,
.navbar-nav .dropdown-menu {
    transition: opacity 0.15s ease, visibility 0.15s ease !important;
    z-index: 1000000 !important;
}
.navbar-nav > li:not(:hover) > .dropdown-menu[aria-expanded="true"]:not(:hover) {
    opacity: 0 !important;
    visibility: hidden !important;
    pointer-events: none !important;
}
/* Force submenus to hide when parent is not hovered */
.navbar-nav li.open:not(:hover) > ul.dropdown-menu {
    display: none !important;
}


/* Global Background */
html.fcw-custom-club-bg,
body.fcw-custom-club-bg {
    background-image: var(--fcw-bg) !important;
    background-size: cover !important;
    background-attachment: fixed !important;
    background-position: center !important;
}

body {
    color: var(--fcw-text) !important;
}

/* Club Banner Container */
#fcw-main-banner {
    height: var(--fcw-banner-h) !important;
    width: var(--fcw-banner-w) !important;
    margin: 0 auto 30px auto !important;
    border-radius: 16px !important;
    box-shadow: 0 10px 30px rgba(0,0,0,0.4) !important;
    border: var(--fcw-glass-border) !important;
    position: relative;
    overflow: hidden;
    transition: transform 0.8s cubic-bezier(0.19, 1, 0.22, 1), box-shadow 0.5s ease;
    background-repeat: no-repeat !important;
    background-size: cover !important;
    background-position: var(--fcw-banner-pos-x) var(--fcw-banner-pos-y) !important;
    perspective: 1000px;
    transform-style: preserve-3d;
    will-change: transform;
    z-index: 5;
    visibility: visible !important;
    /* Use preloaded banner immediately if available, otherwise none or default */
    background-image: var(--fcw-preloaded-banner, none) !important;
}

/* Hover effect removed by user request */
#fcw-main-banner:hover {
    z-index: 10;
}

#fcw-main-banner.fcw-has-custom-banner {
    background-image: var(--fcw-banner-url) !important;
    /* GIF-friendly rendering */
    image-rendering: auto !important;
    -webkit-transform: translateZ(0); /* Force GPU layer for smooth GIF playback */
}

#fcw-main-banner::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.6) 100%);
    z-index: 1;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s ease;
}
#fcw-main-banner.fcw-has-custom-banner::before { opacity: 1; }

#fcw-main-banner > div {
    position: relative;
    z-index: 2;
    text-shadow: 0 4px 15px rgba(0,0,0,0.9) !important;
    pointer-events: none;
    transform: translateZ(20px);
}

/* Button Row */
div[style*="display:flex; justify-content:center; gap:10px;"] {
    background: var(--fcw-button-bar-tint, var(--fcw-glass)) !important;
    padding: 15px !important;
    border-radius: 15px !important;
    border: var(--fcw-glass-border) !important;
    backdrop-filter: blur(10px);
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    margin-bottom: 30px !important;
    flex-wrap: wrap;
    align-items: center;
}

/* Buttons */
body .btn-primary,
body .fcw-settings-btn {
    background-color: rgba(255, 255, 255, 0.05) !important;
    border: 1px solid var(--fcw-accent) !important;
    color: #fff !important;
    border-radius: 8px !important;
    padding: 10px 20px !important;
    font-weight: 700 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.5px !important;
    transition: all 0.2s ease !important;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1) !important;
    margin: 0 5px !important;
    cursor: pointer;
    text-decoration: none !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    height: 44px !important;
    line-height: 1 !important;
}

body .btn-primary:hover,
body .fcw-settings-btn:hover {
    background-color: var(--fcw-accent) !important;
    border-color: var(--fcw-accent) !important;
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(0,0,0,0.4) !important;
    color: #fff !important;
}

.fcw-settings-btn svg {
    margin-right: 8px;
    width: 18px;
    height: 18px;
    display: block;
}

/* Stats Table */
.table-striped {
    background-color: var(--fcw-glass) !important;
    border-radius: 15px !important;
    overflow: hidden;
    border: var(--fcw-glass-border) !important;
    backdrop-filter: blur(20px);
    box-shadow: 0 20px 50px rgba(0,0,0,0.5) !important;
    margin-top: 30px !important;
    max-width: 600px !important;
    width: 100% !important;
}
.table-striped > tbody > tr:hover {
    background-color: rgba(255,255,255,0.05) !important;
}
.table > tbody > tr > th {
    color: #94a3b8 !important;
    font-weight: 600;
    text-transform: uppercase;
    width: 50%;
    border-top: 1px solid rgba(255,255,255,0.08) !important;
}
.table > tbody > tr > td {
    font-family: 'Courier New', monospace;
    font-size: 1.1rem;
    color: #fff !important;
    text-align: right;
    font-weight: 700;
    border-top: 1px solid rgba(255,255,255,0.08) !important;
}

/* Settings Panel - Compact & Minimal */
#fcw-club-panel {
    position: fixed;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%) scale(0.95);
    width: 420px; /* Compact */
    max-width: 92vw;
    background: #1a1f29;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 14px;
    z-index: 100005;
    color: white;
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.7);
    display: none;
    opacity: 0;
}

/* Animations */
@keyframes fcwPanelIn {
    0% { opacity: 0; transform: translate(-50%, -45%) scale(0.95); }
    100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}
@keyframes fcwGroupIn {
    0% { opacity: 0; transform: translateY(10px); }
    100% { opacity: 1; transform: translateY(0); }
}

#fcw-club-panel.active {
    display: flex;
    flex-direction: column;
    gap: 10px; /* Tighter spacing */
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
    animation: fcwPanelIn 0.25s ease-out forwards;
}

#fcw-panel-overlay {
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    z-index: 100004;
    display: none;
    opacity: 0;
    transition: opacity 0.3s ease;
}
#fcw-panel-overlay.active {
    display: block;
    opacity: 1;
}

/* Preview Mode - Panel shifts right, overlay fades */
#fcw-club-panel.fcw-preview-mode {
    left: auto;
    right: 30px;
    transform: translateY(-50%) scale(1);
    transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
#fcw-club-panel.fcw-preview-mode.active {
    animation: none;
    transform: translateY(-50%) scale(1);
}
#fcw-panel-overlay.fcw-preview-mode {
    background: rgba(0, 0, 0, 0);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Preview Mode Label */
.fcw-preview-label {
    display: none;
    text-align: center;
    padding: 8px 16px;
    margin-top: 10px;
    background: rgba(141, 18, 77, 0.15);
    border: 1px solid rgba(141, 18, 77, 0.3);
    border-radius: 8px;
    color: var(--fcw-accent, #8d124d);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
}
#fcw-club-panel.fcw-preview-mode .fcw-preview-label {
    display: block;
}

/* Layout Utilities */
.fcw-settings-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}

.fcw-setting-group {
    margin-bottom: 0;
    padding: 10px 12px; /* Tighter */
    background: rgba(255, 255, 255, 0.02);
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    transition: all 0.15s ease;
    opacity: 0;
}
#fcw-club-panel.active .fcw-setting-group {
    animation: fcwGroupIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
#fcw-club-panel.active .fcw-setting-group:nth-child(1) { animation-delay: 0.05s; }
#fcw-club-panel.active .fcw-setting-group:nth-child(2) { animation-delay: 0.1s; } /* Grid container */
#fcw-club-panel.active .fcw-settings-grid .fcw-setting-group:nth-child(1) { animation-delay: 0.15s; }
#fcw-club-panel.active .fcw-settings-grid .fcw-setting-group:nth-child(2) { animation-delay: 0.2s; }

.fcw-setting-group:hover {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.1);
}

.fcw-setting-title {
    font-size: 10px;
    font-weight: 700;
    color: var(--fcw-accent, #8d124d);
    text-transform: uppercase;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
    letter-spacing: 0.8px;
}
.fcw-setting-title::before {
    content: '';
    width: 3px;
    height: 12px;
    background: var(--fcw-accent, #8d124d);
    border-radius: 2px;
}

.fcw-control-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 12px;
    color: #e2e8f0;
    padding: 2px 0;
}
.fcw-control-row:last-child {
    margin-bottom: 0;
}

/* Tab Navigation */
.fcw-tabs {
    display: flex;
    gap: 4px;
    margin-bottom: 12px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    padding-bottom: 8px;
}
.fcw-tab-btn {
    background: transparent;
    border: none;
    color: rgba(255,255,255,0.5);
    font-size: 11px;
    font-weight: 600;
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s ease;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
.fcw-tab-btn:hover {
    background: rgba(255,255,255,0.05);
    color: rgba(255,255,255,0.8);
}
.fcw-tab-btn.active {
    background: var(--fcw-accent, #8d124d);
    color: #fff;
}
.fcw-tab-content {
    display: none;
}
.fcw-tab-content.active {
    display: block;
}

/* Focus Frame Resize Mode */
#fcw-resize-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.75);
    z-index: 100000;
    display: none;
    cursor: default;
}
#fcw-resize-overlay.active {
    display: block;
}

#fcw-main-banner.fcw-resize-mode {
    position: relative !important;
    z-index: 100001 !important;
    box-shadow: 0 0 0 4px var(--fcw-accent, #8d124d), 0 20px 60px rgba(0,0,0,0.8) !important;
    cursor: default;
    overflow: visible !important;
    user-select: none;
    transform: none !important;
}

.fcw-resize-handle {
    position: absolute !important;
    background: var(--fcw-accent, #8d124d);
    border: 2px solid #fff;
    border-radius: 50%;
    z-index: 100002;
    box-shadow: 0 2px 8px rgba(0,0,0,0.5);
    pointer-events: auto !important;
}
.fcw-resize-handle:hover {
    background: #fff;
}

/* Corner handles - positioned exactly at corners */
.fcw-resize-handle.fcw-corner {
    width: 16px;
    height: 16px;
}
.fcw-resize-handle.fcw-corner-nw { top: 0; left: 0; transform: translate(-50%, -50%); cursor: nw-resize; }
.fcw-resize-handle.fcw-corner-ne { top: 0; right: 0; transform: translate(50%, -50%); cursor: ne-resize; }
.fcw-resize-handle.fcw-corner-sw { bottom: 0; left: 0; transform: translate(-50%, 50%); cursor: sw-resize; }
.fcw-resize-handle.fcw-corner-se { bottom: 0; right: 0; transform: translate(50%, 50%); cursor: se-resize; }

/* Edge handles - centered on each edge */
.fcw-resize-handle.fcw-edge {
    border-radius: 8px;
}
.fcw-resize-handle.fcw-edge-n { top: 0; left: 50%; transform: translate(-50%, -50%); width: 48px; height: 12px; cursor: n-resize; }
.fcw-resize-handle.fcw-edge-s { bottom: 0; left: 50%; transform: translate(-50%, 50%); width: 48px; height: 12px; cursor: s-resize; }
.fcw-resize-handle.fcw-edge-e { right: 0; top: 50%; transform: translate(50%, -50%); width: 12px; height: 48px; cursor: e-resize; }
.fcw-resize-handle.fcw-edge-w { left: 0; top: 50%; transform: translate(-50%, -50%); width: 12px; height: 48px; cursor: w-resize; }

.fcw-resize-handle:hover {
    transform: translate(-50%, -50%) scale(1.2);
}
.fcw-resize-handle.fcw-corner-ne:hover { transform: translate(50%, -50%) scale(1.2); }
.fcw-resize-handle.fcw-corner-sw:hover { transform: translate(-50%, 50%) scale(1.2); }
.fcw-resize-handle.fcw-corner-se:hover { transform: translate(50%, 50%) scale(1.2); }
.fcw-resize-handle.fcw-edge-s:hover { transform: translate(-50%, 50%) scale(1.2); }
.fcw-resize-handle.fcw-edge-e:hover { transform: translate(50%, -50%) scale(1.2); }

/* Resize mode toolbar */
#fcw-resize-toolbar {
    position: fixed;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(26, 31, 41, 0.95);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 16px;
    padding: 16px 28px;
    z-index: 100003;
    display: none;
    align-items: center;
    gap: 20px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.6);
    backdrop-filter: blur(12px);
}
#fcw-resize-toolbar.active {
    display: flex;
}
#fcw-resize-toolbar .fcw-size-display {
    font-family: 'SF Mono', 'Consolas', monospace;
    font-size: 14px;
    color: #94a3b8;
    min-width: 140px;
}
#fcw-resize-toolbar .fcw-size-display span {
    color: #fff;
    font-weight: 600;
}
#fcw-resize-toolbar button {
    padding: 10px 22px;
    border-radius: 10px;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
}
#fcw-resize-toolbar .fcw-done-btn {
    background: var(--fcw-accent, #8d124d);
    color: #fff;
}
#fcw-resize-toolbar .fcw-done-btn:hover {
    filter: brightness(1.15);
    transform: translateY(-2px);
}
#fcw-resize-toolbar .fcw-reset-btn {
    background: transparent;
    border: 1px solid rgba(255,255,255,0.2);
    color: #94a3b8;
}
#fcw-resize-toolbar .fcw-reset-btn:hover {
    background: rgba(255,255,255,0.1);
    color: #fff;
}

.fcw-btn-resize-banner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #e2e8f0;
    padding: 0 20px; /* Zero padding for height centering */
    height: 48px; /* Strict fixed height */
    text-align: center;
    border-radius: 12px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.25s ease;
    width: 100%;
    box-sizing: border-box; /* Strict sizing */
}
.fcw-btn-resize-banner:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.3);
    color: #fff;
    transform: translateY(-2px);
}
.fcw-btn-resize-banner svg {
    width: 18px;
    height: 18px;
    opacity: 0.8;
}
.fcw-control-row span:first-child {
    font-weight: 500;
}
.fcw-control-row input[type=range] {
    width: 55%;
    height: 6px;
    border-radius: 3px;
    background: rgba(255, 255, 255, 0.1);
    -webkit-appearance: none;
    appearance: none;
}
.fcw-control-row input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--fcw-accent, #8d124d);
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
    transition: transform 0.15s ease;
}
.fcw-control-row input[type=range]::-webkit-slider-thumb:hover {
    transform: scale(1.15);
}
.fcw-control-val {
    font-family: 'SF Mono', 'Consolas', monospace;
    font-size: 13px;
    width: 40px;
    text-align: right;
    color: #94a3b8;
    font-weight: 600;
}

.fcw-btn-upload {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #e2e8f0;
    padding: 0 20px; /* Use 0 padding for height centering */
    height: 48px; /* Strict fixed height */
    text-align: center;
    border-radius: 12px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.25s ease;
    width: 100%;
    box-sizing: border-box;
}
.fcw-btn-upload:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.3);
    color: #fff;
    transform: translateY(-2px);
}


.fcw-btn-reset {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #94a3b8;
    padding: 10px 16px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    width: 100%;
    margin-top: 12px;
    transition: all 0.2s ease;
}
.fcw-btn-reset:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.3);
    color: #fff;
}

.fcw-close-btn {
    position: absolute;
    top: 20px; right: 20px;
    width: 36px;
    height: 36px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    color: #64748b;
    cursor: pointer;
    font-size: 20px;
    line-height: 32px;
    text-align: center;
    transition: all 0.2s ease;
}
.fcw-close-btn:hover {
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.4);
    color: #f87171;
}

input[type="color"] {
    width: 100%;
    height: 44px;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.05);
    padding: 4px;
}
input[type="color"]::-webkit-color-swatch-wrapper {
    padding: 0;
}
input[type="color"]::-webkit-color-swatch {
    border-radius: 8px;
    border: 2px solid rgba(255, 255, 255, 0.15);
}

/* Robust centered switch */
.fcw-switch {
    position: relative;
    display: inline-block;
    width: 40px; /* Smaller width */
    height: 22px; /* Smaller height */
    flex-shrink: 0;
    margin-top: 1px; /* Moved up by 3px more */
}
.fcw-switch input {
    opacity: 0;
    width: 0;
    height: 0;
    position: absolute;
    margin: 0;
}
.fcw-switch-slider {
    position: absolute;
    cursor: pointer;
    top: 0; left: 0; right: 0; bottom: 0;
    background-color: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: .3s;
    border-radius: 24px;
    box-sizing: border-box;
}
.fcw-switch-slider:before {
    position: absolute;
    content: "";
    height: 18px; /* Smaller knob */
    width: 18px;
    left: 1px;
    top: 50%;
    transform: translateY(-50%);
    background-color: #cbd5e1;
    transition: .3s cubic-bezier(0.4, 0.0, 0.2, 1);
    border-radius: 50%;
    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
}
.fcw-switch input:checked + .fcw-switch-slider {
    background-color: rgba(var(--fcw-accent-rgb, 141, 18, 77), 0.3);
    border-color: var(--fcw-accent, #8d124d);
}
.fcw-switch input:checked + .fcw-switch-slider:before {
    transform: translate(18px, -50%); /* Adjusted active translation */
    background-color: var(--fcw-accent, #8d124d);
    box-shadow: 0 0 0 2px rgba(255,255,255,0.2);
}

.fcw-checkbox-label {
    display: flex;
    align-items: center;
    cursor: pointer;
    font-size: 14px;
    color: #e2e8f0;
    font-weight: 500;
    padding: 8px 0;
}
.fcw-checkbox-label input {
    margin-right: 12px;
    width: 18px;
    height: 18px;
    accent-color: var(--fcw-accent, #8d124d);
}

/* Glass Date Styling */
.fcw-creation-date {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 6px 12px !important;
    margin: 10px auto !important;
    width: fit-content;
    color: var(--fcw-accent, #8d124d) !important;
    font-weight: 600;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    text-align: center !important;
}

/* Country Flag Display - Below Banner */
/* Country Flag Display - Below Banner */
.fcw-country-flag-display {
    display: flex;
    justify-content: center !important;
    align-items: center !important;
    margin: 10px auto !important;
    padding: 0;
    width: 100% !important;
    background: transparent;
    border: none;
    box-shadow: none;
    pointer-events: none; /* Prevent interference */
}
.fcw-country-flag-display img {
    height: var(--fcw-flag-size, 40px) !important;
    width: auto !important;
    max-width: 100%;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    transition: height 0.2s ease;
    display: block !important;
}

/* Country Flag Dropdown in Settings */
.fcw-flag-select {
    width: 100%;
    padding: 12px 14px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(0, 0, 0, 0.25);
    color: #fff;
    font-size: 14px;
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23fff' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
}
.fcw-flag-select option {
    background: #1a1f29;
    color: #fff;
    padding: 8px;
}
.fcw-flag-preview {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 12px;
    padding: 10px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    max-height: 60px;
    overflow: hidden;
}
.fcw-flag-preview img {
    height: 30px !important;
    max-height: 30px !important;
    width: auto !important;
    max-width: 60px !important;
    border-radius: 3px;
    object-fit: contain;
}
.fcw-flag-preview span {
    color: #94a3b8;
    font-size: 13px;
}


.fcw-info-pill {
    font-size: 11px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04));
    padding: 6px 12px;
    border-radius: 20px;
    color: #94a3b8;
    margin-bottom: 16px;
    display: inline-block;
    border: 1px solid rgba(255, 255, 255, 0.08);
    font-weight: 500;
}

/* Country Flag Display on Profile */
.fcw-country-flag-display {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 15px;
    width: 100%;
    pointer-events: none; /* Let clicks pass through */
    position: relative;
    z-index: 10;
}
.fcw-country-flag-display img {
    height: var(--fcw-flag-size, 40px);
    width: auto;
    border-radius: 6px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    border: 2px solid rgba(255,255,255,0.1);
    transition: transform 0.3s ease;
}
`;

        function injectStyles() {
            const existing = document.getElementById('fcw-club-modern-v2-css');
            if (existing) existing.remove();
            const style = document.createElement('style');
            style.id = 'fcw-club-modern-v2-css';
            style.type = 'text/css';
            style.appendChild(document.createTextNode(css));
            (document.head || document.documentElement).appendChild(style);
        }

        function updateStyles() {
            const root = document.documentElement;
            const body = document.body;
            const setVar = (name, val) => {
                if (root) root.style.setProperty(name, val);
                if (body) body.style.setProperty(name, val);
            };

            setVar('--fcw-accent', settings.accentColor);
            setVar('--fcw-banner-h', settings.bannerHeight + 'px');
            setVar('--fcw-banner-w', settings.bannerWidth + '%');
            setVar('--fcw-banner-pos-x', settings.bannerPosX + '%');
            setVar('--fcw-banner-w', settings.bannerWidth + '%');
            setVar('--fcw-banner-pos-x', settings.bannerPosX + '%');
            setVar('--fcw-banner-pos-y', settings.bannerPosY + '%');
            setVar('--fcw-flag-size', (settings.flagSize || 40) + 'px');

            // Button Bar Tint & Opacity Logic
            const opacity = settings.buttonBarOpacity !== undefined ? settings.buttonBarOpacity : 0.85;

            if (settings.buttonBarTint) {
                // Custom Color + Opacity
                const hex = settings.buttonBarTint.replace('#', '');
                const r = parseInt(hex.substring(0, 2), 16);
                const g = parseInt(hex.substring(2, 4), 16);
                const b = parseInt(hex.substring(4, 6), 16);
                setVar('--fcw-button-bar-tint', `rgba(${r}, ${g}, ${b}, ${opacity})`);
            } else {
                // Default Color (15, 20, 30) + Custom Opacity
                // If opacity is default, remove variable to fallback to CSS default
                if (opacity === 0.85) {
                    root.style.removeProperty('--fcw-button-bar-tint');
                    if (body) body.style.removeProperty('--fcw-button-bar-tint');
                } else {
                    setVar('--fcw-button-bar-tint', `rgba(15, 20, 30, ${opacity})`);
                }
            }

            // Global Background Logic Removed (Handled by dark_ui.js now)
            setVar('--fcw-bg', 'inherit');
            document.documentElement.classList.remove('fcw-custom-club-bg');
            document.body.classList.remove('fcw-custom-club-bg');

            const banner = document.getElementById('fcw-main-banner');
            if (banner) {
                // Force Direct Styles (Specificity Fix)
                banner.style.setProperty('height', settings.bannerHeight + 'px', 'important');
                banner.style.setProperty('width', settings.bannerWidth + '%', 'important');
                banner.style.setProperty('background-position', `${settings.bannerPosX}% ${settings.bannerPosY}%`, 'important');

                if (settings.hideBanner) {
                    banner.style.setProperty('display', 'none', 'important');
                } else {
                    banner.style.setProperty('display', 'block', 'important');
                }

                if (settings.bannerUrl) {
                    setVar('--fcw-banner-url', `url("${settings.bannerUrl}")`);
                    banner.classList.add('fcw-has-custom-banner');
                    // Remove transforms that can interfere with GIF animation
                    banner.style.transform = 'none';
                    banner.style.setProperty('background-image', `url("${settings.bannerUrl}")`, 'important');
                    banner.style.setProperty('background-size', 'cover', 'important');
                } else {
                    banner.classList.remove('fcw-has-custom-banner');
                    // RESTORE DEFAULT BANNER
                    if (defaultBannerUrl) {
                        banner.style.setProperty('background-image', defaultBannerUrl, 'important');
                    } else {
                        banner.style.removeProperty('background-image');
                    }
                }
            }
        }

        // --- COUNTRIES LIST (195 UN Member States) ---
        const COUNTRIES = [
            { code: 'AF', name: 'Afghanistan' }, { code: 'AL', name: 'Albania' }, { code: 'DZ', name: 'Algeria' }, { code: 'AD', name: 'Andorra' }, { code: 'AO', name: 'Angola' },
            { code: 'AG', name: 'Antigua and Barbuda' }, { code: 'AR', name: 'Argentina' }, { code: 'AM', name: 'Armenia' }, { code: 'AU', name: 'Australia' }, { code: 'AT', name: 'Austria' },
            { code: 'AZ', name: 'Azerbaijan' }, { code: 'BS', name: 'Bahamas' }, { code: 'BH', name: 'Bahrain' }, { code: 'BD', name: 'Bangladesh' }, { code: 'BB', name: 'Barbados' },
            { code: 'BY', name: 'Belarus' }, { code: 'BE', name: 'Belgium' }, { code: 'BZ', name: 'Belize' }, { code: 'BJ', name: 'Benin' }, { code: 'BT', name: 'Bhutan' },
            { code: 'BO', name: 'Bolivia' }, { code: 'BA', name: 'Bosnia and Herzegovina' }, { code: 'BW', name: 'Botswana' }, { code: 'BR', name: 'Brazil' }, { code: 'BN', name: 'Brunei' },
            { code: 'BG', name: 'Bulgaria' }, { code: 'BF', name: 'Burkina Faso' }, { code: 'BI', name: 'Burundi' }, { code: 'CV', name: 'Cabo Verde' }, { code: 'KH', name: 'Cambodia' },
            { code: 'CM', name: 'Cameroon' }, { code: 'CA', name: 'Canada' }, { code: 'CF', name: 'Central African Republic' }, { code: 'TD', name: 'Chad' }, { code: 'CL', name: 'Chile' },
            { code: 'CN', name: 'China' }, { code: 'CO', name: 'Colombia' }, { code: 'KM', name: 'Comoros' }, { code: 'CG', name: 'Congo' }, { code: 'CR', name: 'Costa Rica' },
            { code: 'HR', name: 'Croatia' }, { code: 'CU', name: 'Cuba' }, { code: 'CY', name: 'Cyprus' }, { code: 'CZ', name: 'Czechia' }, { code: 'DK', name: 'Denmark' },
            { code: 'DJ', name: 'Djibouti' }, { code: 'DM', name: 'Dominica' }, { code: 'DO', name: 'Dominican Republic' }, { code: 'EC', name: 'Ecuador' }, { code: 'EG', name: 'Egypt' },
            { code: 'SV', name: 'El Salvador' }, { code: 'GQ', name: 'Equatorial Guinea' }, { code: 'ER', name: 'Eritrea' }, { code: 'EE', name: 'Estonia' }, { code: 'SZ', name: 'Eswatini' },
            { code: 'ET', name: 'Ethiopia' }, { code: 'FJ', name: 'Fiji' }, { code: 'FI', name: 'Finland' }, { code: 'FR', name: 'France' }, { code: 'GA', name: 'Gabon' },
            { code: 'GM', name: 'Gambia' }, { code: 'GE', name: 'Georgia' }, { code: 'DE', name: 'Germany' }, { code: 'GH', name: 'Ghana' }, { code: 'GR', name: 'Greece' },
            { code: 'GD', name: 'Grenada' }, { code: 'GT', name: 'Guatemala' }, { code: 'GN', name: 'Guinea' }, { code: 'GW', name: 'Guinea-Bissau' }, { code: 'GY', name: 'Guyana' },
            { code: 'HT', name: 'Haiti' }, { code: 'HN', name: 'Honduras' }, { code: 'HU', name: 'Hungary' }, { code: 'IS', name: 'Iceland' }, { code: 'IN', name: 'India' },
            { code: 'ID', name: 'Indonesia' }, { code: 'IR', name: 'Iran' }, { code: 'IQ', name: 'Iraq' }, { code: 'IE', name: 'Ireland' }, { code: 'IL', name: 'Israel' },
            { code: 'IT', name: 'Italy' }, { code: 'JM', name: 'Jamaica' }, { code: 'JP', name: 'Japan' }, { code: 'JO', name: 'Jordan' }, { code: 'KZ', name: 'Kazakhstan' },
            { code: 'KE', name: 'Kenya' }, { code: 'KI', name: 'Kiribati' }, { code: 'KP', name: 'North Korea' }, { code: 'KR', name: 'South Korea' }, { code: 'KW', name: 'Kuwait' },
            { code: 'KG', name: 'Kyrgyzstan' }, { code: 'LA', name: 'Laos' }, { code: 'LV', name: 'Latvia' }, { code: 'LB', name: 'Lebanon' }, { code: 'LS', name: 'Lesotho' },
            { code: 'LR', name: 'Liberia' }, { code: 'LY', name: 'Libya' }, { code: 'LI', name: 'Liechtenstein' }, { code: 'LT', name: 'Lithuania' }, { code: 'LU', name: 'Luxembourg' },
            { code: 'MG', name: 'Madagascar' }, { code: 'MW', name: 'Malawi' }, { code: 'MY', name: 'Malaysia' }, { code: 'MV', name: 'Maldives' }, { code: 'ML', name: 'Mali' },
            { code: 'MT', name: 'Malta' }, { code: 'MH', name: 'Marshall Islands' }, { code: 'MR', name: 'Mauritania' }, { code: 'MU', name: 'Mauritius' }, { code: 'MX', name: 'Mexico' },
            { code: 'FM', name: 'Micronesia' }, { code: 'MD', name: 'Moldova' }, { code: 'MC', name: 'Monaco' }, { code: 'MN', name: 'Mongolia' }, { code: 'ME', name: 'Montenegro' },
            { code: 'MA', name: 'Morocco' }, { code: 'MZ', name: 'Mozambique' }, { code: 'MM', name: 'Myanmar' }, { code: 'NA', name: 'Namibia' }, { code: 'NR', name: 'Nauru' },
            { code: 'NP', name: 'Nepal' }, { code: 'NL', name: 'Netherlands' }, { code: 'NZ', name: 'New Zealand' }, { code: 'NI', name: 'Nicaragua' }, { code: 'NE', name: 'Niger' },
            { code: 'NG', name: 'Nigeria' }, { code: 'MK', name: 'North Macedonia' }, { code: 'NO', name: 'Norway' }, { code: 'OM', name: 'Oman' }, { code: 'PK', name: 'Pakistan' },
            { code: 'PS', name: 'Palestine' }, { code: 'PW', name: 'Palau' }, { code: 'PA', name: 'Panama' }, { code: 'PG', name: 'Papua New Guinea' }, { code: 'PY', name: 'Paraguay' }, { code: 'PE', name: 'Peru' },
            { code: 'PH', name: 'Philippines' }, { code: 'PL', name: 'Poland' }, { code: 'PT', name: 'Portugal' }, { code: 'PR', name: 'Puerto Rico' }, { code: 'QA', name: 'Qatar' }, { code: 'RO', name: 'Romania' },
            { code: 'RU', name: 'Russia' }, { code: 'RW', name: 'Rwanda' }, { code: 'KN', name: 'Saint Kitts and Nevis' }, { code: 'LC', name: 'Saint Lucia' }, { code: 'VC', name: 'Saint Vincent and the Grenadines' },
            { code: 'WS', name: 'Samoa' }, { code: 'SM', name: 'San Marino' }, { code: 'ST', name: 'Sao Tome and Principe' }, { code: 'SA', name: 'Saudi Arabia' }, { code: 'SN', name: 'Senegal' },
            { code: 'RS', name: 'Serbia' }, { code: 'SC', name: 'Seychelles' }, { code: 'SL', name: 'Sierra Leone' }, { code: 'SG', name: 'Singapore' }, { code: 'SK', name: 'Slovakia' },
            { code: 'SI', name: 'Slovenia' }, { code: 'SB', name: 'Solomon Islands' }, { code: 'SO', name: 'Somalia' }, { code: 'ZA', name: 'South Africa' }, { code: 'SS', name: 'South Sudan' },
            { code: 'ES', name: 'Spain' }, { code: 'LK', name: 'Sri Lanka' }, { code: 'SD', name: 'Sudan' }, { code: 'SR', name: 'Suriname' }, { code: 'SE', name: 'Sweden' },
            { code: 'CH', name: 'Switzerland' }, { code: 'SY', name: 'Syria' }, { code: 'TW', name: 'Taiwan' }, { code: 'TJ', name: 'Tajikistan' }, { code: 'TZ', name: 'Tanzania' },
            { code: 'TH', name: 'Thailand' }, { code: 'TL', name: 'Timor-Leste' }, { code: 'TG', name: 'Togo' }, { code: 'TO', name: 'Tonga' }, { code: 'TT', name: 'Trinidad and Tobago' },
            { code: 'TN', name: 'Tunisia' }, { code: 'TR', name: 'Turkey' }, { code: 'TM', name: 'Turkmenistan' }, { code: 'TV', name: 'Tuvalu' }, { code: 'UG', name: 'Uganda' },
            { code: 'UA', name: 'Ukraine' }, { code: 'AE', name: 'United Arab Emirates' }, { code: 'GB', name: 'United Kingdom' }, { code: 'US', name: 'United States' }, { code: 'UY', name: 'Uruguay' },
            { code: 'UZ', name: 'Uzbekistan' }, { code: 'VU', name: 'Vanuatu' }, { code: 'VA', name: 'Vatican City' }, { code: 'VE', name: 'Venezuela' }, { code: 'VN', name: 'Vietnam' },
            { code: 'YE', name: 'Yemen' }, { code: 'ZM', name: 'Zambia' }, { code: 'ZW', name: 'Zimbabwe' }
        ];

        // --- DISPLAY COUNTRY FLAG BELOW BANNER ---
        // --- DISPLAY COUNTRY FLAG BELOW BANNER ---
        function displayCountryFlag() {
            if (!settings.countryFlag) {
                const existing = document.getElementById('fcw-country-flag-display');
                if (existing) existing.remove();
                return;
            }

            let flagContainer = document.getElementById('fcw-country-flag-display');

            // Check if we need to update
            if (flagContainer) {
                const currentImg = flagContainer.querySelector('img');
                const expectedSrc = `https://flagcdn.com/${settings.countryFlag.toLowerCase()}.svg`;

                // If src matches, just update the size (for slider changes)
                if (currentImg && currentImg.src === expectedSrc) {
                    // Update size inline style for immediate feedback
                    currentImg.style.setProperty('--fcw-flag-size', (settings.flagSize || 40) + 'px');
                    currentImg.style.height = (settings.flagSize || 40) + 'px';
                    return;
                }
                flagContainer.remove(); // Remove to re-add if changed
            }

            flagContainer = document.createElement('div');
            flagContainer.id = 'fcw-country-flag-display';
            flagContainer.className = 'fcw-country-flag-display';

            const flagImg = document.createElement('img');
            flagImg.src = `https://flagcdn.com/${settings.countryFlag.toLowerCase()}.svg`;
            flagImg.alt = settings.countryFlag;
            // Explicitly set size style inline as backup
            flagImg.style.setProperty('--fcw-flag-size', (settings.flagSize || 40) + 'px');
            flagImg.style.height = (settings.flagSize || 40) + 'px'; // Hard fallback

            flagImg.onerror = () => { flagContainer.remove(); };

            flagContainer.appendChild(flagImg);

            // Insert after the banner
            const banner = document.getElementById('fcw-main-banner');
            if (banner && banner.parentNode) {
                banner.parentNode.insertBefore(flagContainer, banner.nextSibling);
            }
        }

        // --- 5. Interactive Effects (Performance Optimized) ---
        function initBannerEffect() {
            // Effect disabled by user request
            // const banner = document.getElementById('fcw-main-banner');
            // if (!banner) return;
            // Banner remains static.
        }

        // --- 6. Main Initialization Logic (Smart Polling) ---

        function stopAntiFlash() {
            const af = document.getElementById('fcw-anti-flash');
            if (af) af.remove();
            // Reveal the page now that styling is ready
            if (document.body) {
                document.body.classList.add('fcw-ready');
            }
        }

        // The Modernizer is ONLY run for the owner
        const styleCreationDate = () => {
            const paragraphs = document.querySelectorAll('p');
            for (const p of paragraphs) {
                if (p.textContent.trim().startsWith('Created:') &&
                    (p.style.textAlign === 'center' || p.innerHTML.includes('Created:'))) {
                    // Check if it's the right one (simple heuristic)
                    if (!p.classList.contains('fcw-creation-date')) {
                        p.classList.add('fcw-creation-date');
                        p.style.color = ''; // Remove inline override
                    }
                }
            }
        };

        function cleanUpControlPanel() {
            const panels = document.querySelectorAll('.club-control-panel');
            if (!panels.length) return;

            panels.forEach(panel => {
                const elements = panel.querySelectorAll('*');
                elements.forEach(el => {
                    if (el.children.length === 0 && el.textContent) {
                        const text = el.textContent.trim().toUpperCase();
                        if (text.includes('MYSTIC NAVBAR') || text.includes('FAN-MADE NAVBAR')) {
                            // Target specific interactive parent or the literal text element itself
                            const target = el.closest('button, a, .btn, li') || el;
                            if (target) {
                                target.style.display = 'none';
                            }
                        }
                    }
                });
            });
        }

        function initModernizer() {
            injectStyles();
            loadSettings(activeClubId); // Load settings for the specific ID
            styleCreationDate();
            cleanUpControlPanel();
            setInterval(() => {
                styleCreationDate();
                cleanUpControlPanel();
            }, 2000); // Poll for dynamic changes

            // Find & ID the banner
            const possibleBanners = document.querySelectorAll('div[style*="background"]');
            let bannerFound = false;
            for (let i = 0; i < possibleBanners.length; i++) {
                const div = possibleBanners[i];
                const styleHeight = div.style.height;
                const styleWidth = div.style.width;
                const offsetWidth = div.offsetWidth;
                const clientHeight = div.clientHeight;

                // Primary check: explicit 348px height (site's default banner height)
                // OR computed dimensions if window is visible
                // Fallback: any div with background-image and height style containing 'px' (for minimized windows)
                const hasExplicitBannerHeight = styleHeight.includes('348px');
                const hasLargeDimensions = (clientHeight > 300) && (offsetWidth > 600);
                const hasBackgroundWithHeight = div.style.backgroundImage && styleHeight.includes('px');

                if (hasExplicitBannerHeight || hasLargeDimensions || hasBackgroundWithHeight) {
                    div.id = 'fcw-main-banner';
                    // Capture default banner URL if not already captured
                    if (!defaultBannerUrl) {
                        defaultBannerUrl = div.style.backgroundImage;
                    }
                    bannerFound = true;
                    break;
                }
            }

            // Banner Effect & Reveal
            if (document.getElementById('fcw-main-banner')) {
                initBannerEffect();
            }

            // Delay revealing the page if stats are present to prevent FOUC while ios_suite builds them
            const headers = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6, strong, b, div.header'));
            const statsHeader = headers.find(el => el.textContent && el.textContent.trim().toLowerCase() === 'club stats');

            if (statsHeader) {
                // If iOS suite has already finished swapping, it adds this class
                if (statsHeader.classList.contains('old-header-hidden')) {
                    stopAntiFlash();
                } else {
                    // Wait for iOS suite to replace the stats, with a 1.5s failsafe
                    let revealed = false;
                    const reveal = () => { if (!revealed) { revealed = true; stopAntiFlash(); } };
                    document.addEventListener('fcw-stats-ready', reveal, { once: true });
                    setTimeout(reveal, 1500);
                }
            } else {
                stopAntiFlash(); // Reveal immediately if no stats present
            }



            createSettingsPanel();
            updateStyles(); // Apply loaded settings
            displayCountryFlag(); // Display country flag if set

            // Inject Edit Look button into button row
            injectEditLookButton();

            // Inject new filters
            injectCardFilters();
        }

        // --- 10. Edit Look Button Injection ---
        function injectEditLookButton() {
            // Find the button row (display:flex with btn-primary buttons)
            const buttonRows = document.querySelectorAll('div[style*="display:flex"][style*="justify-content:center"]');
            let targetRow = null;

            for (const row of buttonRows) {
                if (row.querySelector('.btn-primary')) {
                    targetRow = row;
                    break;
                }
            }

            // Fallback: look for any container with multiple btn-primary links
            if (!targetRow) {
                const allBtns = document.querySelectorAll('a.btn-primary');
                if (allBtns.length > 2) {
                    targetRow = allBtns[0].parentElement;
                }
            }

            if (!targetRow) return;

            // Only inject if owner
            if (!isOwner) return;

            // Check if button already exists
            if (targetRow.querySelector('#fcw-edit-look-btn')) return;

            // Create the Edit Look button
            const editBtn = document.createElement('button');
            editBtn.id = 'fcw-edit-look-btn';
            editBtn.className = 'btn btn-primary fcw-settings-btn';
            editBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="margin-right:6px;">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
                Edit Look
            `;
            editBtn.style.cssText = `
                display: inline-flex;
                align-items: center;
                justify-content: center;
                background: var(--fcw-accent, #8d124d);
                border: none;
                color: white;
                padding: 10px 18px;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                font-size: 14px;
                transition: all 0.2s ease;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            `;

            // Add hover effect
            editBtn.addEventListener('mouseenter', () => {
                editBtn.style.transform = 'translateY(-2px)';
                editBtn.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
            });
            editBtn.addEventListener('mouseleave', () => {
                editBtn.style.transform = 'translateY(0)';
                editBtn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
            });

            // Click handler to open the settings panel
            editBtn.addEventListener('click', (e) => {
                e.preventDefault();
                // Safeguard: Only allow real human clicks
                if (!e.isTrusted) {
                    console.warn('[FCW Safeguard] Blocked programmatic click on Edit Look button');
                    return;
                }

                console.log('[FCW] Opening Settings Panel via user click');
                createSettingsPanel();
                const panel = document.getElementById('fcw-club-panel');
                const overlay = document.getElementById('fcw-panel-overlay');
                if (panel && overlay) {
                    // Reset to BANNER tab and remove preview mode
                    panel.classList.remove('fcw-preview-mode');
                    overlay.classList.remove('fcw-preview-mode');

                    // Ensure BANNER tab is active
                    panel.querySelectorAll('.fcw-tab-btn').forEach(b => b.classList.remove('active'));
                    panel.querySelector('.fcw-tab-btn[data-tab="banner"]').classList.add('active');

                    panel.querySelectorAll('.fcw-tab-content').forEach(c => c.classList.remove('active'));
                    document.getElementById('fcw-tab-banner').classList.add('active');

                    panel.classList.add('active');
                    overlay.classList.add('active');
                }
            });

            targetRow.appendChild(editBtn);
        }

        // --- 9. Filter Injection ---
        // Creates a dedicated "Overhauled" section with custom filters
        // Uses INLINE onclick handlers (exactly like the native site) for filter selection
        function injectCardFilters() {

            // Make setSBCardType available globally if it doesn't exist (fallback)
            if (typeof window.fcwSetCardType !== 'function') {
                window.fcwSetCardType = function (id, imageUrl) {
                    // First try the native function
                    if (typeof window.setSBCardType === 'function') {
                        window.setSBCardType(id, imageUrl);
                    } else {
                        // Fallback: URL-based navigation
                        const url = new URL(window.location.href);
                        url.searchParams.set('type', id);
                        window.location.href = url.toString();
                    }
                };
            }

            const createOverhauledSection = (forceRefresh = false) => {
                // If section already exists and this isn't a forced refresh, skip
                const existingSection = document.getElementById('fcw-overhauled-section');
                if (existingSection && !forceRefresh) {
                    return true; // Already created by early injection
                }

                // ROBUST MENU DETECTION - Multiple strategies
                let cardTypeMenu = null;

                // Strategy 1: Find "Card Type" text in navbar links
                const allLinks = document.querySelectorAll('a');
                for (const link of allLinks) {
                    if (link.textContent && link.textContent.trim().startsWith('Card Type')) {
                        // Found it - now find the dropdown menu
                        const parentLi = link.closest('li');
                        if (parentLi) {
                            cardTypeMenu = parentLi.querySelector('ul');
                            if (cardTypeMenu) break;
                        }
                        // Try nextSibling
                        let next = link.nextElementSibling;
                        if (next && next.tagName === 'UL') {
                            cardTypeMenu = next;
                            break;
                        }
                    }
                }

                // Strategy 2: Find group-futwatch and get its parent UL
                if (!cardTypeMenu) {
                    const futwatch = document.getElementById('group-futwatch');
                    if (futwatch) {
                        cardTypeMenu = futwatch.closest('ul');
                    }
                }

                // Strategy 3: Find any dropdown-menu inside navbar that has card type items
                if (!cardTypeMenu) {
                    const dropdowns = document.querySelectorAll('.dropdown-menu');
                    for (const dd of dropdowns) {
                        if (dd.innerHTML.includes('setSBCardType') || dd.id?.includes('futwatch')) {
                            cardTypeMenu = dd;
                            break;
                        }
                    }
                }

                if (!cardTypeMenu) {
                    return false;
                }

                // Load custom filters from localStorage
                let customFilters = [];
                try {
                    const stored = localStorage.getItem('fc_watch_custom_filters_v4');
                    customFilters = stored ? JSON.parse(stored) : [];
                    customFilters.sort((a, b) => (a.order || 0) - (b.order || 0));
                } catch (e) {
                    console.error('[FCW] Error loading filters:', e);
                    customFilters = [];
                }

                // Remove existing Overhauled section if present (only reached on forceRefresh)
                const existing = document.getElementById('fcw-overhauled-section');
                if (existing) existing.remove();

                // If no filters, don't create section
                if (customFilters.length === 0) {
                    return true;
                }

                // Build the HTML structure EXACTLY like the site does (lines 6312-6317, 6322-6323)
                const currentType = new URLSearchParams(window.location.search).get('type');

                // Build filter items HTML
                let filtersHtml = '';
                customFilters.forEach(cf => {
                    if (!cf.id || !cf.label || !cf.imageUrl) return;

                    const isActive = currentType === cf.id;
                    const activeStyle = isActive ? 'font-weight: bold; color: var(--fcw-accent, #8d124d);' : '';

                    // Use INLINE onclick exactly like the site (line 6322)
                    filtersHtml += `
                        <li>
                            <a href="#" onclick="if(typeof setSBCardType==='function'){setSBCardType('${cf.id}','${cf.imageUrl}');}else{window.fcwSetCardType('${cf.id}','${cf.imageUrl}');}return false;" style="display: flex; align-items: center; gap: 6px; ${activeStyle}">
                                <img class="cardicon" src="${cf.imageUrl}" style="height: 25px; width: auto;" onerror="this.style.display='none'">
                                ${cf.label}
                            </a>
                        </li>
                    `;
                });

                // Create the Overhauled section element
                const overhauledLi = document.createElement('li');
                overhauledLi.id = 'fcw-overhauled-section';
                overhauledLi.innerHTML = `
                    <a rel="nofollow" href="#" class="has-submenu" id="group-fcw-overhauled" aria-haspopup="true" aria-controls="fcw-overhauled-sub" aria-expanded="false">
                        <span style="color: #fff !important; font-weight: 700;">⚡ Overhauled</span>
                        <span class="caret"></span>
                    </a>
                    <ul class="dropdown-menu" id="fcw-overhauled-sub" style="display: none;">
                        ${filtersHtml}
                    </ul>
                `;

                // Use immediate show/hide (no delays)
                const subMenu = overhauledLi.querySelector('#fcw-overhauled-sub');
                if (subMenu) {
                    subMenu.style.top = '-5px';
                    subMenu.style.left = '88%';
                    subMenu.style.position = 'absolute';
                    overhauledLi.style.position = 'relative';

                    // Immediate toggle on mouseenter/leave
                    overhauledLi.onmouseenter = () => { subMenu.style.display = 'block'; };
                    overhauledLi.onmouseleave = () => { subMenu.style.display = 'none'; };
                }

                // Insert at the TOP of the Card Type menu
                cardTypeMenu.insertBefore(overhauledLi, cardTypeMenu.firstChild);

                console.log('[FCW Modernizer] Injected Overhauled section with', customFilters.length, 'filters');
                return true;
            };

            // INSTANT: Try immediately first
            if (!createOverhauledSection()) {

                // --- SMARTMENUS SCROLL INTERCEPTOR BYPASS ---
                // SmartMenus heavily overrides 'mousewheel' and 'DOMMouseScroll' events on all ULs.
                // To allow native scrolling on huge leaf nodes, we must stop event propagation entirely.
                const unblockScroll = () => {
                    const dailyRewardList = document.getElementById('group-daily-reward-pack-sub');
                    if (dailyRewardList && !dailyRewardList.dataset.scrollUnblocked) {
                        dailyRewardList.dataset.scrollUnblocked = 'true';
                        // Capture phase is CRITICAL to beat SmartMenus which binds to the document/parent
                        const stopProp = (e) => { e.stopPropagation(); };
                        dailyRewardList.addEventListener('wheel', stopProp, { capture: true, passive: true });
                        dailyRewardList.addEventListener('mousewheel', stopProp, { capture: true, passive: true });
                        dailyRewardList.addEventListener('DOMMouseScroll', stopProp, { capture: true, passive: true });
                        dailyRewardList.addEventListener('touchmove', stopProp, { capture: true, passive: true });
                    }
                };

                // Actively watch for the menu to be injected by the site
                const menuObserver = new MutationObserver(() => unblockScroll());
                menuObserver.observe(document.body, { childList: true, subtree: true });
                unblockScroll(); // Try immediately

                // Wait for DOMContentLoaded then try with faster polling
                const startPolling = () => {
                    // Try once more immediately after DOM is ready
                    if (createOverhauledSection()) return;

                    // ULTRA-FAST POLLING: Use RAF for first 500ms, then setInterval
                    let attempts = 0;
                    const maxRafAttempts = 30; // ~500ms at 60fps
                    const maxIntervalAttempts = 50; // 2.5s more at 50ms intervals

                    const rafPoll = () => {
                        attempts++;
                        if (createOverhauledSection()) return;
                        if (attempts < maxRafAttempts) {
                            requestAnimationFrame(rafPoll);
                        } else {
                            // Switch to interval polling for remaining attempts
                            const poll = setInterval(() => {
                                attempts++;
                                if (createOverhauledSection()) {
                                    clearInterval(poll);
                                } else if (attempts > maxRafAttempts + maxIntervalAttempts) {
                                    clearInterval(poll);
                                    console.log('[FCW Modernizer] Could not find Card Type menu after all attempts');
                                }
                            }, 50);
                        }
                    };
                    requestAnimationFrame(rafPoll);
                };

                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', startPolling);
                } else {
                    startPolling();
                }
            }

            // Use MutationObserver to re-inject if DOM changes (e.g., AJAX navigation)
            let debounceTimer = null;
            const observer = new MutationObserver(() => {
                // Fast debounce - only 50ms delay
                if (debounceTimer) clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    // Check if our section was removed OR if Card Type menu appeared
                    if (!document.getElementById('fcw-overhauled-section')) {
                        createOverhauledSection();
                    }
                }, 50); // Faster debounce
            });

            // Observe the body for changes
            if (document.body) {
                observer.observe(document.body, { childList: true, subtree: true });
            }

            // Listen for filter updates from other scripts (navbar settings, inspector +button)
            window.addEventListener('fcw-filters-updated', () => {
                createOverhauledSection(true); // Force refresh to update filters
            });

            // Cross-tab sync
            window.addEventListener('storage', (e) => {
                if (e.key === 'fc_watch_custom_filters_v4') {
                    createOverhauledSection(true); // Force refresh for synced filters
                }
            });
        }

        function createSettingsPanel() {
            if (document.getElementById('fcw-club-panel')) return;

            const overlay = document.createElement('div');
            overlay.id = 'fcw-panel-overlay';
            document.body.appendChild(overlay);

            const panel = document.createElement('div');
            panel.id = 'fcw-club-panel';
            panel.classList.remove('active'); // Safeguard: Ensure it starts closed

            // Header
            const closeBtn = document.createElement('button');
            closeBtn.className = 'fcw-close-btn';
            closeBtn.innerHTML = '&times;';
            panel.appendChild(closeBtn);

            // Title with icon
            const headerDiv = document.createElement('div');
            headerDiv.style.cssText = 'margin-bottom: 24px;';

            const title = document.createElement('h3');
            title.style.cssText = 'margin: 0 0 8px 0; font-size: 22px; font-weight: 700; color: #fff; letter-spacing: -0.02em;';
            title.textContent = '✨ Customize Club';
            headerDiv.appendChild(title);

            const info = document.createElement('span');
            info.className = 'fcw-info-pill';
            info.textContent = `Club ID: ${activeClubId}`;
            headerDiv.appendChild(info);

            panel.appendChild(headerDiv);

            // ===== TAB NAVIGATION =====
            const tabNav = document.createElement('div');
            tabNav.className = 'fcw-tabs';

            // 1. BANNER Tab
            const tabBanner = document.createElement('button');
            tabBanner.className = 'fcw-tab-btn active';
            tabBanner.textContent = 'BANNER';
            tabBanner.dataset.tab = 'banner';
            tabNav.appendChild(tabBanner);

            // 2. CLUB FLAG Tab
            const tabFlag = document.createElement('button');
            tabFlag.className = 'fcw-tab-btn';
            tabFlag.textContent = 'CLUB FLAG';
            tabFlag.dataset.tab = 'flag';
            tabNav.appendChild(tabFlag);

            // 3. STATS LAYOUT Tab
            const tabStats = document.createElement('button');
            tabStats.className = 'fcw-tab-btn';
            tabStats.textContent = 'STATS LAYOUT';
            tabStats.dataset.tab = 'stats';
            tabNav.appendChild(tabStats);

            panel.appendChild(tabNav);

            // ===== 1. BANNER CONTENT =====
            const bannerContent = document.createElement('div');
            bannerContent.className = 'fcw-tab-content active';
            bannerContent.id = 'fcw-tab-banner';

            // Group 1: Banner Settings (Combined Image + Size)
            const grp1 = document.createElement('div');
            grp1.className = 'fcw-setting-group';

            const title1 = document.createElement('span');
            title1.className = 'fcw-setting-title';
            title1.textContent = 'Banner Settings';
            grp1.appendChild(title1);

            // Row 1: Hide Banner + Size Info
            const row1 = document.createElement('div');
            row1.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;';

            const label1 = document.createElement('label');
            label1.className = 'fcw-checkbox-label';
            label1.style.cssText = 'margin: 0; display: flex; align-items: center; gap: 12px; cursor: pointer;';
            const span1 = document.createElement('span'); span1.textContent = 'Hide Default Banner'; label1.appendChild(span1);

            // Switch container
            const switchDiv = document.createElement('div');
            switchDiv.className = 'fcw-switch';

            const input1 = document.createElement('input');
            input1.type = 'checkbox'; input1.id = 'fcw-hide-banner';
            if (settings.hideBanner) input1.checked = true;

            const slider = document.createElement('span');
            slider.className = 'fcw-switch-slider';

            switchDiv.appendChild(input1);
            switchDiv.appendChild(slider);
            label1.appendChild(switchDiv);
            row1.appendChild(label1);

            // Size info pill
            const sizeInfo = document.createElement('span');
            sizeInfo.style.cssText = 'font-size: 12px; color: #94a3b8; font-family: monospace; background: rgba(255,255,255,0.05); padding: 4px 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05);';
            sizeInfo.innerHTML = `<span id="fcw-size-display-main" style="color: #fff; font-weight: 600;">${settings.bannerHeight}px × ${settings.bannerWidth}%</span>`;
            row1.appendChild(sizeInfo);
            grp1.appendChild(row1);

            // Row 2: Upload Button (Half width) + Adjust Size Button (Half width)
            const actionRow = document.createElement('div');
            actionRow.style.cssText = 'display: flex; gap: 10px; margin-bottom: 12px;';

            const label2 = document.createElement('label');
            label2.className = 'fcw-btn-upload';
            label2.style.cssText = 'flex: 1;'; // Use CSS padding
            label2.innerHTML = `<span>Upload Image</span>`;
            const input2 = document.createElement('input');
            input2.type = 'file'; input2.id = 'fcw-banner-upload'; input2.style.display = 'none'; input2.accept = 'image/*,.gif';
            label2.appendChild(input2);
            actionRow.appendChild(label2);

            const resizeBtn = document.createElement('button');
            resizeBtn.className = 'fcw-btn-resize-banner';
            resizeBtn.id = 'fcw-resize-banner-btn';
            resizeBtn.style.cssText = 'flex: 1;'; // Use CSS padding
            resizeBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                </svg>
                Adjust Size
            `;
            actionRow.appendChild(resizeBtn);
            grp1.appendChild(actionRow);

            // Row 3: URL Input structure
            const urlInputWrapper = document.createElement('div');
            urlInputWrapper.style.cssText = 'display: flex; gap: 8px; margin-bottom: 12px;';
            const urlInput = document.createElement('input');
            urlInput.type = 'text';
            urlInput.id = 'fcw-banner-url-input';
            urlInput.placeholder = 'Or paste image/GIF URL...';
            urlInput.style.cssText = 'flex: 1; padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.12); background: rgba(0,0,0,0.25); color: #fff; font-size: 13px; transition: all 0.2s; outline: none;';
            urlInputWrapper.appendChild(urlInput);
            const urlBtn = document.createElement('button');
            urlBtn.textContent = 'Apply';
            urlBtn.style.cssText = 'padding: 10px 16px; border-radius: 10px; border: none; background: var(--fcw-accent, #8d124d); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s;';
            urlBtn.id = 'fcw-banner-url-apply';
            urlInputWrapper.appendChild(urlBtn);
            grp1.appendChild(urlInputWrapper);

            // Row 4: Reset Button
            const btnReset1 = document.createElement('button');
            btnReset1.className = 'fcw-btn-reset';
            btnReset1.id = 'fcw-reset-banner';
            btnReset1.textContent = 'Reset Image';
            btnReset1.style.marginTop = '0'; // Remove top margin
            grp1.appendChild(btnReset1);

            bannerContent.appendChild(grp1);
            panel.appendChild(bannerContent);

            // ===== 2. FLAG CONTENT =====
            const flagContent = document.createElement('div');
            flagContent.className = 'fcw-tab-content';
            flagContent.id = 'fcw-tab-flag';

            // Group 3: Country Flag
            const grp3 = document.createElement('div');
            grp3.className = 'fcw-setting-group';
            const title3 = document.createElement('span');
            title3.className = 'fcw-setting-title';
            title3.textContent = '🚩 Country Flag';
            grp3.appendChild(title3);

            // Flag dropdown with mini flags
            const flagSelect = document.createElement('select');
            flagSelect.className = 'fcw-flag-select';
            flagSelect.id = 'fcw-flag-select';

            const defaultOpt = document.createElement('option');
            defaultOpt.value = '';
            defaultOpt.textContent = '-- Select Country --';
            flagSelect.appendChild(defaultOpt);

            COUNTRIES.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.code;
                opt.textContent = c.name;
                opt.style.backgroundImage = `url(https://flagcdn.com/w20/${c.code.toLowerCase()}.png)`;
                opt.style.backgroundRepeat = 'no-repeat';
                opt.style.backgroundPosition = 'left center';
                opt.style.paddingLeft = '30px';
                if (settings.countryFlag === c.code) opt.selected = true;
                flagSelect.appendChild(opt);
            });
            grp3.appendChild(flagSelect);

            // Preview container
            const flagPreview = document.createElement('div');
            flagPreview.className = 'fcw-flag-preview';
            flagPreview.id = 'fcw-flag-preview';
            if (settings.countryFlag) {
                const country = COUNTRIES.find(c => c.code === settings.countryFlag);
                flagPreview.innerHTML = `
                    <img src="https://flagcdn.com/${settings.countryFlag.toLowerCase()}.svg" alt="${settings.countryFlag}">
                    <span>${country ? country.name : settings.countryFlag}</span>
                `;
            } else {
                flagPreview.innerHTML = '<span>No flag selected</span>';
            }
            grp3.appendChild(flagPreview);

            // Clear button
            const btnClearFlag = document.createElement('button');
            btnClearFlag.className = 'fcw-btn-reset';
            btnClearFlag.id = 'fcw-clear-flag';
            btnClearFlag.textContent = 'Clear Flag';
            btnClearFlag.style.marginTop = '10px';
            grp3.appendChild(btnClearFlag);

            // Flag Size Slider
            const sizeRow = document.createElement('div');
            sizeRow.className = 'fcw-control-row';
            sizeRow.style.marginTop = '16px';
            sizeRow.style.borderTop = '1px solid rgba(255,255,255,0.08)';
            sizeRow.style.paddingTop = '12px';
            const spanSize = document.createElement('span'); spanSize.textContent = 'Flag Size (px)'; sizeRow.appendChild(spanSize);
            const inputSize = document.createElement('input');
            inputSize.type = 'range'; inputSize.id = 'fcw-flag-size'; inputSize.min = '20'; inputSize.max = '350';
            inputSize.value = settings.flagSize || 40;
            sizeRow.appendChild(inputSize);
            const valSize = document.createElement('span'); valSize.className = 'fcw-control-val'; valSize.id = 'val-flag-size';
            valSize.textContent = settings.flagSize || 40;
            sizeRow.appendChild(valSize);
            grp3.appendChild(sizeRow);

            flagContent.appendChild(grp3);
            panel.appendChild(flagContent);

            // ===== 3. STATS CONTENT =====
            const statsContent = document.createElement('div');
            statsContent.className = 'fcw-tab-content';
            statsContent.id = 'fcw-tab-stats';

            // Stats Layout Group
            const grpLayout = document.createElement('div');
            grpLayout.className = 'fcw-setting-group';
            const titleLayout = document.createElement('span');
            titleLayout.className = 'fcw-setting-title';
            titleLayout.textContent = '📊 Stats Layout';
            grpLayout.appendChild(titleLayout);

            // Layout selector buttons
            const layoutBtns = document.createElement('div');
            layoutBtns.style.cssText = 'display: flex; gap: 8px; flex-wrap: wrap;';
            const layouts = [
                { id: 'default', label: 'Default' },
                { id: 'list', label: 'List' },
                { id: '4x2', label: '4×2 Grid' },
                { id: '2x4', label: '2×4 Grid' }
            ];
            layouts.forEach(l => {
                let savedLayout = settings.statsLayout;
                if (savedLayout === '3x2') savedLayout = '4x2';
                if (savedLayout === '2x3') savedLayout = '2x4';

                const btn = document.createElement('button');
                btn.className = 'fcw-layout-btn' + (savedLayout === l.id ? ' active' : '');
                btn.textContent = l.label;
                btn.dataset.layout = l.id;
                btn.style.cssText = 'padding: 6px 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); color: #e2e8f0; font-size: 11px; cursor: pointer; transition: all 0.15s;';
                if (savedLayout === l.id) {
                    btn.style.background = 'var(--fcw-accent, #8d124d)';
                    btn.style.color = '#fff';
                    btn.style.borderColor = 'var(--fcw-accent, #8d124d)';
                }
                layoutBtns.appendChild(btn);
            });
            grpLayout.appendChild(layoutBtns);
            statsContent.appendChild(grpLayout);

            // Group 4: Button Bar Glass Tint (MOVED HERE)
            const grp4 = document.createElement('div');
            grp4.className = 'fcw-setting-group';
            grp4.style.marginTop = '10px';
            const title4 = document.createElement('span');
            title4.className = 'fcw-setting-title';
            title4.textContent = '🎨 Button Bar Tint';
            grp4.appendChild(title4);

            const tintRow = document.createElement('div');
            tintRow.style.cssText = 'display: flex; align-items: center; gap: 12px;';
            const tintLabel = document.createElement('span');
            tintLabel.textContent = 'Glass Color';
            tintLabel.style.cssText = 'font-size: 14px; color: #e2e8f0;';
            tintRow.appendChild(tintLabel);

            const tintInput = document.createElement('input');
            tintInput.type = 'color';
            tintInput.id = 'fcw-button-bar-tint';
            tintInput.value = settings.buttonBarTint || '#0f141e';
            tintInput.style.cssText = 'width: 40px; height: 40px; border: none; border-radius: 8px; cursor: pointer; background: transparent;';
            tintRow.appendChild(tintInput);

            const tintClearBtn = document.createElement('button');
            tintClearBtn.textContent = 'Clear';
            tintClearBtn.id = 'fcw-button-bar-tint-clear';
            tintClearBtn.style.cssText = 'padding: 8px 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.05); color: #fff; font-size: 12px; cursor: pointer; transition: all 0.2s;';
            tintRow.appendChild(tintClearBtn);

            grp4.appendChild(tintRow);

            // Opacity Slider
            const opacityRow = document.createElement('div');
            opacityRow.className = 'fcw-control-row';
            opacityRow.style.marginTop = '12px';
            opacityRow.style.paddingTop = '12px';
            opacityRow.style.borderTop = '1px solid rgba(255,255,255,0.08)';
            const spanOp = document.createElement('span'); spanOp.textContent = 'Opacity'; opacityRow.appendChild(spanOp);
            const inputOp = document.createElement('input');
            inputOp.type = 'range'; inputOp.id = 'fcw-button-bar-opacity'; inputOp.min = '0'; inputOp.max = '1'; inputOp.step = '0.05';
            // Default 0.85 if undefined
            inputOp.value = settings.buttonBarOpacity !== undefined ? settings.buttonBarOpacity : 0.85;
            opacityRow.appendChild(inputOp);
            const valOp = document.createElement('span'); valOp.className = 'fcw-control-val'; valOp.id = 'val-button-bar-opacity';
            valOp.textContent = inputOp.value;
            opacityRow.appendChild(valOp);
            grp4.appendChild(opacityRow);

            statsContent.appendChild(grp4);

            // Stats Glass Color Group
            const grpGlass = document.createElement('div');
            grpGlass.className = 'fcw-setting-group';
            grpGlass.style.marginTop = '10px';
            const titleGlass = document.createElement('span');
            titleGlass.className = 'fcw-setting-title';
            titleGlass.textContent = '🎨 Stats Glass Color';
            grpGlass.appendChild(titleGlass);

            const glassRow = document.createElement('div');
            glassRow.style.cssText = 'display: flex; align-items: center; gap: 12px;';
            const glassLabel = document.createElement('span');
            glassLabel.textContent = 'Tint';
            glassLabel.style.cssText = 'font-size: 12px; color: #e2e8f0;';
            glassRow.appendChild(glassLabel);

            const glassInput = document.createElement('input');
            glassInput.type = 'color';
            glassInput.id = 'fcw-stats-glass-color';
            glassInput.value = settings.statsGlassColor || '#12121c';
            glassInput.style.cssText = 'width: 36px; height: 36px; border: none; border-radius: 8px; cursor: pointer; background: transparent;';
            glassRow.appendChild(glassInput);

            const glassClear = document.createElement('button');
            glassClear.textContent = 'Clear';
            glassClear.id = 'fcw-stats-glass-clear';
            glassClear.style.cssText = 'padding: 6px 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); color: #fff; font-size: 11px; cursor: pointer;';
            glassRow.appendChild(glassClear);
            grpGlass.appendChild(glassRow);

            // Stats Opacity Slider
            const opRow = document.createElement('div');
            opRow.style.cssText = 'display: flex; align-items: center; justify-content: space-between; margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.08);';
            const opLabel = document.createElement('span'); opLabel.textContent = 'Opacity'; opLabel.style.cssText = 'font-size: 12px; color: #e2e8f0;';
            opRow.appendChild(opLabel);

            const opInputStats = document.createElement('input');
            opInputStats.type = 'range'; opInputStats.id = 'fcw-stats-opacity'; opInputStats.min = '0'; opInputStats.max = '1'; opInputStats.step = '0.05';
            opInputStats.value = settings.statsOpacity !== undefined ? settings.statsOpacity : 0.65;
            opInputStats.style.cssText = 'width: 120px;';
            opRow.appendChild(opInputStats);

            const opValStats = document.createElement('span');
            opValStats.id = 'val-stats-opacity';
            opValStats.textContent = opInputStats.value;
            opValStats.className = 'fcw-control-val';
            opRow.appendChild(opValStats);

            grpGlass.appendChild(opRow);

            statsContent.appendChild(grpGlass);

            // Corner Style Group
            const grpCorner = document.createElement('div');
            grpCorner.className = 'fcw-setting-group';
            grpCorner.style.marginTop = '10px';
            const titleCorner = document.createElement('span');
            titleCorner.className = 'fcw-setting-title';
            titleCorner.textContent = '📐 Corner Style';
            grpCorner.appendChild(titleCorner);

            const cornerBtns = document.createElement('div');
            cornerBtns.id = 'fcw-corner-btns';
            cornerBtns.style.cssText = 'display: flex; gap: 8px;';
            const cornerStyles = [
                { id: 'rounded', label: '⬤ Rounded' },
                { id: 'sharp', label: '◼ Sharp' }
            ];
            cornerStyles.forEach(cs => {
                const btn = document.createElement('button');
                btn.textContent = cs.label;
                btn.dataset.corner = cs.id;
                btn.style.cssText = 'padding: 6px 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); color: #e2e8f0; font-size: 11px; cursor: pointer; transition: all 0.15s;';
                if ((settings.statsCornerStyle || 'rounded') === cs.id) {
                    btn.style.background = 'var(--fcw-accent, #8d124d)';
                    btn.style.color = '#fff';
                    btn.style.borderColor = 'var(--fcw-accent, #8d124d)';
                }
                cornerBtns.appendChild(btn);
            });
            grpCorner.appendChild(cornerBtns);
            statsContent.appendChild(grpCorner);

            panel.appendChild(statsContent);

            // Preview Mode Label
            const previewLabel = document.createElement('div');
            previewLabel.className = 'fcw-preview-label';
            previewLabel.textContent = '👁 PREVIEW MODE';
            panel.appendChild(previewLabel);

            document.body.appendChild(panel);

            const closePanel = () => {
                panel.classList.remove('active', 'fcw-preview-mode');
                overlay.classList.remove('active', 'fcw-preview-mode');
            };
            panel.querySelector('.fcw-close-btn').addEventListener('click', closePanel);
            overlay.addEventListener('click', closePanel);

            const linkRange = (id, key, dispId) => {
                const el = document.getElementById(id);
                // Visual update (Fast, no storage IO)
                el.addEventListener('input', (e) => {
                    const val = Number(e.target.value);
                    document.getElementById(dispId).innerText = val;
                    settings[key] = val;
                    updateStyles();
                });
                // Persist update (Storage IO)
                el.addEventListener('change', (e) => {
                    saveSetting(key, Number(e.target.value));
                });
            };

            linkRange('fcw-flag-size', 'flagSize', 'val-flag-size');

            // Make flag size slider also update the flag display in real-time
            document.getElementById('fcw-flag-size').addEventListener('input', () => {
                displayCountryFlag();
            });

            // --- Button Bar Tint Handlers ---
            document.getElementById('fcw-button-bar-tint').addEventListener('input', (e) => {
                settings.buttonBarTint = e.target.value;
                updateStyles();
            });
            document.getElementById('fcw-button-bar-tint').addEventListener('change', (e) => {
                saveSetting('buttonBarTint', e.target.value);
            });
            document.getElementById('fcw-button-bar-tint-clear').addEventListener('click', () => {
                saveSetting('buttonBarTint', null);
                document.getElementById('fcw-button-bar-tint').value = '#0f141e';
                updateStyles();
            });

            // Link Opacity Slider
            linkRange('fcw-button-bar-opacity', 'buttonBarOpacity', 'val-button-bar-opacity');

            // ===== TAB SWITCHING =====
            tabNav.addEventListener('click', (e) => {
                if (!e.target.classList.contains('fcw-tab-btn')) return;
                const tabId = e.target.dataset.tab;

                // Update tab buttons
                tabNav.querySelectorAll('.fcw-tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');

                // Update tab content
                panel.querySelectorAll('.fcw-tab-content').forEach(c => c.classList.remove('active'));
                document.getElementById('fcw-tab-' + tabId).classList.add('active');

                // Preview mode: shift panel right & dim overlay when stats or flag tab is active
                if (tabId === 'stats' || tabId === 'flag') {
                    panel.classList.add('fcw-preview-mode');
                    overlay.classList.add('fcw-preview-mode');
                } else {
                    panel.classList.remove('fcw-preview-mode');
                    overlay.classList.remove('fcw-preview-mode');
                }
            });

            // ===== STATS LAYOUT HANDLERS =====
            layoutBtns.addEventListener('click', (e) => {
                if (!e.target.dataset.layout) return;
                const layout = e.target.dataset.layout;

                // Update button visuals
                layoutBtns.querySelectorAll('button').forEach(b => {
                    b.style.background = 'rgba(255,255,255,0.03)';
                    b.style.color = '#e2e8f0';
                    b.style.borderColor = 'rgba(255,255,255,0.1)';
                });
                e.target.style.background = 'var(--fcw-accent, #8d124d)';
                e.target.style.color = '#fff';
                e.target.style.borderColor = 'var(--fcw-accent, #8d124d)';

                // Save and apply
                saveSetting('statsLayout', layout);
                window.dispatchEvent(new CustomEvent('fcw-stats-updated', { detail: { statsLayout: layout } }));
            });

            // ===== STATS GLASS COLOR HANDLERS =====
            document.getElementById('fcw-stats-glass-color').addEventListener('input', (e) => {
                settings.statsGlassColor = e.target.value;
                window.dispatchEvent(new CustomEvent('fcw-stats-updated', { detail: { statsGlassColor: e.target.value } }));
            });
            document.getElementById('fcw-stats-glass-color').addEventListener('change', (e) => {
                saveSetting('statsGlassColor', e.target.value);
            });
            document.getElementById('fcw-stats-glass-clear').addEventListener('click', () => {
                saveSetting('statsGlassColor', null);
                document.getElementById('fcw-stats-glass-color').value = '#12121c';
                window.dispatchEvent(new CustomEvent('fcw-stats-updated', { detail: { statsGlassColor: null } }));
            });

            // ===== STATS OPACITY HANDLERS =====
            linkRange('fcw-stats-opacity', 'statsOpacity', 'val-stats-opacity');
            document.getElementById('fcw-stats-opacity').addEventListener('input', (e) => {
                // Also dispatch update for real-time preview
                window.dispatchEvent(new CustomEvent('fcw-stats-updated', { detail: { statsOpacity: Number(e.target.value) } }));
            });

            // ===== CORNER STYLE HANDLERS =====
            cornerBtns.addEventListener('click', (e) => {
                if (!e.target.dataset.corner) return;
                const corner = e.target.dataset.corner;

                // Update button visuals
                cornerBtns.querySelectorAll('button').forEach(b => {
                    b.style.background = 'rgba(255,255,255,0.03)';
                    b.style.color = '#e2e8f0';
                    b.style.borderColor = 'rgba(255,255,255,0.1)';
                });
                e.target.style.background = 'var(--fcw-accent, #8d124d)';
                e.target.style.color = '#fff';
                e.target.style.borderColor = 'var(--fcw-accent, #8d124d)';

                saveSetting('statsCornerStyle', corner);
                window.dispatchEvent(new CustomEvent('fcw-stats-updated', { detail: { statsCornerStyle: corner } }));
            });



            // --- Banner Resize Mode Handler ---
            document.getElementById('fcw-resize-banner-btn').addEventListener('click', () => {
                let banner = document.getElementById('fcw-main-banner');

                // Retry finding banner if missing (Robustness Fix)
                if (!banner) {
                    const possibleBanners = document.querySelectorAll('div[style*="background"]');
                    for (let i = 0; i < possibleBanners.length; i++) {
                        const div = possibleBanners[i];
                        // Relaxed heuristic to find any large banner-like element
                        if ((div.style.height.includes('px') || div.clientHeight > 200) && div.offsetWidth > 500) {
                            div.id = 'fcw-main-banner';
                            banner = div;
                            break;
                        }
                    }
                }

                if (!banner) {
                    alert('Banner not found on this page. Please try reloading or ensure a banner is visible.');
                    return;
                }

                // Close the settings panel
                closePanel();

                // Create overlay
                let overlay = document.getElementById('fcw-resize-overlay');
                if (!overlay) {
                    overlay = document.createElement('div');
                    overlay.id = 'fcw-resize-overlay';
                    document.body.appendChild(overlay);
                }

                // Create toolbar
                let toolbar = document.getElementById('fcw-resize-toolbar');
                if (!toolbar) {
                    toolbar = document.createElement('div');
                    toolbar.id = 'fcw-resize-toolbar';
                    toolbar.innerHTML = `
                        <div class="fcw-size-display">
                            <span id="fcw-live-height">${settings.bannerHeight}</span>px × <span id="fcw-live-width">${settings.bannerWidth}</span>%
                        </div>
                        <button class="fcw-reset-btn">Reset to Default</button>
                        <button class="fcw-done-btn">Done</button>
                    `;
                    document.body.appendChild(toolbar);
                } else {
                    document.getElementById('fcw-live-height').textContent = settings.bannerHeight;
                    document.getElementById('fcw-live-width').textContent = settings.bannerWidth;
                }

                // Add resize handles to banner
                const handlePositions = [
                    'corner-nw', 'corner-ne', 'corner-sw', 'corner-se',
                    'edge-n', 'edge-s', 'edge-e', 'edge-w'
                ];

                // Remove old handles if any
                banner.querySelectorAll('.fcw-resize-handle').forEach(h => h.remove());

                // Store initial values
                let currentHeight = settings.bannerHeight;
                let currentWidth = settings.bannerWidth;
                const minHeight = 150;
                const maxHeight = 800;
                const minWidth = 40;
                const maxWidth = 100;

                // Resize state
                let isResizing = false;
                let resizeDirection = null;
                let startX, startY, startHeight, startWidth;

                // Update display function
                const updateLiveDisplay = () => {
                    const liveH = document.getElementById('fcw-live-height');
                    const liveW = document.getElementById('fcw-live-width');
                    if (liveH) liveH.textContent = currentHeight;
                    if (liveW) liveW.textContent = currentWidth;
                };

                // Mouse move handler (will be added to document)
                const onMouseMove = (e) => {
                    if (!isResizing) return;
                    e.preventDefault();

                    const deltaX = e.clientX - startX;
                    const deltaY = e.clientY - startY;

                    // Calculate new dimensions based on direction
                    let newHeight = startHeight;
                    let newWidth = startWidth;

                    // Height adjustments (only for N, S edges and corners)
                    if (resizeDirection.includes('edge-n') || resizeDirection.includes('corner-n')) {
                        newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight - deltaY));
                    } else if (resizeDirection.includes('edge-s') || resizeDirection.includes('corner-s')) {
                        newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight + deltaY));
                    }

                    // Width adjustments (convert pixel delta to percentage)
                    const pageWidth = document.documentElement.clientWidth;
                    const widthDeltaPercent = (deltaX / pageWidth) * 100 * 2; // multiply by 2 for more responsive feel

                    if (resizeDirection.includes('edge-w') || resizeDirection.includes('corner-nw') || resizeDirection.includes('corner-sw')) {
                        newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth - widthDeltaPercent));
                    } else if (resizeDirection.includes('edge-e') || resizeDirection.includes('corner-ne') || resizeDirection.includes('corner-se')) {
                        newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + widthDeltaPercent));
                    }

                    // Apply changes
                    currentHeight = Math.round(newHeight);
                    currentWidth = Math.round(newWidth);

                    settings.bannerHeight = currentHeight;
                    settings.bannerWidth = currentWidth;
                    updateStyles();
                    updateLiveDisplay();
                };

                // Mouse up handler
                const onMouseUp = () => {
                    if (!isResizing) return;
                    isResizing = false;
                    resizeDirection = null;
                    document.body.style.cursor = '';
                    document.body.style.userSelect = '';
                };

                // Create handles and attach events directly
                handlePositions.forEach(pos => {
                    const handle = document.createElement('div');
                    handle.className = `fcw-resize-handle fcw-${pos.includes('corner') ? 'corner' : 'edge'} fcw-${pos}`;
                    handle.dataset.direction = pos;

                    // Attach mousedown directly to handle
                    handle.addEventListener('mousedown', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        isResizing = true;
                        resizeDirection = pos;
                        startX = e.clientX;
                        startY = e.clientY;
                        startHeight = currentHeight;
                        startWidth = currentWidth;
                        document.body.style.cursor = getComputedStyle(handle).cursor;
                        document.body.style.userSelect = 'none';
                    });

                    // Touch support
                    handle.addEventListener('touchstart', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const touch = e.touches[0];
                        isResizing = true;
                        resizeDirection = pos;
                        startX = touch.clientX;
                        startY = touch.clientY;
                        startHeight = currentHeight;
                        startWidth = currentWidth;
                    }, { passive: false });

                    banner.appendChild(handle);
                });

                // Enter resize mode
                overlay.classList.add('active');
                toolbar.classList.add('active');
                banner.classList.add('fcw-resize-mode');

                // Scroll banner into view
                setTimeout(() => {
                    banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);

                // Add document-level mousemove and mouseup for drag tracking
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
                document.addEventListener('touchmove', (e) => {
                    if (!isResizing) return;
                    const touch = e.touches[0];
                    onMouseMove({ clientX: touch.clientX, clientY: touch.clientY, preventDefault: () => e.preventDefault() });
                }, { passive: false });
                document.addEventListener('touchend', onMouseUp);

                // Exit resize mode function
                const exitResizeMode = (save = true) => {
                    // Remove event listeners
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);

                    // Remove handles
                    banner.querySelectorAll('.fcw-resize-handle').forEach(h => h.remove());

                    // Exit mode
                    overlay.classList.remove('active');
                    toolbar.classList.remove('active');
                    banner.classList.remove('fcw-resize-mode');

                    // Save settings
                    if (save) {
                        saveSetting('bannerHeight', currentHeight);
                        saveSetting('bannerWidth', currentWidth);
                    }

                    // Update size info in settings panel
                    // Update size info in settings panel
                    const sizeInfo = document.getElementById('fcw-size-display-main');
                    if (sizeInfo) {
                        sizeInfo.innerHTML = `${currentHeight}px × ${currentWidth}%`;
                    }
                };

                // Toolbar button handlers
                toolbar.querySelector('.fcw-done-btn').onclick = () => exitResizeMode(true);
                toolbar.querySelector('.fcw-reset-btn').onclick = () => {
                    currentHeight = 400;
                    currentWidth = 95;
                    settings.bannerHeight = currentHeight;
                    settings.bannerWidth = currentWidth;
                    updateStyles();
                    updateLiveDisplay();
                };

                // Click overlay to exit
                overlay.onclick = () => exitResizeMode(true);

                // ESC key to exit
                const escHandler = (e) => {
                    if (e.key === 'Escape') {
                        exitResizeMode(true);
                        document.removeEventListener('keydown', escHandler);
                    }
                };
                document.addEventListener('keydown', escHandler);
            });

            document.getElementById('fcw-hide-banner').addEventListener('change', (e) => {
                saveSetting('hideBanner', e.target.checked);
            });

            // Handle country flag selection
            document.getElementById('fcw-flag-select').addEventListener('change', (e) => {
                const code = e.target.value;
                saveSetting('countryFlag', code || null);

                // Update preview
                const preview = document.getElementById('fcw-flag-preview');
                if (code) {
                    const country = COUNTRIES.find(c => c.code === code);
                    preview.innerHTML = `
                        <img src="https://flagcdn.com/${code.toLowerCase()}.svg" alt="${code}">
                        <span>${country ? country.name : code}</span>
                    `;
                } else {
                    preview.innerHTML = '<span>No flag selected</span>';
                }

                // Update display
                displayCountryFlag();
            });

            // Handle clear flag button
            document.getElementById('fcw-clear-flag').addEventListener('click', () => {
                saveSetting('countryFlag', null);
                document.getElementById('fcw-flag-select').value = '';
                document.getElementById('fcw-flag-preview').innerHTML = '<span>No flag selected</span>';
                displayCountryFlag();
            });

            // Handle banner image upload - supports large GIFs via IndexedDB + Static Preview
            document.getElementById('fcw-banner-upload').addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;

                console.log('[FCW Modernizer] Banner file selected:', file.name, 'Size:', (file.size / 1024 / 1024).toFixed(2) + 'MB', 'Type:', file.type);

                // Limit: 50MB
                if (file.size > 50 * 1024 * 1024) {
                    alert('Image too large (Max 50MB).');
                    return;
                }

                // Create immediate preview using blob URL
                const blobUrl = URL.createObjectURL(file);
                settings.bannerUrl = blobUrl;
                updateStyles();
                console.log('[FCW Modernizer] Banner preview set via blob URL');

                // 1. Generate Static Preview (for instant loading & first frame of GIF)
                // We save this synchronously to localStorage so it's available immediately on next load
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    // Limit preview size for localStorage hygiene
                    const MAX_WIDTH = 600;
                    let width = img.width;
                    let height = img.height;

                    if (width > MAX_WIDTH) {
                        height = Math.round(height * (MAX_WIDTH / width));
                        width = MAX_WIDTH;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Save as optimized JPEG
                    const previewDataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    try {
                        localStorage.setItem(`fcw_banner_preview_${activeClubId}`, previewDataUrl);
                        console.log('[FCW Modernizer] Static banner preview saved to localStorage');
                    } catch (e) {
                        console.warn('[FCW Modernizer] Failed to save banner preview (localStorage full?)', e);
                    }
                };
                img.src = blobUrl;

                // 2. Determine storage strategy for the Full Image
                const bannerDbKey = `banner_${activeClubId}`;

                if (file.size < 2 * 1024 * 1024) {
                    // Small file: Store as base64 in localStorage
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                        try {
                            saveSetting('bannerUrl', evt.target.result);
                            saveSetting('bannerStorageMode', 'local');
                            // Cleanup IndexedDB entry if exists
                            fcwDB.delete(bannerDbKey).catch(() => { });
                            console.log('[FCW Modernizer] Small banner saved to localStorage');
                        } catch (err) {
                            console.warn('[FCW Modernizer] localStorage full, falling back to IndexedDB...', err);
                            saveBannerToDB(file, bannerDbKey);
                        }
                    };
                    reader.readAsDataURL(file);
                } else {
                    // Large file (GIFs etc.): Store blob in IndexedDB
                    console.log('[FCW Modernizer] Large banner - saving to IndexedDB...');
                    saveBannerToDB(file, bannerDbKey);
                }
            });

            function saveBannerToDB(blobData, dbKey) {
                fcwDB.put(dbKey, blobData).then(() => {
                    // Update storage mode without triggering updateStyles
                    storageData.clubs[activeClubId] = storageData.clubs[activeClubId] || {};
                    storageData.clubs[activeClubId].bannerStorageMode = 'db';
                    storageData.clubs[activeClubId].bannerUrl = null; // Clear localStorage copy
                    localStorage.setItem('fcw_club_modernizer_data', JSON.stringify(storageData));
                    console.log('[FCW Modernizer] Banner saved to IndexedDB with key:', dbKey);
                    // NOTE: We do NOT call updateStyles() here to preserve the blob URL preview
                }).catch(err => {
                    console.error('[FCW Modernizer] IndexedDB save failed:', err);
                    alert('Note: Banner set but may not persist after page reload (storage error).');
                });
            }

            // Handle background image upload (unchanged - uses existing saveSetting)
            // Handle banner URL input (paste GIF URL directly)
            document.getElementById('fcw-banner-url-apply').addEventListener('click', () => {
                const urlInput = document.getElementById('fcw-banner-url-input');
                const url = urlInput.value.trim();
                if (!url) {
                    alert('Please enter an image URL.');
                    return;
                }

                // Validate URL format
                if (!url.startsWith('http://') && !url.startsWith('https://')) {
                    alert('Please enter a valid URL starting with http:// or https://');
                    return;
                }

                console.log('[FCW Modernizer] Applying banner URL:', url);

                // Store URL directly in localStorage (URLs are small)
                saveSetting('bannerUrl', url);
                saveSetting('bannerStorageMode', 'url'); // New mode for direct URLs

                // 1. Attempt to generate Static Preview for URL (Best Effort)
                const img = new Image();
                img.crossOrigin = "Anonymous"; // Try to load with CORS
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 600;
                    let width = img.width;
                    let height = img.height;
                    if (width > MAX_WIDTH) {
                        height = Math.round(height * (MAX_WIDTH / width));
                        width = MAX_WIDTH;
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    try {
                        const previewDataUrl = canvas.toDataURL('image/jpeg', 0.7);
                        localStorage.setItem(`fcw_banner_preview_${activeClubId}`, previewDataUrl);
                        console.log('[FCW Modernizer] Static banner preview generated from URL');
                    } catch (e) {
                        console.warn('[FCW Modernizer] Failed to save URL preview (CORS or Storage)', e);
                    }
                };
                img.src = url;

                // Clear any IndexedDB entry
                const bannerDbKey = `banner_${activeClubId}`;
                fcwDB.delete(bannerDbKey).catch(() => { });

                // Clear input field
                urlInput.value = '';

                console.log('[FCW Modernizer] Banner URL applied successfully');
            });

            // Also allow Enter key to apply URL
            document.getElementById('fcw-banner-url-input').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    document.getElementById('fcw-banner-url-apply').click();
                }
            });

            document.getElementById('fcw-reset-banner').addEventListener('click', () => {
                const bannerDbKey = `banner_${activeClubId}`;
                // Clear IndexedDB entry
                fcwDB.delete(bannerDbKey).catch(() => { });
                saveSetting('bannerUrl', null);
                saveSetting('bannerStorageMode', 'local');
                console.log('[FCW Modernizer] Banner reset, IndexedDB cleared');
            });
        }

        // --- 7. Boot Logic (Wait for DOM) ---

        function startSequence() {
            const checkAndRun = () => {
                const navBar = document.querySelector('.navbar, nav');
                const userId = getLoggedInUserId(); // Wait for Identity!

                // More robust banner detection: check for exact style OR any large div with background
                // Works even when window is minimized (dimensions would be 0)
                let bannerPlaceholder = document.querySelector('div[style*="height: 348px"], div[style*="height:348px"]');
                if (!bannerPlaceholder) {
                    // Fallback: find any div with background-image style and a height style
                    const possibleBanners = document.querySelectorAll('div[style*="background"]');
                    for (const div of possibleBanners) {
                        const styleHeight = div.style.height;
                        const hasLargeDimensions = div.clientHeight > 300 && div.offsetWidth > 600;
                        const hasBackgroundWithHeight = div.style.backgroundImage && styleHeight.includes('px');
                        if (hasLargeDimensions || hasBackgroundWithHeight) {
                            bannerPlaceholder = div;
                            break;
                        }
                    }
                }
                // Return true only if we have nav AND the banner AND we handled identity
                // (or if we time out which is handled by maxAttempts)
                return navBar && bannerPlaceholder && userId;
            };

            // INSTANT: Try immediately
            if (checkAndRun()) {
                runIdentityCheck();
                return;
            }

            // FAST POLLING: 50ms intervals
            let attempts = 0;
            const maxAttempts = 60; // 3 seconds max

            const interval = setInterval(() => {
                attempts++;
                if (checkAndRun() || attempts > maxAttempts) {
                    clearInterval(interval);
                    runIdentityCheck();
                }
            }, 50); // Faster polling
        }

        function runIdentityCheck() {
            const loggedInId = getLoggedInUserId();
            const currentId = getCurrentPageClubId();

            console.log('FCW Modernizer Debug:', { loggedInId, currentId });

            // --- 8. The Fork ---
            isOwner = false; // Reset to false

            // If viewing /myclub, it implies ownership.
            // We must resolve the numeric ID to save settings correctly.
            if (currentId === 'MYCLUB_PLACEHOLDER') {
                if (loggedInId) {
                    activeClubId = loggedInId; // Use real ID for saving
                    isOwner = true;
                } else {
                    // Fallback if scraping failed but URL says /myclub
                    activeClubId = 'myclub_fallback';
                    isOwner = true;
                }
            } else {
                // Viewing a numeric ID URL
                activeClubId = currentId;
                // Is it me?
                if (loggedInId && currentId && loggedInId === currentId) {
                    isOwner = true;
                }
            }

            // Always run Modernizer (styles apply to everyone)
            // Specific features (like Edit Look button) will check isOwner internally
            initModernizer();
        }

        // Start polling
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', startSequence);
        } else {
            startSequence();
        }
    } // End runModernizer
})();

    // === LNY_SETTINGS.JS ===
const LNY_STYLE = `
/* Force native background by default, overriding extension's global background */
html:not(.fcw-force-ext-bg), body:not(.fcw-force-ext-bg) {
    background-image: var(--lny-bg-gradient), var(--lny-bg-image) !important;
    background-color: var(--lny-bg-color) !important;
}

.lny-settings-overlay {
    position: fixed;
    inset: 0;
    background: rgba(3,2,6,0.86);
    backdrop-filter: blur(8px);
    display: grid;
    place-items: center;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.25s ease;
    z-index: 10000;
    padding: 16px;
    overflow: auto;
}
.lny-settings-overlay.show { opacity: 1; pointer-events: auto; }
.lny-settings-card {
    background: #0f0814;
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 24px;
    padding: 24px;
    width: min(500px, calc(100vw - 36px));
    color: #f5f1ff;
    box-shadow: 0 30px 60px rgba(0,0,0,0.55);
    margin: auto;
}
.lny-settings-card h3 { margin: 0 0 16px; font-size: 1.3rem; }
.lny-settings-section { margin-bottom: 20px; }
.lny-settings-section h4 {
    margin: 0 0 10px; font-size: 0.95rem; color: #fdd37a; letter-spacing: 0.08em; text-transform: uppercase;
}

/* Volume Slider */
.lny-volume-control { display: flex; align-items: center; gap: 12px; }
.lny-volume-slider { flex: 1; height: 6px; -webkit-appearance: none; appearance: none; background: rgba(255, 255, 255, 0.1); border-radius: 3px; outline: none; }
.lny-volume-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #fdd37a; cursor: pointer; box-shadow: 0 0 10px rgba(253, 211, 122, 0.5); }
.lny-volume-display { font-size: 0.9rem; font-weight: 600; min-width: 45px; text-align: right; }

/* Settings Buttons */
.lny-btn-wide {
    width: 100%;
    padding: 14px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 12px;
    color: #fff;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    position: relative;
    overflow: hidden;
}
.lny-btn-wide:hover { background: rgba(255,255,255,0.1); }
.lny-btn-wide::after {
    content: '';
    position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
    background: radial-gradient(circle, rgba(253, 211, 122, 0.15) 0%, transparent 60%);
    opacity: 0; transition: opacity 0.3s;
    pointer-events: none;
}
.lny-btn-wide:hover::after { opacity: 1; }

/* Toggle Switch */
.lny-toggle-row { display: flex; justify-content: space-between; align-items: center; margin-top: 15px; }
.lny-toggle-label { font-size: 0.95rem; }
.lny-toggle {
    position: relative; width: 44px; height: 24px; background: rgba(255,255,255,0.2);
    border-radius: 12px; cursor: pointer; transition: background 0.3s;
}
.lny-toggle.active { background: #fdd37a; }
.lny-toggle::after {
    content: ''; position: absolute; top: 2px; left: 2px; width: 20px; height: 20px;
    background: #fff; border-radius: 50%; transition: left 0.3s; box-shadow: 0 1px 3px rgba(0,0,0,0.3);
}
.lny-toggle.active::after { left: 22px; }

/* Actions */
.lny-settings-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; }
.lny-settings-actions button {
    padding: 10px 20px; border-radius: 999px; font-weight: 600; font-size: 0.85rem; cursor: pointer; text-transform: uppercase; letter-spacing: 0.05em;
}
.lny-settings-save { background: linear-gradient(120deg, #ff5f6d, #ffc371); color: #000; border: none; }


/* --- In-Place Binding Animations --- */

/* Dim the stage wrapper/dashboard when binding */
.lny-stage-binding-mode .lny-dashboard {
    filter: brightness(0.4) saturate(0.5) blur(1px);
    pointer-events: none;
    transition: all 0.3s ease;
}

/* Dim non-active lanes */
.lny-stage-binding-mode .lny-lane:not(.binding-active) {
    filter: brightness(0.3) blur(2px);
    transform: scale(0.95);
    transition: all 0.3s ease;
}

/* Enhance the active lane */
.lny-stage-binding-mode .lny-lane.binding-active {
    box-shadow: 0 0 30px rgba(253, 211, 122, 0.4), inset 0 0 20px rgba(253, 211, 122, 0.2);
    border-color: #fdd37a;
    transform: scale(1.08) translateY(-10px);
    z-index: 10;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    animation: bindingPulse 2s infinite ease-in-out;
}

/* Make the label glow on the active lane */
.lny-stage-binding-mode .lny-lane.binding-active .lane-label {
    color: #fdd37a;
    text-shadow: 0 0 15px rgba(253, 211, 122, 0.8), 0 0 30px rgba(253, 211, 122, 0.4);
    font-size: 1.5rem;
    font-weight: 700;
    bottom: 5px; /* Lowered a smidge */
    transition: all 0.3s ease;
    /* Removed pulsing as requested */
    transform: translateX(-50%) scale(1.1);
}

@keyframes bindingPulse {
    0% { box-shadow: 0 0 20px rgba(253, 211, 122, 0.3), inset 0 0 10px rgba(253, 211, 122, 0.1); }
    50% { box-shadow: 0 0 40px rgba(253, 211, 122, 0.6), inset 0 0 25px rgba(253, 211, 122, 0.3); }
    100% { box-shadow: 0 0 20px rgba(253, 211, 122, 0.3), inset 0 0 10px rgba(253, 211, 122, 0.1); }
}

/* --- PS5 Controller Overlay --- */
.lny-controller-overlay {
    position: absolute;
    right: -320px;
    top: 65%;
    transform: translateY(-50%) translateX(20px);
    width: 280px;
    opacity: 0;
    pointer-events: none;
    transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    z-index: 100;
}
.lny-controller-overlay.active {
    opacity: 1;
    transform: translateY(-50%) translateX(0);
}
.lny-controller-container {
    background: rgba(10, 5, 20, 0.6);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    padding: 20px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.5), inset 0 0 20px rgba(255,255,255,0.02);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
}
.ps5-svg {
    width: 100%;
    height: auto;
    filter: drop-shadow(0 10px 10px rgba(0,0,0,0.5));
}
.ps5-btn {
    fill: rgba(255,255,255,0.1);
    stroke: rgba(255,255,255,0.3);
    transition: all 0.1s;
}
.ps5-btn.pressed {
    fill: #fdd37a !important;
    stroke: #fff !important;
    filter: drop-shadow(0 0 10px #fdd37a);
    transform-origin: center;
    transform: scale(0.95);
}
.ps5-btn.stick.pressed {
    fill: rgba(253, 211, 122, 0.4) !important;
}
.lny-controller-status {
    color: #fdd37a;
    font-size: 0.85rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    text-shadow: 0 0 10px rgba(253, 211, 122, 0.4);
}

/* Success flash on bind */

@keyframes laneBindSuccess {
    0% { background: rgba(126, 249, 167, 0.5); transform: scale(1.12); border-color: #7ef9a7; }
    100% { background: rgba(255,255,255,0.02); transform: scale(1); }
}

/* Feedback text styling during custom binds */
.lny-feedback.binding-feedback {
    color: #fdd37a;
    font-size: 1.15rem;
    font-family: "SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    letter-spacing: 0.02em;
    font-weight: 500;
    text-shadow: 0 0 10px rgba(253, 211, 122, 0.3);
    margin-top: 25px; /* Pushed down a bit more */
    animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
}

/* --- Rhythm Feedback Animations --- */
.lane-label {
    position: absolute;
    bottom: 2px !important;
    left: 50%;
    transform: translateX(-50%);
    pointer-events: none;
    z-index: 5;
    transition: all 0.2s;
}

.lny-hit-zone {
    transition: all 0.1s ease;
}
.hit-perfect .lny-hit-zone {
    animation: hitPerfect 0.4s ease-out;
}
.hit-great .lny-hit-zone {
    animation: hitGreat 0.4s ease-out;
}
.hit-good .lny-hit-zone {
    animation: hitGood 0.4s ease-out;
}
.hit-miss .lny-hit-zone {
    animation: hitMiss 0.4s ease-out;
}

@keyframes hitPerfect {
    0% { box-shadow: 0 0 40px #00ffff, inset 0 0 20px #fdd37a; border-color: #00ffff; transform: scale(1.15); background: rgba(0, 255, 255, 0.2); }
    100% { box-shadow: 0 0 0 transparent, inset 0 0 0 transparent; border-color: rgba(255,255,255,0.1); transform: scale(1); background: transparent; }
}
@keyframes hitGreat {
    0% { box-shadow: 0 0 30px #7ef9a7, inset 0 0 15px #7ef9a7; border-color: #7ef9a7; transform: scale(1.1); background: rgba(126, 249, 167, 0.15); }
    100% { box-shadow: 0 0 0 transparent, inset 0 0 0 transparent; border-color: rgba(255,255,255,0.1); transform: scale(1); background: transparent; }
}
@keyframes hitGood {
    0% { box-shadow: 0 0 20px #fdd37a, inset 0 0 10px #fdd37a; border-color: #fdd37a; transform: scale(1.05); background: rgba(253, 211, 122, 0.1); }
    100% { box-shadow: 0 0 0 transparent, inset 0 0 0 transparent; border-color: rgba(255,255,255,0.1); transform: scale(1); background: transparent; }
}
@keyframes hitMiss {
    0% { box-shadow: 0 0 20px #ff4e50, inset 0 0 10px #ff4e50; border-color: #ff4e50; transform: scale(0.95); background: rgba(255, 78, 80, 0.15); }
    100% { box-shadow: 0 0 0 transparent, inset 0 0 0 transparent; border-color: rgba(255,255,255,0.1); transform: scale(1); background: transparent; }
}

`;

function initLNYSettings() {
    if (!window.location.href.includes('/pack-simulator/26/lny/')) return;

    if (document.getElementById('lny-settings-overlay')) return; // Already initialized

    // Inject styling
    const style = document.createElement('style');
    style.textContent = LNY_STYLE;
    document.head.appendChild(style);

    // Initial Background Check
    const useExtBg = localStorage.getItem('lny_use_ext_bg') === 'true';
    if (useExtBg) {
        document.documentElement.classList.add('fcw-force-ext-bg');
        document.body.classList.add('fcw-force-ext-bg');
    }

    // Create Settings Modal HTML
    const overlay = document.createElement('div');
    overlay.className = 'lny-settings-overlay';
    overlay.id = 'lny-settings-overlay';
    overlay.innerHTML = `
        <div class="lny-settings-card">
            <h3>Settings</h3>
            <div class="lny-settings-section">
                <h4>Display</h4>
                <div class="lny-toggle-row">
                    <span class="lny-toggle-label">Use Extension Background</span>
                    <div class="lny-toggle" id="lny-bg-toggle"></div>
                </div>
            </div>
            <div class="lny-settings-section">
                <h4>Audio</h4>
                <div class="lny-volume-control">
                    <span>Music</span>
                    <input type="range" id="lny-volume-slider" class="lny-volume-slider" min="0" max="1" step="0.01" value="0.5">
                    <span id="lny-volume-display" class="lny-volume-display">50%</span>
                </div>
            </div>
            <div class="lny-settings-section">
                <h4>Controls</h4>
                <button type="button" class="lny-btn-wide" id="lny-start-binding">Change Custom Keybindings</button>
            </div>
            <div class="lny-settings-actions">
                <button type="button" class="lny-secondary-btn" id="lny-close-settings">Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    // Create PS5 Controller Map HTML
    const controllerMap = document.createElement('div');
    controllerMap.className = 'lny-controller-overlay';
    controllerMap.id = 'lny-controller-overlay';
    controllerMap.innerHTML = `
        <div class="lny-controller-container">
            <svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg" class="ps5-svg">
                <!-- Outer Body Shell -->
                <path d="M120 180 C80 180 30 250 50 380 C60 440 90 480 120 480 C150 480 170 430 190 380 C210 330 250 300 400 300 C550 300 590 330 610 380 C630 430 650 480 680 480 C710 480 740 440 750 380 C770 250 720 180 680 180 C640 180 500 150 400 150 C300 150 160 180 120 180 Z" 
                      fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.2)" stroke-width="3"/>
                
                <!-- Center Touchpad -->
                <rect x="280" y="160" width="240" height="130" rx="15" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>
                
                <!-- D-Pad Base -->
                <circle cx="180" cy="240" r="45" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
                
                <!-- D-Pad Buttons -->
                <path id="btn-dpad-up" class="ps5-btn" d="M170 205 L190 205 L190 170 L170 170 Z"/>
                <path id="btn-dpad-right" class="ps5-btn" d="M215 230 L250 230 L250 250 L215 250 Z"/>
                <path id="btn-dpad-down" class="ps5-btn" d="M170 275 L190 275 L190 310 L170 310 Z"/>
                <path id="btn-dpad-left" class="ps5-btn" d="M150 230 L115 230 L115 250 L150 250 Z"/>

                <!-- Action Buttons Base -->
                <circle cx="620" cy="240" r="45" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
                
                <!-- Action Buttons -->
                <!-- Triangle (Top) -->
                <polygon id="btn-action-top" class="ps5-btn" points="620,195 632,215 608,215"/>
                <!-- Circle (Right) -->
                <circle id="btn-action-right" class="ps5-btn" cx="665" cy="240" r="12" fill="none" stroke-width="3"/>
                <!-- Cross (Bottom) -->
                <path id="btn-action-bottom" class="ps5-btn" d="M612 277 L628 293 M628 277 L612 293" stroke-width="3.5" stroke-linecap="round"/>
                <!-- Square (Left) -->
                <rect id="btn-action-left" class="ps5-btn" x="563" y="228" width="24" height="24" rx="4" fill="none" stroke-width="3"/>
                
                <!-- Analog Sticks -->
                <circle id="btn-stick-left" class="ps5-btn stick" cx="280" cy="330" r="35"/>
                <circle id="btn-stick-right" class="ps5-btn stick" cx="520" cy="330" r="35"/>
                <circle cx="280" cy="330" r="15" fill="rgba(0,0,0,0.5)"/>
                <circle cx="520" cy="330" r="15" fill="rgba(0,0,0,0.5)"/>

                <!-- Bumpers & Triggers -->
                <path id="btn-bumper-l" class="ps5-btn" d="M130 160 C150 140 220 140 240 160 L240 145 C200 130 150 130 130 145 Z"/>
                <path id="btn-bumper-r" class="ps5-btn" d="M670 160 C650 140 580 140 560 160 L560 145 C600 130 650 130 670 145 Z"/>
                
                <!-- Triggers (L2 / R2) -->
                <path id="btn-trigger-l" class="ps5-btn" d="M140 140 C160 110 210 110 230 140 L230 120 C200 90 170 90 140 120 Z"/>
                <path id="btn-trigger-r" class="ps5-btn" d="M660 140 C640 110 590 110 570 140 L570 120 C600 90 630 90 660 120 Z"/>
            </svg>
            <div class="lny-controller-status" id="lny-controller-status">Gamepad Connected</div>
        </div>
    `;

    // Inject map into the game container area specifically
    const stageContainer = document.querySelector('.lny-container') || document.body;
    stageContainer.appendChild(controllerMap);

    // Add Settings Button next to How to Play button
    const musicBtnRow = document.querySelector('.lny-audio-row');
    if (musicBtnRow) {
        const settingsBtn = document.createElement('button');
        settingsBtn.id = 'lny-settings-btn';
        settingsBtn.className = 'lny-help-btn';
        settingsBtn.type = 'button';
        settingsBtn.textContent = 'Settings';
        settingsBtn.style.marginLeft = '10px';
        musicBtnRow.appendChild(settingsBtn);

        settingsBtn.addEventListener('click', () => {
            overlay.classList.add('show');
        });
    }

    // Modal close
    const closeBtn = document.getElementById('lny-close-settings');
    if (closeBtn) closeBtn.addEventListener('click', () => {
        overlay.classList.remove('show');
    });

    // --- Background Toggle Logic ---
    const bgToggle = document.getElementById('lny-bg-toggle');
    if (bgToggle) {
        if (useExtBg) bgToggle.classList.add('active');

        bgToggle.addEventListener('click', () => {
            const isActive = bgToggle.classList.toggle('active');
            localStorage.setItem('lny_use_ext_bg', isActive);
            if (isActive) {
                document.documentElement.classList.add('fcw-force-ext-bg');
                document.body.classList.add('fcw-force-ext-bg');
            } else {
                document.documentElement.classList.remove('fcw-force-ext-bg');
                document.body.classList.remove('fcw-force-ext-bg');
            }
        });
    }

    // --- Volume Logic ---
    const volumeSlider = document.getElementById('lny-volume-slider');
    const volumeDisplay = document.getElementById('lny-volume-display');
    const musicEl = document.getElementById('lny-music'); // The site's audio element

    const savedVolume = localStorage.getItem('lny_volume');
    if (savedVolume !== null && volumeSlider && volumeDisplay) {
        const v = parseFloat(savedVolume);
        volumeSlider.value = v;
        volumeDisplay.textContent = Math.round(v * 100) + '%';
        if (musicEl) musicEl.volume = v;
    }

    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            volumeDisplay.textContent = Math.round(val * 100) + '%';
            if (musicEl) {
                musicEl.volume = val;
                if (musicEl.muted && val > 0) {
                    musicEl.muted = false;
                    const mBtn = document.getElementById('lny-music-btn');
                    if (mBtn) mBtn.classList.remove('muted');
                }
            }
            localStorage.setItem('lny_volume', val);
        });
    }

    // --- Keybind Animation Sequence Logic ---
    let savedKeys = { left: 'a', down: 's', up: 'w', right: 'd' };
    try {
        const loaded = localStorage.getItem('lny_custom_keys');
        if (loaded) Object.assign(savedKeys, JSON.parse(loaded));
    } catch (e) { }

    const BIND_SEQUENCE = ['left', 'down', 'up', 'right'];
    let currentBindIndex = -1;
    let pendingKeys = {};
    let isBinding = false;

    const gameStage = document.querySelector('.lny-stage');
    const feedbackEl = document.getElementById('lny-feedback');
    let originalFeedback = 'Press Start to summon the beat.';

    const startBindingBtn = document.getElementById('lny-start-binding');

    function getLaneElement(laneDir) {
        return document.querySelector(`.lny-lane[data-lane="${laneDir}"]`);
    }

    function formatKey(keyStr) {
        if (!keyStr) return 'N/A';
        let display = keyStr;

        // Handle Gamepad Custom Binds
        if (display.toLowerCase().startsWith('gamepad')) {
            const btnIndex = display.toLowerCase().replace('gamepad', '');

            // Return rich HTML for PS5 face buttons with their authentic colors
            const gamepadMap = {
                '0': '<span style="color: #7994cd; font-size: 1.2em;">✕</span>', // Cross (Blue)
                '1': '<span style="color: #df5b5e; font-size: 1.2em;">○</span>', // Circle (Red)
                '2': '<span style="color: #d591b6; font-size: 1.2em;">□</span>', // Square (Pink)
                '3': '<span style="color: #51a673; font-size: 1.2em;">△</span>', // Triangle (Green)
                '4': 'L1',
                '5': 'R1',
                '6': 'L2',
                '7': 'R2',
                '12': 'D-UP',
                '13': 'D-DOWN',
                '14': 'D-LEFT',
                '15': 'D-RIGHT'
            };
            return gamepadMap[btnIndex] || ('BTN ' + btnIndex);
        }

        if (display.toLowerCase().startsWith('arrow')) {
            display = display.replace(/arrow/i, '').toUpperCase();
        } else {
            display = display.toUpperCase();
        }
        if (display === ' ') display = 'SPACE';
        return display;
    }

    function startBindingSequence() {
        if (!gameStage || !feedbackEl) return;

        isBinding = true;
        overlay.classList.remove('show');          // Close settings

        // Setup Stage UI
        gameStage.classList.add('lny-stage-binding-mode');
        originalFeedback = feedbackEl.textContent;
        feedbackEl.classList.add('binding-feedback');

        // Start sequence
        pendingKeys = {};
        currentBindIndex = 0;

        // Optional: Scroll to the game board so user sees it clearly
        gameStage.scrollIntoView({ behavior: 'smooth', block: 'center' });

        updateBindPrompt();
    }

    function updateBindPrompt() {
        // Clear previous highlights
        document.querySelectorAll('.lny-lane').forEach(el => el.classList.remove('binding-active'));

        if (currentBindIndex >= BIND_SEQUENCE.length) {
            finishBindingSequence();
            return;
        }

        const lane = BIND_SEQUENCE[currentBindIndex];
        const targetEl = getLaneElement(lane);

        if (targetEl) {
            targetEl.classList.add('binding-active');

            // Set label to ? to prompt user
            const labelEl = targetEl.querySelector('.lane-label');
            if (labelEl) labelEl.textContent = '?';

            // Update Text Feedback
            feedbackEl.innerHTML = `Press a key for <strong style="color: #fff;">${lane.toUpperCase()}</strong> (ESC to cancel)`;
        } else {
            // Failsafe
            finishBindingSequence();
        }
    }

    function finishBindingSequence() {
        if (!isBinding) return;
        isBinding = false;
        currentBindIndex = -1;

        // Restore Stage UI
        gameStage.classList.remove('lny-stage-binding-mode');
        document.querySelectorAll('.lny-lane').forEach(el => el.classList.remove('binding-active'));

        if (feedbackEl) {
            feedbackEl.classList.remove('binding-feedback');
            feedbackEl.textContent = originalFeedback;
        }

        // Save new keys immediately if we captured something
        if (Object.keys(pendingKeys).length === 4) {
            Object.assign(savedKeys, pendingKeys);
            localStorage.setItem('lny_custom_keys', JSON.stringify(savedKeys));

            // Switch to custom profile automatically if needed
            const profileSelect = document.getElementById('lny-input-profile');
            if (profileSelect && !profileSelect.querySelector('option[value="custom"]')) {
                const opt = document.createElement('option');
                opt.value = 'custom';
                opt.textContent = 'Custom';
                profileSelect.appendChild(opt);
            }
            if (profileSelect) profileSelect.value = 'custom';
        }

        applyCustomLabelsToBoard();
    }

    if (startBindingBtn) {
        startBindingBtn.addEventListener('click', startBindingSequence);
    }

    // Global Keydown for capturing bindings
    window.addEventListener('keydown', (e) => {
        if (!isBinding) return;

        e.preventDefault();
        e.stopImmediatePropagation();

        const key = e.key.toLowerCase();

        if (key === 'escape') {
            // Cancel sequence entirely without saving
            pendingKeys = {}; // Clear pending
            finishBindingSequence();
            return;
        }

        const currentLane = BIND_SEQUENCE[currentBindIndex];
        const targetEl = getLaneElement(currentLane);

        // Remove this key if it was bound to a previous lane in this iteration
        // (to prevent duplicates within the active sequence)
        for (let l in pendingKeys) {
            if (pendingKeys[l] === key) pendingKeys[l] = null;
        }

        pendingKeys[currentLane] = key;

        // Flash success
        if (targetEl) {
            targetEl.classList.remove('binding-active');

            // Trigger animation restart trick
            targetEl.classList.remove('binding-success');
            void targetEl.offsetWidth;
            targetEl.classList.add('binding-success');

            // Set label instantly
            const labelEl = targetEl.querySelector('.lane-label');
            if (labelEl) labelEl.innerHTML = formatKey(key);
        }

        currentBindIndex++;

        // Slight delay so they can see the flash before next lane highlights
        setTimeout(updateBindPrompt, 250);

    }, true);


    // --- Label updating function ---
    function applyCustomLabelsToBoard() {
        const sel = document.getElementById('lny-input-profile');
        if (!sel) return;
        const isCustom = sel.value === 'custom';

        const lanes = document.querySelectorAll('.lny-lane');
        lanes.forEach(laneDiv => {
            const laneName = laneDiv.getAttribute('data-lane');
            const labelEl = laneDiv.querySelector('.lane-label');
            if (!labelEl) return;

            if (isCustom) {
                labelEl.innerHTML = formatKey(savedKeys[laneName]);
            } else {
                const isWasd = sel.value === 'wasd';
                if (isWasd && labelEl.dataset.wasd) {
                    labelEl.textContent = labelEl.dataset.wasd;
                } else if (!isWasd && labelEl.dataset.arrow) {
                    labelEl.textContent = labelEl.dataset.arrow.replace('arrow', '').toUpperCase() || labelEl.dataset.arrow;
                }
            }
        });
    }

    // Inject Custom option on load if we have custom keys saved
    const profileSelect = document.getElementById('lny-input-profile');
    if (localStorage.getItem('lny_custom_keys') && profileSelect) {
        if (!profileSelect.querySelector('option[value="custom"]')) {
            const opt = document.createElement('option');
            opt.value = 'custom';
            opt.textContent = 'Custom';
            profileSelect.appendChild(opt);
            profileSelect.value = 'custom';
        }
    }

    if (profileSelect) {
        profileSelect.addEventListener('change', applyCustomLabelsToBoard);
    }

    // Defer the label application a tiny bit to ensure the main site script has applied its DOM modifications.
    setTimeout(applyCustomLabelsToBoard, 100);

    // --- Synthetic Gameplay Engine Override ---
    window.addEventListener('keydown', (e) => {
        // Prevent loops, ignore if sequence capturing is open, ignore if settings modal open
        if (e._isSynthetic || isBinding || overlay.classList.contains('show')) return;

        const sel = document.getElementById('lny-input-profile');
        if (sel && sel.value !== 'custom') return; // Only process if profile is custom

        const key = e.key.toLowerCase();
        let targetLane = null;
        for (const [lane, bKey] of Object.entries(savedKeys)) {
            if (bKey === key) {
                targetLane = lane;
                break;
            }
        }

        if (targetLane) {
            e.stopImmediatePropagation();
            e.preventDefault();

            // Map the custom key to the expected ARROW keys defined in gamemode
            const arrowMap = {
                'left': 'ArrowLeft',
                'down': 'ArrowDown',
                'up': 'ArrowUp',
                'right': 'ArrowRight'
            };
            const fKey = arrowMap[targetLane];

            // Dispatch a native-looking Event that the IIFE will process
            const fakeEvent = new KeyboardEvent('keydown', {
                key: fKey,
                code: fKey,
                bubbles: true,
                cancelable: true
            });
            fakeEvent._isSynthetic = true;
            document.dispatchEvent(fakeEvent); // game script listens on document

            lastPressedLane = targetLane; // Track for Rhythm Feedback
        }
    }, true);


    // --- Rhythm Feedback Observer ---
    let lastPressedLane = null;

    // We also need to track native inputs (WASD / Arrows) for the glow effect if they aren't using "Custom"
    window.addEventListener('keydown', (e) => {
        if (isBinding || overlay.classList.contains('show')) return;
        const key = e.key.toLowerCase();

        if (key === 'a' || key === 'arrowleft') lastPressedLane = 'left';
        else if (key === 's' || key === 'arrowdown') lastPressedLane = 'down';
        else if (key === 'w' || key === 'arrowup') lastPressedLane = 'up';
        else if (key === 'd' || key === 'arrowright') lastPressedLane = 'right';
    }, true);

    const feedbackNode = document.getElementById('lny-feedback');
    if (feedbackNode) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'characterData' || mutation.type === 'childList') {
                    const text = feedbackNode.textContent.trim().toUpperCase();
                    if (!text || !lastPressedLane) return;

                    let hitClass = null;
                    if (text.includes('PERFECT')) hitClass = 'hit-perfect';
                    else if (text.includes('GREAT')) hitClass = 'hit-great';
                    else if (text.includes('GOOD') || text.includes('OK')) hitClass = 'hit-good';
                    else if (text.includes('MISS')) hitClass = 'hit-miss';

                    if (hitClass && lastPressedLane) {
                        const laneEl = getLaneElement(lastPressedLane);
                        if (laneEl) {
                            // Restart animation trick
                            laneEl.classList.remove('hit-perfect', 'hit-great', 'hit-good', 'hit-miss');
                            void laneEl.offsetWidth;
                            laneEl.classList.add(hitClass);
                        }
                    }
                }
            });
        });

        observer.observe(feedbackNode, { childList: true, characterData: true, subtree: true });
    }

    // --- Gamepad / PS5 Controller Engine ---
    let activeGamepadIndex = null;
    const controllerOverlay = document.getElementById('lny-controller-overlay');
    const statusText = document.getElementById('lny-controller-status');

    // Map of standard Gamepad API button indices to our SVG IDs
    const gamepadButtonMap = {
        0: 'btn-action-bottom', // Cross/A
        1: 'btn-action-right',  // Circle/B
        2: 'btn-action-left',   // Square/X
        3: 'btn-action-top',    // Triangle/Y
        4: 'btn-bumper-l',      // L1
        5: 'btn-bumper-r',      // R1
        6: 'btn-trigger-l',     // L2
        7: 'btn-trigger-r',     // R2
        12: 'btn-dpad-up',      // D-Pad Up
        13: 'btn-dpad-down',    // D-Pad Down
        14: 'btn-dpad-left',    // D-Pad Left
        15: 'btn-dpad-right'    // D-Pad Right
    };

    // Keep track of previously pressed buttons to fire events only once per press
    let previousButtonStates = {};

    function updateGamepadStatus() {
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        let found = false;

        for (let i = 0; i < gamepads.length; i++) {
            const gp = gamepads[i];
            if (gp && gp.connected) {
                activeGamepadIndex = gp.index;
                found = true;
                if (controllerOverlay && !controllerOverlay.classList.contains('active')) {
                    controllerOverlay.classList.add('active');
                    if (statusText) statusText.textContent = 'Controller Ready';
                }
                break;
            }
        }

        if (!found) {
            activeGamepadIndex = null;
            if (controllerOverlay) controllerOverlay.classList.remove('active');
        }
    }

    window.addEventListener("gamepadconnected", updateGamepadStatus);
    window.addEventListener("gamepaddisconnected", updateGamepadStatus);

    function triggerSyntheticKey(keyStr) {
        if (!keyStr) return;
        const fakeEvent = new KeyboardEvent('keydown', {
            key: keyStr,
            code: keyStr,
            bubbles: true,
            cancelable: true
        });
        fakeEvent._isSynthetic = true;
        document.dispatchEvent(fakeEvent);

        // Update Rhythm Feedback lane instantly based on the native Arrow we just fired
        if (keyStr === 'ArrowLeft') lastPressedLane = 'left';
        else if (keyStr === 'ArrowDown') lastPressedLane = 'down';
        else if (keyStr === 'ArrowUp') lastPressedLane = 'up';
        else if (keyStr === 'ArrowRight') lastPressedLane = 'right';
    }

    function pollGamepad() {
        if (activeGamepadIndex === null) {
            updateGamepadStatus();
        }

        if (activeGamepadIndex !== null) {
            const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
            const gp = gamepads[activeGamepadIndex];

            if (gp) {
                // Check all mapped buttons
                for (const [btnIndexStr, svgId] of Object.entries(gamepadButtonMap)) {
                    const btnIndex = parseInt(btnIndexStr);
                    const button = gp.buttons[btnIndex];
                    const isPressed = button && (button.pressed || button.value > 0);
                    const wasPressed = previousButtonStates[btnIndex];

                    // Update SVG styling
                    if (svgId) {
                        const svgEl = document.getElementById(svgId);
                        if (svgEl) {
                            if (isPressed) svgEl.classList.add('pressed');
                            else svgEl.classList.remove('pressed');
                        }
                    }

                    // Handle edge triggers
                    if (isPressed && !wasPressed) {
                        const prefix = 'Gamepad' + btnIndex;

                        if (isBinding) {
                            // Forward to the binding sequence logic
                            const fakeBindEvent = new KeyboardEvent('keydown', { key: prefix, bubbles: true });
                            fakeBindEvent._isGamepad = true;
                            window.dispatchEvent(fakeBindEvent);
                        } else {
                            // Forward to gameplay engine
                            const sel = document.getElementById('lny-input-profile');
                            if (sel && sel.value === 'custom') {
                                let mappedArrow = null;
                                for (const [lane, boundKey] of Object.entries(savedKeys)) {
                                    if (boundKey.toLowerCase() === prefix.toLowerCase()) {
                                        const arrowMap = { 'left': 'ArrowLeft', 'down': 'ArrowDown', 'up': 'ArrowUp', 'right': 'ArrowRight' };
                                        mappedArrow = arrowMap[lane];
                                        break;
                                    }
                                }
                                if (mappedArrow) {
                                    triggerSyntheticKey(mappedArrow);
                                }
                            }
                        }
                    }

                    previousButtonStates[btnIndex] = isPressed;
                }

                // Stick logic purely for visual map
                const lx = gp.axes[0] || 0;
                const ly = gp.axes[1] || 0;
                const rx = gp.axes[2] || 0;
                const ry = gp.axes[3] || 0;

                const leftStick = document.getElementById('btn-stick-left');
                if (leftStick) {
                    if (Math.abs(lx) > 0.1 || Math.abs(ly) > 0.1) {
                        leftStick.classList.add('pressed');
                        leftStick.setAttribute('cx', 280 + parseInt(lx * 10));
                        leftStick.setAttribute('cy', 330 + parseInt(ly * 10));
                    } else {
                        leftStick.classList.remove('pressed');
                        leftStick.setAttribute('cx', 280);
                        leftStick.setAttribute('cy', 330);
                    }
                }

                const rightStick = document.getElementById('btn-stick-right');
                if (rightStick) {
                    if (Math.abs(rx) > 0.1 || Math.abs(ry) > 0.1) {
                        rightStick.classList.add('pressed');
                        rightStick.setAttribute('cx', 520 + parseInt(rx * 10));
                        rightStick.setAttribute('cy', 330 + parseInt(ry * 10));
                    } else {
                        rightStick.classList.remove('pressed');
                        rightStick.setAttribute('cx', 520);
                        rightStick.setAttribute('cy', 330);
                    }
                }
            }
        }

        requestAnimationFrame(pollGamepad);
    }

    // Auto-detect if one is already plugged in during page load
    updateGamepadStatus();
    // Start loop
    requestAnimationFrame(pollGamepad);

}
// Ensure the page has fully parsed the DOM before injecting
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLNYSettings);
} else {
    initLNYSettings();
}


    // === OBJECTIVES_HUB.JS ===
(function () {
    'use strict';

    function initObjectivesHub() {
        // 1. Remove the PackStats right column to free up space
        const packStatsObj = document.querySelector('.packStats');
        if (packStatsObj) {
            packStatsObj.remove();
        }

        // 2. Expand the main wrapper to 100% width
        const outerBlock = document.getElementById('outerblock');
        if (outerBlock) {
            outerBlock.classList.remove('col-lg-9');
            outerBlock.classList.add('col-lg-12');
        }

        // 3. Inject the Premium Glassmorphism UI
        const css = `
            /* Deep immersive background wrapper for the entire page */
            body.objectives-page {
                background: radial-gradient(circle at 50% 10%, #0d111a 0%, #020408 100%) !important;
                background-attachment: fixed !important;
            }

            /* Container Spacing */
            #outerblock {
                padding: 40px !important;
                display: flex;
                flex-direction: column;
                gap: 25px;
                animation: fcw-fade-in-up 0.6s ease-out forwards;
            }

            /* Modernize the Objective Cards themselves (assuming they are children of outerblock or inside rows) */
            #outerblock > div, #outerblock .row > div {
                background: rgba(20, 25, 35, 0.45) !important;
                backdrop-filter: blur(25px) saturate(180%);
                -webkit-backdrop-filter: blur(25px) saturate(180%);
                border: 1px solid rgba(255, 255, 255, 0.08) !important;
                border-top: 1px solid rgba(255, 255, 255, 0.15) !important;
                border-radius: 20px !important;
                padding: 25px 35px !important;
                box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4), inset 0 0 20px rgba(0,255,255,0.02) !important;
                transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) !important;
                color: #f0f0f5 !important;
                display: flex;
                align-items: center;
                overflow: hidden;
                position: relative;
            }

            /* Premium Hover Effect */
            #outerblock > div:hover, #outerblock .row > div:hover {
                transform: translateY(-8px) scale(1.02) !important;
                background: rgba(30, 38, 55, 0.65) !important;
                border-color: rgba(0, 255, 255, 0.3) !important;
                box-shadow: 0 25px 50px rgba(0, 255, 255, 0.15), 0 0 30px rgba(0,0,0,0.6) !important;
            }

            /* Subtle animated glowing orb inside cards */
            #outerblock > div::before, #outerblock .row > div::before {
                content: '';
                position: absolute;
                top: -50%; left: -50%; width: 200%; height: 200%;
                background: radial-gradient(circle at center, rgba(0,255,255,0.05) 0%, transparent 50%);
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.5s ease;
                z-index: 0;
            }
            #outerblock > div:hover::before, #outerblock .row > div:hover::before {
                opacity: 1;
            }

            /* Header/Title formatting inside the card */
            #outerblock h2, #outerblock h3, #outerblock h4, .objective-title {
                color: #ffffff !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
                font-weight: 700 !important;
                letter-spacing: -0.02em !important;
                margin-bottom: 12px !important;
                text-shadow: 0 2px 10px rgba(0,255,255,0.2) !important;
                z-index: 1;
                position: relative;
            }

            /* Descriptions and text */
            #outerblock p, #outerblock span {
                color: rgba(255, 255, 255, 0.7) !important;
                font-size: 1.05rem !important;
                line-height: 1.6 !important;
                font-weight: 400 !important;
                z-index: 1;
                position: relative;
            }

            /* Icons / Images inside the cards */
            #outerblock img {
                filter: drop-shadow(0 5px 15px rgba(0, 255, 255, 0.4)) !important;
                transition: transform 0.4s ease;
                z-index: 1;
                position: relative;
            }
            #outerblock > div:hover img, #outerblock .row > div:hover img {
                transform: scale(1.1) rotate(3deg) !important;
            }

            /* Smooth Entrance Animation */
            @keyframes fcw-fade-in-up {
                from { opacity: 0; transform: translateY(30px); }
                to { opacity: 1; transform: translateY(0); }
            }

            /* Hide any ugly default HR lines */
            #outerblock hr { display: none !important; }

            /* Ensure main headers outside cards are also themed */
            .page-header h1, h1 {
                background: linear-gradient(135deg, #00ffff 0%, #0088ff 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                font-weight: 800;
                letter-spacing: -0.05em;
                margin-bottom: 20px;
                text-shadow: 0 10px 30px rgba(0, 255, 255, 0.2);
            }
        `;

        const style = document.createElement('style');
        style.id = 'fcw-objectives-overhaul-css';
        style.innerHTML = css;
        document.head.appendChild(style);
        document.body.classList.add('objectives-page');

        console.log('[FCW Navbar] Objectives Hub Overhaul Initialized.');
    }

    // Execute when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initObjectivesHub);
    } else {
        initObjectivesHub();
    }
})();


    // === INSPECTOR.JS ===
// ==UserScript==
// @name         FC Watch - Dream Team Inspector (v18.0 - Worlds Global Edition)
// @namespace    http://tampermonkey.net/
// @version      18.0
// @description  v18.0: Added stunning Worlds card animation with interactive dark purple world map featuring all 7 continents, pulsing glow effects, and immersive global atmosphere.
// @match        https://www.fc-watch.com/*
// @match        https://fc-watch.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==
(function () {
    'use strict';

    // === KILLSWITCH CHECK ===
    // Prefers Promise-based approach when available, falls back to polling
    function waitForKillswitch(callback, maxWait = 500) {
        // Try Promise-based approach first (faster, no polling)
        if (window.__FCW_EXTENSION_STATE?.ready instanceof Promise) {
            window.__FCW_EXTENSION_STATE.ready.then(isEnabled => {
                if (isEnabled) callback();
                else console.log('[FCW Inspector] Extension disabled, not running.');
            });
            return;
        }

        // Fallback: poll with reduced frequency
        let waited = 0;
        const check = () => {
            if (window.__FCW_EXTENSION_STATE?.loaded) {
                if (window.__FCW_EXTENSION_STATE.enabled) {
                    callback();
                } else {
                    console.log('[FCW Inspector] Extension disabled, not running.');
                }
            } else if (waited < maxWait) {
                waited += 10;
                setTimeout(check, 10);
            } else {
                // Timeout - Failsafe
                if (window.__FCW_EXTENSION_STATE?.enabled !== false) {
                    callback();
                }
            }
        };
        check();
    }

    waitForKillswitch(initInspector);

    function initInspector() {

        /**
         * ======================================================================================
         * SECTION 1: ASSET LIBRARY
         * ======================================================================================
         */
        const ASSETS = {
            noise: `data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E`,
            heavyGrain: `data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E`,
            bat: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Cpath fill='%23000' d='M256 218c-9.7 0-18.4 4.8-24 12.1-12.8-11.8-31.5-30-61.1-30-29.4 0-48.6 15.2-61.2 26.3-15.3-21.6-46.7-43.8-82.6-26.6-6.6 3.1-9.4 11-6.3 17.6 1.7 3.6 5.3 5.7 9 5.7 2.2 0 4.5-.7 6.4-2.2 16.4-12.7 34.6-9.1 48 1.1 24.3 18.5 28.3 50.1 29.5 66.8 1.4 19.4 13.9 14.1 19.9 8.1 8-8 37.4-44.5 37.4-44.5 9.7 2.4 15.6 12 15.6 22 0 7-3.7 13.6-9.7 17.2-12.4 7.4-12.3 25.1-12.3 25.2 0 6.8 5.1 12.6 11.9 13.5 13.5 1.7 25.4-8 27.2-21.5.8-6.1 2.3-12.3 4.4-18.2 5.1 11 13.9 18.8 24.3 20.6 1.8.3 3.5.5 5.3.5 9.7 0 18.4-4.8 24-12.1 5.6 7.3 14.3 12.1 24 12.1 1.8 0 3.5-.2 5.3-.5 10.4-1.8 19.2-9.6 24.3-20.6 2.1 5.9 3.6 12.1 4.4 18.2 1.8 13.5 13.7 23.2 27.2 21.5 6.8-.9 11.9-6.6 11.9-13.5 0-.1.1-17.8-12.3-25.2-6-3.6-9.7-10.2-9.7-17.2 0-10 5.9-19.6 15.6-22 0 0 29.4 36.5 37.4 44.5 6 6 18.5 11.3 19.9-8.1 1.2-16.7 5.2-48.3 29.5-66.8 13.4-10.2 31.6-13.8 48-1.1 1.9 1.5 4.2 2.2 6.4 2.2 3.7 0 7.3-2.1 9-5.7 3.1-6.6.3-14.4-6.3-17.6-35.9-17.2-67.3 5-82.6 26.6-12.5-11.1-31.8-26.3-61.2-26.3-29.6 0-48.3 18.2-61.1 30-5.6-7.3-14.3-12.1-24-12.1z'/%3E%3C/svg%3E`,
            snowflake: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M2 12h20M12 2v20M20 20L4 4m16 0L4 20'/%3E%3C/svg%3E`,
            // Clear Santa and Sleigh
            sleighSimple: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 50'%3E%3C!-- Reindeer --%3E%3Cellipse cx='15' cy='25' rx='8' ry='5' fill='%23a0522d'/%3E%3Ccircle cx='8' cy='22' r='3' fill='%23a0522d'/%3E%3Cpath d='M6 19 L3 14 M6 19 L9 14' stroke='%23a0522d' stroke-width='1.5' fill='none'/%3E%3Cellipse cx='7' cy='22' rx='1' ry='0.5' fill='%23ff0000'/%3E%3C!-- Sleigh body --%3E%3Cpath d='M30 35 Q25 35 25 30 L25 25 Q25 22 30 22 L70 22 Q75 22 75 25 L75 30 Q75 35 70 35 Z' fill='%23cc0000'/%3E%3Cpath d='M22 38 Q20 38 22 35 L78 35 Q80 38 78 38 Z' fill='%23cc0000'/%3E%3Cpath d='M20 40 C20 38 25 36 30 38 L70 38 C75 36 80 38 80 40' stroke='%23ffd700' stroke-width='2' fill='none'/%3E%3C!-- Santa body --%3E%3Cellipse cx='50' cy='20' rx='12' ry='10' fill='%23cc0000'/%3E%3Ccircle cx='50' cy='10' r='6' fill='%23ffe4c4'/%3E%3C!-- Santa hat --%3E%3Cpath d='M44 10 Q50 0 56 10' fill='%23cc0000'/%3E%3Ccircle cx='56' cy='5' r='2' fill='white'/%3E%3Crect x='44' y='9' width='12' height='2' fill='white' rx='1'/%3E%3C!-- Belt --%3E%3Crect x='44' y='22' width='12' height='3' fill='%23222'/%3E%3Crect x='48' y='21.5' width='4' height='4' fill='%23ffd700' rx='0.5'/%3E%3C!-- Reins --%3E%3Cpath d='M22 25 L38 22' stroke='%23654321' stroke-width='1' fill='none'/%3E%3C/svg%3E`
        };

        // --- EAGER BACKGROUND PRELOADER ---
        // Preload ALL card inspection backgrounds on page load
        // so they display instantly when a card is inspected.
        const CARD_BACKGROUNDS = {
            'time-warp': 'https://i.ibb.co/4RQLG9sC/Generated-Image-January-02-2026-7-00-PM.jpg',
            'gotw': 'https://i.ibb.co/604B3g1M/Generated-Image-January-03-2026-11-23-PM-1-1.jpg',
            'gotw-original': 'https://i.ibb.co/8Lmvfh2h/Generated-Image-December-30-2025-3-45-PM.jpg',
            'gotwmoments': 'https://i.ibb.co/S4BpV8nB/Generated-Image-January-04-2026-4-50-PM-1.jpg',
            'fw-icon-hw': 'https://i.ibb.co/3mjvRdCg/Generated-Image-January-05-2026-6-50-PM-1.jpg',
            'bdor-winner': 'https://i.ibb.co/kgkDNBW3/Generated-Image-January-06-2026-5-52-PM.jpg',
            'bdor-runnerup': 'https://i.ibb.co/kgLhbSBm/Generated-Image-January-07-2026-4-41-PM.jpg',
            'bdor-third': 'https://i.ibb.co/NnpLYVqj/Generated-Image-January-07-2026-4-45-PM.jpg',
            'bddt-gold': 'https://i.ibb.co/HTtdMnb6/Generated-Image-January-13-2026-5-06-PM-1.jpg',
            'bddt-silver': 'https://i.ibb.co/RkYsnK4w/Generated-Image-January-13-2026-5-02-PM-1.jpg',
            'bddt-bronze': 'https://i.ibb.co/0yL2Q7L1/Generated-Image-January-13-2026-5-01-PM-1.jpg',
            'bddt-extreme': 'https://i.ibb.co/yFzHYr9h/Generated-Image-January-13-2026-5-08-PM-1.jpg',
            'bddt-reward': 'https://i.ibb.co/5gFTy0BC/Generated-Image-January-13-2026-5-10-PM-1.jpg',
            'prize': 'https://i.ibb.co/1Gcv7L7H/Generated-Image-January-07-2026-5-48-PM-1.jpg',
            'toty26': 'https://i.ibb.co/p6kcHwBL/d599f471-b9b0-4e2d-a208-8836e41d0675.jpg',
            'iconwc18': 'https://i.ibb.co/vCL3rCRw/Generated-Image-December-31-2025-11-44-PM.jpg',
            'worlds-map': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/World_map_blank_without_borders.svg/2000px-World_map_blank_without_borders.svg.png'
        };
        const preloadedBgs = new Set();

        function preloadCardBackground(cardType) {
            if (preloadedBgs.has(cardType) || !CARD_BACKGROUNDS[cardType]) return;
            preloadedBgs.add(cardType);
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.fetchPriority = 'high';
            link.href = CARD_BACKGROUNDS[cardType];
            document.head.appendChild(link);
        }

        // Eagerly preload ALL card backgrounds on page load for instant inspection
        (function preloadAllBackgrounds() {
            Object.keys(CARD_BACKGROUNDS).forEach(function (key) {
                preloadCardBackground(key);
            });
        })();

        // --- 2. Premium CSS ---
        var css = `

    html { scrollbar-gutter: stable; }

    /* --- POPOVER INSPECT BUTTON --- */
    .fcw-popover-inspect-btn {
        display: block;
        width: 90%;
        margin: 10px auto 5px auto;
        padding: 6px 0;
        background: var(--fcw-accent, #0c2d48); /* Interlinked Accent */
        border: 1px solid rgba(255,255,255,0.2);
        color: #ffffff;
        font-family: 'DIN Pro', sans-serif;
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        text-align: center;
        cursor: pointer;
        border-radius: 3px;
        transition: all 0.2s;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }
    .fcw-popover-inspect-btn:hover {
        filter: brightness(1.2);
        box-shadow: 0 0 8px var(--fcw-accent);
        transform: translateY(-1px);
    }

    /* --- ADD TO FILTER + BUTTON --- */
    .fcw-add-filter-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
        background: var(--fcw-accent, #8d124d);
        border: none;
        border-radius: 4px;
        color: #fff;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
        margin-left: auto;
        transition: all 0.2s ease;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        flex-shrink: 0;
    }
    .fcw-add-filter-btn:hover {
        transform: scale(1.1);
        box-shadow: 0 0 8px var(--fcw-accent, #8d124d);
        filter: brightness(1.2);
    }
    .fcw-add-filter-btn.fcw-added {
        background: #22c55e;
        pointer-events: none;
    }
    .fcw-popover-title-wrapper {
        display: flex !important;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
    }
    .fcw-filter-toast {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        background: rgba(20, 20, 28, 0.95);
        border: 1px solid var(--fcw-accent, #8d124d);
        color: #fff;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        z-index: 1300000;
        opacity: 0;
        transition: all 0.3s ease;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    .fcw-filter-toast.active {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
    }

    /* --- INSPECT POPUP MENU --- */
    .fcw-inspect-popup-overlay {
        position: fixed;
        top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(3px);
        z-index: 1200000; /* Extremely high */
        display: flex;
        justify-content: center;
        align-items: center;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s ease;
    }
    .fcw-inspect-popup-overlay.active { opacity: 1; pointer-events: auto; }

    .fcw-inspect-menu {
        background: rgba(20, 20, 28, 0.95);
        border: 1px solid var(--fcw-accent);
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 20px 50px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.1);
        transform: scale(0.9) translateY(10px);
        transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 15px;
        min-width: 200px;
    }
    .fcw-inspect-popup-overlay.active .fcw-inspect-menu { transform: scale(1) translateY(0); }

    .fcw-menu-title {
        color: rgba(255,255,255,0.6);
        font-family: 'DIN Pro', sans-serif;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 2px;
        margin-bottom: 5px;
    }

    .fcw-btn-inspect-action {
        background: linear-gradient(135deg, var(--fcw-accent, #ffd700) 0%, color-mix(in srgb, var(--fcw-accent, #b8860b), black 20%) 100%);
        border: none;
        color: #1a0a25;
        padding: 12px 0;
        width: 100%;
        font-family: 'DIN Pro', sans-serif;
        font-size: 14px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        border-radius: 6px;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(255, 215, 0, 0.2);
        transition: all 0.2s ease;
    }
    .fcw-btn-inspect-action:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px var(--fcw-accent);
        filter: brightness(1.2);
    }

    .fcw-btn-cancel {
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.5);
        padding: 8px 0;
        width: 100%;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
    }
    .fcw-btn-cancel:hover {
        background: rgba(255, 255, 255, 0.05);
        color: rgba(255, 255, 255, 0.8);
        border-color: rgba(255, 255, 255, 0.2);
    }


/* ============================================= */
    /* MODAL & BASE STYLES */
    /* ============================================= */
    #fcw-card-modal {
        position: fixed;
        top: 0; left: 0; width: 100%; height: 100%;
        background: radial-gradient(ellipse at 50% 50%,
            rgba(10, 10, 12, 0.4) 0%,
            rgba(2, 2, 3, 0.9) 80%,
            rgba(0, 0, 0, 0.98) 100%);
        backdrop-filter: blur(40px) saturate(220%) brightness(0.6) contrast(1.1);
        -webkit-backdrop-filter: blur(40px) saturate(220%) brightness(0.6) contrast(1.1);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease-out, backdrop-filter 0.3s ease-out;
        cursor: pointer;
        overflow: hidden;
        contain: layout style paint; /* Performance: Isolate from rest of page */
    }

    /* --- FIFO 18 TOTY (Royal Navy & Gold) --- */
    #fcw-card-modal.toty18-active {
        background: radial-gradient(ellipse at center,
            rgba(10, 30, 60, 0.95) 0%,
            rgba(5, 15, 30, 0.98) 60%,
            rgba(0, 5, 10, 1) 100%
        );
        backdrop-filter: blur(40px) saturate(140%) brightness(0.8);
        -webkit-backdrop-filter: blur(40px) saturate(140%) brightness(0.8);
    }
    
    #fcw-card-modal.toty18-active::before {
        background: 
            linear-gradient(135deg, rgba(20, 80, 180, 0.15) 0%, transparent 40%),
            linear-gradient(45deg, transparent 60%, rgba(200, 180, 50, 0.1) 100%) !important;
    }

    #fcw-card-modal.toty18-active .fcw-lock-indicator {
        background: linear-gradient(135deg, #003366, #1a5c9a);
        border: 1px solid #c5a059;
        color: #ffd700;
        text-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
        box-shadow: 0 0 20px rgba(10, 50, 120, 0.6);
    }

    /* TOTY 18 Scintillation - Blue & Gold */
    #fcw-card-modal.toty18-active .fcw-scintilla-star {
        background: radial-gradient(circle, #ffffff 0%, #a0c0ff 30%, #4169e1 60%, transparent 70%) !important;
        box-shadow: 0 0 8px rgba(100, 150, 255, 0.9), 0 0 16px rgba(65, 105, 225, 0.6);
    }
    
    /* TOTY 18 Golden Stripes Container */
    .fcw-toty18-container {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 2;
        overflow: hidden;
    }
    
    /* Sleek Diagonal Stripes */
    .fcw-toty18-stripe {
        position: absolute;
        left: 50%; top: 50%;
        width: 300%; /* Very long to ensure coverage during rotation */
        height: var(--stripe-height);
        background: linear-gradient(90deg, 
            transparent 0%, 
            rgba(255, 215, 0, 0.1) 20%, 
            var(--stripe-color) 50%, 
            rgba(255, 215, 0, 0.1) 80%, 
            transparent 100%
        );
        transform: translate(-50%, -50%) rotate(-45deg) translateY(var(--offset-y));
        box-shadow: 0 0 20px var(--stripe-shadow);
        opacity: 0;
        will-change: transform, opacity;
        animation: fcw-stripe-anim var(--duration) ease-in-out infinite;
        animation-delay: var(--delay);
    }
    
    @keyframes fcw-stripe-anim {
        0% { opacity: 0; transform: translate(-50%, -50%) rotate(-45deg) translateY(var(--offset-y)) translateX(-100%); }
        20% { opacity: var(--max-opacity); }
        80% { opacity: var(--max-opacity); }
        100% { opacity: 0; transform: translate(-50%, -50%) rotate(-45deg) translateY(var(--offset-y)) translateX(100%); }
    }

    /* ================================================= */
    /* --- FC 26 TOTY (Blue & Gold Luxury) BACKGROUND --- */
    /* ================================================= */
    #fcw-card-modal.toty26-active {
        background: 
            url('https://i.ibb.co/p6kcHwBL/d599f471-b9b0-4e2d-a208-8836e41d0675.jpg') center 57% / 120% auto no-repeat !important;
        background-color: #030510 !important;
    }
    
    #fcw-card-modal.toty26-active::before {
        content: '';
        position: absolute;
        inset: 0;
        background: 
            radial-gradient(ellipse 60% 60% at 50% 50%, rgba(20, 80, 180, 0.15) 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 30% 30%, rgba(255, 200, 50, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse 40% 40% at 70% 70%, rgba(255, 200, 50, 0.08) 0%, transparent 50%);
        pointer-events: none;
        animation: fcw-toty26-ambient-pulse 5s ease-in-out infinite;
        z-index: 1;
    }
    
    @keyframes fcw-toty26-ambient-pulse {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
    }

    #fcw-card-modal.toty26-active .fcw-lock-indicator {
        background: linear-gradient(135deg, #0a3a7a, #1a5c9a);
        border: 1px solid #c5a059;
        color: #ffd700;
        text-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
        box-shadow: 0 0 20px rgba(10, 50, 120, 0.6), 0 0 30px rgba(255, 200, 50, 0.3);
    }

    /* TOTY 26 Headshot Golden Glow Overlay */
    .fcw-toty26-headshot-glow {
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 100%;
        pointer-events: none;
        z-index: -1;
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        filter: blur(12px) brightness(1.3) saturate(1.5);
        opacity: 0.7;
        animation: fcw-toty26-glow-pulse 3s ease-in-out infinite;
    }
    .fcw-toty26-headshot-glow::after {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(circle, rgba(255, 200, 50, 0.4) 0%, rgba(255, 180, 0, 0.2) 50%, transparent 70%);
        animation: fcw-toty26-glow-pulse 3s ease-in-out infinite;
    }
    @keyframes fcw-toty26-glow-pulse {
        0%, 100% { opacity: 0.5; transform: scale(1.05); }
        50% { opacity: 0.85; transform: scale(1.12); }
    }

    /* TOTY 26 Spotlight (Centered Blue/Gold Glow) */
    .fcw-toty26-spotlight {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 1000px;
        height: 1000px;
        transform: translate(-50%, -50%) translateZ(0);
        background: radial-gradient(circle, rgba(20, 80, 180, 0.25) 0%, rgba(255, 200, 50, 0.1) 40%, transparent 70%);
        animation: fcw-toty26-spotlight-pulse 4s infinite ease-in-out;
        pointer-events: none;
        z-index: 1;
        display: block !important;
        opacity: 0.8;
        mix-blend-mode: screen;
    }
    
    @keyframes fcw-toty26-spotlight-pulse {
        0%, 100% { opacity: 0.6; transform: translate(-50%,-50%) scale(1); }
        50% { opacity: 1; transform: translate(-50%,-50%) scale(1.12); }
    }

    /* TOTY 26 Shimmer Sweep */
    .fcw-toty26-shimmer {
        position: absolute;
        inset: 0;
        background: linear-gradient(
            115deg,
            transparent 0%,
            transparent 35%,
            rgba(20, 80, 180, 0.04) 42%,
            rgba(100, 150, 220, 0.08) 48%,
            rgba(255, 220, 100, 0.12) 50%,
            rgba(100, 150, 220, 0.08) 52%,
            rgba(20, 80, 180, 0.04) 58%,
            transparent 65%,
            transparent 100%
        );
        background-size: 300% 100%;
        background-repeat: no-repeat;
        pointer-events: none;
        animation: fcw-toty26-shimmer-sweep 7s linear infinite;
        z-index: 2;
        display: block !important;
        mix-blend-mode: overlay;
    }
    
    @keyframes fcw-toty26-shimmer-sweep {
        0% { background-position: 130% 0; }
        100% { background-position: -30% 0; }
    }

    /* TOTY 26 Particles (Blue & Gold) */
    .fcw-toty26-particle {
        position: absolute;
        width: 4px;
        height: 4px;
        border-radius: 50%;
        opacity: 0;
        animation: fcw-toty26-particle-rise 4s linear infinite;
        pointer-events: none;
        will-change: transform, opacity;
    }
    .fcw-toty26-particle.blue {
        background: #4080ff;
        box-shadow: 0 0 8px #4080ff, 0 0 16px #2060dd;
    }
    .fcw-toty26-particle.gold {
        background: #ffd700;
        box-shadow: 0 0 8px #ffd700, 0 0 16px #cc9900;
    }
    
    @keyframes fcw-toty26-particle-rise {
        0% { opacity: 0; transform: translateY(0) scale(0.5) translateZ(0); }
        15% { opacity: 1; }
        85% { opacity: 0.7; }
        100% { opacity: 0; transform: translateY(-250px) scale(1.4) translateZ(0); }
    }

    /* TOTY 26 Glint (Quick Sparkles) */
    .fcw-toty26-glint {
        position: absolute;
        width: 6px;
        height: 6px;
        background: radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,220,100,0.7) 40%, transparent 100%);
        border-radius: 50%;
        pointer-events: none;
        animation: fcw-toty26-glint-flash 3s ease-in-out infinite;
    }
    @keyframes fcw-toty26-glint-flash {
        0%, 100% { opacity: 0; transform: scale(0.5); }
        10% { opacity: 1; transform: scale(1.3); }
        20% { opacity: 0; transform: scale(0.8); }
    }


    /* --- GOTW (Goal of the Week) MODERN BACKGROUND --- */
    #fcw-card-modal.gotw-active {
        background: 
            url('https://i.ibb.co/604B3g1M/Generated-Image-January-03-2026-11-23-PM-1-1.jpg') center 86% / 140% auto no-repeat !important;
        background-color: #0a0512 !important;
    }

    /* Subtle shimmer overlay */
    #fcw-card-modal.gotw-active::before {
        background: linear-gradient(
            135deg,
            transparent 0%,
            rgba(255, 255, 255, 0.02) 40%,
            rgba(200, 180, 255, 0.04) 50%,
            rgba(255, 255, 255, 0.02) 60%,
            transparent 100%
        ) !important;
        background-size: 200% 200% !important;
        animation: fcw-gotw-shimmer 8s ease-in-out infinite !important;
    }

    @keyframes fcw-gotw-shimmer {
        0%, 100% { background-position: -100% -100%; }
        50% { background-position: 100% 100%; }
    }

    /* GOTW Lock Indicator */
    #fcw-card-modal.gotw-active .fcw-lock-indicator {
        background: linear-gradient(135deg, rgba(180, 100, 220, 0.9), rgba(100, 180, 255, 0.9));
        border: 1px solid rgba(255, 255, 255, 0.5);
        color: white;
        text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
        box-shadow: 0 0 20px rgba(180, 100, 220, 0.6), 0 0 40px rgba(100, 180, 255, 0.3);
    }

    /* GOTW Scintillation - Prismatic Sparkles */
    #fcw-card-modal.gotw-active .fcw-scintilla-star {
        background: radial-gradient(circle, rgba(255, 255, 255, 1) 0%, rgba(200, 150, 255, 0.8) 30%, transparent 70%);
        box-shadow: 0 0 8px rgba(255, 255, 255, 0.9), 0 0 16px rgba(180, 100, 220, 0.6), 0 0 24px rgba(100, 200, 255, 0.4);
    }

    /* --- GOTW Theatre Spotlight Container --- */
    .fcw-gotw-container {
        position: absolute;
        inset: 0;
        pointer-events: none;
        overflow: hidden;
        z-index: 3;
    }

    /* --- GOTW Purple Spotlights Pointing to Card --- */
    .fcw-purple-spotlight {
        position: absolute;
        pointer-events: none;
        z-index: 4;
    }

    /* Left Purple Spotlight - Points diagonally to center-right - GPU Optimized */
    .fcw-purple-spotlight.left {
        top: 0;
        left: 0;
        width: 70%;
        height: 100%;
        background: conic-gradient(
            from 120deg at 0% 0%,
            transparent 0deg,
            rgba(120, 50, 180, 0.03) 20deg,
            rgba(150, 80, 220, 0.08) 35deg,
            rgba(180, 100, 255, 0.15) 50deg,
            rgba(200, 120, 255, 0.2) 60deg,
            rgba(180, 100, 255, 0.15) 70deg,
            rgba(150, 80, 220, 0.08) 85deg,
            rgba(120, 50, 180, 0.03) 100deg,
            transparent 115deg
        );
        filter: blur(15px);
        opacity: 0.9;
        will-change: transform;
        transform: translateZ(0); /* Force GPU compositing */
    }

    /* Right Purple Spotlight - Points diagonally to center-left */
    .fcw-purple-spotlight.right {
        top: 0;
        right: 0;
        width: 70%;
        height: 100%;
        background: conic-gradient(
            from 60deg at 100% 0%,
            transparent 245deg,
            rgba(120, 50, 180, 0.03) 260deg,
            rgba(150, 80, 220, 0.08) 275deg,
            rgba(180, 100, 255, 0.15) 290deg,
            rgba(200, 120, 255, 0.2) 300deg,
            rgba(180, 100, 255, 0.15) 310deg,
            rgba(150, 80, 220, 0.08) 325deg,
            rgba(120, 50, 180, 0.03) 340deg,
            transparent 360deg
        );
        filter: blur(15px);
        opacity: 0.9;
    }

    /* Central glow where spotlights converge on the card */
    .fcw-spotlight-convergence {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 400px;
        height: 600px;
        background: radial-gradient(
            ellipse at center,
            rgba(180, 100, 255, 0.15) 0%,
            rgba(150, 80, 220, 0.08) 30%,
            rgba(120, 50, 180, 0.04) 50%,
            transparent 70%
        );
        pointer-events: none;
        z-index: 4;
        opacity: 0.8; /* Match 0% keyframe */
        will-change: transform, opacity;
        animation: fcw-convergence-pulse 4s ease-in-out infinite;
    }

    @keyframes fcw-convergence-pulse {
        0%, 100% { opacity: 0.8; transform: translate(-50%, -50%) scale(1); }
        50% { opacity: 1; transform: translate(-50%, -50%) scale(1.05); }
    }

    /* Headshot Spotlight - Premium Purple spotlight with GPU acceleration */
    .fcw-headshot-spotlight {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) translateZ(0);
        width: 500px;
        height: 700px;
        background: radial-gradient(ellipse 100% 100% at 50% 50%, 
            rgba(200, 80, 255, 0.5) 0%, 
            rgba(170, 60, 240, 0.35) 20%, 
            rgba(140, 50, 220, 0.22) 40%, 
            rgba(110, 40, 180, 0.12) 60%,
            rgba(80, 30, 140, 0.05) 80%,
            transparent 100%
        );
        pointer-events: none;
        z-index: 2;
        filter: blur(20px);
        opacity: 0.85; /* Match 0% keyframe */
        will-change: transform, opacity;
        animation: fcw-headshot-spotlight-pulse 3.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    }

    .fcw-headshot-spotlight::before {
        content: '';
        position: absolute;
        inset: -60px;
        background: radial-gradient(ellipse 85% 85% at 50% 50%, 
            rgba(220, 100, 255, 0.25) 0%, 
            rgba(180, 70, 240, 0.15) 35%, 
            rgba(140, 50, 200, 0.06) 60%,
            transparent 75%
        );
        filter: blur(25px);
        opacity: 0.85; /* Match 0% keyframe */
        will-change: transform, opacity;
        animation: fcw-headshot-spotlight-pulse 3.5s cubic-bezier(0.4, 0, 0.2, 1) infinite -0.3s;
    }

    .fcw-headshot-spotlight::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 220px;
        height: 340px;
        background: radial-gradient(ellipse at center, 
            rgba(255, 200, 255, 0.45) 0%, 
            rgba(230, 150, 255, 0.3) 25%, 
            rgba(200, 120, 255, 0.15) 50%,
            transparent 75%
        );
        filter: blur(10px);
        opacity: 0.75; /* Match 0% keyframe of core animation */
        will-change: transform, opacity;
        animation: fcw-headshot-spotlight-core 2.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    }

    @keyframes fcw-headshot-spotlight-pulse {
        0%, 100% { opacity: 0.85; transform: translate(-50%, -50%) translateZ(0) scale(1); }
        50% { opacity: 1; transform: translate(-50%, -50%) translateZ(0) scale(1.06); }
    }

    @keyframes fcw-headshot-spotlight-core {
        0%, 100% { opacity: 0.75; transform: translate(-50%, -50%) scale(1); }
        50% { opacity: 1; transform: translate(-50%, -50%) scale(1.04); }
    }

    /* --- GOTW Purple Base Glow (Illuminating from bottom) - Optimized --- */
    .fcw-base-glow {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 65%;
        background: linear-gradient(
            to top,
            rgba(160, 60, 220, 0.35) 0%,
            rgba(140, 50, 200, 0.25) 12%,
            rgba(120, 45, 180, 0.16) 25%,
            rgba(100, 40, 160, 0.09) 40%,
            rgba(80, 35, 140, 0.04) 55%,
            transparent 75%
        );
        pointer-events: none;
        z-index: 2;
        will-change: opacity;
        animation: fcw-base-glow-pulse 4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    }

    /* Secondary ambient glow layer for depth - Enhanced */
    .fcw-base-glow-ambient {
        position: absolute;
        bottom: -3%;
        left: 8%;
        right: 8%;
        height: 45%;
        background: radial-gradient(
            ellipse 85% 55% at 50% 100%,
            rgba(180, 80, 240, 0.28) 0%,
            rgba(160, 65, 220, 0.18) 25%,
            rgba(140, 55, 200, 0.09) 45%,
            transparent 70%
        );
        pointer-events: none;
        z-index: 2;
        filter: blur(12px);
        will-change: opacity;
    }

    @keyframes fcw-base-glow-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.75; }
    }

    /* --- GOTW Lens Flares - GPU Optimized & Premium --- */
    .fcw-lens-flare {
        position: absolute;
        border-radius: 50%;
        pointer-events: none;
        z-index: 6;
        opacity: 0.65; /* Match 0% keyframe */
        will-change: transform, opacity;
        animation: fcw-flare-pulse var(--pulse-duration) cubic-bezier(0.4, 0, 0.2, 1) infinite;
        animation-delay: var(--pulse-delay);
    }

    .fcw-lens-flare.primary {
        width: 140px;
        height: 140px;
        background: radial-gradient(circle,
            rgba(220, 130, 255, 0.5) 0%,
            rgba(200, 90, 255, 0.3) 25%,
            rgba(170, 70, 240, 0.15) 45%,
            rgba(140, 50, 220, 0.06) 60%,
            transparent 75%
        );
        filter: blur(2px);
    }

    .fcw-lens-flare.secondary {
        width: 70px;
        height: 70px;
        background: radial-gradient(circle,
            rgba(255, 180, 255, 0.6) 0%,
            rgba(230, 140, 255, 0.35) 35%,
            rgba(200, 100, 255, 0.12) 55%,
            transparent 75%
        );
        filter: blur(1px);
    }

    .fcw-lens-flare.accent {
        width: 35px;
        height: 35px;
        background: radial-gradient(circle,
            rgba(255, 255, 255, 0.85) 0%,
            rgba(255, 220, 255, 0.55) 40%,
            rgba(240, 180, 255, 0.2) 65%,
            transparent 85%
        );
    }

    @keyframes fcw-flare-pulse {
        0%, 100% { opacity: 0.65; transform: scale(1) translateZ(0); }
        50% { opacity: 1; transform: scale(1.18) translateZ(0); }
    }

    /* --- GOTW Floating Light Particles - Optimized & Premium --- */
    .fcw-light-particle {
        position: absolute;
        width: 5px;
        height: 5px;
        background: radial-gradient(circle, rgba(255, 200, 255, 1) 0%, rgba(220, 140, 255, 0.7) 50%, transparent 100%);
        border-radius: 50%;
        pointer-events: none;
        z-index: 5;
        box-shadow: 0 0 6px rgba(255, 180, 255, 0.9), 0 0 12px rgba(200, 120, 255, 0.6), 0 0 20px rgba(160, 80, 220, 0.3);
        will-change: transform, opacity;
        animation: fcw-particle-float var(--float-duration) cubic-bezier(0.4, 0, 0.2, 1) infinite;
        animation-delay: var(--float-delay);
    }

    @keyframes fcw-particle-float {
        0% { opacity: 0; transform: translateY(0) translateX(0) scale(0.4) translateZ(0); }
        15% { opacity: 1; }
        85% { opacity: 1; }
        100% { opacity: 0; transform: translateY(var(--drift-y)) translateX(var(--drift-x)) scale(1.3) translateZ(0); }
    }

    /* --- GOTW Premium Shimmer Sweep - GPU Optimized --- */
    .fcw-card-shimmer {
        mix-blend-mode: overlay;
        position: absolute;
        inset: 0;
        border-radius: inherit;
        overflow: hidden;
        background: linear-gradient(
            108deg,
            transparent 0%,
            transparent 38%,
            rgba(255, 200, 255, 0.06) 42%,
            rgba(255, 180, 255, 0.12) 46%,
            rgba(255, 255, 255, 0.2) 50%,
            rgba(255, 180, 255, 0.12) 54%,
            rgba(255, 200, 255, 0.06) 58%,
            transparent 62%,
            transparent 100%
        );
        background-size: 250% 100%;
        pointer-events: none;
        z-index: 7;
        will-change: background-position;
        animation: fcw-shimmer-sweep 8s linear infinite;
    }

    @keyframes fcw-shimmer-sweep {
        0% { background-position: 200% 0; }
        100% { background-position: -50% 0; }
    }

    /* --- GOTW Light Rays from Card - Optimized --- */
    .fcw-light-ray {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 3px;
        height: 350px;
        background: linear-gradient(to top, 
            rgba(200, 100, 255, 0.4) 0%, 
            rgba(180, 80, 240, 0.25) 30%, 
            rgba(160, 60, 220, 0.1) 60%, 
            transparent 100%);
        transform-origin: bottom center;
        pointer-events: none;
        z-index: 3;
        filter: blur(2px);
        opacity: 0.45; /* Match 0% keyframe */
        will-change: opacity;
        animation: fcw-ray-pulse 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        animation-delay: var(--ray-delay);
    }

    @keyframes fcw-ray-pulse {
        0%, 100% { opacity: 0.45; }
        50% { opacity: 0.9; }
    }

    /* --- GOTW Edge Glow - Enhanced Premium Purple --- */
    .fcw-edge-glow {
        position: absolute;
        inset: 0;
        border-radius: 12px;
        pointer-events: none;
        z-index: 6;
        box-shadow:
            inset 0 0 50px rgba(200, 80, 255, 0.2),
            inset 0 0 100px rgba(170, 60, 240, 0.12),
            inset 0 0 150px rgba(140, 50, 200, 0.06);
        will-change: opacity;
        animation: fcw-edge-glow-pulse 3.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    }

    @keyframes fcw-edge-glow-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.65; }
    }

    /* --- NEW: Royal Volumetric Beams --- */
    .fcw-royal-beam {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 150%;
        height: 150%;
        background: repeating-conic-gradient(
            from 0deg,
            rgba(180, 100, 255, 0) 0deg,
            rgba(180, 100, 255, 0.03) 10deg,
            rgba(180, 100, 255, 0) 20deg
        );
        mix-blend-mode: screen;
        pointer-events: none;
        z-index: 1;
        will-change: transform;
        transform: translate(-50%, -50%) translateZ(0);
    }

    .fcw-royal-beam.layer-1 {
        animation: fcw-beam-rotate 40s linear infinite;
        background: repeating-conic-gradient(
            from 0deg,
            transparent 0deg,
            rgba(160, 80, 240, 0.04) 15deg,
            transparent 30deg
        );
    }

    .fcw-royal-beam.layer-2 {
        animation: fcw-beam-rotate 60s linear infinite reverse;
        opacity: 0.6;
        background: repeating-conic-gradient(
            from 45deg,
            transparent 0deg,
            rgba(200, 120, 255, 0.03) 10deg,
            transparent 25deg
        );
    }

    @keyframes fcw-beam-rotate {
        from { transform: translate(-50%, -50%) rotate(0deg) translateZ(0); }
        to { transform: translate(-50%, -50%) rotate(360deg) translateZ(0); }
    }

    /* --- NEW: Cosmic Stardust --- */
    .fcw-cosmic-dust {
        position: absolute;
        inset: 0;
        z-index: 3;
        pointer-events: none;
        background-image: radial-gradient(white, rgba(255,255,255,.2) 2px, transparent 2.5px),
            radial-gradient(white, rgba(255,255,255,.15) 1px, transparent 1.5px),
            radial-gradient(white, rgba(255,255,255,.1) 2px, transparent 2.5px);
        background-size: 550px 550px, 350px 350px, 250px 250px;
        background-position: 0 0, 40px 60px, 130px 270px;
        opacity: 0.4;
        will-change: opacity;
        animation: fcw-stardust-twinkle 6s ease-in-out infinite;
    }

    @keyframes fcw-stardust-twinkle {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 0.6; }
    }

    /* --- NEW: GOTW Premium Sparkle Burst --- */
    .fcw-sparkle-burst {
        position: absolute;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        pointer-events: none;
        z-index: 8;
        background: radial-gradient(circle, 
            rgba(255, 255, 255, 1) 0%, 
            rgba(255, 200, 255, 0.8) 40%, 
            transparent 70%);
        box-shadow: 
            0 0 4px rgba(255, 255, 255, 1),
            0 0 10px rgba(255, 180, 255, 0.8),
            0 0 16px rgba(200, 100, 255, 0.5);
        opacity: 0; /* Match 0% keyframe */
        will-change: transform, opacity;
        animation: fcw-sparkle-burst var(--sparkle-duration) ease-out infinite;
        animation-delay: var(--sparkle-delay);
    }

    @keyframes fcw-sparkle-burst {
        0% { opacity: 0; transform: scale(0) translateZ(0); }
        20% { opacity: 1; transform: scale(1.2) translateZ(0); }
        40% { opacity: 1; transform: scale(0.9) translateZ(0); }
        100% { opacity: 0; transform: scale(0.3) translateZ(0); }
    }

    /* ================================================= */
    /* --- GOTW MOMENTS (PREMIUM WHITE VARIANT) --- */
    /* ================================================= */
    /* ================================================= */
    /* --- GOTW MOMENTS (PREMIUM WHITE VARIANT) --- */
    /* ================================================= */
    #fcw-card-modal.gotwmoments-active {
        background: url('https://i.ibb.co/S4BpV8nB/Generated-Image-January-04-2026-4-50-PM-1.jpg') no-repeat center 86%;
        background-size: 140% auto;
        background-color: #0a0512 !important; /* Fallback during load */
        
        /* REMOVED backdrop-filter - causes first-load choppiness/GPU stall */
        
        /* FORCE STATIC - No Fades, No Transitions, No Animations */
        transition: none !important;
        animation: none !important;
        opacity: 1 !important;
        transform: none !important;
    }

    #fcw-card-modal.gotwmoments-active::before {
        /* Simplified - removed expensive multi-layer gradients */
        background: radial-gradient(ellipse 70% 50% at 50% 40%, rgba(255, 255, 255, 0.08) 0%, transparent 60%) !important;
        will-change: opacity;
    }

    /* GOTW Moments Lock Indicator - White/Platinum accent */
    #fcw-card-modal.gotwmoments-active .fcw-lock-indicator {
        background: linear-gradient(135deg, rgba(200, 180, 240, 0.9), rgba(255, 255, 255, 0.85));
        border: 1px solid rgba(255, 255, 255, 0.7);
        color: rgba(60, 40, 80, 1);
        text-shadow: 0 0 8px rgba(255, 255, 255, 0.6);
        box-shadow: 0 0 20px rgba(255, 255, 255, 0.5), 0 0 40px rgba(180, 150, 220, 0.3);
    }

    /* GOTW Moments Scintillation - White Platinum Sparkles */
    #fcw-card-modal.gotwmoments-active .fcw-scintilla-star {
        background: radial-gradient(circle, rgba(255, 255, 255, 1) 0%, rgba(240, 230, 255, 0.9) 30%, rgba(200, 180, 240, 0.5) 60%, transparent 70%) !important;
        box-shadow: 0 0 10px rgba(255, 255, 255, 1), 0 0 20px rgba(255, 255, 255, 0.7), 0 0 30px rgba(200, 180, 240, 0.4);
    }

    /* GOTW Moments White Shimmer Overlay */
    .fcw-gotwm-shimmer {
        position: absolute;
        inset: 0;
        background: linear-gradient(
            120deg,
            transparent 0%,
            transparent 40%,
            rgba(255, 255, 255, 0.03) 45%,
            rgba(255, 255, 255, 0.08) 50%,
            rgba(255, 255, 255, 0.03) 55%,
            transparent 60%,
            transparent 100%
        );
        background-size: 300% 100%;
        animation: fcw-gotwm-shimmer-sweep 6s ease-in-out infinite;
        pointer-events: none;
        z-index: 4;
    }

    @keyframes fcw-gotwm-shimmer-sweep {
        0% { background-position: 250% 0; }
        100% { background-position: -50% 0; }
    }

    /* GOTW Moments Platinum Particles */
    .fcw-particle-ember.gotwm-white {
        background: radial-gradient(circle, rgba(255, 255, 255, 1), rgba(240, 235, 255, 0.9));
        box-shadow: 0 0 8px rgba(255, 255, 255, 0.9), 0 0 15px rgba(200, 180, 240, 0.5);
    }
    .fcw-particle-ember.gotwm-purple {
        background: radial-gradient(circle, rgba(220, 180, 255, 1), rgba(180, 130, 220, 0.8));
        /* Removed box-shadow for performance */
    }
    .fcw-particle-ember.gotwm-blue {
        background: radial-gradient(circle, rgba(180, 220, 255, 1), rgba(130, 180, 255, 0.8));
        /* Removed box-shadow for performance */
    }

    /* GOTW Moments Titanium/White Beams - OPTIMIZED: Single layer, simpler gradient */
    .fcw-moment-beam {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 140%;
        height: 140%;
        /* Simplified: linear gradient is faster than conic-gradient */
        background: linear-gradient(0deg, 
            transparent 0%, 
            rgba(255, 255, 255, 0.03) 25%, 
            transparent 50%, 
            rgba(255, 255, 255, 0.03) 75%, 
            transparent 100%);
        pointer-events: none;
        z-index: 1;
        will-change: transform;
        transform: translate(-50%, -50%) translateZ(0);
    }

    .fcw-moment-beam.layer-1 {
        animation: 
            fcw-fade-in-beam 1s ease-out forwards,
            fcw-beam-rotate-cw 45s linear infinite;
        animation-delay: 
            0s,
            -20s; /* Start rotation mid-cycle, fade starts instantly */
        opacity: 0; /* Start invisible for fade */
    }

    /* REMOVED layer-2 for performance - single beam is sufficient */
    .fcw-moment-beam.layer-2 {
        display: none;
    }

    @keyframes fcw-beam-rotate-cw {
        from { transform: translate(-50%, -50%) rotate(0deg) translateZ(0); }
        to { transform: translate(-50%, -50%) rotate(360deg) translateZ(0); }
    }
    @keyframes fcw-beam-rotate-ccw {
        from { transform: translate(-50%, -50%) rotate(360deg) translateZ(0); }
        to { transform: translate(-50%, -50%) rotate(0deg) translateZ(0); }
    }

    @keyframes fcw-fade-in-beam {
        0% { opacity: 0; }
        100% { opacity: 0.9; }
    }
    
    @keyframes fcw-fade-in-dust {
        0% { opacity: 0; }
        100% { opacity: 0.5; }
    }

    @keyframes fcw-fade-in-flare {
        0% { opacity: 0; transform: translate(-50%, -50%) translateZ(0) scale(0.95); }
        100% { opacity: 0.7; transform: translate(-50%, -50%) translateZ(0) scale(1); }
    }

    /* ================================================= */
    /* --- LUNAR NEW YEAR THEME (PREMIUM) --- */
    /* ================================================= */
    #fcw-card-modal.lny-active {
        background:
            radial-gradient(ellipse 80% 60% at 50% 45%, rgba(120, 20, 20, 0.6) 0%, transparent 60%),
            radial-gradient(ellipse 50% 40% at 30% 30%, rgba(180, 50, 10, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse 50% 40% at 70% 70%, rgba(180, 120, 10, 0.12) 0%, transparent 50%),
            radial-gradient(ellipse at center bottom, rgba(200, 150, 50, 0.08) 0%, transparent 40%),
            linear-gradient(180deg, #0d0306 0%, #1a0508 25%, #200810 50%, #180610 75%, #0a0204 100%) !important;
        background-color: #0d0306 !important;
    }
    #fcw-card-modal.lny-active::before {
        content: '';
        position: absolute;
        inset: 0;
        background:
            radial-gradient(ellipse 60% 50% at 50% 50%, rgba(200, 50, 30, 0.12) 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 25% 25%, rgba(255, 180, 50, 0.06) 0%, transparent 50%),
            radial-gradient(ellipse 40% 40% at 75% 75%, rgba(255, 180, 50, 0.06) 0%, transparent 50%);
        pointer-events: none;
        animation: fcw-lny-ambient-pulse 5s ease-in-out infinite;
        z-index: 1;
    }
    @keyframes fcw-lny-ambient-pulse {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 1; }
    }
    #fcw-card-modal.lny-active .fcw-lock-indicator {
        background: linear-gradient(135deg, rgba(200, 30, 30, 0.9), rgba(255, 200, 50, 0.85));
        border: 1px solid rgba(255, 215, 0, 0.7);
        color: #fff;
        text-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
        box-shadow: 0 0 20px rgba(200, 30, 30, 0.6), 0 0 40px rgba(255, 200, 50, 0.3);
    }
    #fcw-card-modal.lny-active .fcw-scintilla-star {
        background: radial-gradient(circle, rgba(255, 255, 255, 1) 0%, rgba(255, 215, 0, 0.9) 25%, rgba(255, 50, 30, 0.6) 50%, transparent 70%) !important;
        box-shadow: 0 0 10px rgba(255, 215, 0, 1), 0 0 20px rgba(255, 215, 0, 0.7), 0 0 30px rgba(255, 50, 30, 0.4);
    }
    .fcw-lny-container { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 3; }
    .fcw-lny-spotlight { position: absolute; pointer-events: none; z-index: 4; }
    .fcw-lny-spotlight.left {
        top: 0; left: 0; width: 70%; height: 100%;
        background: conic-gradient(from 120deg at 0% 0%, transparent 0deg, rgba(180, 30, 20, 0.03) 20deg, rgba(200, 50, 30, 0.08) 35deg, rgba(220, 80, 30, 0.14) 50deg, rgba(255, 150, 50, 0.18) 60deg, rgba(220, 80, 30, 0.14) 70deg, rgba(200, 50, 30, 0.08) 85deg, rgba(180, 30, 20, 0.03) 100deg, transparent 115deg);
        filter: blur(15px); opacity: 0.9; will-change: transform; transform: translateZ(0);
    }
    .fcw-lny-spotlight.right {
        top: 0; right: 0; width: 70%; height: 100%;
        background: conic-gradient(from 60deg at 100% 0%, transparent 245deg, rgba(180, 30, 20, 0.03) 260deg, rgba(200, 50, 30, 0.08) 275deg, rgba(220, 80, 30, 0.14) 290deg, rgba(255, 150, 50, 0.18) 300deg, rgba(220, 80, 30, 0.14) 310deg, rgba(200, 50, 30, 0.08) 325deg, rgba(180, 30, 20, 0.03) 340deg, transparent 360deg);
        filter: blur(15px); opacity: 0.9;
    }
    .fcw-lny-convergence {
        position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
        width: 450px; height: 650px;
        background: radial-gradient(ellipse at center, rgba(255, 150, 50, 0.18) 0%, rgba(200, 50, 30, 0.1) 30%, rgba(150, 20, 20, 0.05) 50%, transparent 70%);
        pointer-events: none; z-index: 4; will-change: transform, opacity;
        animation: fcw-lny-convergence-pulse 4s ease-in-out infinite;
    }
    @keyframes fcw-lny-convergence-pulse {
        0%, 100% { opacity: 0.8; transform: translate(-50%, -50%) scale(1); }
        50% { opacity: 1; transform: translate(-50%, -50%) scale(1.06); }
    }
    .fcw-lny-headshot-spotlight {
        position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) translateZ(0);
        width: 500px; height: 700px;
        background: radial-gradient(ellipse 100% 100% at 50% 50%, rgba(255, 100, 30, 0.45) 0%, rgba(200, 50, 20, 0.3) 20%, rgba(150, 30, 15, 0.18) 40%, rgba(100, 20, 10, 0.08) 60%, transparent 100%);
        pointer-events: none; z-index: 2; filter: blur(20px); will-change: transform, opacity;
        animation: fcw-lny-headshot-pulse 3.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    }
    @keyframes fcw-lny-headshot-pulse {
        0%, 100% { opacity: 0.8; transform: translate(-50%, -50%) translateZ(0) scale(1); }
        50% { opacity: 1; transform: translate(-50%, -50%) translateZ(0) scale(1.06); }
    }
    .fcw-lny-base-glow {
        position: absolute; bottom: 0; left: 0; right: 0; height: 65%;
        background: linear-gradient(to top, rgba(200, 50, 20, 0.3) 0%, rgba(180, 40, 15, 0.2) 12%, rgba(150, 80, 30, 0.12) 25%, rgba(120, 60, 20, 0.06) 40%, transparent 65%);
        pointer-events: none; z-index: 2; will-change: opacity;
        animation: fcw-lny-base-pulse 4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    }
    @keyframes fcw-lny-base-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
    .fcw-lny-beam {
        position: absolute; top: 50%; left: 50%; width: 150%; height: 150%;
        mix-blend-mode: screen; pointer-events: none; z-index: 1; will-change: transform;
        transform: translate(-50%, -50%) translateZ(0);
    }
    .fcw-lny-beam.layer-1 {
        background: repeating-conic-gradient(from 0deg, transparent 0deg, rgba(255, 180, 50, 0.04) 12deg, transparent 24deg);
        animation: fcw-lny-beam-rotate 45s linear infinite;
    }
    .fcw-lny-beam.layer-2 {
        background: repeating-conic-gradient(from 45deg, transparent 0deg, rgba(200, 50, 30, 0.03) 15deg, transparent 30deg);
        animation: fcw-lny-beam-rotate 65s linear infinite reverse; opacity: 0.6;
    }
    @keyframes fcw-lny-beam-rotate {
        from { transform: translate(-50%, -50%) rotate(0deg) translateZ(0); }
        to { transform: translate(-50%, -50%) rotate(360deg) translateZ(0); }
    }
    .fcw-lny-flare {
        position: absolute; border-radius: 50%; pointer-events: none; z-index: 6;
        will-change: transform, opacity;
        animation: fcw-lny-flare-pulse var(--pulse-duration) cubic-bezier(0.4, 0, 0.2, 1) infinite;
        animation-delay: var(--pulse-delay);
    }
    .fcw-lny-flare.primary { width: 140px; height: 140px; background: radial-gradient(circle, rgba(255, 200, 50, 0.45) 0%, rgba(255, 150, 30, 0.25) 25%, rgba(200, 80, 20, 0.1) 50%, transparent 75%); filter: blur(3px); }
    .fcw-lny-flare.secondary { width: 70px; height: 70px; background: radial-gradient(circle, rgba(255, 215, 100, 0.55) 0%, rgba(255, 180, 60, 0.3) 35%, rgba(200, 100, 30, 0.1) 55%, transparent 75%); filter: blur(1px); }
    .fcw-lny-flare.accent { width: 35px; height: 35px; background: radial-gradient(circle, rgba(255, 255, 200, 0.85) 0%, rgba(255, 215, 100, 0.55) 40%, rgba(255, 180, 50, 0.2) 65%, transparent 85%); }
    @keyframes fcw-lny-flare-pulse {
        0%, 100% { opacity: 0.6; transform: scale(1) translateZ(0); }
        50% { opacity: 1; transform: scale(1.2) translateZ(0); }
    }
    .fcw-lny-shimmer-sweep {
        position: absolute; inset: 0;
        background: linear-gradient(115deg, transparent 0%, transparent 35%, rgba(200, 50, 20, 0.04) 42%, rgba(255, 180, 80, 0.1) 48%, rgba(255, 215, 100, 0.15) 50%, rgba(255, 180, 80, 0.1) 52%, rgba(200, 50, 20, 0.04) 58%, transparent 65%, transparent 100%);
        background-size: 300% 100%; pointer-events: none;
        animation: fcw-lny-shimmer-sweep-anim 7s linear infinite;
        z-index: 5; mix-blend-mode: overlay;
    }
    @keyframes fcw-lny-shimmer-sweep-anim { 0% { background-position: 130% 0; } 100% { background-position: -30% 0; } }
    .fcw-lny-ray {
        position: absolute; top: 50%; left: 50%; width: 3px; height: 350px;
        background: linear-gradient(to top, rgba(255, 150, 50, 0.35) 0%, rgba(255, 100, 30, 0.2) 30%, rgba(200, 50, 20, 0.08) 60%, transparent 100%);
        transform-origin: bottom center; pointer-events: none; z-index: 3;
        filter: blur(2px); will-change: opacity;
        animation: fcw-lny-ray-pulse 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        animation-delay: var(--ray-delay);
    }
    @keyframes fcw-lny-ray-pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.85; } }
    .fcw-lny-edge-glow {
        position: absolute; inset: 0; border-radius: 12px; pointer-events: none; z-index: 6;
        box-shadow: inset 0 0 50px rgba(255, 100, 30, 0.15), inset 0 0 100px rgba(200, 50, 20, 0.08), inset 0 0 150px rgba(150, 30, 15, 0.04);
        will-change: opacity;
        animation: fcw-lny-edge-pulse 3.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    }
    @keyframes fcw-lny-edge-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
    .fcw-lny-sparkle {
        position: absolute; width: 5px; height: 5px;
        background: radial-gradient(circle, rgba(255, 215, 0, 1) 0%, rgba(255, 180, 50, 0.7) 50%, transparent 100%);
        border-radius: 50%; pointer-events: none; z-index: 5;
        box-shadow: 0 0 6px rgba(255, 215, 0, 0.9), 0 0 12px rgba(255, 150, 50, 0.6), 0 0 20px rgba(200, 80, 30, 0.3);
        will-change: transform, opacity;
        animation: fcw-lny-particle-float var(--float-duration) cubic-bezier(0.4, 0, 0.2, 1) infinite;
        animation-delay: var(--float-delay);
    }
    @keyframes fcw-lny-particle-float {
        0% { opacity: 0; transform: translateY(0) translateX(0) scale(0.4) translateZ(0); }
        15% { opacity: 1; }
        85% { opacity: 1; }
        100% { opacity: 0; transform: translateY(var(--drift-y)) translateX(var(--drift-x)) scale(1.3) translateZ(0); }
    }
    .fcw-lny-petal {
        position: absolute; width: 14px; height: 14px;
        background: radial-gradient(ellipse at 30% 30%, rgba(255, 200, 210, 0.95) 0%, rgba(255, 150, 180, 0.85) 40%, rgba(240, 100, 140, 0.7) 100%);
        border-radius: 14px 3px 14px 3px;
        box-shadow: 0 0 12px rgba(255, 150, 180, 0.6), 0 0 25px rgba(240, 100, 140, 0.3);
        pointer-events: none; z-index: 6; will-change: transform, opacity;
        animation: fcw-lny-petal-fall linear infinite;
        animation-delay: var(--petal-delay);
    }
    @keyframes fcw-lny-petal-fall {
        0% { opacity: 0; transform: translateY(-30px) rotate(0deg) translateX(0px); }
        8% { opacity: 0.9; }
        50% { transform: translateY(50vh) rotate(180deg) translateX(var(--petal-drift)); }
        88% { opacity: 0.9; }
        100% { opacity: 0; transform: translateY(110vh) rotate(400deg) translateX(calc(var(--petal-drift) * -0.5)); }
    }
    .fcw-lny-lantern {
        position: absolute; width: 36px; height: 52px; pointer-events: none; z-index: 4;
        will-change: transform, opacity;
        animation: fcw-lny-lantern-rise ease-in-out infinite;
        animation-delay: var(--lantern-delay);
    }
    .fcw-lny-lantern-body {
        position: absolute; width: 36px; height: 48px;
        background: radial-gradient(ellipse at 40% 30%, rgba(255, 80, 50, 0.95) 0%, rgba(220, 30, 20, 1) 50%, rgba(150, 15, 10, 1) 100%);
        border-radius: 18px;
        box-shadow: 0 0 30px rgba(255, 60, 30, 0.7), 0 0 60px rgba(200, 30, 15, 0.4), inset 0 -8px 12px rgba(0, 0, 0, 0.3), inset 0 8px 12px rgba(255, 160, 80, 0.2);
    }
    .fcw-lny-lantern-body::before {
        content: ''; position: absolute; top: 8px; left: 50%; transform: translateX(-50%);
        width: 24px; height: 32px; border: 1px solid rgba(255, 200, 50, 0.4); border-radius: 12px;
    }
    .fcw-lny-lantern-cap {
        position: absolute; top: -6px; left: 50%; transform: translateX(-50%);
        width: 18px; height: 7px; background: linear-gradient(180deg, #FFD700 0%, #B8860B 100%);
        border-radius: 3px 3px 0 0; box-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
    }
    .fcw-lny-lantern-tassel {
        position: absolute; bottom: -18px; left: 50%; transform: translateX(-50%);
        width: 6px; height: 18px; background: linear-gradient(180deg, #FFD700 0%, #DAA520 60%, #B8860B 100%);
        border-radius: 0 0 3px 3px;
    }
    .fcw-lny-lantern-tassel::after {
        content: ''; position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%);
        width: 10px; height: 6px; border-bottom: 2px solid rgba(255, 200, 50, 0.7); border-radius: 0 0 50% 50%;
    }
    @keyframes fcw-lny-lantern-rise {
        0% { transform: translateY(30px) scale(var(--lantern-scale, 1)) rotate(-3deg); opacity: 0; }
        15% { opacity: 0.95; }
        50% { transform: translateY(-55vh) scale(var(--lantern-scale, 1)) rotate(3deg); }
        85% { opacity: 0.95; }
        100% { transform: translateY(-115vh) scale(var(--lantern-scale, 1)) rotate(-3deg); opacity: 0; }
    }
    .fcw-lny-coin {
        position: absolute; width: 22px; height: 22px;
        background: radial-gradient(circle at 35% 30%, #fffbe6 0%, #FFD700 30%, #DAA520 70%, #B8860B 100%);
        border-radius: 50%; border: 2px solid rgba(255, 215, 0, 0.8);
        box-shadow: 0 0 12px rgba(255, 215, 0, 0.7), 0 0 25px rgba(255, 180, 50, 0.4);
        pointer-events: none; z-index: 4; will-change: transform, opacity;
        animation: fcw-lny-coin-fall linear infinite;
        animation-delay: var(--coin-delay);
    }
    .fcw-lny-coin::after {
        content: '\u798f'; position: absolute; top: 50%; left: 50%;
        transform: translate(-50%, -50%); color: #8B6914;
        font-size: 11px; font-weight: 900; text-shadow: 0 0 2px rgba(255, 215, 0, 0.5);
    }
    @keyframes fcw-lny-coin-fall {
        0% { opacity: 0; transform: translateY(-60px) rotateY(0deg) scale(0.8); }
        8% { opacity: 1; }
        88% { opacity: 1; }
        100% { opacity: 0; transform: translateY(110vh) rotateY(720deg) scale(1.1); }
    }
    .fcw-lny-sparkle-burst {
        position: absolute; border-radius: 50%; pointer-events: none; z-index: 7;
        background: radial-gradient(circle, rgba(255, 255, 200, 1) 0%, rgba(255, 215, 0, 0.9) 20%, rgba(255, 150, 50, 0.5) 50%, transparent 70%);
        box-shadow: 0 0 8px rgba(255, 215, 0, 0.9), 0 0 16px rgba(255, 150, 50, 0.5);
        opacity: 0; will-change: transform, opacity;
        animation: fcw-lny-sparkle-burst-anim var(--sparkle-duration) ease-out infinite;
        animation-delay: var(--sparkle-delay);
    }
    @keyframes fcw-lny-sparkle-burst-anim {
        0% { opacity: 0; transform: scale(0) translateZ(0); }
        20% { opacity: 1; transform: scale(1.3) translateZ(0); }
        40% { opacity: 1; transform: scale(0.9) translateZ(0); }
        100% { opacity: 0; transform: scale(0.3) translateZ(0); }
    }

    /* GOTW Moments Platinum Dust */
    .fcw-platinum-dust {
        position: absolute;
        inset: 0;
        z-index: 2;
        pointer-events: none;
        background-image: radial-gradient(white, rgba(255,255,255,.25) 1px, transparent 1.5px);
        background-size: 300px 300px;
        opacity: 0; /* Start invisible */
        will-change: opacity;
        transform: translateZ(0);
        /* Combine twinkle with INSTANT fade-in */
        animation: 
            fcw-fade-in-dust 1s ease-out forwards,
            fcw-stardust-twinkle 8s ease-in-out infinite alternate;
        animation-delay: 
            0s,
            0s;
    }

    /* REMOVED fcw-fade-in-delayed - no longer needed */

    /* GOTW Moments White Lens Flare - STATIC for performance */
    .fcw-white-flare {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 100vh;
        height: 100vh;
        background: radial-gradient(circle, 
            rgba(255, 255, 255, 0.12) 0%, 
            rgba(255, 255, 255, 0.04) 30%, 
            transparent 70%);
        transform: translate(-50%, -50%) translateZ(0);
        pointer-events: none;
        z-index: 1;
        opacity: 0; /* Start invisible */
        animation: fcw-fade-in-flare 1.2s ease-out forwards;
    }

    /* GOTW Moments Exclusive: Real 3D Canvas Ribbon */
    .fcw-ribbon-canvas {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 5;
    }

    /* ================================================= */
    /* --- WORLDS (GLOBAL TOURNAMENT) BACKGROUND --- */
    /* ================================================= */
    #fcw-card-modal.worlds-active {
        background: radial-gradient(ellipse at 50% 50%,
            rgba(45, 20, 70, 0.95) 0%,
            rgba(25, 10, 45, 0.98) 40%,
            rgba(15, 5, 30, 1) 70%,
            rgba(5, 2, 15, 1) 100%
        );
        backdrop-filter: blur(45px) saturate(180%) brightness(0.7) contrast(1.2) !important;
        -webkit-backdrop-filter: blur(45px) saturate(180%) brightness(0.7) contrast(1.2) !important;
    }

    #fcw-card-modal.worlds-active::before {
        background:
            /* Subtle purple ambient glows */
            radial-gradient(ellipse 60% 50% at 30% 25%, rgba(120, 60, 180, 0.2) 0%, transparent 60%),
            radial-gradient(ellipse 50% 50% at 70% 75%, rgba(80, 40, 150, 0.15) 0%, transparent 55%),
            radial-gradient(ellipse 40% 40% at 50% 50%, rgba(100, 50, 200, 0.12) 0%, transparent 50%),
            /* Gold accent glow at top */
            radial-gradient(ellipse 70% 30% at 50% 5%, rgba(255, 200, 100, 0.15) 0%, transparent 60%) !important;
    }

    /* Worlds Lock Indicator - Royal Purple & Gold */
    #fcw-card-modal.worlds-active .fcw-lock-indicator {
        background: linear-gradient(135deg, rgba(80, 40, 120, 0.9), rgba(120, 70, 180, 0.9));
        border: 1px solid rgba(200, 150, 255, 0.5);
        color: rgba(255, 230, 255, 1);
        text-shadow: 0 0 10px rgba(200, 150, 255, 0.8);
        box-shadow: 0 0 15px rgba(120, 60, 180, 0.6), 0 0 30px rgba(80, 40, 150, 0.3);
    }

    /* Worlds Scintillation - Purple & Gold Sparkles */
    #fcw-card-modal.worlds-active .fcw-scintilla-star {
        background: radial-gradient(circle, rgba(255, 255, 255, 1) 0%, rgba(200, 150, 255, 0.8) 30%, rgba(150, 100, 200, 0.5) 60%, transparent 70%) !important;
        box-shadow: 0 0 8px rgba(255, 255, 255, 0.9), 0 0 16px rgba(180, 120, 255, 0.6), 0 0 24px rgba(255, 200, 100, 0.3);
    }

    /* Worlds Ember Particles - Purple & Gold Luxury */
    .fcw-particle-ember.worlds-purple {
        background: radial-gradient(circle, rgba(180, 100, 255, 1), rgba(120, 60, 200, 0.8));
        box-shadow: 0 0 6px rgba(160, 80, 255, 0.8);
    }
    .fcw-particle-ember.worlds-gold {
        background: radial-gradient(circle, rgba(255, 215, 100, 1), rgba(200, 160, 50, 0.8));
        box-shadow: 0 0 6px rgba(255, 200, 80, 0.8);
    }
    .fcw-particle-ember.worlds-white {
        background: radial-gradient(circle, rgba(255, 255, 255, 1), rgba(220, 200, 255, 0.8));
        box-shadow: 0 0 4px rgba(255, 255, 255, 0.8);
    }

    /* ================================================= */
    /* --- WORLD CUP ICON 18 (PREMIUM MODERN) --- */
    /* ================================================= */
    #fcw-card-modal.iconwc18-active {
        background: 
            linear-gradient(rgba(10, 10, 20, 0.5), rgba(0, 0, 0, 0.8)),
            url('https://i.ibb.co/vCL3rCRw/Generated-Image-December-31-2025-11-44-PM.jpg') center center / cover no-repeat;
        /* Ensure image covers fully with a premium crop */
        background-color: #0d0d12;
        backdrop-filter: blur(15px) saturate(120%);
        -webkit-backdrop-filter: blur(15px) saturate(120%);
    }

    #fcw-card-modal.iconwc18-active::before {
        /* Subtle modern sheen overlay */
        background: linear-gradient(
            120deg,
            transparent 0%,
            rgba(255, 255, 255, 0.05) 40%,
            rgba(255, 255, 255, 0.1) 50%,
            rgba(255, 255, 255, 0.05) 60%,
            transparent 100%
        ) !important;
        background-size: 200% 100%;
        animation: fcw-iconwc18-sheen 8s ease-in-out infinite;
    }

    @keyframes fcw-iconwc18-sheen {
        0% { background-position: 250% 0; }
        100% { background-position: -200% 0; }
    }

    /* WC Icon Lock Indicator - Clean & Modern */
    #fcw-card-modal.iconwc18-active .fcw-lock-indicator {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: #fff;
        font-family: 'DIN Pro', sans-serif;
        text-transform: uppercase;
        letter-spacing: 2px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    }
    
    /* ================================================= */
    /* --- BLACK FRIDAY BACKGROUND --- */
    /* ================================================= */
    #fcw-card-modal.blackfriday-active {
        background: radial-gradient(ellipse at 50% 50%,
            rgba(20, 20, 25, 0.98) 0%,
            rgba(10, 10, 12, 1) 50%,
            rgba(5, 5, 8, 1) 100%
        );
        backdrop-filter: blur(40px) saturate(150%) brightness(0.6) contrast(1.3) !important;
        -webkit-backdrop-filter: blur(40px) saturate(150%) brightness(0.6) contrast(1.3) !important;
    }

    #fcw-card-modal.blackfriday-active::before {
        background:
            /* Gold accent glows */
            radial-gradient(ellipse 50% 40% at 30% 20%, rgba(255, 180, 50, 0.15) 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 70% 80%, rgba(255, 200, 80, 0.12) 0%, transparent 55%),
            /* Red accent touches */
            radial-gradient(ellipse 30% 30% at 80% 20%, rgba(200, 50, 50, 0.1) 0%, transparent 50%),
            radial-gradient(ellipse 25% 25% at 20% 80%, rgba(180, 40, 40, 0.08) 0%, transparent 50%) !important;
    }

    /* Black Friday Lock Indicator - Black & Gold Luxury */
    #fcw-card-modal.blackfriday-active .fcw-lock-indicator {
        background: linear-gradient(135deg, rgba(30, 30, 35, 0.95), rgba(50, 45, 40, 0.95));
        border: 1px solid rgba(255, 200, 100, 0.6);
        color: rgba(255, 220, 150, 1);
        text-shadow: 0 0 10px rgba(255, 200, 100, 0.8);
        box-shadow: 0 0 15px rgba(255, 180, 50, 0.4), 0 0 30px rgba(200, 150, 50, 0.2);
    }

    /* Black Friday Scintillation - Gold Sparkles */
    #fcw-card-modal.blackfriday-active .fcw-scintilla-star {
        background: radial-gradient(circle, rgba(255, 255, 255, 1) 0%, rgba(255, 220, 120, 0.9) 30%, rgba(255, 180, 50, 0.6) 60%, transparent 70%) !important;
        box-shadow: 0 0 8px rgba(255, 255, 255, 0.9), 0 0 16px rgba(255, 200, 80, 0.7), 0 0 24px rgba(255, 150, 50, 0.4);
    }

    /* Black Friday Ember Particles */
    .fcw-particle-ember.bf-gold {
        background: radial-gradient(circle, rgba(255, 215, 80, 1), rgba(200, 160, 40, 0.8));
        box-shadow: 0 0 6px rgba(255, 200, 60, 0.9);
    }
    .fcw-particle-ember.bf-red {
        background: radial-gradient(circle, rgba(220, 60, 60, 1), rgba(180, 40, 40, 0.8));
        box-shadow: 0 0 5px rgba(200, 50, 50, 0.8);
    }
    .fcw-particle-ember.bf-white {
        background: radial-gradient(circle, rgba(255, 255, 255, 1), rgba(255, 240, 200, 0.8));
        box-shadow: 0 0 4px rgba(255, 255, 255, 0.8);
    }

    /* --- BLACK FRIDAY EFFECTS CONTAINER --- */
    .fcw-blackfriday-container {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 3;
        overflow: hidden;
        /* 3D Perspective for realistic shard depth */
        perspective: 1200px;
        perspective-origin: 50% 50%;
        transform-style: preserve-3d;
    }

    /* ================================================= */
    /* --- TIME WARP: IMAGE BACKGROUND (GLARE) --- */
    /* ================================================= */
    #fcw-card-modal.time-warp-active {
        background: url('https://i.ibb.co/4RQLG9sC/Generated-Image-January-02-2026-7-00-PM.jpg') no-repeat center center;
        background-size: cover;
        overflow: hidden;
        /* PREVENT ALL MOVEMENT - Force Static */
        transition: opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1), backdrop-filter 0.8s ease !important;
        transform: none !important;
        background-position: center center !important;
        top: 0 !important;
        left: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        animation: none !important;
    }
    
    /* GLARE & SHINE OVERLAY */
    #fcw-card-modal.time-warp-active::before {
        content: '';
        position: absolute;
        inset: 0;
        background: 
            linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.05) 100%),
            radial-gradient(circle at 50% 30%, rgba(138, 43, 226, 0.1) 0%, transparent 60%);
        pointer-events: none;
        z-index: 1;
        mix-blend-mode: overlay;
    }


    /* TIME DISTORTION SCANLINES */
    .fcw-timewarp-scanlines {
        position: absolute;
        inset: 0;
        background: repeating-linear-gradient(
            0deg,
            transparent 0px,
            transparent 2px,
            rgba(138, 43, 226, 0.03) 2px,
            rgba(138, 43, 226, 0.03) 4px
        );
        animation: fcw-scanlines-move 0.1s linear infinite;
        z-index: 5;
        pointer-events: none;
        mix-blend-mode: overlay;
    }
    @keyframes fcw-scanlines-move {
        0% { transform: translateY(0); }
        100% { transform: translateY(4px); }
    }

    /* CARD CHROMATIC ABERRATION (Always On) */
    #fcw-card-modal.time-warp-active .fcw-cloned-card {
        filter: 
            drop-shadow(-2px 0 0 rgba(255, 0, 80, 0.3))
            drop-shadow(2px 0 0 rgba(0, 255, 255, 0.3));
        animation: fcw-card-chromatic 3s ease-in-out infinite;
    }
    @keyframes fcw-card-chromatic {
        0%, 100% { filter: drop-shadow(-2px 0 0 rgba(255, 0, 80, 0.3)) drop-shadow(2px 0 0 rgba(0, 255, 255, 0.3)); }
        50% { filter: drop-shadow(-3px 0 0 rgba(255, 0, 80, 0.5)) drop-shadow(3px 0 0 rgba(0, 255, 255, 0.5)); }
    }

    /* HEADSHOT GLITCH OVERLAY (Multi-Variant) */
    .fcw-headshot-glitch-overlay {
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 100%;
        pointer-events: none;
        z-index: 10;
        opacity: 0;
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        transition: opacity 0.2s; 
    }

    /* CONTINUOUS CHROMATIC GLITCH (Always Active) */
    .fcw-headshot-glitch-overlay.active {
        opacity: 1;
        animation: fcw-continuous-chroma 2s ease-in-out infinite;
    }
    @keyframes fcw-continuous-chroma {
        0%, 100% { 
            transform: translate(0, 0) scale(1); 
            filter: drop-shadow(-2px 0 rgba(255, 0, 80, 0.4)) drop-shadow(2px 0 rgba(0, 255, 255, 0.4)); 
            opacity: 0.5;
        }
        25% { 
            transform: translate(-1px, 0) scale(1.01); 
            filter: drop-shadow(-3px 0 rgba(255, 0, 80, 0.5)) drop-shadow(3px 0 rgba(0, 255, 255, 0.5)); 
            opacity: 0.6;
        }
        50% { 
            transform: translate(1px, 0) scale(1); 
            filter: drop-shadow(-1px 0 rgba(138, 43, 226, 0.4)) drop-shadow(1px 0 rgba(220, 20, 60, 0.4)); 
            opacity: 0.4;
        }
        75% { 
            transform: translate(0, -1px) scale(1.01); 
            filter: drop-shadow(-2px 0 rgba(255, 0, 80, 0.5)) drop-shadow(2px 0 rgba(0, 255, 255, 0.5)); 
            opacity: 0.55;
        }
    }


    /* SPECTRAL GEARS (Enhanced) */
    .fcw-spectral-gear-container {
        position: absolute;
        inset: 0;
        z-index: 2;
        overflow: hidden;
        pointer-events: none;
    }
    .fcw-spectral-gear {
        position: absolute;
        border-radius: 50%;
        border: 2px solid rgba(138, 43, 226, 0.2);
        box-shadow: 0 0 30px rgba(138, 43, 226, 0.1), inset 0 0 30px rgba(138, 43, 226, 0.05);
        animation: fcw-gear-spin linear infinite;
        will-change: transform;
    }
    .fcw-spectral-gear::before {
        content: '';
        position: absolute; inset: -15px;
        border-radius: 50%;
        background: repeating-conic-gradient(
            from 0deg,
            transparent 0deg 8deg,
            rgba(138, 43, 226, 0.15) 8deg 12deg
        );
    }
    .fcw-spectral-gear.gear-1 {
        width: 120vh; height: 120vh;
        top: -10vh; left: -10vh;
        border-color: rgba(138, 43, 226, 0.25);
        animation-duration: 45s;
    }
    .fcw-spectral-gear.gear-2 {
        width: 80vh; height: 80vh;
        bottom: -15vh; right: -15vh;
        border-color: rgba(220, 20, 60, 0.2);
        animation-duration: 35s;
        animation-direction: reverse;
    }
    .fcw-spectral-gear.gear-2::before {
        background: repeating-conic-gradient(
            from 0deg,
            transparent 0deg 6deg,
            rgba(220, 20, 60, 0.12) 6deg 10deg
        );
    }
    .fcw-spectral-gear.gear-3 {
        width: 50vh; height: 50vh;
        top: 30%; left: 30%;
        border-color: rgba(0, 255, 255, 0.15);
        animation-duration: 25s;
    }
    @keyframes fcw-gear-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    /* ENHANCED PARTICLES */
    .fcw-entropy-particle {
        position: absolute;
        width: 2px;
        height: 30px;
        border-radius: 2px;
        opacity: 0;
        z-index: 3;
        background: linear-gradient(to top, transparent, var(--p-color), transparent);
        box-shadow: 0 0 6px var(--p-color);
        animation: fcw-entropy-rise var(--p-duration) ease-out infinite;
        animation-delay: var(--p-delay);
        will-change: transform, opacity;
    }
    @keyframes fcw-entropy-rise {
        0% { transform: translateY(100vh) scaleY(0.5); opacity: 0; }
        15% { opacity: 1; }
        100% { transform: translateY(-20vh) scaleY(1.2); opacity: 0; }
    }

    /* Shine Glare Animation */
    #fcw-card-modal.time-warp-active::after {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 150%;
        height: 100%;
        background: linear-gradient(
            120deg, 
            transparent 0%, 
            transparent 40%, 
            rgba(255, 255, 255, 0.1) 45%, 
            rgba(255, 255, 255, 0.25) 50%, 
            rgba(255, 255, 255, 0.1) 55%, 
            transparent 60%, 
            transparent 100%
        );
        transform: skewX(-20deg);
        animation: fcw-shine-glare 6s ease-in-out infinite;
        pointer-events: none;
        z-index: 2;
        mix-blend-mode: overlay;
    }
    @keyframes fcw-shine-glare {
        0% { left: -150%; opacity: 0; }
        20% { opacity: 1; }
        50% { left: 150%; opacity: 0; }
        100% { left: 150%; opacity: 0; }
    }


    /* Gold Shimmer Sweep */
    .fcw-bf-shimmer {
        position: absolute;
        inset: 0;
        background: linear-gradient(
            110deg,
            transparent 0%,
            transparent 35%,
            rgba(255, 220, 100, 0.04) 42%,
            rgba(255, 200, 80, 0.1) 50%,
            rgba(255, 220, 100, 0.04) 58%,
            transparent 65%,
            transparent 100%
        );
        background-size: 300% 100%;
        animation: fcw-bf-shimmer-sweep 5s ease-in-out infinite;
        pointer-events: none;
    }

    @keyframes fcw-bf-shimmer-sweep {
        0% { background-position: 250% 0; }
        100% { background-position: -50% 0; }
    }

    /* Floating Sale Tags */
    /* --- GEOMETRIC LUXURY THEME --- */
    
    /* 1. Premium Obsidian Crystal Shards */
    .fcw-bf-shard {
        position: absolute;
        /* Multi-layer glass effect for realistic depth */
        background: 
            /* Top highlight edge */
            linear-gradient(160deg, rgba(255,255,255,0.15) 0%, transparent 20%),
            /* Core obsidian gradient */
            linear-gradient(135deg, 
                rgba(15,15,20,0.95) 0%, 
                rgba(5,5,8,0.98) 40%,
                rgba(20,18,25,0.95) 70%,
                rgba(10,10,15,0.98) 100%
            );
        /* Luxurious gold edge with glow */
        border: 1.5px solid rgba(255, 200, 100, 0.4);
        /* Complex shadow system for 3D realism */
        box-shadow: 
            /* Outer gold ambient glow */
            0 0 40px rgba(255, 180, 50, 0.15),
            0 0 80px rgba(255, 150, 0, 0.08),
            /* Inner depth shadows */
            inset 0 0 30px rgba(0,0,0,0.9),
            inset 2px 2px 10px rgba(255,255,255,0.05),
            /* Edge highlight */
            inset -1px -1px 3px rgba(255, 200, 100, 0.2);
        z-index: 1;
        opacity: 0;
        transform-style: preserve-3d;
        backface-visibility: hidden;
        will-change: transform, opacity;
        animation: fcw-bf-shard-float var(--float-duration, 15s) cubic-bezier(0.4, 0, 0.2, 1) infinite;
        animation-delay: var(--float-delay, 0s);
    }
    
    /* Glint/reflection layer */
    .fcw-bf-shard::before {
        content: '';
        position: absolute;
        inset: 0;
        /* Diagonal light streak */
        background: linear-gradient(
            125deg, 
            transparent 0%, 
            transparent 35%,
            rgba(255, 255, 255, 0.08) 45%,
            rgba(255, 220, 150, 0.12) 50%,
            rgba(255, 255, 255, 0.08) 55%,
            transparent 65%,
            transparent 100%
        );
        background-size: 300% 300%;
        animation: fcw-bf-glint 6s ease-in-out infinite;
        pointer-events: none;
    }
    
    /* Secondary shimmer layer */
    .fcw-bf-shard::after {
        content: '';
        position: absolute;
        inset: 2px;
        /* Subtle inner glow */
        background: radial-gradient(
            ellipse at 30% 20%,
            rgba(255, 200, 100, 0.08) 0%,
            transparent 50%
        );
        opacity: 0.8;
        pointer-events: none;
    }

    @keyframes fcw-bf-shard-float {
        0% { 
            transform: translate3d(0, 0, 0) rotate3d(1, 0.5, 0.5, 0deg) scale(0.9); 
            opacity: 0; 
        }
        15% { opacity: 0.9; }
        50% { 
            transform: translate3d(var(--move-x, 30px), var(--move-y, -30px), 80px) rotate3d(1, 0.5, 0.5, 180deg) scale(1); 
            opacity: 1; 
        }
        85% { opacity: 0.9; }
        100% { 
            transform: translate3d(0, 0, 0) rotate3d(1, 0.5, 0.5, 360deg) scale(0.9); 
            opacity: 0; 
        }
    }
    
    @keyframes fcw-bf-glint {
        0%, 100% { background-position: 0% 100%; }
        50% { background-position: 100% 0%; }
    }

    /* 2. Volumetric Searchlight Beams */
    .fcw-bf-beam {
        position: absolute;
        top: -50%;
        left: 50%;
        width: 200%;
        height: 200%;
        background: conic-gradient(
            from 180deg at 50% 50%, 
            transparent 0deg, 
            rgba(255, 215, 0, 0.05) 15deg, 
            rgba(255, 200, 100, 0.1) 30deg, 
            rgba(255, 215, 0, 0.05) 45deg, 
            transparent 60deg
        );
        transform-origin: 50% 50%;
        pointer-events: none;
        mix-blend-mode: screen;
        will-change: transform;
        animation: fcw-bf-beam-rotate var(--beam-duration, 20s) linear infinite;
        z-index: 2;
    }

    @keyframes fcw-bf-beam-rotate {
        0% { transform: translate(-50%, 0) rotate(0deg); }
        100% { transform: translate(-50%, 0) rotate(360deg); }
    }
    
    /* 3. Kinetic Vertical Lines (Scanner Effect) */
    .fcw-bf-kinetic-line {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 1px;
        background: linear-gradient(to bottom, transparent, rgba(255, 215, 0, 0.5), transparent);
        opacity: 0.3;
        z-index: 1;
        will-change: transform;
        animation: fcw-bf-scan var(--scan-duration, 5s) linear infinite;
    }
    
    @keyframes fcw-bf-scan {
        0% { transform: translateX(-100px); opacity: 0; }
        20% { opacity: 0.5; }
        80% { opacity: 0.5; }
        100% { transform: translateX(500px); opacity: 0; }
    }


    /* Luxury Gold Border Glow */
    .fcw-bf-border-glow {
        position: absolute;
        inset: 0;
        border: 2px solid transparent;
        background: linear-gradient(135deg, 
            rgba(255, 200, 80, 0.3) 0%,
            transparent 30%,
            transparent 70%,
            rgba(255, 180, 50, 0.2) 100%
        ) border-box;
        -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
        mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        animation: fcw-bf-border-pulse 4s ease-in-out infinite;
        pointer-events: none;
    }

    @keyframes fcw-bf-border-pulse {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 1; }
    }

    /* Dark Vignette */
    .fcw-bf-vignette {
        position: absolute;
        inset: 0;
        background: radial-gradient(
            ellipse 65% 65% at 50% 50%,
            transparent 30%,
            rgba(0, 0, 0, 0.6) 100%
        );
        pointer-events: none;
        z-index: 1;
    }

    /* --- WORLDS MAP CONTAINER --- */
    .fcw-worlds-map-container {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 3;
        overflow: hidden;
        opacity: 0.9;
    }

    /* --- REAL WORLD MAP (Static Image - GPU Optimized) --- */
    .fcw-map-wrapper {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) translateZ(0); /* Force GPU layer */
        width: max(100vw, 200vh);
        height: max(50vw, 100vh);
        pointer-events: none;
        will-change: transform; /* Hint for compositing */
    }

    .fcw-worlds-real-map {
        position: absolute;
        inset: 0;
        /* Use the PNG image directly as background - much faster than SVG mask */
        background-image: url('https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/World_map_blank_without_borders.svg/2000px-World_map_blank_without_borders.svg.png');
        background-size: 100% 100%;
        background-repeat: no-repeat;
        background-position: center;
        /* Apply purple tint via CSS filter - single pass, GPU accelerated */
        filter: sepia(1) saturate(3) hue-rotate(230deg) brightness(0.6);
        opacity: 0.85;
        transform: translateZ(0); /* Force GPU layer */
    }

    /* City Dots - Simplified for performance */
    .fcw-city-dot {
        position: absolute;
        width: 5px;
        height: 5px;
        background: radial-gradient(circle, #fff 30%, #ffd700 100%);
        border-radius: 50%;
        box-shadow: 0 0 8px #ffd700, 0 0 15px rgba(255, 200, 50, 0.6);
        z-index: 5;
        animation: fcw-city-pulse 3s ease-in-out infinite;
    }

    @keyframes fcw-city-pulse {
        0%, 100% { transform: scale(1); opacity: 0.9; }
        50% { transform: scale(1.3); opacity: 1; }
    }

    /* --- PREMIUM IMMERSIVE EFFECTS --- */
    
    /* Pulsing Glow Overlay - Adds depth and premium feel */
    .fcw-worlds-glow-pulse {
        position: absolute;
        inset: 0;
        background: radial-gradient(
            ellipse 80% 60% at 50% 40%,
            rgba(150, 100, 255, 0.15) 0%,
            rgba(100, 50, 180, 0.08) 40%,
            transparent 70%
        );
        animation: fcw-worlds-breathe 6s ease-in-out infinite;
        pointer-events: none;
        z-index: 2;
    }

    @keyframes fcw-worlds-breathe {
        0%, 100% { opacity: 0.6; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.05); }
    }

    /* Shimmer Sweep - Luxury shine effect */
    .fcw-worlds-shimmer {
        position: absolute;
        inset: 0;
        background: linear-gradient(
            105deg,
            transparent 0%,
            transparent 40%,
            rgba(255, 255, 255, 0.03) 45%,
            rgba(200, 170, 255, 0.08) 50%,
            rgba(255, 255, 255, 0.03) 55%,
            transparent 60%,
            transparent 100%
        );
        background-size: 300% 100%;
        animation: fcw-worlds-shimmer-sweep 8s ease-in-out infinite;
        pointer-events: none;
        z-index: 3;
    }

    @keyframes fcw-worlds-shimmer-sweep {
        0% { background-position: 250% 0; }
        100% { background-position: -50% 0; }
    }

    /* Vignette Edge - Cinematic focus */
    .fcw-worlds-vignette {
        position: absolute;
        inset: 0;
        background: radial-gradient(
            ellipse 70% 70% at 50% 50%,
            transparent 40%,
            rgba(20, 10, 40, 0.4) 100%
        );
        pointer-events: none;
        z-index: 4;
    }

    /* Floating Stars/Sparkles - Premium ambient */
    .fcw-worlds-star {
        position: absolute;
        width: 3px;
        height: 3px;
        background: white;
        border-radius: 50%;
        box-shadow: 0 0 6px white, 0 0 12px rgba(200, 170, 255, 0.8);
        animation: fcw-star-twinkle var(--twinkle-duration, 4s) ease-in-out infinite;
        animation-delay: var(--twinkle-delay, 0s);
        opacity: 0;
        z-index: 6;
    }

    @keyframes fcw-star-twinkle {
        0%, 100% { opacity: 0; transform: scale(0.5); }
        50% { opacity: 1; transform: scale(1.2); }
    }


    /* Continent pulse animation */
    @keyframes fcw-continent-pulse {
        0%, 100% {
            filter: drop-shadow(0 0 15px rgba(150, 100, 255, 0.5));
        }
        50% {
            filter: drop-shadow(0 0 25px rgba(180, 130, 255, 0.8)) drop-shadow(0 0 40px rgba(120, 80, 200, 0.4));
        }
    }

    /* Continent glow on interaction */
    .fcw-continent.glow-active {
        filter: drop-shadow(0 0 35px rgba(200, 150, 255, 1)) drop-shadow(0 0 60px rgba(150, 100, 255, 0.8)) !important;
        transform: scale(1.03);
    }

    .fcw-continent.glow-active .fcw-continent-fill {
        fill: url(#worlds-gradient-active);
        filter: drop-shadow(0 0 15px rgba(200, 180, 255, 0.9));
    }

    /* --- CONNECTING LINES (FLIGHT PATHS) --- */
    .fcw-flight-path {
        position: absolute;
        pointer-events: none;
        z-index: 2;
    }

    .fcw-flight-path-line {
        stroke: rgba(200, 150, 255, 0.3);
        stroke-width: 1;
        fill: none;
        stroke-dasharray: 8 4;
        animation: fcw-dash-flow 3s linear infinite;
        opacity: 0.6;
    }

    @keyframes fcw-dash-flow {
        0% { stroke-dashoffset: 0; }
        100% { stroke-dashoffset: -24; }
    }

    /* --- CITY DOTS ON CONTINENTS --- */
    .fcw-city-dot {
        position: absolute;
        width: 4px;
        height: 4px;
        background: radial-gradient(circle, rgba(255, 220, 150, 1) 0%, rgba(255, 180, 80, 0.8) 50%, transparent 70%);
        border-radius: 50%;
        opacity: 0;
        box-shadow: 0 0 8px rgba(255, 200, 100, 0.9), 0 0 16px rgba(255, 180, 80, 0.5);
        animation: fcw-city-blink var(--blink-duration) ease-in-out infinite;
        animation-delay: var(--blink-delay);
    }

    @keyframes fcw-city-blink {
        0%, 100% { opacity: 0.3; transform: scale(0.8); }
        50% { opacity: 1; transform: scale(1.2); box-shadow: 0 0 12px rgba(255, 200, 100, 1), 0 0 24px rgba(255, 180, 80, 0.7); }
    }

    /* --- ORBITING PARTICLES AROUND MAP --- */
    .fcw-orbit-particle {
        position: absolute;
        width: 3px;
        height: 3px;
        background: radial-gradient(circle, rgba(200, 150, 255, 1) 0%, rgba(150, 100, 255, 0.6) 50%, transparent 70%);
        border-radius: 50%;
        opacity: 0.8;
        box-shadow: 0 0 6px rgba(180, 130, 255, 0.8);
        animation: fcw-orbit-spin var(--orbit-duration) linear infinite;
        animation-delay: var(--orbit-delay);
        left: 50%;
        top: 50%;
        transform-origin: 0 0;
    }

    @keyframes fcw-orbit-spin {
        0% { transform: rotate(0deg) translateX(var(--orbit-radius)) rotate(0deg); }
        100% { transform: rotate(360deg) translateX(var(--orbit-radius)) rotate(-360deg); }
    }

    /* --- WORLDS AMBIENT GLOW LAYER --- */
    .fcw-worlds-glow-overlay {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 1;
        background: radial-gradient(ellipse 80% 80% at 50% 50%,
            rgba(100, 50, 180, 0.12) 0%,
            rgba(80, 30, 150, 0.08) 40%,
            transparent 70%
        );
        animation: fcw-worlds-ambient-pulse 6s ease-in-out infinite;
    }

    @keyframes fcw-worlds-ambient-pulse {
        0%, 100% {
            opacity: 0.8;
            transform: scale(1);
        }
        50% {
            opacity: 1;
            transform: scale(1.05);
        }
    }

    /* --- WORLDS GRID OVERLAY --- */
    .fcw-worlds-grid {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 2;
        opacity: 0.15;
        background-image:
            linear-gradient(rgba(150, 100, 255, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(150, 100, 255, 0.3) 1px, transparent 1px);
        background-size: 60px 60px;
        animation: fcw-grid-shift 20s linear infinite;
    }

    @keyframes fcw-grid-shift {
        0% { background-position: 0 0; }
        100% { background-position: 60px 60px; }
    }

    /* --- FUTMAS ICON (Christmas + Icon Fusion) BACKGROUND --- */
    #fcw-card-modal.futmas-icon-active {
        background: radial-gradient(ellipse at 50% 20%,
            rgba(40, 80, 50, 0.7) 0%,
            rgba(25, 35, 25, 0.85) 35%,
            rgba(15, 10, 5, 0.95) 70%,
            rgba(0, 0, 0, 1) 100%
        );
        backdrop-filter: blur(30px) saturate(140%) brightness(0.9) !important;
        -webkit-backdrop-filter: blur(30px) saturate(140%) brightness(0.9) !important;
    }

    #fcw-card-modal.futmas-icon-active::before {
        background:
            /* Golden glow spots */
            radial-gradient(ellipse at 30% 25%, rgba(255, 200, 80, 0.15) 0%, transparent 40%),
            radial-gradient(ellipse at 70% 30%, rgba(255, 180, 60, 0.12) 0%, transparent 35%),
            /* Subtle red Christmas accents */
            radial-gradient(ellipse at 15% 70%, rgba(180, 50, 50, 0.1) 0%, transparent 30%),
            radial-gradient(ellipse at 85% 75%, rgba(150, 40, 40, 0.08) 0%, transparent 30%),
            /* Top golden crown glow */
            radial-gradient(ellipse at 50% 5%, rgba(255, 215, 100, 0.2) 0%, transparent 45%) !important;
    }

    /* Futmas Icon Lock Indicator - Golden Christmas */
    #fcw-card-modal.futmas-icon-active .fcw-lock-indicator {
        background: linear-gradient(135deg, rgba(180, 140, 60, 0.95), rgba(220, 180, 80, 0.95));
        border: 1px solid rgba(255, 220, 120, 0.6);
        color: #fff;
        text-shadow: 0 0 8px rgba(255, 200, 80, 0.8);
        box-shadow: 0 0 15px rgba(255, 180, 60, 0.5), 0 0 30px rgba(255, 200, 80, 0.2);
    }

    /* Futmas Icon Scintillation - Golden Snow Sparkles */
    #fcw-card-modal.futmas-icon-active .fcw-scintilla-star {
        background: radial-gradient(circle, rgba(255, 255, 255, 1) 0%, rgba(255, 220, 120, 0.7) 30%, transparent 70%);
        box-shadow: 0 0 6px rgba(255, 255, 255, 0.9), 0 0 12px rgba(255, 200, 80, 0.5);
    }

    /* Futmas Icon Ember Particles - Gold & White */
    .fcw-particle-ember.futmas-icon-gold {
        background: radial-gradient(circle, rgba(255, 215, 100, 1), rgba(200, 160, 50, 0.8));
        box-shadow: 0 0 4px rgba(255, 200, 80, 0.8);
    }
    .fcw-particle-ember.futmas-icon-white {
        background: radial-gradient(circle, rgba(255, 255, 255, 1), rgba(220, 220, 230, 0.8));
        box-shadow: 0 0 4px rgba(255, 255, 255, 0.8);
    }

    /* --- FUTMAS ICON STRIPE (Travelling Luxury Sash) --- */
    #fcw-card-modal.futmas-icon-active::after {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        /* Fixed Gradient: Soft Black -> Elegant Gold -> Deep Red */
        /* Placed in the center of a wide transparent field for scrolling */
        background: linear-gradient(
            115deg,
            transparent 40%,
            rgba(20, 20, 25, 0.9) 46%,       /* Soft Black */
            rgba(109, 98, 5, 0.95) 50%,   /* Elegant Gold */
            rgba(112, 12, 24, 0.9) 54%,     /* Deep Red */
            transparent 60%
        );
        background-size: 300% 300%;
        /* Travel Animation: Seamless linear loop, Left to Right */
        animation: fcw-icon-travel 8s linear infinite;
        z-index: 2;
        pointer-events: none;
        mix-blend-mode: hard-light;
        opacity: 1 !important;
        filter: drop-shadow(0 0 8px rgba(199, 187, 83, 0.5));
    }

    /* Moves the gradient from Bottom-Right (100%) to Top-Left (0%) */
    /* Because bg is 300%, the center beam travels across the viewport */
    @keyframes fcw-icon-travel {
        0% { background-position: 100% 100%; }
        100% { background-position: 0% 0%; }
    }

    /* --- NEW YEARS OVERRIDE: Remove Rotating Light --- */
    #fcw-card-modal.newyears-active .fcw-effect-radiance,
    #fcw-card-modal.newyears-active .fcw-god-ray {
        display: none !important;
    }

    /* --- FUTMAS (CHRISTMAS) BACKGROUND --- */
    #fcw-card-modal.futmas-active {
        /* Richer Christmas Night: Deep green, warm red, midnight blue */
        background: radial-gradient(circle at 50% 30%,
            rgba(20, 60, 35, 0.7) 0%,    /* Richer Forest Green */
            rgba(80, 15, 25, 0.75) 35%,   /* Warmer Crimson */
            rgba(10, 15, 30, 0.95) 75%,   /* Deep Midnight */
            rgba(0, 0, 0, 1) 100%
        );
        backdrop-filter: blur(35px) saturate(150%) brightness(0.85) contrast(1.15) !important;
        -webkit-backdrop-filter: blur(35px) saturate(150%) brightness(0.85) contrast(1.15) !important;
    }

    #fcw-card-modal.futmas-active::before {
        /* Enhanced Festive Bokeh with more lights */
        background:
            radial-gradient(circle at 15% 15%, rgba(255, 50, 50, 0.2) 0%, transparent 40%),
            radial-gradient(circle at 85% 20%, rgba(0, 255, 100, 0.15) 0%, transparent 40%),
            radial-gradient(circle at 25% 75%, rgba(0, 200, 100, 0.12) 0%, transparent 35%),
            radial-gradient(circle at 75% 85%, rgba(255, 0, 50, 0.15) 0%, transparent 40%),
            radial-gradient(circle at 50% 5%, rgba(255, 215, 0, 0.2) 0%, transparent 50%),
            radial-gradient(circle at 10% 50%, rgba(255, 200, 100, 0.1) 0%, transparent 30%),
            radial-gradient(circle at 90% 50%, rgba(255, 200, 100, 0.1) 0%, transparent 30%) !important;
    }

    /* --- CHRISTMAS LIGHTS --- */
    .fcw-christmas-lights-container {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 100%;
        pointer-events: none;
        z-index: 8;
        overflow: hidden;
    }

    /* Animated glowing wire with physics sway */
    .fcw-light-wire {
        position: absolute;
        left: 0;
        width: 100%;
        height: 4px;
        background: linear-gradient(90deg, 
            transparent 0%,
            #0d3d0d 5%,
            #1a5c1a 50%,
            #0d3d0d 95%,
            transparent 100%
        );
        border-radius: 2px;
        box-shadow: 
            0 0 3px rgba(0, 100, 0, 0.4),
            0 1px 0 rgba(0, 0, 0, 0.3);
        animation: fcw-wire-glow 4s ease-in-out infinite, fcw-wire-sway 6s ease-in-out infinite;
        transform-origin: center center;
    }

    .fcw-light-wire.top { top: 3%; }
    .fcw-light-wire.bottom { bottom: 3%; animation-delay: 0.5s; }

    @keyframes fcw-wire-glow {
        0%, 100% { 
            box-shadow: 0 0 3px rgba(0, 100, 0, 0.4), 0 1px 0 rgba(0, 0, 0, 0.3);
            filter: brightness(1);
        }
        50% { 
            box-shadow: 0 0 8px rgba(0, 150, 0, 0.6), 0 0 15px rgba(0, 200, 0, 0.2), 0 1px 0 rgba(0, 0, 0, 0.3);
            filter: brightness(1.2);
        }
    }

    @keyframes fcw-wire-sway {
        0%, 100% { transform: translateY(0) scaleY(1); }
        25% { transform: translateY(2px) scaleY(1.1); }
        50% { transform: translateY(0) scaleY(1); }
        75% { transform: translateY(-1px) scaleY(0.95); }
    }

    .fcw-christmas-light {
        position: absolute;
        width: 10px;
        height: 14px;
        border-radius: 50% 50% 50% 50% / 55% 55% 45% 45%;
        opacity: 0;
        animation: 
            fcw-light-twinkle var(--twinkle-speed) ease-in-out infinite,
            fcw-light-swing var(--swing-speed, 3s) ease-in-out infinite;
        animation-delay: var(--twinkle-delay), var(--swing-delay, 0s);
        box-shadow: 
            0 0 8px var(--light-color), 
            0 0 16px var(--light-color), 
            0 0 24px var(--light-color),
            inset 0 -2px 4px rgba(0, 0, 0, 0.3);
        transform-origin: top center;
    }

    /* Light socket/cap */
    .fcw-christmas-light::before {
        content: '';
        position: absolute;
        top: -3px;
        left: 50%;
        transform: translateX(-50%);
        width: 6px;
        height: 4px;
        background: linear-gradient(to bottom, #444, #222);
        border-radius: 2px 2px 0 0;
    }

    /* Physics-based swing animation */
    @keyframes fcw-light-swing {
        0%, 100% { transform: rotate(0deg) translateY(0); }
        15% { transform: rotate(4deg) translateY(1px); }
        30% { transform: rotate(-3deg) translateY(0); }
        45% { transform: rotate(2deg) translateY(1px); }
        60% { transform: rotate(-2deg) translateY(0); }
        75% { transform: rotate(1deg) translateY(0.5px); }
        90% { transform: rotate(-0.5deg) translateY(0); }
    }

    .fcw-christmas-light.red { 
        background: radial-gradient(ellipse at 35% 25%, #ff8888 0%, #ff0000 40%, #aa0000 100%);
        --light-color: rgba(255, 50, 50, 0.7);
    }
    .fcw-christmas-light.green { 
        background: radial-gradient(ellipse at 35% 25%, #88ff88 0%, #00dd00 40%, #008800 100%);
        --light-color: rgba(50, 255, 50, 0.7);
    }
    .fcw-christmas-light.gold { 
        background: radial-gradient(ellipse at 35% 25%, #ffff99 0%, #ffd700 40%, #cc9900 100%);
        --light-color: rgba(255, 200, 50, 0.7);
    }
    .fcw-christmas-light.blue { 
        background: radial-gradient(ellipse at 35% 25%, #88aaff 0%, #0066ff 40%, #0044aa 100%);
        --light-color: rgba(50, 100, 255, 0.7);
    }
    .fcw-christmas-light.white { 
        background: radial-gradient(ellipse at 35% 25%, #ffffff 0%, #ffffee 40%, #ddddcc 100%);
        --light-color: rgba(255, 255, 255, 0.8);
    }

    @keyframes fcw-light-twinkle {
        0%, 100% { 
            opacity: 0.4; 
            filter: brightness(0.7);
        }
        50% { 
            opacity: 1; 
            filter: brightness(1.3);
        }
    }

    /* --- CHRISTMAS CURSOR TRAIL --- */
    .fcw-cursor-trail {
        position: fixed;
        pointer-events: none;
        z-index: 9999;
        opacity: 1;
        animation: fcw-cursor-fade 1s ease-out forwards;
    }

    .fcw-cursor-trail.snowflake {
        width: 12px;
        height: 12px;
        background: radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0.6) 40%, transparent 70%);
        border-radius: 50%;
        box-shadow: 0 0 6px rgba(255, 255, 255, 0.8), 0 0 12px rgba(200, 230, 255, 0.5);
        animation: fcw-cursor-fade 1.2s ease-out forwards, fcw-cursor-float 1.2s ease-out forwards;
    }

    .fcw-cursor-trail.sparkle {
        width: 8px;
        height: 8px;
        background: radial-gradient(circle, #ffd700 0%, rgba(255, 200, 0, 0.6) 50%, transparent 70%);
        border-radius: 50%;
        box-shadow: 0 0 8px rgba(255, 215, 0, 0.9), 0 0 16px rgba(255, 180, 0, 0.5);
        animation: fcw-cursor-fade 0.8s ease-out forwards, fcw-sparkle-burst 0.8s ease-out forwards;
    }

    .fcw-cursor-trail.star {
        width: 10px;
        height: 10px;
        background: conic-gradient(from 0deg, transparent 0deg, #fff 10deg, transparent 20deg, transparent 70deg, #fff 80deg, transparent 90deg, transparent 140deg, #fff 150deg, transparent 160deg, transparent 210deg, #fff 220deg, transparent 230deg, transparent 280deg, #fff 290deg, transparent 300deg, transparent 350deg, #fff 360deg);
        box-shadow: 0 0 6px rgba(255, 255, 255, 0.8);
        animation: fcw-cursor-fade 1s ease-out forwards, fcw-star-spin 1s linear forwards;
    }

    .fcw-cursor-trail.holly {
        width: 6px;
        height: 6px;
        background: radial-gradient(circle, #ff0000 0%, #cc0000 60%, transparent 70%);
        border-radius: 50%;
        box-shadow: 0 0 4px rgba(255, 0, 0, 0.7);
        animation: fcw-cursor-fade 0.9s ease-out forwards, fcw-cursor-float 0.9s ease-out forwards;
    }

    @keyframes fcw-cursor-fade {
        0% { opacity: 1; transform: scale(1); }
        100% { opacity: 0; transform: scale(0.3); }
    }

    @keyframes fcw-cursor-float {
        0% { transform: translateY(0) scale(1) rotate(0deg); }
        100% { transform: translateY(40px) scale(0.4) rotate(180deg); }
    }

    @keyframes fcw-sparkle-burst {
        0% { transform: scale(0.5); }
        30% { transform: scale(1.5); }
        100% { transform: scale(0); }
    }

    @keyframes fcw-star-spin {
        0% { transform: rotate(0deg) scale(1); }
        100% { transform: rotate(360deg) scale(0.2); }
    }

    .fcw-santa-container {
        position: absolute;
        inset: -50%; /* Allow movement outside bounds */
        pointer-events: none;
        z-index: 150; /* Between card and foreground */
        overflow: hidden;
        transform-style: preserve-3d;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .fcw-santa-sleigh-wrapper {
        position: absolute;
        width: 150px; height: 75px; /* Bigger Santa */
        /* Graceful figure-eight orbit */
        animation: fcw-santa-orbit-smooth 14s infinite linear;
        transform-origin: center center;
        will-change: transform;
    }

    .fcw-santa-sleigh-svg {
        width: 100%;
        height: 100%;
        background-image: url('${ASSETS.sleighSimple}');
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        /* Brighter Warm Glow */
        filter: drop-shadow(0 0 15px rgba(255, 250, 220, 0.9)) drop-shadow(0 0 4px rgba(255, 255, 255, 1));
    }

    /* The Figure-Eight Orbit Path */
    @keyframes fcw-santa-orbit-smooth {
        0% {
            transform: translate3d(-35vw, 15vh, -150px) rotateY(25deg) rotateZ(5deg) scale(0.7);
            opacity: 0;
        }
        8% { opacity: 1; }
        25% {
            transform: translate3d(0vw, 30vh, 100px) rotateY(0deg) rotateZ(0deg) scale(1.2);
             opacity: 1;
        }
        50% {
            transform: translate3d(40vw, -15vh, -150px) rotateY(-25deg) rotateZ(-5deg) scale(0.7);
             opacity: 0.8;
        }
        75% {
            transform: translate3d(0vw, -25vh, -250px) rotateY(0deg) rotateZ(0deg) scale(0.5);
            opacity: 0.6;
        }
        92% { opacity: 1; }
        100% {
            transform: translate3d(-35vw, 15vh, -150px) rotateY(25deg) rotateZ(5deg) scale(0.7);
            opacity: 0;
        }
    }


    /* --- SNOWFLAKES FOR FUTMAS --- */
    .fcw-snow-container {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 10;
        overflow: hidden;
    }

    .fcw-snowflake {
        position: absolute;
        top: -20px;
        background-color: white;
        border-radius: 50%;
        opacity: 0;
        pointer-events: none;
        will-change: transform;
        animation-name: fcw-snow-fall;
        animation-timing-function: linear;
        animation-iteration-count: infinite;
        filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.8));
    }

    .fcw-snowflake.shaped {
        background-color: transparent;
        background-image: url("${ASSETS.snowflake}");
        background-size: contain;
        background-repeat: no-repeat;
        border-radius: 0;
        filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.8));
    }

    @keyframes fcw-snow-fall {
        0% { transform: translate3d(var(--sway-start), -10vh, 0) rotate(0deg); opacity: 0; }
        10% { opacity: var(--max-opacity); }
        90% { opacity: var(--max-opacity); }
        100% { transform: translate3d(var(--sway-end), 110vh, 0) rotate(360deg); opacity: 0; }
    }

    /* --- HALLOWEEN BACKGROUND --- */
    #fcw-card-modal.halloween-active {
        background: radial-gradient(circle at center,
            rgba(40, 10, 50, 0.7) 0%,   /* Deep Purple */
            rgba(15, 5, 20, 0.9) 50%,   /* Very Dark Purple */
            rgba(0, 0, 0, 1) 100%       /* Black */
        );
        backdrop-filter: blur(50px) saturate(180%) contrast(1.15) !important;
        -webkit-backdrop-filter: blur(50px) saturate(180%) contrast(1.15) !important;
    }

    #fcw-card-modal.halloween-active::before {
        background:
            radial-gradient(ellipse 45% 45% at 20% 20%, rgba(255, 107, 0, 0.2) 0%, transparent 60%), /* Orange Top Left */
            radial-gradient(ellipse 40% 40% at 80% 80%, rgba(0, 255, 65, 0.15) 0%, transparent 60%),  /* Green Bottom Right */
            radial-gradient(ellipse 60% 50% at 50% -10%, rgba(138, 43, 226, 0.25) 0%, transparent 70%) !important; /* Purple Top */
    }

    /* --- FW ICON HALLOWEEN BACKGROUND --- */
    #fcw-card-modal.fw-icon-hw-active {
        background: 
            url('https://i.ibb.co/3mjvRdCg/Generated-Image-January-05-2026-6-50-PM-1.jpg') center 38% / 120% no-repeat !important;
        background-color: #0a0512 !important;
    }

    #fcw-card-modal.fw-icon-hw-active::before {
        background:
            radial-gradient(ellipse 45% 45% at 20% 20%, rgba(255, 107, 0, 0.15) 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 80% 80%, rgba(0, 255, 65, 0.1) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 50% -10%, rgba(138, 43, 226, 0.2) 0%, transparent 70%) !important;
    }

    /* FW Icon HW Lock Indicator */
    #fcw-card-modal.fw-icon-hw-active .fcw-lock-indicator {
        background: linear-gradient(135deg, rgba(255, 107, 0, 0.9), rgba(138, 43, 226, 0.9));
        border: 1px solid rgba(255, 255, 255, 0.5);
        color: white;
        text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
        box-shadow: 0 0 20px rgba(255, 107, 0, 0.6), 0 0 40px rgba(138, 43, 226, 0.3);
    }

    /* FW Icon HW Scintillation */
    #fcw-card-modal.fw-icon-hw-active .fcw-scintilla-star {
        background: radial-gradient(circle, rgba(255, 255, 255, 1) 0%, rgba(255, 150, 50, 0.8) 30%, transparent 70%);
        box-shadow: 0 0 8px rgba(255, 255, 255, 0.9), 0 0 16px rgba(255, 107, 0, 0.6), 0 0 24px rgba(138, 43, 226, 0.4);
    }

    /* --- FW ICON HW LUXURY WHITE GLOW EFFECTS (GPU Optimized + INSTANT LOAD) --- */
    .fcw-fwihw-container {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 5;
        overflow: hidden;
    }

    /* Ethereal White Glow Orbs - INSTANT VISIBLE */
    .fcw-fwihw-orb {
        position: absolute;
        border-radius: 50%;
        background: radial-gradient(circle at 30% 30%, 
            rgba(255, 255, 255, 0.95) 0%, 
            rgba(255, 255, 255, 0.6) 20%,
            rgba(255, 240, 220, 0.3) 50%, 
            transparent 70%
        );
        filter: blur(1px);
        pointer-events: none;
        opacity: 0.7;
        will-change: transform;
        transform: translateZ(0);
        animation: fcw-fwihw-orb-float var(--orb-duration) ease-in-out infinite;
        animation-delay: var(--orb-delay);
    }

    @keyframes fcw-fwihw-orb-float {
        0%, 100% { 
            opacity: 0.6; 
            transform: translateY(0) translateX(0) scale(1) translateZ(0); 
        }
        25% { 
            opacity: 0.95; 
            transform: translateY(var(--drift-y1)) translateX(var(--drift-x1)) scale(1.15) translateZ(0); 
        }
        50% { 
            opacity: 0.7; 
            transform: translateY(var(--drift-y2)) translateX(var(--drift-x2)) scale(1.05) translateZ(0); 
        }
        75% { 
            opacity: 1; 
            transform: translateY(var(--drift-y3)) translateX(var(--drift-x3)) scale(1.2) translateZ(0); 
        }
    }



    /* Iconic Center Glow (Spotlight on Card) - INSTANT VISIBLE */
    .fcw-fwihw-spotlight {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) translateZ(0);
        width: 500px;
        height: 700px;
        background: radial-gradient(ellipse at center,
            rgba(255, 255, 255, 0.18) 0%,
            rgba(255, 250, 240, 0.12) 25%,
            rgba(255, 245, 230, 0.06) 50%,
            transparent 70%
        );
        pointer-events: none;
        opacity: 1;
        will-change: transform;
        animation: fcw-fwihw-spotlight-pulse 3s ease-in-out infinite;
    }

    @keyframes fcw-fwihw-spotlight-pulse {
        0%, 100% { opacity: 0.85; transform: translate(-50%, -50%) scale(1) translateZ(0); }
        50% { opacity: 1; transform: translate(-50%, -50%) scale(1.08) translateZ(0); }
    }

    /* Luxury White Edge Glow - INSTANT */
    .fcw-fwihw-edge-glow {
        position: absolute;
        inset: 0;
        border-radius: 12px;
        pointer-events: none;
        opacity: 1;
        box-shadow:
            inset 0 0 80px rgba(255, 255, 255, 0.1),
            inset 0 0 150px rgba(255, 250, 240, 0.05);
        will-change: opacity;
        animation: fcw-fwihw-edge-pulse 2.5s ease-in-out infinite;
    }

    @keyframes fcw-fwihw-edge-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
    }

    /* Floating White Light Particles - INSTANT VISIBLE */
    .fcw-fwihw-particle {
        position: absolute;
        width: 4px;
        height: 4px;
        background: radial-gradient(circle, 
            rgba(255, 255, 255, 1) 0%, 
            rgba(255, 250, 245, 0.8) 40%, 
            transparent 70%
        );
        border-radius: 50%;
        pointer-events: none;
        opacity: 0.8;
        box-shadow: 0 0 8px rgba(255, 255, 255, 1), 0 0 16px rgba(255, 250, 240, 0.6);
        will-change: transform;
        animation: fcw-fwihw-particle-rise var(--particle-duration) ease-out infinite;
        animation-delay: var(--particle-delay);
    }

    @keyframes fcw-fwihw-particle-rise {
        0% { 
            opacity: 0.9; 
            transform: translateY(0) translateX(0) scale(1) translateZ(0); 
        }
        100% { 
            opacity: 0; 
            transform: translateY(var(--rise-y)) translateX(var(--drift-x)) scale(0.5) translateZ(0); 
        }
    }

    /* White Starburst Accents - INSTANT VISIBLE */
    .fcw-fwihw-starburst {
        position: absolute;
        width: 24px;
        height: 24px;
        background: conic-gradient(
            from 0deg,
            transparent 0deg,
            rgba(255, 255, 255, 0.9) 5deg,
            transparent 10deg,
            transparent 80deg,
            rgba(255, 255, 255, 0.7) 85deg,
            transparent 90deg,
            transparent 170deg,
            rgba(255, 255, 255, 0.9) 175deg,
            transparent 180deg,
            transparent 260deg,
            rgba(255, 255, 255, 0.7) 265deg,
            transparent 270deg,
            transparent 350deg,
            rgba(255, 255, 255, 0.9) 355deg,
            transparent 360deg
        );
        border-radius: 50%;
        pointer-events: none;
        opacity: 0.8;
        will-change: transform;
        animation: fcw-fwihw-starburst-twinkle var(--twinkle-duration) ease-in-out infinite;
        animation-delay: var(--twinkle-delay);
    }

    @keyframes fcw-fwihw-starburst-twinkle {
        0%, 100% { opacity: 0.5; transform: scale(0.9) rotate(0deg) translateZ(0); }
        50% { opacity: 1; transform: scale(1.4) rotate(45deg) translateZ(0); }
    }

    /* NEW: White Light Rays Radiating from Center */
    .fcw-fwihw-ray {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 3px;
        height: 400px;
        background: linear-gradient(to top, 
            rgba(255, 255, 255, 0.4) 0%, 
            rgba(255, 255, 255, 0.2) 30%, 
            rgba(255, 255, 255, 0.05) 60%, 
            transparent 100%);
        transform-origin: bottom center;
        pointer-events: none;
        opacity: 0.6;
        will-change: opacity;
        animation: fcw-fwihw-ray-pulse 2s ease-in-out infinite;
        animation-delay: var(--ray-delay);
    }

    @keyframes fcw-fwihw-ray-pulse {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 0.9; }
    }

    /* NEW: White Lens Flares */
    .fcw-fwihw-flare {
        position: absolute;
        border-radius: 50%;
        pointer-events: none;
        opacity: 0.7;
        will-change: transform;
        animation: fcw-fwihw-flare-pulse var(--flare-duration) ease-in-out infinite;
        animation-delay: var(--flare-delay);
    }

    .fcw-fwihw-flare.large {
        width: 120px;
        height: 120px;
        background: radial-gradient(circle,
            rgba(255, 255, 255, 0.5) 0%,
            rgba(255, 255, 255, 0.25) 30%,
            rgba(255, 250, 245, 0.1) 50%,
            transparent 70%
        );
        filter: blur(2px);
    }

    .fcw-fwihw-flare.medium {
        width: 60px;
        height: 60px;
        background: radial-gradient(circle,
            rgba(255, 255, 255, 0.7) 0%,
            rgba(255, 255, 255, 0.35) 40%,
            transparent 70%
        );
    }

    .fcw-fwihw-flare.small {
        width: 25px;
        height: 25px;
        background: radial-gradient(circle,
            rgba(255, 255, 255, 0.95) 0%,
            rgba(255, 255, 255, 0.5) 50%,
            transparent 80%
        );
    }

    @keyframes fcw-fwihw-flare-pulse {
        0%, 100% { opacity: 0.6; transform: scale(1) translateZ(0); }
        50% { opacity: 1; transform: scale(1.2) translateZ(0); }
    }

    /* NEW: Ambient White Mist */
    .fcw-fwihw-mist {
        position: absolute;
        border-radius: 50%;
        background: radial-gradient(ellipse at center,
            rgba(255, 255, 255, 0.15) 0%,
            rgba(255, 255, 255, 0.08) 40%,
            transparent 70%
        );
        pointer-events: none;
        opacity: 0.8;
        filter: blur(20px);
        will-change: transform;
        animation: fcw-fwihw-mist-drift var(--mist-duration) ease-in-out infinite;
        animation-delay: var(--mist-delay);
    }

    @keyframes fcw-fwihw-mist-drift {
        0%, 100% { 
            opacity: 0.6; 
            transform: translateX(0) translateY(0) scale(1) translateZ(0); 
        }
        50% { 
            opacity: 0.9; 
            transform: translateX(var(--mist-x)) translateY(var(--mist-y)) scale(1.1) translateZ(0); 
        }
    }

    /* NEW: Diamond Sparkles */
    .fcw-fwihw-diamond {
        position: absolute;
        width: 8px;
        height: 8px;
        background: white;
        transform: rotate(45deg);
        pointer-events: none;
        opacity: 0.9;
        box-shadow: 0 0 10px rgba(255, 255, 255, 1), 0 0 20px rgba(255, 255, 255, 0.7), 0 0 30px rgba(255, 255, 255, 0.4);
        will-change: transform, opacity;
        animation: fcw-fwihw-diamond-sparkle var(--diamond-duration) ease-in-out infinite;
        animation-delay: var(--diamond-delay);
    }

    @keyframes fcw-fwihw-diamond-sparkle {
        0%, 100% { opacity: 0.3; transform: rotate(45deg) scale(0.6) translateZ(0); }
        50% { opacity: 1; transform: rotate(45deg) scale(1.2) translateZ(0); }
    }

    /* --- BATS FOR HALLOWEEN --- */
    .fcw-bat-container {
        position: absolute;
        inset: -50%;
        pointer-events: none;
        z-index: 0;
        overflow: hidden;
    }

    .fcw-foreground-bat-container {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 200; /* Higher than card */
        overflow: hidden;
    }

    .fcw-bat-shape {
        width: 100%;
        height: 100%;
        background-image: url("${ASSETS.bat}");
        background-repeat: no-repeat;
        background-size: contain;
        transform-origin: center center;
        animation: fcw-bat-flap-real 0.12s cubic-bezier(0.45, 0, 0.55, 1) infinite alternate;
    }

    .fcw-bat-bg { position: absolute; will-change: transform; }
    .fcw-sleek-bat {
        position: absolute; top: 0; left: 0;
        z-index: 250; pointer-events: none;
        filter: drop-shadow(0 4px 6px rgba(0,0,0,0.8));
        will-change: transform;
        transform: translate(-100vw, -100vh);
    }

    @keyframes fcw-bat-flap-real {
        0% { transform: scaleY(1) skewX(0deg); }
        30% { transform: scaleY(0.7); }
        100% { transform: scaleY(-0.5) skewX(15deg); }
    }

    /* Bat Flight Paths */
    @keyframes fcw-flight-swoop {
        0% { opacity: 0; transform: translate(-10vw, -10vh) scale(0.5) rotate(20deg); }
        10% { opacity: 1; }
        40% { transform: translate(40vw, 40vh) scale(0.8) rotate(40deg); }
        60% { transform: translate(60vw, 20vh) scale(0.7) rotate(0deg); }
        90% { opacity: 1; }
        100% { opacity: 0; transform: translate(110vw, 10vh) scale(0.6) rotate(-10deg); }
    }
    @keyframes fcw-flight-hunt {
        0% { opacity: 0; transform: translate(110vw, 60vh) scale(0.6) rotate(-20deg); }
        10% { opacity: 1; }
        25% { transform: translate(80vw, 20vh) scale(0.7) rotate(-40deg); }
        50% { transform: translate(50vw, 50vh) scale(0.9) rotate(10deg); }
        75% { transform: translate(20vw, 30vh) scale(0.7) rotate(-20deg); }
        90% { opacity: 1; }
        100% { opacity: 0; transform: translate(-10vw, 60vh) scale(0.6) rotate(10deg); }
    }
    @keyframes fcw-flight-dive {
        0% { opacity: 0; transform: translate(50vw, -20vh) scale(0.4); }
        20% { opacity: 1; transform: translate(50vw, 10vh) scale(0.8); }
        40% { transform: translate(55vw, 40vh) scale(1.2) rotate(10deg); }
        60% { transform: translate(45vw, 70vh) scale(0.9) rotate(-10deg); }
        100% { opacity: 0; transform: translate(50vw, 120vh) scale(0.5); }
    }
    @keyframes fcw-flight-circle {
        0% { opacity: 0; transform: translate(20vw, 20vh) rotate(0deg) scale(0.6); }
        10% { opacity: 1; }
        25% { transform: translate(80vw, 10vh) rotate(10deg) scale(0.7); }
        50% { transform: translate(90vw, 80vh) rotate(0deg) scale(0.6); }
        75% { transform: translate(10vw, 90vh) rotate(-10deg) scale(0.7); }
        90% { opacity: 1; }
        100% { opacity: 0; transform: translate(20vw, 20vh) rotate(0deg) scale(0.6); }
    }
    @keyframes fcw-flight-cross-screen {
        0% { opacity: 0; transform: translate(-20vw, 40vh) scale(0.5) rotate(15deg); }
        5% { opacity: 1; }
        50% { transform: translate(50vw, 55vh) scale(1.0) rotate(0deg); }
        95% { opacity: 1; }
        100% { opacity: 0; transform: translate(120vw, 30vh) scale(0.5) rotate(-15deg); }
    }
    @keyframes fcw-flight-panic {
        0% { opacity: 0; transform: translate(30vw, 110vh) scale(0.4); }
        10% { opacity: 1; }
        20% { transform: translate(40vw, 80vh) rotate(-45deg); }
        40% { transform: translate(30vw, 50vh) rotate(45deg) scale(0.6); }
        60% { transform: translate(60vw, 40vh) rotate(-30deg); }
        80% { transform: translate(50vw, 10vh) rotate(30deg) scale(0.5); }
        100% { opacity: 0; transform: translate(60vw, -20vh); }
    }
    @keyframes fcw-flight-loop {
        0% { opacity: 0; transform: translate(80vw, -10vh) scale(0.5); }
        15% { opacity: 1; transform: translate(70vw, 30vh) scale(0.7) rotate(20deg); }
        40% { transform: translate(50vw, 60vh) scale(0.9) rotate(90deg); }
        60% { transform: translate(30vw, 40vh) scale(0.7) rotate(180deg); }
        100% { opacity: 0; transform: translate(10vw, -10vh) scale(0.4) rotate(270deg); }
    }
    @keyframes fcw-bat-jitter {
        0% { transform: translate(0,0); }
        25% { transform: translate(5px, -5px); }
        50% { transform: translate(-3px, 3px); }
        75% { transform: translate(2px, 5px); }
        100% { transform: translate(0,0); }
    }

    .fcw-fly-swoop { animation: fcw-flight-swoop var(--flight-duration) ease-in-out infinite; }
    .fcw-fly-hunt { animation: fcw-flight-hunt var(--flight-duration) ease-in-out infinite; }
    .fcw-fly-dive { animation: fcw-flight-dive var(--flight-duration) ease-in-out infinite; }
    .fcw-fly-circle { animation: fcw-flight-circle var(--flight-duration) linear infinite; }
    .fcw-fly-cross { animation: fcw-flight-cross-screen var(--flight-duration) linear infinite; }
    .fcw-fly-panic { animation: fcw-flight-panic var(--flight-duration) ease-in-out infinite; }
    .fcw-fly-loop { animation: fcw-flight-loop var(--flight-duration) linear infinite; }


    /* ================================================= */
    /* --- FC 26 ICON (WHITE GOLD LUXURY) --- */
    /* ================================================= */

    #fcw-card-modal.icon-26-active {
        /* Softened White Background (Lower Opacity) */
        background: radial-gradient(circle at center,
            rgba(255, 255, 255, 0.85) 0%,   /* Was 0.98 */
            rgba(248, 248, 252, 0.80) 40%,  /* Was 0.95 */
            rgba(235, 235, 240, 0.75) 80%,  /* Was 0.95 */
            rgba(220, 220, 230, 0.80) 100%  /* Was 0.98 */
        );
        /* OPTIMIZATION: Reduced blur radius from 50px to 30px */
        backdrop-filter: blur(30px) saturate(100%) brightness(1.05) contrast(0.95) !important;
        -webkit-backdrop-filter: blur(30px) saturate(100%) brightness(1.05) contrast(0.95) !important;
    }

    #fcw-card-modal.icon-26-active::before {
        /* Subtle Gold Hint in corners */
        background:
            radial-gradient(ellipse 90% 90% at 50% -20%, rgba(255, 223, 0, 0.1) 0%, transparent 70%),
            radial-gradient(circle at 100% 100%, rgba(212, 175, 55, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 0% 100%, rgba(212, 175, 55, 0.15) 0%, transparent 50%) !important;
        opacity: 1 !important;
    }

    /* Change Text Color for White Background */
    #fcw-card-modal.icon-26-active .fcw-modal-hint {
        color: rgba(140, 110, 50, 0.8) !important;
        text-shadow: none !important;
        font-weight: 600;
    }

    #fcw-card-modal.icon-26-active .fcw-lock-indicator {
        background: rgba(255, 255, 255, 0.5);
        border: 1px solid rgba(184, 134, 11, 0.4);
        color: rgba(184, 134, 11, 1);
        box-shadow: 0 4px 15px rgba(0,0,0,0.05);
    }

    /* GOD RAYS REMOVED for Cleaner Look */

    /* ================================================= */

    /* God Ray Animation Base (Still used for other potential effects but not Icon 26) */
    .fcw-god-ray {
        position: absolute;
        width: 150%;
        height: 150%;
        background: conic-gradient(
            from 0deg at 50% 50%,
            transparent 0deg,
            rgba(255, 223, 0, 0.05) 15deg,
            transparent 30deg,
            rgba(255, 255, 200, 0.03) 45deg,
            transparent 60deg
        );
        top: -25%; left: -25%;
        z-index: -5;
        pointer-events: none;
        animation: fcw-ray-spin 20s linear infinite;
        opacity: 0.6;
    }

    @keyframes fcw-ray-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }


    /* --- GOLD DREAM TEAM BACKGROUND --- */
    #fcw-card-modal.dream-active {
        background: radial-gradient(ellipse farthest-corner at center,
            rgba(255, 232, 115, 0.5) 0%,
            rgba(255, 215, 0, 0.4) 20%,
            rgba(218, 165, 32, 0.4) 45%,
            rgba(184, 134, 11, 0.5) 70%,
            rgba(80, 50, 20, 0.9) 100%
        );
        backdrop-filter: blur(60px) saturate(160%) brightness(0.75) contrast(1.05) !important;
        -webkit-backdrop-filter: blur(60px) saturate(160%) brightness(0.75) contrast(1.05) !important;
    }

    #fcw-card-modal.dream-active::before {
        background:
            radial-gradient(ellipse 50% 50% at 50% -10%, rgba(255, 245, 180, 0.3) 0%, transparent 70%),
            radial-gradient(ellipse 40% 40% at 0% 100%, rgba(255, 170, 50, 0.25) 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 100% 100%, rgba(255, 210, 80, 0.25) 0%, transparent 60%) !important;
    }

    /* --- SILVER DREAM TEAM BACKGROUND --- */
    #fcw-card-modal.silver-active {
        background: radial-gradient(ellipse farthest-corner at center,
            rgba(255, 255, 255, 0.5) 0%,
            rgba(220, 220, 220, 0.4) 20%,
            rgba(160, 160, 160, 0.4) 45%,
            rgba(119, 136, 153, 0.5) 70%,
            rgba(40, 45, 55, 0.9) 100%
        );
        backdrop-filter: blur(60px) saturate(110%) brightness(0.85) contrast(1.1) !important;
        -webkit-backdrop-filter: blur(60px) saturate(110%) brightness(0.85) contrast(1.1) !important;
    }

    #fcw-card-modal.silver-active::before {
        background:
            radial-gradient(ellipse 50% 50% at 50% -10%, rgba(255, 255, 255, 0.4) 0%, transparent 70%),
            radial-gradient(ellipse 40% 40% at 0% 100%, rgba(200, 200, 220, 0.25) 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 100% 100%, rgba(180, 180, 200, 0.25) 0%, transparent 60%) !important;
    }

    /* --- BRONZE DREAM TEAM BACKGROUND --- */
    #fcw-card-modal.bronze-active {
        background: radial-gradient(ellipse farthest-corner at center,
            rgba(113, 69, 57, 0.5) 0%,
            rgba(113, 69, 57, 0.4) 20%,
            rgba(80, 50, 40, 0.4) 45%,
            rgba(60, 35, 30, 0.5) 70%,
            rgba(30, 15, 10, 0.9) 100%
        );
        backdrop-filter: blur(60px) saturate(130%) brightness(0.8) contrast(1.1) !important;
        -webkit-backdrop-filter: blur(60px) saturate(130%) brightness(0.8) contrast(1.1) !important;
    }

    #fcw-card-modal.bronze-active::before {
        background:
            radial-gradient(ellipse 50% 50% at 50% -10%, rgba(200, 150, 140, 0.3) 0%, transparent 70%),
            radial-gradient(ellipse 40% 40% at 0% 100%, rgba(113, 69, 57, 0.3) 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 100% 100%, rgba(140, 90, 80, 0.3) 0%, transparent 60%) !important;
    }

    /* --- FW ICON (RED/BLACK/GOLD) BACKGROUND --- */
    #fcw-card-modal.fw-icon-active {
        background: radial-gradient(circle at center,
            rgba(80, 0, 0, 0.5) 0%,
            rgba(40, 0, 0, 0.8) 35%,
            rgba(10, 0, 0, 0.95) 70%,
            rgba(0, 0, 0, 1) 100%
        );
        backdrop-filter: blur(40px) saturate(140%) brightness(0.7) contrast(1.2) !important;
        -webkit-backdrop-filter: blur(40px) saturate(140%) brightness(0.7) contrast(1.2) !important;
    }

    #fcw-card-modal.fw-icon-active::before {
        background:
            radial-gradient(ellipse 60% 50% at 50% -10%, rgba(255, 0, 0, 0.2) 0%, transparent 70%),
            radial-gradient(ellipse 40% 40% at 0% 100%, rgba(255, 215, 0, 0.1) 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 100% 100%, rgba(200, 0, 0, 0.15) 0%, transparent 60%) !important;
    }

    /* --- RIBBON EFFECTS (Shared Animation) --- */
    .fcw-ribbon-container {
        position: absolute;
        inset: -50%;
        pointer-events: none;
        z-index: 0;
        transform-style: preserve-3d;
        overflow: hidden;
        /* FPS Fix: Force new stacking context */
        transform: translateZ(0);
    }

    .fcw-ribbon {
        position: absolute;
        opacity: 0.6;
        mix-blend-mode: hard-light;
        animation: fcw-ribbon-flow 8s infinite linear;
        /* FPS Fix: Hardware acceleration */
        will-change: transform;
    }

    /* FW ICON Ribbons */
    .fcw-ribbon.gold {
        background: linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.6), transparent);
        height: 150px;
        width: 200%;
        filter: blur(20px);
        transform: rotate(-35deg) translateY(-100px);
    }
    .fcw-ribbon.red {
        background: linear-gradient(90deg, transparent, rgba(200, 0, 0, 0.8), transparent);
        height: 200px;
        width: 200%;
        filter: blur(20px);
        animation-duration: 12s;
        animation-direction: reverse;
        transform: rotate(-35deg) translateY(100px);
    }
    .fcw-ribbon.thin-gold {
        background: linear-gradient(90deg, transparent, rgba(255, 255, 200, 0.9), transparent);
        height: 10px;
        width: 200%;
        filter: blur(4px);
        animation-duration: 5s;
        transform: rotate(-35deg);
        mix-blend-mode: overlay;
    }

    /* --- NEW: WHITE GOLD RIBBONS (FC 26 ICON) - OPTIMIZED --- */
    /* FPS FIX: REDUCED BLUR RADIUS & ADDED WILL-CHANGE */
    .fcw-ribbon.white-gold {
        background: linear-gradient(90deg, transparent, rgba(230, 230, 230, 0.6), rgba(255, 255, 255, 0.9), rgba(230, 230, 230, 0.6), transparent);
        height: 250px;
        width: 250%;
        mix-blend-mode: soft-light;
        filter: blur(1px); /* Reduced from 4px to 1px for performance */
        transform: rotate(-30deg) translateY(-80px);
        opacity: 0.7;
    }

    .fcw-ribbon.pure-gold {
        background: linear-gradient(90deg, transparent, rgba(218, 165, 32, 0.4), rgba(255, 215, 0, 0.8), rgba(218, 165, 32, 0.4), transparent);
        height: 180px;
        width: 250%;
        mix-blend-mode: normal;
        filter: blur(1px); /* Reduced from 2px to 1px */
        animation-direction: reverse;
        transform: rotate(-30deg) translateY(80px);
        opacity: 0.8;
    }

    .fcw-ribbon.platinum {
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
        height: 60px;
        width: 250%;
        mix-blend-mode: overlay;
        filter: blur(0px); /* Removed blur for performance */
        transform: rotate(-30deg);
        opacity: 0.9;
    }

    @keyframes fcw-ribbon-flow {
        0% { transform: rotate(-35deg) translate(-10%, -10%); }
        100% { transform: rotate(-35deg) translate(10%, 10%); }
    }

    /* ============================================= */
    /* 1920s AUTHENTIC VINTAGE FILM EFFECT */
    /* ============================================= */
    #fcw-card-modal.vintage-active {
        background: radial-gradient(ellipse at 50% 50%,
            rgba(25, 20, 15, 0.9) 0%,
            rgba(15, 12, 8, 0.95) 50%,
            rgba(5, 3, 0, 1) 100%
        );
        backdrop-filter: blur(20px) saturate(30%) brightness(0.4) contrast(1.3) !important;
        -webkit-backdrop-filter: blur(20px) saturate(30%) brightness(0.4) contrast(1.3) !important;
    }

    .fcw-vintage-filter-layer {
        filter: sepia(1) saturate(0.4) contrast(1.25) brightness(0.85);
        animation: fcw-film-flicker 0.1s steps(2) infinite;
    }

    @keyframes fcw-film-flicker {
        0% { filter: sepia(1) saturate(0.4) contrast(1.25) brightness(0.85); }
        25% { filter: sepia(1) saturate(0.4) contrast(1.25) brightness(0.82); }
        50% { filter: sepia(1) saturate(0.4) contrast(1.25) brightness(0.88); }
        75% { filter: sepia(1) saturate(0.4) contrast(1.25) brightness(0.80); }
        100% { filter: sepia(1) saturate(0.4) contrast(1.25) brightness(0.86); }
    }

    #fcw-card-modal.vintage-active::before {
        background:
            radial-gradient(ellipse 80% 60% at 50% 50%, rgba(150, 120, 70, 0.12) 0%, transparent 60%),
            radial-gradient(ellipse 30% 30% at 15% 85%, rgba(100, 70, 30, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse 30% 30% at 85% 85%, rgba(80, 60, 25, 0.08) 0%, transparent 50%) !important;
    }

    #fcw-card-modal.vintage-active .fcw-card-stage {
        animation: fcw-projector-shake 0.15s steps(1) infinite;
    }

    @keyframes fcw-projector-shake {
        0% { transform: translate(0, 0); }
        10% { transform: translate(0.5px, -1px); }
        20% { transform: translate(-1px, 0.5px); }
        30% { transform: translate(0, 0); }
        40% { transform: translate(0.5px, 0.5px); }
        50% { transform: translate(-0.5px, -0.5px); }
        60% { transform: translate(0, 0); }
        70% { transform: translate(1px, 0); }
        80% { transform: translate(-0.5px, 0.5px); }
        90% { transform: translate(0, -0.5px); }
        100% { transform: translate(0, 0); }
    }

    /* --- HEAVY FILM GRAIN --- */
    .fcw-film-grain {
        position: fixed;
        top: -50%; left: -50%;
        width: 200%; height: 200%;
        pointer-events: none;
        z-index: 1000010;
        opacity: 0.25;
        background-image: url("${ASSETS.heavyGrain}");
        background-size: 200px 200px;
        animation: fcw-grain-animate 0.05s steps(1) infinite;
        mix-blend-mode: multiply;
    }

    @keyframes fcw-grain-animate {
        0% { transform: translate(0, 0); }
        20% { transform: translate(-5%, -5%); }
        40% { transform: translate(5%, 5%); }
        60% { transform: translate(-2%, 3%); }
        80% { transform: translate(3%, -2%); }
        100% { transform: translate(0, 0); }
    }

    .fcw-film-grain-overlay {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        pointer-events: none;
        z-index: 1000011;
        opacity: 0.15;
        background-image: url("${ASSETS.noise}");
        background-size: 100px 100px;
        animation: fcw-grain-overlay 0.08s steps(1) infinite;
        mix-blend-mode: overlay;
    }

    @keyframes fcw-grain-overlay {
        0% { transform: translate(0, 0) scale(1); }
        33% { transform: translate(-3px, 2px) scale(1.01); }
        66% { transform: translate(2px, -3px) scale(0.99); }
        100% { transform: translate(0, 0) scale(1); }
    }

    .fcw-vignette-vintage {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        pointer-events: none;
        z-index: 1000001;
        background: radial-gradient(ellipse at center,
            transparent 20%,
            rgba(0, 0, 0, 0.2) 50%,
            rgba(0, 0, 0, 0.6) 80%,
            rgba(0, 0, 0, 0.9) 100%
        );
    }

    .fcw-film-artifacts {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        pointer-events: none;
        z-index: 1000005;
        overflow: hidden;
    }

    .fcw-film-hair {
        position: absolute;
        background: rgba(20, 15, 10, 0.7);
        transform-origin: center center;
        border-radius: 50% / 10%;
        opacity: 0;
        animation: fcw-hair-appear var(--duration) ease-in-out infinite;
        animation-delay: var(--delay);
    }

    @keyframes fcw-hair-appear {
        0%, 100% { opacity: 0; }
        5% { opacity: 0.8; }
        15% { opacity: 0.8; }
        20% { opacity: 0; }
    }

    .fcw-dust-blob {
        position: absolute;
        background: radial-gradient(ellipse at center,
            rgba(30, 25, 15, 0.9) 0%,
            rgba(30, 25, 15, 0.5) 50%,
            transparent 70%
        );
        border-radius: 50%;
        opacity: 0;
        animation: fcw-blob-flicker var(--flicker-time) steps(1) infinite;
        animation-delay: var(--delay);
    }

    @keyframes fcw-blob-flicker {
        0%, 100% { opacity: 0; }
        3% { opacity: 0.9; }
        6% { opacity: 0; }
        50% { opacity: 0; }
        53% { opacity: 0.7; }
        56% { opacity: 0; }
    }

    .fcw-white-speck {
        position: absolute;
        background: rgba(255, 250, 230, 0.9);
        border-radius: 50%;
        opacity: 0;
        animation: fcw-speck-flash var(--flash-time) steps(1) infinite;
        animation-delay: var(--delay);
    }

    @keyframes fcw-speck-flash {
        0%, 100% { opacity: 0; }
        2% { opacity: 1; }
        4% { opacity: 0; }
        60% { opacity: 0; }
        62% { opacity: 0.8; }
        64% { opacity: 0; }
    }

    .fcw-cigarette-burn {
        position: fixed;
        top: 10%;
        right: 10%;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: radial-gradient(circle at center,
            rgba(255, 250, 220, 0.95) 0%,
            rgba(255, 240, 180, 0.8) 30%,
            rgba(200, 150, 50, 0.4) 60%,
            transparent 70%
        );
        opacity: 0;
        z-index: 1000012;
        pointer-events: none;
        animation: fcw-burn-flash 12s ease-in-out infinite;
    }

    @keyframes fcw-burn-flash {
        0%, 100% { opacity: 0; transform: scale(0.8); }
        48% { opacity: 0; transform: scale(0.8); }
        50% { opacity: 1; transform: scale(1); }
        52% { opacity: 1; transform: scale(1.1); }
        54% { opacity: 0; transform: scale(0.9); }
    }

    .fcw-light-leak {
        position: fixed;
        pointer-events: none;
        z-index: 1000003;
        opacity: 0;
        filter: blur(30px);
        animation: fcw-leak-pulse var(--pulse-time) ease-in-out infinite;
        animation-delay: var(--delay);
    }

    @keyframes fcw-leak-pulse {
        0%, 100% { opacity: 0; }
        45% { opacity: 0; }
        50% { opacity: var(--max-opacity); }
        55% { opacity: 0; }
    }

    .fcw-frame-line {
        position: fixed;
        top: 0;
        height: 100%;
        width: 2px;
        background: linear-gradient(to bottom,
            transparent 0%,
            rgba(255, 250, 230, 0.1) 20%,
            rgba(255, 250, 230, 0.05) 50%,
            rgba(255, 250, 230, 0.1) 80%,
            transparent 100%
        );
        pointer-events: none;
        z-index: 1000002;
        opacity: 0.5;
    }

    .fcw-emulsion-scratch {
        position: absolute;
        background: linear-gradient(90deg,
            transparent 0%,
            rgba(255, 250, 240, 0.4) 45%,
            rgba(255, 250, 240, 0.6) 50%,
            rgba(255, 250, 240, 0.4) 55%,
            transparent 100%
        );
        height: 100%;
        width: 1px;
        opacity: 0;
        animation: fcw-scratch-flicker var(--scratch-time) steps(1) infinite;
        animation-delay: var(--delay);
    }

    @keyframes fcw-scratch-flicker {
        0%, 100% { opacity: 0; }
        1% { opacity: 0.6; }
        2% { opacity: 0; }
        30% { opacity: 0; }
        31% { opacity: 0.4; }
        32% { opacity: 0; }
        70% { opacity: 0; }
        71% { opacity: 0.5; }
        72% { opacity: 0; }
    }

    .fcw-water-stain {
        position: absolute;
        border-radius: 50%;
        background: radial-gradient(ellipse at center,
            rgba(60, 50, 30, 0.3) 0%,
            rgba(60, 50, 30, 0.15) 40%,
            transparent 70%
        );
        opacity: 0;
        animation: fcw-stain-appear var(--stain-time) ease-in-out infinite;
        animation-delay: var(--delay);
    }

    @keyframes fcw-stain-appear {
        0%, 100% { opacity: 0; }
        40% { opacity: 0; }
        45% { opacity: 0.6; }
        55% { opacity: 0.6; }
        60% { opacity: 0; }
    }

    .fcw-sprocket-edge {
        position: fixed;
        top: 0;
        height: 100%;
        width: 20px;
        background: repeating-linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0.95) 0px,
            rgba(0, 0, 0, 0.95) 15px,
            rgba(20, 15, 10, 0.9) 15px,
            rgba(20, 15, 10, 0.9) 25px
        );
        pointer-events: none;
        z-index: 1000000;
        animation: fcw-sprocket-jitter 0.2s steps(1) infinite;
    }

    .fcw-sprocket-edge.left {
        left: 0;
        transform-origin: left center;
    }

    .fcw-sprocket-edge.right {
        right: 0;
        transform-origin: right center;
    }

    @keyframes fcw-sprocket-jitter {
        0% { opacity: 0.3; transform: translateX(0); }
        25% { opacity: 0.5; transform: translateX(-2px); }
        50% { opacity: 0.2; transform: translateX(1px); }
        75% { opacity: 0.4; transform: translateX(-1px); }
        100% { opacity: 0.3; transform: translateX(0); }
    }

    .fcw-shutter-blackout {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0, 0, 0, 1);
        pointer-events: none;
        z-index: 1000020;
        opacity: 0;
        animation: fcw-shutter 0.08s steps(1) infinite;
    }

    @keyframes fcw-shutter {
        0%, 100% { opacity: 0; }
        50% { opacity: 0.03; }
    }

    .fcw-projector-hotspot {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 120%;
        height: 120%;
        background: radial-gradient(ellipse at center,
            rgba(255, 250, 220, 0.08) 0%,
            transparent 50%
        );
        pointer-events: none;
        z-index: 1000004;
        animation: fcw-hotspot-flicker 0.2s ease-in-out infinite;
    }

    @keyframes fcw-hotspot-flicker {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.85; }
    }

    /* ----------------------------------------------------- */
    /* STANDARD STYLES BELOW */
    /* ----------------------------------------------------- */

    #fcw-card-modal::after {
        content: "";
        position: absolute;
        inset: 0;
        opacity: 0.04;
        pointer-events: none;
        z-index: -1;
        background-image: url("${ASSETS.noise}");
        mix-blend-mode: overlay;
    }

    #fcw-card-modal.active {
        opacity: 1;
        pointer-events: auto;
    }

    #fcw-card-modal::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background:
            radial-gradient(ellipse 60% 60% at 50% -20%, rgba(255, 255, 255, 0.05) 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 20% 90%, rgba(100, 200, 255, 0.02) 0%, transparent 50%),
            radial-gradient(ellipse 40% 40% at 80% 90%, rgba(255, 150, 100, 0.02) 0%, transparent 50%);
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.8s ease 0.2s, background 0.8s ease;
        z-index: 0;
    }

    #fcw-card-modal.active::before {
          opacity: 1;
    }

    .fcw-ambient-particles {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 1;
        perspective: 1000px;
    }

    .fcw-card-stage {
        perspective: 2000px;
        perspective-origin: 50% 50%;
        position: relative;
        cursor: default;
        z-index: 100;
    }

    .fcw-3d-card {
        width: 100%;
        height: 100%;
        position: relative;
        transform-style: preserve-3d;
        transition: transform 0.08s ease-out;
        will-change: transform;
    }

    .fcw-card-wrapper {
        width: 100%;
        height: 100%;
        position: relative;
        transform-style: preserve-3d;
        border-radius: 16px;
        overflow: visible;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .fcw-cloned-card {
        position: relative !important;
        margin: 0 !important;
        transform-style: preserve-3d !important;
        border-radius: 16px;
        overflow: visible !important;
        image-rendering: -webkit-optimize-contrast;
        image-rendering: high-quality;
        transform: translateZ(0);
        will-change: transform;
    }

    .fcw-cloned-card * {
        transform-style: preserve-3d !important;
        backface-visibility: hidden;
    }

    .fcw-cloned-card {
        animation: fcw-card-reveal 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    @keyframes fcw-card-reveal {
        0% {
            opacity: 0;
            transform: scale(0.9) translateZ(0) rotateX(5deg);
            filter: blur(8px);
        }
        100% {
            opacity: 1;
            transform: scale(1) translateZ(0) rotateX(0deg);
            filter: blur(0);
        }
    }

    #fcw-card-modal.vintage-active .fcw-cloned-card {
        animation: fcw-card-reveal-vintage 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    @keyframes fcw-card-reveal-vintage {
        0% {
            opacity: 0;
            transform: scale(0.9) translateZ(0) rotateX(5deg);
        }
        100% {
            opacity: 1;
            transform: scale(1) translateZ(0) rotateX(0deg);
        }
    }

    /* ============================================= */
    /* 3D LAYER SYSTEM */
    /* ============================================= */
    .fcw-layer-player-dynamic {
        transform: translateZ(60px) scale(0.88) !important;
        filter:
            drop-shadow(0 5px 15px rgba(0,0,0,0.4))
            drop-shadow(0 15px 35px rgba(0,0,0,0.6)) !important;
        z-index: 20;
        transition: transform 0.15s ease-out, filter 0.15s ease-out;
    }

    .fcw-layer-icon-pop {
        transform: translateZ(30px) !important;
        filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4)) !important;
        z-index: 10;
    }

    .fcw-layer-flat {
        transform: translateZ(0px) !important;
        filter: none !important;
        z-index: 5;
    }

    .fcw-layer-base {
        transform: translateZ(0px) !important;
        z-index: 1;
    }

    /* ============================================= */
    /* FIFA 18 & 17 CARD LAYOUT FIX */
    /* Preserve original translateX(-50%) centering */
    /* ============================================= */
    .fcw-cloned-card .player-face18.fcw-layer-flat,
    .fcw-cloned-card .player-face17.fcw-layer-flat {
        transform: translateX(-50%) translateZ(0) !important;
    }
    .fcw-cloned-card .player-face18.fcw-layer-icon-pop,
    .fcw-cloned-card .player-face17.fcw-layer-icon-pop {
        transform: translateX(-50%) translateZ(30px) !important;
    }
    .fcw-cloned-card .player-face18.fcw-layer-player-dynamic,
    .fcw-cloned-card .player-face17.fcw-layer-player-dynamic {
        transform: translateX(-50%) translateZ(60px) scale(0.88) !important;
    }
    /* Also fix the name which uses translateX(-50%) */
    .fcw-cloned-card .name18,
    .fcw-cloned-card .name17 {
        transform: translateX(-50%) translateZ(0) !important;
    }

    /* ============================================= */
    /* SCINTILLATION EFFECT */
    /* ============================================= */
    .fcw-scintillation-field {
        position: absolute;
        inset: -20px;
        border-radius: 16px;
        z-index: 60;
        pointer-events: none;
        transform: translateZ(85px);
        mix-blend-mode: color-dodge;
        overflow: visible;
        will-change: transform;
    }

    .fcw-scintilla-star {
        position: absolute;
        width: var(--dims);
        height: var(--dims);
        clip-path: polygon(50% 0%, 53% 42%, 100% 50%, 53% 58%, 50% 100%, 47% 58%, 0% 50%, 47% 42%);
        /* Default Gold */
        background: radial-gradient(circle at center, #ffffff 0%, #fffbf0 20%, #f0e68c 60%, transparent 70%);
        opacity: 0;
        transform-origin: center center;
        animation: fcw-flash-sleek var(--duration) cubic-bezier(0.25, 1, 0.5, 1) infinite;
        animation-delay: var(--delay);
        transform: rotate(var(--rot));
    }

    /* Silver Star Variant */
    #fcw-card-modal.silver-active .fcw-scintilla-star {
        background: radial-gradient(circle at center, #ffffff 0%, #f0f0f5 20%, #c0c0d0 60%, transparent 70%) !important;
    }

    /* Bronze Star Variant (#714539 theme) */
    #fcw-card-modal.bronze-active .fcw-scintilla-star {
        background: radial-gradient(circle at center, #ffffff 0%, #ecdcd9 20%, #714539 60%, transparent 70%) !important;
    }

    /* FW Icon Star Variant (Gold with Red Hint) */
    #fcw-card-modal.fw-icon-active .fcw-scintilla-star {
          background: radial-gradient(circle at center, #ffffff 0%, #fff0f0 20%, #ffd700 60%, transparent 70%) !important;
    }

    /* FC 26 Icon Star Variant (High Brightness Champagne) */
    #fcw-card-modal.icon-26-active .fcw-scintilla-star {
          background: radial-gradient(circle at center, #ffffff 0%, #fffee0 20%, #ffd700 60%, transparent 70%) !important;
          filter: drop-shadow(0 0 5px rgba(255, 215, 0, 0.8));
    }

    /* Futmas Star Variant (Snowy White/Gold) */
    #fcw-card-modal.futmas-active .fcw-scintilla-star {
          background: radial-gradient(circle at center, #ffffff 0%, #e0fff4 20%, #ffd700 60%, transparent 70%) !important;
          filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.9));
    }

    @keyframes fcw-flash-sleek {
        0% { opacity: 0; transform: scale(0) rotate(var(--rot)); }
        10% { opacity: var(--intensity, 1); transform: scale(1.1) rotate(var(--rot)); }
        100% { opacity: 0; transform: scale(0.2) rotate(var(--rot)); }
    }

    /* ============================================= */
    /* PREMIUM EFFECTS */
    /* ============================================= */
    .fcw-particle-ember {
        position: absolute;
        bottom: -20px;
        width: 2px;
        height: 2px;
        background: radial-gradient(circle, #fff 40%, transparent 100%);
        border-radius: 50%;
        opacity: 0;
        z-index: 10;
        pointer-events: none;
        animation: fcw-ember-rise var(--rise-duration) ease-out infinite;
        animation-delay: var(--rise-delay);
        will-change: transform, opacity;
    }

    /* FW Icon Ember Colors */
    #fcw-card-modal.fw-icon-active .fcw-particle-ember.fw-red {
        background: radial-gradient(circle, #ff4040 30%, transparent 100%);
        width: 3px; height: 3px;
        box-shadow: 0 0 4px rgba(255,0,0,0.5);
    }
    #fcw-card-modal.fw-icon-active .fcw-particle-ember.fw-gold {
        background: radial-gradient(circle, #ffd700 30%, transparent 100%);
        box-shadow: 0 0 4px rgba(255,215,0,0.5);
    }

    /* Halloween Ember Colors */
    #fcw-card-modal.halloween-active .fcw-particle-ember.h-orange {
        background: radial-gradient(circle, #ff6b00 30%, transparent 100%);
        width: 3px; height: 3px;
        box-shadow: 0 0 5px rgba(255,107,0,0.6);
    }
    #fcw-card-modal.halloween-active .fcw-particle-ember.h-purple {
        background: radial-gradient(circle, #9d00ff 30%, transparent 100%);
        width: 3px; height: 3px;
        box-shadow: 0 0 5px rgba(157,0,255,0.6);
    }
    #fcw-card-modal.halloween-active .fcw-particle-ember.h-green {
        background: radial-gradient(circle, #00ff41 30%, transparent 100%);
        width: 2px; height: 2px;
        box-shadow: 0 0 5px rgba(0,255,65,0.6);
    }

    /* FC 26 ICON LUXURY EMBERS (Darker to show on White) */
    #fcw-card-modal.icon-26-active .fcw-particle-ember.i26-gold {
        background: radial-gradient(circle, #B8860B 40%, transparent 100%);
        width: 3px; height: 3px;
        box-shadow: none;
    }
    #fcw-card-modal.icon-26-active .fcw-particle-ember.i26-white {
        background: radial-gradient(circle, #fff 40%, transparent 100%);
        width: 2px; height: 2px;
        box-shadow: 0 0 2px rgba(0,0,0,0.1);
        mix-blend-mode: multiply;
    }
    #fcw-card-modal.icon-26-active .fcw-particle-ember.i26-champagne {
        background: radial-gradient(circle, #DAA520 40%, transparent 100%);
        width: 2px; height: 2px;
        box-shadow: none;
    }

    /* FUTMAS Sparkles (Red & Green) */
    #fcw-card-modal.futmas-active .fcw-particle-ember.fcw-sparkle-red {
        background: radial-gradient(circle, #ff0033 40%, transparent 100%);
        width: 3px; height: 3px;
        box-shadow: 0 0 4px rgba(255,0,51,0.6);
    }
    #fcw-card-modal.futmas-active .fcw-particle-ember.fcw-sparkle-green {
        background: radial-gradient(circle, #00ff66 40%, transparent 100%);
        width: 2px; height: 2px;
        box-shadow: 0 0 4px rgba(0,255,102,0.6);
    }

    @keyframes fcw-ember-rise {
        0% { transform: translateY(0) translateX(0); opacity: 0; }
        20% { opacity: var(--max-opacity); }
        100% { transform: translateY(-80vh) translateX(var(--drift)); opacity: 0; }
    }

    .fcw-effect-radiance {
        position: absolute;
        inset: -20px;
        z-index: -10;
        border-radius: 40px;
        background: conic-gradient(
            from var(--rotation-offset, 0deg),
            transparent 0deg,
            rgba(255, 255, 255, 0.1) 60deg,
            rgba(255, 255, 255, 0.3) 100deg,
            rgba(255, 255, 255, 0.1) 140deg,
            transparent 220deg
        );
        filter: blur(35px);
        transform: translateZ(-5px);
        animation: fcw-radiance-spin 12s linear infinite;
        opacity: 0.5;
        pointer-events: none;
        will-change: transform;
    }

    @keyframes fcw-radiance-spin {
        0% { transform: translateZ(-5px) rotate(0deg); }
        100% { transform: translateZ(-5px) rotate(360deg); }
    }

    .fcw-effect-ultra-shadow {
        position: absolute;
        inset: 10%;
        border-radius: 20px;
        background: rgba(0, 0, 0, 0.8);
        filter: blur(45px);
        z-index: -20;
        pointer-events: none;
        transform: translateZ(-60px) translateY(30px);
        opacity: 1;
    }

    .fcw-effect-particles {
        position: absolute;
        inset: 0;
        border-radius: 16px;
        overflow: hidden;
        z-index: 40;
        pointer-events: none;
        transform: translateZ(72px);
    }

    .fcw-particle {
        position: absolute;
        width: var(--size, 2px);
        height: var(--size, 2px);
        background: radial-gradient(circle, rgba(255, 255, 255, 0.6) 0%, transparent 70%);
        border-radius: 50%;
        animation: fcw-particle-float var(--duration, 4s) ease-in-out infinite;
        animation-delay: var(--delay, 0s);
        will-change: transform, opacity;
    }

    @keyframes fcw-particle-float {
        0%, 100% { opacity: 0; transform: translateY(0) scale(0.5); }
        50% { opacity: 1; }
        100% { opacity: 0; transform: translateY(-80px) scale(1); }
    }

    .fcw-effect-standard-shadow {
        position: absolute;
        inset: 8%;
        border-radius: 16px;
        background: rgba(0, 0, 0, 0.5);
        filter: blur(35px);
        z-index: -2;
        pointer-events: none;
        transform: translateZ(-20px) translateY(25px);
    }

    /* UI Hints */
    .fcw-modal-hint {
        position: absolute;
        bottom: 40px;
        color: rgba(255, 255, 255, 0.4);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
        font-size: 11px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 4px;
        pointer-events: none;
        transition: opacity 0.3s ease;
        z-index: 1000030;
    }

    #fcw-card-modal.vintage-active .fcw-modal-hint {
        color: rgba(180, 160, 120, 0.6);
        font-family: 'Times New Roman', Georgia, serif;
        letter-spacing: 6px;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
    }

    .fcw-modal-hint span { opacity: 0.5; margin: 0 8px; }

    .fcw-lock-indicator {
        position: absolute;
        top: 40px; right: 40px;
        padding: 6px 14px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        border-radius: 20px;
        color: rgba(255, 255, 255, 0.8);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 2px;
        opacity: 0;
        transform: translateY(-10px);
        transition: all 0.3s ease;
        pointer-events: none;
        z-index: 1000030;
    }

    #fcw-card-modal.vintage-active .fcw-lock-indicator {
        background: rgba(80, 60, 30, 0.4);
        border: 1px solid rgba(120, 100, 60, 0.3);
        color: rgba(200, 180, 140, 0.9);
        font-family: 'Times New Roman', Georgia, serif;
    }

    #fcw-card-modal.halloween-active .fcw-lock-indicator {
        background: rgba(100, 0, 150, 0.3);
        border: 1px solid rgba(180, 50, 255, 0.3);
        color: rgba(230, 200, 255, 0.9);
    }

    #fcw-card-modal.futmas-active .fcw-lock-indicator {
        background: rgba(0, 50, 20, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: rgba(255, 255, 255, 0.9);
        box-shadow: 0 0 10px rgba(0, 255, 0, 0.1);
    }

    /* --- NEW YEARS CARD BACKGROUND --- */
    #fcw-card-modal.newyears-active {
        background: radial-gradient(circle at 50% 30%,
            rgba(10, 10, 40, 0.85) 0%,
            rgba(5, 5, 25, 0.92) 40%,
            rgba(0, 0, 10, 0.98) 80%,
            rgba(0, 0, 5, 1) 100%
        );
        backdrop-filter: blur(40px) saturate(160%) brightness(0.8) contrast(1.15) !important;
        -webkit-backdrop-filter: blur(40px) saturate(160%) brightness(0.8) contrast(1.15) !important;
    }

    #fcw-card-modal.newyears-active::before {
        background:
            radial-gradient(circle at 20% 20%, rgba(255, 215, 0, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 30%, rgba(255, 100, 100, 0.12) 0%, transparent 50%),
            radial-gradient(circle at 50% 80%, rgba(100, 200, 255, 0.1) 0%, transparent 60%),
            radial-gradient(circle at 70% 70%, rgba(255, 0, 150, 0.08) 0%, transparent 50%) !important;
    }

    #fcw-card-modal.newyears-active .fcw-lock-indicator {
        background: rgba(255, 215, 0, 0.15);
        border: 1px solid rgba(255, 215, 0, 0.3);
        color: rgba(255, 215, 0, 0.9);
        box-shadow: 0 0 15px rgba(255, 215, 0, 0.2);
    }

    /* New Years Star Variant (Golden Celebration) */
    #fcw-card-modal.newyears-active .fcw-scintilla-star {
        background: radial-gradient(circle at center, #ffffff 0%, #fff8dc 20%, #ffd700 60%, transparent 70%) !important;
        filter: drop-shadow(0 0 6px rgba(255, 215, 0, 0.9));
    }

    /* --- FIREWORKS CONTAINER --- */
    .fcw-fireworks-container {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 5;
        overflow: hidden;
        perspective: 1000px;
    }

    /* Firework rocket trail */
    .fcw-firework-rocket {
        position: absolute;
        width: 3px;
        height: 20px;
        background: linear-gradient(to bottom, rgba(255, 255, 255, 0.9), rgba(255, 200, 100, 0.6), transparent);
        border-radius: 50%;
        opacity: 0;
        will-change: transform;
        animation: fcw-rocket-launch var(--launch-duration) ease-out forwards;
        animation-delay: var(--launch-delay);
    }

    .fcw-firework-rocket::after {
        content: '';
        position: absolute;
        bottom: -5px;
        left: 50%;
        transform: translateX(-50%);
        width: 6px;
        height: 10px;
        background: radial-gradient(ellipse, rgba(255, 150, 50, 0.9), rgba(255, 100, 0, 0.5), transparent);
        border-radius: 50%;
        filter: blur(2px);
    }

    @keyframes fcw-rocket-launch {
        0% { transform: translateY(110vh); opacity: 0; }
        5% { opacity: 1; }
        90% { opacity: 1; }
        100% { transform: translateY(var(--burst-height)); opacity: 0; }
    }

    /* Firework burst particle */
    .fcw-firework-burst {
        position: absolute;
        pointer-events: none;
        will-change: transform, opacity;
    }

    .fcw-burst-particle {
        position: absolute;
        width: var(--particle-size);
        height: var(--particle-size);
        background: var(--particle-color);
        border-radius: 50%;
        opacity: 0;
        box-shadow: 0 0 6px var(--particle-glow), 0 0 12px var(--particle-glow);
        animation: fcw-burst-expand var(--burst-duration) ease-out forwards;
        animation-delay: var(--burst-delay);
    }

    @keyframes fcw-burst-expand {
        0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
        }
        20% {
            opacity: 1;
        }
        100% {
            transform: translate(var(--end-x), var(--end-y)) scale(0.3);
            opacity: 0;
        }
    }

    /* Glitter trail effect */
    .fcw-burst-particle.glitter {
        animation: fcw-burst-glitter var(--burst-duration) ease-out forwards;
        animation-delay: var(--burst-delay);
    }

    @keyframes fcw-burst-glitter {
        0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
        }
        30% { opacity: 1; }
        50% { opacity: 0.3; }
        70% { opacity: 0.8; }
        100% {
            transform: translate(var(--end-x), calc(var(--end-y) + 80px)) scale(0.1);
            opacity: 0;
        }
    }

    /* Sparkle effect around card */
    .fcw-newyear-sparkle {
        position: absolute;
        width: 4px;
        height: 4px;
        background: rgba(255, 215, 0, 0.9);
        border-radius: 50%;
        opacity: 0;
        box-shadow: 0 0 8px rgba(255, 215, 0, 0.8), 0 0 16px rgba(255, 215, 0, 0.4);
        animation: fcw-sparkle-twinkle var(--twinkle-duration) ease-in-out infinite;
        animation-delay: var(--twinkle-delay);
    }

    @keyframes fcw-sparkle-twinkle {
        0%, 100% { opacity: 0; transform: scale(0.5); }
        50% { opacity: 1; transform: scale(1.2); }
    }

    /* Golden confetti */
    .fcw-confetti {
        position: absolute;
        width: var(--confetti-width);
        height: var(--confetti-height);
        background: var(--confetti-color);
        opacity: 0;
        will-change: transform;
        animation: fcw-confetti-fall var(--fall-duration) ease-in-out infinite;
        animation-delay: var(--fall-delay);
    }

    @keyframes fcw-confetti-fall {
        0% {
            transform: translateY(-10vh) rotate(0deg);
            opacity: 0;
        }
        10% { opacity: 0.9; }
        90% { opacity: 0.9; }
        100% {
            transform: translateY(110vh) rotate(720deg);
            opacity: 0;
        }
    }

    /* New Years ember particles */
    #fcw-card-modal.newyears-active .fcw-particle-ember.ny-gold {
        background: radial-gradient(circle, #ffd700 30%, transparent 100%);
        width: 3px; height: 3px;
        box-shadow: 0 0 6px rgba(255, 215, 0, 0.7);
    }
    #fcw-card-modal.newyears-active .fcw-particle-ember.ny-silver {
        background: radial-gradient(circle, #ffffff 40%, transparent 100%);
        width: 2px; height: 2px;
        box-shadow: 0 0 4px rgba(255, 255, 255, 0.6);
    }
    #fcw-card-modal.newyears-active .fcw-particle-ember.ny-red {
        background: radial-gradient(circle, #ff4040 30%, transparent 100%);
        width: 2px; height: 2px;
        box-shadow: 0 0 4px rgba(255, 64, 64, 0.6);
    }

    .fcw-lock-indicator.visible {
        opacity: 1;
        transform: translateY(0);
    }

    /* --- BALLON D'OR WINNER BACKGROUND & EFFECTS --- */
    #fcw-card-modal.bdor-winner-active {
        background: 
            url('https://i.ibb.co/kgkDNBW3/Generated-Image-January-06-2026-5-52-PM.jpg') center 43% / cover no-repeat !important;
        background-color: #0a0812 !important;
    }

    /* --- BALLON D'OR RUNNER-UP BACKGROUND --- */
    #fcw-card-modal.bdor-runnerup-active {
        background: 
            url('https://i.ibb.co/kgLhbSBm/Generated-Image-January-07-2026-4-41-PM.jpg') center 43% / cover no-repeat !important;
        background-color: #0a0812 !important;
    }

    /* --- BALLON D'OR THIRD PLACE BACKGROUND --- */
    #fcw-card-modal.bdor-third-active {
        background: 
            url('https://i.ibb.co/NnpLYVqj/Generated-Image-January-07-2026-4-45-PM.jpg') center 43% / cover no-repeat !important;
        background-color: #0a0812 !important;
    }

    /* --- BDDT GOLD WINNER BACKGROUND --- */
    #fcw-card-modal.bddt-gold-active {
        background: 
            url('https://i.ibb.co/HTtdMnb6/Generated-Image-January-13-2026-5-06-PM-1.jpg') center 43% / cover no-repeat !important;
        background-color: #0a0812 !important;
    }

    /* --- BDDT SILVER BACKGROUND --- */
    #fcw-card-modal.bddt-silver-active {
        background: 
            url('https://i.ibb.co/RkYsnK4w/Generated-Image-January-13-2026-5-02-PM-1.jpg') center 43% / cover no-repeat !important;
        background-color: #0a0812 !important;
    }

    /* --- BDDT BRONZE BACKGROUND --- */
    #fcw-card-modal.bddt-bronze-active {
        background: 
            url('https://i.ibb.co/0yL2Q7L1/Generated-Image-January-13-2026-5-01-PM-1.jpg') center 43% / cover no-repeat !important;
        background-color: #0a0812 !important;
    }

    /* --- BDDT SET REWARD EXTREME BACKGROUND --- */
    #fcw-card-modal.bddt-extreme-active {
        background: 
            url('https://i.ibb.co/yFzHYr9h/Generated-Image-January-13-2026-5-08-PM-1.jpg') center 43% / cover no-repeat !important;
        background-color: #0a0812 !important;
    }
    #fcw-card-modal.bddt-extreme-active::before {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(ellipse 50% 50% at 50% 50%, rgba(0, 255, 100, 0.1) 0%, transparent 70%);
        pointer-events: none;
        animation: fcw-bddt-green-pulse 4s infinite ease-in-out;
    }

    /* --- BDDT SET REWARD BACKGROUND --- */
    #fcw-card-modal.bddt-reward-active {
        background: 
            url('https://i.ibb.co/5gFTy0BC/Generated-Image-January-13-2026-5-10-PM-1.jpg') center 43% / cover no-repeat !important;
        background-color: #0a0812 !important;
    }
    #fcw-card-modal.bddt-reward-active::before {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(ellipse 50% 50% at 50% 50%, rgba(155, 48, 255, 0.1) 0%, transparent 70%);
        pointer-events: none;
        animation: fcw-bddt-purple-pulse 4s infinite ease-in-out;
    }

    /* ============================================= */
    /* BDDT REAL DOM ELEMENTS (SPOTLIGHT & SHIMMER) */
    /* ============================================= */
    
    .fcw-bddt-spotlight {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 1000px;
        height: 1000px;
        transform: translate(-50%, -50%) translateZ(0);
        background: var(--spotlight-gradient, radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%));
        animation: fcw-bddt-spotlight-pulse 4s infinite ease-in-out;
        pointer-events: none;
        z-index: 1;
        display: block !important;
        opacity: 0.8;
        mix-blend-mode: screen; 
    }

    .fcw-bddt-shimmer-sweep-layer {
        position: absolute;
        inset: 0;
        background: var(--shimmer-gradient);
        background-size: 300% 100%;
        background-repeat: no-repeat !important;
        pointer-events: none;
        animation: fcw-bddt-shimmer-sweep 6.5s linear infinite;
        z-index: 2;
        display: block !important;
        mix-blend-mode: overlay; /* Better blending for shimmer */
    }

    @keyframes fcw-bddt-spotlight-pulse {
        0%, 100% { opacity: 0.6; transform: translate(-50%,-50%) scale(1); }
        50% { opacity: 1; transform: translate(-50%,-50%) scale(1.15); }
    }

    @keyframes fcw-bddt-shimmer-sweep {
        0% { background-position: 130% 0; }
        100% { background-position: -30% 0; }
    }

    /* Force enable legacy classes if used */
    .fcw-bddt-extreme-spotlight,
    .fcw-bddt-reward-spotlight,
    .fcw-bddt-gold-spotlight,
    .fcw-bddt-silver-spotlight,
    .fcw-bddt-bronze-spotlight {
        display: block !important; 
    }
    
    /* === BDDT BRONZE - Shimmer & Spotlight === */
    #fcw-card-modal.bddt-bronze-active::before {
        content: '' !important;
        position: absolute !important;
        inset: 0 !important;
        background: radial-gradient(ellipse 60% 60% at 50% 50%, rgba(210, 140, 70, 0.2) 0%, rgba(185, 115, 55, 0.1) 40%, transparent 70%) !important;
        pointer-events: none !important;
        animation: fcw-bddt-bronze-pulse 4s infinite ease-in-out !important;
        z-index: 1 !important;
        opacity: 1 !important;
        mix-blend-mode: normal !important;
    }
    #fcw-card-modal.bddt-bronze-active::after {
        content: '' !important;
        position: absolute !important;
        inset: 0 !important;
        background: linear-gradient(
            115deg,
            transparent 0%,
            transparent 35%,
            rgba(225, 160, 90, 0.06) 42%,
            rgba(240, 180, 110, 0.12) 48%,
            rgba(255, 210, 150, 0.18) 50%,
            rgba(240, 180, 110, 0.12) 52%,
            rgba(225, 160, 90, 0.06) 58%,
            transparent 65%,
            transparent 100%
        ) !important;
        background-size: 300% 100% !important;
        pointer-events: none !important;
        animation: fcw-bddt-shimmer-sweep 6.5s linear infinite !important;
        z-index: 2 !important;
        opacity: 1 !important;
        mix-blend-mode: normal !important;
    }
    @keyframes fcw-bddt-bronze-pulse {
        0%, 100% { opacity: 0.6; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.07); }
    }
    
    /* === BDDT EXTREME - Shimmer (already has ::before spotlight) === */
    #fcw-card-modal.bddt-extreme-active::after {
        content: '' !important;
        position: absolute !important;
        inset: 0 !important;
        background: linear-gradient(
            115deg,
            transparent 0%,
            transparent 35%,
            rgba(50, 255, 100, 0.05) 42%,
            rgba(100, 255, 150, 0.1) 48%,
            rgba(180, 255, 200, 0.15) 50%,
            rgba(100, 255, 150, 0.1) 52%,
            rgba(50, 255, 100, 0.05) 58%,
            transparent 65%,
            transparent 100%
        ) !important;
        background-size: 300% 100% !important;
        pointer-events: none !important;
        animation: fcw-bddt-shimmer-sweep 5s linear infinite !important;
        z-index: 2 !important;
        opacity: 1 !important;
        mix-blend-mode: normal !important;
    }
    
    /* === BDDT REWARD - Shimmer (already has ::before spotlight) === */
    #fcw-card-modal.bddt-reward-active::after {
        content: '' !important;
        position: absolute !important;
        inset: 0 !important;
        background: linear-gradient(
            115deg,
            transparent 0%,
            transparent 35%,
            rgba(180, 100, 255, 0.05) 42%,
            rgba(200, 140, 255, 0.1) 48%,
            rgba(230, 200, 255, 0.15) 50%,
            rgba(200, 140, 255, 0.1) 52%,
            rgba(180, 100, 255, 0.05) 58%,
            transparent 65%,
            transparent 100%
        ) !important;
        background-size: 300% 100% !important;
        pointer-events: none !important;
        animation: fcw-bddt-shimmer-sweep 5.5s linear infinite !important;
        z-index: 2 !important;
        opacity: 1 !important;
        mix-blend-mode: normal !important;
    }

    /* --- PRIZE CARD BACKGROUND --- */
    #fcw-card-modal.prize-active {
        background: 
            url('https://i.ibb.co/1Gcv7L7H/Generated-Image-January-07-2026-5-48-PM-1.jpg') center 35% / 130% auto no-repeat !important;
        background-color: #050000 !important;
    }

    /* Prize Effects Styles */
    .fcw-prize-container { position: absolute; inset: 0; pointer-events: none; z-index: 5; overflow: hidden; }
    .fcw-prize-spotlight { position: absolute; top: 50%; left: 50%; width: 800px; height: 800px; transform: translate(-50%, -50%) translateZ(0); background: radial-gradient(circle, rgba(180, 0, 0, 0.3) 0%, transparent 70%); animation: fcw-prize-pulse 4s infinite ease-in-out; pointer-events: none; will-change: transform, opacity; }
    @keyframes fcw-prize-pulse { 0%,100% { opacity: 0.6; transform: translate(-50%,-50%) scale(1) translateZ(0); } 50% { opacity: 1; transform: translate(-50%,-50%) scale(1.15) translateZ(0); } }
    .fcw-prize-particle { position: absolute; width: 4px; height: 4px; border-radius: 50%; background: #ff0000; opacity: 0; animation: fcw-prize-float 3s linear infinite; pointer-events: none; box-shadow: 0 0 6px #ff0000, 0 0 12px #8b0000; will-change: transform, opacity; }
    .fcw-prize-particle.black { background: #1a0000; box-shadow: 0 0 8px #330000, 0 0 15px #000; }
    @keyframes fcw-prize-float { 0% { opacity: 0; transform: translateY(0) scale(0.5) translateZ(0); } 15% { opacity: 0.9; } 100% { opacity: 0; transform: translateY(-180px) scale(1.3) translateZ(0); } }
    
    /* Prize Glow Rays */
    .fcw-prize-ray { position: absolute; width: 3px; height: 120px; background: linear-gradient(to top, rgba(200,0,0,0.4) 0%, transparent 100%); transform-origin: bottom center; pointer-events: none; will-change: transform, opacity; animation: fcw-prize-ray-pulse 2s ease-in-out infinite; }
    @keyframes fcw-prize-ray-pulse { 0%,100% { opacity: 0.4; transform: scaleY(1) translateZ(0); } 50% { opacity: 0.7; transform: scaleY(1.2) translateZ(0); } }
    
    /* Prize Ember */
    .fcw-prize-ember { position: absolute; width: 3px; height: 3px; background: #ff4400; border-radius: 50%; box-shadow: 0 0 4px #ff2200; animation: fcw-prize-ember-rise 4s linear infinite; pointer-events: none; will-change: transform, opacity; }
    @keyframes fcw-prize-ember-rise { 0% { opacity: 0; transform: translateY(0) translateX(0) translateZ(0); } 20% { opacity: 1; } 100% { opacity: 0; transform: translateY(-200px) translateX(30px) translateZ(0); } }
    
    /* Prize Ambient Particle (replaces yellow) */
    .fcw-prize-ambient { position: absolute; width: 2px; height: 2px; border-radius: 50%; background: #cc0000; opacity: 0; animation: fcw-prize-ambient-float 6s linear infinite; pointer-events: none; will-change: transform, opacity; }
    .fcw-prize-ambient.dark { background: #1a0000; width: 3px; height: 3px; }
    @keyframes fcw-prize-ambient-float { 0% { opacity: 0; transform: translateY(0) translateZ(0); } 10% { opacity: 0.6; } 90% { opacity: 0.6; } 100% { opacity: 0; transform: translateY(-100vh) translateZ(0); } }

    /* Force hide any yellow/gold sparkles when Prize modal is active */
    #fcw-card-modal.prize-active .fcw-ambient-particles,
    #fcw-card-modal.prize-active .fcw-particle,
    #fcw-card-modal.prize-active .fcw-premium-shimmer-line,
    #fcw-card-modal.prize-active .fcw-glare-effect {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
    }

    /* ========================================== */
    /* POWER - ELECTRIC LIGHTNING STORM V2        */
    /* ========================================== */

    #fcw-card-modal.power-active {
        background:
            radial-gradient(ellipse 90% 70% at 50% 30%, rgba(3, 6, 18, 0.25) 0%, transparent 70%),
            radial-gradient(ellipse 60% 50% at 20% 70%, rgba(2, 4, 14, 0.2) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 80% 70%, rgba(2, 5, 15, 0.2) 0%, transparent 60%),
            linear-gradient(180deg, rgba(1, 2, 8, 0.25) 0%, rgba(2, 5, 16, 0.2) 50%, rgba(1, 3, 10, 0.25) 100%) !important;
        background-color: rgba(0, 1, 4, 0.2) !important;
    }

    /* Subtle electric vignette (edges only) */
    #fcw-card-modal.power-active::before {
        content: '';
        position: absolute;
        inset: 0;
        background:
            radial-gradient(ellipse 55% 55% at 50% 50%, transparent 40%, rgba(0, 0, 0, 0.4) 100%);
        pointer-events: none;
        z-index: 1;
        opacity: 0.5;
    }

    /* Power container */
    .fcw-power-container {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 8;
        overflow: hidden;
    }

    /* === Storm Clouds === */
    .fcw-power-clouds {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 35%;
        pointer-events: none;
        z-index: 6;
        overflow: hidden;
    }
    .fcw-power-cloud {
        position: absolute;
        border-radius: 50%;
        background: radial-gradient(ellipse at center, rgba(30, 40, 70, 0.5) 0%, rgba(20, 30, 55, 0.3) 30%, rgba(15, 20, 40, 0.15) 55%, transparent 75%);
        animation: fcw-power-cloud-drift linear infinite;
        will-change: transform;
    }
    @keyframes fcw-power-cloud-drift {
        0% { transform: translateX(-30px) translateZ(0); }
        50% { transform: translateX(30px) translateZ(0); }
        100% { transform: translateX(-30px) translateZ(0); }
    }
    .fcw-power-clouds-lit .fcw-power-cloud {
        background: radial-gradient(ellipse at center, rgba(120, 160, 255, 0.5) 0%, rgba(60, 100, 200, 0.2) 40%, transparent 70%) !important;
        transition: background 0.05s ease;
    }

    /* === Screen flash (double strobe) === */
    .fcw-power-flash {
        position: absolute;
        inset: 0;
        background: radial-gradient(ellipse at 50% 30%, rgba(200, 230, 255, 0.9) 0%, rgba(100, 160, 255, 0.4) 40%, transparent 70%);
        pointer-events: none;
        opacity: 0;
        z-index: 20;
    }
    .fcw-power-flash.strike {
        animation: fcw-power-flash-main 0.1s ease-out forwards;
    }
    .fcw-power-flash.strike-secondary {
        animation: fcw-power-flash-secondary 0.1s ease-out forwards;
    }
    @keyframes fcw-power-flash-main {
        0% { opacity: 0.8; }
        40% { opacity: 0.5; }
        100% { opacity: 0; }
    }
    @keyframes fcw-power-flash-secondary {
        0% { opacity: 0.35; }
        100% { opacity: 0; }
    }

    /* === Electric glow behind card === */
    .fcw-power-glow {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 700px;
        height: 700px;
        transform: translate(-50%, -50%) translateZ(0);
        background:
            radial-gradient(circle, rgba(60, 140, 255, 0.22) 0%, rgba(40, 100, 255, 0.08) 35%, transparent 65%),
            radial-gradient(ellipse 80% 60% at 50% 50%, rgba(100, 180, 255, 0.12) 0%, transparent 50%);
        pointer-events: none;
        z-index: 3;
        animation: fcw-power-glow-idle 4s ease-in-out infinite;
        will-change: transform, opacity;
    }
    .fcw-power-glow.pulse {
        animation: fcw-power-glow-strike 0.6s ease-out forwards;
    }
    @keyframes fcw-power-glow-idle {
        0%, 100% { opacity: 0.35; transform: translate(-50%, -50%) scale(1) translateZ(0); }
        50% { opacity: 0.65; transform: translate(-50%, -50%) scale(1.08) translateZ(0); }
    }
    @keyframes fcw-power-glow-strike {
        0% { opacity: 1; transform: translate(-50%, -50%) scale(1.4) translateZ(0); }
        30% { opacity: 0.7; }
        100% { opacity: 0.35; transform: translate(-50%, -50%) scale(1) translateZ(0); }
    }

    /* === Rain Layer === */
    .fcw-power-rain-layer {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 7;
        overflow: hidden;
    }
    .fcw-power-raindrop {
        position: absolute;
        top: -40px;
        width: 1px;
        background: linear-gradient(to bottom, transparent 0%, rgba(140, 180, 220, 0.5) 50%, rgba(180, 210, 240, 0.3) 100%);
        animation: fcw-power-rain-fall linear infinite;
        will-change: transform;
    }
    @keyframes fcw-power-rain-fall {
        0% { transform: translateY(-40px) translateZ(0); }
        100% { transform: translateY(110vh) translateZ(0); }
    }

    /* === Electric spark particles === */
    .fcw-power-spark {
        position: absolute;
        border-radius: 50%;
        background: #a8d8ff;
        box-shadow: 0 0 4px #78b8ff, 0 0 10px rgba(80, 160, 255, 0.6), 0 0 20px rgba(60, 120, 255, 0.3);
        opacity: 0;
        pointer-events: none;
        will-change: transform, opacity;
        animation: fcw-power-spark-drift linear infinite;
    }
    @keyframes fcw-power-spark-drift {
        0% { opacity: 0; transform: translateY(0) scale(0.3) translateZ(0); }
        8% { opacity: 1; transform: scale(1) translateZ(0); }
        20% { opacity: 0.2; }
        35% { opacity: 0.9; }
        55% { opacity: 0.15; }
        75% { opacity: 0.7; transform: translateY(-80px) translateX(15px) translateZ(0); }
        90% { opacity: 0.1; }
        100% { opacity: 0; transform: translateY(-150px) translateX(35px) scale(0.2) translateZ(0); }
    }

    /* === Power Lock Indicator === */
    #fcw-card-modal.power-active .fcw-lock-indicator {
        background: linear-gradient(135deg, rgba(60, 140, 255, 0.95), rgba(30, 80, 180, 0.95));
        border: 1px solid rgba(160, 210, 255, 0.6);
        color: #e8f2ff;
        text-shadow: 0 0 10px rgba(120, 190, 255, 0.9);
        box-shadow: 0 0 20px rgba(60, 140, 255, 0.6), 0 0 40px rgba(40, 100, 255, 0.25);
    }

    /* === Power Scintillation === */
    #fcw-card-modal.power-active .fcw-scintilla-star {
        background: radial-gradient(circle, rgba(255, 255, 255, 1) 0%, rgba(140, 200, 255, 0.9) 30%, transparent 70%);
        box-shadow: 0 0 8px rgba(255, 255, 255, 1), 0 0 18px rgba(100, 180, 255, 0.9), 0 0 35px rgba(60, 140, 255, 0.4);
    }

    /* === Instant-load === */
    #fcw-card-modal.power-active.active {
        animation: none !important;
    }

    /* === Power Headshot Electric Overlay === */
    .fcw-power-headshot-overlay {
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 100%;
        pointer-events: none;
        z-index: 10;
        opacity: 0;
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        mix-blend-mode: screen;
        transition: opacity 0.04s, filter 0.04s, transform 0.04s;
    }
    .fcw-power-headshot-overlay.active {
        opacity: 0.15;
        filter: brightness(1.2) contrast(1.1) hue-rotate(-5deg) drop-shadow(0 0 5px rgba(80, 160, 255, 0.5));
    }
    .fcw-power-headshot-overlay.flash {
        opacity: 1.0 !important;
        filter: brightness(5.0) contrast(2.5) saturate(0.3) hue-rotate(10deg) drop-shadow(0 0 35px rgba(180, 220, 255, 1.0)) drop-shadow(0 0 60px rgba(100, 170, 255, 0.9)) drop-shadow(0 0 100px rgba(50, 120, 255, 0.6)) !important;
        transform: scale(1.02) !important;
    }
    .fcw-power-headshot-overlay.crackle {
        opacity: 0.8 !important;
        filter: brightness(3.0) contrast(2.0) hue-rotate(-15deg) drop-shadow(-4px 0 rgba(100, 180, 255, 1.0)) drop-shadow(4px 0 rgba(200, 235, 255, 0.9)) drop-shadow(0 0 20px rgba(60, 140, 255, 0.8)) !important;
        transform: translate(2px, -1px) !important;
    }

    /* ========================================== */
    /* FW TOTY - PREMIUM BLUE/GOLD BACKGROUND    */
    /* ========================================== */
    
    /* ========================================== */
    /* FW TOTY - PREMIUM BLUE/GOLD BACKGROUND    */
    /* ========================================== */
    
    #fcw-card-modal.fw-toty-active {
        background: 
            url('https://i.ibb.co/Q3Tmffjn/Airbrush-IMAGE-ENHANCER-1769208258214-1769208258215-1.jpg') center 24% / 115% auto no-repeat !important;
        background-color: #051020 !important;
        box-shadow: inset 0 0 100px rgba(0,0,0,0.8);
    }

    /* Fullscreen adjustment - Fix podium rising too high on tall screens */
    @media (min-height: 900px) {
        #fcw-card-modal.fw-toty-active {
            background-position: center 15% !important;
        }
    }
    /* Ambient Pulsing Glow - GOLD FOCUSED */
    #fcw-card-modal.fw-toty-active::before {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at center, rgba(255, 215, 0, 0.25) 0%, rgba(255, 180, 0, 0.15) 40%, rgba(0, 20, 60, 0.3) 80%, transparent 100%);
        animation: fcw-fw-toty-ambient-pulse 5s ease-in-out infinite;
        pointer-events: none;
        z-index: 1;
    }
    /* PURE GOLD Shimmer Sweep - FULLY VISIBLE */
    #fcw-card-modal.fw-toty-active::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 200%;
        height: 100%;
        background: linear-gradient(
            105deg,
            transparent 0%,
            transparent 35%,
            rgba(255, 180, 0, 0.3) 40%,
            rgba(255, 200, 0, 0.6) 45%,
            rgba(255, 215, 0, 1) 48%,
            rgba(255, 240, 150, 1) 50%,
            rgba(255, 215, 0, 1) 52%,
            rgba(255, 200, 0, 0.6) 55%,
            rgba(255, 180, 0, 0.3) 60%,
            transparent 65%,
            transparent 100%
        );
        animation: fcw-fw-toty-shimmer-sweep 4s linear infinite;
        pointer-events: none;
        z-index: 6;
    }
    /* SOLID LIGHT - Single Massive Central Beam (Static) */
    .fcw-fw-toty-ray-container {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 150vmax;
        height: 150vmax;
        transform: translate(-50%, -50%);
        z-index: 0;
        pointer-events: none;
        opacity: 0.5;
        background: radial-gradient(
            circle,
            rgba(255, 215, 0, 0.4) 0%,
            rgba(255, 200, 50, 0.2) 30%,
            rgba(255, 215, 0, 0.1) 50%,
            transparent 70%
        );
    }
    
    @keyframes fcw-fw-toty-shimmer-sweep {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(50%); }
    }
    
    @keyframes fcw-fw-toty-ambient-pulse {
        0%, 100% { opacity: 0.8; }
        50% { opacity: 1; }
    }

    #fcw-card-modal.fw-toty-active .fcw-lock-indicator {
        background: linear-gradient(135deg, #102040 0%, #1e3c72 50%, #FFD700 100%);
        box-shadow: 0 0 15px #FFD700, 0 0 30px rgba(13, 71, 161, 0.8);
        border: 1px solid rgba(255, 215, 0, 0.5);
    }
    
    /* FW TOTY Gold Spotlight - Intense Center */
    .fcw-fw-toty-spotlight {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 1000px;
        height: 1000px;
        transform: translate(-50%, -50%) translateZ(0);
        background: radial-gradient(circle, rgba(255, 215, 0, 0.15) 0%, rgba(184, 134, 11, 0.05) 40%, transparent 70%);
        animation: fcw-fw-toty-spotlight-pulse 5s infinite ease-in-out;
        pointer-events: none;
        z-index: 2;
    }
    @keyframes fcw-fw-toty-spotlight-pulse {
        0%, 100% { opacity: 0.5; transform: translate(-50%,-50%) scale(0.9); }
        50% { opacity: 0.8; transform: translate(-50%,-50%) scale(1.1); }
    }
    
    /* Luxury Particles (Depth of Field) */
    .fcw-fw-toty-particle {
        position: absolute;
        border-radius: 50%;
        background: #FFD700;
        opacity: 0;
        pointer-events: none;
        box-shadow: 0 0 6px #FFD700;
        will-change: transform, opacity;
        z-index: 3;
    }
    .fcw-fw-toty-particle.blur {
        filter: blur(2px);
        opacity: 0.4;
        z-index: 1;
    }
    .fcw-fw-toty-particle.bright {
        background: #fff;
        box-shadow: 0 0 10px #fff, 0 0 20px #FFD700;
        z-index: 4;
    }
    
    /* STAR SPARKLES - The "Bling" Factor */
    .fcw-fw-toty-sparkle {
        position: absolute;
        width: 20px;
        height: 20px;
        background: radial-gradient(circle, #fff 10%, transparent 70%);
        opacity: 0;
        pointer-events: none;
        z-index: 5;
    }
    .fcw-fw-toty-sparkle::before,
    .fcw-fw-toty-sparkle::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        background: #fff;
        border-radius: 50%;
        box-shadow: 0 0 10px #FFD700;
    }
    .fcw-fw-toty-sparkle::before {
        width: 2px;
        height: 100%;
        transform: translate(-50%, -50%);
    }
    .fcw-fw-toty-sparkle::after {
        width: 100%;
        height: 2px;
        transform: translate(-50%, -50%);
    }

    @keyframes fcw-fw-toty-float {
        0% { opacity: 0; transform: translateY(0) scale(0); }
        20% { opacity: 1; transform: translateY(-20px) scale(1); }
        80% { opacity: 1; transform: translateY(-80px) scale(1); }
        100% { opacity: 0; transform: translateY(-100px) scale(0); }
    }
    
    @keyframes fcw-fw-toty-sparkle-anim {
        0% { opacity: 0; transform: scale(0) rotate(0deg); }
        50% { opacity: 1; transform: scale(1) rotate(45deg); }
        100% { opacity: 0; transform: scale(0) rotate(90deg); }
    }

    /* ========================================== */
    /* FW ICON TOTY - ULTIMATE LUXURY (Blue/Gold/Crimson) */
    /* ========================================== */

    #fcw-card-modal.fw-icon-toty-active {
        background: radial-gradient(circle at center 30%, rgba(13, 30, 80, 0.4) 0%, rgba(10, 15, 40, 0.6) 40%, rgba(5, 5, 15, 0.9) 100%) !important;
        background-color: rgba(5, 5, 10, 0.5) !important;
        box-shadow: inset 0 0 120px rgba(0,0,0,0.8);
        backdrop-filter: blur(10px) !important;
    }

    /* Intense Center Spotlight (Gold & Crimson) */
    .fcw-fw-icon-toty-spotlight {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 140vh;
        height: 140vh;
        transform: translate(-50%, -50%);
        background: radial-gradient(circle, rgba(255, 215, 0, 0.4) 0%, rgba(220, 20, 60, 0.2) 20%, transparent 65%);
        pointer-events: none;
        z-index: 1;
        animation: fcw-fw-icon-toty-pulse 4s ease-in-out infinite alternate;
        mix-blend-mode: screen;
    }

    /* Majestic Player Headshot Enhancement (Dramatic 3D) */
    .fcw-layer-fw-icon-toty-player {
        z-index: 5 !important;
        position: relative;
        transform: translateZ(120px) scale(0.9) !important;
        animation: fcw-fw-toty-player-glow-pulse 4s ease-in-out infinite alternate;
        will-change: transform, filter;
    }

    @keyframes fcw-fw-toty-player-glow-pulse {
        0% { filter: drop-shadow(0 0 15px rgba(255, 215, 0, 0.4)) drop-shadow(0 0 20px rgba(220, 20, 60, 0.3)) brightness(1.1) contrast(1.05); transform: translateZ(120px) scale(0.9); }
        100% { filter: drop-shadow(0 0 25px rgba(255, 215, 0, 0.8)) drop-shadow(0 0 40px rgba(220, 20, 60, 0.6)) brightness(1.2) contrast(1.1); transform: translateZ(135px) scale(0.92); }
    }

    /* Iconic Spirit Aura Clones (3D Layered Holograms) */
    .fcw-fw-icon-toty-spirit {
        position: absolute !important;
        z-index: 4 !important;
        pointer-events: none;
        mix-blend-mode: screen;
        transform-origin: center center;
        will-change: transform, opacity, filter;
    }
    .fcw-spirit-1 { animation: fcw-spirit-pulse-1 3.5s cubic-bezier(0.25, 0.1, 0.25, 1) infinite; }
    .fcw-spirit-2 { animation: fcw-spirit-pulse-2 3.5s cubic-bezier(0.25, 0.1, 0.25, 1) infinite 1.75s; }

    @keyframes fcw-spirit-pulse-1 {
        0% { transform: scale(0.9) translateY(0) translateZ(80px); opacity: 0.8; filter: sepia(1) saturate(5) hue-rotate(340deg) brightness(1.5) blur(4px); }
        100% { transform: scale(1.15) translateY(-30px) translateZ(20px); opacity: 0; filter: sepia(1) saturate(3) hue-rotate(320deg) brightness(1) blur(12px); }
    }

    @keyframes fcw-spirit-pulse-2 {
        0% { transform: scale(0.9) translateY(0) translateZ(40px); opacity: 0.8; filter: sepia(1) saturate(5) hue-rotate(340deg) brightness(1.5) blur(4px); }
        100% { transform: scale(1.2) translateY(-40px) translateZ(-20px); opacity: 0; filter: sepia(1) saturate(3) hue-rotate(320deg) brightness(1) blur(16px); }
    }

    /* Core Card Glow */
    .fcw-fw-icon-toty-core {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 400px;
        height: 550px;
        transform: translate(-50%, -50%);
        background: radial-gradient(ellipse, rgba(255, 215, 0, 0.15) 0%, transparent 70%);
        pointer-events: none;
        z-index: 2;
        filter: blur(20px);
        animation: fcw-fw-icon-toty-pulse 3s infinite alternate;
    }

    @keyframes fcw-fw-icon-toty-pulse {
        0% { transform: translate(-50%, -50%) scale(0.95); opacity: 0.8; }
        100% { transform: translate(-50%, -50%) scale(1.08); opacity: 1; }
    }

    /* ========================================== */
    /* VALENTINE's DAY - LUXURIOUS RED/GOLD EFFECTS */
    /* ========================================== */

    #fcw-card-modal.valentines-active {
        background: radial-gradient(circle at center 35%, rgba(139, 0, 0, 0.2) 0%, rgba(60, 0, 15, 0.4) 50%, rgba(10, 0, 5, 0.7) 100%) !important;
        background-color: rgba(12, 0, 5, 0.4) !important;
        box-shadow: inset 0 0 100px rgba(0,0,0,0.6);
        backdrop-filter: blur(8px) !important;
    }

    /* Ambient Romantic Glow - Warmer red and hint of gold */
    #fcw-card-modal.valentines-active::before {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at center, rgba(255, 105, 180, 0.1) 0%, rgba(220, 20, 60, 0.15) 30%, rgba(218, 165, 32, 0.05) 50%, transparent 80%);
        animation: fcw-valentines-ambient-pulse 5s ease-in-out infinite alternate;
        pointer-events: none;
        z-index: 1;
    }

    /* Subtle Gold Shimmer Sweep */
    #fcw-card-modal.valentines-active::after {
        content: '';
        position: absolute;
        inset: -100px;
        background: linear-gradient(45deg, transparent 40%, rgba(255, 215, 0, 0.05) 45%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 215, 0, 0.05) 55%, transparent 60%);
        background-size: 200% 200%;
        animation: fcw-valentines-shimmer-sweep 7s linear infinite;
        pointer-events: none;
        z-index: 2;
        mix-blend-mode: overlay;
    }

    @keyframes fcw-valentines-ambient-pulse {
        0% { opacity: 0.5; transform: scale(0.9); filter: blur(10px); }
        100% { opacity: 1; transform: scale(1.1); filter: blur(20px); }
    }

    @keyframes fcw-valentines-shimmer-sweep {
        0% { background-position: 200% 200%; opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { background-position: -100% -100%; opacity: 0; }
    }

    /* Standard Hearts */
    .fcw-valentines-heart {
        position: absolute;
        width: 15px;
        height: 15px;
        background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ff6699"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>') no-repeat center center;
        background-size: contain;
        opacity: 0;
        pointer-events: none;
        z-index: 5;
        filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3)) drop-shadow(0 0 10px rgba(255,105,180,0.4));
    }

    /* Gold Lux Hearts */
    .fcw-valentines-gold-heart {
        position: absolute;
        width: 12px;
        height: 12px;
        background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ffd700"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>') no-repeat center center;
        background-size: contain;
        opacity: 0;
        pointer-events: none;
        z-index: 6;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5)) drop-shadow(0 0 15px rgba(255,215,0,0.8));
    }

    /* Falling/Rising Rose Petals */
    .fcw-valentines-petal {
        position: absolute;
        width: 18px;
        height: 12px;
        background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60"><path d="M90 20 C60 -10, 20 10, 10 30 C0 50, 40 70, 70 50 C90 40, 100 30, 90 20 Z" fill="%23cc0000"/></svg>') no-repeat center center;
        background-size: contain;
        opacity: 0;
        pointer-events: none;
        z-index: 4;
        filter: drop-shadow(0 8px 10px rgba(0,0,0,0.5));
    }

    /* Soft Embers/Sparkles */
    .fcw-valentines-sparkle {
        position: absolute;
        width: 3px;
        height: 3px;
        background: #fff;
        border-radius: 50%;
        box-shadow: 0 0 15px 3px rgba(255, 182, 193, 0.9), 0 0 5px 1px #fff;
        opacity: 0;
        pointer-events: none;
        z-index: 3;
    }

    .fcw-valentines-gold-sparkle {
        position: absolute;
        width: 3px;
        height: 3px;
        background: #fff;
        border-radius: 50%;
        box-shadow: 0 0 15px 3px rgba(255, 215, 0, 0.9), 0 0 5px 1px #fff;
        opacity: 0;
        pointer-events: none;
        z-index: 3;
    }

    @keyframes fcw-valentines-float {
        0% { opacity: 0; transform: translateY(20px) scale(0.3) rotate(-15deg); }
        15% { opacity: 1; }
        85% { opacity: 1; }
        100% { opacity: 0; transform: translateY(-120vh) scale(1.5) rotate(45deg); }
    }

    @keyframes fcw-valentines-petal-sway {
        0% { opacity: 0; transform: translateY(-20px) scale(0.5) rotate(0deg) translateX(0); }
        15% { opacity: 0.8; }
        33% { transform: translateY(-30vh) scale(0.8) rotate(30deg) translateX(30px); }
        66% { transform: translateY(-60vh) scale(1) rotate(-20deg) translateX(-30px); }
        85% { opacity: 0.8; }
        100% { opacity: 0; transform: translateY(-110vh) scale(1.2) rotate(60deg) translateX(50px); }
    }

    @keyframes fcw-valentines-sparkle-anim {
        0% { opacity: 0; transform: scale(0) rotate(0deg); }
        50% { opacity: 1; transform: scale(1.5) rotate(180deg); }
        100% { opacity: 0; transform: scale(0) rotate(360deg); }
    }

    /* ========================================== */
    /* VALENTINE's SET REWARD - ADVANCED LUXURY   */
    /* ========================================== */

    #fcw-card-modal.valentines-reward-active {
        background: radial-gradient(circle at center 35%, rgba(180, 0, 40, 0.3) 0%, rgba(80, 0, 15, 0.5) 45%, rgba(10, 0, 5, 0.8) 100%) !important;
        background-color: rgba(12, 0, 5, 0.5) !important;
        box-shadow: inset 0 0 150px rgba(0,0,0,0.8);
        backdrop-filter: blur(12px) !important;
    }

    /* Central Intense Spotlight behind card */
    .fcw-valentines-spotlight {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 150vh;
        height: 150vh;
        transform: translate(-50%, -50%);
        background: radial-gradient(circle, rgba(255, 105, 180, 0.35) 0%, rgba(218, 165, 32, 0.15) 30%, transparent 60%);
        pointer-events: none;
        z-index: 1;
        animation: fcw-valentines-spotlight-pulse 4s ease-in-out infinite alternate;
        mix-blend-mode: screen;
    }

    /* Rotating God Rays behind card */
    .fcw-valentines-rays {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 200vw;
        height: 200vw;
        margin-left: -100vw;
        margin-top: -100vw;
        background: repeating-conic-gradient(
            from 0deg,
            rgba(255, 105, 180, 0.08) 0deg 10deg,
            transparent 10deg 20deg,
            rgba(218, 165, 32, 0.05) 20deg 30deg,
            transparent 30deg 40deg
        );
        animation: fcw-valentines-ray-rotate 60s linear infinite;
        pointer-events: none;
        z-index: 0;
        mask-image: radial-gradient(circle at center, black 10%, transparent 60%);
        -webkit-mask-image: radial-gradient(circle at center, black 10%, transparent 60%);
    }

    @keyframes fcw-valentines-spotlight-pulse {
        0% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.7; filter: blur(20px); }
        100% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; filter: blur(30px); }
    }

    @keyframes fcw-valentines-ray-rotate {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }



    /* ========================================== */
    /* BDDT EXTREME - NEON GREEN LUXURIOUS EFFECTS */
    /* ========================================== */
    
    /* BDDT Spotlights - DISABLED (causes glitchy ray effect) */
    .fcw-bddt-extreme-spotlight,
    .fcw-bddt-reward-spotlight,
    .fcw-bddt-gold-spotlight,
    .fcw-bddt-silver-spotlight,
    .fcw-bddt-bronze-spotlight {
        display: none !important;
    }
    .fcw-bddt-extreme-spotlight {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 900px;
        height: 900px;
        transform: translate(-50%, -50%) translateZ(0);
        background: radial-gradient(circle, rgba(0, 255, 100, 0.25) 0%, rgba(57, 255, 20, 0.1) 40%, transparent 70%);
        animation: fcw-bddt-green-pulse 3s infinite ease-in-out;
        pointer-events: none;
        will-change: transform, opacity;
    }
    @keyframes fcw-bddt-green-pulse {
        0%, 100% { opacity: 0.7; transform: translate(-50%,-50%) scale(1) translateZ(0); }
        50% { opacity: 1; transform: translate(-50%,-50%) scale(1.15) translateZ(0); }
    }
    .fcw-bddt-extreme-particle {
        position: absolute;
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: #00ff66;
        opacity: 0;
        animation: fcw-bddt-particle-rise 3.5s linear infinite;
        pointer-events: none;
        box-shadow: 0 0 10px #00ff66, 0 0 20px #39ff14, 0 0 30px #00ff00;
        will-change: transform, opacity;
    }
    .fcw-bddt-extreme-particle.bright {
        background: #7fff00;
        box-shadow: 0 0 12px #7fff00, 0 0 25px #adff2f;
    }
    .fcw-bddt-extreme-ray {
        position: absolute;
        width: 4px;
        background: linear-gradient(to top, rgba(0, 255, 100, 0.6) 0%, rgba(57, 255, 20, 0.3) 50%, transparent 100%);
        transform-origin: bottom center;
        pointer-events: none;
        will-change: transform, opacity;
        animation: fcw-bddt-ray-glow 2.6s ease-in-out infinite;
        left: 50%;
        bottom: 5%;
    }
    @keyframes fcw-bddt-ray-glow {
        0%, 100% { opacity: 0.4; height: 150px; }
        50% { opacity: 0.8; height: 200px; }
    }
    .fcw-bddt-extreme-starburst {
        position: absolute;
        width: 20px;
        height: 20px;
        background: radial-gradient(circle, rgba(0, 255, 100, 0.9) 0%, transparent 70%);
        border-radius: 50%;
        animation: fcw-bddt-star-twinkle 1.5s ease-in-out infinite;
        pointer-events: none;
        will-change: opacity, transform;
    }
    @keyframes fcw-bddt-star-twinkle {
        0%, 100% { opacity: 0.3; transform: scale(0.8) translateZ(0); }
        50% { opacity: 1; transform: scale(1.2) translateZ(0); }
    }
    @keyframes fcw-bddt-particle-rise {
        0% { opacity: 0; transform: translateY(0) scale(0.5) translateZ(0); }
        15% { opacity: 1; }
        85% { opacity: 0.7; }
        100% { opacity: 0; transform: translateY(-280px) scale(1.6) translateZ(0); }
    }

    /* BDDT Gorgeous Aurora Wave - DISABLED (causes faint disappearing lights) */
    .fcw-bddt-aurora {
        display: none !important;
    }
    @keyframes fcw-bddt-aurora-wave {
        0% { transform: translateX(-60%) translateY(0) skewX(-5deg); opacity: 0.3; }
        25% { transform: translateX(-40%) translateY(15px) skewX(0deg); opacity: 0.5; }
        50% { transform: translateX(-20%) translateY(-10px) skewX(5deg); opacity: 0.4; }
        75% { transform: translateX(-40%) translateY(10px) skewX(-2deg); opacity: 0.6; }
        100% { transform: translateX(-60%) translateY(0) skewX(-5deg); opacity: 0.3; }
    }

    /* BDDT Crystal Shard (Floating Gemstones) */
    .fcw-bddt-crystal {
        position: absolute;
        width: 12px;
        height: 18px;
        background: var(--crystal-color, linear-gradient(135deg, rgba(180,140,60,0.8) 0%, rgba(120,90,30,0.9) 50%, rgba(80,60,20,0.7) 100%));
        clip-path: polygon(50% 0%, 100% 35%, 80% 100%, 20% 100%, 0% 35%);
        pointer-events: none;
        animation: fcw-bddt-crystal-float 8s ease-in-out infinite;
        box-shadow: 0 0 15px var(--crystal-glow, rgba(255,180,60,0.5)), inset 0 0 8px rgba(255,255,255,0.3);
    }
    .fcw-bddt-crystal.small {
        width: 8px;
        height: 12px;
    }
    .fcw-bddt-crystal.large {
        width: 16px;
        height: 24px;
    }
    @keyframes fcw-bddt-crystal-float {
        0%, 100% { 
            transform: translateY(0) rotate(0deg) scale(1);
            opacity: 0.6;
        }
        25% { 
            transform: translateY(-40px) rotate(45deg) scale(1.1);
            opacity: 0.9;
        }
        50% { 
            transform: translateY(-80px) rotate(90deg) scale(1);
            opacity: 0.7;
        }
        75% { 
            transform: translateY(-50px) rotate(135deg) scale(0.9);
            opacity: 0.8;
        }
    }

    /* BDDT Shimmer Glint (Quick Flash Effects) */
    .fcw-bddt-glint {
        position: absolute;
        width: 6px;
        height: 6px;
        background: radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,220,150,0.6) 50%, transparent 100%);
        border-radius: 50%;
        pointer-events: none;
        animation: fcw-bddt-glint-flash 3s ease-in-out infinite;
    }
    @keyframes fcw-bddt-glint-flash {
        0%, 100% { opacity: 0; transform: scale(0.5); }
        10% { opacity: 1; transform: scale(1.5); }
        20% { opacity: 0; transform: scale(0.8); }
    }

    /* BDDT Light Streak - REMOVED */
    .fcw-bddt-streak {
        display: none;
    }

    /* BDDT Floating Ember (Slow Drifting Particles) */
    .fcw-bddt-ember {
        position: absolute;
        width: 3px;
        height: 3px;
        border-radius: 50%;
        pointer-events: none;
        animation: fcw-bddt-ember-float 8s ease-in-out infinite;
    }
    @keyframes fcw-bddt-ember-float {
        0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
        25% { transform: translateY(-30px) translateX(15px); opacity: 0.7; }
        50% { transform: translateY(-60px) translateX(-10px); opacity: 0.5; }
        75% { transform: translateY(-40px) translateX(20px); opacity: 0.6; }
    }

    /* BDDT Radiant Ring (Expanding Ring Effect) */
    .fcw-bddt-ring {
        position: absolute;
        top: 50%;
        left: 50%;
        border-radius: 50%;
        border: 2px solid;
        pointer-events: none;
        transform: translate(-50%, -50%);
        animation: fcw-bddt-ring-expand 3s ease-out infinite;
    }
    @keyframes fcw-bddt-ring-expand {
        0% { width: 50px; height: 50px; opacity: 0.6; }
        100% { width: 400px; height: 400px; opacity: 0; }
    }

    /* ========================================== */
    /* BDDT SET REWARD - PURPLE LUXURIOUS EFFECTS */
    /* ========================================== */
    .fcw-bddt-reward-spotlight {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 900px;
        height: 900px;
        transform: translate(-50%, -50%) translateZ(0);
        background: radial-gradient(circle, rgba(155, 48, 255, 0.25) 0%, rgba(191, 0, 255, 0.1) 40%, transparent 70%);
        animation: fcw-bddt-purple-pulse 3s infinite ease-in-out;
        pointer-events: none;
        will-change: transform, opacity;
    }
    @keyframes fcw-bddt-purple-pulse {
        0%, 100% { opacity: 0.7; transform: translate(-50%,-50%) scale(1) translateZ(0); }
        50% { opacity: 1; transform: translate(-50%,-50%) scale(1.15) translateZ(0); }
    }
    .fcw-bddt-reward-particle {
        position: absolute;
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: #bf00ff;
        opacity: 0;
        animation: fcw-bddt-particle-rise 3.5s linear infinite;
        pointer-events: none;
        box-shadow: 0 0 10px #bf00ff, 0 0 20px #9b30ff, 0 0 30px #8a2be2;
        will-change: transform, opacity;
    }
    .fcw-bddt-reward-particle.bright {
        background: #da70d6;
        box-shadow: 0 0 12px #da70d6, 0 0 25px #ee82ee;
    }
    .fcw-bddt-reward-ray {
        position: absolute;
        width: 4px;
        background: linear-gradient(to top, rgba(155, 48, 255, 0.5) 0%, rgba(191, 0, 255, 0.2) 50%, transparent 100%);
        transform-origin: bottom center;
        pointer-events: none;
        will-change: transform, opacity;
        animation: fcw-bddt-ray-dance 3.25s ease-in-out infinite;
    }
    .fcw-bddt-reward-starburst {
        position: absolute;
        width: 20px;
        height: 20px;
        background: radial-gradient(circle, rgba(155, 48, 255, 0.9) 0%, transparent 70%);
        border-radius: 50%;
        animation: fcw-bddt-star-twinkle 1.5s ease-in-out infinite;
        pointer-events: none;
        will-change: opacity, transform;
    }

    /* ========================================== */
    /* BDDT GOLD - GOLDEN LUXURIOUS EFFECTS */
    /* ========================================== */
    .fcw-bddt-gold-spotlight {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 900px;
        height: 900px;
        transform: translate(-50%, -50%) translateZ(0);
        background: radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, rgba(255, 180, 0, 0.15) 40%, transparent 70%);
        animation: fcw-bddt-gold-pulse 3s infinite ease-in-out;
        pointer-events: none;
        will-change: transform, opacity;
    }
    @keyframes fcw-bddt-gold-pulse {
        0%, 100% { opacity: 0.8; transform: translate(-50%,-50%) scale(1) translateZ(0); }
        50% { opacity: 1; transform: translate(-50%,-50%) scale(1.2) translateZ(0); }
    }
    .fcw-bddt-gold-particle {
        position: absolute;
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: #ffd700;
        opacity: 0;
        animation: fcw-bddt-particle-rise 3.5s linear infinite;
        pointer-events: none;
        box-shadow: 0 0 12px #ffd700, 0 0 24px #ffb800, 0 0 36px #ff9900;
        will-change: transform, opacity;
    }
    .fcw-bddt-gold-particle.bright {
        background: #fff4a3;
        box-shadow: 0 0 15px #fff4a3, 0 0 30px #ffd700;
    }
    .fcw-bddt-gold-ray {
        position: absolute;
        width: 5px;
        background: linear-gradient(to top, rgba(255, 215, 0, 0.7) 0%, rgba(255, 180, 0, 0.4) 50%, transparent 100%);
        transform-origin: bottom center;
        pointer-events: none;
        will-change: transform, opacity;
        animation: fcw-bddt-ray-glow 2.6s ease-in-out infinite;
        left: 50%;
        bottom: 5%;
    }
    .fcw-bddt-gold-starburst {
        position: absolute;
        width: 20px;
        height: 20px;
        background: radial-gradient(circle, rgba(255, 215, 0, 0.95) 0%, transparent 70%);
        border-radius: 50%;
        animation: fcw-bddt-star-twinkle 1.5s ease-in-out infinite;
        pointer-events: none;
        will-change: opacity, transform;
    }

    /* ========================================== */
    /* BDDT SILVER - SILVER/WHITE LUXURIOUS EFFECTS */
    /* ========================================== */
    .fcw-bddt-silver-spotlight {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 900px;
        height: 900px;
        transform: translate(-50%, -50%) translateZ(0);
        background: radial-gradient(circle, rgba(220, 220, 230, 0.3) 0%, rgba(180, 180, 200, 0.15) 40%, transparent 70%);
        animation: fcw-bddt-silver-pulse 3s infinite ease-in-out;
        pointer-events: none;
        will-change: transform, opacity;
    }
    @keyframes fcw-bddt-silver-pulse {
        0%, 100% { opacity: 0.8; transform: translate(-50%,-50%) scale(1) translateZ(0); }
        50% { opacity: 1; transform: translate(-50%,-50%) scale(1.2) translateZ(0); }
    }
    .fcw-bddt-silver-particle {
        position: absolute;
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: #e0e0e8;
        opacity: 0;
        animation: fcw-bddt-particle-rise 3.5s linear infinite;
        pointer-events: none;
        box-shadow: 0 0 12px #e0e0e8, 0 0 24px #c0c0d0, 0 0 36px #a8a8b8;
        will-change: transform, opacity;
    }
    .fcw-bddt-silver-particle.bright {
        background: #ffffff;
        box-shadow: 0 0 15px #ffffff, 0 0 30px #e0e0e8;
    }
    .fcw-bddt-silver-ray {
        position: absolute;
        width: 5px;
        background: linear-gradient(to top, rgba(220, 220, 230, 0.6) 0%, rgba(180, 180, 200, 0.3) 50%, transparent 100%);
        transform-origin: bottom center;
        pointer-events: none;
        will-change: transform, opacity;
        animation: fcw-bddt-ray-dance 3.25s ease-in-out infinite;
    }
    .fcw-bddt-silver-starburst {
        position: absolute;
        width: 20px;
        height: 20px;
        background: radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, transparent 70%);
        border-radius: 50%;
        animation: fcw-bddt-star-twinkle 1.5s ease-in-out infinite;
        pointer-events: none;
        will-change: opacity, transform;
    }

    /* ========================================== */
    /* BDDT BRONZE - BRONZE/COPPER LUXURIOUS EFFECTS */
    /* ========================================== */
    .fcw-bddt-bronze-spotlight {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 900px;
        height: 900px;
        transform: translate(-50%, -50%) translateZ(0);
        background: radial-gradient(circle, rgba(205, 127, 50, 0.3) 0%, rgba(180, 100, 40, 0.15) 40%, transparent 70%);
        animation: fcw-bddt-bronze-pulse 3s infinite ease-in-out;
        pointer-events: none;
        will-change: transform, opacity;
    }
    @keyframes fcw-bddt-bronze-pulse {
        0%, 100% { opacity: 0.8; transform: translate(-50%,-50%) scale(1) translateZ(0); }
        50% { opacity: 1; transform: translate(-50%,-50%) scale(1.2) translateZ(0); }
    }
    .fcw-bddt-bronze-particle {
        position: absolute;
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: #cd7f32;
        opacity: 0;
        animation: fcw-bddt-particle-rise 3.5s linear infinite;
        pointer-events: none;
        box-shadow: 0 0 12px #cd7f32, 0 0 24px #b87333, 0 0 36px #a05a28;
        will-change: transform, opacity;
    }
    .fcw-bddt-bronze-particle.bright {
        background: #e8a860;
        box-shadow: 0 0 15px #e8a860, 0 0 30px #cd7f32;
    }
    .fcw-bddt-bronze-ray {
        position: absolute;
        width: 5px;
        background: linear-gradient(to top, rgba(205, 127, 50, 0.6) 0%, rgba(180, 100, 40, 0.3) 50%, transparent 100%);
        transform-origin: bottom center;
        pointer-events: none;
        will-change: transform, opacity;
        animation: fcw-bddt-ray-dance 3.25s ease-in-out infinite;
    }
    .fcw-bddt-bronze-starburst {
        position: absolute;
        width: 20px;
        height: 20px;
        background: radial-gradient(circle, rgba(232, 168, 96, 0.95) 0%, transparent 70%);
        border-radius: 50%;
        animation: fcw-bddt-star-twinkle 1.5s ease-in-out infinite;
        pointer-events: none;
        will-change: opacity, transform;
    }

    /* Disable any fade-in for BDOR/BDDT/PRIZE modals */
    #fcw-card-modal.bdor-winner-active.active,
    #fcw-card-modal.bdor-runnerup-active.active,
    #fcw-card-modal.bdor-third-active.active,
    #fcw-card-modal.bddt-extreme-active.active,
    #fcw-card-modal.bddt-reward-active.active,
    #fcw-card-modal.prize-active.active {
        animation: none !important;
    }

    #fcw-card-modal.bdor-winner-active::before {
        background:
            radial-gradient(ellipse 50% 50% at 50% 50%, rgba(255, 215, 0, 0.15) 0%, transparent 70%),
            radial-gradient(ellipse 40% 40% at 20% 30%, rgba(255, 200, 100, 0.1) 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 80% 30%, rgba(255, 200, 100, 0.1) 0%, transparent 60%) !important;
    }

    /* BDOR Winner Lock Indicator */
    #fcw-card-modal.bdor-winner-active .fcw-lock-indicator {
        background: linear-gradient(135deg, rgba(255, 215, 0, 0.95), rgba(180, 140, 20, 0.95));
        border: 1px solid rgba(255, 255, 255, 0.6);
        color: #1a1205;
        text-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
        box-shadow: 0 0 25px rgba(255, 215, 0, 0.7), 0 0 50px rgba(255, 215, 0, 0.3);
    }

    /* BDOR Winner Scintillation */
    #fcw-card-modal.bdor-winner-active .fcw-scintilla-star {
        background: radial-gradient(circle, rgba(255, 255, 255, 1) 0%, rgba(255, 215, 0, 0.9) 30%, transparent 70%);
        box-shadow: 0 0 10px rgba(255, 255, 255, 1), 0 0 20px rgba(255, 215, 0, 0.8), 0 0 30px rgba(255, 200, 100, 0.5);
    }

    /* BDOR Winner Gold Effects Container */
    .fcw-bdor-container {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 5;
        overflow: hidden;
    }

    /* Gold Spotlight */
    .fcw-bdor-spotlight {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) translateZ(0);
        width: 550px;
        height: 750px;
        background: radial-gradient(ellipse at center,
            rgba(255, 215, 0, 0.15) 0%,
            rgba(255, 200, 100, 0.1) 30%,
            rgba(255, 180, 50, 0.05) 50%,
            transparent 70%
        );
        pointer-events: none;
        opacity: 1;
        will-change: transform;
        animation: fcw-bdor-spotlight-pulse 4s ease-in-out infinite;
    }

    @keyframes fcw-bdor-spotlight-pulse {
        0%, 100% { opacity: 0.8; transform: translate(-50%, -50%) scale(1) translateZ(0); }
        50% { opacity: 1; transform: translate(-50%, -50%) scale(1.08) translateZ(0); }
    }

    /* Gold Spark Particles */
    .fcw-bdor-spark {
        position: absolute;
        width: 5px;
        height: 5px;
        background: radial-gradient(circle, 
            rgba(255, 255, 200, 1) 0%, 
            rgba(255, 215, 0, 0.9) 40%, 
            transparent 70%
        );
        border-radius: 50%;
        pointer-events: none;
        opacity: 0.9;
        box-shadow: 0 0 8px rgba(255, 215, 0, 1), 0 0 16px rgba(255, 200, 100, 0.7);
        will-change: transform;
        animation: fcw-bdor-spark-rise var(--spark-duration) ease-out infinite;
        animation-delay: var(--spark-delay);
    }

    @keyframes fcw-bdor-spark-rise {
        0% { 
            opacity: 1; 
            transform: translateY(0) translateX(0) scale(1) translateZ(0); 
        }
        100% { 
            opacity: 0; 
            transform: translateY(var(--rise-y)) translateX(var(--drift-x)) scale(0.3) translateZ(0); 
        }
    }

    /* Floating Gold Orbs */
    .fcw-bdor-orb {
        position: absolute;
        border-radius: 50%;
        background: radial-gradient(circle at 30% 30%, 
            rgba(255, 235, 150, 0.95) 0%, 
            rgba(255, 215, 0, 0.6) 30%,
            rgba(200, 160, 50, 0.3) 60%, 
            transparent 80%
        );
        filter: blur(1px);
        pointer-events: none;
        opacity: 0.8;
        will-change: transform;
        animation: fcw-bdor-orb-float var(--orb-duration) ease-in-out infinite;
        animation-delay: var(--orb-delay);
    }

    @keyframes fcw-bdor-orb-float {
        0%, 100% { opacity: 0.6; transform: translateY(0) translateX(0) scale(1) translateZ(0); }
        33% { opacity: 1; transform: translateY(var(--drift-y1)) translateX(var(--drift-x1)) scale(1.1) translateZ(0); }
        66% { opacity: 0.8; transform: translateY(var(--drift-y2)) translateX(var(--drift-x2)) scale(1.05) translateZ(0); }
    }

    /* Gold Star Bursts */
    .fcw-bdor-starburst {
        position: absolute;
        width: 28px;
        height: 28px;
        background: conic-gradient(
            from 0deg,
            transparent 0deg,
            rgba(255, 215, 0, 0.95) 6deg,
            transparent 12deg,
            transparent 78deg,
            rgba(255, 235, 150, 0.8) 84deg,
            transparent 90deg,
            transparent 168deg,
            rgba(255, 215, 0, 0.95) 174deg,
            transparent 180deg,
            transparent 258deg,
            rgba(255, 235, 150, 0.8) 264deg,
            transparent 270deg,
            transparent 348deg,
            rgba(255, 215, 0, 0.95) 354deg,
            transparent 360deg
        );
        border-radius: 50%;
        pointer-events: none;
        opacity: 0.9;
        will-change: transform;
        animation: fcw-bdor-starburst-twinkle var(--twinkle-duration) ease-in-out infinite;
        animation-delay: var(--twinkle-delay);
    }

    @keyframes fcw-bdor-starburst-twinkle {
        0%, 100% { opacity: 0.4; transform: scale(0.8) rotate(0deg) translateZ(0); }
        50% { opacity: 1; transform: scale(1.5) rotate(45deg) translateZ(0); }
    }

    /* Diamond Gold Sparkles */
    .fcw-bdor-diamond {
        position: absolute;
        width: 10px;
        height: 10px;
        background: linear-gradient(135deg, rgba(255, 255, 200, 1), rgba(255, 215, 0, 0.9));
        transform: rotate(45deg);
        pointer-events: none;
        opacity: 0.95;
        box-shadow: 0 0 12px rgba(255, 215, 0, 1), 0 0 24px rgba(255, 200, 100, 0.8), 0 0 36px rgba(255, 180, 50, 0.5);
        will-change: transform, opacity;
        animation: fcw-bdor-diamond-sparkle var(--diamond-duration) ease-in-out infinite;
        animation-delay: var(--diamond-delay);
    }

    @keyframes fcw-bdor-diamond-sparkle {
        0%, 100% { opacity: 0.3; transform: rotate(45deg) scale(0.5) translateZ(0); }
        50% { opacity: 1; transform: rotate(45deg) scale(1.3) translateZ(0); }
    }

    /* Gold Shimmer Rays */
    .fcw-bdor-ray {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 4px;
        height: 450px;
        background: linear-gradient(to top, 
            rgba(255, 215, 0, 0.5) 0%, 
            rgba(255, 235, 150, 0.3) 30%, 
            rgba(255, 255, 200, 0.1) 60%, 
            transparent 100%);
        transform-origin: bottom center;
        pointer-events: none;
        opacity: 0.7;
        will-change: opacity;
        animation: fcw-bdor-ray-pulse 3s ease-in-out infinite;
        animation-delay: var(--ray-delay);
    }

    @keyframes fcw-bdor-ray-pulse {
        0%, 100% { opacity: 0.4; }
        50% { opacity: 0.9; }
    }

    /* Gold Lens Flares */
    .fcw-bdor-flare {
        position: absolute;
        border-radius: 50%;
        pointer-events: none;
        opacity: 0.8;
        will-change: transform;
        animation: fcw-bdor-flare-pulse var(--flare-duration) ease-in-out infinite;
        animation-delay: var(--flare-delay);
    }

    .fcw-bdor-flare.large {
        width: 140px;
        height: 140px;
        background: radial-gradient(circle,
            rgba(255, 235, 150, 0.6) 0%,
            rgba(255, 215, 0, 0.3) 30%,
            rgba(200, 160, 50, 0.1) 50%,
            transparent 70%
        );
        filter: blur(3px);
    }

    .fcw-bdor-flare.medium {
        width: 70px;
        height: 70px;
        background: radial-gradient(circle,
            rgba(255, 235, 150, 0.8) 0%,
            rgba(255, 215, 0, 0.4) 40%,
            transparent 70%
        );
    }

    .fcw-bdor-flare.small {
        width: 30px;
        height: 30px;
        background: radial-gradient(circle,
            rgba(255, 255, 220, 1) 0%,
            rgba(255, 215, 0, 0.6) 50%,
            transparent 80%
        );
    }

    @keyframes fcw-bdor-flare-pulse {
        0%, 100% { opacity: 0.5; transform: scale(1) translateZ(0); }
        50% { opacity: 1; transform: scale(1.25) translateZ(0); }
    }
`;

        var style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);

        // --- 3. Create Modal HTML ---
        var ribbonAnimId = null;
        var modal = document.createElement('div');
        modal.id = 'fcw-card-modal';

        // Container for Bat effects (Background)
        var batContainer = document.createElement('div');
        batContainer.className = 'fcw-bat-container';
        batContainer.id = 'fcw-bat-container';
        modal.appendChild(batContainer);

        // Container for Snow effects (Background/Foreground)
        var snowContainer = document.createElement('div');
        snowContainer.className = 'fcw-snow-container';
        snowContainer.id = 'fcw-snow-container';
        modal.appendChild(snowContainer);

        // Container for Santa Sleigh (Background/Foreground Layering)
        var santaContainer = document.createElement('div');
        santaContainer.className = 'fcw-santa-container';
        santaContainer.id = 'fcw-santa-container';
        modal.appendChild(santaContainer);

        // NEW: Container for Foreground Bats (Detached from card to avoid clutter/clipping)
        var foregroundBatContainer = document.createElement('div');
        foregroundBatContainer.className = 'fcw-foreground-bat-container';
        foregroundBatContainer.id = 'fcw-foreground-bat-container';
        modal.appendChild(foregroundBatContainer);

        // Container for Ribbon effects (FW Icon)
        var ribbonContainer = document.createElement('div');
        ribbonContainer.className = 'fcw-ribbon-container';
        ribbonContainer.id = 'fcw-ribbon-container';
        modal.appendChild(ribbonContainer);

        // Container for Fireworks effects (New Years)
        var fireworksContainer = document.createElement('div');
        fireworksContainer.className = 'fcw-fireworks-container';
        fireworksContainer.id = 'fcw-fireworks-container';
        modal.appendChild(fireworksContainer);

        // Container for Christmas Lights (Futmas)
        var christmasLightsContainer = document.createElement('div');
        christmasLightsContainer.className = 'fcw-christmas-lights-container';
        christmasLightsContainer.id = 'fcw-christmas-lights-container';
        modal.appendChild(christmasLightsContainer);

        // Container for Worlds Map (Global Tournament)
        var worldsMapContainer = document.createElement('div');
        worldsMapContainer.className = 'fcw-worlds-map-container';
        worldsMapContainer.id = 'fcw-worlds-map-container';
        modal.appendChild(worldsMapContainer);

        // REALITY FRACTURE CONTAINERS
        var spectralGearContainer = document.createElement('div');
        spectralGearContainer.className = 'fcw-spectral-gear-container';
        spectralGearContainer.id = 'fcw-spectral-gear-container'; // Added ID for clearing
        modal.appendChild(spectralGearContainer);

        var fractureOverlay = document.createElement('div');
        fractureOverlay.className = 'fcw-reality-fracture-overlay';
        fractureOverlay.id = 'fcw-reality-fracture-overlay'; // Added ID for clearing
        modal.appendChild(fractureOverlay);

        // Container for Black Friday Effects
        var blackFridayContainer = document.createElement('div');
        blackFridayContainer.className = 'fcw-blackfriday-container';
        blackFridayContainer.id = 'fcw-blackfriday-container';
        modal.appendChild(blackFridayContainer);

        // Container for GOTW Theatre Lights Effects
        var gotwContainer = document.createElement('div');
        gotwContainer.className = 'fcw-gotw-container';
        gotwContainer.id = 'fcw-gotw-container';
        modal.appendChild(gotwContainer);

        // Container for GOTW Moments Effects
        var gotwMomentsContainer = document.createElement('div');
        gotwMomentsContainer.className = 'fcw-gotwmoments-container';
        gotwMomentsContainer.id = 'fcw-gotwmoments-container';
        modal.appendChild(gotwMomentsContainer);

        // Container for TOTY 18 Effects
        var toty18Container = document.createElement('div');
        toty18Container.className = 'fcw-toty18-container';
        toty18Container.id = 'fcw-toty18-container';
        modal.appendChild(toty18Container);

        // Container for FW Icon Halloween Effects
        var fwIconHWContainer = document.createElement('div');
        fwIconHWContainer.className = 'fcw-fwihw-container';
        fwIconHWContainer.id = 'fcw-fwihw-container';
        modal.appendChild(fwIconHWContainer);

        var bdorContainer = document.createElement('div');
        bdorContainer.className = 'fcw-bdor-container';
        bdorContainer.id = 'fcw-bdor-container';
        modal.appendChild(bdorContainer);

        // Container for Prize Effects
        var prizeContainer = document.createElement('div');
        prizeContainer.className = 'fcw-prize-container';
        prizeContainer.id = 'fcw-prize-container';
        modal.appendChild(prizeContainer);

        // Container for Power Lightning Effects
        var powerContainer = document.createElement('div');
        powerContainer.className = 'fcw-power-container';
        powerContainer.id = 'fcw-power-container';
        modal.appendChild(powerContainer);

        var ambientParticles = document.createElement('div');
        ambientParticles.className = 'fcw-ambient-particles';
        modal.appendChild(ambientParticles);

        var stageDiv = document.createElement('div');
        stageDiv.className = 'fcw-card-stage';
        stageDiv.id = 'fcw-stage';

        var containerDiv = document.createElement('div');
        containerDiv.className = 'fcw-3d-card';
        containerDiv.id = 'fcw-card-container';

        var wrapperDiv = document.createElement('div');
        wrapperDiv.className = 'fcw-card-wrapper';
        wrapperDiv.id = 'fcw-card-wrapper';

        var hintDiv = document.createElement('div');
        hintDiv.className = 'fcw-modal-hint';
        hintDiv.innerHTML = 'Click to Lock<span>Â·</span>ESC to Close';

        var lockIndicator = document.createElement('div');
        lockIndicator.className = 'fcw-lock-indicator';
        lockIndicator.id = 'fcw-lock-indicator';
        lockIndicator.textContent = 'Locked';

        containerDiv.appendChild(wrapperDiv);
        stageDiv.appendChild(containerDiv);
        modal.appendChild(stageDiv);
        modal.appendChild(hintDiv);
        modal.appendChild(lockIndicator);
        document.body.appendChild(modal);

        var stage = stageDiv;
        var container = containerDiv;
        var wrapper = wrapperDiv;

        var vintageEffectsActive = false;

        // --- 4. Interaction Logic ---
        var isPaused = false;
        var currentCard = null;

        modal.addEventListener('click', function (e) {
            // Add santaContainer to ignored click targets
            if (e.target === modal || e.target.classList.contains('fcw-modal-hint') || e.target.classList.contains('fcw-ambient-particles') || e.target.classList.contains('fcw-bat-container') || e.target.classList.contains('fcw-snow-container') || e.target.classList.contains('fcw-santa-container')) {
                closeModal();
            } else {
                isPaused = !isPaused;
                lockIndicator.classList.toggle('visible', isPaused);
                lockIndicator.textContent = isPaused ? 'Locked' : 'Unlocked';
                if (isPaused) {
                    container.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
                } else {
                    container.style.transition = 'transform 0.08s ease-out';
                    setTimeout(function () {
                        lockIndicator.classList.remove('visible');
                    }, 1000);
                }
            }
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeModal();
            }
        }, { passive: true });

        function closeModal() {
            if (ribbonAnimId) { cancelAnimationFrame(ribbonAnimId); ribbonAnimId = null; }
            // Re-enable scrolling
            document.body.style.overflow = '';
            modal.classList.remove('active', 'dream-active', 'silver-active', 'bronze-active', 'bddt-gold-active', 'bddt-silver-active', 'bddt-bronze-active', 'vintage-active', 'fw-icon-active', 'halloween-active', 'icon-26-active', 'futmas-active', 'newyears-active', 'gotw-active', 'futmas-icon-active', 'worlds-active', 'blackfriday-active', 'gotwmoments-active', 'time-warp-active', 'fw-icon-hw-active', 'toty18-active', 'toty26-active', 'iconwc18-active', 'bdor-winner-active', 'bdor-runnerup-active', 'bdor-third-active', 'bddt-extreme-active', 'bddt-reward-active', 'prize-active', 'fw-toty-active', 'power-active');
            container.style.transform = 'rotateX(0deg) rotateY(0deg)';
            wrapper.innerHTML = '';
            ambientParticles.innerHTML = '';
            ribbonContainer.innerHTML = ''; // Clear ribbons
            batContainer.innerHTML = ''; // Clear background bats
            foregroundBatContainer.innerHTML = ''; // Clear foreground bats
            snowContainer.innerHTML = ''; // Clear snow
            santaContainer.innerHTML = ''; // Clear santa
            fireworksContainer.innerHTML = ''; // Clear fireworks
            christmasLightsContainer.innerHTML = ''; // Clear Christmas lights
            worldsMapContainer.innerHTML = ''; // Clear worlds map
            blackFridayContainer.innerHTML = ''; // Clear Black Friday effects
            gotwMomentsContainer.innerHTML = ''; // Clear GOTW Moments effects
            gotwContainer.innerHTML = ''; // Clear GOTW theatre lights
            spectralGearContainer.innerHTML = ''; // Clear spectral gears
            fractureOverlay.innerHTML = ''; // Clear fracture overlay
            fwIconHWContainer.innerHTML = ''; // Clear FW Icon HW effects
            bdorContainer.innerHTML = ''; // Clear BDOR Winner effects
            prizeContainer.innerHTML = ''; // Clear Prize effects
            powerContainer.innerHTML = ''; // Clear Power lightning effects
            isPaused = false;
            currentCard = null;
            lockIndicator.classList.remove('visible');
            removeVintageEffects();
            stopNewYearsAudio();
            stopPowerAudio();
            stopChristmasCursorTrail();
            if (window.fcwWorldsMouseMove) {
                document.removeEventListener('mousemove', window.fcwWorldsMouseMove);
                window.fcwWorldsMouseMove = null;
            }
            if (fractureInterval) clearInterval(fractureInterval); // Stop fracture interval
        }

        // --- Ribbon Effects Creation (FW Icon) ---
        function createRibbonEffects() {
            // 1. Gold Ribbon
            var goldRibbon = document.createElement('div');
            goldRibbon.className = 'fcw-ribbon gold';
            ribbonContainer.appendChild(goldRibbon);

            // 2. Red Ribbon
            var redRibbon = document.createElement('div');
            redRibbon.className = 'fcw-ribbon red';
            ribbonContainer.appendChild(redRibbon);

            // 3. Thin Gold Accent
            var thinGold = document.createElement('div');
            thinGold.className = 'fcw-ribbon thin-gold';
            ribbonContainer.appendChild(thinGold);
        }

        // --- TIME WARP: REALITY FRACTURE LOGIC ---

        function createSpectralGears() {
            var gears = ['gear-1', 'gear-2', 'gear-3'];
            gears.forEach(g => {
                var gear = document.createElement('div');
                gear.className = 'fcw-spectral-gear ' + g;
                spectralGearContainer.appendChild(gear);
            });
        }

        // REMOVED TIME ECHOES FUNCTION

        function createReverseEntropy(container) {
            // REDUCED PARTICLE COUNT TO 12 (was 30)
            for (var i = 0; i < 12; i++) {
                var p = document.createElement('div');
                p.className = 'fcw-entropy-particle';
                p.style.left = Math.random() * 100 + '%';

                var width = 1 + Math.random() * 3;
                // Simplified Colors - removed gradients
                var color = Math.random() > 0.5 ? 'cyan' : '#ff00ff';

                p.style.setProperty('--p-width', width + 'px');
                p.style.setProperty('--p-color', color);
                p.style.setProperty('--p-duration', (2 + Math.random() * 3) + 's');
                p.style.setProperty('--p-delay', (Math.random() * 2) + 's');

                container.appendChild(p);
            }
        }

        // --- TIME WARP: COMPLETE IMMERSIVE EFFECTS ---
        var timewarpScanlines = null;
        var headshotGlitchOverlay = null;
        var headshotGlitchInterval = null;


        function createTimeWarpEffects(targetCard) {
            // Create scanlines overlay
            timewarpScanlines = document.createElement('div');
            timewarpScanlines.className = 'fcw-timewarp-scanlines';
            modal.appendChild(timewarpScanlines);



            // Find player headshot and create glitch overlay
            var headshot = targetCard.querySelector('.player-face26');
            if (headshot && headshot.src) {
                headshotGlitchOverlay = document.createElement('div');
                headshotGlitchOverlay.className = 'fcw-headshot-glitch-overlay';
                headshotGlitchOverlay.style.backgroundImage = 'url(' + headshot.src + ')';

                // Position overlay over the headshot
                var parent = headshot.parentElement;
                if (parent) {
                    parent.style.position = 'relative';
                    parent.appendChild(headshotGlitchOverlay);
                }
            }

            // Add active class immediately for continuous glitch
            if (headshotGlitchOverlay) {
                headshotGlitchOverlay.classList.add('active');
            }
        }

        // Removed startHeadshotGlitchLoop - glitch is now continuous via CSS

        function cleanupTimeWarpEffects() {
            if (timewarpScanlines) { timewarpScanlines.remove(); timewarpScanlines = null; }
            if (headshotGlitchOverlay) { headshotGlitchOverlay.remove(); headshotGlitchOverlay = null; }
            if (headshotGlitchInterval) { clearInterval(headshotGlitchInterval); headshotGlitchInterval = null; }

        }

        function createReverseEntropy(container) {
            // Enhanced particles with vibrant colors
            var colors = ['#8a2be2', '#dc143c', '#00ffff', '#ff0080', '#9400d3'];
            for (var i = 0; i < 25; i++) {
                var p = document.createElement('div');
                p.className = 'fcw-entropy-particle';
                p.style.left = Math.random() * 100 + '%';

                var color = colors[Math.floor(Math.random() * colors.length)];

                p.style.setProperty('--p-color', color);
                p.style.setProperty('--p-duration', (2.5 + Math.random() * 3) + 's');
                p.style.setProperty('--p-delay', (Math.random() * 3) + 's');

                container.appendChild(p);
            }
        }

        var fractureInterval = null;
        function startTimeFracture(targetCard) {
            // Create all Time Warp effects
            createTimeWarpEffects(targetCard);
        }

        // --- NEW: White Gold Ribbons for FC 26 (OPTIMIZED & STATIC) ---
        function createIcon26Ribbons() {
            // FPS FIX: Reduced from 25 to 12 (Slightly larger ribbons to compensate)
            for (var i = 0; i < 12; i++) {
                var ribbon = document.createElement('div');

                // Alternate types (Heavy on Pure Gold)
                var type = (i % 3 === 0) ? 'white-gold' : (i % 3 === 1) ? 'pure-gold' : 'platinum';
                ribbon.className = 'fcw-ribbon ' + type;

                // FORCE STATIC: Disable animation
                ribbon.style.animation = 'none';

                // MASSIVE RANGE: Ribbons can spawn anywhere from top to bottom
                // -50% to 150% ensures they fill the entire visible background
                var randomTop = Math.floor(Math.random() * 200) - 50;
                ribbon.style.top = randomTop + '%';

                // Add randomization to scale and vertical offset to create depth
                var scale = 0.9 + Math.random() * 0.6; // Slightly larger for coverage
                // Random Y offset to make them look less uniform
                var offsetY = Math.random() * 200 - 100;
                ribbon.style.transform = `rotate(-30deg) translateY(${offsetY}px) scale(${scale})`;

                // Randomize opacity slightly so they layer nicely without moving
                ribbon.style.opacity = 0.5 + Math.random() * 0.4;

                ribbonContainer.appendChild(ribbon);
            }
        }

        // --- Halloween Effects Creation ---
        function createHalloweenBackgroundBats() {
            var batCount = 20 + Math.floor(Math.random() * 10);
            for (var i = 0; i < batCount; i++) {
                var batWrapper = document.createElement('div');
                batWrapper.className = 'fcw-bat-bg';
                var paths = ['fcw-fly-swoop', 'fcw-fly-hunt', 'fcw-fly-dive', 'fcw-fly-circle', 'fcw-fly-cross', 'fcw-fly-loop'];
                var randomPath = paths[Math.floor(Math.random() * paths.length)];
                batWrapper.classList.add(randomPath);
                var batShape = document.createElement('div');
                batShape.className = 'fcw-bat-shape';
                batWrapper.appendChild(batShape);
                var size = 50 + Math.random() * 150;
                batWrapper.style.width = size + 'px';
                batWrapper.style.height = (size * 0.6) + 'px';
                var duration = 6 + Math.random() * 12;
                var delay = Math.random() * 12;
                batWrapper.style.setProperty('--flight-duration', duration + 's');
                batWrapper.style.animationDelay = `${delay}s`;
                batWrapper.style.zIndex = Math.random() > 0.6 ? 2 : -1;
                if (size < 25) {
                    batWrapper.style.filter = 'blur(1.5px) opacity(0.7)';
                } else {
                    batWrapper.style.filter = 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))';
                }
                batContainer.appendChild(batWrapper);
            }
        }

        function createSleekAmbientBats(targetContainer) {
            const batCount = 25;
            for (var i = 0; i < batCount; i++) {
                var batWrapper = document.createElement('div');
                batWrapper.className = 'fcw-sleek-bat';
                var paths = ['fcw-fly-swoop', 'fcw-fly-hunt', 'fcw-fly-circle', 'fcw-fly-cross', 'fcw-fly-panic'];
                var randomPath = paths[Math.floor(Math.random() * paths.length)];
                batWrapper.classList.add(randomPath);
                var jitterDiv = document.createElement('div');
                jitterDiv.style.width = '100%';
                jitterDiv.style.height = '100%';
                jitterDiv.style.animation = `fcw-bat-jitter ${0.3 + Math.random() * 0.4}s linear infinite`;
                batWrapper.appendChild(jitterDiv);
                var batShape = document.createElement('div');
                batShape.className = 'fcw-bat-shape';
                batShape.style.animationDuration = (0.1 + Math.random() * 0.05) + 's';
                jitterDiv.appendChild(batShape);
                var size = 100 + Math.random() * 250;
                batWrapper.style.width = size + 'px';
                batWrapper.style.height = (size * 0.6) + 'px';
                var duration = 3 + Math.random() * 5;
                var delay = Math.random() * 8;
                batWrapper.style.setProperty('--flight-duration', duration + 's');
                batWrapper.style.animationDelay = `${delay}s`;
                targetContainer.appendChild(batWrapper);
            }
        }

        // --- Futmas Snow Creation ---
        function createSnowEffects() {
            var snowCount = 50; // Balanced for style vs FPS
            for (var i = 0; i < snowCount; i++) {
                var flake = document.createElement('div');
                var isShaped = Math.random() > 0.7; // 30% are actual SVG shapes, rest are soft orbs

                flake.className = 'fcw-snowflake' + (isShaped ? ' shaped' : '');

                // Random horizontal position
                var leftPos = Math.random() * 100;
                flake.style.left = leftPos + '%';

                // Size variance
                var size = isShaped ? (10 + Math.random() * 15) : (3 + Math.random() * 5);
                flake.style.width = size + 'px';
                flake.style.height = size + 'px';

                // Sway physics (using CSS vars for GPU transform)
                var swayAmount = 20 + Math.random() * 50;
                var direction = Math.random() > 0.5 ? 1 : -1;
                flake.style.setProperty('--sway-start', '0px');
                flake.style.setProperty('--sway-end', (swayAmount * direction) + 'px');

                // Opacity
                flake.style.setProperty('--max-opacity', (0.4 + Math.random() * 0.5).toString());

                // Speed
                var duration = 5 + Math.random() * 10;
                flake.style.animationDuration = duration + 's';
                flake.style.animationDelay = (Math.random() * 5 * -1) + 's'; // Start randomly

                snowContainer.appendChild(flake);
            }
        }

        // --- Futmas Santa Creation (SMOOTH ORBIT) ---
        function createSantaEffect() {
            var sleighWrapper = document.createElement('div');
            sleighWrapper.className = 'fcw-santa-sleigh-wrapper';

            var sleighSVG = document.createElement('div');
            sleighSVG.className = 'fcw-santa-sleigh-svg';

            sleighWrapper.appendChild(sleighSVG);
            santaContainer.appendChild(sleighWrapper);
        }

        // --- Christmas Lights Creation with Animated Wire ---
        function createChristmasLights() {
            const lightColors = ['red', 'green', 'gold', 'blue', 'white'];

            // Create top wire
            const topWire = document.createElement('div');
            topWire.className = 'fcw-light-wire top';
            christmasLightsContainer.appendChild(topWire);

            // Create bottom wire
            const bottomWire = document.createElement('div');
            bottomWire.className = 'fcw-light-wire bottom';
            christmasLightsContainer.appendChild(bottomWire);

            // Create lights along top strand
            createLightsOnStrand(4, 20);

            // Create lights along bottom strand
            createLightsOnStrand(95, 20);

            function createLightsOnStrand(yPos, count) {
                for (let i = 0; i < count; i++) {
                    const light = document.createElement('div');
                    const colorClass = lightColors[i % lightColors.length];
                    light.className = 'fcw-christmas-light ' + colorClass;

                    const xPos = 3 + (i / (count - 1)) * 94; // 3% to 97%

                    light.style.left = xPos + '%';
                    light.style.top = yPos + '%';

                    // Sequential twinkle pattern
                    const twinkleSpeed = 1.5 + (i % 3) * 0.3;
                    const twinkleDelay = (i * 0.12);
                    light.style.setProperty('--twinkle-speed', twinkleSpeed + 's');
                    light.style.setProperty('--twinkle-delay', twinkleDelay + 's');

                    // Physics swing - each light has slightly different timing for natural look
                    const swingSpeed = 2.5 + (i % 5) * 0.4;
                    const swingDelay = (i * 0.1) + Math.random() * 0.3;
                    light.style.setProperty('--swing-speed', swingSpeed + 's');
                    light.style.setProperty('--swing-delay', swingDelay + 's');

                    christmasLightsContainer.appendChild(light);
                }
            }
        }


        // --- Christmas Cursor Trail Effect (Red & Green) ---
        var christmasCursorActive = false;
        var christmasCursorThrottle = 0;

        function startChristmasCursorTrail() {
            christmasCursorActive = true;
            document.addEventListener('mousemove', handleChristmasCursor, { passive: true });
        }

        function stopChristmasCursorTrail() {
            christmasCursorActive = false;
            document.removeEventListener('mousemove', handleChristmasCursor);
            document.querySelectorAll('.fcw-cursor-trail').forEach(function (el) { el.remove(); });
        }

        function handleChristmasCursor(e) {
            if (!christmasCursorActive) return;
            if (!modal.classList.contains('futmas-active')) return;

            // Throttle - spawn particle every 30ms
            var now = Date.now();
            if (now - christmasCursorThrottle < 30) return;
            christmasCursorThrottle = now;

            // Create 2 particles per movement for fuller trail
            for (var p = 0; p < 2; p++) {
                var particle = document.createElement('div');
                particle.className = 'fcw-cursor-trail';

                // Alternate red and green
                var isRed = Math.random() > 0.5;
                particle.style.cssText = 'position:fixed;pointer-events:none;z-index:9999;border-radius:50%;' +
                    'width:' + (8 + Math.random() * 8) + 'px;' +
                    'height:' + (8 + Math.random() * 8) + 'px;' +
                    'background:radial-gradient(circle,' + (isRed ? '#ff4444,#cc0000' : '#44ff44,#00cc00') + ');' +
                    'box-shadow:0 0 10px ' + (isRed ? 'rgba(255,0,0,0.8)' : 'rgba(0,255,0,0.8)') + ',' +
                    '0 0 20px ' + (isRed ? 'rgba(255,0,0,0.5)' : 'rgba(0,255,0,0.5)') + ';' +
                    'left:' + (e.clientX + (Math.random() - 0.5) * 30 - 8) + 'px;' +
                    'top:' + (e.clientY + (Math.random() - 0.5) * 30 - 8) + 'px;' +
                    'opacity:1;transition:all 0.8s ease-out;';

                document.body.appendChild(particle);

                // Animate out
                setTimeout(function () {
                    particle.style.opacity = '0';
                    particle.style.transform = 'translateY(30px) scale(0.3)';
                }, 10);

                // Remove after animation
                setTimeout(function () {
                    if (particle.parentNode) particle.remove();
                }, 900);
            }
        }


        // --- NEW YEARS FIREWORKS & AUDIO EFFECTS ---
        var newYearsAudioContext = null;
        var newYearsAudioContext = null;
        var newYearsAudioInterval = null;
        var newYearsFireworksInterval = null;

        function createNewYearsFireworks() {
            // Firework color palettes
            const colorPalettes = [
                { color: '#FFD700', glow: 'rgba(255, 215, 0, 0.8)' },     // Gold
                { color: '#FF4040', glow: 'rgba(255, 64, 64, 0.8)' },     // Red
                { color: '#4080FF', glow: 'rgba(64, 128, 255, 0.8)' },    // Blue
                { color: '#FF40FF', glow: 'rgba(255, 64, 255, 0.8)' },    // Magenta
                { color: '#40FF80', glow: 'rgba(64, 255, 128, 0.8)' },    // Green
                { color: '#FFFFFF', glow: 'rgba(255, 255, 255, 0.9)' },   // White
                { color: '#FF8040', glow: 'rgba(255, 128, 64, 0.8)' }     // Orange
            ];

            function launchFirework() {
                const palette = colorPalettes[Math.floor(Math.random() * colorPalettes.length)];
                const launchX = 5 + Math.random() * 90; // 5-95% horizontal for wider spread
                const burstHeight = 10 + Math.random() * 40; // 10-50% from top
                const launchDuration = 0.6 + Math.random() * 0.5; // Faster rockets

                // Create rocket trail
                const rocket = document.createElement('div');
                rocket.className = 'fcw-firework-rocket';
                rocket.style.left = launchX + '%';
                rocket.style.setProperty('--launch-duration', launchDuration + 's');
                rocket.style.setProperty('--launch-delay', '0s');
                rocket.style.setProperty('--burst-height', burstHeight + 'vh');
                fireworksContainer.appendChild(rocket);

                // Create burst after rocket arrives
                setTimeout(() => {
                    createBurst(launchX, burstHeight, palette);
                    rocket.remove();
                }, launchDuration * 1000);
            }

            function createBurst(x, y, palette) {
                const burst = document.createElement('div');
                burst.className = 'fcw-firework-burst';
                burst.style.left = x + '%';
                burst.style.top = y + '%';
                fireworksContainer.appendChild(burst);

                // Realistic layered burst - outer ring + inner core
                const outerCount = 14 + Math.floor(Math.random() * 6);
                const innerCount = 8 + Math.floor(Math.random() * 4);
                const burstDuration = 1.4 + Math.random() * 0.4;

                // Outer ring - larger, faster particles
                for (let i = 0; i < outerCount; i++) {
                    const particle = document.createElement('div');
                    particle.className = 'fcw-burst-particle';

                    const angle = (i / outerCount) * 360 + (Math.random() * 10 - 5);
                    const distance = 120 + Math.random() * 100;
                    const radians = angle * (Math.PI / 180);
                    const endX = Math.cos(radians) * distance;
                    const endY = Math.sin(radians) * distance + (distance * 0.35);
                    const size = 6 + Math.random() * 5;

                    particle.style.setProperty('--particle-size', size + 'px');
                    particle.style.setProperty('--particle-color', palette.color);
                    particle.style.setProperty('--particle-glow', palette.glow);
                    particle.style.setProperty('--end-x', endX + 'px');
                    particle.style.setProperty('--end-y', endY + 'px');
                    particle.style.setProperty('--burst-duration', burstDuration + 's');
                    particle.style.setProperty('--burst-delay', '0s');
                    burst.appendChild(particle);
                }

                // Inner core - smaller, brighter particles
                for (let i = 0; i < innerCount; i++) {
                    const particle = document.createElement('div');
                    particle.className = 'fcw-burst-particle';

                    const angle = (i / innerCount) * 360 + (Math.random() * 30);
                    const distance = 40 + Math.random() * 50;
                    const radians = angle * (Math.PI / 180);
                    const endX = Math.cos(radians) * distance;
                    const endY = Math.sin(radians) * distance + (distance * 0.25);
                    const size = 4 + Math.random() * 3;

                    particle.style.setProperty('--particle-size', size + 'px');
                    particle.style.setProperty('--particle-color', '#FFFFFF');
                    particle.style.setProperty('--particle-glow', 'rgba(255,255,255,0.9)');
                    particle.style.setProperty('--end-x', endX + 'px');
                    particle.style.setProperty('--end-y', endY + 'px');
                    particle.style.setProperty('--burst-duration', (burstDuration * 0.7) + 's');
                    particle.style.setProperty('--burst-delay', '0s');
                    burst.appendChild(particle);
                }

                setTimeout(() => burst.remove(), (burstDuration + 0.2) * 1000);
            }

            // Initial burst - multiple fireworks for immediate impact
            for (let i = 0; i < 4; i++) {
                setTimeout(() => launchFirework(), i * 200);
            }

            // Frequent fireworks - staggered launches for continuous display
            if (newYearsFireworksInterval) clearInterval(newYearsFireworksInterval);
            newYearsFireworksInterval = setInterval(() => {
                if (modal.classList.contains('newyears-active')) {
                    launchFirework();
                    // 70% chance of second firework nearby
                    if (Math.random() > 0.3) {
                        setTimeout(() => { if (modal.classList.contains('newyears-active')) launchFirework(); }, 150 + Math.random() * 200);
                    }
                    // 40% chance of third firework
                    if (Math.random() > 0.6) {
                        setTimeout(() => { if (modal.classList.contains('newyears-active')) launchFirework(); }, 350 + Math.random() * 200);
                    }
                }
            }, 600);
        }

        function createNewYearsConfetti() {
            const confettiColors = ['#FFD700', '#FF4040', '#4080FF', '#FF40FF', '#40FF80', '#FFFFFF', '#FF8040'];

            // OPTIMIZED: Reduced confetti count for performance
            for (let i = 0; i < 20; i++) {
                const confetti = document.createElement('div');
                confetti.className = 'fcw-confetti';

                const color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
                const width = 6 + Math.random() * 10;
                const height = width * (0.3 + Math.random() * 0.4);
                const left = Math.random() * 100;
                const duration = 4 + Math.random() * 6;
                const delay = Math.random() * -8;

                confetti.style.left = left + '%';
                confetti.style.setProperty('--confetti-width', width + 'px');
                confetti.style.setProperty('--confetti-height', height + 'px');
                confetti.style.setProperty('--confetti-color', color);
                confetti.style.setProperty('--fall-duration', duration + 's');
                confetti.style.setProperty('--fall-delay', delay + 's');

                fireworksContainer.appendChild(confetti);
            }
        }

        function createNewYearsSparkles() {
            // OPTIMIZED: Reduced sparkle count
            for (let i = 0; i < 12; i++) {
                const sparkle = document.createElement('div');
                sparkle.className = 'fcw-newyear-sparkle';

                sparkle.style.left = Math.random() * 100 + '%';
                sparkle.style.top = Math.random() * 100 + '%';
                sparkle.style.setProperty('--twinkle-duration', (2 + Math.random() * 2) + 's');
                sparkle.style.setProperty('--twinkle-delay', (Math.random() * 3) + 's');

                fireworksContainer.appendChild(sparkle);
            }
        }

        function playNewYearsAudio() {
            try {
                newYearsAudioContext = new (window.AudioContext || window.webkitAudioContext)();

                function playFireworkSound() {
                    if (!newYearsAudioContext || newYearsAudioContext.state === 'closed') return;

                    const now = newYearsAudioContext.currentTime;

                    // Launch whoosh
                    const whooshOsc = newYearsAudioContext.createOscillator();
                    const whooshGain = newYearsAudioContext.createGain();
                    whooshOsc.type = 'sawtooth';
                    whooshOsc.frequency.setValueAtTime(100, now);
                    whooshOsc.frequency.exponentialRampToValueAtTime(800, now + 0.5);
                    whooshGain.gain.setValueAtTime(0.03, now);
                    whooshGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                    whooshOsc.connect(whooshGain);
                    whooshGain.connect(newYearsAudioContext.destination);
                    whooshOsc.start(now);
                    whooshOsc.stop(now + 0.6);

                    // Explosion crackle
                    setTimeout(() => {
                        if (!newYearsAudioContext || newYearsAudioContext.state === 'closed') return;
                        const expNow = newYearsAudioContext.currentTime;

                        // Create noise buffer for explosion
                        const bufferSize = newYearsAudioContext.sampleRate * 0.3;
                        const buffer = newYearsAudioContext.createBuffer(1, bufferSize, newYearsAudioContext.sampleRate);
                        const data = buffer.getChannelData(0);
                        for (let i = 0; i < bufferSize; i++) {
                            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
                        }

                        const noise = newYearsAudioContext.createBufferSource();
                        noise.buffer = buffer;

                        const filter = newYearsAudioContext.createBiquadFilter();
                        filter.type = 'lowpass';
                        filter.frequency.setValueAtTime(2000 + Math.random() * 1000, expNow);

                        const expGain = newYearsAudioContext.createGain();
                        expGain.gain.setValueAtTime(0.08, expNow);
                        expGain.gain.exponentialRampToValueAtTime(0.001, expNow + 0.3);

                        noise.connect(filter);
                        filter.connect(expGain);
                        expGain.connect(newYearsAudioContext.destination);
                        noise.start(expNow);
                    }, 500 + Math.random() * 200);
                }

                // Play initial sounds
                playFireworkSound();
                setTimeout(() => playFireworkSound(), 300);

                // Continue playing ambient sounds
                newYearsAudioInterval = setInterval(() => {
                    if (modal.classList.contains('newyears-active')) {
                        playFireworkSound();
                    }
                }, 1200 + Math.random() * 800);

            } catch (e) {
                console.log('Web Audio not supported for New Years effects');
            }
        }

        function stopNewYearsAudio() {
            if (newYearsAudioInterval) {
                clearInterval(newYearsAudioInterval);
                newYearsAudioInterval = null;
            }
            if (newYearsAudioContext && newYearsAudioContext.state !== 'closed') {
                try {
                    newYearsAudioContext.close();
                } catch (e) { }
                newYearsAudioContext = null;
            }
        }

        function createNewYearsEffects() {
            createNewYearsFireworks();
            createNewYearsConfetti();
            createNewYearsSparkles();
            // Audio disabled - removed playNewYearsAudio();
        }

        // --- LUNAR NEW YEAR EFFECTS (PREMIUM) ---
        function createLNYEffects(container) {
            if (container) container.innerHTML = '';

            // 1. Spotlights (Left + Right conic-gradient beams)
            var spotlight1 = document.createElement('div');
            spotlight1.className = 'fcw-lny-spotlight left';
            container.appendChild(spotlight1);
            var spotlight2 = document.createElement('div');
            spotlight2.className = 'fcw-lny-spotlight right';
            container.appendChild(spotlight2);

            // 2. Base Glow (Bottom red/gold illumination)
            var baseGlow = document.createElement('div');
            baseGlow.className = 'fcw-lny-base-glow';
            container.appendChild(baseGlow);

            // 3. Headshot Spotlight (Center radial glow)
            var hsSpot = document.createElement('div');
            hsSpot.className = 'fcw-lny-headshot-spotlight';
            container.appendChild(hsSpot);

            // 4. Convergence Glow (Card center glow)
            var convergence = document.createElement('div');
            convergence.className = 'fcw-lny-convergence';
            container.appendChild(convergence);

            // 5. Volumetric Gold Beams (2 rotating layers)
            var beam1 = document.createElement('div');
            beam1.className = 'fcw-lny-beam layer-1';
            container.appendChild(beam1);
            var beam2 = document.createElement('div');
            beam2.className = 'fcw-lny-beam layer-2';
            container.appendChild(beam2);

            // 6. Shimmer Sweep
            var shimmer = document.createElement('div');
            shimmer.className = 'fcw-lny-shimmer-sweep';
            container.appendChild(shimmer);

            // 7. Edge Glow
            var edgeGlow = document.createElement('div');
            edgeGlow.className = 'fcw-lny-edge-glow';
            container.appendChild(edgeGlow);

            // 8. Gold Lens Flares (5 flares at various positions)
            var flarePositions = [
                { cls: 'primary', top: '20%', left: '25%', dur: '4s', delay: '0s' },
                { cls: 'secondary', top: '35%', left: '70%', dur: '3.5s', delay: '1.2s' },
                { cls: 'accent', top: '60%', left: '30%', dur: '3s', delay: '0.6s' },
                { cls: 'secondary', top: '75%', left: '65%', dur: '4.5s', delay: '2.1s' },
                { cls: 'accent', top: '15%', left: '80%', dur: '3.2s', delay: '1.8s' }
            ];
            for (var f = 0; f < flarePositions.length; f++) {
                var flare = document.createElement('div');
                flare.className = 'fcw-lny-flare ' + flarePositions[f].cls;
                flare.style.top = flarePositions[f].top;
                flare.style.left = flarePositions[f].left;
                flare.style.setProperty('--pulse-duration', flarePositions[f].dur);
                flare.style.setProperty('--pulse-delay', flarePositions[f].delay);
                container.appendChild(flare);
            }

            // 9. Light Rays (8 rays emanating from card center)
            for (var r = 0; r < 8; r++) {
                var ray = document.createElement('div');
                ray.className = 'fcw-lny-ray';
                ray.style.transform = 'rotate(' + (r * 45) + 'deg)';
                ray.style.setProperty('--ray-delay', (r * 0.3) + 's');
                container.appendChild(ray);
            }

            // 10. Sparkle Bursts (15 sparkles scattered)
            for (var s = 0; s < 15; s++) {
                var sparkBurst = document.createElement('div');
                sparkBurst.className = 'fcw-lny-sparkle-burst';
                sparkBurst.style.left = (Math.random() * 100) + '%';
                sparkBurst.style.top = (Math.random() * 100) + '%';
                var sbSize = 8 + Math.random() * 12;
                sparkBurst.style.width = sbSize + 'px';
                sparkBurst.style.height = sbSize + 'px';
                sparkBurst.style.setProperty('--sparkle-duration', (2 + Math.random() * 2) + 's');
                sparkBurst.style.setProperty('--sparkle-delay', (Math.random() * 4) + 's');
                container.appendChild(sparkBurst);
            }

            // 11. Floating Gold Sparkle Particles (40)
            for (var i = 0; i < 40; i++) {
                var sparkle = document.createElement('div');
                sparkle.className = 'fcw-lny-sparkle';
                sparkle.style.left = (Math.random() * 100) + '%';
                sparkle.style.bottom = (-5 + Math.random() * 30) + '%';
                var pSize = 3 + Math.random() * 5;
                sparkle.style.width = pSize + 'px';
                sparkle.style.height = pSize + 'px';
                sparkle.style.setProperty('--float-duration', (5 + Math.random() * 5) + 's');
                sparkle.style.setProperty('--float-delay', (-1 * Math.random() * 8) + 's');
                sparkle.style.setProperty('--drift-y', (-80 - Math.random() * 60) + 'vh');
                sparkle.style.setProperty('--drift-x', (-30 + Math.random() * 60) + 'px');
                container.appendChild(sparkle);
            }

            // 12. Cherry Blossom Petals (20)
            for (var p = 0; p < 20; p++) {
                var petal = document.createElement('div');
                petal.className = 'fcw-lny-petal';
                petal.style.left = (Math.random() * 110 - 5) + '%';
                petal.style.top = (-5 - Math.random() * 15) + '%';
                var petalSize = 10 + Math.random() * 8;
                petal.style.width = petalSize + 'px';
                petal.style.height = petalSize + 'px';
                petal.style.animationDuration = (9 + Math.random() * 8) + 's';
                petal.style.setProperty('--petal-delay', (-1 * Math.random() * 12) + 's');
                petal.style.setProperty('--petal-drift', (-60 + Math.random() * 120) + 'px');
                container.appendChild(petal);
            }

            // 13. Floating Red Lanterns (6 — detailed with body, cap, tassel)
            for (var l = 0; l < 6; l++) {
                var lantern = document.createElement('div');
                lantern.className = 'fcw-lny-lantern';
                var isLeft = l % 2 === 0;
                lantern.style.left = isLeft ? (3 + Math.random() * 22) + '%' : (75 + Math.random() * 22) + '%';
                lantern.style.bottom = (-20 - Math.random() * 15) + '%';
                lantern.style.animationDuration = (14 + Math.random() * 10) + 's';
                var lScale = 0.55 + Math.random() * 0.7;
                lantern.style.setProperty('--lantern-scale', lScale);
                lantern.style.setProperty('--lantern-delay', (-1 * Math.random() * 12) + 's');
                // Lantern sub-parts
                var cap = document.createElement('div');
                cap.className = 'fcw-lny-lantern-cap';
                lantern.appendChild(cap);
                var body = document.createElement('div');
                body.className = 'fcw-lny-lantern-body';
                lantern.appendChild(body);
                var tassel = document.createElement('div');
                tassel.className = 'fcw-lny-lantern-tassel';
                lantern.appendChild(tassel);
                container.appendChild(lantern);
            }

            // 14. Falling Gold Coins (10)
            for (var c = 0; c < 10; c++) {
                var coin = document.createElement('div');
                coin.className = 'fcw-lny-coin';
                coin.style.left = (Math.random() * 100) + '%';
                coin.style.top = (-8 - Math.random() * 40) + '%';
                coin.style.animationDuration = (6 + Math.random() * 7) + 's';
                coin.style.setProperty('--coin-delay', (-1 * Math.random() * 10) + 's');
                container.appendChild(coin);
            }
        }

        // --- GOTW Moments Effects Creation (Premium White Variant) ---
        // --- GOTW Moments Effects Creation (Premium White Variant) ---
        // --- GOTW Moments Effects Creation (Premium White Variant) ---
        function createGOTWMomentsEffects() {
            // Clear container
            gotwMomentsContainer.innerHTML = '';

            // 1. Royal White Beams (Layer 1 & 2)
            var beam1 = document.createElement('div');
            beam1.className = 'fcw-moment-beam layer-1';
            gotwMomentsContainer.appendChild(beam1);

            var beam2 = document.createElement('div');
            beam2.className = 'fcw-moment-beam layer-2';
            gotwMomentsContainer.appendChild(beam2);

            // 2. White Lens Flare (Background Glow)
            var flare = document.createElement('div');
            flare.className = 'fcw-white-flare';
            gotwMomentsContainer.appendChild(flare);

            // 3. Platinum Stardust
            var dust = document.createElement('div');
            dust.className = 'fcw-platinum-dust';
            gotwMomentsContainer.appendChild(dust);

            // 4. White Shimmer Sweep Overlay
            var shimmer = document.createElement('div');
            shimmer.className = 'fcw-gotwm-shimmer';
            gotwMomentsContainer.appendChild(shimmer);
        }

        // --- GOTW Moments Exclusive: Falling Diamond Asteroids ---
        var asteroidsMouseX = 0.5;
        var asteroidsMouseY = 0.5;

        function createDiamondAsteroids() {
            var canvas = document.createElement('canvas');
            canvas.className = 'fcw-ribbon-canvas'; // Reuse class for positioning

            // High Res
            // PERFORMANCE: Cap DPR at 1.5 for smooth 60fps
            var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
            var rectW = window.innerWidth;
            var rectH = window.innerHeight;

            canvas.width = rectW * dpr;
            canvas.height = rectH * dpr;
            canvas.style.width = rectW + 'px';
            canvas.style.height = rectH + 'px';

            // Removed drop-shadow filter for performance
            // canvas.style.filter = 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.5))';

            gotwMomentsContainer.appendChild(canvas);

            var ctx = canvas.getContext('2d');
            ctx.scale(dpr, dpr);

            var startTime = performance.now();
            var asteroids = [];
            var maxAsteroids = 15; // Reduced further for smoother FPS

            function handleMouseMove(e) {
                asteroidsMouseX = e.clientX / window.innerWidth;
                asteroidsMouseY = e.clientY / window.innerHeight;
            }
            document.addEventListener('mousemove', handleMouseMove, { passive: true });

            function render() {
                if (!modal.classList.contains('gotwmoments-active')) {
                    document.removeEventListener('mousemove', handleMouseMove);
                    return;
                }

                var time = (performance.now() - startTime) * 0.001;
                ctx.clearRect(0, 0, rectW, rectH);

                // Spawn New Asteroids
                if (asteroids.length < maxAsteroids) {
                    var xPos = Math.random() * rectW;
                    // Parallax spawn: higher up for background, lower for foreground
                    var scale = 0.5 + Math.random() * 1.0;
                    asteroids.push({
                        x: xPos,
                        y: -50 - Math.random() * 200,
                        z: scale, // Depth/Scale
                        speed: (100 + Math.random() * 150) * scale,
                        rotation: Math.random() * Math.PI * 2,
                        rotSpeed: (Math.random() - 0.5) * 2.0,
                        size: (3 + Math.random() * 5) * scale,
                        glimmerOffset: Math.random() * 10
                    });
                }

                // Mouse/Card Tilt Parallax Influence
                var tiltX = (asteroidsMouseX - 0.5) * 50;

                for (var i = asteroids.length - 1; i >= 0; i--) {
                    var a = asteroids[i];

                    // Physics
                    a.y += a.speed * 0.016; // Falling down
                    a.x -= tiltX * a.z * 0.05; // Slight horizontal parallax
                    a.rotation += a.rotSpeed * 0.016;

                    // Reset if off bottom
                    if (a.y > rectH + 50) {
                        asteroids.splice(i, 1);
                        continue;
                    }

                    // Render
                    ctx.save();
                    ctx.translate(a.x, a.y);
                    ctx.rotate(a.rotation);

                    // Glimmering Opacity
                    var brightness = 0.6 + 0.4 * Math.sin(time * 5 + a.glimmerOffset);
                    ctx.globalAlpha = brightness;

                    // Diamond Gradient
                    var grad = ctx.createLinearGradient(-a.size, -a.size, a.size, a.size);
                    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
                    grad.addColorStop(0.5, 'rgba(230, 240, 255, 0.9)'); // Blue-white tint
                    grad.addColorStop(1, 'rgba(255, 255, 255, 0.8)');

                    ctx.fillStyle = grad;

                    // Draw Diamond (Rhombus)
                    ctx.beginPath();
                    ctx.moveTo(0, -a.size * 1.5); // Top
                    ctx.lineTo(a.size, 0);         // Right
                    ctx.lineTo(0, a.size * 1.5);   // Bottom
                    ctx.lineTo(-a.size, 0);        // Left
                    ctx.closePath();
                    ctx.fill();

                    // Facet shine (cross)
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(0, -a.size * 1.5);
                    ctx.lineTo(0, a.size * 1.5);
                    ctx.moveTo(-a.size, 0);
                    ctx.lineTo(a.size, 0);
                    ctx.stroke();

                    ctx.restore();
                }

                requestAnimationFrame(render);
            }

            render();
        }


        // --- GOTW Moments Platinum Particles ---
        function createGOTWMomentsParticles(container) {
            for (var i = 0; i < 30; i++) {
                var ember = document.createElement('div');
                var rand = Math.random();
                // Mostly white/platinum particles with some purple/blue
                var colorClass = 'gotwm-white';
                if (rand > 0.6) colorClass = 'gotwm-purple';
                if (rand > 0.85) colorClass = 'gotwm-blue';
                ember.className = 'fcw-particle-ember ' + colorClass;
                ember.style.left = Math.random() * 100 + '%';
                var duration = 5 + Math.random() * 4;
                var delay = Math.random() * 6;
                ember.style.setProperty('--rise-duration', duration + 's');
                ember.style.setProperty('--rise-delay', delay + 's');
                ember.style.setProperty('--drift', (Math.random() * 60 - 30) + 'px');
                ember.style.setProperty('--max-opacity', (0.5 + Math.random() * 0.4).toString());
                container.appendChild(ember);
            }
        }

        // --- GOTW Theatre Spotlight Effects Creation ---
        function createGOTWEffects() {
            // Clear container
            gotwContainer.innerHTML = '';

            // 1. Left Purple Spotlight (pointing to card)
            var leftSpotlight = document.createElement('div');
            leftSpotlight.className = 'fcw-purple-spotlight left';
            gotwContainer.appendChild(leftSpotlight);

            // 2. Right Purple Spotlight (pointing to card)
            var rightSpotlight = document.createElement('div');
            rightSpotlight.className = 'fcw-purple-spotlight right';
            gotwContainer.appendChild(rightSpotlight);

            // 3. Headshot Spotlight (follows player headshot in center)
            var headshotSpotlight = document.createElement('div');
            headshotSpotlight.className = 'fcw-headshot-spotlight';
            headshotSpotlight.id = 'fcw-gotw-headshot-spotlight';
            gotwContainer.appendChild(headshotSpotlight);

            // 5. Central Convergence Glow (where spotlights meet on card)
            var convergence = document.createElement('div');
            convergence.className = 'fcw-spotlight-convergence';
            gotwContainer.appendChild(convergence);

            // 6. Purple Base Glow (illuminating from bottom)
            var baseGlow = document.createElement('div');
            baseGlow.className = 'fcw-base-glow';
            gotwContainer.appendChild(baseGlow);

            // 7. Ambient Base Glow Layer (for depth)
            var baseGlowAmbient = document.createElement('div');
            baseGlowAmbient.className = 'fcw-base-glow-ambient';
            gotwContainer.appendChild(baseGlowAmbient);

            // 8. Edge Glow
            var edgeGlow = document.createElement('div');
            edgeGlow.className = 'fcw-edge-glow';
            gotwContainer.appendChild(edgeGlow);

            // 8b. NEW: Royal Rotating Beams (Volumetric Background)
            var beam1 = document.createElement('div');
            beam1.className = 'fcw-royal-beam layer-1';
            gotwContainer.appendChild(beam1);

            var beam2 = document.createElement('div');
            beam2.className = 'fcw-royal-beam layer-2';
            gotwContainer.appendChild(beam2);

            // 8c. NEW: Cosmic Stardust (Glittering Background)
            var stardust = document.createElement('div');
            stardust.className = 'fcw-cosmic-dust';
            gotwContainer.appendChild(stardust);

            // 9. Lens Flares (scattered across the modal)
            var flarePositions = [
                { x: 15, y: 20, type: 'primary', duration: 3 },
                { x: 85, y: 25, type: 'primary', duration: 3.5 },
                { x: 25, y: 70, type: 'secondary', duration: 2.5 },
                { x: 75, y: 65, type: 'secondary', duration: 2.8 },
                { x: 50, y: 15, type: 'accent', duration: 2 },
                { x: 40, y: 80, type: 'accent', duration: 2.2 },
                { x: 60, y: 85, type: 'accent', duration: 2.3 }
            ];
            flarePositions.forEach(function (pos) {
                var flare = document.createElement('div');
                flare.className = 'fcw-lens-flare ' + pos.type;
                flare.style.left = pos.x + '%';
                flare.style.top = pos.y + '%';
                flare.style.setProperty('--pulse-duration', pos.duration + 's');
                // Use negative delay to start animation immediately at random phase
                flare.style.setProperty('--pulse-delay', (-1 * Math.random() * pos.duration) + 's');
                gotwContainer.appendChild(flare);
            });

            // 11. Floating Light Particles
            for (var i = 0; i < 15; i++) {
                var particle = document.createElement('div');
                particle.className = 'fcw-light-particle';
                particle.style.left = (10 + Math.random() * 80) + '%';
                particle.style.top = (20 + Math.random() * 60) + '%';
                var duration = 4 + Math.random() * 4;
                particle.style.setProperty('--float-duration', duration + 's');
                // Negative delay for instant start
                particle.style.setProperty('--float-delay', (-1 * Math.random() * duration) + 's');
                particle.style.setProperty('--drift-x', (Math.random() * 60 - 30) + 'px');
                particle.style.setProperty('--drift-y', (-30 - Math.random() * 50) + 'px');
                gotwContainer.appendChild(particle);
            }

            // 12. Light Rays emanating from card center
            var rayAngles = [-60, -30, 0, 30, 60];
            rayAngles.forEach(function (angle, idx) {
                var ray = document.createElement('div');
                ray.className = 'fcw-light-ray';
                ray.style.transform = 'translateX(-50%) rotate(' + angle + 'deg)';
                // Negative delay for immediate pulsing
                ray.style.setProperty('--ray-delay', (-1 * Math.random() * 2.5) + 's');
                gotwContainer.appendChild(ray);
            });

            // 14. NEW: Premium Sparkle Bursts (scattered luxury sparkles)
            var sparklePositions = [
                { x: 20, y: 15 }, { x: 80, y: 18 }, { x: 35, y: 75 },
                { x: 65, y: 78 }, { x: 12, y: 45 }, { x: 88, y: 50 },
                { x: 45, y: 10 }, { x: 55, y: 88 }, { x: 25, y: 35 },
                { x: 75, y: 40 }, { x: 15, y: 65 }, { x: 85, y: 68 }
            ];
            sparklePositions.forEach(function (pos, idx) {
                var sparkle = document.createElement('div');
                sparkle.className = 'fcw-sparkle-burst';
                sparkle.style.left = pos.x + '%';
                sparkle.style.top = pos.y + '%';
                var duration = 2 + Math.random() * 2;
                sparkle.style.setProperty('--sparkle-duration', duration + 's');
                // Negative delay for instant sparkle presence
                sparkle.style.setProperty('--sparkle-delay', (-1 * Math.random() * duration) + 's');
                gotwContainer.appendChild(sparkle);
            });
        }


        // --- Worlds Map Effects Creation (Global Tournament - Real Map) ---
        function createWorldsEffects() {
            // Clear any existing content
            worldsMapContainer.innerHTML = '';

            // 1. Create Wrapper for correct projection aspect ratio (2:1)
            var mapWrapper = document.createElement('div');
            mapWrapper.className = 'fcw-map-wrapper';
            worldsMapContainer.appendChild(mapWrapper);

            // 2. Real Map Layer (Static Purple-Tinted Image)
            var mapLayer = document.createElement('div');
            mapLayer.className = 'fcw-worlds-real-map';
            mapWrapper.appendChild(mapLayer);

            // 3. City Dots (Reduced count for performance - key cities only)
            var cities = [
                { l: 29.4, t: 27.4 }, // New York
                { l: 50.0, t: 21.4 }, // London
                { l: 88.8, t: 30.2 }, // Tokyo
                { l: 65.4, t: 36.0 }, // Dubai
                { l: 92.0, t: 68.8 }, // Sydney
                { l: 37.0, t: 63.0 }  // SÃ£o Paulo
            ];

            cities.forEach(function (c) {
                var dot = document.createElement('div');
                dot.className = 'fcw-city-dot';
                dot.style.left = c.l + '%';
                dot.style.top = c.t + '%';
                mapWrapper.appendChild(dot);
            });

            // 4. Premium Immersive Effects

            // Pulsing Glow Overlay
            var glowPulse = document.createElement('div');
            glowPulse.className = 'fcw-worlds-glow-pulse';
            worldsMapContainer.appendChild(glowPulse);

            // Shimmer Sweep Effect
            var shimmer = document.createElement('div');
            shimmer.className = 'fcw-worlds-shimmer';
            worldsMapContainer.appendChild(shimmer);

            // Cinematic Vignette
            var vignette = document.createElement('div');
            vignette.className = 'fcw-worlds-vignette';
            worldsMapContainer.appendChild(vignette);

            // 5. Floating Stars (Limited for performance)
            for (var i = 0; i < 12; i++) {
                var star = document.createElement('div');
                star.className = 'fcw-worlds-star';
                star.style.left = (5 + Math.random() * 90) + '%';
                star.style.top = (5 + Math.random() * 90) + '%';
                star.style.setProperty('--twinkle-duration', (3 + Math.random() * 4) + 's');
                star.style.setProperty('--twinkle-delay', (Math.random() * 5) + 's');
                worldsMapContainer.appendChild(star);
            }
        }

        // --- Worlds Ambient Particles (Optimized - Reduced Count) ---
        function createWorldsParticles(container) {
            // FPS FIX: Reduced from 45 to 15 particles
            for (var i = 0; i < 15; i++) {
                var ember = document.createElement('div');
                var rand = Math.random();
                var colorClass = 'worlds-purple';
                if (rand > 0.5) colorClass = 'worlds-gold';
                ember.className = 'fcw-particle-ember ' + colorClass;
                ember.style.left = Math.random() * 100 + '%';
                var duration = 5 + Math.random() * 4;
                var delay = Math.random() * 6;
                ember.style.setProperty('--rise-duration', duration + 's');
                ember.style.setProperty('--rise-delay', delay + 's');
                ember.style.setProperty('--drift', (Math.random() * 60 - 30) + 'px');
                ember.style.setProperty('--max-opacity', (0.4 + Math.random() * 0.3).toString());
                container.appendChild(ember);
            }
        }

        // --- TOTY 18 Effects (Royal Navy & Gold) ---
        function createTOTY18Effects() {
            toty18Container.innerHTML = '';

            // Create Sleek Golden Stripes
            for (var i = 0; i < 12; i++) {
                var stripe = document.createElement('div');
                stripe.className = 'fcw-toty18-stripe';

                // Varied thickness for "sleek" look (mix of thin and ambient beams)
                var isThick = Math.random() > 0.7;
                var height = isThick ? (30 + Math.random() * 50) : (1 + Math.random() * 3);
                stripe.style.setProperty('--stripe-height', height + 'px');

                // Colors: Bright Gold vs Pale Gold
                var color = Math.random() > 0.5 ? 'rgba(255, 215, 0, 0.8)' : 'rgba(255, 240, 180, 0.6)';
                stripe.style.setProperty('--stripe-color', color);

                // Shadow only for thin lines to make them pop
                stripe.style.setProperty('--stripe-shadow', isThick ? 'transparent' : 'rgba(255, 215, 0, 0.8)');

                // Offset Y (Perpendicular spread across the diagonal)
                // Spread wide to cover the whole modal
                var offsetY = (Math.random() * 200 - 100) + 'vh';
                stripe.style.setProperty('--offset-y', offsetY);

                // Opacity
                var maxOp = isThick ? (0.05 + Math.random() * 0.1) : (0.6 + Math.random() * 0.4);
                stripe.style.setProperty('--max-opacity', maxOp.toString());

                // Timing
                var duration = 3 + Math.random() * 4;
                var delay = Math.random() * -5;
                stripe.style.setProperty('--duration', duration + 's');
                stripe.style.setProperty('--delay', delay + 's');

                toty18Container.appendChild(stripe);
            }
        }

        function createTOTY18Particles(container) {
            for (var i = 0; i < 25; i++) {
                var ember = document.createElement('div');
                // Mix of Blue and Gold particles
                var colorClass = Math.random() > 0.5 ? 'toty18-blue' : 'toty18-gold';
                ember.className = 'fcw-particle-ember ' + colorClass;

                ember.style.left = Math.random() * 100 + '%';
                var duration = 4 + Math.random() * 3;
                var delay = Math.random() * 5;
                ember.style.setProperty('--rise-duration', duration + 's');
                ember.style.setProperty('--rise-delay', delay + 's');
                ember.style.setProperty('--drift', (Math.random() * 60 - 30) + 'px');
                ember.style.setProperty('--max-opacity', (0.5 + Math.random() * 0.4).toString());

                container.appendChild(ember);
            }
        }

        // --- TOTY 26 Effects (Blue & Gold Luxury) ---
        function createTOTY26Effects() {
            if (ambientParticles) ambientParticles.innerHTML = '';

            // 1. Pulsing Spotlight (Blue/Gold Blend)
            var spotlight = document.createElement('div');
            spotlight.className = 'fcw-toty26-spotlight';
            ambientParticles.appendChild(spotlight);

            // 2. Shimmer Sweep Layer
            var shimmer = document.createElement('div');
            shimmer.className = 'fcw-toty26-shimmer';
            ambientParticles.appendChild(shimmer);

            // 3. Rising Particles (Blue & Gold Mix)
            for (var i = 0; i < 80; i++) {
                var particle = document.createElement('div');
                particle.className = 'fcw-toty26-particle';
                // Alternate between blue and gold
                if (Math.random() > 0.5) {
                    particle.classList.add('blue');
                } else {
                    particle.classList.add('gold');
                }
                particle.style.left = (Math.random() * 100) + '%';
                particle.style.bottom = (-5 + Math.random() * 20) + '%';
                var duration = 4 + Math.random() * 4;
                particle.style.animationDuration = duration + 's';
                particle.style.animationDelay = (-1 * Math.random() * duration) + 's';
                var size = 3 + Math.random() * 4;
                particle.style.width = size + 'px';
                particle.style.height = size + 'px';
                ambientParticles.appendChild(particle);
            }

            // 4. Quick Glints (Sparkles)
            for (var g = 0; g < 30; g++) {
                var glint = document.createElement('div');
                glint.className = 'fcw-toty26-glint';
                glint.style.left = (Math.random() * 100) + '%';
                glint.style.top = (Math.random() * 100) + '%';
                glint.style.animationDelay = (g * 0.1) + 's';
                glint.style.animationDuration = (2 + Math.random() * 2) + 's';
                ambientParticles.appendChild(glint);
            }

            // 5. Headshot Golden Glow (behind player image)
            var clonedCard = modal.querySelector('.fcw-cloned-card');
            if (clonedCard) {
                var headshotImgs = clonedCard.querySelectorAll('img[src*="headshot"]');
                headshotImgs.forEach(function (headshot) {
                    if (headshot && headshot.src) {
                        var parent = headshot.parentElement;
                        if (parent) {
                            parent.style.position = 'relative';
                            var glowOverlay = document.createElement('div');
                            glowOverlay.className = 'fcw-toty26-headshot-glow';
                            glowOverlay.style.backgroundImage = 'url(' + headshot.src + ')';
                            parent.insertBefore(glowOverlay, headshot);
                        }
                    }
                });
            }
        }

        // --- Black Friday Effects Creation (Premium Shopping Theme) ---
        function createBlackFridayEffects() {
            // Clear container
            blackFridayContainer.innerHTML = '';

            // 1. Dark Vignette
            var vignette = document.createElement('div');
            vignette.className = 'fcw-bf-vignette';
            blackFridayContainer.appendChild(vignette);

            // 2. Gold Shimmer Sweep
            var shimmer = document.createElement('div');
            shimmer.className = 'fcw-bf-shimmer';
            blackFridayContainer.appendChild(shimmer);

            // 3. GEOMETRIC LUXURY THEME GENERATION

            // 3a. Premium Obsidian Crystal Shards
            // Large, irregular glass polygons with realistic motion
            for (var i = 0; i < 6; i++) {
                var shard = document.createElement('div');
                shard.className = 'fcw-bf-shard';

                // LARGER dimensions for premium presence (150-350px)
                var w = 150 + Math.random() * 200;
                var h = 150 + Math.random() * 200;
                shard.style.width = w + 'px';
                shard.style.height = h + 'px';

                // Spread across viewport with more variation
                shard.style.left = (Math.random() * 70 + 5) + '%';
                shard.style.top = (Math.random() * 70 + 5) + '%';

                // More complex irregular polygon shapes (5-6 vertices for crystal look)
                // Creates asymmetric, gem-like cuts
                var vertices = [
                    `${5 + Math.random() * 15}% ${Math.random() * 10}%`,      // Top left point
                    `${45 + Math.random() * 15}% ${Math.random() * 8}%`,      // Top center
                    `${85 + Math.random() * 15}% ${5 + Math.random() * 15}%`, // Top right
                    `${90 + Math.random() * 10}% ${50 + Math.random() * 20}%`, // Right edge
                    `${80 + Math.random() * 15}% ${90 + Math.random() * 10}%`, // Bottom right
                    `${Math.random() * 15}% ${85 + Math.random() * 15}%`      // Bottom left
                ];
                shard.style.clipPath = `polygon(${vertices.join(', ')})`;

                // Slower, more elegant motion
                shard.style.setProperty('--float-duration', (18 + Math.random() * 10) + 's');
                shard.style.setProperty('--float-delay', (i * 2) + 's');
                shard.style.setProperty('--move-x', (Math.random() * 100 - 50) + 'px');
                shard.style.setProperty('--move-y', (Math.random() * 100 - 50) + 'px');

                blackFridayContainer.appendChild(shard);
            }

            // 3b. Volumetric Searchlight Beams
            for (var j = 0; j < 3; j++) {
                var beam = document.createElement('div');
                beam.className = 'fcw-bf-beam';
                beam.style.setProperty('--beam-duration', (18 + j * 6) + 's');
                beam.style.opacity = (0.3 + j * 0.1);
                // Offset rotations
                // Using transform in JS to set initial state, CSS handles animation
                beam.style.animationDelay = -(j * 5) + 's';
                blackFridayContainer.appendChild(beam);
            }

            // 3c. Kinetic Vertical Lines (Scanner Effect)
            for (var k = 0; k < 12; k++) {
                var line = document.createElement('div');
                line.className = 'fcw-bf-kinetic-line';
                line.style.left = (Math.random() * 100) + '%';
                line.style.setProperty('--scan-duration', (4 + Math.random() * 4) + 's');
                line.style.animationDelay = (Math.random() * 5) + 's';
                blackFridayContainer.appendChild(line);
            }

            // 4. Gold Border Glow
            var borderGlow = document.createElement('div');
            borderGlow.className = 'fcw-bf-border-glow';
            blackFridayContainer.appendChild(borderGlow);
        }

        // --- Black Friday Particles (Gold & Red) ---
        function createBlackFridayParticles(container) {
            for (var i = 0; i < 20; i++) {
                var ember = document.createElement('div');
                var rand = Math.random();
                var colorClass = 'bf-gold';
                if (rand > 0.6) colorClass = 'bf-red';
                if (rand > 0.85) colorClass = 'bf-white';
                ember.className = 'fcw-particle-ember ' + colorClass;
                ember.style.left = Math.random() * 100 + '%';
                var duration = 5 + Math.random() * 4;
                var delay = Math.random() * 6;
                ember.style.setProperty('--rise-duration', duration + 's');
                ember.style.setProperty('--rise-delay', delay + 's');
                ember.style.setProperty('--drift', (Math.random() * 60 - 30) + 'px');
                ember.style.setProperty('--max-opacity', (0.5 + Math.random() * 0.4).toString());
                container.appendChild(ember);
            }
        }

        // --- FW Icon Halloween Luxury White Glow Effects (GPU Optimized + INSTANT) ---
        function createFWIconHWEffects() {
            // Clear container
            fwIconHWContainer.innerHTML = '';

            // 1. Central Spotlight (Illuminates the card) - INSTANT
            var spotlight = document.createElement('div');
            spotlight.className = 'fcw-fwihw-spotlight';
            fwIconHWContainer.appendChild(spotlight);



            // 3. Edge Glow - INSTANT
            var edgeGlow = document.createElement('div');
            edgeGlow.className = 'fcw-fwihw-edge-glow';
            fwIconHWContainer.appendChild(edgeGlow);

            // 4. White Light Rays (Radiating from center)
            var rayAngles = [-70, -45, -20, 0, 20, 45, 70];
            rayAngles.forEach(function (angle, idx) {
                var ray = document.createElement('div');
                ray.className = 'fcw-fwihw-ray';
                ray.style.transform = 'translateX(-50%) rotate(' + angle + 'deg)';
                ray.style.setProperty('--ray-delay', (-1 * idx * 0.3) + 's');
                fwIconHWContainer.appendChild(ray);
            });

            // 5. Floating White Orbs (More orbs for richer effect)
            var orbPositions = [
                { x: 12, y: 18, size: 70 },
                { x: 88, y: 22, size: 60 },
                { x: 18, y: 78, size: 55 },
                { x: 82, y: 72, size: 65 },
                { x: 50, y: 8, size: 50 },
                { x: 8, y: 45, size: 45 },
                { x: 92, y: 50, size: 48 }
            ];
            orbPositions.forEach(function (pos) {
                var orb = document.createElement('div');
                orb.className = 'fcw-fwihw-orb';
                orb.style.left = pos.x + '%';
                orb.style.top = pos.y + '%';
                orb.style.width = pos.size + 'px';
                orb.style.height = pos.size + 'px';
                var duration = 6 + Math.random() * 5;
                orb.style.setProperty('--orb-duration', duration + 's');
                orb.style.setProperty('--orb-delay', (-1 * Math.random() * duration) + 's');
                orb.style.setProperty('--drift-x1', (Math.random() * 40 - 20) + 'px');
                orb.style.setProperty('--drift-y1', (Math.random() * 40 - 20) + 'px');
                orb.style.setProperty('--drift-x2', (Math.random() * 30 - 15) + 'px');
                orb.style.setProperty('--drift-y2', (Math.random() * 30 - 15) + 'px');
                orb.style.setProperty('--drift-x3', (Math.random() * 45 - 22) + 'px');
                orb.style.setProperty('--drift-y3', (Math.random() * 45 - 22) + 'px');
                fwIconHWContainer.appendChild(orb);
            });

            // 6. Lens Flares (Scattered for luxury feel)
            var flareData = [
                { x: 15, y: 18, type: 'large', duration: 3 },
                { x: 85, y: 20, type: 'large', duration: 3.5 },
                { x: 25, y: 75, type: 'medium', duration: 2.5 },
                { x: 75, y: 70, type: 'medium', duration: 2.8 },
                { x: 50, y: 12, type: 'small', duration: 2 },
                { x: 10, y: 50, type: 'small', duration: 2.2 },
                { x: 90, y: 55, type: 'small', duration: 2.3 },
                { x: 35, y: 85, type: 'small', duration: 2.1 },
                { x: 65, y: 88, type: 'small', duration: 2.4 }
            ];
            flareData.forEach(function (data) {
                var flare = document.createElement('div');
                flare.className = 'fcw-fwihw-flare ' + data.type;
                flare.style.left = data.x + '%';
                flare.style.top = data.y + '%';
                flare.style.setProperty('--flare-duration', data.duration + 's');
                flare.style.setProperty('--flare-delay', (-1 * Math.random() * data.duration) + 's');
                fwIconHWContainer.appendChild(flare);
            });

            // 7. White Light Particles (More particles, instant visible)
            for (var i = 0; i < 18; i++) {
                var particle = document.createElement('div');
                particle.className = 'fcw-fwihw-particle';
                particle.style.left = (5 + Math.random() * 90) + '%';
                particle.style.bottom = (5 + Math.random() * 30) + '%';
                var duration = 4 + Math.random() * 3;
                particle.style.setProperty('--particle-duration', duration + 's');
                particle.style.setProperty('--particle-delay', (-1 * Math.random() * duration) + 's');
                particle.style.setProperty('--rise-y', (-180 - Math.random() * 120) + 'px');
                particle.style.setProperty('--drift-x', (Math.random() * 80 - 40) + 'px');
                fwIconHWContainer.appendChild(particle);
            }

            // 8. Ambient White Mist (Floating clouds)
            var mistData = [
                { x: 20, y: 30, w: 200, h: 150 },
                { x: 70, y: 25, w: 180, h: 130 },
                { x: 15, y: 65, w: 160, h: 120 },
                { x: 80, y: 70, w: 170, h: 140 }
            ];
            mistData.forEach(function (data) {
                var mist = document.createElement('div');
                mist.className = 'fcw-fwihw-mist';
                mist.style.left = data.x + '%';
                mist.style.top = data.y + '%';
                mist.style.width = data.w + 'px';
                mist.style.height = data.h + 'px';
                var duration = 10 + Math.random() * 8;
                mist.style.setProperty('--mist-duration', duration + 's');
                mist.style.setProperty('--mist-delay', (-1 * Math.random() * duration) + 's');
                mist.style.setProperty('--mist-x', (Math.random() * 60 - 30) + 'px');
                mist.style.setProperty('--mist-y', (Math.random() * 40 - 20) + 'px');
                fwIconHWContainer.appendChild(mist);
            });

            // 9. Starburst Accents (More starbursts)
            var starPositions = [
                { x: 8, y: 12 }, { x: 92, y: 10 }, { x: 12, y: 88 }, { x: 90, y: 85 },
                { x: 50, y: 5 }, { x: 5, y: 50 }, { x: 95, y: 48 }, { x: 50, y: 95 },
                { x: 25, y: 25 }, { x: 75, y: 22 }, { x: 22, y: 75 }, { x: 78, y: 78 }
            ];
            starPositions.forEach(function (pos) {
                var star = document.createElement('div');
                star.className = 'fcw-fwihw-starburst';
                star.style.left = pos.x + '%';
                star.style.top = pos.y + '%';
                var duration = 1.5 + Math.random() * 1.5;
                star.style.setProperty('--twinkle-duration', duration + 's');
                star.style.setProperty('--twinkle-delay', (-1 * Math.random() * duration) + 's');
                fwIconHWContainer.appendChild(star);
            });

            // 10. Diamond Sparkles (Luxury accent)
            var diamondPositions = [
                { x: 30, y: 15 }, { x: 70, y: 18 }, { x: 20, y: 60 }, { x: 80, y: 55 },
                { x: 45, y: 35 }, { x: 55, y: 65 }, { x: 35, y: 80 }, { x: 65, y: 82 },
                { x: 15, y: 40 }, { x: 85, y: 42 }
            ];
            diamondPositions.forEach(function (pos) {
                var diamond = document.createElement('div');
                diamond.className = 'fcw-fwihw-diamond';
                diamond.style.left = pos.x + '%';
                diamond.style.top = pos.y + '%';
                var duration = 1.2 + Math.random() * 1.3;
                diamond.style.setProperty('--diamond-duration', duration + 's');
                diamond.style.setProperty('--diamond-delay', (-1 * Math.random() * duration) + 's');
                fwIconHWContainer.appendChild(diamond);
            });
        }

        // --- Prize Card Effects (Red/Black) - GPU Optimized ---
        function createPrizeEffects() {
            prizeContainer.innerHTML = '';
            // FORCE CLEAR AMBIENT PARTICLES (To remove any yellow sparkles)
            if (ambientParticles) ambientParticles.innerHTML = '';

            // 1. Red Spotlight (Central Glow)
            var spotlight = document.createElement('div');
            spotlight.className = 'fcw-prize-spotlight';
            prizeContainer.appendChild(spotlight);

            // 2. Red & Dark Particles (Increased count)
            for (var i = 0; i < 80; i++) {
                var particle = document.createElement('div');
                particle.className = 'fcw-prize-particle';
                if (Math.random() > 0.55) particle.classList.add('black');
                particle.style.left = (Math.random() * 100) + '%';
                particle.style.bottom = (Math.random() * 40 - 5) + '%';
                var duration = 2.5 + Math.random() * 2;
                particle.style.animationDuration = duration + 's';
                particle.style.animationDelay = (-1 * Math.random() * duration) + 's'; // Negative for instant visibility
                var size = 3 + Math.random() * 4;
                if (particle.classList.contains('black')) size += 1;
                particle.style.width = size + 'px';
                particle.style.height = size + 'px';
                prizeContainer.appendChild(particle);
            }

            // 3. Glow Rays (Increased count)
            for (var j = 0; j < 12; j++) {
                var ray = document.createElement('div');
                ray.className = 'fcw-prize-ray';
                ray.style.left = (30 + j * 4) + '%';
                ray.style.bottom = '5%';
                ray.style.transform = 'rotate(' + (-25 + j * 5) + 'deg) translateZ(0)';
                ray.style.animationDelay = (j * 0.15) + 's';
                ray.style.height = (80 + Math.random() * 80) + 'px';
                prizeContainer.appendChild(ray);
            }

            // 4. Embers (Increased count)
            for (var k = 0; k < 40; k++) {
                var ember = document.createElement('div');
                ember.className = 'fcw-prize-ember';
                ember.style.left = (5 + Math.random() * 90) + '%';
                ember.style.bottom = (Math.random() * 30) + '%';
                var emberDur = 3 + Math.random() * 2;
                ember.style.animationDuration = emberDur + 's';
                ember.style.animationDelay = (-1 * Math.random() * emberDur) + 's';
                prizeContainer.appendChild(ember);
            }

            // 5. Ambient Red/Black Particles (Replace yellow)
            for (var m = 0; m < 50; m++) {
                var ambient = document.createElement('div');
                ambient.className = 'fcw-prize-ambient';
                if (Math.random() > 0.5) ambient.classList.add('dark');
                ambient.style.left = (Math.random() * 100) + '%';
                ambient.style.bottom = (-10 - Math.random() * 20) + '%';
                var ambDur = 5 + Math.random() * 4;
                ambient.style.animationDuration = ambDur + 's';
                ambient.style.animationDelay = (-1 * Math.random() * ambDur) + 's';
                prizeContainer.appendChild(ambient);
            }
        }

        // --- Power Lightning Effects (Electric Storm) â€” V2 ULTRA ---
        var powerLightningInterval = null;
        var powerLightningAnimId = null;
        var powerCursorInterval = null;
        var powerLastMouseX = 0;
        var powerLastMouseY = 0;
        var powerMouseSpeed = 0;
        var powerMouseHandler = null;
        var powerHeadshotOverlay = null;

        function createPowerLightningEffects(targetCard) {
            powerContainer.innerHTML = '';

            // === LAYER 1: Storm clouds at top (no blur filter for performance) ===
            var cloudLayer = document.createElement('div');
            cloudLayer.className = 'fcw-power-clouds';
            powerContainer.appendChild(cloudLayer);
            for (var c = 0; c < 5; c++) {
                var cloud = document.createElement('div');
                cloud.className = 'fcw-power-cloud';
                cloud.style.left = (-10 + c * 22 + Math.random() * 10) + '%';
                cloud.style.top = (-8 + Math.random() * 6) + '%';
                cloud.style.width = (200 + Math.random() * 100) + 'px';
                cloud.style.height = (70 + Math.random() * 40) + 'px';
                cloud.style.animationDuration = (12 + Math.random() * 8) + 's';
                cloud.style.animationDelay = (-Math.random() * 10) + 's';
                cloud.style.opacity = (0.35 + Math.random() * 0.25).toString();
                cloudLayer.appendChild(cloud);
            }

            // === LAYER 2: Lightning canvas ===
            var canvas = document.createElement('canvas');
            canvas.className = 'fcw-power-canvas';
            canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:10;';
            powerContainer.appendChild(canvas);

            // === LAYER 3: Flash overlay ===
            var flash = document.createElement('div');
            flash.className = 'fcw-power-flash';
            powerContainer.appendChild(flash);

            // === LAYER 4: Electric glow ===
            var glow = document.createElement('div');
            glow.className = 'fcw-power-glow';
            powerContainer.appendChild(glow);

            // === LAYER 5: Rain particles (lightweight) ===
            var rainLayer = document.createElement('div');
            rainLayer.className = 'fcw-power-rain-layer';
            powerContainer.appendChild(rainLayer);
            for (var r = 0; r < 25; r++) {
                var drop = document.createElement('div');
                drop.className = 'fcw-power-raindrop';
                drop.style.left = (Math.random() * 105 - 2) + '%';
                drop.style.animationDuration = (0.4 + Math.random() * 0.4) + 's';
                drop.style.animationDelay = (-Math.random() * 1) + 's';
                drop.style.opacity = (0.1 + Math.random() * 0.25).toString();
                drop.style.height = (18 + Math.random() * 20) + 'px';
                rainLayer.appendChild(drop);
            }

            // === LAYER 6: Electric spark particles ===
            for (var p = 0; p < 18; p++) {
                var spark = document.createElement('div');
                spark.className = 'fcw-power-spark';
                spark.style.left = (Math.random() * 100) + '%';
                spark.style.top = (Math.random() * 100) + '%';
                spark.style.animationDuration = (1.5 + Math.random() * 2.5) + 's';
                spark.style.animationDelay = (-Math.random() * 3) + 's';
                var sparkSize = 2 + Math.random() * 2;
                spark.style.width = sparkSize + 'px';
                spark.style.height = sparkSize + 'px';
                powerContainer.appendChild(spark);
            }

            // === LAYER 7: Electric arc tendrils ===
            var arcCanvas = document.createElement('canvas');
            arcCanvas.className = 'fcw-power-arcs';
            arcCanvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:11;';
            powerContainer.appendChild(arcCanvas);

            // === HEADSHOT ELECTRIC OVERLAY ===
            if (targetCard) {
                var headshot = targetCard.querySelector('.player-face26');
                if (headshot && headshot.src && headshot.src.indexOf('cdn.fc-watch.com/img/26/headshot/') !== -1) {
                    powerHeadshotOverlay = document.createElement('div');
                    powerHeadshotOverlay.className = 'fcw-power-headshot-overlay';
                    powerHeadshotOverlay.style.backgroundImage = 'url(' + headshot.src + ')';
                    var parent = headshot.parentElement;
                    if (parent) {
                        parent.style.position = 'relative';
                        parent.appendChild(powerHeadshotOverlay);
                        powerHeadshotOverlay.classList.add('active');
                    }
                }
            }

            var dpr = window.devicePixelRatio || 1;

            function resizeCanvas() {
                canvas.width = canvas.offsetWidth * dpr;
                canvas.height = canvas.offsetHeight * dpr;
                arcCanvas.width = arcCanvas.offsetWidth * dpr;
                arcCanvas.height = arcCanvas.offsetHeight * dpr;
            }
            resizeCanvas();

            var ctx = canvas.getContext('2d');
            var arcCtx = arcCanvas.getContext('2d');

            // --- Lightning bolt drawing (2-pass, heavy) ---
            function drawBolt(context, x1, y1, x2, y2, depth, maxDepth, intensity) {
                if (depth > maxDepth) return;

                var segments = 12 + Math.floor(Math.random() * 6);
                var dx = (x2 - x1) / segments;
                var dy = (y2 - y1) / segments;
                var jitter = (canvas.width * 0.14) / (depth + 1);

                var points = [{ x: x1, y: y1 }];

                for (var i = 1; i < segments; i++) {
                    var px = x1 + dx * i + (Math.random() - 0.5) * jitter;
                    var py = y1 + dy * i + (Math.random() - 0.5) * jitter * 0.4;
                    points.push({ x: px, y: py });

                    if (depth < 2 && Math.random() < (0.38 - depth * 0.12)) {
                        var branchLen = (canvas.height * (0.2 - depth * 0.05));
                        var angle = (Math.random() - 0.5) * Math.PI * 0.7;
                        var bx = px + Math.cos(angle) * branchLen;
                        var by = py + Math.abs(Math.sin(angle + Math.PI / 3)) * branchLen;
                        drawBolt(context, px, py, bx, by, depth + 1, maxDepth, intensity * 0.55);
                    }
                }
                points.push({ x: x2, y: y2 });

                // Pass 1: Wide outer glow (heavy)
                context.beginPath();
                context.moveTo(points[0].x, points[0].y);
                for (var a = 1; a < points.length; a++) context.lineTo(points[a].x, points[a].y);
                context.strokeStyle = 'rgba(70, 140, 255, ' + (0.4 * intensity / (depth + 1)) + ')';
                context.lineWidth = Math.max(2, (14 - depth * 4));
                context.shadowColor = 'rgba(50, 120, 255, 0.8)';
                context.shadowBlur = 30;
                context.lineCap = 'round';
                context.lineJoin = 'round';
                context.stroke();

                // Pass 2: Bright white core (thicker)
                context.beginPath();
                context.moveTo(points[0].x, points[0].y);
                for (var b = 1; b < points.length; b++) context.lineTo(points[b].x, points[b].y);
                context.strokeStyle = 'rgba(230, 245, 255, ' + (0.95 * intensity / (depth + 1)) + ')';
                context.lineWidth = Math.max(1.5, (4 - depth));
                context.shadowColor = 'rgba(200, 230, 255, 1)';
                context.shadowBlur = 12;
                context.stroke();

                context.shadowBlur = 0;
            }

            // --- Arc tendrils (lightweight, fewer arcs, less shadowBlur) ---
            function drawArcTendrils() {
                if (!modal.classList.contains('power-active')) return;
                arcCtx.clearRect(0, 0, arcCanvas.width, arcCanvas.height);

                var cx = arcCanvas.width / 2;
                var cy = arcCanvas.height / 2;
                var numArcs = 2 + Math.floor(Math.random() * 2);

                for (var a = 0; a < numArcs; a++) {
                    var angle = Math.random() * Math.PI * 2;
                    var radius = arcCanvas.width * (0.08 + Math.random() * 0.05);
                    var startX = cx + Math.cos(angle) * radius;
                    var startY = cy + Math.sin(angle) * radius;
                    var endAngle = angle + (Math.random() - 0.5) * Math.PI;
                    var endRadius = radius + arcCanvas.width * (0.04 + Math.random() * 0.06);
                    var endX = cx + Math.cos(endAngle) * endRadius;
                    var endY = cy + Math.sin(endAngle) * endRadius;

                    var segs = 5 + Math.floor(Math.random() * 3);
                    var arcPoints = [{ x: startX, y: startY }];
                    for (var s = 1; s < segs; s++) {
                        var t = s / segs;
                        var mx = startX + (endX - startX) * t + (Math.random() - 0.5) * 16 * dpr;
                        var my = startY + (endY - startY) * t + (Math.random() - 0.5) * 16 * dpr;
                        arcPoints.push({ x: mx, y: my });
                    }
                    arcPoints.push({ x: endX, y: endY });

                    // Glow + core in one pass
                    arcCtx.beginPath();
                    arcCtx.moveTo(arcPoints[0].x, arcPoints[0].y);
                    for (var j = 1; j < arcPoints.length; j++) arcCtx.lineTo(arcPoints[j].x, arcPoints[j].y);
                    arcCtx.strokeStyle = 'rgba(120, 190, 255, 0.5)';
                    arcCtx.lineWidth = 3;
                    arcCtx.shadowColor = 'rgba(80, 160, 255, 0.7)';
                    arcCtx.shadowBlur = 8;
                    arcCtx.lineCap = 'round';
                    arcCtx.stroke();
                    arcCtx.shadowBlur = 0;

                    arcCtx.beginPath();
                    arcCtx.moveTo(arcPoints[0].x, arcPoints[0].y);
                    for (var k = 1; k < arcPoints.length; k++) arcCtx.lineTo(arcPoints[k].x, arcPoints[k].y);
                    arcCtx.strokeStyle = 'rgba(220, 240, 255, 0.7)';
                    arcCtx.lineWidth = 1;
                    arcCtx.stroke();
                }
            }

            // Arc tendril refresh (slower for performance)
            var arcInterval = setInterval(function () {
                if (modal.classList.contains('power-active')) {
                    drawArcTendrils();
                } else {
                    clearInterval(arcInterval);
                }
            }, 350);

            // --- Main lightning strike ---
            function triggerLightning() {
                if (!modal.classList.contains('power-active')) return;
                resizeCanvas();

                var numBolts = 1 + Math.floor(Math.random() * 2); // Max 2 bolts
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                for (var b = 0; b < numBolts; b++) {
                    var startX = canvas.width * (0.1 + Math.random() * 0.8);
                    var startY = canvas.height * 0.02;
                    var targetCenter = Math.random() < 0.3;
                    var endX, endY;
                    if (targetCenter) {
                        endX = canvas.width * (0.35 + Math.random() * 0.3);
                        endY = canvas.height * (0.35 + Math.random() * 0.3);
                    } else {
                        endX = startX + (Math.random() - 0.5) * canvas.width * 0.5;
                        endY = canvas.height * (0.85 + Math.random() * 0.15);
                    }
                    drawBolt(ctx, startX, startY, endX, endY, 0, 2, 1.0);
                }

                // Double-flash strobe
                flash.classList.add('strike');
                setTimeout(function () {
                    flash.classList.remove('strike');
                    setTimeout(function () {
                        flash.classList.add('strike-secondary');
                        setTimeout(function () { flash.classList.remove('strike-secondary'); }, 100);
                    }, 60);
                }, 100);

                // === Sync headshot flash with this lightning strike ===
                if (powerHeadshotOverlay) {
                    // Primary flash â€” synced with bolt
                    powerHeadshotOverlay.classList.add('flash');
                    setTimeout(function () {
                        if (powerHeadshotOverlay) powerHeadshotOverlay.classList.remove('flash');
                    }, 100);
                    // Double-strike on headshot too (matches background secondary flash)
                    if (Math.random() < 0.5) {
                        setTimeout(function () {
                            if (powerHeadshotOverlay) {
                                powerHeadshotOverlay.classList.add('flash');
                                setTimeout(function () {
                                    if (powerHeadshotOverlay) powerHeadshotOverlay.classList.remove('flash');
                                    // Brief crackle after flash fades
                                    if (powerHeadshotOverlay) {
                                        powerHeadshotOverlay.classList.add('crackle');
                                        setTimeout(function () {
                                            if (powerHeadshotOverlay) powerHeadshotOverlay.classList.remove('crackle');
                                        }, 150);
                                    }
                                }, 60);
                            }
                        }, 160);
                    }
                }

                // Glow pulse
                glow.classList.add('pulse');
                setTimeout(function () { glow.classList.remove('pulse'); }, 600);

                // Illuminate clouds
                cloudLayer.classList.add('fcw-power-clouds-lit');
                setTimeout(function () { cloudLayer.classList.remove('fcw-power-clouds-lit'); }, 300);

                // Fade out bolt
                var fadeStart = performance.now();
                function fadeBolt(now) {
                    var elapsed = now - fadeStart;
                    var progress = Math.min(elapsed / 250, 1);
                    ctx.globalAlpha = 1 - progress;
                    if (progress < 1) {
                        powerLightningAnimId = requestAnimationFrame(fadeBolt);
                    } else {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.globalAlpha = 1;
                    }
                }
                setTimeout(function () {
                    fadeStart = performance.now();
                    powerLightningAnimId = requestAnimationFrame(fadeBolt);
                }, 60);
            }

            // Initial bolt, then fast ambient interval
            setTimeout(triggerLightning, 300);
            powerLightningInterval = setInterval(function () {
                if (modal.classList.contains('power-active')) {
                    triggerLightning();
                }
            }, 800 + Math.random() * 1200);

            // --- Cursor-reactive lightning: faster mouse = more lightning ---
            powerMouseHandler = function (e) {
                var dx = e.clientX - powerLastMouseX;
                var dy = e.clientY - powerLastMouseY;
                powerLastMouseX = e.clientX;
                powerLastMouseY = e.clientY;
                powerMouseSpeed = Math.sqrt(dx * dx + dy * dy);
            };
            modal.addEventListener('mousemove', powerMouseHandler);

            powerCursorInterval = setInterval(function () {
                if (!modal.classList.contains('power-active')) {
                    clearInterval(powerCursorInterval);
                    return;
                }
                // Trigger extra bolts based on cursor speed
                // Slow movement (< 30): nothing extra
                // Medium (30-80): occasional bolt
                // Fast (80+): rapid bolts
                if (powerMouseSpeed > 30) {
                    var chance = Math.min((powerMouseSpeed - 30) / 80, 1.0);
                    if (Math.random() < chance) {
                        triggerLightning();
                    }
                }
                powerMouseSpeed *= 0.7; // Decay speed
            }, 300);
        }

        function stopPowerAudio() {
            if (powerLightningInterval) { clearInterval(powerLightningInterval); powerLightningInterval = null; }
            if (powerLightningAnimId) { cancelAnimationFrame(powerLightningAnimId); powerLightningAnimId = null; }
            if (powerCursorInterval) { clearInterval(powerCursorInterval); powerCursorInterval = null; }
            if (powerMouseHandler) { modal.removeEventListener('mousemove', powerMouseHandler); powerMouseHandler = null; }
            if (powerHeadshotOverlay) { powerHeadshotOverlay.remove(); powerHeadshotOverlay = null; }
            powerMouseSpeed = 0;
        }

        // ==========================================
        // VALENTINES DAY EFFECTS
        // ==========================================
        var valentinesContainer = null;
        var valentinesInterval = null;

        function createValentinesEffects() {
            // Setup Container
            valentinesContainer = document.createElement('div');
            valentinesContainer.className = 'fcw-valentines-container';
            valentinesContainer.style.position = 'absolute';
            valentinesContainer.style.top = '0';
            valentinesContainer.style.left = '0';
            valentinesContainer.style.width = '100%';
            valentinesContainer.style.height = '100%';
            valentinesContainer.style.pointerEvents = 'none';
            valentinesContainer.style.overflow = 'hidden';
            valentinesContainer.style.zIndex = '0'; // Behind card
            modal.appendChild(valentinesContainer);

            // GRAND OPENING BURST
            // Instantly spawn 120 particles for a luxurious romantic start
            for (var i = 0; i < 120; i++) {
                spawnValentinesParticle(true);
            }

            // Continuously spawn new particles to maintain the scene
            valentinesInterval = setInterval(function () {
                if (modal.classList.contains('valentines-active')) {
                    spawnValentinesParticle(false);
                    // Spawn double for higher density
                    spawnValentinesParticle(false);
                }
            }, 250);
        }

        function spawnValentinesParticle(isBurst) {
            if (!valentinesContainer) return;

            var particleType = Math.random();
            var particle = document.createElement('div');

            // 15% Petals, 55% Red Hearts, 20% Gold Hearts, 10% Sparkles
            if (particleType < 0.15) {
                // Rose Petals
                particle.className = 'fcw-valentines-petal';
                var size = 15 + Math.random() * 20; // 15px to 35px
                particle.style.width = size + 'px';
                particle.style.height = (size * 0.7) + 'px';

                particle.style.left = (Math.random() * 100) + '%';

                // If it's the opening burst, spread them all over the screen vertically
                if (isBurst) {
                    particle.style.bottom = (Math.random() * 80) + '%';
                } else {
                    particle.style.bottom = '-10%';
                }

                var duration = 5 + Math.random() * 7;
                var delay = isBurst ? (Math.random() * 0.5) : (Math.random() * 2);

                particle.style.animation = 'fcw-valentines-petal-sway ' + duration + 's ease-in-out ' + delay + 's forwards';

            } else if (particleType < 0.90) {
                // Hearts (Red & Gold)
                var isGold = particleType > 0.70;
                particle.className = isGold ? 'fcw-valentines-gold-heart' : 'fcw-valentines-heart';

                var sizeH = isGold ? (8 + Math.random() * 12) : (12 + Math.random() * 18);
                if (isBurst && Math.random() > 0.8) {
                    sizeH *= 1.5; // Occasional massive heart in burst
                }
                particle.style.width = sizeH + 'px';
                particle.style.height = sizeH + 'px';

                particle.style.left = (Math.random() * 100) + '%';

                if (isBurst) {
                    particle.style.bottom = (Math.random() * 80) + '%';
                } else {
                    particle.style.bottom = '-10%';
                }

                var durationH = 4 + Math.random() * 6;
                var delayH = isBurst ? (Math.random() * 0.5) : (Math.random() * 2);

                particle.style.animation = 'fcw-valentines-float ' + durationH + 's ease-in ' + delayH + 's forwards';

            } else {
                // Sparkles (White & Gold)
                var isGoldSparkle = Math.random() > 0.5;
                particle.className = isGoldSparkle ? 'fcw-valentines-gold-sparkle' : 'fcw-valentines-sparkle';

                var sizeP = 2 + Math.random() * 3;
                particle.style.width = sizeP + 'px';
                particle.style.height = sizeP + 'px';

                particle.style.left = (Math.random() * 100) + '%';
                particle.style.top = (Math.random() * 100) + '%';

                var durationP = 1.5 + Math.random() * 3;
                var delayP = isBurst ? (Math.random() * 0.5) : (Math.random() * 1);
                particle.style.animation = 'fcw-valentines-sparkle-anim ' + durationP + 's ease-in-out ' + delayP + 's forwards';
            }

            valentinesContainer.appendChild(particle);

            var totalTime = (Math.max(duration || 0, durationH || 0, durationP || 0) + Math.max(delay || 0, delayH || 0, delayP || 0)) * 1000 + 500;
            setTimeout(function () {
                if (particle && particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, totalTime);
        }

        function stopValentinesEffects() {
            if (valentinesInterval) { clearInterval(valentinesInterval); valentinesInterval = null; }
            if (valentinesContainer) { valentinesContainer.remove(); valentinesContainer = null; }
        }

        function createValentinesRewardEffects() {
            // First, start the standard Valentines particle engine (Burst + Loop)
            createValentinesEffects();

            // Then add the advanced God Rays and Spotlight
            var rays = document.createElement('div');
            rays.className = 'fcw-valentines-rays';
            valentinesContainer.appendChild(rays);

            var spotlight = document.createElement('div');
            spotlight.className = 'fcw-valentines-spotlight';
            valentinesContainer.appendChild(spotlight);
        }

        // --- FW ICON TOTY Effects (Ultimate Gold & Crimson) ---
        var fwIconTotyContainer = document.createElement('div');
        fwIconTotyContainer.id = 'fcw-fw-icon-toty-container';
        fwIconTotyContainer.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:5;';
        modal.appendChild(fwIconTotyContainer);

        function createFWIconTOTYEffects() {
            fwIconTotyContainer.innerHTML = '';

            // 1. Central Intense Glow Spotlight
            var spotlight = document.createElement('div');
            spotlight.className = 'fcw-fw-icon-toty-spotlight';
            fwIconTotyContainer.appendChild(spotlight);

            // 3. Core Card Glow Base
            var coreGlow = document.createElement('div');
            coreGlow.className = 'fcw-fw-icon-toty-core';
            fwIconTotyContainer.appendChild(coreGlow);

            // 4. Gold and Crimson Particles
            for (var i = 0; i < 40; i++) {
                var particle = document.createElement('div');
                particle.className = 'fcw-particle-ember ' + (i % 2 === 0 ? 'fw-gold' : 'fw-red');
                particle.classList.add('fcw-fw-toty-particle'); // Reuse smooth float Base

                var size = 2 + Math.random() * 5;
                if (Math.random() > 0.8) {
                    size *= 1.5;
                    particle.classList.add('bright');
                } else if (Math.random() < 0.3) {
                    particle.classList.add('blur');
                }

                particle.style.width = size + 'px';
                particle.style.height = size + 'px';

                particle.style.left = (Math.random() * 100) + '%';
                particle.style.bottom = (-10 + Math.random() * 20) + '%';

                var duration = 4 + Math.random() * 6;
                particle.style.animation = 'fcw-fw-toty-float ' + duration + 's ease-in infinite ' + (Math.random() * 3) + 's';

                fwIconTotyContainer.appendChild(particle);
            }

            // 5. Bling Sparkles
            for (var s = 0; s < 15; s++) {
                var sparkle = document.createElement('div');
                sparkle.className = 'fcw-fw-toty-sparkle';

                sparkle.style.left = (Math.random() * 100) + '%';
                sparkle.style.top = (Math.random() * 100) + '%';

                var sDuration = 1.5 + Math.random() * 2;
                sparkle.style.animation = 'fcw-fw-toty-sparkle-anim ' + sDuration + 's ease-in-out infinite ' + (Math.random() * 2) + 's';
                fwIconTotyContainer.appendChild(sparkle);
            }
        }

        // --- FW TOTY Gold Effects (Luxurious Gold) - GPU Optimized ---
        var fwTotyContainer = document.createElement('div');
        fwTotyContainer.id = 'fcw-fw-toty-container';
        fwTotyContainer.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:5;';
        modal.appendChild(fwTotyContainer);

        function createFWTOTYEffects() {
            fwTotyContainer.innerHTML = '';

            // 1. GOD RAYS (Background Rotating Beams)
            var rays = document.createElement('div');
            rays.className = 'fcw-fw-toty-ray-container';
            fwTotyContainer.appendChild(rays);

            // 2. Gold Spotlight (Central Intense Glow)
            var spotlight = document.createElement('div');
            spotlight.className = 'fcw-fw-toty-spotlight';
            fwTotyContainer.appendChild(spotlight);

            // 3. Luxury Gold Particles (Varied Depth & Brightness)
            for (var i = 0; i < 80; i++) {
                var particle = document.createElement('div');
                particle.className = 'fcw-fw-toty-particle';

                // Randomly assign types
                var r = Math.random();
                if (r > 0.8) particle.classList.add('bright'); // 20% super bright
                else if (r < 0.3) particle.classList.add('blur'); // 30% blurred (depth)

                particle.style.left = (Math.random() * 100) + '%';
                particle.style.bottom = (Math.random() * 60 - 20) + '%';

                var duration = 4 + Math.random() * 4;
                particle.style.animationDuration = duration + 's';
                particle.style.animationDelay = (-1 * Math.random() * duration) + 's';

                var size = 3 + Math.random() * 6;
                if (particle.classList.contains('blur')) size += 2; // Blurred are bigger

                particle.style.width = size + 'px';
                particle.style.height = size + 'px';
                fwTotyContainer.appendChild(particle);
            }

            // 4. STAR SPARKLES (The "Bling")
            for (var j = 0; j < 25; j++) {
                var sparkle = document.createElement('div');
                sparkle.className = 'fcw-fw-toty-sparkle';
                sparkle.style.left = (10 + Math.random() * 80) + '%';
                sparkle.style.top = (10 + Math.random() * 80) + '%';

                var sparkDur = 2 + Math.random() * 3;
                sparkle.style.animation = `fcw-fw-toty-sparkle-anim ${sparkDur}s ease-in-out infinite`;
                sparkle.style.animationDelay = (Math.random() * sparkDur) + 's';

                fwTotyContainer.appendChild(sparkle);
            }
        }
        // --- BDDT Extreme Effects (Neon Green) - ULTRA LUXURIOUS (Rarest Card Tier) ---
        function createBDDTExtremeEffects() {
            if (ambientParticles) ambientParticles.innerHTML = '';

            // 1. Pulsing Spotlight & Shimmer (Real Elements)
            var spotlight = document.createElement('div');
            spotlight.className = 'fcw-bddt-spotlight';
            spotlight.style.setProperty('--spotlight-gradient', 'radial-gradient(circle, rgba(0, 255, 100, 0.25) 0%, rgba(57, 255, 20, 0.1) 40%, transparent 70%)');
            ambientParticles.appendChild(spotlight);

            var shimmer = document.createElement('div');
            shimmer.className = 'fcw-bddt-shimmer-sweep-layer';
            shimmer.style.setProperty('--shimmer-gradient', 'linear-gradient(115deg, transparent 0%, transparent 35%, rgba(50, 255, 100, 0.05) 42%, rgba(100, 255, 150, 0.1) 48%, rgba(180, 255, 200, 0.15) 50%, rgba(100, 255, 150, 0.1) 52%, rgba(50, 255, 100, 0.05) 58%, transparent 65%, transparent 100%)');
            ambientParticles.appendChild(shimmer);

            // 2. Gorgeous Aurora Waves (3 beautiful curved waves)
            var auroraHeights = [25, 50, 75];
            for (var aw = 0; aw < 3; aw++) {
                var aurora = document.createElement('div');
                aurora.className = 'fcw-bddt-aurora';
                aurora.style.top = auroraHeights[aw] + '%';
                aurora.style.left = '-100%';
                aurora.style.setProperty('--aurora-color-1', 'rgba(0, 255, 100, 0.12)');
                aurora.style.setProperty('--aurora-color-2', 'rgba(50, 255, 50, 0.18)');
                aurora.style.animationDelay = (aw * 2) + 's';
                aurora.style.animationDuration = (10 + aw * 2) + 's';
                ambientParticles.appendChild(aurora);
            }

            // 3. Floating Crystal Shards (20 neon green crystals)
            for (var cs = 0; cs < 20; cs++) {
                var crystal = document.createElement('div');
                crystal.className = 'fcw-bddt-crystal';
                if (cs % 3 === 0) crystal.classList.add('large');
                else if (cs % 3 === 1) crystal.classList.add('small');
                crystal.style.left = (Math.random() * 100) + '%';
                crystal.style.top = (60 + Math.random() * 40) + '%';
                crystal.style.background = 'linear-gradient(135deg, rgba(0,180,80,0.85) 0%, rgba(0,120,50,0.9) 50%, rgba(0,80,30,0.8) 100%)';
                crystal.style.setProperty('--crystal-glow', 'rgba(0, 255, 100, 0.6)');
                crystal.style.animationDelay = (cs * 0.4) + 's';
                crystal.style.animationDuration = (6 + Math.random() * 4) + 's';
                ambientParticles.appendChild(crystal);
            }

            // 4. Shimmer Glints (25 quick flashes)
            for (var gl = 0; gl < 25; gl++) {
                var glint = document.createElement('div');
                glint.className = 'fcw-bddt-glint';
                glint.style.left = (Math.random() * 100) + '%';
                glint.style.top = (Math.random() * 100) + '%';
                glint.style.animationDelay = (gl * 0.12) + 's';
                glint.style.animationDuration = (2 + Math.random() * 2) + 's';
                ambientParticles.appendChild(glint);
            }

            // 5. Light Streaks (REMOVED due to choppiness)

            // 6. Rising Neon Particles (80)
            for (var i = 0; i < 80; i++) {
                var particle = document.createElement('div');
                particle.className = 'fcw-bddt-extreme-particle';
                if (Math.random() > 0.4) particle.classList.add('bright');
                particle.style.left = (Math.random() * 100) + '%';
                particle.style.bottom = (-5 + Math.random() * 20) + '%';
                var duration = 4 + Math.random() * 4;
                particle.style.animationDuration = duration + 's';
                particle.style.animationDelay = (-1 * Math.random() * duration) + 's';
                var size = 3 + Math.random() * 4;
                particle.style.width = size + 'px';
                particle.style.height = size + 'px';
                ambientParticles.appendChild(particle);
            }

            // 7. Twinkling Starbursts (20)
            for (var k = 0; k < 20; k++) {
                var star = document.createElement('div');
                star.className = 'fcw-bddt-extreme-starburst';
                star.style.left = (Math.random() * 100) + '%';
                star.style.top = (Math.random() * 100) + '%';
                var starDur = 1.5 + Math.random() * 2;
                star.style.animationDuration = starDur + 's';
                star.style.animationDelay = (-1 * Math.random() * starDur) + 's';
                var starSize = 10 + Math.random() * 14;
                star.style.width = starSize + 'px';
                star.style.height = starSize + 'px';
                ambientParticles.appendChild(star);
            }
        }

        // --- BDDT Set Reward Effects (Purple) - ULTRA LUXURIOUS (Rarest Card Tier) ---
        function createBDDTRewardEffects() {
            if (ambientParticles) ambientParticles.innerHTML = '';

            // 1. Pulsing Spotlight & Shimmer (Real Elements)
            var spotlight = document.createElement('div');
            spotlight.className = 'fcw-bddt-spotlight';
            spotlight.style.setProperty('--spotlight-gradient', 'radial-gradient(circle, rgba(155, 48, 255, 0.25) 0%, transparent 70%)');
            ambientParticles.appendChild(spotlight);

            var shimmer = document.createElement('div');
            shimmer.className = 'fcw-bddt-shimmer-sweep-layer';
            shimmer.style.setProperty('--shimmer-gradient', 'linear-gradient(115deg, transparent 0%, transparent 35%, rgba(180, 100, 255, 0.05) 42%, rgba(200, 140, 255, 0.1) 48%, rgba(230, 200, 255, 0.15) 50%, rgba(200, 140, 255, 0.1) 52%, rgba(180, 100, 255, 0.05) 58%, transparent 65%, transparent 100%)');
            ambientParticles.appendChild(shimmer);

            // 2. Gorgeous Aurora Waves (3 beautiful curved waves)
            var auroraHeights = [25, 50, 75];
            for (var aw = 0; aw < 3; aw++) {
                var aurora = document.createElement('div');
                aurora.className = 'fcw-bddt-aurora';
                aurora.style.top = auroraHeights[aw] + '%';
                aurora.style.left = '-100%';
                aurora.style.setProperty('--aurora-color-1', 'rgba(138, 43, 226, 0.12)');
                aurora.style.setProperty('--aurora-color-2', 'rgba(180, 60, 255, 0.18)');
                aurora.style.animationDelay = (aw * 2) + 's';
                aurora.style.animationDuration = (10 + aw * 2) + 's';
                ambientParticles.appendChild(aurora);
            }

            // 3. Floating Crystal Shards (20 purple crystals)
            for (var cs = 0; cs < 20; cs++) {
                var crystal = document.createElement('div');
                crystal.className = 'fcw-bddt-crystal';
                if (cs % 3 === 0) crystal.classList.add('large');
                else if (cs % 3 === 1) crystal.classList.add('small');
                crystal.style.left = (Math.random() * 100) + '%';
                crystal.style.top = (60 + Math.random() * 40) + '%';
                crystal.style.background = 'linear-gradient(135deg, rgba(120,40,180,0.85) 0%, rgba(80,20,140,0.9) 50%, rgba(50,10,100,0.8) 100%)';
                crystal.style.setProperty('--crystal-glow', 'rgba(180, 80, 255, 0.6)');
                crystal.style.animationDelay = (cs * 0.4) + 's';
                crystal.style.animationDuration = (6 + Math.random() * 4) + 's';
                ambientParticles.appendChild(crystal);
            }

            // 4. Shimmer Glints (25 quick flashes)
            for (var gl = 0; gl < 25; gl++) {
                var glint = document.createElement('div');
                glint.className = 'fcw-bddt-glint';
                glint.style.left = (Math.random() * 100) + '%';
                glint.style.top = (Math.random() * 100) + '%';
                glint.style.animationDelay = (gl * 0.12) + 's';
                glint.style.animationDuration = (2 + Math.random() * 2) + 's';
                ambientParticles.appendChild(glint);
            }

            // 5. Light Streaks (REMOVED due to choppiness)

            // 6. Rising Purple Particles (80)
            for (var i = 0; i < 80; i++) {
                var particle = document.createElement('div');
                particle.className = 'fcw-bddt-reward-particle';
                if (Math.random() > 0.4) particle.classList.add('bright');
                particle.style.left = (Math.random() * 100) + '%';
                particle.style.bottom = (-5 + Math.random() * 20) + '%';
                var duration = 4 + Math.random() * 4;
                particle.style.animationDuration = duration + 's';
                particle.style.animationDelay = (-1 * Math.random() * duration) + 's';
                var size = 3 + Math.random() * 4;
                particle.style.width = size + 'px';
                particle.style.height = size + 'px';
                ambientParticles.appendChild(particle);
            }

            // 7. Twinkling Starbursts (20)
            for (var k = 0; k < 20; k++) {
                var star = document.createElement('div');
                star.className = 'fcw-bddt-reward-starburst';
                star.style.left = (Math.random() * 100) + '%';
                star.style.top = (Math.random() * 100) + '%';
                var starDur = 1.5 + Math.random() * 2;
                star.style.animationDuration = starDur + 's';
                star.style.animationDelay = (-1 * Math.random() * starDur) + 's';
                var starSize = 10 + Math.random() * 14;
                star.style.width = starSize + 'px';
                star.style.height = starSize + 'px';
                ambientParticles.appendChild(star);
            }
        }

        function createBDDTGoldEffects() {
            if (ambientParticles) ambientParticles.innerHTML = '';

            // 1. Pulsing Spotlight & Shimmer (Real Elements)
            var spotlight = document.createElement('div');
            spotlight.className = 'fcw-bddt-spotlight';
            spotlight.style.setProperty('--spotlight-gradient', 'radial-gradient(circle, rgba(255, 200, 50, 0.25) 0%, rgba(255, 180, 0, 0.1) 40%, transparent 70%)');
            ambientParticles.appendChild(spotlight);

            var shimmer = document.createElement('div');
            shimmer.className = 'fcw-bddt-shimmer-sweep-layer';
            shimmer.style.setProperty('--shimmer-gradient', 'linear-gradient(115deg, transparent 0%, transparent 35%, rgba(255, 215, 100, 0.06) 42%, rgba(255, 220, 130, 0.12) 48%, rgba(255, 255, 200, 0.18) 50%, rgba(255, 220, 130, 0.12) 52%, rgba(255, 215, 100, 0.06) 58%, transparent 65%, transparent 100%)');
            ambientParticles.appendChild(shimmer);

            // 2. Gorgeous Aurora Waves (3 beautiful curved waves)
            var auroraHeights = [25, 50, 75];
            for (var aw = 0; aw < 3; aw++) {
                var aurora = document.createElement('div');
                aurora.className = 'fcw-bddt-aurora';
                aurora.style.top = auroraHeights[aw] + '%';
                aurora.style.left = '-100%';
                aurora.style.setProperty('--aurora-color-1', 'rgba(255, 215, 0, 0.12)');
                aurora.style.setProperty('--aurora-color-2', 'rgba(255, 180, 60, 0.18)');
                aurora.style.animationDelay = (aw * 2) + 's';
                aurora.style.animationDuration = (10 + aw * 2) + 's';
                ambientParticles.appendChild(aurora);
            }

            // 3. Floating Crystal Shards (20 dark gold crystals)
            for (var cs = 0; cs < 20; cs++) {
                var crystal = document.createElement('div');
                crystal.className = 'fcw-bddt-crystal';
                if (cs % 3 === 0) crystal.classList.add('large');
                else if (cs % 3 === 1) crystal.classList.add('small');
                crystal.style.left = (Math.random() * 100) + '%';
                crystal.style.top = (60 + Math.random() * 40) + '%';
                crystal.style.background = 'linear-gradient(135deg, rgba(180,140,30,0.85) 0%, rgba(120,80,20,0.9) 50%, rgba(80,50,10,0.8) 100%)';
                crystal.style.setProperty('--crystal-glow', 'rgba(255, 180, 60, 0.6)');
                crystal.style.animationDelay = (cs * 0.4) + 's';
                crystal.style.animationDuration = (6 + Math.random() * 4) + 's';
                ambientParticles.appendChild(crystal);
            }

            // 4. Shimmer Glints (25 quick flashes)
            for (var gl = 0; gl < 25; gl++) {
                var glint = document.createElement('div');
                glint.className = 'fcw-bddt-glint';
                glint.style.left = (Math.random() * 100) + '%';
                glint.style.top = (Math.random() * 100) + '%';
                glint.style.animationDelay = (gl * 0.12) + 's';
                glint.style.animationDuration = (2 + Math.random() * 2) + 's';
                ambientParticles.appendChild(glint);
            }

            // 5. Light Streaks (REMOVED due to choppiness)

            // 6. Rising Gold Particles (80)
            for (var i = 0; i < 80; i++) {
                var particle = document.createElement('div');
                particle.className = 'fcw-bddt-gold-particle';
                if (Math.random() > 0.4) particle.classList.add('bright');
                particle.style.left = (Math.random() * 100) + '%';
                particle.style.bottom = (-5 + Math.random() * 20) + '%';
                var duration = 4 + Math.random() * 4;
                particle.style.animationDuration = duration + 's';
                particle.style.animationDelay = (-1 * Math.random() * duration) + 's';
                var size = 3 + Math.random() * 4;
                particle.style.width = size + 'px';
                particle.style.height = size + 'px';
                ambientParticles.appendChild(particle);
            }

            // 7. Twinkling Starbursts (20)
            for (var k = 0; k < 20; k++) {
                var star = document.createElement('div');
                star.className = 'fcw-bddt-gold-starburst';
                star.style.left = (Math.random() * 100) + '%';
                star.style.top = (Math.random() * 100) + '%';
                var starDur = 1.5 + Math.random() * 2;
                star.style.animationDuration = starDur + 's';
                star.style.animationDelay = (-1 * Math.random() * starDur) + 's';
                var starSize = 10 + Math.random() * 14;
                star.style.width = starSize + 'px';
                star.style.height = starSize + 'px';
                ambientParticles.appendChild(star);
            }
        }

        // --- BDDT Silver Effects - ULTRA LUXURIOUS (Rarest Card Tier) ---
        function createBDDTSilverEffects() {
            if (ambientParticles) ambientParticles.innerHTML = '';

            // 1. Pulsing Spotlight & Shimmer (Real Elements)
            var spotlight = document.createElement('div');
            spotlight.className = 'fcw-bddt-spotlight';
            spotlight.style.setProperty('--spotlight-gradient', 'radial-gradient(circle, rgba(200, 215, 240, 0.25) 0%, rgba(180, 195, 220, 0.1) 40%, transparent 70%)');
            ambientParticles.appendChild(spotlight);

            var shimmer = document.createElement('div');
            shimmer.className = 'fcw-bddt-shimmer-sweep-layer';
            shimmer.style.setProperty('--shimmer-gradient', 'linear-gradient(115deg, transparent 0%, transparent 35%, rgba(200, 220, 255, 0.06) 42%, rgba(220, 240, 255, 0.12) 48%, rgba(255, 255, 255, 0.2) 50%, rgba(220, 240, 255, 0.12) 52%, rgba(200, 220, 255, 0.06) 58%, transparent 65%, transparent 100%)');
            ambientParticles.appendChild(shimmer);

            // 2. Gorgeous Aurora Waves (3 beautiful curved waves)
            var auroraHeights = [25, 50, 75];
            for (var aw = 0; aw < 3; aw++) {
                var aurora = document.createElement('div');
                aurora.className = 'fcw-bddt-aurora';
                aurora.style.top = auroraHeights[aw] + '%';
                aurora.style.left = '-100%';
                aurora.style.setProperty('--aurora-color-1', 'rgba(220, 220, 235, 0.12)');
                aurora.style.setProperty('--aurora-color-2', 'rgba(200, 200, 220, 0.18)');
                aurora.style.animationDelay = (aw * 2) + 's';
                aurora.style.animationDuration = (10 + aw * 2) + 's';
                ambientParticles.appendChild(aurora);
            }

            // 3. Floating Crystal Shards (20 silver crystals)
            for (var cs = 0; cs < 20; cs++) {
                var crystal = document.createElement('div');
                crystal.className = 'fcw-bddt-crystal';
                if (cs % 3 === 0) crystal.classList.add('large');
                else if (cs % 3 === 1) crystal.classList.add('small');
                crystal.style.left = (Math.random() * 100) + '%';
                crystal.style.top = (60 + Math.random() * 40) + '%';
                crystal.style.background = 'linear-gradient(135deg, rgba(200,200,210,0.85) 0%, rgba(150,150,170,0.9) 50%, rgba(100,100,120,0.8) 100%)';
                crystal.style.setProperty('--crystal-glow', 'rgba(220, 220, 240, 0.6)');
                crystal.style.animationDelay = (cs * 0.4) + 's';
                crystal.style.animationDuration = (6 + Math.random() * 4) + 's';
                ambientParticles.appendChild(crystal);
            }

            // 4. Shimmer Glints (25 quick flashes)
            for (var gl = 0; gl < 25; gl++) {
                var glint = document.createElement('div');
                glint.className = 'fcw-bddt-glint';
                glint.style.left = (Math.random() * 100) + '%';
                glint.style.top = (Math.random() * 100) + '%';
                glint.style.animationDelay = (gl * 0.12) + 's';
                glint.style.animationDuration = (2 + Math.random() * 2) + 's';
                ambientParticles.appendChild(glint);
            }

            // 5. Light Streaks (REMOVED due to choppiness)

            // 6. Rising Silver Particles (80)
            for (var i = 0; i < 80; i++) {
                var particle = document.createElement('div');
                particle.className = 'fcw-bddt-silver-particle';
                if (Math.random() > 0.4) particle.classList.add('bright');
                particle.style.left = (Math.random() * 100) + '%';
                particle.style.bottom = (-5 + Math.random() * 20) + '%';
                var duration = 4 + Math.random() * 4;
                particle.style.animationDuration = duration + 's';
                particle.style.animationDelay = (-1 * Math.random() * duration) + 's';
                var size = 3 + Math.random() * 4;
                particle.style.width = size + 'px';
                particle.style.height = size + 'px';
                ambientParticles.appendChild(particle);
            }

            // 7. Twinkling Starbursts (20)
            for (var k = 0; k < 20; k++) {
                var star = document.createElement('div');
                star.className = 'fcw-bddt-silver-starburst';
                star.style.left = (Math.random() * 100) + '%';
                star.style.top = (Math.random() * 100) + '%';
                var starDur = 1.5 + Math.random() * 2;
                star.style.animationDuration = starDur + 's';
                star.style.animationDelay = (-1 * Math.random() * starDur) + 's';
                var starSize = 10 + Math.random() * 14;
                star.style.width = starSize + 'px';
                star.style.height = starSize + 'px';
                ambientParticles.appendChild(star);
            }
        }

        // --- BDDT Bronze Effects - ULTRA LUXURIOUS (Rarest Card Tier) ---
        function createBDDTBronzeEffects() {
            if (ambientParticles) ambientParticles.innerHTML = '';

            // 1. Pulsing Spotlight & Shimmer (Real Elements)
            var spotlight = document.createElement('div');
            spotlight.className = 'fcw-bddt-spotlight';
            spotlight.style.setProperty('--spotlight-gradient', 'radial-gradient(circle, rgba(210, 140, 70, 0.25) 0%, rgba(185, 115, 55, 0.1) 40%, transparent 70%)');
            ambientParticles.appendChild(spotlight);

            var shimmer = document.createElement('div');
            shimmer.className = 'fcw-bddt-shimmer-sweep-layer';
            shimmer.style.setProperty('--shimmer-gradient', 'linear-gradient(115deg, transparent 0%, transparent 35%, rgba(225, 160, 90, 0.06) 42%, rgba(240, 180, 110, 0.12) 48%, rgba(255, 210, 150, 0.18) 50%, rgba(240, 180, 110, 0.12) 52%, rgba(225, 160, 90, 0.06) 58%, transparent 65%, transparent 100%)');
            ambientParticles.appendChild(shimmer);

            // 2. Gorgeous Aurora Waves (3 beautiful curved waves)
            var auroraHeights = [25, 50, 75];
            for (var aw = 0; aw < 3; aw++) {
                var aurora = document.createElement('div');
                aurora.className = 'fcw-bddt-aurora';
                aurora.style.top = auroraHeights[aw] + '%';
                aurora.style.left = '-100%';
                aurora.style.setProperty('--aurora-color-1', 'rgba(205, 127, 50, 0.12)');
                aurora.style.setProperty('--aurora-color-2', 'rgba(180, 100, 40, 0.18)');
                aurora.style.animationDelay = (aw * 2) + 's';
                aurora.style.animationDuration = (10 + aw * 2) + 's';
                ambientParticles.appendChild(aurora);
            }

            // 3. Floating Crystal Shards (20 bronze crystals)
            for (var cs = 0; cs < 20; cs++) {
                var crystal = document.createElement('div');
                crystal.className = 'fcw-bddt-crystal';
                if (cs % 3 === 0) crystal.classList.add('large');
                else if (cs % 3 === 1) crystal.classList.add('small');
                crystal.style.left = (Math.random() * 100) + '%';
                crystal.style.top = (60 + Math.random() * 40) + '%';
                crystal.style.background = 'linear-gradient(135deg, rgba(180,120,50,0.85) 0%, rgba(140,80,30,0.9) 50%, rgba(100,60,20,0.8) 100%)';
                crystal.style.setProperty('--crystal-glow', 'rgba(205, 127, 50, 0.6)');
                crystal.style.animationDelay = (cs * 0.4) + 's';
                crystal.style.animationDuration = (6 + Math.random() * 4) + 's';
                ambientParticles.appendChild(crystal);
            }

            // 4. Shimmer Glints (25 quick flashes)
            for (var gl = 0; gl < 25; gl++) {
                var glint = document.createElement('div');
                glint.className = 'fcw-bddt-glint';
                glint.style.left = (Math.random() * 100) + '%';
                glint.style.top = (Math.random() * 100) + '%';
                glint.style.animationDelay = (gl * 0.12) + 's';
                glint.style.animationDuration = (2 + Math.random() * 2) + 's';
                ambientParticles.appendChild(glint);
            }

            // 5. Light Streaks (REMOVED due to choppiness)

            // 6. Rising Bronze Particles (80)
            for (var i = 0; i < 80; i++) {
                var particle = document.createElement('div');
                particle.className = 'fcw-bddt-bronze-particle';
                if (Math.random() > 0.4) particle.classList.add('bright');
                particle.style.left = (Math.random() * 100) + '%';
                particle.style.bottom = (-5 + Math.random() * 20) + '%';
                var duration = 4 + Math.random() * 4;
                particle.style.animationDuration = duration + 's';
                particle.style.animationDelay = (-1 * Math.random() * duration) + 's';
                var size = 3 + Math.random() * 4;
                particle.style.width = size + 'px';
                particle.style.height = size + 'px';
                ambientParticles.appendChild(particle);
            }

            // 7. Twinkling Starbursts (20)
            for (var k = 0; k < 20; k++) {
                var star = document.createElement('div');
                star.className = 'fcw-bddt-bronze-starburst';
                star.style.left = (Math.random() * 100) + '%';
                star.style.top = (Math.random() * 100) + '%';
                var starDur = 1.5 + Math.random() * 2;
                star.style.animationDuration = starDur + 's';
                star.style.animationDelay = (-1 * Math.random() * starDur) + 's';
                var starSize = 10 + Math.random() * 14;
                star.style.width = starSize + 'px';
                star.style.height = starSize + 'px';
                ambientParticles.appendChild(star);
            }
        }

        // --- BDOR Winner Gold Sparkling Effects (GPU Optimized) ---
        function createBDORWinnerEffects() {
            // Clear container
            bdorContainer.innerHTML = '';

            // 1. Central Gold Spotlight
            var spotlight = document.createElement('div');
            spotlight.className = 'fcw-bdor-spotlight';
            bdorContainer.appendChild(spotlight);

            // 2. Gold Light Rays (Radiating from center)
            var rayAngles = [-60, -35, -15, 0, 15, 35, 60];
            rayAngles.forEach(function (angle, idx) {
                var ray = document.createElement('div');
                ray.className = 'fcw-bdor-ray';
                ray.style.transform = 'translateX(-50%) rotate(' + angle + 'deg)';
                ray.style.setProperty('--ray-delay', (-1 * idx * 0.4) + 's');
                bdorContainer.appendChild(ray);
            });

            // 3. Floating Gold Orbs
            var orbPositions = [
                { x: 10, y: 15, size: 80 },
                { x: 90, y: 18, size: 70 },
                { x: 15, y: 80, size: 65 },
                { x: 85, y: 75, size: 75 },
                { x: 50, y: 5, size: 55 },
                { x: 5, y: 50, size: 50 },
                { x: 95, y: 48, size: 55 }
            ];
            orbPositions.forEach(function (pos) {
                var orb = document.createElement('div');
                orb.className = 'fcw-bdor-orb';
                orb.style.left = pos.x + '%';
                orb.style.top = pos.y + '%';
                orb.style.width = pos.size + 'px';
                orb.style.height = pos.size + 'px';
                var duration = 7 + Math.random() * 5;
                orb.style.setProperty('--orb-duration', duration + 's');
                orb.style.setProperty('--orb-delay', (-1 * Math.random() * duration) + 's');
                orb.style.setProperty('--drift-x1', (Math.random() * 50 - 25) + 'px');
                orb.style.setProperty('--drift-y1', (Math.random() * 50 - 25) + 'px');
                orb.style.setProperty('--drift-x2', (Math.random() * 40 - 20) + 'px');
                orb.style.setProperty('--drift-y2', (Math.random() * 40 - 20) + 'px');
                bdorContainer.appendChild(orb);
            });

            // 4. Gold Lens Flares
            var flareData = [
                { x: 12, y: 15, type: 'large', duration: 3.5 },
                { x: 88, y: 18, type: 'large', duration: 4 },
                { x: 20, y: 75, type: 'medium', duration: 3 },
                { x: 80, y: 72, type: 'medium', duration: 3.2 },
                { x: 50, y: 8, type: 'small', duration: 2.5 },
                { x: 8, y: 45, type: 'small', duration: 2.2 },
                { x: 92, y: 50, type: 'small', duration: 2.4 }
            ];
            flareData.forEach(function (data) {
                var flare = document.createElement('div');
                flare.className = 'fcw-bdor-flare ' + data.type;
                flare.style.left = data.x + '%';
                flare.style.top = data.y + '%';
                flare.style.setProperty('--flare-duration', data.duration + 's');
                flare.style.setProperty('--flare-delay', (-1 * Math.random() * data.duration) + 's');
                bdorContainer.appendChild(flare);
            });

            // 5. Gold Spark Particles (Rising)
            for (var i = 0; i < 25; i++) {
                var spark = document.createElement('div');
                spark.className = 'fcw-bdor-spark';
                spark.style.left = (5 + Math.random() * 90) + '%';
                spark.style.bottom = (5 + Math.random() * 35) + '%';
                var duration = 3 + Math.random() * 3;
                spark.style.setProperty('--spark-duration', duration + 's');
                spark.style.setProperty('--spark-delay', (-1 * Math.random() * duration) + 's');
                spark.style.setProperty('--rise-y', (-200 - Math.random() * 150) + 'px');
                spark.style.setProperty('--drift-x', (Math.random() * 100 - 50) + 'px');
                bdorContainer.appendChild(spark);
            }

            // 6. Gold Starbursts
            var starPositions = [
                { x: 8, y: 10 }, { x: 92, y: 8 }, { x: 10, y: 90 }, { x: 90, y: 88 },
                { x: 50, y: 3 }, { x: 3, y: 50 }, { x: 97, y: 52 }, { x: 48, y: 97 },
                { x: 25, y: 20 }, { x: 75, y: 18 }, { x: 20, y: 78 }, { x: 80, y: 80 }
            ];
            starPositions.forEach(function (pos) {
                var star = document.createElement('div');
                star.className = 'fcw-bdor-starburst';
                star.style.left = pos.x + '%';
                star.style.top = pos.y + '%';
                var duration = 1.5 + Math.random() * 1.5;
                star.style.setProperty('--twinkle-duration', duration + 's');
                star.style.setProperty('--twinkle-delay', (-1 * Math.random() * duration) + 's');
                bdorContainer.appendChild(star);
            });

            // 7. Diamond Gold Sparkles
            var diamondPositions = [
                { x: 28, y: 12 }, { x: 72, y: 15 }, { x: 18, y: 55 }, { x: 82, y: 50 },
                { x: 42, y: 30 }, { x: 58, y: 70 }, { x: 32, y: 82 }, { x: 68, y: 85 },
                { x: 12, y: 35 }, { x: 88, y: 38 }, { x: 50, y: 50 }, { x: 38, y: 62 }
            ];
            diamondPositions.forEach(function (pos) {
                var diamond = document.createElement('div');
                diamond.className = 'fcw-bdor-diamond';
                diamond.style.left = pos.x + '%';
                diamond.style.top = pos.y + '%';
                var duration = 1 + Math.random() * 1.2;
                diamond.style.setProperty('--diamond-duration', duration + 's');
                diamond.style.setProperty('--diamond-delay', (-1 * Math.random() * duration) + 's');
                bdorContainer.appendChild(diamond);
            });
        }

        // --- Vintage Film Effects Creation ---
        function createVintageEffects() {
            if (vintageEffectsActive) return;
            vintageEffectsActive = true;
            var grain = document.createElement('div'); grain.className = 'fcw-film-grain'; grain.id = 'fcw-vintage-grain'; document.body.appendChild(grain);
            var grainOverlay = document.createElement('div'); grainOverlay.className = 'fcw-film-grain-overlay'; grainOverlay.id = 'fcw-vintage-grain-overlay'; document.body.appendChild(grainOverlay);
            var vignette = document.createElement('div'); vignette.className = 'fcw-vignette-vintage'; vignette.id = 'fcw-vintage-vignette'; document.body.appendChild(vignette);
            var artifacts = document.createElement('div'); artifacts.className = 'fcw-film-artifacts'; artifacts.id = 'fcw-vintage-artifacts';
            for (var h = 0; h < 8; h++) { var hair = document.createElement('div'); hair.className = 'fcw-film-hair'; hair.style.left = Math.random() * 100 + '%'; hair.style.top = Math.random() * 100 + '%'; hair.style.width = (20 + Math.random() * 60) + 'px'; hair.style.height = (1 + Math.random() * 2) + 'px'; hair.style.transform = 'rotate(' + (Math.random() * 360) + 'deg)'; hair.style.setProperty('--duration', (8 + Math.random() * 12) + 's'); hair.style.setProperty('--delay', (Math.random() * 10) + 's'); artifacts.appendChild(hair); }
            for (var d = 0; d < 12; d++) { var blob = document.createElement('div'); blob.className = 'fcw-dust-blob'; blob.style.left = Math.random() * 100 + '%'; blob.style.top = Math.random() * 100 + '%'; var blobSize = 5 + Math.random() * 20; blob.style.width = blobSize + 'px'; blob.style.height = blobSize * (0.6 + Math.random() * 0.8) + 'px'; blob.style.setProperty('--flicker-time', (3 + Math.random() * 5) + 's'); blob.style.setProperty('--delay', (Math.random() * 8) + 's'); artifacts.appendChild(blob); }
            for (var s = 0; s < 20; s++) { var speck = document.createElement('div'); speck.className = 'fcw-white-speck'; speck.style.left = Math.random() * 100 + '%'; speck.style.top = Math.random() * 100 + '%'; var speckSize = 1 + Math.random() * 3; speck.style.width = speckSize + 'px'; speck.style.height = speckSize + 'px'; speck.style.setProperty('--flash-time', (2 + Math.random() * 4) + 's'); speck.style.setProperty('--delay', (Math.random() * 6) + 's'); artifacts.appendChild(speck); }
            for (var sc = 0; sc < 4; sc++) { var scratch = document.createElement('div'); scratch.className = 'fcw-emulsion-scratch'; scratch.style.left = (10 + Math.random() * 80) + '%'; scratch.style.setProperty('--scratch-time', (5 + Math.random() * 8) + 's'); scratch.style.setProperty('--delay', (Math.random() * 10) + 's'); artifacts.appendChild(scratch); }
            for (var w = 0; w < 3; w++) { var stain = document.createElement('div'); stain.className = 'fcw-water-stain'; stain.style.left = Math.random() * 80 + '%'; stain.style.top = Math.random() * 80 + '%'; var stainSize = 50 + Math.random() * 150; stain.style.width = stainSize + 'px'; stain.style.height = stainSize * (0.5 + Math.random() * 0.5) + 'px'; stain.style.setProperty('--stain-time', (15 + Math.random() * 15) + 's'); stain.style.setProperty('--delay', (Math.random() * 20) + 's'); artifacts.appendChild(stain); }
            document.body.appendChild(artifacts);
            var burn = document.createElement('div'); burn.className = 'fcw-cigarette-burn'; burn.id = 'fcw-vintage-burn'; document.body.appendChild(burn);
            var leakPositions = [{ top: '0', left: '0', width: '30%', height: '40%', color: 'rgba(255, 200, 100, 0.3)' }, { bottom: '0', right: '0', width: '25%', height: '35%', color: 'rgba(255, 180, 80, 0.25)' }, { top: '20%', right: '0', width: '15%', height: '60%', color: 'rgba(255, 220, 150, 0.2)' }];
            leakPositions.forEach(function (pos, i) { var leak = document.createElement('div'); leak.className = 'fcw-light-leak'; leak.id = 'fcw-vintage-leak-' + i; if (pos.top) leak.style.top = pos.top; if (pos.bottom) leak.style.bottom = pos.bottom; if (pos.left) leak.style.left = pos.left; if (pos.right) leak.style.right = pos.right; leak.style.width = pos.width; leak.style.height = pos.height; leak.style.background = 'radial-gradient(ellipse at center, ' + pos.color + ' 0%, transparent 70%)'; leak.style.setProperty('--pulse-time', (8 + i * 3) + 's'); leak.style.setProperty('--delay', (i * 2) + 's'); leak.style.setProperty('--max-opacity', (0.4 + Math.random() * 0.3).toString()); document.body.appendChild(leak); });
            var lineLeft = document.createElement('div'); lineLeft.className = 'fcw-frame-line'; lineLeft.id = 'fcw-vintage-line-left'; lineLeft.style.left = '3%'; document.body.appendChild(lineLeft);
            var lineRight = document.createElement('div'); lineRight.className = 'fcw-frame-line'; lineRight.id = 'fcw-vintage-line-right'; lineRight.style.right = '3%'; document.body.appendChild(lineRight);
            var sprocketLeft = document.createElement('div'); sprocketLeft.className = 'fcw-sprocket-edge left'; sprocketLeft.id = 'fcw-vintage-sprocket-left'; document.body.appendChild(sprocketLeft);
            var sprocketRight = document.createElement('div'); sprocketRight.className = 'fcw-sprocket-edge right'; sprocketRight.id = 'fcw-vintage-sprocket-right'; document.body.appendChild(sprocketRight);
            var shutter = document.createElement('div'); shutter.className = 'fcw-shutter-blackout'; shutter.id = 'fcw-vintage-shutter'; document.body.appendChild(shutter);
            var hotspot = document.createElement('div'); hotspot.className = 'fcw-projector-hotspot'; hotspot.id = 'fcw-vintage-hotspot'; document.body.appendChild(hotspot);
        }

        function removeVintageEffects() {
            if (!vintageEffectsActive) return;
            vintageEffectsActive = false;
            var elementsToRemove = ['fcw-vintage-grain', 'fcw-vintage-grain-overlay', 'fcw-vintage-vignette', 'fcw-vintage-artifacts', 'fcw-vintage-burn', 'fcw-vintage-leak-0', 'fcw-vintage-leak-1', 'fcw-vintage-leak-2', 'fcw-vintage-line-left', 'fcw-vintage-line-right', 'fcw-vintage-sprocket-left', 'fcw-vintage-sprocket-right', 'fcw-vintage-shutter', 'fcw-vintage-hotspot'];
            elementsToRemove.forEach(function (id) { var el = document.getElementById(id); if (el) el.remove(); });
        }

        // --- OPTIMIZED MOUSE TRACKING (FPS FIX) ---
        let rafId = null;

        document.addEventListener('mousemove', function (e) {
            if (!modal.classList.contains('active')) return;

            // Use requestAnimationFrame to debounce high-frequency mouse events
            if (rafId) return;

            rafId = requestAnimationFrame(() => {
                var rect = stage.getBoundingClientRect();
                var centerX = rect.left + rect.width / 2;
                var centerY = rect.top + rect.height / 2;
                var x = e.clientX - centerX;
                var y = e.clientY - centerY;

                if (!isPaused) {
                    var maxRotation = 12;
                    var rotateX = (y / (rect.height / 2)) * -maxRotation;
                    var rotateY = (x / (rect.width / 2)) * maxRotation;
                    container.style.transform = 'rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg)';

                    var sparkleField = wrapper.querySelector('.fcw-scintillation-field');
                    if (sparkleField) {
                        var danceFactorX = (x / rect.width) * -20;
                        var danceFactorY = (y / rect.height) * -20;
                        sparkleField.style.transform = `translateZ(85px) translateX(${danceFactorX}px) translateY(${danceFactorY}px)`;
                    }
                }

                var card = wrapper.querySelector('.fcw-cloned-card');
                if (card) {
                    var beamX = ((e.clientX - rect.left) / rect.width) * 100;
                    var beamY = ((e.clientY - rect.top) / rect.height) * 100;
                    var angle = Math.atan2(y, x) * (180 / Math.PI) + 180;
                    card.style.setProperty('--beam-x', beamX + '%');
                    card.style.setProperty('--beam-y', beamY + '%');
                    card.style.setProperty('--streak-angle', (angle + 90) + 'deg');
                }

                rafId = null;
            });
        });

        // --- 5. Card Detection ---
        function findCardContainer(target) {
            var curr = target;
            for (var i = 0; i < 15; i++) {
                if (!curr || curr === document.body) return null;
                var classList = curr.className || '';
                if (typeof classList === 'string' && (
                    classList.includes('playercard') || classList.includes('player-card') ||
                    classList.includes('fut-card') || classList.includes('card-container') ||
                    classList.includes('ut-card') || classList.includes('card-item')
                )) {
                    return curr;
                }
                var rect = curr.getBoundingClientRect();
                var aspectRatio = rect.height / rect.width;
                if (aspectRatio > 1.3 && aspectRatio < 1.8 && rect.width > 80 && rect.width < 400) {
                    var hasPlayerImage = curr.querySelector('img');
                    if (hasPlayerImage) return curr;
                }
                curr = curr.parentElement;
            }
            return null;
        }

        // --- 6. Image Helpers ---
        function upgradeImageUrl(src) {
            if (!src) return src;
            return src.replace(/_small./gi, '.').replace(/\/small\//gi, '/large/');
        }

        function isDynamicImage(img) {
            if (!img || !img.src) return false;
            var src = img.src.toLowerCase();
            var headshotPatterns = ['headshot', 'head_', 'portrait', '/faces/', 'face_', '_face', 'small', 'mini'];
            for (var i = 0; i < headshotPatterns.length; i++) {
                if (src.indexOf(headshotPatterns[i]) !== -1) return false;
            }
            return true;
        }

        function isCardDesignImage(img) {
            if (!img || !img.src) return false;
            var src = img.src.toLowerCase();
            var cardPatterns = ['card', 'background', 'bg_', '_bg', 'design', 'template', 'frame', 'border', 'base', 'item', 'rare', 'common', 'toty', 'tots', 'totw', 'fut', 'promo', 'event'];
            for (var i = 0; i < cardPatterns.length; i++) {
                if (src.indexOf(cardPatterns[i]) !== -1) return true;
            }
            return false;
        }

        // --- 7. Create Particles ---
        function createParticles(container, count, isAmbient, isDreamTeamMode, isFWIconMode, isHalloweenMode, isIcon26Mode, isFutmasMode, isFutmasIconMode) {
            var particlesDiv = isAmbient ? container : document.createElement('div');
            if (!isAmbient) particlesDiv.className = 'fcw-effect-particles';

            // HALLOWEEN (Orange/Green/Purple)
            if (isAmbient && isHalloweenMode) {
                for (var i = 0; i < 40; i++) {
                    var ember = document.createElement('div');
                    var rand = Math.random();
                    var colorClass = 'h-orange';
                    if (rand > 0.6) colorClass = 'h-purple';
                    if (rand > 0.85) colorClass = 'h-green';
                    ember.className = 'fcw-particle-ember ' + colorClass;
                    ember.style.left = Math.random() * 100 + '%';
                    var duration = 4 + Math.random() * 6;
                    var delay = Math.random() * 8;
                    ember.style.setProperty('--rise-duration', duration + 's');
                    ember.style.setProperty('--rise-delay', delay + 's');
                    ember.style.setProperty('--drift', (Math.random() * 100 - 50) + 'px');
                    ember.style.setProperty('--max-opacity', (0.5 + Math.random() * 0.4).toString());
                    particlesDiv.appendChild(ember);
                }
                return;
            }

            // FW ICON (RED & GOLD)
            if (isAmbient && isFWIconMode) {
                for (var i = 0; i < 40; i++) {
                    var ember = document.createElement('div');
                    ember.className = 'fcw-particle-ember ' + (i % 2 === 0 ? 'fw-red' : 'fw-gold');
                    ember.style.left = Math.random() * 100 + '%';
                    var duration = 4 + Math.random() * 4;
                    var delay = Math.random() * 8;
                    ember.style.setProperty('--rise-duration', duration + 's');
                    ember.style.setProperty('--rise-delay', delay + 's');
                    ember.style.setProperty('--drift', (Math.random() * 100 - 50) + 'px');
                    ember.style.setProperty('--max-opacity', (0.5 + Math.random() * 0.4).toString());
                    particlesDiv.appendChild(ember);
                }
                return;
            }

            // FUTMAS (RED, GREEN & GOLD)
            if (isAmbient && isFutmasMode) {
                for (var i = 0; i < 45; i++) {
                    var ember = document.createElement('div');
                    var rand = Math.random();
                    var colorClass = 'fw-gold';
                    if (rand > 0.33) colorClass = 'fcw-sparkle-red';
                    if (rand > 0.66) colorClass = 'fcw-sparkle-green';
                    ember.className = 'fcw-particle-ember ' + colorClass;
                    ember.style.left = Math.random() * 100 + '%';
                    var duration = 4 + Math.random() * 5;
                    var delay = Math.random() * 8;
                    ember.style.setProperty('--rise-duration', duration + 's');
                    ember.style.setProperty('--rise-delay', delay + 's');
                    ember.style.setProperty('--drift', (Math.random() * 80 - 40) + 'px');
                    ember.style.setProperty('--max-opacity', (0.6 + Math.random() * 0.4).toString());
                    particlesDiv.appendChild(ember);
                }
                return;
            }

            // FUTMAS ICON (GOLD & WHITE LUXURY)
            if (isAmbient && isFutmasIconMode) {
                for (var i = 0; i < 40; i++) {
                    var ember = document.createElement('div');
                    var rand = Math.random();
                    var colorClass = 'futmas-icon-gold';
                    if (rand > 0.5) colorClass = 'futmas-icon-white';
                    ember.className = 'fcw-particle-ember ' + colorClass;
                    ember.style.left = Math.random() * 100 + '%';
                    var duration = 4 + Math.random() * 5;
                    var delay = Math.random() * 8;
                    ember.style.setProperty('--rise-duration', duration + 's');
                    ember.style.setProperty('--rise-delay', delay + 's');
                    ember.style.setProperty('--drift', (Math.random() * 60 - 30) + 'px');
                    ember.style.setProperty('--max-opacity', (0.5 + Math.random() * 0.4).toString());
                    particlesDiv.appendChild(ember);
                }
                return;
            }

            // FC 26 ICON (LUXURY GOLD) - OPTIMIZED PARTICLE COUNT
            if (isAmbient && isIcon26Mode) {
                // FPS FIX: Reduced from 20 to 10 to improve performance
                for (var i = 0; i < 10; i++) {
                    var ember = document.createElement('div');
                    // Mix of Deep Gold, Champagne, and White
                    var rand = Math.random();
                    var type = 'i26-gold';
                    if (rand > 0.5) type = 'i26-champagne';
                    if (rand > 0.8) type = 'i26-white';
                    ember.className = 'fcw-particle-ember ' + type;
                    ember.style.left = Math.random() * 100 + '%';
                    var duration = 5 + Math.random() * 4;
                    var delay = Math.random() * 8;
                    ember.style.setProperty('--rise-duration', duration + 's');
                    ember.style.setProperty('--rise-delay', delay + 's');
                    ember.style.setProperty('--drift', (Math.random() * 60 - 30) + 'px');
                    ember.style.setProperty('--max-opacity', (0.6 + Math.random() * 0.4).toString());
                    particlesDiv.appendChild(ember);
                }
                return;
            }

            if (isAmbient && isDreamTeamMode) {
                for (var i = 0; i < 25; i++) {
                    var ember = document.createElement('div');
                    ember.className = 'fcw-particle-ember';
                    ember.style.left = Math.random() * 100 + '%';
                    var duration = 5 + Math.random() * 5;
                    var delay = Math.random() * 8;
                    ember.style.setProperty('--rise-duration', duration + 's');
                    ember.style.setProperty('--rise-delay', delay + 's');
                    ember.style.setProperty('--drift', (Math.random() * 100 - 50) + 'px');
                    ember.style.setProperty('--max-opacity', (0.2 + Math.random() * 0.3).toString());
                    particlesDiv.appendChild(ember);
                }
                return;
            }

            for (var k = 0; k < count; k++) {
                var particle = document.createElement('div');
                particle.className = 'fcw-particle';
                particle.style.left = (Math.random() * 100) + '%';
                particle.style.bottom = (Math.random() * (isAmbient ? 100 : 30)) + '%';
                var sizeBase = isAmbient ? 1.5 : 1;
                particle.style.setProperty('--size', (sizeBase + Math.random() * 2) + 'px');
                particle.style.setProperty('--opacity', (0.2 + Math.random() * 0.3).toString());
                particle.style.setProperty('--delay', (Math.random() * 5) + 's');
                particle.style.setProperty('--duration', ((isAmbient ? 10 : 4) + Math.random() * 5) + 's');
                if (isAmbient) {
                    particle.style.background = 'radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%)';
                }
                particlesDiv.appendChild(particle);
            }
            if (!isAmbient) container.appendChild(particlesDiv);
        }

        // --- 7.5 Create Scintillation Effect (Sparkles) ---
        function createScintillation(clone) {
            var field = document.createElement('div');
            field.className = 'fcw-scintillation-field';

            for (var i = 0; i < 28; i++) {
                var star = document.createElement('div');
                var top = Math.random() * 100;
                var left = Math.random() * 100;
                star.className = 'fcw-scintilla-star';
                star.style.top = top + '%';
                star.style.left = left + '%';

                var size = 8 + Math.random() * 14;
                star.style.setProperty('--dims', size + 'px');

                var duration = 1.2 + Math.random() * 1.5;
                var delay = Math.random() * 5;
                star.style.setProperty('--duration', duration + 's');
                star.style.setProperty('--delay', delay + 's');

                star.style.setProperty('--intensity', (0.7 + Math.random() * 0.3).toString());

                var rotation = Math.floor(Math.random() * 90);
                star.style.setProperty('--rot', rotation + 'deg');

                field.appendChild(star);
            }

            clone.appendChild(field);
        }

        // --- 8. Process Clone Layers ---
        function processCloneLayers(clone) {
            var imgs = clone.querySelectorAll('img');
            var cardTypeInfo = { isSpecial: false, isDreamTeam: false, isSilverDreamTeam: false, isBronzeDreamTeam: false, isVintage: false, isFWIcon: false, isHalloween: false, isIcon26: false, isFutmas: false, isNewYears: false, isGOTW: false, isFutmasIcon: false, isWorlds: false, isBlackFriday: false, isGOTWMoments: false, isTOTY18: false, isTOTY26: false, isIconWorldCup18: false, isFWIconHW: false, isBDORWinner: false, isBDORRunnerUp: false, isBDORThird: false, isBDDTExtreme: false, isBDDTReward: false, isPrize: false, isPower: false, isLNY: false };

            var isDreamTeamPlayer = false;
            var isSilverDreamTeamPlayer = false;
            var isBronzeDreamTeamPlayer = false;
            var isVintagePlayer = false;
            var isFWIconPlayer = false;
            var isHalloweenPlayer = false;
            var isIcon26Player = false;
            var isFutmasPlayer = false;
            var isNewYearsPlayer = false;
            var isGOTWPlayer = false;
            var isFutmasIconPlayer = false;
            var isWorldsPlayer = false;
            var isBlackFridayPlayer = false;
            var isGOTWMomentsPlayer = false;
            var isTOTY18Player = false;
            var isTOTY26Player = false;
            var isIconWorldCup18Player = false;
            var isFWIconHWPlayer = false;
            var isBDORWinnerPlayer = false;
            var isBDORRunnerUpPlayer = false;
            var isBDORThirdPlayer = false;
            var isBDDTExtremePlayer = false;
            var isBDDTRewardPlayer = false;
            var isPrizePlayer = false;
            var isFWTOTYPlayer = false;
            var isPowerPlayer = false;
            var isLNYPlayer = false;

            var dreamTeamCardImage = "https://cdn.fc-watch.com/img/26/cards/bddt_gold.png";
            var dreamTeamSilverCardImage = "https://cdn.fc-watch.com/img/26/cards/bddt_silver.png";
            var dreamTeamBronzeCardImage = "https://cdn.fc-watch.com/img/26/cards/bddt_bronze.png";
            var vintageCardImage = "https://cdn.fc-watch.com/img/26/cards/hh.png";
            var fwIconCardImage = "https://cdn.fc-watch.com/img/26/cards/fw_icon.png";
            var halloweenCardImage = "https://cdn.fc-watch.com/img/26/cards/halloween.png";
            var icon26CardImage = "https://cdn.fc-watch.com/img/26/cards/12_icon.png";
            var futmasCardImage = "https://cdn.fc-watch.com/img/26/cards/futmas.png";
            var newYearsCardImage = "https://cdn.fc-watch.com/img/26/cards/new_years.png";
            var gotwCardImage = "https://cdn.fc-watch.com/img/26/cards/gotw.png";
            var futmasIconCardImage = "https://cdn.fc-watch.com/img/26/cards/fw_icn_futmas.png";
            var worldsCardImage = "https://cdn.fc-watch.com/img/26/cards/worlds.png";
            var blackFridayCardImage = "https://cdn.fc-watch.com/img/26/cards/black_friday.png";
            var gotwMomentsCardImage = "https://cdn.fc-watch.com/img/26/cards/gotw_moments.png";
            var toty18CardImage = "https://cdn.fc-watch.com/img/18/cards/toty18.png";
            var toty26CardImage = "https://cdn.fc-watch.com/img/26/cards/5_toty.png";
            var iconWorldCup18CardImage = "https://cdn.fc-watch.com/img/18/cards/iconworldcup18.png";
            var fwIconHWCardImage = "https://cdn.fc-watch.com/img/26/cards/fw_icon_hw.png";
            var bdorWinnerCardImage = "https://cdn.fc-watch.com/img/26/cards/bdor_winner.png";
            var bdorRunnerUpCardImage = "https://cdn.fc-watch.com/img/26/cards/bdor_runnerup.png";
            var bdorThirdCardImage = "https://cdn.fc-watch.com/img/26/cards/bdor_third.png";
            var bddtExtremeCardImage = "https://cdn.fc-watch.com/img/26/cards/bddt_set_reward_extreme.png";
            var bddtRewardCardImage = "https://cdn.fc-watch.com/img/26/cards/bddt_set_reward.png";
            var prizeCardImage = "https://cdn.fc-watch.com/img/26/cards/prize.png";
            var fwTOTYCardImage = "https://cdn.fc-watch.com/img/26/cards/fw_toty.png";
            var powerCardImage = "https://cdn.fc-watch.com/img/26/cards/power.png";
            var fwIconTotyCardImage = "https://cdn.fc-watch.com/img/26/cards/fw_icon_toty.png";
            var lnyCardImage = "https://cdn.fc-watch.com/img/26/cards/lny.png";
            var isFWIconTOTYPlayer = false;

            for (var i = 0; i < imgs.length; i++) {
                var img = imgs[i];
                var originalSrc = img.src || img.getAttribute('src');
                if (originalSrc) {
                    img.src = upgradeImageUrl(originalSrc);
                    if (img.src === dreamTeamCardImage || originalSrc === dreamTeamCardImage) {
                        isDreamTeamPlayer = true;
                    }
                    if (img.src === dreamTeamSilverCardImage || originalSrc === dreamTeamSilverCardImage) {
                        isSilverDreamTeamPlayer = true;
                    }
                    if (img.src === dreamTeamBronzeCardImage || originalSrc === dreamTeamBronzeCardImage) {
                        isBronzeDreamTeamPlayer = true;
                    }
                    if (img.src === vintageCardImage || originalSrc === vintageCardImage) {
                        isVintagePlayer = true;
                    }
                    if (img.src === fwIconCardImage || originalSrc === fwIconCardImage) {
                        isFWIconPlayer = true;
                    }
                    if (img.src === halloweenCardImage || originalSrc === halloweenCardImage) {
                        isHalloweenPlayer = true;
                    }
                    if (img.src === icon26CardImage || originalSrc === icon26CardImage) {
                        isIcon26Player = true;
                    }
                    // NEW VALENTINES REWARD CHECK
                    if (img.src.indexOf('Valentines_Set_Reward.png') > -1 || (originalSrc && originalSrc.indexOf('Valentines_Set_Reward.png') > -1)) {
                        cardTypeInfo.isValentinesReward = true;
                    }
                    // NEW VALENTINES CHECK
                    else if (img.src.indexOf('Valentines_Base.png') > -1 || (originalSrc && originalSrc.indexOf('Valentines_Base.png') > -1)) {
                        cardTypeInfo.isValentines = true;
                    }
                    // NEW FUTMAS CHECK
                    if (img.src === futmasCardImage || originalSrc === futmasCardImage) {
                        isFutmasPlayer = true;
                    }
                    // NEW YEARS CHECK
                    if (img.src === newYearsCardImage || originalSrc === newYearsCardImage) {
                        isNewYearsPlayer = true;
                    }
                    // GOTW CHECK
                    if (img.src === gotwCardImage || originalSrc === gotwCardImage) {
                        isGOTWPlayer = true;
                    }
                    // FUTMAS ICON CHECK
                    if (img.src === futmasIconCardImage || originalSrc === futmasIconCardImage) {
                        isFutmasIconPlayer = true;
                    }
                    // WORLDS CHECK
                    if (img.src === worldsCardImage || originalSrc === worldsCardImage) {
                        isWorldsPlayer = true;
                    }
                    // BLACK FRIDAY CHECK
                    if (img.src === blackFridayCardImage || originalSrc === blackFridayCardImage) {
                        isBlackFridayPlayer = true;
                    }
                    // GOTW MOMENTS CHECK
                    if (img.src === gotwMomentsCardImage || originalSrc === gotwMomentsCardImage) {
                        isGOTWMomentsPlayer = true;
                    }
                    // TOTY 18 CHECK
                    if (img.src === toty18CardImage || originalSrc === toty18CardImage) {
                        isTOTY18Player = true;
                    }
                    // TOTY 26 CHECK
                    if (img.src === toty26CardImage || originalSrc === toty26CardImage) {
                        isTOTY26Player = true;
                    }
                    // ICON WORLD CUP 18 CHECK
                    if (img.src === iconWorldCup18CardImage || originalSrc === iconWorldCup18CardImage) {
                        isIconWorldCup18Player = true;
                    }
                    // FW ICON HALLOWEEN CHECK
                    if (img.src === fwIconHWCardImage || originalSrc === fwIconHWCardImage) {
                        isFWIconHWPlayer = true;
                    }
                    // BDOR WINNER CHECK
                    if (img.src === bdorWinnerCardImage || originalSrc === bdorWinnerCardImage) {
                        isBDORWinnerPlayer = true;
                    }
                    // BDOR RUNNER UP CHECK
                    if (img.src === bdorRunnerUpCardImage || originalSrc === bdorRunnerUpCardImage) {
                        isBDORRunnerUpPlayer = true;
                    }
                    // BDOR THIRD PLACE CHECK
                    if (img.src === bdorThirdCardImage || originalSrc === bdorThirdCardImage) {
                        isBDORThirdPlayer = true;
                    }
                    // BDDT EXTREME CHECK
                    if (img.src === bddtExtremeCardImage || originalSrc === bddtExtremeCardImage) {
                        isBDDTExtremePlayer = true;
                    }
                    // BDDT REWARD CHECK (Robust check: includes filename but NOT 'extreme')
                    if ((img.src.indexOf('bddt_set_reward.png') > -1 || (originalSrc && originalSrc.indexOf('bddt_set_reward.png') > -1)) &&
                        img.src.indexOf('extreme') === -1 && (!originalSrc || originalSrc.indexOf('extreme') === -1)) {
                        isBDDTRewardPlayer = true;
                    }
                    // PRIZE CARD CHECK
                    if (img.src === prizeCardImage || originalSrc === prizeCardImage) {
                        isPrizePlayer = true;
                    }
                    // FW TOTY CHECK
                    if (img.src === fwTOTYCardImage || originalSrc === fwTOTYCardImage) {
                        isFWTOTYPlayer = true;
                    }
                    // FW ICON TOTY CHECK
                    if (img.src === fwIconTotyCardImage || originalSrc === fwIconTotyCardImage) {
                        isFWIconTOTYPlayer = true;
                    }
                    // POWER CHECK
                    if (img.src === powerCardImage || originalSrc === powerCardImage) {
                        isPowerPlayer = true;
                    }
                    // LNY CHECK
                    if (img.src === lnyCardImage || originalSrc === lnyCardImage) {
                        isLNYPlayer = true;
                    }
                }
                img.removeAttribute('loading');
                img.style.visibility = 'visible';
                img.style.opacity = '1';
                img.style.display = 'block';
            }

            cardTypeInfo.isDreamTeam = isDreamTeamPlayer;
            cardTypeInfo.isSilverDreamTeam = isSilverDreamTeamPlayer;
            cardTypeInfo.isBronzeDreamTeam = isBronzeDreamTeamPlayer;
            cardTypeInfo.isVintage = isVintagePlayer;
            cardTypeInfo.isFWIcon = isFWIconPlayer;
            cardTypeInfo.isHalloween = isHalloweenPlayer;
            cardTypeInfo.isIcon26 = isIcon26Player;
            cardTypeInfo.isFutmasIcon = isFutmasIconPlayer;
            cardTypeInfo.isFutmas = isFutmasPlayer;
            cardTypeInfo.isNewYears = isNewYearsPlayer;
            cardTypeInfo.isGOTW = isGOTWPlayer;
            cardTypeInfo.isWorlds = isWorldsPlayer;
            cardTypeInfo.isBlackFriday = isBlackFridayPlayer;
            cardTypeInfo.isGOTWMoments = isGOTWMomentsPlayer;
            cardTypeInfo.isTOTY18 = isTOTY18Player;
            cardTypeInfo.isTOTY26 = isTOTY26Player;
            cardTypeInfo.isIconWorldCup18 = isIconWorldCup18Player;
            cardTypeInfo.isFWIconHW = isFWIconHWPlayer;
            cardTypeInfo.isBDORWinner = isBDORWinnerPlayer;
            cardTypeInfo.isBDORRunnerUp = isBDORRunnerUpPlayer;
            cardTypeInfo.isBDORThird = isBDORThirdPlayer;
            cardTypeInfo.isBDDTExtreme = isBDDTExtremePlayer;
            cardTypeInfo.isBDDTReward = isBDDTRewardPlayer;
            cardTypeInfo.isPrize = isPrizePlayer;
            cardTypeInfo.isFWTOTY = isFWTOTYPlayer;
            cardTypeInfo.isFWIconTOTY = isFWIconTOTYPlayer;
            cardTypeInfo.isPower = isPowerPlayer;
            cardTypeInfo.isLNY = isLNYPlayer;

            var playerImg = null;
            var maxArea = 0;

            for (var j = 0; j < imgs.length; j++) {
                var curr = imgs[j];

                // --- LAYER LOGIC ---

                // 1. Is it the Card Background?
                if (isCardDesignImage(curr)) {
                    curr.classList.add('fcw-layer-base');
                    // If Vintage, apply the sepia filter to the BACKGROUND
                    if (isVintagePlayer) {
                        curr.classList.add('fcw-vintage-filter-layer');
                    }
                    continue;
                }

                var rect = curr.getBoundingClientRect();

                // 2. Is it a small icon (Flag, Badge, Rating)?
                if (rect.width < 60 || rect.height < 60) {
                    curr.classList.add((isDreamTeamPlayer || isSilverDreamTeamPlayer || isBronzeDreamTeamPlayer || isVintagePlayer || isFWIconPlayer || isHalloweenPlayer || isIcon26Player || isFutmasPlayer || isNewYearsPlayer) ? 'fcw-layer-icon-pop' : 'fcw-layer-flat');
                    continue;
                }

                // 3. Find the biggest image (Player Face)
                var area = rect.width * rect.height;
                if (area > maxArea) {
                    maxArea = area;
                    playerImg = curr;
                }
            }

            if (playerImg) {
                playerImg.classList.remove('fcw-layer-icon-pop', 'fcw-layer-flat');

                // If Vintage, apply the sepia filter to the PLAYER FACE
                if (isVintagePlayer) {
                    playerImg.classList.add('fcw-vintage-filter-layer');
                }

                // If FW Icon TOTY, apply majestic golden glow to PLAYER FACE
                if (isFWIconTOTYPlayer) {
                    playerImg.classList.add('fcw-layer-fw-icon-toty-player');

                    var spirit1 = playerImg.cloneNode(true);
                    spirit1.className = 'fcw-fw-icon-toty-spirit fcw-spirit-1';
                    spirit1.removeAttribute('id');
                    playerImg.parentNode.insertBefore(spirit1, playerImg);

                    var spirit2 = playerImg.cloneNode(true);
                    spirit2.className = 'fcw-fw-icon-toty-spirit fcw-spirit-2';
                    spirit2.removeAttribute('id');
                    playerImg.parentNode.insertBefore(spirit2, playerImg);
                }

                if ((isDreamTeamPlayer || isSilverDreamTeamPlayer || isBronzeDreamTeamPlayer || isVintagePlayer || isFWIconPlayer || isHalloweenPlayer || isIcon26Player || isFutmasPlayer || isNewYearsPlayer || isFWIconTOTYPlayer || isLNYPlayer) && isDynamicImage(playerImg)) {
                    playerImg.classList.add('fcw-layer-player-dynamic');
                    cardTypeInfo.isSpecial = true;
                } else {
                    playerImg.classList.add('fcw-layer-flat');
                }
            }

            cardTypeInfo.isIconWorldCup18 = isIconWorldCup18Player;

            // Time Warp Check
            var timeWarpCardImage = "https://cdn.fc-watch.com/img/26/cards/108_time_warp.png";
            var isTimeWarpPlayer = false;

            // Re-check for Time Warp specifically if not found yet or to verify
            for (var i = 0; i < imgs.length; i++) {
                var img = imgs[i];
                var originalSrc = img.src || img.getAttribute('src');
                if (originalSrc) {
                    // Check fuzzy or exact match for Time Warp
                    if (originalSrc.includes('108_time_warp.png')) {
                        isTimeWarpPlayer = true;
                    }
                }
            }
            cardTypeInfo.isTimeWarp = isTimeWarpPlayer;

            return cardTypeInfo;
        }

        // --- 9. Add Premium Effects (Shadows, Radiance, Sparkles) ---
        function addPremiumEffects(clone, isHalloweenMode, isIcon26Mode) {
            var shadow = document.createElement('div');
            shadow.className = 'fcw-effect-ultra-shadow';
            clone.appendChild(shadow);

            var radiance = document.createElement('div');
            radiance.className = 'fcw-effect-radiance';
            clone.appendChild(radiance);

            // Add standard floating particles to the card container itself
            createParticles(clone, 10, false, false, false, false, false, false);

            // ONLY add sparkles if it is NOT a Halloween card AND NOT an Icon 26 card (FPS Fix)
            if (!isHalloweenMode && !isIcon26Mode) {
                createScintillation(clone);
            }
        }

        // --- 10. Add Standard Effects ---
        function addStandardEffects(clone) {
            var shadow = document.createElement('div');
            shadow.className = 'fcw-effect-standard-shadow';
            clone.appendChild(shadow);
        }

        // --- 11. Add Vintage Card Effects ---
        function addVintageCardEffects(clone) {
            var shadow = document.createElement('div');
            shadow.className = 'fcw-effect-standard-shadow';
            shadow.style.background = 'rgba(30, 25, 15, 0.7)';
            shadow.style.filter = 'blur(40px)';
            clone.appendChild(shadow);
        }

        // --- 12. Open Inspector ---
        function openInspector(originalCard) {
            isPaused = false;
            currentCard = originalCard;

            // Disable scrolling while inspector is open
            document.body.style.overflow = 'hidden';

            var rect = originalCard.getBoundingClientRect();
            var targetHeight = window.innerHeight * 0.78;
            var scale = targetHeight / rect.height;

            stage.style.width = (rect.width * scale) + 'px';
            stage.style.height = (rect.height * scale) + 'px';

            var clone = originalCard.cloneNode(true);
            clone.classList.add('fcw-cloned-card');

            var cardInfo = processCloneLayers(clone);

            if ('zoom' in clone.style) {
                clone.style.zoom = scale;
                clone.style.width = rect.width + 'px';
                clone.style.height = rect.height + 'px';
            } else {
                clone.style.transform = 'scale(' + scale + ')';
                clone.style.transformOrigin = 'center center';
            }

            modal.classList.remove('dream-active', 'silver-active', 'bronze-active', 'bddt-gold-active', 'bddt-silver-active', 'bddt-bronze-active', 'vintage-active', 'fw-icon-active', 'halloween-active', 'icon-26-active', 'futmas-active', 'newyears-active', 'gotw-active', 'worlds-active', 'blackfriday-active', 'gotwmoments-active', 'toty18-active', 'toty26-active', 'iconwc18-active', 'time-warp-active', 'fw-icon-hw-active', 'bdor-winner-active', 'bdor-runnerup-active', 'bdor-third-active', 'bddt-extreme-active', 'bddt-reward-active', 'prize-active', 'fw-toty-active', 'power-active', 'valentines-active', 'valentines-reward-active', 'fw-icon-toty-active', 'lny-active');
            removeVintageEffects();
            ribbonContainer.innerHTML = ''; // Clear ribbons
            batContainer.innerHTML = ''; // Clear background bats
            foregroundBatContainer.innerHTML = ''; // Clear foreground bats
            snowContainer.innerHTML = ''; // Clear snow
            santaContainer.innerHTML = ''; // Clear santa
            fireworksContainer.innerHTML = ''; // Clear fireworks
            // Clear New Years Intervals
            if (newYearsFireworksInterval) { clearInterval(newYearsFireworksInterval); newYearsFireworksInterval = null; }
            stopNewYearsAudio();
            christmasLightsContainer.innerHTML = ''; // Clear Christmas lights
            worldsMapContainer.innerHTML = ''; // Clear worlds map
            blackFridayContainer.innerHTML = ''; // Clear Black Friday effects
            gotwMomentsContainer.innerHTML = ''; // Clear GOTW Moments effects
            toty18Container.innerHTML = ''; // Clear TOTY 18 effects
            if (fwTotyContainer) fwTotyContainer.innerHTML = ''; // Clear FW TOTY effects
            if (fwIconTotyContainer) fwIconTotyContainer.innerHTML = ''; // Clear FW Icon TOTY effects

            // Clear Reality Fracture
            spectralGearContainer.innerHTML = '';
            fractureOverlay.innerHTML = '';
            fwIconHWContainer.innerHTML = ''; // Clear FW Icon HW effects
            bdorContainer.innerHTML = ''; // Clear BDOR Winner effects
            powerContainer.innerHTML = ''; // Clear Power lightning effects
            stopPowerAudio();
            stopValentinesEffects();
            if (fractureInterval) clearInterval(fractureInterval);

            if (cardInfo.isVintage) {
                addVintageCardEffects(clone);
                modal.classList.add('vintage-active');
                createVintageEffects();
                createParticles(ambientParticles, 3, true, false, false, false, false, false);
            } else if (cardInfo.isFWIconHW) {
                // --- FW ICON HALLOWEEN (Custom BG + Halloween Bats + Luxury White Glow) ---
                addPremiumEffects(clone, true, false);
                modal.classList.add('fw-icon-hw-active');
                createHalloweenBackgroundBats();
                createSleekAmbientBats(foregroundBatContainer);
                createFWIconHWEffects(); // Luxury white glow effects
                createParticles(ambientParticles, 40, true, false, false, true, false, false);
            } else if (cardInfo.isBDORWinner) {
                // --- BALLON D'OR WINNER (Uses Dream Team Gold styling) ---
                addPremiumEffects(clone, false, false);
                modal.classList.add('dream-active');
                createParticles(ambientParticles, 30, true, true, false, false, false, false);
            } else if (cardInfo.isBDORRunnerUp) {
                // --- BALLON D'OR RUNNER-UP (Uses Dream Team Silver styling) ---
                addPremiumEffects(clone, false, false);
                modal.classList.add('silver-active');
                createParticles(ambientParticles, 30, true, true, false, false, false, false);
            } else if (cardInfo.isBDORThird) {
                // --- BALLON D'OR THIRD PLACE (Uses Dream Team Bronze styling) ---
                addPremiumEffects(clone, false, false);
                modal.classList.add('bronze-active');
                createParticles(ambientParticles, 30, true, true, false, false, false, false);
            } else if (cardInfo.isBDDTExtreme) {
                // --- BDDT SET REWARD EXTREME (Neon Green Luxurious Effects) ---
                addPremiumEffects(clone, false, false);
                modal.classList.add('bddt-extreme-active');
                createBDDTExtremeEffects();
            } else if (cardInfo.isBDDTReward) {
                // --- BDDT SET REWARD (Purple Luxurious Effects) ---
                addPremiumEffects(clone, false, false);
                modal.classList.add('bddt-reward-active');
                createBDDTRewardEffects();
            } else if (cardInfo.isPrize) {
                // --- PRIZE CARD (Custom BG + Red/Black Effects, No Yellow Particles) ---
                // DO NOT call addPremiumEffects - it adds yellow shimmer
                modal.classList.add('prize-active');
                createPrizeEffects();
            } else if (cardInfo.isFWTOTY) {
                // --- FW TOTY CARD (Custom BG + Luxurious Gold Effects) ---
                addPremiumEffects(clone, false, false);
                modal.classList.add('fw-toty-active');
                createFWTOTYEffects();
                createParticles(ambientParticles, 50, true, true, false, false, false, false);
            } else if (cardInfo.isFWIconTOTY) {
                // --- FW ICON TOTY (Ultimate Gold & Crimson) ---
                addPremiumEffects(clone, false, false);
                modal.classList.add('fw-icon-toty-active');
                createFWIconTOTYEffects();
            } else if (cardInfo.isValentinesReward) {
                // --- VALENTINES REWARD CARD (Ultra Advanced Light Rays + Spotlight + Burst) ---
                addPremiumEffects(clone, false, false);
                modal.classList.add('valentines-reward-active');
                createValentinesRewardEffects();
            } else if (cardInfo.isValentines) {
                // --- VALENTINES CARD (Romantic BG + Hearts/Sparkles) ---
                addPremiumEffects(clone, false, false);
                modal.classList.add('valentines-active');
                createValentinesEffects();
            } else if (cardInfo.isFWIcon) {
                addPremiumEffects(clone, false, false);
                modal.classList.add('fw-icon-active');
                createRibbonEffects();
                createParticles(ambientParticles, 30, true, false, true, false, false, false);
            } else if (cardInfo.isHalloween) {
                addPremiumEffects(clone, true, false);
                modal.classList.add('halloween-active');
                createHalloweenBackgroundBats();
                createSleekAmbientBats(foregroundBatContainer);
                createParticles(ambientParticles, 40, true, false, false, true, false, false);
            } else if (cardInfo.isIcon26) {
                addPremiumEffects(clone, false, true);
                modal.classList.add('icon-26-active');
                createIcon26Ribbons();
                createParticles(ambientParticles, 45, true, false, false, false, true, false);
            } else if (cardInfo.isFutmas) {
                // --- ENHANCED FUTMAS CHRISTMAS LOGIC ---
                addPremiumEffects(clone, false, false);
                modal.classList.add('futmas-active');
                createSnowEffects();
                startChristmasCursorTrail(); // Red & green cursor trail effect
                createParticles(ambientParticles, 45, true, false, false, false, false, true);
            } else if (cardInfo.isNewYears) {
                // --- NEW YEARS FIREWORKS CELEBRATION ---
                addPremiumEffects(clone, false, false);
                modal.classList.add('newyears-active');
                createNewYearsEffects(); // Fireworks, confetti, sparkles & audio
                createParticles(ambientParticles, 50, true, false, false, false, false, false);
            } else if (cardInfo.isLNY) {
                // --- LUNAR NEW YEAR THEME ---
                addPremiumEffects(clone, false, false);
                modal.classList.add('lny-active');
                createLNYEffects(ambientParticles);
            } else if (cardInfo.isGOTW) {
                // --- GOTW (THEATRE SPOTLIGHT PREMIUM EFFECT) ---
                addPremiumEffects(clone, false, false);
                modal.classList.add('gotw-active');
                createGOTWEffects(); // Purple spotlights and light effects
                createGOTWMomentsParticles(ambientParticles);
                // Add card shimmer sweep directly to the card (clipped to card bounds via mask)
                clone.style.overflow = 'hidden';
                clone.style.position = 'relative';
                var cardShimmer = document.createElement('div');
                cardShimmer.className = 'fcw-card-shimmer';

                // --- FIX: Use Card Image as Mask ---
                // This forces the shimmer to only appear where the card is opaque
                var cardImgUrl = "https://cdn.fc-watch.com/img/26/cards/gotw.png";
                if (cardInfo && (cardInfo.imageSrc || cardInfo.imgUrl)) {
                    // Try to get dynamic image if available, fallback to static GOTW
                    cardImgUrl = cardInfo.imageSrc || cardInfo.imgUrl || cardImgUrl;
                } else if (clone.querySelector('img')) {
                    cardImgUrl = clone.querySelector('img').src;
                }

                cardShimmer.style.webkitMaskImage = 'url(' + cardImgUrl + ')';
                cardShimmer.style.maskImage = 'url(' + cardImgUrl + ')';
                cardShimmer.style.webkitMaskSize = '100% 100%';
                cardShimmer.style.maskSize = '100% 100%';
                cardShimmer.style.webkitMaskRepeat = 'no-repeat';
                cardShimmer.style.maskRepeat = 'no-repeat';
                cardShimmer.style.webkitMaskPosition = 'center';
                cardShimmer.style.maskPosition = 'center';

                clone.appendChild(cardShimmer);
            } else if (cardInfo.isGOTWMoments) {
                // --- GOTW MOMENTS (ULTRA-LUXURY SERPENTINE RIBBON) ---
                addPremiumEffects(clone, false, false);
                modal.classList.add('gotwmoments-active');
                createGOTWMomentsEffects(); // White shimmer overlay
                createDiamondAsteroids(); // EXCLUSIVE: Real 3D Flowing Silk Ribbon
                createGOTWMomentsParticles(ambientParticles);
            } else if (cardInfo.isTOTY18) {
                // --- FIFA 18 TOTY (ROYAL NAVY & GOLD) ---
                addPremiumEffects(clone, false, false);
                modal.classList.add('toty18-active');
                createTOTY18Effects();
                createTOTY18Particles(ambientParticles);
            } else if (cardInfo.isTOTY26) {
                // --- FC 26 TOTY (BLUE & GOLD LUXURY) ---
                addPremiumEffects(clone, false, false);
                modal.classList.add('toty26-active');
                createTOTY26Effects();
            } else if (cardInfo.isWorlds) {
                // --- WORLDS GLOBAL TOURNAMENT EFFECT ---
                addPremiumEffects(clone, false, false);
                modal.classList.add('worlds-active');
                createWorldsEffects(); // Interactive world map with continents
                createWorldsParticles(ambientParticles); // Purple & gold particles
            } else if (cardInfo.isBlackFriday) {
                // --- BLACK FRIDAY SHOPPING LUXURY EFFECT ---
                addPremiumEffects(clone, false, false);
                modal.classList.add('blackfriday-active');
                createBlackFridayEffects(); // Sale tags, shimmer, vignette
                createBlackFridayParticles(ambientParticles); // Gold & red particles
            } else if (cardInfo.isFutmasIcon) {
                // --- FUTMAS ICON (CHRISTMAS + LUXURY FUSION) ---
                addPremiumEffects(clone, false, true); // Use premium effects with Icon shimmer
                modal.classList.add('futmas-icon-active');
                createSnowEffects(); // Add snow for Christmas feel
                // Pass isFutmasIconMode=true (last argument) to generated gold/white particles
                createParticles(ambientParticles, 40, true, false, false, false, false, false, true);
            } else if (cardInfo.isIconWorldCup18) {
                // --- ICON WORLD CUP 18 (PREMIUM MODERN) ---
                addPremiumEffects(clone, false, false);
                modal.classList.add('iconwc18-active');
                // Use standard particles but maybe tweak them if needed, or just let the background shine
                createParticles(ambientParticles, 25, true, false, false, false, false, false);
            } else if (cardInfo.isDreamTeam) {
                // --- DREAM TEAM GOLD (Ultra Luxurious Golden Effects) ---
                addPremiumEffects(clone, false, false);
                modal.classList.add('bddt-gold-active');
                createBDDTGoldEffects();
            } else if (cardInfo.isSilverDreamTeam) {
                // --- DREAM TEAM SILVER (Ultra Luxurious Silver Effects) ---
                addPremiumEffects(clone, false, false);
                modal.classList.add('bddt-silver-active');
                createBDDTSilverEffects();
            } else if (cardInfo.isBronzeDreamTeam) {
                // --- DREAM TEAM BRONZE (Ultra Luxurious Bronze Effects) ---
                addPremiumEffects(clone, false, false);
                modal.classList.add('bddt-bronze-active');
                createBDDTBronzeEffects();
            } else if (cardInfo.isTimeWarp) {
                // --- TIME WARP: REALITY FRACTURE ---
                addPremiumEffects(clone, false, false);
                modal.classList.add('time-warp-active');

                createSpectralGears();
                createReverseEntropy(ambientParticles);
                startTimeFracture(clone); // Pass card to the glitch loop

            } else if (cardInfo.isPower) {
                // --- POWER (ELECTRIC LIGHTNING STORM) ---
                addPremiumEffects(clone, false, false);
                modal.classList.add('power-active');
                // No audio â€” lightning only
                createPowerLightningEffects(clone); // Canvas lightning + screen flash + headshot overlay
                createParticles(ambientParticles, 30, true, false, false, false, false, false);

            } else {
                addStandardEffects(clone);
                createParticles(ambientParticles, 20, true, false, false, false, false, false);
            }

            clone.style.visibility = 'visible';
            clone.style.opacity = '1';

            wrapper.innerHTML = '';
            wrapper.appendChild(clone);

            modal.classList.add('active');
        }

        // --- 13. Event Handlers ---
        // DISABLED DBLCLICK
        // document.addEventListener('dblclick', function(e) {
        //     var card = findCardContainer(e.target);
        //     if (card) {
        //         e.preventDefault();
        //         e.stopPropagation();
        //         e.stopPropagation();
        //         e.stopPropagation();
        //         openInspector(card);
        //     }
        // });

        var lastTap = 0;
        document.addEventListener('touchend', function (e) {
            var currentTime = new Date().getTime();
            var tapLength = currentTime - lastTap;
            if (tapLength < 300 && tapLength > 0) {
                var card = findCardContainer(e.target);
                if (card) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopPropagation();
                    openInspector(card);
                }
            }
            lastTap = currentTime;
        });

        // --- All backgrounds are now preloaded eagerly via CARD_BACKGROUNDS at the top of the file ---

        // console.log('%cðŸŽ¬ FC Watch Inspector v18.2', 'color: #FFD700; font-size: 14px; font-weight: bold;');
        // console.log('%câ­ GOTW Moments Premium White Animation Enabled', 'color: #fff; font-size: 12px;');



        // --- 14. Integrated Popover Inspect Logic ---

        var lastClickedCard = null;

        // Track which card was clicked last
        document.addEventListener('mousedown', function (e) {
            var card = findCardContainer(e.target);
            if (card) {
                lastClickedCard = card;
            }
        }, true); // Capture phase to ensure we get it before other handlers

        // Observe body for Bootstrap popovers being added
        var popoverObserver = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                mutation.addedNodes.forEach(function (node) {
                    if (node.nodeType === 1 && node.classList.contains('popover')) {
                        injectInspectButton(node);
                    }
                });
            });
        });

        // Start observing
        popoverObserver.observe(document.body, { childList: true, subtree: true });

        function injectInspectButton(popover) {
            // Wait slightly for content to populate if needed, but usually it's immediate in bootstrap
            // Check if we have dynamic content container
            var content = popover.querySelector('.popover-content');
            if (!content) {
                // Retry shortly if content isn't there yet
                setTimeout(function () { injectInspectButton(popover); }, 50);
                return;
            }

            if (content.querySelector('.fcw-popover-inspect-btn')) return;

            // Capture the SPECIFIC card that triggered this popover right now
            var targetCard = lastClickedCard;

            // --- INJECT + BUTTON IN POPOVER TITLE ---
            var titleEl = popover.querySelector('.popover-title');
            if (titleEl && !titleEl.querySelector('.fcw-add-filter-btn')) {
                injectAddFilterButton(titleEl, targetCard);
            }

            var btn = document.createElement('div');
            btn.className = 'fcw-popover-inspect-btn';
            btn.textContent = 'INSPECT';

            // --- HOVER PRELOAD: Detect card type and preload background on hover ---
            btn.addEventListener('mouseenter', function () {
                if (!targetCard) return;
                var imgs = targetCard.querySelectorAll('img');
                // Map card image filenames to CARD_BACKGROUNDS keys
                var fileToKey = {
                    'gotw.png': 'gotw',
                    '108_time_warp.png': 'time-warp',
                    'fw_icon_hw.png': 'fw-icon-hw',
                    'bdor_winner.png': 'bdor-winner',
                    'bdor_runnerup.png': 'bdor-runnerup',
                    'bdor_third.png': 'bdor-third',
                    'bddt_gold.png': 'bddt-gold',
                    'bddt_silver.png': 'bddt-silver',
                    'bddt_bronze.png': 'bddt-bronze',
                    'bddt_set_reward_extreme.png': 'bddt-extreme',
                    'bddt_set_reward.png': 'bddt-reward',
                    'prize.png': 'prize',
                    '5_toty.png': 'toty26'
                };
                for (var i = 0; i < imgs.length; i++) {
                    var src = (imgs[i].src || imgs[i].getAttribute('src') || '');
                    for (var file in fileToKey) {
                        if (src.includes(file)) {
                            preloadCardBackground(fileToKey[file]);
                            return; // Only need to preload one
                        }
                    }
                }
            }, { once: true }); // Only preload once per button

            btn.onclick = function (e) {
                e.preventDefault();
                e.stopPropagation();
                // Use the captured card, NOT the global lastClickedCard (which might have changed)
                if (targetCard) {
                    openInspector(targetCard);
                } else {
                    console.warn("No card tracked for inspection");
                }
            };

            content.appendChild(btn);
        }

        // --- HELPER: Inject Add Filter Button ---
        function injectAddFilterButton(titleEl, targetCard) {
            // Wrap title content for flexbox layout
            var originalContent = titleEl.innerHTML;
            titleEl.innerHTML = '';
            titleEl.className += ' fcw-popover-title-wrapper';

            var textSpan = document.createElement('span');
            textSpan.innerHTML = originalContent;
            titleEl.appendChild(textSpan);

            var addBtn = document.createElement('button');
            addBtn.className = 'fcw-add-filter-btn';
            addBtn.innerHTML = '+';
            addBtn.title = 'Add card type as filter';

            addBtn.onclick = function (e) {
                e.preventDefault();
                e.stopPropagation();

                if (!targetCard) {
                    showFilterToast('No card detected');
                    return;
                }

                // Extract card type URL from the card
                var cardTypeInfo = extractCardTypeFromCard(targetCard);
                if (!cardTypeInfo) {
                    showFilterToast('Could not detect card type');
                    return;
                }

                // Save to localStorage
                var saved = saveCustomFilter(cardTypeInfo);
                if (saved) {
                    addBtn.innerHTML = 'âœ“';
                    addBtn.classList.add('fcw-added');
                    showFilterToast('Added filter: ' + cardTypeInfo.label);
                } else {
                    showFilterToast('Filter already exists');
                }
            };

            titleEl.appendChild(addBtn);
        }

        // --- HELPER: Extract Card Type From Card ---
        function extractCardTypeFromCard(card) {
            if (!card) return null;

            // Find all images in the card
            var imgs = card.querySelectorAll('img');
            var cardTypeUrl = null;

            // Known card type patterns (look for card background images)
            var cardPatterns = ['card', 'background', 'bg_', '_bg', 'design', 'template', 'frame', 'border', 'base', 'item', 'rare', 'common', 'toty', 'tots', 'totw', 'fut', 'promo', 'event', '/cards/'];

            for (var i = 0; i < imgs.length; i++) {
                var img = imgs[i];
                var src = (img.src || img.getAttribute('src') || '').toLowerCase();

                // Check if this looks like a card type image
                for (var j = 0; j < cardPatterns.length; j++) {
                    if (src.indexOf(cardPatterns[j]) !== -1) {
                        cardTypeUrl = img.src || img.getAttribute('src');
                        break;
                    }
                }
                if (cardTypeUrl) break;
            }

            if (!cardTypeUrl) return null;

            // Parse the URL to extract the type name
            // Example: https://cdn.fc-watch.com/img/26/cards/futmas.png -> futmas
            var urlParts = cardTypeUrl.split('/');
            var filename = urlParts[urlParts.length - 1]; // e.g., "futmas.png"
            var typeName = filename.replace(/\.[^/.]+$/, ''); // Remove extension

            // Create a human-readable label using same logic as user's filter.js
            var label = typeName
                .split(/[_-]/)
                .map(function (word) {
                    // Check for Roman Numerals (simple common ones)
                    if (/^(xi|xii|xiii|iv|vi|vii|viii|ix|ii|iii)$/i.test(word)) return word.toUpperCase();
                    return word.charAt(0).toUpperCase() + word.slice(1);
                })
                .join(' ');

            // Return in user's filter.js format: { id, label, imageUrl }
            return {
                id: typeName,
                label: label,
                imageUrl: cardTypeUrl
            };
        }

        // --- HELPER: Save Custom Filter (uses user's filter.js format) ---
        function saveCustomFilter(filterInfo) {
            // Use same storage key as user's filter.js
            var storageKey = 'fc_watch_custom_filters_v4';
            var existingFilters = [];

            try {
                existingFilters = JSON.parse(localStorage.getItem(storageKey)) || [];
            } catch (e) {
                existingFilters = [];
            }

            // Check if filter already exists (by id or imageUrl)
            for (var i = 0; i < existingFilters.length; i++) {
                if (existingFilters[i].id === filterInfo.id || existingFilters[i].imageUrl === filterInfo.imageUrl) {
                    return false; // Already exists
                }
            }

            existingFilters.push(filterInfo);
            localStorage.setItem(storageKey, JSON.stringify(existingFilters));

            // Notify other scripts to update immediately
            window.dispatchEvent(new CustomEvent('fcw-filters-updated'));

            return true;
        }

        // --- HELPER: Show Toast Notification ---
        function showFilterToast(message) {
            // Remove existing toast if any
            var existingToast = document.querySelector('.fcw-filter-toast');
            if (existingToast) existingToast.remove();

            var toast = document.createElement('div');
            toast.className = 'fcw-filter-toast';
            toast.textContent = message;
            document.body.appendChild(toast);

            // Trigger animation
            setTimeout(function () { toast.classList.add('active'); }, 10);

            // Auto-hide after 2.5s
            setTimeout(function () {
                toast.classList.remove('active');
                setTimeout(function () { toast.remove(); }, 300);
            }, 2500);
        }
    } // End initInspector
})();

    // === NAVBAR.JS ===
// ==UserScript==
// @name         FC Watch - Sleek Club Navbar (Instant Load)
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Modernizes the secondary navbar. ID-safe and Instant loading.
// @match        https://www.fc-watch.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // === KILLSWITCH CHECK ===
    // Prefers Promise-based approach when available, falls back to polling
    function waitForKillswitch(callback, maxWait = 500) {
        // Try Promise-based approach first (faster, no polling)
        if (window.__FCW_EXTENSION_STATE?.ready instanceof Promise) {
            window.__FCW_EXTENSION_STATE.ready.then(isEnabled => {
                if (isEnabled) callback();
                else console.log('[FCW Navbar] Extension disabled, not running.');
            });
            return;
        }

        // Fallback: poll with reduced frequency
        let waited = 0;
        const check = () => {
            if (window.__FCW_EXTENSION_STATE?.loaded) {
                if (window.__FCW_EXTENSION_STATE.enabled) {
                    callback();
                } else {
                    console.log('[FCW Navbar] Extension disabled, not running.');
                }
            } else if (waited < maxWait) {
                waited += 10;
                setTimeout(check, 10);
            } else {
                callback(); // Failsafe
            }
        };
        check();
    }

    waitForKillswitch(initNavbar);

    function initNavbar() {
        // --- 1. Load Settings Immediately ---
        const defaultSettings = {
            opacity: 0.90,
            blur: 12,
            accent: '#8d124d',
            glassTint: '',
            font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            customFontData: null,
            customFontName: null
        };

        let settings = JSON.parse(localStorage.getItem('fcw_navbar_settings')) || defaultSettings;

        // --- 2. Construct CSS Immediately (Before Page Render) ---
        const css = `
        :root {
            --fcw-nav-opacity: ${settings.opacity};
            --fcw-nav-blur: ${settings.blur}px;
            --fcw-accent: ${settings.accent};
            --fcw-glass-tint: ${settings.glassTint || 'transparent'};
            --fcw-font: ${settings.font};
            --fcw-bg-rgb: 20, 25, 35;
            --fcw-text-main: #e2e8f0;
            --fcw-text-muted: #94a3b8;
            --fcw-panel-bg: rgba(30, 35, 45, 0.95);
            --fcw-input-bg: rgba(255, 255, 255, 0.08);
            --fcw-border: rgba(255, 255, 255, 0.12);
        }

        /* --- Global Font Application --- */
        html, body, .navbar, .navbar-nav, .dropdown-menu, .btn, input, select, textarea, h1, h2, h3, h4, h5, h6 {
            font-family: var(--fcw-font) !important;
        }

        /* --- Main Filter Bar Container --- */
        .navbar-default {
            background-color: rgba(var(--fcw-bg-rgb), var(--fcw-nav-opacity)) !important;
            background-image: linear-gradient(var(--fcw-glass-tint), var(--fcw-glass-tint)) !important;
            border: none !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
            box-shadow: 0 4px 20px rgba(0,0,0,0.4) !important;
            border-radius: 0 0 16px 16px !important;
            margin-bottom: 20px !important;
            backdrop-filter: blur(var(--fcw-nav-blur)) !important;
            -webkit-backdrop-filter: blur(var(--fcw-nav-blur)) !important;
            transition: background-color 0.3s ease, backdrop-filter 0.3s ease;
            position: relative;
            display: flex !important;
            align-items: center;
            justify-content: flex-start;
            padding: 0 60px 0 0 !important;
            box-sizing: border-box !important;
            width: 100% !important;
            min-height: 50px !important;
            flex-wrap: nowrap !important;
            overflow: visible !important;
        }

        /* --- Top Navigation Bar (navbar-inverse) Glass Tint --- */
        /* CRITICAL: backdrop-filter creates a stacking context, must have z-index > 999
           to ensure dropdowns appear above the filter bar (navbar-default) */
        nav.navbar.navbar-inverse {
            background-color: rgba(var(--fcw-bg-rgb), var(--fcw-nav-opacity)) !important;
            background-image: linear-gradient(var(--fcw-glass-tint), var(--fcw-glass-tint)) !important;
            border: none !important;
            backdrop-filter: blur(var(--fcw-nav-blur)) !important;
            -webkit-backdrop-filter: blur(var(--fcw-nav-blur)) !important;
            transition: background-color 0.3s ease, backdrop-filter 0.3s ease;
            position: relative !important;
            z-index: 1060 !important; /* MATCH DARK_UI: HIGHER THAN NAVBAR-DEFAULT */
        }
        
        /* SmartMenus scroll arrows styling */
        .scroll-up, .scroll-down {
            background-color: rgba(var(--fcw-bg-rgb), 0.95) !important;
            border-radius: 4px !important;
            pointer-events: none !important;
        }
        
        /* Fix scroll locking in dropdowns - allow bidirectional scrolling */
        .dropdown-menu[style*="overflow-y: auto"],
        .dropdown-menu[style*="overflow-y:auto"],
        .dropdown-menu[style*="max-height"] {
            overscroll-behavior: contain !important;
            -webkit-overflow-scrolling: touch !important;
        }
        
        /* Ensure specific deep leaf submenus with scrolling work properly without clipping children */
        #fcw-overhauled-sub {
            overflow-y: auto !important;
            overscroll-behavior: contain !important;
            max-height: 80vh !important;
            overflow-x: hidden !important;
        }
        
        /* ================================================
           FUTWATCH NESTED DROPDOWN FIX
           The Futwatch dropdown is nested multiple levels deep.
           Ensure all parent li elements allow overflow.
           ================================================ */
        
        /* All li elements in dropdowns must allow overflow for child menus */
        .dropdown-menu li,
        .dropdown-menu > li,
        .navbar-default .dropdown-menu li,
        #group-futwatch-sub li,
        [id*="futwatch"] li {
            position: relative !important;
            overflow: visible !important;
        }
        
        /* Submenu anchors with nested menus need proper positioning */
        .dropdown-menu li.open,
        .dropdown-menu li:hover {
            overflow: visible !important;
        }
        
        /* Submenus of submenus - position to the right */
        .dropdown-menu .dropdown-menu,
        .dropdown-menu ul.dropdown-menu {
            left: 100% !important;
            top: 0 !important;
            margin-left: 2px !important;
            z-index: 2147483647 !important;
            position: absolute !important;
        }
        
        /* Ensure the specific Futwatch submenu structure works (Grid Layout) */
        #group-futwatch-sub[style*="block"],
        [id*="futwatch-sub"][style*="block"] {
            display: grid !important;
            grid-template-rows: repeat(14, auto) !important;
            grid-auto-flow: column !important;
            overflow: visible !important;
            width: max-content !important;
            max-width: none !important;
            height: auto !important;
            max-height: 80vh !important;
            gap: 2px 10px !important;
        }
        
        #group-futwatch-sub > li,
        [id*="futwatch-sub"] > li {
            width: 260px !important;
            min-width: 260px !important;
        }
        
        /* Leaf node massive submenus should scroll vertically so they don't widen off-screen */
        #group-daily-reward-pack-sub,
        [id*="daily-reward-pack-sub"] {
            overflow-y: auto !important;
            overflow-x: hidden !important;
            max-height: 75vh !important;
            overscroll-behavior: contain !important;
            width: max-content !important;
            pointer-events: auto !important;
            touch-action: pan-y !important;
            padding-bottom: 20px !important;
            scrollbar-width: thin !important;
        }
        
        #group-futwatch-sub a {
            white-space: normal !important;
            width: auto !important;
        }
        
        #group-futwatch-sub .dropdown-menu,
        #group-futwatch-sub ul {
            z-index: 2147483647 !important;
            position: absolute !important;
            left: 100% !important;
            top: 0 !important;
        }

        .navbar-default > div {
            width: auto;
            max-width: 100%;
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            box-sizing: border-box !important;
        }

        /* --- Pagination Area --- */
        .sb-pagination-wrap {
            background: transparent !important;
            border-bottom: none !important;
            padding: 10px 15px !important;
        }

        .sb-pagination-wrap .pagination > li > a,
        .sb-pagination-wrap .pagination > li > span {
            background-color: rgba(255, 255, 255, 0.05) !important;
            color: var(--fcw-text-main) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            border-radius: 8px;
            margin: 0 3px;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            font-weight: 500;
        }

        .sb-pagination-wrap .pagination > li > a:hover,
        .sb-pagination-wrap .pagination > li > span:hover {
            background-color: var(--fcw-accent) !important;
            color: #fff !important;
            border-color: var(--fcw-accent) !important;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }

        .sb-pagination-wrap .pagination > .active > a,
        .sb-pagination-wrap .pagination > .active > span {
            background-color: var(--fcw-accent) !important;
            border-color: var(--fcw-accent) !important;
            color: white !important;
            font-weight: 700;
            box-shadow: 0 0 10px var(--fcw-accent);
        }

        /* Go Button */
        #page-form .btn-primary {
            background-color: var(--fcw-accent) !important;
            border: none !important;
            border-radius: 8px;
            padding: 4px 12px;
            transition: all 0.2s;
            font-weight: 600;
        }
        #page-form .btn-primary:hover {
            filter: brightness(1.2);
            transform: scale(1.05);
        }
        #page-form input[type="number"] {
            background: rgba(0,0,0,0.3) !important;
            border: 1px solid rgba(255,255,255,0.15) !important;
            color: white !important;
            border-radius: 6px;
            padding: 4px 8px;
        }

        /* --- Filter Links --- */
        .navbar-default .navbar-nav > li > a {
            color: var(--fcw-text-muted) !important;
            font-weight: 500;
            text-transform: uppercase;
            font-size: 0.85rem;
            letter-spacing: 0.5px;
            padding: 16px 18px !important;
            transition: color 0.3s, text-shadow 0.3s;
        }

        .navbar-default .navbar-nav > li > a:hover {
            background-color: transparent !important;
            color: #fff !important;
            text-shadow: 0 0 12px var(--fcw-accent) !important;
        }

        .navbar-default .navbar-nav li.open > a,
        .navbar-default .navbar-nav a.highlighted,
        .navbar-default .navbar-nav a:focus,
        .navbar-default .navbar-nav a:active,
        .navbar-default .dropdown-menu li.open > a,
        .navbar-default .dropdown-menu a.highlighted,
        .navbar-default .dropdown-menu a:focus,
        .navbar-default .dropdown-menu a:active {
            background-color: transparent !important;
            color: #f0f0f0 !important;
            text-shadow: none !important;
            filter: none !important;
        }

        /* --- Dropdown Menus --- */
        .navbar-default .dropdown-menu {
            background-color: rgba(30, 35, 45, 0.95) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            border-radius: 12px !important;
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.6) !important;
            padding: 8px !important;
            backdrop-filter: blur(20px);
            z-index: 2147483647 !important;
        }

        .navbar-default .dropdown-menu > li > a {
            color: var(--fcw-text-main) !important;
            padding: 10px 16px !important;
            border-radius: 8px;
            transition: all 0.2s;
            font-size: 13px;
        }

        .navbar-default .dropdown-menu > li > a:hover {
            background-color: var(--fcw-accent) !important;
            color: #fff !important;
            transform: translateX(4px);
        }

        /* --- Search Bar --- */
        #sb-card-search {
            background-color: rgba(0, 0, 0, 0.25) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            border-radius: 20px !important;
            color: #fff !important;
            padding: 8px 16px !important;
            margin-top: 8px;
            margin-bottom: 8px;
            width: clamp(120px, 15vw, 220px);
            min-width: 120px;
            max-width: 260px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-sizing: border-box !important;
            flex-shrink: 1;
        }

        #sb-card-search:focus {
            background-color: rgba(0, 0, 0, 0.4) !important;
            border-color: var(--fcw-accent) !important;
            width: clamp(150px, 18vw, 260px);
            outline: none;
            box-shadow: 0 0 0 3px rgba(141, 18, 77, 0.25);
        }

        /* --- Active Filter Chips --- */
        .sb-pager {
            background: rgba(var(--fcw-bg-rgb), 0.7) !important;
            border-radius: 16px;
            padding: 12px !important;
            margin: 15px auto !important;
            max-width: 90%;
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            justify-content: center;
            border: 1px solid rgba(255,255,255,0.05);
            backdrop-filter: blur(8px);
        }

        .sb-pager li { display: inline-block; }

        .sb-pager li > a {
            background-color: var(--fcw-accent) !important;
            border: none !important;
            border-radius: 20px !important;
            color: white !important;
            padding: 6px 16px !important;
            font-size: 12px;
            font-weight: 600;
            box-shadow: 0 4px 10px rgba(0,0,0,0.2);
            transition: transform 0.2s;
        }

        .sb-pager li > a:hover {
            transform: scale(1.05);
            filter: brightness(1.1);
            text-decoration: none;
        }

        .sb-chip-token {
            background: rgba(255,255,255,0.1);
            border-radius: 12px;
            padding: 4px 10px;
            border: 1px solid rgba(255,255,255,0.1);
            color: white;
        }

        /* --- GEAR ICON --- */
        #fcw-nav-gear-btn {
            position: absolute;
            right: 15px;
            top: 50%;
            transform: translateY(-50%);
            width: 36px;
            height: 36px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            z-index: 1001;
            color: #fff;
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.1);
            backdrop-filter: blur(5px);
            opacity: 0;
            animation: fcw-gear-fadein 0.3s ease-out 0.1s forwards;
        }
        @keyframes fcw-gear-fadein {
            to { opacity: 1; }
        }
        #fcw-nav-gear-btn:hover {
            background: rgba(255,255,255,0.2);
            border-color: rgba(255,255,255,0.3);
            transform: translateY(-50%) scale(1.1) rotate(15deg);
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        #fcw-nav-gear-btn svg { width: 20px; height: 20px; fill: currentColor; }

        /* --- SETTINGS PANEL (iOS 26 Glass) --- */
        #fcw-nav-settings-panel {
            position: absolute;
            width: 320px;
            background: rgba(20, 20, 25, 0.55);
            backdrop-filter: blur(60px) saturate(180%) brightness(0.95);
            -webkit-backdrop-filter: blur(60px) saturate(180%) brightness(0.95);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 14px;
            padding: 18px;
            box-shadow: 0 25px 50px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06);
            z-index: 2147483647;
            opacity: 0;
            visibility: hidden;
            display: none;
            transform: translateY(-8px) scale(0.97);
            transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        }
        #fcw-nav-settings-panel.active {
            opacity: 1;
            visibility: visible;
            display: block !important;
            transform: translateY(0) scale(1);
        }

        .fcw-setting-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .fcw-setting-header h4 {
            margin: 0;
            font-size: 14px;
            font-weight: 600;
            color: rgba(255,255,255,0.9);
            letter-spacing: -0.2px;
        }

        .fcw-setting-row { margin-bottom: 14px; }
        .fcw-setting-label {
            display: flex;
            justify-content: space-between;
            color: rgba(255,255,255,0.5);
            font-size: 12px;
            font-weight: 500;
            margin-bottom: 6px;
        }

        /* Modern Sliders (iOS 26) */
        .fcw-slider {
            -webkit-appearance: none;
            width: 100%;
            height: 3px;
            background: rgba(255,255,255,0.15);
            border-radius: 2px;
            outline: none;
            transition: background 0.2s;
        }
        .fcw-slider:hover { background: rgba(255,255,255,0.25); }
        .fcw-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: #fff;
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(0,0,0,0.25);
            transition: transform 0.15s;
        }
        .fcw-slider::-webkit-slider-thumb:hover { transform: scale(1.15); }

        /* Modern Color Picker Bars */
        .fcw-gradient-picker {
            position: relative;
            width: 100%;
            height: 16px;
            border-radius: 8px;
            cursor: crosshair;
            box-shadow: inset 0 1px 3px rgba(0,0,0,0.3);
            margin-bottom: 10px;
            transition: transform 0.2s ease;
        }
        .fcw-gradient-picker:hover { transform: scale(1.02); }

        /* Rainbow Hue Bar */
        #fcw-hue-picker {
            background: linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%);
        }

        /* Grayscale Bar */
        #fcw-mono-picker {
            background: linear-gradient(to right, #000000 0%, #ffffff 100%);
            margin-bottom: 15px;
        }

        .fcw-picker-thumb {
            position: absolute;
            top: 50%;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #fff;
            border: 2px solid rgba(0,0,0,0.2);
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
            transform: translate(-50%, -50%);
            pointer-events: none;
            transition: transform 0.1s ease;
        }
        .fcw-gradient-picker:active .fcw-picker-thumb {
            transform: translate(-50%, -50%) scale(1.2);
        }

        .fcw-hex-wrapper {
            display: flex;
            align-items: center;
            background: var(--fcw-input-bg);
            border-radius: 8px;
            padding: 6px 12px;
            border: 1px solid var(--fcw-border);
            margin-top: 10px;
        }
        .fcw-hex-preview {
            width: 24px;
            height: 24px;
            border-radius: 6px;
            margin-right: 10px;
            border: 1px solid rgba(255,255,255,0.2);
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .fcw-hex-input {
            background: transparent;
            border: none;
            color: #fff;
            font-family: monospace;
            font-size: 14px;
            width: 100%;
            outline: none;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        /* Select & File */
        .fcw-select {
            width: 100%;
            padding: 10px 12px;
            border-radius: 10px;
            background: var(--fcw-input-bg);
            border: 1px solid var(--fcw-border);
            color: var(--fcw-text-main);
            font-size: 13px;
            outline: none;
            cursor: pointer;
            transition: all 0.2s;
        }
        .fcw-select:hover { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.3); }
        .fcw-select option { background: #1e232d; color: white; }

        .fcw-file-input {
            width: 100%;
            font-size: 12px;
            color: var(--fcw-text-muted);
        }
        .fcw-file-input::-webkit-file-upload-button {
            background: var(--fcw-input-bg);
            border: 1px solid var(--fcw-border);
            color: #fff;
            padding: 6px 12px;
            border-radius: 8px;
            cursor: pointer;
            margin-right: 10px;
            transition: all 0.2s;
        }
        .fcw-file-input::-webkit-file-upload-button:hover {
            background: rgba(255,255,255,0.15);
        }

        .fcw-reset-btn {
            width: 100%;
            margin-top: 8px;
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.06);
            color: rgba(255,255,255,0.4);
            padding: 10px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
        }
        .fcw-reset-btn:hover { background: rgba(255,80,80,0.12); color: #ff8080; border-color: rgba(255,80,80,0.3); }

        /* --- CUSTOM FILTERS SECTION (iOS 26 Glass) --- */
        .fcw-filters-section {
            margin-top: 14px;
            padding-top: 12px;
            border-top: 1px solid rgba(255,255,255,0.06);
        }
        .fcw-section-title {
            font-size: 11px;
            font-weight: 600;
            color: rgba(255,255,255,0.4);
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 10px;
        }
        .fcw-add-filter-row {
            display: flex;
            gap: 6px;
            margin-bottom: 10px;
        }
        .fcw-filter-url-input {
            flex: 1;
            padding: 8px 10px;
            border-radius: 8px;
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.06);
            color: #fff;
            font-size: 11px;
            outline: none;
        }
        .fcw-filter-url-input::placeholder { color: rgba(255,255,255,0.3); }
        .fcw-filter-url-input:focus { border-color: var(--fcw-accent); background: rgba(255,255,255,0.08); }
        .fcw-add-filter-btn-small {
            padding: 8px 12px;
            background: var(--fcw-accent);
            border: none;
            border-radius: 8px;
            color: #fff;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }
        .fcw-add-filter-btn-small:hover { filter: brightness(1.15); }

        .fcw-filters-list {
            max-height: 180px;
            overflow-y: auto;
            border-radius: 8px;
            background: rgba(0,0,0,0.15);
            border: 1px solid rgba(255,255,255,0.04);
        }
        .fcw-filters-list:empty::after {
            content: 'No custom filters';
            display: block;
            padding: 16px;
            text-align: center;
            color: rgba(255,255,255,0.3);
            font-size: 11px;
        }
        .fcw-filter-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 10px;
            border-bottom: 1px solid rgba(255,255,255,0.03);
            cursor: grab;
            transition: background 0.15s;
        }
        .fcw-filter-item:last-child { border-bottom: none; }
        .fcw-filter-item:hover { background: rgba(255,255,255,0.04); }
        .fcw-filter-item.dragging {
            opacity: 0.5;
            background: rgba(255,255,255,0.08);
            cursor: grabbing;
        }
        .fcw-filter-item.drag-over {
            border-top: 2px solid var(--fcw-accent);
        }
        .fcw-filter-drag-handle {
            color: rgba(255,255,255,0.2);
            font-size: 12px;
            cursor: grab;
            user-select: none;
        }
        .fcw-filter-img {
            width: 24px;
            height: auto;
            border-radius: 3px;
        }
        .fcw-filter-info {
            flex: 1;
            min-width: 0;
        }
        .fcw-filter-name {
            font-size: 12px;
            font-weight: 500;
            color: rgba(255,255,255,0.85);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        /* Editable filter name input */
        .fcw-filter-name-input {
            background: transparent;
            border: none;
            border-bottom: 1px solid transparent;
            color: rgba(255,255,255,0.85);
            font-size: 12px;
            font-weight: 500;
            width: 100%;
            padding: 2px 0;
            outline: none;
            transition: border-color 0.2s;
        }
        .fcw-filter-name-input:hover { border-bottom-color: rgba(255,255,255,0.15); }
        .fcw-filter-name-input:focus { border-bottom-color: var(--fcw-accent); }
        .fcw-filter-id {
            font-size: 9px;
            color: rgba(255,255,255,0.3);
        }
        .fcw-filter-delete {
            background: none;
            border: none;
            color: rgba(255,80,80,0.4);
            font-size: 14px;
            cursor: pointer;
            padding: 4px 6px;
            border-radius: 4px;
            transition: all 0.2s;
        }
        .fcw-filter-delete:hover { color: #ff5050; background: rgba(255,80,80,0.12); }
    `;

        // --- 3. Inject CSS Immediately ---
        // We try to append to head, or fallback to documentElement if head isn't ready yet (run-at start)
        const injectStyles = () => {
            // Font
            if (settings.customFontData && settings.customFontName) {
                const fontFace = `
                @font-face {
                    font-family: '${settings.customFontName}';
                    src: url('${settings.customFontData}');
                }
            `;
                const fontStyle = document.createElement('style');
                fontStyle.id = 'fcw-nav-custom-font-style';
                fontStyle.type = 'text/css';
                fontStyle.appendChild(document.createTextNode(fontFace));
                (document.head || document.documentElement).appendChild(fontStyle);
            }

            // Main CSS
            const style = document.createElement('style');
            style.id = 'fcw-nav-sleek-style';
            style.type = 'text/css';
            style.appendChild(document.createTextNode(css));
            (document.head || document.documentElement).appendChild(style);
        };
        injectStyles();


        // --- 4. Settings UI (Waits for DOM) ---
        function initSettings() {
            // Only show gear on club pages, not on packs or other pages
            // Only show gear on SPECIFIC club visit pages as requested
            // Target: https://www.fc-watch.com/clubs/visit.php?c=...
            const href = window.location.href;
            const path = window.location.pathname;

            // STRICTLY only show on "clubs/visit.php?c=" - the EXACT pattern requested
            const isSpecificClubPage = href.includes('/clubs/visit.php?c=');

            if (!isSpecificClubPage) {
                // Not the specific target page - remove any existing gear and return
                const oldGear = document.getElementById('fcw-nav-gear-btn');
                if (oldGear) oldGear.remove();
                const oldPanel = document.getElementById('fcw-nav-settings-panel');
                if (oldPanel) oldPanel.remove();
                return;
            }

            const oldGear = document.getElementById('fcw-nav-gear-btn');
            if (oldGear) oldGear.remove();
            const oldPanel = document.getElementById('fcw-nav-settings-panel');
            if (oldPanel) oldPanel.remove();

            // Try multiple navbar selectors to show settings on all pages
            const navbarSelectors = [
                '.navbar-default',
                '.navbar-inverse',
                'nav.navbar[role="navigation"]',
                'nav.navbar',
                '.navbar'
            ];

            let navbar = null;
            for (const selector of navbarSelectors) {
                navbar = document.querySelector(selector);
                if (navbar) break;
            }

            if (!navbar) {
                // Fallback: check for pagination wrapper
                const pagination = document.querySelector('.sb-pagination-wrap');
                if (pagination) {
                    const parentNav = pagination.closest('.navbar, nav');
                    if (parentNav) {
                        navbar = parentNav;
                    }
                }
            }

            if (navbar) {
                injectGear(navbar);
            }
        }

        function injectGear(navbar) {
            // 4a. New Gear Button (Updated Icon)
            const gearBtn = document.createElement('div');
            gearBtn.id = 'fcw-nav-gear-btn';
            gearBtn.title = "Customize Navbar";

            const svgNS = "http://www.w3.org/2000/svg";
            const gearSvg = document.createElementNS(svgNS, "svg");
            gearSvg.setAttribute("viewBox", "0 0 24 24");

            const path = document.createElementNS(svgNS, "path");
            path.setAttribute("d", "M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46a.5.5 0 0 0-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65A.488.488 0 0 0 14 2h-4c-.25 0-.46.18-.5.43l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1a.488.488 0 0 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46a.5.5 0 0 0 .61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.04.24.25.43.5.43h4c.25 0 .46-.18.5-.43l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1a.488.488 0 0 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z");
            gearSvg.appendChild(path);

            gearBtn.appendChild(gearSvg);
            navbar.appendChild(gearBtn);

            // 4b. Settings Panel
            const panel = document.createElement('div');
            panel.id = 'fcw-nav-settings-panel';

            // Use extension icon if available (Chrome context)
            let logoHtml = '';
            try {
                const logoUrl = chrome.runtime.getURL('icon.png');
                logoHtml = `<img src="${logoUrl}" style="width:24px; height:24px; margin-right:10px; border-radius:4px; vertical-align:middle;">`;
            } catch (e) { }

            // Header
            const header = document.createElement('div');
            header.className = 'fcw-setting-header';
            header.style.cssText = 'display:flex; align-items:center;';

            try {
                const logoUrl = chrome.runtime.getURL('icon.png');
                const img = document.createElement('img');
                img.src = logoUrl;
                img.style.cssText = 'width:24px; height:24px; margin-right:10px; border-radius:4px; vertical-align:middle;';
                header.appendChild(img);
            } catch (e) { }

            const title = document.createElement('h4');
            title.style.margin = '0';
            title.textContent = 'Navbar Settings';
            header.appendChild(title);
            panel.appendChild(header);

            // Row Helper
            const createRow = () => {
                const div = document.createElement('div');
                div.className = 'fcw-setting-row';
                return div;
            };

            const createLabel = (text) => {
                const lb = document.createElement('label');
                lb.className = 'fcw-setting-label';
                return lb; // Text content added manually for complex labels
            };

            // Opacity
            const opRow = createRow();
            const opLabel = createLabel();
            const opSpan1 = document.createElement('span'); opSpan1.textContent = 'Opacity '; opLabel.appendChild(opSpan1);
            const opSpan2 = document.createElement('span'); opSpan2.id = 'op-val'; opSpan2.textContent = Math.round(settings.opacity * 100) + '%'; opLabel.appendChild(opSpan2);
            opRow.appendChild(opLabel);

            const opInput = document.createElement('input');
            opInput.type = 'range';
            opInput.className = 'fcw-slider';
            opInput.id = 'fcw-opacity-input';
            opInput.min = '0.3';
            opInput.max = '1';
            opInput.step = '0.05';
            opInput.value = settings.opacity;
            opRow.appendChild(opInput);
            panel.appendChild(opRow);

            // Blur
            const blRow = createRow();
            const blLabel = createLabel();
            const blSpan1 = document.createElement('span'); blSpan1.textContent = 'Blur '; blLabel.appendChild(blSpan1);
            const blSpan2 = document.createElement('span'); blSpan2.id = 'bl-val'; blSpan2.textContent = settings.blur + 'px'; blLabel.appendChild(blSpan2);
            blRow.appendChild(blLabel);

            const blInput = document.createElement('input');
            blInput.type = 'range';
            blInput.className = 'fcw-slider';
            blInput.id = 'fcw-blur-input';
            blInput.min = '0';
            blInput.max = '30';
            blInput.step = '1';
            blInput.value = settings.blur;
            blRow.appendChild(blInput);
            panel.appendChild(blRow);

            // Glass Tint Color
            const gtRow = createRow();
            const gtLabel = createLabel();
            gtLabel.textContent = 'Glass Tint';
            gtRow.appendChild(gtLabel);

            const gtWrapper = document.createElement('div');
            gtWrapper.style.cssText = 'display:flex; align-items:center; gap:8px; width:100%;';

            const gtInput = document.createElement('input');
            gtInput.type = 'color';
            gtInput.id = 'fcw-glass-tint-input';
            gtInput.value = settings.glassTint || '#000000';
            gtInput.style.cssText = 'width:40px; height:30px; border:none; border-radius:6px; cursor:pointer; background:transparent;';
            gtWrapper.appendChild(gtInput);

            const gtHexDisplay = document.createElement('span');
            gtHexDisplay.id = 'fcw-glass-tint-hex';
            gtHexDisplay.style.cssText = 'color:rgba(255,255,255,0.7); font-size:12px; font-family:monospace; min-width:70px;';
            gtHexDisplay.textContent = settings.glassTint ? settings.glassTint.toUpperCase() : 'None';
            gtWrapper.appendChild(gtHexDisplay);

            const gtClearBtn = document.createElement('button');
            gtClearBtn.textContent = 'Clear';
            gtClearBtn.style.cssText = 'padding:4px 10px; border-radius:6px; border:1px solid rgba(255,255,255,0.15); background:rgba(255,255,255,0.08); color:#fff; font-size:11px; cursor:pointer; margin-left:auto;';
            gtWrapper.appendChild(gtClearBtn);

            gtRow.appendChild(gtWrapper);
            panel.appendChild(gtRow);


            // Reset Button
            const resetBtn = document.createElement('button');
            resetBtn.className = 'fcw-reset-btn';
            resetBtn.id = 'fcw-reset-btn';
            resetBtn.textContent = 'Reset to Default';
            panel.appendChild(resetBtn);

            // --- CUSTOM CARD FILTERS SECTION ---
            const FILTER_STORAGE_KEY = 'fc_watch_custom_filters_v4';

            const filtersSection = document.createElement('div');
            filtersSection.className = 'fcw-filters-section';

            const filterTitle = document.createElement('div');
            filterTitle.className = 'fcw-section-title';
            filterTitle.textContent = 'Custom Card Filters';
            filtersSection.appendChild(filterTitle);

            // Add Filter Row
            const addRow = document.createElement('div');
            addRow.className = 'fcw-add-filter-row';

            const urlInput = document.createElement('input');
            urlInput.type = 'text';
            urlInput.className = 'fcw-filter-url-input';
            urlInput.placeholder = 'Paste card image URL...';
            addRow.appendChild(urlInput);

            const addBtn = document.createElement('button');
            addBtn.className = 'fcw-add-filter-btn-small';
            addBtn.textContent = '+ Add';
            addRow.appendChild(addBtn);
            filtersSection.appendChild(addRow);

            // Filters List
            const filtersList = document.createElement('div');
            filtersList.className = 'fcw-filters-list';
            filtersList.id = 'fcw-custom-filters-list';
            filtersSection.appendChild(filtersList);

            panel.appendChild(filtersSection);

            // --- Filter Helper Functions ---
            const getFilters = () => {
                try {
                    return JSON.parse(localStorage.getItem(FILTER_STORAGE_KEY)) || [];
                } catch (e) {
                    return [];
                }
            };

            const saveFilters = (filters) => {
                localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters));
                renderFiltersList();
                // Notify other scripts
                window.dispatchEvent(new CustomEvent('fcw-filters-updated'));
            };

            const processUrl = (url) => {
                try {
                    const filename = url.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('.'));
                    if (!filename) return null;
                    const id = filename;
                    const label = filename
                        .split(/[_-]/)
                        .map(word => {
                            if (/^(xi|xii|xiii|iv|vi|vii|viii|ix|ii|iii)$/i.test(word)) return word.toUpperCase();
                            return word.charAt(0).toUpperCase() + word.slice(1);
                        })
                        .join(' ');
                    return { id, label, imageUrl: url };
                } catch (e) {
                    return null;
                }
            };

            const addFilter = (filterInfo) => {
                const filters = getFilters();
                if (filters.some(f => f.id === filterInfo.id || f.imageUrl === filterInfo.imageUrl)) {
                    return false;
                }
                filterInfo.order = filters.length;
                filters.push(filterInfo);
                saveFilters(filters);
                return true;
            };

            const deleteFilter = (id) => {
                const filters = getFilters().filter(f => f.id !== id);
                // Reorder
                filters.forEach((f, i) => f.order = i);
                saveFilters(filters);
            };

            // --- Drag & Drop State ---
            let draggedItem = null;
            let draggedId = null;

            const renderFiltersList = () => {
                filtersList.innerHTML = '';
                const filters = getFilters().sort((a, b) => (a.order || 0) - (b.order || 0));

                filters.forEach((f, index) => {
                    const item = document.createElement('div');
                    item.className = 'fcw-filter-item';
                    item.draggable = true;
                    item.dataset.id = f.id;
                    item.dataset.index = index;

                    // Drag Handle
                    const handle = document.createElement('span');
                    handle.className = 'fcw-filter-drag-handle';
                    handle.textContent = '⋮⋮';
                    item.appendChild(handle);

                    // Image
                    const img = document.createElement('img');
                    img.className = 'fcw-filter-img';
                    img.src = f.imageUrl;
                    img.onerror = () => img.style.display = 'none';
                    item.appendChild(img);

                    // Info with editable name
                    const info = document.createElement('div');
                    info.className = 'fcw-filter-info';

                    // Editable name input
                    const nameInput = document.createElement('input');
                    nameInput.type = 'text';
                    nameInput.className = 'fcw-filter-name-input';
                    nameInput.value = f.label;
                    nameInput.title = 'Click to edit name';
                    nameInput.addEventListener('blur', () => {
                        const newLabel = nameInput.value.trim();
                        if (newLabel && newLabel !== f.label) {
                            // Update filter label in storage
                            const filters = getFilters();
                            const filterToUpdate = filters.find(x => x.id === f.id);
                            if (filterToUpdate) {
                                filterToUpdate.label = newLabel;
                                saveFilters(filters);
                            }
                        }
                    });
                    nameInput.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') nameInput.blur();
                    });
                    info.appendChild(nameInput);

                    const idSpan = document.createElement('div');
                    idSpan.className = 'fcw-filter-id';
                    idSpan.textContent = f.id;
                    info.appendChild(idSpan);
                    item.appendChild(info);

                    // Delete Button
                    const delBtn = document.createElement('button');
                    delBtn.className = 'fcw-filter-delete';
                    delBtn.textContent = '×';
                    delBtn.onclick = (e) => {
                        e.stopPropagation();
                        deleteFilter(f.id);
                    };
                    item.appendChild(delBtn);

                    // Drag Events
                    item.addEventListener('dragstart', (e) => {
                        draggedItem = item;
                        draggedId = f.id;
                        item.classList.add('dragging');
                        e.dataTransfer.effectAllowed = 'move';
                    });

                    item.addEventListener('dragend', () => {
                        item.classList.remove('dragging');
                        draggedItem = null;
                        draggedId = null;
                        // Remove all drag-over classes
                        filtersList.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
                    });

                    item.addEventListener('dragover', (e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        if (draggedItem && draggedItem !== item) {
                            item.classList.add('drag-over');
                        }
                    });

                    item.addEventListener('dragleave', () => {
                        item.classList.remove('drag-over');
                    });

                    item.addEventListener('drop', (e) => {
                        e.preventDefault();
                        item.classList.remove('drag-over');
                        if (!draggedId || draggedId === f.id) return;

                        // Reorder filters
                        const filters = getFilters();
                        const draggedFilter = filters.find(x => x.id === draggedId);
                        const targetFilter = filters.find(x => x.id === f.id);
                        if (!draggedFilter || !targetFilter) return;

                        const draggedOrder = draggedFilter.order || 0;
                        const targetOrder = targetFilter.order || 0;

                        // Shift orders
                        filters.forEach(x => {
                            if (x.id === draggedId) {
                                x.order = targetOrder;
                            } else if (draggedOrder < targetOrder) {
                                if (x.order > draggedOrder && x.order <= targetOrder) x.order--;
                            } else {
                                if (x.order >= targetOrder && x.order < draggedOrder) x.order++;
                            }
                        });

                        saveFilters(filters);
                    });

                    filtersList.appendChild(item);
                });
            };

            // Add Button Click
            addBtn.addEventListener('click', () => {
                const url = urlInput.value.trim();
                if (!url) return;

                const filterInfo = processUrl(url);
                if (!filterInfo) {
                    alert('Could not parse URL. Make sure it ends with .png or similar.');
                    return;
                }

                if (addFilter(filterInfo)) {
                    urlInput.value = '';
                } else {
                    alert('Filter already exists!');
                }
            });

            // Enter key in URL input
            urlInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    addBtn.click();
                }
            });

            // Initial Render
            renderFiltersList();

            document.body.appendChild(panel);

            // --- 5. Event Listeners ---

            // Performance: Debounce utility
            const debounce = (fn, delay) => {
                let timer;
                return (...args) => {
                    clearTimeout(timer);
                    timer = setTimeout(() => fn(...args), delay);
                };
            };

            // Performance: Cache frequently accessed elements
            const root = document.documentElement;
            // hexPreview, hexText, opVal, blVal are already in scope from creation


            const updateCSS = (save = true) => {
                root.style.setProperty('--fcw-nav-opacity', settings.opacity);
                root.style.setProperty('--fcw-nav-blur', settings.blur + 'px');
                root.style.setProperty('--fcw-accent', settings.accent);
                root.style.setProperty('--fcw-glass-tint', settings.glassTint || 'transparent');
                root.style.setProperty('--fcw-font', settings.font);

                // Update UI (using cached refs)
                opSpan2.textContent = Math.round(settings.opacity * 100) + '%';
                blSpan2.textContent = settings.blur + 'px';
                gtHexDisplay.textContent = settings.glassTint ? settings.glassTint.toUpperCase() : 'None';
                gtInput.value = settings.glassTint || '#000000';

                if (save) {
                    localStorage.setItem('fcw_navbar_settings', JSON.stringify(settings));
                    // Dispatch custom event for same-page scripts
                    window.dispatchEvent(new CustomEvent('fcw-accent-changed', { detail: { accent: settings.accent } }));
                }
            };

            // Debounced save (visual updates are immediate, storage is debounced)
            const debouncedSave = debounce(() => {
                localStorage.setItem('fcw_navbar_settings', JSON.stringify(settings));
            }, 150);

            // Toggle Panel
            gearBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const rect = gearBtn.getBoundingClientRect();
                const scrollY = window.scrollY || window.pageYOffset;
                const scrollX = window.scrollX || window.pageXOffset;

                panel.style.top = (rect.bottom + scrollY + 12) + 'px';
                panel.style.right = (document.documentElement.clientWidth - (rect.right + scrollX)) + 'px';
                panel.classList.toggle('active');
            });

            document.addEventListener('click', (e) => {
                if (!panel.contains(e.target) && !gearBtn.contains(e.target)) {
                    panel.classList.remove('active');
                }
            });

            // Opacity & Blur (debounced storage, immediate visual)
            const opacityInput = document.getElementById('fcw-opacity-input');
            const blurInput = document.getElementById('fcw-blur-input');

            opacityInput.addEventListener('input', (e) => {
                settings.opacity = e.target.value;
                root.style.setProperty('--fcw-nav-opacity', settings.opacity);
                opSpan2.textContent = Math.round(settings.opacity * 100) + '%';
                debouncedSave();
            });

            blurInput.addEventListener('input', (e) => {
                settings.blur = e.target.value;
                root.style.setProperty('--fcw-nav-blur', settings.blur + 'px');
                blSpan2.textContent = settings.blur + 'px';
                debouncedSave();
            });

            // Glass Tint Color Picker
            gtInput.addEventListener('input', (e) => {
                const hex = e.target.value;
                // Convert hex to rgba with 0.25 opacity for subtle glass tint
                const r = parseInt(hex.slice(1, 3), 16);
                const g = parseInt(hex.slice(3, 5), 16);
                const b = parseInt(hex.slice(5, 7), 16);
                settings.glassTint = `rgba(${r}, ${g}, ${b}, 0.25)`;
                root.style.setProperty('--fcw-glass-tint', settings.glassTint);
                gtHexDisplay.textContent = hex.toUpperCase();
                debouncedSave();
            });

            gtClearBtn.addEventListener('click', () => {
                settings.glassTint = '';
                root.style.setProperty('--fcw-glass-tint', 'transparent');
                gtHexDisplay.textContent = 'None';
                gtInput.value = '#000000';
                debouncedSave();
            });

            // Custom Gradient Picker Logic (Hue)
            // huePicker and hueThumb already in scope


            // Performance: Optimized drag handler with RAF and deferred saves
            const attachDrag = (picker, thumb, callback, onFinish) => {
                let isDragging = false;
                let cachedRect = null;
                let rafId = null;
                let lastPercent = 0;

                const setFromX = (x) => {
                    if (!cachedRect) cachedRect = picker.getBoundingClientRect();
                    let percent = (x - cachedRect.left) / cachedRect.width;
                    percent = Math.max(0, Math.min(1, percent));
                    lastPercent = percent;

                    // Cancel previous RAF if pending
                    if (rafId) cancelAnimationFrame(rafId);

                    // Use RAF for smooth visual updates only
                    rafId = requestAnimationFrame(() => {
                        thumb.style.left = (percent * 100) + '%';
                        callback(percent); // Visual update only
                        rafId = null;
                    });
                };

                picker.addEventListener('mousedown', (e) => {
                    isDragging = true;
                    cachedRect = picker.getBoundingClientRect();
                    setFromX(e.clientX);
                });

                document.addEventListener('mousemove', (e) => {
                    if (isDragging) setFromX(e.clientX);
                }, { passive: true });

                document.addEventListener('mouseup', () => {
                    if (isDragging) {
                        isDragging = false;
                        cachedRect = null;
                        if (rafId) {
                            cancelAnimationFrame(rafId);
                            rafId = null;
                        }
                        // Only save and dispatch events on mouseup
                        if (onFinish) onFinish(lastPercent);
                    }
                }, { passive: true });
            };



            // Listen for accent changes from other scripts (e.g., modernizer.js)
            window.addEventListener('storage', (e) => {
                if (e.key === 'fcw_navbar_settings') {
                    try {
                        const newSettings = JSON.parse(e.newValue);
                        if (newSettings && newSettings.accent && newSettings.accent !== settings.accent) {
                            settings.accent = newSettings.accent;
                            root.style.setProperty('--fcw-accent', settings.accent);
                        }
                    } catch (err) { }
                }
            });

            // Also listen for same-page custom events
            window.addEventListener('fcw-accent-changed', (e) => {
                if (e.detail && e.detail.accent && e.detail.accent !== settings.accent) {
                    settings.accent = e.detail.accent;
                    root.style.setProperty('--fcw-accent', settings.accent);
                }
            });

            // Fonts
            // fontSelect is already in scope

            // Fonts settings removed/not present in this version, avoiding ReferenceError
            // If font settings are needed, they should be re-implemented fully.

            resetBtn.addEventListener('click', () => {
                const oldFontName = settings.customFontName;
                settings = { ...defaultSettings };

                if (oldFontName) {
                    const fontStyle = document.getElementById('fcw-nav-custom-font-style');
                    if (fontStyle) fontStyle.textContent = '';
                }

                opInput.value = settings.opacity;
                blInput.value = settings.blur;
                gtInput.value = '#000000';
                gtHexDisplay.textContent = 'None';

                updateCSS();
            });
        }

        // --- 6. Initialize UI when DOM is ready ---
        if (document.readyState === 'interactive' || document.readyState === 'complete') {
            initSettings();
        } else {
            initSettings();
        }

        // --- SMARTMENUS SPEED OVERRIDE (CSP SAFE) ---
        // Top navbar uses jQuery SmartMenus, initialized by the main site context.
        // We inject a script file to modify its defaults so dropdowns are snappy.
        // Using a file from web_accessible_resources bypasses the strict CSP against inline scripts.
        const injectSmartMenusOverride = () => {
            const script = document.createElement('script');
            script.src = chrome.runtime.getURL('scripts/inject_sm.js');
            script.onload = () => script.remove(); // Clean up after execution
            (document.head || document.documentElement).appendChild(script);
        };
        injectSmartMenusOverride();

        // --- SMARTMENUS SCROLL INTERCEPTOR BYPASS ---
        // SmartMenus heavily overrides 'mousewheel' and 'DOMMouseScroll' events on all ULs.
        // To allow native scrolling on huge leaf nodes, we must stop event propagation entirely.
        const unblockScroll = () => {
            const dailyRewardList = document.getElementById('group-daily-reward-pack-sub');
            if (dailyRewardList && !dailyRewardList.dataset.scrollUnblocked) {
                dailyRewardList.dataset.scrollUnblocked = 'true';
                // Capture phase is CRITICAL to beat SmartMenus which binds to the document/parent
                const stopProp = (e) => { e.stopPropagation(); };
                dailyRewardList.addEventListener('wheel', stopProp, { capture: true, passive: true });
                dailyRewardList.addEventListener('mousewheel', stopProp, { capture: true, passive: true });
                dailyRewardList.addEventListener('DOMMouseScroll', stopProp, { capture: true, passive: true });
                dailyRewardList.addEventListener('touchmove', stopProp, { capture: true, passive: true });
            }
        };

        // Actively watch for the menu to be injected by the site
        const menuObserver = new MutationObserver(() => unblockScroll());
        menuObserver.observe(document.body || document.documentElement, { childList: true, subtree: true });
        unblockScroll(); // Try immediately

        // --- 7. Watch for URL changes (SPA support) ---
        let lastUrl = window.location.href;

        const startObserver = () => {
            // Ultra-robust: ensure body exists before observing
            const targetNode = document.body || document.documentElement;
            if (!targetNode) {
                // Extreme fallback: retry after a short delay
                setTimeout(startObserver, 100);
                return;
            }
            try {
                const observer = new MutationObserver(() => {
                    const currentUrl = window.location.href;
                    if (currentUrl !== lastUrl) {
                        lastUrl = currentUrl;
                        initSettings();
                    }
                });
                observer.observe(targetNode, { childList: true, subtree: true });
            } catch (e) {
                // Silently fail if observe still fails
                console.warn('[FCW Navbar] MutationObserver failed:', e.message);
            }
        };

        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', startObserver);
        } else {
            startObserver();
        }

        // === NAVBAR Z-INDEX FIX (Dynamic Interactive Strategy) ===
        // Problem: 
        // - Top Navbar (inverse) has dropdowns that open DOWN (needs to be ON TOP of filter bar)
        // - Filter Bar (default) has dropdowns that open UP (needs to be ON TOP of top navbar)
        // Solution:
        // - Default state: Top Navbar has higher Z-Index (1001) than Filter Bar (1000)
        // - Interaction: When mouse enters a navbar, it gets promoted to Highest Z-Index (2000000)
        // - This ensures the active navbar always overlaps the inactive one
        function setupNavbarZIndexFix() {
            const TOP_NAV_Z = '1060';
            const BOTTOM_NAV_Z = '1050';
            const ACTIVE_Z = '2000000';

            const navbarInverse = document.querySelectorAll('nav.navbar.navbar-inverse, nav.navbar-inverse');
            const navbarDefault = document.querySelectorAll('.navbar-default');

            // Helper to set z-index with priority
            const setZ = (elements, zIndex) => {
                elements.forEach(el => {
                    el.style.setProperty('z-index', zIndex, 'important');
                    el.style.position = 'relative';
                    // Always ensure overflow is visible
                    el.style.overflow = 'visible';
                });
            };

            // 1. Initial State: Top > Bottom
            setZ(navbarInverse, TOP_NAV_Z);
            setZ(navbarDefault, BOTTOM_NAV_Z);

            // 2. Add Event Listeners for Dynamic Switching
            const attachDynamicZ = (elements, isTopNav) => {
                elements.forEach(nav => {
                    nav.onmouseenter = () => {
                        // When entering ANY navbar, promote it to ACTIVE_Z
                        setZ([nav], ACTIVE_Z);

                        // Demote others to their base levels immediately
                        if (isTopNav) {
                            setZ(navbarDefault, BOTTOM_NAV_Z);
                        } else {
                            setZ(navbarInverse, TOP_NAV_Z);
                        }
                    };

                    nav.onmouseleave = () => {
                        // Reset IMMEDIATELY - no delay to prevent the split-second glitch
                        // The mouseenter on the OTHER navbar will re-promote it anyway
                        if (isTopNav) {
                            setZ([nav], TOP_NAV_Z);
                        } else {
                            setZ([nav], BOTTOM_NAV_Z);
                        }
                    };
                });
            };

            attachDynamicZ(navbarInverse, true);
            attachDynamicZ(navbarDefault, false);

            // 3. Ensure all dropdown menus have maximum z-index relative to their parent
            const dropdowns = document.querySelectorAll('.dropdown-menu, .sm-nowrap, ul[id^="sm-"]');
            dropdowns.forEach(dd => {
                dd.style.zIndex = '2147483647';
            });

            // 4. Ensure containers allow overflow (critical for nested items)
            document.querySelectorAll('.container-fluid, .navbar-collapse, .navbar-header').forEach(el => {
                el.style.overflow = 'visible';
            });

            console.log('[FCW Navbar] Dynamic Z-Index fix applied');
        }

        // Run Z-Index fix on load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupNavbarZIndexFix);
        } else {
            setupNavbarZIndexFix();
        }

        // Also check periodically just in case
        setInterval(() => {
            const currentUrl = window.location.href;
            if (currentUrl !== lastUrl) {
                lastUrl = currentUrl;
                initSettings();
                setupNavbarZIndexFix(); // Run on URL change
            }
        }, 1000);
    } // End initNavbar
})();

    // === GYRO_INSPECT.JS ===
// === FCWatch Overhaul — Mobile Gyroscope & Touch Interaction ===
// Replaces PC mouse hover effects with device orientation and touch-drag mechanics.

(function initGyroInspect() {
    'use strict';

    const isMobileDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (!isMobileDevice) return;

    let modal, stage, container, wrapper;
    let gyroActive = false;
    let gyroPermissionGranted = false;
    let gyroRafId = null;
    let baseBeta = null;
    let baseGamma = null;

    let smoothRotateX = 0;
    let smoothRotateY = 0;
    const GYRO_LERP = 0.12;
    const GYRO_MAX_ROTATION = 15;
    const GYRO_SENSITIVITY = 0.6;

    // Find modal elements
    function fetchElements() {
        modal = document.querySelector('.fcw-modal');
        if (!modal) return false;
        stage = modal.querySelector('.fcw-modal-stage');
        container = modal.querySelector('.fcw-perspective-container');
        wrapper = modal.querySelector('.fcw-card-wrapper');
        return stage && container && wrapper;
    }

    function handleDeviceOrientation(event) {
        if (!modal || !modal.classList.contains('active')) return;

        // Find them if lost
        if (!container || !wrapper) fetchElements();

        let currentBeta = event.beta || 0;
        let currentGamma = event.gamma || 0;

        if (baseBeta === null) {
            baseBeta = currentBeta;
            baseGamma = currentGamma;
        }

        if (gyroRafId) return;
        gyroRafId = requestAnimationFrame(() => {
            let deltaBeta = (currentBeta - baseBeta) * GYRO_SENSITIVITY;
            let deltaGamma = (currentGamma - baseGamma) * GYRO_SENSITIVITY;

            let targetRotateX = Math.max(-GYRO_MAX_ROTATION, Math.min(GYRO_MAX_ROTATION, -deltaBeta));
            let targetRotateY = Math.max(-GYRO_MAX_ROTATION, Math.min(GYRO_MAX_ROTATION, deltaGamma));

            smoothRotateX += (targetRotateX - smoothRotateX) * GYRO_LERP;
            smoothRotateY += (targetRotateY - smoothRotateY) * GYRO_LERP;

            if (container) {
                container.style.transform = 'rotateX(' + smoothRotateX.toFixed(2) + 'deg) rotateY(' + smoothRotateY.toFixed(2) + 'deg)';
            }

            if (wrapper) {
                let sparkleField = wrapper.querySelector('.fcw-scintillation-field');
                if (sparkleField) {
                    let danceFactorX = (smoothRotateY / GYRO_MAX_ROTATION) * -20;
                    let danceFactorY = (smoothRotateX / GYRO_MAX_ROTATION) * -20;
                    sparkleField.style.transform = 'translateZ(85px) translateX(' + danceFactorX.toFixed(1) + 'px) translateY(' + danceFactorY.toFixed(1) + 'px)';
                }

                let card = wrapper.querySelector('.fcw-cloned-card');
                if (card) {
                    let beamX = 50 + (smoothRotateY / GYRO_MAX_ROTATION) * 50;
                    let beamY = 50 + (smoothRotateX / GYRO_MAX_ROTATION) * 50;
                    let angle = Math.atan2(smoothRotateX, smoothRotateY) * (180 / Math.PI) + 180;
                    card.style.setProperty('--beam-x', beamX.toFixed(1) + '%');
                    card.style.setProperty('--beam-y', beamY.toFixed(1) + '%');
                    card.style.setProperty('--streak-angle', (angle + 90).toFixed(1) + 'deg');
                }
            }
            gyroRafId = null;
        });
    }

    function requestGyroPermission() {
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
                .then(state => {
                    if (state === 'granted') {
                        gyroPermissionGranted = true;
                        startGyro();
                    }
                })
                .catch(err => console.warn('[FCW Gyro] Error requests permission:', err));
        } else if ('DeviceOrientationEvent' in window) {
            gyroPermissionGranted = true;
            startGyro();
        }
    }

    function startGyro() {
        if (gyroActive) return;
        gyroActive = true;
        baseBeta = null;
        baseGamma = null;
        smoothRotateX = 0;
        smoothRotateY = 0;
        window.addEventListener('deviceorientation', handleDeviceOrientation, { passive: true });
    }

    function stopGyro() {
        if (!gyroActive) return;
        gyroActive = false;
        window.removeEventListener('deviceorientation', handleDeviceOrientation);
        if (container) container.style.transform = 'rotateX(0deg) rotateY(0deg)';
    }

    // Touch Fallback
    let touchStartX = 0, touchStartY = 0;

    function attachTouchEvents() {
        if (!stage) return;

        stage.addEventListener('touchstart', (e) => {
            if (!modal.classList.contains('active')) return;
            if (!gyroPermissionGranted && !gyroActive) {
                requestGyroPermission();
            }
            if (e.touches.length === 1) {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
            }
        }, { passive: true });

        stage.addEventListener('touchmove', (e) => {
            if (!modal.classList.contains('active') || gyroActive) return;
            if (e.touches.length === 1 && container && wrapper) {
                let rect = stage.getBoundingClientRect();
                let dx = e.touches[0].clientX - touchStartX;
                let dy = e.touches[0].clientY - touchStartY;

                let touchRotateY = Math.max(-12, Math.min(12, (dx / rect.width) * 24));
                let touchRotateX = Math.max(-12, Math.min(12, (dy / rect.height) * -24));

                container.style.transform = 'rotateX(' + touchRotateX.toFixed(2) + 'deg) rotateY(' + touchRotateY.toFixed(2) + 'deg)';

                let card = wrapper.querySelector('.fcw-cloned-card');
                if (card) {
                    let beamX = 50 + (touchRotateY / 12) * 50;
                    let beamY = 50 + (touchRotateX / 12) * 50;
                    card.style.setProperty('--beam-x', beamX + '%');
                    card.style.setProperty('--beam-y', beamY + '%');
                }
            }
        }, { passive: true });

        stage.addEventListener('touchend', () => {
            if (!gyroActive && container) {
                container.style.transition = 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)';
                container.style.transform = 'rotateX(0deg) rotateY(0deg)';
                setTimeout(() => { if (container) container.style.transition = ''; }, 400);
            }
        }, { passive: true });
    }

    // Setup Observer
    function setupObserver() {
        if (!fetchElements()) {
            setTimeout(setupObserver, 500);
            return;
        }

        attachTouchEvents();

        const gyroObserver = new MutationObserver((mutations) => {
            mutations.forEach((m) => {
                if (m.attributeName === 'class') {
                    if (modal.classList.contains('active')) {
                        if (gyroPermissionGranted) startGyro();

                        if (!document.getElementById('fcw-gyro-hint')) {
                            const hint = document.createElement('div');
                            hint.id = 'fcw-gyro-hint';
                            hint.innerHTML = '📱 Tilt your phone to inspect the card';
                            hint.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%) translateY(10px);background:rgba(0,0,0,0.85);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);color:#fff;padding:10px 20px;border-radius:20px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:13px;font-weight:500;z-index:1000001;opacity:0;transition:all 0.4s ease;border:1px solid rgba(255,255,255,0.1);';
                            modal.appendChild(hint);
                            requestAnimationFrame(() => {
                                hint.style.opacity = '1';
                                hint.style.transform = 'translateX(-50%) translateY(0)';
                            });
                            setTimeout(() => {
                                hint.style.opacity = '0';
                                hint.style.transform = 'translateX(-50%) translateY(10px)';
                                setTimeout(() => hint.remove(), 500);
                            }, 3500);
                        }
                    } else {
                        stopGyro();
                    }
                }
            });
        });

        gyroObserver.observe(modal, { attributes: true, attributeFilter: ['class'] });
        console.log('[FCW Mobile] Gyroscope Inspection Module Ready.');
    }

    setupObserver();
})();


    console.log('[FCW Boot] All modules initialized.');
};

// Start up immediately
if (typeof window.__fcwBoot === 'function') window.__fcwBoot();

    (function() {
        if (!document.getElementById('fcw-ios-toast')) {
            var t = document.createElement('div');
            t.id = 'fcw-ios-toast';
            t.innerHTML = '✨ FCW Mobile v6 Enabled';
            t.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%) translateY(-40px);background:rgba(20,20,30,0.95);backdrop-filter:blur(15px);-webkit-backdrop-filter:blur(15px);color:#fff;padding:14px 28px;border-radius:30px;font-family:-apple-system,sans-serif;font-size:15px;font-weight:600;z-index:9999999;opacity:0;transition:all 0.5s cubic-bezier(0.2,0.8,0.2,1);border:1px solid rgba(255,255,255,0.15);box-shadow:0 10px 30px rgba(0,0,0,0.5);pointer-events:none;';
            document.body.appendChild(t);
            requestAnimationFrame(() => {
                t.style.opacity = '1';
                t.style.transform = 'translateX(-50%) translateY(0)';
            });
            setTimeout(() => {
                t.style.opacity = '0';
                t.style.transform = 'translateX(-50%) translateY(-40px)';
                setTimeout(() => t.remove(), 500);
            }, 3500);
        }
    })();
