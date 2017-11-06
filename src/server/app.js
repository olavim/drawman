import fs from 'fs';
import express from 'express';
import expressWs from 'express-ws';
import _debug from 'debug';
import routes from './routes';

const debug = _debug('drawman:server:app');

export default (config, webpackConfig, app, server) => {
	const paths = config.utilsPaths;

	debug('Gathering wordlist...');
	const words = fs.readFileSync(paths.base('data/words.txt')).toString().split('\n');
	debug(`Read ${words.length} words into memory`);

	app = app || express();
	expressWs(app, server);
	app.set('view engine', 'ejs');
	app.set('views', paths.dist('client/views'));

	app.use((req, res, next) => {
		if (req.protocol !== 'https') {
			return res.status(403).send({message: 'SSL required'});
		}
		next();
	});

	app.use((req, res, next) => {
		// Heroku request type.
		const reqType = req.headers['x-forwarded-proto'];
		if (reqType && reqType !== 'https') {
			return res.redirect('https://' + req.headers.host + req.url);
		} else if (reqType === 'https' || req.protocol === 'https') {
			return next();
		}

		// If deployed elsewhere.
		res.status(403).send({message: 'SSL required', reqType});
	});

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
