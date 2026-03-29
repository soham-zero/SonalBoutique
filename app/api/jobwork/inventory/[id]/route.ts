import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { action, quantity, cost_price, notes } = body
    const itemId = Number(params.id)

    if (quantity <= 0) throw new Error("Quantity must be greater than 0")

    const admin = createAdminClient()

    // 1. Fetch current item
    const { data: item, error: itemErr } = await (admin
      .from('job_work_inventory') as any).select('*').eq('id', itemId).single()
    if (itemErr) throw new Error("Item not found")

    let newQuantity = item.current_quantity

    if (action === 'restock') {
      // 2. Insert purchase log
      await (admin.from('job_work_inventory_purchases') as any).insert({
        job_work_inventory_id: itemId,
        quantity_added: Number(quantity),
        cost_price: Number(cost_price || 0),
        notes: notes || null
      })
      newQuantity += Number(quantity)
    } 
    else if (action === 'used') {
      // 3. Insert audit/consumption log
      if (newQuantity < quantity) throw new Error("Insufficient stock")
      
      await (admin.from('job_work_inventory_audits') as any).insert({
        job_work_inventory_id: itemId,
        previous_quantity: newQuantity,
        current_quantity: newQuantity - Number(quantity),
        consumed: Number(quantity),
        notes: notes || `Used for job`
      })
      newQuantity -= Number(quantity)
    }

    // 4. Update core quantity
    await (admin.from('job_work_inventory') as any).update({ current_quantity: newQuantity }).eq('id', itemId)

    return NextResponse.json({ success: true, newQuantity })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
