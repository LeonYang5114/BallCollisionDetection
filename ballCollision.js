/*
 * Author: Leon Yang
 * Email: gyang48 at wisc dot edu
 */
 "use strict";

function Ball(r, x, y, vx, vy) {
	this.id = Ball.id;
	this.r = r;
	this.mass = r*r;
	this.x = x;
	this.y = y;
	this.vx = vx;
	this.vy = vy;
	this.gridX;
	this.gridY;
	Ball.id++;
};

Ball.id = 0;

function BallManager(gridSize) {
	this.balls = [];
	this.gridSize = gridSize;
	this.grids = [];
	for (let i = 0; i < BallManager.width/gridSize; i++) {
		this.grids[i] = [];
		for (let j = 0; j < BallManager.height/gridSize; j++) {
			this.grids[i][j] = [];
		}
	}
};
BallManager.width = 512;
BallManager.height = 512;

BallManager.updateInterval = 30;
BallManager.horizontal = 0;
BallManager.vertical = 1;

Ball.prototype.distanceTo = function(aBall) {
	return Math.sqrt((this.x-aBall.x)*(this.x-aBall.x)+(this.y-aBall.y)*(this.y-aBall.y));
};

var globalCalls = 0; // all tests attempt evaluate the collTime
var blockedByNeighbors = 0;
var collisionTimeCalls = 0; // all tests reach the collisionTime function (not blocked by the areNeighbors function)
var wallCalls = 0; // all tests of collision with walls
var blockedByEstimation = 0;
var notBlocked = 0;
var validCalls = 0;
var blockedByB = 0;
var blockedByDelta = 0;

function clearVars() {
	globalCalls = blockedByEstimation = blockedByNeighbors = collisionTimeCalls = wallCalls = notBlocked = validCalls = blockedByB = blockedByDelta = 0;
}

// returns the time this ball needs to move to collide with the other ball or the wall
BallManager.prototype.collisionTime = function(b1, b2, timeLag, areNeighbors) {
	collisionTimeCalls++;
	
	// check are b1 and b2 neighbors
	areNeighbors = areNeighbors || this.areNeighbors(b1, b2);
	if (!areNeighbors)
		return BallManager.updateInterval;
	
	// asking for collision time with walls
	if (b2 == BallManager.vertical) {
		wallCalls++;
		let result = BallManager.updateInterval;
		if (b1.vx < 0)
			result = Math.min(result, (b1.x-b1.r)/-b1.vx);
		else if (b1.vx > 0) 
			result = Math.min(result, (BallManager.width-b1.x-b1.r)/b1.vx);
		return result;
	} else if (b2 == BallManager.horizontal) {
		wallCalls++;
		let result = BallManager.updateInterval;
		if (b1.vy < 0) 
			result = Math.min(result, (b1.y-b1.r)/-b1.vy);
		else if (b1.vy > 0) 
			result = Math.min(result, (BallManager.height-b1.y-b1.r)/b1.vy);
		return result;
	}
	
	// timeLag is the time b1 ball lags the other ball
	let relX = b2.x-b1.x-timeLag*((timeLag>0)?b1.vx:b2.vx);
	let relY = b2.y-b1.y-timeLag*((timeLag>0)?b1.vy:b2.vy);
	
	let relVx = b1.vx-b2.vx;
	let relVy = b1.vy-b2.vy;
	
	// sqr(relX-t*relVx)+sqr(relY-t*relVy)=sqr(r1+r2)
	
	let a = relVx*relVx + relVy*relVy;
	
	let b = -2*(relX*relVx+relY*relVy);
	// negative t
	if (b >= 0) {
		blockedByB++;
		return BallManager.updateInterval;
	}
	
	// make sure that c is greater than 0
	let c = relX*relX+relY*relY-(b1.r+b2.r)*(b1.r+b2.r);
	//if (c < 0)
	//	console.log(c);
	
	let delta = b*b-4*a*c;
	if (delta < 0) {
		blockedByDelta++;
		return BallManager.updateInterval;
	}
	
	// return the time when the two b1.balls meet instead of leaving
	let result = (-b-Math.sqrt(delta))/(2*a);
	if (result > BallManager.updateInterval) {
		notBlocked++;
		return BallManager.updateInterval;
	}
	validCalls++;
	return result+((timeLag>0)?timeLag:0);
};
	
BallManager.prototype.move = function(aBall, time) {
	let preGridX = aBall.gridX;
	let preGridY = aBall.gridY;
	aBall.x += time*aBall.vx;
	aBall.y += time*aBall.vy;
	let gridX = Math.floor(aBall.x/this.gridSize);
	let gridY = Math.floor(aBall.y/this.gridSize);
	if (gridX != preGridX || gridY != preGridY) {
		aBall.gridX = gridX;
		aBall.gridY = gridY;
		for (let i = 0; i < this.grids[preGridX][preGridY].length; i++) {
			if (this.grids[preGridX][preGridY][i] == aBall) {
				this.grids[preGridX][preGridY].splice(i, 1);
				break;
			}
		}
		this.grids[gridX][gridY].push(aBall);
	}
};

BallManager.prototype.areNeighbors = function(b1, b2) {
	if (!(b2 instanceof Ball)) {
		return b1.gridX == 0 || b1.gridX == this.grids.length-1 || b1.gridY == 0 || b1.gridY == this.grids[0].length-1;
	}
	return Math.abs(b1.gridX-b2.gridX) <= 1 && Math.abs(b1.gridY-b2.gridY) <= 1;
}

BallManager.prototype.addBall = function(aBall) {
	this.balls.push(aBall);
	aBall.gridX = Math.floor(aBall.x/this.gridSize);
	aBall.gridY = Math.floor(aBall.y/this.gridSize);
	this.grids[aBall.gridX][aBall.gridY].push(aBall);
};

BallManager.prototype.collide = function(b1, b2) {
	// colliding with the wall
	if (b2 == BallManager.vertical) {
		if (Math.abs(b1.x-b1.r) < 0.0001) {
			b1.x = b1.r;
			b1.vx *= -1;
		} else if (Math.abs(b1.x+b1.r-BallManager.width) < 0.0001) {
			b1.x = BallManager.width-b1.r;
			b1.vx *= -1;
		}
		return;
	} else if (b2 == BallManager.horizontal) {
		if (Math.abs(b1.y-b1.r) < 0.0001) {
			b1.y = b1.r;
			b1.vy *= -1;
		} else if (Math.abs(b1.y+b1.r-BallManager.height) < 0.0001) {
			b1.y = BallManager.height-b1.r;
			b1.vy *= -1;
		}
		return;
	}
	
	// velocity components perpendicular to the line through both center will not change
	// velocity components on that line will change depending on the respective momentum
	
	let distance = b1.r + b2.r;
	//if (distance - b1.r - b2.r != 0)
	//	console.log(distance - b1.r - b2.r);
	let c = (b2.x-b1.x)/distance;
	let s = (b2.y-b1.y)/distance;
	let m1 = b1.mass;
	let m2 = b2.mass;
	
	let perpComp1 = b1.vy*c-b1.vx*s;
	let perpComp2 = b2.vy*c-b2.vx*s;
	
	let paraComp1 = b1.vy*s+b1.vx*c;
	let paraComp2 = b2.vy*s+b2.vx*c;
	
	let newParaComp1 = (m2*(2*paraComp2-paraComp1)+m1*paraComp1)/(m1+m2);
	let newParaComp2 = (m1*(2*paraComp1-paraComp2)+m2*paraComp2)/(m1+m2);
	b1.vx = -perpComp1*s+newParaComp1*c;
	b1.vy = perpComp1*c+newParaComp1*s;
	b2.vx = -perpComp2*s+newParaComp2*c;
	b2.vy = perpComp2*c+newParaComp2*s;
	if (Math.abs(b1.vx) > 10 || Math.abs(b1.vy) > 10 || Math.abs(b2.vx) > 10 || Math.abs(b2.vy) > 10)
		console.log(this);
};

//BallManager.prototype.leastColl = function(aBall, ballsMoveTime) {
//	let leastCollTime = ballsMoveTime[aBall.id];
//	let firstCollBall;
//	for (let i = 0; i < this.balls.length && leastCollTime > 0; i++) {
//		if (aBall == this.balls[i])
//			continue;
//		let lag = ballsMoveTime[aBall.id]-ballsMoveTime[this.balls[i].id];
//		let collTime = aBall.collisionTime(this.balls[i], lag);
//		if (collTime != -1 && collTime < leastCollTime) {
//			leastCollTime = collTime;
//			firstCollBall = this.balls[i];
//		}
//	}
//	return {time: leastCollTime, ball: firstCollBall};
//};
//
//BallManager.prototype.moveOneBall = function(aBall, ballsMoveTime, leastCollision) {
//	if (ballsMoveTime[aBall.id] < 0)
//		return;
//	let leastColl = leastCollision || this.leastColl(aBall, ballsMoveTime);
//	if (leastColl.time < ballsMoveTime[aBall.id]) {
//		let lag = ballsMoveTime[aBall.id]-ballsMoveTime[leastColl.ball.id];
//		let anotherLeastColl = this.leastColl(leastColl.ball, ballsMoveTime);
//		// the ball that we are going to collide will collide with another ball before with the current one
//		if (anotherLeastColl.ball != null && anotherLeastColl.ball != aBall && anotherLeastColl.time < leastColl.time - lag) {
//			this.moveOneBall(leastColl.ball, ballsMoveTime, anotherLeastColl);
//			this.moveOneBall(aBall, ballsMoveTime);
//		} else {
//			aBall.move(leastColl.time);
//			leastColl.ball.move(leastColl.time-lag);
//			ballsMoveTime[aBall.id] -= leastColl.time;
//			ballsMoveTime[leastColl.ball.id] = ballsMoveTime[aBall.id];
//			this.collide(aBall, leastColl.ball);
//			this.moveOneBall(aBall, ballsMoveTime);
//			this.moveOneBall(leastColl.ball, ballsMoveTime);
//		}
//	} else {
//		aBall.move(ballsMoveTime[aBall.id]);
//		ballsMoveTime[aBall.id] = -0.0000000000001;
//	}
//};

function CollPair(b1, b2, time) {
	this.b1 = b1;
	this.b2 = b2;
	// the time that next collision will arrive since the start of the interval
	this.time = time;
}

CollPair.compare = function(cp1, cp2) {
	return cp1.time - cp2.time;
};

CollPair.max = new CollPair(null, null, BallManager.updateInterval);

// sorted in increasing order
// compFunc should return negative, positive, or zero
function insertToSorted(sorted, element, max, compFunc) {
	if (compFunc(element, max) >= 0) {
		sorted.push(element);
		return;
	}		
	let start = 0;
	let end = sorted.length;
	while(true) {
		if (end == start) {
			sorted.splice(end, 0, element);
			return;
		}
		let mid = Math.floor((start+end)/2);
		let relative = compFunc(element, sorted[mid]);
		if (relative == 0) {
			sorted.splice(mid, 0, element);
			return;
		} else if (relative > 0) {
			start = mid + 1;
		} else {
			end = mid;
		}
	}
}

BallManager.ballsMoveTime = [];
BallManager.sortedCollPairs = [];

BallManager.prototype.moveBalls = function() {
	// the time that each ball has moved in this interval
	let timePass = BallManager.ballsMoveTime;
	let collPairs = BallManager.sortedCollPairs;
	if (collPairs.length == 0) {
		for (let i = 0; i < this.balls.length; i++) {
			timePass[this.balls[i].id] = 0;
			let b1 = this.balls[i];
			let collHorizontal = this.collisionTime(b1, BallManager.horizontal);
			let collVertical = this.collisionTime(b1, BallManager.vertical);
			insertToSorted(collPairs, new CollPair(b1, BallManager.horizontal, collHorizontal), CollPair.max, CollPair.compare);
			insertToSorted(collPairs, new CollPair(b1, BallManager.vertical, collVertical), CollPair.max, CollPair.compare);
			for (let j = i + 1; j < this.balls.length; j++) {
				let b2 = this.balls[j];
				let collTime;
				globalCalls++;
				collTime = this.collisionTime(b1, b2, 0);
				let cp = new CollPair(b1, b2, collTime);
				insertToSorted(collPairs, cp, CollPair.max, CollPair.compare);
			}
		}
	} else {
		for (let i of collPairs) {
			globalCalls++;
			i.time = i.b1.collisionTime(i.b2, 0);
		}
		collPairs.sort(CollPair.compare);
	}
	
	let cp = collPairs[0];
	while (cp.time < BallManager.updateInterval) {
		
		this.move(cp.b1, cp.time-timePass[cp.b1.id]);
		timePass[cp.b1.id] = cp.time;
		if (cp.b2 instanceof Ball) {
			this.move(cp.b2, cp.time-timePass[cp.b2.id]);
			timePass[cp.b2.id] = cp.time;
		}
		this.collide(cp.b1, cp.b2);
		
		let modifiedPairs = [];
		if (cp.b2 instanceof Ball) {
			for(let i = 0; i < collPairs.length; i++) {
				let curr = collPairs[i];
				if (curr.b1 != cp.b1 && curr.b1 != cp.b2 && curr.b2 != cp.b1 && curr.b2 != cp.b2)
					continue;
				if (!this.areNeighbors(curr.b1, curr.b2))
					continue;
				let currLag = timePass[curr.b2.id] - timePass[curr.b1.id];
				let newTime = Math.min(BallManager.updateInterval, timePass[curr.b1.id] + curr.b1.collisionTime(curr.b2, currLag, true));
				if (newTime != curr.time) {
					curr.time = newTime;
					modifiedPairs.push(curr);
					collPairs[i] = null;
				}
			}
		} else {
			for(let i = 0; i < collPairs.length; i++) {
				let curr = collPairs[i];
				if (curr.b1 != cp.b1 && curr.b2 != cp.b1)
					continue;
				if (!this.areNeighbors(curr.b1, curr.b2))
					continue;
				let newTime = Math.min(BallManager.updateInterval, timePass[curr.b1.id] + curr.b1.collisionTime(curr.b2, null, true));
				if (newTime != curr.time) {
					curr.time = newTime;
					modifiedPairs.push(curr);
					collPairs[i] = null;
				}
			}
		}
		
		let count = 0;
		for (let i of collPairs) {
			if (i){
				collPairs[count] = i;
				count++;
			}
		}
		collPairs.splice(count, collPairs.length-count);
		
		for (let i of modifiedPairs) {
			insertToSorted(collPairs, i, CollPair.max, CollPair.compare);
		}
		
		cp = collPairs[0];
	}
	
	//for (let i = 0; i < this.balls.length; i++) {
	//	for (let j = i + 1; j < this.balls.length; j++) {
	//		let b1 = this.balls[i], b2 = this.balls[j];
	//		let lag = timePass[b1.id] - timePass[b2.id];
	//		let time = b1.collisionTime(b2, lag);
	//		if (time < Math.min(timePass[b1.id], timePass[b2.id]))
	//			console.log(time);
	//	}
	//}
	
	for (let i = 0; i < this.balls.length; i++) {
		if (timePass[i] != BallManager.updateInterval) {
			this.move(this.balls[i], BallManager.updateInterval-timePass[i]);
		}
		timePass[i] = 0;
	}
};