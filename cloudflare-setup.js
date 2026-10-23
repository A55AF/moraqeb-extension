// Moraqeb Automated Cloudflare Setup & Silent Updater Engine
// Handles Cloudflare REST API v4 provisioning, script deployments, and GitHub update synchronization

const CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4";
const GITHUB_REPO_API = "https://api.github.com/repos/A55AF/amazon-scraper-cloudflare";
const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/A55AF/amazon-scraper-cloudflare/main";
const GITHUB_WORKER_SCRIPT_URL = `${GITHUB_RAW_BASE}/out/index.js`;
const DEFAULT_WORKER_NAME = "moraqeb-scraper";

function generateMoraqebKey() {
  const cryptoObj =
    typeof crypto !== "undefined" && crypto.getRandomValues
      ? crypto
      : typeof require !== "undefined"
        ? require("crypto").webcrypto
        : null;

  if (cryptoObj && cryptoObj.getRandomValues) {
    const bytes = new Uint8Array(8);
    cryptoObj.getRandomValues(bytes);
    return (
      "moraqeb-" +
      Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
    );
  }
  throw new Error("Cryptographic random generator unavailable.");
}

const CloudflareSetup = {
  async verifyToken(apiToken) {
    try {
      const res = await fetch(`${CLOUDFLARE_API_BASE}/user/tokens/verify`, {
        headers: { Authorization: `Bearer ${apiToken}` }
      });
      const data = await res.json();
      return { success: Boolean(data.success), data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async getAccountId(apiToken) {
    const res = await fetch(`${CLOUDFLARE_API_BASE}/accounts`, {
      headers: { Authorization: `Bearer ${apiToken}` }
    });
    const data = await res.json();
    if (!data.success || !data.result || !data.result.length) {
      throw new Error((data.errors && data.errors[0]?.message) || "No Cloudflare accounts found for this token");
    }
    return data.result[0].id;
  },

  async getOrCreateD1Database(apiToken, accountId, dbName = "moraqeb-d1") {
    // 1. Check existing databases
    const listRes = await fetch(`${CLOUDFLARE_API_BASE}/accounts/${accountId}/d1/database`, {
      headers: { Authorization: `Bearer ${apiToken}` }
    });
    const listData = await listRes.json();
    if (listData.success && Array.isArray(listData.result)) {
      const existing = listData.result.find(
        (db) => db.name && db.name.toLowerCase() === dbName.toLowerCase()
      );
      if (existing && existing.uuid) {
        return existing.uuid;
      }
    }

    // 2. Create new database if absent
    const createRes = await fetch(`${CLOUDFLARE_API_BASE}/accounts/${accountId}/d1/database`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name: dbName })
    });
    const createData = await createRes.json();
    if (!createData.success || !createData.result?.uuid) {
      throw new Error((createData.errors && createData.errors[0]?.message) || "Failed to create D1 database");
    }
    return createData.result.uuid;
  },

  async executeD1Query(apiToken, accountId, databaseId, sql) {
    const res = await fetch(`${CLOUDFLARE_API_BASE}/accounts/${accountId}/d1/database/${databaseId}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ sql })
    });
    return res.json();
  },

  async applyD1Schema(apiToken, accountId, databaseId, customSql = null) {
    let sql = customSql;
    if (!sql) {
      try {
        const schemaUrl = chrome.runtime.getURL("schema.sql");
        const res = await fetch(schemaUrl);
        if (res.ok) sql = await res.text();
      } catch (_) {}
    }

    if (!sql) {
      sql = `
        CREATE TABLE IF NOT EXISTS tracked_products (
          asin TEXT NOT NULL,
          country TEXT NOT NULL DEFAULT 'EG',
          title TEXT,
          added_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
          updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
          last_scraped_at TEXT,
          PRIMARY KEY (asin, country)
        );
        CREATE TABLE IF NOT EXISTS scraper_buffer (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          asin TEXT NOT NULL,
          country TEXT NOT NULL DEFAULT 'EG',
          parent_code TEXT,
          title TEXT,
          brand TEXT,
          link TEXT,
          price REAL,
          price_formatted TEXT,
          currency TEXT,
          rating REAL,
          reviews_count INTEGER,
          seller_name TEXT,
          seller_id TEXT,
          seller_link TEXT,
          is_fba INTEGER DEFAULT 0,
          in_stock INTEGER DEFAULT 1,
          image TEXT,
          image_count INTEGER,
          bsr INTEGER,
          bsr_category TEXT,
          is_best_seller INTEGER DEFAULT 0,
          is_amazon_choice INTEGER DEFAULT 0,
          bought_past_month INTEGER,
          scraped_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
        );
        CREATE INDEX IF NOT EXISTS idx_buffer_asin ON scraper_buffer(asin, country);
        CREATE TABLE IF NOT EXISTS moraqeb_config (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
      `;
    }

    const queryData = await this.executeD1Query(apiToken, accountId, databaseId, sql);
    if (!queryData.success) {
      console.warn("D1 schema execution note:", queryData.errors);
    }
    return true;
  },

  async fetchWorkerScript() {
    try {
      const res = await fetch(GITHUB_WORKER_SCRIPT_URL);
      if (!res.ok) {
        throw new Error(`GitHub returned HTTP ${res.status} (${res.statusText})`);
      }
      const code = await res.text();
      if (!code || code.length < 1000 || code.startsWith("<!DOCTYPE") || code.startsWith("404")) {
        throw new Error("Received invalid worker script payload from GitHub");
      }
      return code;
    } catch (err) {
      console.warn("[Moraqeb Setup] fetchWorkerScript failed:", err.message);
      throw err;
    }
  },

  async deployWorkerScript(apiToken, accountId, scriptName, bundleCode, databaseId, apiKey) {
    let code = bundleCode;
    if (!code) {
      code = await StorageManager.getCachedWorkerScript();
    }

    if (!code) {
      code = await this.fetchWorkerScript();
      await StorageManager.setCachedWorkerScript(code);
    }

    if (!code) {
      throw new Error("Worker script could not be loaded from storage or GitHub");
    }

    const metadata = {
      main_module: "index.js",
      compatibility_date: "2024-09-23",
      compatibility_flags: ["nodejs_compat"],
      bindings: [
        {
          type: "d1",
          name: "DB",
          id: databaseId
        },
        {
          type: "secret_text",
          name: "MORAQEB_API_KEY",
          text: apiKey
        }
      ]
    };

    const formData = new FormData();
    formData.append(
      "metadata",
      new Blob([JSON.stringify(metadata)], { type: "application/json" }),
      "metadata"
    );
    formData.append(
      "index.js",
      new Blob([code], { type: "application/javascript+module" }),
      "index.js"
    );

    const uploadRes = await fetch(`${CLOUDFLARE_API_BASE}/accounts/${accountId}/workers/scripts/${scriptName}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${apiToken}`
      },
      body: formData
    });
    const uploadData = await uploadRes.json();
    if (!uploadData.success) {
      throw new Error((uploadData.errors && uploadData.errors[0]?.message) || "Failed to upload Worker script");
    }
    return true;
  },

  async enableWorkerSubdomain(apiToken, accountId, scriptName) {
    try {
      await fetch(`${CLOUDFLARE_API_BASE}/accounts/${accountId}/workers/scripts/${scriptName}/subdomain`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ enabled: true })
      });
    } catch (_) {}
  },

  async getOrCreateApiKey(apiToken, accountId, databaseId) {
    try {
      const data = await this.executeD1Query(
        apiToken,
        accountId,
        databaseId,
        "SELECT value FROM moraqeb_config WHERE key = 'api_secret_key' LIMIT 1;"
      );
      if (data.success && data.result?.[0]?.results?.[0]?.value) {
        return data.result[0].results[0].value;
      }
    } catch (_) {}

    const newKey = generateMoraqebKey();

    try {
      await this.executeD1Query(
        apiToken,
        accountId,
        databaseId,
        `INSERT OR REPLACE INTO moraqeb_config (key, value) VALUES ('api_secret_key', '${newKey}');`
      );
    } catch (_) {}

    return newKey;
  },

  async getOrCreateAccountSubdomain(apiToken, accountId) {
    // 1. Check existing subdomain
    try {
      const res = await fetch(`${CLOUDFLARE_API_BASE}/accounts/${accountId}/workers/subdomain`, {
        headers: { Authorization: `Bearer ${apiToken}` }
      });
      const data = await res.json();
      if (data.success && data.result?.subdomain) {
        return data.result.subdomain;
      }
    } catch (_) {}

    // 2. New account: auto-register subdomain using moraqeb-XXXXXXXX pattern
    for (let attempt = 0; attempt < 3; attempt++) {
      const candidate = generateMoraqebKey();
      try {
        const putRes = await fetch(`${CLOUDFLARE_API_BASE}/accounts/${accountId}/workers/subdomain`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${apiToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ subdomain: candidate })
        });
        const putData = await putRes.json();
        if (putData.success && putData.result?.subdomain) {
          return putData.result.subdomain;
        }
      } catch (_) {}
    }

    // 3. If Cloudflare requires manual confirmation, provide direct link
    throw new Error(
      `Could not register workers.dev subdomain automatically. Please visit https://dash.cloudflare.com/${accountId}/workers-and-pages to choose your subdomain, then click Start Auto-Setup again.`
    );
  },

  async setCronSchedule(apiToken, accountId, scriptName, schedules = ["*/15 * * * *"]) {
    try {
      await fetch(`${CLOUDFLARE_API_BASE}/accounts/${accountId}/workers/scripts/${scriptName}/schedules`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(schedules.map((cron) => ({ cron })))
      });
    } catch (_) {}
  },

  async getLatestCommitSha() {
    try {
      const res = await fetch(`${GITHUB_REPO_API}/commits/main`, {
        headers: { Accept: "application/vnd.github.v3+json" }
      });
      if (res.ok) {
        const data = await res.json();
        return data.sha || null;
      }
    } catch (_) {}
    return null;
  },

  async autoSetup(apiToken, onProgress = () => {}) {
    if (!apiToken || !apiToken.trim()) {
      throw new Error("Cloudflare API token is required");
    }
    const cleanToken = apiToken.trim();

    onProgress(1, 5, "Verifying Cloudflare API token...");
    const verify = await this.verifyToken(cleanToken);
    if (!verify.success) {
      throw new Error("Invalid Cloudflare API token. Please verify permissions.");
    }

    onProgress(2, 5, "Detecting account & setting up D1 database...");
    const accountId = await this.getAccountId(cleanToken);
    const databaseId = await this.getOrCreateD1Database(cleanToken, accountId, "moraqeb-d1");
    await this.applyD1Schema(cleanToken, accountId, databaseId);

    onProgress(3, 5, "Downloading scraper worker & deploying bindings...");
    const apiKey = await this.getOrCreateApiKey(cleanToken, accountId, databaseId);
    const scriptName = DEFAULT_WORKER_NAME;

    let workerCode = null;
    try {
      workerCode = await this.fetchWorkerScript();
      await StorageManager.setCachedWorkerScript(workerCode);
    } catch (fetchErr) {
      workerCode = await StorageManager.getCachedWorkerScript();
      if (!workerCode) {
        throw new Error(
          `Could not download scraper worker from GitHub (${fetchErr.message}). Please check your internet connection.`
        );
      }
    }

    await this.deployWorkerScript(cleanToken, accountId, scriptName, workerCode, databaseId, apiKey);
    await this.enableWorkerSubdomain(cleanToken, accountId, scriptName);
    await this.setCronSchedule(cleanToken, accountId, scriptName, ["*/15 * * * *"]);

    onProgress(4, 5, "Configuring worker routing & subdomain...");
    const subdomain = await this.getOrCreateAccountSubdomain(cleanToken, accountId);

    const workerUrl = `https://${scriptName}.${subdomain}.workers.dev`;
    const commitSha = await this.getLatestCommitSha();

    await StorageManager.saveSettings({
      worker_url: workerUrl,
      api_key: apiKey,
      cf_api_token: cleanToken,
      cf_account_id: accountId,
      cf_database_id: databaseId,
      cf_commit_sha: commitSha || "initial",
      cf_deployed_at: new Date().toISOString()
    });

    onProgress(5, 5, "Syncing tracked products to worker...");
    await StorageManager.syncTrackedProductsToWorker();

    return { success: true, workerUrl, apiKey };
  },

  async checkAndApplySilentUpdate() {
    try {
      const settings = await StorageManager.getSettings();
      if (!settings.worker_url || !settings.cf_api_token || !settings.cf_account_id || !settings.cf_database_id) {
        return; // Cloudflare not fully configured via auto-setup
      }

      const latestSha = await this.getLatestCommitSha();
      if (!latestSha || latestSha === settings.cf_commit_sha) {
        return; // Already up to date
      }

      console.log(`[Moraqeb Silent Update] Newer worker commit found: ${latestSha}. Downloading script...`);

      const code = await this.fetchWorkerScript();
      if (!code) {
        console.warn("[Moraqeb Silent Update] Failed to download script. Skipping update cycle.");
        return;
      }

      await this.deployWorkerScript(
        settings.cf_api_token,
        settings.cf_account_id,
        DEFAULT_WORKER_NAME,
        code,
        settings.cf_database_id,
        settings.api_key
      );

      await StorageManager.setCachedWorkerScript(code);
      await StorageManager.saveSettings({
        cf_commit_sha: latestSha,
        cf_deployed_at: new Date().toISOString()
      });

      console.log(`[Moraqeb Silent Update] Worker updated silently to commit ${latestSha}`);
    } catch (err) {
      console.warn("[Moraqeb Silent Update] Silent update check encountered error:", err.message);
    }
  }
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = { CloudflareSetup };
}
