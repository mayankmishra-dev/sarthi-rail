const API = '/api';
const token = localStorage.getItem('sr_token');
const userRaw = localStorage.getItem('sr_user');

if (!token || !userRaw) {
  window.location.href = 'index.html';
}
const user = JSON.parse(userRaw);
document.getElementById('userName').textContent = user.name;

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('sr_token');
  localStorage.removeItem('sr_user');
  window.location.href = 'index.html';
});

async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Something went wrong.');
  return data;
}

// ---------- Tabs ----------

const tabSearch = document.getElementById('tabSearch');
const tabBookings = document.getElementById('tabBookings');
const searchSection = document.getElementById('searchSection');
const bookingsSection = document.getElementById('bookingsSection');

tabSearch.addEventListener('click', () => switchTab('search'));
tabBookings.addEventListener('click', () => switchTab('bookings'));

function switchTab(which) {
  const isSearch = which === 'search';
  tabSearch.classList.toggle('active', isSearch);
  tabBookings.classList.toggle('active', !isSearch);
  searchSection.style.display = isSearch ? 'block' : 'none';
  bookingsSection.style.display = isSearch ? 'none' : 'block';
  if (!isSearch) loadBookings();
}

// ---------- Search & train list ----------

const trainListEl = document.getElementById('trainList');
const resultsHeading = document.getElementById('resultsHeading');
const selectedClass = {}; // trainId -> classCode

async function loadTrains(from, to) {
  trainListEl.innerHTML = '<p class="empty-state">Loading trains…</p>';
  try {
    const qs = new URLSearchParams();
    if (from) qs.set('from', from);
    if (to) qs.set('to', to);
    const trains = await api(`/trains${qs.toString() ? '?' + qs : ''}`, { method: 'GET' });
    renderTrains(trains);
    resultsHeading.textContent = (from || to) ? `Trains ${from ? 'from ' + from : ''} ${to ? 'to ' + to : ''}`.trim() : 'All trains';
  } catch (err) {
    trainListEl.innerHTML = `<p class="empty-state">${err.message}</p>`;
  }
}

function renderTrains(trains) {
  if (!trains.length) {
    trainListEl.innerHTML = '<p class="empty-state">No trains found for this route. Try another search.</p>';
    return;
  }

  trainListEl.innerHTML = trains.map(t => {
    const pills = t.classes.map(c => {
      const left = c.totalSeats - c.bookedSeats;
      const full = left <= 0;
      const isSelected = selectedClass[t._id] === c.code;
      return `<span class="class-pill ${isSelected ? 'selected' : ''} ${full ? 'full' : ''}"
                data-train="${t._id}" data-class="${c.code}" ${full ? '' : 'data-clickable="1"'}>
                ${c.label} · ₹${c.fare}${full ? ' · Full' : ''}
              </span>`;
    }).join('');

    const activeClass = t.classes.find(c => c.code === selectedClass[t._id]);
    const fareText = activeClass ? `₹${activeClass.fare}` : 'Select class';
    const seatsText = activeClass ? `${activeClass.totalSeats - activeClass.bookedSeats} seats left` : 'per passenger';

    return `
      <div class="train-card">
        <div class="train-info">
          <div class="row1">
            <h3>${t.name}<span class="train-no">#${t.number}</span></h3>
            <span class="runs">Runs daily</span>
          </div>
          <div class="route-line">
            <div><div class="time">${t.departure}</div><div class="stn">${t.from}</div></div>
            <div class="dur">${t.duration}</div>
            <div><div class="time">${t.arrival}</div><div class="stn">${t.to}</div></div>
          </div>
          <div class="class-pills">${pills}</div>
        </div>
        <div class="train-stub">
          <div>
            <div class="fare-label">Fare</div>
            <div class="fare">${fareText}</div>
            <div class="seats-left">${seatsText}</div>
          </div>
          <button class="btn btn-primary" data-book="${t._id}" ${activeClass ? '' : 'disabled'}>Book now</button>
        </div>
      </div>`;
  }).join('');

  // wire up class pill clicks
  trainListEl.querySelectorAll('.class-pill[data-clickable]').forEach(pill => {
    pill.addEventListener('click', () => {
      const trainId = pill.dataset.train;
      const classCode = pill.dataset.class;
      selectedClass[trainId] = selectedClass[trainId] === classCode ? undefined : classCode;
      loadTrains(document.getElementById('fromInput').value.trim(), document.getElementById('toInput').value.trim());
    });
  });

  // wire up book buttons
  trainListEl.querySelectorAll('[data-book]:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => openBookingModal(btn.dataset.book, selectedClass[btn.dataset.book]));
  });
}

document.getElementById('searchBtn').addEventListener('click', () => {
  loadTrains(document.getElementById('fromInput').value.trim(), document.getElementById('toInput').value.trim());
});

loadTrains();

// ---------- Booking modal ----------

let currentTrain = null;
let currentClass = null;
let passengerCount = 1;

const overlay = document.getElementById('bookingOverlay');
const modal = document.getElementById('bookingModal');

async function openBookingModal(trainId, classCode) {
  currentTrain = await api(`/trains/${trainId}`, { method: 'GET' });
  currentClass = currentTrain.classes.find(c => c.code === classCode);
  passengerCount = 1;
  renderBookingForm();
  overlay.classList.add('show');
}

function closeModal() {
  overlay.classList.remove('show');
  currentTrain = null;
}
overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

function passengerBlock(i) {
  return `
    <div class="passenger-block" data-p="${i}">
      ${i > 0 ? `<button type="button" class="remove-p" data-remove="${i}">Remove</button>` : ''}
      <div class="p-title">Passenger ${i + 1}</div>
      <div class="field">
        <label>Full name</label>
        <input type="text" class="p-name" required>
      </div>
      <div class="field-row">
        <div class="field">
          <label>Date of birth</label>
          <input type="date" class="p-dob" required>
        </div>
        <div class="field">
          <label>Gender</label>
          <select class="p-gender" required>
            <option value="">Select</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </div>
      </div>
    </div>`;
}

function renderBookingForm() {
  const seatsLeft = currentClass.totalSeats - currentClass.bookedSeats;
  let blocksHtml = '';
  for (let i = 0; i < passengerCount; i++) blocksHtml += passengerBlock(i);

  modal.innerHTML = `
    <h2>${currentTrain.name} <span style="color:var(--steel-light); font-weight:400;">#${currentTrain.number}</span></h2>
    <p class="modal-sub">${currentTrain.from} → ${currentTrain.to} · ${currentClass.label} · ₹${currentClass.fare} per passenger · ${seatsLeft} seats left</p>
    <div class="error-msg" id="bookError"></div>
    <div class="field">
      <label>Date of journey</label>
      <input type="date" id="journeyDate" required value="${document.getElementById('dateInput').value || ''}">
    </div>
    <div id="passengerBlocks">${blocksHtml}</div>
    <button type="button" class="add-passenger" id="addPassengerBtn">+ Add another passenger</button>
    <div class="modal-actions">
      <button type="button" class="btn btn-ghost" id="cancelModalBtn">Cancel</button>
      <button type="button" class="btn btn-primary" id="confirmBookBtn">Confirm booking · ₹<span id="totalFare">${currentClass.fare}</span></button>
    </div>
  `;

  document.getElementById('cancelModalBtn').addEventListener('click', closeModal);
  document.getElementById('addPassengerBtn').addEventListener('click', () => {
    if (passengerCount >= 6) return;
    passengerCount++;
    renderBookingForm();
  });
  modal.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', () => {
      passengerCount--;
      renderBookingForm();
    });
  });
  updateTotalFare();
  modal.addEventListener('input', updateTotalFare);
  document.getElementById('confirmBookBtn').addEventListener('click', submitBooking);
}

function updateTotalFare() {
  const total = currentClass.fare * passengerCount;
  const el = document.getElementById('totalFare');
  if (el) el.textContent = total;
}

async function submitBooking() {
  const journeyDate = document.getElementById('journeyDate').value;
  const errorEl = document.getElementById('bookError');
  errorEl.classList.remove('show');

  if (!journeyDate) {
    errorEl.textContent = 'Please choose a date of journey.';
    errorEl.classList.add('show');
    return;
  }

  const passengers = [];
  const blocks = modal.querySelectorAll('.passenger-block');
  for (const block of blocks) {
    const name = block.querySelector('.p-name').value.trim();
    const dob = block.querySelector('.p-dob').value;
    const gender = block.querySelector('.p-gender').value;
    if (!name || !dob || !gender) {
      errorEl.textContent = 'Please fill in every passenger\u2019s name, date of birth and gender.';
      errorEl.classList.add('show');
      return;
    }
    passengers.push({ name, dob, gender });
  }

  const btn = document.getElementById('confirmBookBtn');
  btn.disabled = true;
  btn.textContent = 'Booking...';

  try {
    const booking = await api('/bookings', {
      method: 'POST',
      body: JSON.stringify({
        trainId: currentTrain._id,
        journeyDate,
        classCode: currentClass.code,
        passengers
      })
    });
    renderConfirmation(booking);
    delete selectedClass[currentTrain._id];
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.add('show');
    btn.disabled = false;
    btn.textContent = `Confirm booking · ₹${currentClass.fare * passengerCount}`;
  }
}

function renderConfirmation(booking) {
  const rows = booking.passengers.map(p =>
    `<tr><td>${p.name}</td><td>${p.gender}</td><td>Seat ${p.seatNumber}</td></tr>`
  ).join('');

  modal.innerHTML = `
    <div class="confirm-view">
      <div class="stamp">CONFIRMED</div>
      <div class="pnr">${booking.pnr}</div>
      <div class="pnr-label">PNR NUMBER</div>
      <p class="modal-sub" style="margin-bottom:16px;">${booking.trainName} #${booking.trainNumber} · ${booking.from} → ${booking.to} · ${booking.journeyDate} · ${booking.classCode}</p>
      <table>
        <thead><tr><th>Passenger</th><th>Gender</th><th>Seat</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="margin-bottom:20px; font-size:0.9rem;">Total fare: <strong>₹${booking.fareTotal}</strong></p>
      <button type="button" class="btn btn-primary" id="doneBtn">Done</button>
    </div>
  `;
  document.getElementById('doneBtn').addEventListener('click', () => {
    closeModal();
    loadTrains(document.getElementById('fromInput').value.trim(), document.getElementById('toInput').value.trim());
  });
}

// ---------- My bookings ----------

const bookingsListEl = document.getElementById('bookingsList');

async function loadBookings() {
  bookingsListEl.innerHTML = '<p class="empty-state">Loading your bookings…</p>';
  try {
    const bookings = await api('/bookings/mine', { method: 'GET' });
    renderBookings(bookings);
  } catch (err) {
    bookingsListEl.innerHTML = `<p class="empty-state">${err.message}</p>`;
  }
}

function renderBookings(bookings) {
  if (!bookings.length) {
    bookingsListEl.innerHTML = '<p class="empty-state">You haven\u2019t booked any trains yet.</p>';
    return;
  }

  bookingsListEl.innerHTML = bookings.map(b => `
    <div class="booking-row">
      <div class="b-main">
        <h3>${b.trainName} <span style="color:var(--steel-light); font-weight:400; font-size:0.85rem;">#${b.trainNumber}</span></h3>
        <div class="b-meta">PNR ${b.pnr} · ${b.from} → ${b.to} · ${b.journeyDate} · ${b.classCode} · ${b.passengers.length} passenger(s) · ₹${b.fareTotal}</div>
      </div>
      <span class="status-tag ${b.status}">${b.status}</span>
      ${b.status === 'CONFIRMED' ? `<button class="btn btn-danger" data-cancel="${b._id}">Cancel</button>` : ''}
    </div>
  `).join('');

  bookingsListEl.querySelectorAll('[data-cancel]').forEach(btn => {
    btn.addEventListener('click', () => cancelBooking(btn.dataset.cancel));
  });
}

async function cancelBooking(id) {
  if (!confirm('Cancel this booking? Seats will be released back to the train.')) return;
  try {
    await api(`/bookings/${id}/cancel`, { method: 'POST' });
    loadBookings();
  } catch (err) {
    alert(err.message);
  }
}
