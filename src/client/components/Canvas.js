import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import {fabric} from 'fabric';
import {CirclePicker} from 'react-color';
import _ from 'lodash';
import bucketIcon from './bucket.svg';

const Container = styled.div`
	display: flex;
	flex-direction: row;
`;

const CanvasContainer = styled.div`
	display: flex;
	flex-direction: column;
	position: relative;
`;

const OverlayContainer = styled.div`
	width: 1000px;
	height: 600px;
	position: absolute;
	top: 0;
	overflow: hidden;
	z-index: 999;
	pointer-events: none;
`;

const BrushControls = styled.div`
	visibility: ${props => props.show ? 'visible' : 'hidden'};
	display: flex;
	padding: 25px 5px 25px 5px;
	align-items: center;
	justify-content: center;
	flex-direction: row;
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

	${props =>
		!props.active &&
		`
	&:hover {
		background-color: #eee;
	}
	`};
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

fabric.Image.filters.Simplify = fabric.util.createClass(fabric.Image.filters.BaseFilter, {
	type: 'Simplify',
	color: {r: 0, g: 0, b: 0},

	applyTo(canvasEl) {
		const context = canvasEl.getContext('2d');
		const imageData = context.getImageData(0, 0, canvasEl.width, canvasEl.height);
		const data = imageData.data;

		for (let i = 0; i < data.length; i += 4) {
			if (data[i + 3] !== 0) {
				data[i] = this.color.r;
				data[i + 1] = this.color.g;
				data[i + 2] = this.color.b;
				data[i + 3] = data[i + 3] < 128 ? 0 : 255;
			}
		}

		context.putImageData(imageData, 0, 0);
	},

	toObject() {
		return {
			type: this.type,
			color: this.color
		};
	}
});

fabric.Image.filters.Simplify.fromObject = fabric.Image.filters.BaseFilter.fromObject;

export default class extends React.Component {
	state = {
		fillColor: {
			rgb: {r: 0, g: 0, b: 0, a: 255},
			hex: '#000000'
		},
		brushSize: 6,
		tool: 'pencil'
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

	canvasWidth = 1000;
	canvasHeight = 600;

	componentDidMount() {
		fabric.Object.prototype.selectable = false;

		this.canvas = new fabric.Canvas('canvas', {
			freeDrawingCursor: 'none',
			enableRetinaScaling: false,
			width: this.canvasWidth,
			height: this.canvasHeight
		});

		const brushRadius = this.state.brushSize / 2;

		this.canvas.skipTargetFind = true;
		this.canvas.freeDrawingBrush.color = this.state.fillColor;
		this.canvas.freeDrawingBrush.width = this.state.brushSize;
		this.canvas.selection = false;
		this.canvas.getContext('2d').imageSmoothingEnabled = false;

		this.cursor = new fabric.StaticCanvas('cursor', {
			width: this.canvasWidth,
			height: this.canvasHeight,
			enableRetinaScaling: false
		});

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

		this.canvas.on('object:added', e => {
			const obj = e.target;
			if (obj.get('type') === 'path') {
				fabric.Image.fromURL(e.target.toDataURL(), img => {
					this.canvas.remove(obj);
					img.set({top: obj.get('top'), left: obj.get('left')}).setCoords();
					img.filters.push(
						new fabric.Image.filters.Simplify({
							color: this.state.fillColor.rgb
						})
					);
					this.canvas.add(img);
					img.applyFilters(() => {
						this.canvasChanged = true;
						this.canvas.renderAll();
					});
				});
			}
		});

		this.canvas.on('mouse:move', evt => {
			if (this.mouseCursor) {
				const mouse = this.canvas.getPointer(evt.e);
				this.mouseCursor
					.set({
						top: mouse.y + (this.state.tool === 'bucket' ? -19 : 0),
						left: mouse.x + (this.state.tool === 'bucket' ? -2 : 0)
					})
					.setCoords()
					.canvas.renderAll();
			}
		});

		this.canvas.on('mouse:out', () => {
			if (this.mouseCursor) {
				this.mouseCursor
					.set({top: -100, left: -100})
					.setCoords()
					.canvas.renderAll();
			}
		});

		this.canvas.on('mouse:down', evt => {
			if (!this.props.showControls) {
				return;
			}

			if (this.state.tool === 'bucket') {
				const mouse = this.canvas.getPointer(evt.e);
				const x = parseInt(mouse.x, 10);
				const y = parseInt(mouse.y, 10);
				this.usePaintBucket({x, y});
			}
		});
	}

	componentWillUnmount() {
		this.resetAndLockCanvas();
	}

	componentDidUpdate(prevProps) {
		if (!this.props.showControls && !_.isEqual(prevProps.canvasData, this.props.canvasData)) {
			this.canvas.loadFromJSON(this.props.canvasData, () => {
				this.canvas.renderAll();
			});
		}

		if (!prevProps.showControls && this.props.showControls) {
			this.canvas.on('after:render', () => {
				if (this.canvasChanged) {
					this.canvasChanged = false;
					this.props.onDataChanged(this.canvas.toJSON());
				}
			});

			this.canvas.clear();
			this.handleSetPencil();
		} else if (prevProps.showControls && !this.props.showControls) {
			this.resetAndLockCanvas();
		}
	}

	resetAndLockCanvas = () => {
		this.canvas.off('mouse:down');
		this.canvas.off('mouse:move');
		this.canvas.off('mouse:out');
		this.canvas.off('after:render');
		this.canvas.off('object:added');

		this.canvas.isDrawingMode = false;
		this.canvas.hoverCursor = 'default';
		this.canvas.defaultCursor = 'default';
		this.cursor.remove(this.mouseCursor);
		this.canvas.clear();
	};

	handleSetPencil = () => {
		this.canvas.isDrawingMode = true;

		this.mouseCursor = new fabric.Circle({
			left: -100,
			top: -100,
			radius: this.state.brushSize / 2,
			fill: this.state.fillColor.hex,
			stroke: 'black',
			originX: 'center',
			originY: 'center'
		});

		this.cursor.add(this.mouseCursor);
		this.cursor.renderAll();

		this.setState({tool: 'pencil'});
	};

	handleSetBucket = () => {
		this.canvas.isDrawingMode = false;
		this.canvas.defaultCursor = 'none';

		fabric.loadSVGFromURL(bucketIcon, (objects, options) => {
			this.cursor.remove(this.mouseCursor);

			const shape = fabric.util.groupSVGElements(objects, options);
			shape.scaleToWidth(24);
			shape.scaleToHeight(24);
			shape.setShadow({color: '#000', blur: 100});

			this.mouseCursor = shape;
			this.cursor.add(this.mouseCursor);
			this.cursor.renderAll();
		});

		this.setState({tool: 'bucket'});
	};

	usePaintBucket = coords => {
		const ctx = this.canvas.getContext('2d');

		const canvasWidth = this.canvasWidth;
		const canvasHeight = this.canvasHeight;

		const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
		const pp = (coords.y * canvasWidth + coords.x) * 4; // eslint-disable-line no-mixed-operators
		const pixelStack = [pp];
		const curColor = this.state.fillColor.rgb;

		const startColor = {
			r: imageData.data[pp],
			g: imageData.data[pp + 1],
			b: imageData.data[pp + 2],
			a: imageData.data[pp + 3]
		};

		const matchStartColor = pixelPos =>
			imageData.data[pixelPos] === startColor.r &&
			imageData.data[pixelPos + 1] === startColor.g &&
			imageData.data[pixelPos + 2] === startColor.b &&
			imageData.data[pixelPos + 3] === startColor.a;

		const colorPixel = pixelPos => {
			imageData.data[pixelPos] = curColor.r;
			imageData.data[pixelPos + 1] = curColor.g;
			imageData.data[pixelPos + 2] = curColor.b;
			imageData.data[pixelPos + 3] = curColor.a;
		};

		if (_.isEqual(curColor, startColor)) {
			return;
		}

		const dataRowWidth = canvasWidth * 4;
		colorPixel(pp);

		while (pixelStack.length) {
			const pixelPos = pixelStack.pop();

			// X > 0
			if (pixelPos % dataRowWidth !== 0 && matchStartColor(pixelPos - 4)) {
				colorPixel(pixelPos - 4);
				pixelStack.push(pixelPos - 4);
			}

			// X < canvasWidth - 1
			if ((pixelPos + 4) % dataRowWidth !== 0 && matchStartColor(pixelPos + 4)) {
				colorPixel(pixelPos + 4);
				pixelStack.push(pixelPos + 4);
			}

			// Y > 0
			if (pixelPos > dataRowWidth && matchStartColor(pixelPos - dataRowWidth)) {
				colorPixel(pixelPos - dataRowWidth);
				pixelStack.push(pixelPos - dataRowWidth);
			}

			// Y < canvasHeight - 1
			if (
				pixelPos < canvasHeight * (canvasWidth - 1) * 4 &&
				matchStartColor(pixelPos + dataRowWidth)
			) {
				colorPixel(pixelPos + dataRowWidth);
				pixelStack.push(pixelPos + dataRowWidth);
			}
		}

		ctx.putImageData(imageData, 0, 0);
		const c = document.getElementById('canvas');
		fabric.Image.fromURL(c.toDataURL(), img => {
			this.canvas.clear();
			this.canvas.add(img);
			this.canvasChanged = true;
			this.canvas.renderAll();
		});
	};

	handleClearCanvas = () => {
		this.canvasChanged = true;
		this.canvas.clear();
	};

	handleChangeColor = color => {
		color.rgb.a *= 255;
		this.setState({fillColor: color}, () => {
			this.canvas.freeDrawingBrush.color = color.hex;
			if (this.canvas.tool === 'pencil') {
				this.mouseCursor
					.set({fill: color.hex})
					.setCoords()
					.canvas.renderAll();
			}
			this.brushCircle
				.set({fill: color.hex})
				.setCoords()
				.canvas.renderAll();
		});
	};

	handleChangeBrushSize = evt => {
		const val = parseInt(evt.target.value, 10) || 1;
		this.setState({brushSize: val});
		if (this.canvas.isDrawingMode) {
			this.mouseCursor
				.set({radius: val / 2})
				.setCoords()
				.canvas.renderAll();
		}
		this.brushCircle
			.set({radius: val / 2})
			.setCoords()
			.canvas.renderAll();
		this.canvas.freeDrawingBrush.width = val;
	};

	render() {
		const pencil = this.state.tool === 'pencil';
		const {showControls, overlay} = this.props;

		return (
			<Container>
				<CanvasContainer>
					<OverlayContainer>{overlay}</OverlayContainer>
					<canvas id="canvas" style={{position: 'absolute', borderBottom: '1px solid #ddd'}}/>
					<canvas id="cursor" style={{position: 'absolute', top: 0, pointerEvents: 'none'}}/>
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
								step="2"
								value={this.state.brushSize}
								onChange={this.handleChangeBrushSize}
								style={{marginBottom: '10px', width: '250px'}}
							/>
							<canvas id="brush"/>
						</BrushSizeControls>
						<Button active={pencil} onClick={this.handleSetPencil}>
							pencil
						</Button>
						<Button active={!pencil} onClick={this.handleSetBucket}>
							bucket
						</Button>
						<Button onClick={this.handleClearCanvas}>clear</Button>
					</BrushControls>
				</CanvasContainer>
			</Container>
		);
	}
}
