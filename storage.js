// Moraqeb Storage & Analytics Engine
// Handles local persistence (chrome.storage.local) and analytics algorithms ported from Moraqeb Python backend

const STORAGE_KEYS = {
  PRODUCTS: "moraqeb_products",
  PRICE_HISTORY: "moraqeb_price_history",
  SELLERS: "moraqeb_sellers",
  SETTINGS: "moraqeb_settings"
};

// Safe chrome.storage wrapper with fallback to localStorage
const _memStore = {};

const StorageAdapter = {
  async get(key, defaultValue = null) {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      return new Promise((resolve) => {
        chrome.storage.local.get([key], (result) => {
          if (chrome.runtime.lastError) {
            console.error("Storage get error:", chrome.runtime.lastError);
            resolve(defaultValue);
          } else {
            resolve(result[key] !== undefined ? result[key] : defaultValue);
          }
        });
      });
    } else if (typeof localStorage !== "undefined") {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch (e) {
        console.error("localStorage get error:", e);
        return defaultValue;
      }
    } else {
      return _memStore[key] !== undefined ? _memStore[key] : defaultValue;
    }
  },

  async set(key, value) {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [key]: value }, () => {
          if (chrome.runtime.lastError) {
            console.error("Storage set error:", chrome.runtime.lastError);
          }
          resolve();
        });
      });
    } else if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.error("localStorage set error:", e);
      }
    } else {
      _memStore[key] = value;
    }
  },

  async remove(key) {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      return new Promise((resolve) => {
        chrome.storage.local.remove([key], () => {
          resolve();
        });
      });
    } else if (typeof localStorage !== "undefined") {
      localStorage.removeItem(key);
    } else {
      delete _memStore[key];
    }
  }
};

const StorageManager = {
  async getProducts() {
    return (await StorageAdapter.get(STORAGE_KEYS.PRODUCTS, {})) || {};
  },

  async getProduct(asin) {
    if (!asin) return null;
    const products = await this.getProducts();
    return products[asin.toUpperCase()] || null;
  },

  async saveProduct(data) {
    if (!data) return null;
    const asin = (data.code || data.asin || "").toUpperCase().trim();
    if (!asin) throw new Error("Product ASIN is required");

    const products = await this.getProducts();
    const existing = products[asin] || {};

    const updated = {
      ...existing,
      ...data,
      code: asin,
      asin: asin,
      updated_at: new Date().toISOString()
    };

    if (!updated.created_at) {
      updated.created_at = new Date().toISOString();
    }

    products[asin] = updated;
    await StorageAdapter.set(STORAGE_KEYS.PRODUCTS, products);

    // Also record a price history entry if price is present
    if (data.price !== undefined && data.price !== null) {
      await this.addPriceHistoryPoint(asin, {
        price: parseFloat(data.price),
        bsr: data.bsr ? parseInt(data.bsr, 10) : null,
        reviews_count: data.reviews_count ? parseInt(data.reviews_count, 10) : null,
        rating: data.rating ? parseFloat(data.rating) : null,
        offer_count: data.offer_count ? parseInt(data.offer_count, 10) : null,
        seller_name: data.seller || data.seller_name || null
      });
    }

    // Save seller profile if provided
    if (data.seller_id || data.seller) {
      await this.saveSeller({
        seller_id: data.seller_id || `seller_${asin}`,
        name: data.seller || data.seller_name || "Amazon",
        link: data.seller_link || `https://www.amazon.eg/sp?seller=${data.seller_id || ""}`,
        rating: data.seller_rating || 0.0,
        rating_count: data.seller_rating_count || null,
        positive_percent: data.seller_positive_percent || null,
        business_name: data.seller_business_name || null,
        about: data.seller_about || null
      });
    }

    return updated;
  },

  async deleteProduct(asin) {
    if (!asin) return;
    const cleanAsin = asin.toUpperCase().trim();
    const products = await this.getProducts();
    delete products[cleanAsin];
    await StorageAdapter.set(STORAGE_KEYS.PRODUCTS, products);

    // Delete history for this product
    const allHistory = await this.getAllPriceHistory();
    const filtered = allHistory.filter((h) => h.product_code !== cleanAsin);
    await StorageAdapter.set(STORAGE_KEYS.PRICE_HISTORY, filtered);
  },

  async getAllPriceHistory() {
    return (await StorageAdapter.get(STORAGE_KEYS.PRICE_HISTORY, [])) || [];
  },

  async getPriceHistory(asin) {
    if (!asin) return [];
    const cleanAsin = asin.toUpperCase().trim();
    const allHistory = await this.getAllPriceHistory();
    return allHistory
      .filter((h) => h.product_code === cleanAsin)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  },

  async addPriceHistoryPoint(asin, pointData) {
    const cleanAsin = asin.toUpperCase().trim();
    const allHistory = await this.getAllPriceHistory();
    
    // Avoid duplicate point if added within last 3 minutes with identical price
    const now = new Date();
    const lastPoint = allHistory
      .filter((h) => h.product_code === cleanAsin)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

    if (
      lastPoint &&
      Math.abs(new Date(lastPoint.timestamp) - now) < 3 * 60 * 1000 &&
      lastPoint.price === pointData.price
    ) {
      return lastPoint;
    }

    const newPoint = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      product_code: cleanAsin,
      price: pointData.price,
      bsr: pointData.bsr || null,
      reviews_count: pointData.reviews_count || null,
      rating: pointData.rating || null,
      offer_count: pointData.offer_count || null,
      seller_name: pointData.seller_name || null,
      timestamp: now.toISOString()
    };

    allHistory.push(newPoint);
    await StorageAdapter.set(STORAGE_KEYS.PRICE_HISTORY, allHistory);
    return newPoint;
  },

  async getSellers() {
    return (await StorageAdapter.get(STORAGE_KEYS.SELLERS, {})) || {};
  },

  async getSeller(nameOrId) {
    if (!nameOrId) return null;
    const sellers = await this.getSellers();
    if (sellers[nameOrId]) return sellers[nameOrId];
    for (const id in sellers) {
      if (sellers[id].name && sellers[id].name.toLowerCase() === nameOrId.toLowerCase()) {
        return sellers[id];
      }
    }
    return null;
  },

  async saveSeller(sellerData) {
    if (!sellerData) return;
    const id = sellerData.seller_id || sellerData.name;
    if (!id) return;
    const sellers = await this.getSellers();
    sellers[id] = {
      ...sellers[id],
      ...sellerData
    };
    await StorageAdapter.set(STORAGE_KEYS.SELLERS, sellers);
  },

  async getSettings() {
    return (await StorageAdapter.get(STORAGE_KEYS.SETTINGS, { lang: "en", theme: "dark", sidebar_collapsed: false })) || { lang: "en", theme: "dark", sidebar_collapsed: false };
  },

  _settingsQueue: Promise.resolve(),

  async saveSettings(settings) {
    this._settingsQueue = this._settingsQueue
      .then(async () => {
        const current = await this.getSettings();
        await StorageAdapter.set(STORAGE_KEYS.SETTINGS, { ...current, ...settings });
      })
      .catch((err) => {
        console.error("Storage saveSettings error:", err);
      });
    return this._settingsQueue;
  },

  async setSettings(settings) {
    return this.saveSettings(settings);
  },

  async exportData() {
    const products = await this.getProducts();
    const history = await this.getAllPriceHistory();
    const sellers = await this.getSellers();
    const settings = await this.getSettings();
    return JSON.stringify({ products, history, sellers, settings, exported_at: new Date().toISOString() }, null, 2);
  },

  async importData(jsonString) {
    const data = JSON.parse(jsonString);
    if (data.products) await StorageAdapter.set(STORAGE_KEYS.PRODUCTS, data.products);
    if (data.history) await StorageAdapter.set(STORAGE_KEYS.PRICE_HISTORY, data.history);
    if (data.sellers) await StorageAdapter.set(STORAGE_KEYS.SELLERS, data.sellers);
    if (data.settings) await StorageAdapter.set(STORAGE_KEYS.SETTINGS, data.settings);
    return true;
  },

  async clearAll() {
    await StorageAdapter.remove(STORAGE_KEYS.PRODUCTS);
    await StorageAdapter.remove(STORAGE_KEYS.PRICE_HISTORY);
    await StorageAdapter.remove(STORAGE_KEYS.SELLERS);
  }
};

// ==========================================
// Analytics Algorithms ported from app.py
// ==========================================

const AnalyticsEngine = {
  getReferralPct(categories) {
    const text = (Array.isArray(categories) ? categories.join(" ") : String(categories || "")).toLowerCase();
    const rules = [
      ["camera", 7.0],
      ["consumer electronics", 8.0],
      ["electronics", 15.0],
      ["furniture", 13.0],
      ["health", 11.5],
      ["home entertainment", 4.5],
      ["jewelry", 19.0],
      ["kitchen", 11.5],
      ["luggage", 12.0],
      ["mobile phones", 4.5],
      ["office products", 12.0],
      ["personal computers", 4.0],
      ["perfumes", 13.0],
      ["pet products", 14.0],
      ["shoes", 12.0],
      ["sports", 11.5],
      ["tools", 11.0],
      ["toys", 13.0],
      ["watches", 12.0],
      ["wireless", 15.0],
      ["apparel", 12.0],
      ["clothing", 12.0]
    ];

    for (const [key, rate] of rules) {
      if (text.includes(key)) return rate;
    }
    return 10.0;
  },

  estimateFbaFee(dimensionsStr, price = 0) {
    let fee = price > 350 ? 24.5 : 19.5;
    let tier = "Standard Parcel";

    if (dimensionsStr) {
      const matches = String(dimensionsStr).match(/\d+(?:\.\d+)?/g);
      if (matches && matches.length >= 3) {
        const dims = matches.slice(0, 3).map(Number).sort((a, b) => b - a);
        const [l, w, h] = dims;
        if (l <= 20 && w <= 15 && h <= 1.5) {
          tier = "Small Envelope";
        } else if (l <= 33 && w <= 23 && h <= 2.5) {
          tier = "Standard Envelope";
        } else if (l <= 45 && w <= 34 && h <= 26) {
          tier = "Standard Parcel";
        } else {
          tier = "Oversize";
          fee = price > 350 ? 32.0 : 27.0;
        }
      }
    }
    return { fee, tier };
  },

  calcFbaProfit(price, unitCost, referralPct, fbaFee) {
    if (!price || price <= 0) return null;
    const p = parseFloat(price);
    const cost = parseFloat(unitCost) || 0;
    const refRate = parseFloat(referralPct) || 10.0;
    const fba = parseFloat(fbaFee) || 0;

    const referralFee = Math.max((p * refRate) / 100.0, 5.0);
    const adsFee = p * 0.08;
    const returnsFee = p * 0.03;
    const vatOnAmazon = (referralFee + fba) * 0.14;
    const netProfit = p - referralFee - fba - adsFee - returnsFee - vatOnAmazon - cost;
    const marginPct = (netProfit / p) * 100.0;
    const roiPct = cost > 0 ? (netProfit / cost) * 100.0 : 0.0;
    const breakevenAdsPct = Math.max(0.0, ((p - referralFee - fba - returnsFee - vatOnAmazon - cost) / p) * 100.0);
    const maxCost = Math.max(0.0, p - referralFee - fba - adsFee - returnsFee - vatOnAmazon);

    return {
      referral_fee: referralFee,
      fba_fee: fba,
      ads_fee: adsFee,
      returns_fee: returnsFee,
      vat_on_amazon: vatOnAmazon,
      net_profit: netProfit,
      margin_pct: marginPct,
      roi_pct: roiPct,
      breakeven_ads_pct: breakevenAdsPct,
      max_cost: maxCost
    };
  },

  computeScores(p, bsr, price, currentLang = "en") {
    // Listing Quality (0-100)
    let lq = 0;
    const titleLen = (p.title || "").length;
    lq += titleLen >= 60 && titleLen <= 200 ? 18 : titleLen >= 35 ? 11 : 5;

    const bullets = Array.isArray(p.bullets) ? p.bullets : [];
    lq += bullets.length >= 5 ? 18 : bullets.length >= 3 ? 12 : bullets.length >= 1 ? 7 : 0;

    const images = Array.isArray(p.images) ? p.images : p.image ? [p.image] : [];
    lq += images.length >= 5 ? 30 : images.length >= 3 ? 20 : images.length >= 1 ? 10 : 0;

    const descLen = (p.description || "").length;
    lq += descLen >= 500 ? 14 : descLen >= 150 ? 9 : 5;

    const rating = parseFloat(p.rating) || 0;
    if (rating > 0) {
      lq += rating >= 4.3 ? 10 : rating >= 3.8 ? 7 : 3;
    }
    const listingQuality = Math.min(100, lq);

    // Risk Radar (0-100)
    let risk = 0;
    const riskReasons = [];

    if (price === null || price === undefined || isNaN(price)) {
      risk += 15;
      riskReasons.push(currentLang === "en" ? "Unclear pricing" : "السعر غير محدد");
    }
    if (rating > 0 && rating < 3.8) {
      risk += 25;
      riskReasons.push(currentLang === "en" ? `Low rating (${rating}/5)` : `تقييم منخفض (${rating}/5)`);
    }
    const revs = parseInt(p.reviews_count, 10) || 0;
    if (revs > 3000) {
      risk += 15;
      riskReasons.push(currentLang === "en" ? "High review competition" : "منافسة مراجعات قوية (>3000)");
    }
    if (p.in_stock === false) {
      risk += 25;
      riskReasons.push(currentLang === "en" ? "Out of Stock" : "المنتج غير متوفر");
    }
    if (bullets.length < 3) {
      risk += 10;
      riskReasons.push(currentLang === "en" ? "Sparse bullets" : "نقاط مميزات قليلة");
    }
    const riskScore = Math.min(100, risk);

    // Sales Estimation based on BSR
    let estUnits = null;
    if (bsr && !isNaN(bsr)) {
      const bsrNum = parseInt(bsr, 10);
      if (bsrNum <= 100) estUnits = 800;
      else if (bsrNum <= 500) estUnits = 450;
      else if (bsrNum <= 1000) estUnits = 300;
      else if (bsrNum <= 5000) estUnits = 120;
      else if (bsrNum <= 10000) estUnits = 70;
      else if (bsrNum <= 20000) estUnits = 40;
      else if (bsrNum <= 50000) estUnits = 18;
      else estUnits = 5;
    }

    // Opportunity Score (0-100)
    const demandComponent = estUnits && estUnits >= 100 ? 85 : estUnits ? 60 : 40;
    const oppScore = Math.round(demandComponent * 0.35 + listingQuality * 0.35 + (100 - riskScore) * 0.3);

    return {
      listing_quality: listingQuality,
      risk_score: riskScore,
      risk_reasons: riskReasons,
      est_units: estUnits,
      opp_score: oppScore
    };
  },

  extractKeywords(p) {
    const bulletsText = Array.isArray(p.bullets) ? p.bullets.join(" ") : "";
    const fullText = `${p.title || ""} ${bulletsText}`.toLowerCase();
    const words = fullText.match(/[a-z0-9\u0600-\u06ff]{3,}/gi) || [];

    const stopWords = new Set([
      "the", "and", "for", "with", "from", "amazon", "this", "that", "made",
      "inch", "pack", "set", "black", "white", "color", "size", "with",
      "من", "في", "على", "الى", "مع", "هذا", "هذه", "عن", "بين", "أو", "هو", "هي"
    ]);

    const freq = {};
    for (const w of words) {
      const clean = w.trim();
      if (!stopWords.has(clean) && !/^\d+$/.test(clean)) {
        freq[clean] = (freq[clean] || 0) + 1;
      }
    }

    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([word]) => word);
  },

  calculateHunterScore(card) {
    const ratingObj = typeof card.rating === "object" ? card.rating : {};
    const ratingVal = ratingObj.average !== undefined ? ratingObj.average : (parseFloat(card.rating) || 3.8);
    const reviewsCount = ratingObj.count !== undefined ? ratingObj.count : (parseInt(card.reviews_count, 10) || null);

    const priceObj = typeof card.price === "object" ? card.price : {};
    const priceVal = priceObj.amount !== undefined ? priceObj.amount : (parseFloat(card.price) || null);

    const badges = typeof card.badges === "object" ? card.badges : {};

    // Demand proxy
    let demand = 60;
    if (badges.is_best_seller || card.is_best_seller) demand = 95;
    else if (badges.is_amazons_choice || card.is_amazon_choice) demand = 85;
    else if (card.bought_past_month) demand = 80;

    // Review moat: fewer reviews = higher opportunity
    let reviewScore = 50;
    if (reviewsCount === null) reviewScore = 50;
    else if (reviewsCount < 100) reviewScore = 92;
    else if (reviewsCount < 300) reviewScore = 82;
    else if (reviewsCount < 800) reviewScore = 68;
    else if (reviewsCount < 2000) reviewScore = 50;
    else reviewScore = 30;

    // Rating score
    const ratingScore = Math.round(ratingVal * 20);

    // Price sweetspot (150 - 2,500 EGP)
    let priceScore = 50;
    if (priceVal === null) priceScore = 45;
    else if (priceVal >= 150 && priceVal <= 2500) priceScore = 85;
    else if (priceVal >= 80 && priceVal < 150) priceScore = 70;
    else priceScore = 50;

    return Math.round(demand * 0.35 + reviewScore * 0.25 + ratingScore * 0.2 + priceScore * 0.2);
  }
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = { StorageManager, AnalyticsEngine, STORAGE_KEYS };
}
