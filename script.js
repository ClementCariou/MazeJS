var mode,
	lastSelected,
	n = 19,
	maze,
	renderer;

function setMode(m) {
	if (lastSelected) lastSelected.classList.remove('selected');
	if (event) {
		event.target.classList.add('selected');
		lastSelected = event.target;
	}
	mode = m;
	if (mode === '2d') {
		c1.style.opacity = '1';
		c2.style.opacity = '0';
	} else {
		c1.style.opacity = '0';
		c2.style.opacity = '1';
		renderer.setMode(m);
	}
}

const c1 = document.querySelector('#c1');
const c2 = document.querySelector('#c2');
twgl.resizeCanvasToDisplaySize(c1);

const ctx = c1.getContext('2d');
const gl = c2.getContext('webgl');

function update(step) {
	if (maze.generated) return;
	console.time('generate');
	maze.generate(step);
	console.timeEnd('generate');
	console.time('generateMesh');
	maze.generateMesh();
	renderer.setMaze(maze);
	console.timeEnd('generateMesh');
	console.time('draw');
	maze.draw(ctx, document.getElementById('debug').checked);
	console.timeEnd('draw');
}

function generate() {
	console.time('init');
	maze = new Maze(n);
	console.timeEnd('init');
	renderer.updatePath();
	update(document.getElementById('debug').checked ? 1 : -1);
}

// Button inputs
function redraw() {
	maze.draw(ctx, document.getElementById('debug').checked);
}

function solve() {
	maze.solve();
	maze.generatePathMesh();
	renderer.updatePath();
	redraw();
}

window.addEventListener('resize', () => {
	twgl.resizeCanvasToDisplaySize(c1);
	maze.draw(ctx, document.getElementById('debug').checked);
});

//User input
function input(code) {
	if (code < 37 || code > 40) return;
	if (mode === 'fps' && code % 2 === 1) {
		renderer.dir = (renderer.dir + (code < 38 ? 1 : -1) + 4) % 4;
		return;
	}
	let dir = mode === 'fps' ? renderer.dir : 1;
	let [ dx, dy ] = [ [ -1, 0 ], [ 0, -1 ], [ 1, 0 ], [ 0, 1 ] ][(code - dir) % 4];
	if (maze.movePlayer(dx, dy)) redraw();
}

window.addEventListener('keydown', (e) => {
	input(e.keyCode);
});

//Swipe gesture support
var touchstartX = 0,
	touchstartY = 0;
window.addEventListener(
	'touchstart',
	function(event) {
		touchstartX = event.touches[0].screenX;
		touchstartY = event.touches[0].screenY;
	},
	false
);
window.addEventListener(
	'touchmove',
	function(event) {
		const dx = Math.abs(event.touches[0].screenX - touchstartX);
		const dy = Math.abs(event.touches[0].screenY - touchstartY);
		if (dx > 50) input(38 + Math.sign(event.touches[0].screenX - touchstartX));
		else if (dy > 50) input(39 + Math.sign(event.touches[0].screenY - touchstartY));
		else return;
		touchstartX = NaN;
		touchstartY = NaN;
	},
	false
);

renderer = new Renderer3D(gl);
setMode('3d');
lastSelected = document.getElementsByClassName('selected')[0];
generate();
renderer.render();
//Generation debug
setInterval(() => {
	if (document.getElementById('debug').checked) update(1);
}, 16);
