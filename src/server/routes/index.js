import express from 'express';
import shortid from 'shortid';
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
			console.log(msg.type);

			switch (msg.type) {
				case 'room-request':
					handleRoomRequest(game, ws, msg);
					break;
				case 'join-request':
					handleJoinRequest(game, ws, msg);
					break;
				default:
					break;
			}
		});

		ws.on('close', () => {
			game.removePlayer(ws);
			game.broadcast(ws.roomId, {
				type: 'broadcast-state',
				room: game.getRoom(ws.roomId)
			});
		});
	});

	return router;
};

function handleRoomRequest(game, ws, msg) {
	const playerName = msg.playerName || `guest-${shortid.generate()}`;
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
		const playerName = msg.playerName || `guest-${shortid.generate()}`;
		game.addPlayer(ws, msg.roomId, playerName);
		game.broadcast(msg.roomId, {
			type: 'broadcast-state',
			room: game.getRoom(msg.roomId)
		});

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
