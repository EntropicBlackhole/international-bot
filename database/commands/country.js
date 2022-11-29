const { SlashCommandBuilder } = require('discord.js');
const countries = require('../country/country_list.json')
let countryList = [];
for (i in countries) {
	countryList.push(i)
}
module.exports = {
	name: "Country",
	description: "Get a country! Sell what you produce! Make love AND war!",
	usage: "get <country>, sell [unit <product> <amt>, all], leave, map",
	data: new SlashCommandBuilder()
		.setName('country')
		.setDescription("Get a country! Sell what you produce! Make love AND war!")
		.addSubcommand(subcommand => subcommand
			.setName('get')
			.setDescription('Get a country!')
			.addStringOption(option => option
				.setName('country')
				.setDescription('Choose one wisely! Look at the list to see what they produce!')
				.setRequired(true)
				.setAutocomplete(true)))
		.addSubcommandGroup(subcommandGroup => subcommandGroup
			.setName('sell')
			.setDescription('Sell your products')
			.addSubcommand(subcommand => subcommand
				.setName('unit')
				.setDescription('Sell an amount of a product')
				.addStringOption(option => option
					.setName('product')
					.setDescription('The product to sell')
					.setRequired(true)
					.setChoices(
						{ name: "Fish", value: "fish" },
						{ name: "Oil", value: "oil" },
						{ name: "Crops", value: "crops" },
						{ name: "Copper", value: "copper" },
						{ name: "Wood", value: "wood" },
						{ name: "Coal", value: "coal" },
						{ name: "Gold", value: "gold" }
					))
				.addIntegerOption(option => option
					.setName('amt')
					.setDescription('Amount to sell')
					.setMinValue(1)
					.setRequired(true)))
			.addSubcommand(subcommand => subcommand
				.setName('all')
				.setDescription('Sells all of your products (Recommended)')))
		.addSubcommand(subcommand => subcommand
			.setName('leave')
			.setDescription('Leaves your country, are you sure?'))
		.addSubcommand(subcommand => subcommand
			.setName('list')
			.setDescription('Lists all the countries'))
		.addSubcommand(subcommand => subcommand
			.setName('map')
			.setDescription('Shows the world map, and taken countries')),
	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused();
		const choices = countryList;
		const filtered = choices.filter(choice => choice.includes(focusedValue.toLowerCase()));
		await interaction.respond(
			filtered.map(choice => ({ name: choice, value: choice })),
		);
	},
	async execute(interaction, client) {
		await interaction.deferReply();
		const subcommand = interaction.options.getSubcommand();
		const subcommandGroup = interaction.options.getSubcommandGroup();
		if (subcommand == 'get') {
			let country = interaction.options.getString('country');
			console.log(country)
		}
		if (subcommandGroup == 'sell') {
			if (subcommand == 'unit') {
				let product = interaction.options.getString('product');
				let amt = interaction.options.getInteger('amt');
			}
			if (subcommand == 'all') {

			}
		}
		if (subcommand == 'leave') {
		}
		if (subcommand == 'map') {
		}
	},
};

