# NavigiFood — Audit Report

Generated: 2026-02-19  
Method: Full source code static analysis (1790-line CSS + 23 HTML files + 4 JS files)

---

## CRITICAL ISSUES (Layout-Breaking)

### 1. `grid-fit-200` class — MISSING from CSS

- **Pages Affected:** `dashboard.html` (provider-stats, seeker-stats, add-dish form)
- **Used at:** `<div class="grid grid-fit-200 mb-40">`
- **Impact:** Grid collapses to no columns at all — items stack in browser default flow
- **Fix:** Add `.grid-fit-200 { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }`

### 2. `align-start` class — MISSING from CSS

- **Pages Affected:** `dashboard.html` — `<div class="grid grid-sidebar gap-40 align-start">`
- **Impact:** Grid items don't align to top — sidebar and content misalign
- **Fix:** Add `.align-start { align-items: start; }`

### 3. `gap-40` class — MISSING from CSS

- **Pages Affected:** `dashboard.html`
- **Impact:** Grid gap falls back to default (0px), columns appear squished together
- **Fix:** Add `.gap-40 { gap: 40px; }`

### 4. Dashboard `.grid-sidebar` at tablet (768px–1024px) — Not stacking

- **Pages Affected:** `dashboard.html`
- **Issue:** `.grid-sidebar` is 1fr 3fr at all sizes; no override at 768px specifically
- **Impact:** Sidebar and content squished side by side on 768px tablets
- **Fix:** Add `@media (max-width: 1024px)` override for `.grid-sidebar` to stack

### 5. `list-none` class — MISSING from CSS

- **Pages Affected:** `dashboard.html` sidebar `<ul class="list-none">`
- **Impact:** Bullet points appear in the sidebar navigation list
- **Fix:** Add `.list-none { list-style: none; }`

### 6. `border-bottom` class — MISSING from CSS

- **Pages Affected:** `dashboard.html` user profile area
- **Impact:** No border rendered — broken visual section separator
- **Fix:** Add `.border-bottom { border-bottom: 1px solid var(--border-color); }`

### 7. `pb-20` class — MISSING from CSS

- **Pages Affected:** `dashboard.html`
- **Impact:** No bottom padding on sidebar profile section
- **Fix:** Add `.pb-20 { padding-bottom: 20px; }`

### 8. `border-collapse` class — MISSING from CSS

- **Pages Affected:** `dashboard.html` (listings table)
- **Impact:** Table borders don't collapse properly — double borders visible
- **Fix:** Add `.border-collapse { border-collapse: collapse; }`  
  Note: This is a CSS table property, not a class — correct approach is `table.w-100 { border-collapse: collapse; }`

### 9. `p-10` class — MISSING from CSS

- **Pages Affected:** `dashboard.html` (table th/td)
- **Impact:** No padding in table cells — text appears cramped/borderless
- **Fix:** Add `.p-10 { padding: 10px; }`

### 10. `text-sm` class — MISSING from CSS

- **Pages Affected:** `dashboard.html` (preview note text)
- **Impact:** Text doesn't render smaller — design inconsistency
- **Fix:** Add `.text-sm { font-size: 0.875rem; }`

### 11. `text-warning` class — MISSING from CSS

- **Pages Affected:** `dashboard.html` (seeker stats - Pending Requests count)
- **Impact:** Count number uses wrong color (falls back to default text color)
- **Fix:** Add `.text-warning { color: var(--accent); }`

---

## HIGH SEVERITY ISSUES (Responsive Failures)

### 12. Hero search bar `.search-btn` — Under 44px on 480px

- **Pages Affected:** `index.html`
- **CSS Line 1266:** `.search-btn { width: 45px; height: 45px; }` — borderline (45px is barely acceptable, but the padding inside the container reduces the actual tap area)
- **Fix:** Keep width/height at 48px minimum; ensure padding doesn't compress it

### 13. Login "Remember me / Forgot Password" row — Overflow at 320px

- **Pages Affected:** `login.html`
- **Issue:** `d-flex justify-between align-center` with two flex children — at 320px, "Forgot Password?" wraps or overflows
- **Fix:** Add `flex-wrap: wrap; gap: 8px;` for this row at mobile

### 14. `.d-flex.justify-between.align-center` utility rows — No flex-wrap

- **Pages Affected:** `index.html` (Featured Surplus header), `dashboard.html` (multiple rows)
- **Fix:** Add `flex-wrap: wrap` to `.justify-between` or add a `.flex-wrap` utility class

### 15. Dashboard "Add Dish" tab — Two-panel grid at mobile

- **Pages Affected:** `dashboard.html`
- **Issue:** `grid-sidebar` used for form + preview — at mobile, both panels squish
- **The existing CSS override** `grid-sidebar { 1fr !important }` at 768px should work, but need to verify the `sticky-top` (missing class) doesn't cause layout issues

### 16. `sticky-top` class — MISSING from CSS

- **Pages Affected:** `dashboard.html` (Live Preview column `<div class="preview-column sticky-top">`)
- **Impact:** Preview panel doesn't stick while scrolling — functional UX issue
- **Fix:** Add `.sticky-top { position: sticky; top: 80px; }`

### 17. Browse food `.grid-sidebar` — Sidebar not collapsing on mobile

- **Pages Affected:** `browse-food.html`
- **Current CSS:** At 1024px `browse-layout` direction changes, but browse-food uses `.grid.grid-sidebar` not `.browse-layout`
- The 768px rule `grid-sidebar { grid-template-columns: 1fr !important }` covers this
- However, `.filters-section` has no class `.browse-layout` — only the direct `.grid-sidebar` override applies

### 18. Category pages — No search bar in header

- **Pages Affected:** `browse-food.html` — header has a form tag but no search input

### 19. Footer `.logo` color in footer — White text class dependency

- **Pages Affected:** All pages with footer
- **Issue:** `<a href="#" class="logo text-white">` — but `logo` CSS sets `color: var(--primary)` and `text-white` sets `color: white`. Works correctly ONLY if text-white wins specificity — it does since it comes after.

---

## MEDIUM SEVERITY ISSUES

### 20. Image cards — All images from external placeholder service

- **Pages Affected:** All pages using `createFoodCard()`
- **Issue:** Images from `via.placeholder.com` — if offline, all cards show broken images
- **Note:** Cannot fix without real images, but worth flagging

### 21. Dashboard modal `.modal` — Uses `display: none` without `flex` override

- **CSS Lines 1737-1748:** `.modal { display: none; }` but flexbox properties (`align-items`, `justify-content`) are set on the same selector
- When shown via JS (`style="display: flex"` inline), it works. But if toggled via class, `display: flex` not set
- **Fix:** Note this for JS — currently `.modal` show logic uses `style="display: flex"` inline which is fine

### 22. `nav-links` mobile dropdown — z-index conflict with hero

- **Pages Affected:** `index.html`
- **Issue:** `.hero` has `z-index: 50` and `.nav-links.active` has no explicit z-index — the dropdown may appear behind the hero on some browsers
- **Fix:** Add `z-index: 1001` to `.nav-links.active` / `.nav-links` when open

### 23. Auth section padding on very small screens (320px)

- **Pages Affected:** `login.html`, `register.html`
- **Issue:** `.auth-box { padding: 40px }` — at 320px viewport with 12px container padding: 320 - 24 = 296px for auth-box; then 40px padding each side leaves only 216px for form content — tight but workable
- At 480px override: `padding: 25px 15px` — this is fine
- At 375px: no auth-box padding override — uses 480px rule (25px 15px) — OK

### 24. `search-suggestions` z-index below sticky navbar

- `search-suggestions { z-index: 9999 }` — correct
- But `.search-container { z-index: 1000 }` — the container's stacking context matches navbar (1000), so suggestions may not render above other content properly on browse page

### 25. `text-left` used in CSS but `.text-start` in HTML

- Some elements use data-i18n `text-start` which in the CSS is `text-align: left` — ✅ fine

---

## LOW SEVERITY ISSUES

### 26. `.contact-form` — No dedicated CSS class

- **Pages Affected:** `contact.html`
- Form renders correctly via `.form-group` / `.form-control` generic styles. No issue.

### 27. Terms link in registration — small touch target

- `<a href="terms.html" class="text-primary">Terms & Conditions</a>` inside a `checkbox-item` label
- At mobile, the link is inline and the text is small — under 44px touch height.

### 28. Social media links in contact.html — Pure `<a href="#">` placeholders

- Not broken, just not functional — acceptable for demo

### 29. `data-i18n` attributes — no i18n JS loaded

- Many elements have `data-i18n` attributes but no translation script is loaded (was removed)
- No visual impact since the HTML contains English text directly

### 30. `grid[style*="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))"]`

- **Pages Affected:** `dashboard.html`
- This inline style selector in media query CSS won't work because the class `grid-fit-200` is used (not inline style)
- So the 768px override `[style*="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))"]` won't fire
- Fix: the `grid-fit-200` class must be added AND then overrides apply via the class

---

## ISSUES SUMMARY TABLE

| #   | Severity | Type                                    | Pages             | Fixed?  |
| --- | -------- | --------------------------------------- | ----------------- | ------- |
| 1   | CRITICAL | Missing CSS class `grid-fit-200`        | dashboard         | PENDING |
| 2   | CRITICAL | Missing CSS class `align-start`         | dashboard         | PENDING |
| 3   | CRITICAL | Missing CSS class `gap-40`              | dashboard         | PENDING |
| 4   | HIGH     | `grid-sidebar` not stacking at tablet   | dashboard, browse | PENDING |
| 5   | CRITICAL | Missing CSS class `list-none`           | dashboard         | PENDING |
| 6   | HIGH     | Missing CSS class `border-bottom`       | dashboard         | PENDING |
| 7   | HIGH     | Missing CSS class `pb-20`               | dashboard         | PENDING |
| 8   | MEDIUM   | Table border-collapse not applied       | dashboard         | PENDING |
| 9   | HIGH     | Missing CSS class `p-10`                | dashboard         | PENDING |
| 10  | MEDIUM   | Missing CSS class `text-sm`             | dashboard         | PENDING |
| 11  | HIGH     | Missing CSS class `text-warning`        | dashboard         | PENDING |
| 12  | HIGH     | Search button too small on 480px        | index             | PENDING |
| 13  | HIGH     | Login row wraps/overflows at 320px      | login             | PENDING |
| 14  | HIGH     | Flex rows lack flex-wrap                | multiple          | PENDING |
| 15  | HIGH     | Dashboard add-dish panel at mobile      | dashboard         | PENDING |
| 16  | HIGH     | Missing CSS class `sticky-top`          | dashboard         | PENDING |
| 17  | MEDIUM   | Browse layout not explicitly responsive | browse-food       | PENDING |
| 22  | MEDIUM   | Nav dropdown z-index vs hero            | index             | PENDING |
| 23  | MEDIUM   | Auth box padding at 320px               | login, register   | PENDING |
| 24  | MEDIUM   | Search suggestions stacking context     | browse, index     | PENDING |
