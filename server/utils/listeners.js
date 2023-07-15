const events = require("./events");
const cache = require("./cache");

const listeners = {
    listen: () => {
        events.listen("gameCreated", (gameData) => {
            let existingGameList = cache.get("games");

            if (existingGameList == undefined) {
                existingGameList = [];
            }

            existingGameList = JSON.parse(JSON.stringify(existingGameList));

            for (let i=0; i<6; i++) {
                gameData.players.push({index: i, empty: true, bot: false, cards: []});
            }

            for (let i=0; i<gameData.botCount; i++) {
                gameData.players[i].empty = false;
                gameData.players[i].bot = true;
                gameData.players[i].name = `Bot ${i+1}`;
            }

            existingGameList.push(gameData);

            cache.set("games", existingGameList);

            console.log(cache.get("games"));
        });
    }
};

module.exports = listeners;