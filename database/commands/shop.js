const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
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
	name: "Shop",
	description: "Buy things! You can sell your things at half the original cost!",
	usage: "buy <item> <amt>|list|sell <item> <amt>",
	data: new SlashCommandBuilder()
		.setName('shop')
		.setDescription("Buy things! You can sell your things at half the original cost!")
		.addSubcommand(subcommand => subcommand
			.setName('buy')
			.setDescription('Buy things!')
			.addStringOption(option => option
				.setName('item')
				.setDescription('The item to buy')
				.setRequired(true)
				.setChoices(...shopList))
			.addIntegerOption(option => option
				.setName('amt')
				.setDescription('The amount to buy')
				.setMinValue(1)))
		.addSubcommand(subcommand => subcommand
			.setName('list')
			.setDescription('List of items from the shop!'))
		.addSubcommand(subcommand => subcommand
			.setName('sell')
			.setDescription('Sell an item for half its original cost!')
			.addStringOption(option => option
				.setName('item')
				.setDescription('The item to sell')
				.setRequired(true)
				.setChoices(...shopList))
			.addIntegerOption(option => option
				.setName('amt')
				.setDescription('Amount of item to sell!')
				.setMinValue(1))),
	async execute(interaction, client) {
		const bank = JSON.parse(fs.readFileSync('./database/economy/bank.json'))
		const countries = JSON.parse(fs.readFileSync('./database/country/country_list.json'))
		const playersCountry = JSON.parse(fs.readFileSync('./database/country/players_country.json'))
		await interaction.deferReply()
		if (playersCountry[interaction.user.id]) { if (playersCountry[interaction.user.id].length == 0) return interaction.editReply('You don\'t have a country') }
		else if (playersCountry[interaction.user.id] == undefined) return interaction.editReply('You don\'t have a country')
		const subcommand = interaction.options.getSubcommand();
		if (subcommand == 'buy') {
			let item = interaction.options.getString('item');
			let amt = (interaction.options.getInteger('amt') ? interaction.options.getInteger('amt') : 1)
			if (!countries[playersCountry[interaction.user.id][0]].items[item]) countries[playersCountry[interaction.user.id][0]].items[item] = 0
			if ((shop[item].cost * amt) > bank[interaction.user.id]) return interaction.editReply(`You don't have ${(shop[item].cost * amt)} Imperial Credits to buy \`${amt}\` of ${shop[item].name}. You only have ${bank[interaction.user.id]} IC`)
			countries[playersCountry[interaction.user.id][0]].items[item] += amt
			bank[interaction.user.id] -= shop[item].cost * amt
			fs.writeFileSync('./database/country/country_list.json', JSON.stringify(countries, null, 2))
			fs.writeFileSync('./database/economy/bank.json', JSON.stringify(bank, null, 2))
			return interaction.editReply(`You've successfully bought \`${amt}\` of \`${shop[item].name}\` for \`${shop[item].cost * amt}\` IC!`)
		}
		if (subcommand == 'list') {
			let embedList = [];
			for (let shopItem in shop) {
				const shopItemEmbed = new EmbedBuilder()
					.setTitle(shop[shopItem].name)
					.setDescription(shop[shopItem].description)
					.setFields(
						{ name: "Cost", value: shop[shopItem].cost.toString() },
						{ name: "Type", value: shop[shopItem].type.join(', ')},
						{ name: "Use", value: shop[shopItem].use.type },
						{ name: "Max use per round", value: shop[shopItem].use.max_use.toString() }
					)
					.setColor(misc.randomColor())
					.setTimestamp()
					.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: client.user.avatarURL() });
				embedList.push(shopItemEmbed)
			}
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
			await misc.paginationEmbed(interaction, embedList, buttonList)
		}
		if (subcommand == 'sell') {
			let item = interaction.options.getString('item');
			let amt = (interaction.options.getInteger('amt') ? interaction.options.getInteger('amt') : 1)
			if (!countries[playersCountry[interaction.user.id][0]].items[item]) return interaction.editReply(`You don't have this item!`)
			countries[playersCountry[interaction.user.id][0]].items[item] -= amt
			bank[interaction.user.id] += Math.round(((shop[item].cost) / 2) * amt)
			fs.writeFileSync('./database/country/country_list.json', JSON.stringify(countries, null, 2))
			fs.writeFileSync('./database/economy/bank.json', JSON.stringify(bank, null, 2))
			return interaction.editReply(`You've successfully sold \`${amt}\` of \`${shop[item].name}\` for \`${Math.round(((shop[item].cost) / 2) * amt)}\` IC!`)
		}
	},
};

