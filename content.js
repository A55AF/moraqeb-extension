// Moraqeb Extension Content Script
// Extracts product intelligence from active Amazon listing pages or parsed DOMs

function parseFirstFloat(text) {
  if (!text) return null;
  const m = String(text).replace(/,/g, '').match(/[\d.]+/);
  return m ? parseFloat(m[0]) : null;
}

function parseFirstInt(text) {
  if (!text) return null;
  const clean = String(text).replace(/[^\d]/g, '');
  return clean ? parseInt(clean, 10) : null;
}

function extractASIN(doc = document, url = (typeof window !== 'undefined' ? window.location.href : '')) {
  if (typeof url === 'string' && /^[A-Z0-9]{10}$/i.test(url.trim())) {
    return url.trim().toUpperCase();
  }
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
      const amount = parseFirstFloat(raw);
      if (amount !== null) {
        return { raw, amount };
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
  return ratingEl ? parseFirstFloat(ratingEl.textContent) : null;
}

function extractReviewCount(doc = document) {
  if (!doc) return null;
  const countEl = doc.querySelector('#acrCustomerReviewText');
  return countEl ? parseFirstInt(countEl.textContent) : null;
}

function extractSellerInfo(doc = document) {
  let sellerName = 'Amazon';
  let isFba = false;
  let sellerLink = null;
  let sellerId = null;

  if (!doc) return { name: sellerName, is_fba: isFba, link: sellerLink, id: sellerId };

  // 1. Check tabular buybox (modern Amazon layout)
  const tabularSoldBy = doc.querySelector(
    '#tabular-buybox .tabular-buybox-text[tabular-attribute-name="Sold by"] a, ' +
    '#tabular-buybox .tabular-buybox-text[tabular-attribute-name="يُباع من قبل"] a, ' +
    '#merchantInfoFeature_feature_div a, ' +
    '#sellerProfileTriggerId'
  );

  if (tabularSoldBy && tabularSoldBy.textContent.trim()) {
    sellerName = tabularSoldBy.textContent.trim();
    const href = tabularSoldBy.getAttribute('href') || tabularSoldBy.href || '';
    if (href) {
      sellerLink = href.startsWith('http') ? href : `https://www.amazon.eg${href.startsWith('/') ? '' : '/'}${href}`;
      const m = href.match(/[?&]seller=([A-Z0-9]+)/i);
      if (m) sellerId = m[1];
    }
  }

  // 2. Check tabular ships from (for FBA)
  const tabularShipsFrom = doc.querySelector(
    '#tabular-buybox .tabular-buybox-text[tabular-attribute-name="Ships from"], ' +
    '#tabular-buybox .tabular-buybox-text[tabular-attribute-name="يتم الشحن من"], ' +
    '#fulfillerInfoFeature_feature_div'
  );
  if (tabularShipsFrom && tabularShipsFrom.textContent) {
    const shipText = tabularShipsFrom.textContent.toLowerCase();
    if (shipText.includes('amazon') || shipText.includes('أمازون')) {
      isFba = true;
    }
  }

  // 3. Fallback to merchant-info text block
  const merchantInfo = doc.querySelector('#merchant-info');
  if (merchantInfo && merchantInfo.textContent) {
    const text = merchantInfo.textContent.trim();
    if (text.toLowerCase().includes('amazon') && (text.toLowerCase().includes('fulfilled') || text.toLowerCase().includes('مشحون من قبل أمازون'))) {
      isFba = true;
    }
    if (!tabularSoldBy) {
      const soldMatch = text.match(/(?:Sold by|يُباع من قبل|Verkauf durch|Vendu par)\s+([^.\n,]+?)(?:\s+(?:and|Fulfilled|تشحنه|versandt|et)|$)/i);
      if (soldMatch && soldMatch[1]) {
        sellerName = soldMatch[1].trim();
      } else {
        sellerName = text.replace(/\s+/g, ' ').substring(0, 45);
      }
    }
  }

  // 4. FBA badge fallback check
  if (!isFba) {
    const fulfillmentBadge = doc.querySelector('#fulfillerInfoFeature_feature_div, #SSOFpopoverLink');
    if (fulfillmentBadge && (fulfillmentBadge.textContent.toLowerCase().includes('amazon') || fulfillmentBadge.textContent.includes('أمازون'))) {
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
        return {
          rank: parseFirstInt(m[1]),
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
  return {
    is_best_seller: !!doc.querySelector('#zeitgeistBadge, .badge-rectangle, .best-seller-badge'),
    is_amazon_choice: !!doc.querySelector('#acBadge_standard, .ac-badge-wrapper, [data-ac-badge]')
  };
}

function extractBoughtPastMonth(doc = document) {
  if (!doc) return null;
  const proofEl = doc.querySelector('#social-proofing-faceout-title-tk_bought, .social-proofing-faceout');
  if (proofEl && proofEl.textContent) {
    const m = proofEl.textContent.match(/([0-9,]+)\+?\s*bought/i);
    if (m) {
      return parseFirstInt(m[1]);
    }
  }
  return null;
}

function extractVariantsCount(doc = document) {
  if (!doc) return 0;

  // 1. Check embedded script with dimensionValuesDisplayData
  try {
    const scripts = doc.querySelectorAll('script');
    for (const s of scripts) {
      const content = s.textContent;
      if (content && content.includes('"dimensionValuesDisplayData"')) {
        const match = content.match(/"dimensionValuesDisplayData"\s*:\s*(\{[^}]+\})/);
        if (match) {
          const parsed = JSON.parse(match[1]);
          const asins = Object.keys(parsed);
          if (asins.length > 0) return asins.length;
        }
      }
    }
  } catch (_) {}

  // 2. DOM swatch elements
  const swatches = doc.querySelectorAll('#twisterContainer li[data-asin]:not([data-asin=""]), #variation_color_name li, #variation_size_name li');
  if (swatches && swatches.length > 1) {
    return swatches.length;
  }

  // 3. Dropdown select options
  const selectOpts = doc.querySelectorAll('#native_dropdown_selected_size_name option:not([value="-1"]), select[name="dropdown_selected_size_name"] option:not([value="-1"])');
  if (selectOpts && selectOpts.length > 1) {
    return selectOpts.length;
  }

  return 0;
}

function parseSellerProfileDoc(doc) {
  if (!doc) return null;

  const nameEl = doc.querySelector('#seller-name, h1#seller-name, #sellerName, h1');
  const name = nameEl ? nameEl.textContent.trim() : null;

  const header = doc.querySelector('#page-section-seller-header');
  const headerText = header ? header.textContent.trim() : '';

  let rating = null;
  const ratingDesc = doc.querySelector('#effective-timeperiod-rating-lifetime-description, .feedback-detail-description');
  if (ratingDesc) {
    rating = parseFirstFloat(ratingDesc.textContent);
  }
  if (!rating && headerText) {
    const starMatch = headerText.match(/([\d.]+)\s*(?:out of 5 stars|من 5 نجوم)/i) || headerText.match(/([\d.]+)\s*\/\s*5/);
    if (starMatch) rating = parseFloat(starMatch[1]);
  }

  let ratingCount = null;
  const countMatch = headerText.match(/\(([\d,.]+)\s*(?:total|تقييم|ratings)/i);
  if (countMatch) {
    ratingCount = parseFirstInt(countMatch[1]);
  } else {
    const lifetimeCountEl = doc.querySelector('#rating-lifetime-num');
    if (lifetimeCountEl) ratingCount = parseFirstInt(lifetimeCountEl.textContent);
  }

  let positivePercent = null;
  const pctMatch = headerText.match(/(\d+)%\s*(?:positive|إيجابي)/i);
  if (pctMatch) {
    positivePercent = parseInt(pctMatch[1], 10);
  }

  let businessName = null;
  let businessAddress = null;
  const rows = doc.querySelectorAll('#page-section-detail-seller-info .a-row, .seller-info-row');
  rows.forEach((row) => {
    const text = row.textContent.trim();
    if (text.toLowerCase().includes('business name') || text.includes('اسم الشركة') || text.includes('اسم العمل التجاري')) {
      const parts = text.split(/[:：]/);
      if (parts[1]) businessName = parts.slice(1).join(':').trim();
    } else if (text.toLowerCase().includes('business address') || text.includes('عنوان العمل التجاري') || text.includes('عنوان الشركة')) {
      const parts = text.split(/[:：]/);
      if (parts[1]) businessAddress = parts.slice(1).join(':').trim();
    }
  });

  let about = null;
  const aboutEl = doc.querySelector('#page-section-about-seller, #seller-about');
  if (aboutEl) {
    about = aboutEl.textContent.replace(/^About Seller\s*/i, '').replace(/^عن البائع\s*/i, '').trim();
  }

  return {
    name,
    rating,
    rating_count: ratingCount,
    positive_percent: positivePercent,
    business_name: businessName,
    business_address: businessAddress,
    about
  };
}

function extractReviews(doc = document) {
  const reviews = [];
  if (!doc) return reviews;
  const reviewNodes = doc.querySelectorAll('#cm-cr-dp-review-list .review, [data-hook="review"], .a-section.review');
  reviewNodes.forEach((node) => {
    // Amazon modern layout uses data-hook="reviewTitle", legacy uses data-hook="review-title"
    const titleEl = node.querySelector('[data-hook="reviewTitle"]') ||
                    node.querySelector('[data-hook="review-title"] span') ||
                    node.querySelector('[data-hook="review-title"]') ||
                    node.querySelector('.review-title') ||
                    node.querySelector('h5._Y3Itd_single-review-title_2aKRE') ||
                    node.querySelector('h5');

    const ratingEl = node.querySelector('[data-hook="review-star-rating"] .a-icon-alt') ||
                     node.querySelector('[data-hook="review-star-rating"]') ||
                     node.querySelector('.a-icon-star .a-icon-alt') ||
                     node.querySelector('.a-icon-star');

    // Amazon modern layout uses data-hook="reviewRichContentContainer" or "reviewText", legacy uses "review-body"
    const textEl = node.querySelector('[data-hook="reviewRichContentContainer"]') ||
                   node.querySelector('[data-hook="reviewText"]') ||
                   node.querySelector('[data-hook="reviewTextContainer"]') ||
                   node.querySelector('[data-hook="review-body"] span') ||
                   node.querySelector('[data-hook="review-body"]') ||
                   node.querySelector('.review-text');

    const authorEl = node.querySelector('.a-profile-name') ||
                     node.querySelector('[data-hook="genome-widget"] .a-profile-name');

    const dateEl = node.querySelector('[data-hook="review-date"]') ||
                   node.querySelector('.review-date');

    const verifiedEl = node.querySelector('[data-hook="avp-badge"]') ||
                       node.querySelector('.review-format-strip');

    const helpfulEl = node.querySelector('[data-hook="helpful-vote-statement"]') ||
                      node.querySelector('.cr-vote-text');

    const ratingVal = ratingEl ? parseFirstFloat(ratingEl.textContent) : null;
    const helpfulVotes = helpfulEl ? (parseFirstInt(helpfulEl.textContent) || 0) : 0;

    let cleanTitle = titleEl ? titleEl.textContent.trim() : '';
    cleanTitle = cleanTitle.replace(/^[\d.,]+\s+(?:out of \d+ stars|من \d+ نجوم|von \d+ Sternen|sur \d+ étoiles)\s*/i, '');

    const reviewText = textEl ? textEl.textContent.trim().replace(/\s+/g, ' ') : '';

    if (cleanTitle || reviewText) {
      reviews.push({
        title: cleanTitle || 'Customer Review',
        rating: ratingVal !== null ? ratingVal : 5,
        text: reviewText,
        author: { name: authorEl ? authorEl.textContent.trim() : 'Customer' },
        date: dateEl ? dateEl.textContent.trim() : '',
        is_verified_purchase: !!verifiedEl,
        helpful_votes: helpfulVotes
      });
    }
  });
  return reviews.slice(0, 15);
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
    variant_count: extractVariantsCount(doc),
    reviews_list: reviews,
    sentiment_aspects: aspects,
    url: finalUrl,
    extracted_at: new Date().toISOString()
  };
}

function parseSearchResults(doc = document, siteUrl = 'https://www.amazon.eg') {
  if (!doc) return [];
  const cards = doc.querySelectorAll('div[data-component-type="s-search-result"], div[data-asin]:not([data-asin=""])');
  const results = [];
  const seenAsins = new Set();

  let domain = 'eg';
  try {
    const host = new URL(siteUrl).hostname;
    const m = host.match(/amazon\.([a-z\.]+)/i);
    if (m) domain = m[1];
  } catch (_) {}

  cards.forEach((card) => {
    const asin = (card.getAttribute('data-asin') || '').trim().toUpperCase();
    if (!asin || asin.length !== 10 || seenAsins.has(asin)) return;
    seenAsins.add(asin);

    const titleEl = card.querySelector('[data-cy="title-recipe"] h2, h2 a span, h2 span, h2');
    const title = titleEl ? titleEl.textContent.trim() : '';
    if (!title) return;

    const brandEl = card.querySelector('[data-cy="title-recipe"] > .a-row h2, h2.a-size-mini, .a-size-base-plus');
    const brand = brandEl ? brandEl.textContent.replace(/^(Brand:|Visit the|Store)\s*/i, '').trim() : null;

    let price = null;
    let priceFormatted = '—';
    const priceEl = card.querySelector('.a-price .a-offscreen') || card.querySelector('.a-price span[aria-hidden="true"]');
    if (priceEl && priceEl.textContent) {
      priceFormatted = priceEl.textContent.trim();
      price = parseFirstFloat(priceFormatted);
    }

    const ratingEl = card.querySelector('[data-cy="reviews-block"] .a-icon-alt, i.a-icon-star-small .a-icon-alt, .a-icon-alt');
    const rating = ratingEl ? parseFirstFloat(ratingEl.textContent) : null;

    const reviewsEl = card.querySelector('[data-cy="reviews-block"] [aria-label*="ratings"], [data-cy="reviews-block"] [aria-label*="تقييم"], span.s-underline-text');
    const reviewsCount = reviewsEl ? parseFirstInt(reviewsEl.textContent) : null;

    const badgeEl = card.querySelector('.a-badge-text, [data-cy="s-pc-faceout-badge"]');
    const badge = badgeEl ? badgeEl.textContent.trim() : '';

    const imgEl = card.querySelector('img.s-image');
    const image = imgEl ? imgEl.getAttribute('src') : null;

    results.push({
      asin,
      title,
      brand,
      price,
      price_formatted: priceFormatted,
      rating,
      reviews: reviewsCount,
      reviews_count: reviewsCount,
      badge,
      image,
      link: `https://www.amazon.${domain}/dp/${asin}`
    });
  });

  return results;
}

// Expose on global window object so dashboard and popup can reuse it directly
if (typeof window !== 'undefined') {
  window.MoraqebScraper = {
    getProductSnapshot,
    extractASIN,
    extractParentASIN,
    extractTitle,
    extractBrand,
    extractPrice,
    extractRating,
    extractReviewCount,
    extractSellerInfo,
    extractAvailability,
    extractImages,
    extractBullets,
    extractDescription,
    extractDimensions,
    extractBSR,
    extractCategories,
    extractBadges,
    extractBoughtPastMonth,
    extractVariantsCount,
    extractReviews,
    parseSellerProfileDoc,
    parseSearchResults
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
