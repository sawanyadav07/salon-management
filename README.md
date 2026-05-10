# Salon Management

Salon management system with:
- Backend: Node.js, Express, Sequelize, MySQL, JWT, Socket.IO
- Frontend: React (CRA), Axios, React Router, React Toastify, Socket.IO client

## Project Structure

```text
salon-management/
|-- backend/
|   |-- config/
|   |-- controllers/
|   |-- middleware/
|   |-- models/
|   |-- routes/
|   |-- validation/
|   |-- server.js
|   `-- seed.js
`-- frontend/
    |-- public/
    `-- src/
```

## Environment Setup

### Backend

1. Copy `backend/.env.example` to `backend/.env`
2. Update values:

```env
PORT=5000
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DB=salon_management
MYSQL_USER=root
MYSQL_PASSWORD=change_me
JWT_SECRET=change_me
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
DB_LOG=false
DB_TZ=+05:30
```

### Frontend

1. Copy `frontend/.env.example` to `frontend/.env`
2. Update values:

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
```

Notes:
- `REACT_APP_API_URL` is used for Axios base URL.
- `REACT_APP_SOCKET_URL` is used for Socket.IO connection.
- In CRA, frontend env variables must start with `REACT_APP_`.

## Local Run

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm start
```

## Deployment Checklist

1. Move secrets out of source code and set them in your hosting platform env settings.
2. Create a production MySQL database and update `MYSQL_*` vars.
3. Set a strong `JWT_SECRET`.
4. Set `FRONTEND_URL` (or `FRONTEND_URLS` as comma-separated domains) to deployed frontend domain(s) for API + Socket.IO CORS.
5. Set frontend env:
   - `REACT_APP_API_URL=https://<your-backend-domain>`
   - `REACT_APP_SOCKET_URL=https://<your-backend-domain>`
6. If admin login is missing in production DB, create/update admin:

```bash
cd backend
npm run create-admin -- admin@salon.com StrongPassword123 "Salon Admin"
```

7. If staff table is empty in production DB, add default staff:

```bash
cd backend
npm run create-staff
```

Optional single staff create:

```bash
cd backend
npm run create-staff -- "Aman Singh" "9876500000" "Hair Stylist" "aman@salon.com"
```

8. If services table is empty in production DB, add default services:

```bash
cd backend
npm run create-services
```

Optional single service create/update:

```bash
cd backend
npm run create-services -- "Cleanup Facial" "skin" 899 60 "Deep skin cleanup"
```

9. One-command safe production seed (admin + staff + services, no table drop):

```bash
cd backend
npm run seed-production
```

10. Build frontend:

```bash
cd frontend
npm run build
```

11. Deploy backend and frontend (or serve frontend build via reverse proxy).
12. Verify:
   - API routes respond
   - Login works
   - Dashboard data loads
   - Real-time notifications connect
