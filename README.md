# Shelleh Bridge Backend (Express + PostgreSQL)

This is the **backend** for the Shelleh Bridge application. It provides RESTful APIs for user authentication, skill and request management, user profiles, and admin operations. The server is built with Express.js and connects to a PostgreSQL database.

## Tech Stack

- Node.js + Express
- PostgreSQL (via `pg`)
- Middleware: Custom Authentication
- Other Libraries: `cors`, `dotenv`, `morgan`

## Getting Started

```bash
# 1. Install dependencies
cd shelleh-bridge-backend-end
npm install

# 2. Start the development server
npm start
```

## Project Structure

```
shelleh-bridge-backend-end/
├── db.js                         # PostgreSQL client setup
├── server.js                     # Entry point of the server
├── .env                          # Environment variables
├── routes/
│   ├── Admin/
│   │   └── AdminSkills.js        # Admin skill management routes
│   ├── AuthRoute/
│   │   └── Auth.js               # User signup/login
│   ├── Messages/
│   │   └── Messages.js           # Messaging routes
│   ├── Skills/
│   │   └── skills.js             # Public skill-related routes
│   ├── requests/
│   │   ├── requests.js           # Request handling
│   │   └── userRequests.js       # User-specific request routes
│   └── userinfo/
│       └── profile.js            # User profile routes
```

## API Endpoints

The API will run on: `http://localhost:3000`

---

### Auth Routes  
Base URL: `/api/auth`

| Method | Endpoint     | Description          |
|--------|--------------|----------------------|
| POST   | `/signup`    | Register new user    |
| POST   | `/login`     | User login           |

---

### User Profile Routes  
Base URL: `/api/profile`

| Method | Endpoint     | Description             |
|--------|--------------|-------------------------|
| GET    | `/`          | Get user profile        |
| PUT    | `/update`    | Update user profile     |

---

### Skills Routes  
Base URL: `/api/skills`

| Method | Endpoint     | Description             |
|--------|--------------|-------------------------|
| GET    | `/`          | List all skills         |

---

### Admin Skills Routes  
Base URL: `/api/admin/skills`

> Requires `x-role: admin` header.

| Method | Endpoint     | Description             |
|--------|--------------|-------------------------|
| POST   | `/add`       | Add a new skill         |
| PUT    | `/edit/:id`  | Edit a skill            |
| DELETE | `/delete/:id`| Delete a skill          |

---

### Requests Routes  
Base URL: `/api/requests`

| Method | Endpoint      | Description               |
|--------|---------------|---------------------------|
| POST   | `/`           | Create a request          |
| GET    | `/`           | Get all requests          |

---

### User Requests  
Base URL: `/api/user/requests`

| Method | Endpoint     | Description               |
|--------|--------------|---------------------------|
| GET    | `/`          | Get requests by user      |

---

### Messages  
Base URL: `/api/messages`

| Method | Endpoint     | Description               |
|--------|--------------|---------------------------|
| POST   | `/send`      | Send a message            |
| GET    | `/inbox`     | Get user messages         |
