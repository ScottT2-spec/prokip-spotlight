const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { authMiddleware } = require('../middleware');

// POST /api/admin/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const admin = db.prepare('SELECT * FROM admin_users WHERE email = ?').get(email);
  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = jwt.sign(
    { id: admin.id, name: admin.name, email: admin.email },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    token,
    admin: { id: admin.id, name: admin.name, email: admin.email }
  });
});

// GET /api/admin/appointments — List all with filters
router.get('/appointments', authMiddleware, (req, res) => {
  const { date, state, city, search, page = 1, limit = 100 } = req.query;

  let where = [];
  let params = [];

  if (date) { where.push('appointment_date = ?'); params.push(date); }
  if (state) { where.push('state = ?'); params.push(state); }
  if (city) { where.push('city = ?'); params.push(city); }
  if (search) {
    where.push('(LOWER(client_name) LIKE ? OR LOWER(business_name) LIKE ? OR LOWER(email) LIKE ? OR phone LIKE ?)');
    const s = `%${search.toLowerCase()}%`;
    params.push(s, s, s, s);
  }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

  // Get total count
  const countRow = db.prepare(`SELECT COUNT(*) as total FROM appointments ${whereClause}`).get(...params);

  // Get paginated results
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const appointments = db.prepare(
    `SELECT * FROM appointments ${whereClause} ORDER BY appointment_date, appointment_time LIMIT ? OFFSET ?`
  ).all(...params, parseInt(limit), offset);

  res.json({
    appointments,
    total: countRow.total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(countRow.total / parseInt(limit))
  });
});

// GET /api/admin/appointments/stats — Summary stats
router.get('/appointments/stats', authMiddleware, (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM appointments').get().count;
  const states = db.prepare('SELECT COUNT(DISTINCT state) as count FROM appointments').get().count;
  const cities = db.prepare('SELECT COUNT(DISTINCT city || state) as count FROM appointments').get().count;

  const busiest = db.prepare(`
    SELECT city || ', ' || state as location, COUNT(*) as count
    FROM appointments
    GROUP BY city, state
    ORDER BY count DESC
    LIMIT 1
  `).get();

  res.json({
    totalAppointments: total,
    totalStates: states,
    totalCities: cities,
    busiestCity: busiest ? { name: busiest.location, count: busiest.count } : null
  });
});

// GET /api/admin/appointments/grouped — Grouped by city
router.get('/appointments/grouped', authMiddleware, (req, res) => {
  const appointments = db.prepare(
    'SELECT * FROM appointments ORDER BY state, city, appointment_date, appointment_time'
  ).all();

  const grouped = {};
  appointments.forEach(a => {
    const key = `${a.city}, ${a.state}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(a);
  });

  res.json({ grouped });
});

// GET /api/admin/appointments/export — CSV export
router.get('/appointments/export', authMiddleware, (req, res) => {
  const { date, state, city, search } = req.query;

  let where = [];
  let params = [];
  if (date) { where.push('appointment_date = ?'); params.push(date); }
  if (state) { where.push('state = ?'); params.push(state); }
  if (city) { where.push('city = ?'); params.push(city); }
  if (search) {
    where.push('(LOWER(client_name) LIKE ? OR LOWER(business_name) LIKE ? OR LOWER(email) LIKE ? OR phone LIKE ?)');
    const s = `%${search.toLowerCase()}%`;
    params.push(s, s, s, s);
  }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const appointments = db.prepare(
    `SELECT * FROM appointments ${whereClause} ORDER BY appointment_date, appointment_time`
  ).all(...params);

  const headers = ['Name','Business Name','Email','Phone','Address','State','City','Date','Time'];
  let csv = headers.join(',') + '\n';
  appointments.forEach(a => {
    const row = [a.client_name, a.business_name, a.email, a.phone, a.business_address, a.state, a.city, a.appointment_date, a.appointment_time];
    csv += row.map(v => `"${(v || '').replace(/"/g, '""')}"`).join(',') + '\n';
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=prokip-appointments-${new Date().toISOString().slice(0,10)}.csv`);
  res.send(csv);
});

// DELETE /api/admin/appointments/:id
router.delete('/appointments/:id', authMiddleware, (req, res) => {
  const result = db.prepare('DELETE FROM appointments WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Appointment not found.' });
  }
  res.json({ message: 'Appointment deleted.' });
});

// GET /api/admin/filters — Get unique filter values
router.get('/filters', authMiddleware, (req, res) => {
  const dates = db.prepare('SELECT DISTINCT appointment_date FROM appointments ORDER BY appointment_date').all().map(r => r.appointment_date);
  const states = db.prepare('SELECT DISTINCT state FROM appointments ORDER BY state').all().map(r => r.state);
  const cities = db.prepare('SELECT DISTINCT city FROM appointments ORDER BY city').all().map(r => r.city);
  res.json({ dates, states, cities });
});

module.exports = router;
