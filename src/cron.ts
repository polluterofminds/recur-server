import { getTasksByDate, getUserData, upsertTasks } from "./db";
import { Task } from "./types";

export const runCron = async (env: any) => {
  try {
    const date = new Date("September 27, 2024").toISOString()
    const tasks: Task[] | null = await getTasksByDate(date, env)

    if (tasks) {
      for (const task of tasks) {
        try {
          // get user access token
        //  post to monday API
        //  update task to show as executed
        const userId = task.user_id;
        const userData = await getUserData(userId.toString(), env)
        if (!userData.access_token) {
          //  @TODO handle this gracefully
          console.log("No access token")
        } else {
          const endpoint = "https://api.monday.com/v2";

          // Define the headers
          const headers = {
            "Authorization": userData.access_token,
            "Content-Type": "application/json"
          };

          // Define the GraphQL query
          const graphqlQuery = {
            query: task.mutation
          };

          // Make the API request
          const res: any = await fetch(endpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(graphqlQuery)
          })
          const data = await res.json()
          console.log("Cron creation")
          const newId = data?.data?.create_item.id;
          task.executed = true;
          task["new_item_id"] = parseInt(newId, 10) || 0;
          await upsertTasks([task], env)
        }
        } catch (error) {
          console.log("Error in the for loop")
          console.log(error)
          throw error
        }
      }
    }
  } catch (error) {
    console.log("Cron error")
    throw error;
  }
}