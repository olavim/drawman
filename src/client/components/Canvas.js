import React from 'react';
import {fabric} from 'fabric';

const style = {
	brushControl: {
		root: {
			display: 'flex',
			padding: '5px',
			alignItems: 'center'
		}
	}
};

export default class extends React.Component {
	state = {
		fillColor: '#000',
		brushSize: 5
	};

	componentDidMount() {
		fabric.Object.prototype.selectable = false;

		this.canvas = new fabric.Canvas('canvas', {
			freeDrawingCursor: 'none'
		});

		this.canvas.freeDrawingBrush.color = this.state.fillColor;
		this.canvas.freeDrawingBrush.width = this.state.brushSize;
		this.canvas.setWidth(800);
		this.canvas.setHeight(600);

		this.cursor = new fabric.StaticCanvas('cursor');
		this.cursor.setWidth(800);
		this.cursor.setHeight(600);

		this.brushPreview = new fabric.StaticCanvas('brush');
		this.brushPreview.setWidth(50);
		this.brushPreview.setHeight(50);
		const brushRadius = this.state.brushSize / 2;
		this.brushCircle = new fabric.Circle({
			left: 25 - brushRadius,
			top: 25 - brushRadius,
			radius: brushRadius,
			fill: 'black',
			originX: 'center',
			originY: 'center'
		});
		this.brushPreview.add(this.brushCircle);

		this.mouseCursor = new fabric.Circle({
			left: -100,
			top: -100,
			radius: brushRadius,
			fill: 'rgba(255,0,0,0.5)',
			stroke: 'black',
			originX: 'center',
			originY: 'center'
		});

		this.handleSetPencil();
	}

	handleSetPencil = () => {
		this.canvas.isDrawingMode = true;
		const mouseCursor = this.mouseCursor;
		this.cursor.add(mouseCursor);

		this.canvas.off('mouse:down');

		this.canvas.on('mouse:move', function (evt) {
			const mouse = this.getPointer(evt.e);
			mouseCursor.set({top: mouse.y, left: mouse.x}).setCoords().canvas.renderAll();
		});

		this.canvas.on('mouse:out', () => {
			mouseCursor.set({top: -100, left: -100}).setCoords().canvas.renderAll();
		});
	};

	handleSetBucket = () => {
		const self = this;
		this.canvas.isDrawingMode = false;
		this.canvas.hoverCursor = 'nw-resize';
		this.cursor.remove(this.mouseCursor);
		this.canvas.off('mouse:move');
		this.canvas.off('mouse:out');

		const canvas = document.getElementById('canvas');
		const ctx = canvas.getContext('2d');

		this.canvas.on('mouse:down', function (evt) {
			const mouse = this.getPointer(evt.e);
			const mx = parseInt(mouse.x, 10);
			const my = parseInt(mouse.y, 10);
			const width = 800;
			const height = 600;

			const drawingBoundTop = 0;
			const imageData = ctx.getImageData(0, 0, width, height);
			const pixelStack = [[mx, my]];

			const curColor = {r: 0, g: 0, b: 0, a: 255};

			while (pixelStack.length) {
				const newPos = pixelStack.pop();
				const x = newPos[0];
				let y = newPos[1];

				let pixelPos = (y * width + x) * 4; // eslint-disable-line no-mixed-operators

				while (y >= drawingBoundTop && matchStartColor(pixelPos)) {
					y--;
					pixelPos -= width * 4;
				}

				pixelPos += width * 4;
				y++;
				let reachLeft = false;
				let reachRight = false;

				while (y < height - 1 && matchStartColor(pixelPos)) {
					y++;
					colorPixel(pixelPos);

					if (x > 0) {
						if (matchStartColor(pixelPos - 4)) {
							if (!reachLeft) {
								pixelStack.push([x - 1, y]);
								reachLeft = true;
							}
						} else if (reachLeft) {
							reachLeft = false;
						}
					}

					if (x < width - 1) {
						if (matchStartColor(pixelPos + 4)) {
							if (!reachRight) {
								pixelStack.push([x + 1, y]);
								reachRight = true;
							}
						} else if (reachRight) {
							reachRight = false;
						}
					}

					pixelPos += width * 4;
				}
			}

			ctx.putImageData(imageData, 0, 0);

			fabric.Image.fromURL(canvas.toDataURL(), img => {
				self.canvas.clear();
				self.canvas.add(img);
				self.canvas.renderAll();
			});

			function matchStartColor(pixelPos) {
				const r = imageData.data[pixelPos];
				const g = imageData.data[pixelPos + 1];
				const b = imageData.data[pixelPos + 2];
				const a = imageData.data[pixelPos + 3];

				return !(r === curColor.r && g === curColor.g && b === curColor.b && a === curColor.a);
			}

			function colorPixel(pixelPos) {
				imageData.data[pixelPos] = curColor.r;
				imageData.data[pixelPos + 1] = curColor.g;
				imageData.data[pixelPos + 2] = curColor.b;
				imageData.data[pixelPos + 3] = curColor.a;
			}
		});
	};

	handleClearCanvas = () => {
		this.canvas.clear();
	};

	handleChangeBrushSize = evt => {
		const val = evt.target.value;
		this.setState({brushSize: val});
		this.mouseCursor.set({radius: val / 2}).setCoords().canvas.renderAll();
		this.brushCircle.set({radius: val / 2}).setCoords().canvas.renderAll();
		this.canvas.freeDrawingBrush.width = val;
	};

	render() {
		return (
			<div style={{position: 'relative'}}>
				<canvas style={{border: '1px solid #000', position: 'absolute'}} id="canvas"/>
				<canvas id="cursor" style={{position: 'absolute', top: '0', pointerEvents: 'none'}}/>
				<div style={style.brushControl.root}>
					<input
						type="range"
						min="1"
						max="40"
						step="1"
						value={this.state.brushSize}
						onChange={this.handleChangeBrushSize}
					/>
					<canvas id="brush"/>
				</div>
				<button onClick={this.handleSetPencil}>pencil</button>
				<button onClick={this.handleSetBucket}>bucket</button>
				<button onClick={this.handleClearCanvas}>clear</button>
			</div>
		);
	}
}
