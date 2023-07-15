const countryToArr = (countries) => {
    let out = [];

    for (let key in countries) {
        let o = {name: key};
        let country = countries[key];

        for (let k in country) {
            o[k] = country[k];
        }

        out.push(o);
    }

    return out;
}

const pickRandomCountry = (countries) => {
    countries = countryToArr(countries);

    let validCountries = countries.filter(c => c.owner < 0);

    let countryIndex = Math.floor(Math.random() * validCountries.length);

    let country = validCountries[countryIndex];

    return country.name;
};

module.exports = pickRandomCountry;