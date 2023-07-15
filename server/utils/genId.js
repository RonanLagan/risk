const crypto = require("crypto");

const genId = () => {
    let randBytes = crypto.randomBytes(256);
    let out = crypto.createHash("sha256").update(randBytes).digest("hex");
    return out;
}

module.exports = genId;