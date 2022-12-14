const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { ReactionRole } = require("discordjs-reaction-role");
const fs = require('fs');
const { Misc } = require('../bot/functions')
const misc = new Misc();

module.exports = {
	name: "Staff",
	description: "Only for staff, do not touch",
	usage: "server [reaction-roles, autoroles <role> <remove>]",
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
					.setRequired(true)))),
	async execute(interaction, client, rr) {
		let guild = client.guilds.cache.get(interaction.guild.id);
		let member = guild.members.cache.get(interaction.user.id);
		if (!member.roles.cache.has('1046195813229015180')) return interaction.reply({ content: "You can't use this command", ephemeral: true })

		let subcommandGroup = interaction.options.getSubcommandGroup();
		let subcommand = interaction.options.getSubcommand();
		
		if (subcommandGroup == 'server') {
			const autoroles = JSON.parse(fs.readFileSync('./database/server/autoroles.json'))
			let reactionRoles = JSON.parse(fs.readFileSync('./database/server/reaction-roles.json'))
			if (subcommand == 'reaction-roles') { 
				await interaction.deferReply();
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
					client.channels.cache.get(channel.id).send({ embeds: [rrEmbed] }).then((m) => {
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
						fs.writeFileSync('./database/server/reaction-roles.json', JSON.stringify(reactionRoles, null, 2))
						rr.teardown()
						reactionRoles = JSON.parse(fs.readFileSync('./database/server/reaction-roles.json'))
						rr = new ReactionRole(client, reactionRoles);
						return interaction.followUp('Created reaction roles! Check them out in <#' + channel + '>')
					})
				});
			}
			else if (subcommand == 'autoroles') { 
				let role = interaction.options.getRole('role');
				let remove = interaction.options.getBoolean('remove');

				if (!remove) autoroles.push(role.id); else autoroles.splice(autoroles.indexOf(role.id), 1);
				fs.writeFileSync('./database/server/autoroles.json', JSON.stringify(autoroles, null, 2));
				return interaction.reply(`Successfully put ${role.name} as an autorole!`)
			}
		}
	},
};