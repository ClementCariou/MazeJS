function reconstruct_path(cameFrom, current) {
	var total_path = [ current ];
	while (typeof cameFrom[current] === 'number') {
		current = cameFrom[current];
		total_path.unshift(current);
	}
	return total_path;
}

// Heuristic: Manhattan distance
function h(a, b, n) {
	const xa = Math.floor(a / n);
	const ya = a % n;
	const xb = Math.floor(b / n);
	const yb = b % n;
	return Math.abs(xa - xb) + Math.abs(ya - yb);
}

// A* finds a path from start to goal.
function astar(graph, start, goal, n) {
	var closedset = []; // The set of nodes already evaluated.
	var openset = [ start ];
	// For node n, cameFrom[n] is the node immediately preceding it on the cheapest path from start to n currently known.
	var cameFrom = new Array(n * n);

	// For node n, gScore[n] is the cost of the cheapest path from start to n currently known.
	var gScore = new Array(n * n).fill(Infinity);
	gScore[start] = 0;

	// For node n, fScore[n] := gScore[n] + h(n).
	var fScore = new Array(n * n).fill(Infinity);
	fScore[start] = h(start, goal, n);

	while (openset.length > 0) {
		let current = openset[0];
		for (let cmp of openset) if (fScore[current] > fScore[cmp]) current = cmp;
		if (current == goal) return reconstruct_path(cameFrom, current);

		openset.splice(openset.indexOf(current), 1);
		closedset.push(current);

		for (let neighbor of graph[current]) {
			if (closedset.includes(neighbor)) continue;
			// tentative_gScore is the distance from start to the neighbor through current
			let tentative_gScore = gScore[current] + 1; //ditance between two cell is 1
			if (tentative_gScore < gScore[neighbor]) {
				// This path to neighbor is better than any previous one. Record it!
				cameFrom[neighbor] = current;
				gScore[neighbor] = tentative_gScore;
				fScore[neighbor] = gScore[neighbor] + h(neighbor, goal, n);
				if (!openset.includes(neighbor)) openset.push(neighbor);
			}
		}
	}
	return false;
}
