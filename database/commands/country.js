const { SlashCommandBuilder } = require('discord.js');
const { Misc } = require('../bot/functions');
const fs = require('fs');
const countries = require('../country/country_list.json')
let countryList = [];

const misc = new Misc();
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
						{ name: "Gold", value: "gold" },
						{ name: "Meat", value: "meat" },
						{ name: "Sugar", value: "sugar" },
						{ name: "Metal", value: "metal"}
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
		let filtered = await misc.searchQuery(choices, focusedValue);
		filtered = filtered.slice(0, 24)
		await interaction.respond(
			filtered.map(choice => ({ name: choice, value: choice })),
		);
	},
	async execute(interaction, client) {
		await interaction.deferReply();
		const countries = JSON.parse(fs.readFileSync('./database/country/country_list.json'))
		const playersCountry = JSON.parse(fs.readFileSync('./database/country/players_country.json'))
		const continentMultipliers = JSON.parse(fs.readFileSync('./database/country/continent_multipliers.json'))
		const bank = JSON.parse(fs.readFileSync('./database/economy/bank.json'))
		if ([{}, undefined].includes(bank[interaction.user.id])) bank[interaction.user.id] = 0;
		fs.writeFileSync('./database/economy/bank.json', JSON.stringify(bank, null, 2))
		const subcommand = interaction.options.getSubcommand();
		const subcommandGroup = interaction.options.getSubcommandGroup();
		if (subcommand == 'get') {
			let country = interaction.options.getString('country');
			if (countries[country].isTaken) return interaction.editReply(`Sorry but ${country} is taken by <@${countries[country].owner}>`)
			if (!countries[country]) return interaction.editReply(`${country} does not exist`)
			countries[country].isTaken = true;
			countries[country].owner = interaction.user.id
			playersCountry[interaction.user.id] = country;
			fs.writeFileSync('./database/country/country_list.json', JSON.stringify(countries, null, 2))
			fs.writeFileSync('./database/country/players_country.json', JSON.stringify(playersCountry, null, 2))
			return interaction.editReply(`You have successfully become the leader of ${country}!`)
		}
		if (subcommandGroup == 'sell') {
			if (subcommand == 'unit') {
				let product = interaction.options.getString('product');
				let amt = interaction.options.getInteger('amt');
				countryOfPlayer = playersCountry[interaction.user.id]
				if (countries[countryOfPlayer].produced[product] < amt) return interaction.editReply(`You don't have \`${amt}\` of \`${product}\`, you only have \`${countries[playersCountry[interaction.user.id]].produced[product]}\``)
				countries[countryOfPlayer].produced[product] -= amt
				let amount = amt * continentMultipliers[countries[countryOfPlayer].continent][product]
				bank[interaction.user.id] += amount;
				fs.writeFileSync('./database/economy/bank.json', JSON.stringify(bank, null, 2))
				fs.writeFileSync('./database/country/country_list.json', JSON.stringify(countries))
				return interaction.editReply(`You have successfully sold \`${amount}\` of \`${product}\`, and with the continent multipler (${countries[countryOfPlayer].continent}), which is \`${continentMultipliers[countries[countryOfPlayer].continent][product]}\`, you have made a total of \`${amount}\` Imperial Credits!`)
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

