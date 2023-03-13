const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	name: "Work",
	description: "Work to plant crops, fish, cut down wood, mine, etc and produce products",
	usage: "fish,extract,plant <product>,harvest <product>,mine <product>,slaughter",
	data: new SlashCommandBuilder()
		.setName('work')
		.setDescription('Work to harvest crops, fish, cut down wood, mine, etc and produce products')
		.addSubcommand(subcommand => subcommand
			.setName('fish')
			.setDescription('Fish fishes of course!'))
		.addSubcommand(subcommand => subcommand
			.setName('extract')
			.setDescription('Oil, (careful with MERICA)'))
		.addSubcommand(subcommand => subcommand
			.setName('plant')
			.setDescription('Plant either crops, trees or sugarcane!'))
		.addSubcommand(subcommand => subcommand
			.setName('harvest')
			.setDescription('Harvest your crops and trees and sugarcane!'))
		.addSubcommand(subcommand => subcommand
			.setName('mine')
			.setDescription('Copper, gold or coal?'))
		.addSubcommand(subcommand => subcommand
			.setName('slaughter')
			.setDescription('Meat of course, but this is technically fake meat so no worries'))
		.addSubcommand(subcommand => subcommand
			.setName('forge')
			.setDescription('Forge metal you found!')),
	async execute({ interaction, client, database, misc }) {
		await interaction.deferReply();
		const playersCountry = await database.getData('players_country');
		const countries = await database.getData('country_list');
		if (playersCountry[interaction.user.id] == undefined) return interaction.editReply('You don\'t have a country')
		const subcommand = interaction.options.getSubcommand();
		let producedCacheTimer = await database.getData('produce_cache')
		if (producedCacheTimer[interaction.user.id] == undefined) producedCacheTimer[interaction.user.id] = {
			timer: {
				fish: 0,
				oil: 0,
				plants: 0,
				mine: 0,
				meat: 0,
				metal: 0,
			},
			plantedCache: {
				crops: 0,
				wood: 0,
				sugar: 0,
				harvestTime: 0
			}
		}
		if (subcommand == 'fish') {
			if (producedCacheTimer[interaction.user.id].timer.fish > Date.now()) return interaction.editReply(`You can fish fishy fish in ${misc.msToTime(producedCacheTimer[interaction.user.id].timer.fish - Date.now())}`)
			let randAmt = Math.floor(Math.random() * (20 - 1) + 1);
			var produceEmbed = new EmbedBuilder()
				.setTitle('Fishy business')
				.setDescription(`You've caught ${randAmt} fish${randAmt == 1 ? '' : 'es'}!`)
				.setColor(misc.randomColor())
				.setTimestamp()
				.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: client.user.avatarURL() });
			countries[playersCountry[interaction.user.id].mainland].produced.fish += randAmt
			producedCacheTimer[interaction.user.id].timer.fish = Date.now() + 1000 * 60 * 3
		}
		else if (subcommand == 'extract') {
			if (producedCacheTimer[interaction.user.id].timer.oil > Date.now()) return interaction.editReply(`You can extract oil in ${misc.msToTime(producedCacheTimer[interaction.user.id].timer.oil - Date.now())}`)
			let randAmt = Math.floor(Math.random() * (20 - 1) + 1);
			var produceEmbed = new EmbedBuilder()
				.setTitle('Oily lands')
				.setDescription(`You've extracted ${randAmt} liter${randAmt == 1 ? '' : 's'} of oil!`)
				.setColor(misc.randomColor())
				.setTimestamp()
				.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: client.user.avatarURL() });
			countries[playersCountry[interaction.user.id].mainland].produced.oil += randAmt
			producedCacheTimer[interaction.user.id].timer.oil = Date.now() + 1000 * 60 * 3
		}
		else if (subcommand == 'plant') {
			if (producedCacheTimer[interaction.user.id].timer.plants > Date.now()) return interaction.editReply(`You can plant in ${misc.msToTime(producedCacheTimer[interaction.user.id].timer.plants - Date.now())}`)
			let randAmtCrops = Math.floor(Math.random() * (30 - 1) + 1);
			let randAmtTrees = Math.floor(Math.random() * (30 - 1) + 1);
			let randAmtSugarcane = Math.floor(Math.random() * (30 - 1) + 1);
			producedCacheTimer[interaction.user.id].plantedCache.crops += randAmtCrops;
			producedCacheTimer[interaction.user.id].plantedCache.wood += randAmtTrees;
			producedCacheTimer[interaction.user.id].plantedCache.sugar += randAmtSugarcane;
			producedCacheTimer[interaction.user.id].plantedCache.harvestTime = Date.now() + 1000 * 60 * (randAmtCrops + randAmtTrees + randAmtSugarcane)
			var produceEmbed = new EmbedBuilder()
				.setTitle('Flora life')
				.setDescription(`You've planted ${randAmtCrops} crop${randAmtCrops == 1 ? '' : 's'}, ${randAmtTrees} tree${randAmtTrees == 1 ? '' : 's'} and ${randAmtSugarcane} sugarcane. Harvest these in ${(randAmtCrops + randAmtTrees + randAmtSugarcane)} minutes!`)
				.setColor(misc.randomColor())
				.setTimestamp()
				.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: client.user.avatarURL() });
			producedCacheTimer[interaction.user.id].timer.plants = Date.now() + 1000 * 60 * (randAmtCrops + randAmtTrees + randAmtSugarcane)
		}
		else if (subcommand == 'harvest') {
			if (producedCacheTimer[interaction.user.id].plantedCache.harvestTime > Date.now()) return interaction.editReply(`You can harvest your plants in ${misc.msToTime((producedCacheTimer[interaction.user.id].plantedCache.harvestTime - Date.now()) / 1000 / 60)}`)
			let harvestAmt = {
				crops: 0,
				wood: 0,
				sugar: 0
			};
			for (let plant in producedCacheTimer[interaction.user.id].plantedCache) {
				if (plant == 'harvestTime') break
				let plantAmt = producedCacheTimer[interaction.user.id].plantedCache[plant]
				countries[playersCountry[interaction.user.id].mainland].produced[plant] += plantAmt
				harvestAmt[plant] = plantAmt
				producedCacheTimer[interaction.user.id].plantedCache[plant] = 0
			}
			if (harvestAmt.crops == 0 && harvestAmt.wood == 0 && harvestAmt.sugar == 0) return interaction.editReply(`You haven't planted anything it seems!`)
			var produceEmbed = new EmbedBuilder()
				.setTitle('Flora unlife')
				.setDescription(`You've harvested ${harvestAmt.crops} crop${harvestAmt.crops == 1 ? '' : 's'}, ${harvestAmt.wood} tree${harvestAmt.wood == 1 ? '' : 's'} and ${harvestAmt.sugar} sugarcane!`)
				.setColor(misc.randomColor())
				.setTimestamp()
				.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: client.user.avatarURL() });
		}
		else if (subcommand == 'mine') {
			if (producedCacheTimer[interaction.user.id].timer.mine > Date.now()) return interaction.editReply(`You can mine in ${misc.msToTime(producedCacheTimer[interaction.user.id].timer.mine - Date.now())}`)
			let randAmtCopper = Math.floor(Math.random() * (20 - 1) + 1);
			let randAmtGold = Math.floor(Math.random() * (20 - 1) + 1);
			let randAmtCoal = Math.floor(Math.random() * (20 - 1) + 1);
			var produceEmbed = new EmbedBuilder()
				.setTitle('Don\'t mine at night')
				.setDescription(`You've mined ${randAmtCopper} copper, ${randAmtGold} gold and ${randAmtCoal} coal!`)
				.setColor(misc.randomColor())
				.setTimestamp()
				.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: client.user.avatarURL() });
			producedCacheTimer[interaction.user.id].timer.mine = Date.now() + 1000 * 60 * 3
			countries[playersCountry[interaction.user.id].mainland].produced.copper += randAmtCopper
			countries[playersCountry[interaction.user.id].mainland].produced.gold += randAmtGold
			countries[playersCountry[interaction.user.id].mainland].produced.coal += randAmtCoal
		}
		else if (subcommand == 'slaughter') {
			if (producedCacheTimer[interaction.user.id].timer.meat > Date.now()) return interaction.editReply(`You can slaughter virtual fake meat in ${misc.msToTime(producedCacheTimer[interaction.user.id].timer.meat - Date.now())}`)
			let randAmt = Math.floor(Math.random() * (20 - 1) + 1);
			var produceEmbed = new EmbedBuilder()
				.setTitle('It\'s artificial meat I swear')
				.setDescription(`You've slaughtered ${randAmt} virtual non real animal${randAmt == 1 ? '' : 's'}!`)
				.setColor(misc.randomColor())
				.setTimestamp()
				.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: client.user.avatarURL() });
			countries[playersCountry[interaction.user.id].mainland].produced.meat += randAmt
			producedCacheTimer[interaction.user.id].timer.meat = Date.now() + 1000 * 60 * 3
		}
		else if (subcommand == 'forge') {
			if (producedCacheTimer[interaction.user.id].timer.metal > Date.now()) return interaction.editReply(`You can forge your metal scraps together in ${misc.msToTime(producedCacheTimer[interaction.user.id].timer.metal - Date.now())}`)
			let randAmt = Math.floor(Math.random() * (20 - 1) + 1);
			var produceEmbed = new EmbedBuilder()
				.setTitle('Forged scraps')
				.setDescription(`You've forged ${randAmt} piece${randAmt == 1 ? '' : 's'} of metal!`)
				.setColor(misc.randomColor())
				.setTimestamp()
				.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: client.user.avatarURL() });
			countries[playersCountry[interaction.user.id].mainland].produced.metal += randAmt
			producedCacheTimer[interaction.user.id].timer.metal = Date.now() + 1000 * 60 * 3
		}
		await database.postData('produce_cache', producedCacheTimer)
		await database.postData('country_list', countries)
		return interaction.editReply({ embeds: [produceEmbed] })
	},
};

