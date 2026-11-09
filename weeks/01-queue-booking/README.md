# Week 01: QueueUp

> A virtual queue for walk-in businesses. Customers scan a QR code, take a ticket, and wait wherever they like while watching their live position and wait time.

**Category:** Real-life · **Mode:** 🤖 Autopilot · **Dates:** Mon Nov 9 – Sun Nov 15, 2026

**▶ Demo:** _ships Sunday_

## The problem
Barbershops, clinics, phone repair shops and government offices all have the same failure: customers stand in a crowded room for 40 minutes with no idea how long is left, some give up and leave, and staff keep answering "how much longer?". Paper numbers solve fairness but not the waiting. You still have to stay in the room to hear your number.

## The product: three screens

| Screen | Who uses it | What it does |
|--------|-------------|--------------|
| **Join** (`/q/<shop>`) | Customer, via QR code at the door | Enter name, pick a service → get ticket **A-014** |
| **Ticket** (`/t/<id>`) | Customer, on their phone | Live: "You're **3rd** · about **12 min**". Alerts when they're next and when they're called. Cancel button. |
| **Staff** (`/staff/<shop>`) | Shop staff, on a tablet or laptop | Queue list, **Call next**, mark served / no-show, pause the queue |
| **Display** (`/display/<shop>`) *(stretch)* | TV in the waiting room | Big "Now serving A-012" board plus the QR code to join |

## MVP scope (set on Monday)
**In:**
- [ ] Customer joins the queue from a link or QR code, no account or app needed
- [ ] Ticket page with live position and estimated wait, updating in real time
- [ ] "You're next" and "It's your turn" alerts (sound, vibration, browser notification)
- [ ] Staff dashboard: call next, served, no-show, pause/resume
- [ ] **Wait-time estimate learned from the shop's real service times** (rolling average per service, not a hard-coded guess)
- [ ] Works well on a phone
- [ ] Demo shop with seeded data, so anyone can try it in 30 seconds

**Out (on purpose):**
- Time-slot appointments (a different product; it could be a future week)
- SMS / WhatsApp notifications (they need paid accounts; browser alerts cover the MVP)
- Payments, staff logins with roles, several branches per business
- Native mobile app

## Stack (proposed)
- **Backend:** Node.js + Express + SQLite. One small server, one file-based database.
- **Real-time:** Server-Sent Events, so ticket pages update without refreshing.
- **Frontend:** plain HTML/CSS/JS served by the same server, with no build step.
- **Hosting:** decided on Friday: Render free tier for a live link, or one-command local run.

## Run it locally
```bash
# coming Tuesday
```

## Who did what
| | |
|---|---|
| **Human decisions** | Chose the problem (real-life category). Product-owner calls: _see journal_ |
| **Delegated to AI** | _filled in as we go_ |
| **Verification** | _filled in as we go_ |
| **Where AI was wrong** | _filled in as we go_ |

## What's missing / next
- _Sunday_
