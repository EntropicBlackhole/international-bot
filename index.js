const fs = require('fs');
const { Client, Intents, MessageEmbed } = require("discord.js");
const { token, globalPrefix } = require("./config.json");
const talkedRecently = new Set();
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_PRESENCES, Intents.FLAGS.GUILD_MEMBERS] });

const express = require('express')
const server = express()
server.all("/", (req, res) => {
	res.send("Bot is running!")
})

keepAlive()
client.login(token)

client.on("ready", function (e) {
	console.log(`Logged in as ${client.user.tag}!`)
})

const iconURL = "https://cdn.discordapp.com/attachments/950846461573214279/965689742475821086/unknown.png?size=4096"
const botPFP = "https://i.imgur.com/9tf4GQS.png"
const ruleBook = "***0.** This means that, due to us being unable to list every single rule violation possible, moderators have the right to punish a user if they think that they are breaking a non-listed rule. (If you think a member of staff is abusing this power report them in report people channel)\n**1.** English should be our main language spoken in the server\n**2.** Any form of discrimination is completely unacceptable. Homophobic, racist and sexist comments result in an instant ban (unless it is in RP, read RP rule #8)\n**3.** No piracy of any kind\n**4.** Keep your username, profile picture SFW (Safe for Work). Any kind of NSFW content in channels or PFP will be deleted and you will receive a punishment\n**5.** You can only self promote if you are active and have a country. A member of staff will determine this\n**6.** Any malicious activity/intentional harming will result in a ban.\n**7.** Please refrain from arguing with mods and above\n**8.** Don't try to find loopholes in rules, that's what rule #0 is for, you'll still be punished\n**9.** Breaking a rule even as a \"joke\" is not tolerated\n**10.** Avoid discussions on sensitive topics, especially religion or IRL politics, depression, self harm and similar can be vented in #vent\n**11.** Do not get mad at pings, if you do, you can adjust the notifications for the server or un-react from the reaction roles. Avoid random pinging\n**12.** Do not beg for roles, services, promotions, money, etc\n**13.** Use channels as they are meant to be used\n**14.** No DM advertising\n**15.** No intentionally spamming mod logs\n**16.** Don't harshly insult people\n**17.** You will get a permanent ban for copying our server, this is not tolerated whatsoever\n**18.** Avoid making loud noises in the VC channels, please\n**19.** If you find a channel you probably shouldn't be able to talk in, please report it, we'll highly thank this\n**20.** Have fun!*\n\n__Punishment system:__\n-First Warning\n-Second Warning\n-Third Warning/1 hour timeout\n-Fourth Warning/Kick\n-Fifth Warning/Ban"
const responselist = ["Yeah sure why not?", "Uh okay but im starting to doubt it", "No of course not what the heck?", "No", "i mean i guess", "Press X to doubt", "Maybe?", "honestly perhaps but don't ask me", "yes i completely agree now shut up", "NO NOT FOR A SINGLE SECOND"]

client.on("messageCreate", message => {
	if (message.author.bot) return;

	if (message.content.toLowerCase().includes("ban")) return message.channel.send("omg ban")
	if (message.content.toLowerCase().includes("gay")) return message.channel.send("oh no homos")
	if (message.content == "_ _") return message.channel.send("_ _")
	if (message.content.toLowerCase().includes("sus")) return message.channel.send('sus')
	if (message.content.toLowerCase().includes("sex") || message.content.includes('seks')) return message.channel.send('sus ngl') //

	if (!message.content.startsWith(globalPrefix)) return;

	const args = message.content.slice(globalPrefix.length).trim().split(/ +/);
	const command = args.shift().toLowerCase();

	if (command === "create") {
		if (!args.length) return message.channel.send("Please provide a name followed by an ideology for your country")
		if (!args[1]) return message.channel.send("Please provide an ideology for your country")
		if (args[0].length > 20) return message.channel.send("Please provide a name less than 20 characters")
		var ideology = args[args.length - 1]
		var name = args.slice(0, -1).join(" ")

		if (!(Object.keys(JSON.parse(fs.readFileSync("./database/country/ideology_settings.json", "utf8"))).includes(ideology.toLowerCase()))) {
			var description = makeIdeologyEmbed()
			message.channel.send("Please provide a valid ideology from the list below")
			const ideologyEmbed = new MessageEmbed()
				.setTitle("Ideology")
				.setDescription(description)
				.setColor(randomColor())
				.setTimestamp()
				.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: botPFP });
			logToFile(message.author.id, command, `${name}|${ideology}`, "Invalid Ideology", "./database/bot/log.json")
			return message.channel.send({ embeds: [ideologyEmbed] })
		}
		else if (Object.keys(JSON.parse(fs.readFileSync("./database/country/country_list.json", "utf8"))).includes(message.author.id)) {
			message.channel.send("You already have a country")
			country = JSON.parse(fs.readFileSync("./database/country/country_list.json", "utf8"))[message.author.id]
			var description = makeCountryEmbed(country)
			const countryEmbed = new MessageEmbed()
				.setTitle("Country")
				.setDescription(description)
				.setColor(randomColor())
				.setTimestamp()
				.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: botPFP });
			logToFile(message.author.id, command, `${name}|${ideology}`, "Already has a country", "./database/bot/log.json")
			return message.channel.send({ embeds: [countryEmbed] })
		}
		else {
			var country = {
				name: name,
				ideology: ideology.toLowerCase(),
				money: 0,
				items: {}
			}
			countryList = JSON.parse(fs.readFileSync("./database/country/country_list.json", "utf8"))
			countryList[message.author.id] = country
			fs.writeFileSync("./database/country/country_list.json", JSON.stringify(countryList, null, 2))
			description = makeNewCountryEmbed(country, message.author.id)
			const countryEmbed = new MessageEmbed()
				.setTitle(`Your new country has been created!!`)
				.setDescription(description)
				.setColor(randomColor())
				.setTimestamp()
				.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: botPFP });
			logToFile(message.author.id, command, `${name}|${ideology}`, "Created country", "./database/bot/log.json")
			return message.channel.send({ embeds: [countryEmbed] })

		}
	}
	else if (command === "delete") {
		if (!Object.keys(JSON.parse(fs.readFileSync("./database/country/country_list.json", "utf8"))).includes(message.author.id)) return message.channel.send("You don't have a country")
		countryList = JSON.parse(fs.readFileSync("./database/country/country_list.json", "utf8"))
		name = countryList[message.author.id].name
		message.channel.send("Are you sure you want to delete your country? This cannot be undone. (yes/no/y/n)")
		var filter = m => (m.author.id === message.author.id && ((m.content.toLowerCase() === "yes") || (m.content.toLowerCase() === "no") || (m.content.toLowerCase() === "y") || (m.content.toLowerCase() === "n")));
		const collecResponse = message.channel.createMessageCollector({ filter, max: 1, time: 30000 });
		collecResponse.on("collect", m => {
			if (m.content.toLowerCase() === 'yes' || m.content.toLowerCase() === 'y') {
				delete countryList[message.author.id]
				fs.writeFileSync("./database/country/country_list.json", JSON.stringify(countryList, null, 2))
				const countryEmbed = new MessageEmbed()
					.setTitle('Country is no more')
					.setDescription(`Your country: "${name}" has been deleted`)
					.setColor(randomColor())
					.setTimestamp()
					.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: botPFP });
				logToFile(message.author.id, command, m.content, `Deleted "${name}"`, "./database/bot/log.json")
				return message.channel.send({ embeds: [countryEmbed] })
			}
			else if (m.content.toLowerCase() === 'no' || m.content.toLowerCase() === 'n') {
				logToFile(message.author.id, command, m.content, `"${name}" not deleted`, "./database/bot/log.json")
				return message.channel.send("Ok then")
			}
		})
	}
	else if (command === "shop") {
		if (!Object.keys(JSON.parse(fs.readFileSync("./database/country/country_list.json", "utf8"))).includes(message.author.id)) return message.channel.send("You don't have a country")
		fs.readFileSync("./database/country/country_list.json", "utf8")

		description = makeShopEmbed()
		const shopEmbed = new MessageEmbed()
			.setTitle(`Shop (${globalPrefix}buy <id>)`)
			.setDescription(description)
			.setColor(randomColor())
			.setTimestamp()
			.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: botPFP });
		logToFile(message.author.id, command, "", "Shop Embed", "./database/bot/log.json")
		return message.channel.send({ embeds: [shopEmbed] })
	}
	else if (command === "buy") {
		if (!Object.keys(JSON.parse(fs.readFileSync("./database/country/country_list.json", "utf8"))).includes(message.author.id)) return message.channel.send("You don't have a country")
		if (!args[0]) return message.channel.send("Please provide an item id")
		if (isNaN(args[0])) return message.channel.send("Please provide a valid item id")
		if (args[0] > Object.keys(JSON.parse(fs.readFileSync("./database/economy/shop_items.json", "utf8"))).length) return message.channel.send("Please provide a valid item id")
		if (args[0] < 1) return message.channel.send("Please provide a valid item id")
		if (!args[1]) args[1] = 1
		if (isNaN(args[1])) return message.channel.send("Please provide a valid amount")
		if (args[1] < 1) return message.channel.send("Please provide a valid amount")
		if (args[1] > 100) return message.channel.send("Please provide a valid amount")

		itemList = JSON.parse(fs.readFileSync("./database/economy/shop_items.json", "utf8"))
		var id = args[0]
		var amount = args[1]
		var item = findShopID(id)
		var price = item.cost * amount
		countryList = JSON.parse(fs.readFileSync("./database/country/country_list.json", "utf8"))
		if (JSON.parse(fs.readFileSync("./database/country/country_list.json", "utf8"))[message.author.id].money < applyDiscount(price, countryList[message.author.id].ideology)) return message.channel.send("You don't have enough money")
		countryList[message.author.id].money -= applyDiscount(price, countryList[message.author.id].ideology)
		if (countryList[message.author.id].items[id] === undefined) countryList[message.author.id].items[id] = 0
		countryList[message.author.id].items[id] += parseInt(amount)
		fs.writeFileSync("./database/country/country_list.json", JSON.stringify(countryList, null, 2))
		const purchaseEmbed = new MessageEmbed()
			.setTitle('Item purchased')
			.setDescription(`You have purchased ${amount} \`${item.name}\` item` + (amount > 1 ? "s" : ""))
			.setColor(randomColor())
			.setTimestamp()
			.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: botPFP });
		logToFile(message.author.id, command, args.join("|"), item.name + " for " + applyDiscount(price, countryList[message.author.id].ideology).toString(), "./database/bot/log.json")
		return message.channel.send({ embeds: [purchaseEmbed] })
	}
	else if (command === "beg") {
		var constantArg = args[0]
		if (talkedRecently.has(message.author.id)) return message.channel.send("You can only beg once every 10 million years")
		if (!Object.keys(JSON.parse(fs.readFileSync("./database/country/country_list.json", "utf8"))).includes(message.author.id)) return message.channel.send("You don't have a country")
		if (args[0] === undefined) args[0] = (Math.round(Math.random() * 150))
		else if (isNaN(args[0])) return message.channel.send("Please provide a valid amount (Amount is not a number)")
		else if (args[0] < 1) return message.channel.send("Please provide a valid amount (Amount is below 1)")
		else if (args[0] > 75) return message.channel.send("Please provide a valid amount (Amount is above 75)")
		countryList = JSON.parse(fs.readFileSync("./database/country/country_list.json", "utf8"))
		args[0] = parseInt(args[0])
		if (message.author.id == '708026434660204625') args[0] += 40
		countryList[message.author.id].money += applyMultiplier(args[0], countryList[message.author.id].ideology)
		fs.writeFileSync("./database/country/country_list.json", JSON.stringify(countryList, null, 2))
		const begEmbed = new MessageEmbed()
			.setTitle('You begged')
			.setDescription(`You have gotten ${applyMultiplier(args[0], countryList[message.author.id].ideology)} Imperial Credits`)
			.setColor(randomColor())
			.setTimestamp()
			.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: botPFP });
		talkedRecently.add(message.author.id);
		setTimeout(() => talkedRecently.delete(message.author.id), 60000);
		logToFile(message.author.id, command, (constantArg === undefined ? "" : constantArg), applyMultiplier(args[0], countryList[message.author.id].ideology), "./database/bot/log.json")
		return message.channel.send({ embeds: [begEmbed] })
	}
	else if (command === "profile") {
		if (!Object.keys(JSON.parse(fs.readFileSync("./database/country/country_list.json", "utf8"))).includes(message.author.id)) return message.channel.send("You don't have a country")
		countryList = JSON.parse(fs.readFileSync("./database/country/country_list.json", "utf8"))
		country = countryList[message.author.id]
		description = makeProfileEmbed(country, message.author.id)
		const profileEmbed = new MessageEmbed()
			.setTitle(`${country.name}'s profile`)
			.setDescription(description)
			.setColor(randomColor())
			.setTimestamp()
			.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: botPFP });
		logToFile(message.author.id, command, "", "Profile Embed", "./database/bot/log.json")
		return message.channel.send({ embeds: [profileEmbed] })
	}
	else if (command === "ideologylist") {
		description = makeIdeologyEmbed()
		const ideologyEmbed = new MessageEmbed()
			.setTitle('Ideologies list')
			.setDescription(description)
			.setColor(randomColor())
			.setTimestamp()
			.setFooter({ text: "Please report any bugs! Thanks! ^^ (Multiplier is for money gotten, Discount is for shop prices)", iconURL: botPFP });
		logToFile(message.author.id, command, "", "IdeologyList Embed", "./database/bot/log.json")
		return message.channel.send({ embeds: [ideologyEmbed] })
	}
	else if (command === "war") {
		message.channel.send("This feature will be available in IHQ 2.1, the War Update")
	}
	else if (command === "help") {
		description = makeHelpEmbed()
		const helpEmbed = new MessageEmbed()
			.setTitle('Help')
			.setDescription(description)
			.setColor(randomColor())
			.setTimestamp()
			.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: botPFP });
		logToFile(message.author.id, command, "", "Help Embed", "./database/bot/log.json")
		return message.channel.send({ embeds: [helpEmbed] })
	}
	else if (command === 'spoopy') {
		message.reply('spoopy scary skeletonz')
	}
	else if (command === 'qotd') {
		if (!(message.member.permissions.has("MANAGE_MESSAGES"))) return message.channel.send("You cannot execute this command")
		client.channels.cache.get("1001687962125348885").send('@here ' + args.join(' '));
		logToFile(message.author.id, command, args.join(' '), "Message sent in <#1001687962125348885>", "./database/bot/log.json")
		return message.channel.send('Message has been sent!')
	}
	else if (command === 'leaderboard') {
		description = makeLeaderboardEmbed()
		const helpEmbed = new MessageEmbed()
			.setTitle('Leaderboard')
			.setDescription(description)
			.setColor(randomColor())
			.setTimestamp()
			.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: botPFP });
		logToFile(message.author.id, command, "", "Leaderboard Embed", "./database/bot/log.json")
		return message.channel.send({ embeds: [helpEmbed] })
	}
});

function capitalize(string) {
	return string.toLowerCase().split(" ").map(word => word[0].toUpperCase() + word.slice(1)).join(" ")
}
function replaceAll(str, find, replace) {
	var escapedFind = find.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
	return str.replace(new RegExp(escapedFind, 'g'), replace); //why so many symbols here?
}
function isNumber(n) {
	return !isNaN(parseFloat(n)) && !isNaN(n - 0);
}
function randomColor() {
	return '#' + Math.floor(Math.random() * 16777215).toString(16);
}



function makeLeaderboardEmbed() {
	let description = "";
	var countryList = JSON.parse(fs.readFileSync("./database/country/country_list.json", "utf8"))
	for (i in countryList) {
		country = countryList[i]
		description = description + "__" + country.name + ":__ " + country.money + "\n"
	}
	return description
}
function makeIdeologyEmbed() {
	let description = ""; let i; let j;
	var ideologySettings = JSON.parse(fs.readFileSync("./database/country/ideology_settings.json"))
	var ideologiesArray = Object.keys(ideologySettings)
	for (i of ideologiesArray) { //ideologiesArray = ["facism", "socialism", "communism", "democracy", "anarchism", "capitalism"]
		var ideologyName = capitalize(i)
		var ideologySet = Object.keys(ideologySettings[i])
		description = description + "\n" + "__**" + ideologyName + "**__"
		for (j of ideologySet) {
			var currentSetting = j
			var currentSet = (ideologySettings[i][j] == -1 ? "Random" : ideologySettings[i][j])
			description = description + "\n" + capitalize(replaceAll(currentSetting, "_", " ",)) + ": " + (isNumber(currentSet) ? (Math.round(currentSet * 100) + "%") : currentSet)
		}
		description = description + "\n"
	}
	return description
}

function makeNewCountryEmbed(country, id) {
	return `**Name:** ${country.name}\n**Ideology:** ${capitalize(country.ideology)}\n**Money:** ${country.money}\n\n**Author:** <@${id}>`
}
function makeCountryEmbed(country) {
	return `**Name:** ${country.name}\n**Ideology:** ${capitalize(country.ideology)}\n**Money:** ${country.money}`
}
function makeShopEmbed() {
	let description = ""
	var itemList = JSON.parse(fs.readFileSync("./database/economy/shop_items.json"))
	for (item of itemList) {
		var name = item.name
		var desc = item.description
		var cost = item.cost
		var ID = item.id
		description = description + "\n" + "__**" + name + "**__" + "\n" + desc + "\n" + "Cost: `" + cost + "`\n" + "ID: " + ID
		description = description + "\n\n"
	}
	return description
}
function makeProfileEmbed(country, id) {
	var desc = `**Owner:** <@${id}>\n**Name:** ${country.name}\n**Ideology:** ${capitalize(country.ideology)}\n**Money:** ${country.money}\n\n** Items:**`
	items = makeItemList(country.items)
	if (items) desc = desc + items
	else desc = desc + "\nNone"
	return desc
}
function makeHelpEmbed() {
	let description = "**Commands:**"
	var commandList = JSON.parse(fs.readFileSync("./database/bot/command_list.json", "utf8"))
	for (command in commandList) {
		description = description + "\n" + "__" + command + ":__\n" + "Usage: `" + commandList[command].use + "`\nDescription: " + commandList[command].description + "\n"
	}
	return description
}


function makeItemList(items) {
	let description = ""
	for (i of Object.keys(items)) {
		item = findShopID(i)
		description = description + "\n" + "**" + item.name + "**" + ": " + items[i]
	}
	return description
}
function findShopID(id) {
	var itemList = JSON.parse(fs.readFileSync("./database/economy/shop_items.json"))
	for (item of itemList) {
		if (item.id == id) return item
	}
	return false
}
function applyMultiplier(amount, ideology) {
	var ideologySettings = JSON.parse(fs.readFileSync("./database/country/ideology_settings.json"))
	var multiplier = ideologySettings[ideology].multiplier
	if (!multiplier) return amount
	// console.log(amount, amount * multiplier, Math.round(parseInt(amount) + parseInt(amount * multiplier)))
	return Math.round(parseInt(amount) + parseInt(amount * multiplier))
}

function applyDiscount(amount, ideology) {
	var ideologySettings = JSON.parse(fs.readFileSync("./database/country/ideology_settings.json"))
	var discount = ideologySettings[ideology].discount
	if (!discount) return amount
	return Math.round(parseInt(amount) + parseInt(amount * discount))
}

function logToFile(author, action, input, output, file) {
	readFile = JSON.parse(fs.readFileSync(file, "utf8"))
	const id = parseInt(Object.keys(readFile).length) + 1
	readFile[id.toString()] = {
		"author": author,
		"command": action,
		"input": input,
		"output": output,
		"time": Date.now().toString()
	}
	return fs.writeFileSync(file, JSON.stringify(readFile, null, 2))
}

function keepAlive() {
	server.listen(3000, () => {
		console.log("Server is ready!")
	})
}