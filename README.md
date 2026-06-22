# Prokip Customer Spotlight Booking Portal

A booking portal for selected Prokip customers to schedule their Customer Spotlight video shoot.

## Features

- **Customer Booking**: Landing page with booking form (no login required)
- **Slot Validation**: Same city + date + time blocked; different cities can share slots
- **Admin Dashboard**: Login-protected with stats, filters, search, city grouping, CSV export
- **Nigerian States & Cities**: Pre-populated dropdowns

## Tech Stack

- **Frontend**: Vanilla JS + Tailwind CSS (CDN)
- **Backend**: Node.js + Express
- **Database**: SQLite (via better-sqlite3)
- **Auth**: JWT + bcrypt

## Quick Start

```bash
# 1. Clone
git clone https://github.com/ScottT2-spec/prokip-spotlight.git
cd prokip-spotlight

# 2. Install backend dependencies
cd backend
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your settings

# 4. Start server
node server.js
# Server runs on http://localhost:3000
```

## Pages

| Route | Description |
|-------|-------------|
| `/` or `/#/spotlight` | Customer landing page + booking form |
| `/#/spotlight/thank-you` | Confirmation after booking |
| `/#/admin/login` | Admin login |
| `/#/admin/spotlight-appointments` | Admin dashboard |

## Default Admin

- **Email**: admin@prokip.com
- **Password**: admin123

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/appointments` | No | Book appointment |
| GET | `/api/appointments/check-slot` | No | Check slot availability |
| POST | `/api/admin/login` | No | Admin login |
| GET | `/api/admin/appointments` | JWT | List appointments (filterable) |
| GET | `/api/admin/appointments/stats` | JWT | Dashboard stats |
| GET | `/api/admin/appointments/grouped` | JWT | Appointments grouped by city |
| GET | `/api/admin/appointments/export` | JWT | CSV export |
| DELETE | `/api/admin/appointments/:id` | JWT | Delete appointment |
| GET | `/api/admin/filters` | JWT | Get filter dropdown values |

## Booking Rules

- Dates: 25th–30th of current month only
- Times: 8:00 AM – 4:00 PM (hourly slots)
- Two customers in the **same city** cannot book the **same date + time**
- Customers in **different cities** can share the same slot
