import { Router } from '@tsndr/cloudflare-worker-router'
import { verifyToken } from './middleware';
import { cancelScheduledTasks, cancelScheduledTasksByAccountId, getTaskByNewItemId, getUserData, upsertTasks, upsertUser } from './db';
import { MutationBody, User, UserForDb } from './types';

const router = new Router()
router.cors();

router.post('/api/webhook', async ({ req, env }) => {
	try {
		const event: any = await req.json()
		console.log(event)
		if(event.type === "uninstall") {
			const accountId = event.data.account_id
			const userId = event.data.user_id
			//	Wipe the user data
			await upsertUser({
				monday_user_id: userId, 
				email: "", 
				access_token: "", 
				name: ""
			}, env)
			//	Remove tasks
			await cancelScheduledTasksByAccountId(parseInt(accountId, 10), env);
		}
		return new Response("Data removed!", { status: 200, statusText: "Ok" })
	} catch (error) {
		console.log(error);
		return new Response("Server error", { status: 500, statusText: "Server error" })
	}
})

// GET collection index
router.get('/api/oauth-callback', async ({ req, env }) => {
	const { searchParams } = new URL(req.url)
	let authCode = searchParams.get('code')
	const clientID = env.CLIENT_ID;
	const clientSecret = env.CLIENT_SECRET;
	try {
		const response = await fetch('https://auth.monday.com/oauth2/token', {
			method: "POST",
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				client_id: clientID,
				client_secret: clientSecret,
				code: authCode,
				redirect_uri: 'https://f9aa-66-68-201-142.ngrok-free.app/api/oauth-callback',
				grant_type: 'authorization_code'
			})
		})

		const data: any = await response.json();

		const accessToken = data.access_token;

		const endpoint = "https://api.monday.com/v2";

		// Define the headers
		const headers = {
			"Authorization": accessToken,
			"Content-Type": "application/json"
		};

		// Define the GraphQL query
		const graphqlQuery = {
			query: `
        query {
            me {
                id
                email
                name
            }
        }
    `
		};

		// Make the API request
		const res: any = await fetch(endpoint, {
			method: 'POST',
			headers: headers,
			body: JSON.stringify(graphqlQuery)
		})

		const userData: User = await res.json()
		const user = userData.data.me;
		//	Upsert User
		const upsertData = {
			monday_user_id: user.id, 			
			access_token: accessToken, 
			name: user.name, 
			email_address: user.email
		}
		await upsertUser(upsertData, env);
		// Use the access token to make API requests
		return new Response(
			`<!DOCTYPE html>
			<html lang="en">
			<title>Recur - Repeating/Recurring tasks for Monday.com</title>
			<meta
				name="description"
				content="Painlessly create recurring tasks in Monday.com"
			/>
			<meta name="viewport" content="width=device-width, initial-scale=1" />
			<link rel="icon" href="https://www.tryrecur.com/recuricon.png" />
			<link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
			<link rel="preconnect" href="https://fonts.googleapis.com" />
			<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin />
			<link
				href="https://fonts.googleapis.com/css2?family=Shrikhand&display=swap"
				rel="stylesheet"
			></link>
			<link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400..700;1,400..700&display=swap" rel="stylesheet"></link>
				<body>
				<div style="display: flex; flex-direction: column; width: 75%; margin: auto; height: 100vh; justify-content: center; align-items: center;">
					<img src="https://www.tryrecur.com/recuricon.png" alt="Recur" style="width: 100px; height: 100px;" />
					<h1>Authorization successful!</h1>
					<p>You can close this window.</p>
					<div style="margin-top: 20px;">
						<a href="https://tryrecur.com">Visit Recur</a>
					</div>
				</div>								
				</body>
			</html>`,
			{ headers: { 'Content-Type': 'text/html' } }
		);
	} catch (error) {
		console.log(error);
		return new Response("Server error", { status: 500, statusText: "Server error" })
	}
});

router.post(`/api/users`, async ({ req, env }) => {
	try {
		const tokenStatus = await verifyToken(req, env)
		if (!tokenStatus.valid) {
			return new Response("Unauthorized", { status: 401, statusText: "Unauthorized" })
		}
		const body: any = await req.json()
		console.log(body)
		const { user } = body;
		if(!user) {
			return new Response("User object is required", { status: 400, statusText: "Invalid request" })
		}
		
		const upsertData = {
			monday_user_id: user.id, 			
			name: user.name, 
			email_address: user.email
		}
		await upsertUser(upsertData, env);
		return new Response("User created!", { status: 200, statusText: "Ok" })
	} catch (error) {
		console.log(error);
		return new Response("Server error", { status: 500, statusText: "Server error" })
	}
})

// GET item
router.get('/api/users/:id', async ({ req, env }) => {
	try {
		//	Validate Monday JWT
		const tokenStatus = await verifyToken(req, env)
		if (!tokenStatus.valid) {
			return new Response("Unauthorized", { status: 401, statusText: "Unauthorized" })
		}
		//	Look up user in DB and see if OAuth is connected
		const user = await getUserData(req.params.id, env);
		return Response.json(user)
	} catch (error) {
		console.log(error);
		return new Response("Server error", { status: 500, statusText: "Server error" })
	}
});

router.post('/api/tasks', async ({ req, env }) => {
	try {
		const tokenStatus = await verifyToken(req, env)
		if (!tokenStatus.valid) {
			return new Response("Unauthorized", { status: 401, statusText: "Unauthorized" })
		}

		const userId = tokenStatus?.decoded?.dat.user_id;
		const accountId = tokenStatus?.decoded?.dat.account_id;

		const body: MutationBody = await req.json();
		const { mutations } = body;

		const tasks = mutations.map((m: any) => {
			return {
				user_id: userId, 
				account_id: accountId, 
				mutation: m.mutation, 
				schedule_date: m.dateToExecute, 
				item_id: m.itemId
			}
		})
		await upsertTasks(tasks, env);
		return new Response("Success", { status: 200, statusText: "Ok" })
	} catch (error) {
		console.log(error);
		return new Response("Server error", { status: 500, statusText: "Server error" })
	}
})

router.get('/api/tasks/:new_item_id', async({ req, env }) => {
	try {
		const tokenStatus = await verifyToken(req, env)
		if (!tokenStatus.valid) {
			return new Response("Unauthorized", { status: 401, statusText: "Unauthorized" })
		}

		const id = req.params.new_item_id;

		if(!id) {
			return new Response("Item id is required", { status: 400, statusText: "No item id provided" })
		}
		const task = await getTaskByNewItemId(parseInt(id, 10), env);
		return Response.json(task)
	} catch (error) {
		console.log(error);
		return new Response("Server error", { status: 500, statusText: "Server error" })
	}
})

router.delete('/api/tasks/:new_item_id', async({ req, env }) => {
	try {
		const tokenStatus = await verifyToken(req, env)
		if (!tokenStatus.valid) {
			return new Response("Unauthorized", { status: 401, statusText: "Unauthorized" })
		}

		const id = req.params.new_item_id;

		if(!id) {
			return new Response("Item id is required", { status: 400, statusText: "No item id provided" })
		}
		await cancelScheduledTasks(parseInt(id, 10), env);
		return new Response("Success", { status: 200, statusText: "OK" })
	} catch (error) {
		console.log(error);
		return new Response("Server error", { status: 500, statusText: "Server error" })
	}
})

export default router;
