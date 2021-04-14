const socketio = require('socket.io');
const { Worker } = require('../models/worker');
const { Activity } = require('../models/activities');
const { uploadScreenshots } = require('../imageUpload/uploadToS3');
var moment = require('moment');

const express = require('express');
const router = express.Router();

Date.prototype.yyyymmdd = function () {
	var mm = this.getMonth() + 1; // getMonth() is zero-based
	var dd = this.getDate();

	return [
		this.getFullYear(),
		'-',
		(mm > 9 ? '' : '0') + mm,
		'-',
		(dd > 9 ? '' : '0') + dd,
	].join('');
};

// function msToTime(s) {
// 	function pad(n, z) {
// 		z = z || 2;
// 		return ('00' + n).slice(-z);
// 	}
// 	var ms = s % 1000;
// 	s = (s - ms) / 1000;
// 	var secs = s % 60;
// 	s = (s - secs) / 60;
// 	var mins = s % 60;
// 	var hrs = (s - mins) / 60;

// 	return pad(hrs) + ':' + pad(mins) + ':' + pad(secs);
// }
module.exports.listen = (app) => {
	io = socketio.listen(app);

	// users = io.of('/users')
	io.on('connection', (socket) => {
		///users.on("connection")
		socket.on('subscribe', (data) => {
			const { _id, isAdmin } = socket.decoded;
			// console.log("masterID", socket.decoded.masterID);
			if (socket.decoded.masterID) {
				socket.join(socket.decoded.masterID); //joining meneger`s room
			}
			socket.join(socket.decoded._id);
			console.log('subscribe', socket.decoded);
			if (!isAdmin) {
				Worker.updateOne(
					{ _id }, // Filter
					{ $set: { activeStatus: 'online', lastLoginDate: new Date() } }, // Update
					{ upsert: true } // add document with req.body._id if not exists
				)
					.then((obj) => {})
					.catch((err) => {
						console.log('Error: ' + err);
					});
			}
			console.log('subscribe', _id);
		});

		socket.on('sendd', async function (data) {
			const { _id, masterID, name } = socket.decoded;
			socket.broadcast.to(masterID).emit('image', {
				image: true,
				buffer: data.buf.toString('base64'),
				info: data.info,
				workerID: _id,
				name,
				system_name: data.system_name,
				time: moment().format('YYYY-MM-DD HH:mm:ss'),
			});
		});
		socket.on('uploadImage', async (buf) => {
			const { _id, masterID } = socket.decoded;
			await uploadScreenshots(buf, masterID, _id);
		});
		socket.on('alert', function (data) {
			socket.broadcast
				.to(data.workerID)
				.emit('message', { message: data.message });
		});

		router.post('/turnoncamera', (req, res) => {
			if (req.body.activeStatus) {
				socket.broadcast.emit('startcamera', {
					licenseKey: req.body.licenseKey,
				});
			}
			res.send(req.activeStatus);
		});

		router.post('/turnofcamera', (req, res) => {
			console.log(req.body);
			if (req.body.activeStatus) {
				socket.broadcast.emit('stopcamera', {
					licenseKey: req.body.licenseKey,
				});
			}
			res.send(req.activeStatus);
		});

		socket.on('alertAll', function (message) {
			const { _id } = socket.decoded;
			socket.broadcast.to(_id).emit('message', { message });
		});

		socket.on('takebreak', async (data) => {
			console.log('worker break');
			const today = new Date(new Date().yyyymmdd()).getTime();
			const { _id } = socket.decoded;
			const time = `activites.${today}`; // activites.day.time
			const name = data;
			const when = Date.now();
			await Worker.updateOne(
				{ _id: _id },
				{ $push: { [time]: { [when]: name } } },
				{ upsert: true }
			);
		});

		socket.on('activites', async (obj) => {
			const today = new Date(new Date().yyyymmdd()).getTime();
			const data = obj.body;
			const body = {
				name: data.name,
				app_name: data.app_name,
				system_name: data.system_name,
				system_id: data.system_id,
				ram_info: data.ram_info,
				isVaiolated: data.isVaiolated,
				workerid: data.employeeid,
				entrydate: today,
				activitydate: moment().utc(),
				entrytime: Date.now(),
				duration: 0,
			};
			// console.log('Socket activities--------------', body);

			const lastActivity = await Activity.find({
				workerid: body.workerid,
				entrydate: body.entrydate,
			})
				.sort({ entrytime: -1 })
				.limit(1);
			if (lastActivity.length > 0) {
				await Activity.updateOne(
					{ _id: lastActivity[0]._id },
					{ $set: { duration: body.entrytime - lastActivity[0].entrytime } }
				);
			}
			const activities = new Activity(body);
			await activities.save();
		});

		socket.on('video', (data) => {
			console.log('coming from video');
		});

		socket.on('disconnect', async () => {
			if (socket.decoded.masterID) {
				const { _id, masterID, isAdmin } = socket.decoded;
				const today = new Date(new Date().yyyymmdd()).getTime();

				const time = `activites.${today}`;
				const name = 'disconnected';
				const when = Date.now();
				const body = {
					activeStatus: 'offline',
				};

				if (!isAdmin) {
					await Worker.updateOne({ _id }, { $set: body });
				}
				console.log('worker disconected', socket.decoded);
			}
		});
	});

	return io;
};

module.exports.api = router;
