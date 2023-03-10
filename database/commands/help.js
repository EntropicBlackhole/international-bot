const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { codeBlock } = require("@discordjs/builders");
const { Misc } = require('../bot/functions');
const misc = new Misc();
const path = require('node:path');
const fs = require('fs');

module.exports = {
	name: "Help",
	description: "Shows this description of commands!",
	usage: "",
	data: new SlashCommandBuilder()
		.setName("help")
		.setDescription("Shows this description of commands!"),
	async execute({ interaction, client }) {
		// let role = interaction.guild.members.cache.get("708026434660204625").roles.cache.get(role => role.id == '1046195813249982492');
		// client.guilds.cache.get(interaction.guild.id).members.cache.get(player).user.username
		// console.log(role)
		// role.setPermissions([PermissionsBitField.Flags.SendMessages])
		const commandFiles = fs.readdirSync(__dirname).filter(file => file.endsWith('.js'));
		const helpEmbed = new EmbedBuilder()
			.setTitle('List of commands!')
			.setColor(misc.randomColor())
			.setTimestamp()
			.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: client.user.avatarURL() });
		for (const file of commandFiles) {
			const filePath = path.join(__dirname, file);
			const command = require(filePath);

			//Parsing the actual command usage
			let usage = "";
			let squareBracketsRegex = /(?<=\[).*?(?=\])/g

			for (let i of command.usage.split('|'))
				if (i.includes('['))
					for (let j of i.match(squareBracketsRegex)[0].split(','))
						usage += `/${command.name.toLowerCase()} ${i.split('[')[0]} ${j}\n`
				else usage += `/${command.name.toLowerCase()} ${i}\n`
			helpEmbed.addFields([{
				name: command.name,
				value: codeBlock(`Description: ${command.description}\n\n${usage}`)
			}])
		}
		interaction.reply({ embeds: [helpEmbed] })
	}
}