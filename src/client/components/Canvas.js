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
	display: flex;
	padding: 25px 5px 0 5px;
	align-items: center;
	justify-content: center;
	flex-direction: column;
`;

const BrushSizeControls = styled.div`
	display: flex;
	padding: 20px 0;
	align-items: center;
	justify-content: center;
	flex-direction: column;
`;

const Tools = styled.div`
	display: flex;
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
	'#4D4D4D',
	'#666666',
	'#808080',
	'#999999',
	'#B3B3B3',
	'#cccccc',
	'#9F0500',
	'#D33115',
	'#F44E3B',
	'#C45100',
	'#E27300',
	'#FE9200',
	'#FB9E00',
	'#FCC400',
	'#FCDC00',
	'#808900',
	'#B0BC00',
	'#DBDF00',
	'#194D33',
	'#68BC00',
	'#A4DD00',
	'#0C797D',
	'#16A5A5',
	'#68CCCA',
	'#0062B1',
	'#009CE0',
	'#73D8FF',
	'#653294',
	'#7B64FF',
	'#AEA1FF',
	'#AB149E',
	'#FA28FF',
	'#FDA1FF'
];

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

		this.canvas.freeDrawingBrush.color = this.state.fillColor;
		this.canvas.freeDrawingBrush.width = this.state.brushSize;
		this.canvas.selection = false;
		this.canvas.setWidth(800);
		this.canvas.setHeight(600);

		this.cursor = new fabric.StaticCanvas('cursor');
		this.cursor.setWidth(800);
		this.cursor.setHeight(600);

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
			const width = 800;
			const height = 600;

			const drawingBoundTop = 0;
			const imageData = ctx.getImageData(0, 0, width, height);
			const pixelStack = [[mx, my]];

			const pp = (my * width + mx) * 4; // eslint-disable-line no-mixed-operators
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
		const imageData = ctx.getImageData(0, 0, 800, 600);

		for (let i = 0; i < 800; i++) {
			for (let j = 0; j < 600; j++) {
				const pp = (j * 800 + i) * 4; // eslint-disable-line no-mixed-operators
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
		const val = evt.target.value;
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
					<canvas id="canvas" style={{border: '1px solid #000', position: 'absolute'}}/>
					<canvas id="cursor" style={{position: 'absolute', top: '0', pointerEvents: 'none'}}/>
					{showControls &&
						<BrushControls>
							<CirclePicker
								colors={colors}
								color={this.state.fillColor}
								width={720}
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
						</BrushControls>}
				</CanvasContainer>
				{showControls &&
					<Tools>
						<Button active={pencil} onClick={this.handleSetPencil}>pencil</Button>
						<Button active={!pencil} onClick={this.handleSetBucket}>bucket</Button>
						<Button onClick={this.handleClearCanvas}>clear</Button>
					</Tools>}
			</Container>
		);
	}
}
