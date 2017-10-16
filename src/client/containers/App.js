import React from 'react';
import PropTypes from 'prop-types';
import Canvas from '../components/Canvas';

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
			width: '150px'
		},
		listElement: {
			padding: '10px 50px 10px 20px'
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
	}
};

const MessageType = {
	JOIN_ANSWER: 'join-answer',
	ROOM_ANSWER: 'room-answer',
	STATE_UPDATE: 'state',
	LOG: 'log'
};

export default class extends React.Component {
	state = {
		name: '',
		guess: '',
		ws: null,
		room: null,
		chatLogs: []
	};

	static propTypes = {
		match: PropTypes.shape({
			params: PropTypes.shape({
				roomId: PropTypes.string
			}).isRequired
		}).isRequired
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
			this.state.ws.send(
				JSON.stringify({
					type: 'guess',
					guess: this.state.guess
				})
			);

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
					ws.send(
						JSON.stringify({
							type: 'join-request',
							playerName: this.state.name,
							roomId
						})
					);
				} else {
					ws.send(
						JSON.stringify({
							type: 'room-request',
							playerName: this.state.name
						})
					);
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

	render() {
		const {room, name, guess, chatLogs} = this.state;
		const {roomId} = this.props.match.params;
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
										<div key={p.name} style={style.playerList.listElement}>
											{p.name}
										</div>
									);
								})}
							</div>
							<div style={style.gameArea.root}>
								<Canvas/>
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
												<div style={style.chat.log.playerName}>{log.playerName}:</div>
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
