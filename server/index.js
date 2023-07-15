const http = require("http");

const express = require("express");
const cors = require("cors");

const webSockets = require("./utils/webSockets");

const app = express();

const server = http.createServer(app);

const listeners = require("./utils/listeners");

listeners.listen();

// Import paths

const createGame = require("./routes/createGame");
const getGameList = require("./routes/getGameList");

app.use(cors());
app.use(express.json());

// Use paths

app.use("/api", createGame);
app.use("/api", getGameList);

// app.listen(4000, () => {
//     console.log("SERVER STARTED ON PORT 4000");
// })

webSockets.start(server);

server.listen(4000, () => {
    console.log("STARTED");
})