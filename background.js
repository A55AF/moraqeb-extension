// Moraqeb Background Service Worker
// Coordinates hybrid tracking:
// - Cloudflare mode: consumes D1 staging buffer (4h) & refreshes metadata (24h)
// - Local mode: executes micro-batch price tracking (1h) with random jitter delay

importScripts("storage.js", "cloudflare-setup.js");

const ALARM_LOCAL_PRICE_TRACK = "moraqeb-local-track";
const LOCAL_TRACK_INTERVAL_MINUTES = 60;

const ALARM_D1_SYNC = "moraqeb-d1-sync";
const SYNC_INTERVAL_MINUTES = 240;

const ALARM_METADATA_REFRESH = "moraqeb-metadata-refresh";
const REFRESH_INTERVAL_MINUTES = 1440;

function ensureAlarm(name, periodInMinutes, delayInMinutes = 1) {
  chrome.alarms.get(name, (existing) => {
    if (!existing || existing.periodInMinutes !== periodInMinutes) {
      chrome.alarms.create(name, { delayInMinutes, periodInMinutes });
    }
  });
}

chrome.runtime.onInstalled.addListener(() => {
  ensureAlarm(ALARM_LOCAL_PRICE_TRACK, LOCAL_TRACK_INTERVAL_MINUTES, 1);
  ensureAlarm(ALARM_D1_SYNC, SYNC_INTERVAL_MINUTES, 1);
  ensureAlarm(ALARM_METADATA_REFRESH, REFRESH_INTERVAL_MINUTES, 5);
  CloudflareSetup.checkAndApplySilentUpdate().catch(() => {});
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  const settings = await StorageManager.getSettings();
  const hasCloudflare = Boolean(settings.worker_url && settings.worker_url.trim());

  if (alarm.name === ALARM_LOCAL_PRICE_TRACK) {
    if (hasCloudflare) return;
    try {
      const updated = await StorageManager.updateTrackedProductsLocally({ batchSize: 5 });
      if (updated?.length) {
        console.log(`[Moraqeb Alarm] Updated ${updated.length} product prices locally.`);
      }
    } catch (err) {
      console.warn("[Moraqeb Alarm] Local price track error:", err);
    }
  } else if (alarm.name === ALARM_D1_SYNC) {
    if (!hasCloudflare) return;
    try {
      const items = await StorageManager.fetchAndApplyBufferUpdates();
      if (items?.length) {
        console.log(`[Moraqeb Alarm] Synced ${items.length} price updates from Cloudflare D1 buffer.`);
      }
      CloudflareSetup.checkAndApplySilentUpdate().catch(() => {});
    } catch (err) {
      console.warn("[Moraqeb Alarm] Buffer sync failed:", err);
    }
  } else if (alarm.name === ALARM_METADATA_REFRESH) {
    if (!hasCloudflare) return;
    try {
      const refreshed = await StorageManager.refreshStaleMetadata(3);
      if (refreshed?.length) {
        console.log(`[Moraqeb Alarm] Refreshed metadata for ${refreshed.length} stale products.`);
      }
    } catch (err) {
      console.warn("[Moraqeb Alarm] Metadata refresh failed:", err);
    }
  }
});
