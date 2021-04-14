
const { Category } = require("../models/categories");
const express = require("express");
const router = express.Router();

router.post("/createCategory", async (req, res) => {
    try {
        console.log("request body parameters-------------", req.body);
      const { name } = req.body.name;
      const { type } = req.body.type;
      const { masterID } = "5f339bb4046ef73eacf99990";
      const category = new Category(req.body);
      await category.save();
      res.status(200).send("New category created successfully");
    } catch (err) {
      console.log(err);
      if (err) return res.status(400).send("missing required parameters");
    }
  });
  router.get("/getCategory", async (req, res) => {
    try {
      const category = await Category.find({ masterID: req.user._id }, { name: 1 });
      res.status(200).send(category);
    } catch (ex) {
      console.log(ex);
      res.status(400).send("something went wrong");
    }
  });
module.exports = router;