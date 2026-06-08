import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 1. Fetch inventory details
  const { data: item, error: itemErr } = await supabase
    .from('inventory')
    .select('*')
    .eq('id', params.id)
    .single()
  
  if (itemErr) return NextResponse.json({ error: itemErr.message }, { status: 500 })

  // 2. Fetch restock inflows
  const { data: restocks } = await supabase
    .from('inventory_ledger')
    .select('*')
    .eq('inventory_id', params.id)

  // 3. Fetch sales outflows
  const { data: sales } = await supabase
    .from('bill_items')
    .select('id, quantity, price_sold_at, amount, transactions(bill_number, date_time)')
    .eq('inventory_id', params.id)

  // 4. Assemble unified timeline
  const timeline: any[] = []

  if (restocks) {
    restocks.forEach((r: any) => {
      // Inflow
      timeline.push({
        id: r.id,
        type: 'restock',
        quantity: Number(r.quantity_added),
        price: Number(r.cost_price),
        date_time: r.date_time,
        notes: 'Restocked item'
      })
    })
  }

  if (sales) {
    sales.forEach((s: any) => {
      // Outflow
      timeline.push({
        id: s.id,
        type: 'sale',
        quantity: -Number(s.quantity),
        price: Number(s.price_sold_at),
        date_time: s.transactions?.date_time || new Date().toISOString(),
        notes: `Sold in Bill #${s.transactions?.bill_number || 'N/A'}`
      })
    })
  }

  // Sort timeline by date descending
  timeline.sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime())

  return NextResponse.json({
    item,
    timeline
  })
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { selling_price } = await request.json()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { error } = await (supabase.from('inventory') as any).update({ selling_price: Number(selling_price) }).eq('id', params.id)
    if (error) throw new Error(error.message)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

