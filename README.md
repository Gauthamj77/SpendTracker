# Spend Tracker

A shared spend tracking Progressive Web App (PWA) for two people. Built with React + Vite, backed by a Google Sheet. No server, no database, completely free to run.

**Live app:** https://gauthamj77.github.io/SpendTracker/

---

## Features

### Entry
- Numpad-first entry - open the app, type the amount, done in under 5 seconds
- UPI pre-selected as default payment method
- Notes autocomplete - suggests from your past notes as you type
- Duplicate entry detection - warns if you add the same amount and category within 2 minutes

### Home Screen
- Spend gap timer - shows how long ago you last logged an entry (per person)
- Monthly spend forecast - "On pace for ₹28,000 · last month ₹24,000" (excludes Rent)

### Dashboard
- Total spend and daily average cards
- Budget remaining card with progress bar, burn rate ("12 days left, you can spend ₹350 per day"), and overspend warning
- Category breakdown - horizontal bar chart sorted by spend, no label clipping
- Running balance line chart
- Daily spend bar chart
- Top 5 individual spends
- Category trend vs previous period
- Spending by day of week
- Rent exclude toggle - removes Rent from all charts and totals (budget remaining always includes it)
- Filters: This Month / Last Month / 3 Months, and per-person filter (Both / Gautham / Maria)

### History
- Full entry list with filters by date range, person, type, and category
- Search by notes or amount
- Name badges - colour-coded per person (blue / pink)
- Edit any entry inline
- Delete with confirmation
- Partner accountability banner - shows when your partner last added an entry

### Shared
- Both users write to the same Google Sheet in real time
- Configurable categories and payment methods per user
- Installable as a PWA on iPhone (Safari) and Android (Chrome/Brave)
- Completely free - no server, no subscription

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite 8 |
| PWA | vite-plugin-pwa |
| Charts | Recharts |
| Routing | React Router v7 |
| Auth | Google Identity Services (OAuth 2.0) |
| Database | Google Sheets API v4 |
| Hosting | GitHub Pages |
| Deploy | GitHub Actions |

---

## Google Sheet Structure

The app uses one shared Google Sheet with two tabs.

### Spends tab (one row per entry)

| Column | Field | Example |
|---|---|---|
| A | ID | `a1b2c3d4` |
| B | Timestamp | `2026-06-06T14:30:00` |
| C | AddedBy | `gautham77bl@gmail.com` |
| D | Amount | `450` |
| E | Type | `Spend` or `Income` |
| F | Category | `Food` |
| G | PaymentMethod | `UPI` |
| H | Notes | `lunch at office` |
| I | EditedAt | `2026-06-06T15:00:00` |

### Config tab (user-managed lists)

| Row | Contents |
|---|---|
| Row 1 | Categories - one value per cell (e.g. Food, Travel, Bills...) |
| Row 2 | Payment methods - one value per cell (e.g. Cash, UPI, Card...) |
| Row 3 | Gautham's budget per category (same order as Row 1) |
| Row 4 | Maria's budget per category (same order as Row 1) |

---

## Local Development

```bash
# Clone the repo
git clone https://github.com/Gauthamj77/SpendTracker.git
cd SpendTracker

# Install dependencies
npm install

# Create local env file
echo "VITE_GOOGLE_CLIENT_ID=your_client_id_here" > .env.local

# Start dev server
npm run dev
```

The app runs at `http://localhost:5173/SpendTracker/`.

> **Note:** For Google Sign-In to work locally, add `http://localhost:5173` as an authorized JavaScript origin in your Google Cloud OAuth Client ID settings.

### Other commands

```bash
npm run build    # Production build
npm run preview  # Preview the production build locally
npm run lint     # Run ESLint
```

---

## Deployment

Deployment is automatic via GitHub Actions. Every push to `main` triggers a build and deploys to GitHub Pages.

### Required GitHub Secret

| Secret | Value |
|---|---|
| `VITE_GOOGLE_CLIENT_ID` | Your OAuth 2.0 Client ID from Google Cloud Console |

Add it at: **Repo Settings - Secrets and variables - Actions - New repository secret**

---

## One-Time Google Cloud Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project
3. Enable the **Google Sheets API**
4. Go to **APIs and Services - Credentials - Create OAuth Client ID**
   - Type: **Web Application**
   - Authorized JavaScript origins: `https://gauthamj77.github.io`
5. Copy the **Client ID** and add it as the GitHub secret above
6. Go to **OAuth consent screen - Test users** and add both users' Gmail addresses

---

## One-Time Google Sheet Setup

1. Create a new Google Sheet at [sheets.google.com](https://sheets.google.com)
2. Rename the first tab to `Spends`
3. Add a second tab named `Config`
4. In `Spends` Row 1, add headers across columns A to I:
   ```
   ID  Timestamp  AddedBy  Amount  Type  Category  PaymentMethod  Notes  EditedAt
   ```
5. In `Config` Row 1, add your categories (one per cell):
   ```
   Food  Travel  Shopping  Bills  Health  Entertainment  Rent  Other
   ```
6. In `Config` Row 2, add payment methods (one per cell):
   ```
   Cash  UPI  Card  Net Banking
   ```
7. Share the sheet with both users' Gmail addresses (Editor access)
8. Copy the Sheet ID from the URL and update the hardcoded value in `src/context/AuthContext.jsx`

---

## Installing as a PWA

**iPhone (Safari only):**
1. Open Safari and go to the app URL
2. Sign in
3. Tap the Share button
4. Tap **Add to Home Screen**

**Android (Chrome or Brave):**
1. Open the app URL
2. Sign in
3. Tap the three-dot menu
4. Tap **Add to Home screen** or **Install app**

---

## Project Structure

```
src/
  screens/
    AuthScreen.jsx          Google Sign-In screen
    NumpadScreen.jsx        Home screen - numpad entry, gap timer, forecast
    DetailScreen.jsx        Entry form (category, payment, notes, duplicate check)
    DashboardScreen.jsx     Charts, budget progress, burn rate
    HistoryScreen.jsx       Entry list with filters, search, edit, partner banner
    BudgetScreen.jsx        Set per-category budgets per person
    SettingsScreen.jsx      Manage categories and payment methods
    ImportScreen.jsx        Bulk import entries
  context/
    AuthContext.jsx         OAuth token, user email, sheet ID
    ConfigContext.jsx       Categories, payment methods, budgets state
  hooks/
    useAuth.js              Auth context hook
    useSheets.js            Sheets CRUD + localStorage writes for gap timer
    useConfig.js            Config context hook
  lib/
    auth.js                 Google Identity Services token management
    sheetsClient.js         Google Sheets API v4 calls
    utils.js                Date/amount formatting, filtering helpers
  components/
    BottomNav.jsx           Four-tab navigation bar
    EntryForm.jsx           Shared entry form with notes autocomplete
    ChipPicker.jsx          Category/payment method chip selector
    Toast.jsx               Success/error toast notifications
    ConfirmDialog.jsx       Delete/duplicate confirmation dialog
  App.jsx                   Root component with routing
  main.jsx                  Entry point
```
