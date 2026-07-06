# Sonal Boutique — Business Lifecycle & Revision System Upgrade

This implementation plan details the changes required to upgrade the application's billing system to support the new transaction lifecycle (`ACTIVE`, `CANCELLED`, `REVISED`) and revision architecture.

## User Review Required

> [!IMPORTANT]
> The database has already been migrated. We will extend the TypeScript types file to reflect these database changes.
> We must ensure that any automated stock/customer recalculation operations are fully transaction-safe and rollback on error.

> [!WARNING]
> Since we do not want to duplicate business logic, any action that triggers stock changes or customer updates must perform those modifications sequentially inside a transaction block.

## Open Questions

None at this time. Clarifying questions and details are addressed in the proposed changes below.

---

## Proposed Changes

### Database Types

#### [MODIFY] [database.types.ts](file:///c:/Zero-Tech/ZeroVerse/SonalBoutique/types/database.types.ts)
* Add `'ACTIVE' | 'CANCELLED' | 'REVISED'` as the type for `transactions.status`.
* Add the `revisions` table type definition:
  ```typescript
  revisions: {
    Row: {
      original_transaction_id: string
      revised_transaction_id: string
      reason: string
      created_at: string
    }
    Insert: {
      original_transaction_id: string
      revised_transaction_id: string
      reason: string
      created_at?: string
    }
    Update: {
      original_transaction_id?: string
      revised_transaction_id?: string
      reason?: string
      created_at?: string
    }
  }
  ```
* Update `job_status_enum` to include `"cancelled"`.

---

### Billing API

#### [MODIFY] [route.ts](file:///c:/Zero-Tech/ZeroVerse/SonalBoutique/app/api/billing/route.ts)
* **POST Route:**
  * Default new transactions `status` to `'ACTIVE'`.
  * Support optional fields `original_transaction_id` and `revision_reason` in the request body for revisions.
  * If `original_transaction_id` is supplied:
    1. Retrieve the original transaction.
    2. Change the original transaction's status to `'REVISED'`.
    3. Calculate difference in bill items:
       * For items present in both: adjust inventory based on delta (`new_qty - old_qty`).
       * For items removed in revised version: restore old stock.
       * For items newly added: deduct new stock.
       * Reflect these changes in `inventory_ledger` and update `current_quantity` on the `inventory` table.
    4. Calculate differences in job items:
       * For job items removed: set status to `'cancelled'` and record in `job_item_ledger`.
       * For newly added job items: create them normally.
    5. Calculate differences in Bishi redemptions:
       * Compare the original bishi discounts vs new bishi discounts, and adjust the members' `total_redeemed` and `balance` accordingly.
    6. Insert a mapping row in the `revisions` table.
    7. Recalculate customer's `total_billed`, `total_paid`, and `balance`.

#### [MODIFY] [route.ts](file:///c:/Zero-Tech/ZeroVerse/SonalBoutique/app/api/billing/[id]/route.ts)
* **GET Route:**
  * Return the `status` of the transaction.
  * Check the `revisions` table to see if this transaction was revised (i.e. is the `original_transaction_id`) or is a revision (i.e. is the `revised_transaction_id`). Return the linked transaction ID if applicable so the UI can link them.

#### [NEW] [route.ts (Cancel)](file:///c:/Zero-Tech/ZeroVerse/SonalBoutique/app/api/billing/[id]/cancel/route.ts)
* **POST Route:**
  * Change the transaction status to `'CANCELLED'`.
  * Restore inventory:
    * Fetch all `bill_items` for this transaction.
    * For each item, add the quantity back to `current_quantity` on the `inventory` table.
    * Insert an inflow entry to `inventory_ledger` to record the restoration of stock.
  * Cancel job items:
    * Set status of all active job items to `'cancelled'`.
    * Record the status change in `job_item_ledger` with the default admin or current user.
  * Reverse Bishi redemption:
    * Revert `total_redeemed` and `balance` for the member using data from `bishi_sales` / `bishi_bill_items`.
    * Note: Do not delete `bishi_sales` or `bishi_bill_items` so that the audit trail is kept, but their values must be zeroed out or marked appropriately.
  * Recalculate customer totals (`total_billed`, `total_paid`, `balance`) based on remaining ACTIVE transactions.

#### [NEW] [route.ts (Undo)](file:///c:/Zero-Tech/ZeroVerse/SonalBoutique/app/api/billing/[id]/undo/route.ts)
* **DELETE Route:**
  * Verify that the transaction is `'ACTIVE'`.
  * Delete all related records permanently:
    * `bishi_bill_items`, `bishi_sales`.
    * `job_item_ledger`, `job_items`.
    * `bill_items`.
    * `inventory_ledger` rows generated for this bill.
    * `revisions` if any.
    * The transaction itself.
  * Restore inventory quantities:
    * Read the `bill_items` and add the deducted quantities back to the `inventory` table's `current_quantity`.
  * Recalculate customer totals.

---

### Inventory Module

#### [MODIFY] [route.ts](file:///c:/Zero-Tech/ZeroVerse/SonalBoutique/app/api/inventory/[id]/route.ts)
* Modify the GET route's `sales` query to filter out items from transactions that are not `ACTIVE` (e.g. joining `transactions` and ensuring `status = 'ACTIVE'`). This satisfies: *"When calculating current stock, consider only bill_items belonging to ACTIVE transactions. Cancelled and Revised transactions must no longer contribute to stock deduction."*

---

### UI Enhancements

#### [MODIFY] [page.tsx](file:///c:/Zero-Tech/ZeroVerse/SonalBoutique/app/dashboard/billing/[id]/page.tsx)
* Display transaction status badge: `ACTIVE` (green), `CANCELLED` (red), `REVISED` (yellow).
* If transaction is `ACTIVE`:
  * Render **Cancel Bill** and **Revise Bill** buttons.
  * Render **Undo Bill** button (for immediate deletion).
* If transaction is `REVISED`:
  * Display a link pointing to the replacement transaction: *"This bill has been revised. View Revised Bill #X."*
* If transaction is `CANCELLED`:
  * Visually fade the invoice card or show a large watermark.

#### [MODIFY] [page.tsx](file:///c:/Zero-Tech/ZeroVerse/SonalBoutique/app/dashboard/billing/page.tsx)
* Support a `revise_id` query parameter.
* If present, fetch the transaction details and populate the new bill form (Customer, Purchase Items, Job Work, Bishi setup, Discounts) to allow revision, submitting to the billing route with `original_transaction_id` and a `revision_reason`.

---

## Verification Plan

### Automated Tests
* We will verify using our manual tests and browser previews since the backend API tests can be validated with script calls.

### Manual Verification
1. Create a new bill with inventory and job work items. Verify stock decreases and customer balance increases.
2. Undo the bill. Verify all traces are deleted and stock/customer balances return to normal.
3. Create another bill. Cancel it. Verify transaction status becomes `CANCELLED`, stock is restored, jobs are cancelled, customer balance is recalculated, and invoice shows as CANCELLED.
4. Create a bill. Revise it by editing items and quantities. Verify original becomes `REVISED`, a new `ACTIVE` bill is created, and revision link functions correctly on the UI.
