# News Aggregator API

Simple Express + MongoDB API to register/login users, store user category preferences and return news from the Mediastack API.

## Features
- User signup / login (bcrypt password hashing, JWT authentication)
- Store and update user preferences (categories)
- Fetch aggregated news from Mediastack for a user's preferences
- Test suite using tap + supertest

## Project structure
- app.js — Express app bootstrap
- routes/
  - userRouter.js — /users endpoints
  - newsRouter.js — /news endpoints
- controllers/
  - userController.js
  - newsController.js
- middlewares/
  - authMiddleware.js — JWT extraction & verification
- models/
  - userModel.js — Mongoose user schema
- services/redis-client — optional Redis client
- test/server.test.js — integration tests (tap + supertest)

## Prerequisites
- Node.js (>=14)
- npm
- MongoDB (URI to connect)
- Mediastack API key (for news)
- Optional: Redis if using caching

## Environment variables
Create a `.env` in the project root with at least:

```
PORT=3000
MONGO_URI=mongodb://localhost:27017/newsdb
JWT_SECRET=your_jwt_secret
SALT_ROUND=10
NEWS_API_KEY=your_mediastack_key
```

Notes:
- SALT_ROUND must be a number (e.g. `10`). When hashing with bcrypt either pass Number(process.env.SALT_ROUND) or generate a salt with bcrypt.genSalt(Number(...)).
- JWT_SECRET is required for signing and verifying tokens.
- NEWS_API_KEY is required to call Mediastack.

## Install & Run

Install dependencies:
```
npm install
```

Start server (development):
```
npm start
```
or
```
node app.js
```

Run tests:
```
npm test
```
Tests use tap + supertest and expect the server to be running or use the app export from `app.js`.

## API (summary)

Base paths used in tests: `/users` and `/news`

- POST /users/signup
  - Body: { name, email, password, preferences }
  - Success: 200 with created user info
  - Errors: 400 on invalid input or existing user

- POST /users/login
  - Body: { email, password }
  - Success: 200 { token, ... }
  - Use returned token in Authorization header for protected endpoints

- GET /users/preferences (protected)
  - Header: Authorization: Bearer <token>
  - Success: 200 { preferences: [...] }

- PUT /users/preferences (protected)
  - Header: Authorization: Bearer <token>
  - Body: { preferences: [ 'business', 'technology' ] }
  - Success: 200

- GET /news (protected)
  - Header: Authorization: Bearer <token>
  - Returns news aggregated from Mediastack. Response shape: { news: <mediastack-data> }

- GET /news/search/:keyword (protected)  
  - Header: Authorization: Bearer <token>
  - Route param: keyword
  - Success: 200 { news: <mediastack-data> }
  - Searches Mediastack for the provided keyword and returns matching articles.
  - Implemented by controllers/newsController.js -> searchNews


## Example requests

Signup:
```
curl -X POST http://localhost:3000/users/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Clark","email":"clark@example.com","password":"Secret123","preferences":["business","technology"]}'
```

Login -> get token:
```
curl -X POST http://localhost:3000/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"clark@example.com","password":"Secret123"}'
```

Use token:
```
curl -H "Authorization: Bearer <TOKEN>" http://localhost:3000/users/preferences
```

Fetch news:
```
curl -H "Authorization: Bearer <TOKEN>" http://localhost:3000/news
```

Search news by keyword:
```
curl -H "Authorization: Bearer <TOKEN>" http://localhost:3000/news/search/bitcoin
```

## Common troubleshooting

- "Invalid salt. Salt must be in the form..."  
  Cause: passing a string SALT_ROUND into bcrypt.hash. Fix: ensure numeric rounds or use `await bcrypt.genSalt(Number(process.env.SALT_ROUND) || 10)`.

- "Converting circular structure to JSON"  
  Cause: returning whole axios response (contains circular refs). Fix: return `response.data` (or build an object) when sending JSON: `res.status(200).send({ news: axiosResp.data })`.

- authMiddleware import error / "router.use expected a function"  
  If you exported the middleware as `module.exports = authMiddleware;` then import with:
  ```js
  const authMiddleware = require('../middlewares/authMiddleware');
  ```
  If you export an object `{ authMiddleware }`, then destructure. Ensure `typeof authMiddleware === 'function'`.

- No console logs from route handlers  
  Ensure server is running in the terminal you are watching and the route being called is the one wired to your app. Restart after `.env` changes.

## Testing notes
- Tests in `test/server.test.js` use tap + supertest and set the token in `Authorization: Bearer <token>`. The server must sign JWTs with `JWT_SECRET` matching tests.
- If tests fail with auth errors, confirm your JWT payload and token creation in `userController.js` and that the middleware extracts the token correctly (`Authorization` header and Bearer prefix).


