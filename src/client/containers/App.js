import React from 'react';
import PropTypes from 'prop-types';

const containerStyle = {
	display: 'flex',
	height: '100%',
	justifyContent: 'center',
	alignItems: 'center'
};

const inputContainerStyle = {
	width: '25%'
};

const roomContainerStyle = {
	height: '100%',
	flex: 1,
	flexDirection: 'column',
	display: 'flex'
};

const roomContentContainerStyle = {
	width: '100%',
	flex: 1,
	flexDirection: 'row',
	display: 'flex'
};

const playerListStyle = {
	display: 'flex',
	flexDirection: 'column',
	borderRight: '1px solid #444'
};

const playerNameStyle = {
	padding: '10px 50px 10px 20px'
};

const buttonStyle = {
	padding: '10px',
	textAlign: 'center',
	border: '1px solid #444',
	cursor: 'pointer'
};

const nameInputStyle = {
	padding: '10px',
	border: '1px solid #444',
	width: '100%',
	boxSizing: 'border-box',
	marginBottom: '10px'
};

const roomFooterStyle = {
	width: '100%',
	flex: '0 1 auto',
	flexDirection: 'row',
	display: 'flex',
	borderTop: '1px solid #444',
	boxSizing: 'border-box',
	padding: '1em',
	justifyContent: 'center'
};

const shareTextStyle = {
	fontSize: '14px',
	flex: '0 1 auto'
};

const shareCodeStyle = {
	padding: '10px',
	border: '1px solid #aaa',
	borderRadius: '5px',
	marginLeft: '10px'
};

export default class extends React.Component {
	state = {
		name: '',
		ws: null,
		room: null
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
				case 'join-answer':
				case 'room-answer':
					this.setState({name: msg.playerName, room: msg.room});
					break;
				case 'broadcast-state':
					this.setState({room: msg.room});
					break;
				default:
					console.log('Unhandled message: ', msg);
					break;
			}
		};
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
		const {room, name} = this.state;
		const {roomId} = this.props.match.params;
		return (
			<div style={containerStyle}>
				{room === null ?
					<div style={inputContainerStyle}>
						<input
							type="text"
							placeholder="Enter your name"
							style={nameInputStyle}
							onChange={this.handleNameChange}
							value={name}
						/>
						<div style={buttonStyle} onClick={this.handleClickJoinRoom}>
							{typeof roomId === 'undefined' ? 'Create room' : 'Join room'}
						</div>
					</div> :
					<div style={roomContainerStyle}>
						<div style={roomContentContainerStyle}>
							<div style={playerListStyle}>
								{room.players.map(p => {
									return <div key={p.name} style={playerNameStyle}>{p.name}</div>;
								})}
							</div>
						</div>
						<div style={roomFooterStyle}>
							<h2 style={shareTextStyle}>Share this room:</h2>
							<span style={shareCodeStyle} onClick={this.handleClickRoomCodeElem}>
								{`${location.origin}/rooms/${room.id}`}
							</span>
						</div>
					</div>}
			</div>
		);
	}
}
