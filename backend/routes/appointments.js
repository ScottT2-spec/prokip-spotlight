const express = require('express');
const router = express.Router();
const db = require('../database');

// POST /api/appointments — Book an appointment
router.post('/', (req, res) => {
  const { client_name, business_name, email, phone, business_address, state, city, appointment_date, appointment_time, notes } = req.body;

  // Validate required fields
  const required = { client_name, business_name, email, phone, business_address, state, city, appointment_date, appointment_time };
  for (const [key, val] of Object.entries(required)) {
    if (!val || !val.trim()) {
      return res.status(400).json({ error: `${key.replace(/_/g, ' ')} is required.` });
    }
  }

  // Validate email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  // Validate phone
  if (!/^[\d\s\-+()]{7,15}$/.test(phone)) {
    return res.status(400).json({ error: 'Invalid phone number.' });
  }

  // Validate date is 25-30
  const day = parseInt(appointment_date.split('-')[2], 10);
  if (day < 25 || day > 30) {
    return res.status(400).json({ error: 'Appointment date must be between the 25th and 30th of the month.' });
  }

  // Validate time slot
  const validTimes = ['8:00 AM','9:00 AM','10:00 AM','11:00 AM','12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM'];
  if (!validTimes.includes(appointment_time)) {
    return res.status(400).json({ error: 'Invalid time slot.' });
  }

  // Check slot availability (unique constraint will also catch this, but better UX)
  const existing = db.prepare(
    'SELECT id FROM appointments WHERE appointment_date = ? AND appointment_time = ? AND LOWER(state) = LOWER(?) AND LOWER(city) = LOWER(?)'
  ).get(appointment_date, appointment_time, state, city);

  if (existing) {
    return res.status(409).json({
      error: 'This time slot has already been selected by another business in your city. Please choose another available time.'
    });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO appointments (client_name, business_name, email, phone, business_address, state, city, appointment_date, appointment_time, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(client_name, business_name, email, phone, business_address, state, city, appointment_date, appointment_time, notes || '');

    res.status(201).json({
      message: 'Appointment booked successfully.',
      id: result.lastInsertRowid
    });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({
        error: 'This time slot has already been selected by another business in your city. Please choose another available time.'
      });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// GET /api/appointments/check-slot — Check if a slot is available
router.get('/check-slot', (req, res) => {
  const { date, time, state, city } = req.query;

  if (!date || !time || !state || !city) {
    return res.status(400).json({ error: 'date, time, state, and city are required.' });
  }

  const existing = db.prepare(
    'SELECT id FROM appointments WHERE appointment_date = ? AND appointment_time = ? AND LOWER(state) = LOWER(?) AND LOWER(city) = LOWER(?)'
  ).get(date, time, state, city);

  res.json({ available: !existing });
});

module.exports = router;
