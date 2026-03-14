# ✂️ SalonPro — MERN Salon Management System

Complete salon management system built with MongoDB, Express, React, Node.js.

## Features

- **Dashboard** — Revenue stats, today's appointments, top services
- **Appointments** — Book, confirm, track & complete appointments with payment tracking
- **Customers** — Full customer profiles with visit history & spending
- **Services** — Manage services by category (Hair, Skin, Nails, Makeup, Spa)
- **Staff** — Staff profiles with specialties, working days & hours
- **Auth** — JWT-based login with role support (admin/receptionist)

## Project Structure

```
salon-management/
├── backend/
│   ├── models/         # Mongoose models (User, Customer, Service, Staff, Appointment)
│   ├── routes/         # Express routes
│   ├── middleware/     # JWT auth middleware
│   ├── server.js       # Entry point
│   ├── seed.js         # Demo data seeder
│   └── .env
└── frontend/
    └── src/
        ├── pages/      # Dashboard, Appointments, Customers, Services, Staff, Login
        ├── components/ # Layout (sidebar)
        └── context/    # AuthContext
```

## Setup & Run

### Prerequisites
- Node.js v16+
- MongoDB running locally (or MongoDB Atlas URI)

### 1. Backend Setup

```bash
cd backend
npm install
```

Edit `.env` if needed (default: localhost MongoDB):
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/salon_management
JWT_SECRET=salon_secret_key_2024
```

Seed demo data:
```bash
node seed.js
```

Start server:
```bash
npm run dev     # development (nodemon)
npm start       # production
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm start
```

App opens at: **http://localhost:3000**

### Demo Login
- **Email:** admin@salon.com
- **Password:** admin123

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login |
| POST | /api/auth/register | Register |
| GET/POST | /api/customers | List / Add customers |
| GET/PUT/DELETE | /api/customers/:id | Get / Update / Delete |
| GET/POST | /api/services | List / Add services |
| GET/PUT/DELETE | /api/services/:id | Get / Update / Deactivate |
| GET/POST | /api/staff | List / Add staff |
| GET/PUT/DELETE | /api/staff/:id | Get / Update / Deactivate |
| GET/POST | /api/appointments | List / Book appointments |
| GET/PUT/DELETE | /api/appointments/:id | Get / Update / Cancel |
| GET | /api/dashboard/stats | Dashboard statistics |

## Tech Stack

- **Frontend:** React 18, React Router v6, Axios, React Toastify
- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **Auth:** JWT + bcryptjs
