import dotenv from 'dotenv';
import {default as config} from '../../../config';

if (config.env === 'development') {
	dotenv.config();
}
