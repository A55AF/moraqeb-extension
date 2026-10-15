// Moraqeb Extension Popup Script
// Communicates with content script and handles 1-click sync to local Moraqeb dashboard

const MORAQEB_BASE_URL = 'http://localhost:8501';

document.addEventListener('DOMContentLoaded', async () => {
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
  const btnOpenDash = document.getElementById('btn-open-dashboard');
  const btnOpenDashEmpty = document.getElementById('btn-open-dashboard-empty');
  const actionFeedback = document.getElementById('action-feedback');

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
    }, 4000);
  }

  function openDashboard(queryParam = '') {
    const url = queryParam ? `${MORAQEB_BASE_URL}/${queryParam}` : MORAQEB_BASE_URL;
    chrome.tabs.create({ url });
  }

  btnOpenDash.addEventListener('click', () => openDashboard());
  btnOpenDashEmpty.addEventListener('click', () => openDashboard());

  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!activeTab || !activeTab.url || !activeTab.url.includes('amazon.')) {
      showView(stateEmpty);
      return;
    }

    // Request product snapshot from active tab content script
    chrome.tabs.sendMessage(activeTab.id, { action: 'GET_PRODUCT_DETAILS' }, (response) => {
      if (chrome.runtime.lastError || !response || !response.success || !response.data) {
        showView(stateEmpty);
        return;
      }

      const p = response.data;

      // Populate UI
      prodTitle.textContent = p.title || 'Amazon Product';
      badgeAsin.textContent = `ASIN: ${p.asin}`;

      if (p.image) {
        prodImg.src = p.image;
      } else {
        prodImg.src = 'icons/icon48.png';
      }

      badgeStock.textContent = p.in_stock ? 'In Stock' : 'Out of Stock';
      badgeStock.className = `pill ${p.in_stock ? 'pill-stock' : 'pill-asin'}`;

      if (p.is_fba) {
        badgeFba.classList.remove('hidden');
      } else {
        badgeFba.classList.add('hidden');
      }

      metricPrice.textContent = p.price_formatted || (p.price ? `${p.price}` : '—');
      metricRating.textContent = p.rating ? `${p.rating} / 5` : '—';
      metricReviews.textContent = p.reviews_count ? Number(p.reviews_count).toLocaleString() : '—';
      prodSeller.textContent = p.seller || 'Amazon';

      statusBadge.textContent = 'Active';
      statusBadge.classList.add('active');

      showView(stateProduct);

      // Track button event
      btnTrack.onclick = () => {
        btnTrack.disabled = true;
        btnTrack.textContent = 'Tracking...';

        // 1-Click Sync: open or send to Moraqeb with query param
        openDashboard(`?add_asin=${encodeURIComponent(p.asin)}`);
        showFeedback(`Sent ASIN ${p.asin} to Moraqeb Dashboard`);

        setTimeout(() => {
          btnTrack.disabled = false;
          btnTrack.textContent = 'Track in Moraqeb';
        }, 1500);
      };
    });
  } catch (err) {
    console.error('Moraqeb Extension Error:', err);
    showView(stateEmpty);
  }
});
