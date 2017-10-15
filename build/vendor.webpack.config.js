const webpack = require('webpack');
const debug = require('debug')('drawman:webpack:config');
const config = require('../config');

const paths = config.utilsPaths;

debug('Create configuration.');
module.exports = {
	entry: {
		vendor: ['babel-polyfill', 'lodash']
	},
	resolve: {
		modules: [paths.base('node_modules')],
		extensions: ['.js', '.jsx', '.json']
	},
	output: {
		filename: '[name].bundle.js',
		path: paths.dist('client'),
		library: '[name]_lib'
	},
	plugins: [
		new webpack.DllPlugin({
			path: paths.dist('client/[name]-manifest.json'),
			name: '[name]_lib'
		})
	]
};
