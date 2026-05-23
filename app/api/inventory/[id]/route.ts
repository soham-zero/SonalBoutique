import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(request.url)
  const ledgerLimit = Number(searchParams.get('ledger_limit')) || 10
  const ledgerOffset = Number(searchParams.get('ledger_offset')) || 0

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await (supabase
    .from('inventory') as any)
    .select(`
      *,
      inventory_ledger (
        id, quantity_added, cost_price, date_time
      )
    `)
    .eq('id', Number(params.id))
    .order('date_time', { ascending: false, foreignTable: 'inventory_ledger' })
    .range(ledgerOffset, ledgerOffset + ledgerLimit - 1, { foreignTable: 'inventory_ledger' })
    .single()
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    item: data,
    ledger_has_more: (data?.inventory_ledger?.length || 0) === ledgerLimit
  })
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { selling_price } = await request.json()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { error } = await (supabase.from('inventory') as any).update({ selling_price }).eq('id', Number(params.id))
    if (error) throw new Error(error.message)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
