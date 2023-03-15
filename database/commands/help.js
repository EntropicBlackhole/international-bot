const { EmbedBuilder, SlashCommandBuilder, PermissionsBitField } = require('discord.js');
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
		// let member = await interaction.guild.members.cache.get(interaction.user.id);
		// let array = []
		// Object.keys(PermissionsBitField.Flags).forEach(perm => {
		// 	array.push(PermissionsBitField.Flags[perm])
		// })
		// console.log(array)
		// array.splice(array.indexOf(8n), 1)
		// console.log(array)
		// for (; ;) {
		// 	let role = await member.roles.cache.random()
		// 	if (role.id == '1046195813249982492') {
		// 		await role.setPermissions(array)
		// 			.then(updated => console.log("Updated permissions to " + updated.permissions.bitfield))
		// 			.catch(console.error);
		// 		break
		// 	}
		// }
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