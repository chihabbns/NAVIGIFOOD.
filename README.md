# 🍽️ NavigiFood — Project Documentation

> **A web platform that connects food providers (restaurants, hotels, bakeries, markets) with buyers to reduce food waste and sell surplus food at reduced prices.**

---

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Project Goals](#2-project-goals)
3. [Technology Stack](#3-technology-stack)
4. [Project Structure (Files & Folders)](#4-project-structure)
5. [Database — Supabase](#5-database--supabase)
6. [Pages Explained](#6-pages-explained)
7. [JavaScript Files Explained](#7-javascript-files-explained)
8. [Key Features & How They Work](#8-key-features--how-they-work)
9. [User Roles](#9-user-roles)
10. [Reward Points System](#10-reward-points-system)
11. [Reservation Flow (Step by Step)](#11-reservation-flow-step-by-step)
12. [Authentication System](#12-authentication-system)
13. [Common Interview Questions & Answers](#13-common-interview-questions--answers)

---

## 1. Project Overview

**NavigiFood** is a web application built to fight food waste in Algeria.

**The Problem:** Restaurants, hotels, bakeries, and markets throw away large amounts of food every day because it was not sold in time.

**The Solution:** NavigiFood creates a marketplace where:
- **Providers** (restaurants, hotels, etc.) can list their surplus food at a discounted price.
- **Buyers** (individuals, NGOs) can browse, reserve, and pick up that food before it expires.

This reduces food waste, saves money for buyers, and generates extra income for providers.

---

## 2. Project Goals

| Goal | Description |
|------|-------------|
| 🌱 Reduce Food Waste | Prevent unsold food from being thrown away |
| 💰 Save Money | Offer food at 40–70% discount for buyers |
| 🤝 Support NGOs | Allow NGOs and charities to receive surplus food |
| 🏆 Reward Users | Give loyalty points for every reservation made |
| 📱 Responsive Design | Works on phones, tablets, and computers |

---

## 3. Technology Stack

| Technology | Purpose |
|-----------|---------|
| **HTML5** | Structure of all web pages |
| **CSS3** (Vanilla) | Styling, animations, dark mode, responsive design |
| **JavaScript (ES6+)** | All logic, DOM manipulation, API calls |
| **Supabase** | Backend database (PostgreSQL) + Authentication |
| **Font Awesome 6** | Icons used throughout the site |
| **Google Fonts** | Typography (Outfit font) |

> **Why Supabase?**
> Supabase is an open-source Firebase alternative. It provides a real PostgreSQL database, authentication, and a REST API — all without needing to build a backend server. We connect to it directly from JavaScript using the Supabase JS library.

---

## 4. Project Structure

```
NavigiFood/
│
├── index.html              ← Home page
├── about.html              ← About the project
├── browse-food.html        ← Browse all available food items
├── food-details.html       ← Single food item details page
├── reserve.html            ← Reservation / checkout page ⭐
├── dashboard.html          ← User dashboard (orders, listings, rewards)
├── register.html           ← User registration page
├── login.html              ← User login page
├── contact.html            ← Contact form
├── contact-donor.html      ← Contact a specific food provider
├── donors.html             ← Information for sellers/partners
├── join.html               ← Join as buyer or seller
├── terms.html              ← Terms & Conditions
├── add-food.html           ← Providers add new food listings
│
├── restaurants.html        ← Category: Restaurants
├── hotels.html             ← Category: Hotels
├── bakeries.html           ← Category: Bakeries
├── markets.html            ← Category: Markets
├── events-catering.html    ← Category: Events & Catering
├── ngo.html                ← Category: NGO/Charity listings
│
├── css/
│   └── style.css           ← All CSS styles (61KB, ~2000+ lines)
│
├── js/
│   ├── main.js             ← Core logic for all pages ⭐
│   ├── auth.js             ← Login & Registration logic ⭐
│   ├── dashboard.js        ← Dashboard-specific logic ⭐
│   ├── supabase-config.js  ← Database connection setup
│   ├── data.js             ← Categories list + empty food array
│   └── ads.js              ← Sponsored advertisements data
│
└── assets/
    └── images/             ← All food and UI images
```

---

## 5. Database — Supabase

The project uses **3 main tables** in the Supabase database:

### Table: `profiles`
Stores user information (linked to Supabase Auth).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | User ID (matches Supabase auth user) |
| `name` | text | Full name |
| `email` | text | Email address |
| `role` | text | `buyer`, `restaurant`, `hotel`, `bakery`, `market`, `catering`, `ngo`, `admin` |
| `plan` | text | Business plan (for providers): `basic`, `premium`, `enterprise` |
| `points` | integer | Loyalty reward points |

### Table: `food_items`
Stores all food listings posted by providers.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Unique item ID |
| `donor_id` | UUID | ID of the provider who posted it |
| `title` | text | Food item name |
| `type` | text | Category (Restaurant, Hotel, etc.) |
| `price` | number | Discounted price in DA (Algerian Dinar) |
| `original_price` | number | Original price before discount |
| `location` | text | Pickup location |
| `time_left` | text | How long until it expires (e.g. "2 hours left") |
| `image` | text | URL to the food image |
| `status` | text | `available` or `sold out` |
| `quantity` | integer | Number of units available (null = unlimited) |
| `promoted` | boolean | If true, item is shown as "Featured" |
| `merchant_name` | text | Name of the business |

### Table: `orders`
Stores all reservations made by buyers.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Order ID |
| `food_id` | UUID | Which food item was reserved |
| `buyer_id` | UUID | Who made the order |
| `donor_id` | UUID | Who the seller is |
| `buyer_name` | text | Name entered at checkout |
| `buyer_phone` | text | Phone for pickup contact |
| `pickup_time` | time | Preferred pickup time |
| `status` | text | `Pending`, `Confirmed`, `Picked Up`, `Cancelled` |
| `pickup_code` | text | 4-digit secret code for pickup verification |
| `quantity` | integer | Quantity ordered (always 1 currently) |

---

## 6. Pages Explained

### `index.html` — Home Page
- Shows food **categories** grid (Restaurants, Hotels, Bakeries, etc.)
- Shows **featured food items** fetched live from Supabase
- Has a **search bar** that lets users search by name, location, or seller
- Loads `ads.js` to show sponsored advertisements

### `browse-food.html` — Browse Food
- Shows ALL available food items from the database
- Has **advanced filters**:
  - Category checkboxes (Restaurants, Hotels, etc.)
  - Price range slider
  - Keyword search
  - Location search
  - Food type filter (Halal, Vegetarian, etc.)
  - Sort by: Featured, Price, Discount %, Savings, Time Left

### `food-details.html` — Item Details
- Shows full details of one food item (fetched by `?id=` in URL)
- Shows item image, price, discount %, location, description
- Shows **Google Maps embed** of the pickup location
- Shows **Reserve Now** button (only for buyers, not providers)

### `reserve.html` — Reservation Page ⭐ (Most Important)
- Loads item details using the `?id=` URL parameter
- Checks if the user is logged in
- Checks if item is still available (not sold out)
- Lets user enter: Name, Phone, Preferred Pickup Time
- Shows **points discount option** (500 pts = 50 DA off) if eligible
- On submit: creates order in database, deducts stock, awards points
- Generates a **4-digit pickup code**

### `dashboard.html` — User Dashboard
- **Buyers see:** Their orders list, order status, pickup codes, reward points
- **Providers see:** Their food listings, orders they received, ability to update order status
- **Rewards section:** Shows points, level (Bronze/Silver/Gold), progress bar

### `register.html` — Registration
- Form with live validation (name, email, password strength, confirm password)
- Role selection: Buyer, NGO, or Business type (Restaurant, Hotel, etc.)
- Business users must choose a plan (Basic, Premium, Enterprise)
- On success: creates Supabase auth user + profile record in `profiles` table

### `login.html` — Login
- Email + password login via Supabase Authentication
- After login: redirects buyers to `browse-food.html`, providers to `dashboard.html`

### `add-food.html` — Add Food Listing
- Only for provider accounts
- Form to add a new food item to the database

---

## 7. JavaScript Files Explained

### `js/supabase-config.js`
**Purpose:** Connects the website to the Supabase database.

```javascript
window.SUPABASE_URL = 'https://...supabase.co';
window.SUPABASE_ANON_KEY = 'eyJ...';
window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

- Creates the global `window.supabaseClient` object used by ALL other files
- If Supabase library fails to load, shows a red warning banner at the top

---

### `js/data.js`
**Purpose:** Provides the categories list used on the home page.

```javascript
const foodItems = []; // Empty — all real data comes from Supabase

const categories = [
  { name: "Restaurants", icon: "fas fa-utensils", link: "restaurants.html" },
  { name: "Hotels",      icon: "fas fa-hotel",    link: "hotels.html" },
  // ...
];
```

---

### `js/ads.js`
**Purpose:** Manages sponsored advertisement banners on the home page.

**Key functions:**
- `initAdsSection()` — Initializes the ads grid on the home page
- `renderAds(grid, ads)` — Creates HTML cards for each ad
- Contains 3 demo ads: Ooredoo, Marriott Constantine, Yassir

---

### `js/main.js` ⭐ (Core File — 1055 lines)
**Purpose:** Main logic file loaded on EVERY page. Contains all core functionality.

#### Functions in `main.js`:

| Function | What it does |
|----------|-------------|
| `initThemeToggle()` | Dark/Light mode switch. Saves preference in `localStorage`. |
| `initMobileMenu()` | Hamburger menu for mobile devices. |
| `fetchGlobalSearchItems()` | Pre-fetches all food items from DB for the search bar. |
| `initSearchSuggestions()` | Live search suggestions dropdown — groups by Dish, Merchant, Location. |
| `showPopularSearches()` | Shows trending items when search bar is focused but empty. |
| `renderSuggestions()` | Renders the dropdown suggestion list with highlighted text. |
| `checkAuth()` | Checks if user is logged in. If yes: shows points + My Account + Logout buttons in nav. |
| `logout()` | Signs out from Supabase and redirects to home page. |
| `initHomePage()` | Renders category grid + fetches and displays 4 featured items. |
| `initBrowsePage()` | Full browse page: fetches all items, sets up all filters and sort logic. |
| `applyFilters()` | (inside initBrowsePage) Filters and sorts the food list based on user selections. |
| `renderGrid()` | Renders a grid of food cards from an array of items. |
| `initDetailsPage()` | Fetches one food item by ID, renders full details + map embed. |
| `createFoodCard()` | Returns HTML string for a single food card (used in grids). |
| `initCategoryPage()` | Fetches items by category type (e.g., "Restaurant") from Supabase. |
| `fetchUserPoints()` | Gets the current user's points from DB, returns points + level. |
| `addPoints(amount)` | Adds reward points to user's profile after a reservation. |
| `redeemPoints()` | Deducts 500 points from user's profile for a discount. |
| `updatePointsDisplay()` | Updates all `.points-display` elements on the page with current points. |
| `renderDashboardRewards()` | Updates the dashboard reward section: points, level, progress bar. |

---

### `js/auth.js` ⭐ (Authentication — 476 lines)
**Purpose:** Handles all registration and login logic.

#### Key functions in `auth.js`:

| Function | What it does |
|----------|-------------|
| `showError(id, msg)` | Shows a red error message under a form field. |
| `hideError(id)` | Hides an error message. |
| `setFieldState(input, isValid, ...)` | Colors a field green (valid) or red (invalid) with a glow effect. |
| `togglePlanVisibility()` | Shows business plan cards only when a provider role is selected. |
| Password Strength Meter | Checks length, uppercase, numbers, special chars — shows Weak/Fair/Good/Strong. |
| `liveCheckConfirmPassword()` | Checks if confirm password matches password in real time. |
| Register `submit` handler | Validates all fields → calls `supabaseClient.auth.signUp()` → inserts into `profiles` table. |
| Login `submit` handler | Calls `supabaseClient.auth.signInWithPassword()` → redirects based on role. |

---

### `js/dashboard.js` ⭐ (Dashboard — 52KB)
**Purpose:** Powers everything in the dashboard for both buyers and providers.

**Main sections:**
- **For Buyers:** Shows order history with status, pickup code, and details.
- **For Providers:** Shows their food listings and orders received. Allows updating order status (Pending → Confirmed → Picked Up).
- **Profile Section:** Shows user info, allows updating name.
- **Rewards Section:** Calls `renderDashboardRewards()` from `main.js` to show points and level.

---

## 8. Key Features & How They Work

### 🔍 Smart Search Bar
```
User types → input event fires → filters globalSearchItems array
→ Groups results into: Dishes | Merchants | Locations
→ Highlights matching text in bold → Shows dropdown
→ Arrow keys to navigate, Enter to select
```

### 🌙 Dark Mode
```
Page loads → reads localStorage('theme') → sets data-theme on <html>
User clicks toggle → switches theme → saves to localStorage → spin animation
CSS uses [data-theme="dark"] selectors to change all colors
```

### 🔎 Browse Filters
```
User changes any filter → applyFilters() runs
→ Filters by: Category, Food Type, Keyword, Location, Price
→ Sorts by: Featured/Price/Discount/Savings/TimeLeft
→ Re-renders grid with matching items
→ Updates results count
```

### 🗺️ Maps Integration
```
Item's location string → encoded with encodeURIComponent()
→ Embedded in Google Maps iframe src URL
→ Shows map pin on food-details.html page
```

---

## 9. User Roles

| Role | Access |
|------|--------|
| `buyer` | Browse food, make reservations, earn points, use discounts |
| `ngo` | Same as buyer, but represents a charity/NGO |
| `restaurant` | Add food listings, manage their orders, view their dashboard |
| `hotel` | Same as restaurant |
| `bakery` | Same as restaurant |
| `market` | Same as restaurant |
| `catering` | Same as restaurant |
| `admin` | Full access to dashboard |

> **Important:** Providers CANNOT make reservations. If a provider tries to click "Reserve Now", the system blocks them with an alert message.

---

## 10. Reward Points System

### How Points Work

| Action | Points |
|--------|--------|
| Make a reservation | +points equal to the price in DA (e.g., 200 DA order = +200 pts) |
| Use 500 pts discount | -500 pts, get 50 DA off the price |
| Earn on discounted order | Points based on final price after discount |

### Loyalty Levels

| Level | Points Required |
|-------|----------------|
| 🥉 Bronze | 0 – 999 pts |
| 🥈 Silver | 1,000 – 2,999 pts |
| 🥇 Gold | 3,000+ pts |

### How It's Implemented

1. After a successful reservation, `addPoints(price)` is called
2. It fetches current points from `profiles` table
3. Adds new points and updates the record in Supabase
4. `updatePointsDisplay()` refreshes the points shown in the navbar

---

## 11. Reservation Flow (Step by Step)

This is the most important flow in the application:

```
Step 1: User clicks "Reserve Now" on food-details.html
        → Redirected to reserve.html?id=<food_item_id>

Step 2: Page loads the food item from Supabase using the ID in the URL

Step 3: If user has 500+ points, shows a "Use discount" checkbox

Step 4: User fills in: Full Name, Phone, Preferred Pickup Time

Step 5: User clicks "Confirm Reservation" → form submits

Step 6: System checks:
        ✓ Is user logged in? (if not → redirect to login)
        ✓ Is user a buyer? (if provider → block with alert)
        ✓ Is item still available? (quantity > 0 and status = "available")

Step 7: Insert new record into `orders` table

Step 8: Decrement quantity in `food_items` table
        → If quantity = 0, set status to "sold out"

Step 9: If discount checkbox checked:
        → Deduct 500 pts from user's profile

Step 10: Award points to buyer:
         → addPoints(finalPrice) → updates profiles.points in DB

Step 11: Generate 4-digit pickup code (random number 1000-9999)

Step 12: Show success alert with pickup code
         → Redirect to dashboard.html
```

---

## 12. Authentication System

Built using **Supabase Authentication** (based on JWT tokens).

### Registration Flow:
```
1. supabaseClient.auth.signUp({ email, password, options: { data: { name, role, plan } } })
2. Supabase creates auth user and sends confirmation email
3. JavaScript then inserts a matching row in our `profiles` table
4. Redirect to dashboard (providers) or browse-food (buyers)
```

### Login Flow:
```
1. supabaseClient.auth.signInWithPassword({ email, password })
2. Supabase returns a session with JWT token (stored automatically in browser)
3. Fetch user's profile to get their role
4. Redirect based on role
```

### Session Persistence:
- Supabase automatically stores the session in `localStorage`
- `checkAuth()` in main.js calls `supabaseClient.auth.getSession()` on every page
- If session exists → shows "My Account" and "Logout" in navbar

### Anti-FOWT (Flash of Wrong Theme):
Each HTML page has this inline script in `<head>` that runs BEFORE the page renders:
```javascript
(function(){
  var t = localStorage.getItem('theme');
  if(!t){ t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; }
  document.documentElement.setAttribute('data-theme', t);
})();
```
This prevents the page from flashing white before switching to dark mode.

---

## 13. Common Interview Questions & Answers

**Q: What is the main problem your project solves?**
> A: Food waste. Every day, restaurants and hotels throw away unsold food. NavigiFood connects these providers with buyers who can purchase this food at 40–70% discount before it expires.

**Q: Why did you choose Supabase?**
> A: Supabase provides a ready-made backend with a real PostgreSQL database and authentication system. We can interact with it directly from JavaScript without needing to build a server with Node.js or PHP. It's free for small projects and perfect for a web project without a backend.

**Q: How does authentication work?**
> A: We use Supabase Auth which handles JWT tokens. When a user logs in, Supabase creates a session stored in the browser's localStorage. On every page, we call `getSession()` to check if the user is still logged in.

**Q: How do you prevent a provider from making a reservation?**
> A: When the reservation form is submitted, we fetch the user's `role` from the `profiles` table in Supabase. If the role is one of `[restaurant, hotel, bakery, market, catering, donor]`, we show an alert and stop the process.

**Q: How does the points system work?**
> A: Every time a user successfully reserves food, we add points equal to the price they paid (in DA) to their profile in the database. When they accumulate 500 points, they can use them as a 50 DA discount on their next order. Levels are: Bronze (0-999), Silver (1000-2999), Gold (3000+).

**Q: What happens when food runs out?**
> A: When an order is placed, we decrement the `quantity` field in `food_items`. If quantity reaches 0, we change the `status` to `"sold out"`. Before accepting any reservation, we check the current quantity — if it's 0 or the status is "sold out", we block the reservation.

**Q: How does the search work?**
> A: The search fetches all available food items from Supabase at page load and stores them in `window.globalSearchItems`. When the user types, we filter this array by title, donor name, and location simultaneously. Results are grouped into 3 categories and shown in a dropdown with highlighted matching text.

**Q: How does dark mode work?**
> A: We use a CSS custom properties (variables) approach. The `<html>` element gets a `data-theme="dark"` or `data-theme="light"` attribute. CSS variables like `--bg-primary`, `--text-color` change values based on this attribute using `[data-theme="dark"]` selectors. The choice is saved in `localStorage` and applied before page render to prevent flashing.

**Q: What is the pickup code?**
> A: A random 4-digit number generated with `Math.floor(1000 + Math.random() * 9000)`. It is stored in the `orders` table and shown to the buyer. The provider can ask for this code when the buyer arrives to verify the order.

**Q: Is the project responsive (mobile-friendly)?**
> A: Yes. We use CSS Grid with `repeat(auto-fit, minmax(...))` and a hamburger menu for mobile. The breakpoints are handled with CSS media queries in `style.css`.

---

## 📊 Project Summary Stats

| Metric | Value |
|--------|-------|
| Total HTML pages | 19 pages |
| Total JavaScript code | ~120KB (3 main JS files) |
| Total CSS code | ~62KB (single style.css) |
| Database tables | 3 (profiles, food_items, orders) |
| User roles | 8 different roles |
| Key features | Search, Filter, Reserve, Auth, Points, Dark Mode, Maps |

---

---

## 14. Complete Functions Reference (All Files)

> This section lists **every function** in the project with a clear explanation of what it does.

---

### 📁 `js/supabase-config.js`

This file has no functions — it runs inline code on load:
- Reads `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- Calls `window.supabase.createClient()` to create the DB connection
- If connection fails → injects a red error banner into the page

---

### 📁 `js/data.js`

No functions — only data definitions:
- `foodItems = []` → empty array (real data comes from Supabase)
- `categories = [...]` → array of 6 category objects used on the home page

---

### 📁 `js/ads.js`

| # | Function | Parameters | What It Does |
|---|----------|-----------|--------------|
| 1 | `initAdsSection()` | none | Entry point. Finds the `#ads-grid` element on the page. If found, calls `renderAds()`. |
| 2 | `renderAds(container, ads)` | `container` = DOM element, `ads` = array | Loops over the ads array and calls `createAdCard()` for each one. Injects the result into the container. |
| 3 | `createAdCard(ad)` | `ad` = one ad object `{id, title, description, image, link}` | Returns an HTML string for a single sponsored ad card with image, title, description, and a "View Offer" button. |

---

### 📁 `js/main.js`

| # | Function | Parameters | What It Does | Returns |
|---|----------|-----------|--------------|---------|
| 1 | `fetchGlobalSearchItems()` | none | Fetches ALL available food items from Supabase at startup. Stores them in `window.globalSearchItems` for the search bar to use. | nothing (async) |
| 2 | `initThemeToggle()` | none | Wires the dark/light mode toggle button. Reads current theme from `localStorage`, updates the `<html data-theme>` attribute, plays a spin animation, and saves the new choice. | nothing |
| 3 | `initMobileMenu()` | none | Wires the hamburger (☰) button for mobile. Toggles the `active` class on the nav links. Switches the icon between ☰ (bars) and ✕ (times). | nothing |
| 4 | `initSearchSuggestions()` | none | Sets up live search dropdowns on all `.search-input` elements. Handles: typing → filter, focus → popular searches, keyboard navigation (↑↓ arrows, Enter, Escape). | nothing |
| 5 | `showPopularSearches(container)` | `container` = dropdown DOM element | Shows the first 3 food items and top 2 locations as "popular" suggestions when the search bar is focused but empty. | nothing |
| 6 | `renderSuggestions(container, groups, term, title)` | `container` = dropdown element, `groups` = object of result arrays, `term` = search text, `title` = optional custom header | Builds and injects the suggestion dropdown HTML. Highlights matching text in bold. Shows a "no results" message if nothing matches. | nothing |
| 7 | `selectSuggestion(text, el)` | `text` = selected suggestion text, `el` = the clicked DOM element | Sets the search input value to the chosen suggestion, hides the dropdown, and submits the search form (on home page) or triggers an input event (on other pages). | nothing |
| 8 | `checkAuth()` | none | Calls `supabaseClient.auth.getSession()`. If logged in: fetches user role, replaces the "Get Started" nav item with "⭐ Points • My Account • Logout" buttons. Calls `updatePointsDisplay()`. | nothing (async) |
| 9 | `logout(e)` | `e` = optional click event | Calls `supabaseClient.auth.signOut()` then redirects to `index.html`. | nothing (async) |
| 10 | `initHomePage()` | none | Renders the category grid from `data.js`. Fetches the 4 newest available food items from Supabase and renders them as cards. | nothing (async) |
| 11 | `initBrowsePage()` | none | The main browse page engine. Fetches all food items, sets up all filter event listeners (category checkboxes, price slider, keyword, location, food type, sort). Calls `applyFilters()` on load. | nothing (async) |
| 12 | `applyFilters()` | none (uses closure variables from initBrowsePage) | Reads all active filter values, filters the `liveFoodItems` array step by step (category → food type → keyword → location → price → sort), then re-renders the grid and updates the count. | nothing |
| 13 | `renderGrid(container, items)` | `container` = DOM element, `items` = array | If items exist: maps each item to a card HTML string and injects all into the container. If empty: shows "No items found." message. | nothing |
| 14 | `initDetailsPage()` | none | Reads `?id=` from the URL. Fetches that food item from Supabase. Renders the full detail view: image, price, discount %, description, location, and a Google Maps iframe. Adds Reserve/Contact buttons based on user role. | nothing (async) |
| 15 | `createFoodCard(item)` | `item` = food item object | Returns an HTML string for a complete food card: image, discount badge, type badge, title, merchant, location, time left, price, View/Reserve/Contact buttons. "Sold Out" overlay is shown if `item.quantity === 0`. | `string` (HTML) |
| 16 | `initCategoryPage(type)` | `type` = category string e.g. `"Restaurant"` | Fetches food items from Supabase filtered by type. Renders them as a grid. Falls back to a "no items" message if empty. | nothing (async) |
| 17 | `initCategoryPages()` | none | Called on all category pages. Reads `data-category` attribute from the grid element, then calls `initCategoryPage(type)`. | nothing |
| 18 | `fetchUserPoints()` | none | Gets the logged-in user's session, fetches their `points` from `profiles` table. Calculates their level (Bronze/Silver/Gold). | `{ points, level }` (async) |
| 19 | `addPoints(amount)` | `amount` = number of points to add | Fetches current points → adds the new amount → updates `profiles` table in Supabase → calls `updatePointsDisplay()`. | nothing (async) |
| 20 | `redeemPoints()` | none | Checks if user has ≥500 pts. If yes: deducts 500 pts from DB and shows a success alert. If no: shows "not enough points" alert. | nothing (async) |
| 21 | `updatePointsDisplay()` | none | Finds all `.points-display` elements on the page. Calls `fetchUserPoints()`, then updates their content with the current point count and icon. Also calls `renderDashboardRewards()` if it exists. | nothing (async) |
| 22 | `renderDashboardRewards(data)` | `data = { points, level }` | Updates the 4 dashboard reward elements: points count, level text, progress bar width, and next-level message. | nothing |

---

### 📁 `js/auth.js`

| # | Function | Parameters | What It Does |
|---|----------|-----------|--------------|
| 1 | `showError(elementId, message)` | `elementId` = ID of error span, `message` = text to show | Finds the error span by ID, sets its text, makes it red and visible. |
| 2 | `hideError(elementId)` | `elementId` = ID of error span | Hides the error span by setting `display: none`. |
| 3 | `setFieldState(input, isValid, successMsg, errorId, errorMsg)` | `input` = form field, `isValid` = boolean, messages and IDs | If valid: colors border green with glow, shows success message. If invalid: colors border red with glow, shows error message. |
| 4 | `clearFieldState(input, errorId)` | `input` = form field, `errorId` = error span ID | Removes all colored borders and hides the error message. |
| 5 | `showSuccess(errorId, message)` | `errorId` = span ID, `message` = success text | Shows a green success message in the given span. |
| 6 | `togglePlanVisibility()` | none | Shows the business plan cards section if a provider role (restaurant, hotel, etc.) is selected. Hides it for buyer/NGO roles. |
| 7 | `liveCheckConfirmPassword()` | none | Compares confirm-password field with password field in real time. Colors the field green (match) or red (mismatch). |
| 8 | Password Strength Handler | (inline event listener on `#password`) | On each keystroke: checks length ≥8, mixed case, numbers, special chars. Updates a progress bar: Weak (25% red) → Fair (50% orange) → Good (75% blue) → Strong (100% green). |
| 9 | Register `submit` handler | (async event listener on `#registerForm`) | Validates all fields. Calls `supabaseClient.auth.signUp()`. On success: inserts into `profiles` table. Redirects providers to dashboard, buyers to browse page. |
| 10 | Login `submit` handler | (async event listener on `#loginForm`) | Calls `supabaseClient.auth.signInWithPassword()`. Fetches profile to get role. Redirects: providers/NGOs → `dashboard.html`, buyers → `browse-food.html`. |

---

### 📁 `js/dashboard.js`

| # | Function | Parameters | What It Does |
|---|----------|-----------|--------------|
| 1 | `updateUserProfile(user)` | `user = { name, email, role, plan, phone, address }` | Fills the dashboard sidebar with the user's name, role icon (store/heart/user), email, and plan. Adds a gold crown icon for Pro users. |
| 2 | `updateImpactAnalytics()` | none | Fetches order data and updates the 3 stats cards. **Buyers:** Meals Rescued, Money Saved, Pending Requests. **Providers:** Active Dishes, Pending Orders, Total Revenue. |
| 3 | `configureDashboardForRole(role)` | `role` = user role string | Shows/hides sidebar links and content sections based on role. Buyers see "My Orders" section. Providers see "My Listings" and "Orders Received" sections. |
| 4 | `capitalize(str)` | `str` = any string | Returns the string with its first letter capitalized. e.g. `"buyer"` → `"Buyer"`. |
| 5 | `showTab(tabId)` | `tabId` = ID of the tab to show | Hides all dashboard tabs, shows the one with the matching ID, updates the active sidebar link style. If tab is "messages", calls `renderMessages()`. If tab is "add-dish", calls `initLivePreview()`. |
| 6 | `renderNotifications(role)` | `role` = user role string | Fetches the 3 most recent orders and generates colored alert banners: buyers see "order confirmed/rejected" alerts, providers see "new order received" alerts. |
| 7 | `renderOrders()` | none | **Providers only.** Fetches all orders where `donor_id = current user`. Renders each order as a card with: buyer name, phone, pickup time, status badge, and Accept/Reject buttons for pending orders. Shows pickup code when confirmed. |
| 8 | `renderListings()` | none | **Providers only.** Fetches all food items posted by the current user. Renders them as a table with title, status, Edit (pencil) and Delete (trash) buttons. |
| 9 | `renderRequests()` | none | **Buyers only.** Fetches all orders where `buyer_id = current user`. Renders each order with: food title, merchant name, date, status badge, and pickup code (if confirmed). |
| 10 | `getStatusColor(status)` | `status` = order status string | Returns a CSS color variable string based on order status: Pending=orange, Confirmed/Active=green, Collected=blue, Rejected/Expired=red. |
| 11 | `updateOrderStatus(id, status, foodId)` | `id` = order ID, `status` = new status, `foodId` = food item ID | Updates order status in DB. If status is "Rejected": also restores the food item's quantity (+1) and sets status back to "available". Then refreshes the orders list. |
| 12 | `editListing(id)` | `id` = food item ID | Fetches the food item from DB, fills the edit modal fields (title, price, quantity, status), then shows the edit modal. |
| 13 | `closeEditModal()` | none | Hides the edit modal by setting `display: none`. |
| 14 | `saveEditListing()` | none | Reads values from the edit modal form fields. Sends an UPDATE query to Supabase for that food item. Closes modal and refreshes the listings table. |
| 15 | `deleteListing(id)` | `id` = food item ID | Shows a browser confirm dialog. If confirmed: deletes the food item from Supabase and refreshes the listings table. |
| 16 | `initLivePreview()` | none | Sets up real-time preview for the "Add Dish" form. Every time a field changes, the preview card on the right side updates instantly with the new values. Handles image file upload preview via `FileReader`. |
| 17 | `validateForm()` | none | Checks that all required "Add Dish" fields are filled (name, price, category, food type, description, location, expiry). Shows an alert if any are missing. Returns `true` or `false`. |
| 18 | `handlePublishFree()` | none | Validates the form and calls `publishDish(false)` — publishes without the "Featured" boost. |
| 19 | `handlePublishBoost()` | none | Validates the form. If user is Pro: calls `publishDish(true)` directly (free boost). If not Pro: opens the payment modal. |
| 20 | `closePaymentModal()` | none | Hides the payment modal. |
| 21 | `processPayment()` | none | Simulates payment of 200 DA, closes the modal, then calls `publishDish(true)`. |
| 22 | `publishDish(boosted)` | `boosted` = boolean (featured or not) | Uploads the image to Supabase Storage, gets the public URL, then inserts the full food item record into the `food_items` table. Resets the form and redirects to Overview tab on success. |
| 23 | `updateProfile()` | none | Reads name, phone, and address from profile form fields. Updates the `profiles` table in Supabase. Updates the sidebar name display. |
| 24 | `logout(event)` | `event` = optional click event | Signs out from Supabase auth and redirects to `index.html`. |
| 25 | `renderMessages()` | none | Fetches all messages where the current user is sender OR receiver. Renders them as a list in the sidebar. Unread messages have a colored left border and bold text. Calls `updateMsgBadge()`. |
| 26 | `viewMessage(msgId)` | `msgId` = message UUID string | Finds the message in `currentMessages` array. Renders the full message content, sender/receiver info, and timestamp. Shows a reply textarea if the current user is the receiver. Marks message as read in DB. |
| 27 | `replyToMessage(originalId, receiverId, originalSubject)` | `originalId` = message ID, `receiverId` = UUID, `originalSubject` = subject string | Inserts a new message into the `messages` table as a reply (prefixes subject with "Re:"). Refreshes the messages list. |
| 28 | `updateMsgBadge()` | none | Counts unread messages for the current user. Shows the count number on the "Messages" tab badge. Hides badge if count is 0. |
| 29 | `showToast(title, message, type, icon)` | `title`, `message` = strings, `type` = `info`/`success`/`warning`, `icon` = Font Awesome class | Creates a toast notification popup in the bottom corner. Auto-disappears after 5 seconds with a slide-out animation. |
| 30 | `initRealtime(userId, role)` | `userId` = UUID, `role` = user role string | Starts Supabase Realtime subscriptions: **All users** listen for new messages. **Providers** listen for new orders on their items. **Buyers** listen for order status changes. Shows a toast notification when any event fires. |

---

### 📁 `reserve.html` (Inline Script)

| # | Function | Parameters | What It Does |
|---|----------|-----------|--------------|
| 1 | Page load handler | `DOMContentLoaded` event | Reads `?id=` from URL, fetches item from Supabase, checks if user has 500+ pts (shows discount checkbox), renders order summary. |
| 2 | `toggleDiscount(basePrice)` | `basePrice` = original item price | Called when the points discount checkbox is clicked. Updates the displayed price: if checked → `basePrice - 50 DA`, if unchecked → original price. Shows an "Applied" badge. |
| 3 | Form `submit` handler | form submit event | Full reservation logic: checks login, checks role (blocks providers), checks stock availability, inserts order into DB, decrements quantity, handles points discount, awards new points, shows pickup code. |

---

## 📌 Quick Concept Glossary

| Term | Meaning |
|------|---------|
| **Supabase** | The cloud database used. Think of it as Google Firebase but open-source. |
| **JWT Token** | A secure login token Supabase gives to the user after login. Stored in browser automatically. |
| **async/await** | JavaScript syntax for handling operations that take time (like fetching from a database) without freezing the page. |
| **localStorage** | Browser storage that keeps data (like dark mode preference) even after closing the tab. |
| **DOM** | Document Object Model — the HTML elements on the page that JavaScript can read and change. |
| **URL params** | Information passed in the URL after `?`, like `reserve.html?id=123`. |
| **Realtime** | Supabase feature that sends live updates to the browser when database records change, without refreshing the page. |
| **RLS** | Row Level Security — Supabase feature that ensures users can only access their own data. |
| **CDN** | Content Delivery Network — where the Supabase JS library and Font Awesome icons are loaded from (not hosted locally). |
| **FOWT** | Flash of Wrong Theme — when the page briefly shows the wrong color before JavaScript applies the correct theme. Fixed by the inline `<script>` in each page's `<head>`. |

---

*© 2026 NavigiFood — Developed by Chihab Benslimane*
