import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';

/**
 * A combined middleware for webpackDevMiddleware and webpackHotMiddleware.
 */
export default (config, webpackConfig) => {
	const compiler = webpack(webpackConfig);
	const devMiddleware = webpackDevMiddleware(compiler, {
		contentBase: config.utilsPaths.dist('client'),
		hot: true,
		quiet: config.compilerQuiet,
		noInfo: config.compilerQuiet,
		lazy: false,
		stats: config.compilerStats,
		proxy: {
			'/': `https://localhost:${config.serverPort}`
		}
	});
	const hotMiddleware = webpackHotMiddleware(compiler);

	return (req, res, next) => {
		devMiddleware(req, res, err => {
			if (err) {
				return err;
			}

			hotMiddleware(req, res, next);
		});
	};
};
