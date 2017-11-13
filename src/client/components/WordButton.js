import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

const ButtonContainer = styled.div`
	display: flex;
	flex: 0 0 100%;
	justify-content: center;
	align-items: center;
	box-sizing: border-box;
`;

const Button = styled.span`
	width: 100%;
	height: 50px;
	display: flex;
	justify-content: flex-start;
	align-items: center;
	font-weight: bold;
	color: #777;
	cursor: pointer;
	box-sizing: border-box;
	border-left: 1px solid rgba(0, 0, 0, 0.07);
	border-bottom: 1px solid rgba(0, 0, 0, 0.07);
	padding: 0 2em;
	transition: 0.15s padding ease-out;

	&:hover {
		padding: 0 4em;
	}
`;

export default class extends React.Component {
	static propTypes = {
		word: PropTypes.string.isRequired,
		onClick: PropTypes.func.isRequired
	};

	handleClick = () => {
		this.props.onClick(this.props.word);
	};

	render() {
		return (
			<ButtonContainer>
				<Button onClick={this.handleClick}>{this.props.word}</Button>
			</ButtonContainer>
		);
	}
}
