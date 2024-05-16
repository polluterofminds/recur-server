import { createClient } from '@supabase/supabase-js'

export const getUserData = async (id: string, env: any) => {
  const supabaseKey = env.SUPABASE_KEY
  const supabaseUrl = env.SUPABASE_URL
  const supabase = createClient(supabaseUrl, supabaseKey)


  let { data: users, error } = await supabase
    .from('users')
    .select('*')
    .eq('monday_id', id)
    if(error) {
      throw error;
    }
  
  return users ? users[0] : null
}