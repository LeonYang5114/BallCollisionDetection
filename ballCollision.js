/*
 * Author: Leon Yang
 * Email: gyang48 at wisc dot edu
 */
 "use strict";

function Ball(id, r, x, y, vx, vy) {
	this.id = id;
	this.r = r;
	this.mass = r*r;
	this.x = x;
	this.y = y;
	this.vx = vx;
	this.vy = vy;
	//this.gridX;
	//this.gridY;
};

Ball.prototype.clone = function() {
	return new Ball(this.id, this.r, this.x, this.y, this.vx, this.vy);
}

function BallManager(updateInterval/*, gridSize*/) {
	this.balls = [];
	this.updateInterval = updateInterval;
	//this.gridSize = gridSize;
	//this.grids = [[]];
	this.ballsMoveTime = [];
	this.sortedCollPairs = [];
	//for (var i = 0; i < BallManager.width/gridSize; i++) {
	//	this.grids[i] = [];
	//	for (var j = 0; j < BallManager.height/gridSize; j++) {
	//		this.grids[i][j] = [];
	//	}
	//}
};
BallManager.width = 512;
BallManager.height = 512;

BallManager.horizontal = 0;
BallManager.vertical = 1;

Ball.prototype.distanceTo = function(aBall) {
	return Math.sqrt((this.x-aBall.x)*(this.x-aBall.x)+(this.y-aBall.y)*(this.y-aBall.y));
};

//var allCalls = 0;
//var blockedByB = 0;
//var blockedByBC = 0;
//var blockedByDelta = 0;
//var notBlocked = 0;

// returns the time this ball needs to move to collide with the other ball or the wall
BallManager.prototype.collisionTime = function(b1, b2, timeLag/*, areNeighbors*/) {
	
	// check are b1 and b2 neighbors
	//areNeighbors = areNeighbors || this.areNeighbors(b1, b2);
	//if (!areNeighbors)
	//	this.updateInterval;
	
	// asking for collision time with walls
	if (b2 == BallManager.vertical) {
		var result = this.updateInterval;
		if (b1.vx < 0)
			result = Math.min(result, (b1.x-b1.r)/-b1.vx);
		else if (b1.vx > 0) 
			result = Math.min(result, (BallManager.width-b1.x-b1.r)/b1.vx);
		return result;
	} else if (b2 == BallManager.horizontal) {
		var result = this.updateInterval;
		if (b1.vy < 0) 
			result = Math.min(result, (b1.y-b1.r)/-b1.vy);
		else if (b1.vy > 0) 
			result = Math.min(result, (BallManager.height-b1.y-b1.r)/b1.vy);
		return result;
	}
	//allCalls++;
	
	// timeLag is the time b1 ball lags the other ball
	var relX = b2.x-b1.x-timeLag*((timeLag>0)?b1.vx:b2.vx);
	var relY = b2.y-b1.y-timeLag*((timeLag>0)?b1.vy:b2.vy);
	
	var relVx = b1.vx-b2.vx;
	var relVy = b1.vy-b2.vy;
	
	// sqr(relX-t*relVx)+sqr(relY-t*relVy)=sqr(r1+r2)	
	
	var b = -2*(relX*relVx+relY*relVy);
	// negative t
	if (b >= 0) {
		//blockedByB++;
		return this.updateInterval;
	}
	
	//var isBlockedByBC = false;
	
	// make sure that c is greater than 0
	var c = relX*relX+relY*relY-(b1.r+b2.r)*(b1.r+b2.r);
	//if (c < 0)
	//	console.log(c);
	
	// the tangent line of the parabola at its y axis intersect, has an interset with x axis at -c/b
	// under the precondition that b<0 and c>0 and usually a very small a, -c/b will be strictly less than
	// the smaller root (the result) and a very good estimation for that. But this filter only works well
	// for small updateIntervals.
	if (-c/b >this.updateInterval-timeLag) {
		//blockedByBC++;
		//isBlockedByBC = true;
		return this.updateInterval;
	}
	
	var a = relVx*relVx + relVy*relVy;
	
	var delta = b*b-4*a*c;
	if (delta < 0) {
		//blockedByDelta++;
		return this.updateInterval;
	}
	
	// return the time when the two b1.balls meet instead of leaving
	var result = (-b-Math.sqrt(delta))/(2*a)+((timeLag>0)?timeLag:0);
	if (result > this.updateInterval) {
		return this.updateInterval;
		//notBlocked++;
		//if (isBlockedByBC)
		//	console.log("bc failed");
	}
	return result;
};
	
BallManager.prototype.move = function(aBall, time) {
	//var preGridX = aBall.gridX;
	//var preGridY = aBall.gridY;
	aBall.x += time*aBall.vx;
	aBall.y += time*aBall.vy;
	//var gridX = Math.floor(aBall.x/this.gridSize);
	//var gridY = Math.floor(aBall.y/this.gridSize);
	//if (gridX > this.grids.length || gridY > this.grids[0].length)
	//	console.log(gridX, gridY);
	//if (gridX != preGridX || gridY != preGridY) {
	//	aBall.gridX = gridX;
	//	aBall.gridY = gridY;
	//	for (var i = 0; i < this.grids[preGridX][preGridY].length; i++) {
	//		if (this.grids[preGridX][preGridY][i] == aBall) {
	//			this.grids[preGridX][preGridY].splice(i, 1);
	//			break;
	//		}
	//	}
	//	this.grids[gridX][gridY].push(aBall);
	//}
};

//BallManager.prototype.areNeighbors = function(b1, b2) {
//	if (!(b2 instanceof Ball)) {
//		if (b2 == BallManager.vertical)
//			return b1.gridX == 0 || b1.gridX == this.grids.length-1;
//		else
//			return b1.gridY == 0 || b1.gridY == this.grids[0].length-1;
//	}
//	return Math.abs(b1.gridX-b2.gridX) <= 1 && Math.abs(b1.gridY-b2.gridY) <= 1;
//}

BallManager.prototype.addBall = function(aBall) {
	this.balls.push(aBall);
	//aBall.gridX = Math.floor(aBall.x/this.gridSize);
	//aBall.gridY = Math.floor(aBall.y/this.gridSize);
	//this.grids[aBall.gridX][aBall.gridY].push(aBall);
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
	
	var distance = b1.r + b2.r;
	//if (distance - b1.r - b2.r != 0)
	//	console.log(distance - b1.r - b2.r);
	var c = (b2.x-b1.x)/distance;
	var s = (b2.y-b1.y)/distance;
	var m1 = b1.mass;
	var m2 = b2.mass;
	
	var perpComp1 = b1.vy*c-b1.vx*s;
	var perpComp2 = b2.vy*c-b2.vx*s;
	
	var paraComp1 = b1.vy*s+b1.vx*c;
	var paraComp2 = b2.vy*s+b2.vx*c;
	
	var newParaComp1 = (m2*(2*paraComp2-paraComp1)+m1*paraComp1)/(m1+m2);
	var newParaComp2 = (m1*(2*paraComp1-paraComp2)+m2*paraComp2)/(m1+m2);
	b1.vx = -perpComp1*s+newParaComp1*c;
	b1.vy = perpComp1*c+newParaComp1*s;
	b2.vx = -perpComp2*s+newParaComp2*c;
	b2.vy = perpComp2*c+newParaComp2*s;
	//if (Math.abs(b1.vx) > 10 || Math.abs(b1.vy) > 10 || Math.abs(b2.vx) > 10 || Math.abs(b2.vy) > 10)
	//	console.log(this);
};

function CollPair(b1, b2, time) {
	this.b1 = b1;
	this.b2 = b2;
	// the time that next collision will arrive since the start of the interval
	this.time = time;
}

CollPair.compare = function(cp1, cp2) {
	return cp1.time - cp2.time;
};

// sorted in increasing order
// compFunc should return negative, positive, or zero
function insertToSorted(sorted, element, max, compFunc) {
	if (compFunc(element, max) >= 0) {
		sorted.push(element);
		return;
	}		
	var start = 0;
	var end = sorted.length;
	while(true) {
		if (end == start) {
			sorted.splice(end, 0, element);
			return;
		}
		var mid = Math.floor((start+end)/2);
		var relative = compFunc(element, sorted[mid]);
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

BallManager.prototype.moveBalls = function() {
	// the time that each ball has moved in this interval
	var max = new CollPair(null, null, this.updateInterval);
	var timePass = this.ballsMoveTime;
	var collPairs = this.sortedCollPairs;
	if (collPairs.length == 0) {
		for (var i = 0; i < this.balls.length; i++) {
			var b1 = this.balls[i];
			timePass[b1.id] = 0;
			var collHorizontal = this.collisionTime(b1, BallManager.horizontal);
			var collVertical = this.collisionTime(b1, BallManager.vertical);
			insertToSorted(collPairs, new CollPair(b1, BallManager.horizontal, collHorizontal), max, CollPair.compare);
			insertToSorted(collPairs, new CollPair(b1, BallManager.vertical, collVertical), max, CollPair.compare);
			for (var j = i + 1; j < this.balls.length; j++) {
				var b2 = this.balls[j];
				var collTime = this.collisionTime(b1, b2, 0);
				var cp = new CollPair(b1, b2, collTime);
				insertToSorted(collPairs, cp, max, CollPair.compare);
			}
		}
	} else {
		for (var i = 0; i < collPairs.length; i++) {
			collPairs[i].time = this.collisionTime(collPairs[i].b1, collPairs[i].b2, 0);
		}
		collPairs.sort(CollPair.compare);
	}
	
	var cp = collPairs[0];
	while (cp.time < this.updateInterval) {
		
		this.move(cp.b1, cp.time-timePass[cp.b1.id]);
		timePass[cp.b1.id] = cp.time;
		if (cp.b2 instanceof Ball) {
			this.move(cp.b2, cp.time-timePass[cp.b2.id]);
			timePass[cp.b2.id] = cp.time;
		}
		this.collide(cp.b1, cp.b2);
		
		var modifiedPairs = [];
		for(var i = 0; i < collPairs.length; i++) {
			var currPair = collPairs[i];
			if (cp.b2 instanceof Ball) {
				if (currPair.b1 != cp.b1 && currPair.b1 != cp.b2 && currPair.b2 != cp.b1 && currPair.b2 != cp.b2)
					continue;
			} else {
				if (currPair.b1 != cp.b1 && currPair.b2 != cp.b1)
					continue;
			}
			
			//if (!this.areNeighbors(currPair.b1, currPair.b2))
			//	continue;
			var currLag = ((currPair.b2 == null)?0:(timePass[currPair.b2.id]) - timePass[currPair.b1.id]);
			var newTime = Math.min(this.updateInterval, timePass[currPair.b1.id] + this.collisionTime(currPair.b1, currPair.b2, currLag/*, true*/));
			if (newTime != currPair.time) {
				currPair.time = newTime;
				modifiedPairs.push(currPair);
				collPairs[i] = null;
			}
		}
		
		var count = 0;
		for (var i = 0; i < collPairs.length; i++) {
			if (collPairs[i]){
				collPairs[count] = collPairs[i];
				count++;
			}
		}
		collPairs.splice(count, collPairs.length-count);
		
		for (var i = 0; i < modifiedPairs.length; i++) {
			insertToSorted(collPairs, modifiedPairs[i], max, CollPair.compare);
		}
		
		cp = collPairs[0];
	}
	
	for (var i = 0; i < this.balls.length; i++) {
		if (timePass[i] != this.updateInterval) {
			this.move(this.balls[i], this.updateInterval-timePass[i]);
		} else 
			console.log(i);
		timePass[i] = 0;
	}
};