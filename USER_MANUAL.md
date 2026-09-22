# Cloud-Based QR Digital Menu & Kitchen Order Ticketing (KOT) System
## Official User & Operations Manual

---

## 1. Introduction & Operating Overview

The **Cloud-Based QR Digital Menu & Kitchen Order Ticketing (KOT) System** is a production-grade restaurant technology platform built specifically for Ethiopian cafes, bistros, bars, and full-service dining venues.

### Core Architecture Highlights
- **Service Modes**: Operates in **Self-Served Mode** (customers order directly via QR) or **Waiter-Assisted Mode** (customers browse read-only menu; waiters punch orders on tablet POS), with table-level hybrid overrides.
- **Ethiopian Cultural Engine**: Full **English & Amharic (EN | አማ)** bilingual support, **Ethiopic (Ge'ez) typography**, Ethiopian fasting (የጾም) filter & Orthodox Christian calendar auto-scheduler, and localized modifier groups (sugar levels, milk choices, Injera options, spiciness).
- **KOT Station Engine**: Automatically splits customer/waiter orders into dedicated **Kitchen** (food) and **Barista** (drinks) tickets, managing real-time station readiness via WebSockets.
- **Payment Pipeline**: Supports Cash queues and environment-aware digital payments (Telebirr and CBE Birr).

---

## 2. System Startup & Quick Access Links

### 2.1 Environment Configuration & Starting the Application
Ensure PostgreSQL is running on `localhost:5432` with database `digital_menu`.

1. **Configure Environment Variables**:
   - Backend: Copy `server/.env.example` to `server/.env` and verify variables (`PORT`, `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `MASTER_ADMIN_USERNAME`, `MASTER_ADMIN_PASSWORD`, etc.).
   - Frontend: Copy `frontend/.env.example` to `frontend/.env.local` and verify variables (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL`, `NEXT_PUBLIC_APP_NAME`).

> [!IMPORTANT]
> Both backend and frontend enforce strict startup environment validation. If any variable is missing or empty, execution fails fast with an explicit error detailing the missing keys.

2. **Start the NestJS Backend Server** (Port 4000):
   ```bash
   cd "/home/natnael/Documents/Digital Menu/server"
   pnpm start:dev
   ```
3. **Start the Next.js Frontend Application** (Port 3000):
   ```bash
   cd "/home/natnael/Documents/Digital Menu/frontend"
   pnpm dev
   ```

### 2.2 System Navigation Directory
| Interface / Portal | Purpose | Web URL |
| :--- | :--- | :--- |
| **Main Portal Hub** | Auto Redirection to Staff Login / Admin | [http://localhost:3000](http://localhost:3000) |
| **Customer QR Menu** | Customer Table QR Menu Scan | [http://localhost:3000/menu?table_id=[TABLE_ID]&token=[QR_TOKEN]](http://localhost:3000/menu) |
| **Waiter Tablet POS** | Staff PIN login & order punching | [http://localhost:3000/waiter](http://localhost:3000/waiter) |
| **KDS Screen** | Kitchen & Barista order queue | [http://localhost:3000/kds](http://localhost:3000/kds) |
| **Cashier Terminal** | Payment verification & table settlement | [http://localhost:3000/cashier](http://localhost:3000/cashier) |
| **Admin Dashboard** | Settings, theme customizer & QR tokens | [http://localhost:3000/admin](http://localhost:3000/admin) |
| **Staff Portal Sign In** | Staff authentication page | [http://localhost:3000/login](http://localhost:3000/login) |

---

## 3. Customer Experience & QR Ordering Guide

### 3.1 Scanning the Table QR Code
When a guest sits at a table and scans the physical QR code tent, they enter the digital menu URL containing unique cryptographic table tokens:
`http://localhost:3000/menu?table_id=[TABLE_ID]&token=[CRYPTO_TOKEN]`

> [!NOTE]
> The backend automatically validates the cryptographic token. If a user attempts to alter table IDs in the URL manually, the system blocks authorization to prevent cross-table order tampering.

### 3.2 Bilingual Language Switcher (`EN | አማ`)
- Tap the **`EN | አማ`** floating button at the top header to toggle between **English** and **Amharic (አማርኛ)**.
- Switching language translates static UI labels, cart subtotals, category headers, item descriptions, and modifier names.
- Uses optimized **Noto Sans Ethiopic** web typography for crisp Ge'ez rendering across mobile phones and tablets.

### 3.3 Ethiopian Fasting Filter (`የጾም / Fasting Only`)
- Tap the **`የጾም / Fasting Only`** leaf toggle button to instantly filter the menu.
- Activating the filter hides non-fasting items (meat, dairy, eggs) and displays vegan/fasting-friendly dishes (e.g., *Special Fasting Beyaynetu*, *Shiro Tegabino*, *Spiced Tea*, *Soya Macchiato*).
- **Auto-Schedule Engine**: On Orthodox Christian fasting days (every Wednesday and Friday, as well as major fasting periods like *Abiy Tsom*), the system automatically defaults to Fasting mode.

### 3.4 Customizing Menu Item Modifiers
When tapping **"Add to Order"**, an Ethiopian modifier customizer opens:
- **Hot Drinks / Coffee**:
  - *Sugar Level* (Required single choice): Normal Sugar, Koshir (Half), Alcho (No Sugar), Taniya (On the side).
  - *Milk Option* (Optional): Whole Milk (+15 ETB), Soya Milk (+25 ETB).
- **Traditional Food**:
  - *Extra Injera* (Optional multi-choice): Standard Injera (+20 ETB), Pure Teff Injera (+35 ETB).
  - *Spiciness*: Mild/Normal, Extra Mitmita (+10 ETB), Side Awaze Dip (+15 ETB).
- **Breakfast / Pastries**:
  - *Chechebsa Style*: Spiced Butter & Honey (+30 ETB), Fasting Oil Style (+0 ETB).

### 3.5 Checkout & Payment Selection
1. Tap **"Proceed to Checkout"** to open the basket drawer.
2. Enter optional customer details (*Name* and *Phone Number* for status tracking).
3. Select Payment Method:
   - **Cash at Cashier**: Order is placed in `PENDING_CASH_CONFIRMATION`. The guest settles payment at the cashier counter.
   - **Telebirr Digital Transfer**: In development/staging mode, pre-fills or accepts a transaction reference and automatically approves the mock transaction.
   - **CBE / CBE Birr**: Input CBE transaction reference for verification.
4. Click **"Confirm & Place Order"**.

### 3.6 Live Customer Order Status Tracking
Upon placing an order, the customer is directed to `/status/[orderId]`:
- Real-time WebSockets connection updates the timeline automatically:
  1. `PENDING_CASH_CONFIRMATION` (Waiting for cashier check)
  2. `CONFIRMED` (Order accepted by venue)
  3. `PREPARING` (Kitchen & Barista prep underway)
  4. `READY` (Ready for pickup / serving)
  5. `COMPLETED` (Order finalized)
- When status changes to `READY`, celebratory **confetti animation** triggers on screen.

---

## 4. Waiter Tablet POS Operations

Waiters use dedicated tablet views to punch orders for guests or manage table sessions.

### 4.1 Waiter Authentication (4-Digit PIN)
1. Open [http://localhost:3000/waiter](http://localhost:3000/waiter).
2. Enter the 4-digit Waiter PIN on the keypad modal.
3. **Demo Waiter PIN**: `1234` (Associated with Waiter account `waiter1`).

### 4.2 Table Selector & Active Orders Grid
- Displays all venue tables (Tables 1 through 10, VIP Lounges, Terrace).
- Shows active order status and whether the table is in `SELF_SERVED` or `WAITER_ASSISTED` mode.

### 4.3 Quick Item Order Punching
1. Select the desired table from the left column.
2. Tap menu items in the middle column to add to the ticket.
3. Review ticket subtotals in the right column.
4. Tap **"Fire Order to KDS"**.
5. Waiter-punched orders bypass cashier hold, transitioning directly to `CONFIRMED` and routing tickets straight to Kitchen and Barista KDS displays.

---

## 5. Kitchen Display System (KDS) Operations

The KDS screen is designed for kitchen chefs and barista staff on wall-mounted displays or counter tablets.

### 5.1 Station Filter Tabs
Navigate to [http://localhost:3000/kds](http://localhost:3000/kds) and select your fulfillment station:
- 🍳 **Kitchen Station**: Receives food items (Beyaynetu, Tibs, Shiro, Chechebsa, Ful).
- ☕ **Barista Station**: Receives drink items (Ethiopian Coffee, Macchiato, Spiced Tea, Juices).

### 5.2 Color-Coded Order Card Timers
Order cards display real-time elapsed preparation timers:
- 🟢 **Green Border (< 5 minutes)**: Fresh order recently received.
- 🟡 **Amber Border (5 – 12 minutes)**: In progress; approaching standard prep limit.
- 🔴 **Red Border (> 12 minutes)**: Overdue alert requiring immediate attention.

### 5.3 Web Audio Chimes & Status Actions
- Click **"Enable Chime Audio"** at the top bar to allow browser sound chimes. When a new order arrives via WebSockets, a double D5/A5 chime sounds automatically.
- Tap **"Start Preparation"**: Updates status to `PREPARING`.
- Tap **"Mark Station Ready"**: Marks ticket as `READY`. When all station tickets for an order are ready, the master order automatically updates to `READY` for serving.

---

## 6. Cashier Terminal & Bill Settlement

Cashiers manage payment collection and close table bills when dining is finished.

### 6.1 Cash Confirmation Queue
1. Open [http://localhost:3000/cashier](http://localhost:3000/cashier).
2. Under **Pending Cash Confirmation Queue**, review orders placed by customers choosing Cash.
3. After receiving physical cash payment from the customer, click **"Payment Received (Confirm Order)"**.
4. The system updates order status to `CONFIRMED` and fires KOT tickets to the kitchen/barista screens.

### 6.2 Table Settlement & Session Invalidation
When a table finishes dining and settles its final bill:
1. Find the table under **Table Bill Settlement & QR Reset**.
2. Click **"Settle Table & Reset Session"**.
3. All active orders for that table are marked `COMPLETED`.
4. The system automatically **rotates the table's cryptographic QR token**, invalidating old customer phone browser sessions to prevent accidental post-dining additions.

---

## 7. Admin Dashboard & Dynamic Customization

Administrators manage system configuration, staff accounts, table QR tokens, menu items, and venue branding.

### 7.1 Master Admin Authentication
Log in at [http://localhost:3000/login](http://localhost:3000/login) using master admin credentials:
- **Master Admin Username**: `natishget`
- **Master Admin Password**: `Nati@1234`

> [!NOTE]
> Demo staff accounts were cleared upon database initialization. The Master Admin can create new staff accounts (Waiters, Cashiers, Kitchen Staff, Baristas, Managers) anytime in the **Staff & Users** section of the Admin Dashboard.

### 7.2 Left Navigation Sidebar Layout
The Admin Dashboard features a responsive left-side navigation sidebar for quick section management:
1. **Overview & Stats**: Real-time stats on venue tables, menu categories, active staff accounts, and Orthodox fasting mode.
2. **Table Management**: Add new restaurant tables, generate visual SVG QR codes, test QR scanner links, and rotate cryptographic tokens.
3. **Menu & Categories**: Create menu categories (English & Amharic names), add dishes with ETB pricing, fasting flags (`የጾም`), and station routing (Kitchen vs. Barista), and delete items.
4. **Staff & Users**: Create staff user accounts with assigned roles (`WAITER`, `CASHIER`, `KITCHEN_STAFF`, `BARISTA`, `MANAGER`, `ADMIN`) and set optional 4-digit Waiter PINs.
5. **Settings & Theme**: Configure global service model mode (`SELF_SERVED` vs `WAITER_ASSISTED`), Orthodox fasting auto-schedule rules, and customize live CSS brand theme color tokens (`--color-primary`, etc.).

### 7.3 Service Model Configuration
In **Settings & Theme**:
- **Self-Served Mode**: Customers scan QR, build cart, and submit orders directly to KDS without login.
- **Waiter-Assisted Mode**: Customers scan QR to view read-only menu; waiters punch orders.
- **Table-Level Overrides**: Set individual tables (e.g., VIP Lounge) to Waiter-Assisted while keeping outdoor tables Self-Served.

### 7.4 Dynamic System-Wide Theme Customizer & Live Preview
In **Settings & Theme**, adjust color pickers for system-wide brand tokens:
- *Primary Brand Color* (`--color-primary`): Primary buttons, active tabs, main icons, submit actions across Admin, Customer Menu, Waiter POS, Cashier, KDS, and Login screens.
- *Secondary Header Color* (`--color-secondary`): Brand headers and sub-headers.
- *Accent Color* (`--color-accent`): Highlights, price tags (`ETB`), active badges, and focus borders.
- *Page Background Color* (`--color-bg`): Global page background across all system interfaces.
- *Surface Card Color* (`--color-surface`): Navigation sidebars, cards, modals, and container surfaces.
- *Text Color* (`--color-text`): Main text rendering.

> [!TIP]
> **Live Color Preview**: As you drag or pick colors in the Admin Settings tab, the interface updates in real-time. Clicking **"Save Restaurant Settings & Apply Dynamic Theme"** persists the configuration to PostgreSQL and broadcasts the brand palette to all staff terminals and customer mobile screens instantly.

### 7.5 Table & QR Token Management
In **Table Management**:
- View generated visual QR code badges for all venue tables.
- Click **"Test"** to open customer QR menu directly in a new browser tab.
- Click **"Rotate"** to revoke table access tokens on demand.

---

## 8. Troubleshooting & FAQ

### Q1: Why does a scanned QR link show "QR Session Invalid"?
**Cause**: The table's QR token was rotated after bill settlement or an invalid token parameter was passed in the URL.
**Solution**: Scan the newly generated QR code printed on the physical table tent or test the link directly from the Admin Dashboard.

### Q2: Why are digital payments auto-approved during testing?
**Cause**: The environment variable `APP_ENV` is set to `development` or `staging`.
**Solution**: In dev/staging, digital payments (Telebirr/CBE) use `MockPaymentProvider` for rapid testing. In `production`, strict banking reference verification is enforced.

### Q3: Why is there no sound chime on the KDS screen when a new order arrives?
**Cause**: Modern web browsers restrict audio autoplay until the user interacts with the page.
**Solution**: Click the **"Enable Chime Audio"** button at the top header of the KDS screen once after page load.

---

*Abyssinia Digital Menu & KOT System — Operational Manual Version 1.0.0*
