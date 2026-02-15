// Main JavaScript File

document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initHomePage();
    initBrowsePage();
    initDetailsPage();
    initCategoryPages();
    checkAuth();
});

function checkAuth() {
    const session = JSON.parse(localStorage.getItem('navigi_session'));
    const navLinks = document.getElementById('nav-links');
    
    if (session && session.expiry > Date.now() && navLinks) {
        const user = session.user;
        // Target the last list item (usually the CTA button)
        const lastLi = navLinks.lastElementChild;
        
        if (lastLi) {
            lastLi.innerHTML = `
                <a href="#" class="btn btn-outline btn-small" onclick="logout(event)">
                    <i class="fas fa-sign-out-alt"></i> Logout (${user.name.split(' ')[0]})
                </a>
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
    const browseGrid = document.getElementById('browse-grid');
    const searchInput = document.getElementById('browse-search');
    const priceFilters = document.querySelectorAll('.price-filter');
    
    // Check for category filter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const categoryFilter = urlParams.get('category');
    const searchFilter = urlParams.get('search');

    if (browseGrid && typeof foodItems !== 'undefined') {
        let baseItems = foodItems;

        // Apply category filter
        if (categoryFilter) {
            baseItems = baseItems.filter(item => item.type.toLowerCase() === categoryFilter.toLowerCase());
            // Update title if exists
            const pageTitle = document.getElementById('page-title');
            if (pageTitle) pageTitle.textContent = categoryFilter + 's'; 
        }
        
        // Apply search filter
        if (searchFilter) {
            baseItems = baseItems.filter(item => 
                item.title.toLowerCase().includes(searchFilter.toLowerCase()) || 
                item.location.toLowerCase().includes(searchFilter.toLowerCase()) ||
                item.donor.toLowerCase().includes(searchFilter.toLowerCase())
            );
            if(searchInput) searchInput.value = searchFilter;
        }

        // Function to apply all filters
        function applyFilters() {
            let filteredItems = [...baseItems];

            // Apply price filters
            const checkedPriceFilters = Array.from(priceFilters).filter(f => f.checked);
            if (checkedPriceFilters.length > 0) {
                filteredItems = filteredItems.filter(item => {
                    return checkedPriceFilters.some(filter => {
                        const min = parseFloat(filter.dataset.min);
                        const max = parseFloat(filter.dataset.max);
                        return item.price >= min && item.price <= max;
                    });
                });
            }

            // Apply search filter
            if (searchInput && searchInput.value) {
                const term = searchInput.value.toLowerCase();
                filteredItems = filteredItems.filter(item => 
                    item.title.toLowerCase().includes(term) || 
                    item.location.toLowerCase().includes(term) ||
                    item.donor.toLowerCase().includes(term)
                );
            }

            // Sort promoted items to first
            filteredItems.sort((a, b) => (b.promoted ? 1 : 0) - (a.promoted ? 1 : 0));

            renderGrid(browseGrid, filteredItems);
        }

        // Initial render
        applyFilters();

        // Add event listeners for price filters
        priceFilters.forEach(filter => {
            filter.addEventListener('change', applyFilters);
        });

        // Add search listener
        if (searchInput) {
            searchInput.addEventListener('input', applyFilters);
        }
    }
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
                        
                        <a href="reserve.html?id=${item.id}" class="btn btn-primary" style="width: 100%; margin-bottom: 10px;">Reserve Now</a>
                        <a href="contact-donor.html?id=${item.id}" class="btn btn-outline" style="width: 100%;">Contact Donor</a>
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
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px;">
                    <div>
                        <span class="card-price">${item.price.toFixed(0)} DA</span>
                        <span class="card-original-price">${item.originalPrice.toFixed(0)} DA</span>
                    </div>
                    <a href="food-details.html?id=${item.id}" class="btn btn-outline btn-small">View</a>
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

