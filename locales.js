// Moraqeb Extension Localization Dictionary (English & Arabic)
// Ported from moraqeb/src/locales.py

const TRANSLATIONS = {
  // App & Navigation
  app_title: { en: "Amazon Product Tracker", ar: "متتبع منتجات أمازون" },
  sidebar_title: { en: "Products", ar: "المنتجات" },
  add_product_label: { en: "Add New Product", ar: "إضافة منتج جديد" },
  add_product_placeholder: { en: "Enter product url or ASIN", ar: "أدخل رابط المنتج أو ASIN" },
  add_product_btn: { en: "Add Product", ar: "إضافة المنتج" },
  scraping_spinner: { en: "Extracting product data...", ar: "جاري سحب بيانات المنتج..." },
  scrape_error: { en: "Failed to retrieve product details.", ar: "تعذر جلب تفاصيل المنتج." },
  scrape_success: { en: "Added product", ar: "تمت إضافة المنتج بنجاح" },
  pick_product: { en: "Pick a Product", ar: "اختر منتجاً" },
  view_mode: { en: "View Mode", ar: "طريقة العرض" },
  mode_single: { en: "Single Product", ar: "منتج واحد" },
  mode_compare: { en: "Compare All Products", ar: "مقارنة جميع المنتجات" },
  mode_hunter: { en: "Product Hunter", ar: "صائد المنتجات" },
  no_products: { en: "No products tracked yet. Track an Amazon listing using the extension popup or enter an ASIN above.", ar: "لا توجد منتجات مسجلة حتى الآن. تتبع منتجاً من نافذة الإضافة أو أدخل رمز ASIN أعلاه." },
  delete_product: { en: "Delete", ar: "حذف" },
  confirm_delete: { en: "Are you sure you want to delete this product?", ar: "هل أنت متأكد من رغبتك في حذف هذا المنتج؟" },
  refresh_data: { en: "Refresh Data", ar: "تحديث البيانات" },
  export_data: { en: "Export Data", ar: "تصدير البيانات" },
  import_data: { en: "Import Data", ar: "استيراد البيانات" },
  clear_all: { en: "Clear All", ar: "مسح الكل" },
  theme_label: { en: "Theme / المظهر", ar: "المظهر / Theme" },
  theme_dark: { en: "Dark", ar: "داكن" },
  theme_light: { en: "Light", ar: "فاتح" },
  collapse_sidebar: { en: "Collapse", ar: "طي" },
  expand_sidebar: { en: "Expand", ar: "توسيع" },
  status_idle: { en: "Idle", ar: "في الانتظار" },
  status_active: { en: "Active", ar: "نشط" },
  status_tracked: { en: "Tracked", ar: "تم التتبع" },
  no_product_detected: { en: "No Amazon Product Detected", ar: "لم يتم اكتشاف منتج أمازون" },
  no_product_desc: { en: "Navigate to any Amazon product listing to track it with Moraqeb.", ar: "انتقل إلى صفحة أي منتج على أمازون لتتبعه بواسطة مراقب." },
  open_dashboard: { en: "Open Dashboard", ar: "فتح لوحة التحكم" },
  track_in_moraqeb: { en: "Track in Moraqeb", ar: "تتبع في مراقب" },
  update_in_moraqeb: { en: "Update in Moraqeb", ar: "تحديث في مراقب" },
  scanning_listing: { en: "Scanning Amazon listing...", ar: "جاري فحص إعلان أمازون..." },

  // Badges & Status
  best_seller: { en: "Best Seller", ar: "الأفضل مبيعاً" },
  amazon_choice: { en: "Amazon's Choice", ar: "اختيار أمازون" },
  in_stock: { en: "In Stock", ar: "متوفر في المخزون" },
  out_of_stock: { en: "Out of Stock", ar: "غير متوفر" },
  fba_fulfilled: { en: "FBA Fulfilled", ar: "مشحون بواسطة أمازون (FBA)" },
  view_on_amazon: { en: "View on Amazon ↗", ar: "عرض على أمازون ↗" },

  // Sections
  images_section: { en: "Images", ar: "صور المنتج" },
  overview_section: { en: "Product Overview & Intelligence", ar: "نظرة عامة والتحليلات" },
  history_section: { en: "Price & BSR History", ar: "سجل تغييرات السعر وتصنيف BSR" },
  calculator_section: { en: "FBA Profit & Margin Calculator", ar: "حاسبة أرباح وهوامش FBA" },
  comparison_title: { en: "Product Comparison Matrix", ar: "جدول مقارنة المنتجات" },

  // Metrics
  current_price: { en: "Current Price", ar: "السعر الحالي" },
  rating: { en: "Rating", ar: "التقييم" },
  reviews: { en: "Reviews", ar: "المراجعات" },
  bsr: { en: "BSR", ar: "تصنيف BSR" },
  est_sales: { en: "Est. Monthly Sales", ar: "مبيعات شهرية تقديرية" },
  opp_score: { en: "Opportunity Score", ar: "نقاط الفرصة" },
  listing_quality: { en: "Listing Quality Index", ar: "مؤشر جودة الـ Listing" },
  risk_radar: { en: "Risk Radar (Lower is better)", ar: "مؤشر المخاطر (الأقل أفضل)" },

  // Details
  asin: { en: "ASIN / Code", ar: "رمز ASIN" },
  parent_asin: { en: "Parent ASIN", ar: "ASIN الرئيسي" },
  brand: { en: "Brand", ar: "العلامة التجارية" },
  dimensions: { en: "Dimensions", ar: "الأبعاد" },
  stock_left: { en: "Stock Left", ar: "الكمية المتبقية" },
  category: { en: "Category", ar: "الفئة" },
  variants_count: { en: "Variants Count", ar: "عدد المتغيرات" },
  bought_past_month: { en: "Bought Past Month", ar: "تم شراؤه الشهر الماضي" },
  primary_seller: { en: "Primary Seller", ar: "البائع الرئيسي" },
  view_seller_btn: { en: "View Seller Details", ar: "عرض تفاصيل البائع" },
  seller_dialog_title: { en: "Seller Details", ar: "تفاصيل البائع" },
  total_ratings: { en: "Total Ratings", ar: "إجمالي التقييمات" },
  positive_pct: { en: "Positive", ar: "نسبة الإيجابية" },
  about_seller: { en: "About Seller", ar: "عن البائع" },
  view_seller_amz: { en: "View Seller on Amazon ↗", ar: "عرض صفحة البائع على أمازون ↗" },
  seller_not_scraped: { en: "Detailed seller profile has not been scraped into the database yet.", ar: "لم يتم سحب تفاصيل البائع الموسعة إلى قاعدة البيانات بعد." },

  // Tabs
  tab_features: { en: "Key Features", ar: "المميزات الرئيسية" },
  tab_description: { en: "Description", ar: "الوصف" },
  tab_keywords: { en: "Keywords & SEO", ar: "الكلمات المفتاحية" },
  core_keywords: { en: "Core Keywords extracted from Listing:", ar: "الكلمات المفتاحية المستخرجة من الإعلان:" },
  no_bullets: { en: "No feature bullets recorded.", ar: "لا توجد نقاط مميزات مسجلة." },
  no_description: { en: "No description recorded.", ar: "لا يوجد وصف مسجل." },
  no_keywords: { en: "Not enough text to extract keywords.", ar: "لا يوجد نص كافٍ لاستخراج الكلمات المفتاحية." },

  // Calculator
  calc_config: { en: "Configure Unit Economics & Sourcing Cost", ar: "إعدادات تكلفة الوحدة واقتصاديات المنتج" },
  selling_price: { en: "Selling Price (EGP)", ar: "سعر البيع (ج.م)" },
  unit_cost: { en: "Unit Sourcing / Purchase Cost (EGP)", ar: "تكلفة الشراء / التوريد للوحدة (ج.م)" },
  referral_pct: { en: "Amazon Referral Fee %", ar: "نسبة عمولة أمازون %" },
  fba_fee: { en: "FBA Fulfillment Fee (EGP)", ar: "رسوم شحن FBA (ج.م)" },
  fba_tier: { en: "Estimated FBA Tier", ar: "تصنيف حجم FBA التقديري" },
  stock_batch: { en: "Stock Batch Quantity", ar: "كمية دفعة المخزون" },
  working_capital: { en: "Working Capital Needed", ar: "رأس المال المطلوب" },
  net_profit: { en: "Net Profit / Unit", ar: "صافي الربح / وحدة" },
  profit_margin: { en: "Profit Margin", ar: "هامش الربح" },
  roi: { en: "ROI", ar: "العائد على الاستثمار" },
  batch_profit: { en: "Batch Profit", ar: "أرباح كامل الدفعة" },
  fee_breakdown_expander: { en: "View Fee Breakdown & Break-Even Targets", ar: "عرض تفاصيل الرسوم وحدود نقطة التعادل" },
  fee_referral: { en: "Amazon Referral Fee", ar: "عمولة أمازون" },
  fee_fba: { en: "FBA Fulfillment Fee", ar: "رسوم شحن FBA" },
  fee_ads: { en: "Estimated Ad Spend (8%)", ar: "مخصص إعلانات تقديري (8%)" },
  fee_returns: { en: "Estimated Return Provision (3%)", ar: "مخصص مرتجعات (3%)" },
  fee_vat: { en: "14% VAT on Amazon Fees", ar: "ضريبة القيمة المضافة 14% على رسوم أمازون" },
  max_sourcing_cost: { en: "Max Sourcing Cost to Break Even", ar: "أقصى تكلفة شراء للوصول لنقطة التعادل" },
  breakeven_ads_limit: { en: "Break-Even Ad Spend Limit", ar: "الحد الأقصى للإنفاق الإعلاني قبل الخسارة" },

  // Charts
  chart_price_title: { en: "Price Changes Over Time", ar: "تغير السعر عبر الزمن" },
  chart_bsr_title: { en: "Best Sellers Rank (BSR) Over Time", ar: "تصنيف BSR عبر الزمن" },
  chart_datetime: { en: "Date & Time", ar: "التاريخ والوقت" },
  chart_price_axis: { en: "Price (EGP)", ar: "السعر (ج.م)" },
  chart_rank_axis: { en: "Rank #", ar: "الترتيب #" },
  no_price_history: { en: "No price history recorded yet for this product.", ar: "لا يوجد سجل أسعار مسجل لهذا المنتج حتى الآن." },
  no_bsr_history: { en: "No BSR history recorded for this product.", ar: "لا يوجد سجل BSR مسجل لهذا المنتج." },

  // Review Signals & Sentiment
  tab_reviews: { en: "Customer Reviews & Signals", ar: "مراجعات العملاء والمشاعر" },
  ai_customer_sentiment: { en: "AI Customer Sentiment Summary", ar: "ملخص مشاعر العملاء بواسطة الذكاء الاصطناعي" },
  sentiment_aspects: { en: "Key Sentiment Themes & Aspects", ar: "الموضوعات والمشاعر الرئيسية" },
  top_reviews: { en: "Top Customer Reviews", ar: "أبرز مراجعات العملاء" },
  fetch_reviews_btn: { en: "Analyze Reviews & Sentiment", ar: "تحليل المراجعات والمشاعر" },
  fetching_reviews: { en: "Fetching and analyzing customer reviews...", ar: "جاري جلب وتحليل مراجعات العملاء..." },
  no_reviews_found: { en: "No customer reviews found for this product.", ar: "لم يتم العثور على مراجعات لهذا المنتج." },
  verified_purchase: { en: "Verified Purchase", ar: "شراء مؤكد" },
  helpful_votes: { en: "helpful votes", ar: "أصوات مفيدة" },
  reviews_load_failed: { en: "Failed to fetch reviews from Amazon.", ar: "تعذر جلب المراجعات من أمازون." },
  sentiment_positive: { en: "Positive", ar: "إيجابي" },
  sentiment_negative: { en: "Negative", ar: "سلبي" },
  sentiment_neutral: { en: "Neutral", ar: "محايد" },
  language_label: { en: "Language / اللغة", ar: "اللغة / Language" },

  // Competitor Analysis
  tab_competitors: { en: "Competitor Analysis", ar: "تحليل المنافسين" },
  run_comp_analysis: { en: "Analyze Live Competitors", ar: "تحليل المنافسين مباشرة" },
  analyzing_comp: { en: "Scanning Amazon search results for competitors...", ar: "جاري البحث في نتائج أمازون عن المنافسين..."},
  comp_summary_title: { en: "Competitive Landscape Summary", ar: "ملخص المشهد التنافسي" },
  direct_competitors: { en: "Direct Competitors Found", ar: "المنافسون المباشرون" },
  avg_comp_rating: { en: "Avg Competitor Rating", ar: "متوسط تقييم المنافسين" },
  low_review_share: { en: "Low Review Moat (<500)", ar: "منافسون بحاجز مراجعات منخفض (<500)" },
  median_price: { en: "Median Competitor Price", ar: "متوسط سعر المنافسين" },
  price_spectrum: { en: "Price Spectrum", ar: "نطاق الأسعار" },
  opportunity_verdict: { en: "Opportunity Verdict", ar: "تقييم الفرصة التنافسية" },
  opportunity_easy: { en: "High Opportunity: Market has many weak review competitors with room to enter.", ar: "فرصة عالية: السوق يحتوي على العديد من المنافسين بمراجعات قليلة وهناك فرصة للدخول." },
  opportunity_moderate: { en: "Moderate Opportunity: Established competitors present, but viable with good pricing and reviews.", ar: "فرصة متوسطة: يوجد منافسون مستقرون، لكن الدخول ممكن بتسعير ومراجعات جيدة." },
  opportunity_hard: { en: "High Barrier: Market is saturated with heavily reviewed, high-rating listings.", ar: "حاجز دخول مرتفع: السوق مشبع بمنافسين ذوي تقييمات ومراجعات ضخمة." },
  comp_table_title: { en: "Competitor Listings", ar: "قائمة المنافسين" },
  comp_search_query: { en: "Search Query Used", ar: "كلمة البحث المستخدمة" },
  no_competitors_found: { en: "No direct competitors found in search results.", ar: "لم يتم العثور على منافسين مباشرين في نتائج البحث." },
  comp_error: { en: "Failed to retrieve competitor search results.", ar: "تعذر جلب نتائج بحث المنافسين." },

  // AI Product Hunter
  hunter_title: { en: "AI Product Hunter", ar: "صائد المنتجات الذكي" },
  hunter_subtitle: { en: "Discover high-opportunity product niches on Amazon Egypt", ar: "اكتشاف فرص المنتجات الواعدة داخل أمازون مصر" },
  hunter_query_label: { en: "Niche Keyword / Category", ar: "الكلمة المفتاحية أو الفئة" },
  hunter_query_placeholder: { en: "e.g. kitchen storage, wireless earbuds", ar: "مثال: أدوات المطبخ، سماعات لاسلكية" },
  hunter_scan_btn: { en: "Find Top Opportunities", ar: "اعثر على أفضل الفرص" },
  hunter_scanning: { en: "Scanning Amazon Egypt and analyzing opportunities...", ar: "جاري فحص أمازون مصر وتحليل الفرص..." },
  hunter_max_price: { en: "Max Price (EGP)", ar: "أقصى سعر (ج.م)" },
  hunter_min_score: { en: "Min Opportunity Score", ar: "الحد الأدنى لنقاط الفرصة" },
  hunter_results_count: { en: "Found {count} candidate products matching your criteria", ar: "تم العثور على {count} منتجاً يطابق معاييرك" },
  hunter_no_results: { en: "No products matched the filter criteria. Try adjusting the price ceiling or keywords.", ar: "لم يتم العثور على منتجات تطابق المعايير. حاول تعديل السعر أو كلمات البحث." },
  track_product_btn: { en: "Track Product", ar: "إضافة للمتابعة" },
  product_tracked: { en: "Already Tracked", ar: "تمت إضافته مسبقاً" },
  hunter_disclaimer: { en: "Scores are estimated based on public catalog signals (ratings, review velocity, and pricing).", ar: "النقاط تقديرية مبنية على مؤشرات الكتالوج المتاحة (التقييمات، عدد المراجعات، ومستويات الأسعار)." }
};

function t(key, lang = "en") {
  const entry = TRANSLATIONS[key];
  if (!entry) return key;
  return entry[lang] || entry["en"] || key;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { TRANSLATIONS, t };
}
