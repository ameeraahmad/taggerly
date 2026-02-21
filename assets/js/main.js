// Language Dictionary
const translations = {
    en: enTranslations,
    ar: arTranslations
};

document.addEventListener('DOMContentLoaded', () => {
    const htmlToUpdate = document.documentElement;

    // --- Country & Currency Dropdown Logic ---
    const countryOptions = document.querySelectorAll('.country-option');
    const currentCountryFlag = document.getElementById('current-country-flag');
    const currentCountryName = document.getElementById('current-country-name');
    window.selectedCountry = localStorage.getItem('selectedCountry') || 'uae';
    window.currentLang = localStorage.getItem('lang') || 'en';

    window.updateDynamicContent = function (country, lang) {
        const countryName = translations[lang][country] || translations['en'][country] || country;

        // --- 1. Update Currencies ---
        const currencyLabels = document.querySelectorAll('.currency-label');
        const currencyKey = `currency_${country}`;
        const currencyText = translations[lang][currencyKey] || translations['en'][currencyKey] || "AED";

        currencyLabels.forEach(el => {
            el.textContent = currencyText;
        });

        // Update Price Label in search filters if exists
        const priceLabel = document.querySelector('[data-translate="priceLabel"]');
        if (priceLabel) {
            priceLabel.textContent = `${translations[lang].priceLabel.split('(')[0]} (${currencyText})`;
        }

        // --- 2. Update Country Labels ---
        const countryLabels = document.querySelectorAll('.country-label');
        countryLabels.forEach(el => {
            el.textContent = countryName;
        });

        // --- 3. Update City Labels ---
        const cityLabels = document.querySelectorAll('.city-label');
        const cityKey = `city_${country}`;
        const cityName = translations[lang][cityKey] || translations['en'][cityKey] || "Dubai";
        cityLabels.forEach(el => {
            el.textContent = cityName;
        });

        // --- 4. Update Header Country Name ---
        if (currentCountryName) {
            currentCountryName.textContent = countryName;
            currentCountryName.setAttribute('data-translate', country);
        }

        // --- 5. Update Footer & Community Labels ---
        const footerTemplate = translations[lang].footerText || translations['en'].footerText;
        const footerTextElements = document.querySelectorAll('[data-translate="footerText"]');
        footerTextElements.forEach(el => {
            // Replace "UAE" or "الإمارات" with the current country name
            el.textContent = footerTemplate.replace('UAE', countryName).replace('الإمارات', countryName);
        });

        const allUAELabels = document.querySelectorAll('[data-translate="allUAE"]');
        allUAELabels.forEach(el => {
            const prefix = lang === 'ar' ? 'كل ' : 'All ';
            el.textContent = prefix + countryName;
        });

        // --- 6. Update Dynamic Location Dropdowns (e.g., post-ad.html) ---
        const countryCities = {
            uae: ['dubai', 'abuDhabi', 'sharjah', 'ajman'],
            egypt: ['cairo', 'alexandria', 'giza', 'sharm'],
            ksa: ['riyadh', 'jeddah', 'dammam', 'mecca'],
            qatar: ['doha', 'wakrah', 'rayyan', 'khor']
        };

        const dynamicDropdowns = document.querySelectorAll('[data-dynamic-location="true"]');
        dynamicDropdowns.forEach(dropdown => {
            const cities = countryCities[country] || countryCities['uae'];
            const includeAll = dropdown.getAttribute('data-include-all') === 'true';

            dropdown.innerHTML = ''; // Clear current options

            if (includeAll) {
                const allOpt = document.createElement('option');
                allOpt.value = `all_${country}`;
                const prefix = lang === 'ar' ? 'كل ' : 'All ';
                allOpt.textContent = prefix + countryName;
                allOpt.setAttribute('data-translate', `all_${country}`); // Optional: for future use
                dropdown.appendChild(allOpt);
            }

            cities.forEach(cityKey => {
                const opt = document.createElement('option');
                opt.value = cityKey;
                opt.textContent = translations[lang][cityKey] || translations['en'][cityKey] || cityKey;
                opt.setAttribute('data-translate', cityKey);
                dropdown.appendChild(opt);
            });
        });
    }

    window.setCountry = function (country, flag, name) {
        if (currentCountryFlag) currentCountryFlag.textContent = flag;

        window.selectedCountry = country;
        localStorage.setItem('selectedCountry', country);
        localStorage.setItem('selectedCountryFlag', flag);
        localStorage.setItem('selectedCountryName', name);

        window.updateDynamicContent(window.selectedCountry, window.currentLang);
    }

    if (countryOptions.length > 0) {
        countryOptions.forEach(opt => {
            opt.addEventListener('click', (e) => {
                e.preventDefault();
                const country = opt.getAttribute('data-country') || 'uae';
                const flag = opt.getAttribute('data-flag');
                const name = opt.getAttribute('data-name');
                setCountry(country, flag, name);
            });
        });

        // Initialize from storage or defaults
        const storedCountry = localStorage.getItem('selectedCountry') || 'uae';
        const storedFlag = localStorage.getItem('selectedCountryFlag') || '🇦🇪';
        const storedName = localStorage.getItem('selectedCountryName') || 'uae';
        window.setCountry(storedCountry, storedFlag, storedName);
    }

    // --- Language Switching Logic ---
    const langBtn = document.getElementById('lang-toggle');

    window.updateLanguage = function (lang) {
        const htmlToUpdate = document.documentElement;
        // Update direction and font
        if (lang === 'ar') {
            htmlToUpdate.setAttribute('dir', 'rtl');
            htmlToUpdate.setAttribute('lang', 'ar');
            if (langBtn) langBtn.textContent = 'English';
        } else {
            htmlToUpdate.setAttribute('dir', 'ltr');
            htmlToUpdate.setAttribute('lang', 'en');
            if (langBtn) langBtn.textContent = 'عربي';
        }

        // Save preference
        localStorage.setItem('lang', lang);
        window.currentLang = lang;

        // Update text content for elements with data-translate key
        const elementsToTranslate = document.querySelectorAll('[data-translate]');
        elementsToTranslate.forEach(el => {
            const key = el.getAttribute('data-translate');
            if (translations[lang][key]) {
                if ((el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && el.getAttribute('placeholder')) {
                    el.setAttribute('placeholder', translations[lang][key]);
                } else {
                    // Specific logic for user button text
                    if (el.id === 'user-btn-text' && localStorage.getItem('token')) {
                        const user = JSON.parse(localStorage.getItem('user'));
                        el.textContent = user ? user.name : translations[lang][key];
                    } else {
                        el.innerHTML = translations[lang][key];
                    }
                }
            }
        });

        // Update dynamic content (currencies, locations) when language changes
        if (window.updateDynamicContent) {
            window.updateDynamicContent(window.selectedCountry, window.currentLang);
        }
    }

    if (langBtn) {
        langBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const newLang = window.currentLang === 'en' ? 'ar' : 'en';
            window.updateLanguage(newLang);
        });

        // Initialize on load
        window.updateLanguage(window.currentLang);
    }

    // --- Dark Mode Logic ---
    const themeBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    let isDark = localStorage.getItem('theme') === 'dark';

    function updateTheme(dark) {
        if (dark) {
            htmlToUpdate.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            // Change Icon to Sun
            if (themeIcon) themeIcon.innerHTML = `<svg class="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>`;
        } else {
            htmlToUpdate.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            // Change Icon to Moon
            if (themeIcon) themeIcon.innerHTML = `<svg class="w-5 h-5 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>`;
        }
    }

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            isDark = !isDark;
            updateTheme(isDark);
        });
        // Init
        updateTheme(isDark);
    }

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
    function updateAuthState() {
        const user = JSON.parse(localStorage.getItem('user'));
        const token = localStorage.getItem('token');

        // Find the user dropdown - look for the one containing relevant links
        const allDropdowns = document.querySelectorAll('.absolute, div[class*="absolute"]');
        let userDropdown = null;
        allDropdowns.forEach(d => {
            // Check for any of the common user-related translation keys
            if (d.querySelector('[data-translate="myProfile"]') ||
                d.querySelector('[data-translate="login"]') ||
                d.querySelector('[data-translate="myDashboard"]')) {

                // Ensure it's inside a header action area (heuristic)
                if (d.closest('.header-actions') || d.closest('.relative.group')) {
                    userDropdown = d;
                }
            }
        });

        if (token && user) {
            // User is logged in
            // Update User Dropdown with profile info and logout
            if (userDropdown) {
                userDropdown.innerHTML = `
                    <div class="px-4 py-3 border-b dark:border-gray-700">
                        <p class="text-sm font-bold text-gray-900 dark:text-white">${user.name}</p>
                        <p class="text-xs text-gray-500 truncate">${user.email}</p>
                    </div>
                    <a href="profile.html" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-accent font-bold" data-translate="myProfile">My Profile</a>
                    <a href="dashboard.html" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-accent" data-translate="myDashboard">My Dashboard</a>
                    <a href="favorites.html" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-accent" data-translate="myFavorites">My Favorites</a>
                    <div class="border-t dark:border-gray-700 my-1"></div>
                    <a href="#" class="logout-action-btn block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 font-bold" data-translate="logout">Logout</a>
                `;
            }

            // Update user button label if it exists
            const userBtnText = document.getElementById('user-btn-text');
            if (userBtnText && user) {
                userBtnText.textContent = user.name;
            }
        } else {
            // User is NOT logged in
            if (userDropdown) {
                userDropdown.innerHTML = `
                    <a href="login.html" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-accent" data-translate="login">Log in</a>
                    <a href="login.html?mode=signup" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-accent" data-translate="createAccount">Sign Up</a>
                `;
            }

            // Ensure button text is "Log in"
            const userBtnText = document.getElementById('user-btn-text');
            if (userBtnText) {
                userBtnText.textContent = translations[window.currentLang].login || 'Log in';
                userBtnText.setAttribute('data-translate', 'login');
            }
        }

        // Re-apply translations for the new dynamic elements
        window.updateLanguage(window.currentLang);

        // Attach event listeners to all logout buttons (dynamic or static)
        const logoutBtns = document.querySelectorAll('#logout-btn, #logout-btn-header, #logout-btn-sidebar, #mobile-logout-btn, .logout-action-btn, [data-translate="logout"]');
        logoutBtns.forEach(btn => {
            // Avoid multiple listeners if function runs again
            btn.onclick = (e) => {
                e.preventDefault();
                if (window.apiClient) {
                    window.apiClient.logout();
                } else {
                    // Fallback if apiClient not initialized
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = 'login.html';
                }
            };
        });
    }

    updateAuthState();

    // --- Dynamic Ads Loading (Home Page) ---
    const adsContainer = document.querySelector('.featured-ads .grid');
    if (adsContainer && window.apiClient) {
        loadFeaturedAds(adsContainer);
        loadCategorySliders();
    }
});

async function loadFeaturedAds(container) {
    try {
        const response = await apiClient.getAds({ limit: 8 });
        const ads = response.data;

        if (ads.length === 0) return; // Keep static ads if none in DB

        container.innerHTML = ''; // Clear static ads
        ads.forEach(ad => {
            container.insertAdjacentHTML('beforeend', createAdCard(ad));
        });
    } catch (err) {
        console.error('Error loading ads:', err);
    }
}

function createAdCard(ad, isSlider = false) {
    const cardClass = isSlider
        ? "min-w-[280px] w-[280px] md:min-w-[320px] md:w-[320px] bg-white dark:bg-gray-800 rounded-xl shadow border dark:border-gray-700 snap-center flex-shrink-0 cursor-pointer"
        : "ad-card-main bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition group cursor-pointer";

    return `
        <div class="${cardClass}" onclick="window.location.href='ad-details.html?id=${ad.id}'">
            <div class="relative h-48 bg-gray-200 dark:bg-gray-700 overflow-hidden ${!isSlider ? 'rounded-t-xl' : ''}">
                <img src="${ad.images[0] || 'https://via.placeholder.com/300x200'}" alt="${ad.title}" class="w-full h-full object-cover transition duration-300 group-hover:scale-105">
                ${ad.status === 'active' ? '<div class="badge-featured absolute top-2 right-2 bg-accent text-white text-xs font-bold px-2 py-1 rounded">FEATURED</div>' : ''}
                <button class="wishlist-btn absolute bottom-2 right-2 bg-white dark:bg-gray-700 p-2 rounded-full shadow hover:text-red-500 transition" onclick="event.stopPropagation(); toggleFav(${ad.id}, this)">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                    </svg>
                </button>
            </div>
            <div class="p-4">
                <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">${ad.category}</div>
                <h3 class="font-bold text-lg text-gray-900 dark:text-white mb-2 truncate">${ad.title}</h3>
                <div class="font-bold text-accent text-xl mb-2">${ad.price} <span class="currency-label">AED</span></div>
                <div class="flex items-center text-gray-500 dark:text-gray-400 text-sm">
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    </svg>
                    <span>${ad.city}</span>
                </div>
            </div>
        </div>
    `;
}

async function loadCategorySliders() {
    const configs = [
        { category: 'Motors', sliderId: 'motors-electronics-slider' }, // Using the first tab for demo
        { category: 'Electronics', sliderId: 'motors-electronics-slider' }, // Reusing for electronics
        { category: 'Mobiles', sliderId: 'motors-mobiles-slider' },
        { category: 'Property', sliderId: 'property-sale-slider' },
        { category: 'Furniture', sliderId: 'classifieds-furniture-slider' }
    ];

    for (const config of configs) {
        const slider = document.getElementById(config.sliderId);
        if (slider) {
            try {
                const response = await apiClient.getAds({ category: config.category, limit: 10 });
                const ads = response.data;
                if (ads.length > 0) {
                    // Only clear if we have data to replace with
                    if (!slider.hasAttribute('data-loaded')) {
                        slider.innerHTML = '';
                        slider.setAttribute('data-loaded', 'true');
                    }
                    ads.forEach(ad => {
                        slider.insertAdjacentHTML('beforeend', createAdCard(ad, true));
                    });
                }
            } catch (err) {
                console.warn(`Failed to load slider for ${config.category}:`, err);
            }
        }
    }
}

window.toggleFav = async function (adId, btn) {
    if (!localStorage.getItem('token')) {
        window.location.href = 'login.html';
        return;
    }
    try {
        const res = await apiClient.toggleFavorite(adId);
        const svg = btn.querySelector('svg');
        if (res.isFavorite) {
            svg.setAttribute('fill', 'currentColor');
            svg.classList.add('text-red-500');
        } else {
            svg.setAttribute('fill', 'none');
            svg.classList.remove('text-red-500');
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
function initChatWidget() {
    const lang = localStorage.getItem('lang') || 'en';
    const widgetHtml = `
        <div class="chat-widget" id="chatWidget">
            <div class="chat-window" id="chatWindow">
                <div class="chat-header">
                    <span class="font-bold" data-translate="chatSupport">${translations[lang].chatSupport}</span>
                    <button id="closeChat" class="text-white hover:text-gray-300">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                <div class="chat-messages" id="chatMessages">
                    <div class="message support" data-translate="chatWelcome">${translations[lang].chatWelcome}</div>
                </div>
                <div class="chat-input-area">
                    <input type="text" id="chatInput" class="chat-input" placeholder="${translations[lang].chatPlaceholder}" data-translate="chatPlaceholder">
                    <button id="sendMessage" class="chat-send">
                        <svg class="w-5 h-5 transform rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                        </svg>
                    </button>
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
    const messages = document.getElementById('chatMessages');

    if (toggle) {
        toggle.addEventListener('click', () => {
            windowChat.classList.toggle('active');
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            windowChat.classList.remove('active');
        });
    }

    function addMessage(text, type) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${type}`;
        msgDiv.textContent = text;
        messages.appendChild(msgDiv);
        messages.scrollTop = messages.scrollHeight;
    }

    function handleSend() {
        const text = input.value.trim();
        if (text) {
            addMessage(text, 'user');
            input.value = '';

            // Simulate support response
            setTimeout(() => {
                const currentLang = localStorage.getItem('lang') || 'en';
                const response = currentLang === 'ar' ? 'شكراً لتواصلك معنا. سنرد عليك في أقرب وقت ممكن.' : 'Thank you for reaching out. We will get back to you shortly.';
                addMessage(response, 'support');
            }, 1000);
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
