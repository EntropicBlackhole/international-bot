const fs = require('fs');

const text = fs.readFileSync('./countries.txt', 'utf8')
countries = {};

for (i of text.split('\n')) {
	countries[i.replace('\r', '')] = {
		products: {
			fish: Math.round(Math.random()* 100),
			oil: Math.round(Math.random() * 100),
			crops: Math.round(Math.random() * 100),
			copper: Math.round(Math.random() * 100),
			wood: Math.round(Math.random() * 100),
			coal: Math.round(Math.random() * 100),
			gold: Math.round(Math.random() * 100)
		}
	}
}
fs.writeFileSync('./database/country/country_list.json', JSON.stringify(countries, null, 2))