import express from 'express';
import Game from '../game';

const titlePrefix = {
	development: 'Dev | ',
	staging: 'Stag | ',
	testing: 'Test | ',
	production: ''
};

export default (config, words) => {
	const router = new express.Router();
	const game = new Game(words);

	router.get(['/', '/rooms/:roomId'], (req, res) => {
		res.header('Content-Type', 'text/html');
		res.render('index', {
			title: titlePrefix[config.env] + 'Drawman',
			hot: config.env === 'development' && config.hot
		});
	});

	router.ws('/', ws => {
		ws.on('message', data => {
			const msg = JSON.parse(data);

			switch (msg.type) {
				case 'room-request':
					handleRoomRequest(game, ws, msg);
					break;
				case 'join-request':
					handleJoinRequest(game, ws, msg);
					break;
				case 'guess':
					handleGuess(game, ws, msg);
					break;
				case 'canvas-data':
					handleCanvasData(game, ws, msg);
					break;
				case 'start-request':
					handleStartGame(game, ws, msg);
					break;
				case 'word-request':
					handleWordChosen(game, ws, msg);
					break;
				default:
					break;
			}
		});

		ws.on('close', () => {
			game.removePlayer(ws.roomId, ws.id);
		});
	});

	return router;
};

function handleRoomRequest(game, ws, msg) {
	const playerName = msg.playerName || `guest-${Math.floor(Math.random() * (999 - 100)) + 100}`;
	const roomId = game.createRoom();
	game.addPlayer(ws, roomId, playerName);

	ws.send(
		JSON.stringify({
			type: 'room-answer',
			playerName,
			room: game.getRoom(roomId)
		})
	);

	console.log('num rooms: ' + Object.keys(game.rooms).length);
}

function handleJoinRequest(game, ws, msg) {
	try {
		const playerName = msg.playerName || `guest-${Math.floor(Math.random() * (999 - 100)) + 100}`;
		game.addPlayer(ws, msg.roomId, playerName);

		ws.send(
			JSON.stringify({
				type: 'join-answer',
				playerName,
				room: game.getRoom(msg.roomId)
			})
		);
	} catch (err) {
		ws.send(
			JSON.stringify({
				type: 'join-answer',
				error: err.message
			})
		);
	}
}

function handleGuess(game, ws, msg) {
	game.handleGuess(ws.roomId, ws.id, msg.guess);
}

function handleCanvasData(game, ws, msg) {
	const room = game.getRoom(ws.roomId);
	const drawer = room.players.find(p => p.isDrawer);
	if (drawer.name === ws.id) {
		game.handleCanvasData(ws.roomId, msg.data);
	}
}

function handleStartGame(game, ws) {
	const room = game.getRoom(ws.roomId);
	if (room && room.players[0].name === ws.id) {
		game.startGameInRoom(ws.roomId);
	}
}

function handleWordChosen(game, ws, msg) {
	const room = game.getRoom(ws.roomId);
	const drawer = room.players.find(p => p.isDrawer);
	if (drawer.name === ws.id) {
		game.stateDrawing(ws.roomId, msg.word);
	}
}
