# Masjid Management System

A full-stack donation management system built with Next.js, Node.js/Express, and MongoDB.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ORM
- **Auth**: JWT (JSON Web Tokens)
- **PDF**: PDFKit

## User Roles

| Role | Permissions |
|------|------------|
| Super Admin | Create / Update / Delete Admin accounts |
| Admin | Manage Users, Record Donations, Filter & Download PDF statements |
| User | View total registered member count only |

## Prerequisites

- Node.js >= 18
- MongoDB (local or Atlas URI)

## Quick Start

### 1. Clone & Install Dependencies

```bash
# From project root
npm run install:all
```

### 2. Configure Backend Environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your MongoDB URI and a secure JWT secret.

### 3. Seed the Database (creates Super Admin)

```bash
npm run seed
```

Default Super Admin credentials:
- **Email**: `superadmin@masjid.com`
- **Password**: `Admin@123`

> Change these after first login!

### 4. Run the Application

```bash
npm run dev
```

This starts **both** backend (port 5000) and frontend (port 3000) simultaneously.

Open [http://localhost:3000](http://localhost:3000)

---

## API Documentation

### Base URL
`http://localhost:5000/api`

### Authentication
All protected routes require `Authorization: Bearer <token>` header.

### Endpoints

#### Auth
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/auth/login` | Login & get JWT | Public |
| GET | `/auth/me` | Get current user | All roles |

#### Admins (Super Admin only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admins?page=1&limit=10` | List all admins |
| POST | `/admins` | Create admin |
| PUT | `/admins/:id` | Update admin |
| DELETE | `/admins/:id` | Delete admin |

#### Users (Admin + Super Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/count` | Total user count |
| GET | `/users?page=1&limit=10&search=` | List users |
| GET | `/users/:id` | Get single user |
| POST | `/users` | Create user |
| PUT | `/users/:id` | Update user |
| DELETE | `/users/:id` | Delete user |

#### Donations (Admin + Super Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/donations/user/:userId?filter=monthly` | Get donations (filters: monthly, 3months, 6months, yearly) |
| GET | `/donations/user/:userId/pdf?filter=monthly` | Download PDF statement |
| POST | `/donations` | Add donation |
| PUT | `/donations/:id` | Update donation |
| DELETE | `/donations/:id` | Delete donation |

---

## Project Structure

```
masjid-management-system/
├── package.json          ← Root scripts (run both frontend + backend)
├── backend/
│   ├── config/           ← MongoDB connection
│   ├── controllers/      ← Route handler logic
│   ├── middleware/       ← Auth & authorization
│   ├── models/           ← Mongoose schemas
│   ├── routes/           ← Express routes
│   ├── utils/            ← PDF generator
│   ├── seed.js           ← DB seed script
│   └── server.js         ← Express entry point
└── frontend/
    ├── app/              ← Next.js App Router pages
    │   ├── login/
    │   └── dashboard/
    │       ├── super-admin/
    │       ├── admin/
    │       └── user/
    ├── components/       ← Reusable UI components
    ├── contexts/         ← React context (Auth)
    ├── lib/              ← Axios API client
    └── types/            ← TypeScript types
```
