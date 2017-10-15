import express from 'express';

const titlePrefix = {
	development: 'Dev | ',
	staging: 'Stag | ',
	testing: 'Test | ',
	production: ''
};

export default (config, words) => {
	const router = new express.Router();

	router.get('/', (req, res) => {
		res.render('index', {
			title: titlePrefix[config.env] + 'Drawman',
			hot: config.env === 'development' && config.hot
		});
	});

	return router;
};
