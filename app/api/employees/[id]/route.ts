import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number(searchParams.get('limit')) || 10
    const offset = Number(searchParams.get('offset')) || 0

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 1. Get employee info
    const { data: employee, error: empErr } = await supabase
      .from('employees')
      .select('*')
      .eq('id', params.id)
      .single()

    if (empErr) throw new Error(empErr.message)

    // 2. Get jobwork contributions paginated
    // job_item_ledger joined with job_items and transactions
    const { data: ledger, error: ledgerErr, count } = await supabase
      .from('job_item_ledger')
      .select(`
        id, work, changed_at,
        job_items (
          id, name, status, charge,
          transactions (
            id, bill_number
          )
        )
      `, { count: 'exact' })
      .eq('employee_id', params.id)
      .order('changed_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (ledgerErr) throw new Error(ledgerErr.message)

    return NextResponse.json({ employee, ledger: ledger || [], count: count || 0 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const empId = params.id

    // Check ledger
    const { data: checks, error: chkErr } = await supabase
      .from('job_item_ledger')
      .select('id')
      .eq('employee_id', empId)
      .limit(1)

    if (chkErr) throw new Error(chkErr.message)

    if (checks && checks.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete employee. They possess active or past entries in the job work ledger.' }, 
        { status: 400 }
      )
    }

    const { error: delErr } = await supabase.from('employees').delete().eq('id', empId)
    if (delErr) throw new Error(delErr.message)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
