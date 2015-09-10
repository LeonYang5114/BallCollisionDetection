/*
 * Author: Leon Yang
 */
 "use strict";
 
function sqr(num) {
	return num * num;
}


function Ball(r, x, y, vx, vy) {
	this.id = Ball.id;
	this.r = r;
	this.mass = r*r;
	this.x = x;
	this.y = y;
	this.vx = vx;
	this.vy = vy;
	Ball.id++;
};

Ball.id = 0;

function BallManager() {
	this.balls = [];
	BallManager.width = 512;
	BallManager.height = 512;
};

BallManager.updateInterval = 30;
BallManager.horizontal = 0;
BallManager.vertical = 1;

Ball.prototype.distanceTo = function(aBall) {
	return Math.sqrt(sqr(this.x-aBall.x)+sqr(this.y-aBall.y));
};

var allCalls = 0;
var wallCalls = 0;
var notBlocked = 0;

// returns the time this ball needs to move to collide with the other ball or the wall
Ball.prototype.collisionTime = function(aBall, timeLag) {
	allCalls++;
	// asking for collision time with walls
	if (aBall == BallManager.vertical) {
		wallCalls++;
		let result = BallManager.updateInterval;
		if (this.vx < 0) result = Math.min(result, (this.x-this.r)/-this.vx);
		if (this.vx > 0) result = Math.min(result, (BallManager.width-this.x-this.r)/this.vx);
		return result;
	} else if (aBall == BallManager.horizontal) {
		wallCalls++;
		let result = BallManager.updateInterval;
		if (this.vy < 0) result = Math.min(result, (this.y-this.r)/-this.vy);
		if (this.vy > 0) result = Math.min(result, (BallManager.height-this.y-this.r)/this.vy);
		return result;
	}
	// timeLag is the time this ball lags the other ball
	let relX = aBall.x-this.x-timeLag*((timeLag>0)?this.vx:aBall.vx);
	let relY = aBall.y-this.y-timeLag*((timeLag>0)?this.vy:aBall.vy);
	
	let relVx = this.vx-aBall.vx;
	let relVy = this.vy-aBall.vy;
	
	
	//TODO-need a better estimation
	let timeLowerBound2 = (Math.max(Math.abs(relX), Math.abs(relY))-this.r-aBall.r) / (Math.abs(relVx)+Math.abs(relVy));
	if (timeLowerBound2 > BallManager.updateInterval - timeLag) {
		return BallManager.updateInterval;
	}
	
	// sqr(relX-t*relVx)+sqr(relY-t*relVy)=sqr(r1+r2)
	
	let a = sqr(relVx) + sqr(relVy);	
	// small relative speed
	if (a < 0.0000001)
		return BallManager.updateInterval;
	
	let b = -2*(relX*relVx+relY*relVy);
	// negative t
	if (b >= 0)
		return BallManager.updateInterval;
	
	// make sure that c is greater than 0
	let c = sqr(relX)+sqr(relY)-sqr(this.r+aBall.r);
	if (c < 0)
		console.log(c);
	
	let delta = sqr(b)-4*a*c;
	if (delta < 0)
		return BallManager.updateInterval;
	
	// return the time when the two this.balls meet instead of leaving
	let result = (-b-Math.sqrt(delta))/(2*a);
	if (result > BallManager.updateInterval) {
		notBlocked++;
		return BallManager.updateInterval;
	}
	return result+((timeLag>0)?timeLag:0);
};
	
Ball.prototype.move = function(time) {
	this.x += time*this.vx;
	this.y += time*this.vy;
};

BallManager.prototype.collide = function(b1, b2) {
	// colliding with the wall
	if (b2 == BallManager.vertical) {
		let tempvx = b1.vx;
		if (b1.x-1.01*b1.r <= 0) {
			b1.x = b1.r;
			b1.vx *= -1;
		} else if (b1.x+1.01*b1.r >= BallManager.width) {
			b1.x = BallManager.width-b1.r;
			b1.vx *= -1;
		}
		if (b1.vx == tempvx)
			console.log(b1);
		return;
	} else if (b2 == BallManager.horizontal) {
		let tempvy = b1.vy;
		if (b1.y-1.01*b1.r <= 0) {
			b1.y = b1.r;
			b1.vy *= -1;
		} else if (b1.y+1.01*b1.r >= BallManager.height) {
			b1.y = BallManager.height-b1.r;
			b1.vy *= -1;
		}
		if (b1.vy == tempvy)
			console.log(b1);
		return;
	}
	
	// velocity components perpendicular to the line through both center will not change
	// velocity components on that line will change depending on the respective momentum
	
	let distance = b1.r + b2.r;
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
			let collHorizontal = b1.collisionTime(BallManager.horizontal);
			let collVertical = b1.collisionTime(BallManager.vertical);
			insertToSorted(collPairs, new CollPair(b1, BallManager.horizontal, collHorizontal), CollPair.max, CollPair.compare);
			insertToSorted(collPairs, new CollPair(b1, BallManager.vertical, collVertical), CollPair.max, CollPair.compare);
			for (let j = i + 1; j < this.balls.length; j++) {
				let b2 = this.balls[j];
				let cp = new CollPair(b1, b2, b1.collisionTime(b2, 0));
				insertToSorted(collPairs, cp, CollPair.max, CollPair.compare);
			}
		}
	} else {
		for (let i of collPairs) {
			i.time = i.b1.collisionTime(i.b2, 0);
		}
		collPairs.sort(CollPair.compare);
	}
	
	let cp = collPairs[0];
	while (cp.time < BallManager.updateInterval) {
		
		cp.b1.move(cp.time-timePass[cp.b1.id]);
		timePass[cp.b1.id] = cp.time;
		if (cp.b2 != BallManager.horizontal && cp.b2 != BallManager.vertical) {
			cp.b2.move(cp.time-timePass[cp.b2.id]);
			timePass[cp.b2.id] = cp.time;
		}
		this.collide(cp.b1, cp.b2);
		
		let modifiedPairs = [];
		for(let i = 0; i < collPairs.length; i++) {
			let currPair = collPairs[i];
			if (currPair.b1 != cp.b1 && currPair.b1 != cp.b2 && currPair.b2 != cp.b1 && currPair.b2 != cp.b2)
				continue;
			let currLag = (currPair.b2 == null)?0:timePass[currPair.b2.id] - timePass[currPair.b1.id];
			let newTime = Math.min(BallManager.updateInterval, timePass[currPair.b1.id] + currPair.b1.collisionTime(currPair.b2, currLag));
			if (newTime != currPair.time) {
				currPair.time = newTime;
				modifiedPairs.push(currPair);
				collPairs[i] = null;
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
			this.balls[i].move(BallManager.updateInterval-timePass[i]);
		}
		timePass[i] = 0;
	}
};