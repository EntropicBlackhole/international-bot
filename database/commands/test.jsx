const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	name: "t",
	description: "est",
	usage: "test",
	data: new SlashCommandBuilder()
		.setName('test')
		.setDescription('test'),
	async execute(interaction, client) {
		client.channels.cache.forEach(channel => {
			if (channel.guild.id == '1046195813212225556' && channel.type == 0)
				console.log(channel.name)
		})
	},
};
