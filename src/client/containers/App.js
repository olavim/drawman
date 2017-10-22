import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Canvas from '../components/Canvas';
import WordButton from '../components/WordButton';

const Container = styled.div`
	display: flex;
	height: 100%;
	justify-content: center;
	align-items: center;
`;

const MenuContainer = styled.div`
	width: 25%;
`;

const Input = styled.input`
	padding: 10px;
	width: 100%;
	box-sizing: border-box;
	border: 1px solid #444;
`;

const NameInput = Input.extend`
	margin-bottom: 10px;
`;

const GuessInput = Input.extend`
	border: none;
	border-top: 1px solid #aaa;
`;

const RoomContainer = styled.div`
	height: 100%;
	flex: 1;
	flex-direction: column;
	display: flex;
`;

const RoomContentContainer = styled.div`
	flex: 1;
	flex-direction: row;
	display: flex;
	align-items: center;
	background-color: #9ce1fd;
`;

const RoomContent = styled.div`
	flex: 1;
	flex-direction: row;
	display: flex;
	justify-content: center;
	background-color: #9ce1fd;
`;

const PlayerList = styled.div`
	display: flex;
	flex-direction: column;
	flex: 0 0 150px;
	box-sizing: border-box;
	padding: 20px 0;
	margin-right: 12px;
	border-radius: 8px;
	background-color: #fff;
	box-shadow: 5px 5px 10px 0 rgba(0, 0, 0, .1);
`;

const PlayerListElement = styled.div`
	padding: 10px 50px 10px 20px;
	text-align: center
`;

const PlayerName = styled.div`
	font-weight: bold;
`;

const PlayerScore = styled.div`
	font-size: 12px;
`;

const Button = styled.div`
	padding: 10px;
	text-align: center;
	border: 1px solid #444;
	cursor: pointer;
`;

const Footer = styled.div`
	width: 100%;
	flex: 0 1 auto;
	flex-direction: row;
	display: flex;
	border-top: 1px solid #444;
	box-sizing: border-box;
	padding: 1em;
	justify-content: center;
`;

const RoomCodeLabel = styled.h2`
	font-size: 14px;
	flex: 0 1 auto;
`;

const RoomCode = styled.span`
	padding: 10px;
	border: 1px solid #aaa;
	border-radius: 5px;
	margin-left: 10px;
`;

const GameArea = styled.div`
	display: flex;
	box-sizing: border-box;
	justify-content: flex-start;
	flex-direction: column;
	background-color: #fff;
	border-radius: 8px;
	box-shadow: 5px 5px 10px 0 rgba(0, 0, 0, .1);
`;

const GameAreaHeader = styled.div`
	display: flex;
	width: 100%;
	flex: 0 0 100px;
	box-sizing: border-box;
	padding: 0 2em;
	align-items: center;
	flex-direction: row;
	border-bottom: 1px solid #ddd;
`;

const ChatContainer = styled.div`
	display: flex;
	flex: 0 0 250px;
	box-sizing: border-box;
	flex-direction: column;
	background-color: #fff;
	margin-left: 12px;
	border-radius: 8px;
	overflow: hidden;
	box-shadow: 5px 5px 10px 0 rgba(0, 0, 0, .1);
`;

const ChatContent = styled.div`
	flex: 1;
	box-sizing: border-box;
	overflow-y: auto;
`;

const LogContainer = styled.div`
	display: flex;
	flex-direction: row;
	font-size: 14px;
	padding: 8px 10px;
	background-color: #fff;
	
	&:nth-child(odd) {
		background-color: #eee;
	}
`;

const LogPlayerName = styled.span`
	font-weight: bold;
	margin-right: 5px;
`;

const LogText = styled.span`
	word-break: break-all;
`;

const OverlayContainer = styled.div`
	z-index: 99;
	position: absolute;
	top: 0;
	width: 1000px;
	height: 600px;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: rgba(50, 80, 120, 1);
	color: #ddd;
	text-align: center;
`;

const TitledOverlayContainer = OverlayContainer.extend`
	align-items: flex-start;
`;

const WordChoiceContainer = styled.div`
	display: flex;
	flex: 1;
	width: 100%;
	flex-wrap: wrap;
	justify-content: space-around;
`;

const ScoreContainer = styled.div`
	display: flex;
	flex: 1;
	width: 100%;
	flex-direction: column;
`;

const Score = styled.div`
	display: flex;
	width: 100%;
	flex-direction: row;
	font-size: 32px;
	color: #fff;
	justify-content: center;
`;

const ScorePlayer = styled.div`
	font-weight: bold;
	flex: 1;
	text-align: right;
	padding: 0.2em 0.5em;
`;

const ScoreNumber = styled.div`
	flex: 1;
	text-align: left;
	padding: 0.2em 0.5em;
	color: ${props => props.score === 0 ? '#c57070' : '#a4d23d'};
`;

const OverlayTitle = styled.h2`
	font-size: 32px;
	font-weight: bold;
	color: #fff;
	padding: 1em;
`;

const ClockContainer = styled.div`
	width: 100%;
	font-size: 24px;
	font-weight: bold;
	color: #000;
	padding: 0.2em 0;
	text-align: left;
`;

const ClockLabel = styled.span`
	margin-right: 12px;
`;

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
						this.setState({room: msg.room}, this.handleStateChange);
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

	handleStateChange = () => {
		const {room} = this.state;

		if (room.state === 'drawing') {
			this.clockInterval = setInterval(() => {
				this.forceUpdate();
			}, 1000);
		} else {
			if (this.clockInterval) {
				clearInterval(this.clockInterval);
			}

			this.clockInterval = null;
		}
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

		if (room.state === 'inactive') {
			const owner = room.players[0];
			if (owner.name === name) {
				return (
					<OverlayContainer>
						<button onClick={this.handleStartGame}>Start Game</button>
					</OverlayContainer>
				);
			}
			return (
				<OverlayContainer>
					<OverlayTitle>Waiting for {owner.name} to start the game</OverlayTitle>
				</OverlayContainer>
			);
		}

		if (room.state === 'start-of-round') {
			return (
				<OverlayContainer>
					<OverlayTitle>Round {room.round}</OverlayTitle>
				</OverlayContainer>
			);
		}

		if (room.state === 'choosing-word') {
			return (
				<OverlayContainer>
					{drawingPlayer.name === name ?
						<WordChoiceContainer>
							{wordChoices.map(word =>
								<WordButton key={word} onClick={this.handleChooseWord} word={word}/>
								)}
						</WordChoiceContainer> :
						<OverlayTitle>{drawingPlayer.name} is choosing a word</OverlayTitle>}
				</OverlayContainer>
			);
		}

		if (room.state === 'end-of-turn') {
			return (
				<OverlayContainer>
					<OverlayTitle>End of Turn</OverlayTitle>
				</OverlayContainer>
			);
		}

		if (room.state === 'show-turn-score' || room.state === 'show-game-score') {
			const isTurnScore = room.state === 'show-turn-score';
			const playersByScore = room.players
				.slice()
				.map(p => ({name: p.name, score: isTurnScore ? p.score.turn : p.score.total}))
				.sort((a, b) => b.score - a.score);

			return (
				<TitledOverlayContainer>
					<ScoreContainer>
						<OverlayTitle>{isTurnScore ? 'Turn' : 'Game'} Score</OverlayTitle>
						{playersByScore.map(p => {
							return (
								<Score key={p.name}>
									<ScorePlayer>{p.name}:</ScorePlayer>
									<ScoreNumber score={p.score}>{p.score}</ScoreNumber>
								</Score>
							);
						})}
					</ScoreContainer>
				</TitledOverlayContainer>
			);
		}

		return null;
	};

	getClockComponent = () => {
		const {room} = this.state;

		if (room.state === 'drawing') {
			const millisRemaining = new Date(room.stateEndTime) - Date.now();
			const secondsRemaining = Math.floor(millisRemaining / 1000);
			return (
				<ClockContainer>
					<ClockLabel>Time:</ClockLabel>
					<span>{secondsRemaining}</span>
				</ClockContainer>
			);
		}

		return null;
	};

	render() {
		const {room, name, guess, chatLogs} = this.state;
		const {roomId} = this.props.match.params;

		const isDrawing =
			room && room.state === 'drawing' && room.players.find(p => p.name === name).isDrawer;
		return (
			<Container>
				{room === null ?
					<MenuContainer>
						<NameInput
							type="text"
							placeholder="Enter your name"
							onChange={this.handleNameChange}
							value={name}
						/>
						<Button onClick={this.handleClickJoinRoom}>
							{roomId ? 'Join room' : 'Create room'}
						</Button>
					</MenuContainer> :
					<RoomContainer>
						<RoomContentContainer>
							<RoomContent>
								<PlayerList>
									{room.players.map(p => {
										return (
											<PlayerListElement key={p.name}>
												<PlayerName>{p.name}</PlayerName>
												<PlayerScore>Score: {p.score.total}</PlayerScore>
											</PlayerListElement>
										);
									})}
								</PlayerList>
								<GameArea>
									<GameAreaHeader>
										{this.getClockComponent()}
									</GameAreaHeader>
									<Canvas
										canvasData={room.canvasData}
										showControls={isDrawing}
										overlay={this.getOverlay()}
										onDataChanged={this.handleCanvasDataChanged}
									/>
								</GameArea>
								<ChatContainer>
									<ChatContent
										ref={x => {
											this.chat = x;
										}}
									>
										{chatLogs.map(log => {
											return (
												<LogContainer key={log.timestamp}>
													{log.type === 'player' &&
													<LogPlayerName>{log.playerName}:</LogPlayerName>}
													<LogText>{log.text}</LogText>
												</LogContainer>
											);
										})}
									</ChatContent>
									<GuessInput
										placeholder="Type your guess here"
										value={guess}
										onChange={this.handleGuessChange}
										onKeyDown={this.handleGuessKeyDown}
									/>
								</ChatContainer>
							</RoomContent>
						</RoomContentContainer>
						<Footer>
							<RoomCodeLabel>Share this room:</RoomCodeLabel>
							<RoomCode onClick={this.handleClickRoomCodeElem}>
								{`${location.origin}/rooms/${room.id}`}
							</RoomCode>
						</Footer>
					</RoomContainer>}
			</Container>
		);
	}
}
