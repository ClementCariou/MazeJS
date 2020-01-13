function reconstruct_path(cameFrom, current) {
	var total_path = [ current ];
	while (cameFrom.keys().includes(current)) {
		total_path.unshift(current);
		current = cameFrom[current];
	}
	return total_path;
}

function h(a, b, n) {
	const xa = Math.floor(a / n);
	const ya = a % n;
	const xb = Math.floor(b / n);
	const yb = b % n;
	return (xa - xb) * (xa - xb) + (ya - yb) * (ya - yb);
}

// A* finds a path from start to goal.
function astar(graph, start, goal, n) {
	// For node n, cameFrom[n] is the node immediately preceding it on the cheapest path from start to n currently known.
	var cameFrom = {};

	// For node n, gScore[n] is the cost of the cheapest path from start to n currently known.
	var gScore = new Array(n * n).fill(Infinity);
	gScore[start] = 0;

	// For node n, fScore[n] := gScore[n] + h(n).
	var fScore = new Array(n * n).fill(Infinity);
	fScore[start] = h(start, goal, n);

	while (true) {
		let current = fScore.indexOf(Math.min(...fScore));
		if (current == goal) return reconstruct_path(cameFrom, current);

		for (let neighbor of graph[current]) {
			// tentative_gScore is the distance from start to the neighbor through current
			let tentative_gScore = gScore[current] + 1;
			if (tentative_gScore < gScore[neighbor]) {
				// This path to neighbor is better than any previous one. Record it!
				cameFrom[neighbor] = current;
				gScore[neighbor] = tentative_gScore;
				fScore[neighbor] = gScore[neighbor] + h(neighbor, goal, n);
			}
		}
	}
}
