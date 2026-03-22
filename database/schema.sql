-- ============================================================
--  Rent-A-Car — MySQL Schema (Based on ER Diagram)
--  Tables: Employee, Vehicle, Customer, Reservation, Rent
--  Run: mysql -u root -p < database/schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS rentacar_db;
USE rentacar_db;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS rent;
DROP TABLE IF EXISTS reservation;
DROP TABLE IF EXISTS customer;
DROP TABLE IF EXISTS vehicle;
DROP TABLE IF EXISTS employee;
SET FOREIGN_KEY_CHECKS = 1;

-- ─── EMPLOYEE ─────────────────────────────────────────────────
CREATE TABLE employee (
  emp_id          INT AUTO_INCREMENT PRIMARY KEY,
  fname           VARCHAR(50)  NOT NULL,
  lname           VARCHAR(50)  NOT NULL,
  salary          DECIMAL(10,2) NOT NULL DEFAULT 0,
  joined_date     DATE         NOT NULL,
  responsibility  VARCHAR(100) DEFAULT 'Staff',
  house_no        VARCHAR(20)  DEFAULT '',
  city            VARCHAR(50)  DEFAULT '',
  country         VARCHAR(50)  DEFAULT 'India',
  contact_no      VARCHAR(20)  NOT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── VEHICLE ──────────────────────────────────────────────────
CREATE TABLE vehicle (
  vehicle_id      INT AUTO_INCREMENT PRIMARY KEY,
  plate_no        VARCHAR(20)  NOT NULL UNIQUE,
  model           VARCHAR(100) NOT NULL,
  category        ENUM('Sedan','SUV','Sports','Luxury','Hatchback') NOT NULL DEFAULT 'Sedan',
  mileage         INT          NOT NULL DEFAULT 0,
  condition_state ENUM('Excellent','Good','Fair','Poor') NOT NULL DEFAULT 'Good',
  daily_price     DECIMAL(10,2) NOT NULL,
  availability    ENUM('available','rented','maintenance') NOT NULL DEFAULT 'available',
  managed_by      INT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (managed_by) REFERENCES employee(emp_id) ON DELETE SET NULL
);

-- ─── CUSTOMER ─────────────────────────────────────────────────
CREATE TABLE customer (
  cust_id         INT AUTO_INCREMENT PRIMARY KEY,
  fname           VARCHAR(50)  NOT NULL,
  lname           VARCHAR(50)  NOT NULL,
  house_no        VARCHAR(20)  DEFAULT '',
  city            VARCHAR(50)  DEFAULT '',
  country         VARCHAR(50)  DEFAULT 'India',
  contact_no      VARCHAR(20)  NOT NULL,
  driving_licence VARCHAR(30)  NOT NULL UNIQUE,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── RESERVATION ──────────────────────────────────────────────
CREATE TABLE reservation (
  reserve_id          INT AUTO_INCREMENT PRIMARY KEY,
  cust_id             INT NOT NULL,
  vehicle_id          INT NOT NULL,
  reserve_date        DATE NOT NULL,
  pickup_date         DATE NOT NULL,
  return_date         DATE NOT NULL,
  pickup_location     VARCHAR(100) NOT NULL DEFAULT 'Chennai Central',
  no_of_days          INT GENERATED ALWAYS AS (DATEDIFF(return_date, pickup_date)) STORED,
  cancellation_details VARCHAR(255) DEFAULT NULL,
  status              ENUM('pending','confirmed','cancelled','completed') NOT NULL DEFAULT 'confirmed',
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cust_id)    REFERENCES customer(cust_id) ON DELETE CASCADE,
  FOREIGN KEY (vehicle_id) REFERENCES vehicle(vehicle_id) ON DELETE CASCADE
);

-- ─── RENT ─────────────────────────────────────────────────────
CREATE TABLE rent (
  rent_id             INT AUTO_INCREMENT PRIMARY KEY,
  reserve_id          INT NOT NULL UNIQUE,
  down_pay            DECIMAL(10,2) NOT NULL DEFAULT 0,
  pay_method          ENUM('Cash','Card','UPI','Bank Transfer') NOT NULL DEFAULT 'Card',
  pay_date            DATE NOT NULL,
  refund              DECIMAL(10,2) NOT NULL DEFAULT 0,
  damage_compensation DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_pay           DECIMAL(10,2) NOT NULL,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reserve_id) REFERENCES reservation(reserve_id) ON DELETE CASCADE
);

-- ─── SEED: EMPLOYEES ──────────────────────────────────────────
INSERT INTO employee (fname, lname, salary, joined_date, responsibility, house_no, city, country, contact_no) VALUES
  ('Rajesh',   'Kumar',    55000, '2020-01-15', 'Fleet Manager',      '12A', 'Chennai',   'India', '9841001001'),
  ('Priya',    'Nair',     48000, '2021-03-10', 'Customer Relations', '34B', 'Mumbai',    'India', '9820002002'),
  ('Suresh',   'Menon',    42000, '2022-06-01', 'Vehicle Inspector',  '7C',  'Delhi',     'India', '9811003003'),
  ('Ananya',   'Sharma',   50000, '2019-11-20', 'Branch Head',        '88D', 'Bangalore', 'India', '9900004004'),
  ('Vikram',   'Patel',    38000, '2023-02-14', 'Driver',             '22E', 'Chennai',   'India', '9876005005');

-- ─── SEED: VEHICLES ───────────────────────────────────────────
INSERT INTO vehicle (plate_no, model, category, mileage, condition_state, daily_price, availability, managed_by) VALUES
  ('TN01AB1234', 'BMW 5 Series',      'Luxury',   12000, 'Excellent', 8500.00,  'available',   1),
  ('MH02CD5678', 'Toyota Fortuner',   'SUV',      28000, 'Good',      5200.00,  'available',   2),
  ('TN03EF9012', 'Porsche Cayenne',   'Sports',   5000,  'Excellent', 14000.00, 'available',   1),
  ('DL04GH3456', 'Mercedes E-Class',  'Luxury',   18000, 'Good',      9800.00,  'rented',      4),
  ('KA05IJ7890', 'Honda City',        'Sedan',    45000, 'Good',      2400.00,  'available',   3),
  ('MH06KL1234', 'Range Rover Sport', 'SUV',      8000,  'Excellent', 12500.00, 'available',   2),
  ('DL07MN5678', 'Audi A4',           'Sedan',    32000, 'Good',      6800.00,  'rented',      4),
  ('KA08OP9012', 'Ford Mustang GT',   'Sports',   15000, 'Good',      7500.00,  'available',   3),
  ('TN09QR3456', 'Tesla Model 3',     'Sedan',    3000,  'Excellent', 6200.00,  'available',   1),
  ('KA10ST7890', 'Hyundai Creta',     'SUV',      22000, 'Good',      3100.00,  'available',   3),
  ('MH11UV1234', 'Jaguar XF',         'Luxury',   20000, 'Fair',      11000.00, 'maintenance', 2),
  ('DL12WX5678', 'Mahindra Thar',     'SUV',      18000, 'Good',      3800.00,  'available',   4);

-- ─── SEED: CUSTOMERS ──────────────────────────────────────────
INSERT INTO customer (fname, lname, house_no, city, country, contact_no, driving_licence) VALUES
  ('Arjun',   'Mehta',   '10',  'Chennai',   'India', '9876543210', 'TN0120200012345'),
  ('Priya',   'Menon',   '22',  'Mumbai',    'India', '9820123456', 'MH0220190054321'),
  ('Rahul',   'Verma',   '5A',  'Delhi',     'India', '9811234567', 'DL0120180067890'),
  ('Neha',    'Sharma',  '88',  'Bangalore', 'India', '9900345678', 'KA0520210098765'),
  ('Sneha',   'Iyer',    '33',  'Chennai',   'India', '9841456789', 'TN0220170011223'),
  ('Karan',   'Singh',   '7B',  'Mumbai',    'India', '9820567890', 'MH0320220044556');

-- ─── SEED: RESERVATIONS ───────────────────────────────────────
INSERT INTO reservation (cust_id, vehicle_id, reserve_date, pickup_date, return_date, pickup_location, status) VALUES
  (2, 4, '2026-03-12', '2026-03-14', '2026-03-19', 'Delhi Connaught',   'confirmed'),
  (3, 7, '2026-03-15', '2026-03-17', '2026-03-21', 'Delhi Connaught',   'confirmed'),
  (4, 2, '2026-03-08', '2026-03-10', '2026-03-13', 'Mumbai Airport',    'completed'),
  (1, 5, '2026-02-18', '2026-02-20', '2026-02-25', 'Bangalore MG Road', 'completed'),
  (5, 1, '2026-02-28', '2026-03-01', '2026-03-05', 'Chennai Central',   'completed'),
  (6, 9, '2026-03-20', '2026-03-22', '2026-03-25', 'Chennai Central',   'confirmed');

-- ─── SEED: RENT ───────────────────────────────────────────────
INSERT INTO rent (reserve_id, down_pay, pay_method, pay_date, refund, damage_compensation, total_pay) VALUES
  (1, 10000, 'Card',         '2026-03-14', 0,    0,    57820.00),
  (2, 8000,  'UPI',          '2026-03-17', 0,    0,    32096.00),
  (3, 5000,  'Card',         '2026-03-10', 0,    0,    18408.00),
  (4, 3000,  'Cash',         '2026-02-20', 0,    0,    14160.00),
  (5, 9000,  'Bank Transfer', '2026-03-01', 0,    0,    40120.00),
  (6, 6000,  'Card',         '2026-03-22', 0,    0,    21948.00);

-- ─── VIEWS ────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_available_vehicles AS
  SELECT v.vehicle_id, v.plate_no, v.model, v.category, v.mileage,
         v.condition_state, v.daily_price, e.fname AS manager_fname, e.lname AS manager_lname
  FROM vehicle v LEFT JOIN employee e ON v.managed_by = e.emp_id
  WHERE v.availability = 'available';

CREATE OR REPLACE VIEW v_active_reservations AS
  SELECT r.reserve_id, CONCAT(c.fname,' ',c.lname) AS customer,
         c.contact_no, v.model, v.plate_no,
         r.pickup_date, r.return_date, r.no_of_days,
         r.pickup_location, rt.total_pay, rt.pay_method, r.status
  FROM reservation r
  JOIN customer c   ON r.cust_id    = c.cust_id
  JOIN vehicle v    ON r.vehicle_id = v.vehicle_id
  LEFT JOIN rent rt ON r.reserve_id = rt.reserve_id
  WHERE r.status IN ('confirmed','pending');

CREATE OR REPLACE VIEW v_revenue_summary AS
  SELECT
    COUNT(*)                          AS total_rents,
    IFNULL(SUM(rt.total_pay), 0)     AS gross_revenue,
    IFNULL(SUM(rt.refund), 0)        AS total_refunds,
    IFNULL(SUM(rt.damage_compensation),0) AS damage_collected,
    IFNULL(AVG(rt.total_pay), 0)     AS avg_rent_value
  FROM rent rt
  JOIN reservation r ON rt.reserve_id = r.reserve_id
  WHERE r.status != 'cancelled';

SELECT '✅ rentacar_db ready!' AS status;
SELECT CONCAT(COUNT(*), ' employees') AS employees FROM employee;
SELECT CONCAT(COUNT(*), ' vehicles')  AS vehicles  FROM vehicle;
SELECT CONCAT(COUNT(*), ' customers') AS customers FROM customer;
SELECT CONCAT(COUNT(*), ' reservations') AS reservations FROM reservation;
SELECT CONCAT(COUNT(*), ' rent records')  AS rent_records FROM rent;
