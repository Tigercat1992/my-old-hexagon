import React, { Component } from 'react';
import './Canvas.css'; 
import { DUMMY_OBSTACLES } from './variables';

export default class Canvas extends Component {
	constructor(props) {
		super(props);
		this.state = {
			hexSize: 20,
			hexSizeX: 18.477,
			hexSizeY: 8,
			hexOrigin: { x: 400, y: 300 },
			currentHex: { q: 0, r: 0, s: 0, x: 0, y: 0 },
			playerPosition: { q: 0, r: 0, s: 0 },
			obstacles: DUMMY_OBSTACLES,
			//frontier: [],
			cameFrom: {},
			hexPathMap: [],
			path: [],
			hexSides: [],
			nearestObstacles: [],
			playerSight: 200,
			endPoints: [],
			enemyPosition: { q: 0, r: 0, s: 0 },
		};
		this.handleMouseMove = this.handleMouseMove.bind(this);
		this.handleClick = this.handleClick.bind(this);
		//this.handleExpandClick = this.handleExpandClick.bind(this);
		this.startMoving = this.startMoving.bind(this);
	}

	componentWillMount() {
		this.setState({
			canvasSize: { canvasWidth: 800, canvasHeight: 600 },
			hexParams: this.getHexParams(this.canvasHex, this.state.hexSize)
		})
	}

	componentDidMount() {
		const { canvasWidth, canvasHeight } = this.state.canvasSize;
		const { hexSize, hexOrigin, playerPosition } = this.state;
		this.canvasHex.width = canvasWidth;
		this.canvasHex.height = canvasHeight;
		this.canvasInteraction.width = canvasWidth;
		this.canvasInteraction.height = canvasHeight;
		this.canvasView.width = canvasWidth;
		this.canvasView.height = canvasHeight;
		this.canvasAnimation.width = canvasWidth;
		this.canvasAnimation.height = canvasHeight;
		this.canvasCoordinates.width = canvasWidth;
		this.canvasCoordinates.height = canvasHeight;
		this.canvasFog.width = canvasWidth;
		this.canvasFog.height = canvasHeight;
		this.canvasFogHide.width = canvasWidth;
		this.canvasFogHide.height = canvasHeight;
		this.getCanvasPosition(this.canvasInteraction);
		this.drawHex(this.canvasInteraction, this.getPointyHexToPixel(playerPosition, hexSize, hexOrigin), hexSize, 1, "black", "yellow");
		this.drawHexes(this.canvasHex, hexSize);
		//this.drawObstacles(this.canvasHex);
		this.addFogOfWar(this.canvasFog);
		setInterval( () => this.getRandomPosition(), 100);
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { hexSize, hexOrigin, enemyPosition, endPoints } = this.state;
		const { canvasWidth, canvasHeight } = this.state.canvasSize;
		/*if(nextState.currentHex !== this.state.currentHex) {
			//const { x, y } = nextState.currentHex;
			const ctx = this.canvasInteraction.getContext("2d");
			ctx.clearRect(0, 0, canvasWidth, canvasHeight);
			//this.drawNeighbors(this.Hex(q, r, s));
			this.drawPath(this.canvasInteraction)
			// let currentDistanceLine = nextState.currentDistanceLine;
			// for(let i = 0; i <= currentDistanceLine.length - 1; i++) {
			// 	if(i === 0)
			// 		this.drawHex(this.canvasInteraction, this.Point(currentDistanceLine[i].x, currentDistanceLine[i].y), hexSize, 1, "black", "red");
			// 	else
			// 		this.drawHex(this.canvasInteraction, this.Point(currentDistanceLine[i].x, currentDistanceLine[i].y), hexSize, 1, "black", "grey");
			// }
			// nextState.obstacles.map( ob => {
			// 	const { q, r, s } = JSON.parse(ob);
			// 	const { x, y } = this.getPointyHexToPixel(this.Hex(q, r, s), hexSize, hexOrigin);
			// 	return this.drawHex(this.canvasInteraction, this.Point(x, y), hexSize, 1, "black", "black")
			// })
			//this.drawHex(this.canvasInteraction, this.Point(x, y), hexSize, 1, "black", "grey");
			return true;
		}*/
		if(!this.areHexesEqual(enemyPosition, nextState.enemyPosition)) {
			const ctx = this.canvasAnimation.getContext('2d');
			if(this.isHexVisible(nextState.enemyPosition, endPoints)) {
				ctx.clearRect(0, 0, canvasWidth, canvasHeight);
				const { x, y } = this.getPointyHexToPixel(nextState.enemyPosition, hexSize, hexOrigin);
				this.drawHex(this.canvasAnimation, this.Point(x, y), hexSize, 1, "black", "red");
				return true;
			}else {
				ctx.clearRect(0, 0, canvasWidth, canvasHeight);
			}
		}
		if(nextState.cameFrom !== this.state.cameFrom) {
			const ctx = this.canvasView.getContext('2d');
			ctx.clearRect(0, 0, canvasWidth, canvasHeight);
			for(let l in nextState.cameFrom) {
				const { q, r, s } = JSON.parse(l);
				const { x, y } = this.getPointyHexToPixel(this.Hex(q, r, s), hexSize, hexOrigin);
				this.drawHex(this.canvasView, this.Point(x, y), hexSize, 1, "green", "transparent")
				//let from = JSON.parse(nextState.cameFrom[l]);
				//let fromCoord = this.getPointyHexToPixel(this.Hex(from.q, from.r), hexSize, hexOrigin);
				//this.drawArrow(this.canvasView, fromCoord.x, fromCoord.y, x, y, "red", 2);
			}
			return true;
		}
		return false;
	}

//draw Hexes function (1) # Responsive in any canvas size
	drawHexes() {
		const { hexSize, hexOrigin, hexParams, canvasSize, obstacles, playerPosition } = this.state;
		const { canvasWidth, canvasHeight } = this.state.canvasSize;
		const { hexWidth, hexHeight } = this.state.hexParams;
		const { leftSide, rightSide, topSide, bottomSide } = this.getHexesAreaOnCanvas(canvasSize, hexOrigin, hexParams);
		
		let hexPathMap = [];
		let p = 0;
		for(let r = 0; r <= bottomSide; r++) {
			if(r%2 === 0 && r !== 0) p++;
			for(let q = -leftSide; q <= rightSide; q++) {
				const center = this.getPointyHexToPixel(this.Hex(q-p, r), hexSize, hexOrigin);
				if( (center.x > hexWidth/2 && center.x < canvasWidth - hexWidth/2) &&
					(center.y > hexHeight/2 && center.y < canvasHeight - hexHeight/2) ) {
					this.drawHex(this.canvasHex, center, hexSize, "green", 1, "grey");
					//this.drawHexCoordRowAndColumn(this.canvasCoordinates, center, this.Hex(q-p, r, -(q-p)-r));
					let bottomH = JSON.stringify(this.Hex(q-p, r, -(q-p)-r));
					if(!obstacles.includes(bottomH)) {
						hexPathMap.push(bottomH);
					}
				}
			}
		}
		
		let n = 0;
		for(let r = -1; r >= -topSide; r--) {
			if(r%2 !== 0) n++;
			for(let q = -leftSide; q <= rightSide; q++) {
				const center = this.getPointyHexToPixel(this.Hex(q+n, r), hexSize, hexOrigin);
				if( (center.x > hexWidth/2 && center.x < canvasWidth - hexWidth/2) &&
					(center.y > hexHeight/2 && center.y < canvasHeight - hexHeight/2) ) {
					this.drawHex(this.canvasHex, center, hexSize, 1, "green", "grey");
					//this.drawHexCoordRowAndColumn(this.canvasCoordinates, center, this.Hex(q+n, r, -(q+n)-r));
					var topH = JSON.stringify(this.Hex(q+n, r, -(q+n)-r));
					if(!obstacles.includes(topH)) {
						hexPathMap.push(topH);
					}
				}
			}
		}

		hexPathMap = [].concat(hexPathMap);
		this.setState(
			{ hexPathMap },
			this.breadthFirstSearchCallback = () => this.breadthFirstSearch(playerPosition)
		)
	}

	getHexesAreaOnCanvas({canvasWidth, canvasHeight}, hexOrigin, hexParams) {
		let leftSide = Math.round( hexOrigin.x / hexParams.horizDist );
		let rightSide = Math.round( (canvasWidth - hexOrigin.x) / hexParams.horizDist );
		let topSide = Math.round( hexOrigin.y / hexParams.vertDist );
		let bottomSide = Math.round( (canvasHeight - hexOrigin.y) / hexParams.vertDist );
		return { leftSide, rightSide, topSide, bottomSide };
	}
//draw Hexes function (1) END

	drawHex(canvasID, center, size, lineWidth, lineColor, fillColor) {
		for(let i = 0; i <= 5; i++) {
			let start = this.getPointyHexCornerCoord(center, size, i);
			let end = this.getPointyHexCornerCoord(center, size, i + 1);
			this.fillHex(canvasID, center, fillColor, size);
			this.drawLine(canvasID, start, end, lineWidth, lineColor);
		} 
	}

	drawPath(canvasID) {
		let { path, hexSize, hexOrigin } = this.state;
		for (let i = 0; i <= path.length - 1; i++) {
			const { q, r } = JSON.parse(path[i]);
			const { x, y } = this.getPointyHexToPixel(this.Hex(q, r), hexSize, hexOrigin);
			this.drawHex(canvasID, this.Point(x, y), hexSize, 1, "black", "lime");
		}
	}

	drawArrow(canvasID, fromX, fromY, toX, toY, color, lineWidth) {
		const ctx = canvasID.getContext("2d");
		const headlen = lineWidth * 5 / 2;
		const angle = Math.atan2(toY - fromY, toX - fromX);
		ctx.beginPath();
		ctx.moveTo(fromX, fromY);
		ctx.lineTo(toX, toY);
		ctx.strokeStyle = color;
		ctx.lineWidth = lineWidth * 3 / 2;
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(toX, toY);
		ctx.globalAlpha = 0.3;
		ctx.lineTo( 
			toX - headlen * Math.cos(angle - Math.PI / 7), 
			toY - headlen * Math.sin(angle - Math.PI / 7) 
		);
		ctx.lineTo( 
			toX - headlen * Math.cos(angle + Math.PI / 7), 
			toY - headlen * Math.sin(angle + Math.PI / 7) 
		);
		ctx.lineTo(toX, toY);
		ctx.lineTo(
			toX - headlen * Math.cos(angle - Math.PI / 7),
			toY - headlen * Math.sin(angle - Math.PI / 7)
		);
		ctx.strokeStyle = color;
		ctx.lineWidth = lineWidth * 5 / 2;
		ctx.stroke();
		ctx.fillStyle = color;
		ctx.fill();
	}

	drawObstacles(endPoints, canvasID) {
		const { hexSize, hexOrigin, obstacles } = this.state;
		// obstacles.map( ob => {
		// 	const { q, r, s } = JSON.parse(ob);
		// 	const { x, y } = this.getPointyHexToPixel(this.Hex(q, r, s), hexSize, hexOrigin);
		// 	return this.drawHex(canvasID, this.Point(x, y), hexSize, 1, "black", "black");
		// });
		obstacles.map( (ob, i) => {
			if( this.isHexVisible(JSON.parse(ob), endPoints) ) {
				const { q, r, s } = JSON.parse(ob);
				const { x, y } = this.getPointyHexToPixel(this.Hex(q, r, s), hexSize, hexOrigin);
				this.drawHex(this.canvasHex, this.Point(x, y), hexSize, 1, "black", "aqua");
				this.drawHex(this.canvasFog, this.Point(x, y), hexSize, 1, "black", "aqua");
				this.drawHex(this.canvasFogHide, this.Point(x, y), hexSize, 1, "black", "aqua");
			}	
			return null;
		});
	}
 
	// drawNeighbors(h) {
	// 	const { hexSize, hexOrigin } = this.state;
	// 	for(let i = 0; i <= 5; i++) {
	// 		const {q, r, s} = this.getCubeNeighbor(this.Hex(h.q, h.r, h.s), i);
	// 		const {x, y} = this.getPointyHexToPixel(this.Hex(q, r, s), hexSize, hexOrigin);
	// 		this.drawHex(this.canvasInteraction, this.Point(x, y), hexSize, 1, "darkBlue", "grey");
	// 	}
	// }

	getHexBeamsCoord(center, range, i) {
		let angle_deg = 1 * i + 30;
		let angle_rad = Math.PI / 180 * angle_deg;
		let x = center.x + range * Math.cos(angle_rad);
		let y = center.y + range * Math.sin(angle_rad);
		return this.Point(x, y);
	}

	getBeamsCoord(center, range, i) {
		let angle_deg = 1 * i;
		let angle_rad = Math.PI / 180 * angle_deg;
		let x = center.x + range * Math.cos(angle_rad);
		let y = center.y + range * Math.sin(angle_rad);
		return this.PointWithAngle(x, y, angle_deg);
	}

	startMoving(path) {
		const { hexSize, hexOrigin } = this.state;
		if(path.length === 0) {
			clearInterval(this.intervalID);
		} else {
			const { canvasWidth, canvasHeight } = this.state.canvasSize;
			const ctx = this.canvasInteraction.getContext("2d");
			ctx.clearRect(0, 0, canvasWidth, canvasHeight);
			let current = path.pop();
			const { q, r, s } = JSON.parse(current);
			const { x, y } = this.getPointyHexToPixel(this.Hex(q, r, s), hexSize, hexOrigin);
			this.drawHex(this.canvasInteraction, this.Point(x, y), hexSize, 1, "black", "yellow");
			this.setState(
				{ playerPosition: this.Hex(q, r, s) },
				this.breadthFirstSearchCallback = () => this.breadthFirstSearch(this.state.playerPosition)
			);
		}
	}

	visibleField(canvasID) {
		const { playerPosition, hexSides, hexSize, hexOrigin } = this.state;
		let endPoints = [];
		let center = this.getPointyHexToPixel(playerPosition, hexSize, hexOrigin);
		for(let j = 0; j < 360; j++) {
			//let beam = this.getHexBeamsCoord(center, 800, j);
			let beam = this.getBeamsCoord(center, 800, j);
			for(let i = 0; i < hexSides.length; i++) {
				let side = JSON.parse(hexSides[i]);
				//this.drawLine(canvasID, {x: side.start.x, y: side.start.y}, {x: side.end.x, y: side.end.y}, 2, "red");
				let intersect = this.lineIntersect(center.x, center.y, beam.x, beam.y, side.start.x, side.start.y, side.end.x, side.end.y);
				if(intersect) {
					const distance = this.getDistance(center, intersect);
					if(distance < this.state.playerSight) {
						//this.drawLine(canvasID, center, intersect, 1, "yellow");
						const point = this.PointWithAngle(intersect.x, intersect.y, beam.a);
						//endPoints.push(intersect);
						endPoints.push(point);
					}else {
						const t = this.state.playerSight / distance;
						//const point = this.Point( (1 - t) * center.x + t * intersect.x, (1 - t) * center.y + t * intersect.y );
						const point = this.PointWithAngle( (1 - t) * center.x + t * intersect.x, (1 - t) * center.y + t * intersect.y, beam.a );
						//this.drawLine(canvasID, center, point, 1, "yellow"); 	
						endPoints.push(point);
					}
					break;
				}
			}
		}
		this.setState({ endPoints });
		this.clearFogOfWar(endPoints, canvasID);
		this.drawObstacles(endPoints);
		// if( this.isHexVisible(this.Hex(0, 0, 0), endPoints) ) {
		// 	this.drawHex(this.canvasInteraction, this.getPointyHexToPixel(this.Hex(0, 0, 0), hexSize, hexOrigin), hexSize, 1, "black", "red");
		// }
	}

	isHexVisible(hex, endPoints) {
		const { playerPosition, hexSize, hexOrigin } = this.state;
		const playerCenter = this.getPointyHexToPixel(playerPosition, hexSize, hexOrigin);
		const hexCenter = this.getPointyHexToPixel(hex, hexSize, hexOrigin);
		//this.drawLine(this.canvasInteraction, playerCenter, hexCenter, 2, "blue");
		for(let i = 0; i < 6; i++) {
			const start = this.getPointyHexCornerCoord(hexCenter, hexSize, i);
			const end = this.getPointyHexCornerCoord(hexCenter, hexSize, i + 1);
			const sideCenter = {
				x: (start.x + end.x) / 2,
				y: (start.y + end.y) / 2,
			};
			const deltaX = sideCenter.x - playerCenter.x;
			const deltaY = sideCenter.y - playerCenter.y;
			let angle = Math.round(Math.atan2(deltaY, deltaX) * 180 / Math.PI);
			if(angle < 0) angle = angle + 360;
			const beam = endPoints.filter(v => v.a === angle)[0];
			if(beam) {
				//this.drawLine(this.canvasInteraction, playerCenter, beam, 2, "yellow"); 	
				for(let i = 0; i < 6; i++) {
					const start = this.getPointyHexCornerCoord(hexCenter, hexSize, i);
					const end = this.getPointyHexCornerCoord(hexCenter, hexSize, i + 1);
					const intersect = this.lineIntersect(playerCenter.x, playerCenter.y, beam.x, beam.y, start.x, start.y, end.x, end.y);
					if(intersect !== false) {
						return true;
					}
				}
			}
		}
		return false;
	} 

	clearFogOfWar(endPoints, canvasID) {
		const { playerPosition, hexSize, hexOrigin, playerSight, canvasSize } = this.state;
		const { canvasWidth, canvasHeight } = canvasSize;
		const ctxCanvasFog = this.canvasFog.getContext("2d");
		const center = this.getPointyHexToPixel(playerPosition, hexSize, hexOrigin);
		ctxCanvasFog.beginPath();
		const rGCanvasFog = ctxCanvasFog.createRadialGradient(center.x, center.y, playerSight - 100, center.x, center.y, playerSight);
		rGCanvasFog.addColorStop(0, "rgba(0, 0, 0, 1)");
		rGCanvasFog.addColorStop(0.9, "rgba(0, 0, 0, 0.1)");
		rGCanvasFog.addColorStop(1, "rgba(0, 0, 0, 0)");
		ctxCanvasFog.fillStyle = rGCanvasFog;
		ctxCanvasFog.moveTo(endPoints[0].x, endPoints[0].y);

		const ctxCanvasFogHide = this.canvasFogHide.getContext("2d");
		ctxCanvasFogHide.globalCompositeOperation = "source-out";
		ctxCanvasFogHide.clearRect(0, 0, canvasWidth, canvasHeight);
		ctxCanvasFogHide.fillStyle = "rgba(0, 0, 0, 0.7)";
		ctxCanvasFogHide.fillRect(0, 0, canvasWidth, canvasHeight);

		ctxCanvasFogHide.beginPath();
		const rGCanvasFogHide = ctxCanvasFogHide.createRadialGradient(center.x, center.y, playerSight - 100, center.x, center.y, playerSight);
		rGCanvasFogHide.addColorStop(0, "rgba(0, 0, 0, 1)");
		rGCanvasFogHide.addColorStop(0.9, "rgba(0, 0, 0, 0.1)");
		rGCanvasFogHide.addColorStop(1, "rgba(0, 0, 0, 0)");
		ctxCanvasFogHide.globalCompositeOperation = "destination-out";
		ctxCanvasFogHide.fillStyle = rGCanvasFogHide;
		ctxCanvasFogHide.moveTo(endPoints[0].x, endPoints[0].y);

		for(let i = 0; i < endPoints.length; i++) {
			if( i + 1 === 360) {
				ctxCanvasFog.lineTo(endPoints[i].x, endPoints[i].y);
				ctxCanvasFogHide.lineTo(endPoints[i].x, endPoints[i].y);
				//this.drawLine(canvasID, endPoints[i], endPoints[0], 1, "yellow"); 	
			}else {
				ctxCanvasFog.lineTo(endPoints[i].x, endPoints[i].y);
				ctxCanvasFogHide.lineTo(endPoints[i].x, endPoints[i].y);
				//this.drawLine(canvasID, endPoints[i], endPoints[i + 1], 1, "yellow"); 	
			}
		}
		ctxCanvasFogHide.closePath();
		ctxCanvasFogHide.fill();
		ctxCanvasFog.closePath();
		ctxCanvasFog.fill();
	}

	getObstacleSides() { // JSON OBJECT OF ARRAY
		const { hexSize, hexOrigin, nearestObstacles, playerPosition } = this.state;
		const { q, r, s } = playerPosition;
		const playerPositionCenter = this.getPointyHexToPixel(this.Hex(q, r, s), hexSize, hexOrigin);
		let arr = [];
		nearestObstacles.map( ob => {
			let hexCenter = this.getPointyHexToPixel(JSON.parse(ob), hexSize, hexOrigin);
			let fromPlayerToHex = Math.floor(this.getDistance(playerPositionCenter, hexCenter));
			for(let i = 0; i < 6; i++) {
				let neighbor = JSON.stringify(this.getCubeNeighbor(JSON.parse(ob), i) );
				if( !nearestObstacles.includes(neighbor) ) {
					let start = this.getPointyHexCornerCoord(hexCenter, hexSize, i);
					let end = this.getPointyHexCornerCoord(hexCenter, hexSize, i + 1);
					let center = { x: ((start.x + end.x)/2), y: ((start.y + end.y)/2) };
					let fromPlayerToSide = Math.floor(this.getDistance(playerPositionCenter, center));
					let side = JSON.stringify({start, end});
					if(fromPlayerToSide <= fromPlayerToHex && !arr.includes(side)) {
						arr.push(side);
					}else {
						continue;
					}
				}
			}
			return null;
		});
		this.setState({
			hexSides: arr
		}, this.visibleFieldCallback = () => this.visibleField(this.canvasInteraction))
	}

	getDistance(l1, l2) {
		return Math.hypot(l2.x-l1.x, l2.y-l1.y);
	}

	getPath(start, current) {
		const { cameFrom } = this.state;
		start = JSON.stringify(start);
		current = JSON.stringify(current);
		if(cameFrom[current] !== undefined) {
			var path = [current];
			while (current !== start) { 
				current = cameFrom[current];
				path.push(current);
			}
			path = [].concat(path);
			this.setState({ path });
		}
	}

	breadthFirstSearch(playerPosition) {
		let { hexPathMap, obstacles } = this.state;
		let cameFrom = {};
		let current = [];
		let nearestObstacles = [];
		let frontier = [playerPosition];
		cameFrom[JSON.stringify(playerPosition)] = JSON.stringify(playerPosition);
		let objMaker = (l) => {
			if(!cameFrom.hasOwnProperty(JSON.stringify(l)) && hexPathMap.includes(JSON.stringify(l))) {
				frontier.push(l);
				cameFrom[JSON.stringify(l)] = JSON.stringify(current);
			}
			if(obstacles.includes(JSON.stringify(l))) {
				nearestObstacles.push(JSON.stringify(l));
			}
		};
		while (frontier.length !== 0) {
			current = frontier.shift();
			let arr = this.getNeighbors(current);
			arr.map(objMaker)
		};
		cameFrom = Object.assign({}, cameFrom);
		this.setState({ 
			cameFrom,
			nearestObstacles 
		}, this.getObstacleSidesCallback = () => this.getObstacleSides());
	}

	addObstacles() {
		const { q, r, s } = this.state.currentHex;
		let { obstacles } = this.state;
		if(!obstacles.includes(JSON.stringify(this.Hex(q, r, s)))) {
			obstacles = [].concat(obstacles, JSON.stringify(this.Hex(q, r, s)));
		} else {
			obstacles.map( (ob, index) => {
				if(ob === JSON.stringify(this.Hex(q, r, s))) {
					obstacles = obstacles.slice(0, index).concat(obstacles.slice(index+1));
				}
				return null;
			});
		}
		this.setState({ obstacles });
	}

	addFogOfWar(canvasID) {
		const { canvasWidth, canvasHeight } = this.state.canvasSize;
		const ctx = canvasID.getContext("2d");
		ctx.fillStyle = "black";
		ctx.fillRect(0, 0, canvasWidth, canvasHeight);
		ctx.globalCompositeOperation = "destination-out";
	}

	getRandomPosition() {
		const { enemyPosition, obstacles } = this.state;
		const neighbor = this.getNeighbors(enemyPosition);
		const randomNeighbor = Math.floor(Math.random() * (6 - 0)) + 0;
		if( !this.isHexIncluded(obstacles, neighbor[randomNeighbor]) ) {
			this.setState({ enemyPosition: neighbor[randomNeighbor] });
		}
	}

	isHexIncluded(arr, hex) {
		const result = arr.includes( JSON.stringify(this.Hex(hex.q, hex.r, hex.s)) );
		//const result = arr.filter(v => (v.q === hex.q && v.r === hex.r && v.s === hex.s));
		//return result.length === 0 ? false : true;
		return result;
	}

	areHexesEqual(h1, h2) {
		return h1.q === h2.q && h1.r === h2.r && h1.s === h2.s;
	}

	handleClick() {
		clearInterval(this.intervalID);
		const { currentHex, cameFrom, path } = this.state;
		const { q, r, s } = currentHex;
		if(cameFrom[JSON.stringify(this.Hex(q, r, s))]) {
			path.pop();
			this.intervalID = setInterval(() => this.startMoving(path), 100);
		}
		//this.setState({ playerPosition: this.state.currentHex });
		//this.addObstacles();
	}

	handleMouseMove(event) {
		const { canvasPosition, hexSize, hexOrigin } = this.state;
		const { canvasWidth, canvasHeight } = this.state.canvasSize;
		const { hexWidth, hexHeight } = this.state.hexParams;
		let offsetX = event.pageX - canvasPosition.left;
		let offsetY = event.pageY - canvasPosition.top;		
		const { q, r, s } = this.cubeRound(this.getPointyPixelToHex(this.Point(offsetX, offsetY), hexSize, hexOrigin));
		const { x, y } = this.getPointyHexToPixel(this.Hex(q, r, s), hexSize, hexOrigin);
		let { playerPosition } = this.state;
		//this.getDistanceLine( this.Hex(playerPosition.q, playerPosition.r, playerPosition.s), this.Hex(q,r,s), hexSize, hexOrigin );
		this.getPath(this.Hex(playerPosition.q, playerPosition.r, playerPosition.s), this.Hex(q, r, s) );

		if((x > hexWidth/2 && x < canvasWidth - hexWidth/2) && (y > hexHeight/2 && y < canvasHeight - hexHeight/2)) {
			this.setState({ currentHex: { q, r, s, x, y } });
		}
	}

	// handleExpandClick() {
	// 	let { frontier, cameFrom, obstacles } = this.state;
	// 	let { q, r, s } = this.state.playerPosition;
	// 	if(frontier.length === 0) {
	// 		frontier.push(this.Hex(q, r, s));
	// 		cameFrom[JSON.stringify(this.Hex(q, r, s))] = JSON.stringify(null);
	// 	}
	// 	let n = 0;
	// 	if(n < 1) {
	// 		let current = frontier.shift();
	// 		let arr = this.getNeighbors(current);
	// 		arr.map( l => {
	// 			if(!cameFrom.hasOwnProperty(JSON.stringify(l)) && !obstacles.includes(JSON.stringify(l))) {
	// 				frontier.push(l);
	// 				cameFrom[JSON.stringify(l)] = JSON.stringify(current);
	// 			}
	// 			return null;
	// 		})
	// 		n++;
	// 	}
	// 	cameFrom = Object.assign({}, cameFrom);
	// 	this.setState({ cameFrom });
	// }

//canvas drawing
	drawLine(canvasID, start, end, lineWidth, lineColor) {
		const ctx = canvasID.getContext('2d');
		ctx.beginPath();
		ctx.moveTo(start.x, start.y);
		ctx.strokeStyle = lineColor;
		ctx.lineWidth = lineWidth;
		ctx.lineTo(end.x, end.y);
		ctx.stroke();
		ctx.closePath();
	}

	fillHex(canvasID, center, fillColor, size) {
		let coor = [];
		[0,1,2,3,4,5].map( i => coor[i] = this.getPointyHexCornerCoord(center, size, i) );
		const ctx = canvasID.getContext('2d');
		ctx.beginPath();
		ctx.fillStyle = fillColor;
		ctx.globalAlpha = 0.5;
		[0,1,2,3,4,5].map( i => ctx.lineTo(coor[i].x, coor[i].y) );
		ctx.closePath();
		ctx.fill();
	}

	drawHexCoordRowAndColumn(canvasID, center, hex) {
		const ctx = canvasID.getContext('2d');
		ctx.fillText(hex.s, center.x - 15, center.y-2);
		ctx.fillText(hex.q, center.x + 3, center.y-2);
		ctx.fillText(hex.r, center.x - 3, center.y + 14);
	}
//canvas drawing END

	render() {
		return (
			<div>
				<canvas ref={canvasHex => this.canvasHex = canvasHex}></canvas>
				<canvas ref={canvasCoordinates => this.canvasCoordinates = canvasCoordinates}></canvas>
				<canvas ref={canvasView => this.canvasView = canvasView}></canvas>
				<canvas ref={canvasAnimation => this.canvasAnimation = canvasAnimation}></canvas>
				<canvas ref={canvasFog => this.canvasFog = canvasFog}></canvas>
				<canvas ref={canvasFogHide => this.canvasFogHide = canvasFogHide}></canvas>
				<canvas 
					ref={canvasInteraction => this.canvasInteraction = canvasInteraction}
					onMouseMove={this.handleMouseMove}
					onClick={this.handleClick}
				></canvas>
				<button className="expandButton" onClick={this.handleExpandClick}>Expand</button>
			</div>
		);
	}

//useful function
	getPointyHexCornerCoord(center, size, i) {
		let angle_deg = 60 * i + 30;
		let angle_rad = Math.PI / 180 * angle_deg;
		// let x = center.x + size * Math.cos(angle_rad);
		// let y = center.y + size * Math.sin(angle_rad);
		const { hexSizeX, hexSizeY } = this.state;
		let x = center.x + hexSizeX * Math.cos(angle_rad);
		let y = center.y + hexSizeY * Math.sin(angle_rad);
		return this.Point(x, y);
	}

	getPointyHexToPixel(hex, size, hexOrigin) {
		// let x = size * (Math.sqrt(3) * hex.q + Math.sqrt(3)/2 * hex.r) + hexOrigin.x;
		// let y = size * (3/2 * hex.r) + hexOrigin.y;
		const { hexSizeX, hexSizeY } = this.state;
		let x = hexSizeX * Math.sqrt(3) * (hex.q + hex.r /2) + hexOrigin.x;
		let y = hexSizeY * (3/2 * hex.r) + hexOrigin.y;
		return this.Point(x, y);
	}

	getPointyPixelToHex(point, size, hexOrigin) {
		// let q = ((point.x - hexOrigin.x) * Math.sqrt(3) / 3 - (point.y - hexOrigin.y) / 3) / size;
		// let r = (point.y - hexOrigin.y) * 2 / 3 / size;
		const { hexSizeX, hexSizeY } = this.state;
		let q = ( ( (point.x - hexOrigin.x) * Math.sqrt(3) / 3 ) / hexSizeX - ((point.y - hexOrigin.y) / 3) / hexSizeY);
		let r = (point.y - hexOrigin.y) * 2 / 3 / hexSizeY;
		return this.Hex(q, r, -q -r);
	}

	getHexParams(hex, size) {
		// let hexWidth = Math.sqrt(3) * size;
		// let hexHeight = 2 * size;
		const { hexSizeY } = this.state;
		let hexWidth = 2 * hexSizeY;
		let hexHeight = 32;
		let horizDist = hexWidth;
		let vertDist = hexHeight * 3 / 4;
		return { hexWidth, hexHeight, horizDist, vertDist };
	}

	cubeDirection(direction) {
		const cubeDirection = [this.Hex(0, 1, -1), this.Hex(-1, 1, 0), this.Hex(-1, 0, 1), 
														this.Hex(0, -1, 1), this.Hex(1, -1, 0), this.Hex(1, 0, -1) ];
		return cubeDirection[ direction ];
	}

	cubeAdd(a, b) {
		return this.Hex(a.q + b.q, a.r + b.r, a.s + b.s);
	}

	getCubeNeighbor(h, direction) {
		return this.cubeAdd(h, this.cubeDirection(direction));
	}

	getNeighbors(h) {
		let arr = [];
		for(let i = 0; i <= 5; i++) {
			const { q, r, s } = this.getCubeNeighbor(this.Hex(h.q, h.r, h.s), i);
			arr.push(this.Hex(q, r, s));
		}
		return arr;
	}

	cubeRound(hex) {
		let rq = Math.round(hex.q);
		let rr = Math.round(hex.r);
		let rs = Math.round(hex.s);
		let q_diff = Math.abs(rq - hex.q);
		let r_diff = Math.abs(rr - hex.r);
		let s_diff = Math.abs(rs - hex.s);
		if(q_diff > r_diff && q_diff > s_diff) {
			rq = - rr - rs;
		}else if(r_diff > s_diff) {
			rr = - rq - rs;
		}else {
			rs = - rq - rr;
		}
		return this.Hex(rq, rr, rs);
	}

	getDistanceLine(hexA, hexB, size, hexOrigin) {
		let dist = this.cubeDistance(hexA, hexB);
		let arr = [];
		for(let i = 0; i <= dist; i++) {
			let center = this.getPointyHexToPixel( 
				this.cubeRound( this.cubeLinearInt(hexA, hexB, 1.0 / dist * i) ),
				size, hexOrigin 
			);
			arr = [].concat(arr, center);
		}
		this.setState({ currentDistanceLine: arr });
	}

	cubeDistance(hexA, hexB) {
		const { q, r, s } = this.cubeSubstract(hexA, hexB);
		return ( Math.abs(q) + Math.abs(r) + Math.abs(s) ) / 2;
	}

	cubeSubstract(hexA, hexB) {
		return this.Hex(hexA.q - hexB.q, hexA.r - hexB.r, hexA.s - hexB.s);
	}

	cubeLinearInt(hexA, hexB, t) {
		return this.Hex(
			this.linearInterpolation(hexA.q, hexB.q, t),
			this.linearInterpolation(hexA.r, hexB.r, t),
			this.linearInterpolation(hexA.s, hexB.s, t)
		);
	}

	linearInterpolation(a, b, t) {
		return (a + (b - a) * t);
	}

	getCanvasPosition(canvasID) {
		let rect = canvasID.getBoundingClientRect();
		this.setState({
			canvasPosition: { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom }
		})
	}

	between(a, b, c) {
		let eps = 0.0000001;
		return a - eps <= b && b <= c + eps;
	}

	lineIntersect(x1, y1, x2, y2, x3, y3, x4, y4) { // 1 = beamStart, 2 = beamEnd, 3 = lineStart, 4 = lineEnd
		let x = ( (x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4) ) /
			      ( (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4) );
		let y = ( (x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) /
			      ( (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4) );
		if(isNaN(x) || isNaN(y)) {
			return false;
		} else {
			if(x1 >= x2) {
				if(!this.between(x2, x, x1)) { return false;}
			}else {
				if(!this.between(x1, x, x2)) { return false;}
			}
			if(y1 >= y2) {
				if(!this.between(y2, y, y1)) { return false;}
			}else {
				if(!this.between(y1, y, y2)) { return false;}
			}
			if(x3 >= x4) {
				if(!this.between(x4, x, x3)) { return false;}
			}else {
				if(!this.between(x3, x, x4)) { return false;}
			}
			if(y3 >= y4) {
				if(!this.between(y4, y, y3)) { return false;}
			}else {
				if(!this.between(y3, y, y4)) { return false;}
			}
		}
		return {x, y};
	}

//useful function END

//helper function
	Point(x, y) {
		return { x: x, y: y };
	}

	PointWithAngle(x, y, a) {
		return { x: x, y: y, a: a };
	}

	Hex(q, r, s) {
		return { q: q, r: r, s: s };
	}
//helper function END

//draw Hexes function (2) # need more or less values of leftSide & rightSide according to canvas size
	// drawHexes() {
	// 	const { hexSize, hexOrigin, hexParams, canvasSize } = this.state;
	// 	const { canvasWidth, canvasHeight } = this.state.canvasSize;
	// 	const { hexWidth, hexHeight, horizDist, vertDist } = this.state.hexParams;
	// 	const { leftSide, rightSide, topSide, bottomSide } = this.getHexesArea(canvasSize, hexOrigin, hexParams);

	// 	for(let r = -topSide; r <= bottomSide; r++) {
	// 		for(let q = -leftSide; q <= rightSide; q++) {
	// 			let center = this.getPointyHexToPixel(this.Hex(q, r), hexSize, hexOrigin);
	// 			if( (center.x > hexWidth/2 && center.x < canvasWidth - hexWidth/2) &&
	// 				(center.y > hexHeight/2 && center.y < canvasHeight - hexHeight/2) ) {
	// 				this.drawHex(this.canvasHex, center, hexSize);
	// 				this.drawHexCoordRowAndColumn(this.canvasHex, center, this.Hex(q, r));
	// 			}
	// 		}
	// 	}
	// }

	// getHexesArea({canvasWidth, canvasHeight}, hexOrigin, hexParams) {
	// 	let leftSide = Math.round( hexOrigin.x / hexParams.horizDist ) * 2;
	// 	let rightSide = Math.round( (canvasWidth - hexOrigin.x) / hexParams.horizDist ) * 2;
	// 	let topSide = Math.round( hexOrigin.y / hexParams.vertDist );
	// 	let bottomSide = Math.round( (canvasHeight - hexOrigin.y) / hexParams.vertDist );
	// 	return { leftSide, rightSide, topSide, bottomSide };
	// }
//draw Hexes function (2) END

}