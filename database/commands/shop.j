const { SlashCommandBuilder } = require('discord.js');
let shop = require('../economy/shop_items.json');
let shopList = []; //shoplift lol
for (i of shop) {
	shopList.push({
		name: i.name,
		value: i.id
	})
}
module.exports = {
	name: "Shop",
	description: "Buy things! You can sell your things at half the original cost!",
	usage: "buy <item> <amt>, list, sell <item> <amt>",
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
				.setChoices(shopList))
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
				.setName('id')
				.setDescription('ID of item to sell')
				.setRequired(true))
			.addIntegerOption(option => option
				.setName('amt')
				.setDescription('Amount of item to sell!')
				.setMinValue(1))),
	async execute(interaction, client) {
		await interaction.deferReply();
		const subcommand = interaction.options.getSubcommand();
		if (subcommand == 'buy') {
			let id = interaction.options.getString('item');
			let amt = interaction.options.getInteger('amt')
		}
		if (subcommand == 'list') {

		}
		if (subcommand == 'sell') {
			let id = interaction.options.getString('id');
			let amt = interaction.options.getInteger('amt')
		}
	},
};

