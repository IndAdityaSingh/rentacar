# 🚗 Rent-A-Car — Full Stack Car Rental System

> A complete car rental web application built with **Node.js**, **Express**, and **MySQL** — based on a formal 5-entity ER diagram.

![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-v4-000000?style=flat-square&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-v8.0-4479A1?style=flat-square&logo=mysql&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black)

---

## 📸 Pages

| Customer Website | Admin Panel |
|---|---|
| Browse fleet, make reservations, track bookings | Manage employees, vehicles, customers, reservations, rent |
| `http://localhost:3001` | `http://localhost:3001/admin.html` |

---

## 🗂️ Project Structure

```
rentacar/
├── database/
│   └── schema.sql          ← MySQL tables + seed data
├── public/
│   ├── index.html          ← Customer-facing website
│   └── admin.html          ← Admin panel
├── server.js               ← Node.js + Express REST API
├── package.json            ← Dependencies
└── README.md
```

---

## 🗃️ Database Structure

Based on the following **5-entity ER diagram**:

```
Employee ──manages──► Vehicle ──choose──► Reservation ◄──makes── Customer
                                               │
                                            contains
                                               │
                                             Rent
```

### Tables

| Table | Primary Key | Foreign Keys | Key Fields |
|---|---|---|---|
| `employee` | `emp_id` | — | fname, lname, salary, responsibility, contact_no |
| `vehicle` | `vehicle_id` | `managed_by → employee` | plate_no, model, category, mileage, condition_state, daily_price, availability |
| `customer` | `cust_id` | — | fname, lname, contact_no, driving_licence |
| `reservation` | `reserve_id` | `cust_id → customer`, `vehicle_id → vehicle` | pickup_date, return_date, no_of_days *(computed)*, pickup_location, status |
| `rent` | `rent_id` | `reserve_id → reservation` | down_pay, pay_method, total_pay, refund, damage_compensation |

---

## ⚙️ Setup & Installation

### Prerequisites

Make sure you have the following installed:

- [Node.js v18+](https://nodejs.org) — download the LTS version
- [MySQL 8.0+](https://dev.mysql.com/downloads/mysql/)
- npm (comes with Node.js)

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/your-username/rent-a-car.git
cd rent-a-car
```

---

### Step 2 — Set Up the MySQL Database

```bash
mysql -u root -p < database/schema.sql
```

Enter your MySQL password when prompted. You should see:

```
✅ rentacar_db ready!
5 employees
12 vehicles
6 customers
6 reservations
6 rent records
```

> **Windows users:** If `mysql` is not recognized, open MySQL Workbench → File → Run SQL Script → select `database/schema.sql`

---

### Step 3 — Configure Database Password

Open `server.js` and find line 20:

```js
password: process.env.DB_PASSWORD || '',
```

Replace with your MySQL root password:

```js
password: process.env.DB_PASSWORD || 'your_password_here',
```

Or use environment variables (recommended):

```bash
# Windows
set DB_PASSWORD=your_password_here

# Mac / Linux
export DB_PASSWORD=your_password_here
```

---

### Step 4 — Install Dependencies

```bash
npm install
```

---

### Step 5 — Start the Server

```bash
node server.js
```

You should see:

```
🚗  Rent-A-Car  →  http://localhost:3001
🔧  Admin       →  http://localhost:3001/admin.html
```

---

### Step 6 — Open in Browser

| Page | URL |
|---|---|
| Customer Website | http://localhost:3001 |
| Admin Panel | http://localhost:3001/admin.html |

---

## 🔌 API Endpoints

Base URL: `http://localhost:3001/api`

### System
| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Check database connection |
| GET | `/stats` | Dashboard statistics |
| POST | `/query` | Run SELECT/SHOW/DESCRIBE query |

### Employees
| Method | Endpoint | Description |
|---|---|---|
| GET | `/employees` | Get all employees |
| GET | `/employees/:id` | Get single employee |
| POST | `/employees` | Add new employee |
| PUT | `/employees/:id` | Update employee |
| DELETE | `/employees/:id` | Delete employee |

### Vehicles
| Method | Endpoint | Description |
|---|---|---|
| GET | `/vehicles` | Get all vehicles (filter: `?category=` or `?availability=`) |
| GET | `/vehicles/:id` | Get single vehicle |
| POST | `/vehicles` | Add new vehicle |
| PUT | `/vehicles/:id` | Update vehicle |
| DELETE | `/vehicles/:id` | Delete vehicle |

### Customers
| Method | Endpoint | Description |
|---|---|---|
| GET | `/customers` | Get all customers |
| GET | `/customers/:id` | Get customer + reservation history |
| POST | `/customers` | Add new customer |
| PUT | `/customers/:id` | Update customer |

### Reservations
| Method | Endpoint | Description |
|---|---|---|
| GET | `/reservations` | Get all reservations (filter: `?status=`) |
| GET | `/reservations/:id` | Get single reservation (full JOIN) |
| POST | `/reservations` | Create reservation + rent record + register customer |
| PATCH | `/reservations/:id/cancel` | Cancel reservation, free vehicle |
| PATCH | `/reservations/:id/complete` | Complete reservation (with damage/refund) |

### Rent
| Method | Endpoint | Description |
|---|---|---|
| GET | `/rent` | Get all rent payment records |

---

## 🖥️ Features

### Customer Website
- 🔍 Browse and filter vehicles by category (Sedan, SUV, Sports, Luxury, Hatchback)
- 📋 View vehicle details — plate number, mileage, condition, manager
- 📝 Make a reservation — auto-registers customer by driving licence
- 💰 Live price calculator with 18% GST breakdown
- 🔎 Track any reservation by ID
- ❌ Cancel reservations online
- 🗄️ Live SQL panel — run queries directly against MySQL from the browser

### Admin Panel
| Section | Capabilities |
|---|---|
| **Dashboard** | Live stats — vehicles, availability, customers, employees, active reservations, total revenue |
| **Employees** | Full CRUD — add, edit, delete all staff records |
| **Vehicles** | Full CRUD — manage fleet with condition, mileage, manager assignment |
| **Customers** | View all registered customers with driving licence details |
| **Reservations** | Mark as complete (with damage/refund), cancel, filter by status |
| **Rent Records** | View all payments — down pay, total, method, refund, damage fees |
| **SQL Console** | 12 preset queries + free-form SQL with live results table |

---

## 🗄️ Useful SQL Queries

```sql
-- View all 5 tables
SELECT * FROM employee;
SELECT * FROM vehicle;
SELECT * FROM customer;
SELECT * FROM reservation;
SELECT * FROM rent;

-- Full JOIN across all tables
SELECT r.reserve_id,
       CONCAT(c.fname,' ',c.lname) AS customer,
       c.driving_licence,
       v.model, v.plate_no,
       r.pickup_date, r.return_date, r.no_of_days,
       rt.pay_method, rt.down_pay, rt.total_pay
FROM reservation r
JOIN customer c  ON r.cust_id    = c.cust_id
JOIN vehicle v   ON r.vehicle_id = v.vehicle_id
JOIN rent rt     ON r.reserve_id = rt.reserve_id
ORDER BY r.reserve_id DESC;

-- Revenue summary
SELECT
  COUNT(*)                         AS total_rents,
  ROUND(SUM(total_pay), 2)        AS gross_revenue,
  ROUND(AVG(total_pay), 2)        AS avg_booking_value,
  SUM(refund)                      AS total_refunds,
  SUM(damage_compensation)         AS damage_fees_collected
FROM rent;

-- Vehicles by category
SELECT category,
       COUNT(*) AS total,
       SUM(availability = 'available') AS available,
       SUM(availability = 'rented')    AS rented
FROM vehicle
GROUP BY category
ORDER BY total DESC;

-- Use the built-in views
SELECT * FROM v_active_reservations;
SELECT * FROM v_available_vehicles;
SELECT * FROM v_revenue_summary;
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Backend** | Node.js v18+ |
| **Framework** | Express.js v4 |
| **Database** | MySQL 8.0 |
| **DB Driver** | mysql2 (with connection pooling + transactions) |
| **Middleware** | cors, express.json |
| **Typography** | Google Fonts — Syne + DM Sans |

---

## ❗ Troubleshooting

| Error | Fix |
|---|---|
| `'npm' is not recognized` | Install Node.js from nodejs.org, then close and reopen terminal |
| `EADDRINUSE: port 3001` | Another server is running. Kill it: `npx kill-port 3001` then restart |
| `Access denied for user root` | Wrong password in `server.js` — update line 20 |
| `Cannot connect to MySQL` | MySQL service not running — start it from Services or MySQL Workbench |
| `ER_DUP_ENTRY driving_licence` | Customer already exists — system updates their record automatically |
| `Cannot find module 'express'` | Run `npm install` in the project folder |
| Vehicles not loading | Server not running — run `node server.js` |

---

## 📄 License

This project is for educational purposes.

---

> Built with Node.js · Express · MySQL · HTML/CSS/JS
