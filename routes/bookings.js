const express = require('express');
const Train = require('../models/Train');
const Booking = require('../models/Booking');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

function generatePNR() {
  return Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join('');
}

// POST /api/bookings  { trainId, journeyDate, classCode, passengers: [{name, dob, gender}] }
router.post('/', async (req, res) => {
  try {
    const { trainId, journeyDate, classCode, passengers } = req.body;

    if (!trainId || !journeyDate || !classCode || !Array.isArray(passengers) || passengers.length === 0) {
      return res.status(400).json({ message: 'Train, date, class and at least one passenger are required.' });
    }
    if (passengers.length > 6) {
      return res.status(400).json({ message: 'A single booking allows up to 6 passengers.' });
    }
    for (const p of passengers) {
      if (!p.name || !p.dob || !p.gender) {
        return res.status(400).json({ message: 'Each passenger needs a name, date of birth and gender.' });
      }
    }

    const train = await Train.findById(trainId);
    if (!train) return res.status(404).json({ message: 'Train not found.' });

    const klass = train.classes.find(c => c.code === classCode);
    if (!klass) return res.status(400).json({ message: 'Selected class is not available on this train.' });

    const seatsNeeded = passengers.length;
    const seatsLeft = klass.totalSeats - klass.bookedSeats;
    if (seatsLeft < seatsNeeded) {
      return res.status(409).json({ message: `Only ${seatsLeft} seat(s) left in ${klass.label}.` });
    }

    // Atomic guard: only increments if enough seats are still free at write time,
    // so two simultaneous bookings can't both succeed past capacity.
    const maxAllowedBooked = klass.totalSeats - seatsNeeded;
    const result = await Train.findOneAndUpdate(
  {
    _id: trainId,
    classes: { $elemMatch: { code: classCode, bookedSeats: { $lte: maxAllowedBooked } } }
  },
  { $inc: { 'classes.$.bookedSeats': seatsNeeded } },
  { new: true }
  );

    if (!result) {
      return res.status(409).json({ message: 'Seats just sold out in this class. Please try another class or train.' });
    }

    const updatedKlass = result.classes.find(c => c.code === classCode);
    const startSeat = updatedKlass.bookedSeats - seatsNeeded + 1;
    const seatedPassengers = passengers.map((p, i) => ({
      name: p.name,
      dob: p.dob,
      gender: p.gender,
      seatNumber: startSeat + i
    }));

    const booking = await Booking.create({
      pnr: generatePNR(),
      user: req.userId,
      train: train._id,
      trainNumber: train.number,
      trainName: train.name,
      from: train.from,
      to: train.to,
      journeyDate,
      classCode,
      passengers: seatedPassengers,
      fareTotal: klass.fare * seatsNeeded,
      status: 'CONFIRMED'
    });

    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ message: 'Booking failed.', error: err.message });
  }
});

// GET /api/bookings/mine
router.get('/mine', async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Could not load bookings.', error: err.message });
  }
});

// POST /api/bookings/:id/cancel
router.post('/:id/cancel', async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, user: req.userId });
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });
    if (booking.status === 'CANCELLED') {
      return res.status(400).json({ message: 'This booking is already cancelled.' });
    }

    booking.status = 'CANCELLED';
    await booking.save();

    // Release the seats back to the train's inventory.
    await Train.findOneAndUpdate(
      { _id: booking.train, 'classes.code': booking.classCode },
      { $inc: { 'classes.$.bookedSeats': -booking.passengers.length } }
    );

    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: 'Cancellation failed.', error: err.message });
  }
});

module.exports = router;
