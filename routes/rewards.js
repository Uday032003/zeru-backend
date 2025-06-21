const express = require("express");
const router = express.Router();
const { getAllRewards } = require("../controllers/rewardController");

router.get("/", getAllRewards);

module.exports = router;
