const canvas = document.getElementById('c')
const ctx = canvas.getContext('2d')
const badge = document.getElementById('badge')
canvas.width = window.innerWidth
canvas.height = window.innerHeight

let color = '#ff3b30', size = 8, erasing = false


let drawMode = true   // matches `drawing = true` in main.js
let icons = {}

//Sets all Icons
function toggleIcon(name, on) {
  return icons[`${name}-${on ? 'on' : 'off'}`] ?? ''
}

function setModeIcon(on) {
  document.getElementById('pen').innerHTML = toggleIcon('paint', on)
}

function setEraserIcon(on) {
  document.getElementById('eraser').innerHTML = toggleIcon('eraser', on)
}

async function init() {
    icons = await window.api.all()
    setModeIcon(drawMode)
    setEraserIcon(erasing)
    notch.innerHTML = icons['chevron-down'] ?? '▾'
}
init()

console.log(icons)

const strokes = []     // finished strokes
let redoStack = []     // undone strokes, available for redo
let current = null     // the stroke being drawn right now

// Draw one segment between two points using a stroke's style
function drawSegment(stroke, from, to) {
  ctx.globalCompositeOperation = stroke.erasing ? 'destination-out' : 'source-over'
  ctx.strokeStyle = stroke.color
  ctx.lineWidth = stroke.width
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  ctx.lineTo(to.x, to.y)
  ctx.stroke()
}

// Wipe the canvas and replay every saved stroke in order
function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  for (const stroke of strokes) {
    for (let i = 1; i < stroke.points.length; i++) {
      drawSegment(stroke, stroke.points[i - 1], stroke.points[i])
    }
  }
}

canvas.addEventListener('pointerdown', (e) => {
  current = {
    color,
    width: erasing ? 20 : size,
    erasing,
    points: [{ x: e.clientX, y: e.clientY }]
  }
})

canvas.addEventListener('pointermove', (e) => {
  if (!current) return
  const prev = current.points[current.points.length - 1]
  const next = { x: e.clientX, y: e.clientY }
  current.points.push(next)
  drawSegment(current, prev, next)   // draw just the new piece (fast)
})

window.addEventListener('pointerup', () => {
  if (!current) return
  strokes.push(current)
  redoStack = []        // a new stroke erases the redo "future"
  current = null
})

function undo() {
  if (strokes.length === 0) return
  redoStack.push(strokes.pop())
  redraw()
}

function redo() {
  if (redoStack.length === 0) return
  strokes.push(redoStack.pop())
  redraw()
}

function clearAll() {
  strokes.length = 0
  redoStack = []
  redraw()
}

function toggleIcon(name, on) {
  return icons[`${name}-${on ? 'on' : 'off'}`] ?? ''
}


// Keyboard shortcuts: 1-4 colors, E eraser, [ ] size, Ctrl+Z / Ctrl+Y undo / redo
const colors = { '1': '#000000', '2': '#FFFFFF', '3': '#0a84ff', '4': '#ffd60a' }
window.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey) {
    if (e.key === 'z') undo()
    if (e.key === 'y') redo()
    return
  }
  if (colors[e.key]) { color = colors[e.key]; erasing = false }
  if (e.key === 'e') erasing = !erasing
  if (e.key === '[') size = Math.max(1, size - 3)
  if (e.key === ']') size += 3
})

// Messages from main.js
window.api.onClear(clearAll)
window.api.onMode((on) => {
  badge.textContent = on ? 'DRAW' : 'PASS'
  drawMode = on
  setModeIcon(on)
})

// ---- Toolbar ----
const ui = document.getElementById('ui')
const notch = document.getElementById('notch')
const toolbar = document.getElementById('toolbar')

// Window is clickable only while the cursor is over the toolbar area
ui.addEventListener('mouseenter', () => window.api.setInteractive(true))
ui.addEventListener('mouseleave', () => window.api.setInteractive(false))

// Notch expands/collapses the toolbar
notch.addEventListener('click', () => {
  const open = ui.classList.toggle('open');
  toolbar.classList.toggle('hidden', !open);
  notch.textContent = open ? '▴' : '▾';
});

//Colors
document.querySelectorAll('.color').forEach((btn) => {
  btn.addEventListener('click', () => {
    color = btn.dataset.color
    erasing = false
  })
})

//Color Wheel
const wheel = document.getElementById('wheel');
const wheelInput = document.getElementById('wheel-input');
let applying = false;

wheel.addEventListener('click', () => {
  if (!applying) wheelInput.click();   // open the picker on a real click
});

wheelInput.addEventListener('input', () => {
  wheel.dataset.color = wheelInput.value;
  applying = true;
  wheel.click();                       // reuse your existing .color handler
  applying = false;
});

document.getElementById('eraser').innerHTML = toggleIcon("eraser", erasing)
document.getElementById('eraser').addEventListener('click', () => {
    erasing = !erasing
    document.getElementById('eraser').innerHTML = toggleIcon("eraser", erasing);
})
document.getElementById('undo').addEventListener('click', undo)
document.getElementById('redo').addEventListener('click', redo)
document.getElementById('clear').addEventListener('click', clearAll)

document.getElementById('pen').addEventListener('click', () => {
    window.api.toggleMode();
})


document.getElementById('quit').addEventListener('click', () => window.api.quit())
document.getElementById('save').addEventListener('click', () => {
    const dataURL = canvas.toDataURL("image/png")

    const base64Data = dataURL.replace(/^data:image\/png;base64,/, "");

    window.api.save(base64Data);
})
