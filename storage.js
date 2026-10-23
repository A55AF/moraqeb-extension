// Moraqeb Storage & Analytics Engine
// Handles local persistence (chrome.storage.local) and analytics algorithms ported from Moraqeb Python backend

const STORAGE_KEYS = {
  PRODUCTS: "moraqeb_products",
  PRICE_HISTORY: "moraqeb_price_history",
  SELLERS: "moraqeb_sellers",
  SETTINGS: "moraqeb_settings",
  CACHED_WORKER_SCRIPT: "moraqeb_cached_worker_script"
};

const DEFAULT_SETTINGS = {
  lang: "en",
  theme: "dark",
  sidebar_collapsed: false,
  worker_url: "",
  api_key: ""
};

// Internal memory store fallback when neither chrome.storage nor localStorage is present
const _memStore = {};

function normalizeCategories(categories) {
  if (!Array.isArray(categories)) return [];
  return categories.map((c) => (typeof c === "string" ? c : c?.name || "")).filter(Boolean);
}

function normalizeImages(images, fallbackImage = null) {
  if (Array.isArray(images) && images.length > 0) {
    const list = images.map((img) => (typeof img === "string" ? img : img?.link || img?.url)).filter(Boolean);
    if (list.length > 0) return list;
  }
  return fallbackImage && typeof fallbackImage === "string" ? [fallbackImage] : [];
}

function generateSecureToken(prefix = "moraqeb-", byteLength = 16) {
  const cryptoObj =
    typeof crypto !== "undefined" && crypto.getRandomValues
      ? crypto
      : typeof require !== "undefined"
        ? require("crypto").webcrypto
        : null;

  if (cryptoObj && cryptoObj.getRandomValues) {
    const bytes = new Uint8Array(byteLength);
    cryptoObj.getRandomValues(bytes);
    return (
      prefix +
      Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
    );
  }
  throw new Error("Cryptographic random generator unavailable.");
}

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
    }
    if (typeof localStorage !== "undefined") {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch (e) {
        console.error("localStorage get error:", e);
        return defaultValue;
      }
    }
    return _memStore[key] !== undefined ? _memStore[key] : defaultValue;
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
    }
    if (typeof localStorage !== "undefined") {
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
        chrome.storage.local.remove([key], () => resolve());
      });
    }
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(key);
    } else {
      delete _memStore[key];
    }
  }
};

const StorageManager = {
  // ==========================================
  // Product Persistence (CRUD)
  // ==========================================
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

    const cleanImages = normalizeImages(data.images, data.image).length > 0
      ? normalizeImages(data.images, data.image)
      : normalizeImages(existing.images, existing.image);

    const mainImage = (typeof data.image === "string" && data.image)
      ? data.image
      : (cleanImages[0] || existing.image || null);
    const cleanCategories = normalizeCategories(data.categories).length > 0
      ? normalizeCategories(data.categories)
      : normalizeCategories(existing.categories);

    const updated = {
      ...existing,
      ...data,
      code: asin,
      asin,
      images: cleanImages,
      image: mainImage,
      categories: cleanCategories,
      updated_at: new Date().toISOString()
    };

    if (!updated.created_at) {
      updated.created_at = new Date().toISOString();
    }

    products[asin] = updated;
    await StorageAdapter.set(STORAGE_KEYS.PRODUCTS, products);

    if (data.price !== undefined && data.price !== null) {
      await this.addPriceHistoryPoint(asin, {
        price: parseFloat(data.price),
        bsr: data.bsr ? parseInt(data.bsr, 10) : null,
        reviews_count: data.reviews_count ? parseInt(data.reviews_count, 10) : null,
        rating: data.rating ? parseFloat(data.rating) : null,
        offer_count: data.offer_count ? parseInt(data.offer_count, 10) : null,
        seller_name: data.seller || data.seller_name || null,
        timestamp: data.scraped_at || data.timestamp || null
      });
    }

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

    const allHistory = await this.getAllPriceHistory();
    const filtered = allHistory.filter((h) => h.product_code !== cleanAsin);
    await StorageAdapter.set(STORAGE_KEYS.PRICE_HISTORY, filtered);

    try {
      const cfg = await this._getWorkerConfig();
      if (cfg) {
        fetch(`${cfg.workerUrl}/api/tracked-products?asin=${cleanAsin}`, {
          method: "DELETE",
          headers: cfg.headers
        }).catch(() => {});
      }
    } catch (_) {}
  },

  // ==========================================
  // Price & Metrics History
  // ==========================================
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
    const pointTimestamp = pointData.timestamp || pointData.scraped_at || new Date().toISOString();
    const pointTimeMs = new Date(pointTimestamp).getTime();

    // Avoid duplicate entry if an identical price point exists within 15 minutes
    const hasDuplicate = allHistory.some((h) =>
      h.product_code === cleanAsin &&
      Math.abs(new Date(h.timestamp).getTime() - pointTimeMs) < 15 * 60 * 1000 &&
      h.price === pointData.price
    );

    if (hasDuplicate) return null;

    const newPoint = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      product_code: cleanAsin,
      price: pointData.price,
      bsr: pointData.bsr || null,
      reviews_count: pointData.reviews_count || null,
      rating: pointData.rating || null,
      offer_count: pointData.offer_count || null,
      seller_name: pointData.seller_name || null,
      timestamp: pointTimestamp
    };

    allHistory.push(newPoint);
    await StorageAdapter.set(STORAGE_KEYS.PRICE_HISTORY, allHistory);
    return newPoint;
  },

  // ==========================================
  // Seller Profiles Directory
  // ==========================================
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
    sellers[id] = { ...sellers[id], ...sellerData };
    await StorageAdapter.set(STORAGE_KEYS.SELLERS, sellers);
  },

  // ==========================================
  // Settings & Backup Operations
  // ==========================================
  async getSettings() {
    const s = await StorageAdapter.get(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    return { ...DEFAULT_SETTINGS, ...s };
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

  async getCachedWorkerScript() {
    return StorageAdapter.get(STORAGE_KEYS.CACHED_WORKER_SCRIPT, null);
  },

  async setCachedWorkerScript(code) {
    if (typeof code === "string" && code.trim().length > 0) {
      await StorageAdapter.set(STORAGE_KEYS.CACHED_WORKER_SCRIPT, code);
    }
  },

  async exportData() {
    const [products, history, sellers, settings] = await Promise.all([
      this.getProducts(),
      this.getAllPriceHistory(),
      this.getSellers(),
      this.getSettings()
    ]);
    const safeSettings = {
      lang: settings.lang || "en",
      theme: settings.theme || "dark",
      sidebar_collapsed: Boolean(settings.sidebar_collapsed)
    };
    return JSON.stringify(
      {
        products,
        history,
        sellers,
        settings: safeSettings,
        exported_at: new Date().toISOString()
      },
      null,
      2
    );
  },

  async importData(jsonString) {
    if (!jsonString || typeof jsonString !== "string") {
      throw new Error("Invalid backup data: empty or not a string");
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (e) {
      throw new Error("Invalid JSON format in backup file");
    }

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Invalid backup structure: root must be an object");
    }

    // 1. Validate & sanitize products
    if (parsed.products) {
      if (typeof parsed.products !== "object" || Array.isArray(parsed.products)) {
        throw new Error("Invalid products format in backup");
      }
      const safeProducts = {};
      for (const [asin, p] of Object.entries(parsed.products)) {
        if (!/^[A-Z0-9]{10}$/i.test(asin)) continue;
        if (!p || typeof p !== "object" || Array.isArray(p)) continue;
        const cleanProduct = { ...p };
        delete cleanProduct.__proto__;
        delete cleanProduct.constructor;
        delete cleanProduct.prototype;
        cleanProduct.asin = asin.toUpperCase();
        cleanProduct.code = asin.toUpperCase();
        safeProducts[asin.toUpperCase()] = cleanProduct;
      }
      await StorageAdapter.set(STORAGE_KEYS.PRODUCTS, safeProducts);
    }

    // 2. Validate & sanitize history
    if (parsed.history) {
      if (!Array.isArray(parsed.history)) {
        throw new Error("Invalid price history format in backup");
      }
      const safeHistory = parsed.history
        .filter((h) => h && typeof h === "object" && !Array.isArray(h) && h.product_code && h.price !== undefined)
        .map((h) => {
          const clean = { ...h };
          delete clean.__proto__;
          delete clean.constructor;
          delete clean.prototype;
          return clean;
        });
      await StorageAdapter.set(STORAGE_KEYS.PRICE_HISTORY, safeHistory);
    }

    // 3. Validate & sanitize sellers
    if (parsed.sellers) {
      if (typeof parsed.sellers !== "object" || Array.isArray(parsed.sellers)) {
        throw new Error("Invalid sellers format in backup");
      }
      const safeSellers = {};
      for (const [id, s] of Object.entries(parsed.sellers)) {
        if (id === "__proto__" || id === "constructor" || id === "prototype") continue;
        if (!s || typeof s !== "object" || Array.isArray(s)) continue;
        const cleanSeller = { ...s };
        delete cleanSeller.__proto__;
        delete cleanSeller.constructor;
        delete cleanSeller.prototype;
        safeSellers[id] = cleanSeller;
      }
      await StorageAdapter.set(STORAGE_KEYS.SELLERS, safeSellers);
    }

    // 4. Validate & sanitize settings:
    // Only import portable UI preferences; NEVER import or overwrite Cloudflare worker credentials!
    if (parsed.settings && typeof parsed.settings === "object" && !Array.isArray(parsed.settings)) {
      const currentSettings = await this.getSettings();
      const updatedSettings = {
        ...currentSettings,
        lang: parsed.settings.lang === "ar" ? "ar" : "en",
        theme: parsed.settings.theme === "light" ? "light" : "dark",
        sidebar_collapsed: Boolean(parsed.settings.sidebar_collapsed)
      };
      await StorageAdapter.set(STORAGE_KEYS.SETTINGS, updatedSettings);
    }

    return true;
  },

  async clearAll() {
    await Promise.all([
      StorageAdapter.remove(STORAGE_KEYS.PRODUCTS),
      StorageAdapter.remove(STORAGE_KEYS.PRICE_HISTORY),
      StorageAdapter.remove(STORAGE_KEYS.SELLERS)
    ]);
  },

  // ==========================================
  // Marketplace & Routing Utilities
  // ==========================================
  _detectProductCountry(product) {
    if (product?.country) return product.country.toUpperCase();
    const link = product?.link || product?.url || "";
    if (link.includes("amazon.eg")) return "EG";
    if (link.includes("amazon.com.mx")) return "MX";
    if (link.includes("amazon.co.uk")) return "GB";
    if (link.includes("amazon.de")) return "DE";
    if (link.includes("amazon.fr")) return "FR";
    if (link.includes("amazon.it")) return "IT";
    if (link.includes("amazon.es")) return "ES";
    if (link.includes("amazon.ae")) return "AE";
    if (link.includes("amazon.sa")) return "SA";
    if (link.includes("amazon.in")) return "IN";
    if (link.includes("amazon.ca")) return "CA";
    if (link.includes("amazon.com")) return "US";
    return "EG";
  },

  _getDomainForCountry(country) {
    const map = {
      EG: "eg",
      US: "com",
      GB: "co.uk",
      DE: "de",
      FR: "fr",
      IT: "it",
      ES: "es",
      AE: "ae",
      SA: "sa",
      IN: "in",
      CA: "ca",
      MX: "com.mx"
    };
    return map[(country || "EG").toUpperCase()] || "eg";
  },

  getProductUrl(product) {
    const asin = product.asin || product.code;
    const country = this._detectProductCountry(product);
    const tld = this._getDomainForCountry(country);
    return product.link || `https://www.amazon.${tld}/dp/${asin}`;
  },

  // ==========================================
  // Background Scraping Engine (Worker-safe Regex Parsers)
  // In Chrome MV3 service workers, DOMParser and window/document are unavailable.
  // ==========================================
  async _fetchProductHtml(product) {
    const asin = product.asin || product.code;
    const url = this.getProductUrl(product);
    try {
      const res = await fetch(url, {
        headers: {
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        }
      });
      if (!res.ok) {
        console.warn(`[Moraqeb Fetch] HTTP ${res.status} for ${asin}`);
        return null;
      }
      const html = await res.text();
      if (html.includes("api-services-support@amazon.com") || html.includes("To discuss automated access to Amazon data")) {
        console.warn(`[Moraqeb Fetch] Amazon challenge encountered for ${asin}, skipping.`);
        return null;
      }
      return html;
    } catch (err) {
      console.warn(`[Moraqeb Fetch] Error fetching ${asin}:`, err);
      return null;
    }
  },

  _parseMetadataFromHtml(html) {
    if (!html || typeof html !== "string") return null;

    const cleanText = (raw) => {
      if (!raw) return "";
      return raw
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/\s+/g, " ")
        .trim();
    };

    let title = "";
    const titleMatch = html.match(/<span\s+id="productTitle"[^>]*>([\s\S]*?)<\/span>/i) ||
                       html.match(/<h1\s+id="title"[^>]*>([\s\S]*?)<\/h1>/i);
    if (titleMatch) title = cleanText(titleMatch[1]);

    let brand = "";
    const brandMatch = html.match(/<a\s+id="bylineInfo"[^>]*>([\s\S]*?)<\/a>/i) ||
                       html.match(/<a\s+id="brand"[^>]*>([\s\S]*?)<\/a>/i);
    if (brandMatch) {
      brand = cleanText(brandMatch[1])
        .replace(/^(Visit the|Brand:|Marke:|العلامة التجارية:?)\s*/i, "")
        .replace(/\s+(Store|متجر)$/i, "")
        .trim();
    }

    const categories = [];
    const breadcrumbBlockMatch = html.match(/<div\s+id="wayfinding-breadcrumbs_feature_div"[^>]*>([\s\S]*?)<\/div>/i);
    if (breadcrumbBlockMatch) {
      const linkRegex = /<a[^>]*class="[^"]*a-link-normal[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
      let m;
      while ((m = linkRegex.exec(breadcrumbBlockMatch[1])) !== null) {
        const cat = cleanText(m[1]);
        if (cat) categories.push(cat);
      }
    }

    const bullets = [];
    const bulletBlockMatch = html.match(/<div\s+id="feature-bullets"[^>]*>([\s\S]*?)<\/div>/i);
    if (bulletBlockMatch) {
      const liRegex = /<span\s+class="a-list-item"[^>]*>([\s\S]*?)<\/span>/gi;
      let m;
      while ((m = liRegex.exec(bulletBlockMatch[1])) !== null) {
        const text = cleanText(m[1]);
        if (text && !text.toLowerCase().includes("make sure this fits") && !text.toLowerCase().includes("تأكد من أن هذا مناسب")) {
          bullets.push(text);
        }
      }
    }

    let description = "";
    const descMatch = html.match(/<div\s+id="productDescription"[^>]*>([\s\S]*?)<\/div>/i) ||
                      html.match(/<div\s+id="bookDescription_feature_div"[^>]*>([\s\S]*?)<\/div>/i);
    if (descMatch) description = cleanText(descMatch[1]);

    let dimensions = null;
    const dimMatch = html.match(/(?:Product Dimensions|Package Dimensions|Item Dimensions|أبعاد المنتج|أبعاد الشحنة)\s*[:：]\s*([^\n<]+)/i);
    if (dimMatch) dimensions = cleanText(dimMatch[1]);

    // Image Extraction: canonical high-res main image + gallery images
    const imageMap = new Map();
    const addImage = (raw) => {
      if (!raw || typeof raw !== "string") return;
      if (raw.includes("play-button") || raw.includes("transparent-pixel") || raw.includes("sprite") || raw.includes("icon")) return;
      const m = raw.match(/\/images\/I\/([A-Za-z0-9%_\-+]+)\./);
      if (!m) return;
      const id = m[1];
      if (imageMap.has(id)) return;
      const hiRes = raw.replace(/\._[A-Z0-9_,-]+_\./, "._AC_SL1500_.");
      imageMap.set(id, hiRes);
    };

    // 1. Landing image element (data-old-hires, data-a-dynamic-image, src)
    const landingMatch = html.match(/<img[^>]*id="(?:landingImage|imgBlkFront)"[^>]*>/i);
    if (landingMatch) {
      const tag = landingMatch[0];
      const hiresMatch = tag.match(/data-old-hires="([^"]+)"/i);
      if (hiresMatch) addImage(hiresMatch[1]);

      const dynMatch = tag.match(/data-a-dynamic-image="([^"]+)"/i);
      if (dynMatch) {
        try {
          const clean = dynMatch[1].replace(/&quot;/g, '"');
          const dyn = JSON.parse(clean);
          for (const u of Object.keys(dyn)) addImage(u);
        } catch (_) {}
      }

      const srcMatch = tag.match(/src="([^"]+)"/i);
      if (srcMatch) addImage(srcMatch[1]);
    }

    // 2. colorImages.initial JSON array (full gallery)
    let colorList = [];
    const mParse = html.match(/['"]colorImages['"]\s*:\s*\{\s*['"]initial['"]\s*:\s*A\.\$\.parseJSON\(\s*['"](\[\{[\s\S]+?\}\])['"]\s*\)/);
    if (mParse) {
      try {
        colorList = JSON.parse(mParse[1]);
      } catch (_) {}
    }
    if (!colorList.length) {
      const mDirect = html.match(/['"]colorImages['"]\s*:\s*\{\s*['"]initial['"]\s*:\s*(\[\{[\s\S]+?\}\])/);
      if (mDirect) {
        try {
          colorList = JSON.parse(mDirect[1]);
        } catch (_) {}
      }
    }
    for (const item of colorList) {
      if (item.hiRes) addImage(item.hiRes);
      else if (item.large) addImage(item.large);
    }

    const images = Array.from(imageMap.values()).slice(0, 10);
    const mainImage = images[0] || null;

    return {
      title: title || null,
      brand: brand || null,
      categories: categories.length > 0 ? categories : null,
      bullets: bullets.length > 0 ? bullets : null,
      description: description || null,
      dimensions: dimensions || null,
      image: mainImage,
      images: images.length > 0 ? images : null
    };
  },

  _parsePriceMetricsFromHtml(html) {
    if (!html || typeof html !== "string") return null;

    let price = null;
    let priceFormatted = null;
    const pricePatterns = [
      /<div\s+id="corePriceDisplay_desktop_feature_div"[^>]*>[\s\S]*?<span\s+class="a-offscreen"[^>]*>([^<]+)<\/span>/i,
      /<div\s+id="corePrice_feature_div"[^>]*>[\s\S]*?<span\s+class="a-offscreen"[^>]*>([^<]+)<\/span>/i,
      /<span\s+class="[^"]*apexPriceToPay[^"]*"[^>]*>[\s\S]*?<span\s+class="a-offscreen"[^>]*>([^<]+)<\/span>/i,
      /<span\s+id="priceblock_ourprice"[^>]*>([^<]+)<\/span>/i,
      /<span\s+id="priceblock_dealprice"[^>]*>([^<]+)<\/span>/i,
      /<span\s+class="a-price[^"]*"[^>]*><span\s+class="a-offscreen">([^<]+)<\/span>/i
    ];

    for (const pat of pricePatterns) {
      const match = html.match(pat);
      if (match && match[1]) {
        priceFormatted = match[1].trim();
        const numMatch = priceFormatted.replace(/,/g, "").match(/[\d.]+/);
        if (numMatch) {
          price = parseFloat(numMatch[0]);
          break;
        }
      }
    }

    let rating = null;
    const ratingMatch = html.match(/id="acrPopover"[^>]*title="([0-9.]+)\s+out of 5/i) ||
                        html.match(/class="a-icon-alt">([0-9.]+)\s+out of 5/i) ||
                        html.match(/class="a-icon-alt">([0-9.,]+)\s+من\s+5/i);
    if (ratingMatch && ratingMatch[1]) {
      rating = parseFloat(ratingMatch[1].replace(/,/g, "."));
    }

    let reviewsCount = null;
    const reviewMatch = html.match(/id="acrCustomerReviewText"[^>]*>([^<]+)<\/span>/i);
    if (reviewMatch && reviewMatch[1]) {
      const clean = reviewMatch[1].replace(/[^\d]/g, "");
      if (clean) reviewsCount = parseInt(clean, 10);
    }

    let inStock = true;
    const availMatch = html.match(/id="availability"[^>]*>([\s\S]*?)<\/div>/i);
    if (availMatch && availMatch[1]) {
      const text = availMatch[1].toLowerCase();
      if (text.includes("out of stock") || text.includes("غير متوفر") || text.includes("currently unavailable")) {
        inStock = false;
      }
    }

    let bsr = null;
    const bsrMatch = html.match(/Best Sellers Rank:[^#]*#([0-9,]+)/i) ||
                     html.match(/#([0-9,]+)\s+in\s+/i);
    if (bsrMatch && bsrMatch[1]) {
      bsr = parseInt(bsrMatch[1].replace(/,/g, ""), 10);
    }

    let sellerName = null;
    const sellerMatch = html.match(/id="sellerProfileTriggerId"[^>]*>([^<]+)<\/a>/i);
    if (sellerMatch && sellerMatch[1]) {
      sellerName = sellerMatch[1].trim();
    }

    return {
      price,
      price_formatted: priceFormatted,
      rating,
      reviews_count: reviewsCount,
      in_stock: inStock,
      bsr,
      seller_name: sellerName
    };
  },

  async updateTrackedProductsLocally({ batchSize = 5 } = {}) {
    const products = await this.getProducts();
    const allProducts = Object.values(products);
    if (!allProducts.length) return [];

    // Prioritize products never checked, then oldest last_price_check timestamp
    allProducts.sort((a, b) => {
      const timeA = a.last_price_check ? new Date(a.last_price_check).getTime() : 0;
      const timeB = b.last_price_check ? new Date(b.last_price_check).getTime() : 0;
      return timeA - timeB;
    });

    const batch = allProducts.slice(0, batchSize);
    const updatedAsins = [];
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    for (let i = 0; i < batch.length; i++) {
      const p = batch[i];
      const asin = p.asin || p.code;
      if (!asin) continue;

      // Jitter delay between requests (2.5s - 4.5s) to avoid bot triggers
      if (i > 0) {
        await sleep(Math.floor(2500 + Math.random() * 2000));
      }

      const fresh = products[asin] || p;
      fresh.last_price_check = new Date().toISOString();

      try {
        const html = await this._fetchProductHtml(fresh);
        if (html) {
          const metrics = this._parsePriceMetricsFromHtml(html);
          if (metrics && (metrics.price !== null || metrics.rating !== null)) {
            if (metrics.price !== null) {
              fresh.price = metrics.price;
              fresh.price_formatted = metrics.price_formatted || `${metrics.price} ${fresh.currency || "EGP"}`;
            }
            if (metrics.rating !== null) fresh.rating = metrics.rating;
            if (metrics.reviews_count !== null) fresh.reviews_count = metrics.reviews_count;
            if (metrics.in_stock !== null) fresh.in_stock = metrics.in_stock;
            if (metrics.bsr !== null) fresh.bsr = metrics.bsr;
            if (metrics.seller_name) fresh.seller = metrics.seller_name;
            fresh.updated_at = new Date().toISOString();

            if (metrics.price !== null) {
              await this.addPriceHistoryPoint(asin, {
                price: metrics.price,
                bsr: fresh.bsr || null,
                reviews_count: fresh.reviews_count || null,
                rating: fresh.rating || null,
                seller_name: fresh.seller || null,
                timestamp: fresh.last_price_check
              });
            }
            updatedAsins.push(asin);
          }
        }
      } catch (err) {
        console.warn(`[Moraqeb Local Scraper] Error scraping ${asin}:`, err);
      } finally {
        products[asin] = fresh;
      }
    }

    await StorageAdapter.set(STORAGE_KEYS.PRODUCTS, products);
    return updatedAsins;
  },

  async refreshStaleMetadata(maxBatch = 2) {
    const products = await this.getProducts();
    const staleList = [];
    const now = Date.now();
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

    for (const [asin, p] of Object.entries(products)) {
      const lastRefresh = p.last_metadata_refresh ? new Date(p.last_metadata_refresh).getTime() : 0;
      if (now - lastRefresh > THREE_DAYS_MS) {
        staleList.push(p);
      }
    }

    if (!staleList.length) return [];

    const toProcess = staleList.slice(0, maxBatch);
    const updatedAsins = [];

    for (const p of toProcess) {
      try {
        const html = await this._fetchProductHtml(p);
        if (html) {
          const meta = this._parseMetadataFromHtml(html);
          if (meta) {
            const fresh = products[p.asin] || p;
            if (meta.title) fresh.title = meta.title;
            if (meta.brand) fresh.brand = meta.brand;
            if (meta.description) fresh.description = meta.description;
            if (meta.bullets?.length) fresh.bullets = meta.bullets;
            if (meta.categories?.length) fresh.categories = meta.categories;
            if (meta.dimensions) fresh.dimensions = meta.dimensions;
            if (meta.image) fresh.image = meta.image;
            if (meta.images?.length) {
              fresh.images = meta.images;
              fresh.image_count = meta.images.length;
            } else if (meta.image && (!fresh.images || !fresh.images.length)) {
              fresh.images = [meta.image];
              fresh.image_count = 1;
            }
            fresh.last_metadata_refresh = new Date().toISOString();
            fresh.updated_at = new Date().toISOString();
            products[p.asin] = fresh;
            updatedAsins.push(p.asin);
          }
        }
      } catch (err) {
        console.warn(`[Moraqeb Metadata Refresh] Error refreshing ${p.asin}:`, err);
      }
    }

    if (updatedAsins.length > 0) {
      await StorageAdapter.set(STORAGE_KEYS.PRODUCTS, products);
    }
    return updatedAsins;
  },

  // ==========================================
  // Cloudflare Synchronization
  // ==========================================
  async _getWorkerConfig() {
    const settings = await this.getSettings();
    const workerUrl = (settings.worker_url || "").trim().replace(/\/+$/, "");
    if (!workerUrl || !/^https:\/\//i.test(workerUrl)) return null;
    const headers = {};
    if (settings.api_key) {
      headers["X-Moraqeb-Key"] = settings.api_key;
    }
    return { workerUrl, headers, settings };
  },

  async syncTrackedProductsToWorker() {
    try {
      const cfg = await this._getWorkerConfig();
      if (!cfg) return { success: false, reason: "no_worker_url" };

      const products = await this.getProducts();
      const list = Object.values(products).map((p) => ({
        asin: p.asin || p.code,
        country: this._detectProductCountry(p),
        title: p.title || null
      })).filter((item) => Boolean(item.asin));

      const res = await fetch(`${cfg.workerUrl}/api/tracked-products`, {
        method: "POST",
        headers: { ...cfg.headers, "Content-Type": "application/json" },
        body: JSON.stringify(list)
      });
      return await res.json();
    } catch (err) {
      console.warn("Moraqeb syncTrackedProducts error:", err);
      return { success: false, error: err.message };
    }
  },

  async fetchAndApplyBufferUpdates() {
    try {
      const cfg = await this._getWorkerConfig();
      if (!cfg) return [];

      const res = await fetch(`${cfg.workerUrl}/api/buffer/consume`, { headers: cfg.headers });
      if (!res.ok) return [];

      const data = await res.json();
      const items = data.products || [];
      if (!items.length) return [];

      for (const item of items) {
        await this.applyPriceBufferUpdate(item);
      }
      return items;
    } catch (err) {
      console.warn("Moraqeb fetchAndApplyBuffer error:", err);
      return [];
    }
  },

  async applyPriceBufferUpdate(item) {
    if (!item?.asin) return null;
    const asin = item.asin.toUpperCase().trim();
    const products = await this.getProducts();
    const existing = products[asin] || {};

    const price = item.price !== null && item.price !== undefined ? parseFloat(item.price) : (existing.price !== undefined ? existing.price : null);

    const updated = {
      ...existing,
      code: asin,
      asin,
      price,
      price_formatted: item.price_formatted || (price !== null ? `${price} ${item.currency || existing.currency || "EGP"}` : existing.price_formatted || "—"),
      currency: item.currency || existing.currency || "EGP",
      rating: item.rating !== null && item.rating !== undefined ? parseFloat(item.rating) : (existing.rating !== undefined ? existing.rating : null),
      reviews_count: item.reviews_count !== null && item.reviews_count !== undefined ? parseInt(item.reviews_count, 10) : (existing.reviews_count !== undefined ? existing.reviews_count : null),
      seller: item.seller_name || existing.seller || "Amazon",
      seller_name: item.seller_name || existing.seller_name || "Amazon",
      seller_id: item.seller_id || existing.seller_id || null,
      seller_link: item.seller_link || existing.seller_link || null,
      is_fba: item.is_fba !== undefined && item.is_fba !== null ? Boolean(item.is_fba) : (existing.is_fba || false),
      in_stock: item.in_stock !== undefined && item.in_stock !== null ? Boolean(item.in_stock) : (existing.in_stock !== undefined ? existing.in_stock : true),
      bsr: item.bsr !== null && item.bsr !== undefined ? parseInt(item.bsr, 10) : (existing.bsr !== undefined ? existing.bsr : null),
      bsr_category: item.bsr_category || existing.bsr_category || null,
      is_best_seller: item.is_best_seller !== undefined && item.is_best_seller !== null ? Boolean(item.is_best_seller) : (existing.is_best_seller || false),
      is_amazon_choice: item.is_amazon_choice !== undefined && item.is_amazon_choice !== null ? Boolean(item.is_amazon_choice) : (existing.is_amazon_choice || false),
      bought_past_month: item.bought_past_month !== null && item.bought_past_month !== undefined ? parseInt(item.bought_past_month, 10) : (existing.bought_past_month !== undefined ? existing.bought_past_month : null),
      last_price_check: item.scraped_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (!updated.title && item.title) updated.title = item.title;
    if (!updated.image && item.image) updated.image = item.image;
    if (!Array.isArray(updated.images) || updated.images.length === 0) {
      if (item.image) updated.images = [item.image];
    }
    updated.categories = normalizeCategories(updated.categories);

    products[asin] = updated;
    await StorageAdapter.set(STORAGE_KEYS.PRODUCTS, products);

    if (price !== null && !isNaN(price)) {
      await this.addPriceHistoryPoint(asin, {
        price,
        bsr: updated.bsr || null,
        reviews_count: updated.reviews_count || null,
        rating: updated.rating || null,
        seller_name: updated.seller || null,
        timestamp: item.scraped_at || new Date().toISOString()
      });
    }

    if (item.seller_id || item.seller_name) {
      await this.saveSeller({
        seller_id: item.seller_id || `seller_${asin}`,
        name: item.seller_name || "Amazon",
        link: item.seller_link || `https://www.amazon.eg/sp?seller=${item.seller_id || ""}`,
        rating: 0.0
      }).catch(() => {});
    }

    return updated;
  }
};

// ==========================================
// Analytics Algorithms
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
      "inch", "pack", "set", "black", "white", "color", "size",
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
    if (!card) return 0;

    // rating can be a number (from parseSearchResults: e.g. 4.2), an object (e.g. { average, count }), string, or null
    let ratingVal = 3.8;
    let reviewsCount = null;
    if (typeof card.rating === "number" && !isNaN(card.rating)) {
      ratingVal = card.rating;
    } else if (card.rating && typeof card.rating === "object") {
      if (typeof card.rating.average === "number" && !isNaN(card.rating.average)) {
        ratingVal = card.rating.average;
      } else if (card.rating.average) {
        ratingVal = parseFloat(card.rating.average) || 3.8;
      }
      if (card.rating.count !== undefined) reviewsCount = card.rating.count;
    } else if (typeof card.rating === "string") {
      const parsed = parseFloat(card.rating);
      if (!isNaN(parsed)) ratingVal = parsed;
    }

    if (reviewsCount === null) {
      if (typeof card.reviews_count === "number" && !isNaN(card.reviews_count)) {
        reviewsCount = card.reviews_count;
      } else if (typeof card.reviews === "number" && !isNaN(card.reviews)) {
        reviewsCount = card.reviews;
      } else if (card.reviews_count) {
        reviewsCount = parseInt(card.reviews_count, 10) || null;
      } else if (card.reviews) {
        reviewsCount = parseInt(card.reviews, 10) || null;
      }
    }

    // price can be a number, an object ({ amount }), string, or null
    let priceVal = null;
    if (typeof card.price === "number" && !isNaN(card.price)) {
      priceVal = card.price;
    } else if (card.price && typeof card.price === "object") {
      if (typeof card.price.amount === "number" && !isNaN(card.price.amount)) {
        priceVal = card.price.amount;
      } else if (card.price.amount) {
        priceVal = parseFloat(card.price.amount) || null;
      }
    } else if (typeof card.price === "string") {
      const parsed = parseFloat(card.price);
      if (!isNaN(parsed)) priceVal = parsed;
    }

    const badges = (card.badges && typeof card.badges === "object") ? card.badges : {};
    const badgeText = typeof card.badge === "string" ? card.badge.toLowerCase() : "";

    let demand = 60;
    if (badges.is_best_seller || card.is_best_seller || badgeText.includes("best seller") || badgeText.includes("الأكثر مبيعاً")) {
      demand = 95;
    } else if (badges.is_amazons_choice || card.is_amazon_choice || badgeText.includes("amazon's choice") || badgeText.includes("اختيار أمازون")) {
      demand = 85;
    } else if (card.bought_past_month) {
      demand = 80;
    }

    let reviewScore = 50;
    if (reviewsCount === null) reviewScore = 50;
    else if (reviewsCount < 100) reviewScore = 92;
    else if (reviewsCount < 300) reviewScore = 82;
    else if (reviewsCount < 800) reviewScore = 68;
    else if (reviewsCount < 2000) reviewScore = 50;
    else reviewScore = 30;

    const ratingScore = Math.min(100, Math.max(0, Math.round(ratingVal * 20)));

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
