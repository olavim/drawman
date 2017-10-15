import shortid from 'shortid';
import _ from 'lodash';

export default class {
	constructor(words) {
		this.words = words;
		this.rooms = [];
	}

	createRoom = () => {
		const roomId = shortid.generate();
		this.rooms[roomId] = {
			id: roomId,
			active: false,
			round: 0,
			maxRounds: 3,
			players: [],
			canvasData: null,
			currentWord: null
		};

		return roomId;
	};

	addPlayer = (client, roomId, name) => {
		const room = this.rooms[roomId];
		if (!room) {
			throw new Error('No such room');
		}

		client.roomId = roomId;
		client.id = name;

		room.players.push({
			client,
			name,
			drawing: false,
			score: 0
		});
	};

	removePlayer = client => {
		const room = this.rooms[client.roomId];
		const playerIndex = room.players.findIndex(p => p.name === client.id);
		room.players.splice(playerIndex, 1);

		if (room.players.length === 0) {
			delete this.rooms[client.roomId];
		}
	};

	getRoom = roomId => {
		const room = _.cloneDeep(this.rooms[roomId]);
		if (room) {
			room.players.forEach(player => delete player.client);
			delete room.currentWord;
		}
		return room;
	};

	broadcast = (roomId, msg) => {
		const room = this.rooms[roomId];
		if (room) {
			for (const player of room.players) {
				player.client.send(JSON.stringify(msg));
			}
		}
	};
}
