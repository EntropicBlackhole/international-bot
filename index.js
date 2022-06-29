const fs = require('fs');
const { Client, Intents, MessageEmbed} = require("discord.js");
const { token, globalPrefix} = require("./config.json");
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_PRESENCES, Intents.FLAGS.GUILD_MEMBERS] });
client.login("OTU0NzYwODQ1NTE3MjU4ODAz.Gcl2F9.iHhu_i4sXNv6yb8-6JZII5Hn6eKLU7vSWwsjV0")

client.on("ready", function (e) {
	console.log(`Logged in as ${client.user.tag}!`)
})

const serverInvite = "https://discord.gg/NqV9Dwj3bX"
const iconURL = "https://cdn.discordapp.com/attachments/950846461573214279/965689742475821086/unknown.png?size=4096"
const botPFP = "https://cdn.discordapp.com/attachments/758349838009368589/966127260887294092/minimalist_earth_drawing.jpg?size=4096"
const ruleBook = "***0.** This means that, due to us being unable to list every single rule violation possible, moderators have the right to punish a user if they think that they are breaking a non-listed rule. (If you think a member of staff is abusing this power report them in report people channel)\n**1.** English should be our main language spoken in the server\n**2.** Any form of discrimination is completely unacceptable. Homophobic, racist and sexist comments result in an instant ban (unless it is in RP, read RP rule #8)\n**3.** No piracy of any kind\n**4.** Keep your username, profile picture SFW (Safe for Work). Any kind of NSFW content in channels or PFP will be deleted and you will receive a punishment\n**5.** You can only self promote if you are active and have a country. A member of staff will determine this\n**6.** Any malicious activity/intentional harming will result in a ban.\n**7.** Please refrain from arguing with mods and above\n**8.** Don't try to find loopholes in rules, that's what rule #0 is for, you'll still be punished\n**9.** Breaking a rule even as a \"joke\" is not tolerated\n**10.** Avoid discussions on sensitive topics, especially religion or IRL politics, depression, self harm and similar can be vented in #vent\n**11.** Do not get mad at pings, if you do, you can adjust the notifications for the server or un-react from the reaction roles. Avoid random pinging\n**12.** Do not beg for roles, services, promotions, money, etc\n**13.** Use channels as they are meant to be used\n**14.** No DM advertising\n**15.** No intentionally spamming mod logs\n**16.** Don't harshly insult people\n**17.** You will get a permanent ban for copying our server, this is not tolerated whatsoever\n**18.** Avoid making loud noises in the VC channels, please\n**19.** If you find a channel you probably shouldn't be able to talk in, please report it, we'll highly thank this\n**20.** Have fun!*\n\n__Punishment system:__\n-First Warning\n-Second Warning\n-Third Warning/1 hour timeout\n-Fourth Warning/Kick\n-Fifth Warning/Ban"
const roleCountry = "895716392718975039"
const roleNonCountry = "889580391307026463"
const roleMod = "889577953841803285"
const responselist = ["Yeah sure why not?", "Uh okay but im starting to doubt it", "No of course not what the heck?", "No", "i mean i guess", "Press X to doubt", "Maybe?", "honestly perhaps but don't ask me", "yes i completely agree now shut up", "NO NOT FOR A SINGLE SECOND"]

client.on("messageCreate", message => {
	if (!message.content.startsWith(globalPrefix) || message.author.bot) return; 

	const args = message.content.slice(globalPrefix.length).trim().split(/ +/);
	const command = args.shift().toLowerCase();

	if (command === 'start') {
		let countrylist = require("./list.json");
		var amt = countrylist.amount
		var total = Object.keys(countrylist.countries).length
		var randomColor = "#" + Math.floor(Math.random() * 16777215).toString(16);
		const startEmbed = new MessageEmbed()
			.setColor(randomColor)
			.setTitle(`Countries (${amt}/${total})`)
			.setURL(serverInvite)
			.setAuthor({ name: "IHQ", iconURL: iconURL, url: serverInvite })
			.setDescription("Get a country: <#895437267508809758>\nRead the rules: <#889576670997151774>\nRoleplay: <#950087801041461400>\nReaction Roles: <#889581561006141471>\nTalk: <#929824553637670953>\nHave fun!")
			.addField("Countries", "Do 1list [page] to see the list of countries, then choose your country doing 1get [country]", true)
			.setTimestamp()
			.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: botPFP });
		message.reply({ embeds: [startEmbed] })
	}
	else if (command === 'tour') {
		var randomColor = "#" + Math.floor(Math.random() * 16777215).toString(16);
		const tourEmbed = new MessageEmbed()
			.setColor(randomColor)
			.setTitle("IHQ Tour!")
			.setURL(serverInvite)
			.setAuthor({ name: "IHQ", iconURL: iconURL, url: serverInvite })
			.setDescription("I'll guide you through the server, take a seat!")
			.addFields(
				{ name: "Server Rules:", value: "<#889576670997151774>" },
				{ name: "Announcements:", value: "<#889576654526091314>" },
				{ name: "Talking:", value: "<#929824553637670953>" },
				{ name: "RP Rules:", value: "<#952999368611463268>" },
				{ name: "Map Updates:", value: "<#889576747702562897>" },
				{ name: "RP Chat:", value: "<#950087801041461400>" },
				{ name: "Get A Country:", value: "<#895437267508809758>" },
				{ name: "Set Claims:", value: "<#952728254047989761>" },
				{ name: "Reaction Roles:", value: "<#889581561006141471>" },
				{ name: "Advertising:", value: "<#949085259113324564>" },
				{ name: "My channel:", value: "<#889577381289918474>" },
			)
			.setTimestamp()
			.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: botPFP });
		message.reply({ embeds: [tourEmbed] });
	}
	else if (command === 'rules') {
		var randomColor = "#" + Math.floor(Math.random() * 16777215).toString(16);
		const rulesEmbed = new MessageEmbed()
			.setColor(randomColor)
			.setTitle("Rulebook")
			.setURL(serverInvite)
			.setAuthor({ name: "IHQ", iconURL: iconURL, url: serverInvite })
			.setDescription(`List of rules in IHQ\n\n${ruleBook}`)
			.setTimestamp()
			.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: botPFP });
		message.reply({ embeds: [rulesEmbed] });
	}
	else if (command === 'get') {
		let countrylist = fs.readFileSync("./list.json");
		countrylist = JSON.parse(countrylist);
		var countries = countrylist.countries
		var list = Object.keys(countries)
		var users = Object.values(countries)
		var country = args.join(" ")
		if (!args[0]) return message.channel.send("Please specify a country")
		if (!list.includes(country)) return message.channel.send("That country doesn't exist")
		if (users.includes(message.author.id)) return message.channel.send("You already have a country")
		if (countries[country]) return message.channel.send("That country is already taken")
		countries[country] = message.author.id
		countrylist.countries = countries
		var member = message.guild.members.cache.get(message.author.id)
		var nickname = capitalizeWords(country)
		member.roles.add(roleCountry);
		member.roles.remove(roleNonCountry);
		member.setNickname(nickname)
		countrylist.amount += 1
		fs.writeFile("./list.json", JSON.stringify(countrylist, null, 4), (err) => { if (err) console.log(err) });
		message.reply(`You have claimed ${capitalizeWords(country)}`)
	}
	else if (command === 'list') {
		var page = args[0]
		if (!page || page > 20 || isNaN(page)) return message.channel.send("Please specify a page [1-20]")
		let countrylist = fs.readFileSync("./list.json");
		countrylist = JSON.parse(countrylist);
		var list = Object.keys(countrylist.countries)
		var end = ""
		for (var i = 0; i < 10; i++) {
			if (page == "20" && i == 7) break
			j = (10 * (page - 1)) + i
			end = end + capitalizeWords(list[j]) + "\n"
		}
		const pageEmbed = new MessageEmbed()
			.setColor(randomColor)
			.setTitle(`Country List! (${page}/20)`)
			.setURL(serverInvite)
			.setAuthor({ name: "IHQ", iconURL: iconURL, url: serverInvite })
			.setDescription(end)
			.setTimestamp()
			.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: botPFP });
		message.reply({ embeds: [pageEmbed] });
	}
	else if (command === 'ping') {
		message.channel.send("Pong!")
	}
	else if (command === "randomcolor") {
		var ColorRandom = "#" + Math.floor(Math.random() * 16777215).toString(16);
		message.reply(ColorRandom)
	}
	else if (command === "cookie") {
		message.react("🍪")
	}
	else if (command === "qotd") {
		if (!message.member.roles.cache.some(role => role.id === roleCountry)) return message.reply("You don't have permission to use this command!")
		if (!args[0]) return message.reply("Please ask a question!")
		var question = args.join(" ")
		client.channels.cache.get("929853663906758696").send(`${question} <#929853680411361350>`)
	}
	else if (command === "8ball") {
		if (!args[0]) return message.reply("Please ask a question!")
		var randomColor = "#" + Math.floor(Math.random() * 16777215).toString(16);
		var ballOutput = Math.floor(Math.random() * 10)
		var question = args.join(" ")
		const ballEmbed = new MessageEmbed()
			.setColor(randomColor)
			.setTitle(question)
			.setAuthor({ name: "IHQ", iconURL: iconURL, url: serverInvite })
			.setDescription(responselist[ballOutput])
			.setTimestamp()
			.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: botPFP });
		message.reply({ embeds: [ballEmbed] })
	}
	else if (command === "kiss") {
		if (!message.mentions.users.size) return message.reply("Please mention a user to kiss!")

		message.channel.send(`${message.author} and ${message.mentions.members.first()}\nSitting in a tree\nK - I - S - S - I - N - G!\nFirst comes love\nThen comes marriage\nThen comes baby\nIn a baby carriage!`)
		message.reply(`${message.author} has kissed ${message.mentions.members.first()}!`)
	}
	else if (command === "purge") {
		if (!args[0]) return message.reply("Please specify a number of messages to delete!")
		var member = message.guild.members.cache.get(message.author.id)
		if (!member.permissions.has("MANAGE_MESSAGES")) return message.reply("You don't have permission to use this command!")
		let amt = parseInt(args[0]);
		if (isNaN(amt)) return message.channel.send("Please specify an amount!")
		if (amt < 2) return message.channel.send("Please specify a number greater than 2!")
		amt += 1
		message.channel.bulkDelete(amt).then(() => {
			message.channel.send(`Deleted ${amt - 1} messages.`).then(message => message.delete(40000));
		});
	}
	else if (command === 'resign') {
		if (!message.member.roles.cache.some(role => role.id === roleCountry)) return message.reply("You don't have permission to use this command!")
		let countrylist = fs.readFileSync("./list.json");
		countrylist = JSON.parse(countrylist);
		var countries = countrylist.countries
		var users = Object.values(countries)
		if (!users.includes(message.author.id)) return message.channel.send("You don't have a country!")
		var i
		for (var i in countries) {
			var j = countries[i]
			if (j == message.author.id) {
				countries[i] = 0
				break
			}
		}
		var member = message.guild.members.cache.get(message.author.id)
		member.roles.add(roleNonCountry);
		member.roles.remove(roleCountry);
		member.setNickname(null)
		countrylist.amount -= 1
		countrylist.countries = countries
		fs.writeFile("./list.json", JSON.stringify(countrylist, null, 4), (err) => { if (err) console.log(err) });
		message.reply(`You have resigned from ${capitalizeWords(i)}`)
	}
	else if (command === 'remove') {
		if (!message.mentions.users.size) return message.reply("Please mention a user who's country to remove!")
		if (!message.member.roles.cache.some(role => role.id === roleMod)) return message.reply("You don't have permission to use this command!")
		var member = message.guild.members.cache.get(message.author.id)
		if (!member.permissions.has("MANAGE_MESSAGES") || !member.permissions.has("MANAGE_NICKNAMES")) return message.reply("You don't have permission to use this command!")
		var userMentioned = message.mentions.members.first()

		let countrylist = fs.readFileSync("./list.json");
		countrylist = JSON.parse(countrylist);
		var countries = countrylist.countries
		var users = Object.values(countries)
		if (!users.includes(userMentioned.id)) return message.channel.send("This user doesn't have a country")
		var i
		for (var i in countries) {
			var j = countries[i]
			if (j == userMentioned.id) {
				countries[i] = 0
				break
			}
		}
		var member = message.guild.members.cache.get(userMentioned.id)
		member.roles.add(roleNonCountry);
		member.roles.remove(roleCountry);
		member.setNickname(null)
		countrylist.amount -= 1
		countrylist.countries = countries
		fs.writeFile("./list.json", JSON.stringify(countrylist, null, 4), (err) => { if (err) console.log(err) });
		message.reply(`${userMentioned} has been removed from from ${capitalizeWords(i)}`)
	}
	else if (command === 'help') {
		const helpEmbed = new MessageEmbed()
			.setColor(0x00AE86)
			.setTitle("Help")
			.setAuthor({ name: "IHQ", iconURL: iconURL, url: serverInvite })
			.setDescription("Here are the commands you can use:")
			.addField("start", "Starting point")
			.addField("tour", "Gives a tour of the server")
			.addField("rules", "Shows the rules")
			.addField("get [country]", "Gets a country")
			.addField("list [page]", "Lists all countries")
			.addField("ping", "Pong!")
			.addField("randomcolor", "Replies with a random color in hex code")
			.addField("cookie", "Reacts with a cookie")
			.addField("qotd [question]", "Asks a question in #qotd")
			.addField("8ball [question]", "Ask the 8ball a question")
			.addField("kiss [user]", "Kisses someone")
			.addField('resign', "Resigns from your country")
			.addField("purge [amount]", "Deletes messages (Mod Only)")
			.addField('remove [user]', "Removes a country (Mod Only)")
			.setTimestamp()
			.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: botPFP });
		message.channel.send({ embeds: [helpEmbed] })
	}
})

function capitalizeWords(string) {
	return string.replace(/(?:^|\s)\S/g, function (a) { return a.toUpperCase(); });
}
