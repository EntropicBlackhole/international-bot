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
			.setDescription('Meat of course, but this is technically fake meat so no worries')),
	async execute({ interaction, client, database, misc }) {
		// interaction.reply('no use yet, krissy is working on this command still')
		// return
		await interaction.deferReply();
		const playersCountry = await database.getData('players_country');
		const countries = await database.getData('country_list');
		if (playersCountry[interaction.user.id]) { if (playersCountry[interaction.user.id].length == 0) return interaction.editReply('You don\'t have a country') }
		else if (playersCountry[interaction.user.id] == undefined) return interaction.editReply('You don\'t have a country')
		const subcommand = interaction.options.getSubcommand();
		let producedCacheTimer = await database.getData('produce_cache')
		if (producedCacheTimer[interaction.user.id] == undefined) producedCacheTimer[interaction.user.id] = {
			timer: {},
			plantedCache: {
				crops: 0,
				wood: 0,
				sugar: 0,
				harvestTime: 0
			}
		}


		if (subcommand == 'fish') {
			let randAmt = Math.floor(Math.random() * (10));
			var produceEmbed = new EmbedBuilder()
				.setTitle('Fishy business')
				.setDescription(`You've caught ${randAmt} fish${randAmt == 1 ? '' : 'es'}!`)
				.setColor(misc.randomColor())
				.setTimestamp()
				.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: client.user.avatarURL() });
			countries[playersCountry[interaction.user.id][0]].produced.fish += randAmt
			await database.postData('country_list', countries)
		}
		else if (subcommand == 'extract') {
			let randAmt = Math.floor(Math.random() * (10));
			var produceEmbed = new EmbedBuilder()
				.setTitle('Oily lands')
				.setDescription(`You've extracted ${randAmt} liter${randAmt == 1 ? '' : 's'} of oil!`)
				.setColor(misc.randomColor())
				.setTimestamp()
				.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: client.user.avatarURL() });
			countries[playersCountry[interaction.user.id][0]].produced.oil += randAmt
			await database.postData('country_list', countries)
		}
		else if (subcommand == 'plant') {
			let randAmtCrops = Math.floor(Math.random() * (10));
			let randAmtTrees = Math.floor(Math.random() * (10));
			let randAmtSugarcane = Math.floor(Math.random() * (10));
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
			await database.postData('produce_cache', producedCacheTimer)
			await database.postData('country_list', countries)
		}
		else if (subcommand == 'harvest') {

		}
		else if (subcommand == 'mine') {
			if (producedCacheTimer[interaction.user.id].timer.mine > Date.now()) return interaction.editReply(`You can mine in ${Math.floor((producedCacheTimer[interaction.user.id].timer.mine - Date.now()) / 1000 / 60)} min`)
			let randAmtCopper = Math.floor(Math.random() * (10));
			let randAmtGold = Math.floor(Math.random() * (10));
			let randAmtCoal = Math.floor(Math.random() * (10));
			var produceEmbed = new EmbedBuilder()
				.setTitle('Don\'t mine at night')
				.setDescription(`You've mined ${randAmtCopper} copper, ${randAmtGold} gold and ${randAmtCoal} coal!`)
				.setColor(misc.randomColor())
				.setTimestamp()
				.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: client.user.avatarURL() });
			producedCacheTimer[interaction.user.id].timer.mine = Date.now() + 1000 * 60 * 3
			countries[playersCountry[interaction.user.id][0]].produced.copper += randAmtCopper
			countries[playersCountry[interaction.user.id][0]].produced.gold += randAmtGold
			countries[playersCountry[interaction.user.id][0]].produced.coal += randAmtCoal
			await database.postData('produce_cache', producedCacheTimer)
			await database.postData('country_list', countries)
			// return interaction.editReply({ embeds: [produceEmbed] })
		}
		else if (subcommand == 'slaughter') {
			let randAmt = Math.floor(Math.random() * (10));
			var produceEmbed = new EmbedBuilder()
				.setTitle('It\'s artificial meat I swear')
				.setDescription(`You've slaughtered ${randAmt} virtual non real animal${randAmt == 1 ? '' : 's'}!`)
				.setColor(misc.randomColor())
				.setTimestamp()
				.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: client.user.avatarURL() });
			countries[playersCountry[interaction.user.id][0]].produced.meat += randAmt
			await database.postData('produce_cache', producedCacheTimer)
			await database.postData('country_list', countries)
		}
		return interaction.editReply({ embeds: [produceEmbed] })
	},
};

