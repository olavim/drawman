const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const debug = require('debug')('drawman:webpack:config');
const config = require('../config');

const paths = config.utilsPaths;
const {__DEV__, __PROD__} = config.globals;

debug('Create configuration.');
const webpackConfig = {
	// Cache: true,
	name: 'client',
	target: 'web',
	devtool: config.compilerDevtool,
	resolve: {
		modules: [paths.src('client'), paths.base('node_modules')],
		extensions: ['.js', '.jsx', '.json'],
		alias: {
			react: path.resolve('node_modules', 'react')
		}
	},
	module: {}
};

webpackConfig.entry = {
	main: ['babel-polyfill', paths.src('client/index.js')]
};

if (__DEV__ && config.hot) {
	// Add HMR entry
	webpackConfig.entry.main.push(
		`webpack-hot-middleware/client?path=${config.compilerPublicPath}__webpack_hmr`
	);
}

webpackConfig.output = {
	filename: `[name].[${config.compilerHashType}].js`,
	path: paths.dist('client'),
	publicPath: config.compilerPublicPath
};

webpackConfig.plugins = [
	new webpack.DefinePlugin(config.globals),
	new webpack.DllReferencePlugin({
		context: paths.base(),
		manifest: require(paths.dist(`client/vendor-manifest.json`))
	}),
	new HtmlWebpackPlugin({
		title: 'Drawman',
		chunksSortMode: 'dependency',
		// We use express to serve the view correctly; we want webpack only to inject the bundle.
		template: `!!html-loader!${paths.src('client/views/index.ejs')}`,
		hash: false,
		favicon: paths.src('client/static/favicon.ico'),
		filename: 'views/index.ejs',
		inject: 'body',
		minify: {collapseWhitespace: true}
	})
];

if (__DEV__ && config.hot) {
	debug('Enable plugins for live development (HMR, NoErrors).');
	webpackConfig.plugins.push(
		new webpack.HotModuleReplacementPlugin(),
		new webpack.NoErrorsPlugin()
	);
} else if (__PROD__) {
	debug('Enable plugins for production (OccurenceOrder, Dedupe & UglifyJS).');
	webpackConfig.plugins.push(
		new webpack.optimize.OccurrenceOrderPlugin(),
		new webpack.optimize.UglifyJsPlugin({
			compress: {
				unused: true,
				dead_code: true, // eslint-disable-line camelcase
				warnings: false
			}
		})
	);
}

webpackConfig.module.rules = [
	{
		test: /\.jsx?$/,
		exclude: /node_modules/,
		loader: 'babel-loader',
		query: {
			cacheDirectory: true,
			plugins: ['transform-runtime'],
			presets: ['es2015-node6/object-rest', 'es2016', 'es2017', 'stage-1', 'react'],
			env: {production: {presets: ['react-optimize']}}
		}
	}
];

const BASE_CSS_LOADER = {
	loader: 'css-loader',
	options: {sourceMap: true, minimize: false}
};

webpackConfig.module.rules.push({
	test: /\.scss$/,
	use: [
		{loader: 'style-loader'},
		BASE_CSS_LOADER,
		{loader: 'postcss-loader'},
		{
			loader: 'sass-loader',
			options: {sourceMap: true}
		}
	]
});

webpackConfig.module.rules.push({
	test: /\.css$/,
	loaders: [{loader: 'style-loader'}, BASE_CSS_LOADER, {loader: 'postcss-loader'}]
});

webpackConfig.module.rules.push(
	{
		test: /\.svg(\?.*)?$/,
		loaders: [
			{
				loader: 'url-loader',
				options: {
					prefix: 'fonts/',
					name: '[path][name].[ext]',
					limit: 10000,
					mimetype: 'image/svg+xml'
				}
			}
		]
	},
	{
		test: /\.(png|jpg)$/,
		loader: 'url-loader',
		options: {limit: 8192}
	}
);

module.exports = webpackConfig;
