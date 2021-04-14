const config = require('config');
const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);
const cors = require('cors');
const mongoose = require('mongoose');
const workers = require('./routes/workers');
const manegers = require('./routes/manegers');
const dashboard_api = require('./routes/dashboard-api');
const categories = require('./routes/categories');
const login = require('./routes/login');
const express = require('express');
const app = express();
const auth = require('./middleware/auth');
const isAuth = require('./middleware/isAuth');
const server = require('http').Server(app);
const io = require('./soket/soket').listen(server);
const violation_api = require('./routes/violation-api');
const violationApis = require('./routes/violation-apis');

const { api } = require('./soket/soket');

if (!config.get('jwtPrivateKey')) {
	console.error('FATAL ERROR: jwtPrivateKey is not defined.');
	process.exit(1);
}
const corsOptions = {
	exposedHeaders: 'x-auth-token',
};
app.use(function (req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
	res.header('Access-Control-Allow-Headers', '*');
	res.header('Access-Control-Allow-Credentials', true);
	next();
});
app.use(cors(corsOptions));
app.use(express.json());

io.use(isAuth);

mongoose
	.connect(
		process.env.MONGODB_URI ||
			// "mongodb://pulseyeuser:A4PXqHLKFvM9hYtr@127.0.0.1:27017/?authSource=pulseyedb&readPreference=primary&ssl=false",
			// "mongodb+srv://USERBff3:jdrgfve5drgfvejhrf7@cluster0.ny2te.mongodb.net/tracker?retryWrites=true&w=majority",
			//"mongodb+srv://localhost:8080@cluster0.wapmq.mongodb.net/PULSEYE_DATABASE?retryWrites=true&w=majority",
			'mongodb+srv://pulseye:pulseye@cluster0.wapmq.mongodb.net/PULSEYE_DATABASE?retryWrites=true&w=majority',
		//'mongodb://localhost:27017/pulseye?readPreference=primary&appname=MongoDB%20Compass&ssl=false',

		{
			useNewUrlParser: true,
			useUnifiedTopology: true,
			useCreateIndex: true,
		}
	) /////
	.then(() => console.log('Connected to MongoDB...'))
	.catch((err) => console.error('Could not connect to MongoDB...'));

// app.use(express.static('client'));

app.use('/api/workers', workers);
app.use('/api/login', login);
app.use('/api/categories', categories);
app.use('/api/manegers', auth, manegers);
app.use('/api/users', auth, dashboard_api);
app.use('/api/violation', auth, violation_api);
app.use('/api/violations', violationApis);
app.use('/api/video', api);

let PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Listening on port ${PORT}...`));
