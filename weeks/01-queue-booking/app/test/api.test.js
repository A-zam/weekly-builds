const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../server');

// Spins up the real app on a random port with an in-memory DB and no demo data.
async function start() {
  const { app, db } = createApp({ dbPath: ':memory:', demo: false, staffPin: '9999', clinicName: 'Test' });
  const doctorId = db.addDoctor({ name: 'Dr Test', specialty: 'Terapevt', room: '1', prefix: 'T', defaultMinutes: 10 });
  const server = await new Promise((r) => { const s = app.listen(0, () => r(s)); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (path, { method = 'GET', body, pin } = {}) => {
    const headers = { 'content-type': 'application/json' };
    if (pin) headers['x-staff-pin'] = pin;
    const res = await fetch(base + path, { method, headers, body: body && JSON.stringify(body) });
    return { status: res.status, data: await res.json() };
  };
  return { server, db, doctorId, call };
}

const patient = (doctorId, phone, extra = {}) =>
  ({ doctorId, name: 'Aziz Rahimov', phone, issue: "Bosh og'rig'i", ...extra });

test('full queue flow: book → position → call → done', async (t) => {
  const { server, doctorId, call } = await start();
  t.after(() => server.close());

  const a = await call('/api/tickets', { method: 'POST', body: patient(doctorId, '90 111 11 11') });
  const b = await call('/api/tickets', { method: 'POST', body: patient(doctorId, '+998 90 222-22-22') });
  assert.equal(a.status, 201);
  assert.equal(a.data.code, 'T-001');
  assert.equal(b.data.code, 'T-002');
  assert.equal(b.data.peopleAhead, 1);
  assert.equal(b.data.waitMinutes, 10);

  const next = await call(`/api/staff/doctors/${doctorId}/next`, { method: 'POST', pin: '9999' });
  assert.equal(next.data.current.code, 'T-001');

  const aNow = await call(`/api/tickets/${a.data.id}`);
  assert.equal(aNow.data.status, 'called');
  const bNow = await call(`/api/tickets/${b.data.id}`);
  assert.equal(bNow.data.peopleAhead, 0);

  // "Call next" again finishes T-001 and calls T-002.
  await call(`/api/staff/doctors/${doctorId}/next`, { method: 'POST', pin: '9999' });
  assert.equal((await call(`/api/tickets/${a.data.id}`)).data.status, 'done');
  assert.equal((await call(`/api/tickets/${b.data.id}`)).data.status, 'called');
});

test('one active booking per phone number', async (t) => {
  const { server, doctorId, call } = await start();
  t.after(() => server.close());
  await call('/api/tickets', { method: 'POST', body: patient(doctorId, '901234567') });
  const dup = await call('/api/tickets', { method: 'POST', body: patient(doctorId, '+998901234567') });
  assert.equal(dup.status, 409);
  assert.equal(dup.data.error, 'already_booked');
});

test('validation rejects bad name, phone and empty complaint', async (t) => {
  const { server, doctorId, call } = await start();
  t.after(() => server.close());
  const r = await call('/api/tickets', { method: 'POST', body: { doctorId, name: 'A', phone: '123', issue: '' } });
  assert.equal(r.status, 400);
  assert.deepEqual(r.data.fields, { name: true, phone: true, issue: true });
});

test('paused doctor takes no new bookings', async (t) => {
  const { server, doctorId, call } = await start();
  t.after(() => server.close());
  await call(`/api/staff/doctors/${doctorId}/pause`, { method: 'POST', pin: '9999', body: { paused: true } });
  const r = await call('/api/tickets', { method: 'POST', body: patient(doctorId, '901234567') });
  assert.equal(r.status, 409);
  assert.equal(r.data.error, 'paused');
});

test('cancel frees the place in line', async (t) => {
  const { server, doctorId, call } = await start();
  t.after(() => server.close());
  const a = await call('/api/tickets', { method: 'POST', body: patient(doctorId, '901111111') });
  const b = await call('/api/tickets', { method: 'POST', body: patient(doctorId, '902222222') });
  await call(`/api/tickets/${a.data.id}/cancel`, { method: 'POST' });
  assert.equal((await call(`/api/tickets/${b.data.id}`)).data.peopleAhead, 0);
});

test('staff API needs the PIN', async (t) => {
  const { server, call } = await start();
  t.after(() => server.close());
  assert.equal((await call('/api/staff/queue')).status, 401);
  assert.equal((await call('/api/staff/queue', { pin: '0000' })).status, 401);
  assert.equal((await call('/api/staff/queue', { pin: '9999' })).status, 200);
});

test('public endpoints never expose other patients\' personal data', async (t) => {
  const { server, doctorId, call } = await start();
  t.after(() => server.close());
  await call('/api/tickets', { method: 'POST', body: patient(doctorId, '901111111', { name: 'Secret Person' }) });
  const pub = JSON.stringify((await call('/api/clinic')).data);
  assert.ok(!pub.includes('Secret Person'));
  assert.ok(!pub.includes('901111111'));
});
