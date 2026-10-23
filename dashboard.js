// Moraqeb Extension Dashboard Controller
// Manages views, calculations, localization, local persistence, charts, theme, and sidebar folding

document.addEventListener("DOMContentLoaded", async () => {
  // State
  let currentLang = "en";
  let currentTheme = "dark";
  let currentMode = "single"; // 'single' | 'compare' | 'hunter'
  let activeAsin = null;
  let products = {};
  let currentPriceHistory = [];
  let compSearchResults = [];
  let cachedSettings = null;

  // DOM Elements - Sidebar & Layout
  const appSidebar = document.getElementById("app-sidebar");
  const btnSidebarCollapse = document.getElementById("btn-sidebar-collapse");
  const btnSidebarExpand = document.getElementById("btn-sidebar-expand");
  const themeDark = document.getElementById("theme-dark");
  const themeLight = document.getElementById("theme-light");
  const btnLangEn = document.getElementById("lang-en");
  const btnLangAr = document.getElementById("lang-ar");
  const inputAddProduct = document.getElementById("input-add-product");
  const btnAddProduct = document.getElementById("btn-add-product");
  const addFeedback = document.getElementById("add-feedback");
  const modeButtons = document.querySelectorAll(".mode-btn");
  const selectActiveProduct = document.getElementById("select-active-product");
  const trackedCountBadge = document.getElementById("tracked-count-badge");
  const sidebarProductPickerGroup = document.getElementById(
    "sidebar-product-picker-group",
  );
  const btnExportData = document.getElementById("btn-export-data");
  const btnImportData = document.getElementById("btn-import-data");
  const fileImportInput = document.getElementById("file-import-input");
  const btnClearAll = document.getElementById("btn-clear-all");
  const btnOpenCfSetup = document.getElementById("btn-open-cf-setup");
  const btnCfLabel = document.getElementById("btn-cf-label");
  const modalCfSetup = document.getElementById("modal-cf-setup");
  const btnCloseCfModal = document.getElementById("btn-close-cf-modal");
  const inputCfToken = document.getElementById("input-cf-token");
  const btnRunCfSetup = document.getElementById("btn-run-cf-setup");
  const btnDisconnectCf = document.getElementById("btn-disconnect-cf");
  const cfSetupProgress = document.getElementById("cf-setup-progress");
  const cfProgressText = document.getElementById("cf-progress-text");
  const cfSetupFeedback = document.getElementById("cf-setup-feedback");
  const cfConnectedInfo = document.getElementById("cf-connected-info");
  const cfConnectedUrl = document.getElementById("cf-connected-url");
  const cfConnectedKey = document.getElementById("cf-connected-key");
  const btnCopyWorkerUrl = document.getElementById("btn-copy-worker-url");
  const btnToggleCfKey = document.getElementById("btn-toggle-cf-key");
  const btnCopyCfKey = document.getElementById("btn-copy-cf-key");
  const sidebarBackdrop = document.getElementById("sidebar-backdrop");

  // DOM Elements - Views
  const viewEmpty = document.getElementById("view-empty");
  const viewSingle = document.getElementById("view-single");
  const viewCompare = document.getElementById("view-compare");
  const viewHunter = document.getElementById("view-hunter");
  const btnSampleLoad = document.getElementById("btn-sample-load");

  // DOM Elements - Single Product View
  const productTitle = document.getElementById("product-title");
  const productCategoryPath = document.getElementById("product-category-path");
  const badgeBestSeller = document.getElementById("badge-best-seller");
  const badgeAmzChoice = document.getElementById("badge-amz-choice");
  const badgeStockStatus = document.getElementById("badge-stock-status");
  const badgeFbaStatus = document.getElementById("badge-fba-status");
  const linkAmazon = document.getElementById("link-amazon");
  const btnDeleteProduct = document.getElementById("btn-delete-product");
  const horizontalGallery = document.getElementById("horizontal-gallery");

  const mPrice = document.getElementById("m-price");
  const mRating = document.getElementById("m-rating");
  const mReviews = document.getElementById("m-reviews");
  const mBsr = document.getElementById("m-bsr");
  const mSales = document.getElementById("m-sales");
  const mOppScore = document.getElementById("m-opp-score");

  const gaugeLqVal = document.getElementById("gauge-lq-val");
  const gaugeLqBar = document.getElementById("gauge-lq-bar");
  const gaugeRiskVal = document.getElementById("gauge-risk-val");
  const gaugeRiskBar = document.getElementById("gauge-risk-bar");
  const gaugeRiskReasons = document.getElementById("gauge-risk-reasons");

  const specAsin = document.getElementById("spec-asin");
  const rowParentAsin = document.getElementById("row-parent-asin");
  const specParentAsin = document.getElementById("spec-parent-asin");
  const specBrand = document.getElementById("spec-brand");
  const specDimensions = document.getElementById("spec-dimensions");
  const rowStockLeft = document.getElementById("row-stock-left");
  const specStockLeft = document.getElementById("spec-stock-left");
  const specCategory = document.getElementById("spec-category");
  const specVariants = document.getElementById("spec-variants");
  const rowBoughtMonth = document.getElementById("row-bought-month");
  const specBoughtMonth = document.getElementById("spec-bought-month");
  const specSellerName = document.getElementById("spec-seller-name");
  const btnViewSellerDialog = document.getElementById("btn-view-seller-dialog");

  // Tabs
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabPanes = document.querySelectorAll(".tab-pane");
  const listFeatureBullets = document.getElementById("list-feature-bullets");
  const featuresEmptyNote = document.getElementById("features-empty-note");
  const textProductDesc = document.getElementById("text-product-desc");
  const descEmptyNote = document.getElementById("desc-empty-note");
  const chipsKeywords = document.getElementById("chips-keywords");
  const keywordsEmptyNote = document.getElementById("keywords-empty-note");

  const reviewsListContainer = document.getElementById(
    "reviews-list-container",
  );
  const reviewsEmptyNote = document.getElementById("reviews-empty-note");
  const btnFetchReviews = document.getElementById("btn-fetch-reviews");
  const btnFetchReviewsEmpty = document.getElementById(
    "btn-fetch-reviews-empty",
  );

  // Competitor Tab
  const inputCompQuery = document.getElementById("input-comp-query");
  const btnRunCompAnalysis = document.getElementById("btn-run-comp-analysis");
  const compResultsBlock = document.getElementById("comp-results-block");
  const cmCount = document.getElementById("cm-count");
  const cmRating = document.getElementById("cm-rating");
  const cmLowReview = document.getElementById("cm-low-review");
  const cmMedianPrice = document.getElementById("cm-median-price");
  const compVerdictAlert = document.getElementById("comp-verdict-alert");
  const compVerdictText = document.getElementById("comp-verdict-text");
  const tbodyCompetitors = document.getElementById("tbody-competitors");

  // FBA Calculator
  const calcSellingPrice = document.getElementById("calc-selling-price");
  const calcUnitCost = document.getElementById("calc-unit-cost");
  const calcReferralPct = document.getElementById("calc-referral-pct");
  const calcFbaTier = document.getElementById("calc-fba-tier");
  const calcFbaFee = document.getElementById("calc-fba-fee");
  const calcBatchQty = document.getElementById("calc-batch-qty");
  const calcWorkingCapital = document.getElementById("calc-working-capital");
  const calcResProfit = document.getElementById("calc-res-profit");
  const calcResMargin = document.getElementById("calc-res-margin");
  const calcResRoi = document.getElementById("calc-res-roi");
  const calcResBatchProfit = document.getElementById("calc-res-batch-profit");

  const feeBreakdownRef = document.getElementById("fee-breakdown-ref");
  const feeBreakdownFba = document.getElementById("fee-breakdown-fba");
  const feeBreakdownAds = document.getElementById("fee-breakdown-ads");
  const feeBreakdownReturns = document.getElementById("fee-breakdown-returns");
  const feeBreakdownVat = document.getElementById("fee-breakdown-vat");
  const feeBreakdownMaxcost = document.getElementById("fee-breakdown-maxcost");
  const feeBreakdownAcos = document.getElementById("fee-breakdown-acos");

  // Charts
  const chartPriceCanvas = document.getElementById("chart-price-canvas");
  const chartPriceTooltip = document.getElementById("chart-price-tooltip");
  const chartPriceEmpty = document.getElementById("chart-price-empty");
  const chartBsrCanvas = document.getElementById("chart-bsr-canvas");
  const chartBsrTooltip = document.getElementById("chart-bsr-tooltip");
  const chartBsrEmpty = document.getElementById("chart-bsr-empty");

  const priceNavControls = document.getElementById("price-nav-controls");
  const btnPricePrev = document.getElementById("btn-price-prev");
  const pricePageIndicator = document.getElementById("price-page-indicator");
  const btnPriceNext = document.getElementById("btn-price-next");

  const bsrNavControls = document.getElementById("bsr-nav-controls");
  const btnBsrPrev = document.getElementById("btn-bsr-prev");
  const bsrPageIndicator = document.getElementById("bsr-page-indicator");
  const btnBsrNext = document.getElementById("btn-bsr-next");

  let pricePageOffset = 0;
  let bsrPageOffset = 0;

  // Comparison View Elements
  const inputCompareFilter = document.getElementById("input-compare-filter");
  const tbodyComparison = document.getElementById("tbody-comparison");

  // Hunter View Elements
  const hunterFlash = document.getElementById("hunter-flash");
  const hunterQueryInput = document.getElementById("hunter-query-input");
  const hunterMaxPrice = document.getElementById("hunter-max-price");
  const hunterMinScore = document.getElementById("hunter-min-score");
  const hunterScoreDisplay = document.getElementById("hunter-score-display");
  const btnHunterScan = document.getElementById("btn-hunter-scan");
  const hunterCountLabel = document.getElementById("hunter-count-label");
  const hunterCardsList = document.getElementById("hunter-cards-list");
  const hunterEmptyNote = document.getElementById("hunter-empty-note");

  // Seller Modal Elements
  const modalSellerDetails = document.getElementById("modal-seller-details");
  const btnCloseSellerModal = document.getElementById("btn-close-seller-modal");
  const modalSellerName = document.getElementById("modal-seller-name");
  const modalSellerBusiness = document.getElementById("modal-seller-business");
  const modalSellerRating = document.getElementById("modal-seller-rating");
  const modalSellerRatingsCount = document.getElementById(
    "modal-seller-ratings-count",
  );
  const modalSellerPositivePct = document.getElementById(
    "modal-seller-positive-pct",
  );
  const modalSellerAboutSection = document.getElementById(
    "modal-seller-about-section",
  );
  const modalSellerAboutText = document.getElementById(
    "modal-seller-about-text",
  );
  const modalSellerLink = document.getElementById("modal-seller-link");

  // Reusable UI Helpers
  function setupModalDismiss(modal, closeBtn) {
    if (!modal) return;
    if (closeBtn) closeBtn.addEventListener("click", () => modal.close());
    modal.addEventListener("click", (e) => {
      const rect = modal.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        modal.close();
      }
    });
  }

  function setupClipboardCopy(button, inputElement, getLang) {
    if (!button || !inputElement) return;
    button.addEventListener("click", () => {
      navigator.clipboard.writeText(inputElement.value);
      button.textContent = t("copied", getLang());
      setTimeout(() => {
        button.textContent = t("copy", getLang());
      }, 2000);
    });
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function sanitizeUrl(url) {
    if (!url || typeof url !== "string") return "#";
    const trimmed = url.trim();
    return /^https?:\/\//i.test(trimmed) ? trimmed : "#";
  }

  function formatPrice(price, currency = "EGP") {
    if (price === null || price === undefined || isNaN(price)) return "—";
    return `${Number(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
  }

  function formatNumber(val, prefix = "") {
    if (val === null || val === undefined || isNaN(val)) return "—";
    return `${prefix}${Number(val).toLocaleString()}`;
  }

  function sanitizeHtmlForParsing(html) {
    if (!html || typeof html !== "string") return "";
    return html.replace(
      /<([a-zA-Z0-9\-]+)((?:[^>"']|"[^"]*"|'[^']*')*)>/g,
      (match, tag, attrs) => {
        if (!/on[a-zA-Z]+\s*=|javascript:/i.test(attrs)) return match;
        const cleanAttrs = attrs
          .replace(/\s+on[a-zA-Z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, " ")
          .replace(
            /\s+(href|src)\s*=\s*(?:["']\s*javascript:[^"']*["']|javascript:[^\s>]+)/gi,
            ' $1="#"',
          );
        return `<${tag}${cleanAttrs}>`;
      },
    );
  }

  async function fetchAndParseDoc(url) {
    const res = await fetch(url, {
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rawHtml = await res.text();
    const cleanHtml = sanitizeHtmlForParsing(rawHtml);
    return new DOMParser().parseFromString(cleanHtml, "text/html");
  }

  // ==========================================
  // Sidebar Fold & Unfold Logic
  // ==========================================
  function collapseSidebar(save = true) {
    appSidebar.classList.add("collapsed");
    btnSidebarExpand.classList.remove("hidden");
    if (sidebarBackdrop) sidebarBackdrop.classList.add("hidden");
    if (save && window.innerWidth >= 1024) {
      StorageManager.saveSettings({ sidebar_collapsed: true });
    }
  }

  function expandSidebar(save = true) {
    appSidebar.classList.remove("collapsed");
    btnSidebarExpand.classList.add("hidden");
    if (window.innerWidth < 1024 && sidebarBackdrop) {
      sidebarBackdrop.classList.remove("hidden");
    }
    if (save && window.innerWidth >= 1024) {
      StorageManager.saveSettings({ sidebar_collapsed: false });
    }
  }

  btnSidebarCollapse.addEventListener("click", () => collapseSidebar(true));
  btnSidebarExpand.addEventListener("click", () => expandSidebar(true));
  if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener("click", () => collapseSidebar(false));
  }

  // ==========================================
  // Theme Switching (Dark & Light)
  // ==========================================
  function applyTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute("data-theme", theme);

    if (theme === "light") {
      themeLight.classList.add("active");
      themeDark.classList.remove("active");
    } else {
      themeDark.classList.add("active");
      themeLight.classList.remove("active");
    }

    // Re-render charts with the new theme colors
    if (currentPriceHistory && currentPriceHistory.length > 0) {
      renderCharts(currentPriceHistory);
    }
  }

  themeDark.addEventListener("click", async () => {
    applyTheme("dark");
    await StorageManager.saveSettings({ theme: "dark" });
  });

  themeLight.addEventListener("click", async () => {
    applyTheme("light");
    await StorageManager.saveSettings({ theme: "light" });
  });

  // ==========================================
  // Localization Engine
  // ==========================================
  function applyTranslations(lang) {
    currentLang = lang;
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");

    if (lang === "ar") {
      btnLangAr.classList.add("active");
      btnLangEn.classList.remove("active");
    } else {
      btnLangEn.classList.add("active");
      btnLangAr.classList.remove("active");
    }

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const translation = t(key, lang);
      if (translation) {
        el.textContent = translation;
      }
    });

    document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
      const key = el.getAttribute("data-i18n-ph");
      const translation = t(key, lang);
      if (translation) {
        el.setAttribute("placeholder", translation);
      }
    });

    document.title = t("app_title", lang);
    renderCurrentMode();
    if (cachedSettings) {
      updateCloudflareUi(cachedSettings);
    }
  }

  btnLangEn.addEventListener("click", async () => {
    await StorageManager.saveSettings({ lang: "en" });
    applyTranslations("en");
  });

  btnLangAr.addEventListener("click", async () => {
    await StorageManager.saveSettings({ lang: "ar" });
    applyTranslations("ar");
  });

  // ==========================================
  // Mode Navigation
  // ==========================================
  function setMode(mode) {
    currentMode = mode;
    modeButtons.forEach((btn) => {
      if (btn.getAttribute("data-mode") === mode) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    renderCurrentMode();
  }

  modeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      setMode(btn.getAttribute("data-mode"));
    });
  });

  function renderCurrentMode() {
    viewEmpty.classList.add("hidden");
    viewSingle.classList.add("hidden");
    viewCompare.classList.add("hidden");
    viewHunter.classList.add("hidden");

    const asins = Object.keys(products);
    trackedCountBadge.textContent = asins.length;

    if (asins.length === 0 && currentMode !== "hunter") {
      viewEmpty.classList.remove("hidden");
      sidebarProductPickerGroup.classList.add("hidden");
      return;
    }

    sidebarProductPickerGroup.classList.remove("hidden");

    if (currentMode === "single") {
      viewSingle.classList.remove("hidden");
      renderSingleProduct();
    } else if (currentMode === "compare") {
      viewCompare.classList.remove("hidden");
      renderComparisonMatrix();
    } else if (currentMode === "hunter") {
      viewHunter.classList.remove("hidden");
      renderHunterView();
    }
  }

  // ==========================================
  // Product Dropdown & Add Product
  // ==========================================
  function updateProductDropdown() {
    selectActiveProduct.replaceChildren();
    const asins = Object.keys(products);

    if (asins.length === 0) {
      const opt = document.createElement("option");
      opt.textContent = t("no_products", currentLang);
      opt.disabled = true;
      selectActiveProduct.appendChild(opt);
      return;
    }

    asins.forEach((asin) => {
      const p = products[asin];
      const opt = document.createElement("option");
      opt.value = asin;
      const titleShort =
        (p.title || asin).length > 38
          ? (p.title || asin).substring(0, 38) + "..."
          : p.title || asin;
      opt.textContent = `${asin} · ${titleShort}`;
      if (asin === activeAsin) {
        opt.selected = true;
      }
      selectActiveProduct.appendChild(opt);
    });
  }

  selectActiveProduct.addEventListener("change", (e) => {
    activeAsin = e.target.value;
    if (currentMode !== "single") {
      setMode("single");
    } else {
      renderSingleProduct();
    }
  });

  function showAddFeedback(msg, type = "success") {
    addFeedback.textContent = msg;
    addFeedback.className = `feedback-msg ${type}`;
    addFeedback.classList.remove("hidden");
    setTimeout(() => {
      addFeedback.classList.add("hidden");
    }, 3500);
  }

  function extractASINFromInput(val) {
    if (!val) return null;
    const clean = val.trim();
    if (/^[A-Z0-9]{10}$/i.test(clean)) return clean.toUpperCase();
    const match = clean.match(/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
    return match ? match[1].toUpperCase() : null;
  }

  btnAddProduct.addEventListener("click", async () => {
    const val = inputAddProduct.value.trim();
    const asin = extractASINFromInput(val);
    if (!asin) {
      showAddFeedback("Invalid ASIN or Amazon URL", "error");
      return;
    }

    btnAddProduct.disabled = true;
    btnAddProduct.textContent = t("scraping_spinner", currentLang);

    try {
      const targetUrl = val.startsWith("http")
        ? val
        : `https://www.amazon.eg/dp/${asin}`;
      let productData = null;

      // 1. Check if user has an open Amazon tab matching this ASIN
      if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.query) {
        try {
          const tabs = await chrome.tabs.query({ url: "*://*.amazon.*/dp/*" });
          const matchingTab = tabs.find(
            (t) => t.url && t.url.toUpperCase().includes(asin),
          );
          if (matchingTab && matchingTab.id) {
            const resp = await new Promise((res) => {
              chrome.tabs.sendMessage(
                matchingTab.id,
                { action: "GET_PRODUCT_DETAILS" },
                res,
              );
            });
            if (resp && resp.success && resp.data) {
              productData = resp.data;
            }
          }
        } catch (_) {}
      }

      // 2. If no matching open tab, fetch page HTML directly and parse with content.js extractors
      if (!productData && typeof MoraqebScraper !== "undefined") {
        const doc = await fetchAndParseDoc(targetUrl);
        productData = MoraqebScraper.getProductSnapshot(doc, targetUrl);
      }

      if (!productData || !productData.title || productData.title.length < 3) {
        throw new Error("Could not extract listing details");
      }

      productData.asin = asin;
      productData.code = asin;

      await StorageManager.saveProduct(productData);
      // Sync tracked list to Cloudflare D1 so the 6-hour cron will track this ASIN too
      StorageManager.syncTrackedProductsToWorker().catch(() => {});

      inputAddProduct.value = "";
      products = await StorageManager.getProducts();
      activeAsin = asin;
      updateProductDropdown();
      showAddFeedback(`${t("scrape_success", currentLang)}: ${asin}`);
      setMode("single");
    } catch (err) {
      console.error("Dashboard Add Product error:", err);
      showAddFeedback(t("scrape_error", currentLang), "error");
    } finally {
      btnAddProduct.disabled = false;
      btnAddProduct.textContent = t("add_product_btn", currentLang);
    }
  });

  // ==========================================
  // Single Product View Rendering
  // ==========================================
  async function renderSingleProduct() {
    if (!activeAsin || !products[activeAsin]) {
      const asins = Object.keys(products);
      if (asins.length > 0) {
        activeAsin = asins[0];
      } else {
        renderCurrentMode();
        return;
      }
    }

    pricePageOffset = 0;
    bsrPageOffset = 0;

    const p = products[activeAsin];
    currentPriceHistory = await StorageManager.getPriceHistory(activeAsin);

    const latestHistory =
      currentPriceHistory.length > 0
        ? currentPriceHistory[currentPriceHistory.length - 1]
        : null;
    const curPrice =
      latestHistory && latestHistory.price !== null
        ? latestHistory.price
        : p.price;
    const curBsr =
      latestHistory && latestHistory.bsr !== null ? latestHistory.bsr : p.bsr;

    // Header info
    productTitle.textContent = p.title || "Unknown Product";
    linkAmazon.href = p.link || `https://www.amazon.eg/dp/${p.asin}`;

    // Categories
    if (
      p.categories &&
      Array.isArray(p.categories) &&
      p.categories.length > 0
    ) {
      const catText = p.categories
        .map((c) => (typeof c === "string" ? c : c?.name || ""))
        .filter(Boolean)
        .join(" > ");
      productCategoryPath.textContent = catText || "Amazon Listing";
      specCategory.textContent = catText || "—";
    } else {
      productCategoryPath.textContent = "Amazon Listing";
      specCategory.textContent = "—";
    }

    // Badges
    badgeBestSeller.classList.toggle("hidden", !p.is_best_seller);
    badgeAmzChoice.classList.toggle("hidden", !p.is_amazon_choice);
    badgeStockStatus.textContent = p.in_stock
      ? t("in_stock", currentLang)
      : t("out_of_stock", currentLang);
    badgeStockStatus.className = `badge ${p.in_stock ? "badge-success" : "badge-danger"}`;
    badgeFbaStatus.classList.toggle("hidden", !p.is_fba);

    // Gallery (Main product photos only, clean deduplicated set)
    horizontalGallery.replaceChildren();
    const images =
      Array.isArray(p.images) && p.images.length > 0
        ? p.images
        : p.image
          ? [p.image]
          : [];
    if (images.length > 0) {
      images.forEach((item) => {
        const imgUrl =
          typeof item === "string" ? item : item?.link || item?.url;
        if (imgUrl && typeof imgUrl === "string") {
          const card = document.createElement("div");
          card.className = "gallery-card";
          const img = document.createElement("img");
          img.src = imgUrl;
          img.loading = "lazy";
          img.alt = p.title || "Product";
          card.appendChild(img);
          horizontalGallery.appendChild(card);
        }
      });
    } else {
      const card = document.createElement("div");
      card.className = "gallery-card";
      const img = document.createElement("img");
      img.src = "icons/icon128.png";
      card.appendChild(img);
      horizontalGallery.appendChild(card);
    }

    // Analytics Scores
    const scores = AnalyticsEngine.computeScores(
      p,
      curBsr,
      curPrice,
      currentLang,
    );

    // Metrics Row
    mPrice.textContent = curPrice
      ? `${curPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP`
      : "—";
    mRating.textContent = p.rating ? `${p.rating} / 5` : "—";
    mReviews.textContent = p.reviews_count
      ? Number(p.reviews_count).toLocaleString()
      : "—";
    mBsr.textContent = curBsr ? `#${Number(curBsr).toLocaleString()}` : "—";
    mSales.textContent = scores.est_units ? `≈ ${scores.est_units}` : "—";
    mOppScore.textContent = `${scores.opp_score}/100`;

    // Intelligence Gauges
    gaugeLqVal.textContent = `${scores.listing_quality}/100`;
    gaugeLqBar.style.width = `${scores.listing_quality}%`;

    gaugeRiskVal.textContent = `${scores.risk_score}/100`;
    gaugeRiskBar.style.width = `${scores.risk_score}%`;
    gaugeRiskReasons.replaceChildren();
    if (scores.risk_reasons && scores.risk_reasons.length > 0) {
      scores.risk_reasons.forEach((r) => {
        const tag = document.createElement("span");
        tag.className = "risk-tag";
        tag.textContent = r;
        gaugeRiskReasons.appendChild(tag);
      });
    }

    // Specs Grid
    specAsin.textContent = p.asin;
    if (p.parent_code) {
      rowParentAsin.classList.remove("hidden");
      specParentAsin.textContent = p.parent_code;
    } else {
      rowParentAsin.classList.add("hidden");
    }
    specBrand.textContent = p.brand || "—";
    specDimensions.textContent = p.dimensions || "—";
    if (p.quantity) {
      rowStockLeft.classList.remove("hidden");
      specStockLeft.textContent = p.quantity;
    } else {
      rowStockLeft.classList.add("hidden");
    }
    specVariants.textContent =
      p.variant_count !== undefined && p.variant_count !== null
        ? p.variant_count > 0
          ? `${p.variant_count}`
          : "None (1)"
        : "—";
    if (p.bought_past_month) {
      rowBoughtMonth.classList.remove("hidden");
      specBoughtMonth.textContent = Number(
        p.bought_past_month,
      ).toLocaleString();
    } else {
      rowBoughtMonth.classList.add("hidden");
    }

    const sellerName = p.seller || p.seller_name || "Amazon";
    specSellerName.textContent = sellerName;

    // Tabs Content
    // Tab 1: Features
    listFeatureBullets.replaceChildren();
    if (p.bullets && Array.isArray(p.bullets) && p.bullets.length > 0) {
      featuresEmptyNote.classList.add("hidden");
      p.bullets.forEach((b) => {
        const li = document.createElement("li");
        li.textContent = b;
        listFeatureBullets.appendChild(li);
      });
    } else {
      featuresEmptyNote.classList.remove("hidden");
    }

    // Tab 2: Description
    if (p.description && p.description.trim()) {
      descEmptyNote.classList.add("hidden");
      textProductDesc.textContent = p.description;
    } else {
      descEmptyNote.classList.remove("hidden");
      textProductDesc.textContent = "";
    }

    // Tab 3: Keywords
    const kws = AnalyticsEngine.extractKeywords(p);
    chipsKeywords.replaceChildren();
    if (kws.length > 0) {
      keywordsEmptyNote.classList.add("hidden");
      kws.forEach((kw) => {
        const chip = document.createElement("span");
        chip.className = "chip";
        chip.textContent = kw;
        chipsKeywords.appendChild(chip);
      });
    } else {
      keywordsEmptyNote.classList.remove("hidden");
    }

    // Tab 4: Reviews & Signals
    renderReviewsTab(p);

    // Tab 5: Competitors
    inputCompQuery.value =
      kws.slice(0, 4).join(" ") ||
      (p.brand ? `${p.brand} ${p.title.split(" ")[0]}` : "product");

    // Initialize FBA Calculator
    initCalculator(p, curPrice);

    // Render Charts
    renderCharts(currentPriceHistory);
  }

  // Reviews Tab Rendering
  function renderReviewsTab(p) {
    const reviewsList = Array.isArray(p.reviews_list) ? p.reviews_list : [];

    reviewsListContainer.replaceChildren();
    if (reviewsList.length > 0) {
      reviewsEmptyNote.classList.add("hidden");
      reviewsList.forEach((rev) => {
        const card = document.createElement("div");
        card.className = "review-card";

        const headerLine = document.createElement("div");
        headerLine.className = "review-header-line";

        const title = document.createElement("span");
        title.className = "review-title";
        title.textContent = rev.title || "Customer Review";

        const ratingBadge = document.createElement("span");
        ratingBadge.className = "badge badge-accent";
        ratingBadge.textContent = rev.rating
          ? `★ ${rev.rating} / 5`
          : "★ 5 / 5";

        const titleGroup = document.createElement("div");
        titleGroup.style.display = "flex";
        titleGroup.style.alignItems = "center";
        titleGroup.style.gap = "8px";
        titleGroup.appendChild(ratingBadge);
        titleGroup.appendChild(title);

        headerLine.appendChild(titleGroup);
        if (rev.is_verified_purchase) {
          const vBadge = document.createElement("span");
          vBadge.className = "badge badge-success";
          vBadge.textContent = t("verified_purchase", currentLang);
          headerLine.appendChild(vBadge);
        }

        const meta = document.createElement("div");
        meta.className = "review-meta";
        meta.textContent = `${(rev.author && rev.author.name) || "Amazon Customer"} · ${rev.date || ""}`;

        const body = document.createElement("div");
        body.className = "review-body";
        body.textContent = rev.text || "";

        card.appendChild(headerLine);
        card.appendChild(meta);
        card.appendChild(body);

        if (rev.helpful_votes && rev.helpful_votes > 0) {
          const helpful = document.createElement("span");
          helpful.className = "review-helpful-tag";
          helpful.textContent = `👍 ${rev.helpful_votes} ${currentLang === "ar" ? "وجدوا هذا مفيداً" : "people found this helpful"}`;
          card.appendChild(helpful);
        }

        reviewsListContainer.appendChild(card);
      });
    } else {
      reviewsEmptyNote.classList.remove("hidden");
    }
  }

  async function handleFetchReviews() {
    if (!activeAsin || !products[activeAsin]) return;
    const p = products[activeAsin];
    const country = StorageManager._detectProductCountry(p);
    const tld = StorageManager._getDomainForCountry(country);
    const targetUrl = p.link || `https://www.amazon.${tld}/dp/${p.asin}`;
    const reviewsPageUrl = `https://www.amazon.${tld}/product-reviews/${p.asin}?reviewerType=all_reviews&sortBy=recent`;

    const setButtonsLoading = (loading) => {
      if (btnFetchReviews) {
        btnFetchReviews.disabled = loading;
        btnFetchReviews.textContent = loading
          ? t("fetching_reviews", currentLang)
          : t("fetch_reviews_btn", currentLang);
      }
      if (btnFetchReviewsEmpty) {
        btnFetchReviewsEmpty.disabled = loading;
        btnFetchReviewsEmpty.textContent = loading
          ? t("fetching_reviews", currentLang)
          : t("fetch_reviews_btn", currentLang);
      }
    };

    setButtonsLoading(true);
    try {
      let extracted = [];
      // 1. Try fetching product page directly
      try {
        const doc = await fetchAndParseDoc(targetUrl);
        if (
          typeof MoraqebScraper !== "undefined" &&
          MoraqebScraper.extractReviews
        ) {
          extracted = MoraqebScraper.extractReviews(doc);
        }
      } catch (err) {
        console.warn("Could not fetch product page for reviews:", err);
      }

      // 2. If 0 reviews found, fallback to dedicated reviews page
      if (extracted.length === 0) {
        try {
          const docReviews = await fetchAndParseDoc(reviewsPageUrl);
          if (
            typeof MoraqebScraper !== "undefined" &&
            MoraqebScraper.extractReviews
          ) {
            extracted = MoraqebScraper.extractReviews(docReviews);
          }
        } catch (err) {
          console.warn("Could not fetch dedicated reviews page:", err);
        }
      }

      if (extracted.length > 0) {
        p.reviews_list = extracted;
        await StorageManager.saveProduct(p);
        products = await StorageManager.getProducts();
        renderReviewsTab(products[activeAsin]);
      } else {
        alert(t("no_reviews_found", currentLang));
      }
    } catch (e) {
      console.error("Fetch reviews error:", e);
      alert(t("reviews_load_failed", currentLang));
    } finally {
      setButtonsLoading(false);
    }
  }

  if (btnFetchReviews)
    btnFetchReviews.addEventListener("click", handleFetchReviews);
  if (btnFetchReviewsEmpty)
    btnFetchReviewsEmpty.addEventListener("click", handleFetchReviews);

  // Competitor Analysis in Tab 5
  btnRunCompAnalysis.addEventListener("click", async () => {
    const p = products[activeAsin];
    let q = inputCompQuery.value.trim();
    if (!q) {
      if (p) {
        const kw = AnalyticsEngine.extractKeywords(p);
        q = kw.slice(0, 3).join(" ") || p.brand || p.title || "amazon product";
      } else {
        q = "amazon product";
      }
      inputCompQuery.value = q;
    }

    btnRunCompAnalysis.disabled = true;
    btnRunCompAnalysis.textContent = t("analyzing_comp", currentLang);

    try {
      const country = p ? StorageManager._detectProductCountry(p) : "EG";
      const tld = StorageManager._getDomainForCountry(country);
      let comps = [];

      // Direct local browser fetch from Amazon search
      if (typeof MoraqebScraper !== "undefined") {
        const searchUrl = `https://www.amazon.${tld}/s?k=${encodeURIComponent(q)}`;
        const doc = await fetchAndParseDoc(searchUrl);
        comps = MoraqebScraper.parseSearchResults(doc, searchUrl);
      }

      // Exclude active product itself if present in results
      if (activeAsin) {
        comps = comps.filter((c) => c.asin !== activeAsin);
      }

      compSearchResults = comps;
      renderCompetitorResults(comps);
    } catch (err) {
      console.error("Competitor analysis error:", err);
      alert(t("comp_error", currentLang));
    } finally {
      btnRunCompAnalysis.disabled = false;
      btnRunCompAnalysis.textContent = t("run_comp_analysis", currentLang);
    }
  });

  function renderCompetitorResults(comps) {
    compResultsBlock.classList.remove("hidden");
    cmCount.textContent = comps.length;

    const validRatings = comps
      .map((c) => c.rating)
      .filter((r) => r !== null && !isNaN(r));
    const avgRating = validRatings.length
      ? (validRatings.reduce((a, b) => a + b, 0) / validRatings.length).toFixed(
          1,
        )
      : "—";
    cmRating.textContent = avgRating !== "—" ? `${avgRating} / 5` : "—";

    const lowReviewCount = comps.filter((c) => (c.reviews || 0) < 500).length;
    const lowReviewPct = comps.length
      ? Math.round((lowReviewCount / comps.length) * 100)
      : 0;
    cmLowReview.textContent = `${lowReviewPct}%`;

    const validPrices = comps
      .map((c) => c.price)
      .filter((p) => p !== null && !isNaN(p))
      .sort((a, b) => a - b);
    const medianPrice = validPrices.length
      ? validPrices[Math.floor(validPrices.length / 2)]
      : "—";
    cmMedianPrice.textContent =
      medianPrice !== "—" ? `${medianPrice} EGP` : "—";

    if (lowReviewPct >= 50) {
      compVerdictAlert.className = "alert-box alert-success";
      compVerdictText.textContent = t("opportunity_easy", currentLang);
    } else if (lowReviewPct >= 25) {
      compVerdictAlert.className = "alert-box alert-info";
      compVerdictText.textContent = t("opportunity_moderate", currentLang);
    } else {
      compVerdictAlert.className = "alert-box alert-warning";
      compVerdictText.textContent = t("opportunity_hard", currentLang);
    }

    tbodyCompetitors.replaceChildren();
    if (!comps.length) {
      const emptyTr = document.createElement("tr");
      const emptyTd = document.createElement("td");
      emptyTd.colSpan = 8;
      emptyTd.style.textAlign = "center";
      emptyTd.style.padding = "20px";
      emptyTd.style.color = "var(--text-muted)";
      emptyTd.textContent = t("no_competitors_found", currentLang);
      emptyTr.appendChild(emptyTd);
      tbodyCompetitors.appendChild(emptyTr);
      return;
    }

    comps.forEach((c) => {
      const isTracked = Boolean(products[c.asin]);
      const tr = document.createElement("tr");
      const safeAsin = escapeHtml(c.asin);
      const safeTitle = escapeHtml(c.title);
      const safeBrand = escapeHtml(c.brand || "—");
      const safePrice = escapeHtml(c.price !== null ? `${c.price} ${c.currency || "EGP"}` : "—");
      const safeRating = escapeHtml(c.rating !== null ? `${c.rating} / 5` : "—");
      const safeReviews = escapeHtml(c.reviews !== null ? String(c.reviews) : "—");
      const safeBadge = c.badge ? `<span class="badge badge-accent">${escapeHtml(c.badge)}</span>` : "—";
      const safeLink = sanitizeUrl(c.link);
      const safeImg = c.image ? `<img src="${sanitizeUrl(c.image)}" class="comp-thumb" alt="">` : "";
      const viewAmazonText = escapeHtml(t("view_on_amazon", currentLang));
      const trackBtnText = escapeHtml(isTracked ? t("tracked", currentLang) : t("track", currentLang));

      tr.innerHTML = `
        <td><code>${safeAsin}</code></td>
        <td>
          <div class="comp-title-cell">
            ${safeImg}
            <span class="comp-title-text" title="${safeTitle}">${safeTitle}</span>
          </div>
        </td>
        <td>${safeBrand}</td>
        <td><strong>${safePrice}</strong></td>
        <td>${safeRating}</td>
        <td>${safeReviews}</td>
        <td>${safeBadge}</td>
        <td>
          <div class="comp-action-btns">
            <a href="${safeLink}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-secondary comp-view-btn" title="${viewAmazonText}">
              <span>${viewAmazonText}</span>
              <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </a>
            <button type="button" class="btn btn-sm ${isTracked ? "btn-secondary" : "btn-primary"} btn-comp-track" ${isTracked ? "disabled" : ""}>
              ${trackBtnText}
            </button>
          </div>
        </td>
      `;

      const btnTrack = tr.querySelector(".btn-comp-track");
      btnTrack.addEventListener("click", async () => {
        btnTrack.disabled = true;
        btnTrack.textContent = "...";
        try {
          let productData = null;
          if (typeof MoraqebScraper !== "undefined" && c.link) {
            try {
              const doc = await fetchAndParseDoc(c.link);
              productData = MoraqebScraper.getProductSnapshot(doc, c.link);
            } catch (fetchErr) {
              console.warn(
                "Could not fetch full page, falling back to search data.",
                fetchErr,
              );
            }
          }
          const finalProductData = {
            code: c.asin,
            asin: c.asin,
            title: c.title,
            brand: c.brand,
            price: c.price,
            price_formatted:
              c.price !== null ? `${c.price} ${c.currency || "EGP"}` : "—",
            currency: c.currency || "EGP",
            rating: c.rating,
            reviews_count: c.reviews,
            image: c.image,
            images: c.image ? [c.image] : [],
            link: c.link,
            ...(productData || {}),
          };

          await StorageManager.saveProduct(finalProductData);
          StorageManager.syncTrackedProductsToWorker().catch(() => {});
          products = await StorageManager.getProducts();
          updateProductDropdown();
          btnTrack.textContent = t("tracked", currentLang);
          btnTrack.className = "btn btn-sm btn-secondary btn-comp-track";
        } catch (trackErr) {
          console.error("Track competitor error:", trackErr);
          btnTrack.disabled = false;
          btnTrack.textContent = t("track", currentLang);
        }
      });

      tbodyCompetitors.appendChild(tr);
    });
  }

  // Delete Active Product
  btnDeleteProduct.addEventListener("click", async () => {
    if (!activeAsin) return;
    if (confirm(t("confirm_delete", currentLang))) {
      await StorageManager.deleteProduct(activeAsin);
      products = await StorageManager.getProducts();
      activeAsin = Object.keys(products)[0] || null;
      updateProductDropdown();
      renderCurrentMode();
    }
  });

  // Tab switching
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-tab");
      tabButtons.forEach((b) => b.classList.remove("active"));
      tabPanes.forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      const targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.add("active");
    });
  });

  // ==========================================
  // FBA Profit Calculator
  // ==========================================
  function initCalculator(p, curPrice) {
    const refRate = AnalyticsEngine.getReferralPct(p.categories);
    const fbaObj = AnalyticsEngine.estimateFbaFee(p.dimensions, curPrice || 0);

    calcSellingPrice.value = curPrice ? Math.round(curPrice) : 100;
    calcUnitCost.value = curPrice ? Math.round(curPrice * 0.4) : 40;
    calcReferralPct.value = refRate;
    calcFbaFee.value = fbaObj.fee;
    calcFbaTier.textContent = fbaObj.tier;

    recalculateFBA();
  }

  function recalculateFBA() {
    const price = parseFloat(calcSellingPrice.value) || 0;
    const cost = parseFloat(calcUnitCost.value) || 0;
    const refRate = parseFloat(calcReferralPct.value) || 10;
    const fbaFee = parseFloat(calcFbaFee.value) || 0;
    const batchQty = parseInt(calcBatchQty.value, 10) || 100;

    const workingCapital = batchQty * cost;
    calcWorkingCapital.textContent = `${workingCapital.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP`;

    const res = AnalyticsEngine.calcFbaProfit(price, cost, refRate, fbaFee);
    if (!res) return;

    calcResProfit.textContent = `${res.net_profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP`;
    calcResProfit.className = `calc-res-val ${res.net_profit >= 0 ? "positive" : "negative"}`;

    calcResMargin.textContent = `${res.margin_pct.toFixed(1)}%`;
    calcResRoi.textContent = `${res.roi_pct.toFixed(1)}%`;

    const batchProfit = res.net_profit * batchQty;
    calcResBatchProfit.textContent = `${batchProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP`;
    calcResBatchProfit.className = `calc-res-val ${batchProfit >= 0 ? "positive" : "negative"}`;

    feeBreakdownRef.textContent = `${res.referral_fee.toFixed(2)} EGP`;
    feeBreakdownFba.textContent = `${res.fba_fee.toFixed(2)} EGP`;
    feeBreakdownAds.textContent = `${res.ads_fee.toFixed(2)} EGP`;
    feeBreakdownReturns.textContent = `${res.returns_fee.toFixed(2)} EGP`;
    feeBreakdownVat.textContent = `${res.vat_on_amazon.toFixed(2)} EGP`;
    feeBreakdownMaxcost.textContent = `${res.max_cost.toFixed(2)} EGP`;
    feeBreakdownAcos.textContent = `${res.breakeven_ads_pct.toFixed(1)}%`;
  }

  [
    calcSellingPrice,
    calcUnitCost,
    calcReferralPct,
    calcFbaFee,
    calcBatchQty,
  ].forEach((input) => {
    input.addEventListener("input", recalculateFBA);
  });

  // ==========================================
  // Interactive Canvas Charts (Theme-aware & Paged)
  // ==========================================
  function paginatePoints(
    allPoints,
    offset,
    canvas,
    navControls,
    btnPrev,
    btnNext,
    indicator,
  ) {
    if (!allPoints || allPoints.length === 0) {
      if (navControls) navControls.classList.add("hidden");
      return { visiblePoints: [], newOffset: 0 };
    }

    const rect = canvas.getBoundingClientRect();
    const containerW = rect.width || 400;
    // Responsive page size: ~35px per data point, minimum 6, max 25
    const pageSize = Math.max(6, Math.min(25, Math.floor(containerW / 35)));

    const N = allPoints.length;
    if (N <= pageSize) {
      if (navControls) navControls.classList.add("hidden");
      return { visiblePoints: allPoints, newOffset: 0 };
    }

    if (navControls) navControls.classList.remove("hidden");
    const maxOffset = N - pageSize;
    const clampedOffset = Math.max(0, Math.min(offset, maxOffset));

    const startIndex = N - pageSize - clampedOffset;
    const endIndex = N - clampedOffset;
    const visiblePoints = allPoints.slice(startIndex, endIndex);

    if (indicator) {
      indicator.textContent = `${startIndex + 1}–${endIndex} / ${N}`;
    }
    if (btnPrev) {
      btnPrev.disabled = clampedOffset >= maxOffset;
    }
    if (btnNext) {
      btnNext.disabled = clampedOffset <= 0;
    }

    return { visiblePoints, newOffset: clampedOffset };
  }

  function renderCharts(history) {
    if (!history || history.length === 0) {
      chartPriceEmpty.classList.remove("hidden");
      chartBsrEmpty.classList.remove("hidden");
      if (priceNavControls) priceNavControls.classList.add("hidden");
      if (bsrNavControls) bsrNavControls.classList.add("hidden");
      clearCanvas(chartPriceCanvas);
      clearCanvas(chartBsrCanvas);
      return;
    }

    const pricePoints = history
      .filter((h) => h.price !== null && !isNaN(h.price))
      .map((h) => ({ date: new Date(h.timestamp), val: h.price }));

    const bsrPoints = history
      .filter((h) => h.bsr !== null && !isNaN(h.bsr))
      .map((h) => ({ date: new Date(h.timestamp), val: h.bsr }));

    if (pricePoints.length > 0) {
      chartPriceEmpty.classList.add("hidden");
      const { visiblePoints, newOffset } = paginatePoints(
        pricePoints,
        pricePageOffset,
        chartPriceCanvas,
        priceNavControls,
        btnPricePrev,
        btnPriceNext,
        pricePageIndicator,
      );
      pricePageOffset = newOffset;
      drawInteractiveLineChart(
        chartPriceCanvas,
        chartPriceTooltip,
        visiblePoints,
        {
          color: "#3b82f6",
          unit: "EGP",
          inverted: false,
        },
      );
    } else {
      if (priceNavControls) priceNavControls.classList.add("hidden");
      chartPriceEmpty.classList.remove("hidden");
      clearCanvas(chartPriceCanvas);
    }

    if (bsrPoints.length > 0) {
      chartBsrEmpty.classList.add("hidden");
      const { visiblePoints, newOffset } = paginatePoints(
        bsrPoints,
        bsrPageOffset,
        chartBsrCanvas,
        bsrNavControls,
        btnBsrPrev,
        btnBsrNext,
        bsrPageIndicator,
      );
      bsrPageOffset = newOffset;
      drawInteractiveLineChart(chartBsrCanvas, chartBsrTooltip, visiblePoints, {
        color: "#10b981",
        unit: "#",
        inverted: true,
      });
    } else {
      if (bsrNavControls) bsrNavControls.classList.add("hidden");
      chartBsrEmpty.classList.remove("hidden");
      clearCanvas(chartBsrCanvas);
    }
  }

  function clearCanvas(canvas) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function drawInteractiveLineChart(canvas, tooltipEl, points, options) {
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 400;
    const height = 240;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    const padLeft = 48;
    const padRight = 20;
    const padTop = 20;
    const padBottom = 30;
    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    const values = points.map((p) => p.val);
    let minVal = Math.min(...values);
    let maxVal = Math.max(...values);
    if (minVal === maxVal) {
      minVal = minVal * 0.9;
      maxVal = maxVal * 1.1 || 10;
    }

    const coords = points.map((p, idx) => {
      const x =
        padLeft +
        (points.length === 1
          ? chartW / 2
          : (idx / (points.length - 1)) * chartW);
      let yNorm = (p.val - minVal) / (maxVal - minVal);
      if (options.inverted) {
        yNorm = 1 - yNorm; // invert rank axis so #1 is near top
      }
      const y = padTop + (1 - yNorm) * chartH;
      return { x, y, pt: p };
    });

    const isDark =
      document.documentElement.getAttribute("data-theme") === "dark";
    const gridColor = isDark ? "#1f2937" : "#e2e8f0";
    const textColor = isDark ? "#6b7280" : "#94a3b8";

    // Draw grid lines
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 4; i++) {
      const y = padTop + (chartH / 4) * i;
      ctx.moveTo(padLeft, y);
      ctx.lineTo(width - padRight, y);

      let gridVal = options.inverted
        ? minVal + ((maxVal - minVal) * i) / 4
        : minVal + ((maxVal - minVal) * (4 - i)) / 4;
      ctx.fillStyle = textColor;
      ctx.font = "10px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(Math.round(gridVal), padLeft - 6, y + 3);
    }
    ctx.stroke();

    // Draw gradient area
    const gradient = ctx.createLinearGradient(0, padTop, 0, height - padBottom);
    gradient.addColorStop(0, options.color + "33");
    gradient.addColorStop(1, options.color + "00");

    ctx.beginPath();
    ctx.moveTo(coords[0].x, height - padBottom);
    coords.forEach((c) => ctx.lineTo(c.x, c.y));
    ctx.lineTo(coords[coords.length - 1].x, height - padBottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line
    ctx.strokeStyle = options.color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    coords.forEach((c, idx) => {
      if (idx === 0) ctx.moveTo(c.x, c.y);
      else ctx.lineTo(c.x, c.y);
    });
    ctx.stroke();

    // Draw dots
    coords.forEach((c) => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? "#111827" : "#ffffff";
      ctx.fill();
      ctx.strokeStyle = options.color;
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Hover interaction
    canvas.onmousemove = (e) => {
      const mouseRect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - mouseRect.left;
      let nearest = null;
      let minDist = Infinity;

      coords.forEach((c) => {
        const dist = Math.abs(c.x - mouseX);
        if (dist < minDist) {
          minDist = dist;
          nearest = c;
        }
      });

      if (nearest && minDist < 35) {
        tooltipEl.classList.remove("hidden");
        const dateStr = nearest.pt.date.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        tooltipEl.replaceChildren();
        const strong = document.createElement("strong");
        strong.textContent = `${options.unit === "#" ? "#" : ""}${nearest.pt.val.toLocaleString()} ${options.unit !== "#" ? options.unit : ""}`;
        tooltipEl.appendChild(strong);
        tooltipEl.appendChild(document.createElement("br"));
        tooltipEl.appendChild(document.createTextNode(dateStr));
        tooltipEl.style.left = `${nearest.x - 40}px`;
        tooltipEl.style.top = `${nearest.y - 45}px`;
      } else {
        tooltipEl.classList.add("hidden");
      }
    };

    canvas.onmouseleave = () => {
      tooltipEl.classList.add("hidden");
    };
  }

  if (btnPricePrev) {
    btnPricePrev.addEventListener("click", () => {
      pricePageOffset += 1;
      renderCharts(currentPriceHistory);
    });
  }
  if (btnPriceNext) {
    btnPriceNext.addEventListener("click", () => {
      pricePageOffset = Math.max(0, pricePageOffset - 1);
      renderCharts(currentPriceHistory);
    });
  }

  if (btnBsrPrev) {
    btnBsrPrev.addEventListener("click", () => {
      bsrPageOffset += 1;
      renderCharts(currentPriceHistory);
    });
  }
  if (btnBsrNext) {
    btnBsrNext.addEventListener("click", () => {
      bsrPageOffset = Math.max(0, bsrPageOffset - 1);
      renderCharts(currentPriceHistory);
    });
  }

  window.addEventListener("resize", () => {
    if (activeAsin && products[activeAsin]) {
      renderCharts(currentPriceHistory);
    }
  });

  // ==========================================
  // Comparison Matrix View Rendering
  // ==========================================
  async function renderComparisonMatrix() {
    const filter = inputCompareFilter.value.toLowerCase().trim();
    const asins = Object.keys(products);
    tbodyComparison.replaceChildren();

    const allHistory = await StorageManager.getAllPriceHistory();

    const filteredAsins = asins.filter((asin) => {
      const p = products[asin];
      return (
        asin.toLowerCase().includes(filter) ||
        (p.title && p.title.toLowerCase().includes(filter)) ||
        (p.brand && p.brand.toLowerCase().includes(filter))
      );
    });

    filteredAsins.forEach((asin) => {
      const p = products[asin];
      const ph = allHistory.filter((h) => h.product_code === asin);
      const curP = ph.length > 0 ? ph[ph.length - 1].price : p.price;
      const curBsr = ph.length > 0 ? ph[ph.length - 1].bsr : p.bsr;
      const scores = AnalyticsEngine.computeScores(
        p,
        curBsr,
        curP,
        currentLang,
      );

      const tr = document.createElement("tr");

      const imgUrl =
        Array.isArray(p.images) && p.images[0]
          ? p.images[0]
          : p.image || "icons/icon48.png";
      const titleShort =
        (p.title || asin).length > 45
          ? (p.title || asin).substring(0, 45) + "..."
          : p.title || asin;

      const safeAsin = escapeHtml(asin);
      const safeImg = sanitizeUrl(imgUrl);
      const safeTitle = escapeHtml(titleShort);
      const safePrice = escapeHtml(curP ? `${curP.toLocaleString()} EGP` : "—");
      const safeRating = escapeHtml(p.rating ? `${p.rating} / 5` : "—");
      const safeReviews = escapeHtml(p.reviews_count ? Number(p.reviews_count).toLocaleString() : "—");
      const safeBsr = escapeHtml(curBsr ? `#${Number(curBsr).toLocaleString()}` : "—");
      const safeEstUnits = escapeHtml(scores.est_units ? `≈ ${scores.est_units}` : "—");
      const safeOppScore = escapeHtml(String(scores.opp_score));
      const safeStockBadge = p.in_stock
        ? `<span class="badge badge-success">${escapeHtml(t("in_stock", currentLang))}</span>`
        : `<span class="badge badge-danger">${escapeHtml(t("out_of_stock", currentLang))}</span>`;
      const safeSeller = escapeHtml(p.seller || "Amazon");

      tr.innerHTML = `
        <td><code>${safeAsin}</code></td>
        <td>
          <img src="${safeImg}" class="table-thumb" alt="Product">
          <strong>${safeTitle}</strong>
        </td>
        <td><strong>${safePrice}</strong></td>
        <td>${safeRating}</td>
        <td>${safeReviews}</td>
        <td>${safeBsr}</td>
        <td>${safeEstUnits}</td>
        <td><span class="badge badge-primary">${safeOppScore}/100</span></td>
        <td>${safeStockBadge}</td>
        <td>${safeSeller}</td>
        <td>
          <button type="button" class="btn btn-sm btn-secondary btn-table-view" data-asin="${safeAsin}">View</button>
        </td>
      `;

      tr.querySelector(".btn-table-view").addEventListener("click", () => {
        activeAsin = asin;
        updateProductDropdown();
        setMode("single");
      });

      tbodyComparison.appendChild(tr);
    });
  }

  inputCompareFilter.addEventListener("input", renderComparisonMatrix);

  // ==========================================
  // AI Product Hunter View Rendering
  // ==========================================
  hunterMinScore.addEventListener("input", (e) => {
    hunterScoreDisplay.textContent = e.target.value;
  });

  btnHunterScan.addEventListener("click", async () => {
    const q = hunterQueryInput.value.trim() || "home essentials";
    const maxP = parseFloat(hunterMaxPrice.value) || 3000;
    const minS = parseInt(hunterMinScore.value, 10) || 50;

    btnHunterScan.disabled = true;
    btnHunterScan.textContent = t("hunter_scanning", currentLang);

    try {
      const p = activeAsin ? products[activeAsin] : null;
      const country = p ? StorageManager._detectProductCountry(p) : "EG";
      const tld = StorageManager._getDomainForCountry(country);
      let candidates = [];

      if (typeof MoraqebScraper !== "undefined") {
        const searchUrl = `https://www.amazon.${tld}/s?k=${encodeURIComponent(q)}`;
        const doc = await fetchAndParseDoc(searchUrl);
        candidates = MoraqebScraper.parseSearchResults(doc, searchUrl);
      }

      const scored = candidates
        .filter((c) => c.price === null || isNaN(c.price) || c.price <= maxP)
        .map((c) => ({
          ...c,
          hunter_score: AnalyticsEngine.calculateHunterScore(c),
        }))
        .filter((c) => c.hunter_score >= minS)
        .sort((a, b) => b.hunter_score - a.hunter_score);

      renderHunterCards(scored);
    } catch (err) {
      console.error("Hunter scan error:", err);
      alert(t("comp_error", currentLang));
    } finally {
      btnHunterScan.disabled = false;
      btnHunterScan.textContent = t("hunter_scan_btn", currentLang);
    }
  });

  function renderHunterCards(scored) {
    hunterCardsList.replaceChildren();
    if (scored.length > 0) {
      hunterEmptyNote.classList.add("hidden");
      hunterCountLabel.classList.remove("hidden");
      hunterCountLabel.textContent = t(
        "hunter_results_count",
        currentLang,
      ).replace("{count}", scored.length);

      scored.forEach((cand, idx) => {
        const isTracked = !!products[cand.asin];
        const card = document.createElement("div");
        card.className = "hunter-candidate-card";

        const ratingDisplay =
          typeof cand.rating === "number"
            ? `${cand.rating} / 5`
            : cand.rating?.average
              ? `${cand.rating.average} / 5`
              : "—";

        const safeTitle = escapeHtml(cand.title);
        const safeAsin = escapeHtml(cand.asin);
        const safeBrand = escapeHtml(cand.brand || "—");
        const safeRating = escapeHtml(ratingDisplay);
        const safeReviews = escapeHtml(String(cand.reviews_count || cand.reviews || 0));
        const safePrice = escapeHtml(cand.price ? `${cand.price} ${cand.currency || "EGP"}` : "—");
        const safeScore = escapeHtml(String(cand.hunter_score));
        const trackText = escapeHtml(isTracked ? t("product_tracked", currentLang) : t("track_product_btn", currentLang));

        card.innerHTML = `
          <div class="hunter-info-col">
            <h4>#${idx + 1} · ${safeTitle}</h4>
            <p class="view-subtitle">ASIN: <code>${safeAsin}</code> · Brand: ${safeBrand} · ${safeRating} (${safeReviews} reviews)</p>
          </div>
          <div class="hunter-price-col">
            <strong>${safePrice}</strong>
          </div>
          <div class="hunter-score-col">
            <span class="hunter-score-badge">${safeScore}/100</span>
          </div>
          <div class="hunter-action-col">
            <button type="button" class="btn btn-sm ${isTracked ? "btn-secondary" : "btn-primary"} btn-hunter-track" ${isTracked ? "disabled" : ""}>
              ${trackText}
            </button>
          </div>
        `;

        const btnTrack = card.querySelector(".btn-hunter-track");
        if (!isTracked) {
          btnTrack.addEventListener("click", async () => {
            btnTrack.disabled = true;
            btnTrack.textContent = "...";
            try {
              let productData = null;
              if (typeof MoraqebScraper !== "undefined" && cand.link) {
                try {
                  const doc = await fetchAndParseDoc(cand.link);
                  productData = MoraqebScraper.getProductSnapshot(
                    doc,
                    cand.link,
                  );
                } catch (fetchErr) {
                  console.warn(
                    "Could not fetch full page, falling back to search data.",
                    fetchErr,
                  );
                }
              }

              const p = activeAsin ? products[activeAsin] : null;
              const country = p
                ? StorageManager._detectProductCountry(p)
                : "EG";
              const tld = StorageManager._getDomainForCountry(country);

              const finalData = {
                code: cand.asin,
                asin: cand.asin,
                title: cand.title,
                brand: cand.brand,
                price: cand.price,
                price_formatted:
                  cand.price !== null && cand.price !== undefined
                    ? `${cand.price} ${cand.currency || "EGP"}`
                    : "—",
                currency: cand.currency || "EGP",
                rating: cand.rating,
                reviews_count: cand.reviews_count || cand.reviews,
                image: cand.image,
                images: cand.image ? [cand.image] : [],
                link: cand.link || `https://www.amazon.${tld}/dp/${cand.asin}`,
                is_best_seller: cand.is_best_seller,
                is_amazon_choice: cand.is_amazon_choice,
                ...(productData || {}),
              };

              await StorageManager.saveProduct(finalData);
              StorageManager.syncTrackedProductsToWorker().catch(() => {});

              products = await StorageManager.getProducts();
              activeAsin = cand.asin;
              updateProductDropdown();
              btnTrack.textContent = t("product_tracked", currentLang);
              btnTrack.className = "btn btn-sm btn-secondary";

              hunterFlash.textContent = `${t("scrape_success", currentLang)}: ${cand.asin}`;
              hunterFlash.classList.remove("hidden");
              setTimeout(() => hunterFlash.classList.add("hidden"), 3000);
            } catch (err) {
              console.error("Hunter track error:", err);
              btnTrack.disabled = false;
              btnTrack.textContent = t("track_product_btn", currentLang);
            }
          });
        }

        hunterCardsList.appendChild(card);
      });
    } else {
      hunterCountLabel.classList.add("hidden");
      hunterEmptyNote.classList.remove("hidden");
    }
  }

  function renderHunterView() {
    hunterQueryInput.value = "";
    hunterCardsList.replaceChildren();
    hunterCountLabel.classList.add("hidden");
    hunterEmptyNote.classList.add("hidden");
  }

  // ==========================================
  // Seller Dialog Modal
  // ==========================================
  btnViewSellerDialog.addEventListener("click", async () => {
    if (!activeAsin || !products[activeAsin]) return;
    const p = products[activeAsin];
    const sellerName = p.seller || p.seller_name || "Amazon";
    let sellerInfo = await StorageManager.getSeller(sellerName);

    const country = StorageManager._detectProductCountry(p);
    const tld = StorageManager._getDomainForCountry(country);
    const sellerUrl =
      p.seller_link ||
      (p.seller_id
        ? `https://www.amazon.${tld}/sp?seller=${p.seller_id}`
        : null);

    // If we have a seller URL and no detailed ratings cached, fetch on demand!
    if ((!sellerInfo || !sellerInfo.rating) && sellerUrl && p.seller_id) {
      btnViewSellerDialog.disabled = true;
      btnViewSellerDialog.textContent = "...";
      try {
        const doc = await fetchAndParseDoc(sellerUrl);
        if (
          typeof MoraqebScraper !== "undefined" &&
          MoraqebScraper.parseSellerProfileDoc
        ) {
          const liveData = MoraqebScraper.parseSellerProfileDoc(doc);
          if (liveData) {
            sellerInfo = {
              seller_id: p.seller_id,
              name: liveData.name || sellerName,
              link: sellerUrl,
              rating: liveData.rating,
              rating_count: liveData.rating_count,
              positive_percent: liveData.positive_percent,
              business_name: liveData.business_name,
              business_address: liveData.business_address,
              about: liveData.about,
            };
            await StorageManager.saveSeller(sellerInfo);
          }
        }
      } catch (err) {
        console.warn("Could not fetch live seller profile:", err);
      } finally {
        btnViewSellerDialog.disabled = false;
        btnViewSellerDialog.textContent = t("view_seller_btn", currentLang);
      }
    }

    modalSellerName.textContent = (sellerInfo && sellerInfo.name) || sellerName;
    modalSellerBusiness.textContent =
      sellerInfo && sellerInfo.business_name
        ? `Business: ${sellerInfo.business_name}`
        : sellerName.toLowerCase().includes("amazon")
          ? "Official Amazon Merchant"
          : "Third-Party Merchant";
    modalSellerRating.textContent =
      sellerInfo && sellerInfo.rating ? `${sellerInfo.rating} / 5` : "—";
    modalSellerRatingsCount.textContent =
      sellerInfo && sellerInfo.rating_count
        ? Number(sellerInfo.rating_count).toLocaleString()
        : "—";
    modalSellerPositivePct.textContent =
      sellerInfo && sellerInfo.positive_percent
        ? `${sellerInfo.positive_percent}%`
        : "—";

    if (sellerInfo && (sellerInfo.about || sellerInfo.business_address)) {
      modalSellerAboutSection.classList.remove("hidden");
      modalSellerAboutText.textContent =
        sellerInfo.about || sellerInfo.business_address;
    } else {
      modalSellerAboutSection.classList.add("hidden");
    }

    modalSellerLink.href =
      (sellerInfo && sellerInfo.link) ||
      sellerUrl ||
      `https://www.amazon.${tld}/sp?seller=${p.seller_id || ""}`;

    modalSellerDetails.showModal();
  });

  setupModalDismiss(modalSellerDetails, btnCloseSellerModal);

  // ==========================================
  // Data Management: Export, Import, Clear, Sample
  // ==========================================
  btnExportData.addEventListener("click", async () => {
    const dataStr = await StorageManager.exportData();
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `moraqeb_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  btnImportData.addEventListener("click", () => {
    fileImportInput.click();
  });

  fileImportInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    fileImportInput.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        await StorageManager.importData(event.target.result);
        await initDashboard();
        alert("Data imported successfully!");
      } catch (err) {
        alert("Failed to import data: " + err.message);
      }
    };
    reader.readAsText(file);
  });

  btnClearAll.addEventListener("click", async () => {
    if (
      confirm(
        "Are you sure you want to clear all tracked products and history?",
      )
    ) {
      await StorageManager.clearAll();
      await initDashboard();
    }
  });

  // Sample Data Loader
  btnSampleLoad.addEventListener("click", async () => {
    const sampleProducts = [
      {
        asin: "B09XYZ0001",
        code: "B09XYZ0001",
        title:
          "Anker Soundcore Life P2 Mini True Wireless Earbuds with Big Bass",
        brand: "Anker",
        link: "https://www.amazon.eg/dp/B09XYZ0001",
        price: 899.0,
        rating: 4.5,
        reviews_count: 1450,
        in_stock: true,
        is_fba: true,
        is_best_seller: true,
        is_amazon_choice: false,
        bought_past_month: 500,
        bsr: 45,
        dimensions: "6.5 x 4.0 x 2.8 cm; 45 Grams",
        seller: "Anker Official Store",
        categories: ["Electronics", "Headphones", "Earbuds"],
        bullets: [
          "Incredible Sound Loved by 20 Million+ People",
          "Tiny and Lightweight: 0.16 oz (4.4g) each earbud",
          "AI-Enhanced Microphone for crystal-clear calls",
          "32 Hours of Extended Playtime with fast USB-C charge",
          "IPX5 Water-Resistant Protection",
        ],
        description:
          "Anker Soundcore Life P2 Mini earbuds feature 10mm oversized drivers to fuel powerful sound with 50% more bass. Seamless pairing and up to 32 hours battery life.",
        images: [
          "https://m.media-amazon.com/images/I/61Nl-H4g0OL._AC_SL1500_.jpg",
          "https://m.media-amazon.com/images/I/61MfqeP6yML._AC_SL1500_.jpg",
        ],
        reviews_list: [
          {
            title: "Great value for money",
            rating: 5,
            author: { name: "Ahmed K." },
            date: "October 10, 2026",
            is_verified_purchase: true,
            text: "Excellent bass and battery life lasts all week.",
          },
          {
            title: "Comfortable fit",
            rating: 4,
            author: { name: "Mona S." },
            date: "September 28, 2026",
            is_verified_purchase: true,
            text: "Very small and light, barely notice them in ears.",
          },
        ],
        sentiment_aspects: [
          { name: "Sound Quality", sentiment: "positive" },
          { name: "Battery Life", sentiment: "positive" },
          { name: "Microphone", sentiment: "neutral" },
        ],
      },
      {
        asin: "B08KITCH02",
        code: "B08KITCH02",
        title:
          "Prestige Stainless Steel Kitchen Knife Set with Ergonomic Grip 6-Piece",
        brand: "Prestige",
        link: "https://www.amazon.eg/dp/B08KITCH02",
        price: 450.0,
        rating: 4.2,
        reviews_count: 380,
        in_stock: true,
        is_fba: true,
        is_best_seller: false,
        is_amazon_choice: true,
        bought_past_month: 200,
        bsr: 320,
        dimensions: "35.0 x 12.0 x 4.0 cm; 650 Grams",
        seller: "Kitchen Supplies Direct",
        categories: ["Home & Kitchen", "Cutlery", "Knife Sets"],
        bullets: [
          "High Carbon German Stainless Steel Blades",
          "Non-slip ergonomic handles for fatigue-free cutting",
          "Includes Chef Knife, Bread Knife, Carving Knife, Utility & Paring Knife",
          "Dishwasher safe and rust-resistant finish",
        ],
        description:
          "Professional cooking knife collection crafted from high-grade steel for precision chopping, slicing, and dicing.",
        images: [
          "https://m.media-amazon.com/images/I/71YFv9g-8dL._AC_SL1500_.jpg",
        ],
        reviews_list: [
          {
            title: "Sharp and sturdy",
            rating: 5,
            author: { name: "Hassan T." },
            date: "August 15, 2026",
            is_verified_purchase: true,
            text: "Very sharp out of the box, handles feel great.",
          },
        ],
      },
    ];

    for (const prod of sampleProducts) {
      await StorageManager.saveProduct(prod);
      const now = new Date();
      await StorageManager.addPriceHistoryPoint(prod.asin, {
        price: prod.price * 1.15,
        bsr: prod.bsr * 1.5,
        rating: prod.rating,
        reviews_count: prod.reviews_count - 50,
        timestamp: new Date(
          now.getTime() - 14 * 24 * 3600 * 1000,
        ).toISOString(),
      });
      await StorageManager.addPriceHistoryPoint(prod.asin, {
        price: prod.price * 1.05,
        bsr: prod.bsr * 1.2,
        rating: prod.rating,
        reviews_count: prod.reviews_count - 20,
        timestamp: new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString(),
      });
      await StorageManager.addPriceHistoryPoint(prod.asin, {
        price: prod.price,
        bsr: prod.bsr,
        rating: prod.rating,
        reviews_count: prod.reviews_count,
        timestamp: now.toISOString(),
      });
    }

    await initDashboard();
  });

  // ==========================================
  // Cloudflare Automated Setup & Modal Logic
  // ==========================================
  function updateCloudflareUi(settings) {
    if (settings) {
      cachedSettings = settings;
    }
    const currentSettings = cachedSettings || {};
    const isConfigured = Boolean(
      currentSettings.worker_url && currentSettings.worker_url.trim(),
    );
    const i18nKey = isConfigured ? "cf_manage_btn" : "cf_setup_btn";
    if (btnCfLabel) {
      btnCfLabel.setAttribute("data-i18n", i18nKey);
      btnCfLabel.textContent = t(i18nKey, currentLang);
    }
    if (btnDisconnectCf) {
      if (isConfigured) {
        btnDisconnectCf.classList.remove("hidden");
      } else {
        btnDisconnectCf.classList.add("hidden");
      }
    }
    if (cfConnectedInfo) {
      if (isConfigured) {
        cfConnectedInfo.classList.remove("hidden");
        if (cfConnectedUrl) cfConnectedUrl.value = currentSettings.worker_url || "";
        if (cfConnectedKey) cfConnectedKey.value = currentSettings.api_key || "";
      } else {
        cfConnectedInfo.classList.add("hidden");
      }
    }
    if (inputCfToken) {
      inputCfToken.value = currentSettings.cf_api_token || "";
    }
  }

  if (btnToggleCfKey && cfConnectedKey) {
    btnToggleCfKey.addEventListener("click", () => {
      if (cfConnectedKey.type === "password") {
        cfConnectedKey.type = "text";
        btnToggleCfKey.textContent = "Hide";
      } else {
        cfConnectedKey.type = "password";
        btnToggleCfKey.textContent = "Show";
      }
    });
  }

  setupClipboardCopy(btnCopyWorkerUrl, cfConnectedUrl, () => currentLang);
  setupClipboardCopy(btnCopyCfKey, cfConnectedKey, () => currentLang);
  setupModalDismiss(modalCfSetup, btnCloseCfModal);

  if (btnOpenCfSetup && modalCfSetup) {
    btnOpenCfSetup.addEventListener("click", async () => {
      const settings = await StorageManager.getSettings();
      updateCloudflareUi(settings);
      if (cfSetupFeedback) cfSetupFeedback.classList.add("hidden");
      if (cfSetupProgress) cfSetupProgress.classList.add("hidden");
      modalCfSetup.showModal();
    });
  }

  if (btnRunCfSetup) {
    btnRunCfSetup.addEventListener("click", async () => {
      const token = (inputCfToken ? inputCfToken.value : "").trim();
      if (!token) {
        if (cfSetupFeedback) {
          cfSetupFeedback.textContent =
            "Please enter your Cloudflare API Token.";
          cfSetupFeedback.className = "feedback-msg error";
          cfSetupFeedback.classList.remove("hidden");
        }
        return;
      }

      btnRunCfSetup.disabled = true;
      if (cfSetupProgress) cfSetupProgress.classList.remove("hidden");
      if (cfSetupFeedback) cfSetupFeedback.classList.add("hidden");

      try {
        await CloudflareSetup.autoSetup(token, (step, total, msg) => {
          if (cfProgressText) {
            cfProgressText.textContent = `[${step}/${total}] ${msg}`;
          }
        });

        if (cfSetupFeedback) {
          cfSetupFeedback.textContent =
            "Cloudflare setup complete! Worker deployed & database connected.";
          cfSetupFeedback.className = "feedback-msg success";
          cfSetupFeedback.classList.remove("hidden");
        }

        const freshSettings = await StorageManager.getSettings();
        updateCloudflareUi(freshSettings);

        setTimeout(() => {
          modalCfSetup.close();
          if (cfSetupFeedback) cfSetupFeedback.classList.add("hidden");
        }, 1800);
      } catch (err) {
        console.error("Cloudflare autoSetup error:", err);
        if (cfSetupFeedback) {
          cfSetupFeedback.textContent = `Setup failed: ${err.message}`;
          cfSetupFeedback.className = "feedback-msg error";
          cfSetupFeedback.classList.remove("hidden");
        }
      } finally {
        btnRunCfSetup.disabled = false;
        if (cfSetupProgress) cfSetupProgress.classList.add("hidden");
      }
    });
  }

  if (btnDisconnectCf) {
    btnDisconnectCf.addEventListener("click", async () => {
      if (confirm(t("cf_disconnect_confirm", currentLang))) {
        await StorageManager.saveSettings({
          worker_url: "",
          api_key: "",
          cf_api_token: "",
          cf_account_id: "",
          cf_database_id: "",
          cf_commit_sha: "",
          cf_deployed_at: "",
        });
        const fresh = await StorageManager.getSettings();
        updateCloudflareUi(fresh);
        modalCfSetup.close();
      }
    });
  }

  // ==========================================
  // Initial Boot
  // ==========================================
  async function initDashboard() {
    const settings = await StorageManager.getSettings();
    cachedSettings = settings;
    currentLang = settings.lang || "en";
    currentTheme = settings.theme || "dark";

    applyTheme(currentTheme);

    // Silent worker update check in background (no UI clutter)
    CloudflareSetup.checkAndApplySilentUpdate().catch(() => {});

    if (settings.sidebar_collapsed || window.innerWidth < 1024) {
      collapseSidebar(false);
    } else {
      expandSidebar(false);
    }

    products = await StorageManager.getProducts();

    const urlParams = new URLSearchParams(window.location.search);
    const paramAsin = urlParams.get("asin");

    if (paramAsin && products[paramAsin.toUpperCase()]) {
      activeAsin = paramAsin.toUpperCase();
    } else {
      const asins = Object.keys(products);
      activeAsin = asins.length > 0 ? asins[0] : null;
    }

    updateProductDropdown();
    applyTranslations(currentLang);
    updateCloudflareUi(settings);
  }

  // Live Sync with Extension Storage (e.g. settings or products changed from popup)
  if (
    typeof chrome !== "undefined" &&
    chrome.storage &&
    chrome.storage.onChanged
  ) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === "local" && changes[STORAGE_KEYS.SETTINGS]) {
        const newSettings = changes[STORAGE_KEYS.SETTINGS].newValue;
        if (newSettings) {
          cachedSettings = newSettings;
          updateCloudflareUi(newSettings);
          if (newSettings.theme && newSettings.theme !== currentTheme) {
            applyTheme(newSettings.theme);
          }
          if (newSettings.lang && newSettings.lang !== currentLang) {
            applyTranslations(newSettings.lang);
          }
          if (newSettings.sidebar_collapsed !== undefined) {
            const isCurrentlyCollapsed =
              appSidebar.classList.contains("collapsed");
            if (newSettings.sidebar_collapsed !== isCurrentlyCollapsed) {
              if (newSettings.sidebar_collapsed) {
                collapseSidebar(false);
              } else {
                expandSidebar(false);
              }
            }
          }
        }
      }
      if (areaName === "local" && changes[STORAGE_KEYS.PRODUCTS]) {
        StorageManager.getProducts().then((latestProducts) => {
          products = latestProducts;
          updateProductDropdown();
          renderCurrentMode();
        });
      }
    });
  }

  await initDashboard();
});
