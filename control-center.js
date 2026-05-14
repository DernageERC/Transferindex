const groups = ['Success', 'Warning', 'Error', 'Action taken', 'Needs my attention'];
let dashboardData = null;

const fallbackData = {
  generatedAt: new Date().toISOString(),
  systemStatus: {
    label: 'Snapshot not generated yet',
    health: 'warning',
    summary: 'Run python3 scripts/generate-command-center-data.py from the workspace, then refresh this page.',
    workspace: '/home/norm/.openclaw/workspace',
    app: 'Norm Command Center'
  },
  running: [{ name: 'Dashboard UI', status: 'running', detail: 'Static page loaded. Local system snapshot is waiting to be generated.' }],
  activity: [{ timestamp: new Date().toISOString(), title: 'Command Center loaded', detail: 'The UI is ready. Data will become live after the local snapshot script runs.' }],
  logs: [{
    timestamp: new Date().toISOString(),
    category: 'Needs my attention',
    source: 'command-center-data.json',
    message: 'Local snapshot data was not found.',
    whatHappened: 'The dashboard loaded without a generated data file.',
    whyItMatters: 'The browser cannot safely read system logs directly, so it needs a sanitized JSON snapshot.',
    whatToDoNext: 'Run python3 scripts/generate-command-center-data.py from /home/norm/.openclaw/workspace.'
  }],
  commands: [],
  recommendations: [],
  environment: [],
  git: { available: false, summary: 'Git status not loaded', changedFiles: [] }
};

function qs(selector) { return document.querySelector(selector); }
function emptyNode() { return qs('#emptyTemplate').content.firstElementChild.cloneNode(true); }
function formatTime(value) {
  try { return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)); }
  catch { return value || '—'; }
}
function text(value) { return value == null || value === '' ? '—' : String(value); }
function safeClass(value) { return String(value).replaceAll(' ', '-'); }

async function copyText(value, button) {
  try {
    await navigator.clipboard.writeText(value);
    const original = button.textContent;
    button.textContent = 'Copied';
    setTimeout(() => { button.textContent = original; }, 1200);
  } catch {
    button.textContent = 'Copy failed';
  }
}

function renderStatus(data) {
  qs('#statusSummary').textContent = data.systemStatus?.summary || 'No status summary available.';
  qs('#systemLabel').textContent = data.systemStatus?.label || 'Unknown';
  qs('#generatedAt').textContent = `Updated ${formatTime(data.generatedAt)}`;
  qs('#liveDot').className = `live-dot ${data.systemStatus?.health === 'ok' ? '' : data.systemStatus?.health || 'warning'}`;
}

function renderRunning(items = []) {
  const root = qs('#runningList');
  root.innerHTML = '';
  if (!items.length) return root.append(emptyNode());
  items.forEach((item) => {
    const node = document.createElement('div');
    node.className = 'running-item';
    node.innerHTML = `
      <span class="item-dot ${item.status === 'running' ? '' : item.status || 'warning'}"></span>
      <span><strong class="item-title">${text(item.name)}</strong><span class="item-detail">${text(item.detail)}</span></span>
    `;
    root.append(node);
  });
}

function renderActivity(items = []) {
  const root = qs('#activityList');
  root.innerHTML = '';
  if (!items.length) return root.append(emptyNode());
  items.slice(0, 6).forEach((item) => {
    const node = document.createElement('div');
    node.className = 'activity-item';
    node.innerHTML = `
      <span class="item-dot"></span>
      <span><strong class="item-title">${text(item.title)}</strong><span class="item-detail">${text(item.detail)}</span><span class="item-time">${formatTime(item.timestamp)}</span></span>
    `;
    root.append(node);
  });
}

function renderMetrics(logs = []) {
  const count = (category) => logs.filter((item) => item.category === category).length;
  qs('#successCount').textContent = count('Success');
  qs('#warningCount').textContent = count('Warning');
  qs('#errorCount').textContent = count('Error');
  qs('#attentionCount').textContent = count('Needs my attention');
}

function getFilteredLogs() {
  const query = qs('#logSearch').value.trim().toLowerCase();
  const filter = qs('#logFilter').value;
  return (dashboardData.logs || []).filter((item) => {
    const blob = [item.category, item.source, item.message, item.whatHappened, item.whyItMatters, item.whatToDoNext].join(' ').toLowerCase();
    return (filter === 'All' || item.category === filter) && (!query || blob.includes(query));
  });
}

function renderLogs() {
  const logs = getFilteredLogs();
  const root = qs('#logGroups');
  root.innerHTML = '';
  if (!logs.length) return root.append(emptyNode());

  groups.forEach((group) => {
    const items = logs.filter((item) => item.category === group);
    if (!items.length) return;
    const section = document.createElement('section');
    section.innerHTML = `<h3 class="log-group-title"><span class="pill">${group}</span><small>${items.length}</small></h3>`;
    const stack = document.createElement('div');
    stack.className = 'log-stack';
    items.slice(-12).reverse().forEach((item) => {
      const card = document.createElement('article');
      card.className = `log-card ${safeClass(item.category)}`;
      card.innerHTML = `
        <div class="log-meta"><span class="pill">${text(item.category)}</span><span>${formatTime(item.timestamp)}</span><span>${text(item.source)}</span></div>
        <h3>${text(item.message)}</h3>
        <dl>
          <dt>What happened</dt><dd>${text(item.whatHappened)}</dd>
          <dt>Why it matters</dt><dd>${text(item.whyItMatters)}</dd>
          <dt>What to do next</dt><dd>${text(item.whatToDoNext)}</dd>
        </dl>
      `;
      stack.append(card);
    });
    section.append(stack);
    root.append(section);
  });
}

function renderCommands(items = []) {
  const root = qs('#commandGrid');
  root.innerHTML = '';
  if (!items.length) return root.append(emptyNode());
  items.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'command-card';
    card.innerHTML = `
      <div class="card-top"><h3>${text(item.name)}</h3><span class="risk ${text(item.riskLevel)}">${text(item.riskLevel)}</span></div>
      <p>${text(item.description)}</p>
      <span class="pill">${text(item.mode)}</span>
      <code class="command-text">${text(item.command)}</code>
      <button class="copy-btn" type="button">Copy command</button>
    `;
    card.querySelector('button').addEventListener('click', (event) => copyText(item.command, event.currentTarget));
    root.append(card);
  });
}

function renderRecommendations(items = []) {
  const root = qs('#recommendationGrid');
  root.innerHTML = '';
  if (!items.length) return root.append(emptyNode());
  items.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'recommendation-card';
    card.innerHTML = `
      <div class="card-top"><h3>${text(item.name)}</h3><span class="risk ${text(item.riskLevel)}">${text(item.riskLevel)}</span></div>
      <p>${text(item.why)}</p>
      <span class="pill">${text(item.need)}</span>
      <code class="command-text">${text(item.installCommand)}</code>
      <button class="copy-btn" type="button">Copy install command</button>
    `;
    card.querySelector('button').addEventListener('click', (event) => copyText(item.installCommand, event.currentTarget));
    root.append(card);
  });
}

function renderEnvironment(items = []) {
  const root = qs('#envList');
  root.innerHTML = '';
  if (!items.length) return root.append(emptyNode());
  items.slice(0, 20).forEach((item) => {
    const row = document.createElement('div');
    row.className = 'env-row';
    row.innerHTML = `<strong>${text(item.name)}</strong><code>${text(item.value)}</code>`;
    root.append(row);
  });
}

function renderGit(git = {}) {
  const root = qs('#gitState');
  root.innerHTML = `<div class="git-row"><strong>Status</strong><code>${text(git.summary)}</code></div>`;
  (git.changedFiles || []).slice(0, 14).forEach((file) => {
    const row = document.createElement('div');
    row.className = 'git-row';
    row.innerHTML = `<strong>Changed</strong><code>${text(file)}</code>`;
    root.append(row);
  });
}

function renderAll(data) {
  dashboardData = data;
  renderStatus(data);
  renderRunning(data.running);
  renderActivity(data.activity);
  renderMetrics(data.logs);
  renderLogs();
  renderCommands(data.commands);
  renderRecommendations(data.recommendations);
  renderEnvironment(data.environment);
  renderGit(data.git);
}

async function loadData() {
  try {
    const response = await fetch('command-center-data.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    renderAll(await response.json());
  } catch (error) {
    console.warn('Command Center using fallback data:', error);
    renderAll(fallbackData);
  }
}

qs('#logSearch').addEventListener('input', renderLogs);
qs('#logFilter').addEventListener('change', renderLogs);
loadData();
