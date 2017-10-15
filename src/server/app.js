import fs from 'fs';
import express from 'express';
import _debug from 'debug';
import routes from './routes';
import devMiddleware from './lib/middleware/dev';

const debug = _debug('drawman:server:app');

export default (config, webpackConfig) => {
	const paths = config.utilsPaths;

	debug('Gathering wordlist...');
	const words = fs.readFileSync(paths.base('data/words.txt')).toString().split('\n');
	debug(`Read ${words.length} words into memory`);

	const app = express();
	app.set('view engine', 'ejs');
	app.set('views', paths.dist('client/views'));

	app.use('/', routes(config, words));

	if (config.env === 'development' && config.hot) {
		debug('Setting up hot environment');
		app.set('views', paths.src('client/views'));
		webpackConfig.output.filename = 'bundle.js';
		app.use(devMiddleware(config, webpackConfig));
	}

	app.use(express.static(paths.dist('client')));

	return app;
};
