import { AutoRouter, cors } from 'itty-router';
import { verifyToken } from './middleware';
import { getUserData } from './db';

const { preflight, corsify } = cors()

const router = AutoRouter()

// GET collection index
router.get('/api/oauth-callback', async (request, env: any) => {
	const { searchParams } = new URL(request.url)
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
					redirect_uri: 'YOUR_REDIRECT_URI',
					grant_type: 'authorization_code'
				})
			})
      
			const data: any = await response.json();

			const accessToken = data.access_token;
      // Use the access token to make API requests
			return new Response(`Authentication successful`)
    } catch (error) {
			console.log(error);
      return new Response("Server error", { status: 500, statusText: "Server error"})
    }
});

// GET item
router.get('/api/users/:id', async (request, env: any) => {
	try {
		console.log("We're getting it!")
		//	Validate Monday JWT
		const tokenStatus = await verifyToken(request, env)
		if(!tokenStatus.valid) {
			return new Response("Unauthorized", { status: 401, statusText: "Unauthorized"})
		}
		//	Look up user in DB and see if OAuth is connected
		const user = await getUserData(request.params.id, env);
		if(!user) {
			return new Response("No user found", { status: 404, statusText: "No user found"})
		}

		return new Response(user)
	} catch (error) {
		console.log(error);
		return new Response("Server error", { status: 500, statusText: "Server error"})
	}
});

// POST to the collection (we'll use async here)
router.post('/api/todos', async (request) => {
	const content = await request.json();

	return new Response('Creating Todo: ' + JSON.stringify(content));
});

// 404 for everything else
router.all('*', () => new Response('Not Found.', { status: 404 }));

export default router;
