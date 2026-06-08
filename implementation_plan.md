# Sonal Boutique — Full Application Rewrite Plan (Updated)

This document outlines the design and implementation steps for rewriting Sonal Boutique to reflect the new database schema, enums, business logic, and UI requirements.

## User Review Required

> [!IMPORTANT]
> - **Routing Architecture**:
>   - `/dashboard/billing` is the **New Bill** page.
>   - `/dashboard/billing/history` is the **Bill History (View Bills)** list.
>   - `/dashboard/billing/[id]` is the **Detailed Bill & Print** page. When a bill is successfully created, we redirect to this page.
> - **Print & Download Page**:
>   - `/dashboard/billing/[id]` serves as a unified bill viewer that renders a styled invoice.
>   - It includes a **Print** button (triggering `window.print()` with CSS that hides non-bill layout components) and a **Download HTML** button.
> - **UUID Conversion**: All database IDs are updated to UUID strings. We will remove all `Number(id)` and `parseInt` conversions across types, components, and API routes.
> - **Search sequence matching**: Custom code/name/phone search bars will match exact sequence strings (contiguously) instead of scattered/loose filtering.

## Proposed Changes

---

### 1. Types regeneration

#### [MODIFY] [database.types.ts](file:///c:/Zero-Tech/ZeroVerse/SonalBoutique/types/database.types.ts)
Update all tables, columns, constraints, and enums to match the new SQL schema.

---

### 2. Billing Module

#### [MODIFY] [billing page](file:///c:/Zero-Tech/ZeroVerse/SonalBoutique/app/dashboard/billing/page.tsx)
- Move "New Bill" form here from `billing/new/page.tsx`.
- **Bill Number**: Auto-generate by querying `max(bill_number)` and incrementing by 1 (stored as varchar). Keep field editable.
- **Customer Field**: Sequence search customer name & phone. Auto-fill. Allow free entry and upsert customer on checkout.
- **Bill Items**: Sequence search items. Add Bishi toggle on item level. If toggled, bill-level bishi selector activates.
- **Jobwork**: Fields for name, description, charge, cloth provided by (customer/boutique), due date.
- **Summary**: Bill-level Bishi toggle, group/member selectors, discount (labeled "Bishi Discount" when bishi active).
- **Checkout Writes**: Transaction, bill items (updates quantity & ledger), job items, bishi sales/bill items if bishi active, customer upsert. Redirects to `/dashboard/billing/[id]` on success.

#### [NEW] [history page](file:///c:/Zero-Tech/ZeroVerse/SonalBoutique/app/dashboard/billing/history/page.tsx)
- List all transactions ordered by `date_time` descending.
- Search with sequence match for bill number or customer name/phone.
- Load first 10, ordered newest to oldest, with "Load More" pagination.
- Clicking a transaction redirects to `/dashboard/billing/[id]`.

#### [MODIFY] [billing detail page](file:///c:/Zero-Tech/ZeroVerse/SonalBoutique/app/dashboard/billing/[id]/page.tsx)
- Unified invoice rendering component.
- Print button: triggers `window.print()`.
- Download HTML button: downloads a clean, standalone HTML file of the invoice.
- Payment Receipt printing: for customer settlements, trigger receipt print using the same mechanism.

---

### 3. Inventory Module

#### [MODIFY] [inventory page](file:///c:/Zero-Tech/ZeroVerse/SonalBoutique/app/dashboard/inventory/page.tsx)
- Search by `custom_code` or `name` using sequence match.
- Load first 10, ordered by most recently restocked.
- Add "Load more" button/pagination.

#### [MODIFY] [inventory add page](file:///c:/Zero-Tech/ZeroVerse/SonalBoutique/app/dashboard/inventory/add/page.tsx)
- Format custom code: 6 alphabets hyphen 3 digits (e.g. `adchfg-001`).
- Auto-fill next numeric suffix on typing 6 alphabets. Enforce sequential order and block invalid codes.

#### [MODIFY] [inventory ledger](file:///c:/Zero-Tech/ZeroVerse/SonalBoutique/app/dashboard/inventory/ledger/page.tsx) & [inventory details](file:///c:/Zero-Tech/ZeroVerse/SonalBoutique/app/dashboard/inventory/[id]/page.tsx)
- Show unified stock history timeline assembled from `inventory_ledger` (+ quantity) and `bill_items` joined to `transactions` (- quantity).

---

### 4. Jobwork Module

#### [MODIFY] [jobwork page](file:///c:/Zero-Tech/ZeroVerse/SonalBoutique/app/dashboard/jobwork/page.tsx)
- **Active Jobs**: Statuses `ordered` through `ironing`. Search by bill number, customer name, or jobwork name (sequence match). Update status writes a `job_item_ledger` entry with `employee_id` and new status.
- **Completed & Delivered**: List `complete` jobs first with "Mark Delivered" button. Show read-only `delivered` jobs below.

#### [MODIFY] [material inventory](file:///c:/Zero-Tech/ZeroVerse/SonalBoutique/app/dashboard/jobwork/InventoryTab.tsx)
- Align with `job_work_inventory`, `job_work_inventory_purchases`, and `job_work_inventory_audits` tables.
- Ledger view per material showing purchases (+quantity) and audits (-consumed) as a unified timeline.
- Audit form containing `consumed` and `notes`.

---

### 5. Customers Module

#### [MODIFY] [customers page](file:///c:/Zero-Tech/ZeroVerse/SonalBoutique/app/dashboard/customers/page.tsx)
- Search by `name` or `phone` (sequence match).
- Load first 10, ordered by highest balance first.

#### [MODIFY] [customer detail](file:///c:/Zero-Tech/ZeroVerse/SonalBoutique/app/dashboard/customers/[id]/page.tsx)
- Info section: name, phone, billed, paid, balance.
- Transaction History: load first 10, load more. Clicking a transaction redirects to `/dashboard/billing/[id]`.
- Payment History: show `customer_payments`.
- Settle Payment button: modal with amount, payment mode, date, notes. Inserts `customer_payments`, updates `customers`, triggers print receipt.

---

### 6. Employees Module

#### [MODIFY] [employees page](file:///c:/Zero-Tech/ZeroVerse/SonalBoutique/app/dashboard/employees/page.tsx)
- Search by name (sequence match), load first 10.
- Link each employee to an Employee Detail page.

#### [NEW] [employee detail page](file:///c:/Zero-Tech/ZeroVerse/SonalBoutique/app/dashboard/employees/[id]/page.tsx)
- Info: name.
- Jobwork Contributions: query `job_item_ledger` with joined `job_items` and `transactions`. Load latest 10 with a load more option.

---

### 7. Bishi Module

#### [MODIFY] [bishi page](file:///c:/Zero-Tech/ZeroVerse/SonalBoutique/app/dashboard/bishi/page.tsx) & [bishi detail page](file:///c:/Zero-Tech/ZeroVerse/SonalBoutique/app/dashboard/bishi/[id]/page.tsx)
- Show Bishi group list.
- Tabs: Members (with add member button), Contributions (ledger entries, Record Contribution button), Bishi Sales (Redemptions), Bishi Bill Items.

---

### 8. API endpoints updating
- Update all GET, POST, DELETE, and PATCH methods in `app/api/...` to use UUID parameters.
- Add pagination / offset parameters to all list APIs.
- Update queries to use the new schema constraints and structures.

## Verification Plan

### Automated Tests
- Run `npm run build` to ensure zero compilation or type errors.

### Manual Verification
- Test POS flow: adding inventory, jobwork, bishi discounts, checking out, and printing bills/receipts.
- Verify sequential custom code auto-generation and validation.
- Verify unified stock ledger timelines.
- Verify status progressions on Jobwork tracking page.
