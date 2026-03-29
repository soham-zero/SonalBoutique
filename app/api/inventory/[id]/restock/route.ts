import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/utils/supabase/server'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { quantity_added, cost_price } = await request.json()
    const id = Number(params.id)
    
    const admin = createAdminClient()

    // 1. Get current
    const { data: inv, error: err1 } = await admin.from('inventory').select('current_quantity').eq('id', id).single()
    if (err1) throw new Error("Item not found")

    // 2. Insert ledger
    await admin.from('inventory_ledger').insert({
      inventory_id: id,
      quantity_added,
      cost_price
    })

    // 3. Update quantity
    await admin.from('inventory').update({
       current_quantity: Number(inv.current_quantity) + Number(quantity_added)
    }).eq('id', id)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
