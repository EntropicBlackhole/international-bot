const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const paginationEmbed = require('discordjs-button-pagination');
const { Misc, Alliance } = require('../bot/functions');
const misc = new Misc();
const alliance = new Alliance();
const fs = require('fs');

module.exports = {
	name: "Alliance",
	description: "Create, join leave and delete alliances!",
	usage: "create <name>, join <name>, deposit <name> <amount>, withdraw <name> <amount>, settings [list, change <name> <setting> <new-value>], leave <name>, delete <name>",
	data: new SlashCommandBuilder()
		.setName('alliance')
		.setDescription("Create, join leave and delete alliances!")
		.addSubcommand(subcommand => subcommand
			.setName('create')
			.setDescription('Create an alliance!')
			.addStringOption(option => option
				.setName('name')
				.setDescription('Name of your alliance')
				.setRequired(true)))
		.addSubcommand(subcommand => subcommand
			.setName('join')
			.setDescription('Join an alliance!')
			.addStringOption(option => option
				.setName('name')
				.setDescription('Name of the alliance to join')
				.setRequired(true)))
		.addSubcommand(subcommand => subcommand
			.setName('deposit')
			.setDescription('Deposit money into an alliance\'s bank!')
			.addStringOption(option => option
				.setName('name')
				.setDescription('Name of the alliance to deposit to')
				.setRequired(true))
			.addIntegerOption(option => option
				.setName('amount')
				.setDescription('Amount of money to deposit')
				.setRequired(true)))
		.addSubcommand(subcommand => subcommand
			.setName('withdraw')
			.setDescription('Withdraw money from an alliance\'s bank!')
			.addStringOption(option => option
				.setName('name')
				.setDescription('Name of the alliance to withdraw money from')
				.setRequired(true))
			.addIntegerOption(option => option
				.setName('amount')
				.setDescription('Amount of money to withdraw')
				.setRequired(true)))
		.addSubcommand(subcommand => subcommand
			.setName('edit-rules')
			.setDescription('Edit rules!')
			.addStringOption(option => option
				.setName('name')
				.setDescription('Name of the alliance whom\'s rules to edit!')
				.setRequired(true))
			.addStringOption(option => option
				.setName('new-rules')
				.setDescription('New rules to set!')
				.setRequired(true)))
		.addSubcommandGroup(subcommandGroup => subcommandGroup
			.setName('settings')
			.setDescription('Change/see your alliance\'s settings')
			.addSubcommand(subcommand => subcommand
				.setName('list')
				.setDescription('List of your alliances settings!')
				.addStringOption(option => option
					.setName('name')
					.setDescription('Name of the alliance whom\'s settings to list')))
			.addSubcommand(subcommand => subcommand
				.setName('change')
				.setDescription('Change your alliance\'s settings!')
				.addStringOption(option => option
					.setName('name')
					.setDescription('Name of the alliance whom\'s settings to change')
					.setRequired(true))
				.addStringOption(option => option
					.setName('setting')
					.setDescription('Setting to change')
					.setRequired(true))
				.addStringOption(option => option
					.setName('new-value')
					.setDescription('New value of that setting')
					.setRequired(true))))
		.addSubcommand(subcommand => subcommand
			.setName('profile')
			.setDescription('Profile of the desired alliance')
			.addStringOption(option => option
				.setName('name')
				.setDescription('Name of the desired alliance')
				.setRequired(true)))
		.addSubcommand(subcommand => subcommand
			.setName('leave')
			.setDescription('Leave an alliance!')
			.addStringOption(option => option
				.setName('name')
				.setDescription('Name of the alliance to leave!')
				.setRequired(true)))
		.addSubcommand(subcommand => subcommand
			.setName('delete')
			.setDescription('Delete your alliance!')
			.addStringOption(option => option
				.setName('name')
				.setDescription('Say my name before killing me')
				.setRequired(true))),
	async execute(interaction, client) {
		await interaction.deferReply();
		const subcommand = interaction.options.getSubcommand();
		const subcommandGroup = interaction.options.getSubcommandGroup();
		const alliances = JSON.parse(fs.readFileSync('./database/country/alliances.json'))
		const countries = JSON.parse(fs.readFileSync('./database/country/country_list.json'))
		const playerCountry = JSON.parse(fs.readFileSync('./database/country/players_country.json'))
		const bank = JSON.parse(fs.readFileSync('./database/economy/bank.json'))
		if (subcommand == 'create') {
			let name = interaction.options.getString('name');
			let newAlliance = alliance.create({
				name: name,
				leader: interaction.user.id
			})
			alliances[name] = newAlliance;
			countries[playerCountry[interaction.user.id][0]].alliances.push(name)
			fs.writeFileSync('./database/country/alliances.json', JSON.stringify(alliances, null, 2));
			fs.writeFileSync('./database/country/country_list.json', JSON.stringify(countries, null, 2));
			return interaction.editReply(`Successfully created ${name}! Check it out with \`/alliance profile\``);
		}
		if (subcommand == 'join') {
			let name = interaction.options.getString('name').toLowerCase();
			alliances[name] = alliance.addMember({
				allianceObject: alliances[name],
				member: interaction.user.id
			})
			countries[playerCountry[interaction.user.id][0]].alliances.push(name)
			fs.writeFileSync('./database/country/alliances.json', JSON.stringify(alliances, null, 2));
			fs.writeFileSync('./database/country/country_list.json', JSON.stringify(countries, null, 2));
			return interaction.editReply(`Successfully joined ${name}!`);
		}
		if (subcommand == 'deposit') {
			let name = interaction.options.getString('name');
			let amount = interaction.options.getInteger('amount');
			alliances[name] = alliance.depositBank({
				allianceObject: alliances[name],
				amount: amount
			})
			bank[interaction.user.id] -= amount;
			fs.writeFileSync('./database/country/alliances.json', JSON.stringify(alliances, null, 2));
			fs.writeFileSync('./database/economy/bank.json', JSON.stringify(bank, null, 2));
			return interaction.editReply(`Successfully deposited ${amount} to ${name}!`);
		}
		if (subcommand == 'withdraw') {
			let name = interaction.options.getString('name');
			let amount = interaction.options.getInteger('amount');
			let check = alliance.withdrawBank({
				allianceObject: alliances[name],
				amount: amount,
				user: interaction.user.id
			})
			if (check === -1) return interaction.editReply(`You cannot withdraw this amount, you can only withdraw ${alliances[name].settings.withdraw_per_interval}`)
			else if (check === 0) return interaction.editReply(`You have already withdrawed, please wait until you can redraw again at ${(alliances[name].lastWithdraw[user] + alliances[name].settings.interval_of_withdraw).toUTCString()}`)
			alliances[name] = check
			bank[interaction.user.id] += amount;
			fs.writeFileSync('./database/country/alliances.json', JSON.stringify(alliances, null, 2));
			fs.writeFileSync('./database/economy/bank.json', JSON.stringify(bank, null, 2));
			return interaction.editReply(`Successfully withdrawn ${amount} from ${name}!`);
		}
		if (subcommand == 'edit-rules') {
			let name = interaction.options.getString('name');
			let newRules = interaction.options.getString('new-rules');
			let check = alliance.changeRules({
				allianceObject: alliances[name],
				newRules: newRules,
			})
			if (check === 0) return interaction.editReply(`You aren't the leader of this alliance`);
			alliances[name] = check
			fs.writeFileSync('./database/country/alliances.json', JSON.stringify(alliances, null, 2));
			return interaction.editReply(`Successfully updated the rules!`);
		}
		if (subcommandGroup == 'settings') {
			if (subcommand == 'list') {
				let name = interaction.options.getString('name');
				const settingsEmbed = new EmbedBuilder()
					.setTitle(name)
					.setFields(
						{ name: "Withdraw Per Interval", value: alliances[name].settings.withdraw_per_interval },
						{ name: "Interval Of Withdraw", value: alliances[name].settings.interval_of_withdraw }
					)
					.setColor(misc.randomColor())
					.setTimestamp()
					.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: client.user.avatarURL() });
				return interaction.editReply({ embeds: [settingsEmbed] })
			}
			if (subcommand == 'change') {
				let name = interaction.options.getString('name');
				let setting = interaction.options.getString('setting');
				let newValue = interaction.options.getString('new-value');
				let check = alliance.changeSettings({
					allianceObject: alliances[name],
					setting: setting,
					newValue: newValue,
					user: interaction.user.id
				})
				if (check == -1) return interaction.editReply(`Please choose a valid setting to change`);
				else if (check == 0) return interaction.editReply(`You aren't the leader of this alliance`)
				alliances[name] = check;
				fs.writeFileSync('./database/country/alliances.json', JSON.stringify(alliances, null, 2));
				return interaction.editReply(`Successfully updated the settings!`);
			}
		}
		if (subcommand == 'profile') {
			let name = interaction.options.getString('name');
			const profileEmbed = new EmbedBuilder()
				.setTitle(name)
				.setFields(
					{ name: "Leader", value: alliances[name].leader },
					{ name: "Rules", value: alliances[name].rules },
					{ name: "Members", value: alliances[name].members.join('\n') },
					{ name: "Bank", value: alliances[name].bank },
					{ name: "Withdraw Per Interval", value: alliances[name].settings.withdraw_per_interval, inline: true },
					{ name: "Interval Of Withdraw", value: alliances[name].settings.interval_of_withdraw, inline: true }
				)
				.setColor(misc.randomColor())
				.setTimestamp()
				.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: client.user.avatarURL() });
			fs.writeFileSync('./database/country/alliances.json', JSON.stringify(alliances, null, 2));
			return interaction.editReply({ embeds: [profileEmbed] });
		}
		if (subcommand == 'leave') {
			let name = interaction.options.getString('name');
			alliances[name] = alliance.removeMember(interaction.user.id)
			countries[countryPlayer[interaction.user.id][0]].alliances.splice(countries[countryPlayer[interaction.user.id][0]].alliances.indexOf(name), 1)
			fs.writeFileSync('./database/country/alliances.json', JSON.stringify(alliances, null, 2));
			fs.writeFileSync('./database/country/country_list.json', JSON.stringify(countries, null, 2));
			return interaction.editReply(`Successfully left ${name}!`);
		}
		if (subcommand == 'delete') {
			let name = interaction.options.getString('name');
			interaction.editReply(`Hold on, are you sure you want to delete this alliance? You'll still get the money from the bank directly to you. (y/n)`)
			const filter = m => (['y', 'n'].includes(m.content.toLowerCase()) && m.author.id == interaction.user.id)
			const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 30000 });

			collector.on('collect', async m => {
				if (m.content.toLowerCase() == 'n') return interaction.editReply('Alright then')
				else if (m.content.toLowerCase() == 'y') {
					delete alliances[name]
					countries[countryPlayer[interaction.user.id][0]].alliances.splice(countries[countryPlayer[interaction.user.id][0]].alliances.indexOf(name), 1)
					fs.writeFileSync('./database/country/alliances.json', JSON.stringify(alliances, null, 2));
					fs.writeFileSync('./database/country/country_list.json', JSON.stringify(countries, null, 2));
					return interaction.editReply(`Successfully deleted ${name}!`);
				}
			})
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
			for (i in alliances) {
				let profileEmbed = new EmbedBuilder()
					.setTitle(i)
					.setFields(
						{ name: "Leader", value: alliances[i].leader },
						{ name: "Rules", value: alliances[i].rules },
						{ name: "Members", value: alliances[i].members.join('\n') },
						{ name: "Bank", value: alliances[i].bank },
						{ name: "Withdraw Per Interval", value: alliances[i].settings.withdraw_per_interval, inline: true },
						{ name: "Interval Of Withdraw", value: alliances[i].settings.interval_of_withdraw, inline: true }
					)
					.setColor(misc.randomColor())
					.setTimestamp()
					.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: client.user.avatarURL() });
					embedList.push(profileEmbed)
			}
			paginationEmbed(interaction, embedList, buttonList)

		}
	},
};


