// ============================================================
//  Rent-A-Car — Server (ER-Diagram Based)
//  Tables: employee, vehicle, customer, reservation, rent
//  npm install && node server.js
// ============================================================

const express = require('express');
const mysql   = require('mysql2/promise');
const cors    = require('cors');
const path    = require('path');

const app  = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || 'root',
  database:           process.env.DB_NAME     || 'rentacar_db',
  waitForConnections: true,
  connectionLimit:    10,
  decimalNumbers:     true,
});

// ── HEALTH ────────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try { await pool.query('SELECT 1'); res.json({ status: 'ok' }); }
  catch (e) { res.status(500).json({ status: 'error', message: e.message }); }
});

// ── DASHBOARD STATS ───────────────────────────────────────────
app.get('/api/stats', async (req, res) => {
  try {
    const [[{ vehicles }]]     = await pool.query('SELECT COUNT(*) AS vehicles FROM vehicle');
    const [[{ available }]]    = await pool.query("SELECT COUNT(*) AS available FROM vehicle WHERE availability='available'");
    const [[{ customers }]]    = await pool.query('SELECT COUNT(*) AS customers FROM customer');
    const [[{ employees }]]    = await pool.query('SELECT COUNT(*) AS employees FROM employee');
    const [[{ active_res }]]   = await pool.query("SELECT COUNT(*) AS active_res FROM reservation WHERE status IN ('confirmed','pending')");
    const [[{ revenue }]]      = await pool.query("SELECT IFNULL(SUM(rt.total_pay),0) AS revenue FROM rent rt JOIN reservation r ON rt.reserve_id=r.reserve_id WHERE r.status!='cancelled'");
    res.json({ success: true, data: { vehicles, available, customers, employees, active_res, revenue } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── EMPLOYEES ─────────────────────────────────────────────────
app.get('/api/employees', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM employee ORDER BY emp_id');
    res.json({ success: true, data: rows });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/employees/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM employee WHERE emp_id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: rows[0] });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/employees', async (req, res) => {
  const { fname, lname, salary, joined_date, responsibility, house_no, city, country, contact_no } = req.body;
  if (!fname || !lname || !contact_no) return res.status(400).json({ success: false, message: 'fname, lname, contact_no required' });
  try {
    const [r] = await pool.query(
      'INSERT INTO employee (fname,lname,salary,joined_date,responsibility,house_no,city,country,contact_no) VALUES (?,?,?,?,?,?,?,?,?)',
      [fname, lname, salary||0, joined_date||new Date().toISOString().split('T')[0], responsibility||'Staff', house_no||'', city||'', country||'India', contact_no]
    );
    res.status(201).json({ success: true, emp_id: r.insertId });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.put('/api/employees/:id', async (req, res) => {
  const { fname, lname, salary, joined_date, responsibility, house_no, city, country, contact_no } = req.body;
  try {
    await pool.query(
      'UPDATE employee SET fname=?,lname=?,salary=?,joined_date=?,responsibility=?,house_no=?,city=?,country=?,contact_no=? WHERE emp_id=?',
      [fname, lname, salary, joined_date, responsibility, house_no, city, country, contact_no, req.params.id]
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.delete('/api/employees/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM employee WHERE emp_id=?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── VEHICLES ──────────────────────────────────────────────────
app.get('/api/vehicles', async (req, res) => {
  try {
    let sql = `SELECT v.*, CONCAT(e.fname,' ',e.lname) AS manager_name
               FROM vehicle v LEFT JOIN employee e ON v.managed_by=e.emp_id WHERE 1=1`;
    const p = [];
    if (req.query.category)     { sql += ' AND v.category=?';     p.push(req.query.category); }
    if (req.query.availability) { sql += ' AND v.availability=?'; p.push(req.query.availability); }
    sql += ' ORDER BY v.daily_price ASC';
    const [rows] = await pool.query(sql, p);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/vehicles/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT v.*, CONCAT(e.fname,' ',e.lname) AS manager_name FROM vehicle v LEFT JOIN employee e ON v.managed_by=e.emp_id WHERE v.vehicle_id=?`,
      [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: rows[0] });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/vehicles', async (req, res) => {
  const { plate_no, model, category, mileage, condition_state, daily_price, managed_by } = req.body;
  if (!plate_no || !model || !daily_price) return res.status(400).json({ success: false, message: 'plate_no, model, daily_price required' });
  try {
    const [r] = await pool.query(
      'INSERT INTO vehicle (plate_no,model,category,mileage,condition_state,daily_price,managed_by) VALUES (?,?,?,?,?,?,?)',
      [plate_no, model, category||'Sedan', mileage||0, condition_state||'Good', daily_price, managed_by||null]
    );
    res.status(201).json({ success: true, vehicle_id: r.insertId });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.put('/api/vehicles/:id', async (req, res) => {
  const { plate_no, model, category, mileage, condition_state, daily_price, availability, managed_by } = req.body;
  try {
    await pool.query(
      'UPDATE vehicle SET plate_no=?,model=?,category=?,mileage=?,condition_state=?,daily_price=?,availability=?,managed_by=? WHERE vehicle_id=?',
      [plate_no, model, category, mileage, condition_state, daily_price, availability, managed_by||null, req.params.id]
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.delete('/api/vehicles/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM vehicle WHERE vehicle_id=?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── CUSTOMERS ─────────────────────────────────────────────────
app.get('/api/customers', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM customer ORDER BY cust_id DESC');
    res.json({ success: true, data: rows });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/customers/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM customer WHERE cust_id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found' });
    const [reservations] = await pool.query(
      `SELECT r.*, v.model, v.plate_no, rt.total_pay, rt.pay_method FROM reservation r
       JOIN vehicle v ON r.vehicle_id=v.vehicle_id
       LEFT JOIN rent rt ON r.reserve_id=rt.reserve_id
       WHERE r.cust_id=? ORDER BY r.created_at DESC`, [req.params.id]);
    res.json({ success: true, data: rows[0], reservations });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/customers', async (req, res) => {
  const { fname, lname, house_no, city, country, contact_no, driving_licence } = req.body;
  if (!fname || !lname || !contact_no || !driving_licence)
    return res.status(400).json({ success: false, message: 'fname, lname, contact_no, driving_licence required' });
  try {
    const [r] = await pool.query(
      'INSERT INTO customer (fname,lname,house_no,city,country,contact_no,driving_licence) VALUES (?,?,?,?,?,?,?)',
      [fname, lname, house_no||'', city||'', country||'India', contact_no, driving_licence]
    );
    res.status(201).json({ success: true, cust_id: r.insertId });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'Driving licence already registered.' });
    res.status(500).json({ success: false, message: e.message });
  }
});

app.put('/api/customers/:id', async (req, res) => {
  const { fname, lname, house_no, city, country, contact_no, driving_licence } = req.body;
  try {
    await pool.query(
      'UPDATE customer SET fname=?,lname=?,house_no=?,city=?,country=?,contact_no=?,driving_licence=? WHERE cust_id=?',
      [fname, lname, house_no, city, country, contact_no, driving_licence, req.params.id]
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── RESERVATIONS ──────────────────────────────────────────────
app.get('/api/reservations', async (req, res) => {
  try {
    let sql = `SELECT r.*, CONCAT(c.fname,' ',c.lname) AS customer_name, c.contact_no,
               v.model, v.plate_no, v.category, v.daily_price,
               rt.total_pay, rt.pay_method, rt.rent_id
               FROM reservation r
               JOIN customer c ON r.cust_id=c.cust_id
               JOIN vehicle v ON r.vehicle_id=v.vehicle_id
               LEFT JOIN rent rt ON r.reserve_id=rt.reserve_id
               WHERE 1=1`;
    const p = [];
    if (req.query.status) { sql += ' AND r.status=?'; p.push(req.query.status); }
    sql += ' ORDER BY r.created_at DESC';
    const [rows] = await pool.query(sql, p);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/reservations/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.*, CONCAT(c.fname,' ',c.lname) AS customer_name,
       c.contact_no, c.driving_licence, c.city,
       v.model, v.plate_no, v.category, v.daily_price, v.condition_state,
       rt.total_pay, rt.down_pay, rt.pay_method, rt.pay_date, rt.refund, rt.damage_compensation, rt.rent_id
       FROM reservation r
       JOIN customer c ON r.cust_id=c.cust_id
       JOIN vehicle v ON r.vehicle_id=v.vehicle_id
       LEFT JOIN rent rt ON r.reserve_id=rt.reserve_id
       WHERE r.reserve_id=?`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: rows[0] });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST — creates reservation + rent + registers customer if needed
app.post('/api/reservations', async (req, res) => {
  const { fname, lname, house_no, city, country, contact_no, driving_licence,
          vehicle_id, pickup_date, return_date, pickup_location,
          down_pay, pay_method } = req.body;

  if (!fname || !contact_no || !driving_licence || !vehicle_id || !pickup_date || !return_date)
    return res.status(400).json({ success: false, message: 'Missing required fields' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Check vehicle available
    const [veh] = await conn.query('SELECT * FROM vehicle WHERE vehicle_id=? AND availability="available" FOR UPDATE', [vehicle_id]);
    if (!veh.length) { await conn.rollback(); return res.status(409).json({ success: false, message: 'Vehicle not available' }); }

    // Upsert customer by driving licence
    let cust_id;
    const [existing] = await conn.query('SELECT cust_id FROM customer WHERE driving_licence=?', [driving_licence]);
    if (existing.length) {
      cust_id = existing[0].cust_id;
      await conn.query('UPDATE customer SET fname=?,lname=?,contact_no=?,house_no=?,city=?,country=? WHERE cust_id=?',
        [fname, lname||'', contact_no, house_no||'', city||'', country||'India', cust_id]);
    } else {
      const [cr] = await conn.query(
        'INSERT INTO customer (fname,lname,house_no,city,country,contact_no,driving_licence) VALUES (?,?,?,?,?,?,?)',
        [fname, lname||'', house_no||'', city||'', country||'India', contact_no, driving_licence]);
      cust_id = cr.insertId;
    }

    // Create reservation
    const today = new Date().toISOString().split('T')[0];
    const [rr] = await conn.query(
      'INSERT INTO reservation (cust_id,vehicle_id,reserve_date,pickup_date,return_date,pickup_location,status) VALUES (?,?,?,?,?,?,?)',
      [cust_id, vehicle_id, today, pickup_date, return_date, pickup_location||'Chennai Central', 'confirmed']);
    const reserve_id = rr.insertId;

    // Calculate payment
    const days = Math.max(1, Math.ceil((new Date(return_date) - new Date(pickup_date)) / 86400000));
    const subtotal = days * parseFloat(veh[0].daily_price);
    const total_pay = Math.round(subtotal * 1.18 * 100) / 100;

    // Create rent record
    await conn.query(
      'INSERT INTO rent (reserve_id,down_pay,pay_method,pay_date,refund,damage_compensation,total_pay) VALUES (?,?,?,?,0,0,?)',
      [reserve_id, parseFloat(down_pay)||0, pay_method||'Card', today, total_pay]);

    // Mark vehicle rented
    await conn.query('UPDATE vehicle SET availability="rented" WHERE vehicle_id=?', [vehicle_id]);

    await conn.commit();
    res.status(201).json({ success: true, reserve_id, cust_id, total_pay, days });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ success: false, message: e.message });
  } finally { conn.release(); }
});

app.patch('/api/reservations/:id/cancel', async (req, res) => {
  const { cancellation_details } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query('SELECT * FROM reservation WHERE reserve_id=?', [req.params.id]);
    if (!rows.length) { await conn.rollback(); return res.status(404).json({ success: false, message: 'Not found' }); }
    if (rows[0].status === 'cancelled') { await conn.rollback(); return res.status(400).json({ success: false, message: 'Already cancelled' }); }
    await conn.query('UPDATE reservation SET status="cancelled", cancellation_details=? WHERE reserve_id=?',
      [cancellation_details||'Cancelled by customer', req.params.id]);
    await conn.query('UPDATE vehicle SET availability="available" WHERE vehicle_id=?', [rows[0].vehicle_id]);
    await conn.commit();
    res.json({ success: true });
  } catch (e) { await conn.rollback(); res.status(500).json({ success: false, message: e.message }); }
  finally { conn.release(); }
});

app.patch('/api/reservations/:id/complete', async (req, res) => {
  const { damage_compensation, refund } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query('SELECT * FROM reservation WHERE reserve_id=?', [req.params.id]);
    if (!rows.length) { await conn.rollback(); return res.status(404).json({ success: false, message: 'Not found' }); }
    await conn.query('UPDATE reservation SET status="completed" WHERE reserve_id=?', [req.params.id]);
    await conn.query('UPDATE vehicle SET availability="available" WHERE vehicle_id=?', [rows[0].vehicle_id]);
    if (damage_compensation || refund) {
      await conn.query('UPDATE rent SET damage_compensation=?, refund=? WHERE reserve_id=?',
        [damage_compensation||0, refund||0, req.params.id]);
    }
    await conn.commit();
    res.json({ success: true });
  } catch (e) { await conn.rollback(); res.status(500).json({ success: false, message: e.message }); }
  finally { conn.release(); }
});

// ── RENT RECORDS ──────────────────────────────────────────────
app.get('/api/rent', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT rt.*, r.pickup_date, r.return_date, r.no_of_days, r.status AS res_status,
             CONCAT(c.fname,' ',c.lname) AS customer_name,
             v.model, v.plate_no
      FROM rent rt
      JOIN reservation r ON rt.reserve_id=r.reserve_id
      JOIN customer c ON r.cust_id=c.cust_id
      JOIN vehicle v ON r.vehicle_id=v.vehicle_id
      ORDER BY rt.created_at DESC`);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── SQL CONSOLE ───────────────────────────────────────────────
app.post('/api/query', async (req, res) => {
  const { sql } = req.body;
  if (!sql) return res.status(400).json({ success: false, message: 'No SQL provided' });
  const t = sql.trim().toUpperCase();
  if (!t.startsWith('SELECT') && !t.startsWith('SHOW') && !t.startsWith('DESCRIBE'))
    return res.status(403).json({ success: false, message: 'Only SELECT, SHOW, DESCRIBE allowed.' });
  try {
    const [rows] = await pool.query(sql);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (e) { res.status(400).json({ success: false, message: e.message }); }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => {
  console.log(`\n🚗  Rent-A-Car  →  http://localhost:${PORT}`);
  console.log(`🔧  Admin       →  http://localhost:${PORT}/admin.html\n`);
});
