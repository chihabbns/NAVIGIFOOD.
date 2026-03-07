// Main JavaScript File

document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initThemeToggle();   // Dark mode toggle
    fetchGlobalSearchItems(); // Prefetch items for search bar
    initHomePage();
    initBrowsePage();
    initDetailsPage();
    initCategoryPages();
    initSearchSuggestions();
    checkAuth();
});

async function fetchGlobalSearchItems() {
    if (window.supabaseClient) {
        try {
            const { data } = await window.supabaseClient
                .from('food_items')
                .select('*, profiles(name)')
                .eq('status', 'available');
            
            if (data) {
                window.globalSearchItems = data.map(item => ({
                    ...item,
                    donor: item.merchant_name || (item.profiles ? item.profiles.name : 'Unknown Provider')
                }));
            }
        } catch(e) {}
    }
}

/* ================================================================
   DARK MODE — Theme Toggle
   The anti-flash inline script (in each HTML <head>) runs FIRST
   to set data-theme before the page paints.
   This function wires the button behaviour after DOM is ready.
   ================================================================ */
function initThemeToggle() {
    const btn  = document.getElementById('theme-toggle');
    const html = document.documentElement;

    if (!btn) return;

    // Sync aria-pressed with current theme on load
    function syncBtn() {
        const isDark = html.getAttribute('data-theme') === 'dark';
        btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    }
    syncBtn();

    btn.addEventListener('click', () => {
        const isDark = html.getAttribute('data-theme') === 'dark';
        const next   = isDark ? 'light' : 'dark';

        // Apply theme to <html> element
        html.setAttribute('data-theme', next);

        // Persist preference
        try { localStorage.setItem('theme', next); } catch(e) {}

        // Update accessibility attribute
        btn.setAttribute('aria-pressed', next === 'dark' ? 'true' : 'false');

        // Trigger 360deg spin animation
        btn.classList.remove('spinning');
        void btn.offsetWidth; // force reflow — restarts animation
        btn.classList.add('spinning');
        btn.addEventListener('animationend', () => {
            btn.classList.remove('spinning');
        }, { once: true });
    });

    // iOS Safari: ensure Space key works on buttons inside nav
    btn.addEventListener('keydown', e => {
        if (e.key === ' ') { e.preventDefault(); btn.click(); }
    });
}


function initSearchSuggestions() {
    const searchInputs = document.querySelectorAll('.search-input');
    let selectedIndex = -1;

    
    searchInputs.forEach(input => {
        let suggestionsContainer = input.parentElement.querySelector('.search-suggestions');
        if (!suggestionsContainer) {
            suggestionsContainer = document.createElement('div');
            suggestionsContainer.className = 'search-suggestions';
            input.parentElement.appendChild(suggestionsContainer);
        }

        const closeSuggestions = () => {
            suggestionsContainer.classList.remove('active');
            selectedIndex = -1;
        };

        input.addEventListener('focus', () => {
            if (input.value.trim().length === 0) {
                showPopularSearches(suggestionsContainer);
            } else {
                input.dispatchEvent(new Event('input'));
            }
        });

        input.addEventListener('input', (e) => {
            const term = e.target.value.trim().toLowerCase();
            selectedIndex = -1;
            
            if (term.length === 0) {
                showPopularSearches(suggestionsContainer);
                return;
            }

            const searchTarget = window.globalSearchItems || [];
            if (searchTarget.length === 0) return;

            // Logic: Group by category
            const results = {
                dishes: searchTarget.filter(item => item.title.toLowerCase().includes(term))
                        .map(item => ({ text: item.title, icon: 'fas fa-utensils', meta: 'Dish' })),
                donors: searchTarget.filter(item => item.donor.toLowerCase().includes(term))
                        .map(item => ({ text: item.donor, icon: 'fas fa-store', meta: 'Merchant' })),
                places: searchTarget.filter(item => item.location.toLowerCase().includes(term))
                        .map(item => ({ text: item.location, icon: 'fas fa-map-marker-alt', meta: 'Location' }))
            };

            // Remove duplicates within groups
            results.dishes = Array.from(new Set(results.dishes.map(r => r.text))).map(text => results.dishes.find(r => r.text === text)).slice(0, 4);
            results.donors = Array.from(new Set(results.donors.map(r => r.text))).map(text => results.donors.find(r => r.text === text)).slice(0, 2);
            results.places = Array.from(new Set(results.places.map(r => r.text))).map(text => results.places.find(r => r.text === text)).slice(0, 2);

            renderSuggestions(suggestionsContainer, results, term);
        });

        input.addEventListener('keydown', (e) => {
            const items = suggestionsContainer.querySelectorAll('.suggestion-item');
            if (!suggestionsContainer.classList.contains('active') || items.length === 0) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedIndex = (selectedIndex + 1) % items.length;
                updateSelection(items);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedIndex = (selectedIndex - 1 + items.length) % items.length;
                updateSelection(items);
            } else if (e.key === 'Enter' && selectedIndex > -1) {
                e.preventDefault();
                items[selectedIndex].click();
            } else if (e.key === 'Escape') {
                closeSuggestions();
            }
        });

        document.addEventListener('click', (e) => {
            if (!input.parentElement.contains(e.target)) closeSuggestions();
        });
    });

    function updateSelection(items) {
        items.forEach((item, index) => {
            if (index === selectedIndex) {
                item.classList.add('selected');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('selected');
            }
        });
    }
}

function showPopularSearches(container) {
    const searchTarget = window.globalSearchItems || [];
    if (searchTarget.length === 0) return;
    
    // Popular = just some first items
    const popular = {
        dishes: searchTarget.slice(0, 3).map(item => ({ text: item.title, icon: 'fas fa-fire', meta: 'Trending' })),
        places: [...new Set(searchTarget.map(i => i.location))].slice(0, 2).map(loc => ({ text: loc, icon: 'fas fa-map-pin', meta: 'Nearby' }))
    };

    renderSuggestions(container, popular, "", "Popular Searches");
}

function renderSuggestions(container, groups, term, customTitle = null) {
    let html = '';
    let totalResults = 0;

    for (const [key, items] of Object.entries(groups)) {
        if (items.length > 0) {
            totalResults += items.length;
            const groupTitle = customTitle || key.charAt(0).toUpperCase() + key.slice(1);
            html += `<div class="suggestion-group-title">${groupTitle}</div>`;
            items.forEach(item => {
                const highlighted = term ? item.text.replace(new RegExp(`(${term})`, 'gi'), '<b>$1</b>') : item.text;
                html += `
                    <div class="suggestion-item" onclick="selectSuggestion('${item.text}', this)">
                        <i class="${item.icon}"></i>
                        <div class="suggestion-content">
                            <span class="suggestion-text">${highlighted}</span>
                            <span class="suggestion-meta">${item.meta}</span>
                        </div>
                    </div>
                `;
            });
        }
    }

    if (totalResults > 0) {
        container.innerHTML = html;
        container.classList.add('active');
    } else if (term) {
        container.innerHTML = `
            <div class="search-no-results">
                <i class="fas fa-search"></i>
                <p>No results found for "<b>${term}</b>"</p>
                <small>Try searching for Pizza, Bakery, or Algiers</small>
            </div>
        `;
        container.classList.add('active');
    } else {
        container.classList.remove('active');
    }
}

window.selectSuggestion = function(text, el) {
    const container = el.closest('.search-container') || el.closest('.input-group');
    const input = container.querySelector('.search-input');
    const suggestions = container.querySelector('.search-suggestions');
    
    input.value = text;
    suggestions.classList.remove('active');
    
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        container.closest('form').submit();
    } else {
        const event = new Event('input', { bubbles: true });
        input.dispatchEvent(event);
    }
};

async function checkAuth() {
    if (!window.supabaseClient) return;

    const { data: { session } } = await window.supabaseClient.auth.getSession();
    const navLinks = document.getElementById('nav-links');
    
    if (session && navLinks) {
        // Target the last list item (usually the CTA button)
        const lastLi = navLinks.lastElementChild;
        
        if (lastLi) {
            lastLi.innerHTML = `
                <div style="display: flex; gap: 10px; align-items: center;">
                    <a href="dashboard.html" class="btn btn-primary btn-small" title="Manage your orders and listings">
                        <i class="fas fa-user"></i> My Account
                    </a>
                    <a href="#" class="btn btn-outline btn-small" onclick="logout(event)" title="Sign out">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </a>
                </div>
            `;
        }
    }
}

async function logout(e) {
    if(e) e.preventDefault();
    if (window.supabaseClient) {
        await window.supabaseClient.auth.signOut();
    }
    window.location.href = 'index.html';
}

function initMobileMenu() {
    const toggle = document.getElementById('mobile-toggle');
    const navLinks = document.getElementById('nav-links');

    if (toggle && navLinks) {
        toggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const icon = toggle.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }
}

async function initHomePage() {
    const categoryGrid = document.getElementById('category-grid');
    const featuredGrid = document.getElementById('featured-grid');

    // Render Categories
    if (categoryGrid && typeof categories !== 'undefined') {
        categoryGrid.innerHTML = categories.map(cat => `
            <div class="category-card" onclick="window.location.href='${cat.link}'">
                <i class="${cat.icon}"></i>
                <h3>${cat.name}</h3>
            </div>
        `).join('');
    }

    // Render Featured Items from Supabase
    if (featuredGrid && window.supabaseClient) {
        featuredGrid.innerHTML = '<p>Loading items...</p>';
        let dbItems = [];
        try {
            const { data, error } = await window.supabaseClient
                .from('food_items')
                .select('*')
                .eq('status', 'available')
                .order('created_at', { ascending: false })
                .limit(4);
            
            const { data: profilesData } = await window.supabaseClient.from('profiles').select('id, name');
            const profileMap = {};
            if (profilesData) {
                profilesData.forEach(p => profileMap[p.id] = p.name);
            }

            if (!error && data && data.length > 0) {
                dbItems = data.map(item => ({
                    id: item.id,
                    title: item.title,
                    type: item.type,
                    foodType: item.food_type,
                    price: item.price,
                    originalPrice: item.original_price,
                    location: item.location,
                    timeLeft: item.time_left,
                    image: item.image,
                    description: item.description,
                    promoted: item.promoted,
                    donor: profileMap[item.donor_id] || 'Unknown Provider'
                }));
            }
        } catch (err) {
            console.error(err);
        }
        
        const localItems = typeof foodItems !== 'undefined' ? foodItems : [];
        const allItems = [...dbItems, ...localItems];
        window.globalSearchItems = allItems;

        if (allItems.slice(0, 4).length > 0) {
            featuredGrid.innerHTML = allItems.slice(0, 4).map(item => createFoodCard(item)).join('');
        } else {
            featuredGrid.innerHTML = '<p>No items found.</p>';
        }
    }
}

async function initBrowsePage() {
    const browseGrid     = document.getElementById('browse-grid');
    const resultsCount   = document.getElementById('results-count');
    const priceRange     = document.getElementById('price-range');
    const priceLabel     = document.getElementById('price-label');
    const keywordInput   = document.getElementById('keyword-filter');
    const locationInput  = document.getElementById('location-filter');
    const sortSelect     = document.getElementById('sort-filter');
    const resetBtn       = document.getElementById('reset-filters');
    const catFilters     = document.querySelectorAll('.cat-filter');

    const foodTypeBtn    = document.getElementById('food-type-btn');
    const foodTypePopup  = document.getElementById('food-type-popup');
    const ftpClose       = document.getElementById('ftp-close');
    const ftpApply       = document.getElementById('ftp-apply');
    const ftpClear       = document.getElementById('ftp-clear');
    const ftCheckboxes   = document.querySelectorAll('.ft-checkbox');
    
    let activeFilters = [];
    let liveFoodItems = [];

    if (!browseGrid || !window.supabaseClient) return;

    // Fetch items from database
    let dbItems = [];
    try {
        const { data, error } = await window.supabaseClient
            .from('food_items')
            .select('*')
            .eq('status', 'available')
            .order('created_at', { ascending: false });
            
        const { data: profilesData } = await window.supabaseClient.from('profiles').select('id, name');
        const profileMap = {};
        if (profilesData) {
            profilesData.forEach(p => profileMap[p.id] = p.name);
        }

        if (!error && data) {
            dbItems = data.map(item => ({
                id: item.id,
                title: item.title,
                type: item.type,
                foodType: item.food_type,
                price: item.price,
                originalPrice: item.original_price,
                location: item.location,
                timeLeft: item.time_left,
                image: item.image,
                description: item.description,
                promoted: item.promoted,
                donor: item.merchant_name || profileMap[item.donor_id] || 'Unknown Provider'
            }));
        }
    } catch (err) {
        console.error("Supabase fetch error:", err);
    }

    const localItems = typeof foodItems !== 'undefined' ? foodItems : [];
    liveFoodItems = [...dbItems, ...localItems];
    window.globalSearchItems = liveFoodItems; // Export for global search

    // Check for URL params (category link or search from homepage)
    const urlParams      = new URLSearchParams(window.location.search);
    const categoryParam  = urlParams.get('category');
    const searchParam    = urlParams.get('search');

    // Pre-filter from URL: if a specific category is in URL, uncheck all others
    if (categoryParam) {
        catFilters.forEach(cb => {
            cb.checked = cb.value.toLowerCase() === categoryParam.toLowerCase();
        });
    }

    // Live price slider label
    if (priceRange && priceLabel) {
        priceRange.addEventListener('input', () => {
            priceLabel.textContent = Number(priceRange.value).toLocaleString() + ' DA';
            applyFilters();
        });
    }

    // Keyword filter
    if (keywordInput) {
        keywordInput.addEventListener('input', applyFilters);
        if (searchParam) {
            keywordInput.value = searchParam;
        }
    }

    // Location filter
    if (locationInput) {
        locationInput.addEventListener('input', applyFilters);
    }

    // Category checkboxes
    catFilters.forEach(cb => cb.addEventListener('change', applyFilters));

    // Sort
    if (sortSelect) sortSelect.addEventListener('change', applyFilters);

    // Food Type Popup Logic
    if (foodTypeBtn && foodTypePopup) {
        foodTypeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            foodTypePopup.classList.toggle('active');
        });

        if (ftpClose) {
            ftpClose.addEventListener('click', (e) => {
                e.stopPropagation(); // prevent closing wrapper logic from triggering if any issue
                foodTypePopup.classList.remove('active');
            });
        }

        document.addEventListener('click', (e) => {
            if (!foodTypePopup.contains(e.target) && !foodTypeBtn.contains(e.target)) {
                foodTypePopup.classList.remove('active');
            }
        });

        if (ftpApply) {
            ftpApply.addEventListener('click', (e) => {
                if(e) { e.preventDefault(); e.stopPropagation(); }
                activeFilters = Array.from(ftCheckboxes)
                    .filter(cb => cb.checked)
                    .map(cb => cb.value);
                
                if (activeFilters.length > 0) {
                    foodTypeBtn.classList.add('active-filter');
                } else {
                    foodTypeBtn.classList.remove('active-filter');
                }
                
                foodTypePopup.classList.remove('active');
                applyFilters();
            });
        }

        if (ftpClear) {
            ftpClear.addEventListener('click', (e) => {
                if(e) { e.preventDefault(); e.stopPropagation(); }
                ftCheckboxes.forEach(cb => cb.checked = false);
                activeFilters = [];
                foodTypeBtn.classList.remove('active-filter');
                foodTypePopup.classList.remove('active');
                applyFilters();
            });
        }
    }

    // Reset
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            catFilters.forEach(cb => cb.checked = true);
            if (priceRange)    { priceRange.value = priceRange.max; }
            if (priceLabel)    { priceLabel.textContent = Number(priceRange.max).toLocaleString() + ' DA'; }
            if (keywordInput)  { keywordInput.value = ''; }
            if (locationInput) { locationInput.value = ''; }
            if (sortSelect)    { sortSelect.value = 'featured'; }
            
            // clear food type filter
            ftCheckboxes.forEach(cb => cb.checked = false);
            activeFilters = [];
            if (foodTypeBtn) foodTypeBtn.classList.remove('active-filter');
            
            applyFilters();
        });
    }

    // --- Core filter + sort function ---
    function applyFilters() {
        let items = [...liveFoodItems];

        // 1 — Category filter
        const checkedCats = Array.from(catFilters)
            .filter(cb => cb.checked)
            .map(cb => cb.value.toLowerCase());

        if (checkedCats.length > 0) {
            items = items.filter(item => checkedCats.includes(item.type.toLowerCase()));
        } else {
            items = []; // nothing checked = show nothing
        }

        // 1.5 — Type of Food filter (uses item.foodType field set in data.js)
        if (activeFilters && activeFilters.length > 0) {
            items = items.filter(item => activeFilters.includes(item.foodType));
        }

        // 2 — Keyword search (Title, Donor, or Location)
        if (keywordInput && keywordInput.value.trim()) {
            const term = keywordInput.value.trim().toLowerCase();
            items = items.filter(item => 
                item.title.toLowerCase().includes(term) || 
                item.donor.toLowerCase().includes(term) ||
                item.location.toLowerCase().includes(term)
            );
        }

        // 3 — Location filter
        if (locationInput && locationInput.value.trim()) {
            const term = locationInput.value.trim().toLowerCase();
            items = items.filter(item => item.location.toLowerCase().includes(term));
        }

        // 3 — Price filter
        if (priceRange) {
            const maxPrice = Number(priceRange.value);
            items = items.filter(item => item.price <= maxPrice);
        }

        // 4 — Sort
        const sortVal = sortSelect ? sortSelect.value : 'featured';
        switch (sortVal) {
            case 'price-asc':
                items.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                items.sort((a, b) => b.price - a.price);
                break;
            case 'discount':
                items.sort((a, b) => {
                    // Exclude free (price=0) from discount ranking — they'd always win at 100%
                    const dA = a.price > 0 ? (a.originalPrice - a.price) / a.originalPrice : -1;
                    const dB = b.price > 0 ? (b.originalPrice - b.price) / b.originalPrice : -1;
                    return dB - dA;
                });
                break;
            case 'savings':
                // Sort by absolute saving amount (originalPrice - price) in DA
                items.sort((a, b) => (b.originalPrice - b.price) - (a.originalPrice - a.price));
                break;
            case 'time':
                // Convert timeLeft to minutes for accurate comparison
                function toMinutes(timeLeft) {
                    const val = parseFloat(timeLeft);
                    if (isNaN(val)) return 99999;
                    if (timeLeft.includes('min'))  return val;           // e.g. "30 mins" → 30
                    if (timeLeft.includes('hour')) return val * 60;      // e.g. "1.5 hours" → 90
                    if (timeLeft.includes('day'))  return val * 1440;    // e.g. "2 days" → 2880
                    return 99999;
                }
                items.sort((a, b) => toMinutes(a.timeLeft) - toMinutes(b.timeLeft));
                break;
            default: // 'featured' — promoted first, then by discount %
                items.sort((a, b) => {
                    if (b.promoted !== a.promoted) return (b.promoted ? 1 : 0) - (a.promoted ? 1 : 0);
                    // Secondary: higher discount first
                    const dA = a.price > 0 ? (a.originalPrice - a.price) / a.originalPrice : 0;
                    const dB = b.price > 0 ? (b.originalPrice - b.price) / b.originalPrice : 0;
                    return dB - dA;
                });
        }

        // Update count
        if (resultsCount) resultsCount.textContent = items.length;

        // Render
        renderGrid(browseGrid, items);
    }

    // Initial render
    applyFilters();
}


function renderGrid(container, items) {
    if (items.length === 0) {
        container.innerHTML = '<p>No items found.</p>';
        return;
    }
    container.innerHTML = items.map(item => createFoodCard(item)).join('');
}

async function initDetailsPage() {
    const detailsContainer = document.getElementById('food-details-container');
    if (!detailsContainer) return;

    const urlParams = new URLSearchParams(window.location.search);
    const idParam = urlParams.get('id');
    if (!idParam) return;

    detailsContainer.innerHTML = '<div class="text-center p-20">Loading item details...</div>';

    let item = null;

    // Try to fetch from Supabase first
    if (window.supabaseClient) {
        try {
            const { data: dbData, error } = await window.supabaseClient
                .from('food_items')
                .select('*')
                .eq('id', idParam)
                .single();

            if (!error && dbData) {
                // Fetch donor name
                let donorName = 'Unknown Provider';
                const { data: profileData } = await window.supabaseClient
                    .from('profiles')
                    .select('name')
                    .eq('id', dbData.donor_id)
                    .single();
                
                if (profileData) donorName = profileData.name;

                item = {
                    id: dbData.id,
                    title: dbData.title,
                    type: dbData.type,
                    price: dbData.price,
                    originalPrice: dbData.original_price,
                    location: dbData.location,
                    timeLeft: dbData.time_left,
                    image: dbData.image,
                    description: dbData.description || 'No description provided.',
                    donor: donorName
                };
            }
        } catch (e) {
            console.error("Error fetching from Supabase:", e);
        }
    }

    // Fall back to local items if not found in db
    if (!item && typeof foodItems !== 'undefined' && foodItems.length > 0) {
        const numericId = parseInt(idParam);
        item = foodItems.find(i => i.id === numericId || String(i.id) === idParam);
    }
    
    if (item) {
        const discount = item.originalPrice > 0 ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100) : 0;
        
        document.title = `${item.title} - NavigiFood`;
        
        let safeTimeLeft = item.timeLeft || '';
        if (safeTimeLeft && !safeTimeLeft.includes('left') && !safeTimeLeft.includes('ينتهي')) {
            safeTimeLeft += ' left';
        }

        detailsContainer.innerHTML = `
            <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 40px;">
                <div>
                    <img src="${item.image}" class="img-fluid" style="width: 100%; border-radius: var(--radius-md); box-shadow: var(--shadow-md);" alt="${item.title}">
                </div>
                <div>
                    <span class="badge badge-${item.type.toLowerCase()}" style="font-size: 1rem; padding: 6px 12px;">${item.type}</span>
                    <h1 style="margin-top: 10px;">${item.title}</h1>
                    <p class="text-primary" style="font-weight: 500; font-size: 1.1rem;"><i class="fas fa-store"></i> ${item.donor}</p>
                    
                    <div style="background: var(--bg-light); padding: 20px; border-radius: var(--radius-md); margin: 20px 0;">
                        <div style="display: flex; align-items: baseline; gap: 15px; margin-bottom: 15px;">
                            <span style="font-size: 2.5rem; font-weight: 700; color: var(--primary);">${item.price.toFixed(0)} DA</span>
                            <span style="font-size: 1.2rem; text-decoration: line-through; color: var(--text-gray);">${item.originalPrice.toFixed(0)} DA</span>
                            <span style="background: var(--danger); color: white; padding: 4px 10px; border-radius: 20px; font-weight: bold;">Save ${discount}%</span>
                        </div>
                        <p>${item.description}</p>
                        <div style="margin-top: 20px;">
                            <p><i class="fas fa-clock text-danger"></i> <strong>Pickup Time:</strong> ${safeTimeLeft}</p>
                            <p><i class="fas fa-map-marker-alt text-primary"></i> <strong>Location:</strong> ${item.location}</p>
                        </div>
                    </div>
                        
                    <div id="action-buttons"></div>
                </div>
            </div>
                
                <div style="margin-top: 50px;">
                    <h3><i class="fas fa-map-marked-alt text-primary"></i> Pickup Location</h3>
                    <div style="width: 100%; height: 350px; border-radius: var(--radius-md); overflow: hidden; margin-top: 15px; box-shadow: var(--shadow-sm); border: 1px solid var(--border-color);">
                        <iframe 
                            width="100%" 
                            height="100%" 
                            frameborder="0" 
                            style="border:0" 
                            src="https://maps.google.com/maps?q=${encodeURIComponent(item.location + ', Algeria')}&t=&z=13&ie=UTF8&iwloc=&output=embed" 
                            loading="lazy"
                            allowfullscreen>
                        </iframe>
                    </div>
                </div>
            `;

            // Inject buttons after HTML is set
            const session = JSON.parse(localStorage.getItem('navigi_session'));
            const btnContainer = document.getElementById('action-buttons');
            const isProvider = session && session.user && ['donor', 'restaurant', 'hotel', 'bakery', 'market', 'catering'].includes(session.user.role);
            
            if (isProvider) {
                btnContainer.innerHTML = `
                    <button class="btn btn-secondary disabled" style="width: 100%; margin-bottom: 10px; opacity: 0.6; cursor: not-allowed;" title="Providers cannot reserve items. Please login as a Buyer.">Reserve Now (Seekers Only)</button>
                    <a href="contact-donor.html?id=${item.id}" class="btn btn-outline" style="width: 100%;">Contact Donor</a>
                `;
            } else {
                btnContainer.innerHTML = `
                    <a href="reserve.html?id=${item.id}" class="btn btn-primary" style="width: 100%; margin-bottom: 10px;">Reserve Now</a>
                    <a href="contact-donor.html?id=${item.id}" class="btn btn-outline" style="width: 100%;">Contact Donor</a>
                `;
            }
        } else {
            detailsContainer.innerHTML = '<h2>Item not found</h2><p class="mb-20">The food item might have been deleted or expired.</p><a href="browse-food.html" class="btn btn-primary">Browse available food</a>';
        }
}

function createFoodCard(item) {
    const discount = Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100);
    const badgeClass = `badge-${item.type.toLowerCase()}`;
    const isPromoted = item.promoted ? 'card-promoted' : '';
    
    let paymentBadges = '';
    // Payment badges removed as per request
    
    let promotedTag = '';
    if (item.promoted) {
        promotedTag = '<div class="promoted-tag"><i class="fas fa-star"></i> Featured</div>';
    }

    const session = JSON.parse(localStorage.getItem('navigi_session'));
    const isProvider = session && session.user && ['donor', 'restaurant', 'hotel', 'bakery', 'market', 'catering'].includes(session.user.role);
    const reserveButtonHtml = isProvider ? '' : `<a href="reserve.html?id=${item.id}" class="btn btn-primary btn-small" title="Reserve Now"><i class="fas fa-shopping-basket"></i></a>`;

    return `
        <article class="card ${isPromoted}">
            <div style="position: relative;">
                <img src="${item.image}" alt="${item.title}" class="card-img">
                <span style="position: absolute; top: 10px; right: 10px; background: var(--danger); color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold;">
                    -${discount}%
                </span>
                <span style="position: absolute; top: 10px; left: 10px; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold;" class="${badgeClass}">
                    ${item.type}
                </span>
            </div>
            <div class="card-body">
                ${promotedTag}
                <h3 class="card-title">${item.title}</h3>
                <div class="card-info">
                    <i class="fas fa-store"></i> ${item.donor}
                </div>
                <div class="card-info">
                    <i class="fas fa-map-marker-alt"></i> ${item.location}
                </div>
                <div class="card-info" style="color: var(--danger);">
                    <i class="fas fa-clock"></i> ${item.timeLeft && item.timeLeft.includes('left') ? item.timeLeft : item.timeLeft + ' left'}
                </div>
                ${paymentBadges ? `<div class="payment-badge">${paymentBadges}</div>` : ''}
                <div class="d-flex justify-between align-center mt-20">
                    <div>
                        <span class="card-price">${item.price.toFixed(0)} DA</span>
                        <span class="card-original-price">${item.originalPrice.toFixed(0)} DA</span>
                    </div>
                </div>
                <div class="d-flex gap-10 mt-15">
                    <a href="food-details.html?id=${item.id}" class="btn btn-outline btn-small" style="flex: 1;">View</a>
                    ${reserveButtonHtml}
                    <a href="contact-donor.html?id=${item.id}" class="btn btn-outline btn-small" title="Contact Seller"><i class="fas fa-envelope"></i></a>
                </div>
            </div>
        </article>
    `;
}

async function initCategoryPage(type) {
    const container = document.getElementById('category-page-grid');
    if (!container) return;

    container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin fa-2x text-primary"></i><p>Loading items...</p></div>';

    if (window.supabaseClient) {
        try {
            const { data: dbItems, error } = await window.supabaseClient
                .from('food_items')
                .select('*, profiles(name)')
                .eq('type', type)
                .eq('status', 'available')
                .order('created_at', { ascending: false });

            if (!error && dbItems && dbItems.length > 0) {
                // Assuming profileMap and merchant_name might be available in a broader context or future data structure
                // For now, we'll use the existing profiles.name if available, and fallback to 'Unknown Provider'
                // If merchant_name or profileMap were to be introduced, this line would need adjustment.
                const formattedItems = dbItems.map(item => ({
                    id: item.id,
                    title: item.title,
                    type: item.type,
                    price: item.price,
                    originalPrice: item.original_price,
                    location: item.location,
                    timeLeft: item.time_left,
                    image: item.image,
                    donor: item.merchant_name || (item.profiles ? item.profiles.name : undefined) || 'Unknown Provider', // Applied the requested fallback logic
                    promoted: item.promoted
                }));
                renderGrid(container, formattedItems);
                return;
            }
        } catch (e) {
            console.error('Error fetching category items:', e);
        }
    }

    // Fallback if DB fails or is empty
    container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: var(--text-gray);">
            <i class="fas fa-box-open" style="font-size: 3rem; opacity: 0.2; margin-bottom: 15px;"></i>
            <h3>No items available yet</h3>
            <p>Check back later for new ${type} offers.</p>
        </div>
    `;
}

function initCategoryPages() {
    const container = document.getElementById('category-page-grid');
    if (container && container.dataset.category) {
        initCategoryPage(container.dataset.category);
    }
}

