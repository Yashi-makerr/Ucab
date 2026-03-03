const express = require("express");
const { createDriver } = require("../controllers/driverController");

const router = express.Router();

router.post("/create", createDriver);

module.exports = router;