const express = require("express");
const router = express.Router();
const { getAllRestakers } = require("../controllers/restakerController");

router.get("/", getAllRestakers);

module.exports = router;
