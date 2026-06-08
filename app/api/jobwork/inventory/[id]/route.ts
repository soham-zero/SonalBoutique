import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { action, quantity, cost_price, notes } = body
    const itemId = params.id

    if (Number(quantity) <= 0) throw new Error("Quantity must be greater than 0")

    const admin = createAdminClient()

    // 1. Fetch current item
    const { data: item, error: itemErr } = await admin
      .from('job_work_inventory')
      .select('*')
      .eq('id', itemId)
      .single()
    if (itemErr || !item) throw new Error("Item not found")
    const itemData = item as any

    let newQuantity = Number(itemData.current_quantity)

    if (action === 'restock') {
      // 2. Insert purchase log
      const { error: purchaseErr } = await (admin.from('job_work_inventory_purchases') as any).insert({
        job_work_inventory_id: itemId,
        quantity_added: Number(quantity),
        cost_price: Number(cost_price || 0),
        notes: notes || null
      })
      if (purchaseErr) throw new Error("Failed to write purchase: " + purchaseErr.message)
      newQuantity += Number(quantity)
    } else if (action === 'used') {
      // 3. Insert audit/consumption log
      if (newQuantity < Number(quantity)) throw new Error("Insufficient stock")

      const { error: auditErr } = await (admin.from('job_work_inventory_audits') as any).insert({
        job_work_inventory_id: itemId,
        consumed: Number(quantity),
        notes: notes || null
      })
      if (auditErr) throw new Error("Failed to write audit: " + auditErr.message)
      newQuantity -= Number(quantity)
    } else {
      throw new Error("Invalid action. Must be 'restock' or 'used'.")
    }

    // 4. Update core quantity
    const { error: updateErr } = await (admin
      .from('job_work_inventory') as any)
      .update({ current_quantity: newQuantity })
      .eq('id', itemId)
    if (updateErr) throw new Error("Failed to update quantity: " + updateErr.message)

    return NextResponse.json({ success: true, newQuantity })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

