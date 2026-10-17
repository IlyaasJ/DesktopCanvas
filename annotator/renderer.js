const canvas = document.getElementById('c')
const ctx = canvas.getContext('2d')
const badge = document.getElementById('badge')
canvas.width = window.innerWidth
canvas.height = window.innerHeight

let color = '#ff3b30'
let sizes = {pen: 8, eraser: 16, trace: 2};
let state = "" // states: pen, erase, trace
let canPass = true   // matches `drawing = true` in main.js
let icons = {}
const strokes = []     // finished strokes
let redoStack = []     // undone strokes, available for redo
let current = null     // the stroke being drawn right now

// ---- Toolbar ----
const ui = document.getElementById('ui')
const notch = document.getElementById('notch')
const toolbar = document.getElementById('toolbar')
const sizeControl = document.getElementById('size-control');
const sizeTools = ['pen', 'erase', 'arrow'];


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


//Waits for all icon data
async function initIcons() {
    icons = await window.api.all()
    notch.innerHTML = icons['chevron-down'] ?? '▾'

    for(const [key, value] of Object.entries(icons))
    {
	const iconName = key.replace(/-on|-off/g, "")

	const button = document.getElementById(iconName)
	
	if (button){
	    document.getElementById(iconName).innerHTML = icons[`${iconName}-${'off'}`] ?? '';
	}
    }
	

}
initIcons()


// Draw one segment between two points using a stroke's style
function drawSegment(stroke, from, to) {
    const size = sizes[state]
    let GCO
    if (state == "erase") GCO = 'destination-out' 
    if (state == "pen")	  GCO = 'source-over'

    ctx.globalCompositeOperation = GCO
    ctx.strokeStyle = stroke.color
    ctx.lineWidth = size
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


//Toggles States
function toggleState(to){
    if(state == to){
	sizeControl.classList.toggle('show', false);
	document.getElementById(to).classList.toggle("active")
	document.getElementById(state).innerHTML = icons[`${state}-${'off'}`] ?? '';
	state = ""

	document.getElementById('toolbar').classList.toggle('hidden', true);
	window.api.toggleMode();
	return
    }

    if (!state){
	document.getElementById('toolbar').classList.toggle('hidden', false);
	window.api.toggleMode();
    } else {
	document.getElementById(state).innerHTML = icons[`${state}-off`] ?? '';
	document.getElementById(state).classList.toggle("active")
    }

    document.getElementById(to).classList.toggle("active")
    sizeControl.classList.toggle('show', true);
    document.getElementById(to).innerHTML = icons[`${to}-on`] ?? '';
    state = to
    badge.textContent = state.toUpperCase()
}


//Canvas Listeners
canvas.addEventListener('pointerdown', (e) => {
  current = {
    color,
    points: [{ x: e.clientX, y: e.clientY }]
  }
})

canvas.addEventListener('pointermove', (e) => {
    if (!current) return
    const prev = current.points[current.points.length - 1]
    const next = { x: e.clientX, y: e.clientY }
    current.points.push(next)
    if (state == "pen" || state == "erase") {
	drawSegment(current, prev, next)   // draw just the new piece (fast)
    }
})

//Window Listerners
window.addEventListener('pointerup', () => {
  if (!current) return
  strokes.push(current)
  redoStack = []        // a new stroke erases the redo "future"
  current = null
})

// Keyboard shortcuts: 1-4 colors, E eraser, [ ] size, Ctrl+Z / Ctrl+Y undo / redo
const colors = { '1': '#000000', '2': '#FFFFFF', '3': '#0a84ff', '4': '#ffd60a' }
window.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey) {
    if (e.key === 'z') undo()
    if (e.key === 'y') redo()
    return
  }
  if (colors[e.key]) { color = colors[e.key]; erasing = false }
  if (e.key === 'e') toggleState("erase")
  if (e.key === '[') sizes[state] = Math.max(1, sizes[state] - 3)
  if (e.key === ']') sizes[state] += 3
})

// Messages from main.js
window.api.onClear(clearAll)
window.api.onMode((on) => {
    badge.textContent = on ? state.toUpperCase() : 'PASS'
    canPass = on
})



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
  if (!applying) wheelInput.click();  
});

wheelInput.addEventListener('input', () => {
  wheel.dataset.color = wheelInput.value;
  applying = true;
  wheel.click();                       
  applying = false;
});

//Toolbar Listeners
document.getElementById('erase').addEventListener('click', () => {
    toggleState("erase")
})

document.getElementById('pen').addEventListener('click', () => {
    toggleState("pen")
})

const MIN_SIZE = 1;
const MAX_SIZE = 100;
const CURVE = 2;   // higher = slower start, bigger jumps on the right

function sliderToSize(slider) {
    const t = (slider.valueAsNumber - slider.min) / (slider.max - slider.min);   // 0 to 1
    return MIN_SIZE + (MAX_SIZE - MIN_SIZE) * Math.pow(t, CURVE);
}

function sizeToSlider(slider, size) {
    const t = Math.pow((size - MIN_SIZE) / (MAX_SIZE - MIN_SIZE), 1 / CURVE);
    return Number(slider.min) + t * (slider.max - slider.min);
}

let slider = document.getElementById("pen-size")
slider.addEventListener('input', () => {
    // fires continuously while dragging
    const penSize = Math.round(sliderToSize(slider));    
    console.log(penSize)
    sizes[state] = penSize
});



document.getElementById('quit').addEventListener('click', () => window.api.quit())
document.getElementById('undo').addEventListener('click', undo)
document.getElementById('redo').addEventListener('click', redo)
document.getElementById('clear').addEventListener('click', clearAll)
document.getElementById('clear').innerHTML = icons["clear-off"] 
document.getElementById('save').addEventListener('click', () => {
    const dataURL = canvas.toDataURL("image/png")

    const base64Data = dataURL.replace(/^data:image\/png;base64,/, "");

    window.api.save(base64Data);
})



