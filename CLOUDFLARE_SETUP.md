# Cloudflare Setup Guide for Moraqeb

Moraqeb includes an automated 1-click Cloudflare setup that deploys a serverless Worker and D1 database to track Amazon product prices 24/7 in the background—even when your browser is closed.

---

## 1. Create a Cloudflare Account (If you don't have one)

1. Sign up for free at [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up).
2. Verify your email address.

---

## 2. Generate a Cloudflare API Token

To allow Moraqeb to automatically create your D1 database, upload the worker code, and set up the 15-minute cron triggers, create a **Custom API Token**:

1. Go to [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens).
2. Click **Create Token**.
3. Scroll to the bottom and click **Create Custom Token** (*Get started*).
4. Fill in the token details:
   - **Token Name**: `Moraqeb Tracker` (or any name you prefer).
   - **Permissions**: Add these **3 required permissions**:
     1. `Account` &mdash; `Workers Scripts` &mdash; `Edit`
     2. `Account` &mdash; `D1` &mdash; `Edit`
     3. `Account` &mdash; `Account Settings` &mdash; `Read`
   - **Account Resources**:
     - `Include` &mdash; `All accounts` (or select your personal account).
5. Click **Continue to summary** at the bottom.
6. Click **Create Token**.
7. **Copy your API token** immediately (Cloudflare only displays it once).

---

## 3. Run 1-Click Auto-Setup in Moraqeb

1. Open the Moraqeb Dashboard in your browser.
2. In the sidebar, click **Setup Cloudflare Sync**.
3. Paste your Cloudflare API Token in the field.
4. Click **Start Auto-Setup**.

Moraqeb will automatically:
- Verify your token and detect your account ID.
- Create a serverless D1 database named `moraqeb-d1` and run the database schema.
- Assign an account `workers.dev` subdomain automatically (`moraqeb-XXXXXXXX`) if your Cloudflare account is new.
- Generate an API Secret Key (`moraqeb-XXXXXXXX`) to protect your worker endpoints.
- Deploy the scraper worker with automated 15-minute cron triggers.
- Sync your currently tracked Amazon products to the worker.

---

## 4. How Subdomains and API Secret Keys Work

- **Automatic Subdomain (`moraqeb-XXXXXXXX`)**: If your Cloudflare account has never used Workers before, Moraqeb automatically registers a clean, unique subdomain (`moraqeb-XXXXXXXX`) on `workers.dev` so you don't have to configure DNS or subdomains manually.
- **Secure Endpoints**: Your worker's buffer consume and product sync endpoints are protected by an API Secret Key following the pattern `moraqeb-XXXXXXXX`.
- **Persistent Key Storage in D1**: The secret key is stored in the `moraqeb_config` table inside your Cloudflare D1 database.
  - If you ever disconnect Cloudflare in the extension and reconnect later with your API token, Moraqeb automatically queries D1 and restores the **exact same API Secret Key**, preventing secret mismatches or orphaned workers.
- **Viewing Your Key**: At any time, you can click **Manage Cloudflare** in the Moraqeb sidebar to view your deployed Worker URL, toggle the visibility of your API Secret Key, and copy either credential with one click.
