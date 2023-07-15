const express = require("express");

const router = express.Router();

const events = require("../utils/events");

const cache = require("../utils/cache");

router.get("/getGameList", (req, res) => {
    let existingGameList = cache.get("games");

    if (existingGameList == null) {
        existingGameList = [];
    }

    let glList = existingGameList.filter(g => g.started == false);

    res.json(glList);
});

module.exports = router;