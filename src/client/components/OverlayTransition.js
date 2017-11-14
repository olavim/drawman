import React from 'react';
import PropTypes from 'prop-types';
import {TransitionMotion, spring} from 'react-motion';

export default class extends React.Component {
	static propTypes = {
		state: PropTypes.string.isRequired,
		children: PropTypes.any.isRequired
	};

	willLeave() {
		return {
			y: spring(100)
		};
	}

	willEnter() {
		return {
			y: -100
		};
	}

	getStyles() {
		return {y: spring(0)};
	}

	render() {
		return (
			<TransitionMotion
				styles={[
					{
						key: this.props.state,
						style: this.getStyles(),
						data: {child: this.props.children}
					}
				]}
				willEnter={this.willEnter}
				willLeave={this.willLeave}
			>
				{interpolated => {
					return (
						<div>
							{interpolated.map(({key, style, data}) => (
								<div
									key={`${key}-transition`}
									style={{
										position: 'absolute',
										width: '100%',
										height: '100%',
										transform: `translate3d(0, ${style.y}%, 0)`
									}}
								>
									{data.child}
								</div>
							))}
						</div>
					);
				}}
			</TransitionMotion>
		);
	}
}
