// Dashboard Logic
document.addEventListener('DOMContentLoaded', () => {
    // Check Auth & Role
    const session = JSON.parse(localStorage.getItem('navigi_session'));

    if (!session || (!session.token && !session.user)) { 
        // Not logged in
        alert('Please login to access the dashboard.');
        window.location.href = 'login.html';
        return;
    }

    const user = session.user;
    updateUserProfile(user);
    configureDashboardForRole(user.role);

    // Initial Render
    if (user.role === 'buyer' || user.role === 'ngo') {
        renderRequests();
    } else {
        renderOrders();
        renderListings();
    }
    
    renderNotifications(user.role);
});

function updateUserProfile(user) {
    document.getElementById('user-name').textContent = user.name;
    document.getElementById('user-role').textContent = capitalize(user.role);
    document.getElementById('profile-name').value = user.name;
    document.getElementById('profile-email').value = user.email;

    // Plan display logic
    const planInput = document.getElementById('profile-plan');
    if (planInput) {
        if (user.plan === 'pro') {
            planInput.value = 'Pro (Premium)';
            planInput.style.color = '#d68910';
            
            // Add a pro badge next to the user name in sidebar
            const nameEl = document.getElementById('user-name');
            nameEl.innerHTML = `${user.name} <i class="fas fa-crown" style="color: #f39c12; font-size: 0.8em; margin-left: 5px;" title="Pro Plan"></i>`;
        } else if (user.plan === 'free') {
            planInput.value = 'Free';
        } else {
            // Buyers/NGOs don't have a business plan
            planInput.value = 'N/A';
            planInput.parentElement.style.display = 'none';
        }
    }

    // Optional: Update avatar based on role
    const avatarIcon = document.getElementById('user-avatar-icon');

    if(['donor', 'restaurant', 'hotel', 'bakery', 'market', 'catering'].includes(user.role)) avatarIcon.className = 'fas fa-store';
    else if(user.role === 'ngo') avatarIcon.className = 'fas fa-hand-holding-heart';
    else avatarIcon.className = 'fas fa-user';
}

function configureDashboardForRole(role) {
    // Default: details for Provider are visible in HTML structure,
    // so we mainly need to toggle if it's a Seeker.
    
    // Hide all role-specific elements first
    document.querySelectorAll('.role-link').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.role-content').forEach(el => el.style.display = 'none');

    if (role === 'buyer' || role === 'ngo') {
        // Show Seeker Elements (Buyer, NGO)
        document.querySelectorAll('.seeker-link').forEach(el => el.style.display = 'block');
        document.querySelectorAll('.seeker-content').forEach(el => el.style.display = 'grid'); // Grid for stats
        
        // Hide add dish tab if it was active by default (unlikely but safe)
        const addFoodTab = document.getElementById('add-dish');
        if(addFoodTab && addFoodTab.classList.contains('active')) showTab('overview');
        
    } else {
        // Show Provider Elements (Donor, Restaurant, Hotel, Bakery, Market, Catering, Admin)
        document.querySelectorAll('.provider-link').forEach(el => el.style.display = 'block');
        document.querySelectorAll('.provider-content').forEach(el => el.style.display = 'grid'); // Grid for stats
    }
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// --- Tab Logic ---
function showTab(tabId) {
    document.querySelectorAll('.dashboard-tab').forEach(tab => {
        tab.classList.remove('active');
        tab.style.display = 'none';
    });
    
    const activeTab = document.getElementById(tabId);
    if(activeTab) {
        activeTab.classList.add('active');
        activeTab.style.display = 'block';
    }
    
    document.querySelectorAll('.nav-link-item').forEach(link => {
        link.classList.remove('active'); 
        if(link.getAttribute('onclick') && link.getAttribute('onclick').includes(tabId)) {
            link.classList.add('active');
        }
    });

    // Mobile sidebar handling could go here
}

// --- Mock Data ---

const mockOrders = [
    { id: 101, item: "Assorted Pastries Box", customer: "Ahmed Benali", time: "10 mins ago", status: "Pending" },
    { id: 102, item: "Vegetarian Pizza XL", customer: "Sarah K.", time: "1 hour ago", status: "Pending" },
    { id: 103, item: "Couscous Royal", customer: "Karim Z.", time: "2 hours ago", status: "Collected" }
];

const myListings = [
    { id: 1, title: "Assorted Pastries Box", status: "Active", boosted: true },
    { id: 2, title: "Vegetarian Pizza XL", status: "Active", boosted: false },
    { id: 3, title: "Couscous Royal", status: "Active", boosted: true }
];

const myRequests = [
    { id: 201, item: "Family Meal Box", donor: "Maison Amoud", date: "Feb 14, 2026", status: "Confirmed", pickupCode: "A123" },
    { id: 202, item: "Vegetable Basket", donor: "Kafil El Yatim", date: "Feb 10, 2026", status: "Collected", pickupCode: "B456" },
    { id: 203, item: "Pizza Margherita", donor: "Pizzeria L'Etna", date: "Feb 15, 2026", status: "Pending", pickupCode: "-" }
];

const notifications = [
    { id: 1, text: "Your request for 'Family Meal Box' was confirmed!", type: "success", role: "buyer" },
    { id: 2, text: "New order received for 'Vegetarian Pizza'.", type: "info", role: "donor" },
    { id: 3, text: "Don't forget to pickup 'Vegetable Basket' by 5 PM.", type: "warning", role: "buyer" }
];

// --- Render Functions ---

function renderNotifications(role) {
    const container = document.getElementById('dashboard-notifications');
    if (!container) return;

    // Filter notifications relevant to role (mock logic)
    // In real app, notifications belong to user ID
    const relevant = notifications.filter(n => {
        if (role === 'buyer' || role === 'ngo') return n.role === 'buyer';
        return n.role === 'donor';
    });

    if (relevant.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = relevant.map(n => `
        <div class="alert alert-${n.type} mb-15 fade-in" style="padding: 15px; border-radius: 8px; background-color: var(--bg-light); border-left: 4px solid var(--${n.type}); display: flex; align-items: center; justify-content: space-between;">
            <span>${n.text}</span>
            <button onclick="this.parentElement.remove()" style="background:none; border:none; cursor:pointer;">&times;</button>
        </div>
    `).join('');
}

// Provider: Render Orders
function renderOrders() {
    const container = document.getElementById('orders-list');
    if(!container) return;

    if (mockOrders.length === 0) {
        container.innerHTML = '<p class="text-gray">No new orders.</p>';
        return;
    }

    container.innerHTML = mockOrders.map(order => `
        <div class="card card-body mb-20 d-flex flex-column gap-15">
            <div>
                <h3>${order.item}</h3>
                <p class="text-gray text-sm">Ordered by <strong class="text-dark">${order.customer}</strong> • ${order.time}</p>
                <span class="badge" style="background-color: ${getStatusColor(order.status)}; color: white; padding: 5px 10px; border-radius: 4px; font-size: 0.8rem; display: inline-block; margin-top: 5px;">${order.status}</span>
            </div>
            ${order.status === 'Pending' ? `
            <div class="d-flex gap-10">
                <button onclick="updateOrderStatus(${order.id}, 'Confirmed')" class="btn btn-primary btn-small">Accept</button>
                <button onclick="updateOrderStatus(${order.id}, 'Rejected')" class="btn btn-outline btn-small text-danger" style="border-color: var(--danger); color: var(--danger);">Reject</button>
            </div>` : ''}
        </div>
    `).join('');
}

// Provider: Render Listings
function renderListings() {
    const container = document.getElementById('listings-table');
    if(!container) return;

    container.innerHTML = myListings.map(listing => `
        <tr class="border-bottom">
            <td class="p-10">${listing.title}</td>
            <td class="p-10"><span class="text-success font-medium">${listing.status}</span></td>
            <td class="p-10">
                <button onclick="editListing(${listing.id})" class="text-primary mr-10" title="Edit"><i class="fas fa-edit"></i></button>
                <button onclick="deleteListing(${listing.id})" class="text-danger" title="Delete"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

// Seeker: Render Requests
function renderRequests() {
    // Render in Overview
    const overviewContainer = document.getElementById('overview-requests-list');
    // Render in Full Tab
    const fullContainer = document.getElementById('my-requests-list');
    
    const html = myRequests.map(req => `
        <div class="card card-body mb-15 d-flex justify-between align-center sticky-card">
            <div>
                <h4 class="mb-5">${req.item}</h4>
                <p class="text-sm text-gray"><i class="fas fa-store"></i> ${req.donor}</p>
                <p class="text-xs text-gray mt-5">${req.date}</p>
            </div>
            <div class="text-right">
                <span class="badge" style="background-color: ${getStatusColor(req.status)}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem;">${req.status}</span>
                ${req.status === 'Confirmed' ? `<p class="text-sm mt-5">Code: <strong>${req.pickupCode}</strong></p>` : ''}
                <div class="mt-10">
                    <a href="contact-donor.html?id=${req.id}" class="text-primary text-sm" style="font-weight: 500;"><i class="fas fa-envelope"></i> Contact Vendor</a>
                </div>
            </div>
        </div>
    `).join('');

    if(overviewContainer) overviewContainer.innerHTML = html;
    if(fullContainer) fullContainer.innerHTML = html;
}

function getStatusColor(status) {
    if (status === 'Pending') return 'var(--warning)';
    if (status === 'Confirmed' || status === 'Active' || status === 'Given') return 'var(--success)';
    if (status === 'Collected') return 'var(--primary)';
    if (status === 'Rejected' || status === 'Expired') return 'var(--danger)';
    return 'gray';
}


// --- Actions ---

function updateOrderStatus(id, status) {
    const orderIndex = mockOrders.findIndex(o => o.id === id);
    if(orderIndex > -1) {
        mockOrders[orderIndex].status = status;
        alert(`Order #${id} has been ${status}.`);
        renderOrders();
    }
}

function editListing(id) {
    alert(`Edit functionality for listing #${id} would open a modal here.`);
}

function deleteListing(id) {
    if(confirm('Are you sure you want to delete this listing?')) {
        const idx = myListings.findIndex(l => l.id === id);
        if(idx > -1) {
            myListings.splice(idx, 1);
            renderListings();
        }
    }
}

// Add Dish Logic
let selectedPaymentMethod = null;

// Live Preview Logic
function initLivePreview() {
    const form = document.getElementById('add-dish-form');
    if (!form) return;

    const inputs = {
        name: document.getElementById('dish-name'),
        category: document.getElementById('dish-category'),
        desc: document.getElementById('dish-desc'),
        originalPrice: document.getElementById('dish-original-price'),
        price: document.getElementById('dish-price'),
        quantity: document.getElementById('dish-quantity'),
        pickupFrom: document.getElementById('dish-pickup-from'),
        pickupTo: document.getElementById('dish-pickup-to'),
        expiry: document.getElementById('dish-expiry'),
        image: document.getElementById('dish-image')
    };

    const previews = {
        title: document.getElementById('preview-title'),
        badge: document.getElementById('preview-badge'),
        desc: document.getElementById('preview-desc-text'),
        originalPrice: document.getElementById('preview-original-price-val'),
        price: document.getElementById('preview-price-val'),
        quantity: document.getElementById('preview-quantity-val'),
        time: document.getElementById('preview-time-val'),
        expiry: document.getElementById('preview-expiry-val'),
        img: document.getElementById('preview-img'),
        miniImg: document.getElementById('image-preview-mini'),
        miniContainer: document.getElementById('image-preview-container')
    };

    const updatePreview = () => {
        if (previews.title) previews.title.textContent = inputs.name.value || 'Dish Name';
        if (previews.desc) previews.desc.textContent = inputs.desc.value || 'Your dish description will appear here...';
        if (previews.price) previews.price.textContent = inputs.price.value || '0';
        if (previews.originalPrice) previews.originalPrice.textContent = (inputs.originalPrice.value || '0') + ' DA';
        if (previews.quantity) previews.quantity.textContent = inputs.quantity.value || '1';
        
        let timeRange = '--:-- to --:--';
        if (inputs.pickupFrom.value || inputs.pickupTo.value) {
            timeRange = `${inputs.pickupFrom.value || '--:--'} to ${inputs.pickupTo.value || '--:--'}`;
        }
        if (previews.time) previews.time.textContent = timeRange;
        
        if (previews.expiry) previews.expiry.textContent = inputs.expiry.value || 'YYYY-MM-DD';
        
        if (previews.badge && inputs.category.value) {
            previews.badge.textContent = inputs.category.value;
            // Update badge class based on category
            previews.badge.className = 'badge';
            const catClass = 'badge-' + inputs.category.value.toLowerCase().split(' ')[0].replace('&', 'catering');
            previews.badge.classList.add(catClass);
        }
    };

    // Listen for all input changes
    Object.values(inputs).forEach(input => {
        if (!input) return;
        input.addEventListener('input', updatePreview);
    });

    // Handle Image Selection
    if (inputs.image) {
        inputs.image.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    if (previews.img) previews.img.src = event.target.result;
                    if (previews.miniImg) previews.miniImg.src = event.target.result;
                    if (previews.miniContainer) previews.miniContainer.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Initial call
    updatePreview();
}

// Call init when tab is shown
const originalShowTab = showTab;
showTab = function(tabId) {
    originalShowTab(tabId);
    if (tabId === 'add-dish') {
        initLivePreview();
    }
}

function handlePublishFree() {
    if(validateForm()) {
        publishDish(false);
    }
}

function handlePublishBoost() {
    if(validateForm()) {
        const session = JSON.parse(localStorage.getItem('navigi_session'));
        const isPro = session && session.user && session.user.plan === 'pro';

        if (isPro) {
            // Pro users get free boosts, bypass payment modal
            alert("Pro Plan Perk: Your listing is automatically boosted for free!");
            publishDish(true);
        } else {
            // Free users must pay
            const modal = document.getElementById('payment-modal');
            if(modal) modal.style.display = 'flex';
        }
    }
}

function validateForm() {
    const name = document.getElementById('dish-name').value;
    const price = document.getElementById('dish-price').value;
    const category = document.getElementById('dish-category').value;
    const pickupFrom = document.getElementById('dish-pickup-from').value;
    const pickupTo = document.getElementById('dish-pickup-to').value;
    const expiry = document.getElementById('dish-expiry').value;
    const image = document.getElementById('dish-image').files[0];

    if(!name || !price || !category || !pickupFrom || !pickupTo || !expiry || !image) {
        alert("Please fill in all required fields and upload an image.");
        return false;
    }
    return true;
}

function closePaymentModal() {
    const modal = document.getElementById('payment-modal');
    if(modal) modal.style.display = 'none';
}

function processPayment() {
    alert(`Payment of 200 DA successful!`);
    closePaymentModal();
    publishDish(true);
}

function publishDish(boosted) {
    const session = JSON.parse(localStorage.getItem('navigi_session'));
    const isPro = session && session.user && session.user.plan === 'pro';
    
    // Auto-boost for Pro users
    if (isPro) {
        boosted = true;
    }

    const name = document.getElementById('dish-name').value;
    myListings.unshift({ id: Date.now(), title: name, status: "Active", boosted: boosted });
    renderListings();
    alert(`"${name}" published successfully!`);
    showTab('overview');
    const form = document.getElementById('add-dish-form');
    if(form) {
        form.reset();
        const miniContainer = document.getElementById('image-preview-container');
        if(miniContainer) miniContainer.style.display = 'none';
        const previewImg = document.getElementById('preview-img');
        if(previewImg) previewImg.src = 'https://via.placeholder.com/400x300?text=Dish+Image';
    }
}

function logout(event) {
    if(event) event.preventDefault();
    localStorage.removeItem('navigi_session');
    window.location.href = 'index.html';
}

// Expose to window
window.showTab = showTab;
window.handlePublishFree = handlePublishFree;
window.handlePublishBoost = handlePublishBoost;
window.updateOrderStatus = updateOrderStatus;
window.editListing = editListing;
window.deleteListing = deleteListing;
window.closePaymentModal = closePaymentModal;
window.processPayment = processPayment;
window.logout = logout;
window.initLivePreview = initLivePreview;
