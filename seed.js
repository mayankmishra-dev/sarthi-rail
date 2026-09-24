require('dotenv').config();
const mongoose = require('mongoose');
const Train = require('./models/Train');

const trains = [
  {
    number: '12420', name: 'Gomti Superfast Express', from: 'Lucknow', to: 'Delhi',
    departure: '06:10', arrival: '14:35', duration: '8h 25m',
    classes: [
      { code: 'SL', label: 'Sleeper', fare: 435, totalSeats: 72, bookedSeats: 0 },
      { code: '3A', label: 'AC 3-Tier', fare: 1120, totalSeats: 64, bookedSeats: 0 },
      { code: '2A', label: 'AC 2-Tier', fare: 1610, totalSeats: 46, bookedSeats: 0 }
    ]
  },
  {
    number: '12004', name: 'Lucknow Shatabdi', from: 'Lucknow', to: 'Delhi',
    departure: '15:20', arrival: '21:35', duration: '6h 15m',
    classes: [
      { code: 'CC', label: 'AC Chair Car', fare: 890, totalSeats: 78, bookedSeats: 0 },
      { code: 'EC', label: 'Executive Chair Car', fare: 1650, totalSeats: 44, bookedSeats: 0 }
    ]
  },
  {
    number: '12554', name: 'Vaishali Express', from: 'Delhi', to: 'Lucknow',
    departure: '19:40', arrival: '05:10', duration: '9h 30m',
    classes: [
      { code: 'SL', label: 'Sleeper', fare: 410, totalSeats: 72, bookedSeats: 0 },
      { code: '3A', label: 'AC 3-Tier', fare: 1080, totalSeats: 64, bookedSeats: 0 }
    ]
  },
  {
    number: '12276', name: 'Mumbai Duronto', from: 'Mumbai', to: 'Delhi',
    departure: '23:15', arrival: '18:05', duration: '18h 50m',
    classes: [
      { code: '3A', label: 'AC 3-Tier', fare: 1980, totalSeats: 64, bookedSeats: 0 },
      { code: '2A', label: 'AC 2-Tier', fare: 2850, totalSeats: 46, bookedSeats: 0 },
      { code: '1A', label: 'AC First Class', fare: 4750, totalSeats: 18, bookedSeats: 0 }
    ]
  },
  {
    number: '12309', name: 'Rajdhani Express', from: 'Patna', to: 'Delhi',
    departure: '17:05', arrival: '09:55', duration: '16h 50m',
    classes: [
      { code: '3A', label: 'AC 3-Tier', fare: 1750, totalSeats: 64, bookedSeats: 0 },
      { code: '2A', label: 'AC 2-Tier', fare: 2510, totalSeats: 46, bookedSeats: 0 }
    ]
  },
  {
    number: '22691', name: 'Rajdhani Express', from: 'Bengaluru', to: 'Delhi',
    departure: '20:00', arrival: '05:30', duration: '33h 30m',
    classes: [
      { code: '3A', label: 'AC 3-Tier', fare: 2450, totalSeats: 64, bookedSeats: 0 },
      { code: '2A', label: 'AC 2-Tier', fare: 3520, totalSeats: 46, bookedSeats: 0 }
    ]
  }
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected. Seeding trains...');
  await Train.deleteMany({});
  await Train.insertMany(trains);
  console.log(`Inserted ${trains.length} trains.`);
  await mongoose.disconnect();
  console.log('Done.');
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
