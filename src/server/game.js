import shortid from 'shortid';
import _ from 'lodash';
import schedule from 'node-schedule';

const State = {
	INACTIVE: 'inactive',
	START_OF_ROUND: 'start-of-round',
	CHOOSING_WORD: 'choosing-word',
	DRAWING: 'drawing',
	END_OF_TURN: 'end-of-turn',
	SHOW_TURN_SCORE: 'show-turn-score',
	SHOW_GAME_SCORE: 'show-game-score'
};

const StateDuration = {
	// Seconds.
	START_OF_ROUND: 2,
	CHOOSING_WORD: 1500,
	DRAWING: 1200,
	END_OF_TURN: 2,
	SHOW_TURN_SCORE: 5
};
// Const StateDuration = {
// 	// Seconds.
// 	START_OF_ROUND: 2,
// 	CHOOSING_WORD: 2,
// 	DRAWING: 2,
// 	END_OF_TURN: 2,
// 	SHOW_TURN_SCORE: 2000
// };

const roomBase = {
	round: 1, // Current round.
	maxRounds: 3, // Max rounds.
	players: [], // Connected players.
	canvasData: null,
	currentWord: null, // Word being drawn.
	state: State.INACTIVE,
	/* Time when the game's state changes next. Present at least when we want
	 * clients to show a countdown clock.
	 */
	stateEndTime: null,
	stateSchedule: null,
	clockInterval: null,
	wordChoices: null // Words from which the drawer chooses a word to draw.
};

export default class {
	constructor(words) {
		this.words = words;
		this.rooms = [];
	}

	createRoom = (maxRounds = 3) => {
		const id = shortid.generate();
		this.rooms[id] = Object.assign({}, roomBase, {id, maxRounds});
		return id;
	};

	error = (client, text) => {
		this.messageClient(client, {type: 'error', error: text});
	};

	messageClient = (client, message) => {
		if (client) {
			client.send(JSON.stringify(message), err => {
				if (err) {
					console.log('Failed to send a message to a client: ' + err.message);
				}
			});
		}
	};

	broadcastTimer = roomId => {
		const room = this.rooms[roomId];

		if (room) {
			const countdownMillis = new Date(room.stateEndTime).getTime() - Date.now();
			const countdownSeconds = Math.max(0, Math.floor(countdownMillis / 1000));
			this.broadcast(roomId, {
				type: 'timer',
				time: countdownSeconds
			});
		}
	};

	broadcast = (roomId, msg) => {
		const room = this.rooms[roomId];

		if (room) {
			for (const player of room.players) {
				this.messageClient(player.client, msg);
			}
		}
	};

	addPlayer = (client, roomId, name) => {
		const room = this.rooms[roomId];

		if (!room) {
			return this.error(client, 'Room does not exist.');
		}

		if (room.players.find(p => p.name === name)) {
			return this.error(client, 'Name already taken.');
		}

		client.roomId = roomId;
		client.id = name;

		room.players.push({
			client,
			name,
			isDrawer: false,
			score: {
				total: 0,
				turn: 0
			}
		});

		this.broadcast(roomId, {
			type: 'state',
			room: this.getRoom(roomId)
		});

		this.broadcast(roomId, {
			type: 'log',
			log: {
				timestamp: new Date().toISOString(),
				type: 'system',
				text: `Player ${name} joined.`
			}
		});
	};

	removePlayer = (roomId, playerName) => {
		const room = this.rooms[roomId];

		if (room) {
			const playerIndex = room.players.findIndex(p => p.name === playerName);
			if (playerIndex !== -1) {
				if (room.players[playerIndex].isDrawer && room.state === State.DRAWING) {
					// Set drawer status to previous player so that the next drawer is chosen correctly.
					const prevPlayerIndex = (playerIndex - 1 + room.players.length) % room.players.length;
					room.players[prevPlayerIndex].isDrawer = true;
					this.stateEndOfTurn(roomId);
				}

				room.players.splice(playerIndex, 1);
			}

			if (room.players.length === 0) {
				delete this.rooms[roomId];
				console.log(`Room destroyed. Rooms left: ${this.rooms.length}`);
			} else {
				this.broadcast(roomId, {
					type: 'state',
					room: this.getRoom(roomId)
				});

				this.broadcast(roomId, {
					type: 'log',
					log: {
						timestamp: new Date().toISOString(),
						type: 'system',
						text: `Player ${playerName} left.`
					}
				});
			}
		}
	};

	getRoom = roomId => {
		const room = _.cloneDeep(this.rooms[roomId]);

		if (room) {
			// Hide sensitive and useless data.
			room.players.forEach(p => delete p.client);
			delete room.currentWord;
			delete room.stateSchedule;
			delete room.wordChoices;
			delete room.clockInterval;
			delete room.stateEndTime;
		}

		return room;
	};

	setNextDrawer = roomId => {
		const room = this.rooms[roomId];

		if (room) {
			const currentDrawerIndex = room.players.findIndex(p => p.isDrawer);
			if (currentDrawerIndex !== -1) {
				room.players[currentDrawerIndex].isDrawer = false;
			}

			const nextDrawerIndex = (currentDrawerIndex + 1) % room.players.length;
			room.players[nextDrawerIndex].isDrawer = true;
		}
	};

	getDrawer = roomId => {
		const room = this.rooms[roomId];

		if (room) {
			return room.players.find(p => p.isDrawer);
		}

		return null;
	};

	startGameInRoom = roomId => {
		this.stateStartOfRound(roomId);
	};

	stateStartOfRound = roomId => {
		const room = this.rooms[roomId];

		if (room) {
			room.state = State.START_OF_ROUND;

			// Reset turn scores.
			room.players.forEach(p => {
				p.score.turn = 0;
			});

			this.scheduleStateChange(roomId, StateDuration.START_OF_ROUND, () => {
				this.stateChoosingWord(roomId);
			});

			this.broadcast(roomId, {
				type: 'state',
				room: this.getRoom(roomId)
			});

			this.broadcastTimer(roomId);
		}
	};

	stateChoosingWord = roomId => {
		const room = this.rooms[roomId];

		if (room) {
			room.state = State.CHOOSING_WORD;

			this.setNextDrawer(roomId);

			/* Save the word choices so we can validate that the chosen word was indeed
			 * picked from this list.
			 */
			room.wordChoices = this.pickWords(9);

			this.scheduleStateChange(roomId, StateDuration.CHOOSING_WORD, () => {
				const word = room.wordChoices[0];
				this.stateDrawing(roomId, word);
			});

			this.messageClient(this.getDrawer(roomId).client, {
				type: 'choose-word',
				words: room.wordChoices
			});

			this.broadcast(roomId, {
				type: 'state',
				room: this.getRoom(roomId)
			});

			this.broadcastTimer(roomId);
		}
	};

	stateDrawing(roomId, word) {
		const room = this.rooms[roomId];

		if (room) {
			if (!room.wordChoices.includes(word)) {
				// Probably malicious.
				return;
			}

			this.clearRoomSchedules(roomId);

			room.state = State.DRAWING;
			room.currentWord = word;

			this.scheduleStateChange(roomId, StateDuration.DRAWING, () => this.stateEndOfTurn(roomId));

			this.broadcast(roomId, {
				type: 'state',
				room: this.getRoom(roomId)
			});

			this.messageClient(this.getDrawer(roomId).client, {
				type: 'draw-word',
				word
			});

			this.broadcastTimer(roomId);
		}
	}

	stateEndOfTurn = roomId => {
		const room = this.rooms[roomId];

		if (room) {
			this.clearRoomSchedules(roomId);

			room.state = State.END_OF_TURN;
			room.canvasData = null;

			this.scheduleStateChange(roomId, StateDuration.END_OF_TURN, () => {
				this.stateShowTurnScore(roomId);
			});

			this.broadcast(roomId, {
				type: 'state',
				room: this.getRoom(roomId)
			});

			this.broadcastTimer(roomId);
		}
	};

	stateShowTurnScore = roomId => {
		const room = this.rooms[roomId];

		if (room) {
			this.clearRoomSchedules(roomId);

			room.state = State.SHOW_TURN_SCORE;

			room.players.forEach(p => {
				p.score.total += p.score.turn;
			});

			this.scheduleStateChange(roomId, StateDuration.SHOW_TURN_SCORE, () => {
				const turn = room.players.findIndex(p => p.isDrawer);

				if (turn === room.players.length - 1) {
					// Last turn.
					if (room.round === room.maxRounds) {
						// Last round.
						this.stateShowGameScore(roomId);
					} else {
						room.round++;
						this.stateStartOfRound(roomId);
					}
				} else {
					this.stateChoosingWord(roomId);
				}
			});

			this.broadcast(roomId, {
				type: 'state',
				room: this.getRoom(roomId)
			});

			this.broadcastTimer(roomId);

			room.players.forEach(p => {
				p.score.turn = 0;
			});
		}
	};

	stateShowGameScore = roomId => {
		const room = this.rooms[roomId];

		if (room) {
			this.clearRoomSchedules(roomId);

			room.state = State.SHOW_GAME_SCORE;

			this.broadcast(roomId, {
				type: 'state',
				room: this.getRoom(roomId)
			});

			this.broadcastTimer(roomId);
		}
	};

	clearRoomSchedules(roomId) {
		const room = this.rooms[roomId];

		if (room) {
			if (room.stateSchedule !== null) {
				room.stateSchedule.cancel();
				room.stateSchedule = null;
			}

			if (room.clockInterval !== null) {
				clearInterval(room.clockInterval);
				room.clockInterval = null;
			}

			room.stateEndTime = null;
		}
	}

	scheduleStateChange = (roomId, offsetSeconds, fn) => {
		const room = this.rooms[roomId];

		if (room) {
			const stateChangeDate = getDate(offsetSeconds);
			room.stateEndTime = stateChangeDate.toISOString();
			room.stateSchedule = schedule.scheduleJob(stateChangeDate, () => {
				room.stateSchedule = null;
				fn();
			});
			room.clockInterval = setInterval(() => {
				this.broadcastTimer(roomId);
			}, 1000);
		}
	};

	handleGuess = (roomId, playerName, guess) => {
		const room = this.rooms[roomId];

		if (room) {
			const player = room.players.find(p => p.name === playerName);

			if (player.isDrawer) {
				// The drawer is not allowed to speak, let alone guess the word.
				return;
			}

			if (player.score.turn !== 0) {
				// Player has already guessed the word.
				return;
			}

			if (guess === room.currentWord) {
				const timeRemaining = new Date(room.stateEndTime).getTime() - Date.now();
				const timeRemainingSeconds = timeRemaining / 1000;
				player.score.turn = Math.floor(600 * (timeRemainingSeconds / StateDuration.DRAWING));

				this.broadcast(roomId, {
					type: 'log',
					log: {
						timestamp: new Date().toISOString(),
						type: 'system',
						text: `${playerName} guessed the word!`
					}
				});
			} else {
				this.broadcast(roomId, {
					type: 'log',
					log: {
						timestamp: new Date().toISOString(),
						type: 'player',
						playerName,
						text: guess
					}
				});
			}

			const playersRemaining = room.players.filter(p => p.score.turn === 0);
			if (playersRemaining.length === 1) {
				// All non-drawing players have guessed the word.

				const avg = room.players.reduce((sum, p) => sum + p.score.turn, 0) / room.players.length;
				this.getDrawer(roomId).score.turn = Math.floor(avg * 0.9);

				this.stateEndOfTurn(roomId);
			}
		}
	};

	handleCanvasData = (roomId, data) => {
		const room = this.rooms[roomId];

		if (room) {
			room.canvasData = data;

			this.broadcast(roomId, {
				type: 'state',
				room: this.getRoom(roomId)
			});
		}
	};

	pickWords = num => {
		const arr = [];
		const max = this.words.length - 1;
		const min = 0;

		while (arr.length < num) {
			const wordIndex = Math.floor(Math.random() * (max - min + 1)) + min;
			const word = this.words[wordIndex];
			if (!arr.includes(word)) {
				arr.push(word);
			}
		}

		return arr;
	};
}

function getDate(offsetSeconds) {
	const offsetMs = offsetSeconds * 1000;
	return new Date(Date.now() + offsetMs);
}
