import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Recalculates the balance for a given bishi member based on their ledger and sales.
 * Formula: balance = opening_balance + total_contributed - total_redeemed
 */
export async function recalculateBishiMember(memberId: string, adminClient: SupabaseClient) {
  // 1. Fetch total contributed from ledger
  const { data: contribs, error: contribErr } = await adminClient
    .from('bishi_ledger')
    .select('contribution_amount')
    .eq('bishi_member_id', memberId)

  if (contribErr) throw new Error('Error calculating contributions: ' + contribErr.message)
  const totalContributed = contribs.reduce((sum, row) => sum + Number(row.contribution_amount), 0)

  // 2. Fetch total redeemed from sales
  const { data: sales, error: salesErr } = await adminClient
    .from('bishi_sales')
    .select('redeemed')
    .eq('bishi_member_id', memberId)

  if (salesErr) throw new Error('Error calculating redemptions: ' + salesErr.message)
  const totalRedeemed = sales.reduce((sum, row) => sum + Number(row.redeemed), 0)

  // 3. Fetch the member's current state to get the opening_balance
  const { data: memberData, error: memErr } = await adminClient
    .from('bishi_members')
    .select('opening_balance')
    .eq('id', memberId)
    .single()

  if (memErr) throw new Error('Error fetching bishi member: ' + memErr.message)
  const openingBalance = Number(memberData.opening_balance ?? 0)

  // 4. Calculate new balance
  const newBalance = openingBalance + totalContributed - totalRedeemed

  // 5. Update the member record
  const { error: updateErr } = await (adminClient.from('bishi_members') as any)
    .update({
      total_contributed: totalContributed,
      total_redeemed: totalRedeemed,
      balance: newBalance
    })
    .eq('id', memberId)

  if (updateErr) throw new Error('Error updating bishi member balance: ' + updateErr.message)

  return newBalance
}
