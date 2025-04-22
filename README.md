# inc-cleo-spa

This project is a full-stack web application for a spa management system, named Cleo Spa. It includes a React frontend (client) and a Node.js/Express backend (server).

## Project Structure

```
inc-cleo-spa/
├── client/         # React frontend application (Vite)
│   ├── public/
│   ├── src/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── ...
├── server/         # Node.js backend application (Express)
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── sql/
│   ├── utils/
│   ├── app.js
│   ├── index.js
│   ├── package.json
│   └── ...
└── README.md       # This file
```

## Client (Frontend)

The client is a single-page application built with React and Vite.

### Technologies Used

- **Framework:** React
- **Build Tool:** Vite
- **Styling:** Tailwind CSS, Chakra UI
- **Routing:** React Router DOM
- **HTTP Client:** Axios
- **State Management:** React Context API
- **Linting:** ESLint

### Setup and Running

1.  **Navigate to the client directory:**
    ```bash
    cd client
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The client application will be available at `http://localhost:5173` (or another port if 5173 is busy).

## Server (Backend)

The server is a RESTful API built with Node.js and Express.

### Technologies Used

- **Framework:** Express.js
- **Database:** PostgreSQL (`pg` library)
- **Authentication:** `bcryptjs` for password hashing, `express-session` for session management
- **Middleware:** `cors`
- **Environment Variables:** `dotenv`
- **Validation:** `validator`

### Setup and Running

1.  **Navigate to the server directory:**
    ```bash
    cd server
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Environment Variables:**
    Create a `.env` file in the `server` directory and add the necessary environment variables. Refer to the database configuration (`server/config/database.js`) and session middleware (`server/middlewares/sessionMiddleware.js`) for required variables. Key variables include:

    - `DATABASE_URL` (Connection string for PostgreSQL)
    - _OR_ `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_DATABASE`, `DB_PORT`, `DB_SSL`
    - `SESSION_SECRET` (Secret key for session management)
    - `PORT` (Optional, defaults to 3000)
    - `LOCAL_FRONTEND_URL` (URL of the client application for CORS)
    - `DB_MAX_CONNECTIONS` (Optional, defaults to 10)

    Example `.env` file:

    ```env
    # Option 1: Connection String
    DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

    # Option 2: Individual Parameters (if DATABASE_URL is not set)
    # DB_USER=your_db_user
    # DB_PASSWORD=your_db_password
    # DB_HOST=localhost
    # DB_DATABASE=cleo_spa_db
    # DB_PORT=5432
    # DB_SSL=false # or true if required

    SESSION_SECRET=your_very_secret_key_here
    PORT=3000
    LOCAL_FRONTEND_URL=http://localhost:5173
    # DB_MAX_CONNECTIONS=15
    ```

4.  **Database Setup:**
    Ensure your PostgreSQL database server is running. You may need to create the database specified in your environment variables. The application uses `connect-pg-simple` which can automatically create the `cs_sessions` table if it's missing. You might need to run the SQL scripts in `server/sql/schema.sql` manually to set up the other tables.

5.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The server will start, typically on port 3000 (or the port specified in `.env`).
