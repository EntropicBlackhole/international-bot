const fs = require('fs')

class Alliance {
	create({ name, leader, rules = "" }) {
		let allianceObject = {
			// ID: Math.floor((Math.random() * 10000000) + 9000000).toString(36),
			name: name,
			leader: leader,
			rules: rules,
			members: [leader],
			bank: 0,
			settings: {
				withdraw_per_interval: 500,
				interval_of_withdraw: 1000 * 60 * 60 * 1
			},
			lastWithdraw: {}
		}
		return allianceObject
	}
	addMember({ allianceObject, member }) {
		allianceObject.members.push(member);
		return allianceObject
	}
	depositBank({ allianceObject, amount }) {
		if (Math.sign(amount) == -1) return -2
		allianceObject.bank += amount;
		return allianceObject
	}
	withdrawBank({ allianceObject, amount, user }) {
		if (Math.sign(amount) == -1) return -2
		if (amount > allianceObject.settings.withdraw_per_interval) return -1
		if (amount > allianceObject.bank) return 0
		if (allianceObject.lastWithdraw[user] + allianceObject.settings.interval_of_withdraw > Date.now()) return 1
		allianceObject.lastWithdraw[user] = Date.now()
		allianceObject.bank -= amount;
		return allianceObject
	}
	changeRules({ allianceObject, newRules, user }) {
		if (user != allianceObject.leader) return 0
		allianceObject.rules = newRules.replace('\\n', '\n');
		return allianceObject
	}
	changeSettings({ allianceObject, setting, newValue, user }) {
		if (Math.sign(newValue) == -1) return -2
		if (setting != 'withdraw_per_interval' && setting != 'interval_of_withdraw') return -1
		if (user != allianceObject.leader) return 0
		allianceObject.settings[setting] = newValue
		return allianceObject
	}
	removeMember({ allianceObject, member }) {
		allianceObject.members.splice(allianceObject.members.indexOf(member), 1)
		return allianceObject
	}
}
class Misc {
	async searchQuery(list, query) {
		if (query == '') return []
		query = query.replace('"', '\\"')
		const filteredList = [];
		for (let i of list) {
			let out = "";
			for (let j of query.split(' '))
				out += `"${i.toLowerCase()}".includes("${j.toLowerCase()}") && `
			// console.log(`if (${out.substring(0, out.length - 4)}) filteredList.push("${i}")`)
			await eval(`if (${out.substring(0, out.length - 4)}) filteredList.push("${i}")`)
		}
		return filteredList
	}
	async produceInterval() {
		setInterval(() => {
			const countries = JSON.parse(fs.readFileSync('./database/country/country_list.json'))
			for (let country in countries) {
				if (Date.now() < countries[country].nextProduce) continue;
				if (!countries[country].isTaken) continue;
				countries[country].nextProduce = Date.now() + 1000 * 60 * 60 * 2
				for (let product in countries[country].products) countries[country].produced[product] += countries[country].products[product]
			}
			fs.writeFileSync('./database/country/country_list.json', JSON.stringify(countries, null, 2))
		}, 10000)
	}
	subStrBetweenChar(string, start, end) {
		return string.split(start)[1].split(end)[0]
	}
	randomColor() {
		return '#' + Math.floor(Math.random() * 16777215).toString(16);
	}
	shortenText(text, delimiter, max) {
		if (text.length <= max) return text;
		else {
			newText = text.toString().split(delimiter.toString())
			newText.pop();
			return shortenText(newText.join(delimiter), delimiter, max);
		}
	}
	capitalize(string) {
		return string.replace('_', ' ').toLowerCase().split(" ").map(word => word[0].toUpperCase() + word.slice(1)).join(" ")
	}
	msToTime(ms) {
		let seconds = (ms / 1000).toFixed(2);
		let minutes = (ms / (1000 * 60)).toFixed(2);
		let hours = (ms / (1000 * 60 * 60)).toFixed(2);
		let days = (ms / (1000 * 60 * 60 * 24)).toFixed(2);
		if (seconds < 60) return seconds + " second" + (seconds != 1 ? 's' : '')
		else if (minutes < 60) return minutes + " minute" + (minutes != 1 ? 's' : '')
		else if (hours < 24) return hours + " hour" + (hours != 1 ? 's' : '')
		else return days + " day" + (days != 1 ? 's' : '')
	}
	Pad(s, w) {
		s = s.toFixed(0);
		while (s.length < w) {
			s = '0' + s;
		}
		return s;
	}
	formatDate(t) {
		const date = t.date;
		var year = this.Pad(date.getUTCFullYear(), 4);
		var month = this.Pad(1 + date.getUTCMonth(), 2);
		var day = this.Pad(date.getUTCDate(), 2);
		var hour = this.Pad(date.getUTCHours(), 2);
		var minute = this.Pad(date.getUTCMinutes(), 2);
		var svalue = date.getUTCSeconds() + (date.getUTCMilliseconds() / 1000);
		var second = this.Pad(Math.round(svalue), 2);
		return `${year}-${month}-${day} ${hour}:${minute}:${second} UTC`;
	}
	parseDate(text) {
		const d = new Date(text);
		if (!Number.isFinite(d.getTime())) {
			console.error(`ERROR: Not a valid date: "${text}"`);
			return null
		}
		return d;
	}
	sortObject(obj) {
		for (i in obj) if (Number.isInteger(i)) return obj; //Cannot sort if this has numbers
		var newObj = {};
		var array = Object.keys(obj).map(function (key) {
			return [key, obj[key]];
		}).sort(function (a, b) {
			return a[1] - b[1];
		}).map(function (item) {
			return item[0];
		}).reverse();
		for (i of array)
			newObj[i] = obj[i]
		return newObj
	}
}

exports.Alliance = Alliance
exports.Misc = Misc
