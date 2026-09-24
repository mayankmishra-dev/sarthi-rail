website_link= https://sarthi-rail-1.onrender.com/

# Sarthi Rail

A railway ticket booking system (IRCTC-style) built with plain HTML/CSS/JS on the
front end and Node.js + Express + MongoDB on the back end.

## Features

- **Account creation & login** — passwords are hashed with bcrypt (12 salt rounds)
  before they're ever written to MongoDB; the database never stores plaintext.
- **JWT-based sessions** — the API is stateless; the token is kept in `localStorage`
  and sent as a Bearer token on every request.
- **Train search & listing** — search by "from"/"to" station, see fare and live
  seat availability per class (Sleeper, AC 3-Tier, AC 2-Tier, AC First, Chair Car).
- **Seat booking** — add up to 6 passengers per booking (name, date of birth,
  gender), get a generated PNR and assigned seat numbers, with an atomic
  MongoDB update so two people can't overbook the same last seat.
- **Cancellation** — cancel a booking from "My bookings"; seats are released back
  to the train automatically.

## Requirements

- Node.js 18+
- A MongoDB instance — either local (`mongod`) or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster.

## Setup

```bash
cd sarthi-rail
npm install
cp .env.example .env
```

Edit `.env` and set:

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/sarthi_rail   # or your Atlas connection string
JWT_SECRET=some-long-random-string
```

Seed a handful of sample trains (Lucknow–Delhi, Mumbai–Delhi, etc.):

```bash
npm run seed
```

Start the server:

```bash
npm start
```

Open **http://localhost:5000** — that's it, the Express server also serves the
front end from `/public`, so there's nothing separate to run for the UI.

## Project structure

```
sarthi-rail/
├── server.js              # Express app entry point
├── seed.js                 # Sample train data
├── models/
│   ├── User.js              # bcrypt password hashing lives here
│   ├── Train.js              # per-class seat inventory
│   └── Booking.js            # passengers, PNR, status
├── routes/
│   ├── auth.js               # register / login
│   ├── trains.js              # list / search / get one
│   └── bookings.js             # book / cancel / my bookings
├── middleware/
│   └── auth.js                  # verifies the JWT on protected routes
└── public/
    ├── index.html               # login + register
    ├── dashboard.html            # search, train list, my bookings
    ├── css/style.css              # ticket-stub visual design
    └── js/
        ├── auth.js                 # login/register form logic
        └── dashboard.js             # booking flow, cancellation
```

## Notes on the encryption requirement

Passwords are **hashed**, not reversibly encrypted — this is the correct and
standard approach for storing credentials (it's what IRCTC, banks, etc.
actually do). Hashing means even Sarthi Rail itself can never recover a
user's original password, only verify a guess against the stored hash. This
happens in `models/User.js` via a Mongoose `pre('save')` hook using bcrypt.

## Extending it

- Add real payment integration before "Confirm booking".
- Add an admin view (protect with a `role` field on `User`) to add/edit trains.
- Add email/SMS notifications on booking and cancellation.
- Swap `localStorage` token storage for an httpOnly cookie if you deploy this
  publicly, to reduce XSS exposure.
