const { ReactionRole } = require("discordjs-reaction-role");
const fs = require('node:fs');
const path = require('node:path');
const { Client, EmbedBuilder, Events, GatewayIntentBits, Partials, Routes, REST, Collection, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");
const config = require("./database/bot/config.json");
const indexTable = require('./database/bot/indexTable.json')
const { Misc, Database } = require('./database/bot/functions')
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.GuildMessageReactions
	],
	partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});
const database = new Database({ client: client, indexTable: indexTable })
const misc = new Misc()

//Yes everything above is for starting up

//Upload all the commands
client.login((Buffer.from(config.clientID).toString('base64')).toString() + config.token)
const commands = [];
const commandsPath = path.join(__dirname, './database/commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
client.commands = new Collection();

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	commands.push(command.data.toJSON());
	client.commands.set(command.data.name, command);
}
const rest = new REST({ version: '10' }).setToken((Buffer.from(config.clientID).toString('base64')).toString() + config.token);
rest.put(Routes.applicationCommands(config.clientID), { body: commands })
	.then(data => console.log(`Successfully registered ${data.length} application commands.`))
	.catch(console.error);

//All event handlers
client.once(Events.ClientReady, async c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
	const reactionRoles = await database.getData('reaction-roles')
	rr = new ReactionRole(client, reactionRoles);
	// let countries = await database.getData('country_list');
	// for (country in countries) {
	// 	for (product in countries[country].products) {
	// 		countries[country].products[product] = Math.round(Math.random() * 100)
	// 		countries[country].produced[product] = 50;
	// 	}
	// }
	// await database.postData('country_list', countries)
});

client.on(Events.GuildMemberAdd, async member => {
	if (member.guild.id != '1046195813212225556') return
	for (let roleToAdd of await database.getData('autoroles')) member.roles.add(member.guild.roles.cache.find(role => role.id == roleToAdd))
	const welcomeEmbed = new EmbedBuilder()
		.setTitle('Welcome to International Headquarters!')
		.setDescription('Hello there! Welcome to IHQ! Check out these channels!\n\n<#1046195813925265484> Read the rules!\n<#1046195813925265486> Follow updates!\n<#1046195814114000926> Read all about our lore!\n<#1046195813925265487> What does each role do?\n<#1082506193634869379> I\'m new! What do I do to start?\n<#1046195814114000928> Talk talk!\n<#1046195814114000933> Follow qotd!\n<#1046195814285979676> Roleplay with us!!\n<#1046195814466330640> Get your roles!!\n<#1046195814860599347> Have fun with me!\n<#1046195814466330637> Get perks with boosting!!')
		.setColor(misc.randomColor())
		.setTimestamp()
		.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: client.user.avatarURL() });
	await client.channels.cache.get("1046195813925265483").send({ embeds: [welcomeEmbed] });
	await client.channels.cache.get('1046195814285979674').send('Hey! <@' + client.users.cache.find(user => user.id == member.user.id) + '>, do `/help` to get started!!')
});

client.on(Events.GuildMemberRemove, async member => {
	const countries = await database.getData('country_list');
	const playersCountry = await database.getData('players_country');
	const bank = await database.getData('bank');
	const alliances = await database.getData('alliances');
	if (playersCountry[member.user.id]) {
		for (country of playersCountry[member.user.id]) {
			countries[country].isTaken = false;
			countries[country].owner = "";
			for (let alliance of countries[country].alliances) if (alliances[alliance].leader == member.user.id) delete alliances[alliance]
			delete playersCountry[member.user.id];
		}
		for (let alliance in alliances) if (alliances[alliance].leader == member.user.id) delete alliances[alliance]
	}
	if (bank[member.user.id]) delete bank[member.user.id]
	database.postData('bank', bank);
	database.postData('country_list', countries);
	database.postData('players_country', playersCountry);
	database.postData('alliances', alliances);
});

client.on(Events.InteractionCreate, async interaction => {
	if (interaction.isChatInputCommand()) {
		const command = interaction.client.commands.get(interaction.commandName);
		if (!command) return;
		try {
			await command.execute({
				interaction: interaction,
				client: client,
				database: database,
				misc: misc,
				rr: rr
			});
		} catch (error) {
			// if (error == 'Error: Request failed with status code 400') return interaction.channel.send("Your prompt was considered invalid/offensive, please try again.")
			console.error(error);
			const row = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('show-error')
						.setLabel('Show error log')
						.setStyle(ButtonStyle.Danger));
			await interaction.channel.send({ content: 'There was an error while executing this command!', ephemeral: true, components: [row] });

			client.on('interactionCreate', async i => {
				if (!i.isButton()) return;
				else if (i.customId == 'show-error') await interaction.followUp({ content: '```' + error + '```', ephemeral: true });
			});
		}
	}
	else if (interaction.isAutocomplete()) {
		const command = interaction.client.commands.get(interaction.commandName);
		if (!command) return console.error(`No command matching ${interaction.commandName} was found.`);

		try {
			await command.autocomplete(interaction);
		} catch (error) {
			console.error(error);
		}
	}
});