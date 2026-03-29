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
      transactions ( transaction_number ),
      job_item_ledger (
        id, employee_name, work, changed_at
      )
    `)
    .eq('id', Number(params.id))
    .single()
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Sort ledger by changed_at desc internally
  if (data?.job_item_ledger) {
    data.job_item_ledger.sort((a: any, b: any) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime())
  }

  return NextResponse.json({ job: data })
}
