import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/utils/supabase/server'
import { recalculateCustomer } from '@/utils/billing'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const adminClient = createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { opening_balance } = await request.json()

    if (opening_balance === undefined || opening_balance === null) {
      return NextResponse.json({ error: 'opening_balance is required.' }, { status: 400 })
    }

    const parsed = Number(opening_balance)
    if (isNaN(parsed)) {
      return NextResponse.json({ error: 'opening_balance must be a valid number.' }, { status: 400 })
    }

    const { error } = await (adminClient.from('customers') as any)
      .update({ opening_balance: parsed })
      .eq('id', params.id)

    if (error) throw new Error(error.message)

    // Recalculate the customer's balance with the new opening_balance
    await recalculateCustomer(params.id, adminClient)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
