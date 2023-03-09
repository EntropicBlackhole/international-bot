const { SlashCommandBuilder } = require('discord.js');

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
			.setDescription('Plant either crops, trees or sugarcane!')
			.addStringOption(option => option
				.setName('product')
				.setDescription('Harvest these with /work harvest')
				.setChoices({
					name: "Crops", value: "crops",
					name: "Trees", value: "wood",
					name: "Sugarcane", value: "sugar"
				})
				.setRequired(true)))
		.addSubcommand(subcommand => subcommand
			.setName('harvest')
			.setDescription('Harvest your crops and trees and sugarcane!')
			.addStringOption(option => option
				.setName('product')
				.setDescription('These are planted with /work plant')
				.setChoices({
					name: "Crops", value: "crops",
					name: "Trees", value: "wood",
					name: "Sugarcane", value: "sugar"
				})
				.setRequired(true)))
		.addSubcommand(subcommand => subcommand
			.setName('mine')
			.setDescription('Copper, gold or coal?')
			.addStringOption(option => option
				.setName('product')
				.setDescription('Not minecraft')
				.setChoices({
					name: "Copper", value: "copper",
					name: "Gold", value: "gold",
					name: "Coal", value: "coal"
				})
				.setRequired(true)))
		.addSubcommand(subcommand => subcommand
			.setName('slaughter')
			.setDescription('Meat of course, but this is technically fake meat so no worries')),
	async execute({ interaction, database, misc }) {
		await interaction.deferReply();
		const playersCountry = await database.getData('players_country');
		const countries = await database.getData('country_list');
		if (playersCountry[interaction.user.id]) { if (playersCountry[interaction.user.id].length == 0) return interaction.editReply('You don\'t have a country') }
		else if (playersCountry[interaction.user.id] == undefined) return interaction.editReply('You don\'t have a country')
		const subcommand = interaction.options.getSubcommand();
		if (subcommand == 'fish') {
			let randAmt = Math.floor(Math.random() * (10));
			const produceEmbed = new EmbedBuilder()
				.setTitle('Fishy business')
				.setDescription(`You've caught ${randAmt} fish${randAmt == 1 ? '' : 'es'}!`)
				.setColor(misc.randomColor())
				.setTimestamp()
				.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: client.user.avatarURL() });
			countries[playersCountry[interaction.user.id][0]].produced.fish += randAmt
			await database.postData('country_list', countries)
		}
		if (subcommand == 'extract') {
			let randAmt = Math.floor(Math.random() * (10));
			const produceEmbed = new EmbedBuilder()
				.setTitle('Oily lands')
				.setDescription(`You've extracted ${randAmt} liter${randAmt == 1 ? '' : 's'} of oil!`)
				.setColor(misc.randomColor())
				.setTimestamp()
				.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: client.user.avatarURL() });
			countries[playersCountry[interaction.user.id][0]].produced.oil += randAmt
			await database.postData('country_list', countries)
		}
		if (subcommand == 'plant') {
			let product = interaction.options.getString('product');
			let randAmt = Math.floor(Math.random() * (10));
			let producedPlants = await database.getData('produce_cache')
			if (producedPlants[interaction.user.id] == undefined) producedPlants[interaction.user.id] = {
				crops: 0,
				wood: 0,
				sugar: 0,
				harvestTime: Date.now() + 1000 * 60 * 15
			}
			producedPlants[product] += randAmt;
			const produceEmbed = new EmbedBuilder()
				.setTitle('Flora life')
				.setDescription(`You've planted ${randAmt} ${product == 'wood' ? 'tree' : (product == 'sugar' ? 'sugarcane' : 'crop')}${randAmt == 1 ? '' : 's'}! Harvest ${randAmt == 1 ? 'it' : 'these'} in 15 minutes!`)
				.setColor(misc.randomColor())
				.setTimestamp()
				.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: client.user.avatarURL() });
			// countries[playersCountry[interaction.user.id][0]].produced[product] += randAmt
			await database.postData('produce_cache', producedPlants)
			await database.postData('country_list', countries)
		}
		if (subcommand == 'harvest') {
			let product = interaction.options.getString('product');
		}
		if (subcommand == 'mine') {
			let product = interaction.options.getString('product');
		}
		if (subcommand == 'slaughter') {
			let randAmt = Math.floor(Math.random() * (10));
			const produceEmbed = new EmbedBuilder()
				.setTitle('It\'s artificial meat I swear')
				.setDescription(`You've slaughtered ${randAmt} virtual non real animal${randAmt == 1 ? '' : 's'}!`)
				.setColor(misc.randomColor())
				.setTimestamp()
				.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: client.user.avatarURL() });
			countries[playersCountry[interaction.user.id][0]].produced.meat += randAmt
			await database.postData('country_list', countries)
		}
	},
};

