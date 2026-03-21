'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteCard(id: string) {
  const supabase = await createClient()
  await supabase.from('cards').delete().eq('id', id)
  revalidatePath('/cartoes')
}