import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('inventory')
    .select(`
      *,
      inventory_ledger (
        id, quantity_added, cost_price, date_time
      )
    `)
    .eq('id', Number(params.id))
    .single()
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (data?.inventory_ledger) {
      data.inventory_ledger.sort((a: any, b: any) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime())
  }

  return NextResponse.json({ item: data })
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { selling_price } = await request.json()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { error } = await supabase.from('inventory').update({ selling_price }).eq('id', Number(params.id))
    if (error) throw new Error(error.message)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
