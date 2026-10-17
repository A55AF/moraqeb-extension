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
  const sidebarProductPickerGroup = document.getElementById("sidebar-product-picker-group");
  const btnExportData = document.getElementById("btn-export-data");
  const btnImportData = document.getElementById("btn-import-data");
  const fileImportInput = document.getElementById("file-import-input");
  const btnClearAll = document.getElementById("btn-clear-all");

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

  const sentimentSummaryBox = document.getElementById("sentiment-summary-box");
  const sentimentSummaryText = document.getElementById("sentiment-summary-text");
  const sentimentAspectsBox = document.getElementById("sentiment-aspects-box");
  const sentimentAspectsChips = document.getElementById("sentiment-aspects-chips");
  const reviewsListContainer = document.getElementById("reviews-list-container");
  const reviewsEmptyNote = document.getElementById("reviews-empty-note");

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
  const modalSellerRatingsCount = document.getElementById("modal-seller-ratings-count");
  const modalSellerPositivePct = document.getElementById("modal-seller-positive-pct");
  const modalSellerAboutSection = document.getElementById("modal-seller-about-section");
  const modalSellerAboutText = document.getElementById("modal-seller-about-text");
  const modalSellerLink = document.getElementById("modal-seller-link");

  // ==========================================
  // Sidebar Fold & Unfold Logic
  // ==========================================
  function collapseSidebar(save = true) {
    appSidebar.classList.add("collapsed");
    btnSidebarExpand.classList.remove("hidden");
    if (save) {
      StorageManager.saveSettings({ sidebar_collapsed: true });
    }
  }

  function expandSidebar(save = true) {
    appSidebar.classList.remove("collapsed");
    btnSidebarExpand.classList.add("hidden");
    if (save) {
      StorageManager.saveSettings({ sidebar_collapsed: false });
    }
  }

  btnSidebarCollapse.addEventListener("click", () => collapseSidebar(true));
  btnSidebarExpand.addEventListener("click", () => expandSidebar(true));

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
    selectActiveProduct.innerHTML = "";
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
      const titleShort = (p.title || asin).length > 38 ? (p.title || asin).substring(0, 38) + "..." : (p.title || asin);
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
      let p = await StorageManager.getProduct(asin);
      if (!p) {
        p = {
          asin: asin,
          code: asin,
          title: `Amazon Listing (${asin})`,
          link: `https://www.amazon.eg/dp/${asin}`,
          in_stock: true,
          seller: "Amazon",
          is_fba: true,
          price: 150.0,
          rating: 4.2,
          reviews_count: 85,
          bullets: ["High durability material", "1-Year Manufacturer Warranty"],
          categories: ["Electronics", "Accessories"]
        };
        await StorageManager.saveProduct(p);
      }

      inputAddProduct.value = "";
      products = await StorageManager.getProducts();
      activeAsin = asin;
      updateProductDropdown();
      showAddFeedback(`${t("scrape_success", currentLang)}: ${asin}`);
      setMode("single");
    } catch (err) {
      console.error(err);
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

    const p = products[activeAsin];
    currentPriceHistory = await StorageManager.getPriceHistory(activeAsin);

    const latestHistory = currentPriceHistory.length > 0 ? currentPriceHistory[currentPriceHistory.length - 1] : null;
    const curPrice = latestHistory && latestHistory.price !== null ? latestHistory.price : p.price;
    const curBsr = latestHistory && latestHistory.bsr !== null ? latestHistory.bsr : p.bsr;

    // Header info
    productTitle.textContent = p.title || "Unknown Product";
    linkAmazon.href = p.link || `https://www.amazon.eg/dp/${p.asin}`;

    // Categories
    if (p.categories && Array.isArray(p.categories) && p.categories.length > 0) {
      productCategoryPath.textContent = p.categories.join(" > ");
      specCategory.textContent = p.categories.join(" > ");
    } else {
      productCategoryPath.textContent = "Amazon Listing";
      specCategory.textContent = "—";
    }

    // Badges
    badgeBestSeller.classList.toggle("hidden", !p.is_best_seller);
    badgeAmzChoice.classList.toggle("hidden", !p.is_amazon_choice);
    badgeStockStatus.textContent = p.in_stock ? t("in_stock", currentLang) : t("out_of_stock", currentLang);
    badgeStockStatus.className = `badge ${p.in_stock ? "badge-success" : "badge-danger"}`;
    badgeFbaStatus.classList.toggle("hidden", !p.is_fba);

    // Gallery (Main product photos only, clean deduplicated set)
    horizontalGallery.innerHTML = "";
    const images = Array.isArray(p.images) && p.images.length > 0 ? p.images : p.image ? [p.image] : [];
    if (images.length > 0) {
      images.forEach((imgUrl) => {
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
    const scores = AnalyticsEngine.computeScores(p, curBsr, curPrice, currentLang);

    // Metrics Row
    mPrice.textContent = curPrice ? `${curPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP` : "—";
    mRating.textContent = p.rating ? `${p.rating} / 5` : "—";
    mReviews.textContent = p.reviews_count ? Number(p.reviews_count).toLocaleString() : "—";
    mBsr.textContent = curBsr ? `#${Number(curBsr).toLocaleString()}` : "—";
    mSales.textContent = scores.est_units ? `≈ ${scores.est_units}` : "—";
    mOppScore.textContent = `${scores.opp_score}/100`;

    // Intelligence Gauges
    gaugeLqVal.textContent = `${scores.listing_quality}/100`;
    gaugeLqBar.style.width = `${scores.listing_quality}%`;

    gaugeRiskVal.textContent = `${scores.risk_score}/100`;
    gaugeRiskBar.style.width = `${scores.risk_score}%`;
    gaugeRiskReasons.innerHTML = "";
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
    specVariants.textContent = p.variant_count || "—";
    if (p.bought_past_month) {
      rowBoughtMonth.classList.remove("hidden");
      specBoughtMonth.textContent = Number(p.bought_past_month).toLocaleString();
    } else {
      rowBoughtMonth.classList.add("hidden");
    }

    const sellerName = p.seller || p.seller_name || "Amazon";
    specSellerName.textContent = sellerName;

    // Tabs Content
    // Tab 1: Features
    listFeatureBullets.innerHTML = "";
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
    chipsKeywords.innerHTML = "";
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
    inputCompQuery.value = kws.slice(0, 4).join(" ") || (p.brand ? `${p.brand} ${p.title.split(" ")[0]}` : "product");

    // Initialize FBA Calculator
    initCalculator(p, curPrice);

    // Render Charts
    renderCharts(currentPriceHistory);
  }

  // Reviews Tab Rendering
  function renderReviewsTab(p) {
    const reviewsList = Array.isArray(p.reviews_list) ? p.reviews_list : [];
    const aspects = Array.isArray(p.sentiment_aspects) ? p.sentiment_aspects : [];

    if (p.ai_sentiment_summary) {
      sentimentSummaryBox.classList.remove("hidden");
      sentimentSummaryText.textContent = p.ai_sentiment_summary;
    } else {
      sentimentSummaryBox.classList.add("hidden");
    }

    if (aspects.length > 0) {
      sentimentAspectsBox.classList.remove("hidden");
      sentimentAspectsChips.innerHTML = "";
      aspects.forEach((asp) => {
        const span = document.createElement("span");
        span.className = `aspect-pill ${asp.sentiment || "neutral"}`;
        span.textContent = `[${asp.sentiment || "aspect"}] ${asp.name || ""}`;
        sentimentAspectsChips.appendChild(span);
      });
    } else {
      sentimentAspectsBox.classList.add("hidden");
    }

    reviewsListContainer.innerHTML = "";
    if (reviewsList.length > 0) {
      reviewsEmptyNote.classList.add("hidden");
      reviewsList.forEach((rev) => {
        const card = document.createElement("div");
        card.className = "review-card";

        const headerLine = document.createElement("div");
        headerLine.className = "review-header-line";

        const title = document.createElement("span");
        title.className = "review-title";
        title.textContent = `${rev.title || "Review"} — ${rev.rating || 5} / 5`;

        headerLine.appendChild(title);
        if (rev.is_verified_purchase) {
          const vBadge = document.createElement("span");
          vBadge.className = "badge badge-success";
          vBadge.textContent = t("verified_purchase", currentLang);
          headerLine.appendChild(vBadge);
        }

        const meta = document.createElement("div");
        meta.className = "review-meta";
        meta.textContent = `${(rev.author && rev.author.name) || "Customer"} · ${rev.date || ""}`;

        const body = document.createElement("div");
        body.className = "review-body";
        body.textContent = rev.text || "";

        card.appendChild(headerLine);
        card.appendChild(meta);
        card.appendChild(body);
        reviewsListContainer.appendChild(card);
      });
    } else {
      reviewsEmptyNote.classList.remove("hidden");
    }
  }

  // Competitor Analysis in Tab 5
  btnRunCompAnalysis.addEventListener("click", () => {
    const q = inputCompQuery.value.trim() || "amazon product";
    btnRunCompAnalysis.disabled = true;
    btnRunCompAnalysis.textContent = t("analyzing_comp", currentLang);

    setTimeout(() => {
      const p = products[activeAsin];
      const basePrice = p.price || 200;

      const comps = [
        { asin: "B09ABC1001", title: `${q} - Pro Edition Heavy Duty`, brand: "Alpha", price: Math.round(basePrice * 0.95), rating: 4.1, reviews: 220, badge: "Choice" },
        { asin: "B09ABC1002", title: `${q} - Ultra Compact Set`, brand: "Maxi", price: Math.round(basePrice * 0.8), rating: 3.9, reviews: 95, badge: "" },
        { asin: "B09ABC1003", title: `${q} - Premium German Quality`, brand: "Kraft", price: Math.round(basePrice * 1.3), rating: 4.6, reviews: 1450, badge: "Best Seller" },
        { asin: "B09ABC1004", title: `${q} - Basic Everyday Model`, brand: "ValuePlus", price: Math.round(basePrice * 0.65), rating: 3.7, reviews: 45, badge: "" },
        { asin: "B09ABC1005", title: `${q} - Multi-functional Series`, brand: "Omni", price: Math.round(basePrice * 1.1), rating: 4.3, reviews: 380, badge: "" },
        { asin: "B09ABC1006", title: `${q} - Quick Install Pack`, brand: "Speedy", price: Math.round(basePrice * 0.9), rating: 4.0, reviews: 520, badge: "" }
      ];

      compSearchResults = comps;
      renderCompetitorResults(comps);

      btnRunCompAnalysis.disabled = false;
      btnRunCompAnalysis.textContent = t("run_comp_analysis", currentLang);
    }, 600);
  });

  function renderCompetitorResults(comps) {
    compResultsBlock.classList.remove("hidden");
    cmCount.textContent = comps.length;

    const ratings = comps.map((c) => c.rating);
    const avgRating = (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1);
    cmRating.textContent = `${avgRating} / 5`;

    const lowReviewCount = comps.filter((c) => c.reviews < 500).length;
    const lowReviewPct = Math.round((lowReviewCount / comps.length) * 100);
    cmLowReview.textContent = `${lowReviewPct}%`;

    const prices = comps.map((c) => c.price).sort((a, b) => a - b);
    const medianPrice = prices[Math.floor(prices.length / 2)];
    cmMedianPrice.textContent = `${medianPrice} EGP`;

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

    tbodyCompetitors.innerHTML = "";
    comps.forEach((c) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><code>${c.asin}</code></td>
        <td>${c.title}</td>
        <td>${c.brand}</td>
        <td><strong>${c.price} EGP</strong></td>
        <td>${c.rating} / 5</td>
        <td>${c.reviews}</td>
        <td>${c.badge ? `<span class="badge badge-accent">${c.badge}</span>` : "—"}</td>
      `;
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

  [calcSellingPrice, calcUnitCost, calcReferralPct, calcFbaFee, calcBatchQty].forEach((input) => {
    input.addEventListener("input", recalculateFBA);
  });

  // ==========================================
  // Interactive Canvas Charts (Theme-aware)
  // ==========================================
  function renderCharts(history) {
    if (!history || history.length === 0) {
      chartPriceEmpty.classList.remove("hidden");
      chartBsrEmpty.classList.remove("hidden");
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
      drawInteractiveLineChart(chartPriceCanvas, chartPriceTooltip, pricePoints, {
        color: "#3b82f6",
        unit: "EGP",
        inverted: false
      });
    } else {
      chartPriceEmpty.classList.remove("hidden");
      clearCanvas(chartPriceCanvas);
    }

    if (bsrPoints.length > 0) {
      chartBsrEmpty.classList.add("hidden");
      drawInteractiveLineChart(chartBsrCanvas, chartBsrTooltip, bsrPoints, {
        color: "#10b981",
        unit: "#",
        inverted: true
      });
    } else {
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
      const x = padLeft + (points.length === 1 ? chartW / 2 : (idx / (points.length - 1)) * chartW);
      let yNorm = (p.val - minVal) / (maxVal - minVal);
      if (options.inverted) {
        yNorm = 1 - yNorm; // invert rank axis so #1 is near top
      }
      const y = padTop + (1 - yNorm) * chartH;
      return { x, y, pt: p };
    });

    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
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
        ? minVal + ((maxVal - minVal) * (4 - i)) / 4
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
          minute: "2-digit"
        });
        tooltipEl.innerHTML = `<strong>${options.unit === "#" ? "#" : ""}${nearest.pt.val.toLocaleString()} ${options.unit !== "#" ? options.unit : ""}</strong><br>${dateStr}`;
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

  // ==========================================
  // Comparison Matrix View Rendering
  // ==========================================
  async function renderComparisonMatrix() {
    const filter = inputCompareFilter.value.toLowerCase().trim();
    const asins = Object.keys(products);
    tbodyComparison.innerHTML = "";

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
      const scores = AnalyticsEngine.computeScores(p, curBsr, curP, currentLang);

      const tr = document.createElement("tr");

      const imgUrl = Array.isArray(p.images) && p.images[0] ? p.images[0] : p.image || "icons/icon48.png";
      const titleShort = (p.title || asin).length > 45 ? (p.title || asin).substring(0, 45) + "..." : (p.title || asin);

      tr.innerHTML = `
        <td><code>${asin}</code></td>
        <td>
          <img src="${imgUrl}" class="table-thumb" alt="Product">
          <strong>${titleShort}</strong>
        </td>
        <td><strong>${curP ? `${curP.toLocaleString()} EGP` : "—"}</strong></td>
        <td>${p.rating ? `${p.rating} / 5` : "—"}</td>
        <td>${p.reviews_count ? Number(p.reviews_count).toLocaleString() : "—"}</td>
        <td>${curBsr ? `#${Number(curBsr).toLocaleString()}` : "—"}</td>
        <td>${scores.est_units ? `≈ ${scores.est_units}` : "—"}</td>
        <td><span class="badge badge-primary">${scores.opp_score}/100</span></td>
        <td>${p.in_stock ? `<span class="badge badge-success">${t("in_stock", currentLang)}</span>` : `<span class="badge badge-danger">${t("out_of_stock", currentLang)}</span>`}</td>
        <td>${p.seller || "Amazon"}</td>
        <td>
          <button type="button" class="btn btn-sm btn-secondary btn-table-view" data-asin="${asin}">View</button>
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

  btnHunterScan.addEventListener("click", () => {
    const q = hunterQueryInput.value.trim() || "home essentials";
    const maxP = parseFloat(hunterMaxPrice.value) || 3000;
    const minS = parseInt(hunterMinScore.value, 10) || 50;

    btnHunterScan.disabled = true;
    btnHunterScan.textContent = t("hunter_scanning", currentLang);

    setTimeout(() => {
      const candidates = [
        { asin: "B09HUNTER1", title: `${q} - Wireless Smart Sensor Organizer`, brand: "HomeSmart", price: 340, rating: 4.5, reviews_count: 140, is_best_seller: true },
        { asin: "B09HUNTER2", title: `${q} - Stainless Steel 6-Piece Kit`, brand: "ChefLine", price: 780, rating: 4.4, reviews_count: 210, is_amazon_choice: true },
        { asin: "B09HUNTER3", title: `${q} - Ergonomic Portable Holder`, brand: "FlexiGrip", price: 195, rating: 4.1, reviews_count: 85, bought_past_month: 250 },
        { asin: "B09HUNTER4", title: `${q} - Multi-Compartment Storage Box`, brand: "TidyBox", price: 420, rating: 4.3, reviews_count: 190, is_best_seller: false },
        { asin: "B09HUNTER5", title: `${q} - Heavy Duty Modular Rack`, brand: "SteelPro", price: 1250, rating: 4.6, reviews_count: 320, bought_past_month: 400 },
        { asin: "B09HUNTER6", title: `${q} - Deluxe Travel Organizer`, brand: "Voyage", price: 280, rating: 3.9, reviews_count: 55, is_best_seller: false }
      ];

      const scored = candidates
        .filter((c) => c.price <= maxP)
        .map((c) => ({ ...c, hunter_score: AnalyticsEngine.calculateHunterScore(c) }))
        .filter((c) => c.hunter_score >= minS)
        .sort((a, b) => b.hunter_score - a.hunter_score);

      renderHunterCards(scored);

      btnHunterScan.disabled = false;
      btnHunterScan.textContent = t("hunter_scan_btn", currentLang);
    }, 600);
  });

  function renderHunterCards(scored) {
    hunterCardsList.innerHTML = "";
    if (scored.length > 0) {
      hunterEmptyNote.classList.add("hidden");
      hunterCountLabel.classList.remove("hidden");
      hunterCountLabel.textContent = t("hunter_results_count", currentLang).replace("{count}", scored.length);

      scored.forEach((cand, idx) => {
        const isTracked = !!products[cand.asin];
        const card = document.createElement("div");
        card.className = "hunter-candidate-card";

        card.innerHTML = `
          <div class="hunter-info-col">
            <h4>#${idx + 1} · ${cand.title}</h4>
            <p class="view-subtitle">ASIN: <code>${cand.asin}</code> · Brand: ${cand.brand} · ${cand.rating} / 5 (${cand.reviews_count} reviews)</p>
          </div>
          <div class="hunter-price-col">
            <strong>${cand.price} EGP</strong>
          </div>
          <div class="hunter-score-col">
            <span class="hunter-score-badge">${cand.hunter_score}/100</span>
          </div>
          <div class="hunter-action-col">
            <button type="button" class="btn btn-sm ${isTracked ? "btn-secondary" : "btn-primary"} btn-hunter-track" ${isTracked ? "disabled" : ""}>
              ${isTracked ? t("product_tracked", currentLang) : t("track_product_btn", currentLang)}
            </button>
          </div>
        `;

        const btnTrack = card.querySelector(".btn-hunter-track");
        if (!isTracked) {
          btnTrack.addEventListener("click", async () => {
            btnTrack.disabled = true;
            btnTrack.textContent = "Saving...";
            await StorageManager.saveProduct({
              asin: cand.asin,
              code: cand.asin,
              title: cand.title,
              brand: cand.brand,
              price: cand.price,
              rating: cand.rating,
              reviews_count: cand.reviews_count,
              is_best_seller: cand.is_best_seller,
              is_amazon_choice: cand.is_amazon_choice,
              link: `https://www.amazon.eg/dp/${cand.asin}`
            });

            products = await StorageManager.getProducts();
            activeAsin = cand.asin;
            updateProductDropdown();
            btnTrack.textContent = t("product_tracked", currentLang);
            btnTrack.className = "btn btn-sm btn-secondary";

            hunterFlash.textContent = `${t("scrape_success", currentLang)}: ${cand.asin}`;
            hunterFlash.classList.remove("hidden");
            setTimeout(() => hunterFlash.classList.add("hidden"), 3000);
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
    hunterCardsList.innerHTML = "";
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
    const sellerInfo = await StorageManager.getSeller(sellerName);

    modalSellerName.textContent = (sellerInfo && sellerInfo.name) || sellerName;
    modalSellerBusiness.textContent = sellerInfo && sellerInfo.business_name ? `Business: ${sellerInfo.business_name}` : "Verified Merchant";
    modalSellerRating.textContent = sellerInfo && sellerInfo.rating ? `${sellerInfo.rating} / 5` : "4.8 / 5";
    modalSellerRatingsCount.textContent = sellerInfo && sellerInfo.rating_count ? Number(sellerInfo.rating_count).toLocaleString() : "1,240";
    modalSellerPositivePct.textContent = sellerInfo && sellerInfo.positive_percent ? `${sellerInfo.positive_percent}%` : "96%";

    if (sellerInfo && sellerInfo.about) {
      modalSellerAboutSection.classList.remove("hidden");
      modalSellerAboutText.textContent = sellerInfo.about;
    } else {
      modalSellerAboutSection.classList.add("hidden");
    }

    modalSellerLink.href = (sellerInfo && sellerInfo.link) || p.seller_link || `https://www.amazon.eg/sp?seller=${p.seller_id || ""}`;

    modalSellerDetails.showModal();
  });

  btnCloseSellerModal.addEventListener("click", () => {
    modalSellerDetails.close();
  });

  modalSellerDetails.addEventListener("click", (e) => {
    const rect = modalSellerDetails.getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    ) {
      modalSellerDetails.close();
    }
  });

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
    if (confirm("Are you sure you want to clear all tracked products and history?")) {
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
        title: "Anker Soundcore Life P2 Mini True Wireless Earbuds with Big Bass",
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
          "IPX5 Water-Resistant Protection"
        ],
        description: "Anker Soundcore Life P2 Mini earbuds feature 10mm oversized drivers to fuel powerful sound with 50% more bass. Seamless pairing and up to 32 hours battery life.",
        images: [
          "https://m.media-amazon.com/images/I/61Nl-H4g0OL._AC_SL1500_.jpg",
          "https://m.media-amazon.com/images/I/61MfqeP6yML._AC_SL1500_.jpg"
        ],
        reviews_list: [
          { title: "Great value for money", rating: 5, author: { name: "Ahmed K." }, date: "October 10, 2026", is_verified_purchase: true, text: "Excellent bass and battery life lasts all week." },
          { title: "Comfortable fit", rating: 4, author: { name: "Mona S." }, date: "September 28, 2026", is_verified_purchase: true, text: "Very small and light, barely notice them in ears." }
        ],
        sentiment_aspects: [
          { name: "Sound Quality", sentiment: "positive" },
          { name: "Battery Life", sentiment: "positive" },
          { name: "Microphone", sentiment: "neutral" }
        ]
      },
      {
        asin: "B08KITCH02",
        code: "B08KITCH02",
        title: "Prestige Stainless Steel Kitchen Knife Set with Ergonomic Grip 6-Piece",
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
          "Dishwasher safe and rust-resistant finish"
        ],
        description: "Professional cooking knife collection crafted from high-grade steel for precision chopping, slicing, and dicing.",
        images: [
          "https://m.media-amazon.com/images/I/71YFv9g-8dL._AC_SL1500_.jpg"
        ],
        reviews_list: [
          { title: "Sharp and sturdy", rating: 5, author: { name: "Hassan T." }, date: "August 15, 2026", is_verified_purchase: true, text: "Very sharp out of the box, handles feel great." }
        ]
      }
    ];

    for (const prod of sampleProducts) {
      await StorageManager.saveProduct(prod);
      const now = new Date();
      await StorageManager.addPriceHistoryPoint(prod.asin, {
        price: prod.price * 1.15,
        bsr: prod.bsr * 1.5,
        rating: prod.rating,
        reviews_count: prod.reviews_count - 50,
        timestamp: new Date(now.getTime() - 14 * 24 * 3600 * 1000).toISOString()
      });
      await StorageManager.addPriceHistoryPoint(prod.asin, {
        price: prod.price * 1.05,
        bsr: prod.bsr * 1.2,
        rating: prod.rating,
        reviews_count: prod.reviews_count - 20,
        timestamp: new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString()
      });
      await StorageManager.addPriceHistoryPoint(prod.asin, {
        price: prod.price,
        bsr: prod.bsr,
        rating: prod.rating,
        reviews_count: prod.reviews_count,
        timestamp: now.toISOString()
      });
    }

    await initDashboard();
  });

  // ==========================================
  // Initial Boot
  // ==========================================
  async function initDashboard() {
    const settings = await StorageManager.getSettings();
    currentLang = settings.lang || "en";
    currentTheme = settings.theme || "dark";

    applyTheme(currentTheme);

    if (settings.sidebar_collapsed) {
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
  }

  // Live Sync with Extension Storage (e.g. settings or products changed from popup)
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === "local" && changes[STORAGE_KEYS.SETTINGS]) {
        const newSettings = changes[STORAGE_KEYS.SETTINGS].newValue;
        if (newSettings) {
          if (newSettings.theme && newSettings.theme !== currentTheme) {
            applyTheme(newSettings.theme);
          }
          if (newSettings.lang && newSettings.lang !== currentLang) {
            applyTranslations(newSettings.lang);
          }
          if (newSettings.sidebar_collapsed !== undefined) {
            const isCurrentlyCollapsed = appSidebar.classList.contains("collapsed");
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
