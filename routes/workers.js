const { Worker, validateWorker } = require('../models/worker');
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const _ = require('lodash');
router.post("/workerLogin", async (req, res) => {
    try {
        console.log('workerLogin...');
        const { licenseKey } = req.body
        let worker = await Worker.findOne({ licenseKey }, { "name": 1, "masterID": 1, "isAdmin": 1, "employeeid": 1 });
        if (!worker) return res.status(400).send('Wrong licensekey');

        console.log('Worker login api response', worker);
        const token = worker.generateAuthToken();
        // res.header('x-auth-token', token).send(_.pick(worker, ['_id', 'name', 'masterID', 'isAdmin']));
        res.status(200).header('x-auth-token', token).send(_.pick(worker, ['_id', 'name', 'masterID', 'isAdmin', 'employeeid']))

    } catch (error) {
        console.log('Failed in login', error);
        res.status(400).send(error.message);
    }
})


module.exports = router; 