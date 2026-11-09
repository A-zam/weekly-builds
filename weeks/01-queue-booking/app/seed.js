// Demo data: a fictional clinic with four doctors, yesterday's history (so the
// wait-time estimator has real-looking data to learn from) and a live queue today.
// Every name, phone number and complaint here is made up.
const crypto = require('node:crypto');
const { clinicDay } = require('./db');

const DOCTORS = [
  // trueMinutes = how long this doctor's visits "really" take in the demo history,
  // deliberately different from the default so you can see the estimate adapt.
  { name: 'Dilnoza Karimova', specialty: 'Terapevt', room: '104', prefix: 'T', defaultMinutes: 15, trueMinutes: 12 },
  { name: 'Jasur Toshmatov', specialty: 'Pediatr', room: '112', prefix: 'P', defaultMinutes: 15, trueMinutes: 18 },
  { name: 'Malika Rahimova', specialty: 'Kardiolog', room: '207', prefix: 'K', defaultMinutes: 20, trueMinutes: 23 },
  { name: 'Bekzod Yusupov', specialty: 'Nevrolog', room: '211', prefix: 'N', defaultMinutes: 20, trueMinutes: 16 },
];

const NAMES = [
  'Aziz Rahimov', 'Nodira Usmonova', 'Sardor Aliyev', 'Gulnora Saidova', 'Otabek Qodirov',
  'Zarina Ismoilova', 'Rustam Nazarov', 'Shahlo Ergasheva', 'Farrux Xolmatov', "Madina Yo'ldosheva",
  'Behruz Sobirov', 'Kamola Tursunova', 'Javohir Mirzayev', 'Feruza Abdullayeva', "Ulug'bek Hamidov",
  "Sevara Jo'rayeva",
];

const ISSUES = {
  T: ["3 kundan beri bosh og'riyapti", "Harorat 38, yo'tal", "Oshqozon og'rig'i ovqatdan keyin",
      "Tahlil natijalarini ko'rsatish kerak", 'Holsizlik, tez charchash'],
  P: ["Bolada tomoq og'rig'i va isitma", "Bolani emlash oldidan ko'rik", 'Bolada toshma paydo bo\'ldi',
      "Chaqaloq yaxshi uxlamayapti"],
  K: ["Yurak tez-tez urib ketyapti", "Qon bosimi ko'tarilib turibdi", 'Kardiogramma qildirish kerak',
      'Zinadan chiqqanda nafas qisadi'],
  N: ["Bel og'rig'i, egilganda kuchayadi", 'Uyqusizlik va bosh aylanishi', "Qo'l uvishib qolyapti",
      "Bo'yin og'rig'i, kompyuterda ishlagandan keyin"],
};

// Small deterministic PRNG so the demo looks the same on every restart.
function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedDemo(db, now = Date.now()) {
  if (db.listDoctors().length > 0) return false;
  const rand = rng(46);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const around = (mean) => Math.max(3, mean + (rand() + rand() + rand() - 1.5) * mean * 0.5);
  const phone = () => `+99890${String(Math.floor(rand() * 1e7)).padStart(7, '0')}`;
  const MIN = 60_000;
  const today = clinicDay(now);
  const yesterday = clinicDay(now - 24 * 60 * MIN);

  db.tx(() => {
    for (const d of DOCTORS) {
      const doctorId = db.addDoctor(d);
      const add = (day, number, status, created, called, done) =>
        db.insertTicket({
          id: crypto.randomBytes(9).toString('base64url'), doctor_id: doctorId, day, number,
          name: pick(NAMES), phone: phone(), issue: pick(ISSUES[d.prefix]), status,
          created_at: created, called_at: called, done_at: done,
        });

      // Yesterday: 14 finished visits, plus one where staff forgot to press "done" (95 min),
      // which the estimator should ignore.
      let t = now - 24 * 60 * MIN - 8 * 60 * MIN;
      for (let n = 1; n <= 15; n++) {
        const minutes = n === 7 ? 95 : around(d.trueMinutes);
        add(yesterday, n, 'done', t - 30 * MIN, t, t + minutes * MIN);
        t += (minutes + 2) * MIN;
      }

      // Today: 3 done, 1 inside right now, and a few waiting.
      // (work backwards from the current patient so visits never overlap)
      let number = 0;
      const durations = [around(d.trueMinutes), around(d.trueMinutes), around(d.trueMinutes)];
      t = now - 4 * MIN - durations.reduce((a, b) => a + b, 0) * MIN;
      for (const minutes of durations) {
        add(today, ++number, 'done', t - 40 * MIN, t, t + minutes * MIN);
        t += minutes * MIN;
      }
      add(today, ++number, 'called', now - 50 * MIN, now - 4 * MIN, null);
      const waitingCount = 2 + Math.floor(rand() * 4);
      for (let i = 0; i < waitingCount; i++) {
        add(today, ++number, 'waiting', now - (35 - i * 6) * MIN, null, null);
      }
    }
  });
  return true;
}

module.exports = { seedDemo, DOCTORS };
