const alliance = require("../commands/alliance");

class Alliance {
	create({ name, leader, rules = "" }) {
		let allianceObject = {
			// ID: Math.floor((Math.random() * 10000000) + 9000000).toString(36),
			name: name,
			leader: leader,
			rules: rules,
			members: [],
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
		allianceObject.bank += amount;
		return allianceObject
	}
	withdrawBank({ allianceObject, amount, user }) {
		if (amount > allianceObject.settings.withdraw_per_interval) return -1
		if (allianceObject.lastWithdraw[user] + allianceObject.settings.interval_of_withdraw > Date.now()) return 0
		allianceObject.lastWithdraw[user] = Date.now()
		allianceObject.bank -= amount;
		return allianceObject
	}
	changeRules({ allianceObject, newRules, user }) {
		if (user != allianceObject.leader) return 0
		allianceObject.rules = newRules;
		return allianceObject
	}
	changeSettings({ allianceObject, setting, newValue, user }) {
		if (setting != 'withdraw_per_interval' || setting != 'interval_of_withdraw') return -1
		if (user != allianceObject.leader) return 0
		allianceObject.settings[setting] = newValue
		return allianceObject
	}
	removeMember(allianceObject, member) {
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
			for (let j of query.split(''))
				out += `"${i.toLowerCase()}".includes("${j.toLowerCase()}") && `
			// console.log(`if (${out.substring(0, out.length - 4)}) filteredList.push("${i}")`)
			await eval(`if (${out.substring(0, out.length - 4)}) filteredList.push("${i}")`)
		}
		return filteredList
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
}

exports.Alliance = Alliance
exports.Misc = Misc
