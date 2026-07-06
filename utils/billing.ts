import { SupabaseClient } from '@supabase/supabase-js'

export async function recalculateCustomer(customerId: string, supabase: SupabaseClient) {
  // 1. Fetch all ACTIVE transactions for this customer
  const { data: activeTransactions, error: txErr } = await supabase
    .from('transactions')
    .select('total_amount, amount_paid')
    .eq('customer_id', customerId)
    .eq('status', 'ACTIVE')

  if (txErr) {
    throw new Error('Failed to fetch active transactions for customer recalculation: ' + txErr.message)
  }

  // 2. Fetch all customer payments
  const { data: payments, error: payErr } = await supabase
    .from('customer_payments')
    .select('amount_paid')
    .eq('customer_id', customerId)

  if (payErr) {
    throw new Error('Failed to fetch payments for customer recalculation: ' + payErr.message)
  }

  // 3. Sum up values
  const totalBilled = (activeTransactions || []).reduce((sum, tx) => sum + Number(tx.total_amount || 0), 0)
  const transactionPaid = (activeTransactions || []).reduce((sum, tx) => sum + Number(tx.amount_paid || 0), 0)
  const standalonePaid = (payments || []).reduce((sum, pay) => sum + Number(pay.amount_paid || 0), 0)

  const totalPaid = transactionPaid + standalonePaid
  const balance = totalBilled - totalPaid

  // 4. Update the customer record
  const { error: updateErr } = await (supabase.from('customers') as any)
    .update({
      total_billed: totalBilled,
      total_paid: totalPaid,
      balance: balance
    })
    .eq('id', customerId)

  if (updateErr) {
    throw new Error('Failed to update customer aggregates: ' + updateErr.message)
  }

  return { totalBilled, totalPaid, balance }
}
