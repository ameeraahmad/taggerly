// Language Dictionary
var translations = {
    en: enTranslations,
    ar: arTranslations
};
// Make translations globally accessible from any HTML inline script or other JS file
window.translations = translations;

// ─── Dev Hot Reload (localhost only) ───
// Listens for translation file changes from the server and auto-reloads the page.
(function () {
    const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    if (!isLocal) return;
    try {
        const evtSource = new EventSource('/dev-reload');
        evtSource.onmessage = (e) => {
            if (e.data === 'reload') {
                console.log('🔄 Translation file changed — reloading...');
                window.location.reload();
            }
        };
        evtSource.onerror = () => evtSource.close(); // silently close on error
    } catch (err) { /* SSE not supported */ }
})();

// ─── Global Translation Helpers (defined early so loadGlobalHeader can use them) ───

// Re-applies translations to all [data-translate] elements in the current DOM.
// Call this after injecting dynamic HTML to translate newly added elements.
// Centralized translation access that always uses latest global dictionaries
const getTranslations = () => ({
    en: typeof enTranslations !== 'undefined' ? enTranslations : {},
    ar: typeof arTranslations !== 'undefined' ? arTranslations : {}
});

window.translatePage = translatePage;
function translatePage() {
    const lang = window.currentLang || localStorage.getItem('lang') || 'en';
    const dicts = getTranslations();
    if (!dicts[lang]) {
        console.warn(`Translation dictionary for "${lang}" not found.`);
        return;
    }

    document.querySelectorAll('[data-translate]').forEach(el => {
        const key = el.getAttribute('data-translate');
        const value = dicts[lang][key] || dicts['en'][key];
        
        if (!value) {
            console.debug(`No translation found for key: "${key}" in language: "${lang}"`);
            return;
        }

        if ((el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && el.getAttribute('placeholder')) {
            el.setAttribute('placeholder', value);
        } else {
            if (el.id === 'user-btn-text' && localStorage.getItem('token')) {
                const user = JSON.parse(localStorage.getItem('user'));
                el.textContent = user ? user.name : value;
            } else {
                el.innerHTML = value;
            }
        }
    });
}

// Applies a language: sets dir/lang attributes, updates the toggle button, saves preference, translates the page.
// Applies a language: sets dir/lang attributes, updates the toggle button, saves preference, translates the page.
window.updateLanguage = updateLanguage;
function updateLanguage(lang) {
    const htmlEl = document.documentElement;
    const langBtn = document.getElementById('lang-toggle');
    if (lang === 'ar') {
        htmlEl.setAttribute('dir', 'rtl');
        htmlEl.setAttribute('lang', 'ar');
        if (langBtn) langBtn.textContent = 'English';
    } else {
        htmlEl.setAttribute('dir', 'ltr');
        htmlEl.setAttribute('lang', 'en');
        if (langBtn) langBtn.textContent = 'عربي';
    }
    localStorage.setItem('lang', lang);
    window.currentLang = lang;
    translatePage();
    if (window.updateDynamicContent) {
        window.updateDynamicContent(window.selectedCountry || localStorage.getItem('selectedCountry') || 'uae', lang);
    }
    // Notify other components that language has changed
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
}

// Global helper to format ad locations consistently across the site
window.formatAdLocation = function (city, country, cityClass = 'city-label') {
    const lang = window.currentLang || 'en';
    const adCityStr = (city || "").trim();
    const cityTranslated = (translations[lang] && translations[lang][adCityStr.toLowerCase()]) || adCityStr;

    const adCountryKey = country || null;
    const adCountryTranslated = adCountryKey
        ? ((translations[lang] && translations[lang][adCountryKey]) || adCountryKey.toUpperCase())
        : null;

    const locationParts = [];
    if (cityTranslated) locationParts.push(`<span class="${cityClass}">${cityTranslated}</span>`);
    if (adCountryTranslated) locationParts.push(`<span class="country-label" data-translate="${adCountryKey}">${adCountryTranslated}</span>`);

    return locationParts.length > 0
        ? locationParts.join('<span class="text-gray-400">,&nbsp;</span>')
        : '';
};

// Global helper to get current currency symbol
window.getCurrencySymbol = function () {
    const country = localStorage.getItem('selectedCountry') || 'uae';
    const lang = window.currentLang || 'en';
    const currencyKey = `currency_${country}`;
    return (translations[lang] && translations[lang][currencyKey]) || 'AED';
};

window.updateCurrencyLabels = function () {
    const symbol = window.getCurrencySymbol();
    document.querySelectorAll('.currency-label').forEach(el => el.textContent = symbol);
};

// --- Custom Global Modals (Alert/Confirm) ---
window.customConfirm = function (message) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center opacity-0 transition-opacity duration-300 backdrop-blur-sm';

        const modal = document.createElement('div');
        modal.className = 'bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 transform scale-95 transition-transform duration-300 flex flex-col items-center text-center border dark:border-gray-700 relative';

        const closeBtn = document.createElement('button');
        closeBtn.className = 'absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors';
        closeBtn.innerHTML = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>';
        modal.appendChild(closeBtn);

        const icon = document.createElement('div');
        icon.className = 'w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-4 text-accent shadow-inner';
        icon.innerHTML = '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';

        const text = document.createElement('p');
        text.className = 'text-gray-800 dark:text-gray-200 font-bold mb-6 leading-relaxed';
        text.textContent = message;

        const btnContainer = document.createElement('div');
        btnContainer.className = 'flex justify-center w-full gap-3';

        const lang = window.currentLang || 'en';
        const okText = window.translations?.[lang]?.confirm || 'Confirm';
        const cancelText = window.translations?.[lang]?.cancel || 'Cancel';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl font-bold transition';
        cancelBtn.textContent = cancelText;

        const okBtn = document.createElement('button');
        okBtn.className = 'flex-1 py-2.5 px-4 bg-accent hover:bg-orange-600 text-white rounded-xl font-bold transition shadow-lg shadow-orange-500/30';
        okBtn.textContent = okText;

        btnContainer.appendChild(cancelBtn);
        btnContainer.appendChild(okBtn);

        modal.appendChild(icon);
        modal.appendChild(text);
        modal.appendChild(btnContainer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        requestAnimationFrame(() => {
            overlay.classList.remove('opacity-0');
            modal.classList.remove('scale-95');
        });

        const close = (result) => {
            overlay.classList.add('opacity-0');
            modal.classList.add('scale-95');
            setTimeout(() => {
                document.body.removeChild(overlay);
                resolve(result);
            }, 300);
        };

        cancelBtn.onclick = () => close(false);
        okBtn.onclick = () => close(true);
        closeBtn.onclick = () => close(false);
    });
};

window.customAlert = function (message) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center opacity-0 transition-opacity duration-300 backdrop-blur-sm';

        const modal = document.createElement('div');
        modal.className = 'bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 transform scale-95 transition-transform duration-300 flex flex-col items-center text-center border dark:border-gray-700 relative';

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'absolute top-5 right-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors z-10';
        closeBtn.innerHTML = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>';
        modal.appendChild(closeBtn);

        const icon = document.createElement('div');
        icon.className = 'w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4 text-blue-500 shadow-inner';
        icon.innerHTML = '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';

        const text = document.createElement('p');
        text.className = 'text-gray-800 dark:text-gray-200 font-bold mb-6 break-words w-full leading-relaxed';
        text.textContent = message;

        const lang = window.currentLang || 'en';
        const okText = window.translations?.[lang]?.done || 'OK';

        const okBtn = document.createElement('button');
        okBtn.className = 'w-full py-2.5 px-4 bg-primary hover:bg-blue-900 text-white rounded-xl font-bold transition shadow-lg shadow-blue-900/20';
        okBtn.textContent = okText;

        modal.appendChild(icon);
        modal.appendChild(text);
        modal.appendChild(okBtn);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        requestAnimationFrame(() => {
            overlay.classList.remove('opacity-0');
            modal.classList.remove('scale-95');
        });

        const close = () => {
            overlay.classList.add('opacity-0');
            modal.classList.add('scale-95');
            setTimeout(() => {
                document.body.removeChild(overlay);
                resolve();
            }, 300);
        };

        okBtn.onclick = close;
        closeBtn.onclick = close;
    });
};

// ─── Universal Modal Close ───
// Closes any currently open modal (elements whose ID ends with "-modal" or "Modal")
window.closeModal = function () {
    document.querySelectorAll('[id$="-modal"], [id$="Modal"]').forEach(el => {
        if (!el.classList.contains('hidden')) {
            el.classList.add('hidden');
            el.classList.remove('flex');
        }
    });
};

document.addEventListener('DOMContentLoaded', async () => {
    // --- Initialize Global State from LocalStorage IMMEDIATELY ---
    window.selectedCountry = localStorage.getItem('selectedCountry') || 'uae';
    window.currentLang = localStorage.getItem('lang') || 'en';

    // 1. First Load Global Header/Footer if placeholders exist
    await loadGlobalHeader();
    await loadGlobalFooter();
    await loadUserFavorites();

    // 2. Update all currency labels for the current country
    if (window.updateCurrencyLabels) window.updateCurrencyLabels();
    else if (typeof getCurrencySymbol === 'function') {
        const symbol = getCurrencySymbol();
        document.querySelectorAll('.currency-label').forEach(el => el.textContent = symbol);
    }

    const htmlToUpdate = document.documentElement;

    // --- Dynamic Search Logic (Update selector to work with re-loaded items) ---
    const initSearch = () => {
        const searchInputs = document.querySelectorAll('.search-input');
        searchInputs.forEach(input => {
            const btn = input.nextElementSibling;
            const handleSearch = () => {
                const query = input.value.trim();
                if (query) {
                    window.location.href = `search.html?search=${encodeURIComponent(query)}`;
                }
            };
            input.removeEventListener('keypress', handleKeyPress); // Prevent double attach
            input.addEventListener('keypress', handleKeyPress);

            if (btn && (btn.tagName === 'BUTTON' || btn.querySelector('svg'))) {
                btn.onclick = (e) => {
                    e.preventDefault();
                    handleSearch();
                };
            }
        });
    };

    function handleKeyPress(e) {
        if (e.key === 'Enter') {
            const query = e.target.value.trim();
            if (query) window.location.href = `search.html?search=${encodeURIComponent(query)}`;
        }
    }

    initSearch();

    // --- Email Verification Check ---
    const urlParams = new URLSearchParams(window.location.search);
    const verifiedStatus = urlParams.get('verified');
    if (verifiedStatus === 'success') {
        const lang = window.currentLang || 'en';
        await customAlert(translations[lang].emailVerified || 'Email verified successfully!');
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            user.isEmailVerified = true;
            localStorage.setItem('user', JSON.stringify(user));
            if (window.updateAuthState) window.updateAuthState();
        }
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
    } else if (verifiedStatus === 'error') {
        const lang = window.currentLang || 'en';
        await customAlert(translations[lang].invalidToken || 'Invalid or expired verification link');
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // --- Country & Currency Dropdown Logic ---
    const countryOptions = document.querySelectorAll('.country-option');
    const currentCountryFlag = document.getElementById('current-country-flag');
    const currentCountryName = document.getElementById('current-country-name');
    // Already handled at the top

    // --- Socket.io Global Initialization & Notifications ---
    window.initGlobalSocket = function() {
        if (typeof io === 'undefined') return;
        if (window.socket) return window.socket;

        window.socket = io();
        const user = JSON.parse(localStorage.getItem('user'));
        const token = localStorage.getItem('token');
        
        if (user && user.id && token) {
            window.socket.emit('join_user', user.id);
        }

        window.socket.on('new_message_notification', (msg) => {
            // Refresh badges
            if (window.refreshUnreadCount) window.refreshUnreadCount();
            playNotificationSound();
            const isMessagesPage = window.location.pathname.includes('messages.html');
            const isInActiveConvo = isMessagesPage && (typeof currentConversationId !== 'undefined') && (window.currentConversationId == msg.conversationId);
            if (!isInActiveConvo) showNotificationToast(msg);
        });

        window.socket.on('user_status_change', (data) => {
            const statusDots = document.querySelectorAll(`[data-user-status-id="${data.userId}"]`);
            statusDots.forEach(dot => {
                if (data.isOnline) {
                    dot.classList.add('bg-green-500');
                    dot.classList.remove('bg-gray-400');
                } else {
                    dot.classList.add('bg-gray-400');
                    dot.classList.remove('bg-green-500');
                }
            });
        });

        return window.socket;
    };

    // Auto-init if logged in, otherwise it will init when chat widget opens
    if (localStorage.getItem('token')) {
        window.initGlobalSocket();
    }

    // --- Global Logout Handler ---
    document.addEventListener('click', (e) => {
        const logoutSelector = '#logout-btn, #logout-btn-header, #logout-btn-sidebar, #mobile-logout-btn, .logout-action-btn, [data-translate="logout"]';
        const btn = e.target.closest(logoutSelector);

        if (btn) {
            e.preventDefault();
            if (window.apiClient) {
                window.apiClient.logout();
            } else {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'login.html';
            }
        }
    });

    function playNotificationSound() {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
        audio.volume = 0.5;
        audio.play().catch(err => console.warn('Sound play blocked by browser:', err));
    }

    function showNotificationToast(data) {
        const existingToasts = document.querySelectorAll('.notification-toast');
        existingToasts.forEach(t => t.remove());

        const toast = document.createElement('div');
        toast.className = 'notification-toast fixed bottom-4 right-4 bg-white dark:bg-gray-800 border dark:border-gray-700 text-gray-900 dark:text-gray-100 p-4 rounded-2xl shadow-2xl z-[100] flex items-center gap-4 animate-slide-up max-w-sm cursor-pointer border-l-4 border-l-accent rtl:border-l-0 rtl:border-r-4 rtl:border-r-accent';

        const lang = window.currentLang || 'en';
        let title = data.title || (data.type === 'message' ? (translations[lang]?.newMessage || 'New Message') : (translations[lang]?.notification || 'Notification'));
        let message = data.message || '';
        let link = data.link || (data.conversationId ? `messages.html?conversationId=${data.conversationId}` : null);

        let icon = data.type === 'message' ?
            `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>` :
            `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>`;

        toast.innerHTML = `
            <div class="w-10 h-10 bg-accent rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
                ${icon}
            </div>
            <div class="flex-grow overflow-hidden">
                <p class="text-xs text-accent font-bold uppercase tracking-tight">${title}</p>
                <p class="text-sm font-medium truncate">${message}</p>
            </div>
            <button class="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1">&times;</button>
        `;

        toast.onclick = () => {
            if (link) {
                // If it's a platform notification (has id), mark as read first
                if (data.id) {
                    apiClient.fetch(`/notifications/${data.id}/read`, { method: 'PUT' }).finally(() => {
                        window.location.href = link;
                    });
                } else {
                    window.location.href = link;
                }
            }
        };

        toast.querySelector('button').onclick = (e) => {
            e.stopPropagation();
            toast.remove();
        };

        document.body.appendChild(toast);

        // Auto remove after 6 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.add('opacity-0', 'translate-y-4');
                toast.style.transition = 'all 0.5s ease-out';
                setTimeout(() => toast.remove(), 500);
            }
        }, 6000);
    }


// --- Global helper to update dynamic content across the site ---
// --- Global helper to update dynamic content across the site ---
window.updateDynamicContent = updateDynamicContent;
function updateDynamicContent(country, lang = window.currentLang || 'en') {
    if (!translations[lang]) return;

    console.log(`🌐 Updating dynamic content for: ${country} [${lang}]`);
    const countryName = translations[lang][country] || translations['en'][country] || country;

    const countryCities = {
        uae: ['dubai', 'abuDhabi', 'sharjah', 'ajman', 'umAlQuwain', 'rasAlKhaimah', 'fujairah', 'alAin'],
        egypt: ['cairo', 'alexandria', 'giza', 'sharm', 'hurghada', 'dahab', 'suez', 'portSaid', 'luxor', 'aswan', 'mansoura', 'tanta', 'dakahlia', 'gharbia', 'monufia', 'sharqia', 'kafrElSheikh', 'damietta', 'matrouh', 'beheira', 'ismailia', 'beniSuef', 'faiyum', 'minya', 'asyut', 'sohag', 'qena', 'redSea', 'newValley', 'qalyubia', 'northSinai', 'southSinai'],
        ksa: ['riyadh', 'jeddah', 'dammam', 'mecca', 'medina', 'khobar', 'abha', 'tabuk', 'buraydah'],
        qatar: ['doha', 'wakrah', 'rayyan', 'khor', 'shamal']
    };

    // --- 1. Update Currencies ---
    const currencyLabels = document.querySelectorAll('.currency-label');
    const currencyKey = `currency_${country}`;
    const currencyText = translations[lang][currencyKey] || translations['en'][currencyKey] || "AED";
    currencyLabels.forEach(el => el.textContent = currencyText);

    // Update Price Label in search filters if exists
    const priceLabel = document.querySelector('[data-translate="priceLabel"]');
    if (priceLabel) {
        priceLabel.textContent = `${translations[lang].priceLabel?.split('(')[0] || 'Price'} (${currencyText})`;
    }

    // --- 2. Update Country Labels ---
    const countryLabels = document.querySelectorAll('.country-label');
    countryLabels.forEach(el => el.textContent = countryName);

    // --- 3. Update Dynamic Location Dropdowns ---
    const currentCountryNameEl = document.getElementById('current-country-name');
    if (currentCountryNameEl) {
        currentCountryNameEl.textContent = countryName;
        currentCountryNameEl.setAttribute('data-translate', country);
    }

    // --- 5. Update Footer & Community Labels ---
    const footerTemplate = translations[lang].footerText || translations['en'].footerText;
    if (footerTemplate) {
        const footerTextElements = document.querySelectorAll('[data-translate="footerText"]');
        footerTextElements.forEach(el => {
            el.textContent = footerTemplate.replace('UAE', countryName).replace('الإمارات', countryName);
        });
    }

    const allUAELabels = document.querySelectorAll('[data-translate="allUAE"]');
    allUAELabels.forEach(el => {
        const prefix = lang === 'ar' ? 'كل ' : 'All ';
        el.textContent = prefix + countryName;
    });

    // --- 6. Update Dynamic Location Dropdowns ---
    const dynamicDropdowns = document.querySelectorAll('[data-dynamic-location="true"]');
    dynamicDropdowns.forEach(dropdown => {
        const cities = countryCities[country] || countryCities['uae'];
        const includeAll = dropdown.getAttribute('data-include-all') === 'true';
        
        const currentValue = dropdown.value;
        dropdown.innerHTML = '';
        if (includeAll) {
            const allKey = `all_${country}`;
            const allOpt = document.createElement('option');
            allOpt.value = allKey;
            allOpt.textContent = translations[lang][allKey] || translations['en'][allKey] || (lang === 'ar' ? 'كل ' : 'All ') + countryName;
            allOpt.setAttribute('data-translate', allKey);
            dropdown.appendChild(allOpt);
        }
        cities.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c;
            opt.textContent = translations[lang][c] || translations['en'][c] || c;
            opt.setAttribute('data-translate', c);
            dropdown.appendChild(opt);
        });
        if (currentValue) dropdown.value = currentValue;
    });

    // --- 7. Re-populate Ads for the new country ---
    const adsContainer = document.querySelector('.featured-ads .grid');
    const allSliders = document.querySelectorAll('.flex.overflow-x-auto[id*="slider"]');

    if (adsContainer) {
        adsContainer.innerHTML = '<div class="col-span-full flex justify-center py-10"><div class="animate-spin rounded-full h-10 w-10 border-b-2 border-accent"></div></div>';
        if (window.populateAdsGrid) window.populateAdsGrid(adsContainer, country);
    }

    allSliders.forEach(slider => {
        slider.innerHTML = '<div class="p-10 text-center w-full flex justify-center items-center"><div class="animate-spin inline-block rounded-full h-8 w-8 border-b-2 border-accent"></div></div>';
    });
    if (window.loadCategorySliders) window.loadCategorySliders(country);

    translatePage();
}

    window.detectLocation = function () {
        const btn = document.getElementById('detect-location-btn') || document.getElementById('detect-location-btn-mobile');
        const lang = window.currentLang || 'en';
        if (!navigator.geolocation) {
            customAlert(translations[lang].locationError || 'Geolocation not supported');
            return;
        }

        const spans = btn?.querySelectorAll('span');
        const originalTexts = Array.from(spans || []).map(s => s.textContent);
        const dicts = getTranslations();

        if (spans) {
            spans.forEach(span => {
                span.textContent = dicts[lang].detecting || 'Detecting...';
            });
        }
        if (btn) btn.disabled = true;

        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                // Fetch in English to match our keys consistently
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en`);
                const data = await response.json();
                
                const addr = data.address;
                // Identify the governorate/state level
                const detectedName = addr.state || addr.province || addr.region || addr.city || addr.town || addr.county;
                const countryCode = addr.country_code?.toLowerCase();

                if (!detectedName) {
                    customAlert(dicts[lang].locationError || 'Location Error');
                    return;
                }

                // Map country code to our keys
                const countryMap = { 'ae': 'uae', 'eg': 'egypt', 'sa': 'ksa', 'qa': 'qatar' };
                const detectedCountry = countryMap[countryCode];

                // 1. Clean the detected value (remove common suffixes)
                let cleanLoc = detectedName.toLowerCase()
                    .replace(' governorate', '')
                    .replace(' region', '')
                    .replace(' emirate', '')
                    .replace(' province', '')
                    .replace(' municipality', '')
                    .trim();

                // 2. Map cleanLoc to our supported city keys
                const countryCitiesList = {
                    uae: ['dubai', 'abuDhabi', 'sharjah', 'ajman', 'umAlQuwain', 'rasAlKhaimah', 'fujairah', 'alAin'],
                    egypt: ['cairo', 'alexandria', 'giza', 'sharm', 'hurghada', 'dahab', 'suez', 'portSaid', 'luxor', 'aswan', 'mansoura', 'tanta', 'dakahlia', 'gharbia', 'monufia', 'sharqia', 'kafrElSheikh', 'damietta', 'matrouh', 'beheira', 'ismailia', 'beniSuef', 'faiyum', 'minya', 'asyut', 'sohag', 'qena', 'redSea', 'newValley', 'qalyubia', 'northSinai', 'southSinai'],
                    ksa: ['riyadh', 'jeddah', 'dammam', 'mecca', 'medina', 'khobar', 'abha', 'tabuk', 'buraydah'],
                    qatar: ['doha', 'wakrah', 'rayyan', 'khor', 'shamal']
                };

                let matchedKey = null;
                if (detectedCountry && countryCitiesList[detectedCountry]) {
                    const list = countryCitiesList[detectedCountry];
                    matchedKey = list.find(k => k === cleanLoc || cleanLoc.includes(k) || k.includes(cleanLoc));
                }

                if (!matchedKey) {
                    for (const c in countryCitiesList) {
                        const match = countryCitiesList[c].find(k => k === cleanLoc || cleanLoc.includes(k) || k.includes(cleanLoc));
                        if (match) {
                            matchedKey = match;
                            break;
                        }
                    }
                }

                const finalLocKey = matchedKey || cleanLoc;
                const finalLocDisplayName = (translations[lang] && translations[lang][finalLocKey]) || finalLocKey;

                // Handle country switch if detected different country
                if (detectedCountry && detectedCountry !== window.selectedCountry) {
                    const countryNames = {
                        'uae': (lang === 'ar' ? 'الإمارات' : 'UAE'),
                        'egypt': (lang === 'ar' ? 'مصر' : 'Egypt'),
                        'ksa': (lang === 'ar' ? 'السعودية' : 'KSA'),
                        'qatar': (lang === 'ar' ? 'قطر' : 'Qatar')
                    };
                    const detectedCountryName = countryNames[detectedCountry] || detectedCountry;
                    const currentCountryName = countryNames[window.selectedCountry] || window.selectedCountry;

                    const msg = lang === 'ar' 
                        ? `لقد اكتشفنا أنك في ${detectedCountryName}. هل تود الانتقال إلى موقعنا في ${detectedCountryName}؟ (أنت حالياً تتصفح موقع ${currentCountryName})`
                        : `We detected you are in ${detectedCountryName}. Would you like to switch to our site for that country? (You are currently viewing ${currentCountryName})`;
                    
                    const switchConfirm = await customConfirm(msg);
                    if (switchConfirm) {
                        const flags = { 'uae': '🇦🇪', 'egypt': '🇪🇬', 'ksa': '🇸🇦', 'qatar': '🇶🇦' };
                        window.setCountry(detectedCountry, flags[detectedCountry], detectedCountryName);
                        // Brief delay to ensure localStorage is set before redirect
                        await new Promise(r => setTimeout(r, 100));
                    }
                }

                await customAlert(`${dicts[lang].locationActive || 'Location Set'}: ${finalLocDisplayName}`);
                
                // Construct search URL - ensure country is explicitly passed if we just switched it
                const currentCountry = localStorage.getItem('selectedCountry') || window.selectedCountry || 'uae';
                const searchUrl = `search.html?country=${currentCountry}&city=${encodeURIComponent(finalLocKey)}&lat=${latitude}&lng=${longitude}&radius=50&loc=${encodeURIComponent(finalLocDisplayName)}`;
                window.location.href = searchUrl;

            } catch (err) {
                console.error('Location detection failed:', err);
                customAlert(dicts[lang].locationError || 'Location Error');
            } finally {
                if (spans) {
                    spans.forEach((span, i) => {
                        span.textContent = originalTexts[i];
                    });
                }
                if (btn) btn.disabled = false;
            }
        }, (err) => {
            console.warn('Geolocation denied or failed:', err);
            customAlert(dicts[lang].locationDenied || 'Location Denied');
            if (spans) {
                spans.forEach((span, i) => {
                    span.textContent = originalTexts[i];
                });
            }
            if (btn) btn.disabled = false;
        });
    };

    window.setCountry = function (country, flag, name) {
        const currentCountryFlag = document.getElementById('current-country-flag');
        if (currentCountryFlag) currentCountryFlag.textContent = flag;

        window.selectedCountry = country;
        localStorage.setItem('selectedCountry', country);
        localStorage.setItem('selectedCountryFlag', flag);
        localStorage.setItem('selectedCountryName', name);

        window.updateDynamicContent(window.selectedCountry, window.currentLang);
        window.dispatchEvent(new CustomEvent('countryChanged', { detail: { country } }));
    };

    window.initCountryDropdown = async function () {
        const countryOptions = document.querySelectorAll('.country-option');
        const currentCountryFlag = document.getElementById('current-country-flag');
        const currentCountryName = document.getElementById('current-country-name');

        const storedCountry = localStorage.getItem('selectedCountry');

        if (countryOptions.length > 0) {
            countryOptions.forEach(opt => {
                opt.onclick = (e) => {
                    e.preventDefault();
                    const country = opt.getAttribute('data-country') || 'uae';
                    const flag = opt.getAttribute('data-flag');
                    const name = opt.getAttribute('data-name');
                    window.setCountry(country, flag, name);
                };
            });

            if (storedCountry) {
                // If we have a stored preference, use it
                const storedFlag = localStorage.getItem('selectedCountryFlag') || '🇦🇪';
                const storedName = localStorage.getItem('selectedCountryName') || 'uae';
                window.setCountry(storedCountry, storedFlag, storedName);
            } else {
                // IP-based Geo-location (First time visit)
                try {
                    const res = await fetch('https://ipapi.co/json/');
                    const ipData = await res.json();
                    const countryCode = ipData.country_code?.toLowerCase();
                    const countryMap = { 'ae': 'uae', 'eg': 'egypt', 'sa': 'ksa', 'qa': 'qatar' };
                    const detectedCountry = countryMap[countryCode] || 'uae';
                    const flags = { 'uae': '🇦🇪', 'egypt': '🇪🇬', 'ksa': '🇸🇦', 'qatar': '🇶🇦' };
                    const names = { 'uae': (window.currentLang === 'ar' ? 'الإمارات' : 'UAE'), 'egypt': (window.currentLang === 'ar' ? 'مصر' : 'Egypt'), 'ksa': (window.currentLang === 'ar' ? 'السعودية' : 'KSA'), 'qatar': (window.currentLang === 'ar' ? 'قطر' : 'Qatar') };

                    window.setCountry(detectedCountry, flags[detectedCountry], names[detectedCountry]);
                } catch (err) {
                    // Fallback to UAE if geo-detection fails
                    window.setCountry('uae', '🇦🇪', 'UAE');
                }
            }
        }
    };

    initCountryDropdown();

    // --- Global Unread Count Logic ---
    window.refreshUnreadCount = async function () {
        if (!localStorage.getItem('token') || !window.apiClient) return;

        try {
            const response = await apiClient.getUnreadCount();
            const count = response.count;

            // Update all badges with class 'unread-badge'
            const badges = document.querySelectorAll('.unread-badge');
            badges.forEach(badge => {
                if (count > 0) {
                    badge.textContent = count > 99 ? '99+' : count;
                    badge.classList.remove('hidden');
                } else {
                    badge.classList.add('hidden');
                    badge.textContent = '0';
                }
            });
        } catch (err) {
            console.warn('Failed to refresh unread count:', err);
        }
    };

    // --- Language Switching Logic ---
    // Set up the toggle button click listener (updateLanguage itself is defined globally at top of file)
    const langBtn = document.getElementById('lang-toggle');
    if (langBtn) {
        langBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const newLang = window.currentLang === 'en' ? 'ar' : 'en';
            window.updateLanguage(newLang);
        });
    }

    // Apply saved language on every page load
    window.updateLanguage(window.currentLang);

    // --- Dark Mode Logic ---
    window.initTheme = function () {
        const themeBtn = document.getElementById('theme-toggle');
        const themeIcon = document.getElementById('theme-icon');
        let isDark = localStorage.getItem('theme') === 'dark' ||
            (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);

        function updateTheme(dark) {
            if (dark) {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
                if (themeIcon) themeIcon.innerHTML = `<svg class="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>`;
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
                if (themeIcon) themeIcon.innerHTML = `<svg class="w-5 h-5 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>`;
            }
        }

        if (themeBtn) {
            themeBtn.onclick = () => {
                isDark = !document.documentElement.classList.contains('dark');
                updateTheme(isDark);
            };
            // Sync icon on load
            updateTheme(document.documentElement.classList.contains('dark'));
        }
    };

    initTheme();

    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            if (mobileMenu.classList.contains('hidden-menu')) {
                mobileMenu.classList.remove('hidden-menu');
                mobileMenu.classList.add('block');
            } else {
                mobileMenu.classList.add('hidden-menu');
                mobileMenu.classList.remove('block');
            }
        });
    }

    // Carousel Logic
    const slides = document.querySelectorAll('.carousel-slide');
    const indicators = document.querySelectorAll('.carousel-container + div button');
    let currentSlide = 0;
    const slideInterval = 5000; // 5 seconds

    function showSlide(index) {
        slides.forEach((slide, i) => {
            if (i === index) {
                slide.classList.remove('opacity-0');
                slide.classList.add('opacity-100');
            } else {
                slide.classList.remove('opacity-100');
                slide.classList.add('opacity-0');
            }
        });

        // Update indicators
        if (indicators.length > 0) {
            indicators.forEach((indicator, i) => {
                if (i === index) {
                    indicator.classList.remove('opacity-50');
                    indicator.classList.add('opacity-100', 'scale-110');
                } else {
                    indicator.classList.add('opacity-50');
                    indicator.classList.remove('opacity-100', 'scale-110');
                }
            });
        }
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }

    if (slides.length > 0) {
        // Initial show
        showSlide(0);

        // Auto play
        let interval = setInterval(nextSlide, slideInterval);

        // Indicator clicks
        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                currentSlide = index;
                showSlide(currentSlide);
                clearInterval(interval);
                interval = setInterval(nextSlide, slideInterval);
            });
        });

        // Parallax Effect for Hero Slides
        const heroSection = document.querySelector('.hero-section');
        if (heroSection) {
            heroSection.addEventListener('mousemove', (e) => {
                const { clientX, clientY } = e;
                const { left, top, width, height } = heroSection.getBoundingClientRect();
                const x = (clientX - left) / width - 0.5;
                const y = (clientY - top) / height - 0.5;

                const activeSlide = slides[currentSlide];
                if (activeSlide) {
                    const content = activeSlide.querySelector('.relative.z-10');
                    if (content) {
                        content.style.transform = `translate(${x * 40}px, ${y * 40}px)`;
                    }
                    activeSlide.style.backgroundPosition = `${50 + x * 5}% ${50 + y * 5}%`;
                }
            });

            heroSection.addEventListener('mouseleave', () => {
                const activeSlide = slides[currentSlide];
                if (activeSlide) {
                    const content = activeSlide.querySelector('.relative.z-10');
                    if (content) {
                        content.style.transform = `translate(0, 0)`;
                        content.style.transition = 'transform 0.5s ease-out';
                    }
                    activeSlide.style.backgroundPosition = 'center';
                }
            });
        }
    }

    // Drag to Scroll for All Sliders
    const sliders = document.querySelectorAll('.overflow-x-auto');
    sliders.forEach(slider => {
        let isDown = false;
        let startX;
        let scrollLeft;

        slider.addEventListener('mousedown', (e) => {
            isDown = true;
            slider.classList.add('active-drag');
            slider.style.cursor = 'grabbing';
            slider.style.scrollSnapType = 'none'; // Disable snap during drag
            startX = e.pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;
        });

        slider.addEventListener('mouseleave', () => {
            isDown = false;
            slider.style.cursor = 'grab';
        });

        slider.addEventListener('mouseup', () => {
            isDown = false;
            slider.style.cursor = 'grab';
            slider.style.scrollSnapType = 'x mandatory'; // Re-enable snap
        });

        slider.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - slider.offsetLeft;
            const walk = (x - startX) * 2; // Scroll speed multiplier
            slider.scrollLeft = scrollLeft - walk;
        });
    });

    // Tab Switching Logic
    // Tab Switching Logic
    const tabBtns = document.querySelectorAll('.tab-btn');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const group = btn.getAttribute('data-group');
            const targetContent = document.getElementById(targetId);

            // Only proceed if target content exists and group is defined
            if (targetContent && group) {
                // Select only buttons and contents within the same group
                const groupBtns = document.querySelectorAll(`.tab-btn[data-group="${group}"]`);
                const groupContents = document.querySelectorAll(`.tab-content[data-group="${group}"]`);

                // Reset all buttons in this group
                groupBtns.forEach(b => {
                    b.classList.remove('border-accent', 'text-accent', 'font-bold');
                    b.classList.add('border-transparent', 'text-gray-500', 'font-medium');
                });

                // Activate clicked button
                // Correction to previous reset logic which might have been imperfect
                groupBtns.forEach(b => {
                    b.classList.remove('border-accent', 'text-accent', 'font-bold');
                    b.classList.add('border-transparent', 'text-gray-500', 'font-medium');
                });

                btn.classList.remove('border-transparent', 'text-gray-500', 'font-medium');
                btn.classList.add('border-accent', 'text-accent', 'font-bold');

                // Hide all contents in this group
                groupContents.forEach(content => {
                    content.classList.add('hidden');
                });

                // Show target content with animation
                targetContent.classList.remove('hidden');
                targetContent.classList.add('animate-fade-in');
                setTimeout(() => {
                    targetContent.classList.remove('animate-fade-in');
                }, 500);
            }
        });
    });

    // --- Global Auth State Logic ---
    function showVerificationBanner(user) {
        if (document.getElementById('verification-banner')) return;

        const banner = document.createElement('div');
        banner.id = 'verification-banner';
        banner.className = 'bg-yellow-100 dark:bg-yellow-900/30 border-b border-yellow-200 dark:border-yellow-900/50 py-2';
        banner.innerHTML = `
            <div class="max-w-7xl mx-auto px-4 flex justify-between items-center text-xs sm:text-sm text-yellow-800 dark:text-yellow-200">
                <div class="flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    <span data-translate="verifyEmailWarning">Your email is not verified. Verify now to get the Verified Seller badge!</span>
                </div>
                <button id="resend-verification-btn" class="font-bold underline hover:text-yellow-950 dark:hover:text-yellow-100 transition whitespace-nowrap" data-translate="resendBtn">Resend Link</button>
            </div>
        `;

        const header = document.querySelector('header');
        if (header) {
            header.insertAdjacentElement('afterend', banner);
        } else {
            document.body.prepend(banner);
        }

        const resendBtn = document.getElementById('resend-verification-btn');
        if (resendBtn) {
            resendBtn.onclick = async () => {
                try {
                    resendBtn.disabled = true;
                    resendBtn.textContent = 'Sending...';
                    const res = await apiClient.fetch('/auth/resend-verification', { method: 'POST' });
                    if (res.success) {
                        alert('Verification link sent to your email!');
                        resendBtn.textContent = 'Sent ✅';
                    }
                } catch (err) {
                    alert(err.message);
                    resendBtn.disabled = false;
                    resendBtn.textContent = 'Resend Link';
                }
            };
        }

        if (window.updateLanguage) window.updateLanguage(window.currentLang);
    }

    window.updateAuthState = function () {
        const user = JSON.parse(localStorage.getItem('user'));
        const token = localStorage.getItem('token');
        const lang = window.currentLang || localStorage.getItem('lang') || 'en';
        const trans = translations[lang] || translations['en'];

        // Find the user dropdown by ID
        const userDropdown = document.getElementById('user-dropdown');
        const userBtnText = document.getElementById('user-btn-text');
        const headerImg = document.getElementById('header-profile-img');
        const notifWrapper = document.getElementById('notif-wrapper');

        if (headerImg) {
            if (user && user.avatar) {
                headerImg.src = user.avatar;
            } else {
                headerImg.src = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
            }
        }

        if (token && user) {
            // --- LOGGED IN STATE ---
            if (notifWrapper) notifWrapper.classList.remove('hidden');
            if (typeof loadNotifications === 'function') loadNotifications();

            // Handle email verification banner
            if (!user.isEmailVerified) {
                showVerificationBanner(user);
            } else {
                const banner = document.getElementById('verification-banner');
                if (banner) banner.remove();
            }

            // Update Header Button Text
            if (userBtnText) {
                userBtnText.textContent = user.name;
                userBtnText.removeAttribute('data-translate');
            }

            // Update Dropdown Content
            if (userDropdown) {
                userDropdown.innerHTML = `
                    <div class="px-4 py-3 border-b dark:border-gray-700">
                        <p class="text-sm font-bold text-gray-900 dark:text-white truncate">${user.name}</p>
                        <p class="text-xs text-gray-500 truncate">${user.email}</p>
                    </div>
                    <a href="messages.html" class="flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-accent font-bold">
                        <span data-translate="messages">${trans.messages || 'Messages'}</span>
                        <span class="unread-badge bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full hidden">0</span>
                    </a>
                    <a href="profile.html" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-accent">
                        <span data-translate="myProfile">${trans.myProfile || 'Profile'}</span>
                    </a>
                    <a href="dashboard.html" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-accent">
                        <span data-translate="myDashboard">${trans.myDashboard || 'Dashboard'}</span>
                    </a>
                    ${user.role === 'admin' ? `
                    <a href="admin.html" class="block px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 font-bold border-l-4 border-blue-600">
                        <span data-translate="adminPanel">${trans.adminPanel || 'Admin Panel'}</span>
                    </a>` : ''}
                    <a href="favorites.html" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-accent">
                        <span data-translate="myFavorites">${trans.myFavorites || 'Favorites'}</span>
                    </a>
                    <div class="border-t dark:border-gray-700 my-1"></div>
                    <a href="#" class="logout-action-btn block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 font-bold">
                        <span data-translate="logout">${trans.logout || 'Logout'}</span>
                    </a>
                `;
            }
        } else {
            // --- LOGGED OUT STATE ---
            if (notifWrapper) notifWrapper.classList.add('hidden');
            const banner = document.getElementById('verification-banner');
            if (banner) banner.remove();

            // Update Header Button Text
            if (userBtnText) {
                userBtnText.textContent = trans.login || 'Log in';
                userBtnText.setAttribute('data-translate', 'login');
            }

            // Update Dropdown Content
            if (userDropdown) {
                userDropdown.innerHTML = `
                    <a href="login.html" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-accent font-bold">
                        <span data-translate="login">${trans.login || 'Log in'}</span>
                    </a>
                    <a href="login.html?mode=signup" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-accent">
                        <span data-translate="createAccount">${trans.createAccount || 'Sign Up'}</span>
                    </a>
                    <div class="border-t dark:border-gray-700 my-1"></div>
                    <a href="plans.html" class="block px-4 py-2 text-sm text-orange-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-accent font-bold">
                        <span data-translate="plansTitle">${trans.plansTitle || 'Pricing Plans'}</span>
                    </a>
                `;
            }
        }

        // --- Mobile Menu: Update Dynamic Sections Only ---
        const mobileUserName = document.getElementById('mobile-user-name');
        const mobileUserEmail = document.getElementById('mobile-user-email');
        const mobileProfileImg = document.getElementById('mobile-profile-img');
        const mobileAuthLinks = document.getElementById('mobile-auth-links');

        if (token && user) {
            // --- Mobile: Logged In State ---
            if (mobileProfileImg && user.avatar) mobileProfileImg.src = user.avatar;
            if (mobileUserName) {
                mobileUserName.textContent = user.name;
                mobileUserName.removeAttribute('data-translate');
            }
            if (mobileUserEmail) {
                mobileUserEmail.textContent = user.email;
                mobileUserEmail.classList.remove('hidden');
            }
            // Update auth links to logged-in state
            if (mobileAuthLinks) {
                mobileAuthLinks.innerHTML = `
                    <a href="messages.html" class="flex items-center gap-2 px-3 py-2 rounded-md text-base font-bold text-accent hover:bg-accent/5 transition">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5-1-5z"></path></svg>
                        <span data-translate="messages">${trans.messages || 'Messages'}</span>
                    </a>
                    <a href="profile.html" class="flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-accent hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                        <span data-translate="myProfile">${trans.myProfile || 'Profile'}</span>
                    </a>
                    <a href="dashboard.html" class="flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-accent hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
                        <span data-translate="myDashboard">${trans.myDashboard || 'Dashboard'}</span>
                    </a>
                    <a href="favorites.html" class="flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-accent hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                        <span data-translate="myFavorites">${trans.myFavorites || 'Favorites'}</span>
                    </a>
                    ${user.role === 'admin' ? `
                    <a href="admin.html" class="flex items-center gap-2 px-3 py-2 rounded-md text-base font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 transition">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                        <span data-translate="adminPanel">${trans.adminPanel || 'Admin Panel'}</span>
                    </a>` : ''}
                    <a href="#" class="logout-action-btn flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                        <span data-translate="logout">${trans.logout || 'Logout'}</span>
                    </a>
                `;
            }
        } else {
            // --- Mobile: Logged Out State ---
            if (mobileUserName) {
                mobileUserName.textContent = trans.login || 'Log in';
                mobileUserName.setAttribute('data-translate', 'login');
            }
            if (mobileUserEmail) mobileUserEmail.classList.add('hidden');
            if (mobileAuthLinks) {
                mobileAuthLinks.innerHTML = `
                    <a href="login.html" class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-accent hover:bg-gray-50 dark:hover:bg-gray-800 transition" data-translate="login">${trans.login || 'Log in'}</a>
                    <a href="login.html?mode=signup" class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-accent hover:bg-gray-50 dark:hover:bg-gray-800 transition" data-translate="createAccount">${trans.createAccount || 'Sign up'}</a>
                `;
            }
        }

        // Wire up mobile lang & theme toggles to match desktop buttons
        const mobileLangToggle = document.getElementById('mobile-lang-toggle');
        const mobileThemeToggle = document.getElementById('mobile-theme-toggle');
        const desktopLangToggle = document.getElementById('lang-toggle');
        const desktopThemeToggle = document.getElementById('theme-toggle');
        if (mobileLangToggle && desktopLangToggle) {
            mobileLangToggle.onclick = (e) => { e.preventDefault(); desktopLangToggle.click(); };
        }
        if (mobileThemeToggle && desktopThemeToggle) {
            mobileThemeToggle.onclick = () => desktopThemeToggle.click();
        }

        // Attach logout listeners
        document.querySelectorAll('.logout-action-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                apiClient.logout();
            };
        });

        // Re-apply translations if the updateLanguage function is available
        if (typeof window.updateLanguage === 'function') {
            // We avoid infinite loop by check
            // window.updateLanguage(lang); 
        }
    };

    updateAuthState();
    refreshUnreadCount();
    setInterval(refreshUnreadCount, 30000);

    // --- Ads Grid population ---
    const adsContainer = document.querySelector('.featured-ads .grid');
    const hasSliders = document.querySelectorAll('[id*="-slider"]').length > 0;
    
    if (window.apiClient) {
        if (adsContainer) {
            populateAdsGrid(adsContainer, window.selectedCountry);
        }
        if (hasSliders) {
            loadCategorySliders(window.selectedCountry);
        }
    }

    async function populateAdsGrid(container, country = null) {
        try {
            const params = { limit: 8 };
            if (country) params.country = country;
            const response = await apiClient.getAds(params);
            const ads = response.data;

            if (ads.length === 0) {
                container.innerHTML = `<p class="text-center col-span-full py-10 text-gray-500">${translations[window.currentLang || 'en'].noAdsFound || 'No ads found for this country.'}</p>`;
                // Keep it hidden if no ads
                const section = container.closest('section');
                if (section) section.classList.add('hidden');
                return;
            }

            container.innerHTML = ''; // Clear loading state
            // Show the section since we have ads
            const section = container.closest('section');
            if (section) section.classList.remove('hidden');
            ads.forEach(ad => {
                container.insertAdjacentHTML('beforeend', createAdCard(ad));
            });
        } catch (err) {
            console.error('Error loading ads:', err);
        }
    }

    // --- Global Favorites state for current user ---
    window.userFavorites = [];
    async function loadUserFavorites() {
        if (!localStorage.getItem('token')) return;
        try {
            const res = await apiClient.getFavorites();
            if (res.success) window.userFavorites = res.data.map(ad => ad.id);
        } catch (err) {
            console.warn('Failed to load favorites:', err);
        }
    }

    function createAdCard(ad, isSlider = false) {
        const cardClass = isSlider
            ? "min-w-[280px] w-[280px] md:min-w-[320px] md:w-[320px] bg-white dark:bg-gray-800 rounded-xl shadow border dark:border-gray-700 snap-center flex-shrink-0 cursor-pointer"
            : "ad-card-main bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition group cursor-pointer";

        const locationHTML = window.formatAdLocation(ad.city, ad.country, "");
        const isFav = window.userFavorites.includes(ad.id);

        return `
        <div class="${cardClass} relative">
            <!-- Main Clickable Area -->
            <div class="cursor-pointer" onclick="window.location.href='ad-details.html?id=${ad.id}'">
                <div class="relative h-48 bg-gray-200 dark:bg-gray-700 overflow-hidden ${!isSlider ? 'rounded-t-xl' : ''}">
                    <img src="${ad.images[0] || 'https://placehold.co/300x200'}" alt="${ad.title}" class="w-full h-full object-cover transition duration-300 group-hover:scale-105">
                    ${ad.isFeatured ? '<div class="badge-featured absolute top-2 right-2 bg-accent text-white text-xs font-bold px-2 py-1 rounded shadow-lg uppercase tracking-wider">FEATURED</div>' : ''}
                </div>
                <div class="p-4">
                    <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">${ad.category}</div>
                    <h3 class="font-bold text-lg text-gray-900 dark:text-white mb-2 truncate flex items-center gap-1">
                        <span>${ad.title}</span>
                        ${ad.user && ad.user.isEmailVerified ? `
                            <svg class="w-4 h-4 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                            </svg>
                        ` : ''}
                    </h3>
                    <div class="font-bold text-accent text-xl mb-2">${ad.price} <span class="currency-label">${(translations[window.currentLang || 'en'] && translations[window.currentLang || 'en'][`currency_${window.selectedCountry || 'uae'}`]) || 'AED'}</span></div>
                    <div class="flex items-center text-gray-500 dark:text-gray-400 text-sm">
                        <svg class="w-4 h-4 mr-1 ml-0 rtl:ml-1 rtl:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        </svg>
                        ${locationHTML}
                    </div>
                </div>
            </div>

            <!-- Favorite Button (Outside the main link div) -->
            <button class="wishlist-btn absolute bottom-[110px] right-2 bg-white dark:bg-gray-700 p-2 rounded-full shadow hover:text-red-500 transition z-[30] ${isFav ? 'text-red-500' : ''}" onclick="window.toggleFav(event, ${ad.id}, this)">
                <svg class="w-5 h-5" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                </svg>
            </button>
        </div>
    `;
    }

    async function loadCategorySliders(country = null) {
        const configs = [
            { category: 'Motors', sliderId: 'cat-motors-slider' },
            { category: 'Property', sliderId: 'cat-property-slider' },
            { category: 'Electronics', sliderId: 'cat-electronics-slider' },
            { category: 'Classifieds', sliderId: 'cat-classifieds-slider' },
            { category: 'Jobs', sliderId: 'cat-jobs-slider' },
            { category: 'Services', sliderId: 'cat-services-slider' }
        ];

        // Load Featured Ads first
        await loadFeaturedAds(country);

        for (const config of configs) {
            const slider = document.getElementById(config.sliderId);
            if (slider) {
                try {
                    const params = { category: config.category, limit: 12 };
                    if (country) params.country = country;
                    const response = await apiClient.getAds(params);
                    const ads = response.data;

                    if (ads.length > 0) {
                        slider.innerHTML = '';
                        slider.setAttribute('data-loaded', 'true');
                        ads.forEach(ad => {
                            slider.insertAdjacentHTML('beforeend', createAdCard(ad, true));
                        });
                    } else {
                        // Clear placeholders if no ads found, showing a message only if country was selected
                        if (country) {
                            slider.innerHTML = `<div class="p-10 text-center w-full text-gray-500">${translations[window.currentLang || 'en'].noAdsInCategory || 'No ads in this category for this region.'}</div>`;
                        } else {
                            slider.innerHTML = ''; // Just clear if no country yet to avoid empty white space
                        }
                        slider.setAttribute('data-loaded', 'true');
                    }
                } catch (err) {
                    console.warn(`Failed to load slider for ${config.category}:`, err);
                }
            }
        }
    }

    async function loadFeaturedAds(country = null) {
        const slider = document.getElementById('featured-ads-slider');
        const section = document.getElementById('featured-ads-section');
        if (!slider) return;

        try {
            const params = { isFeatured: true, limit: 12 };
            if (country) params.country = country;
            const response = await apiClient.getAds(params);
            const ads = response.data;
            if (ads.length > 0) {
                section.classList.remove('hidden');
                slider.innerHTML = '';
                ads.forEach(ad => {
                    slider.insertAdjacentHTML('beforeend', createAdCard(ad, true));
                });
            } else {
                section.classList.add('hidden');
            }
        } catch (err) {
            console.warn('Failed to load featured ads:', err);
        }
    }

    window.toggleFav = async function (e, adId, btn) {
        if (e && e.stopPropagation) e.stopPropagation();
        if (e && e.preventDefault) e.preventDefault();

        if (!localStorage.getItem('token')) {
            window.location.href = 'login.html';
            return;
        }
        try {
            const res = await apiClient.toggleFavorite(adId);
            const svg = btn.querySelector('svg');
            if (res.isFavorite) {
                if (svg) {
                    svg.setAttribute('fill', 'currentColor');
                }
                btn.classList.add('text-red-500');
                if (!window.userFavorites.includes(adId)) window.userFavorites.push(adId);
            } else {
                if (svg) {
                    svg.setAttribute('fill', 'none');
                }
                btn.classList.remove('text-red-500');
                window.userFavorites = window.userFavorites.filter(id => id !== adId);

                // If we are on the favorites page, remove the card from UI
                if (window.location.href.includes('favorites.html')) {
                    const card = btn.closest('.group') || btn.closest('.grid > div');
                    if (card) {
                        card.classList.add('opacity-0', 'scale-95');
                        setTimeout(() => {
                            card.remove();
                            // Update count badge if it exists
                            const countBadge = document.getElementById('favorites-count');
                            const container = document.getElementById('favorites-container') || document.querySelector('.grid');
                            const remaining = container ? container.querySelectorAll('.group, [onclick*="ad-details"]').length : 0;
                            
                            if (countBadge) {
                                if (remaining === 0) {
                                    countBadge.classList.add('hidden');
                                    window.location.reload(); // Reload to show hollow state message
                                } else {
                                    const lang = window.currentLang || 'en';
                                    countBadge.textContent = `${remaining} ${lang === 'ar' ? 'إعلان' : 'items'}`;
                                }
                            } else if (remaining === 0 && container) {
                                container.innerHTML = '<div class="col-span-full text-center py-20 text-gray-500">You haven\'t saved any ads yet.</div>';
                            }
                        }, 300);
                    }
                }
            }
        } catch (err) {
            alert(err.message);
        }
    };

    // Horizontal Slider Scroll Function (Global)
    window.scrollSlider = function (elementId, scrollAmount) {
        const container = document.getElementById(elementId);
        if (container) {
            // Adjust scroll direction for RTL
            const isRTL = document.documentElement.dir === 'rtl';
            const finalScrollAmount = isRTL ? -scrollAmount : scrollAmount;

            container.scrollBy({
                left: finalScrollAmount,
                behavior: 'smooth'
            });
        }
    };

    // --- Chat Widget Initialization ---
    // --- Chat Widget Initialization ---
    function initChatWidget() {
        const lang = localStorage.getItem('lang') || 'en';
        const user = JSON.parse(localStorage.getItem('user'));
        
        let welcomeMsg = translations[lang].chatWelcome;
        let showEmailInput = !user;

        if (user) {
            welcomeMsg = translations[lang].chatLoggedInWelcome.replace('{name}', user.name.split(' ')[0]);
        } else {
            welcomeMsg = translations[lang].chatGuestWelcome;
        }

        const widgetHtml = `
        <div class="chat-widget" id="chatWidget">
            <div class="chat-window" id="chatWindow">
                <div class="chat-header">
                    <div class="flex items-center gap-2">
                        <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span class="font-bold text-sm" data-translate="chatSupport">${translations[lang].chatSupport}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <button id="resetChat" title="New Chat" class="text-white hover:text-gray-300 transition">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        </button>
                        <button id="closeChat" class="text-white hover:text-gray-300">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="chat-messages thin-scrollbar" id="chatMessages">
                    <div class="message support">${welcomeMsg}</div>
                </div>
                <div class="chat-input-area flex-col gap-2">
                    <div id="chatEmailWrapper" class="${showEmailInput ? '' : 'hidden'}">
                        <input type="email" id="chatGuestEmail" class="chat-input w-full mb-1" placeholder="${translations[lang].chatEmailPlaceholder}" data-translate="chatEmailPlaceholder">
                    </div>
                    <div class="flex w-full gap-2">
                        <input type="text" id="chatInput" class="chat-input" placeholder="${translations[lang].chatPlaceholder}" data-translate="chatPlaceholder">
                        <button id="sendMessage" class="chat-send">
                            <svg class="w-5 h-5 transform rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            <button class="chat-toggle" id="chatToggle" aria-label="Open Chat">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                </svg>
            </button>
        </div>
        `;

        document.body.insertAdjacentHTML('beforeend', widgetHtml);

        const toggle = document.getElementById('chatToggle');
        const windowChat = document.getElementById('chatWindow');
        const closeBtn = document.getElementById('closeChat');
        const sendBtn = document.getElementById('sendMessage');
        const input = document.getElementById('chatInput');
        const emailInput = document.getElementById('chatGuestEmail');
        const emailWrapper = document.getElementById('chatEmailWrapper');
        const messages = document.getElementById('chatMessages');

        let currentRequestId = sessionStorage.getItem('supportRequestId');

        if (toggle) {
            toggle.addEventListener('click', () => {
                windowChat.classList.toggle('active');
                if (windowChat.classList.contains('active') && currentRequestId) {
                    joinSupportRoom(currentRequestId);
                    loadChatHistory(currentRequestId);
                }
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                windowChat.classList.remove('active');
            });
        }

        const resetBtn = document.getElementById('resetChat');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (!confirm('Start a new conversation?')) return;
                sessionStorage.removeItem('supportRequestId');
                currentRequestId = null;
                messages.innerHTML = `<div class="message support">${welcomeMsg}</div>`;
                if (emailWrapper) emailWrapper.classList.remove('hidden');
                // Optional: Notify server? No, just start fresh locally.
            });
        }

        function addMessage(text, type) {
            const msgDiv = document.createElement('div');
            msgDiv.className = `message ${type}`;
            msgDiv.textContent = text;
            messages.appendChild(msgDiv);
            messages.scrollTop = messages.scrollHeight;
            return msgDiv;
        }

        function joinSupportRoom(id) {
            const socket = window.initGlobalSocket ? window.initGlobalSocket() : window.socket;
            if (socket) {
                socket.emit('join_support', id);
                // Clean old listener
                socket.off('new_support_message');
                socket.on('new_support_message', (msg) => {
                    if (msg.requestId == id && msg.isAdmin) {
                        addMessage(msg.message, 'support');
                    }
                });
            }
        }

        async function loadChatHistory(id) {
            try {
                const res = await fetch(`/api/support/${id}/messages`);
                const data = await res.json();
                if (data.success) {
                    messages.innerHTML = '';
                    addMessage(welcomeMsg, 'support');
                    data.data.forEach(m => {
                        addMessage(m.message, m.isAdmin ? 'support' : 'user');
                    });
                }
            } catch (err) { console.error(err); }
        }

        async function handleSend() {
            const text = input.value.trim();
            const guestEmail = emailInput ? emailInput.value.trim() : (user ? user.email : null);

            if (!text) return;
            if (!guestEmail && !user) {
                if (emailInput) {
                    emailInput.classList.add('border-red-500');
                    emailInput.focus();
                }
                return;
            }

            // Disable UI
            input.disabled = true;
            sendBtn.disabled = true;
            
            addMessage(text, 'user');
            input.value = '';

            try {
                if (!currentRequestId) {
                    // Create NEW Request
                    const response = await fetch('/api/support', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: user ? user.name : 'Guest User',
                            email: guestEmail,
                            subject: 'Live Chat Support',
                            message: text
                        })
                    });
                    const data = await response.json();
                    if (data.success) {
                        currentRequestId = data.id;
                        sessionStorage.setItem('supportRequestId', currentRequestId);
                        if (emailWrapper) emailWrapper.classList.add('hidden');
                        joinSupportRoom(currentRequestId);
                    }
                } else {
                    // Send to EXISTING thread
                    await fetch(`/api/support/${currentRequestId}/messages`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            message: text,
                            senderName: user ? user.name : 'Guest User',
                            isAdmin: false
                        })
                    });
                }
            } catch (err) {
                console.error(err);
                addMessage(translations[lang].chatError, 'support');
            } finally {
                input.disabled = false;
                sendBtn.disabled = false;
            }
        }

        if (sendBtn) {
            sendBtn.addEventListener('click', handleSend);
        }

        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleSend();
            });
        }
    }

    // Ensure the widget is initialized
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initChatWidget();
            initNewFeatures();
        });
    } else {
        initChatWidget();
        initNewFeatures();
    }

    // --- New Features Initialization ---
    function initNewFeatures() {
        const lang = localStorage.getItem('lang') || 'en';

        // 1. Inject Back to Top Button
        const bttHtml = `
        <button class="back-to-top" id="backToTop" aria-label="Back to Top" title="${translations[lang].backToTop}">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
            </svg>
        </button>
    `;
        document.body.insertAdjacentHTML('beforeend', bttHtml);

        const bttBtn = document.getElementById('backToTop');
        if (bttBtn) {
            window.addEventListener('scroll', () => {
                if (window.scrollY > 300) {
                    bttBtn.classList.add('show');
                } else {
                    bttBtn.classList.remove('show');
                }
            });

            bttBtn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        // 2. Inject Cookie Consent Banner
        if (!localStorage.getItem('cookieConsent')) {
            const cookieHtml = `
            <div class="cookie-consent" id="cookieConsent">
                <p class="text-sm" data-translate="cookieNotice">${translations[lang].cookieNotice}</p>
                <button class="cookie-btn" id="acceptCookies" data-translate="acceptCookies">${translations[lang].acceptCookies}</button>
            </div>
        `;
            document.body.insertAdjacentHTML('beforeend', cookieHtml);

            const cookieBanner = document.getElementById('cookieConsent');
            const acceptBtn = document.getElementById('acceptCookies');

            setTimeout(() => { if (cookieBanner) cookieBanner.classList.add('show'); }, 1000);

            if (acceptBtn) {
                acceptBtn.addEventListener('click', () => {
                    localStorage.setItem('cookieConsent', 'true');
                    cookieBanner.classList.remove('show');
                    setTimeout(() => { cookieBanner.remove(); }, 500);
                });
            }
        }

        // 3. Password Visibility Toggle Logic
        initPasswordToggles();
    }

    function initPasswordToggles() {
        const lang = localStorage.getItem('lang') || 'en';
        const passwordFields = document.querySelectorAll('input[type="password"]');

        passwordFields.forEach(field => {
            // Wrap the field if not already wrapped
            if (!field.parentElement.classList.contains('password-wrapper')) {
                const wrapper = document.createElement('div');
                wrapper.className = 'password-wrapper mt-1';
                field.parentNode.insertBefore(wrapper, field);
                wrapper.appendChild(field);

                const toggle = document.createElement('span');
                toggle.className = 'password-toggle text-xs font-bold text-accent select-none';
                toggle.setAttribute('data-translate-target', 'toggle');
                toggle.textContent = translations[lang].showPassword;
                wrapper.appendChild(toggle);

                toggle.addEventListener('click', () => {
                    const isPassword = field.getAttribute('type') === 'password';
                    field.setAttribute('type', isPassword ? 'text' : 'password');
                    const currLang = localStorage.getItem('lang') || 'en';
                    toggle.textContent = isPassword ? translations[currLang].hidePassword : translations[currLang].showPassword;
                });
            }
        });
    }

    // Global function to update translations for new dynamically injected elements
    const originalUpdateLanguage = window.updateLanguage;
    window.updateLanguage = function (lang) {
        if (typeof originalUpdateLanguage === 'function') {
            originalUpdateLanguage(lang);
        }

        // Update newly injected elements
        const btt = document.getElementById('backToTop');
        if (btt) {
            const titleKey = 'backToTop';
            if (translations[lang] && translations[lang][titleKey]) {
                btt.setAttribute('title', translations[lang][titleKey]);
            }
        }

        const toggles = document.querySelectorAll('.password-toggle');
        toggles.forEach(t => {
            const field = t.previousElementSibling;
            if (field) {
                const isVisible = field.getAttribute('type') === 'text';
                const key = isVisible ? 'hidePassword' : 'showPassword';
                if (translations[lang] && translations[lang][key]) {
                    t.textContent = translations[lang][key];
                }
            }
        });
    };

    // --- Notification System ---
    window.loadNotifications = async function () {
        if (!localStorage.getItem('token')) return;
        try {
            const res = await apiClient.fetch('/notifications');
            if (res.success) {
                updateNotifUI(res.data);
            }
        } catch (err) {
            console.error('Failed to load notifications:', err);
        }
    };

    function updateNotifUI(notifications) {
        const list = document.getElementById('notif-list');
        const badge = document.getElementById('notif-badge');
        if (!list) return;

        const unreadCount = notifications.filter(n => !n.isRead).length;

        if (badge) {
            if (unreadCount > 0) {
                badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }

        if (notifications.length === 0) {
            list.innerHTML = `<p class="text-center py-4 text-sm text-gray-500" data-translate="noNotifications">${translations[currentLang].noNotifications || 'No notifications'}</p>`;
            return;
        }

        list.innerHTML = notifications.map(n => `
        <div class="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer ${!n.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}" onclick="handleNotifClick(${n.id}, '${n.link || ''}')"> 
            <p class="text-sm font-bold text-gray-900 dark:text-white">${n.title}</p>
            <p class="text-xs text-gray-600 dark:text-gray-400 mt-0.5">${n.message}</p>
            <p class="text-[10px] text-gray-400 mt-1">${new Date(n.createdAt).toLocaleString()}</p>
        </div>
    `).join('');
    }

    window.handleNotifClick = async function (id, link) {
        try {
            await apiClient.fetch(`/notifications/${id}/read`, { method: 'PUT' });
            if (link && link !== 'null' && link.trim() !== '') {
                window.location.href = link;
            } else {
                loadNotifications();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const markReadBtn = document.getElementById('mark-notifs-read');
    if (markReadBtn) {
        markReadBtn.onclick = async () => {
            try {
                await apiClient.fetch('/notifications/read-all', { method: 'PUT' });
                loadNotifications();
            } catch (err) {
                console.error(err);
            }
        };
    }

    // Socket listener for real-time notifications
    if (window.socket) {
        window.socket.on('new_notification', (notification) => {
            loadNotifications();
            showNotificationToast(notification);
            playNotificationSound();
        });
    }
});

// --- Global Navigation Helper for Categories ---
window.browseCategory = function (category, subcategory) {
    // Navigate to search page with filters to "enter" the section
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (subcategory) params.set('subcategory', subcategory);

    window.location.href = `search.html?${params.toString()}`;
};

// Legacy support
window.navigateToCategory = window.browseCategory;

// --- Global Header Loader ---
async function loadGlobalHeader() {
    const placeholder = document.getElementById('global-header-placeholder');
    if (!placeholder) return;

    try {
        const response = await fetch('components/header.html');
        if (!response.ok) throw new Error('Header not found');
        const html = await response.text();
        placeholder.innerHTML = html;

        // After loading, re-run initialization for header elements
        if (window.initCountryDropdown) window.initCountryDropdown();
        if (window.initTheme) window.initTheme();
        if (window.initMobileMenu) window.initMobileMenu();
        if (window.updateAuthState) window.updateAuthState();

        // Ensure translations and dynamic content are applied after header is loaded
        if (window.updateLanguage) window.updateLanguage(window.currentLang);
        if (window.updateDynamicContent) window.updateDynamicContent(window.selectedCountry, window.currentLang);

        // Check for deep link params (section/tab)
        const urlParams = new URLSearchParams(window.location.search);
        const sectionId = urlParams.get('section');
        const tabId = urlParams.get('tab');

        if (sectionId || tabId) {
            setTimeout(() => {
                const section = document.getElementById(sectionId);
                if (section) section.scrollIntoView({ behavior: 'smooth' });
                if (tabId) {
                    const tabBtn = document.querySelector(`.tab-btn[data-target="${tabId}"]`);
                    if (tabBtn) tabBtn.click();
                }
            }, 600); // Wait for animations/load
        }
    } catch (err) {
        console.error('Error loading global header:', err);
    }
}

// --- Global Footer Loader ---
async function loadGlobalFooter() {
    const placeholder = document.getElementById('global-footer-placeholder');
    if (!placeholder) return;

    try {
        const response = await fetch('components/footer.html');
        if (!response.ok) throw new Error('Footer not found');
        const html = await response.text();
        placeholder.innerHTML = html;

        // Ensure translations are applied after footer is loaded
        if (window.updateLanguage) window.updateLanguage(window.currentLang);
    } catch (err) {
        console.error('Error loading global footer:', err);
    }
}
