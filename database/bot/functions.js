
class Country {

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
}

exports.Country = Country
exports.Misc = Misc
