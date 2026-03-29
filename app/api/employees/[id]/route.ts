import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const empId = Number(params.id)

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
