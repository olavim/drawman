import fs from 'fs-extra';
import _debug from 'debug';
import webpackCompiler from '../build/webpack-compiler';
import config from '../config';

const debug = _debug('drawman:bin:compile');
const paths = config.utilsPaths;

async function compile(conf) {
	try {
		debug('Run compiler');
		const stats = await webpackCompiler(conf);

		if (stats.warnings.length > 0 && config.compilerFailOnWarning) {
			debug('Config set to fail on warning, exiting with status code "1".');
			process.exit(1); // eslint-disable-line unicorn/no-process-exit
		}

		try {
			fs.mkdirSync(paths.dist('server'));
		} catch (err) {}

		debug('Copy static assets to dist folder.');
		fs.copySync(paths.src('client/static'), paths.dist('client'));
		debug('Copy other assets to dist folder.');
		fs.copySync(paths.src('client/assets'), paths.dist('client/assets'));

		try {
			debug('Writing compilation stats to file...');
			fs.writeFileSync(paths.base('webpack.compiler.log'), JSON.stringify(stats, null, 2));
		} catch (err) {
			debug('Could not write compilation stats to file.');
		}
	} catch (err) {
		debug('Compiler encountered an error.', err);
		process.exit(1); // eslint-disable-line unicorn/no-process-exit
	}
}

(async () => {
	debug('Vendor bundle:');
	await compile(require('../build/vendor.webpack.config'));
	debug('App bundle:');
	await compile(require('../build/webpack.config'));
})();
