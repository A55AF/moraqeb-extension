// Moraqeb Extension Popup Script
// Syncs with settings (theme & language), communicates with content script, and tracks to local storage

document.addEventListener('DOMContentLoaded', async () => {
  // Load settings (theme & language)
  const settings = await StorageManager.getSettings();
  const lang = settings.lang || 'en';
  const theme = settings.theme || 'dark';

  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.setAttribute('lang', lang);
  document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

  // Translate static labels
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const translation = t(key, lang);
    if (translation) {
      el.textContent = translation;
    }
  });

  const stateLoading = document.getElementById('state-loading');
  const stateEmpty = document.getElementById('state-empty');
  const stateProduct = document.getElementById('state-product');
  const statusBadge = document.getElementById('status-badge');

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

      badgeStock.textContent = p.in_stock ? t('in_stock', lang) : t('out_of_stock', lang);
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

      statusBadge.textContent = existing ? t('status_tracked', lang) : t('status_active', lang);
      statusBadge.classList.add('active');

      if (existing) {
        trackBtnLabel.textContent = t('update_in_moraqeb', lang);
      } else {
        trackBtnLabel.textContent = t('track_in_moraqeb', lang);
      }

      showView(stateProduct);

      // Track button event
      btnTrack.onclick = async () => {
        btnTrack.disabled = true;
        trackBtnLabel.textContent = lang === 'ar' ? 'جاري الحفظ...' : 'Saving...';

        try {
          await StorageManager.saveProduct(p);
          statusBadge.textContent = t('status_tracked', lang);
          showFeedback(`${t('scrape_success', lang)}: ${p.asin}`);
          trackBtnLabel.textContent = t('update_in_moraqeb', lang);
        } catch (err) {
          console.error('Error saving product:', err);
          showFeedback(t('scrape_error', lang), 'error');
          trackBtnLabel.textContent = t('track_in_moraqeb', lang);
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
