class Canvas {
	constructor(node, ctx){
		this.node = node;
		this.ctx = ctx;
	}
}

ImageData.prototype.setPixel = function(x, y, r, g, b, a) {
	const index = 4*(x+y*this.width);
	this.data[index] = r;
	this.data[index+1] = g;
	this.data[index+2] = b;
	this.data[index+3] = a;
}

ImageData.prototype.getPixel = function(x, y) {
	c = { r: 0, g: 0, b: 0, a: 0}
	const index = 4*(x+y*this.width);
	c.r = this.data[index];
	c.g = this.data[index+1];
	c.b = this.data[index+2];
	c.a = this.data[index+3];
	return c;
}

class Complex {
	constructor(r, i) {
		this.real = r;
		this.imag = i;
	}

	plus(z) {
		const r = this.real + z.real;
		const i = this.imag + z.imag;
		return new Complex(r,i);
	}

	times(z) {
		const r = this.real*z.real - this.imag*z.imag;
		const i = this.real*z.imag + this.imag*z.real;
		return new Complex(r,i);
	}

	abs() {
		return Math.sqrt(this.real*this.real + this.imag*this.imag);
	}
}

class PicInfo{
	constructor(x, y, size) {
		this.x = x;
		this.y = y;
		this.size = size;
	}
}

class Pic {
	constructor(n, data){
		this.info = new PicInfo(data.x, data.y, data.size)
		this.canvasNumber = n;
		this.big = new ImageData(STAGE_SIZE, STAGE_SIZE);
		this.small = new ImageData(CAROUSEL_SIZE, CAROUSEL_SIZE);
		createFractals(this);
	}
}

function mand(z0, max) {
	let z = z0;
	for (let i = 0; i < max; i++)
	{
		z = z.times(z).plus(z0);
		if (z.abs() > 2)
			return Math.min(i, 255);
	}
	return max;
}

function createFractals(pic) {
	const n = pic.big.width;
	for (let i = 0; i < n; i++)
		for (let j = 0; j < n; j++)
		{
			let re = pic.info.x - pic.info.size/2 + i * pic.info.size/n;
			let im = pic.info.y - pic.info.size/2 + j * pic.info.size/n;
			let w = new Complex(re, im);
			let c = 255-mand(w, 255);
			pic.big.setPixel(i,j,255-c,0,0,c);
		}
		shrink(pic.big, pic.small);
}

function shrink(big, small) {
	const dw = big.width / small.width;
	const dh = big.height / small.height;
	for (i = 0; i < small.width; i++)
		for (j = 0; j < small.height; j++) {
			const c = big.getPixel(Math.round(i*dw), Math.round(j*dh));
			small.setPixel(i, j, c.r, c.g, c.b, c.a);
		}
}

const CAROUSEL_SIZE = 60;
const STAGE_SIZE = 512;

let stage = document.getElementById('stage');
stage.width = STAGE_SIZE;
stage.height = STAGE_SIZE;
stageContext = stage.getContext('2d');

let canvases = [];
for (i = 0; i < 5; i++) {
	const id = document.getElementById('pic'+(i+1));
	const context = id.getContext('2d');
	canvases.push(new Canvas(id, context));
	canvases[i].node.width = CAROUSEL_SIZE;
	canvases[i].node.height = CAROUSEL_SIZE;
}

let pics = [];
let p = new PicInfo(-0.5, 0.0, 2.0)
pics.push(new Pic(2, p));
createFractals(pics[0]);
displayAll();

function displayAll() {
	for (i = 0; i < canvases.length; i++) {
		let index = pics.findIndex( (e) => e.canvasNumber == i);
		if (index == -1) {
			canvases[i].ctx.clearRect(0,0,CAROUSEL_SIZE, CAROUSEL_SIZE);
			if (i == 2)
				stageContext.clearRect(0, 0, STAGE_SIZE, STAGE_SIZE);
		}
		else {
			canvases[i].ctx.putImageData(pics[index].small, 0, 0)
			if (i == 2) {
				stageContext.putImageData(pics[index].big, 0, 0);
			}
		}
	}

}

// zoom in/out on stage
stage.addEventListener('wheel', (e) => {
	const i = pics.findIndex( (el) => el.canvasNumber == 2 );
	if (e.deltaY > 0)
		pics[i].info.size *= 2;
	else
		pics[i].info.size *= 0.5;
	if (Math.abs(event.deltaY < 234)) {
		createFractals(pics[i]);
		displayAll();
	}
});



// cache on click (but not shift+click)
// recenter if shift+click
stage.addEventListener('click', (event) => {
	const k = pics.findIndex( (e) => e.canvasNumber == 2 );
	if (event.shiftKey) {
		let a = event.clientX;
		let b = event.clientY;
		let u = stage.getBoundingClientRect().left;
		let v = stage.getBoundingClientRect().top;
		a = a - u;
		b = b - v;
		pics[k].info.x += (a-STAGE_SIZE/2)*(pics[k].info.size/STAGE_SIZE);
		pics[k].info.y += (b-STAGE_SIZE/2)*(pics[k].info.size/STAGE_SIZE);
		createFractals(pics[k]);
	} else {
		for (j = k; j < pics.length; j++)
			pics[j].canvasNumber++;
		const temp = pics[k].info;
		pics.splice(k, 0, new Pic(2, temp));
	}
	displayAll();
});

//scroll carousel up/down on wheel
const carousel = document.getElementById('carousel');
carousel.addEventListener('wheel', (e) => {
	const maxDown = (pics[0].canvasNumber == 2);
	const maxUp = (pics[pics.length-1].canvasNumber == 2);
	for (i = 0; i < pics.length; i++) {
		if  ((e.deltaY > 0) && (!maxDown)) {
			pics[i].canvasNumber++;
		}
		if ((e.deltaY < 0) && (!maxUp)) {
			pics[i].canvasNumber--;
		}
	}
	displayAll();
});