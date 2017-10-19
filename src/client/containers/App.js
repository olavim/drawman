import React from 'react';
import PropTypes from 'prop-types';
import Canvas from '../components/Canvas';
import WordButton from '../components/WordButton';

const style = {
	root: {
		display: 'flex',
		height: '100%',
		justifyContent: 'center',
		alignItems: 'center'
	},
	input: {
		width: '25%'
	},
	guessInput: {
		width: '100%',
		padding: '10px',
		boxSizing: 'border-box',
		border: 'none',
		borderTop: '1px solid #aaa'
	},
	nameInput: {
		padding: '10px',
		border: '1px solid #444',
		width: '100%',
		boxSizing: 'border-box',
		marginBottom: '10px'
	},
	room: {
		root: {
			height: '100%',
			flex: 1,
			flexDirection: 'column',
			display: 'flex'
		},
		content: {
			width: '100%',
			flex: 1,
			flexDirection: 'row',
			display: 'flex'
		}
	},
	playerList: {
		root: {
			display: 'flex',
			flexDirection: 'column',
			borderRight: '1px solid #444',
			width: '150px',
			padding: '20px 0'
		},
		listElement: {
			root: {
				padding: '10px 50px 10px 20px',
				textAlign: 'center'
			},
			name: {
				fontWeight: 'bold'
			},
			score: {
				fontSize: '12px'
			}
		}
	},
	button: {
		padding: '10px',
		textAlign: 'center',
		border: '1px solid #444',
		cursor: 'pointer'
	},
	footer: {
		root: {
			width: '100%',
			flex: '0 1 auto',
			flexDirection: 'row',
			display: 'flex',
			borderTop: '1px solid #444',
			boxSizing: 'border-box',
			padding: '1em',
			justifyContent: 'center'
		},
		shareCode: {
			label: {
				fontSize: '14px',
				flex: '0 1 auto'
			},
			codeContainer: {
				padding: '10px',
				border: '1px solid #aaa',
				borderRadius: '5px',
				marginLeft: '10px'
			}
		}
	},
	gameArea: {
		root: {
			display: 'flex',
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center'
		}
	},
	chat: {
		root: {
			display: 'flex',
			flex: '0 0 250px',
			borderLeft: '1px solid #444',
			flexDirection: 'column'
		},
		content: {
			flex: 1,
			boxSizing: 'border-box',
			overflowY: 'auto'
		},
		log: {
			root: {
				display: 'flex',
				flexDirection: 'row',
				fontSize: '14px',
				padding: '8px 10px'
			},
			playerName: {
				fontWeight: 'bold',
				marginRight: '5px'
			},
			text: {
				wordBreak: 'break-all'
			}
		}
	},
	overlay: {
		root: {
			zIndex: 99,
			position: 'absolute',
			top: 0,
			width: '802px',
			height: '602px',
			display: 'flex',
			justifyContent: 'center',
			alignItems: 'center',
			backgroundColor: 'rgba(50, 80, 120, 1)',
			color: '#ddd'
		},
		wordChoiceContainer: {
			root: {
				display: 'flex',
				flex: 1,
				width: '100%',
				flexWrap: 'wrap',
				justifyContent: 'space-around'
			}
		}
	}
};

const MessageType = {
	JOIN_ANSWER: 'join-answer',
	ROOM_ANSWER: 'room-answer',
	STATE_UPDATE: 'state',
	LOG: 'log',
	CHOOSE_WORD: 'choose-word'
};

export default class extends React.Component {
	state = {
		name: '',
		guess: '',
		ws: null,
		room: null,
		chatLogs: [],
		wordChoices: []
	};

	static propTypes = {
		match: PropTypes.shape({
			params: PropTypes.shape({
				roomId: PropTypes.string
			}).isRequired
		}).isRequired
	};

	sendMessage = msg => {
		this.state.ws.send(JSON.stringify(msg));
	};

	handleNameChange = evt => {
		this.setState({name: evt.target.value});
	};

	handleGuessChange = evt => {
		this.setState({guess: evt.target.value});
	};

	handleGuessKeyDown = evt => {
		if (evt.keyCode === 13) {
			// Enter
			this.sendMessage({type: 'guess', guess: this.state.guess});
			this.setState({guess: ''});
		}
	};

	handleClickJoinRoom = async () => {
		if (this.state.ws) {
			this.state.ws.close();
			this.setState({ws: null}, this.openConnection);
		} else {
			this.openConnection();
		}
	};

	openConnection = () => {
		const ws = new WebSocket('ws://localhost:8079');
		const {roomId} = this.props.match.params;
		this.setState({ws}, () => {
			ws.onopen = () => {
				if (roomId) {
					this.sendMessage({type: 'join-request', playerName: this.state.name, roomId});
				} else {
					this.sendMessage({type: 'room-request', playerName: this.state.name});
				}
			};

			ws.onmessage = event => {
				const msg = JSON.parse(event.data);
				if (msg.error) {
					console.error(msg.error);
					return;
				}

				switch (msg.type) {
					case MessageType.JOIN_ANSWER:
					case MessageType.ROOM_ANSWER: {
						this.setState({name: msg.playerName, room: msg.room, chatLogs: []});
						break;
					}
					case MessageType.STATE_UPDATE: {
						this.setState({room: msg.room});
						console.log(msg.room.state);
						break;
					}
					case MessageType.LOG: {
						const scrolledToBottom =
							this.chat.scrollTop === this.chat.scrollHeight - this.chat.clientHeight;
						this.setState({chatLogs: [...this.state.chatLogs, msg.log]}, () => {
							if (scrolledToBottom) {
								// If we were scrolled to bottom previously, scroll to bottom.
								this.chat.scrollTop = this.chat.scrollHeight - this.chat.clientHeight;
							}
						});
						break;
					}
					case MessageType.CHOOSE_WORD: {
						this.setState({wordChoices: msg.words});
						break;
					}
					default: {
						console.log('Unhandled message: ', msg);
						break;
					}
				}
			};
		});
	};

	handleClickRoomCodeElem = evt => {
		const el = evt.target;
		let range;
		let selection;
		if (document.body.createTextRange) {
			range = document.body.createTextRange();
			range.moveToElementText(el);
			range.select();
		} else if (window.getSelection) {
			selection = window.getSelection();
			range = document.createRange();
			range.selectNodeContents(el);
			selection.removeAllRanges();
			selection.addRange(range);
		}
	};

	handleStartGame = () => {
		this.sendMessage({type: 'start-request'});
	};

	handleChooseWord = word => {
		this.sendMessage({type: 'word-request', word});
	};

	handleCanvasDataChanged = data => {
		this.sendMessage({type: 'canvas-data', data});
	};

	getOverlay = () => {
		const {room, name, wordChoices} = this.state;
		const drawingPlayer = room.players.find(p => p.isDrawer);

		if (room.state === 'start-of-round') {
			return (
				<div style={style.overlay.root}>
					<span>Round {room.round}</span>
				</div>
			);
		}

		if (room.state === 'choosing-word') {
			return (
				<div style={style.overlay.root}>
					{drawingPlayer.name === name ?
						<div style={style.overlay.wordChoiceContainer.root}>
							{wordChoices.map(word =>
								<WordButton key={word} onClick={this.handleChooseWord} word={word}/>
								)}
						</div> :
						<span>{drawingPlayer.name} is choosing a word</span>}
				</div>
			);
		}

		if (room.state === 'end-of-turn') {
			return (
				<div style={style.overlay.root}>
					<span>End of turn</span>
				</div>
			);
		}

		if (room.state === 'show-turn-score') {
			return (
				<div style={style.overlay.root}>
					<span>Turn scores</span>
				</div>
			);
		}

		if (room.state === 'show-game-score') {
			return (
				<div style={style.overlay.root}>
					<span>Scores</span>
				</div>
			);
		}

		return null;
	};

	render() {
		const {room, name, guess, chatLogs} = this.state;
		const {roomId} = this.props.match.params;

		const isDrawing =
			room && room.state === 'drawing' && room.players.find(p => p.name === name).isDrawer;

		const owner = room ? room.players[0] : {};
		const isOwner = name === owner.name;
		return (
			<div style={style.root}>
				{room === null ?
					<div style={style.input}>
						<input
							type="text"
							placeholder="Enter your name"
							style={style.nameInput}
							onChange={this.handleNameChange}
							value={name}
						/>
						<div style={style.button} onClick={this.handleClickJoinRoom}>
							{roomId ? 'Join room' : 'Create room'}
						</div>
					</div> :
					<div style={style.room.root}>
						<div style={style.room.content}>
							<div style={style.playerList.root}>
								{room.players.map(p => {
									return (
										<div key={p.name} style={style.playerList.listElement.root}>
											<div style={style.playerList.listElement.name}>
												{p.name}
											</div>
											<div style={style.playerList.listElement.score}>
													Score: {p.score.total}
											</div>
										</div>
									);
								})}
							</div>
							<div style={style.gameArea.root}>
								{room.state === 'inactive' ?
										isOwner ?
											<button onClick={this.handleStartGame}>Start Game</button> :
											<span>Waiting for {owner.name} to start the game</span> :
											<Canvas
												canvasData={room.canvasData}
												showControls={isDrawing}
												overlay={this.getOverlay()}
												onDataChanged={this.handleCanvasDataChanged}
											/>}
							</div>
							<div style={style.chat.root}>
								<div
									ref={x => {
										this.chat = x;
									}}
									style={style.chat.content}
								>
									{chatLogs.map((log, index) => {
										const rootStyle = Object.assign({}, style.chat.log.root, {
											backgroundColor: index % 2 === 0 ? '#eee' : '#fff'
										});
										return (
											<div key={log.timestamp} style={rootStyle}>
												{log.type === 'player' &&
												<div style={style.chat.log.playerName}>{log.playerName}:</div>}
												<div style={style.chat.log.text}>{log.text}</div>
											</div>
										);
									})}
								</div>
								<input
									style={style.guessInput}
									placeholder="Type your guess here"
									value={guess}
									onChange={this.handleGuessChange}
									onKeyDown={this.handleGuessKeyDown}
								/>
							</div>
						</div>
						<div style={style.footer.root}>
							<h2 style={style.footer.shareCode.label}>Share this room:</h2>
							<span
								style={style.footer.shareCode.codeContainer}
								onClick={this.handleClickRoomCodeElem}
							>
								{`${location.origin}/rooms/${room.id}`}
							</span>
						</div>
					</div>}
			</div>
		);
	}
}
