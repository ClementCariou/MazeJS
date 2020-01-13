const m4 = twgl.m4;
const v3 = twgl.v3;
const rotOffset = m4.multiply(m4.rotationX(Math.PI / 2), m4.rotationY(Math.PI / 2));

function Renderer3D(gl) {
	this.maze = maze;
	this.setMaze = (maze) => {
		this.maze = maze;
		this.mazeBufferInfo = twgl.createBufferInfoFromArrays(gl, maze.arrays);
	};
	this.fps = false;
	this.setMode = (mode) => {
		this.fps = mode === 'fps';
	};
	this.dir = 0;
	this.aDir = 0;
	this.aPlayer = { x: 0, y: 0 };

	const sphereBufferInfo = twgl.primitives.createSphereBufferInfo(gl, 0.4, 12, 12);
	const programInfo = twgl.createProgramInfo(gl, [ 'vs', 'fs' ]);

	const wallTex = twgl.createTexture(gl, {
		min: gl.NEAREST,
		mag: gl.NEAREST,
		src: [ 255, 255, 255, 255, 192, 192, 192, 255, 192, 192, 192, 255, 255, 255, 255, 255 ]
	});

	const ballTex = twgl.createTexture(gl, {
		min: gl.NEAREST,
		mag: gl.NEAREST,
		src: [ 255, 255, 255, 255 ]
	});

	const uniforms = {
		u_lightWorldPos: [ 100, 200, 500 ],
		u_lightColor: [ 0.95, 0.95, 1, 1 ],
		u_ambient: [ 0.5, 0.5, 0.5, 1 ],
		u_specular: [ 1, 1, 1, 1 ],
		u_shininess: 50,
		u_specularFactor: 0.1,
		u_diffuse: wallTex
	};

	function customInterpolation(from, to) {
		let p = Math.abs(from - to);
		let speed = 0.92;
		if (p < 0.9) speed = speed = 0.75;
		if (p < 0.2) speed = 0.5;
		if (p < 0.1) speed = 0;
		return from * speed + to * (1 - speed);
	}

	this.interpolate = () => {
		if (this.dir == 0 && this.aDir > 2) {
			this.aDir -= 4;
		} else if (this.dir == 3 && this.aDir < 1) {
			this.aDir += 4;
		}
		this.aDir = customInterpolation(this.aDir, this.dir);
		this.aPlayer.x = customInterpolation(this.aPlayer.x, this.maze.player.x);
		this.aPlayer.y = customInterpolation(this.aPlayer.y, this.maze.player.y);
	};

	this.render = (time) => {
		time *= 0.0001;
		this.interpolate();
		const maze = this.maze;
		const n = this.maze.n;
		twgl.resizeCanvasToDisplaySize(gl.canvas);
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

		gl.enable(gl.DEPTH_TEST);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		const fov = (this.fps ? 70 : 60) * Math.PI / 180;
		const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
		const zNear = 0.1;
		const zFar = 3 * n;
		const projection = m4.perspective(fov, aspect, zNear, zFar);
		const eye = [ 0, n / 10, n ];
		const target = [ 0, 0, 0 ];
		const up = [ 0, 0, 1 ];

		var camera = m4.lookAt(eye, target, up);
		if (this.fps) {
			camera = m4.multiply(
				m4.translation(v3.create(n / 2 - this.aPlayer.x - 0.5, this.aPlayer.y - n / 2 + 0.5, 0.6)),
				m4.multiply(m4.rotationZ(Math.PI / 2 * this.aDir), rotOffset)
			);
		}
		const view = m4.inverse(camera);
		const viewProjection = m4.multiply(projection, view);
		var world = m4.translation(v3.create(-n / 2, -n / 2, 0));

		//Draw Maze

		uniforms.u_ambient = [ 0.5, 0.5, 0.5, 1 ];
		uniforms.u_lightColor = [ 0.95, 0.95, 1, 1 ];
		uniforms.u_diffuse = wallTex;
		uniforms.u_viewInverse = camera;
		uniforms.u_world = world;
		uniforms.u_worldInverseTranspose = m4.transpose(m4.inverse(world));
		uniforms.u_worldViewProjection = m4.multiply(viewProjection, world);

		gl.useProgram(programInfo.program);
		twgl.setBuffersAndAttributes(gl, programInfo, this.mazeBufferInfo);
		twgl.setUniforms(programInfo, uniforms);
		gl.drawElements(gl.TRIANGLES, this.mazeBufferInfo.numElements, gl.UNSIGNED_SHORT, 0);

		//Draw Player
		uniforms.u_diffuse = ballTex;
		if (!this.fps) {
			world = m4.translation(v3.create(n / 2 - this.aPlayer.x - 0.5, this.aPlayer.y - n / 2 + 0.5, 0.5));
			uniforms.u_ambient = [ 0, 0, 1, 1 ];
			uniforms.u_lightColor = [ 0.5, 0.5, 1, 1 ];
			uniforms.u_world = world;
			uniforms.u_worldInverseTranspose = m4.transpose(m4.inverse(world));
			uniforms.u_worldViewProjection = m4.multiply(viewProjection, world);

			twgl.setBuffersAndAttributes(gl, programInfo, sphereBufferInfo);
			twgl.setUniforms(programInfo, uniforms);
			gl.drawElements(gl.TRIANGLES, sphereBufferInfo.numElements, gl.UNSIGNED_SHORT, 0);
		}

		//Draw Target
		world = m4.translation(v3.create(n / 2 - maze.target.x - 0.5, maze.target.y - n / 2 + 0.5, 0.5));
		uniforms.u_ambient = [ 0, 1, 0, 1 ];
		uniforms.u_lightColor = [ 0.5, 1, 0.5, 1 ];
		uniforms.u_world = world;
		uniforms.u_worldInverseTranspose = m4.transpose(m4.inverse(world));
		uniforms.u_worldViewProjection = m4.multiply(viewProjection, world);

		twgl.setBuffersAndAttributes(gl, programInfo, sphereBufferInfo);
		twgl.setUniforms(programInfo, uniforms);
		gl.drawElements(gl.TRIANGLES, sphereBufferInfo.numElements, gl.UNSIGNED_SHORT, 0);

		requestAnimationFrame(this.render.bind(this));
	};
}
