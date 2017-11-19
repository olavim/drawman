import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import hourglassIcon from './hourglass.svg';

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

const Countdown = ({value, state}) => {
	if (state === 'drawing') {
		return (
			<ClockContainer>
				<ClockIcon/>
				<ClockTime>{value}</ClockTime>
			</ClockContainer>
		);
	}

	return <div/>;
};

Countdown.propTypes = {
	value: PropTypes.number.isRequired,
	state: PropTypes.string.isRequired
};

export default Countdown;
