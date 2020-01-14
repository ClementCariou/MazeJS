function shuffle(array) {
	var currentIndex = array.length,
		temporaryValue,
		randomIndex;
	// While there remain elements to shuffle...
	while (0 !== currentIndex) {
		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;
		// And swap it with the current element.
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}
	return array;
}

class Maze {
	constructor(n) {
		this.n = n;
		this.cells = []; // map cells to region ids
		this.regions = []; // map region ids to cells
		this.edges = []; // list of neigbouring cells
		this.graph = []; // graph of the maze
		this.path = [];
		this.generated = false;
		this.player = { x: 0, y: 0 }; //player coordinates
		this.target = { x: n - 1, y: n - 1 }; //target coordinates
		for (var i = 0; i < this.n; i++) {
			this.cells[i] = [];
			for (var j = 0; j < this.n; j++) {
				this.cells[i][j] = i * n + j;
				this.graph[i * this.n + j] = [];
				this.regions[i * this.n + j] = [ { x: i, y: j } ];
			}
			for (var j = 0; j < this.n - 1; j++) {
				this.edges.push({ x1: j, y1: i, x2: j + 1, y2: i });
				this.edges.push({ x1: i, y1: j, x2: i, y2: j + 1 });
			}
		}
	}
	generate(steps) {
		if (this.generated) return;
		steps = steps || -1;
		this.edges = shuffle(this.edges);
		for (var i = 0; i < this.edges.length; i++) {
			//next edge
			const e = this.edges[i];
			//skip if same region
			const id1 = this.cells[e.x1][e.y1];
			const id2 = this.cells[e.x2][e.y2];
			if (id1 === id2) continue;
			//concat regions
			for (var c of this.regions[id2]) this.cells[c.x][c.y] = id1;
			this.regions[id1] = this.regions[id1].concat(this.regions[id2]);
			delete this.regions[id2];
			//remove edge
			this.edges[i--] = this.edges[this.edges.length - 1];
			this.edges.pop();
			//connect nodes
			this.graph[e.x1 * this.n + e.y1].push(e.x2 * this.n + e.y2);
			this.graph[e.x2 * this.n + e.y2].push(e.x1 * this.n + e.y1);
			//step
			if (steps-- === 0) {
				this.coords = false;
				return;
			}
		}
		//invalidate coords
		this.coords = false;
		this.generated = true;
	}
	generateCoords() {
		this.coords = [];
		for (let e of this.edges) {
			//calculate average coord
			const mx = (e.x2 + e.x1 + 1) / 2;
			const my = (e.y2 + e.y1 + 1) / 2;
			//calculate delta coord
			const dx = (e.x2 - e.x1) / 2;
			const dy = (e.y2 - e.y1) / 2;
			//swap dx and dy to draw the edge
			this.coords.push({ x1: mx + dy, y1: my + dx, x2: mx - dy, y2: my - dx });
		}
		//borders
		for (var i = 0; i < this.n; i++) {
			this.coords.push({ x1: i, y1: 0, x2: i + 1, y2: 0 });
			this.coords.push({ x1: this.n, y1: i, x2: this.n, y2: i + 1 });
			this.coords.push({ x1: i, y1: this.n, x2: i + 1, y2: this.n });
			this.coords.push({ x1: 0, y1: i, x2: 0, y2: i + 1 });
		}
	}
	generateMesh() {
		if (!this.coords) this.generateCoords();
		var position = new Float32Array(this.coords.length * 12);
		var normal = new Float32Array(this.coords.length * 12);
		var texcoord = new Float32Array(this.coords.length * 8);
		var indices = new Uint16Array(this.coords.length * 6);
		for (let i = 0; i < this.coords.length; i++) {
			const c = this.coords[i];
			const nx = Math.abs(c.y1 - c.y2);
			const ny = Math.abs(c.x1 - c.x2);
			const x1 = this.n - c.x1; //inverse x coord to match the 2d view
			const x2 = this.n - c.x2;
			position.set([ x1, c.y1, 0, x2, c.y2, 0, x1, c.y1, 1, x2, c.y2, 1 ], i * 12);
			normal.set([ nx, ny, 0, nx, ny, 0, nx, ny, 0, nx, ny, 0 ], i * 12);
			texcoord.set([ 0, 0, 1, 0, 0, 1, 1, 1 ], i * 8);
			indices.set([ i * 4, i * 4 + 1, i * 4 + 2, i * 4 + 1, i * 4 + 2, i * 4 + 3 ], i * 6);
		}
		this.arrays = { position, normal, texcoord, indices };
	}
	generatePathMesh() {
		const w = 0.5;
		var position = new Float32Array(this.path.length * 12);
		var normal = new Float32Array(this.path.length * 12);
		var texcoord = new Float32Array(this.path.length * 8);
		var indices = new Uint16Array(this.path.length * 6);
		for (let i = 0; i < this.path.length; i++) {
			const x1 = this.n - Math.floor(this.path[i] / this.n) - 0.5;
			const y1 = this.path[i] % this.n + 0.5;
			position.set([ x1 - w, y1 - w, 0, x1 - w, y1 + w, 0, x1 + w, y1 - w, 0, x1 + w, y1 + w, 0 ], i * 12);
			normal.set([ 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1 ], i * 12);
			texcoord.set([ 0, 0, 1, 0, 0, 1, 1, 1 ], i * 8);
			indices.set([ i * 4, i * 4 + 1, i * 4 + 2, i * 4 + 1, i * 4 + 2, i * 4 + 3 ], i * 6);
		}
		this.pathArrays = { position, normal, texcoord, indices };
	}
	movePlayer(dx, dy) {
		const from = this.player.x * this.n + this.player.y;
		const to = from + dx * this.n + dy;
		if (!this.graph[from].includes(to)) return false;
		this.player.x += dx;
		this.player.y += dy;
		return true;
	}
	solve() {
		this.path = astar(
			this.graph,
			this.player.x * this.n + this.player.y,
			this.target.x * this.n + this.target.y,
			this.n
		);
	}
	drawingConfig(ctx) {
		const w = ctx.canvas.clientWidth;
		const h = ctx.canvas.clientHeight;
		const s = Math.min(w, h);
		return {
			ox: (w - s) / 2,
			oy: (h - s) / 2,
			ts: s / this.n,
			s
		};
	}
	draw(ctx, debug) {
		if (!this.coords) this.generateCoords();
		this.drawMaze(ctx);
		if (debug) {
			this.drawDebug(ctx);
		} else {
			this.drawCircle(ctx, this.target, 'lime');
			this.drawCircle(ctx, this.player, 'blue');
			this.drawPath(ctx);
		}
	}
	drawMaze(ctx) {
		const { ox, oy, ts, s } = this.drawingConfig(ctx);
		ctx.clearRect(ox, oy, s, s);
		ctx.strokeStyle = 'black';
		ctx.beginPath();
		for (let c of this.coords) {
			ctx.moveTo(c.x1 * ts + ox, c.y1 * ts + oy);
			ctx.lineTo(c.x2 * ts + ox, c.y2 * ts + oy);
		}
		ctx.stroke();
	}
	drawCircle(ctx, pos, color) {
		const { ox, oy, ts } = this.drawingConfig(ctx);
		ctx.fillStyle = color;
		ctx.beginPath();
		ctx.arc((pos.x + 0.5) * ts + ox, (pos.y + 0.5) * ts + oy, ts / 4, 0, 2 * Math.PI);
		ctx.closePath();
		ctx.fill();
	}
	drawPath(ctx) {
		const { ox, oy, ts } = this.drawingConfig(ctx);
		ctx.strokeStyle = 'red';
		ctx.beginPath();
		for (let c of this.path) {
			ctx.lineTo((Math.floor(c / this.n) + 0.5) * ts + ox, (c % this.n + 0.5) * ts + oy);
		}
		ctx.stroke();
	}
	drawDebug(ctx) {
		const { ox, oy, ts } = this.drawingConfig(ctx);
		ctx.strokeStyle = 'black';
		ctx.font = ts / 2 + 'px Lucida Console';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		for (var x = 0; x < this.n; x++) {
			for (var y = 0; y < this.n; y++) {
				ctx.fillText(this.cells[x][y], (x + 0.5) * ts + ox, (y + 0.5) * ts + oy);
			}
		}
	}
}
