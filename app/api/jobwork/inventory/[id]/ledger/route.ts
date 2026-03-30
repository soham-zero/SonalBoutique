import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const itemId = Number(params.id)

    // Parallel fetch both tables
    const [purchasesRes, auditsRes] = await Promise.all([
      (supabase.from('job_work_inventory_purchases') as any)
        .select('*')
        .eq('job_work_inventory_id', itemId),
      (supabase.from('job_work_inventory_audits') as any)
        .select('*')
        .eq('job_work_inventory_id', itemId)
    ])

    const purchases = purchasesRes.data || []
    const audits = auditsRes.data || []

    // Normalize
    const ledger = [
      ...purchases.map((p: any) => ({
        id: `p-${p.id}`,
        action: 'restock',
        quantity: p.quantity_added,
        cost_price: p.cost_price,
        notes: p.notes,
        created_at: p.created_at || p.date_time || new Date().toISOString() // fallback if no timestamp col
      })),
      ...audits.map((a: any) => ({
        id: `a-${a.id}`,
        action: 'used',
        quantity: a.consumed,
        cost_price: null,
        notes: a.notes,
        created_at: a.created_at || a.date_time || new Date().toISOString()
      }))
    ]

    ledger.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return NextResponse.json({ ledger })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
