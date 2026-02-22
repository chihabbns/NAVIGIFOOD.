// Main JavaScript File

document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initThemeToggle();   // Dark mode toggle
    initHomePage();
    initBrowsePage();
    initDetailsPage();
    initCategoryPages();
    initSearchSuggestions();
    checkAuth();
});

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

            if (typeof foodItems === 'undefined') return;

            // Logic: Group by category
            const results = {
                dishes: foodItems.filter(item => item.title.toLowerCase().includes(term))
                        .map(item => ({ text: item.title, icon: 'fas fa-utensils', meta: 'Dish' })),
                donors: foodItems.filter(item => item.donor.toLowerCase().includes(term))
                        .map(item => ({ text: item.donor, icon: 'fas fa-store', meta: 'Merchant' })),
                places: foodItems.filter(item => item.location.toLowerCase().includes(term))
                        .map(item => ({ text: item.location, icon: 'fas fa-map-marker-alt', meta: 'Location' }))
            };

            // Remove duplicates within groups
            results.dishes = Array.from(new Set(results.dishes.map(r => r.text))).map(text => results.dishes.find(r => r.text === text)).slice(0, 3);
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
    if (typeof foodItems === 'undefined') return;
    
    // Popular = just some first items
    const popular = {
        dishes: foodItems.slice(0, 3).map(item => ({ text: item.title, icon: 'fas fa-fire', meta: 'Trending' })),
        places: [...new Set(foodItems.map(i => i.location))].slice(0, 2).map(loc => ({ text: loc, icon: 'fas fa-map-pin', meta: 'Nearby' }))
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

function checkAuth() {
    const session = JSON.parse(localStorage.getItem('navigi_session'));
    const navLinks = document.getElementById('nav-links');
    
    if (session && session.expiry > Date.now() && navLinks) {
        const user = session.user;
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

function logout(e) {
    if(e) e.preventDefault();
    localStorage.removeItem('navigi_session');
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

function initHomePage() {
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

    // Render Featured Items (random 3 or first 3)
    if (featuredGrid && typeof foodItems !== 'undefined') {
        const featuredItems = foodItems.slice(0, 4); // Take first 4
        featuredGrid.innerHTML = featuredItems.map(item => createFoodCard(item)).join('');
    }
}

function initBrowsePage() {
    const browseGrid     = document.getElementById('browse-grid');
    const resultsCount   = document.getElementById('results-count');
    const priceRange     = document.getElementById('price-range');
    const priceLabel     = document.getElementById('price-label');
    const keywordInput   = document.getElementById('keyword-filter');
    const locationInput  = document.getElementById('location-filter');
    const sortSelect     = document.getElementById('sort-filter');
    const resetBtn       = document.getElementById('reset-filters');
    const catFilters     = document.querySelectorAll('.cat-filter');

    if (!browseGrid || typeof foodItems === 'undefined') return;

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

    // Reset
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            catFilters.forEach(cb => cb.checked = true);
            if (priceRange)    { priceRange.value = priceRange.max; }
            if (priceLabel)    { priceLabel.textContent = Number(priceRange.max).toLocaleString() + ' DA'; }
            if (keywordInput)  { keywordInput.value = ''; }
            if (locationInput) { locationInput.value = ''; }
            if (sortSelect)    { sortSelect.value = 'featured'; }
            applyFilters();
        });
    }

    // --- Core filter + sort function ---
    function applyFilters() {
        let items = [...foodItems];

        // 1 — Category filter
        const checkedCats = Array.from(catFilters)
            .filter(cb => cb.checked)
            .map(cb => cb.value.toLowerCase());

        if (checkedCats.length > 0) {
            items = items.filter(item => checkedCats.includes(item.type.toLowerCase()));
        } else {
            items = []; // nothing checked = show nothing
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
                    const dA = (a.originalPrice - a.price) / a.originalPrice;
                    const dB = (b.originalPrice - b.price) / b.originalPrice;
                    return dB - dA;
                });
                break;
            case 'time':
                // Sort by timeLeft: shorter strings like "30 mins" before "2 hours" before "2 days"
                const timeOrder = { 'mins': 1, 'hour': 2, 'hours': 2, 'day': 3, 'days': 3 };
                items.sort((a, b) => {
                    const unitA = Object.keys(timeOrder).find(k => a.timeLeft.includes(k)) || 'days';
                    const unitB = Object.keys(timeOrder).find(k => b.timeLeft.includes(k)) || 'days';
                    const orderA = timeOrder[unitA] * parseFloat(a.timeLeft);
                    const orderB = timeOrder[unitB] * parseFloat(b.timeLeft);
                    return orderA - orderB;
                });
                break;
            default: // 'featured'
                items.sort((a, b) => (b.promoted ? 1 : 0) - (a.promoted ? 1 : 0));
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

function initDetailsPage() {
    const detailsContainer = document.getElementById('food-details-container');
    if (detailsContainer && typeof foodItems !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const id = parseInt(urlParams.get('id'));
        
        const item = foodItems.find(i => i.id === id);
        
        if (item) {
            const discount = Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100);
            
            document.title = `${item.title} - NavigiFood`;
            
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
                                <p><i class="fas fa-clock text-danger"></i> <strong>Pickup Time:</strong> Expires in ${item.timeLeft}</p>
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
            detailsContainer.innerHTML = '<h2>Item not found</h2><a href="browse-food.html" class="btn btn-primary">Go Back</a>';
        }
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
                    <i class="fas fa-clock"></i> ${item.timeLeft} left
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

function initCategoryPage(type) {
    const container = document.getElementById('category-page-grid');
    if (container && typeof foodItems !== 'undefined') {
        const filtered = foodItems.filter(item => item.type.toLowerCase() === type.toLowerCase());
        renderGrid(container, filtered);
    }
}

function initCategoryPages() {
    const container = document.getElementById('category-page-grid');
    if (container && container.dataset.category) {
        initCategoryPage(container.dataset.category);
    }
}

