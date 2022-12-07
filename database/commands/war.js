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
				.setDescription('Amount of the item to use (Some have a max amount of uses per round)')
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
			.setName('confirm')
			.setDescription('Confirm your side\'s turn being done')
			.addStringOption(option => option
				.setName('war-id')
				.setDescription('War ID whom\'s war\'s side to confirm')))
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
		const bank = JSON.parse(fs.readFileSync('./database/economy/bank.json'))

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
				captainAttacker: interaction.user.id,
				captainDefender: user.id,
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
			//Check if user has already played
			if (wars[warID][wars[warID].turn.toLowerCase()][interaction.user.id].hasPlayed) return interaction.editReply(`You've already played this turn, wait till others finish make their move, or have the captain confirm the end of the turn with \`/war confirm <war-id>\``)
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

				collector.on('collect', async m => {
					otherUserID = countries[m.content].owner //Asign otherUserID to that person

					//Since no errors have been passed, you can now mark the user's play as true
					wars[warID][wars[warID].turn.toLowerCase()][interaction.user.id].hasPlayed = true;
					//Everything else seems pretty simple
					countries[playerCountry[interaction.user.id][0]].items[item] -= amount;
					if (itemUse == 'attack') {
						countries[playerCountry[otherUserID]].health -= points * amount
						await interaction.followUp(`Successfully did ${points * amount} damage to <@${otherUserID}>!`)
						fs.writeFileSync('./database/country/country_list.json', JSON.stringify(countries, null, 2))
						fs.writeFileSync('./database/country/wars.json', JSON.stringify(wars, null, 2))
					} else if (itemUse == 'disable') {
						let randomTakeout = Math.round(Math.random() * (parseInt(points[1]) - parseInt(points[0]) + 1)) + parseInt(points[0]);
						for (item in countries[playerCountry[otherUserID]].items) {
							let currentItem = shop[item]
							if (currentItem.type.includes("Electric")) {
								countries[playerCountry[otherUserID]].items[item] = Math.round((countries[playerCountry[otherUserID]].items[item] * (randomTakeout / 100)))
							}
						}
						await interaction.followUp(`Successfully removed %${randomTakeout} of electric items from <@${otherUserID}>!`)
						fs.writeFileSync('./database/country/country_list.json', JSON.stringify(countries, null, 2))
						fs.writeFileSync('./database/country/wars.json', JSON.stringify(wars, null, 2))
					} else if (itemUse == 'heal') {
						countries[playerCountry[otherUserID]].health += points * amount
						await interaction.followUp(`Successfully healed ${points * amount} HP!`);
						fs.writeFileSync('./database/country/country_list.json', JSON.stringify(countries, null, 2))
						fs.writeFileSync('./database/country/wars.json', JSON.stringify(wars, null, 2))
					}
					//TODO: Also make it so it checks if a side has won
					//Check either if the captain's health is 0, or if the rest of the team's health is 0, 
					let captainHealth = countries[playerCountry[wars[warID]["captain" + (wars[warID].turn == "Attacker" ? "Defender" : "Attacker")]]].health
					if (captainHealth < 1) countries[playerCountry[wars[warID]["captain" + (wars[warID].turn == "Attacker" ? "Defender" : "Attacker")]]].health = 0;
					let isTeamDead = true;
					for (player in wars[warID][(wars[warID].turn == "Attacker" ? "Defender" : "Attacker").toLowerCase()]) {
						if (countries[playerCountry[player]].health < 1) countries[playerCountry[player]].health = 0;
						else isTeamDead = false;
					}
					if (captainHealth < 1 || isTeamDead) {
						//remove all values from war data
						const warEndEmbed = new EmbedBuilder()
							.setTitle('War has finished')
							.setDescription(`The ${wars[warID].turn} side has won! With the ${(wars[warID].turn == "Attacker" ? "Defender" : "Attacker")} losing.\n\n100% of each item, product and money of each user on the ${(wars[warID].turn == "Attacker" ? "Defender" : "Attacker")} side, will be taken and given equally to the ${wars[warID].turn} side`)
							.setColor(misc.randomColor())
							.setTimestamp()
							.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: client.user.avatarURL() });
						let takenThings = {
							items: {},
							produced: {},
							money: 0
						}
						//Taking things from losing side
						for (player in wars[warID][(wars[warID].turn == "Attacker" ? "Defender" : "Attacker").toLowerCase()]) {
							countries[playerCountry[player]].health = 100; //Setting health to 100
							countries[playerCountry[player]].wars.splice(countries[playerCountry[player]].wars.indexOf(warID), 1) //Removing the war ID from list
							//Removing the items
							for (let item in countries[playerCountry[player]].items) {
								if (!takenThings.items[item]) takenThings.items[item] = 0
								takenThings.items[item] += countries[playerCountry[player]].items[item]
								countries[playerCountry[player]].items[item] = 0;
							}
							//Removing the products
							for (let product in countries[playerCountry[player]].produced) {
								if (!takenThings.produced[product]) takenThings.produced[product] = 0
								takenThings.produced[product] += countries[playerCountry[player]].produced[product]
								countries[playerCountry[player]].produced[product] = 0;
							}
							//Removing the money
							takenThings.money += bank[player]
							bank[player] = 0;
						}
						//Adding things to winning side
						let winningPlayers = Object.keys(wars[warID][wars[warID].turn.toLowerCase()]).length;
						for (player in wars[warID][wars[warID].turn.toLowerCase()]) {
							countries[playerCountry[player]].health = 1000; //Setting health to 1000
							countries[playerCountry[player]].wars.splice(countries[playerCountry[player]].wars.indexOf(warID), 1) //Removing the war ID from list
							//Adding the items
							for (let item in takenThings.items) {
								if (!countries[playerCountry[player]].items[item]) countries[playerCountry[player]].items[item] = 0
								countries[playerCountry[player]].items[item] += Math.ceil(takenThings.items[item] / winningPlayers);
							}
							//Adding the products
							for (let product in takenThings.produced) {
								if (!countries[playerCountry[player]].produced[product]) countries[playerCountry[player]].produced[product] = 0
								countries[playerCountry[player]].produced[product] += Math.ceil(takenThings.produced[product] / winningPlayers);
							}
							//Adding the money
							bank[player] += Math.ceil(takenThings.money / winningPlayers)
						}
						fs.writeFileSync('./database/country/country_list.json', JSON.stringify(countries, null, 2))
						fs.writeFileSync('./database/country/wars.json', JSON.stringify(wars, null, 2))
						fs.writeFileSync('./database/economy/bank.json', JSON.stringify(bank, null, 2))
						return interaction.followUp({ content: 'Welp..', embeds: [warEndEmbed] })
					}
					//If either is true, then that side has won the war, 
					//and each user gets an equal amount of money/items from the other side's 80% of items and money
					//TODO
					let haveAllPlayed = true;
					for (let player in wars[warID][wars[warID].turn.toLowerCase()]) if (wars[warID][wars[warID].turn.toLowerCase()][player].hasPlayed == false) haveAllPlayed = false;
					if (haveAllPlayed) {
						for (let player in wars[warID][wars[warID].turn.toLowerCase()]) wars[warID][wars[warID].turn.toLowerCase()][player].hasPlayed = false;
						wars[warID].turn = (wars[warID].turn == "Attacker" ? "Defender" : "Attacker")
						await interaction.followUp(`It's the ${wars[warID].turn}s turn now! Use \`/war use <item>\` to do your play!`)
					}
					fs.writeFileSync('./database/country/country_list.json', JSON.stringify(countries, null, 2))
					fs.writeFileSync('./database/country/wars.json', JSON.stringify(wars, null, 2))
				});
			} else {
				otherUserID = Object.keys(wars[warID][itemUse == 'heal' ? (wars[warID].turn == 'Attacker' ? 'attacker' : 'defender') : (wars[warID].turn == 'Attacker' ? 'defender' : 'attacker')])[0]
				//Else just assign it to the only person in the array

				//Since no errors have been passed, you can now mark the user's play as true
				wars[warID][wars[warID].turn.toLowerCase()][interaction.user.id].hasPlayed = true;
				//Everything else seems pretty simple
				countries[playerCountry[interaction.user.id][0]].items[item] -= amount;
				if (itemUse == 'attack') {
					countries[playerCountry[otherUserID]].health -= points * amount
					await interaction.followUp(`Successfully did ${points * amount} damage to <@${otherUserID}>!`)
					fs.writeFileSync('./database/country/country_list.json', JSON.stringify(countries, null, 2))
					fs.writeFileSync('./database/country/wars.json', JSON.stringify(wars, null, 2))
				} else if (itemUse == 'disable') {
					let randomTakeout = Math.round(Math.random() * (parseInt(points[1]) - parseInt(points[0]) + 1)) + parseInt(points[0]);
					for (item in countries[playerCountry[otherUserID]].items) {
						let currentItem = shop[item]
						if (currentItem.type.includes("Electric")) {
							countries[playerCountry[otherUserID]].items[item] = Math.round((countries[playerCountry[otherUserID]].items[item] * (randomTakeout / 100)))
						}
					}
					await interaction.followUp(`Successfully removed %${randomTakeout} of electric items from <@${otherUserID}>!`)
					fs.writeFileSync('./database/country/country_list.json', JSON.stringify(countries, null, 2))
					fs.writeFileSync('./database/country/wars.json', JSON.stringify(wars, null, 2))
				} else if (itemUse == 'heal') {
					countries[playerCountry[otherUserID]].health += points * amount
					await interaction.followUp(`Successfully healed ${points * amount} HP!`);
					fs.writeFileSync('./database/country/country_list.json', JSON.stringify(countries, null, 2))
					fs.writeFileSync('./database/country/wars.json', JSON.stringify(wars, null, 2))
				}
				//TODO: Also make it so it checks if a side has won
				//Check either if the captain's health is 0, or if the rest of the team's health is 0, 
				let captainHealth = countries[playerCountry[wars[warID]["captain" + (wars[warID].turn == "Attacker" ? "Defender" : "Attacker")]]].health
				if (captainHealth < 1) countries[playerCountry[wars[warID]["captain" + (wars[warID].turn == "Attacker" ? "Defender" : "Attacker")]]].health = 0;
				let isTeamDead = true;
				for (player in wars[warID][(wars[warID].turn == "Attacker" ? "Defender" : "Attacker").toLowerCase()]) {
					if (countries[playerCountry[player]].health < 1) countries[playerCountry[player]].health = 0;
					else isTeamDead = false;
				}
				if (captainHealth < 1 || isTeamDead) {
					//remove all values from war data
					const warEndEmbed = new EmbedBuilder()
						.setTitle('War has finished')
						.setDescription(`The ${wars[warID].turn} side has won!\nWith the ${(wars[warID].turn == "Attacker" ? "Defender" : "Attacker")} losing.\n\nAll of the items of everyone on the ${(wars[warID].turn == "Attacker" ? "Defender" : "Attacker")} side, will be taken and given equally to the ${wars[warID].turn} side`)
						.setFields(
							{ name: 'Winning side', value: wars[warID].turn },
							{ name: 'Winning Captain', value: client.users.cache.find(user => user.id === wars[warID]["captain" + wars[warID].turn]).username },
							{ name: 'Winning Captain\'s Health', value: (countries[playerCountry[wars[warID]["captain" + wars[warID].turn]][0]].health).toString() },
							{ name: 'Losing side', value: (wars[warID].turn == "Attacker" ? "Defender" : "Attacker") },
							{ name: 'Losing Captain', value: client.users.cache.find(user => user.id === wars[warID]["captain" + (wars[warID].turn == "Attacker" ? "Defender" : "Attacker")]).username },
							{ name: 'Losing Captain\'s Health', value: (countries[playerCountry[wars[warID]["captain" + (wars[warID].turn == "Attacker" ? "Defender" : "Attacker")]][0]].health).toString() }
						)
						.setColor(misc.randomColor())
						.setTimestamp()
						.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: client.user.avatarURL() });
					let takenThings = {
						items: {},
						produced: {},
						money: 0
					}
					//Taking things from losing side
					for (player in wars[warID][(wars[warID].turn == "Attacker" ? "Defender" : "Attacker").toLowerCase()]) {
						countries[playerCountry[player]].health = 100; //Setting health to 100
						countries[playerCountry[player]].wars.splice(countries[playerCountry[player]].wars.indexOf(warID), 1) //Removing the war ID from list
						//Removing the items
						for (let item in countries[playerCountry[player]].items) {
							if (!takenThings.items[item]) takenThings.items[item] = 0
							takenThings.items[item] += countries[playerCountry[player]].items[item]
							countries[playerCountry[player]].items[item] = 0;
						}
						//Removing the products
						for (let product in countries[playerCountry[player]].produced) {
							if (!takenThings.produced[product]) takenThings.produced[product] = 0
							takenThings.produced[product] += countries[playerCountry[player]].produced[product]
							countries[playerCountry[player]].produced[product] = 0;
						}
						//Removing the money
						takenThings.money += bank[player]
						bank[player] = 0;
					}
					//Adding things to winning side
					let winningPlayers = Object.keys(wars[warID][wars[warID].turn.toLowerCase()]).length;
					for (player in wars[warID][wars[warID].turn.toLowerCase()]) {
						countries[playerCountry[player]].health = 1000; //Setting health to 1000
						countries[playerCountry[player]].wars.splice(countries[playerCountry[player]].wars.indexOf(warID), 1) //Removing the war ID from list
						//Adding the items
						for (let item in takenThings.items) {
							if (!countries[playerCountry[player]].items[item]) countries[playerCountry[player]].items[item] = 0
							countries[playerCountry[player]].items[item] += Math.ceil(takenThings.items[item] / winningPlayers);
						}
						//Adding the products
						for (let product in takenThings.produced) {
							if (!countries[playerCountry[player]].produced[product]) countries[playerCountry[player]].produced[product] = 0
							countries[playerCountry[player]].produced[product] += Math.ceil(takenThings.produced[product] / winningPlayers);
						}
						//Adding the money
						bank[player] += Math.ceil(takenThings.money / winningPlayers)
					}
					fs.writeFileSync('./database/country/country_list.json', JSON.stringify(countries, null, 2))
					fs.writeFileSync('./database/country/wars.json', JSON.stringify(wars, null, 2))
					fs.writeFileSync('./database/economy/bank.json', JSON.stringify(bank, null, 2))
					return interaction.followUp({ content: 'Welp..', embeds: [warEndEmbed] })
				}
				//If either is true, then that side has won the war, 
				//and each user gets an equal amount of money/items from the other side's 80% of items and money
				//TODO
				let haveAllPlayed = true;
				for (let player in wars[warID][wars[warID].turn.toLowerCase()]) if (wars[warID][wars[warID].turn.toLowerCase()][player].hasPlayed == false) haveAllPlayed = false;
				if (haveAllPlayed) {
					for (let player in wars[warID][wars[warID].turn.toLowerCase()]) wars[warID][wars[warID].turn.toLowerCase()][player].hasPlayed = false;
					wars[warID].turn = (wars[warID].turn == "Attacker" ? "Defender" : "Attacker")
					await interaction.followUp(`It's the ${wars[warID].turn}s turn now! Use \`/war use <item>\` to do your play!`)
				}
				fs.writeFileSync('./database/country/country_list.json', JSON.stringify(countries, null, 2))
				fs.writeFileSync('./database/country/wars.json', JSON.stringify(wars, null, 2))
			}
		}
		if (subcommand == 'join') {
			let warID = interaction.options.getString('war-id');
			let side = interaction.options.getString('side');
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
				for (player in wars[i].attacker) {
					attackerNameArray.push(wars[i].attacker[player].name + ": " + playerCountry[player][0])
					if (player == wars[i].captainAttacker) { var captainAttackerName = wars[i].attacker[player].name }
				}
				for (player in wars[i].defender) {
					defenderNameArray.push(wars[i].defender[player].name + ": " + playerCountry[player][0])
					if (player == wars[i].captainDefender) { var captainDefenderName = wars[i].defender[player].name }
				}
				const warEmbed = new EmbedBuilder()
					.setTitle(wars[i].name)
					.setFields(
						{ name: `Attacker Captain`, value: captainAttackerName },
						{ name: `Defender Captain`, value: captainDefenderName },
						{ name: `Attacker${attackerNameArray.length > 1 ? "s" : ''}`, value: attackerNameArray.join("\n") },
						{ name: `Defender${defenderNameArray.length > 1 ? "s" : ''}`, value: defenderNameArray.join("\n") },
						{ name: "Turn", value: wars[i].turn },
						{ name: "War ID", value: wars[i].id }
					)
					.setColor(misc.randomColor())
					.setTimestamp()
					.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: client.user.avatarURL() });
				embedList.push(warEmbed)
			}
			await paginationEmbed(interaction, embedList, buttonList)
		}
		if (subcommand == 'resign') {
			let warID = interaction.options.getString('war-id');
			for (let player in wars[warID].attacker) if (player == interaction.user.id) delete wars[warID].attacker[player]
			for (let player in wars[warID].defender) if (player == interaction.user.id) delete wars[warID].defender[player]
			countries[playerCountry[interaction.user.id][0]].wars.splice(countries[playerCountry[interaction.user.id][0]].wars.indexOf(warID), 1)
			fs.writeFileSync('./database/country/country_list.json', JSON.stringify(countries, null, 2));
			fs.writeFileSync('./database/country/wars.json', JSON.stringify(wars, null, 2));
			return interaction.editReply(`Successfully left ${wars[warID].name}!`)
		}
		if (subcommand == 'confirm') {
			let warID = interaction.options.getString('war-id');
			//Check if the user is in this specific war
			if (!countries[playerCountry[interaction.user.id][0]].wars.includes(warID)) return interaction.editReply(`You aren't in this war`)
			//Check if it's users turn
			if (!wars[warID][wars[warID].turn.toLowerCase()][interaction.user.id]) return interaction.editReply(`It's not your side's turn yet`)
			//Check if the user is the captain of this side's war
			if (wars[warID]["captain" + wars[warID].turn] != interaction.user.id) return interaction.editReply(`You aren't the captain of this side in this war`)
			for (let player in wars[warID][wars[warID].turn.toLowerCase()]) wars[warID][wars[warID].turn.toLowerCase()][player].hasPlayed = false;
			wars[warID].turn = (wars[warID].turn == "Attacker" ? "Defender" : "Attacker")
			fs.writeFileSync('./database/country/country_list.json', JSON.stringify(countries, null, 2))
			fs.writeFileSync('./database/country/wars.json', JSON.stringify(wars, null, 2))
			return interaction.followUp(`It's the ${wars[warID].turn}s turn now! Use \`/war use <item>\` to do your play!`)
		}
	},
};

/*
TODO: Put the side's captain on war list embed
*/