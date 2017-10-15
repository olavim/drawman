import expressApp from './app';

(async () => {
	const webpackConfig = require('../../build/webpack.config');
	const config = require('../../config');
	const app = expressApp(config, webpackConfig);

	app.listen(config.serverPort, () => {
		console.log(`Server is running in ${config.env} environment`);
	});
})();
