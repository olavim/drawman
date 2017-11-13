import './lib/env'; // eslint-disable-line import/no-unassigned-import
import path from 'path';
import fs from 'fs';
import https from 'https';
import express from 'express';
import expressApp from './app';

(async () => {
	const webpackConfig = require('../../build/webpack.config');
	const config = require('../../config');

	if (config.env === 'development') {
		const httpsOptions = {
			key: fs.readFileSync(path.resolve(__dirname, '../../key.pem')),
			cert: fs.readFileSync(path.resolve(__dirname, '../../cert.pem'))
		};
		const app = express();
		const httpsServer = https.createServer(httpsOptions, app);
		expressApp(config, webpackConfig, app, httpsServer);

		httpsServer.listen(8443, () => {
			console.log(`https server running on port 8443`);
		});
	} else {
		const app = expressApp(config, webpackConfig);

		app.listen(config.serverPort, () => {
			console.log(`Server is running in ${config.env} environment`);
		});
	}
})();
