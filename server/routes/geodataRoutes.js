const express = require("express");
const router = express.Router();
const path = require("path");

const GEODATA_DIR = path.join(__dirname, "../geodata");

router.get("/cilacap-risk", (req, res) => {
  res.sendFile(path.join(GEODATA_DIR, "cilacap_risk.geojson"));
});

router.get("/bakauheni-risk", (req, res) => {
  res.sendFile(path.join(GEODATA_DIR, "bakauheni_risk.geojson"));
});

router.get("/cilacap-jalan", (req, res) => {
  res.sendFile(path.join(GEODATA_DIR, "cilacap_jalan.geojson"));
});

router.get("/bakauheni-jalan", (req, res) => {
  res.sendFile(path.join(GEODATA_DIR, "bakauheni_jalan.geojson"));
});

module.exports = router;
