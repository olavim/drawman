import app from './app';

(async () => {
	const webpackConfig = require('../../build/webpack.config');
	const config = require('../../config');
	const server = app(config, webpackConfig);

	server.listen(config.serverPort, () => {
		console.log(`Server is running in ${config.env} environment`);
	});
})();
