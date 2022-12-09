const fs = require('fs');
/* 
let countries = JSON.parse(fs.readFileSync('./database/country/continent_multipliers.json'))
for (i in countries) {
	for (j in countries[i]) {
		let randomMultiplier = parseFloat((Math.random() * 5.00).toFixed(2))
		countries[i][j] = randomMultiplier
	}
}

fs.writeFileSync('./database/country/continent_multipliers.json', JSON.stringify(countries, null, 2));
*/ 
// /* 
const text = fs.readFileSync('./countries.txt', 'utf8')
countries = {};

for (i of text.split('\n')) {
	let country = i.split('|')[0];
	let continent = i.split('|')[1];
	let code = i.split('|')[2];
	countries[country.replace('\r', '')] = {
		owner: "",
		isTaken: false,
		code: code,
		continent: continent,
		alliances: [],
		products: {
			fish: Math.round(Math.random()* 100),
			oil: Math.round(Math.random() * 100),
			crops: Math.round(Math.random() * 100),
			copper: Math.round(Math.random() * 100),
			wood: Math.round(Math.random() * 100),
			coal: Math.round(Math.random() * 100),
			gold: Math.round(Math.random() * 100),
			meat: Math.round(Math.random() * 100),
			sugar: Math.round(Math.random() * 100),
			metal: Math.round(Math.random() * 100)
		},
		produced: {
			fish: 50,
			oil: 50,
			crops: 50,
			copper: 50,
			wood: 50,
			coal: 50,
			gold: 50,
			meat: 50,
			sugar: 50,
			metal: 50
		},
		items: {},
		wars: [],
		nextProduce: Date.now() + 1000*60*60*2,
		health: 1000
	}
}
fs.writeFileSync('./database/country/country_list.json', JSON.stringify(countries, null, 2))
//TODO: Add bank into country object as money