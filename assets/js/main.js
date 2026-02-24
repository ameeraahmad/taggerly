// Language Dictionary
const translations = {
    en: enTranslations,
    ar: arTranslations
};

document.addEventListener('DOMContentLoaded', () => {
    const htmlToUpdate = document.documentElement;

    // --- Global Search Logic ---
    const searchInputs = document.querySelectorAll('.search-input');
    searchInputs.forEach(input => {
        const btn = input.nextElementSibling;
        const handleSearch = () => {
            const query = input.value.trim();
            if (query) {
                window.location.href = `search.html?search=${encodeURIComponent(query)}`;
            }
        };
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSearch();
        });
        if (btn && (btn.tagName === 'BUTTON' || btn.querySelector('svg'))) {
            btn.onclick = (e) => {
                e.preventDefault();
                handleSearch();
            };
        }
    });

    // --- Email Verification Check ---
    const urlParams = new URLSearchParams(window.location.search);
    const verifiedStatus = urlParams.get('verified');
    if (verifiedStatus === 'success') {
        const lang = window.currentLang || 'en';
        alert(translations[lang].emailVerified || 'Email verified successfully!');
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
        alert(translations[lang].invalidToken || 'Invalid or expired verification link');
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // --- Country & Currency Dropdown Logic ---
    const countryOptions = document.querySelectorAll('.country-option');
    const currentCountryFlag = document.getElementById('current-country-flag');
    const currentCountryName = document.getElementById('current-country-name');
    window.selectedCountry = localStorage.getItem('selectedCountry') || 'uae';
    window.currentLang = localStorage.getItem('lang') || 'en';

    // --- Socket.io Global Initialization & Notifications ---
    if (typeof io !== 'undefined') {
        const user = JSON.parse(localStorage.getItem('user'));
        const token = localStorage.getItem('token');
        if (user && user.id && token) {
            if (!window.socket) {
                window.socket = io();
                window.socket.emit('join_user', user.id);
            }

            window.socket.on('new_message_notification', (msg) => {
                // Refresh badges
                if (window.refreshUnreadCount) window.refreshUnreadCount();

                // Play notification sound
                playNotificationSound();

                // Show Toast if NOT on messages.html or not in current chat
                const isMessagesPage = window.location.pathname.includes('messages.html');
                const isInActiveConvo = isMessagesPage && (typeof currentConversationId !== 'undefined') && (window.currentConversationId == msg.conversationId);

                if (!isInActiveConvo) {
                    showNotificationToast(msg);
                }
            });

            window.socket.on('user_status_change', (data) => {
                // Update UI elements that track specific user status
                // This could be used in messages.html or ad-details.html
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
        }
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

    function showNotificationToast(msg) {
        const existingToasts = document.querySelectorAll('.notification-toast');
        existingToasts.forEach(t => t.remove());

        const toast = document.createElement('div');
        toast.className = 'notification-toast fixed bottom-4 right-4 bg-white dark:bg-gray-800 border dark:border-gray-700 text-gray-900 dark:text-gray-100 p-4 rounded-2xl shadow-2xl z-[100] flex items-center gap-4 animate-slide-up max-w-sm cursor-pointer border-l-4 border-l-accent rtl:border-l-0 rtl:border-r-4 rtl:border-r-accent';
        toast.innerHTML = `
            <div class="w-10 h-10 bg-accent rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                </svg>
            </div>
            <div class="flex-grow overflow-hidden">
                <p class="text-xs text-accent font-bold uppercase tracking-tight" data-translate="newMessage">New Message</p>
                <p class="text-sm font-medium truncate">${msg.message}</p>
            </div>
            <button class="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1">&times;</button>
        `;

        toast.onclick = () => window.location.href = `messages.html?conversationId=${msg.conversationId}`;
        toast.querySelector('button').onclick = (e) => {
            e.stopPropagation();
            toast.remove();
        };

        document.body.appendChild(toast);
        if (window.translatePage) window.translatePage();

        // Auto remove after 6 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.add('opacity-0', 'translate-y-4');
                toast.style.transition = 'all 0.5s ease-out';
                setTimeout(() => toast.remove(), 500);
            }
        }, 6000);
    }

    window.updateDynamicContent = function (country, lang) {
        const countryName = translations[lang][country] || translations['en'][country] || country;

        const countryCities = {
            uae: ['dubai', 'abuDhabi', 'sharjah', 'ajman'],
            egypt: ['cairo', 'alexandria', 'giza', 'sharm'],
            ksa: ['riyadh', 'jeddah', 'dammam', 'mecca'],
            qatar: ['doha', 'wakrah', 'rayyan', 'khor']
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

        // --- 3. Update City Labels ---
        const cityLabels = document.querySelectorAll('.city-label');
        const cityKey = `city_${country}`;
        const cityName = translations[lang][cityKey] || translations['en'][cityKey] || (country === 'uae' ? "Dubai" : "");
        cityLabels.forEach(el => el.textContent = cityName);

        // --- 4. Update Header Country Name ---
        const currentCountryName = document.getElementById('current-country-name');
        if (currentCountryName) {
            currentCountryName.textContent = countryName;
            currentCountryName.setAttribute('data-translate', country);
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
            dropdown.innerHTML = '';
            if (includeAll) {
                const allOpt = document.createElement('option');
                allOpt.value = `all_${country}`;
                allOpt.textContent = (lang === 'ar' ? 'كل ' : 'All ') + countryName;
                dropdown.appendChild(allOpt);
            }
            cities.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c;
                opt.textContent = translations[lang][c] || translations['en'][c] || c;
                opt.setAttribute('data-translate', c);
                dropdown.appendChild(opt);
            });
        });
    };

    window.detectLocation = function () {
        const btn = document.getElementById('detect-location-btn');
        const lang = window.currentLang || 'en';
        if (!navigator.geolocation) {
            alert(translations[lang].locationError || 'Geolocation not supported');
            return;
        }

        const span = btn?.querySelector('span');
        const originalText = span ? span.textContent : '';
        if (span) span.textContent = translations[lang].detecting;
        if (btn) btn.disabled = true;

        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=${lang}`);
                const data = await response.json();
                const city = data.address.city || data.address.town || data.address.suburb || data.address.state;
                const countryCode = data.address?.country_code?.toLowerCase();

                // Map country code to our keys
                const countryMap = { 'ae': 'uae', 'eg': 'egypt', 'sa': 'ksa', 'qa': 'qatar' };
                const detectedCountry = countryMap[countryCode];

                if (detectedCountry && detectedCountry !== window.selectedCountry) {
                    // Ask user to switch 
                    const switchConfirm = confirm(lang === 'ar' ? `هل تود الانتقال إلى موقعنا في ${data.address.country}؟` : `Would you like to switch to our ${data.address.country} site?`);
                    if (switchConfirm) {
                        const flags = { 'uae': '🇦🇪', 'egypt': '🇪🇬', 'ksa': '🇸🇦', 'qatar': '🇶🇦' };
                        window.setCountry(detectedCountry, flags[detectedCountry], data.address.country);
                    }
                }

                if (city) {
                    alert(`${translations[lang].locationActive}: ${city}`);
                    window.location.href = `search.html?search=${encodeURIComponent(city)}`;
                } else {
                    alert(translations[lang].locationError);
                }
            } catch (err) {
                console.error('Location detection failed:', err);
                alert(translations[lang].locationError);
            } finally {
                if (span) span.textContent = originalText;
                if (btn) btn.disabled = false;
            }
        }, (err) => {
            alert(translations[lang].locationDenied);
            if (span) span.textContent = originalText;
            if (btn) btn.disabled = false;
        });
    };

    window.setCountry = function (country, flag, name) {
        // currentCountryFlag is defined inside DOMContentLoaded, so it might be null here.
        // Re-querying it or making it global would be a more robust solution.
        // For now, assuming it's accessible or initCountryDropdown handles it.
        const currentCountryFlag = document.getElementById('current-country-flag');
        if (currentCountryFlag) currentCountryFlag.textContent = flag;

        window.selectedCountry = country;
        localStorage.setItem('selectedCountry', country);
        localStorage.setItem('selectedCountryFlag', flag);
        localStorage.setItem('selectedCountryName', name);

        window.updateDynamicContent(window.selectedCountry, window.currentLang);
    }

    window.initCountryDropdown = function () {
        const countryOptions = document.querySelectorAll('.country-option');
        const currentCountryFlag = document.getElementById('current-country-flag');
        const currentCountryName = document.getElementById('current-country-name');

        if (countryOptions.length > 0) {
            countryOptions.forEach(opt => {
                // Remove existing to avoid duplicates if re-initialized
                opt.onclick = (e) => {
                    e.preventDefault();
                    const country = opt.getAttribute('data-country') || 'uae';
                    const flag = opt.getAttribute('data-flag');
                    const name = opt.getAttribute('data-name');
                    window.setCountry(country, flag, name);
                };
            });

            // Initialize from storage or defaults
            const storedCountry = localStorage.getItem('selectedCountry') || 'uae';
            const storedFlag = localStorage.getItem('selectedCountryFlag') || '🇦🇪';
            const storedName = localStorage.getItem('selectedCountryName') || 'uae';
            window.setCountry(storedCountry, storedFlag, storedName);
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

        const notifWrapper = document.getElementById('notif-wrapper');

        if (token && user) {
            // User is logged in
            if (notifWrapper) notifWrapper.classList.remove('hidden');
            loadNotifications();

            if (!user.isEmailVerified) {
                showVerificationBanner(user);
            } else {
                const banner = document.getElementById('verification-banner');
                if (banner) banner.remove();
            }

            if (userDropdown) {
                let dropdownHtml = `
                    <a href="profile.html" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-accent font-bold" data-translate="myProfile">My Profile</a>
                    <div class="border-t dark:border-gray-700 my-1"></div>
                    <a href="dashboard.html" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-accent" data-translate="myDashboard">My Dashboard</a>
                `;

                // Add Admin Panel link if user is admin
                if (user.role === 'admin') {
                    dropdownHtml += `
                        <a href="admin.html" class="block px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 font-bold border-l-4 border-blue-600" data-translate="adminPanel">Admin Panel</a>
                    `;
                }

                dropdownHtml += `
                    <a href="messages.html" class="flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-accent" data-translate="messages">
                        <span>Messages</span>
                        <span class="unread-badge bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full hidden">0</span>
                    </a>
                    <a href="favorites.html" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-accent" data-translate="myFavorites">My Favorites</a>
                    <a href="plans.html" class="block px-4 py-2 text-sm text-orange-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-accent font-bold" data-translate="plansTitle">Pricing Plans</a>
                    <div class="border-t dark:border-gray-700 my-1"></div>
                    <a href="#" class="logout-action-btn block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 font-bold" data-translate="logout">Logout</a>
                `;
                userDropdown.innerHTML = dropdownHtml;
            }

            const userBtnText = document.getElementById('user-btn-text');
            if (userBtnText) {
                userBtnText.textContent = user.name;
            }
        } else {
            // User is NOT logged in
            if (notifWrapper) notifWrapper.classList.add('hidden');
            const banner = document.getElementById('verification-banner');
            if (banner) banner.remove();

            if (userDropdown) {
                userDropdown.innerHTML = `
                    <a href="login.html" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-accent" data-translate="login">Log in</a>
                    <a href="login.html?mode=signup" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-accent" data-translate="createAccount">Sign Up</a>
                    <div class="border-t dark:border-gray-700 my-1"></div>
                    <a href="plans.html" class="block px-4 py-2 text-sm text-orange-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-accent font-bold" data-translate="plansTitle">Pricing Plans</a>
                `;
            }

            const userBtnText = document.getElementById('user-btn-text');
            if (userBtnText) {
                userBtnText.textContent = translations[window.currentLang].login || 'Log in';
                userBtnText.setAttribute('data-translate', 'login');
            }
        }


        // --- Mobile Menu Refresh ---
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu) {
            const menuContent = mobileMenu.querySelector('.space-y-1');
            if (menuContent) {
                if (token && user) {
                    menuContent.innerHTML = `
                        <a href="profile.html" data-translate="myProfile" class="block px-3 py-2 rounded-md text-base font-medium text-accent hover:bg-gray-50 dark:hover:bg-gray-700">My Profile</a>
                        <a href="categories.html" data-translate="mobileMenuCategories" class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-accent hover:bg-gray-50 dark:hover:bg-gray-700">Categories</a>
                        <a href="search.html" data-translate="mobileMenuForSale" class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-accent hover:bg-gray-50 dark:hover:bg-gray-700">For Sale</a>
                        <a href="dashboard.html" data-translate="myDashboard" class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-accent hover:bg-gray-50 dark:hover:bg-gray-700">My Dashboard</a>
                        ${user.role === 'admin' ? '<a href="admin.html" data-translate="adminPanel" class="block px-3 py-2 rounded-md text-base font-bold text-blue-600 bg-blue-50 dark:bg-gray-700/50 border-l-4 border-blue-600">Admin Panel</a>' : ''}
                        <a href="messages.html" data-translate="messages" class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-accent hover:bg-gray-50 dark:hover:bg-gray-700">Messages</a>
                        <a href="#" class="logout-action-btn block px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-gray-50 dark:hover:bg-gray-700" data-translate="logout">Logout</a>
                        <a href="post-ad.html" data-translate="mobileMenuPostAd" class="block px-3 py-2 mt-4 text-center text-white bg-accent rounded-md font-bold">Post an Ad</a>
                    `;
                } else {
                    menuContent.innerHTML = `
                        <a href="categories.html" data-translate="mobileMenuCategories" class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-accent hover:bg-gray-50 dark:hover:bg-gray-700">Categories</a>
                        <a href="search.html" data-translate="mobileMenuForSale" class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-accent hover:bg-gray-50 dark:hover:bg-gray-700">For Sale</a>
                        <a href="login.html" data-translate="mobileMenuLogin" class="block px-3 py-2 rounded-md text-base font-medium text-primary dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700">Log in / Sign up</a>
                        <a href="post-ad.html" data-translate="mobileMenuPostAd" class="block px-3 py-2 mt-4 text-center text-white bg-accent rounded-md font-bold">Post an Ad</a>
                    `;
                }

            }
        }


        // Re-apply translations for the new dynamic elements
        window.updateLanguage(window.currentLang);

    }

    updateAuthState();
    refreshUnreadCount();
    // Refresh unread count every 30 seconds
    setInterval(refreshUnreadCount, 30000);

    // --- Dynamic Ads Loading (Home Page) ---
    const adsContainer = document.querySelector('.featured-ads .grid');
    if (adsContainer && window.apiClient) {
        populateAdsGrid(adsContainer);
        loadCategorySliders();
    }

    async function populateAdsGrid(container) {
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
                <h3 class="font-bold text-lg text-gray-900 dark:text-white mb-2 truncate flex items-center gap-1">
                    <span>${ad.title}</span>
                    ${ad.user && ad.user.isEmailVerified ? `
                        <svg class="w-4 h-4 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                        </svg>
                    ` : ''}
                </h3>
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
            { category: 'Motors', sliderId: 'motors-used-slider' },
            { category: 'Motors', sliderId: 'motors-bikes-slider' },
            { category: 'Electronics', sliderId: 'motors-electronics-slider' },
            { category: 'Mobiles', sliderId: 'motors-mobiles-slider' },
            { category: 'Property', sliderId: 'prop-sale-slider' },
            { category: 'Property', sliderId: 'prop-rent-slider' },
            { category: 'Furniture', sliderId: 'classifieds-furniture-slider' },
            { category: 'Classifieds', sliderId: 'classifieds-hobbies-slider' }
        ];

        // Load Featured Ads first
        await loadFeaturedAds();

        for (const config of configs) {
            const slider = document.getElementById(config.sliderId);
            if (slider) {
                try {
                    const response = await apiClient.getAds({ category: config.category, limit: 12 });
                    const ads = response.data;
                    if (ads.length > 0) {
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

    async function loadFeaturedAds() {
        const slider = document.getElementById('featured-ads-slider');
        const section = document.getElementById('featured-ads-section');
        if (!slider) return;

        try {
            const response = await apiClient.getAds({ isFeatured: true, limit: 12 });
            const ads = response.data;
            if (ads.length > 0) {
                section.classList.remove('hidden');
                slider.innerHTML = '';
                ads.forEach(ad => {
                    slider.insertAdjacentHTML('beforeend', createAdCard(ad, true));
                });
            }
        } catch (err) {
            console.warn('Failed to load featured ads:', err);
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
        <div class="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer ${!n.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}" onclick="handleNotifClick(${n.id}, '${n.link}')">
            <p class="text-sm font-bold text-gray-900 dark:text-white">${n.title}</p>
            <p class="text-xs text-gray-600 dark:text-gray-400 mt-0.5">${n.message}</p>
            <p class="text-[10px] text-gray-400 mt-1">${new Date(n.createdAt).toLocaleString()}</p>
        </div>
    `).join('');
    }

    window.handleNotifClick = async function (id, link) {
        try {
            await apiClient.fetch(`/notifications/${id}/read`, { method: 'PUT' });
            if (link) window.location.href = link;
            else loadNotifications();
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
        });
    }
});
