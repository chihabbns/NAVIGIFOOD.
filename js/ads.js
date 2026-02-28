// Sponsored Ads Data
const sponsoredAds = [
    {
        id: 'ad1',
        title: 'Ooredoo Sahla Box',
        description: 'أبقى كونيكتي مع أسرع شبكة 5G! جيب Sahla Box نتاعك اليوم واستمتع بأنترنت سريعة وماتتقطعش فدارك.',
        image: 'assets/images/ooredoo-sahla.png',
        link: '#'
    },
    {
        id: 'ad2',
        title: 'Marriott Hotel Constantine',
        description: 'Experience unparalleled luxury. Book your stay now and get an exclusive 20% discount on your first weekend.',
        image: 'assets/images/marriott-constantine-breakfast.jpg',
        link: '#'
    },
    {
        id: 'ad3',
        title: 'Yassir - Ride & Delivery',
        description: 'The easiest way to get around the city. Download the Yassir app and use code NAVIGI20 for your first ride.',
        image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        link: '#'
    }
];

document.addEventListener('DOMContentLoaded', () => {
    initAdsSection();
});

function initAdsSection() {
    const adsGrid = document.getElementById('ads-grid');
    if (!adsGrid) return;
    
    renderAds(adsGrid, sponsoredAds);
}

function renderAds(container, ads) {
    if (ads.length === 0) {
        container.innerHTML = '<p>No offers available at the moment.</p>';
        return;
    }
    container.innerHTML = ads.map(ad => createAdCard(ad)).join('');
}

function createAdCard(ad) {
    // Reusing the modern card design from the food offers
    return `
        <article class="card card-promoted">
            <div style="position: relative;">
                <img src="${ad.image}" alt="${ad.title}" class="card-img" style="height: 200px; object-fit: cover; width: 100%;">
                <span style="position: absolute; top: 10px; left: 10px; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; background: var(--secondary, #f39c12); color: white; display: flex; align-items: center; gap: 5px; box-shadow: var(--shadow-sm);">
                    <i class="fas fa-bullhorn"></i> Sponsored
                </span>
            </div>
            <div class="card-body">
                <h3 class="card-title">${ad.title}</h3>
                <p style="margin: 15px 0; color: var(--text-gray); font-size: 0.95rem; line-height: 1.5; min-height: 60px;">
                    ${ad.description}
                </p>
                <div class="d-flex mt-20">
                    <a href="${ad.link}" class="btn btn-primary" style="width: 100%; text-align: center;">View Offer</a>
                </div>
            </div>
        </article>
    `;
}
