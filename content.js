// Moraqeb Extension Content Script
// Extracts live product information from active Amazon listing pages

function extractASIN() {
  const urlMatch = window.location.pathname.match(/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1].toUpperCase();
  }
  const asinInput = document.querySelector('input#ASIN, input[name="ASIN"]');
  if (asinInput && asinInput.value) {
    return asinInput.value.trim().toUpperCase();
  }
  const asinNode = document.querySelector('[data-asin]');
  if (asinNode) {
    const val = asinNode.getAttribute('data-asin');
    if (val && val.length === 10) return val.toUpperCase();
  }
  return null;
}

function extractTitle() {
  const titleEl = document.querySelector('#productTitle') || document.querySelector('h1#title');
  return titleEl ? titleEl.textContent.trim() : document.title;
}

function extractPrice() {
  const selectors = [
    '#corePrice_feature_div .a-price .a-offscreen',
    '#corePriceDisplay_desktop_feature_div .a-price .a-offscreen',
    '#apex_desktop .a-price .a-offscreen',
    '#priceblock_ourprice',
    '#priceblock_dealprice',
    '.a-price .a-offscreen'
  ];

  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el && el.textContent) {
      const raw = el.textContent.trim();
      const numMatch = raw.replace(/,/g, '').match(/[\d.]+/);
      if (numMatch) {
        return {
          raw: raw,
          amount: parseFloat(numMatch[0])
        };
      }
    }
  }
  return { raw: '—', amount: null };
}

function extractRating() {
  const ratingEl = document.querySelector('#acrPopover .a-icon-alt') ||
                   document.querySelector('#averageCustomerReviews .a-icon-alt') ||
                   document.querySelector('.a-icon-star .a-icon-alt');
  if (ratingEl && ratingEl.textContent) {
    const m = ratingEl.textContent.match(/([\d.]+)/);
    if (m) return parseFloat(m[1]);
  }
  return null;
}

function extractReviewCount() {
  const countEl = document.querySelector('#acrCustomerReviewText');
  if (countEl && countEl.textContent) {
    const clean = countEl.textContent.replace(/[^\d]/g, '');
    if (clean) return parseInt(clean, 10);
  }
  return null;
}

function extractSellerInfo() {
  const sellerLink = document.querySelector('#sellerProfileTriggerId');
  if (sellerLink && sellerLink.textContent) {
    return {
      name: sellerLink.textContent.trim(),
      is_fba: false
    };
  }

  const merchantInfo = document.querySelector('#merchant-info');
  if (merchantInfo && merchantInfo.textContent) {
    const text = merchantInfo.textContent.trim();
    const isFba = text.toLowerCase().includes('amazon') && text.toLowerCase().includes('fulfilled');
    return {
      name: text.replace(/\s+/g, ' ').substring(0, 40),
      is_fba: isFba
    };
  }

  return { name: 'Amazon / Third-party', is_fba: false };
}

function extractImage() {
  const imgEl = document.querySelector('#landingImage') ||
                document.querySelector('#imgBlkFront') ||
                document.querySelector('#main-image');
  return imgEl ? imgEl.src : null;
}

function extractAvailability() {
  const availEl = document.querySelector('#availability');
  if (!availEl) return true;
  const text = availEl.textContent.toLowerCase();
  return !text.includes('currently unavailable') && !text.includes('غير متوفر');
}

function getProductSnapshot() {
  const asin = extractASIN();
  if (!asin) return null;

  const title = extractTitle();
  const price = extractPrice();
  const rating = extractRating();
  const reviewsCount = extractReviewCount();
  const sellerInfo = extractSellerInfo();
  const image = extractImage();
  const inStock = extractAvailability();

  return {
    asin,
    title,
    price: price.amount,
    price_formatted: price.raw,
    rating,
    reviews_count: reviewsCount,
    seller: sellerInfo.name,
    is_fba: sellerInfo.is_fba,
    image,
    in_stock: inStock,
    url: window.location.href
  };
}

// Respond to messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'GET_PRODUCT_DETAILS') {
    const data = getProductSnapshot();
    sendResponse({ success: !!data, data: data });
  }
  return true;
});
