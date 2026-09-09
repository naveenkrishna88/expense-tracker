# 💳 PT Selavugal - Mobile-First PWA Expense Tracker backed by Google Sheets

A modern, responsive, mobile-first Progressive Web Application (PWA) installable via Google Chrome, with an automated private Google Sheets backend, offline-first IndexedDB synchronization, and interactive visual analytics.

---

## 🌟 Key Features

- **📱 Chrome PWA Installability**: Install directly as a native-feeling app on Android, iOS, or Desktop Chrome with standalone display, dark theme, custom monogram icon, and offline asset caching via Service Workers.
- **🔒 100% Private to Your Personal Account**: Connect directly to your own Google Sheet without sharing it with any third-party or external email address (supports OAuth 2.0 personal login).
- **📊 Direct Google Sheet Backend**: Connect directly to your private Google Sheet using your Spreadsheet ID, logging transactions into your `Transactions`, `Groups`, and `Categories` tabs.
- **🆔 Timestamp-Based Transaction IDs**: New transactions automatically generate unique IDs based on current time in `YYYYMMDDHHMMSS` format (e.g. `20260909171710`).
- **📅 Date-Only Transaction Entry**: Clean `YYYY-MM-DD` date entry without clunky timestamps.
- **💡 Smart Auto-Complete & Historical Descriptions**: Description input provides intelligent completion matching your historical transaction descriptions with quick suggestions.
- **🗓️ 2-Handle Interactive Date Range Picker**: Visual range selector with presets (Last 7 Days, This Month, Last Month, This Year) and custom start & end date range handles.
- **🏷️ Multi-Category Filtering**: Select multiple categories simultaneously to filter expenses feed and analytics.
- **🏷️ Custom Categories Management**: Create custom categories with tailored colors and icons in the "Manage" tab, saved directly to Google Sheets.
- **👥 Occasion & Trip Groups**: Create purpose-driven groups (e.g., "Goa Trip", "Home Renovation", "Wedding") with dedicated category spend distribution and archiving.
- **📊 Interactive Financial Analytics**:
  - Filter bar integrated directly inside Analytics tab with real-time reactive charts.
  - KPI Cards: Monthly Spend, Daily Average, Top Payment Method, All-time total.
  - Donut Charts: Category distribution & Payment Mode breakdown (UPI, Credit Card, Cash, etc.).
  - Bar Charts: Month-over-Month spending trend & Group spend comparison.
- **🛡️ Secure REST API Abstraction**: Zero Google Sheets IDs, URLs, or Drive links leak to the client. The frontend only talks to standard `/api/*` endpoints.
- **📶 Offline-First with IndexedDB**: Log expenses anywhere—even on a flight or in low-signal areas. Transactions queue in IndexedDB and automatically sync with Google Sheets when connection is restored.
- **🔍 Fast Search & Multi-Filters**: Filter expenses by date range, category, payment method, group, and text search with instant reset.

---

## 📁 Directory Structure

```text
expense-tracker/
├── backend/
│   ├── main.py                  # FastAPI REST API server
│   ├── server.js                # Express Node.js REST API server (alternative)
│   ├── sheets_service.py        # Sheets abstraction with gspread + local fallback
│   ├── sheets_service.js        # Sheets abstraction with googleapis + local fallback
│   ├── requirements.txt         # Python dependencies
│   ├── package.json             # Node.js backend dependencies
│   ├── .env.example             # Environment template
│   └── credentials.json.example # Service Account key template
│
├── frontend/
│   ├── public/
│   │   ├── manifest.json        # Web App Manifest (Chrome PWA)
│   │   ├── sw.js                # Service Worker (offline cache)
│   │   ├── logo.png             # Gold monogram brand logo
│   │   ├── icon-192.png         # PWA App Icon (192x192)
│   │   └── icon-512.png         # PWA High-Res Icon (512x512)
│   ├── src/
│   │   ├── App.jsx              # Main App layout & tab manager
│   │   ├── components/          # UI Components
│   │   │   ├── Navbar.jsx       # Header with logo & PWA install
│   │   │   ├── BottomNav.jsx    # Floating bottom navigation
│   │   │   ├── KPIBanner.jsx    # Summary cards
│   │   │   ├── TransactionForm.jsx # Log expense drawer
│   │   │   ├── TransactionList.jsx # Grouped transactions feed
│   │   │   ├── TransactionItem.jsx # Single transaction row
│   │   │   ├── TransactionEditModal.jsx # Inline expense editor
│   │   │   ├── DeleteConfirmModal.jsx # Delete confirmation
│   │   │   ├── DescriptionInput.jsx # Smart auto-complete input
│   │   │   ├── FilterBar.jsx    # Search, multi-category & date filters
│   │   │   ├── DateRangePickerModal.jsx # 2-handle range picker modal
│   │   │   ├── GroupManager.jsx # Manage occasions & custom categories
│   │   │   ├── AnalyticsView.jsx# Reactive charts & analytics
│   │   │   └── OfflineSyncBanner.jsx # Sync queue notifier
│   │   ├── db/
│   │   │   └── indexdb.js       # IndexedDB storage & offline sync queue
│   │   ├── services/
│   │   │   └── api.js           # API client with auto-sync engine
│   │   ├── utils/
│   │   │   ├── constants.js     # Categories & Payment modes
│   │   │   └── formatters.js    # Currency (₹), date formatters & ID generator
│   │   └── index.css            # Tailwind & glassmorphism styles
│   ├── package.json             # Frontend dependencies
│   ├── tailwind.config.js       # Fintech dark mode theme
│   └── vite.config.js           # Vite dev server + API proxy
│
└── README.md
```

---

## 🚀 Quick Start Guide

### Step 1: Set Up Your Google Sheet

1. Open [Google Sheets](https://sheets.new) in your browser and create a new spreadsheet (e.g. named **`Personal Expense Tracker`**).
2. Create **three tabs** (sheets) with the following exact column headers in **Row 1**:

   #### Tab 1: Rename sheet to `Transactions`
   Put these headers in cells `A1` to `I1`:
   | A1 | B1 | C1 | D1 | E1 | F1 | G1 | H1 | I1 |
   | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
   | `id` | `date` | `amount` | `description` | `category` | `payment_mode` | `group_id` | `created_at` | `is_deleted` |

   #### Tab 2: Rename sheet to `Groups`
   Put these headers in cells `A1` to `D1`:
   | A1 | B1 | C1 | D1 |
   | :--- | :--- | :--- | :--- |
   | `group_id` | `group_name` | `status` | `created_at` |

   #### Tab 3: Rename sheet to `Categories`
   Put these headers in cells `A1` to `E1`:
   | A1 | B1 | C1 | D1 | E1 |
   | :--- | :--- | :--- | :--- | :--- |
   | `category_id` | `category_name` | `color` | `icon` | `created_at` |

   *(Delete any remaining unused default tabs like `Sheet1`)*

3. Copy the **Spreadsheet ID** from your browser address bar:
   ```text
   https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
                                          ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
                                                      Spreadsheet ID
   ```

4. Paste the ID into `backend/.env`:
   ```bash
   SPREADSHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
   ```

---

### Step 2: Google OAuth Credentials (2 Minutes)
*Connects directly to your account using Google OAuth — 100% private, zero email sharing.*

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project named `Expense Tracker`.
3. In **APIs & Services > Library**, search and enable **Google Sheets API**.
4. In **APIs & Services > OAuth consent screen**:
   - Choose **External** (or Internal if using Google Workspace).
   - Fill in App Name (e.g., `PT Selavugal`) and your email. Click **Save and Continue**.
   - Under **Test users**, add your personal Gmail address. Click **Save**.
5. In **APIs & Services > Credentials**:
   - Click **Create Credentials** > **OAuth client ID**.
   - Application Type: **Web application**.
   - Name: `Expense Tracker Web`.
   - **Authorized JavaScript origins**:
     - `http://localhost:5173`
     - `http://localhost:8000`
   - **Authorized redirect URIs**:
     - `http://localhost:8000/api/auth/callback`
     - `http://localhost:8080/`
   - Click **Create**.
6. Download the JSON, rename it to `credentials.json`, and place it in the `backend/` folder:
   ```text
   backend/credentials.json
   ```

---

### Step 3: Launch the Backend Server

```bash
cd backend
python -m uvicorn main:app --reload --port 8000
# or simply:
python main.py
```
*(Or for Node.js: `npm install && npm start`)*

The backend will start at `http://localhost:8000`.

---

### Step 4: Launch the Frontend Web App (PWA)

In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in **Google Chrome**.
- Click **"Connect Google Account"** in the top navigation bar to authenticate.
- Your expenses will now sync directly to your private Google Sheet!

---

## 📲 How to Install the PWA in Chrome

1. Open `http://localhost:5173` in **Google Chrome**.
2. Look at the right side of the URL address bar:
   - Click the **Install PT Selavugal** icon (or click the **Install** button in the app header).
3. On Mobile Android:
   - Tap the 3 dots in Chrome > **Add to Home Screen** / **Install App**.
4. The app opens in **standalone window mode** without browser address bars, launches from your desktop or home screen, and works completely offline!

---

## 🔌 REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status and storage mode |
| `GET` | `/api/data` | Returns all non-deleted transactions, active groups, and custom categories |
| `POST` | `/api/transactions` | Appends a transaction row with timestamp ID (`YYYYMMDDHHMMSS`) |
| `PUT` | `/api/transactions/:id` | Updates transaction matching the ID |
| `DELETE` | `/api/transactions/:id` | Soft-deletes a transaction (`is_deleted = true`) |
| `POST` | `/api/groups` | Creates a new purpose/occasion group |
| `PUT` | `/api/groups/:id/archive` | Archives a group (`status = archived`) |
| `POST` | `/api/categories` | Creates a new custom category (color + icon) |

---

## 📊 Google Sheets Schema

### Tab 1: `Transactions`
| Column | Description |
| :--- | :--- |
| `id` | Timestamp-based ID `YYYYMMDDHHMMSS` (e.g. `20260909171710`) |
| `date` | Date format `YYYY-MM-DD` |
| `amount` | Float numeric spend value |
| `description` | Notes / Merchant name |
| `category` | Food, Travel, Utilities, Shopping, Health, Entertainment, Groceries, Work, Other or custom category |
| `payment_mode` | UPI, Credit Card, Debit Card, Cash, Net Banking |
| `group_id` | Optional foreign key to Groups tab |
| `created_at` | ISO 8601 creation timestamp |
| `is_deleted` | Soft delete flag (`FALSE` / `TRUE`) |

### Tab 2: `Groups`
| Column | Description |
| :--- | :--- |
| `group_id` | Unique group ID (`grp_...`) |
| `group_name` | Name of occasion / trip |
| `status` | `active` or `archived` |
| `created_at` | ISO 8601 creation timestamp |

### Tab 3: `Categories`
| Column | Description |
| :--- | :--- |
| `category_id` | Unique category identifier (`cat_...`) |
| `category_name` | Category display name |
| `color` | Hex color code (e.g., `#10b981`) |
| `icon` | Icon identifier string (e.g., `Tag`) |
| `created_at` | ISO 8601 creation timestamp |

