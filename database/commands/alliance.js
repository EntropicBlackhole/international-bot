const { SlashCommandBuilder } = require('discord.js');

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
		if (subcommand == 'create') {
			let name = interaction.options.getString('name');
		}
		if (subcommand == 'join') {
			let name = interaction.options.getString('name');
		}
		if (subcommand == 'deposit') {
			let name = interaction.options.getString('name');
			let amount = interaction.options.getInteger('amount');
		}
		if (subcommand == 'withdraw') {
			let name = interaction.options.getString('name');
			let amount = interaction.options.getInteger('amount');
		}
		if (subcommandGroup == 'settings') {
			return interaction.editReply('This command is not finished yet')
			if (subcommand == 'list') {

			}
			if (subcommand == 'change') {
				let name = interaction.options.getString('name');
				let setting = interaction.options.getString('setting');
				let newValue = interaction.options.getString('new-value');
			}
		}
		if (subcommand == 'leave') {
			let name = interaction.options.getString('name');
		}
		if (subcommand == 'delete') {
			let name = interaction.options.getString('name');
		}
	},
};


