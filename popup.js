// Moraqeb Extension Popup Script
// Syncs with settings (theme & language), communicates with content script, and tracks to local storage

document.addEventListener('DOMContentLoaded', async () => {
  // Load settings (theme & language)
  const settings = await StorageManager.getSettings();
  let currentLang = settings.lang || 'en';
  let currentTheme = settings.theme || 'dark';

  const btnThemeDark = document.getElementById('btn-theme-dark');
  const btnThemeLight = document.getElementById('btn-theme-light');
  const btnLangEn = document.getElementById('btn-lang-en');
  const btnLangAr = document.getElementById('btn-lang-ar');

  const stateLoading = document.getElementById('state-loading');
  const stateEmpty = document.getElementById('state-empty');
  const stateProduct = document.getElementById('state-product');

  const prodImg = document.getElementById('prod-img');
  const prodTitle = document.getElementById('prod-title');
  const badgeAsin = document.getElementById('badge-asin');
  const badgeStock = document.getElementById('badge-stock');
  const badgeFba = document.getElementById('badge-fba');

  const metricPrice = document.getElementById('metric-price');
  const metricRating = document.getElementById('metric-rating');
  const metricReviews = document.getElementById('metric-reviews');
  const prodSeller = document.getElementById('prod-seller');

  const btnTrack = document.getElementById('btn-track-product');
  const trackBtnLabel = document.getElementById('track-btn-label');
  const btnOpenDash = document.getElementById('btn-open-dashboard');
  const btnOpenDashEmpty = document.getElementById('btn-open-dashboard-empty');
  const actionFeedback = document.getElementById('action-feedback');

  let activeProduct = null;

  function updateThemeUI(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      btnThemeDark.classList.add('active');
      btnThemeLight.classList.remove('active');
    } else {
      btnThemeLight.classList.add('active');
      btnThemeDark.classList.remove('active');
    }
  }

  function updateLangUI(lang) {
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

    if (lang === 'ar') {
      btnLangAr.classList.add('active');
      btnLangEn.classList.remove('active');
    } else {
      btnLangEn.classList.add('active');
      btnLangAr.classList.remove('active');
    }

    // Re-translate all elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const translation = t(key, lang);
      if (translation) {
        el.textContent = translation;
      }
    });

    // Update dynamic product badges if loaded
    if (activeProduct) {
      badgeStock.textContent = activeProduct.in_stock ? t('in_stock', lang) : t('out_of_stock', lang);
      StorageManager.getProduct(activeProduct.asin).then((existing) => {
        trackBtnLabel.textContent = existing ? t('update_in_moraqeb', lang) : t('track_in_moraqeb', lang);
      });
    }
  }

  // Initialize UI state
  updateThemeUI(currentTheme);
  updateLangUI(currentLang);

  // Settings click handlers
  btnThemeDark.addEventListener('click', async () => {
    if (currentTheme === 'dark') return;
    currentTheme = 'dark';
    updateThemeUI(currentTheme);
    await StorageManager.saveSettings({ theme: currentTheme });
  });

  btnThemeLight.addEventListener('click', async () => {
    if (currentTheme === 'light') return;
    currentTheme = 'light';
    updateThemeUI(currentTheme);
    await StorageManager.saveSettings({ theme: currentTheme });
  });

  btnLangEn.addEventListener('click', async () => {
    if (currentLang === 'en') return;
    currentLang = 'en';
    updateLangUI(currentLang);
    await StorageManager.saveSettings({ lang: currentLang });
  });

  btnLangAr.addEventListener('click', async () => {
    if (currentLang === 'ar') return;
    currentLang = 'ar';
    updateLangUI(currentLang);
    await StorageManager.saveSettings({ lang: currentLang });
  });

  // Listen for live storage changes (e.g. from dashboard)
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes[STORAGE_KEYS.SETTINGS]) {
        const newSettings = changes[STORAGE_KEYS.SETTINGS].newValue;
        if (newSettings) {
          if (newSettings.theme && newSettings.theme !== currentTheme) {
            currentTheme = newSettings.theme;
            updateThemeUI(currentTheme);
          }
          if (newSettings.lang && newSettings.lang !== currentLang) {
            currentLang = newSettings.lang;
            updateLangUI(currentLang);
          }
        }
      }
    });
  }

  function showView(view) {
    stateLoading.classList.add('hidden');
    stateEmpty.classList.add('hidden');
    stateProduct.classList.add('hidden');
    view.classList.remove('hidden');
  }

  function showFeedback(msg, type = 'success') {
    actionFeedback.textContent = msg;
    actionFeedback.className = `feedback-msg ${type}`;
    actionFeedback.classList.remove('hidden');
    setTimeout(() => {
      actionFeedback.classList.add('hidden');
    }, 3500);
  }

  function openDashboard(asin = '') {
    const targetUrl = chrome.runtime.getURL(`dashboard.html${asin ? `?asin=${encodeURIComponent(asin)}` : ''}`);
    chrome.tabs.create({ url: targetUrl });
  }

  btnOpenDash.addEventListener('click', () => {
    openDashboard(activeProduct ? activeProduct.asin : '');
  });

  btnOpenDashEmpty.addEventListener('click', () => {
    openDashboard();
  });

  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!activeTab || !activeTab.url || !activeTab.url.includes('amazon.')) {
      showView(stateEmpty);
      return;
    }

    // Request product snapshot from active tab content script
    chrome.tabs.sendMessage(activeTab.id, { action: 'GET_PRODUCT_DETAILS' }, async (response) => {
      if (chrome.runtime.lastError || !response || !response.success || !response.data) {
        showView(stateEmpty);
        return;
      }

      const p = response.data;
      activeProduct = p;

      // Check if already in storage
      const existing = await StorageManager.getProduct(p.asin);

      // Populate UI
      prodTitle.textContent = p.title || 'Amazon Product';
      badgeAsin.textContent = `ASIN: ${p.asin}`;

      if (p.image) {
        prodImg.src = p.image;
      } else if (p.images && p.images.length > 0) {
        prodImg.src = p.images[0];
      } else {
        prodImg.src = 'icons/icon48.png';
      }

      badgeStock.textContent = p.in_stock ? t('in_stock', currentLang) : t('out_of_stock', currentLang);
      badgeStock.className = `pill ${p.in_stock ? 'pill-stock' : 'pill-asin'}`;

      if (p.is_fba) {
        badgeFba.classList.remove('hidden');
      } else {
        badgeFba.classList.add('hidden');
      }

      metricPrice.textContent = p.price_formatted || (p.price ? `${p.price} EGP` : '—');
      metricRating.textContent = p.rating ? `${p.rating} / 5` : '—';
      metricReviews.textContent = p.reviews_count ? Number(p.reviews_count).toLocaleString() : '—';
      prodSeller.textContent = p.seller || 'Amazon';

      if (existing) {
        trackBtnLabel.textContent = t('update_in_moraqeb', currentLang);
      } else {
        trackBtnLabel.textContent = t('track_in_moraqeb', currentLang);
      }

      showView(stateProduct);

      // Track button event
      btnTrack.onclick = async () => {
        btnTrack.disabled = true;
        trackBtnLabel.textContent = currentLang === 'ar' ? 'جاري الحفظ...' : 'Saving...';

        try {
          await StorageManager.saveProduct(p);
          StorageManager.syncTrackedProductsToWorker().catch(() => {});
          showFeedback(`${t('scrape_success', currentLang)}: ${p.asin}`);
          trackBtnLabel.textContent = t('update_in_moraqeb', currentLang);
        } catch (err) {
          console.error('Error saving product:', err);
          showFeedback(t('scrape_error', currentLang), 'error');
          trackBtnLabel.textContent = t('track_in_moraqeb', currentLang);
        } finally {
          btnTrack.disabled = false;
        }
      };
    });
  } catch (err) {
    console.error('Moraqeb Extension Error:', err);
    showView(stateEmpty);
  }
});
