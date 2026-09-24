const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  code: { type: String, required: true },   // SL, 3A, 2A, 1A
  label: { type: String, required: true },  // Sleeper, AC 3-Tier, ...
  fare: { type: Number, required: true },
  totalSeats: { type: Number, required: true },
  bookedSeats: { type: Number, default: 0 }
}, { _id: false });

const trainSchema = new mongoose.Schema({
  number: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  departure: { type: String, required: true }, // "06:10"
  arrival: { type: String, required: true },   // "14:35"
  duration: { type: String, required: true },  // "8h 25m"
  runsOn: { type: [String], default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
  classes: [classSchema]
});

module.exports = mongoose.model('Train', trainSchema);
