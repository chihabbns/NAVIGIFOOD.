# NavigiFood — Site Map

Generated: 2026-02-19

## 📄 HTML Pages (23 files)

| File                   | Title                                 | Description                                                       |
| ---------------------- | ------------------------------------- | ----------------------------------------------------------------- |
| `index.html`           | NavigiFood - Surplus Food Marketplace | Home page with hero, category grid, featured surplus, CTA section |
| `about.html`           | About Us                              | About the platform and mission                                    |
| `add-food.html`        | Add Food                              | Form to add a new food listing                                    |
| `bakeries.html`        | Bakeries                              | Category page for bakeries                                        |
| `browse-food.html`     | Browse Food                           | Main food browsing page with filter sidebar                       |
| `contact.html`         | Contact Us                            | Contact form + contact info                                       |
| `contact-donor.html`   | Contact Donor                         | Form to message a food donor                                      |
| `dashboard.html`       | Dashboard                             | User/provider dashboard with tabs                                 |
| `donors.html`          | Donors                                | Donors/partners listing page                                      |
| `events-catering.html` | Events & Catering                     | Category page for events/catering                                 |
| `food-details.html`    | Food Details                          | Single food item detail page                                      |
| `hotels.html`          | Hotels                                | Category page for hotels                                          |
| `join.html`            | Join                                  | Role selection / onboarding page                                  |
| `login.html`           | Login                                 | Authentication - login form                                       |
| `markets.html`         | Markets                               | Category page for markets                                         |
| `ngo.html`             | NGO                                   | NGO-specific page                                                 |
| `register.html`        | Register                              | Authentication - registration form                                |
| `reserve.html`         | Reserve Order                         | Checkout/reservation page                                         |
| `restaurants.html`     | Restaurants                           | Category page for restaurants                                     |
| `terms.html`           | Terms & Conditions                    | Terms page                                                        |

## 🎨 CSS Files (1 file)

| File            | Size         | Description                                                                                                                                                                                                       |
| --------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `css/style.css` | 31,881 bytes | Main stylesheet — 1790 lines. Contains all design tokens (CSS variables), base styles, components (navbar, cards, forms, footer, modals), and responsive media queries at 1024px, 768px, 480px, 375px breakpoints |

## ⚙️ JavaScript Files (4 files)

| File              | Size         | Description                                                                                                     |
| ----------------- | ------------ | --------------------------------------------------------------------------------------------------------------- |
| `js/main.js`      | 21,564 bytes | Core JS — mobile menu, homepage render, browse/filter logic, food card creation, search suggestions, auth check |
| `js/auth.js`      | 11,560 bytes | Auth JS — login/register forms, validation, localStorage session management                                     |
| `js/dashboard.js` | 17,077 bytes | Dashboard JS — tab switching, orders, listings, live preview, payment modal                                     |
| `js/data.js`      | 4,461 bytes  | Data JS — static food items array and categories array                                                          |

## 🖼 Assets

| Directory        | Contents                                                                     |
| ---------------- | ---------------------------------------------------------------------------- |
| `assets/images/` | Empty directory — all images loaded from external URLs (placeholder service) |

## 🔗 External Dependencies

| Resource                      | Purpose                                |
| ----------------------------- | -------------------------------------- |
| Google Fonts (Poppins, Inter) | Typography                             |
| Font Awesome 6.0.0 (cdnjs)    | Icons                                  |
| Google Maps Embed             | Location embedded on food-details page |

## 📐 Responsive Breakpoints in style.css

| Breakpoint     | Media Query         |
| -------------- | ------------------- |
| Tablet/Desktop | `max-width: 1024px` |
| Tablet         | `max-width: 768px`  |
| Mobile         | `max-width: 480px`  |
| Small Mobile   | `max-width: 375px`  |

## 🗺 Page Navigation Flow

```
index.html → browse-food.html → food-details.html → reserve.html
                                                   → contact-donor.html
index.html → join.html → register.html → login.html → dashboard.html
index.html → about.html
index.html → contact.html
index.html → donors.html
index.html → restaurants.html / hotels.html / bakeries.html / markets.html / events-catering.html / ngo.html
```
