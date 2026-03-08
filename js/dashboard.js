// Dashboard Logic
let currentUserProfile = null;
document.addEventListener('DOMContentLoaded', async () => {
    // Check Auth & Role via Supabase
    if (!window.supabaseClient) {
        alert('Database connection not found.');
        return;
    }

    const { data: { session }, error: sessionError } = await window.supabaseClient.auth.getSession();

    if (!session) { 
        // Not logged in
        alert('Please login to access the dashboard.');
        window.location.href = 'login.html';
        return;
    }

    // Fetch user profile from Supabase
    const { data: profile } = await window.supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

    const role = profile ? profile.role : (session.user.user_metadata?.role || 'buyer');
    const name = profile ? profile.name : (session.user.user_metadata?.name || 'User');
    const plan = profile ? profile.plan : (session.user.user_metadata?.plan || 'none');
    
    const user = {
        name: name,
        email: session.user.email,
        role: role,
        plan: plan,
        phone: profile ? profile.phone : '',
        address: profile ? profile.address : ''
    };

    currentUserProfile = user;
    updateUserProfile(user);
    configureDashboardForRole(user.role);
    updateImpactAnalytics();

    // Initial Render
    if (user.role === 'buyer' || user.role === 'ngo') {
        await renderRequests();
    } else {
        await renderOrders();
        await renderListings();
    }


    updateMsgBadge();
    renderNotifications(user.role);
    initRealtime(session.user.id, user.role); // Start Realtime Subscriptions
});

function updateUserProfile(user) {
    document.getElementById('user-name').textContent = user.name;
    document.getElementById('user-role').textContent = capitalize(user.role);
    document.getElementById('profile-name').value = user.name;
    document.getElementById('profile-email').value = user.email;
    if (user.phone) document.getElementById('profile-phone').value = user.phone;
    if (user.address) {
        const profileAddr = document.getElementById('profile-address');
        if (profileAddr) profileAddr.value = user.address;
        
        const dishLoc = document.getElementById('dish-location');
        if (dishLoc && !dishLoc.value) dishLoc.value = user.address;
    }

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

async function updateImpactAnalytics() {
    if (!window.supabaseClient) return;
    
    // Ensure we have a user session for ID
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) return;
    
    const userId = session.user.id;
    const userRole = currentUserProfile ? currentUserProfile.role : 'buyer'; // fallback

    try {
        if (userRole === 'buyer' || userRole === 'ngo') {
            // Seeker Stats: Meals Rescued, Money Saved, Pending Requests
            
            // 1. All Orders for this buyer
            const { data: seekerOrders, error: sError } = await window.supabaseClient
                .from('orders')
                .select('*, food_items(price, original_price)')
                .eq('buyer_id', userId);

            if (sError) throw sError;

            let mealsRescued = 0;
            let moneySaved = 0;
            let pendingRequests = 0;

            if (seekerOrders) {
                seekerOrders.forEach(order => {
                    if (order.status === 'Confirmed' || order.status === 'Collected') {
                        mealsRescued++;
                        if (order.food_items) {
                            const currentPrice = order.food_items.price || 0;
                            const original = order.food_items.original_price || (currentPrice * 1.5);
                            moneySaved += (original - currentPrice);
                        }
                    } else if (order.status === 'Pending') {
                        pendingRequests++;
                    }
                });
            }

            const rescuedEl = document.getElementById('stat-meals-rescued');
            const savedEl = document.getElementById('stat-money-saved');
            const pendingEl = document.getElementById('stat-pending-requests');

            if (rescuedEl) rescuedEl.textContent = mealsRescued;
            if (savedEl) savedEl.textContent = `${Math.round(moneySaved).toLocaleString()} DA`;
            if (pendingEl) pendingEl.textContent = pendingRequests;

        } else {
            // Provider Stats: Active Dishes, Pending Orders, Total Revenue
            
            // 1. Active Dishes
            const { count: activeCount, error: aError } = await window.supabaseClient
                .from('food_items')
                .select('*', { count: 'exact', head: true })
                .eq('donor_id', userId)
                .eq('status', 'available');

            // 2. All Orders for this donor/provider
            const { data: providerOrders, error: pError } = await window.supabaseClient
                .from('orders')
                .select('*, food_items(price)')
                .eq('donor_id', userId);

            if (aError || pError) throw aError || pError;

            let pendingOrdersCount = 0;
            let totalRevenue = 0;

            if (providerOrders) {
                providerOrders.forEach(order => {
                    if (order.status === 'Pending') {
                        pendingOrdersCount++;
                    } else if (order.status === 'Confirmed' || order.status === 'Collected') {
                        // Handle the case where food_items might be an object OR an array
                        const fItem = Array.isArray(order.food_items) ? order.food_items[0] : order.food_items;
                        if (fItem && fItem.price) {
                            totalRevenue += fItem.price;
                        }
                    }
                });
            }

            const dishesEl = document.getElementById('stat-active-dishes');
            const ordersEl = document.getElementById('stat-pending-orders');
            const revenueEl = document.getElementById('stat-total-revenue');

            if (dishesEl) dishesEl.textContent = activeCount || 0;
            if (ordersEl) ordersEl.textContent = pendingOrdersCount;
            if (revenueEl) revenueEl.textContent = `${totalRevenue.toLocaleString()} DA`;
        }
    } catch (err) {
        console.error("Impact Analytics Update Failed:", err);
    }
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

    if (tabId === 'messages') {
        renderMessages();
    }
}

// --- Dynamic Notifications ---
async function renderNotifications(role) {
    const container = document.getElementById('dashboard-notifications');
    if (!container || !window.supabaseClient) return;

    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) return;

    let relevantNotifs = [];

    try {
        if (role === 'buyer' || role === 'ngo') {
            // Buyer notifications based on recent order updates
            const { data: dbOrders } = await window.supabaseClient
                .from('orders')
                .select('status, food_items(title)')
                .eq('buyer_id', session.user.id)
                .in('status', ['Confirmed', 'Rejected', 'Pending'])
                .order('created_at', { ascending: false })
                .limit(3);

            if (dbOrders) {
                dbOrders.forEach(order => {
                    const title = order.food_items ? order.food_items.title : 'Item';
                    if (order.status === 'Confirmed') {
                        relevantNotifs.push({ text: `Your request for '${title}' was confirmed! 🥳`, type: "success" });
                    } else if (order.status === 'Rejected') {
                        relevantNotifs.push({ text: `Your request for '${title}' was rejected.`, type: "danger" });
                    } else if (order.status === 'Pending') {
                        relevantNotifs.push({ text: `Your request for '${title}' is waiting for donor approval.`, type: "info" });
                    }
                });
            }
        } else {
            // Donor/Provider notifications based on recent pending or confirmed orders
            const { data: dbOrders } = await window.supabaseClient
                .from('orders')
                .select('status, buyer_name, food_items(title)')
                .eq('donor_id', session.user.id)
                .in('status', ['Pending', 'Confirmed'])
                .order('created_at', { ascending: false })
                .limit(3);

            if (dbOrders) {
                dbOrders.forEach(order => {
                    const title = order.food_items ? order.food_items.title : 'Item';
                    if (order.status === 'Pending') {
                        relevantNotifs.push({ text: `New order received from ${order.buyer_name} for '${title}'.`, type: "warning" });
                    } else if(order.status === 'Confirmed') {
                        relevantNotifs.push({ text: `Waiting for ${order.buyer_name} to pickup '${title}'.`, type: "info" });
                    }
                });
            }
        }
    } catch(e) {
        console.error("Error fetching notifications", e);
    }

    if (relevantNotifs.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = relevantNotifs.map(n => `
        <div class="alert alert-${n.type} mb-15 fade-in" style="padding: 15px; border-radius: 8px; background-color: var(--bg-light); border-left: 4px solid var(--${n.type}); display: flex; align-items: center; justify-content: space-between;">
            <span>${n.text}</span>
            <button onclick="this.parentElement.remove()" style="background:none; border:none; cursor:pointer;">&times;</button>
        </div>
    `).join('');
}

// Provider: Render Orders
async function renderOrders() {
    const container = document.getElementById('orders-list');
    if(!container || !window.supabaseClient) return;

    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) return;

    // Fetch orders where donor_id is current user
    const { data: dbOrders, error } = await window.supabaseClient
        .from('orders')
        .select('*, food_items(title)')
        .eq('donor_id', session.user.id)
        .order('created_at', { ascending: false });

    if (error || !dbOrders || dbOrders.length === 0) {
        container.innerHTML = '<p class="text-gray">No new orders.</p>';
        return;
    }

    container.innerHTML = dbOrders.map(order => `
        <div class="card card-body mb-20 d-flex flex-column gap-15">
            <div>
                <h3>${order.food_items ? order.food_items.title : 'Deleted Item'}</h3>
                <div class="d-flex justify-between align-start">
                    <div>
                        <p class="text-gray text-sm">Ordered by <strong class="text-dark">${order.buyer_name}</strong></p>
                        <p class="text-gray text-xs">Phone: ${order.buyer_phone} • Pickup: ${order.pickup_time}</p>
                    </div>
                    <span class="badge" style="background-color: ${getStatusColor(order.status)}; color: white; padding: 5px 10px; border-radius: 4px; font-size: 0.8rem;">${order.status}</span>
                </div>
            </div>
            ${order.status === 'Pending' ? `
            <div class="d-flex gap-10">
                <button onclick="updateOrderStatus('${order.id}', 'Confirmed', '${order.food_id}')" class="btn btn-primary btn-small">Accept</button>
                <button onclick="updateOrderStatus('${order.id}', 'Rejected', '${order.food_id}')" class="btn btn-outline btn-small text-danger" style="border-color: var(--danger); color: var(--danger);">Reject</button>
            </div>` : ''}
            ${order.status === 'Confirmed' ? `
            <div style="background: var(--bg-light); padding: 10px; border-radius: 4px; border-left: 4px solid var(--success);">
                <p class="text-sm"><strong>Required Pickup Code:</strong> <span class="text-primary">${order.pickup_code}</span></p>
                <p class="text-xs text-gray mt-5">Verify this code manually when the buyer arrives.</p>
            </div>` : ''}
        </div>
    `).join('');
}

// Provider: Render Listings
async function renderListings() {
    const container = document.getElementById('listings-table');
    if(!container) return;

    if (!window.supabaseClient) return;
    
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) return;

    container.innerHTML = '<tr><td colspan="3" class="text-center p-10">Loading...</td></tr>';

    try {
        const { data, error } = await window.supabaseClient
            .from('food_items')
            .select('*')
            .eq('donor_id', session.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
            container.innerHTML = data.map(listing => `
                <tr class="border-bottom">
                    <td class="p-10">${listing.title}</td>
                    <td class="p-10"><span class="text-success font-medium">${listing.status}</span></td>
                    <td class="p-10">
                        <button onclick="editListing(${listing.id})" class="text-primary mr-10" title="Edit"><i class="fas fa-edit"></i></button>
                        <button onclick="deleteListing(${listing.id})" class="text-danger" title="Delete"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `).join('');
        } else {
            container.innerHTML = '<tr><td colspan="3" class="text-center p-10 text-gray">لا توجد عروض حالياً. (No active listings)</td></tr>';
        }
    } catch (err) {
        console.error("Error loading listings:", err);
        container.innerHTML = '<tr><td colspan="3" class="text-center p-10 text-danger">Failed to load listings.</td></tr>';
    }
}

// Seeker: Render Requests
async function renderRequests() {
    const overviewContainer = document.getElementById('overview-requests-list');
    const fullContainer = document.getElementById('my-requests-list');
    if ((!overviewContainer && !fullContainer) || !window.supabaseClient) return;

    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) return;

    const { data: dbRequests, error } = await window.supabaseClient
        .from('orders')
        .select('*, food_items(title, donor_id)')
        .eq('buyer_id', session.user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('renderRequests error:', error);
        const msg = `<p class="text-danger">خطأ في جلب الطلبات: ${error.message}</p>`;
        if(overviewContainer) overviewContainer.innerHTML = msg;
        if(fullContainer) fullContainer.innerHTML = msg;
        return;
    }

    if (!dbRequests || dbRequests.length === 0) {
        const msg = '<p class="text-gray">لا توجد طلبات بعد.</p>';
        if(overviewContainer) overviewContainer.innerHTML = msg;
        if(fullContainer) fullContainer.innerHTML = msg;
        return;
    }

    // Fetch donor names separately for all unique donor_ids
    const donorIds = [...new Set(dbRequests.map(r => r.donor_id).filter(Boolean))];
    let donorMap = {};
    if (donorIds.length > 0) {
        const { data: donorProfiles } = await window.supabaseClient
            .from('profiles')
            .select('id, name')
            .in('id', donorIds);
        if (donorProfiles) {
            donorProfiles.forEach(p => { donorMap[p.id] = p.name; });
        }
    }
    
    const html = dbRequests.map(req => {
        const donorName = donorMap[req.donor_id] || 'Unknown Store';
        return `
        <div class="card card-body mb-15 d-flex justify-between align-center sticky-card">
            <div>
                <h4 class="mb-5">${req.food_items ? req.food_items.title : 'Deleted Item'}</h4>
                <p class="text-sm text-gray"><i class="fas fa-store"></i> ${donorName}</p>
                <p class="text-xs text-gray mt-5">${new Date(req.created_at).toLocaleDateString()}</p>
            </div>
            <div class="text-right">
                <span class="badge" style="background-color: ${getStatusColor(req.status)}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem;">${req.status}</span>
                ${req.status === 'Confirmed' ? `<p class="text-sm mt-5">Code: <strong class="text-primary">${req.pickup_code}</strong></p>` : ''}
                <div class="mt-10">
                    <a href="contact-donor.html?id=${req.food_id}" class="text-primary text-sm" style="font-weight: 500;"><i class="fas fa-envelope"></i> Contact Vendor</a>
                </div>
            </div>
        </div>
        `;
    }).join('');

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

async function updateOrderStatus(id, status, foodId) {
    if (!window.supabaseClient) return;

    try {
        // 1. Update order status
        const { error } = await window.supabaseClient
            .from('orders')
            .update({ status: status })
            .eq('id', id);

        if (error) throw error;

        // 2. If order is Rejected, restore the inventory quantity
        if (status === 'Rejected' && foodId) {
            const { data: currentItem } = await window.supabaseClient
                .from('food_items')
                .select('quantity')
                .eq('id', foodId)
                .single();

            if (currentItem !== null && currentItem !== undefined) {
                const newQty = (currentItem.quantity || 0) + 1;
                await window.supabaseClient
                    .from('food_items')
                    .update({ quantity: newQty, status: 'available' })
                    .eq('id', foodId);
            }
        }
        
        const statusAr = status === 'Confirmed' ? 'مقبول ✅' : 'مرفوض ❌';
        alert(`تم تحديث حالة الطلب: ${statusAr}`);
        renderOrders(); // Refresh donor view
        updateImpactAnalytics(); // Update stats
    } catch (err) {
        console.error('Update Status Error:', err);
        alert('حدث خطأ أثناء تحديث الطلب.');
    }
}

async function editListing(id) {
    if (!window.supabaseClient) return;
    
    // Fetch current details of this item
    const { data: item, error } = await window.supabaseClient
        .from('food_items')
        .select('title, price, quantity, status')
        .eq('id', id)
        .single();
        
    if (error || !item) {
        alert("خطأ في جلب بيانات الطعام.");
        return;
    }

    // Populate the modal fields
    document.getElementById('edit-dish-id').value = id;
    document.getElementById('edit-dish-name').value = item.title;
    document.getElementById('edit-dish-price').value = item.price;
    document.getElementById('edit-dish-quantity').value = item.quantity || 1;
    document.getElementById('edit-dish-status').value = item.status || 'available';

    // Show the modal
    document.getElementById('edit-modal').style.display = 'flex';
}

function closeEditModal() {
    document.getElementById('edit-modal').style.display = 'none';
}

async function saveEditListing() {
    if (!window.supabaseClient) return;

    const id = document.getElementById('edit-dish-id').value;
    const title = document.getElementById('edit-dish-name').value;
    const price = document.getElementById('edit-dish-price').value;
    const quantity = document.getElementById('edit-dish-quantity').value;
    const status = document.getElementById('edit-dish-status').value;

    const btn = document.querySelector('#edit-modal button');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
    btn.disabled = true;

    try {
        const { error } = await window.supabaseClient
            .from('food_items')
            .update({
                title: title,
                price: parseFloat(price),
                quantity: parseInt(quantity),
                status: status
            })
            .eq('id', id);

        if (error) throw error;

        alert('تم تعديل العرض بنجاح! ✅');
        closeEditModal();
        renderListings(); // Refresh the table
    } catch (err) {
        console.error("Error updating listing:", err);
        alert('حدث خطأ أثناء التعديل.');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

async function deleteListing(id) {
    if(confirm('Are you sure you want to delete this listing? (هل أنت متأكد من الحذف؟)')) {
        if (!window.supabaseClient) return;
        try {
            const { error } = await window.supabaseClient
                .from('food_items')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            renderListings();
        } catch (err) {
            console.error(err);
            alert("Error deleting listing.");
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
        foodType: document.getElementById('dish-food-type'),
        location: document.getElementById('dish-location'),
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
        location: document.getElementById('preview-location-val'),
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
        if (previews.location) previews.location.textContent = (inputs.location && inputs.location.value) ? inputs.location.value : 'Algeria';
        
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
        const isPro = document.getElementById('profile-plan') && document.getElementById('profile-plan').value.toLowerCase().includes('pro');

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
    const desc = document.getElementById('dish-desc').value;
    const location = document.getElementById('dish-location').value;
    const foodType = document.getElementById('dish-food-type').value;
    const expiry = document.getElementById('dish-expiry').value;

    if(!name || !price || !category || !expiry || !desc || !location || !foodType) {
        alert("يرجى ملء جميع الحقول الأساسية (الاسم، السعر، فئة البائع، نوع الطعام، الوصف، الموقع، وتاريخ الانتهاء).");
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

async function publishDish(boosted) {
    if (!window.supabaseClient) {
        alert('Database connection not found.');
        return;
    }

    const isPro = document.getElementById('profile-plan') && document.getElementById('profile-plan').value.toLowerCase().includes('pro');
    
    // Auto-boost for Pro users
    if (isPro) {
        boosted = true;
    }

    // Get current user doing the publishing
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) {
        alert("You must be logged in to publish.");
        return;
    }

    const title = document.getElementById('dish-name').value;
    const price = parseFloat(document.getElementById('dish-price').value);
    const originalPrice = parseFloat(document.getElementById('dish-original-price').value);
    const category = document.getElementById('dish-category').value;
    const desc = document.getElementById('dish-desc').value;
    const location = document.getElementById('dish-location').value || "Algeria";
    
    // Quick time string for the DB
    let timeRange = '';
    const pickupTo = document.getElementById('dish-pickup-to').value;
    const expiry = document.getElementById('dish-expiry').value;
    if (pickupTo) {
        timeRange = `ينتهي على ${pickupTo}`;
    } else if (expiry) {
        timeRange = `ينتهي يوم ${expiry}`;
    } else {
        timeRange = 'Soon';
    }

    // Process image (Upload to Supabase Storage)
    let imageUrl = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=2000&auto=format&fit=crop';
    const imageInput = document.getElementById('dish-image');
    
    // UI Loading state for the publish button (optional but good for UX)
    const publishBtn = document.querySelector('button[onclick*="handlePublish"]');
    let originalBtnHtml = '';
    if (publishBtn) {
        originalBtnHtml = publishBtn.innerHTML;
        publishBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الرفع والنشر...';
        publishBtn.disabled = true;
    }

    if (imageInput && imageInput.files && imageInput.files[0]) {
        try {
            const file = imageInput.files[0];
            const fileExt = file.name.split('.').pop();
            // Generate a unique filename using random string + timestamp
            const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
            
            // Upload to Supabase Storage (Bucket name: 'images')
            const { error: uploadError } = await window.supabaseClient.storage
                .from('images')
                .upload(fileName, file);

            if (uploadError) {
                console.error('Supabase upload error:', uploadError);
                throw uploadError;
            }

            // Get Public URL
            const { data } = window.supabaseClient.storage
                .from('images')
                .getPublicUrl(fileName);

            if (data && data.publicUrl) {
                imageUrl = data.publicUrl;
            } else {
                throw new Error("تعذر جلب رابط الصورة العام");
            }

        } catch (e) {
            console.error('Image Upload Error:', e);
            alert("حدث خطأ أثناء رفع الصورة السحابية، سيتم استخدام الصورة الافتراضية.");
        }
    }

    const foodItemData = {
        donor_id: session.user.id,
        title: title,
        type: category,
        food_type: document.getElementById('dish-food-type').value,
        price: price || 0,
        original_price: originalPrice || price || 0,
        location: location,
        time_left: timeRange,
        quantity: parseInt(document.getElementById('dish-quantity').value) || 1,
        pickup_time_start: document.getElementById('dish-pickup-from').value || null,
        pickup_time_end: document.getElementById('dish-pickup-to').value || null,
        expiry_date: document.getElementById('dish-expiry').value || null,
        image: imageUrl,
        description: desc,
        promoted: boosted,
        status: 'available'
    };

    try {
        const { error } = await window.supabaseClient
            .from('food_items')
            .insert([foodItemData]);

        if (error) throw error;

        alert(`تم نشر عرض "${title}" بنجاح! 🥳`);
        
        // Show success and reset form
        renderListings();
        updateImpactAnalytics();
        showTab('overview');
        const form = document.getElementById('add-dish-form');
        if(form) {
            form.reset();
            const miniContainer = document.getElementById('image-preview-container');
            if(miniContainer) miniContainer.style.display = 'none';
            const previewImg = document.getElementById('preview-img');
            if(previewImg) previewImg.src = 'https://via.placeholder.com/400x300?text=Dish+Image';
        }
    } catch (error) {
        console.error("Error publishing food item:", error);
        alert("There was an error publishing. Please try again.");
    } finally {
        if (publishBtn) {
            publishBtn.innerHTML = originalBtnHtml;
            publishBtn.disabled = false;
        }
    }
}

async function updateProfile() {
    if (!window.supabaseClient) return;

    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) return;

    const name = document.getElementById('profile-name').value;
    const phone = document.getElementById('profile-phone').value;
    const address = document.getElementById('profile-address').value;
    const btn = document.getElementById('save-profile-btn');
    const originalText = btn.innerHTML;

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> حفظ...';
    btn.disabled = true;

    try {
        const { error } = await window.supabaseClient
            .from('profiles')
            .update({ name: name, phone: phone, address: address })
            .eq('id', session.user.id);

        if (error) throw error;
        
        document.getElementById('user-name').textContent = name;
        alert("تم تحديث الملف الشخصي بنجاح! ✅");
    } catch (err) {
        console.error(err);
        alert("حدث خطأ أثناء حفظ البيانات.");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

async function logout(event) {
    if(event) event.preventDefault();
    if (window.supabaseClient) {
        await window.supabaseClient.auth.signOut();
    }
    window.location.href = 'index.html';
}

// --- Messaging Logic ---
let currentMessages = [];

async function renderMessages() {
    const listContainer = document.getElementById('messages-list-sidebar');
    if (!listContainer || !window.supabaseClient) return;

    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) return;

    // Fetch messages with explicit join identification
    const { data: messages, error } = await window.supabaseClient
        .from('messages')
        .select(`
            *,
            sender:profiles!sender_id(name),
            receiver:profiles!receiver_id(name),
            food_items:food_id(title)
        `)
        .or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Messaging Query Error:', error);
        listContainer.innerHTML = `<p class="p-20 text-danger" style="font-size:0.8rem;">خطأ في الجلب: ${error.message}</p>`;
        return;
    }

    currentMessages = messages;
    updateMsgBadge();

    if (messages.length === 0) {
        listContainer.innerHTML = '<div class="p-20 text-center text-gray"><i class="fas fa-comment-slash fa-2x mb-10"></i><p>لا توجد رسائل بعد</p></div>';
        return;
    }

    listContainer.innerHTML = messages.map(msg => {
        const isSentByMe = msg.sender_id === session.user.id;
        const displayName = isSentByMe ? `To: ${msg.receiver?.name || 'User'}` : (msg.sender?.name || 'New User');
        const isRead = msg.read_status || isSentByMe;
        const dateObj = new Date(msg.created_at);
        const formattedDate = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;

        return `
            <div class="message-item ${isRead ? '' : 'unread'}" onclick="viewMessage('${msg.id}')" 
                 style="padding:12px 15px; border-bottom:1px solid var(--border-light); cursor:pointer; 
                        background:${isRead ? 'transparent' : 'rgba(var(--primary-rgb), 0.1)'}; 
                        border-left:4px solid ${isRead ? 'transparent' : 'var(--primary)'}; 
                        transition: all 0.2s ease; position: relative;">
                <div class="d-flex justify-between align-center mb-5" style="gap: 10px;">
                    <strong style="font-size: 0.85rem; color: var(--text-dark); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex-grow: 1;">${displayName}</strong>
                    <span style="font-size: 0.65rem; color: var(--text-gray); white-space: nowrap; flex-shrink: 0;">${formattedDate}</span>
                </div>
                <div style="font-size: 0.85rem; font-weight: ${isRead ? '400' : '700'}; color: var(--text-dark); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${msg.subject}
                </div>
            </div>
        `;
    }).join('');
}

async function viewMessage(msgId) {
    const msg = currentMessages.find(m => m.id === msgId);
    if (!msg) return;

    const emptyView = document.getElementById('message-detail-empty');
    const activeView = document.getElementById('message-detail-active');
    if (!emptyView || !activeView) return;

    emptyView.style.display = 'none';
    activeView.style.display = 'flex';

    const { data: { session } } = await window.supabaseClient.auth.getSession();
    const isSentByMe = msg.sender_id === session.user.id;
    const senderName = isSentByMe ? 'Me' : (msg.sender?.name || 'User');
    const receiverName = isSentByMe ? (msg.receiver?.name || 'User') : 'Me';

    activeView.innerHTML = `
        <div style="padding-bottom:15px; border-bottom:1px solid var(--border-light); margin-bottom:20px;">
            <div class="d-flex justify-between align-start" style="gap: 15px;">
                <div style="flex-grow: 1;">
                    <h3 style="margin-bottom:8px; color: var(--text-dark); font-size: 1.2rem;">${msg.subject}</h3>
                    <p style="font-size: 0.85rem; color: var(--text-gray); line-height: 1.4;">
                        <strong>From:</strong> ${senderName} <br> <strong>To:</strong> ${receiverName}
                    </p>
                </div>
                <span style="font-size: 0.7rem; color: var(--text-gray); background: rgba(0,0,0,0.05); padding: 4px 8px; border-radius: 4px; white-space: nowrap;">
                    ${new Date(msg.created_at).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
            </div>
            ${msg.food_items ? `
                <div style="margin-top: 12px; padding: 6px 12px; background: rgba(var(--primary-rgb), 0.08); border-radius: 6px; display: inline-flex; align-items: center; gap: 8px;">
                    <i class="fas fa-utensils text-primary" style="font-size: 0.8rem;"></i>
                    <span style="font-size: 0.8rem; font-weight: 500; color: var(--text-dark);">Regarding: ${msg.food_items.title}</span>
                </div>
            ` : ''}
        </div>
        
        <div style="flex-grow: 1; overflow-y: auto; padding-right: 10px; font-size: 1rem; line-height: 1.6; color: var(--text-dark); white-space: pre-wrap; margin-bottom: 20px;">${msg.content}</div>

        ${!isSentByMe ? `
            <div style="margin-top:auto; padding: 15px; background: rgba(var(--primary-rgb), 0.05); border-radius: 12px; border: 1px solid rgba(var(--primary-rgb), 0.1);">
                <h4 style="margin-bottom: 12px; font-size: 0.9rem; color: var(--text-dark);">Quick Reply</h4>
                <div class="form-group mb-12">
                    <textarea id="reply-text" rows="3" class="form-control" 
                        style="background: white; border-color: var(--border-light); color: #333 !important; font-size: 0.95rem;" 
                        placeholder="Type your reply here..."></textarea>
                </div>
                <button onclick="replyToMessage('${msg.id}', '${msg.sender_id}', '${msg.subject}')" class="btn btn-primary btn-block">
                    <i class="fas fa-paper-plane" style="margin-right: 8px;"></i> Send Reply
                </button>
            </div>
        ` : `
            <div class="text-center p-20" style="margin-top: auto; border: 1px dashed var(--border-light); border-radius: 8px; background: rgba(0,0,0,0.02);">
                <p class="text-gray text-sm">Waiting for recipient's response...</p>
            </div>
        `}
    `;

    // Mark as read if receiving and not already read
    if (!isSentByMe && !msg.read_status) {
        try {
            const { error } = await window.supabaseClient
                .from('messages')
                .update({ read_status: true })
                .eq('id', msgId);
            
            if (!error) {
                msg.read_status = true;
                updateMsgBadge();
                renderMessages(); // Silently re-render to update unread styles
            }
        } catch (e) { console.error('Error updating read status:', e); }
    }
}

async function replyToMessage(originalId, receiverId, originalSubject) {
    const text = document.getElementById('reply-text').value;
    if (!text.trim()) return;

    const btn = document.querySelector('#message-detail-active button');
    const originalBtnText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

    const { data: { session } } = await window.supabaseClient.auth.getSession();

    try {
        const { error } = await window.supabaseClient
            .from('messages')
            .insert([{
                sender_id: session.user.id,
                receiver_id: receiverId,
                subject: originalSubject.startsWith('Re:') ? originalSubject : 'Re: ' + originalSubject,
                content: text
            }]);

        if (error) throw error;

        alert('Reply sent! ✅');
        document.getElementById('reply-text').value = '';
        renderMessages();
        
        // Return to selection or display empty
        document.getElementById('message-detail-active').style.display = 'none';
        document.getElementById('message-detail-empty').style.display = 'block';
    } catch (err) {
        console.error(err);
        alert('Failed to send reply.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalBtnText;
    }
}

async function updateMsgBadge() {
    const badge = document.getElementById('msg-badge');
    if (!badge || !window.supabaseClient) return;
    
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) return;

    const { count, error } = await window.supabaseClient
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', session.user.id)
        .eq('read_status', false);

    if (error) return;

    if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }
}


/**
 * Realtime & Notifications System
 */
function showToast(title, message, type = 'info', icon = 'fas fa-info-circle') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Auto-select icon if not provided
    if (type === 'success') icon = 'fas fa-check-circle';
    if (type === 'warning') icon = 'fas fa-exclamation-triangle';

    toast.innerHTML = `
        <div class="toast-icon"><i class="${icon}"></i></div>
        <div class="toast-content">
            <span class="toast-title">${title}</span>
            <p class="toast-message">${message}</p>
        </div>
        <i class="fas fa-times toast-close" onclick="this.parentElement.remove()"></i>
    `;

    container.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('active'), 10);

    // Auto remove
    setTimeout(() => {
        toast.classList.remove('active');
        setTimeout(() => toast.remove(), 400);
    }, 5000);
}

async function initRealtime(userId, role) {
    if (!window.supabaseClient) return;

    // 1. Subscribe to New Messages
    window.supabaseClient
        .channel('realtime_messages')
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages',
            filter: `receiver_id=eq.${userId}`
        }, payload => {
            showToast('New Message! 💬', 'You received a new message.', 'info', 'fas fa-envelope');
            updateMsgBadge();
            // If currently viewing messages, re-render
            const msgTab = document.getElementById('messages');
            if (msgTab && msgTab.style.display !== 'none') {
                renderMessages();
            }
        })
        .subscribe();

    // 2. Subscribe to Orders
    if (role !== 'buyer' && role !== 'ngo') {
        // As a Provider: Detect NEW orders
        // Note: Realtime filter on item_id -> donor_id requires server-side logic or local filtering
        window.supabaseClient
            .channel('realtime_orders_provider')
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'orders'
            }, async payload => {
                // Check if this order's item belongs to current provider
                const { data: item } = await window.supabaseClient
                    .from('food_items')
                    .select('donor_id, title')
                    .eq('id', payload.new.item_id)
                    .single();

                if (item && item.donor_id === userId) {
                    showToast('New Order! ✨', `New order received for "${item.title}".`, 'success', 'fas fa-shopping-bag');
                    renderOrders();
                    updateImpactAnalytics();
                }
            })
            .subscribe();
    } else {
        // As a Buyer: Detect Status CHANGES
        window.supabaseClient
            .channel('realtime_orders_buyer')
            .on('postgres_changes', { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'orders',
                filter: `buyer_id=eq.${userId}`
            }, payload => {
                if (payload.old.status !== payload.new.status) {
                    showToast('Order Update 🚛', `Your order status changed to: ${payload.new.status}`, 'info', 'fas fa-concierge-bell');
                    renderRequests();
                }
            })
            .subscribe();
    }
}

// Update the main init in dashboard.js to call initRealtime
// (I will do this in the next edit chunk or combined if possible)


window.showToast = showToast;
window.initRealtime = initRealtime;
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
window.updateProfile = updateProfile;
window.closeEditModal = closeEditModal;
window.saveEditListing = saveEditListing;
window.renderMessages = renderMessages;
window.viewMessage = viewMessage;
window.replyToMessage = replyToMessage;
window.updateMsgBadge = updateMsgBadge;

