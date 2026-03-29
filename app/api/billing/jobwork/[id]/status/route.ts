import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

const STAGE_ORDER = [
  'ordered',
  'preparation',
  'cutting',
  'stitching',
  'finishing',
  'ironing',
  'complete'
]

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { next_status, employee_id, employee_name } = await request.json()
    const jobId = Number(params.id)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 1. Fetch current status
    const { data: currentJob, error: jobErr } = await (supabase
      .from('job_items') as any)
      .select('status')
      .eq('id', jobId)
      .single()

    if (jobErr) throw new Error("Job not found")

    const currentIndex = STAGE_ORDER.indexOf(currentJob.status)
    const nextIndex = STAGE_ORDER.indexOf(next_status)

    // Validations
    if (currentIndex === -1 || nextIndex === -1) {
      throw new Error("Invalid status provided")
    }
    if (nextIndex <= currentIndex) {
      return NextResponse.json(
        { error: "Status can only move forward." },
        { status: 400 }
      )
    }

    if (!employee_name) {
       return NextResponse.json({ error: 'Employee information missing.' }, { status: 400 })
    }

    // 2. Insert Ledger (acts as atomic hook, though no RPC, we sequentially execute)
    const { error: lgErr } = await (supabase.from('job_item_ledger') as any).insert({
      job_item_id: jobId,
      employee_id: employee_id || null,
      employee_name: employee_name,
      work: next_status
    })
    
    if (lgErr) throw new Error("Failed to record ledger: " + lgErr.message)

    // 3. Update Status
    const { error: updErr } = await (supabase.from('job_items') as any).update({
      status: next_status
    }).eq('id', jobId)

    if (updErr) {
       // Ideally we rollback the ledger here, but for now we throw error
       throw new Error("Failed to update status: " + updErr.message)
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
