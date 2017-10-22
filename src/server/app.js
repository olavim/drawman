import fs from 'fs';
import express from 'express';
import expressWs from 'express-ws';
import _debug from 'debug';
import routes from './routes';

const debug = _debug('drawman:server:app');

export default (config, webpackConfig) => {
	const paths = config.utilsPaths;

	debug('Gathering wordlist...');
	const words = fs.readFileSync(paths.base('data/words.txt')).toString().split('\n');
	debug(`Read ${words.length} words into memory`);

	const app = expressWs(express()).app;
	app.set('view engine', 'ejs');
	app.set('views', paths.dist('client/views'));

	app.use('/', routes(config, words));

	if (config.env === 'development' && config.hot) {
		debug('Setting up hot environment');
		app.set('views', paths.src('client/views'));
		webpackConfig.output.filename = 'bundle.js';
		const devMidware = require('./lib/middleware/dev').default;
		app.use(devMidware(config, webpackConfig));
	}

	app.use(express.static(paths.dist('client')));

	return app;
};
