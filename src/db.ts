import { createClient } from '@supabase/supabase-js'

export const getUserData = async (id: string, env: any) => {
  const supabaseKey = env.SUPABASE_KEY
  const supabaseUrl = env.SUPABASE_URL
  const supabase = createClient(supabaseUrl, supabaseKey)


  let { data: users, error } = await supabase
    .from('users')
    .select('*')
    .eq('monday_user_id', id)
  if (error) {
    throw error;
  }

  return users && users.length > 0 ? users[0] : null
}

export const upsertUser = async (user: any, env: any) => {
  const supabaseKey = env.SUPABASE_KEY
  const supabaseUrl = env.SUPABASE_URL
  const supabase = createClient(supabaseUrl, supabaseKey)
  const { data, error } = await supabase
    .from('users')
    .upsert(user, { onConflict: 'monday_user_id' })
    .select()
  if (error) {
    throw error;
  }
  return data
}

export const upsertTasks = async (tasks: any, env: any) => {
  const supabaseKey = env.SUPABASE_KEY
  const supabaseUrl = env.SUPABASE_URL
  const supabase = createClient(supabaseUrl, supabaseKey)
  console.log(tasks)
  const { data, error } = await supabase
    .from('tasks')
    .upsert(tasks, { onConflict: 'id' })
    .select()

  if (error) {
    throw error;
  }
  return data;
}

export const getTasksByDate = async (date: string, env: any) => {
  const supabaseKey = env.SUPABASE_KEY
  const supabaseUrl = env.SUPABASE_URL
  const supabase = createClient(supabaseUrl, supabaseKey)


  let { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('executed', false)
    .lte('schedule_date', date)
  if (error) {
    throw error;
  }

  return tasks
}

export const getTaskByNewItemId = async (id: number, env: any) => {
  const supabaseKey = env.SUPABASE_KEY
  const supabaseUrl = env.SUPABASE_URL
  const supabase = createClient(supabaseUrl, supabaseKey)

  let { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('new_item_id', id)
    .eq('executed', false)
  if (error) {
    throw error;
  }

  if(tasks && tasks.length === 0) {
    let { data: ogTasks, error: ogError } = await supabase
    .from('tasks')
    .select('*')
    .eq('item_id', id)
    .eq('executed', false)

    if(ogError) {
      console.log("Error fetching based on original item id")
      throw ogError;
    }

    tasks = ogTasks;
  }

  return tasks && tasks.length > 0 ? tasks[0] : null
}

export const cancelScheduledTasks = async (id: number, env: any) => {
  //  First we get the tasks that match the id
  const task = await getTaskByNewItemId(id, env);
  if(!task) {
    return;
  }

  const idToUse = task.item_id
  const supabaseKey = env.SUPABASE_KEY
  const supabaseUrl = env.SUPABASE_URL
  const supabase = createClient(supabaseUrl, supabaseKey)
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('item_id', idToUse)
    .eq('executed', false)
  if (error) {
    throw error;
  }
}

export const cancelScheduledTasksByAccountId = async (id: number, env: any) => {
  const supabaseKey = env.SUPABASE_KEY
  const supabaseUrl = env.SUPABASE_URL
  const supabase = createClient(supabaseUrl, supabaseKey)
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('account_id', id)
    .eq('executed', false)
  if (error) {
    throw error;
  }
}