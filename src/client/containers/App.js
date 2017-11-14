import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Canvas from '../components/Canvas';
import WordButton from '../components/WordButton';
import hourglassIcon from '../components/hourglass.svg';
import OverlayTransition from '../components/OverlayTransition';

const ArrowRight = styled.div`
	width: 0;
	height: 0;
	border-top: ${p => p.size}px solid ${p => p.border};
	border-bottom: ${p => p.size}px solid ${p => p.border};

	border-left: ${p => p.size}px solid ${p => p.fill};
`;

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

const StartGameButton = styled.button`
	width: 300px;
	height: 80px;
	border-radius: 16px;
	background-color: #fff;
	border: 4px solid #28a29e;
	color: #28a29e;
	font-size: 20px;
	font-weight: bold;
	cursor: pointer;
	position: absolute;
	left: 50%;
	transform: translate(-50%);
	pointer-events: all;
	transition: box-shadow 0.15s ease-in-out;
	box-sizing: border-box;
	outline: none;

	&:hover {
		box-shadow: 0 0 5px 0 rgba(0, 0, 0, 0.4);
	}

	&:active {
		box-shadow: inset 2px 2px 5px 0 rgba(0, 0, 0, 0.4);
		padding: 2px 0 0 2px;
	}
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
	justify-content: center;
`;

const RoomContent = styled.div`
	flex: 1;
	flex-direction: row;
	display: flex;
	justify-content: center;
`;

const Col = styled.div`
	flex: 0 1 auto;
	flex-direction: column;
	display: flex;
	justify-content: center;
`;

const PlayerList = styled.div`
	display: flex;
	flex-direction: column;
	flex: 0 0 150px;
	width: 150px;
	box-sizing: border-box;
	padding: 20px 0;
	margin-right: 12px;
	border-radius: 8px;
	background-color: #fff;
	box-shadow: 5px 5px 10px 0 rgba(0, 0, 0, 0.1);
`;

const PlayerListElement = styled.div`
	padding: 10px 50px 10px 20px;
	text-align: center;
	background-color: ${props => props.isDrawer ? '#28a29e' : '#fff'};
	color: ${props => props.isDrawer ? '#fff' : '#000'};
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
	margin-top: 10px;
	display: flex;
	align-items: center;
`;

const RoomCodeContainer = styled.div`
	display: flex;
	background-color: rgba(255, 255, 255, 0.5);
	flex: 0 1 auto;
	align-items: center;
	border-radius: 8px;
	height: 40px;
	overflow: hidden;
	border: 2px solid #fff;
	box-shadow: 5px 5px 10px 0 rgba(0, 0, 0, 0.1);
`;

const RoomCodeLabel = styled.label`
	font-size: 12px;
	font-weight: bold;
	flex: 0 1 auto;
	padding: 10px 20px;
`;

const RoomCode = styled.div`
	padding: 0 15px;
	flex: 0 1 auto;
	font-size: 12px;
	font-weight: bold;
	background-color: #fff;
	height: 100%;
	background-color: #fff;
	align-items: center;
	display: flex;
`;

const GameArea = styled.div`
	display: flex;
	box-sizing: border-box;
	justify-content: flex-start;
	flex-direction: column;
	background-color: #fff;
	border-radius: 8px;
	box-shadow: 5px 5px 10px 0 rgba(0, 0, 0, 0.1);
`;

const GameAreaHeader = styled.div`
	display: flex;
	width: 100%;
	flex: 0 0 100px;
	box-sizing: border-box;
	padding: 0 1em;
	align-items: center;
	justify-content: space-between;
	flex-direction: row;
	border-bottom: 1px solid #ddd;
	position: relative;
`;

const ChatContainer = styled.div`
	display: flex;
	flex: 0 0 250px;
	width: 250px;
	box-sizing: border-box;
	flex-direction: column;
	background-color: #fff;
	margin-left: 12px;
	border-radius: 8px;
	overflow: hidden;
	box-shadow: 5px 5px 10px 0 rgba(0, 0, 0, 0.1);
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
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	color: #ddd;
	text-align: center;
`;

const OverlayTitle = styled.h2`
	font-size: 24px;
	font-weight: bold;
	color: #444;
	padding: 0.5em;
	margin: 0;
`;

const OverlayRibbon = styled.div`
	width: 100%;
	height: 120px;
	font-size: 24px;
	font-weight: bold;
	background-color: rgba(0, 0, 0, 0.7);
	color: #ddd;
	display: flex;
	align-items: center;
	justify-content: center;
`;

const OverlayMessage = styled.div`
	width: 100%;
	font-size: 18px;
	font-weight: bold;
	color: #444;
	display: flex;
	align-items: center;
	justify-content: center;
`;

const WordChoiceContainer = styled.div`
	display: flex;
	width: 100%;
	flex-wrap: wrap;
	justify-content: center;
	align-items: center;
	border: 4px solid #28a29e;
	border-radius: 8px;
	overflow: hidden;
	box-sizing: border-box;
	pointer-events: all;
`;

const ScoreContainer = styled.div`
	display: flex;
	width: 100%;
	flex-wrap: wrap;
	justify-content: center;
	align-items: center;
	border: 4px solid #28a29e;
	border-radius: 8px;
	overflow: hidden;
	box-sizing: border-box;
	pointer-events: all;
`;

const Score = styled.div`
	width: 100%;
	height: 50px;
	display: flex;
	justify-content: flex-start;
	align-items: center;
	font-weight: bold;
	color: #777;
	box-sizing: border-box;
	border-left: 1px solid rgba(0, 0, 0, 0.07);
	border-bottom: 1px solid rgba(0, 0, 0, 0.07);
`;

const ScorePlayer = styled.div`
	font-weight: bold;
	flex: 1;
	text-align: left;
	padding: 0 0 0 1em;
`;

const ScoreNumber = styled.div`
	flex: 1;
	text-align: left;
	color: ${props => props.score === 0 ? '#c57070' : '#28a29e'};
`;

const ClockContainer = styled.div`
	width: 3em;
	height: 3em;
	font-size: 24px;
	font-weight: bold;
	color: #000;
	padding: 0.2em 0;
	text-align: left;
	display: flex;
	align-items: center;
	position: relative;
`;

const ClockIcon = styled.span`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;
	background: url(${hourglassIcon}) no-repeat;
	background-position: center center;
	background-size: 2.5em;
	position: relative;

	&:before {
		content: ' ';
		position: absolute;
		width: 60%;
		height: 60%;
		top: 50%;
		left: 50%;
		border-radius: 100px;
		transform: translate(-50%, -50%);
		background: -moz-radial-gradient(
			center,
			ellipse cover,
			rgba(255, 255, 255, 1) 0%,
			rgba(255, 255, 255, 1) 51%,
			rgba(255, 255, 255, 0) 100%
		);
		background: -webkit-radial-gradient(
			center,
			ellipse cover,
			rgba(255, 255, 255, 1) 0%,
			rgba(255, 255, 255, 1) 51%,
			rgba(255, 255, 255, 0) 100%
		);
		background: radial-gradient(
			ellipse at center,
			rgba(255, 255, 255, 1) 0%,
			rgba(255, 255, 255, 1) 51%,
			rgba(255, 255, 255, 0) 100%
		);
		filter: progid:DXImageTransform.Microsoft.gradient(
				startColorstr='#ffffff',
				endColorstr='#00ffffff',
				GradientType=1
			);
	}
`;

const ClockTime = styled.span`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;
	position: absolute;
	left: 0;
	top: 0;
	color: #129075;
`;

const RoundNumberText = styled.span`
	font-weight: bold;
	font-size: 24px;
	color: #28a29e;
	position: absolute;
	left: 50%;
	transform: translate(-50%);
`;

const HeaderControls = styled.span``;

const MessageType = {
	JOIN_ANSWER: 'join-answer',
	ROOM_ANSWER: 'room-answer',
	STATE_UPDATE: 'state',
	LOG: 'log',
	CHOOSE_WORD: 'choose-word',
	TIMER: 'timer'
};

const testing = false;
const testRoom = {
	round: 1,
	maxRounds: 3,
	players: [
		{
			name: 'testimies',
			isDrawer: true,
			score: {
				total: 100,
				turn: 100
			}
		},
		{
			name: 'toinen',
			isDrawer: false,
			score: {
				total: 0,
				turn: 0
			}
		}
	],
	canvasData: null,
	currentWord: 'centipede',
	state: 'inactive',
	wordChoices: ['centipede', 'dog', 'cat', 'chair', 'roofing', 'wizard', 'thunder', 'ceiling']
};

export default class extends React.Component {
	state = {
		name: testing ? testRoom.players[0].name : '',
		guess: '',
		ws: null,
		room: testing ? testRoom : null,
		chatLogs: [],
		wordChoices: testing ? testRoom.wordChoices : [],
		timerValue: null
	};

	static propTypes = {
		match: PropTypes.shape({
			params: PropTypes.shape({
				roomId: PropTypes.string
			}).isRequired
		}).isRequired
	};

	componentDidMount() {
		if (testing) {
			const nextState = 'show-turn-score';
			setTimeout(
				() => this.setState({room: Object.assign({}, testRoom, {state: nextState})}),
				1000
			);
		}
	}

	componentWillUnmount() {
		if (this.clockInterval) {
			clearInterval(this.clockInterval);
			this.clockInterval = null;
		}

		if (this.state.ws) {
			try {
				this.state.ws.close();
			} catch (err) {
				// Ignore error.
			}
		}
	}

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
		if (testing) {
			return;
		}

		const ws = new WebSocket(`wss://${location.host}`);
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
					case MessageType.ROOM_ANSWER:
						this.setState({name: msg.playerName, room: msg.room, chatLogs: []});
						break;
					case MessageType.STATE_UPDATE:
						this.setState({room: msg.room}, this.handleStateChange);
						break;
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
					case MessageType.CHOOSE_WORD:
						this.setState({wordChoices: msg.words});
						break;
					case MessageType.TIMER:
						this.setState({timerValue: msg.time});
						break;
					default:
						console.log('Unhandled message: ', msg);
						break;
				}
			};
		});
	};

	handleStateChange = () => {
		const {room} = this.state;

		if (room.state === 'drawing') {
			if (!this.clockInterval) {
				this.clockInterval = setInterval(() => {
					this.forceUpdate();
				}, 1000);
			}
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
			const isOwner = room.players[0].name === name;
			return (
				<OverlayTransition state={room.state}>
					<OverlayContainer>
						{isOwner ? (
							<StartGameButton onClick={this.handleStartGame}>Start Game</StartGameButton>
						) : (
							<OverlayMessage>
								<span>Waiting for ${room.players[0].name} to start the game</span>
							</OverlayMessage>
						)}
					</OverlayContainer>
				</OverlayTransition>
			);
		}

		if (room.state === 'start-of-round') {
			return (
				<OverlayTransition state={room.state}>
					<OverlayContainer>
						<OverlayRibbon>Round {room.round}</OverlayRibbon>
					</OverlayContainer>
				</OverlayTransition>
			);
		}

		if (room.state === 'choosing-word') {
			return (
				<OverlayTransition state={room.state}>
					<OverlayContainer>
						{drawingPlayer.name === name ? (
							<div style={{width: '60%', textAlign: 'left'}}>
								<OverlayTitle>Choose word</OverlayTitle>
								<WordChoiceContainer>
									{wordChoices.map(word => (
										<WordButton key={word} onClick={this.handleChooseWord} word={word}/>
									))}
								</WordChoiceContainer>
							</div>
						) : (
							<OverlayTitle>
								<span style={{color: '#A22828'}}>{drawingPlayer.name}</span> is choosing a word
							</OverlayTitle>
						)}
					</OverlayContainer>
				</OverlayTransition>
			);
		}

		if (room.state === 'end-of-turn') {
			return (
				<OverlayTransition state={room.state}>
					<OverlayContainer>
						<OverlayRibbon>End of Turn</OverlayRibbon>
					</OverlayContainer>
				</OverlayTransition>
			);
		}

		if (room.state === 'show-turn-score' || room.state === 'show-game-score') {
			const isTurnScore = room.state === 'show-turn-score';
			const playersByScore = room.players
				.slice()
				.map(p => ({name: p.name, score: isTurnScore ? p.score.turn : p.score.total}))
				.sort((a, b) => b.score - a.score);

			return (
				<OverlayTransition state={room.state}>
					<OverlayContainer>
						<div style={{width: '60%', textAlign: 'left'}}>
							<OverlayTitle>{isTurnScore ? 'Turn' : 'Game'} Score</OverlayTitle>
							<ScoreContainer>
								{playersByScore.map(p => (
									<Score key={p.name}>
										<ScorePlayer>{p.name}</ScorePlayer>
										<ScoreNumber score={p.score}>{p.score}</ScoreNumber>
									</Score>
								))}
							</ScoreContainer>
						</div>
					</OverlayContainer>
				</OverlayTransition>
			);
		}

		return null;
	};

	getClockComponent = () => {
		const {room, timerValue} = this.state;

		if (room.state === 'drawing') {
			return (
				<ClockContainer>
					<ClockIcon/>
					<ClockTime>{timerValue}</ClockTime>
				</ClockContainer>
			);
		}

		return <div/>;
	};

	render() {
		const {room, name, guess, chatLogs} = this.state;
		const {roomId} = this.props.match.params;

		const isDrawer =
			room && room.state === 'drawing' && room.players.find(p => p.name === name).isDrawer;
		return (
			<Container>
				{room === null ? (
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
					</MenuContainer>
				) : (
					<RoomContainer>
						<RoomContentContainer>
							<Col>
								<RoomContent>
									<PlayerList>
										{room.players.map(p => {
											return (
												<PlayerListElement key={p.name} isDrawer={p.isDrawer}>
													<PlayerName>{p.name}</PlayerName>
													<PlayerScore>Score: {p.score.total}</PlayerScore>
												</PlayerListElement>
											);
										})}
									</PlayerList>
									<GameArea>
										<GameAreaHeader>
											{this.getClockComponent()}
											{room.state === 'inactive' ? (
												<div/>
											) : (
												<RoundNumberText>
													Round {room.round} / {room.maxRounds}
												</RoundNumberText>
											)}
											<HeaderControls/>
										</GameAreaHeader>
										<Canvas
											canvasData={room.canvasData}
											showControls={isDrawer}
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
														{log.type === 'player' && (
															<LogPlayerName>{log.playerName}:</LogPlayerName>
														)}
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
								<Footer>
									<RoomCodeContainer>
										<RoomCodeLabel>Share this room</RoomCodeLabel>
										<ArrowRight fill="transparent" border="#fff" size="20"/>
										<RoomCode onClick={this.handleClickRoomCodeElem}>
											{`${location.origin}/rooms/${room.id}`}
										</RoomCode>
									</RoomCodeContainer>
								</Footer>
							</Col>
						</RoomContentContainer>
					</RoomContainer>
				)}
			</Container>
		);
	}
}
