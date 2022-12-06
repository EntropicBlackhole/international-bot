const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, IntegrationApplication } = require('discord.js');
const paginationEmbed = require('discordjs-button-pagination');
const { Misc } = require('../bot/functions');
const misc = new Misc();
const fs = require('fs');
let shop = require('../economy/shop_items.json');
let shopList = []; //shoplift lol
for (i in shop) {
	shopList.push({
		name: shop[i].name,
		value: i
	})
}
module.exports = {
	name: "War",
	description: "Make war AND love! Are you the leader of an alliance? Call half of your alliance's troops to fight!",
	usage: "declare <user>, use <war-id> <item> <amount>, join <war-id> <side>, list, resign <war-id>",
	data: new SlashCommandBuilder()
		.setName('war')
		.setDescription("Make war AND love!")
		.addSubcommand(subcommand => subcommand
			.setName('declare')
			.setDescription('Declare war and love!')
			.addUserOption(option => option
				.setName('user')
				.setDescription('User to declare war on, let the game begin')
				.setRequired(true)))
		.addSubcommand(subcommand => subcommand
			.setName('use')
			.setDescription('Item to use, choose wisely')
			.addStringOption(option => option
				.setName('war-id')
				.setDescription('ID of war')
				.setRequired(true))
			.addStringOption(option => option
				.setName('item')
				.setDescription('Item to use')
				.setRequired(true)
				.setChoices(...shopList))
			.addIntegerOption(option => option
				.setName('amount')
				.setDescription('Amount of the item to use (Some have a max amount of uses per war)')
				.setRequired(true)))
		.addSubcommand(subcommand => subcommand
			.setName('join')
			.setDescription('Join a war and a side! Attacker or defender?')
			.addStringOption(option => option
				.setName('war-id')
				.setDescription('ID of war (Use /war list to show list of current ongoing wars)')
				.setRequired(true))
			.addStringOption(option => option
				.setName('side')
				.setDescription('Choose a side')
				.setRequired(true)
				.setChoices(
					{ name: "Attacker", value: "attacker" },
					{ name: "Defender", value: "defender" }
				)))
		.addSubcommand(subcommand => subcommand
			.setName('list')
			.setDescription('List of current ongoing wars'))
		.addSubcommand(subcommand => subcommand
			.setName('resign')
			.setDescription('Resign from a war, is a loss to your side, and if your side loses, you will lose items')
			.addStringOption(option => option
				.setName('war-id')
				.setDescription('ID of war')
				.setRequired(true))),
	async execute(interaction, client) {
		await interaction.deferReply();
		const countries = JSON.parse(fs.readFileSync('./database/country/country_list.json'))
		const playerCountry = JSON.parse(fs.readFileSync('./database/country/players_country.json'))
		const wars = JSON.parse(fs.readFileSync('./database/country/wars.json'))
		const subcommand = interaction.options.getSubcommand();
		if (subcommand == 'declare') {
			let user = interaction.options.getUser('user');
			if (!playerCountry[interaction.user.id]) return interaction.editReply('You don\'t have a country')
			if (!playerCountry[user.id]) return interaction.editReply(user.username + ' doesn\'t have a country')
			let randomWarID = Math.floor((Math.random() * 10000000) + 9000000).toString(36)
			const warEmbed = new EmbedBuilder()
				.setTitle(randomWarID)
				.setDescription(`War has broken out! Between ${interaction.user.username} and ${user.username}! Join using the War ID and get items, money and possible a territory! Do /war use <item> for attacking!`)
				.setColor(misc.randomColor())
				.setFields(
					{ name: "War ID", value: randomWarID },
					{ name: "Attacker", value: interaction.user.username },
					{ name: "Defender", value: user.username }
				)
				.setTimestamp()
				.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: client.user.avatarURL() });
			let warObject = {
				name: randomWarID,
				id: randomWarID,
				attacker: {},
				defender: {},
				turn: "Attacker"
			}
			warObject.attacker[interaction.user.id] = {
				name: interaction.user.username,
				hasPlayed: false
			};
			warObject.defender[user.id] = {
				name: user.username,
				hasPlayed: false
			};
			wars[randomWarID] = warObject;
			countries[playerCountry[interaction.user.id][0]].wars.push(randomWarID)
			countries[playerCountry[user.id][0]].wars.push(randomWarID)
			fs.writeFileSync('./database/country/country_list.json', JSON.stringify(countries, null, 2));
			fs.writeFileSync('./database/country/wars.json', JSON.stringify(wars, null, 2))
			return interaction.editReply({ embeds: [warEmbed] })
		}
		if (subcommand == 'use') {
			let warID = interaction.options.getString('war-id');
			let item = interaction.options.getString('item');
			let amount = interaction.options.getInteger('amount') ? interaction.options.getInteger('amount') : 1;
			//Check if the user is in this specific war
			if (!countries[playerCountry[interaction.user.id][0]].wars.includes(warID)) return interaction.editReply(`You aren't in this war`)
			//Check if it's users turn
			if (!wars[warID][wars[warID].turn.toLowerCase()][interaction.user.id]) return interaction.editReply(`It's not your side's turn yet`)
			//Check if user has item
			if (!countries[playerCountry[interaction.user.id][0]].items[item]) return interaction.editReply(`You don't own ${item}`)
			//Check if user has amount of item
			if (countries[playerCountry[interaction.user.id][0]].items[item] < amount) return interaction.editReply(`You only have ${countries[playerCountry[interaction.user.id][0]].items[item]} of ${item}, not ${amount}`)
			let itemUse = shop[item].use.type
			let points = shop[item].use.points
			let maxUse = shop[item].use.max_use

			if (maxUse < amount) return interaction.editReply(`You can only use ${maxUse} of this item`)

			//if the item's use isn't for healing, 
				//put all the people in the opposite side in an array, 
			//else, 
				//put all the people in your own side in an array
			let peopleSideArray = []
			for (id of Object.keys(wars[warID][itemUse == 'heal' ? (wars[warID].turn == 'Attacker' ? 'attacker' : 'defender') : (wars[warID].turn == 'Attacker' ? 'defender' : 'attacker')])) {
				peopleSideArray.push(playerCountry[id][0])
			}
			//The ID of the other person to apply the item on
			var otherUserID = ""
			if (peopleSideArray.length > 1) { //If theres more than one person in this side:
				interaction.editReply(`There are multiple people! Which one do you want to use this on? (Case sensitive) (${peopleSideArray.join('/')})`)
				const filter = m => ((peopleSideArray.includes(m.content)) && m.author.id == interaction.user.id)
				const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 15000 });
				
				collector.on('collect', m => {
					otherUserID = countries[m.content].owner //Asign otherUserID to that person
					//Since no errors have been passed, you can now mark the user's play as true
					wars[warID][wars[warID].turn.toLowerCase()][interaction.user.id].hasPlayed = true;
					//TODO: Add it so checks for if everyone in this side has already played, if so, it's the other side's turn
					//TODO: Also make it so it checks if a side has won 
					//Everything else seems pretty simple
					countries[playerCountry[interaction.user.id][0]].items[item] -= 1;
					if (itemUse == 'attack') {
						countries[playerCountry[otherUserID]].health -= points * amount
						fs.writeFileSync('./database/country/country_list.json', JSON.stringify(countries, null, 2))
						fs.writeFileSync('./database/country/wars.json', JSON.stringify(wars, null, 2))
						return interaction.followUp(`Successfully did ${points * amount} damage to <@${otherUserID}>!`)
					} else if (itemUse == 'disable') {
						let randomTakeout = Math.round(Math.random() * (parseInt(points[1]) - parseInt(points[0]) + 1)) + parseInt(points[0]);
						for (item in countries[playerCountry[otherUserID]].items) {
							let currentItem = shop[item]
							if (currentItem.type.includes("Electric")) {
								countries[playerCountry[otherUserID]].items[item] = Math.round((countries[playerCountry[otherUserID]].items[item] * (randomTakeout / 100)))
							}
						}
						fs.writeFileSync('./database/country/country_list.json', JSON.stringify(countries, null, 2))
						fs.writeFileSync('./database/country/wars.json', JSON.stringify(wars, null, 2))
						return interaction.followUp(`Successfully removed ${randomTakeout / 100} of electric items from <@${otherUserID}>!`)
					} else if (itemUse == 'heal') {
						countries[playerCountry[otherUserID]].health += points * amount
						fs.writeFileSync('./database/country/country_list.json', JSON.stringify(countries, null, 2))
						fs.writeFileSync('./database/country/wars.json', JSON.stringify(wars, null, 2))
						return interaction.followUp(`Successfully healed ${points * amount} HP!`);
					}
				});
			} else {
				otherUserID = Object.keys(wars[warID][itemUse == 'heal' ? (wars[warID].turn == 'Attacker' ? 'attacker' : 'defender') : (wars[warID].turn == 'Attacker' ? 'defender' : 'attacker')])[0]
				//Else just assign it to the only person in the array
				//Since no errors have been passed, you can now mark the user's play as true
				wars[warID][wars[warID].turn.toLowerCase()][interaction.user.id].hasPlayed = true;
				//TODO: Add it so checks for if everyone in this side has already played, if so, it's the other side's turn
				//TODO: Also make it so it checks if a side has won 
				//Everything else seems pretty simple
				countries[playerCountry[interaction.user.id][0]].items[item] -= 1;
				if (itemUse == 'attack') {
					countries[playerCountry[otherUserID]].health -= points * amount
					fs.writeFileSync('./database/country/country_list.json', JSON.stringify(countries, null, 2))
					fs.writeFileSync('./database/country/wars.json', JSON.stringify(wars, null, 2))
					return interaction.followUp(`Successfully did ${points * amount} damage to <@${otherUserID}>!`)
				} else if (itemUse == 'disable') {
					let randomTakeout = Math.round(Math.random() * (parseInt(points[1]) - parseInt(points[0]) + 1)) + parseInt(points[0]);
					for (item in countries[playerCountry[otherUserID]].items) {
						let currentItem = shop[item]
						if (currentItem.type.includes("Electric")) {
							countries[playerCountry[otherUserID]].items[item] = Math.round((countries[playerCountry[otherUserID]].items[item] * (randomTakeout / 100)))
						}
					}
					fs.writeFileSync('./database/country/country_list.json', JSON.stringify(countries, null, 2))
					fs.writeFileSync('./database/country/wars.json', JSON.stringify(wars, null, 2))
					return interaction.followUp(`Successfully removed ${randomTakeout / 100} of electric items from <@${otherUserID}>!`)
				} else if (itemUse == 'heal') {
					countries[playerCountry[otherUserID]].health += points * amount
					fs.writeFileSync('./database/country/country_list.json', JSON.stringify(countries, null, 2))
					fs.writeFileSync('./database/country/wars.json', JSON.stringify(wars, null, 2))
					return interaction.followUp(`Successfully healed ${points * amount} HP!`);
				}
			}
		}
		if (subcommand == 'join') {
			let warID = interaction.options.get('war-id');
			let side = interaction.options.get('side');
			wars[warID][side][interaction.user.id] = {
				name: interaction.user.username,
				hasPlayed: false
			}
			countries[playerCountry[interaction.user.id][0]].wars.push(warID)
			fs.writeFileSync('./database/country/country_list.json', JSON.stringify(countries, null, 2));
			fs.writeFileSync('./database/country/wars.json', JSON.stringify(wars, null, 2));
			return interaction.editReply(`Successfully joined ${wars[warID].name} on the ${side} side! Do /war use to start fighting!`)
		}
		if (subcommand == 'list') {
			let embedList = [];
			let buttonList = [
				new ButtonBuilder()
					.setCustomId('back')
					.setEmoji('◀')
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId('next')
					.setEmoji('▶')
					.setStyle(ButtonStyle.Primary)
			]
			for (i in wars) {
				let attackerNameArray = [];
				let defenderNameArray = [];
				for (player in wars[i].attacker) attackerNameArray.push(wars[i].attacker[player].name + ": " + playerCountry[player][0])
				for (player in wars[i].defender) defenderNameArray.push(wars[i].defender[player].name + ": " + playerCountry[player][0])
				const warEmbed = new EmbedBuilder()
					.setTitle(wars[i].name)
					.setFields(
						{ name: `Attacker${attackerNameArray.length > 1 ? "s" : ''}`, value: attackerNameArray.join("\n") },
						{ name: `Defender${defenderNameArray.length > 1 ? "s" : ''}`, value: defenderNameArray.join("\n") },
						{ name: "Turn", value: wars[i].turn },
						{ name: "War ID", value: wars[i].id}
					)
					.setColor(misc.randomColor())
					.setTimestamp()
					.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: client.user.avatarURL() });
				embedList.push(warEmbed)
			}
			await paginationEmbed(interaction, embedList, buttonList)
		}
		if (subcommand == 'resign') {
			let warID = interaction.options.get('war-id');
			for (let player in wars[warID].attacker) if (player == interaction.user.id) delete wars[warID].attacker[player]
			for (let player in wars[warID].defender) if (player == interaction.user.id) delete wars[warID].defender[player]
			countries[playerCountry[interaction.user.id][0]].wars.splice(countries[playerCountry[interaction.user.id][0]].wars.indexOf(warID), 1)
			fs.writeFileSync('./database/country/country_list.json', JSON.stringify(countries, null, 2));
			fs.writeFileSync('./database/country/wars.json', JSON.stringify(wars, null, 2));
			return interaction.editReply(`Successfully left ${wars[warID].name}!`)
		}
		if (subcommand == 'confirm') {}
	},
};

