import React from 'react';
import PropTypes from 'prop-types';
import {TransitionMotion, spring} from 'react-motion';
import {withRouter, matchPath} from 'react-router-dom';

function ensureSpring(styles) {
	return Object.keys(styles).reduce((acc, key) => {
		const value = styles[key];
		acc[key] = typeof value === 'number' ? spring(value) : value;
		return acc;
	}, {});
}

class RouteTransition extends React.Component {
	static propTypes = {
		atEnter: PropTypes.object.isRequired,
		atLeave: PropTypes.object.isRequired,
		atActive: PropTypes.object.isRequired,
		children: PropTypes.any.isRequired,
		mapStyles: PropTypes.func,
		path: PropTypes.string.isRequired,
		exact: PropTypes.bool,
		location: PropTypes.object.isRequired
	};

	static defaultProps = {
		exact: false,
		mapStyles: ({style}) => style
	};

	mounted = false;

	componentDidMount() {
		this.mounted = true;
	}

	isEnabled = () => {
		const match = matchPath(this.props.location.pathname, {
			path: this.props.path,
			exact: this.props.exact
		});

		return match && match.isExact;
	};

	getStyles() {
		if (this.isEnabled()) {
			return [
				{
					key: 'switch',
					style: ensureSpring(this.props.atActive)
				}
			];
		}

		return [];
	}

	getDefaultStyles() {
		if (this.mounted) {
			return [
				{
					key: 'switch',
					style: this.props.atEnter
				}
			];
		}

		return null;
	}

	willEnter = () => {
		return this.props.atEnter;
	};

	willLeave = () => {
		return ensureSpring(this.props.atLeave);
	};

	getChildren = styles => {
		if (!styles || !styles[0]) {
			return null;
		}

		const {children, mapStyles} = this.props;

		if (typeof children !== 'function') {
			return React.cloneElement(children, mapStyles(styles[0]));
		}

		return children(styles[0]);
	};

	render() {
		return (
			<TransitionMotion
				defaultStyles={this.getDefaultStyles()}
				styles={this.getStyles()}
				willEnter={this.willEnter}
				willLeave={this.willLeave}
			>
				{styles => this.getChildren(styles)}
			</TransitionMotion>
		);
	}
}

export default withRouter(RouteTransition);
