const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { ReactionRole } = require("discordjs-reaction-role");
const { Misc } = require('../bot/functions')
const misc = new Misc();

module.exports = {
	name: "Staff",
	description: "Only for staff, do not touch",
	usage: "server[reaction-roles,autoroles <role> <remove?>]|warn[create <user> <reason?>,delete <id>,list]|appeal[create,list]|kill",
	data: new SlashCommandBuilder()
		.setName('staff')
		.setDescription('Staff Only')
		.addSubcommandGroup(subcommandGroup => subcommandGroup
			.setName('server')
			.setDescription('Server setup commands')
			.addSubcommand(subcommand => subcommand
				.setName('reaction-roles')
				.setDescription('Give me a list of roles and a list of emojis, and I\'ll figure the rest out')
				.addChannelOption(option => option
					.setName('channel-to-post-in')
					.setDescription('Channel to post this reaction role message in')
					.setRequired(true)))
			.addSubcommand(subcommand => subcommand
				.setName('autoroles')
				.setDescription('Add or remove an role to automatically place on a member upon joining')
				.addRoleOption(option => option
					.setName('role')
					.setDescription('Role to automatically place')
					.setRequired(true))
				.addBooleanOption(option => option
					.setName('remove')
					.setDescription('Do you want to remove instead of adding this role? True if yes')
					.setRequired(true))))
		.addSubcommandGroup(subcommandGroup => subcommandGroup
			.setName('warn')
			.setDescription('Uses the pentawarn system to warn users')
			.addSubcommand(subcommand => subcommand
				.setName('create')
				.setDescription('Create a warning')
				.addUserOption(option => option
					.setName('user')
					.setDescription('Who do you want to warn?')
					.setRequired(true))
				.addStringOption(option => option
					.setName('reason')
					.setDescription('Why do you want to warn this user?')))
			.addSubcommand(subcommand => subcommand
				.setName('delete')
				.setDescription('Delete a warning')
				.addIntegerOption(option => option
					.setName('id')
					.setDescription('ID of the warning')
					.setRequired(true)))
			.addSubcommand(subcommand => subcommand
				.setName('list')
				.setDescription('Lists all warnings in the server')))
		.addSubcommandGroup(subcommandGroup => subcommandGroup
			.setName('appeal')
			.setDescription('Appeal bans and make ban appeals!')
			.addSubcommand(subcommand => subcommand
				.setName('create')
				.setDescription('Create a new appeal request, why were you punished in the first place?')
				.addStringOption(option => option
					.setName('reason')
					.setDescription('Reason that you\'re appealing for')
					.setRequired(true)))
			.addSubcommand(subcommand => subcommand
				.setName('see')
				.setDescription('See in full description an appeal')
				.addUserOption(option => option
					.setName('user')
					.setDescription('ID of the appeal')
					.setRequired(true)))
			.addSubcommand(subcommand => subcommand
				.setName('accept')
				.setDescription('Accept an appeal, user will be invited back to the server')
				.addUserOption(option => option
					.setName('user')
					.setDescription('ID of the appeal')
					.setRequired(true)))
			.addSubcommand(subcommand => subcommand
				.setName('decline')
				.setDescription('Decline an appeal, user will be notified')
				.addUserOption(option => option
					.setName('user')
					.setDescription('ID of the appeal')
					.setRequired(true)))
			.addSubcommand(subcommand => subcommand
				.setName('list')
				.setDescription('Lists all of the appeals currently open')))
		.addSubcommand(subcommand => subcommand
			.setName('kill')
			.setDescription('Kills the bot!')),
	async execute({ interaction, client, rr, database }) {
		let guild = client.guilds.cache.get(interaction.guild.id);
		let member = guild.members.cache.get(interaction.user.id);
		let subcommandGroup = interaction.options.getSubcommandGroup();
		let subcommand = interaction.options.getSubcommand();
		if ((!member.roles.cache.has('1046195813229015180')) && (subcommandGroup != 'appeal' || subcommand != 'create')) return interaction.reply({ content: "You can't use this command", ephemeral: true })
		
		await interaction.deferReply();
		if (subcommandGroup == 'server') {
			const autoroles = await database.getData('autoroles')
			let reactionRoles = await database.getData('reaction-roles')
			if (subcommand == 'reaction-roles') {
				
				let channel = interaction.options.getChannel('channel-to-post-in')
				await interaction.editReply('Format your message like this:\n\n@Role|✅\n@Role2|❌\n@Role3|💠\n\nI\'ll give you 3 minutes')
				const filter = m => m.author.id == interaction.user.id;
				const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 180000 });

				collector.on('collect', m => {
					const rrEmbed = new EmbedBuilder()
						.setTitle('Get your reaction roles!')
						.setDescription(m.content.replaceAll('|', ": "))
						.setColor(misc.randomColor())
						.setTimestamp()
						.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: client.user.avatarURL() });
					let list = m.content.split('\n');
					client.channels.cache.get(channel.id).send({ embeds: [rrEmbed] }).then(async (m) => {
						for (i of list) {
							let role = i.split('|')[0].trim().replace(/\D/g, "");
							let emoji = i.split('|')[1].replace('\r', '').trim();
							m.react(emoji)
							reactionRoles.push({
								messageId: m.id,
								reaction: emoji,
								roleId: role
							})
						}
						await database.postData('reaction-roles', reactionRoles)
						rr.teardown()
						rr = new ReactionRole(client, reactionRoles);
						return interaction.followUp('Created reaction roles! Check them out in <#' + channel + '>')
					})
				});
			}
			else if (subcommand == 'autoroles') {
				let role = interaction.options.getRole('role');
				let remove = interaction.options.getBoolean('remove');

				if (!remove) autoroles.push(role.id); else autoroles.splice(autoroles.indexOf(role.id), 1);
				await database.postData('autoroles', autoroles);
				return interaction.reply(`Successfully put ${role.name} as an autorole!`)
			}
		}
		else if (subcommandGroup == 'warn') {
			const warns = await database.getData('warns');
			if (subcommand == 'create') {
				let user = interaction.options.getUser('user');
				let reason = interaction.options.getString('reason') ?? "No reason specified";
				let caseID = (warns.amount_of_total_warns + 1).toString()
				warns.amount_of_total_warns += 1
				if ([undefined, null, {}].includes(warns[user.id])) {
					warns[user.id] = {};
					await database.postData('warns', warns);
				}
				warns[user.id][caseID] = reason;
				if (Object.keys(warns[user.id]).length == 1) { var nextWarning = "Another warning" }
				else if (Object.keys(warns[user.id]).length == 2) { var nextWarning = "Being timed out for an hour" }
				else if (Object.keys(warns[user.id]).length == 3) { interaction.guild.members.cache.get(user.id).timeout(3600000); var nextWarning = "Kicked from the server" }
				else if (Object.keys(warns[user.id]).length == 4) { interaction.guild.members.cache.get(user.id).kick(); var nextWarning = "Banned from the server" }
				else if (Object.keys(warns[user.id]).length == 5) { interaction.guild.members.cache.get(user.id).ban(); var nextWarning = "There's no coming back now"; delete warns[user.id] }
				const warnEmbed = new EmbedBuilder()
					.setTitle('Warned ' + user.username)
					.setDescription(`Case ID: \`${caseID}\`\nReason: \`${reason}\`\nAmount of warnings: \`${Object.keys(warns[user.id]).length}\`\nNext punishment: \`${nextWarning}\``)
					.setColor(misc.randomColor())
					.setTimestamp()
					.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: client.user.avatarURL() });
				await database.postData('warns', warns);
				return interaction.reply({ embeds: [warnEmbed] })
			}
			else if (subcommand == 'delete') {
				let id = interaction.options.getInteger('id');
				for (i in warns) if (i != "amount_of_total_warns") for (j in warns[i]) if (parseInt(j) === id) { var userSaved = i; delete warns[i][j] }
				const warnEmbed = new EmbedBuilder()
					.setTitle(`Successfully deleted Case ID \`${id}\``)
					.setDescription(`From ${client.guilds.cache.get(interaction.guild.id).members.cache.get(userSaved).user.username}`)
					.setColor(misc.randomColor())
					.setTimestamp()
					.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: client.user.avatarURL() });
				await database.postData('warns', warns);
				return interaction.reply({ embeds: [warnEmbed] })
			}
			else if (subcommand == 'list') {
				let mainString = "";
				for (i in warns) if (i != "amount_of_total_warns") {
					mainString += client.guilds.cache.get(interaction.guild.id).members.cache.get(i).user.username + "\n```"
					for (j in warns[i]) {
						mainString += `#${j}: ${warns[i][j]}\n`
					}
					mainString += "```\n"
				}
				if (mainString == '') mainString = "None";
				const warnEmbed = new EmbedBuilder()
					.setTitle('Warning List')
					.setDescription(mainString)
					.setColor(misc.randomColor())
					.setTimestamp()
					.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: client.user.avatarURL() });
				interaction.reply({ embeds: [warnEmbed] })
			}
		}
		else if (subcommandGroup == 'appeal') {
			const appeals = await database.getData('appeals');
			if (subcommand == 'create') {
				// if (appeals[interaction.user.id]) return await interaction.reply('You have already created an appeal request, please wait until it gets reviewed'); //Commented out because what if mods forget
				let reason = interaction.options.getString('reason');
				let newAppeal = {
					reason: reason,
					time: Date.now()
				}
				appeals[interaction.user.id] = newAppeal;
				await database.postData('appeals', appeals);
				let appealEmbedToUser = new EmbedBuilder()
					.setTitle('Appeal created')
					.setDescription(`Your appeal has been created and sent to the moderators!`)
					.addFields({ name: interaction.user.username, value: '```' + reason + '```' })
					.setColor(misc.randomColor())
					.setTimestamp()
					.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: client.user.avatarURL() });
				await interaction.reply({ embeds: [appealEmbedToUser] })
				let appealEmbedToMods = new EmbedBuilder()
					.setTitle(`${interaction.user.username} has created an appeal request`)
					.addFields({ name: interaction.user.username, value: '```' + reason + '```' })
					.setColor(misc.randomColor())
					.setTimestamp()
					.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: client.user.avatarURL() });
				return client.channels.cache.get("1055682859777663026").send({ embeds: [appealEmbedToMods] });

			}
			if (subcommand == 'see') {
				let user = interaction.options.getUser('user');
				let appealEmbed = new EmbedBuilder()
					.setTitle(user.username)
					.setDescription(appeals[user.id].reason)
					.setColor(misc.randomColor())
					.setTimestamp(appeals[user.id].time)
					.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: client.user.avatarURL() });
				return interaction.reply({ embeds: [appealEmbed] })
			}
			if (subcommand == 'accept') {
				let user = interaction.options.getUser('user');
				delete appeals[user.id]
				await database.postData('appeals', appeals);
				try {
					interaction.guild.members.unban(user);
				} catch (e) {
					console.log(user)
					console.log(e)
				}
				let appealEmbed = new EmbedBuilder()
					.setTitle(user.username)
					.setDescription('Your appeal request has been accepted! Feel free to come back! https://discord.gg/WJGrVQkHcu')
					.setColor(misc.randomColor())
					.setTimestamp()
					.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: client.user.avatarURL() });
				await client.users.send(user.id, { embeds: [appealEmbed] });
				return interaction.reply('Notified user that their request was accepted!')
			}
			if (subcommand == 'decline') {
				let user = interaction.options.getUser('user');
				delete appeals[user.id]
				await database.postData('appeals', appeals);
				await client.users.send(user.id, "We're really sorry, your request appeal was declined, feel free to try again soon");
				return interaction.reply('Notified user that their request was declined!')
			}
			if (subcommand == 'list') {
				let appealList = [];
				for (i in appeals) appealList.push({ name: client.users.cache.find(user => user.id == i).username, value: '```' + appeals[i].reason + '```' })
				let appealEmbed = new EmbedBuilder()
					.setTitle('Appeal List')
					.setFields(...appealList)
					.setColor(misc.randomColor())
					.setTimestamp()
					.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: client.user.avatarURL() });
				interaction.reply({ embeds: [appealEmbed] })
			}
		}
		else if (subcommand == 'kill') {
			process.exit(0);
		}
	},
};