// HTTP API + static pages + live updates (Server-Sent Events).
const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');
const { openDb, ticketCode, normalizePhone, QueueError } = require('./db');
const { estimateConsultMinutes, estimateWaitMinutes } = require('./eta');
const { seedDemo } = require('./seed');

const ERROR_STATUS = {
  no_doctor: 404, no_ticket: 404, paused: 409, already_booked: 409,
  not_waiting: 409, nobody_inside: 409, invalid: 400,
};

function createApp({ dbPath = ':memory:', demo = true, staffPin = '1234', clinicName = 'Namuna Klinika' } = {}) {
  const db = openDb(dbPath);
  if (demo) seedDemo(db);

  // ---- live updates -------------------------------------------------------
  const clients = new Set();
  let version = 0;
  function broadcast() {
    version++;
    for (const res of clients) res.write(`event: update\ndata: ${version}\n\n`);
  }

  // ---- view models ----------------------------------------------------------
  // Public: what anyone may see. Never includes other patients' personal data.
  function doctorSummary(d, now = Date.now()) {
    const current = db.current(d.id);
    const waiting = db.waiting(d.id);
    const avg = estimateConsultMinutes(d.default_minutes, db.recentDurations(d.id));
    const currentElapsed = current ? (now - current.called_at) / 60000 : null;
    return {
      id: d.id, name: d.name, specialty: d.specialty, room: d.room, paused: !!d.paused,
      avgMinutes: Math.round(avg),
      waitingCount: waiting.length,
      nowServing: current ? ticketCode(d.prefix, current.number) : null,
      waitForNewMinutes: Math.round(estimateWaitMinutes({ avg, peopleAhead: waiting.length, currentElapsed })),
      _avg: avg, _current: current, _waiting: waiting, _currentElapsed: currentElapsed,
    };
  }
  const strip = ({ _avg, _current, _waiting, _currentElapsed, ...pub }) => pub;

  // The patient's own ticket: includes their own details, plus their place in line.
  function ticketView(t) {
    const d = db.getDoctor(t.doctor_id);
    const s = doctorSummary(d);
    const peopleAhead = t.status === 'waiting' ? db.peopleAhead(t) : 0;
    return {
      id: t.id, code: ticketCode(d.prefix, t.number), status: t.status,
      name: t.name, issue: t.issue, createdAt: t.created_at, calledAt: t.called_at,
      doctor: strip(s),
      peopleAhead,
      waitMinutes: t.status === 'waiting'
        ? Math.round(estimateWaitMinutes({ avg: s._avg, peopleAhead, currentElapsed: s._currentElapsed }))
        : null,
    };
  }

  // Staff: full details for running the queue.
  function staffView(d) {
    const s = doctorSummary(d);
    const row = (t) => ({
      id: t.id, code: ticketCode(d.prefix, t.number), name: t.name, phone: t.phone,
      issue: t.issue, createdAt: t.created_at, calledAt: t.called_at,
    });
    return { ...strip(s), current: s._current ? row(s._current) : null, waiting: s._waiting.map(row) };
  }

  // ---- app ------------------------------------------------------------------
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '10kb' }));
  app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));
  app.get('/t/:id', (req, res) => res.sendFile(path.join(__dirname, 'public', 'ticket.html')));

  app.get('/api/clinic', (req, res) => {
    res.json({ name: clinicName, demo, doctors: db.listDoctors().map((d) => strip(doctorSummary(d))) });
  });

  app.post('/api/tickets', (req, res) => {
    const { doctorId, name, phone, issue } = req.body || {};
    const cleanName = String(name || '').trim().replace(/\s+/g, ' ');
    const cleanIssue = String(issue || '').trim();
    const cleanPhone = normalizePhone(phone);
    const fields = {};
    if (cleanName.length < 2 || cleanName.length > 60) fields.name = true;
    if (!cleanPhone) fields.phone = true;
    if (cleanIssue.length < 3 || cleanIssue.length > 500) fields.issue = true;
    if (Object.keys(fields).length) return res.status(400).json({ error: 'invalid', fields });

    const t = db.createTicket({ doctorId: Number(doctorId), name: cleanName, phone: cleanPhone, issue: cleanIssue });
    broadcast();
    res.status(201).json(ticketView(t));
  });

  app.get('/api/tickets/:id', (req, res) => {
    const t = db.getTicket(req.params.id);
    if (!t) throw new QueueError('no_ticket', 'Ticket not found');
    res.json(ticketView(t));
  });

  app.post('/api/tickets/:id/cancel', (req, res) => {
    const t = db.cancelTicket(req.params.id);
    broadcast();
    res.json(ticketView(t));
  });

  app.get('/api/events', (req, res) => {
    res.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders();
    res.write(`retry: 3000\nevent: update\ndata: ${version}\n\n`);
    clients.add(res);
    const ping = setInterval(() => res.write(': ping\n\n'), 25_000);
    req.on('close', () => { clearInterval(ping); clients.delete(res); });
  });

  // ---- staff (PIN-protected) -----------------------------------------------
  const pinBuf = Buffer.from(String(staffPin));
  function requireStaff(req, res, next) {
    const given = Buffer.from(String(req.get('x-staff-pin') || ''));
    const ok = given.length === pinBuf.length && crypto.timingSafeEqual(given, pinBuf);
    if (!ok) return res.status(401).json({ error: 'bad_pin' });
    next();
  }
  app.use('/api/staff', requireStaff);

  app.get('/api/staff/queue', (req, res) => {
    res.json({ name: clinicName, doctors: db.listDoctors().map(staffView) });
  });

  const doctorAction = (fn) => (req, res) => {
    const id = Number(req.params.id);
    if (!db.getDoctor(id)) throw new QueueError('no_doctor', 'Doctor not found');
    fn(id, req.body || {});
    broadcast();
    res.json(staffView(db.getDoctor(id)));
  };
  app.post('/api/staff/doctors/:id/next', doctorAction((id) => db.callNext(id)));
  app.post('/api/staff/doctors/:id/finish', doctorAction((id) => db.finishCurrent(id)));
  app.post('/api/staff/doctors/:id/no-show', doctorAction((id) => db.markNoShow(id)));
  app.post('/api/staff/doctors/:id/pause', doctorAction((id, body) => db.setPaused(id, !!body.paused)));

  // ---- errors ---------------------------------------------------------------
  app.use('/api', (req, res) => res.status(404).json({ error: 'not_found' }));
  app.use((err, req, res, next) => {
    if (err instanceof QueueError) return res.status(ERROR_STATUS[err.code] || 400).json({ error: err.code });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'invalid' });
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  });

  return { app, db, broadcast };
}

module.exports = { createApp };

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  const { app } = createApp({
    dbPath: process.env.DB_PATH || path.join(__dirname, 'navbat.db'),
    demo: process.env.DEMO !== '0',
    staffPin: process.env.STAFF_PIN || '1234',
    clinicName: process.env.CLINIC_NAME || 'Namuna Klinika',
  });
  app.listen(port, () => console.log(`Navbat → http://localhost:${port}  (staff: /staff)`));
}
