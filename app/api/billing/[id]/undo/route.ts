import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { recalculateCustomer } from '@/utils/billing'

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const transactionId = params.id
  const adminClient = createAdminClient()

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
      return NextResponse.json({ error: 'Only ACTIVE transactions can be undone.' }, { status: 400 })
    }

    // Fetch related items explicitly by transaction_id to ensure robustness
    const { data: rawBillItems } = await adminClient.from('bill_items').select('*').eq('transaction_id', transactionId)
    const { data: rawJobItems } = await adminClient.from('job_items').select('*').eq('transaction_id', transactionId)
    const { data: rawBishiSales } = await adminClient.from('bishi_sales').select('*').eq('transaction_id', transactionId)

    const billItems = rawBillItems as any[] | null
    const jobItems = rawJobItems as any[] | null
    const bishiSales = rawBishiSales as any[] | null

    // Step 1: Restore Inventory quantities
    for (const bi of billItems || []) {
      // Get current stock
      const { data: inv } = await adminClient.from('inventory').select('current_quantity').eq('id', bi.inventory_id).single()
      const currentQty = inv ? Number((inv as any).current_quantity) : 0
      const restoredQty = currentQty + bi.quantity

      const { error: invErr } = await (adminClient.from('inventory') as any)
        .update({ current_quantity: restoredQty })
        .eq('id', bi.inventory_id)
      if (invErr) throw new Error(`Failed to restore inventory for item ${bi.inventory_id}: ` + invErr.message)
    }

    // Step 2: Revert Bishi member total_redeemed and balance (if Bishi was used)
    if (bishiSales && bishiSales.length > 0) {
      for (const sale of bishiSales) {
        const { data: member } = await adminClient
          .from('bishi_members')
          .select('total_redeemed, balance')
          .eq('id', sale.bishi_member_id)
          .single()

        if (member) {
          const updatedRedeemed = Number((member as any).total_redeemed) - Number(sale.redeemed)
          const updatedBalance = Number((member as any).balance) + Number(sale.redeemed)

          await (adminClient.from('bishi_members') as any)
            .update({
              total_redeemed: updatedRedeemed,
              balance: updatedBalance
            })
            .eq('id', sale.bishi_member_id)
        }
      }
    }

    // Step 3: Permanently delete related records in reverse dependency order
    // A. Delete bishi_bill_items linked to the bill items
    const billItemIds = (billItems || []).map((bi: any) => bi.id)
    if (billItemIds.length > 0) {
      await (adminClient.from('bishi_bill_items') as any).delete().in('bill_item_id', billItemIds)
    }

    // B. Delete bishi_sales
    await (adminClient.from('bishi_sales') as any).delete().eq('transaction_id', transactionId)

    // C. Delete job_item_ledger entries
    const jobItemIds = (jobItems || []).map((j: any) => j.id)
    if (jobItemIds.length > 0) {
      await (adminClient.from('job_item_ledger') as any).delete().in('job_item_id', jobItemIds)
    }

    // D. Delete job_items
    await (adminClient.from('job_items') as any).delete().eq('transaction_id', transactionId)

    // E. Delete bill_items
    await (adminClient.from('bill_items') as any).delete().eq('transaction_id', transactionId)

    // F. Delete revisions mapping
    await (adminClient.from('revisions') as any).delete().or(`original_transaction_id.eq.${transactionId},revised_transaction_id.eq.${transactionId}`)

    // G. Delete any related bishi_ledger entries (just in case)
    if (bishiSales && bishiSales.length > 0) {
      for (const sale of bishiSales) {
        await (adminClient.from('bishi_ledger') as any)
          .delete()
          .eq('bishi_id', sale.bishi_id)
          .eq('bishi_member_id', sale.bishi_member_id)
          .eq('contribution_amount', -Number(sale.redeemed))
      }
    }

    // H. Delete the transaction itself
    const { error: delTxErr } = await (adminClient.from('transactions') as any).delete().eq('id', transactionId)
    if (delTxErr) throw new Error('Failed to delete transaction: ' + delTxErr.message)

    // Step 4: Recalculate customer billing totals
    if (tx.customer_id) {
      await recalculateCustomer(tx.customer_id, adminClient)
    }

    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('Undo error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
