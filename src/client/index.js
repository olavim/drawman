import React from 'react';
import ReactDOM from 'react-dom';
import ErrorReporter from 'redbox-react';
import App from './containers/App';

require('./styles/style.scss'); // eslint-disable-line import/no-unassigned-import

const container = document.getElementById('content');

const render = () => {
	ReactDOM.render(<App/>, container);
};

if (__DEV__) {
	const resetSite = () => {
		localStorage.clear();
		location.reload();
	};

	window.addEventListener('error', event => {
		document.title = `Runtime Error: ${event.error.message}`;
		const style = {
			redbox: {
				boxSizing: 'border-box',
				fontFamily: 'sans-serif',
				position: 'fixed',
				padding: 10,
				top: '0px',
				left: '0px',
				bottom: '0px',
				right: '0px',
				width: '100%',
				background: 'rgb(204, 0, 0)',
				color: 'white',
				zIndex: 999,
				textAlign: 'left',
				fontSize: '16px',
				lineHeight: 1.2,
				overflow: 'auto'
			}
		};

		ReactDOM.render(
			<div style={{position: 'fixed', bottom: 0, zIndex: 1000}}>
				<ErrorReporter error={event.error} style={style}/>
				<button onClick={resetSite}>Clear Site Data</button>
			</div>,
			container
		);
	});

	if (module.hot) {
		module.hot.accept();
	}
} else {
	window.addEventListener('error', () => {
		localStorage.clear();
	});
}

render();
