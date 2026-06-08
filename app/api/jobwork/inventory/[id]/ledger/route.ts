import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const itemId = params.id

    // Parallel fetch both tables
    const [purchasesRes, auditsRes] = await Promise.all([
      supabase
        .from('job_work_inventory_purchases')
        .select('*')
        .eq('job_work_inventory_id', itemId)
        .order('date_time', { ascending: false }),
      supabase
        .from('job_work_inventory_audits')
        .select('*')
        .eq('job_work_inventory_id', itemId)
        .order('date_time', { ascending: false })
    ])

    const purchases = purchasesRes.data || []
    const audits = auditsRes.data || []

    // Normalize into unified timeline
    const ledger = [
      ...purchases.map((p: any) => ({
        id: `p-${p.id}`,
        action: 'restock',
        quantity: Number(p.quantity_added),
        cost_price: Number(p.cost_price),
        notes: p.notes,
        date_time: p.date_time
      })),
      ...audits.map((a: any) => ({
        id: `a-${a.id}`,
        action: 'used',
        quantity: Number(a.consumed),
        cost_price: null,
        notes: a.notes,
        date_time: a.date_time
      }))
    ]

    ledger.sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime())

    return NextResponse.json({ ledger })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

