// Data layer: SQLite via Node's built-in node:sqlite. All queue rules live here.
const { DatabaseSync } = require('node:sqlite');
const crypto = require('node:crypto');

const TZ = 'Asia/Tashkent';
const ACTIVE = ['waiting', 'called'];

// "Today" is the clinic's local date, so numbering restarts at midnight in Tashkent.
function clinicDay(ms = Date.now()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date(ms));
}

function ticketCode(prefix, number) {
  return `${prefix}-${String(number).padStart(3, '0')}`;
}

// Accepts "90 123 45 67", "+998 90 123-45-67", "998901234567" → "+998901234567"
function normalizePhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 9) return `+998${digits}`;
  if (digits.length === 12 && digits.startsWith('998')) return `+${digits}`;
  return null;
}

class QueueError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

function openDb(path = ':memory:') {
  const db = new DatabaseSync(path);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS doctors (
      id              INTEGER PRIMARY KEY,
      name            TEXT NOT NULL,
      specialty       TEXT NOT NULL,
      room            TEXT NOT NULL,
      prefix          TEXT NOT NULL UNIQUE,
      default_minutes INTEGER NOT NULL,
      paused          INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS tickets (
      id         TEXT PRIMARY KEY,           -- random, unguessable: it is the patient's access key
      doctor_id  INTEGER NOT NULL REFERENCES doctors(id),
      day        TEXT NOT NULL,              -- clinic-local YYYY-MM-DD
      number     INTEGER NOT NULL,           -- per doctor per day: T-001, T-002, ...
      name       TEXT NOT NULL,
      phone      TEXT NOT NULL,
      issue      TEXT NOT NULL,
      status     TEXT NOT NULL DEFAULT 'waiting'
                 CHECK (status IN ('waiting','called','done','no_show','cancelled')),
      created_at INTEGER NOT NULL,
      called_at  INTEGER,
      done_at    INTEGER,
      UNIQUE (doctor_id, day, number)
    );
    CREATE INDEX IF NOT EXISTS idx_queue ON tickets (doctor_id, day, status, number);
    CREATE INDEX IF NOT EXISTS idx_phone ON tickets (phone, day, status);
  `);

  const q = {
    doctors: db.prepare('SELECT * FROM doctors ORDER BY id'),
    doctor: db.prepare('SELECT * FROM doctors WHERE id = ?'),
    ticket: db.prepare('SELECT * FROM tickets WHERE id = ?'),
    current: db.prepare(
      "SELECT * FROM tickets WHERE doctor_id = ? AND day = ? AND status = 'called' ORDER BY called_at DESC LIMIT 1"
    ),
    waiting: db.prepare(
      "SELECT * FROM tickets WHERE doctor_id = ? AND day = ? AND status = 'waiting' ORDER BY number"
    ),
    ahead: db.prepare(
      "SELECT COUNT(*) AS n FROM tickets WHERE doctor_id = ? AND day = ? AND status = 'waiting' AND number < ?"
    ),
    activeByPhone: db.prepare(
      "SELECT id FROM tickets WHERE phone = ? AND day = ? AND status IN ('waiting','called') LIMIT 1"
    ),
    maxNumber: db.prepare('SELECT COALESCE(MAX(number), 0) AS n FROM tickets WHERE doctor_id = ? AND day = ?'),
    durations: db.prepare(
      `SELECT (done_at - called_at) / 60000.0 AS minutes FROM tickets
       WHERE doctor_id = ? AND status = 'done' AND called_at IS NOT NULL AND done_at IS NOT NULL
       ORDER BY done_at DESC LIMIT ?`
    ),
    insertTicket: db.prepare(
      `INSERT INTO tickets (id, doctor_id, day, number, name, phone, issue, status, created_at, called_at, done_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ),
    setStatus: db.prepare('UPDATE tickets SET status = ?, called_at = COALESCE(?, called_at), done_at = COALESCE(?, done_at) WHERE id = ?'),
    setPaused: db.prepare('UPDATE doctors SET paused = ? WHERE id = ?'),
    insertDoctor: db.prepare(
      'INSERT INTO doctors (name, specialty, room, prefix, default_minutes) VALUES (?, ?, ?, ?, ?)'
    ),
  };

  function tx(fn) {
    db.exec('BEGIN IMMEDIATE');
    try {
      const out = fn();
      db.exec('COMMIT');
      return out;
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
  }

  const api = {
    raw: db,
    q,
    tx,

    listDoctors: () => q.doctors.all(),
    getDoctor: (id) => q.doctor.get(id),
    getTicket: (id) => q.ticket.get(id),
    current: (doctorId, day = clinicDay()) => q.current.get(doctorId, day),
    waiting: (doctorId, day = clinicDay()) => q.waiting.all(doctorId, day),
    peopleAhead: (t) => q.ahead.get(t.doctor_id, t.day, t.number).n,
    recentDurations: (doctorId, limit = 20) => q.durations.all(doctorId, limit).map((r) => r.minutes),

    addDoctor: ({ name, specialty, room, prefix, defaultMinutes }) =>
      Number(q.insertDoctor.run(name, specialty, room, prefix, defaultMinutes).lastInsertRowid),

    // Low-level insert used by the demo seeder (lets it write history with past timestamps).
    insertTicket: (t) =>
      q.insertTicket.run(t.id, t.doctor_id, t.day, t.number, t.name, t.phone, t.issue, t.status,
        t.created_at, t.called_at ?? null, t.done_at ?? null),

    createTicket({ doctorId, name, phone, issue }, now = Date.now()) {
      const doctor = q.doctor.get(doctorId);
      if (!doctor) throw new QueueError('no_doctor', 'Doctor not found');
      if (doctor.paused) throw new QueueError('paused', 'This doctor is not taking new patients right now');
      const day = clinicDay(now);
      return tx(() => {
        if (q.activeByPhone.get(phone, day)) {
          throw new QueueError('already_booked', 'This phone number already has an active booking today');
        }
        const number = q.maxNumber.get(doctorId, day).n + 1;
        const id = crypto.randomBytes(9).toString('base64url');
        q.insertTicket.run(id, doctorId, day, number, name, phone, issue, 'waiting', now, null, null);
        return q.ticket.get(id);
      });
    },

    cancelTicket(id) {
      const t = q.ticket.get(id);
      if (!t) throw new QueueError('no_ticket', 'Ticket not found');
      if (t.status !== 'waiting') throw new QueueError('not_waiting', 'Only a waiting ticket can be cancelled');
      q.setStatus.run('cancelled', null, null, id);
      return q.ticket.get(id);
    },

    // One button for the doctor: finishes the patient inside (if any) and calls the next one.
    callNext(doctorId, now = Date.now()) {
      const day = clinicDay(now);
      return tx(() => {
        const cur = q.current.get(doctorId, day);
        if (cur) q.setStatus.run('done', null, now, cur.id);
        const next = q.waiting.get(doctorId, day);
        if (next) q.setStatus.run('called', now, null, next.id);
        return next ? q.ticket.get(next.id) : null;
      });
    },

    finishCurrent(doctorId, now = Date.now()) {
      const cur = q.current.get(doctorId, clinicDay(now));
      if (!cur) throw new QueueError('nobody_inside', 'No patient is currently called');
      q.setStatus.run('done', null, now, cur.id);
      return q.ticket.get(cur.id);
    },

    markNoShow(doctorId, now = Date.now()) {
      const cur = q.current.get(doctorId, clinicDay(now));
      if (!cur) throw new QueueError('nobody_inside', 'No patient is currently called');
      q.setStatus.run('no_show', null, now, cur.id);
      return q.ticket.get(cur.id);
    },

    setPaused(doctorId, paused) {
      if (!q.doctor.get(doctorId)) throw new QueueError('no_doctor', 'Doctor not found');
      q.setPaused.run(paused ? 1 : 0, doctorId);
      return q.doctor.get(doctorId);
    },
  };
  return api;
}

module.exports = { openDb, clinicDay, ticketCode, normalizePhone, QueueError, ACTIVE, TZ };
