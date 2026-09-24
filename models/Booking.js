const mongoose = require('mongoose');

const passengerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dob: { type: String, required: true },
  gender: { type: String, required: true, enum: ['Male', 'Female', 'Other'] },
  seatNumber: { type: Number }
}, { _id: false });

const bookingSchema = new mongoose.Schema({
  pnr: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  train: { type: mongoose.Schema.Types.ObjectId, ref: 'Train', required: true },
  trainNumber: String,
  trainName: String,
  from: String,
  to: String,
  journeyDate: { type: String, required: true },
  classCode: { type: String, required: true },
  passengers: [passengerSchema],
  fareTotal: { type: Number, required: true },
  status: { type: String, enum: ['CONFIRMED', 'CANCELLED'], default: 'CONFIRMED' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);
