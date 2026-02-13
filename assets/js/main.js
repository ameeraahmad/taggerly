// Language Dictionary
const translations = {
    en: enTranslations,
    ar: arTranslations
};

document.addEventListener('DOMContentLoaded', () => {
    // Language Switching Logic
    const htmlToUpdate = document.documentElement;

    // --- Country & Currency Dropdown Logic ---
    const countryOptions = document.querySelectorAll('.country-option');
    const currentCountryFlag = document.getElementById('current-country-flag');
    const currentCountryName = document.getElementById('current-country-name');
    let selectedCountry = localStorage.getItem('selectedCountry') || 'uae';
    let currentLang = localStorage.getItem('lang') || 'en';

    function updateDynamicContent(country, lang) {
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

    function setCountry(country, flag, name) {
        if (currentCountryFlag) currentCountryFlag.textContent = flag;

        selectedCountry = country;
        localStorage.setItem('selectedCountry', country);
        localStorage.setItem('selectedCountryFlag', flag);
        localStorage.setItem('selectedCountryName', name);

        updateDynamicContent(selectedCountry, currentLang);
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
        setCountry(storedCountry, storedFlag, storedName);
    }

    // --- Language Switching Logic ---
    const langBtn = document.getElementById('lang-toggle');

    function updateLanguage(lang) {
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
        currentLang = lang;

        // Update text content for elements with data-translate key
        const elementsToTranslate = document.querySelectorAll('[data-translate]');
        elementsToTranslate.forEach(el => {
            const key = el.getAttribute('data-translate');
            if (translations[lang][key]) {
                if ((el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && el.getAttribute('placeholder')) {
                    el.setAttribute('placeholder', translations[lang][key]);
                } else {
                    el.innerHTML = translations[lang][key];
                }
            }
        });

        // Update dynamic content (currencies, locations) when language changes
        updateDynamicContent(selectedCountry, currentLang);
    }

    if (langBtn) {
        langBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const newLang = currentLang === 'en' ? 'ar' : 'en';
            updateLanguage(newLang);
        });

        // Initialize on load
        updateLanguage(currentLang);
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
});

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
    document.addEventListener('DOMContentLoaded', initChatWidget);
} else {
    initChatWidget();
}
