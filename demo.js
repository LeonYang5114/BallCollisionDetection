"use strict";

var canvas;
var ctx;

var ballMgrs;
var intervals = [];
var balls = [];
var baseColor;


var isAnimating;
var updateTime;
var pauseToMatch;

window.onload = function() {
	canvas = document.getElementById("canvas");
	ctx = canvas.getContext("2d");
	if (!ctx)
		alert("Your device does not support canvas 2d context.");
	var reset = document.getElementById("reset");
	var start_anim = document.getElementById("start_anim");
	var pause = document.getElementById("pause");
	var pause_to_match = document.getElementById("pause_to_match");
	
	reset.onclick = resetMgrs;
	start_anim.onclick = startAnimation;
	pause.onclick = function() {
		isAnimating = false;
	};
	pause_to_match.onchange = function() {
		pauseToMatch = pause_to_match.checked;
	};
	pause_to_match.onchange();
	
	var id = 0;
	for (var i = 30; i < 492; i += 70) {
		for (var j = 30; j < 492; j += 70) {
			balls.push(new Ball(id, Math.random()*5+15, i, j, Math.random()*0.2-0.1, Math.random()*0.2-0.1));
			id++;			
		}
	}
	resetMgrs();
}

function resetMgrs() {
	isAnimating = false;
	updateTime = 0;
	ballMgrs = [];
	ballMgrs.push(new BallManager(20));
	ballMgrs.push(new BallManager(200));
	ballMgrs.push(new BallManager(2000));
	baseColor = Math.floor(17666215/(ballMgrs.length+2));
	for (var i = 0; i < ballMgrs.length; i++) {
		for (var j = 0; j < balls.length; j++)
			ballMgrs[i].addBall(balls[j].clone());
	}
	renderLoop();
}

function startAnimation() {
	if (isAnimating)
		return;
	isAnimating = true;
	renderLoop();
	updateLoop();
}

function toTextColor(color) {
    var varters = '0123456789ABCDEF'.split('');
	var textColor = ""
    for (var i = 0; i < 6; i++ ) {
        textColor = varters[15 & color] + textColor;
		color = color >> 4;
    }
    return "#" + textColor;
}

function drawBall(aBall) {
	ctx.beginPath();
	ctx.arc(aBall.x, aBall.y, aBall.r, 0, 2*Math.PI);
	ctx.fill();
}

function updateLoop() {
	if (!isAnimating)
		return;
	for (var i = 0; i < ballMgrs.length; i++) {
		if (updateTime % ballMgrs[i].updateInterval == 0)
			ballMgrs[i].moveBalls();
	}
	updateTime += 20;
	if (pauseToMatch && updateTime % ballMgrs[ballMgrs.length-1].updateInterval == 0) {
		isAnimating = false;
	}
	if (isAnimating)
		setTimeout(updateLoop, 20);
}

function getAlpha(i) {
	var base = Math.log(ballMgrs[0].updateInterval);
	return 0.9-(Math.log(ballMgrs[i].updateInterval)-base)/(Math.log(ballMgrs[ballMgrs.length-1].updateInterval)-base)*0.4;
}

function renderLoop() {
	ctx.globalAlpha=1;
	ctx.fillStyle = "#A0A0A0";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	for (var i = ballMgrs.length - 1; i >= 0; i--) {
		ctx.globalAlpha = getAlpha(i);
		ctx.fillStyle = toTextColor(baseColor * (i+1));
		for (var j = 0; j < ballMgrs[i].balls.length; j++) {
			drawBall(ballMgrs[i].balls[j]);
		}
	}
	document.getElementById("time").innerHTML = updateTime;
	if (isAnimating) {		
		setTimeout(function() {
			window.requestAnimationFrame(renderLoop);
		}, 20);
	}
}