# 🚗 Rent-A-Car — MySQL Full Stack Project

A car rental website backed by a real MySQL database with a Node.js/Express API.

---

## 📁 Project Structure

```
rentacar/
├── database/
│   └── schema.sql        ← MySQL schema + seed data
├── public/
│   └── index.html        ← Frontend (served by Express)
├── server.js             ← Node.js + Express API
├── package.json
└── README.md
```

---

## ⚙️ Setup Instructions

### 1. Install MySQL
Download from https://dev.mysql.com/downloads/mysql/ and start the MySQL server.

### 2. Create the Database
Open your terminal and run:
```bash
mysql -u root -p < database/schema.sql
```
Or paste the contents of `schema.sql` into MySQL Workbench / phpMyAdmin.

### 3. Configure Database Credentials
Edit `server.js` and update the pool config (or use environment variables):
```js
const pool = mysql.createPool({
  host:     'localhost',
  user:     'root',         // ← your MySQL username
  password: '',             // ← your MySQL password
  database: 'rentacar_db',
});
```
Or set environment variables:
```bash
export DB_USER=root
export DB_PASSWORD=yourpassword
```

### 4. Install Node.js Dependencies
```bash
npm install
```

### 5. Start the Server
```bash
node server.js
```

### 6. Open the Website
Visit: **http://localhost:3001**

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Check DB connection |
| GET | `/api/fleet` | Get all cars |
| GET | `/api/fleet?category=SUV` | Filter by category |
| GET | `/api/fleet?status=available` | Filter by status |
| GET | `/api/fleet/:id` | Get single car |
| POST | `/api/fleet` | Add new car |
| PATCH | `/api/fleet/:id/status` | Update car status |
| GET | `/api/bookings` | Get all bookings |
| POST | `/api/bookings` | Create booking |
| PATCH | `/api/bookings/:id/cancel` | Cancel booking |
| POST | `/api/query` | Run SELECT query |

---

## 🗃️ MySQL Tables

### `fleet`
| Column | Type | Description |
|--------|------|-------------|
| car_id | INT PK | Auto-increment ID |
| make | VARCHAR(50) | Car brand |
| model | VARCHAR(50) | Car model |
| category | ENUM | Sedan / SUV / Sports / Luxury |
| seats | INT | Number of seats |
| transmission | ENUM | Auto / Manual |
| daily_rate | DECIMAL | Price per day (INR) |
| status | ENUM | available / rented / maintenance |

### `bookings`
| Column | Type | Description |
|--------|------|-------------|
| booking_id | INT PK | Auto-increment ID |
| car_id | INT FK | References fleet |
| customer_name | VARCHAR | Full name |
| customer_email | VARCHAR | Email |
| pickup_date | DATE | Rental start |
| return_date | DATE | Rental end |
| total_amount | DECIMAL | Total inc. GST |
| status | ENUM | active / completed / cancelled |

---

## 🛠️ Useful SQL Queries

```sql
-- View all available cars
SELECT * FROM available_cars;

-- View active bookings with car details
SELECT * FROM active_bookings;

-- Revenue summary
SELECT SUM(total_amount) AS total_revenue FROM bookings WHERE status != 'cancelled';

-- Most popular category
SELECT category, COUNT(*) AS bookings
FROM bookings b JOIN fleet f ON b.car_id = f.car_id
GROUP BY category ORDER BY bookings DESC;
```
