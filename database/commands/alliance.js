const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Misc, Alliance } = require('../bot/functions');
const misc = new Misc();
const alliance = new Alliance();

module.exports = {
	name: "Alliance",
	description: "Create, join leave and delete alliances!",
	usage: "create <name>|join <name>|deposit <name> <amount>|withdraw <name> <amount>|edit-rules <new-rules>|kick <member>|settings[list,change <name> <setting> <new-value>]|profile|list|leave <name>|delete <name>",
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
			.setDescription('Edit rules! (Use "\\n" without the quotes to make a new line (Like pressing enter))')
			.addStringOption(option => option
				.setName('name')
				.setDescription('Name of the alliance whom\'s rules to edit!')
				.setRequired(true))
			.addStringOption(option => option
				.setName('new-rules')
				.setDescription('New rules to set! (Use "\\n" without the quotes to make a new line (Like pressing enter))')
				.setRequired(true)))
		.addSubcommand(subcommand => subcommand
			.setName('kick')
			.setDescription('Kicks a member from the alliance!')
			.addStringOption(option => option
				.setName('name')
				.setDescription('Name of your alliance')
				.setRequired(true))
			.addUserOption(option => option
				.setName('user')
				.setDescription('User to kick from your alliance')
				.setRequired(true)))
		.addSubcommandGroup(subcommandGroup => subcommandGroup
			.setName('settings')
			.setDescription('Change/see your alliance\'s settings')
			.addSubcommand(subcommand => subcommand
				.setName('list')
				.setDescription('List of your alliances settings!')
				.addStringOption(option => option
					.setName('name')
					.setDescription('Name of the alliance whom\'s settings to list')
					.setRequired(true)))
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
					.setChoices(
						{ name: "Withdraw Per Interval", value: "withdraw_per_interval" },
						{ name: "Interval Of Withdraw", value: "interval_of_withdraw" }
					)
					.setRequired(true))
				.addIntegerOption(option => option
					.setName('new-value')
					.setDescription('New value of that setting (Interval is in miliseconds, do your maths)')
					.setRequired(true))))
		.addSubcommand(subcommand => subcommand
			.setName('profile')
			.setDescription('Profile of the desired alliance')
			.addStringOption(option => option
				.setName('name')
				.setDescription('Name of the desired alliance')
				.setRequired(true)))
		.addSubcommand(subcommand => subcommand
			.setName('list')
			.setDescription('Lists all the alliances!'))
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
	async execute({ interaction, client, database }) {
		await interaction.deferReply();

		const subcommand = interaction.options.getSubcommand();
		const subcommandGroup = interaction.options.getSubcommandGroup();

		const alliances = await database.getData('alliances')
		const countries = await database.getData('country_list')
		const playersCountry = await database.getData('players_country')
		const bank = await database.getData('bank')

		if ((playersCountry[interaction.user.id] == undefined) && (subcommand != 'list')) return interaction.editReply('You don\'t have a country')
		if (subcommand == 'create') {
			let name = interaction.options.getString('name');
			alliances[name] = alliance.create({
				name: name,
				leader: interaction.user.id
			});
			countries[playersCountry[interaction.user.id].mainland].alliances.push(name)
			await database.postData('alliances', alliances);
			await database.postData('country_list', countries);
			return interaction.editReply(`Successfully created ${name}! Check it out with \`/alliance profile\``);
		} //Finished
		if (subcommand == 'join') {
			let name = interaction.options.getString('name');
			if ([{}, undefined, null].includes(alliances[name])) return interaction.editReply(`"${name}" does not exist`);
			if (alliances[name].members.includes(interaction.user.id)) return interaction.editReply(`You are already in this alliance!`)
			alliances[name] = alliance.addMember({
				allianceObject: alliances[name],
				member: interaction.user.id
			})
			countries[playersCountry[interaction.user.id].mainland].alliances.push(name)
			await database.postData('alliances', alliances);
			await database.postData('country_list', countries);
			return interaction.editReply(`Successfully joined ${name}!`);
		} //Finished
		if (subcommand == 'deposit') {
			let name = interaction.options.getString('name');
			let amount = interaction.options.getInteger('amount');
			if ([{}, undefined, null].includes(alliances[name])) return interaction.editReply(`"${name}" does not exist`);
			if (bank[interaction.user.id] < amount) return interaction.editReply(`You don't have ${amount} IC in your bank, you only have ${bank[interaction.user.id]}`);
			let check = alliance.depositBank({
				allianceObject: alliances[name],
				amount: amount
			})
			if (check === -2) return interaction.editReply(`The amount cannot be negative!`);
			alliances[name] = check;
			bank[interaction.user.id] -= amount;
			await database.postData('alliances', alliances);
			await database.postData('bank', bank);
			return interaction.editReply(`Successfully deposited ${amount} to ${name}!`);
		} //Finished
		if (subcommand == 'withdraw') {
			let name = interaction.options.getString('name');
			let amount = interaction.options.getInteger('amount');
			if ([{}, undefined, null].includes(alliances[name])) return interaction.editReply(`"${name}" does not exist`);
			let check = alliance.withdrawBank({
				allianceObject: alliances[name],
				amount: amount,
				user: interaction.user.id
			})
			if (check === -2) return interaction.editReply(`The amount cannot be negative!`);
			if (check === -1) return interaction.editReply(`You cannot withdraw this amount, you can only withdraw ${alliances[name].settings.withdraw_per_interval}`)
			else if (check === 0) return interaction.editReply(`The bank does not have ${amount}, it only has ${alliances[name].bank}`)
			else if (check === 1) return interaction.editReply(`You have already withdrawed, please wait until you can withdraw again in ${misc.msToTime((alliances[name].lastWithdraw[interaction.user.id] + alliances[name].settings.interval_of_withdraw) - Date.now())}`)
			alliances[name] = check
			bank[interaction.user.id] += amount;
			await database.postData('alliances', alliances);
			await database.postData('bank', bank);
			return interaction.editReply(`Successfully withdrawn ${amount} from ${name}!`);
		} //Finished
		if (subcommand == 'edit-rules') {
			let name = interaction.options.getString('name');
			let newRules = interaction.options.getString('new-rules');
			if ([{}, undefined, null].includes(alliances[name])) return interaction.editReply(`"${name}" does not exist`);
			let check = alliance.changeRules({
				allianceObject: alliances[name],
				newRules: newRules,
				user: interaction.user.id
			})
			if (check === 0) return interaction.editReply(`You aren't the leader of this alliance`);
			alliances[name] = check
			await database.postData('alliances', alliances);
			return interaction.editReply(`Successfully updated the rules!`);
		} //Finished
		if (subcommand == 'kick') {
			let name = interaction.options.getString('name');
			let user = interaction.options.getUser('user');
			if ([{}, undefined, null].includes(alliances[name])) return interaction.editReply(`"${name}" does not exist`);
			if (alliances[name].leader != interaction.user.id) return interaction.editReply(`You aren't the leader of this alliance`);
			if (!alliances[name].members.includes(user.id)) return interaction.editReply(`This user is not in this alliance`);
			alliances[name] = alliance.removeMember({
				allianceObject: alliances[name],
				member: user.id
			})
			countries[playersCountry[user.id].mainland].alliances.splice(countries[playersCountry[user.id].mainland].alliances.indexOf(name), 1)
			await database.postData('alliances', alliances);
			await database.postData('country_list', countries);
			return interaction.editReply(`Successfully kicked ${user}!`);
		} //Finished
		if (subcommandGroup == 'settings') {
			if (subcommand == 'list') {
				let name = interaction.options.getString('name');
				if ([{}, undefined, null].includes(alliances[name])) return interaction.editReply(`"${name}" does not exist`);
				const settingsEmbed = new EmbedBuilder()
					.setTitle(name)
					.setFields(
						{ name: "Withdraw Per Interval", value: "\"" + alliances[name].settings.withdraw_per_interval.toString() + "\"" },
						{ name: "Interval Of Withdraw", value: "\"" + alliances[name].settings.interval_of_withdraw.toString() + "\" (" + misc.msToTime(alliances[name].settings.interval_of_withdraw.toString()) + ")" }
					)
					.setColor(misc.randomColor())
					.setTimestamp()
					.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: client.user.avatarURL() });
				return interaction.editReply({ embeds: [settingsEmbed] })
			}
			if (subcommand == 'change') {
				let name = interaction.options.getString('name');
				let setting = interaction.options.getString('setting');
				let newValue = interaction.options.getInteger('new-value');
				if ([{}, undefined, null].includes(alliances[name])) return interaction.editReply(`"${name}" does not exist`);
				let check = alliance.changeSettings({
					allianceObject: alliances[name],
					setting: setting,
					newValue: newValue,
					user: interaction.user.id
				})
				if (check == -2) return interaction.editReply('The new value cannot be negative')
				else if (check == -1) return interaction.editReply(`Please choose a valid setting to change`);
				else if (check == 0) return interaction.editReply(`You aren't the leader of this alliance`)
				alliances[name] = check;
				await database.postData('alliances', alliances);
				return interaction.editReply(`Successfully updated the settings!`);
			}
		} //Finished
		if (subcommand == 'profile') {
			let name = interaction.options.getString('name');
			if ([{}, undefined, null].includes(alliances[name])) return interaction.editReply(`"${name}" does not exist`);
			const profileEmbed = new EmbedBuilder()
				.setTitle(name)
				.setFields(
					{ name: "Leader", value: client.users.cache.find(user => user.id == alliances[name].leader).username },
					{ name: "Rules", value: (alliances[name].rules ? alliances[name].rules : "None") },
					{ name: "Members", value: alliances[name].members.map(member => client.users.cache.find(user => user.id == member).username).join('\n') },
					{ name: "Bank", value: alliances[name].bank.toString() },
					{ name: "Withdraw Per Interval", value: alliances[name].settings.withdraw_per_interval.toString() + ' IC', inline: true },
					{ name: "Interval Of Withdraw", value: misc.msToTime(alliances[name].settings.interval_of_withdraw.toString()), inline: true }
				)
				.setColor(misc.randomColor())
				.setTimestamp()
				.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: client.user.avatarURL() });
			return interaction.editReply({ embeds: [profileEmbed] });
		} //Finished
		if (subcommand == 'leave') {
			let name = interaction.options.getString('name');
			if ([{}, undefined, null].includes(alliances[name])) return interaction.editReply(`"${name}" does not exist`);
			alliances[name] = alliance.removeMember({
				allianceObject: alliances[name],
				member: interaction.user.id
			})
			countries[playersCountry[interaction.user.id].mainland].alliances.splice(countries[playersCountry[interaction.user.id].mainland].alliances.indexOf(name), 1)
			await database.postData('alliances', alliances);
			await database.postData('country_list', countries);
			return interaction.editReply(`Successfully left ${name}!`);
		} //Finished
		if (subcommand == 'delete') {
			let name = interaction.options.getString('name');
			if ([{}, undefined, null].includes(alliances[name])) return interaction.editReply(`"${name}" does not exist`);
			interaction.editReply(`Hold on, are you sure you want to delete this alliance? You'll still get the money from the bank directly to you. (y/n)`)
			const filter = m => (['y', 'n'].includes(m.content.toLowerCase()) && m.author.id == interaction.user.id)
			const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 30000 });

			collector.on('collect', async m => {
				if (m.content.toLowerCase() == 'n') return interaction.editReply('Alright then')
				else if (m.content.toLowerCase() == 'y') {
					bank[interaction.user.id] += alliances[name].bank
					for (member of alliances[name].members) countries[playersCountry[member].mainland].alliances.splice(countries[playersCountry[member].mainland].alliances.indexOf(name), 1)
					delete alliances[name]
					await database.postData('alliances', alliances);
					await database.postData('country_list', countries);
					await database.postData('bank', bank);
					return interaction.followUp(`Successfully deleted ${name}!`);
				}
			})
		} //Finished
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
						{ name: "Leader", value: client.users.cache.find(user => user.id == alliances[i].leader).username },
						{ name: "Rules", value: (alliances[i].rules ? alliances[i].rules : "None") },
						{ name: "Members", value: alliances[i].members.map(member => client.users.cache.find(user => user.id == member).username).join('\n') },
						{ name: "Bank", value: alliances[i].bank.toString() },
						{ name: "Withdraw Per Interval", value: alliances[i].settings.withdraw_per_interval.toString() + ' IC', inline: true },
						{ name: "Interval Of Withdraw", value: misc.msToTime(alliances[i].settings.interval_of_withdraw.toString()), inline: true }
					)
					.setColor(misc.randomColor())
					.setTimestamp()
					.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: client.user.avatarURL() });
				embedList.push(profileEmbed)
			}
			misc.paginationEmbed(interaction, embedList, buttonList)

		} //Finished
	},
};