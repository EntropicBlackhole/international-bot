const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Misc } = require('../bot/functions');
const fs = require('fs');
const trie = require('trie');
const counTrie = new trie.Trie();
const misc = new Misc();

counTrie.loadJson(fs.readFileSync('./database/bot/trie.json'))

module.exports = {
	name: "Country",
	description: "Get a country! Sell what you produce! Make love AND war!",
	usage: "get <country>|list <country?>|profile|sell[unit <product> <amt>,all]|leave|map",
	data: new SlashCommandBuilder()
		.setName('country')
		.setDescription("Get a country! Sell what you produce! Make love AND war!")
		.addSubcommand(subcommand => subcommand
			.setName('get')
			.setDescription('Get a country!')
			.addStringOption(option => option
				.setName('country')
				.setDescription('Choose one wisely! (Case sensitive, place more than 2 letters to search)')
				.setRequired(true)
				.setAutocomplete(true)))
		.addSubcommand(subcommandGroup => subcommandGroup
			.setName('sell')
			.setDescription('Sells all of your products'))
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
		if (focusedValue.length >= 2) {
			let filtered = counTrie.getMatchingWords(focusedValue, false)
			if (filtered.length > 0) filtered = filtered.slice(0, 24)
			else filtered = [];
			await interaction.respond(filtered.map(choice => ({ name: choice, value: choice })));
		}
		else await interaction.respond([])

	},
	async execute({ interaction, client, database }) {
		await interaction.deferReply();

		const countries = await database.getData('country_list')
		const playersCountry = await database.getData('players_country')
		const continentMultipliers = await database.getData('continent_multipliers')
		const bank = await database.getData('bank')

		const subcommand = interaction.options.getSubcommand();
		const subcommandGroup = interaction.options.getSubcommandGroup();

		if ([{}, undefined].includes(bank[interaction.user.id])) { bank[interaction.user.id] = 0; await database.postData('bank', bank) }
		if ((playersCountry[interaction.user.id] == undefined) && (subcommand != 'get')) return interaction.editReply('You don\'t have a country')

		if (subcommand == 'get') {
			let country = interaction.options.getString('country');
			if (!countries[country]) return interaction.editReply(`${country} does not exist`)
			if (playersCountry[interaction.user.id]) return interaction.editReply('You already have a country')
			if (countries[country].isTaken) return interaction.editReply(`Sorry but ${country} is taken by <@${countries[country].owner}>`)
			countries[country].isTaken = true;
			countries[country].owner = interaction.user.id
			playersCountry[interaction.user.id] = [country];
			await database.postData('country_list', countries)
			await database.postData('players_country', playersCountry)
			let member = interaction.guild.members.cache.get(interaction.user.id);
			let countryRole = member.guild.roles.cache.find(role => role.id == '1046195813229015175')
			let nonCountryRole = member.guild.roles.cache.find(role => role.id == '1046195813229015174')
			await member.roles.add(countryRole);
			await member.roles.remove(nonCountryRole);
			await member.setNickname(misc.capitalize(country))
			return interaction.editReply(`You have successfully become the leader of ${country}!`)
		} //Finished
		if (subcommand == 'sell') {
			let amount = 0;
			for (i in countries[playersCountry[interaction.user.id].mainland].produced) {
				amount += Math.floor(countries[playersCountry[interaction.user.id].mainland].produced[i] * (continentMultipliers[countries[playersCountry[interaction.user.id].mainland].continent][i] ** 2) + (countries[playersCountry[interaction.user.id].mainland].produced[i] * (countries[playersCountry[interaction.user.id].mainland].products[i] / 100)))
				countries[playersCountry[interaction.user.id].mainland].produced[i] = 0;
			}
			for (country of playersCountry[interaction.user.id].conquered) {
				for (i in countries[country].produced) { //The amount of the product produced, times its continent multiplier which is squared, and then added the percentage of the produced priced as in stats.products
					amount += Math.floor(countries[country].produced[i] * (continentMultipliers[countries[country].continent][i] ** 2) + (countries[country].produced[i] * (countries[country].products[i] / 100)))
					countries[country].produced[i] = 0;
				}
			}
			bank[interaction.user.id] += amount;
			await database.postData('bank', bank)
			await database.postData('country_list', countries)
			return interaction.editReply(`You have successfully sold all of your produced stuff, and with the continent multipler, you have made a total of \`${amount}\` Imperial Credits!`)
		} //Finished
		if (subcommand == 'leave') {
			interaction.editReply(`Are you sure you want to leave your country? Any occupied countries will become free. (y/n)`)
			const filter = m => ['y', 'n'].includes(m.content.toLowerCase())
			const collector = interaction.channel.createMessageCollector({ filter, time: 30000 });

			collector.on('collect', async m => {
				if (m.content.toLowerCase() == 'y') {
					countries[playersCountry[interaction.user.id].mainland].isTaken = false;
					countries[playersCountry[interaction.user.id].mainland].owner = "";
					for (country of playersCountry[interaction.user.id].conquered) {
						countries[country].isTaken = false;
						countries[country].owner = "";
					}
					delete playersCountry[interaction.user.id];
					await database.postData('country_list', countries)
					await database.postData('players_country', playersCountry);
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
			let capitalizeCheck = false;
			if ((!countries[country]) && country != null) {
				if (!countries[misc.capitalize(country)]) return interaction.editReply(`${country} does not exist (The database is case sensitive, you may want to check your input)`)
				else capitalizeCheck = true;
			}
			if (country) {
				let stats = capitalizeCheck ? countries[misc.capitalize(country)] : countries[country]
				let productMult = []
				let continentProductMult = []
				let items = []
				for (i in stats.productMult) { productMult.push(`${misc.capitalize(i)}: ${stats.productMult[i]}`); continentProductMult.push(`${misc.capitalize(i)}: ${continentMultipliers[stats.continent][i].toString()}`); }
				for (i in stats.items) items.push(`${misc.capitalize(i)}: ${stats.items[i]}`);

				if (productMult.length == 0) productMult.push('None')
				if (items.length == 0) items.push('None')
				if (stats.wars.length == 0) stats.wars.push('None')
				if (stats.alliances.length == 0) stats.alliances.push('None')

				let countryEmbed = new EmbedBuilder()
					.setTitle(capitalizeCheck ? misc.capitalize(country) : country)
					.setFields(
						{ name: 'Owner', value: (stats.owner != "" ? client.users.cache.find(user => user.id === stats.owner).username : "None") },
						{ name: 'ISO Code', value: stats.code, inline: true },
						{ name: 'Continent', value: stats.continent, inline: true },
						{ name: 'Product Rate', value: productMult.join('\n') },
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
			return interaction.editReply({ files: [await database.getData('IHQMap')] })
		} //Finished
		if (subcommand == 'profile') {
			let stats = countries[playersCountry[interaction.user.id].mainland]
			let products = []
			let items = []
			for (i in stats.produced) products.push(`${misc.capitalize(i)}: ${stats.produced[i]}`)
			for (i in stats.items) items.push(`${misc.capitalize(i)}: ${stats.items[i]}`)

			if (products.length == 0) products.push('None')
			if (items.length == 0) items.push('None')
			if (stats.wars.length == 0) stats.wars.push('None')
			if (stats.alliances.length == 0) stats.alliances.push('None')
			const profileEmbed = new EmbedBuilder()
				.setTitle(playersCountry[interaction.user.id].mainland)
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