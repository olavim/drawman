import React from 'react';
import PropTypes from 'prop-types';

const style = {
	root: {
		display: 'flex',
		flex: '0 0 32%',
		height: '180px',
		justifyContent: 'center',
		alignItems: 'center'
	},
	word: {
		width: '50%',
		height: '50%',
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
		// BackgroundColor: 'rgba(50, 80, 150, 1)',
		fontWeight: 'bold',
		color: '#ddd',
		border: '1px solid #fff',
		borderRadius: '2px',
		cursor: 'pointer'
	},
	wordHover: {
		backgroundColor: 'rgba(255, 255, 255, 0.1)'
	}
};

export default class extends React.Component {
	state = {hover: false};

	static propTypes = {
		word: PropTypes.string.isRequired,
		onClick: PropTypes.func.isRequired
	};

	handleClick = () => {
		this.props.onClick(this.props.word);
	};

	handleHover = () => {
		this.setState({hover: true});
	};

	handleBlur = () => {
		this.setState({hover: false});
	};

	render() {
		return (
			<div style={style.root}>
				<span
					onClick={this.handleClick}
					onMouseOver={this.handleHover}
					onMouseOut={this.handleBlur}
					style={this.state.hover ? Object.assign({}, style.word, style.wordHover) : style.word}
				>
					{this.props.word}
				</span>
			</div>
		);
	}
}
