const STORAGE_KEY = 'speakgrid-aac-board-v1';

const defaultButtons = [
  { label: 'Yes', spoken: 'Yes', symbol: '👍', color: '#e8f7ec' },
  { label: 'No', spoken: 'No', symbol: '👎', color: '#fff0f0' },
  { label: 'Help', spoken: 'I need help', symbol: '🆘', color: '#fff5d8' },
  { label: 'Drink', spoken: 'I want a drink', symbol: '💧', color: '#e7f2ff' },
  { label: 'Food', spoken: 'I am hungry', symbol: '🍽️', color: '#fff1df' },
  { label: 'Bathroom', spoken: 'I need to use the bathroom', symbol: '🚽', color: '#eaf4ff' },
  { label: 'Happy', spoken: 'I feel happy', symbol: '😊', color: '#fff8cf' },
  { label: 'Sad', spoken: 'I feel sad', symbol: '😢', color: '#eef0ff' },
  { label: 'Pain', spoken: 'I am in pain', symbol: '🤒', color: '#ffe9ec' },
  { label: 'Home', spoken: 'I want to go home', symbol: '🏠', color: '#eff8ed' },
  { label: 'Stop', spoken: 'Stop please', symbol: '✋', color: '#ffe7e7' },
  { label: 'More', spoken: 'I want more', symbol: '➕', color: '#edf3ff' }
];

const state = loadState();
let editMode = false;
let activeIndex = null;
let tempImage = '';
let tempSymbol = '';
let lockedScrollY = 0;

const grid = document.getElementById('grid');
const editToggle = document.getElementById('editToggle');
const columnsSelect = document.getElementById('columnsSelect');
const rowsSelect = document.getElementById('rowsSelect');
const selectionMode = document.getElementById('selectionMode');
const rateInput = document.getElementById('rateInput');
const messageText = document.getElementById('messageText');
const speakMessage = document.getElementById('speakMessage');
const clearMessage = document.getElementById('clearMessage');
const resetBoard = document.getElementById('resetBoard');
const boardSettings = document.getElementById('boardSettings');

const editorDialog = document.getElementById('editorDialog');
const editingIndex = document.getElementById('editingIndex');
const labelInput = document.getElementById('labelInput');
const spokenInput = document.getElementById('spokenInput');
const symbolInput = document.getElementById('symbolInput');
const fileInput = document.getElementById('fileInput');
const urlInput = document.getElementById('urlInput');
const colorInput = document.getElementById('colorInput');
const imagePreview = document.getElementById('imagePreview');

function loadState() {
  const fallback = {
    rows: 3,
    columns: 4,
    selection: 'release',
    rate: 0.9,
    message: [],
    buttons: [...defaultButtons]
  };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved ? { ...fallback, ...saved } : fallback;
  } catch {
    return fallback;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function ensureButtonCount() {
  const total = state.rows * state.columns;
  while (state.buttons.length < total) state.buttons.push({ label: '', spoken: '', symbol: '', image: '', color: '#ffffff' });
  if (state.buttons.length > total) state.buttons.length = total;
}

function setupSelect(select, min, max, current) {
  select.innerHTML = '';
  for (let i = min; i <= max; i++) {
    const option = document.createElement('option');
    option.value = String(i);
    option.textContent = String(i);
    if (i === current) option.selected = true;
    select.appendChild(option);
  }
}


function setBoardScrollLocked(locked) {
  if (locked) {
    lockedScrollY = window.scrollY || 0;
    document.body.classList.add('board-scroll-locked');
  } else {
    document.body.classList.remove('board-scroll-locked');
    window.scrollTo(0, lockedScrollY);
  }
}

function setEditMode(enabled) {
  editMode = enabled;
  document.body.classList.toggle('editing', editMode);
  boardSettings.hidden = !editMode;
  editToggle.textContent = editMode ? 'Done editing' : 'Edit board';
  editToggle.setAttribute('aria-pressed', String(editMode));
  setBoardScrollLocked(!editMode);
  render();
}


function blockBoardScroll(event) {
  if (!editMode) event.preventDefault();
}

function render() {
  ensureButtonCount();
  grid.style.gridTemplateColumns = `repeat(${state.columns}, minmax(0, 1fr))`;
  grid.innerHTML = '';
  state.buttons.forEach((button, index) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = `aac-button ${button.label || button.spoken || button.symbol || button.image ? '' : 'empty'}`;
    el.style.background = button.color || '#ffffff';
    el.setAttribute('aria-label', editMode ? `Edit ${button.label || 'empty button'}` : button.spoken || button.label || 'Empty button');

    const imageBox = document.createElement('span');
    imageBox.className = 'button-image';
    if (button.image) {
      const img = document.createElement('img');
      img.src = button.image;
      img.alt = '';
      imageBox.appendChild(img);
    } else if (button.symbol) {
      const symbol = document.createElement('span');
      symbol.className = 'button-symbol';
      symbol.textContent = button.symbol;
      imageBox.appendChild(symbol);
    } else {
      const empty = document.createElement('span');
      empty.className = 'edit-badge';
      empty.textContent = editMode ? '+ Add' : '';
      imageBox.appendChild(empty);
    }

    const label = document.createElement('span');
    label.className = 'button-label';
    label.textContent = button.label || (editMode ? 'Empty' : '');

    el.append(imageBox, label);

    el.addEventListener('pointerdown', event => {
      if (!editMode) event.preventDefault();
      el.classList.add('pressed');
      if (editMode) return;
      if (state.selection === 'touch') activateButton(index);
    });
    el.addEventListener('pointerup', event => {
      if (!editMode) event.preventDefault();
      el.classList.remove('pressed');
      if (editMode) openEditor(index);
      else if (state.selection === 'release') activateButton(index);
    });
    el.addEventListener('pointerleave', () => el.classList.remove('pressed'));
    el.addEventListener('click', event => event.preventDefault());

    grid.appendChild(el);
  });
  updateMessage();
  saveState();
}

function activateButton(index) {
  const button = state.buttons[index];
  const phrase = (button.spoken || button.label || '').trim();
  if (!phrase) return;
  state.message.push(phrase);
  updateMessage();
  speak(phrase);
  saveState();
}

function speak(text) {
  if (!('speechSynthesis' in window)) {
    alert('This browser does not support built-in speech synthesis. Try Safari or Chrome.');
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = Number(state.rate || 0.9);
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

function updateMessage() {
  messageText.textContent = state.message.join(' ');
}

function openEditor(index) {
  activeIndex = index;
  const button = state.buttons[index] || {};
  editingIndex.value = String(index);
  labelInput.value = button.label || '';
  spokenInput.value = button.spoken || '';
  tempSymbol = button.symbol || '';
  tempImage = button.image || '';
  symbolInput.value = tempSymbol;
  urlInput.value = button.image && /^https?:/.test(button.image) ? button.image : '';
  fileInput.value = '';
  colorInput.value = button.color || '#ffffff';
  renderPreview();
  editorDialog.showModal();
}

function renderPreview() {
  imagePreview.innerHTML = '';
  if (tempImage) {
    const img = document.createElement('img');
    img.src = tempImage;
    img.alt = '';
    imagePreview.appendChild(img);
  } else if (tempSymbol) {
    imagePreview.textContent = tempSymbol;
  }
}

function saveEditor() {
  const index = Number(editingIndex.value);
  state.buttons[index] = {
    label: labelInput.value.trim(),
    spoken: spokenInput.value.trim(),
    symbol: symbolInput.value.trim(),
    image: tempImage,
    color: colorInput.value || '#ffffff'
  };
  editorDialog.close();
  render();
}

function clearEditorButton() {
  const index = Number(editingIndex.value);
  state.buttons[index] = { label: '', spoken: '', symbol: '', image: '', color: '#ffffff' };
  editorDialog.close();
  render();
}

function init() {
  setupSelect(columnsSelect, 1, 8, state.columns);
  setupSelect(rowsSelect, 1, 8, state.rows);
  selectionMode.value = state.selection;
  rateInput.value = state.rate;

  columnsSelect.addEventListener('change', () => { state.columns = Number(columnsSelect.value); render(); });
  rowsSelect.addEventListener('change', () => { state.rows = Number(rowsSelect.value); render(); });
  selectionMode.addEventListener('change', () => { state.selection = selectionMode.value; render(); });
  rateInput.addEventListener('input', () => { state.rate = Number(rateInput.value); saveState(); });

  editToggle.addEventListener('click', () => {
    setEditMode(!editMode);
  });

  speakMessage.addEventListener('click', () => {
    const text = state.message.join(' ').trim();
    if (text) speak(text);
  });
  clearMessage.addEventListener('click', () => { state.message = []; render(); });

  resetBoard.addEventListener('click', () => {
    if (!confirm('Reset to the sample board? This replaces your current buttons.')) return;
    Object.assign(state, { rows: 3, columns: 4, selection: 'release', rate: 0.9, message: [], buttons: [...defaultButtons] });
    setupSelect(columnsSelect, 1, 8, state.columns);
    setupSelect(rowsSelect, 1, 8, state.rows);
    selectionMode.value = state.selection;
    rateInput.value = state.rate;
    render();
  });

  document.getElementById('saveButton').addEventListener('click', saveEditor);
  document.getElementById('deleteButton').addEventListener('click', clearEditorButton);
  document.getElementById('cancelEditor').addEventListener('click', () => editorDialog.close());
  document.getElementById('closeEditor').addEventListener('click', () => editorDialog.close());
  document.getElementById('clearImage').addEventListener('click', () => { tempImage = ''; urlInput.value = ''; renderPreview(); });

  symbolInput.addEventListener('input', () => { tempSymbol = symbolInput.value.trim(); if (tempSymbol) tempImage = ''; renderPreview(); });
  document.querySelectorAll('.symbol-library button').forEach(button => {
    button.addEventListener('click', () => {
      tempSymbol = button.textContent;
      tempImage = '';
      symbolInput.value = tempSymbol;
      urlInput.value = '';
      renderPreview();
    });
  });

  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      tempImage = String(event.target.result);
      tempSymbol = '';
      symbolInput.value = '';
      urlInput.value = '';
      renderPreview();
    };
    reader.readAsDataURL(file);
  });

  urlInput.addEventListener('input', () => {
    tempImage = urlInput.value.trim();
    if (tempImage) {
      tempSymbol = '';
      symbolInput.value = '';
    }
    renderPreview();
  });

  grid.addEventListener('touchmove', blockBoardScroll, { passive: false });
  grid.addEventListener('pointermove', blockBoardScroll, { passive: false });

  setEditMode(false);
}

init();
