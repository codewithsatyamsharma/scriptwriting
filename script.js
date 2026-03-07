'use strict';


let shots = [];
let editingId = null;
let dragSrcIndex = null;
let isListView = false;


const STORAGE_KEY = 'storyboard_shots_v2';

function saveToStorage() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(shots)); } catch(e) {}
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) shots = JSON.parse(raw);
  } catch(e) { shots = []; }
}


function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}


function createShot(overrides = {}) {
  return {
    id:       uid(),
    title:    'Untitled Shot',
    type:     '',
    duration: 30,
    visual:   '',
    script:   '',
    notes:    '',
    color:    '#e8c547',
    ...overrides,
  };
}


function secondsToMMSS(secs) {
  const s = Math.max(0, Math.floor(Number(secs) || 0));
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

function getTotalDuration() {
  return shots.reduce((sum, s) => sum + (Number(s.duration) || 0), 0);
}


function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderDragHandle() {
  return `<div class="drag-handle" title="Drag to reorder">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="9" cy="6" r="1.2" fill="currentColor"/>
      <circle cx="15" cy="6" r="1.2" fill="currentColor"/>
      <circle cx="9" cy="12" r="1.2" fill="currentColor"/>
      <circle cx="15" cy="12" r="1.2" fill="currentColor"/>
      <circle cx="9" cy="18" r="1.2" fill="currentColor"/>
      <circle cx="15" cy="18" r="1.2" fill="currentColor"/>
    </svg>
  </div>`;
}

function renderShotCard(shot, index) {
  const dur = secondsToMMSS(shot.duration);
  const typeStr = shot.type ? escHtml(shot.type) : '';

  return `
  <div class="shot-card"
       data-id="${shot.id}"
       data-index="${index}"
       style="--card-color:${escHtml(shot.color)}"
       draggable="true">
    <div class="card-header">
      <div class="card-meta">
        <span class="shot-number">SHOT ${String(index + 1).padStart(2, '0')}</span>
        <div class="shot-title">${escHtml(shot.title)}</div>
        ${typeStr ? `<span class="shot-type-badge">${typeStr}</span>` : ''}
      </div>
      ${renderDragHandle()}
    </div>
    <div class="card-body">
      <div class="card-visual">
        <div class="card-visual-label">Visual / Frame</div>
        <div class="card-visual-text">${shot.visual ? escHtml(shot.visual) : '<span style="color:var(--text-muted);font-style:italic">No description</span>'}</div>
      </div>
      ${shot.script ? `<div class="card-script">${escHtml(shot.script)}</div>` : ''}
    </div>
    <div class="card-footer">
      <div class="card-duration">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        ${dur}
      </div>
      <div class="card-actions">
        <button class="card-action-btn dupe-btn" data-id="${shot.id}" title="Duplicate">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        </button>
        <button class="card-action-btn edit-btn" data-id="${shot.id}" title="Edit">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="card-action-btn del-btn" data-id="${shot.id}" title="Delete">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
        </button>
      </div>
    </div>
  </div>`;
}


function render() {
  const grid = document.getElementById('shotsGrid');
  const emptyState = document.getElementById('emptyState');
  const totalEl = document.getElementById('totalDuration');
  const countEl = document.getElementById('sceneCount');

  totalEl.textContent = secondsToMMSS(getTotalDuration());
  countEl.textContent = shots.length;

  grid.classList.toggle('list-view', isListView);

  if (shots.length === 0) {
    emptyState.style.display = 'flex';
    grid.innerHTML = '';
    return;
  }

  emptyState.style.display = 'none';
  grid.innerHTML = shots.map((s, i) => renderShotCard(s, i)).join('');
  attachCardEvents();
  attachDragEvents();
}

function attachCardEvents() {
  const grid = document.getElementById('shotsGrid');

  grid.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); openModal(btn.dataset.id); });
  });

  grid.querySelectorAll('.del-btn').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); deleteShot(btn.dataset.id); });
  });

  grid.querySelectorAll('.dupe-btn').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); duplicateShot(btn.dataset.id); });
  });

  grid.querySelectorAll('.shot-card').forEach(card => {
    card.addEventListener('click', () => openModal(card.dataset.id));
  });
}


function attachDragEvents() {
  const cards = document.querySelectorAll('.shot-card');
  cards.forEach(card => {
    card.addEventListener('dragstart', onDragStart);
    card.addEventListener('dragend',   onDragEnd);
    card.addEventListener('dragover',  onDragOver);
    card.addEventListener('dragenter', onDragEnter);
    card.addEventListener('dragleave', onDragLeave);
    card.addEventListener('drop',      onDrop);
  });
}

function onDragStart(e) {
  dragSrcIndex = parseInt(this.dataset.index, 10);
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', dragSrcIndex);
}

function onDragEnd() {
  this.classList.remove('dragging');
  document.querySelectorAll('.shot-card').forEach(c => c.classList.remove('drag-over'));
  dragSrcIndex = null;
}

function onDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }

function onDragEnter(e) {
  e.preventDefault();
  if (parseInt(this.dataset.index, 10) !== dragSrcIndex) this.classList.add('drag-over');
}

function onDragLeave() { this.classList.remove('drag-over'); }

function onDrop(e) {
  e.stopPropagation();
  e.preventDefault();
  this.classList.remove('drag-over');

  const destIndex = parseInt(this.dataset.index, 10);
  if (dragSrcIndex === null || dragSrcIndex === destIndex) return;

  const moved = shots.splice(dragSrcIndex, 1)[0];
  shots.splice(destIndex, 0, moved);

  saveToStorage();
  render();
  toast('Shot reordered', 'success');
}


function addShot() {
  const shot = createShot({ title: `Shot ${shots.length + 1}` });
  shots.push(shot);
  saveToStorage();
  render();
  openModal(shot.id);
}

function deleteShot(id) {
  shots = shots.filter(s => s.id !== id);
  saveToStorage();
  render();
  toast('Shot deleted', 'success');
}

function duplicateShot(id) {
  const src = shots.find(s => s.id === id);
  if (!src) return;
  const copy = createShot({ ...src, id: uid(), title: src.title + ' (copy)' });
  const idx = shots.findIndex(s => s.id === id);
  shots.splice(idx + 1, 0, copy);
  saveToStorage();
  render();
  toast('Shot duplicated', 'success');
}


function openModal(id) {
  editingId = id;
  const shot = shots.find(s => s.id === id);
  if (!shot) return;

  const idx = shots.indexOf(shot);
  document.getElementById('modalSceneBadge').textContent = `SHOT ${String(idx + 1).padStart(2, '0')}`;
  document.getElementById('modalTitle').textContent = 'Edit Shot';

  document.getElementById('fieldTitle').value    = shot.title || '';
  document.getElementById('fieldDuration').value = shot.duration || 30;
  document.getElementById('fieldVisual').value   = shot.visual || '';
  document.getElementById('fieldScript').value   = shot.script || '';
  document.getElementById('fieldNotes').value    = shot.notes || '';

  document.querySelectorAll('.shot-type-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.type === shot.type);
  });

  document.querySelectorAll('.color-tag').forEach(tag => {
    tag.classList.toggle('selected', tag.dataset.color === shot.color);
  });

  document.getElementById('modalOverlay').classList.add('open');
  setTimeout(() => document.getElementById('fieldTitle').focus(), 100);
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  editingId = null;
}

function saveModal() {
  if (!editingId) return;
  const shot = shots.find(s => s.id === editingId);
  if (!shot) return;

  const titleVal = document.getElementById('fieldTitle').value.trim();
  shot.title    = titleVal || 'Untitled Shot';
  shot.duration = Math.max(1, parseInt(document.getElementById('fieldDuration').value, 10) || 30);
  shot.visual   = document.getElementById('fieldVisual').value.trim();
  shot.script   = document.getElementById('fieldScript').value.trim();
  shot.notes    = document.getElementById('fieldNotes').value.trim();

  const selType = document.querySelector('.shot-type-btn.selected');
  shot.type = selType ? selType.dataset.type : '';

  const selColor = document.querySelector('.color-tag.selected');
  shot.color = selColor ? selColor.dataset.color : '#e8c547';

  saveToStorage();
  render();
  closeModal();
  toast('Shot saved', 'success');
}


function openExport() {
  if (shots.length === 0) { toast('Add some shots first!', 'error'); return; }

  const total = secondsToMMSS(getTotalDuration());
  let out = `╔══════════════════════════════════════════╗\n`;
  out += `║       STORYBOARD EXPORT                  ║\n`;
  out += `║  Scenes: ${String(shots.length).padEnd(4)} │ Runtime: ${total.padEnd(10)}║\n`;
  out += `╚══════════════════════════════════════════╝\n\n`;

  shots.forEach((shot, i) => {
    out += `────────────────────────────────────────────\n`;
    out += `SHOT ${String(i + 1).padStart(2, '0')} │ ${shot.title.toUpperCase()}\n`;
    if (shot.type) out += `TYPE     : ${shot.type}\n`;
    out += `DURATION : ${secondsToMMSS(shot.duration)} (${shot.duration}s)\n`;
    if (shot.visual)  out += `VISUAL   :\n  ${shot.visual.replace(/\n/g, '\n  ')}\n`;
    if (shot.script)  out += `SCRIPT   :\n  ${shot.script.replace(/\n/g, '\n  ')}\n`;
    if (shot.notes)   out += `NOTES    :\n  ${shot.notes.replace(/\n/g, '\n  ')}\n`;
    out += `\n`;
  });

  out += `────────────────────────────────────────────\n`;
  out += `Total Runtime: ${total} │ Generated: ${new Date().toLocaleString()}\n`;

  document.getElementById('exportContent').textContent = out;
  document.getElementById('exportOverlay').classList.add('open');
}


function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      ${type === 'success'
        ? '<polyline points="20 6 9 17 4 12"/>'
        : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'}
    </svg>
    ${escHtml(msg)}`;
  document.body.appendChild(el);
  setTimeout(() => {
    el.classList.add('toast-out');
    el.addEventListener('animationend', () => el.remove());
  }, 2400);
}


function init() {
  loadFromStorage();

  if (shots.length === 0) {
    shots = [
      createShot({
        title: 'Opening Credits',
        type: 'Wide Shot',
        duration: 15,
        color: '#e8c547',
        visual: 'Slow aerial pull-back from a city skyline.',
        script: 'In a world defined by data...',
        notes: 'Drone operator booked.',
      })
    ];
    saveToStorage();
  }

  render();

  document.getElementById('addShotBtn').addEventListener('click', addShot);
  document.getElementById('addFirstShotBtn').addEventListener('click', addShot);
  document.getElementById('exportBtn').addEventListener('click', openExport);

  document.getElementById('saveShotBtn').addEventListener('click', saveModal);
  document.getElementById('cancelBtn').addEventListener('click', closeModal);
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('deleteShotBtn').addEventListener('click', () => {
    if (editingId) { deleteShot(editingId); closeModal(); }
  });

  document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modalOverlay')) closeModal();
  });

  document.getElementById('shotTypeGrid').addEventListener('click', e => {
    const btn = e.target.closest('.shot-type-btn');
    if (!btn) return;
    document.querySelectorAll('.shot-type-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.toggle('selected', true);
  });

  document.getElementById('colorTags').addEventListener('click', e => {
    const tag = e.target.closest('.color-tag');
    if (!tag) return;
    document.querySelectorAll('.color-tag').forEach(t => t.classList.remove('selected'));
    tag.classList.add('selected');
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeModal();
      document.getElementById('exportOverlay').classList.remove('open');
      document.getElementById('drawingOverlay').classList.remove('open');
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      if (document.getElementById('modalOverlay').classList.contains('open')) saveModal();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      addShot();
    }
  });

  document.getElementById('viewGrid').addEventListener('click', () => {
    isListView = false;
    document.getElementById('viewGrid').classList.add('active');
    document.getElementById('viewList').classList.remove('active');
    render();
  });
  document.getElementById('viewList').addEventListener('click', () => {
    isListView = true;
    document.getElementById('viewList').classList.add('active');
    document.getElementById('viewGrid').classList.remove('active');
    render();
  });

  document.getElementById('exportClose').addEventListener('click', () => document.getElementById('exportOverlay').classList.remove('open'));
  document.getElementById('exportCancelBtn').addEventListener('click', () => document.getElementById('exportOverlay').classList.remove('open'));
  document.getElementById('exportOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('exportOverlay')) document.getElementById('exportOverlay').classList.remove('open');
  });
  document.getElementById('copyExportBtn').addEventListener('click', () => {
    const text = document.getElementById('exportContent').textContent;
    navigator.clipboard.writeText(text).then(() => toast('Copied to clipboard!', 'success'));
  });


  const drawingPadBtn = document.querySelector('#drawing-pad');
  const drawingOverlay = document.getElementById('drawingOverlay');
  const drawingCloseBtn = document.getElementById('drawingCloseBtn');
  const drawingIframe = document.getElementById('drawingIframe'); 

  if (drawingPadBtn && drawingOverlay) {
    drawingPadBtn.addEventListener('click', function(event) {
      event.preventDefault(); 
      drawingOverlay.classList.add('open');

  
      if (!drawingIframe.src) {
        setTimeout(() => {
          drawingIframe.src = drawingIframe.getAttribute('data-src');
        }, 300); 
      }
    });

    drawingCloseBtn.addEventListener('click', function(event) {
      event.preventDefault();
      drawingOverlay.classList.remove('open');
    });

    drawingOverlay.addEventListener('click', function(e) {
      if (e.target === drawingOverlay) {
        drawingOverlay.classList.remove('open');
      }
    });
  }}

document.addEventListener('DOMContentLoaded', init);