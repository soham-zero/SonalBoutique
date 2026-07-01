import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Supabase automatically joins based on foreign keys
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      customers (
        name,
        phone
      ),
      bill_items (
        id, quantity, price_sold_at, amount, inventory_id,
        inventory ( name, custom_code ),
        bishi_bill_items ( id, bishi_id, bishi_member_id )
      ),
      job_items (
        id, name, description, charge, cloth_provided_by, status, due_date, quantity, amount
      ),
      bishi_sales (
        id, bishi_id, bishi_member_id, redeemed,
        bishi ( name ),
        bishi_members ( name )
      )
    `)
    .eq('id', params.id)
    .single()
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ transaction: data })
}

