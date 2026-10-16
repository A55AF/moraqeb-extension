# Moraqeb - Amazon Product Tracker & Analytics Extension

A powerful, self-contained cross-browser extension (Chrome, Edge, Brave, and Firefox) to track Amazon listings, analyze FBA unit economics, and inspect price & BSR history with a built-in browser dashboard.

---

## Key Features

- **100% Self-Contained**: No Docker, no Python, and no local servers required. All analytics, algorithms, and persistence run locally inside the browser using `chrome.storage.local`.
- **Integrated Extension Dashboard (`dashboard.html`)**:
  - **Single Product Deep Dive**:
    - Product Header & Horizontal Image Gallery.
    - 6 Key Metrics: Price, Rating, Reviews, BSR, Estimated Monthly Sales, Opportunity Score.
    - Listing Quality Index (0-100) & Risk Radar (0-100) with risk triggers.
    - Detailed Specs (ASIN, Parent ASIN, Dimensions, Category path, Stock left, Seller).
    - Seller Details Modal Dialog.
    - Tabs: Key Features, Full Description, SEO Keywords extraction, Customer Reviews & Sentiment aspects, Live Competitor Analysis.
    - Interactive FBA Profit & Margin Calculator with configurable unit cost, referral fee, FBA fee, and batch working capital.
    - Interactive Canvas Charts for Price History and BSR Rank over time (with reversed Y axis).
  - **Product Comparison Matrix**:
    - Tabular comparison of all tracked listings with filtering, sorting, and quick navigation.
  - **AI Product Hunter**:
    - Niche keyword scanner with opportunity score filtering and 1-click tracking.
  - **Bilingual Support**:
    - Full English and Arabic (العربية) with instant RTL layout flipping.
  - **Data Management**:
    - Export JSON backup, import backup, and clear data.
- **Deep DOM Extraction (`content.js`)**:
  - Automatically extracts ASIN, title, brand, dimensions, bullets, description, high-res images, BSR, breadcrumbs, badges, rating, review counts, and seller info.
- **Quick Popup Action (`popup.html`)**:
  - Minimal product preview snapshot when clicking the extension icon.
  - 1-click "Track in Moraqeb" button.
  - "Open Dashboard" button directly focused on the active product.

---

## Installation Guide

### Google Chrome / Brave / Microsoft Edge
1. Open your browser and navigate to the Extensions management page:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Brave: `brave://extensions`
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked**.
4. Select this `moraqeb-extension` folder.
5. The Moraqeb extension icon will appear in your browser toolbar. Pin it for quick access!

### Mozilla Firefox
1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on...**.
3. Select the `manifest.json` file inside this `moraqeb-extension` directory.
4. The extension is now active in Firefox.

---

## Usage

1. Navigate to any Amazon product page (e.g. `https://www.amazon.eg/dp/...` or `https://www.amazon.com/dp/...`).
2. Click the **Moraqeb** extension icon in your browser toolbar to preview the listing snapshot.
3. Click **Track in Moraqeb** to save the product and record its price/BSR history point.
4. Click **Open Dashboard** to open the full interactive Moraqeb dashboard in a new tab!

---

## Project Structure

```
moraqeb-extension/
├── manifest.json       # Manifest V3 extension configuration
├── content.js          # Deep DOM scraper for Amazon listings
├── popup.html          # Extension popup interface
├── popup.js            # Popup controller & 1-click tracking
├── popup.css           # Popup styles
├── dashboard.html      # Full-featured internal analytics dashboard
├── dashboard.js        # Dashboard controller, view routing & interactive charts
├── dashboard.css       # Responsive styling with RTL support
├── locales.js          # Bilingual translations (English & Arabic)
├── storage.js          # chrome.storage.local wrapper & analytics engine
├── icons/              # Extension icons (16px, 48px, 128px)
└── README.md           # Documentation and setup guide
```

---

## License
MIT
