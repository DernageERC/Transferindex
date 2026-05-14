const ADMIN_PHONE = '6609987161';
const AUTH_CODE = '7161';

const authScreen = document.querySelector('#authScreen');
const appScreen = document.querySelector('#appScreen');
const phoneForm = document.querySelector('#phoneForm');
const codeForm = document.querySelector('#codeForm');
const phoneInput = document.querySelector('#phone');
const codeInput = document.querySelector('#code');
const codeHint = document.querySelector('#codeHint');
const profilePhone = document.querySelector('#profilePhone');
const profileStatus = document.querySelector('#profileStatus');
const logoutButton = document.querySelector('#logoutButton');
const appTitle = document.querySelector('#appTitle');
const dailyQuote = document.querySelector('#dailyQuote');
const pollList = document.querySelector('#pollList');
const pollForm = document.querySelector('#pollForm');
const pollInput = document.querySelector('#pollInput');
const adminPanel = document.querySelector('#adminPanel');
const adminBadge = document.querySelector('#adminBadge');
const notifyButton = document.querySelector('#notifyButton');
const displayName = document.querySelector('#displayName');
const saveProfileButton = document.querySelector('#saveProfileButton');
const photoInput = document.querySelector('#photoInput');
const profilePhoto = document.querySelector('#profilePhoto');

const bibleQuotes = [
  '“Let justice roll down like waters, and righteousness like an ever-flowing stream.”',
  '“Love your neighbor as yourself.”',
  '“Seek justice, encourage the oppressed, defend the fatherless, plead the case of the widow.”',
  '“Whatever you do, work at it with all your heart.”',
  '“The truth will set you free.”',
  '“Be strong and courageous. Do not be afraid.”',
  '“Let all that you do be done in love.”',
  '“Blessed are the peacemakers.”',
  '“Do not grow weary in doing good.”',
  '“Where there is no vision, the people perish.”'
];

const defaultPolls = [
  { id: crypto.randomUUID(), title: 'Real SMS login', votes: 11 },
  { id: crypto.randomUUID(), title: 'Daily civic action checklist', votes: 8 },
  { id: crypto.randomUUID(), title: 'Local representative tracker', votes: 6 },
  { id: crypto.randomUUID(), title: 'Bill payment dashboard', votes: 5 }
];

function digitsOnly(value) {
  return value.replace(/\D/g, '');
}

function getPolls() {
  return JSON.parse(localStorage.getItem('norm_polls') || 'null') || defaultPolls;
}

function savePolls(polls) {
  localStorage.setItem('norm_polls', JSON.stringify(polls));
}

function getVotes() {
  return JSON.parse(localStorage.getItem('norm_votes') || '{}');
}

function saveVotes(votes) {
  localStorage.setItem('norm_votes', JSON.stringify(votes));
}

function renderPolls() {
  const polls = getPolls().sort((a, b) => b.votes - a.votes);
  const total = Math.max(1, polls.reduce((sum, poll) => sum + poll.votes, 0));
  const votes = getVotes();

  pollList.innerHTML = polls.map((poll, index) => {
    const width = Math.max(8, Math.round((poll.votes / total) * 100));
    const voted = votes[poll.id];
    return `
      <button class="poll-option ${voted ? 'voted' : ''}" data-poll-id="${poll.id}">
        <span class="poll-rank">${index + 1}</span>
        <span class="poll-main">
          <strong>${poll.title}</strong>
          <em>${poll.votes} votes</em>
          <i style="width:${width}%"></i>
        </span>
      </button>
    `;
  }).join('');

  document.querySelectorAll('.poll-option').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.pollId;
      const votes = getVotes();
      if (votes[id]) return;
      const polls = getPolls();
      const poll = polls.find((item) => item.id === id);
      if (poll) poll.votes += 1;
      votes[id] = true;
      savePolls(polls);
      saveVotes(votes);
      renderPolls();
    });
  });
}

function loadProfile() {
  displayName.value = localStorage.getItem('norm_name') || '';
  const photo = localStorage.getItem('norm_photo');
  if (photo) profilePhoto.src = photo;
}

function setAdminState(phone) {
  const isAdmin = digitsOnly(phone) === ADMIN_PHONE;
  adminPanel.classList.toggle('hidden', !isAdmin);
  adminBadge.classList.toggle('hidden', !isAdmin);
  profileStatus.textContent = isAdmin ? 'Admin founder' : 'Early member';
}

function showApp(phone) {
  localStorage.setItem('norm_phone', phone);
  profilePhone.textContent = phone;
  dailyQuote.textContent = bibleQuotes[new Date().getDate() % bibleQuotes.length];
  setAdminState(phone);
  loadProfile();
  renderPolls();
  authScreen.classList.add('hidden');
  appScreen.classList.remove('hidden');
}

function showAuth() {
  localStorage.removeItem('norm_phone');
  authScreen.classList.remove('hidden');
  appScreen.classList.add('hidden');
  codeForm.classList.add('hidden');
  phoneForm.classList.remove('hidden');
  phoneInput.value = '';
  codeInput.value = '';
}

phoneForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const phone = phoneInput.value.trim();
  if (!phone) return;
  sessionStorage.setItem('norm_pending_phone', phone);
  codeHint.innerHTML = `Use code <strong>${AUTH_CODE}</strong> to continue. Real SMS comes with the backend.`;
  phoneForm.classList.add('hidden');
  codeForm.classList.remove('hidden');
  codeInput.focus();
});

codeForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const code = codeInput.value.trim();
  if (code !== AUTH_CODE) {
    codeInput.value = '';
    codeInput.placeholder = `Use ${AUTH_CODE}`;
    return;
  }
  const phone = sessionStorage.getItem('norm_pending_phone') || phoneInput.value.trim();
  showApp(phone);
});

logoutButton.addEventListener('click', showAuth);

pollForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const title = pollInput.value.trim();
  if (!title) return;
  const polls = getPolls();
  polls.push({ id: crypto.randomUUID(), title, votes: 0 });
  savePolls(polls);
  pollInput.value = '';
  renderPolls();
});

saveProfileButton.addEventListener('click', () => {
  localStorage.setItem('norm_name', displayName.value.trim());
  saveProfileButton.textContent = 'Saved';
  setTimeout(() => saveProfileButton.textContent = 'Save profile', 1200);
});

photoInput.addEventListener('change', () => {
  const file = photoInput.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    localStorage.setItem('norm_photo', reader.result);
    profilePhoto.src = reader.result;
  };
  reader.readAsDataURL(file);
});

notifyButton.addEventListener('click', async () => {
  if (!('Notification' in window)) {
    notifyButton.textContent = 'Notifications not supported';
    return;
  }
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    new Notification('Norm', { body: 'Daily quote reminders are enabled on this device.' });
    notifyButton.textContent = 'Notifications enabled';
  } else {
    notifyButton.textContent = 'Notifications blocked';
  }
});

document.querySelectorAll('.nav-item').forEach((button) => {
  button.addEventListener('click', () => {
    const tab = button.dataset.tab;
    document.querySelectorAll('.nav-item').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    document.querySelectorAll('.tab-panel').forEach((panel) => panel.classList.add('hidden'));
    document.querySelector(`#tab${tab}`).classList.remove('hidden');
    appTitle.textContent = tab;
  });
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

const savedPhone = localStorage.getItem('norm_phone');
if (savedPhone) showApp(savedPhone);
