# Moraqeb - Amazon Product Tracker Extension

A lightweight, privacy-focused cross-browser extension (Chrome, Edge, Brave, and Firefox) to extract live Amazon product metrics and sync them directly to your local Moraqeb analytics dashboard.

---

## Features

- **Live Amazon DOM Inspection**: Automatically detects product ASIN, title, pricing, stock availability, ratings, and FBA fulfillment status directly on the page.
- **Clean Interface**: Completely free of emojis, designed with a modern dark theme and responsive cards.
- **1-Click Tracking**: Synchronizes any Amazon product with your local Moraqeb dashboard (`http://localhost:8501`) instantly.
- **Cross-Browser Manifest V3**: Fully compliant with modern Chrome and Firefox extension specifications.

---

## Installation Guide

### Google Chrome / Brave / Microsoft Edge
1. Clone or download this repository.
2. Open your browser and navigate to the Extensions management page:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Brave: `brave://extensions`
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked**.
5. Select this `moraqeb-extension` folder.
6. The Moraqeb extension icon will appear in your browser toolbar. Pin it for quick access!

### Mozilla Firefox
1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on...**.
3. Select the `manifest.json` file inside this `moraqeb-extension` directory.
4. The extension is now active in Firefox.

---

## Usage

1. Start your local Moraqeb instance:
   ```bash
   cd ../moraqeb
   # Run directly or via Docker Compose:
   docker compose up -d
   ```
2. Navigate to any Amazon product page (e.g. `https://www.amazon.eg/dp/B07QSFHT27` or `https://www.amazon.com/dp/...`).
3. Click the **Moraqeb** extension icon in your browser toolbar.
4. View the live snapshot: price, rating out of 5, review count, and seller details.
5. Click **Track in Moraqeb** to send the product directly to your local database!

---

## Project Structure

```
moraqeb-extension/
├── manifest.json       # Manifest V3 extension configuration
├── content.js          # Injected script parsing Amazon product DOM
├── popup.html          # Extension popup interface
├── popup.js            # Product retrieval and 1-click sync handler
├── popup.css           # Clean modern styles (zero emojis)
├── icons/              # Extension icons (16px, 48px, 128px)
└── README.md           # Documentation and setup guide
```

---

## License
MIT
