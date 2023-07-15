const express = require("express");

const crypto = require("crypto");

const router = express.Router();

const events = require("../utils/events");

const genId = require("../utils/genId");

const genGameName = () => {
  let newName = `Game-`;

  for (let i = 0; i < 4; i++) {
    newName += String(Math.floor(Math.random() * 10));
  }

  return newName;
};

let countries = {
  alaska: {
    borders: ["nw-territories", "alberta", "kamchatka"],
    owner: -1,
    armies: 1,
    continent: "na",
  },
  "nw-territories": {
    borders: ["alaska", "aberta", "ontario", "greenland"],
    owner: -1,
    armies: 1,
    continent: "na",
  },
  greenland: {
    borders: ["nw-territories", "ontario", "quebec", "iceland"],
    owner: -1,
    armies: 1,
    continent: "na",
  },
  scandinavia: {
    borders: ["iceland", "gb", "north-eu", "ukraine"],
    owner: -1,
    armies: 1,
    continent: "eu",
  },
  ukraine: {
    borders: [
      "scandinavia",
      "north-eu",
      "south-eu",
      "middle-east",
      "afghanistan",
      "ural",
    ],
    owner: -1,
    armies: 1,
    continent: "eu",
  },
  "north-eu": {
    borders: ["gb", "scandinavia", "west-eu", "south-eu", "ukraine"],
    owner: -1,
    armies: 1,
    continent: "eu",
  },
  "south-eu": {
    borders: [
      "ukraine",
      "north-eu",
      "west-eu",
      "egypt",
      "middle-east",
      "north-af",
    ],
    owner: -1,
    armies: 1,
    continent: "eu",
  },
  "west-eu": {
    borders: ["gb", "north-eu", "south-eu", "north-af"],
    owner: -1,
    armies: 1,
    continent: "eu",
  },
  "north-af": {
    borders: ["west-eu", "brazil", "south-eu", "egypt", "east-af", "congo"],
    owner: -1,
    armies: 1,
    continent: "af",
  },
  "east-af": {
    borders: [
      "middle-east",
      "egypt",
      "north-af",
      "congo",
      "south-af",
      "madagascar",
    ],
    owner: -1,
    armies: 1,
    continent: "af",
  },
  egypt: {
    borders: ["middle-east", "east-af", "north-af", "south-eu"],
    owner: -1,
    armies: 1,
    continent: "af",
  },
  congo: {
    borders: ["east-af", "south-af", "north-af"],
    owner: -1,
    armies: 1,
    continent: "af",
  },
  "south-af": {
    borders: ["congo", "east-af", "madagascar"],
    owner: -1,
    armies: 1,
    continent: "af",
  },
  madagascar: {
    borders: ["south-af", "east-af"],
    owner: -1,
    armies: 1,
    continent: "af",
  },
  "middle-east": {
    borders: [
      "egypt",
      "east-af",
      "south-af",
      "ukraine",
      "afghanistan",
      "india",
    ],
    owner: -1,
    armies: 1,
    continent: "as",
  },
  india: {
    borders: ["middle-east", "afghanistan", "china", "siam"],
    owner: -1,
    armies: 1,
    continent: "as",
  },
  afghanistan: {
    borders: ["ukraine", "ural", "china", "india", "middle-east"],
    owner: -1,
    armies: 1,
    continent: "as",
  },
  ural: {
    borders: ["ukraine", "siberia", "afghanistan", "china"],
    owner: -1,
    armies: 1,
    continent: "as",
  },
  siberia: {
    borders: ["irkutsk", "ural", "china", "yakutsk", "mongolia"],
    owner: -1,
    armies: 1,
    continent: "as",
  },
  yakutsk: {
    borders: ["siberia", "kamchatka", "irkutsk"],
    owner: -1,
    armies: 1,
    continent: "as",
  },
  irkutsk: {
    borders: ["siberia", "yakutsk", "kamchatka", "mongolia"],
    owner: -1,
    armies: 1,
    continent: "as",
  },
  mongolia: {
    borders: ["siberia", "irkutsk", "kamchatka", "china", "japan"],
    owner: -1,
    armies: 1,
    continent: "as",
  },
  kamchatka: {
    borders: ["japan", "mongolia", "irkutsk", "yakutsk", "alaska"],
    owner: -1,
    armies: 1,
    continent: "as",
  },
  japan: {
    borders: ["kamchatka", "mongolia"],
    owner: -1,
    armies: 1,
    continent: "as",
  },
  "west-au": {
    borders: ["indonesia", "new-guinea", "east-au"],
    owner: -1,
    armies: 1,
    continent: "au",
  },
  "east-au": {
    borders: ["west-au", "new-guinea"],
    owner: -1,
    armies: 1,
    continent: "au",
  },
  "new-guinea": {
    borders: ["indonesia", "west-au", "east-au"],
    owner: -1,
    armies: 1,
    continent: "au",
  },
  indonesia: {
    borders: ["siam", "new-guinea", "west-au"],
    owner: -1,
    armies: 1,
    continent: "au",
  },
  china: {
    borders: ["siam", "india", "afghanistan", "ural", "siberia", "mongolia"],
    owner: -1,
    armies: 1,
    continent: "as",
  },
  siam: {
    borders: ["indonesia", "india", "china"],
    owner: -1,
    armies: 1,
    continent: "as",
  },
  gb: {
    borders: ["iceland", "scandinavia", "north-eu", "west-eu"],
    owner: -1,
    armies: 1,
    continent: "eu",
  },
  iceland: {
    borders: ["scandinavia", "gb", "greenland"],
    owner: -1,
    armies: 1,
    continent: "eu",
  },
  "western-us": {
    borders: ["alberta", "ontario", "eastern-us", "central-am"],
    owner: -1,
    armies: 1,
    continent: "na",
  },
  ontario: {
    borders: [
      "alberta",
      "nw-territories",
      "greenland",
      "quebec",
      "western-us",
      "eastern-us",
    ],
    owner: -1,
    armies: 1,
    continent: "na",
  },
  quebec: {
    borders: ["greenland", "ontario", "eastern-us"],
    owner: -1,
    armies: 1,
    continent: "na",
  },
  "eastern-us": {
    borders: ["ontario", "quebec", "western-us", "central-am"],
    owner: -1,
    armies: 1,
    continent: "na",
  },
  "central-am": {
    borders: ["western-us", "eastern-us", "venezuela"],
    owner: -1,
    armies: 1,
    continent: "na",
  },
  alberta: {
    borders: ["alaska", "nw-territories", "ontario", "western-us"],
    owner: -1,
    armies: 1,
    continent: "na",
  },
  venezuela: {
    borders: ["central-am", "peru", "brazil"],
    owner: -1,
    armies: 1,
    continent: "sa",
  },
  brazil: {
    borders: ["north-af", "venezuela", "peru", "argentina"],
    owner: -1,
    armies: 1,
    continent: "sa",
  },
  peru: {
    borders: ["venezuela", "brazil", "argentina"],
    owner: -1,
    armies: 1,
    continent: "sa",
  },
  argentina: {
    borders: ["peru", "brazil"],
    owner: -1,
    armies: 1,
    continent: "sa",
  },
};

let cards = [
  { name: "Alaska", id: "alaska_2", value: "c" },
  { name: "Northwest Territories", id: "northwest_territory", value: "a" },
  { name: "Greenland", id: "greenland_2", value: "h" },
  { name: "Scandinavia", id: "scandinavia_2", value: "c" },
  { name: "Ukraine", id: "ukraine_2", value: "h" },
  { name: "Northern Europe", id: "northern_europe", value: "a" },
  { name: "Southern Europe", id: "southern_europe", value: "c" },
  { name: "Western Europe", id: "western_europe", value: "a" },
  { name: "North africa", id: "north_africa", value: "h" },
  { name: "East africa", id: "east_africa", value: "c" },
  { name: "Egypt", id: "egypt_2", value: "h" },
  { name: "Congo", id: "congo_2", value: "a" },
  { name: "South africa", id: "south_africa", value: "c" },
  { name: "Madagascar", id: "madagascar_2", value: "a" },
  { name: "Middle east", id: "middle_east", value: "h" },
  { name: "India", id: "india_2", value: "c" },
  { name: "Afghanistan", id: "afghanistan_2", value: "h" },
  { name: "Ural", id: "ural_2", value: "a" },
  { name: "Siberia", id: "siberia_2", value: "c" },
  { name: "Yakutsk", id: "yakursk", value: "a" },
  { name: "Irkutsk", id: "irkutsk_2", value: "h" },
  { name: "Mongolia", id: "mongolia_2", value: "c" },
  { name: "Kamchatka", id: "kamchatka_2", value: "h" },
  { name: "Japan", id: "japan_2", value: "a" },
  { name: "Western Australia", id: "western_australia", value: "c" },
  { name: "Eastern australia", id: "eastern_australia", value: "a" },
  { name: "New Guinea", id: "new_guinea", value: "h" },
  { name: "Indonesia", id: "indonesia_2", value: "c" },
  { name: "China", id: "china_2", value: "h" },
  { name: "Siam", id: "siam_2", value: "a" },
  { name: "Great Britain", id: "great_britain", value: "c" },
  { name: "Iceland", id: "iceland_2", value: "a" },
  { name: "Western U/S", id: "western_united_states", value: "h" },
  { name: "Ontario", id: "ontario_2", value: "c" },
  { name: "Quebec", id: "quebec_2", value: "h" },
  { name: "Eastern U.S", id: "eastern_united_states", value: "a" },
  { name: "Central America", id: "central_america", value: "c" },
  { name: "Alberta", id: "alberta_2", value: "a" },
  { name: "Venezuela", id: "venezuela_2", value: "h" },
  { name: "Brazil", id: "brazil_2", value: "c" },
  { name: "Peru", id: "peru_2", value: "h" },
  { name: "Argentina", id: "argentina_2", value: "a" },
];

router.post("/createGame", (req, res) => {
  let { name, password, botCount } = req.body;

  if (name == undefined || name == "") {
    name = genGameName();
  }

  if (password != "" && password != undefined) {
    password = crypto.createHash("sha256").update(password).digest("hex");
  } else {
    password = "";
  }

  let outGame = {
    created: Date.now(),
    name: name,
    password: password,
    botCount,
    started: false,
    players: [],
    id: genId(),
    map: JSON.parse(JSON.stringify(countries)),
    countriesChosen: false,
    turn: {
      player: 0,
      end: 0,
      start: 0,
    },
    armiesPlacedCount: 0,
    cardDeck: JSON.parse(JSON.stringify(cards)),
  };

  events.emit("gameCreated", outGame);

  res.send(outGame);
});

module.exports = router;
