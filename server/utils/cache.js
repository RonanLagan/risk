let cache = {}

let cacheFuncs = {
    set: (key, value) => {
        cache[key] = value;
    },
    get: (key) => {
        return cache[key];
    },
    unset: (key) => {
        delete cache[key];
    }
};

module.exports = cacheFuncs;