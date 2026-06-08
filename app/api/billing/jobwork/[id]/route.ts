import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('job_items')
    .select(`
      *,
      transactions (
        id, bill_number,
        customers ( name, phone )
      ),
      job_item_ledger (
        id, employee_id, work, changed_at,
        employees ( name )
      )
    `)
    .eq('id', params.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const job = data as any
  // Sort ledger by changed_at desc
  if (job?.job_item_ledger) {
    job.job_item_ledger.sort((a: any, b: any) =>
      new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
    )
  }

  return NextResponse.json({ job })
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { next_status, employee_id } = await request.json()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!next_status || !employee_id) {
      return NextResponse.json({ error: 'next_status and employee_id are required.' }, { status: 400 })
    }

    // Update job status
    const { error: updateErr } = await (supabase
      .from('job_items') as any)
      .update({ status: next_status })
      .eq('id', params.id)

    if (updateErr) throw new Error(updateErr.message)

    // Write ledger entry
    const { error: ledgerErr } = await (supabase
      .from('job_item_ledger') as any)
      .insert({
        job_item_id: params.id,
        employee_id,
        work: next_status,
        changed_at: new Date().toISOString()
      })

    if (ledgerErr) throw new Error(ledgerErr.message)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

