const express = require('express');
const Train = require('../models/Train');

const router = express.Router();

// GET /api/trains?from=Lucknow&to=Delhi
router.get('/', async (req, res) => {
  try {
    const { from, to } = req.query;
    const filter = {};
    if (from) filter.from = new RegExp(`^${from}$`, 'i');
    if (to) filter.to = new RegExp(`^${to}$`, 'i');

    const trains = await Train.find(filter).sort({ departure: 1 });
    res.json(trains);
  } catch (err) {
    res.status(500).json({ message: 'Could not load trains.', error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const train = await Train.findById(req.params.id);
    if (!train) return res.status(404).json({ message: 'Train not found.' });
    res.json(train);
  } catch (err) {
    res.status(500).json({ message: 'Could not load train.', error: err.message });
  }
});

module.exports = router;
