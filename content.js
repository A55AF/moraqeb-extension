// Moraqeb Extension Content Script
// Extracts comprehensive product intelligence from active Amazon listing pages or parsed DOMs

function extractASIN(doc = document, url = (typeof window !== 'undefined' ? window.location.href : '')) {
  try {
    if (url) {
      const pathname = new URL(url, 'https://www.amazon.eg').pathname;
      const urlMatch = pathname.match(/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
      if (urlMatch && urlMatch[1]) {
        return urlMatch[1].toUpperCase();
      }
    }
  } catch (_) {}
  const asinInput = doc ? doc.querySelector('input#ASIN, input[name="ASIN"]') : null;
  if (asinInput && asinInput.value) {
    return asinInput.value.trim().toUpperCase();
  }
  const asinNode = doc ? doc.querySelector('[data-asin]') : null;
  if (asinNode) {
    const val = asinNode.getAttribute('data-asin');
    if (val && val.length === 10) return val.toUpperCase();
  }
  return null;
}

function extractParentASIN(doc = document) {
  const parentInput = doc ? doc.querySelector('input#parentAsin, input[name="parentAsin"]') : null;
  if (parentInput && parentInput.value) {
    return parentInput.value.trim().toUpperCase();
  }
  return null;
}

function extractTitle(doc = document) {
  const titleEl = doc ? (doc.querySelector('#productTitle') || doc.querySelector('h1#title')) : null;
  if (titleEl && titleEl.textContent) {
    return titleEl.textContent.trim();
  }
  return ((doc && doc.title) ? doc.title : '').replace(/\s*:\s*Amazon.*$/i, '').trim();
}

function extractBrand(doc = document) {
  const byline = doc ? (doc.querySelector('#bylineInfo') || doc.querySelector('#brand')) : null;
  if (byline && byline.textContent) {
    return byline.textContent.replace(/^(Brand:|Visit the|Store)\s*/i, '').trim();
  }
  return null;
}

function extractPrice(doc = document) {
  if (!doc) return { raw: '—', amount: null };
  const selectors = [
    '#corePrice_feature_div .a-price .a-offscreen',
    '#corePriceDisplay_desktop_feature_div .a-price .a-offscreen',
    '#apex_desktop .a-price .a-offscreen',
    '#priceblock_ourprice',
    '#priceblock_dealprice',
    '#price_inside_buybox',
    '.a-price .a-offscreen'
  ];

  for (const sel of selectors) {
    const el = doc.querySelector(sel);
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

function extractRating(doc = document) {
  if (!doc) return null;
  const ratingEl = doc.querySelector('#acrPopover .a-icon-alt') ||
                   doc.querySelector('#averageCustomerReviews .a-icon-alt') ||
                   doc.querySelector('.a-icon-star .a-icon-alt');
  if (ratingEl && ratingEl.textContent) {
    const m = ratingEl.textContent.match(/([\d.]+)/);
    if (m) return parseFloat(m[1]);
  }
  return null;
}

function extractReviewCount(doc = document) {
  if (!doc) return null;
  const countEl = doc.querySelector('#acrCustomerReviewText');
  if (countEl && countEl.textContent) {
    const clean = countEl.textContent.replace(/[^\d]/g, '');
    if (clean) return parseInt(clean, 10);
  }
  return null;
}

function extractSellerInfo(doc = document) {
  let sellerName = 'Amazon';
  let isFba = false;
  let sellerLink = null;
  let sellerId = null;

  if (!doc) return { name: sellerName, is_fba: isFba, link: sellerLink, id: sellerId };

  const sellerLinkEl = doc.querySelector('#sellerProfileTriggerId');
  if (sellerLinkEl && sellerLinkEl.textContent) {
    sellerName = sellerLinkEl.textContent.trim();
    if (sellerLinkEl.href) {
      sellerLink = sellerLinkEl.href;
      const m = sellerLink.match(/[?&]seller=([A-Z0-9]+)/i);
      if (m) sellerId = m[1];
    }
  }

  const merchantInfo = doc.querySelector('#merchant-info');
  if (merchantInfo && merchantInfo.textContent) {
    const text = merchantInfo.textContent.trim();
    isFba = text.toLowerCase().includes('amazon') && (text.toLowerCase().includes('fulfilled') || text.toLowerCase().includes('مشحون من قبل أمازون'));
    if (!sellerLinkEl) {
      sellerName = text.replace(/\s+/g, ' ').substring(0, 45);
    }
  }

  // FBA badge check
  if (!isFba) {
    const fulfillmentBadge = doc.querySelector('#fulfillerInfoFeature_feature_div, #SSOFpopoverLink');
    if (fulfillmentBadge && fulfillmentBadge.textContent.toLowerCase().includes('amazon')) {
      isFba = true;
    }
  }

  return { name: sellerName, is_fba: isFba, link: sellerLink, id: sellerId };
}

function extractImages(doc = document) {
  const imageMap = new Map(); // imageId -> high-res url
  if (!doc) return [];

  function addCleanImage(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return;
    if (rawUrl.includes('play-button') || rawUrl.includes('transparent-pixel') || rawUrl.includes('sprite') || rawUrl.includes('360') || rawUrl.includes('icon')) {
      return;
    }
    // Match Amazon image ID e.g. /images/I/71YFv9g-8dL.
    const m = rawUrl.match(/\/images\/I\/([A-Za-z0-9%_\-+]+)\./);
    if (!m) return;
    const imageId = m[1];
    if (imageMap.has(imageId)) return;

    // Convert to canonical high-res URL
    const hiRes = rawUrl.replace(/\._[A-Z0-9_,-]+_\./, '._AC_SL1500_.');
    imageMap.set(imageId, hiRes);
  }

  // 1. Try embedded Amazon image script (colorImages.initial)
  try {
    const scripts = doc.querySelectorAll('script');
    for (const s of scripts) {
      const content = s.textContent;
      if (content && content.includes("'colorImages':") && content.includes("'initial':")) {
        const match = content.match(/'colorImages':\s*\{\s*'initial':\s*(\[[^\]]+\])/);
        if (match) {
          const list = JSON.parse(match[1]);
          for (const item of list) {
            const url = item.hiRes || item.large;
            if (url) addCleanImage(url);
          }
          if (imageMap.size > 0) {
            return Array.from(imageMap.values());
          }
        }
      }
    }
  } catch (e) {
    // Fallback to DOM
  }

  // 2. Main landing image (pick single highest-res from dynamic images)
  const landing = doc.querySelector('#landingImage') || doc.querySelector('#imgBlkFront');
  if (landing) {
    const dyn = landing.getAttribute('data-a-dynamic-image');
    if (dyn) {
      try {
        const parsed = JSON.parse(dyn);
        let bestUrl = null;
        let maxPx = 0;
        for (const [url, dims] of Object.entries(parsed)) {
          const px = Array.isArray(dims) && dims.length === 2 ? dims[0] * dims[1] : 0;
          if (px > maxPx) {
            maxPx = px;
            bestUrl = url;
          }
        }
        if (bestUrl) addCleanImage(bestUrl);
      } catch (e) {}
    }
    if (landing.src) addCleanImage(landing.src);
  }

  // 3. Main gallery thumbnails (#altImages) excluding video, swatches, 360
  const altImgs = doc.querySelectorAll('#altImages ul li.item:not(.video) img, #imageBlock .regularAltImageViewLayout img');
  altImgs.forEach((img) => {
    // Avoid swatch thumbnails
    if (img.closest('.swatchAvailable') || img.closest('#variation_color_name')) return;
    const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-old-hires');
    if (src) addCleanImage(src);
  });

  return Array.from(imageMap.values()).slice(0, 10);
}

function extractAvailability(doc = document) {
  if (!doc) return true;
  const availEl = doc.querySelector('#availability');
  if (!availEl) return true;
  const text = availEl.textContent.toLowerCase();
  return !text.includes('currently unavailable') && !text.includes('غير متوفر') && !text.includes('out of stock');
}

function extractBullets(doc = document) {
  const bullets = [];
  if (!doc) return bullets;
  const listItems = doc.querySelectorAll('#feature-bullets ul li span.a-list-item, #featurebullets_feature_div li span.a-list-item');
  listItems.forEach((li) => {
    const t = li.textContent.trim();
    if (t && !t.startsWith('›') && t.length > 5) {
      bullets.push(t);
    }
  });
  return bullets;
}

function extractDescription(doc = document) {
  if (!doc) return '';
  const descEl = doc.querySelector('#productDescription p, #productDescription') ||
                 doc.querySelector('#aplus_feature_div') ||
                 doc.querySelector('#bookDescription_feature_div');
  return descEl ? descEl.textContent.trim().replace(/\s+/g, ' ') : '';
}

function extractDimensions(doc = document) {
  if (!doc) return null;
  const detailBullets = doc.querySelectorAll('#detailBullets_feature_div li, #prodDetails table tr');
  for (const row of detailBullets) {
    const text = row.textContent.toLowerCase();
    if (text.includes('dimension') || text.includes('أبعاد') || text.includes('item dimensions') || text.includes('package dimensions')) {
      const parts = row.textContent.split(/[:：]/);
      if (parts.length > 1) {
        return parts[1].replace(/\s+/g, ' ').trim();
      }
      return row.textContent.replace(/\s+/g, ' ').trim();
    }
  }
  return null;
}

function extractBSR(doc = document) {
  if (!doc) return null;
  const detailBullets = doc.querySelectorAll('#detailBullets_feature_div li, #prodDetails table tr, #SalesRank');
  for (const row of detailBullets) {
    const text = row.textContent;
    if (text.includes('Best Sellers Rank') || text.includes('الأكثر مبيعاً')) {
      const m = text.match(/#([0-9,]+)\s*(?:in|في)?\s*([^\n(]+)/i);
      if (m) {
        const rank = parseInt(m[1].replace(/,/g, ''), 10);
        return {
          rank: rank,
          category: m[2] ? m[2].trim() : ''
        };
      }
    }
  }
  return null;
}

function extractCategories(doc = document) {
  const cats = [];
  if (!doc) return cats;
  const links = doc.querySelectorAll('#wayfinding-breadcrumbs_feature_div ul li a');
  links.forEach((a) => {
    const t = a.textContent.trim();
    if (t) cats.push(t);
  });
  return cats;
}

function extractBadges(doc = document) {
  if (!doc) return { is_best_seller: false, is_amazon_choice: false };
  const isBestSeller = !!doc.querySelector('#zeitgeistBadge, .badge-rectangle, .best-seller-badge');
  const isAmazonChoice = !!doc.querySelector('#acBadge_standard, .ac-badge-wrapper, [data-ac-badge]');
  return {
    is_best_seller: isBestSeller,
    is_amazon_choice: isAmazonChoice
  };
}

function extractBoughtPastMonth(doc = document) {
  if (!doc) return null;
  const proofEl = doc.querySelector('#social-proofing-faceout-title-tk_bought, .social-proofing-faceout');
  if (proofEl && proofEl.textContent) {
    const m = proofEl.textContent.match(/([0-9,]+)\+?\s*bought/i);
    if (m) {
      return parseInt(m[1].replace(/,/g, ''), 10);
    }
  }
  return null;
}

function extractReviews(doc = document) {
  const reviews = [];
  if (!doc) return reviews;
  const reviewNodes = doc.querySelectorAll('#cm-cr-dp-review-list .review, [data-hook="review"]');
  reviewNodes.forEach((node) => {
    const titleEl = node.querySelector('[data-hook="review-title"] span') || node.querySelector('.review-title');
    const ratingEl = node.querySelector('[data-hook="review-star-rating"] .a-icon-alt') || node.querySelector('.a-icon-star');
    const textEl = node.querySelector('[data-hook="review-body"] span') || node.querySelector('.review-text');
    const authorEl = node.querySelector('.a-profile-name');
    const dateEl = node.querySelector('[data-hook="review-date"]');
    const verifiedEl = node.querySelector('[data-hook="avp-badge"]');
    const helpfulEl = node.querySelector('[data-hook="helpful-vote-statement"]');

    let ratingVal = null;
    if (ratingEl && ratingEl.textContent) {
      const rm = ratingEl.textContent.match(/([\d.]+)/);
      if (rm) ratingVal = parseFloat(rm[1]);
    }

    let helpfulVotes = 0;
    if (helpfulEl && helpfulEl.textContent) {
      const hm = helpfulEl.textContent.match(/(\d+)/);
      if (hm) helpfulVotes = parseInt(hm[1], 10);
    }

    if (titleEl || textEl) {
      reviews.push({
        title: titleEl ? titleEl.textContent.trim() : '',
        rating: ratingVal,
        text: textEl ? textEl.textContent.trim() : '',
        author: { name: authorEl ? authorEl.textContent.trim() : 'Customer' },
        date: dateEl ? dateEl.textContent.trim() : '',
        is_verified_purchase: !!verifiedEl,
        helpful_votes: helpfulVotes
      });
    }
  });
  return reviews.slice(0, 10);
}

function extractSentimentAspects(doc = document) {
  const aspects = [];
  if (!doc) return aspects;
  const tags = doc.querySelectorAll('#cr-summarization-attributes-list .a-declarative, .cr-summarization-attribute');
  tags.forEach((tag) => {
    const text = tag.textContent.trim();
    if (text) {
      aspects.push({
        name: text,
        sentiment: text.includes('not') || text.includes('poor') || text.includes('weak') ? 'negative' : 'positive',
        mentions: ''
      });
    }
  });
  return aspects;
}

function getProductSnapshot(doc = document, url = (typeof window !== 'undefined' ? window.location.href : '')) {
  const asin = extractASIN(doc, url);
  if (!asin) return null;

  const parentAsin = extractParentASIN(doc);
  const title = extractTitle(doc);
  const brand = extractBrand(doc);
  const price = extractPrice(doc);
  const rating = extractRating(doc);
  const reviewsCount = extractReviewCount(doc);
  const sellerInfo = extractSellerInfo(doc);
  const images = extractImages(doc);
  const inStock = extractAvailability(doc);
  const bullets = extractBullets(doc);
  const description = extractDescription(doc);
  const dimensions = extractDimensions(doc);
  const bsrInfo = extractBSR(doc);
  const categories = extractCategories(doc);
  const badges = extractBadges(doc);
  const boughtPastMonth = extractBoughtPastMonth(doc);
  const reviews = extractReviews(doc);
  const aspects = extractSentimentAspects(doc);

  const finalUrl = url || (typeof window !== 'undefined' ? window.location.href : `https://www.amazon.eg/dp/${asin}`);

  return {
    asin,
    code: asin,
    parent_code: parentAsin,
    title,
    brand,
    link: finalUrl,
    price: price.amount,
    price_formatted: price.raw,
    rating,
    reviews_count: reviewsCount,
    seller: sellerInfo.name,
    seller_name: sellerInfo.name,
    seller_id: sellerInfo.id,
    seller_link: sellerInfo.link,
    is_fba: sellerInfo.is_fba,
    image: images.length > 0 ? images[0] : null,
    images: images,
    image_count: images.length,
    in_stock: inStock,
    bullets: bullets,
    description: description,
    dimensions: dimensions,
    bsr: bsrInfo ? bsrInfo.rank : null,
    bsr_category: bsrInfo ? bsrInfo.category : null,
    categories: categories,
    is_best_seller: badges.is_best_seller,
    is_amazon_choice: badges.is_amazon_choice,
    bought_past_month: boughtPastMonth,
    reviews_list: reviews,
    sentiment_aspects: aspects,
    url: finalUrl,
    extracted_at: new Date().toISOString()
  };
}

// Expose on global window object so dashboard and popup can reuse it directly
if (typeof window !== 'undefined') {
  window.MoraqebScraper = {
    getProductSnapshot,
    extractASIN,
    extractTitle,
    extractPrice
  };
}

// Respond to messages from popup or dashboard
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'GET_PRODUCT_DETAILS') {
      const data = getProductSnapshot();
      sendResponse({ success: !!data, data: data });
    }
    return true;
  });
}
