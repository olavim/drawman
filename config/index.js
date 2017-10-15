const path = require('path');
const {argv} = require('yargs');
const ip = require('ip');
const debug = require('debug')('drawman:config');

debug('Creating default configuration.');

const localip = ip.address();

const config = {
	env: process.env.NODE_ENV || 'development',
	hot: process.env.HOT === 'true',

	pathBase: path.resolve(__dirname, '..'),
	dirSrc: 'src',
	dirStatic: 'static',
	dirDist: 'dist',
	dirLib: 'lib',

	serverHost: localip,
	serverPort: process.env.PORT || 8079,

	compilerDevtool: 'source-map',
	compilerHashType: 'hash',
	compilerFailOnWarning: false,
	compilerQuiet: false,
	compilerPublicPath: '/',
	compilerStats: {
		chunks: false,
		chunkModules: false,
		colors: true
	}
};

config.logger = {
	name: 'admin-panel-ui',
	defaultLogger: true,
	file: {err: false, out: false},
	std: {err: false, out: true}
};

config.globals = {
	__DEV__: config.env === 'development',
	__PROD__: config.env === 'production',
	__STAG__: config.env === 'staging',
	__TEST__: config.env === 'test',
	__DEBUG__: config.env === 'development' && !argv.no_debug,
	'process.env': {
		JSON_API_URL: JSON.stringify(process.env.JSON_API_URL)
	}
};

const base = (...args) => Reflect.apply(path.resolve, null, [config.pathBase, ...args]);

config.utilsPaths = {
	base,
	src: base.bind(null, config.dirSrc),
	static: base.bind(null, config.dirStatic),
	dist: base.bind(null, config.dirDist),
	lib: base.bind(null, config.dirLib)
};

module.exports = config;
