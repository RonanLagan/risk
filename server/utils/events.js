let listeners = [];

const events = {
    emit: (name, data) => {
        let lForEv = listeners.filter(l => l.name == name);

        lForEv.forEach(listener => {
            listener.func(data);
        })
    },
    listen: (name, func) => {
        listeners.push({name: name, func});
    }
};

module.exports = events;