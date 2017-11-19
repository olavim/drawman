import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import {spring} from 'react-motion';
import RouteTransition from './RouteTransition';

const MenuContainer = styled.div`
	width: 20em;
`;

const ButtonWrapper = styled.div`
	position: relative;
	width: 100%;
	height: 40px;
`;

const NameInputWrapper = styled.div`
	margin-bottom: 10px;
	position: relative;
	width: 100%;
	height: 40px;
`;

const NameInput = styled.input`
	width: 100%;
	height: 40px;
	padding: 0 10px;
	box-sizing: border-box;
	border-radius: 8px;
	border: none;
	transform: translate3d(${p => p.x}px, 0, 0);
	opacity: ${p => p.opacity};
`;

const Button = styled.div`
	position: absolute;
	width: 100%;
	height: 40px;
	border-radius: 8px;
	transform: translate3d(${p => p.x}px, 0, 0);
	opacity: ${p => p.opacity};
	box-sizing: border-box;
	text-align: center;
	cursor: pointer;
	font-weight: bold;
	display: flex;
	align-items: center;
	justify-content: center;

	transition: background-color 0.3s linear, box-shadow 0.15s linear;

	&:hover {
		box-shadow: 0 0 15px 0 rgba(255, 255, 255, 0.3);
	}
`;

const JoinButton = Button.extend`
	background-color: #659cbd;
	color: #fff;
`;

const CreateButton = Button.extend`
	background-color: #fff;
	color: #808392;
`;

const MenuButton = ({children, onClick}) => <Button onClick={onClick}>{children}</Button>;

MenuButton.propTypes = {
	onClick: PropTypes.func.isRequired,
	children: PropTypes.any.isRequired
};

export default class extends React.Component {
	static propTypes = {
		onJoinRoom: PropTypes.func.isRequired,
		onCreateRoom: PropTypes.func.isRequired,
		roomId: PropTypes.string
	};

	static defaultProps = {
		roomId: null
	};

	state = {name: ''};

	handleNameChange = evt => {
		this.setState({name: evt.target.value});
	};

	handleClickJoinRoom = () => {
		this.props.onJoinRoom(this.state.name);
	};

	handleClickCreateRoom = () => {
		this.props.onCreateRoom();
	};

	getButtonTransitions = () => {
		return {
			atEnter: {opacity: 0, x: -1000},
			atLeave: {opacity: 0, x: 1000},
			atActive: {opacity: spring(1), x: spring(0)}
		};
	};

	getInputTransitions = () => {
		return {
			atEnter: {opacity: 0, x: 1000},
			atLeave: {opacity: 0, x: -1000},
			atActive: {opacity: spring(1), x: spring(0)}
		};
	};

	render() {
		return (
			<MenuContainer>
				<NameInputWrapper>
					<RouteTransition path="/rooms/:roomId" {...this.getInputTransitions()}>
						<NameInput
							type="text"
							placeholder="Enter your name"
							onChange={this.handleNameChange}
							value={this.state.name}
						/>
					</RouteTransition>
				</NameInputWrapper>
				<ButtonWrapper>
					<RouteTransition exact path="/" {...this.getButtonTransitions()}>
						<CreateButton onClick={this.handleClickCreateRoom}>Create room</CreateButton>
					</RouteTransition>
					<RouteTransition path="/rooms/:roomId" {...this.getButtonTransitions()}>
						<JoinButton onClick={this.handleClickJoinRoom}>Join room</JoinButton>
					</RouteTransition>
				</ButtonWrapper>
			</MenuContainer>
		);
	}
}
