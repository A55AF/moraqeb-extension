// Moraqeb Background Service Worker
// Automatically consumes Cloudflare D1 buffer every 4 hours
// and refreshes product metadata every 24 hours (for items older than 3 days)

importScripts("storage.js");

const ALARM_D1_SYNC = "moraqeb-d1-sync";
const SYNC_INTERVAL_MINUTES = 240; // 4 hours

const ALARM_METADATA_REFRESH = "moraqeb-metadata-refresh";
const REFRESH_INTERVAL_MINUTES = 1440; // 24 hours

chrome.runtime.onInstalled.addListener(() => {
  // 1. D1 buffer sync alarm
  chrome.alarms.get(ALARM_D1_SYNC, (existing) => {
    if (!existing) {
      chrome.alarms.create(ALARM_D1_SYNC, {
        delayInMinutes: 1,
        periodInMinutes: SYNC_INTERVAL_MINUTES
      });
      console.log(`[Moraqeb Alarm] Scheduled ${ALARM_D1_SYNC} every ${SYNC_INTERVAL_MINUTES} minutes.`);
    }
  });

  // 2. Metadata refresh alarm (runs every 24 hours, updates items stale > 3 days)
  chrome.alarms.get(ALARM_METADATA_REFRESH, (existing) => {
    if (!existing) {
      chrome.alarms.create(ALARM_METADATA_REFRESH, {
        delayInMinutes: 5,
        periodInMinutes: REFRESH_INTERVAL_MINUTES
      });
      console.log(`[Moraqeb Alarm] Scheduled ${ALARM_METADATA_REFRESH} every ${REFRESH_INTERVAL_MINUTES} minutes.`);
    }
  });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_D1_SYNC) {
    try {
      const items = await StorageManager.fetchAndApplyBufferUpdates();
      if (items && items.length > 0) {
        console.log(`[Moraqeb Alarm] Synced ${items.length} price updates from Cloudflare D1 buffer.`);
      }
    } catch (err) {
      console.warn("[Moraqeb Alarm] Buffer sync failed:", err);
    }
  } else if (alarm.name === ALARM_METADATA_REFRESH) {
    try {
      const refreshed = await StorageManager.refreshStaleMetadata(3);
      if (refreshed && refreshed.length > 0) {
        console.log(`[Moraqeb Alarm] Refreshed metadata for ${refreshed.length} stale products directly from Amazon.`);
      }
    } catch (err) {
      console.warn("[Moraqeb Alarm] Metadata refresh failed:", err);
    }
  }
});
