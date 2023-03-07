const { ReactionRole } = require("discordjs-reaction-role");
const fs = require('node:fs');
const path = require('node:path');
const { Client, EmbedBuilder, Events, GatewayIntentBits, Partials, Routes, REST, Collection, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");
const config = require("./database/bot/config.json");
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
const database = new Database(client)
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
	// console.log(await database.postData('country_list', JSON.parse(fs.readFileSync('./database/country/country_list.json'))))
	const reactionRoles = await database.getData('reaction-roles')
	rr = new ReactionRole(client, reactionRoles);
	misc.produceInterval(client)
});

client.on(Events.GuildMemberAdd, async member => {
	if (member.guild.id != '1046195813212225556') return
	for (let roleToAdd of database.getData('autoroles')) member.roles.add(member.guild.roles.cache.find(role => role.id == roleToAdd))
	const welcomeEmbed = new EmbedBuilder()
		.setTitle('Welcome to International Headquarters!')
		.setDescription('Hello there! Welcome to IHQ! Check out these channels!\n\n<#1046195813925265484> Read the rules!\n<#1046195813925265486> Follow updates!\n<#1046195814114000926> Read all about our lore!\n<#1046195813925265487> What does each role do?\n<#1046195814114000928> Talk talk!\n<#1046195814114000933> Follow qotd!\n<#1046195814285979676> Roleplay with us!!\n<#1046195814466330640> Get your roles!!\n<#1046195814860599347> Have fun with me!\n<#1046195814466330637> Get perks with boosting!!')
		.setColor(misc.randomColor())
		.setTimestamp()
		.setFooter({ text: "Please report any bugs! Thanks! ^^", iconURL: client.user.avatarURL() });
	await client.channels.cache.get("1046195813925265483").send({ embeds: [welcomeEmbed] });
	await client.channels.cache.get('1046195814285979674').send('Hey! <@' + client.users.cache.find(user => user.id == member.user.id) + '>, do `/help` to get started!!')
});

client.on(Events.GuildMemberRemove, async member => {
	const countries = JSON.parse(fs.readFileSync('./database/country/country_list.json'))
	const playersCountry = JSON.parse(fs.readFileSync('./database/country/players_country.json'))
	const bank = JSON.parse(fs.readFileSync('./database/economy/bank.json'))
	const alliances = JSON.parse(fs.readFileSync('./database/country/alliances.json'))
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
	database.postData('bank', bank);
database.postData('bank', bank);
database.postData('bank', bank);
	
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
						.setStyle(ButtonStyle.Danger),
				);
			if (interaction.deferred == false) {
				await interaction.deferReply();
			}
			await interaction.editReply({ content: 'There was an error while executing this command!', ephemeral: true, components: [row] });

			client.on('interactionCreate', async i => {
				if (!i.isButton()) return;
				if (i.customId == 'show-error') {
					await interaction.followUp({ content: '```' + error + '```', ephemeral: true });
				}
			});
		}
	}
	else if (interaction.isAutocomplete()) {
		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		try {
			await command.autocomplete(interaction);
		} catch (error) {
			console.error(error);
		}
	}
});