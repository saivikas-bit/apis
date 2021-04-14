const auth = require("../middleware/auth");
const bcrypt = require("bcrypt");
const _ = require("lodash");
const { Manager } = require("../models/maneger");
const { Worker, validateWorker } = require("../models/worker");
const express = require("express");
const router = express.Router();

router.post("/managerLogin", async (req, res) => {
  try {
    console.log("Login...");
    console.log(req.body);
    // const { error } = validate(req.body);
    // if (error) return res.status(400).send(error.details[0].message);
    let manager = await Manager.findOne({ email: req.body.user.email });
    // console.log(manager);
    if (!manager) return res.status(200).send({status: false, msg:"Wrong email or password"});

    bcrypt.compare(req.body.user.password, manager.password, function (
      error,
      result
    ) {
      if (error) throw error;
      if (result) {
        const token = manager.generateAuthToken();
        res
          .header("x-auth-token", token)
          .send(_.pick(manager, ["_id", "name", "email", "isAdmin"]));
      } else {
        return res.status(200).send({status: false, msg:"Wrong email or password"});
      }
    });
  } catch (error) {
    console.log("Failed in login", error);
    res.status(200).send({status: false, msg:error.message});
  }
});
router.post("/managerChangePassword", async (req, res) => {
  try {
    console.log("Login...");
    // const { error } = validate(req.body);
    // if (error) return res.status(400).send(error.details[0].message);
    let manager = await Manager.findOne({ email: req.body.user.email });
    // console.log(manager);
    if (!manager) return res.status(200).send({status: false, msg: "No user registerd with this email!"});
   await bcrypt.compare(req.body.user.password, manager.password, async function (
      error,
      result
    ) {
      if (error) return res.status(200).send({status: false, msg: "Wrong password"});
      if (result) {
        console.log('AAAAAAAAAAAAAAAAAAAAAAAA', result);
        const salt = await bcrypt.genSalt(10);
        const password = await bcrypt.hash(req.body.user.newpassword, salt);
       const update = await Manager.updateOne(
          { _id: manager._id },
          {$set: {password}},
      )
      if (update) {
        res.status(200).send({status: true});
      } else {
        res.status(200).send({status: false});
      }
        // const token = manager.generateAuthToken();
        // res
        //   .header("x-auth-token", token)
        //   .send(_.pick(manager, ["_id", "name", "email", "isAdmin"]));
      } else {
        return res.status(200).send({status: false, msg: "Wrong password"});
      }
    });
  } catch (error) {
    console.log("Failed in login", error);
    res.status(400).send(error.message);
  }
});
module.exports = router;
