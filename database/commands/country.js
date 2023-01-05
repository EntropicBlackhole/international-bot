const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
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
						{ name: "Metal", value: "metal" }
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
			.setDescription('Lists all the countries! (Include the country parameter to see its stats!)')
			.addStringOption(option => option
				.setName('country')
				.setDescription('Country to see stats of (optional)')))
		.addSubcommand(subcommand => subcommand
			.setName('profile')
			.setDescription('Displays your current status, items, etc'))
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
			if (!countries[country]) return interaction.editReply(`${country} does not exist`)
			if (playersCountry[interaction.user.id]) { if (playersCountry[interaction.user.id].length > 0) return interaction.editReply('You already have a country') }
			else if (playersCountry[interaction.user.id] != undefined) return interaction.editReply('You already have a country')
			if (countries[country].isTaken) return interaction.editReply(`Sorry but ${country} is taken by <@${countries[country].owner}>`)
			countries[country].isTaken = true;
			countries[country].owner = interaction.user.id
			playersCountry[interaction.user.id] = [country];
			fs.writeFileSync('./database/country/country_list.json', JSON.stringify(countries, null, 2))
			fs.writeFileSync('./database/country/players_country.json', JSON.stringify(playersCountry, null, 2))
			let member = interaction.guild.members.cache.get(interaction.user.id);
			let countryRole = member.guild.roles.cache.find(role => role.id == '1046195813229015175')
			let nonCountryRole = member.guild.roles.cache.find(role => role.id == '1046195813229015174')
			await member.roles.add(countryRole);
			await member.roles.remove(nonCountryRole);
			await member.setNickname(misc.capitalize(country))
			return interaction.editReply(`You have successfully become the leader of ${country}!`)
		} //Finished
		if (subcommandGroup == 'sell') {
			if (subcommand == 'unit') {
				let product = interaction.options.getString('product');
				let amt = interaction.options.getInteger('amt');
				if (playersCountry[interaction.user.id]) { if (playersCountry[interaction.user.id].length == 0) return interaction.editReply('You don\'t have a country') }
				else if (playersCountry[interaction.user.id] == undefined) return interaction.editReply('You don\'t have a country')
				if (playersCountry[interaction.user.id].length > 1) {
					interaction.editReply(`You have more than 1 country occupied, which one do you wanna sell from? (${playersCountry[interaction.user.id].join('/')}/all) (Is case sensitive)`)
					const filter = m => ((playersCountry[interaction.user.id].includes(m.content)) || (m.content.toLowerCase() === 'all'))
					const collector = interaction.channel.createMessageCollector({ filter, time: 60000 });

					collector.on('collect', async m => {
						if (m.content.toLowerCase() == 'all') {
							let amount = 0;
							for (country of playersCountry[interaction.user.id]) {
								if (countries[country].produced[product] < amt) {
									await interaction.editReply(`You don't have \`${amt}\` of \`${product}\`, selling all possible of \`${product}\``)
									amt = Math.round(countries[country].produced[product])
								}
								countries[country].produced[product] -= amt
								amount += Math.round(amt * continentMultipliers[countries[country].continent][product])
							}
							bank[interaction.user.id] += amount;
							fs.writeFileSync('./database/economy/bank.json', JSON.stringify(bank, null, 2))
							fs.writeFileSync('./database/country/country_list.json', JSON.stringify(countries, null, 2))
							return interaction.followUp(`You have successfully sold \`${amt}\` of \`${product}\` in your ${playersCountry[interaction.user.id].length} occupied countries, you have made a total of \`${amount}\` Imperial Credits!`)
						} else {
							countryOfPlayer = m.content;
							if (countries[countryOfPlayer].produced[product] < amt) return interaction.followUp(`You don't have \`${amt}\` of \`${product}\` in ${countryOfPlayer}, you only have \`${countries[countryOfPlayer].produced[product]}\``)
							countries[countryOfPlayer].produced[product] -= amt
							let amount = Math.round(amt * continentMultipliers[countries[countryOfPlayer].continent][product])
							bank[interaction.user.id] += amount;
							fs.writeFileSync('./database/economy/bank.json', JSON.stringify(bank, null, 2))
							fs.writeFileSync('./database/country/country_list.json', JSON.stringify(countries, null, 2))
							return interaction.followUp(`You have successfully sold \`${amt}\` of \`${product}\` in ${countryOfPlayer}, and with the continent multipler (${countries[countryOfPlayer].continent}), which is \`${continentMultipliers[countries[countryOfPlayer].continent][product]}\`, you have made a total of \`${amount}\` Imperial Credits!`)
						}
					});
				} else {
					if (countries[playersCountry[interaction.user.id][0]].produced[product] < amt) return interaction.editReply(`You don't have \`${amt}\` of \`${product}\`, you only have \`${countries[playersCountry[interaction.user.id][0]].produced[product]}\``)
					countries[playersCountry[interaction.user.id][0]].produced[product] -= amt
					let amount = Math.round(amt * continentMultipliers[countries[playersCountry[interaction.user.id][0]].continent][product])
					bank[interaction.user.id] += amount;
					fs.writeFileSync('./database/economy/bank.json', JSON.stringify(bank, null, 2))
					fs.writeFileSync('./database/country/country_list.json', JSON.stringify(countries, null, 2))
					return interaction.followUp(`You have successfully sold \`${amt}\` of \`${product}\`, and with the continent multipler (${countries[playersCountry[interaction.user.id][0]].continent}), which is \`${continentMultipliers[countries[playersCountry[interaction.user.id][0]].continent][product]}\`, you have made a total of \`${amount}\` Imperial Credits!`)
				}
			}
			if (subcommand == 'all') {
				let amount = 0;
				if (playersCountry[interaction.user.id]) { if (playersCountry[interaction.user.id].length == 0) return interaction.editReply('You don\'t have a country') }
				else if (playersCountry[interaction.user.id] == undefined) return interaction.editReply('You don\'t have a country')
				for (country of playersCountry[interaction.user.id]) {
					for (i in countries[country].produced) {
						amount += Math.round(countries[country].produced[i] * continentMultipliers[countries[country].continent][i])
						countries[country].produced[i] = 0;
					}
				}
				bank[interaction.user.id] += amount;
				fs.writeFileSync('./database/economy/bank.json', JSON.stringify(bank, null, 2))
				fs.writeFileSync('./database/country/country_list.json', JSON.stringify(countries, null, 2))
				return interaction.editReply(`You have successfully sold all of your produced stuff, and with the continent multipler, you have made a total of \`${amount}\` Imperial Credits!`)
			}
		} //Finished
		if (subcommand == 'leave') {
			if (playersCountry[interaction.user.id]) { if (playersCountry[interaction.user.id].length == 0) return interaction.editReply('You don\'t have a country') }
			else if (playersCountry[interaction.user.id] == undefined) return interaction.editReply('You don\'t have a country')
			if (countries[playersCountry[interaction.user.id][0]].owner != interaction.user.id) return interaction.editReply('You don\'t own this country')
			interaction.editReply(`Are you sure you want to leave your country? Any occupied countries will become free. (y/n)`)
			const filter = m => ['y', 'n'].includes(m.content.toLowerCase())
			const collector = interaction.channel.createMessageCollector({ filter, time: 15000 });

			collector.on('collect', async m => {
				if (m.content.toLowerCase() == 'y') {
					for (country of playersCountry[interaction.user.id]) {
						countries[country].isTaken = false;
						countries[country].owner = "";
						delete playersCountry[interaction.user.id];
					}
					fs.writeFileSync('./database/country/country_list.json', JSON.stringify(countries, null, 2))
					fs.writeFileSync('./database/country/players_country.json', JSON.stringify(playersCountry, null, 2));
					let member = interaction.guild.members.cache.get(interaction.user.id);
					let countryRole = member.guild.roles.cache.find(role => role.id == '1046195813229015175')
					let nonCountryRole = member.guild.roles.cache.find(role => role.id == '1046195813229015174')
					await member.roles.remove(countryRole);
					await member.roles.add(nonCountryRole);
					await member.setNickname(null)
					return interaction.followUp(`You have successfully deleted your country and all territories you may have occupied`)
				}
				else if (m.content.toLowerCase() == 'n') return interaction.followUp('Alright then')
			});
		} //Finished
		if (subcommand == 'list') {
			let country = interaction.options.getString('country');
			if ((!countries[country]) && country != null) return interaction.editReply(`${country} does not exist (The database is case sensitive, you may want to check your input)`)
			if (country) {
				let stats = countries[country]
				let products = []
				let continentProductMult = []
				let items = []
				for (i in stats.products) { products.push(`${misc.capitalize(i)}: ${stats.products[i]}`); continentProductMult.push(`${misc.capitalize(i)}: ${continentMultipliers[stats.continent][i].toString()}`); }
				for (i in stats.items) items.push(`${misc.capitalize(i)}: ${stats.items[i]}`);

				if (products.length == 0) products.push('None')
				if (items.length == 0) items.push('None')
				if (stats.wars.length == 0) stats.wars.push('None')
				if (stats.alliances.length == 0) stats.alliances.push('None')

				let countryEmbed = new EmbedBuilder()
					.setTitle(country)
					.setFields(
						{ name: 'Owner', value: (stats.owner != "" ? client.users.cache.find(user => user.id === stats.owner).username : "None") },
						{ name: 'ISO Code', value: stats.code, inline: true },
						{ name: 'Continent', value: stats.continent, inline: true },
						{ name: 'Product Rate', value: products.join('\n') },
						{ name: 'Continent Multipliers', value: continentProductMult.join('\n') },
						{ name: 'Alliances', value: stats.alliances.join('\n'), inline: true },
						{ name: 'Items', value: items.join('\n'), inline: true },
						{ name: 'Current wars', value: stats.wars.join('\n'), inline: true },
						{ name: 'Health', value: stats.health.toString(), inline: true }
					)
					.setColor(misc.randomColor())
					.setTimestamp()
					.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: client.user.avatarURL() });
				interaction.editReply({ embeds: [countryEmbed] })
			} else {
				let countryEmbeds = [];
				let tenCountriesCount = 0;
				let tenCountries = "";
				for (i in countries) {
					if (!countries[i].isTaken) {
						tenCountries = tenCountries + `${i}\n`
						tenCountriesCount++
					}
					if (tenCountriesCount == 10) {
						tenCountriesCount = 0;
						let countryEmbed = new EmbedBuilder()
							.setTitle('Available countries!')
							.setDescription(tenCountries.trim())
							.setColor(misc.randomColor())
							.setTimestamp()
							.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: client.user.avatarURL() });
						countryEmbeds.push(countryEmbed)
						tenCountries = "";
					}
				}
				if (tenCountries) {
					tenCountriesCount = 0;
					let countryEmbed = new EmbedBuilder()
						.setTitle('Available countries!')
						.setDescription(tenCountries.trim())
						.setColor(misc.randomColor())
						.setTimestamp()
						.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: client.user.avatarURL() });
					countryEmbeds.push(countryEmbed)
					tenCountries = "";
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
				await misc.paginationEmbed(interaction, countryEmbeds, buttonList);
			}
		} //Finished
		if (subcommand == 'map') {
			return interaction.editReply(`This subcommand is not available yet, check later for more`)
		} //Finished
		if (subcommand == 'profile') {
			if (playersCountry) { if (playersCountry.length == 0) return interaction.editReply('You don\'t have a country') }
			else if (playersCountry == undefined) return interaction.editReply('You don\'t have a country')
			let stats = countries[playersCountry[interaction.user.id][0]]
			let products = []
			let items = []
			for (i in stats.produced) products.push(`${misc.capitalize(i)}: ${stats.produced[i]}`)
			for (i in stats.items) items.push(`${misc.capitalize(i)}: ${stats.items[i]}`)

			if (products.length == 0) products.push('None')
			if (items.length == 0) items.push('None')
			if (stats.wars.length == 0) stats.wars.push('None')
			if (stats.alliances.length == 0) stats.alliances.push('None')
			const profileEmbed = new EmbedBuilder()
				.setTitle(playersCountry[interaction.user.id][0])
				.setFields(
					{ name: 'Owner', value: client.users.cache.find(user => user.id === stats.owner).username },
					{ name: 'ISO Code', value: stats.code, inline: true },
					{ name: 'Continent', value: stats.continent, inline: true },
					{ name: 'Products', value: products.join('\n') },
					{ name: 'Alliances', value: stats.alliances.join('\n'), inline: true },
					{ name: 'Items', value: items.join('\n'), inline: true },
					{ name: 'Current wars', value: stats.wars.join('\n') },
					{ name: 'Health', value: stats.health.toString(), inline: true },
					{ name: 'Money', value: bank[interaction.user.id].toString(), inline: true }
				)
				.setColor(misc.randomColor())
				.setTimestamp()
				.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: client.user.avatarURL() });
			return interaction.editReply({ embeds: [profileEmbed] })
		} //Finished
	},
};