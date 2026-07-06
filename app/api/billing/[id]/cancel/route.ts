import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { recalculateCustomer } from '@/utils/billing'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const transactionId = params.id
  const adminClient = createAdminClient()

  // Track state for manual rollback
  let originalStatus: string | null = null
  const inventoryRestored: { id: string; quantity: number; ledgerId: string }[] = []
  const jobItemsCancelled: { id: string; oldStatus: string; ledgerId: string | null }[] = []
  let bishiReverted: { memberId: string; redeemed: number } | null = null

  try {
    // 1. Fetch transaction details
    const { data: rawTx, error: txErr } = await adminClient
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single()

    if (txErr || !rawTx) {
      return NextResponse.json({ error: 'Transaction not found: ' + (txErr?.message || '') }, { status: 404 })
    }

    const tx = rawTx as any
    if (tx.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Only ACTIVE transactions can be cancelled.' }, { status: 400 })
    }

    originalStatus = tx.status

    // Fetch related details explicitly to prevent relationship nested select bugs
    const { data: rawBillItems } = await adminClient.from('bill_items').select('*').eq('transaction_id', transactionId)
    const { data: rawJobItems } = await adminClient.from('job_items').select('*').eq('transaction_id', transactionId)
    const { data: rawBishiSales } = await adminClient.from('bishi_sales').select('*').eq('transaction_id', transactionId)

    const billItems = rawBillItems as any[] | null
    const jobItems = rawJobItems as any[] | null
    const bishiSales = rawBishiSales as any[] | null

    // Fetch an employee for job work cancellation ledger entry (fallback if job item has no employee)
    let fallbackEmployeeId: string | null = null
    const { data: employees } = await adminClient.from('employees').select('id').limit(1)
    if (employees && employees.length > 0) {
      fallbackEmployeeId = (employees[0] as any).id
    }

    // Step 1: Update transaction status to CANCELLED
    const { error: statusErr } = await (adminClient.from('transactions') as any)
      .update({ status: 'CANCELLED' })
      .eq('id', transactionId)
    if (statusErr) throw new Error('Failed to update transaction status: ' + statusErr.message)

    // Step 2: Restore inventory
    for (const bi of billItems || []) {
      // Get current stock
      const { data: inv } = await adminClient.from('inventory').select('current_quantity').eq('id', bi.inventory_id).single()
      const currentQty = inv ? Number((inv as any).current_quantity) : 0
      const restoredQty = currentQty + bi.quantity

      const { error: invErr } = await (adminClient.from('inventory') as any)
        .update({ current_quantity: restoredQty })
        .eq('id', bi.inventory_id)
      if (invErr) throw new Error(`Failed to restore inventory for item ${bi.inventory_id}: ` + invErr.message)

      // Add to inventory ledger (positive restock entry)
      const { data: ledgerRecord, error: ledgerErr } = await (adminClient.from('inventory_ledger') as any)
        .insert({
          inventory_id: bi.inventory_id,
          quantity_added: bi.quantity,
          cost_price: bi.price_sold_at,
          date_time: new Date().toISOString()
        })
        .select('id')
        .single()
      if (ledgerErr) throw new Error('Failed to create inventory ledger entry: ' + ledgerErr.message)

      inventoryRestored.push({
        id: bi.inventory_id,
        quantity: bi.quantity,
        ledgerId: (ledgerRecord as any).id
      })
    }

    // Step 3: Cancel Job items if they exist
    if (jobItems && jobItems.length > 0) {
      for (const job of jobItems) {
        if (job.status !== 'cancelled') {
          const { error: jobErr } = await (adminClient.from('job_items') as any)
            .update({ status: 'cancelled' })
            .eq('id', job.id)
          if (jobErr) throw new Error(`Failed to cancel job item ${job.id}: ` + jobErr.message)

          // Write to job_item_ledger
          const empId = job.employee_id || fallbackEmployeeId
          let ledgerId: string | null = null

          if (empId) {
            const { data: ledg, error: ledgErr } = await (adminClient.from('job_item_ledger') as any)
              .insert({
                job_item_id: job.id,
                employee_id: empId,
                work: 'cancelled',
                changed_at: new Date().toISOString()
              })
              .select('id')
              .single()
            if (ledgErr) throw new Error(`Failed to write job ledger entry for job ${job.id}: ` + ledgErr.message)
            ledgerId = (ledg as any).id
          }

          jobItemsCancelled.push({
            id: job.id,
            oldStatus: job.status,
            ledgerId
          })
        }
      }
    }

    // Step 4: Reverse Bishi redemptions if Bishi was used
    if (bishiSales && bishiSales.length > 0) {
      for (const sale of bishiSales) {
        const { data: member, error: memFetchErr } = await adminClient
          .from('bishi_members')
          .select('total_redeemed, balance')
          .eq('id', sale.bishi_member_id)
          .single()

        if (memFetchErr) throw new Error('Failed to fetch bishi member details: ' + memFetchErr.message)

        const updatedRedeemed = Number((member as any).total_redeemed) - Number(sale.redeemed)
        const updatedBalance = Number((member as any).balance) + Number(sale.redeemed)

        const { error: memUpdErr } = await (adminClient.from('bishi_members') as any)
          .update({
            total_redeemed: updatedRedeemed,
            balance: updatedBalance
          })
          .eq('id', sale.bishi_member_id)
        if (memUpdErr) throw new Error('Failed to update bishi member totals: ' + memUpdErr.message)

        bishiReverted = {
          memberId: sale.bishi_member_id,
          redeemed: Number(sale.redeemed)
        }

        // Delete bishi_sales and bishi_bill_items
        await (adminClient.from('bishi_sales') as any).delete().eq('transaction_id', transactionId)
        
        const billItemIds = (billItems || []).map((bi: any) => bi.id)
        if (billItemIds.length > 0) {
          await (adminClient.from('bishi_bill_items') as any).delete().in('bill_item_id', billItemIds)
        }
      }
    }

    // Step 5: Recalculate customer billing total
    if (tx.customer_id) {
      await recalculateCustomer(tx.customer_id, adminClient)
    }

    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('Cancellation error. Rolling back cancelled state...', err)

    // Rollback steps
    if (originalStatus) {
      try {
        await (adminClient.from('transactions') as any).update({ status: originalStatus }).eq('id', transactionId)
      } catch (e) {
        console.error('Rollback transactions failed:', e)
      }
    }

    for (const inv of inventoryRestored) {
      try {
        const { data: currentInv } = await adminClient.from('inventory').select('current_quantity').eq('id', inv.id).single()
        const currentQty = currentInv ? Number((currentInv as any).current_quantity) : 0
        await (adminClient.from('inventory') as any).update({ current_quantity: currentQty - inv.quantity }).eq('id', inv.id)
        await (adminClient.from('inventory_ledger') as any).delete().eq('id', inv.ledgerId)
      } catch (e) {
        console.error(`Rollback inventory item ${inv.id} failed:`, e)
      }
    }

    for (const job of jobItemsCancelled) {
      try {
        await (adminClient.from('job_items') as any).update({ status: job.oldStatus }).eq('id', job.id)
        if (job.ledgerId) {
          await (adminClient.from('job_item_ledger') as any).delete().eq('id', job.ledgerId)
        }
      } catch (e) {
        console.error(`Rollback job status for job ${job.id} failed:`, e)
      }
    }

    if (bishiReverted) {
      try {
        const { data: member } = await adminClient.from('bishi_members').select('total_redeemed, balance').eq('id', bishiReverted.memberId).single()
        if (member) {
          await (adminClient.from('bishi_members') as any)
            .update({
              total_redeemed: Number((member as any).total_redeemed) + bishiReverted.redeemed,
              balance: Number((member as any).balance) - bishiReverted.redeemed
            })
            .eq('id', bishiReverted.memberId)
        }
      } catch (e) {
        console.error('Rollback bishi member failed:', e)
      }
    }

    // Finally recalculate customer if applicable
    try {
      const { data: tx } = await adminClient.from('transactions').select('customer_id').eq('id', transactionId).single()
      if (tx && (tx as any).customer_id) {
        await recalculateCustomer((tx as any).customer_id, adminClient)
      }
    } catch (e) {
      console.error('Recalculate customer during rollback failed:', e)
    }

    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
