import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { quantity_added, cost_price } = await request.json()
    const id = params.id
    
    const admin = createAdminClient()

    // 1. Get current
    const { data: inv, error: err1 } = await admin.from('inventory').select('current_quantity').eq('id', id).single()
    if (err1) throw new Error("Item not found")
    const invData = inv as any

    // 2. Insert ledger
    const { error: ledgerErr } = await (admin.from('inventory_ledger') as any).insert({
      inventory_id: id,
      quantity_added: Number(quantity_added),
      cost_price: Number(cost_price)
    })
    if (ledgerErr) throw new Error("Failed to write ledger: " + ledgerErr.message)

    // 3. Update quantity
    const { error: updErr } = await (admin.from('inventory') as any).update({
       current_quantity: Number(invData.current_quantity) + Number(quantity_added)
    }).eq('id', id)
    if (updErr) throw new Error("Failed to update inventory quantity: " + updErr.message)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

