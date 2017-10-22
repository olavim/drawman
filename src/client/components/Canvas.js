import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import {fabric} from 'fabric';
import {CirclePicker} from 'react-color';

const Container = styled.div`
	display: flex;
	flex-direction: row;
`;

const CanvasContainer = styled.div`
	display: flex;
	flex-direction: column;
	position: relative;
`;

const BrushControls = styled.div`
	visibility: ${props => props.show ? 'visible' : 'hidden'};
	display: flex;
	padding: 25px 5px 25px 5px;
	align-items: center;
	justify-content: center;
	flex-direction: row;
	border-top: 1px solid #ddd;
`;

const BrushSizeControls = styled.div`
	display: flex;
	padding-top: 20px;
	align-items: center;
	justify-content: center;
	flex-direction: column;
`;

const Button = styled.button`
	border: 1px solid #ddd;
	border-radius: 4px;
	margin-left: 8px;
	margin-bottom: 8px;
	padding: 10px 15px;
	background-color: ${props => props.active ? '#68bc00' : '#fff'};
	color: ${props => props.active ? '#fff' : '#444'};
	cursor: ${props => props.active ? 'default' : 'pointer'};
	width: 80px;
	outline: none;
	
	${props => !props.active && `
	&:hover {
		background-color: #eee;
	}
	`}
`;

const colors = [
	'#000000',
	'#f44336',
	'#e91e63',
	'#9c27b0',
	'#673ab7',
	'#3f51b5',
	'#03a9f4',
	'#00bcd4',
	'#009688',
	'#4caf50',
	'#8bc34a',
	'#cddc39',
	'#ffeb3b',
	'#ffc107',
	'#ff9800',
	'#ff5722',
	'#795548',
	'#607d8b'
];

const canvasWidth = 1000;
const canvasHeight = 600;

export default class extends React.Component {
	state = {
		fillColor: {
			rgb: {r: 0, g: 0, b: 0, a: 255},
			hex: '#000000'
		},
		brushSize: 5
	};

	static defaultProps = {
		canvasData: null,
		overlay: null
	};

	static propTypes = {
		onDataChanged: PropTypes.func.isRequired,
		showControls: PropTypes.bool.isRequired,
		canvasData: PropTypes.object,
		overlay: PropTypes.any
	};

	componentDidMount() {
		fabric.Object.prototype.selectable = false;

		this.canvas = new fabric.Canvas('canvas', {
			freeDrawingCursor: 'none'
		});

		const brushRadius = this.state.brushSize / 2;

		this.canvas.skipTargetFind = true;
		this.canvas.freeDrawingBrush.color = this.state.fillColor;
		this.canvas.freeDrawingBrush.width = this.state.brushSize;
		this.canvas.selection = false;
		this.canvas.setWidth(canvasWidth);
		this.canvas.setHeight(canvasHeight);

		this.cursor = new fabric.StaticCanvas('cursor');
		this.cursor.setWidth(canvasWidth);
		this.cursor.setHeight(canvasHeight);

		this.brushPreview = new fabric.StaticCanvas('brush');
		this.brushPreview.setWidth(50);
		this.brushPreview.setHeight(50);
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
	}

	componentDidUpdate(prevProps) {
		if (!this.props.showControls) {
			this.canvas.loadFromJSON(this.props.canvasData, this.canvas.renderAll.bind(this.canvas));
		}

		if (!prevProps.showControls && this.props.showControls) {
			this.canvas.on('after:render', () => {
				this.props.onDataChanged(this.canvas.toJSON());
			});

			this.canvas.clear();
			this.handleSetPencil();
		} else if (prevProps.showControls && !this.props.showControls) {
			this.resetAndLockCanvas();
		}
	}

	resetAndLockCanvas = () => {
		this.canvas.off('mouse:up');
		this.canvas.off('mouse:down');
		this.canvas.off('mouse:move');
		this.canvas.off('mouse:out');
		this.canvas.off('after:render');

		this.canvas.isDrawingMode = false;
		this.canvas.hoverCursor = 'default';
		this.cursor.remove(this.mouseCursor);
		this.canvas.clear();
	};

	handleSetPencil = () => {
		this.canvas.isDrawingMode = true;
		const mouseCursor = this.mouseCursor;
		this.cursor.add(mouseCursor);
		mouseCursor
			.set({
				fill: this.state.fillColor.hex,
				radius: this.state.brushSize / 2
			})
			.setCoords()
			.canvas.renderAll();

		this.canvas.off('mouse:down');

		this.canvas.on('mouse:move', function (evt) {
			const mouse = this.getPointer(evt.e);
			mouseCursor
				.set({
					top: mouse.y,
					left: mouse.x
				})
				.setCoords()
				.canvas.renderAll();
		});

		this.canvas.on('mouse:out', () => {
			mouseCursor.set({top: -100, left: -100}).setCoords().canvas.renderAll();
		});

		this.canvas.on('mouse:up', () => {
			this.removeAntialias();
		});

		this.forceUpdate();
	};

	handleSetBucket = () => {
		const self = this;
		this.canvas.isDrawingMode = false;
		this.canvas.hoverCursor = 'nw-resize';
		this.cursor.remove(this.mouseCursor);
		this.canvas.off('mouse:move');
		this.canvas.off('mouse:out');
		this.canvas.off('mouse:up');

		const canvas = document.getElementById('canvas');
		const ctx = canvas.getContext('2d');

		this.canvas.on('mouse:down', function (evt) {
			if (!self.props.showControls) {
				return;
			}

			const mouse = this.getPointer(evt.e);
			const mx = parseInt(mouse.x, 10);
			const my = parseInt(mouse.y, 10);

			const drawingBoundTop = 0;
			const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
			const pixelStack = [[mx, my]];

			const pp = (my * canvasWidth + mx) * 4; // eslint-disable-line no-mixed-operators
			const startColor = {
				r: imageData.data[pp],
				g: imageData.data[pp + 1],
				b: imageData.data[pp + 2],
				a: imageData.data[pp + 3]
			};
			const curColor = self.state.fillColor.rgb;

			while (pixelStack.length) {
				const newPos = pixelStack.pop();
				const x = newPos[0];
				let y = newPos[1];

				let pixelPos = (y * canvasWidth + x) * 4; // eslint-disable-line no-mixed-operators

				while (y >= drawingBoundTop && matchStartColor(pixelPos)) {
					y--;
					pixelPos -= canvasWidth * 4;
				}

				pixelPos += canvasWidth * 4;
				y++;
				let reachLeft = false;
				let reachRight = false;

				while (y < canvasHeight - 1 && matchStartColor(pixelPos)) {
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

					if (x < canvasWidth - 1) {
						if (matchStartColor(pixelPos + 4)) {
							if (!reachRight) {
								pixelStack.push([x + 1, y]);
								reachRight = true;
							}
						} else if (reachRight) {
							reachRight = false;
						}
					}

					pixelPos += canvasWidth * 4;
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

				return r === startColor.r && g === startColor.g && b === startColor.b && a === startColor.a;
			}

			function colorPixel(pixelPos) {
				imageData.data[pixelPos] = curColor.r;
				imageData.data[pixelPos + 1] = curColor.g;
				imageData.data[pixelPos + 2] = curColor.b;
				imageData.data[pixelPos + 3] = curColor.a;
			}
		});

		this.forceUpdate();
	};

	removeAntialias = () => {
		const canvas = document.getElementById('canvas');
		const ctx = canvas.getContext('2d');
		const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);

		for (let i = 0; i < canvasWidth; i++) {
			for (let j = 0; j < canvasHeight; j++) {
				const pp = (j * canvasWidth + i) * 4; // eslint-disable-line no-mixed-operators
				if (imageData.data[pp + 3] !== 0) {
					imageData.data[pp + 3] = imageData.data[pp + 3] >= 128 ? 255 : 0;
				}
			}
		}

		ctx.putImageData(imageData, 0, 0);

		fabric.Image.fromURL(canvas.toDataURL(), img => {
			this.canvas.clear();
			this.canvas.add(img);
			this.canvas.renderAll();
		});
	};

	handleClearCanvas = () => {
		this.canvas.clear();
	};

	handleChangeColor = color => {
		color.rgb.a *= 255;
		this.setState({fillColor: color}, () => {
			this.canvas.freeDrawingBrush.color = color.hex;
			if (this.canvas.isDrawingMode) {
				this.mouseCursor.set({fill: color.hex}).setCoords().canvas.renderAll();
			}
			this.brushCircle.set({fill: color.hex}).setCoords().canvas.renderAll();
		});
	};

	handleChangeBrushSize = evt => {
		const val = parseInt(evt.target.value, 10) || 1;
		this.setState({brushSize: val});
		if (this.canvas.isDrawingMode) {
			this.mouseCursor.set({radius: val / 2}).setCoords().canvas.renderAll();
		}
		this.brushCircle.set({radius: val / 2}).setCoords().canvas.renderAll();
		this.canvas.freeDrawingBrush.width = val;
	};

	render() {
		const pencil = this.canvas ? this.canvas.isDrawingMode : true;
		const {showControls, overlay} = this.props;

		return (
			<Container>
				<CanvasContainer>
					{overlay}
					<canvas id="canvas" style={{position: 'absolute'}}/>
					<canvas id="cursor" style={{position: 'absolute', top: '0', pointerEvents: 'none'}}/>
					<BrushControls show={showControls}>
						<CirclePicker
							colors={colors}
							color={this.state.fillColor}
							width={400}
							onChange={this.handleChangeColor}
						/>
						<BrushSizeControls>
							<input
								type="range"
								min="2"
								max="40"
								step="1"
								value={this.state.brushSize}
								onChange={this.handleChangeBrushSize}
								style={{marginBottom: '10px', width: '250px'}}
							/>
							<canvas id="brush"/>
						</BrushSizeControls>
						<Button active={pencil} onClick={this.handleSetPencil}>pencil</Button>
						<Button active={!pencil} onClick={this.handleSetBucket}>bucket</Button>
						<Button onClick={this.handleClearCanvas}>clear</Button>
					</BrushControls>
				</CanvasContainer>
			</Container>
		);
	}
}
