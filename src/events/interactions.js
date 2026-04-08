const { resolveCooldown, msToTime, setCooldown, isUsernameAsciiAlnum, detectInvalidCharType, isAccountLegacy, accountAgeInDays } = require('../utils/functions.js');

module.exports = {
	name: 'interactionCreate',
	execute: async (interaction, instance, client) => {
		var countCommand = false;

		if (interaction.user.bot) {
			interaction.reply({
				content: instance.getMessage(interaction, 'YOU_ARE_BOT'),
				ephemeral: true,
			});
			return;
		}

		if (instance._banned.includes(interaction.user.id)) {
			interaction.reply({
				content: instance.getMessage(interaction, 'YOU_ARE_BANNED'),
				ephemeral: true,
			});
			return;
		}

		if (interaction.isChatInputCommand() || interaction.isContextMenuCommand()) {
			const command = client.commands.get(interaction.commandName);

			// Security validation: block usernames that are not basic ASCII alphanumeric
			const username = interaction.user && interaction.user.username ? interaction.user.username : '';
			if (!isUsernameAsciiAlnum(username)) {
				const type = detectInvalidCharType(username);
				console.warn(`Security block: user ${interaction.user.id} username "${username}" blocked due to ${type}`);
				await interaction.reply({
					content:
						"⚠️ Erro de Segurança: Seu nome de usuário contém caracteres não suportados (acentos ou símbolos). Para garantir a integridade do banco de dados, apenas nomes no padrão ASCII básico podem resgatar Falcoins.",
					ephemeral: true,
				});
				return;
			}

			// Anti-Sybil: only legacy accounts (>= 1095 days) can use economy commands
			if (command && command.category === 'economy') {
				if (!isAccountLegacy(interaction.user)) {
					return interaction.reply({
						content:
							'🛡️ **Proteção Anti-Farm**: Para manter a economia do servidor estável e evitar operações de Sybil (contas descartáveis), apenas contas Legadas (com mais de 3 anos de registro no Discord) são elegíveis para resgatar Falcoins.',
						ephemeral: true,
					});
				}
			}

			if (command.cooldown) {
				cooldown = await resolveCooldown(interaction.user.id, interaction.commandName);
				if (cooldown > 0) {
					await interaction.reply({
						content: instance.getMessage(interaction, 'COOLDOWN', {
							COOLDOWN: msToTime(cooldown),
						}),
						ephemeral: true,
					});
					return;
				} else {
					await setCooldown(interaction.user.id, interaction.commandName, command.cooldown);
				}
			}

			if (command.developer && !instance.config.devs.includes(interaction.user.id)) {
				return interaction.reply({
					content: instance.getMessage(interaction, 'BOT_OWNERS_ONLY'),
					ephemeral: true,
				});
			}

			countCommand = true;

			command.execute({
				interaction,
				instance,
				client,
				member: interaction.member,
				guild: interaction.guild,
				user: interaction.user,
				channel: interaction.channel,
				database: instance.database,
			});
		} else if (interaction.isAutocomplete()) {
			const command = client.commands.get(interaction.commandName);
			command.autocomplete({ client, interaction, instance });
		} else if (interaction.isButton()) {
			//all button interactions are like the following: <command> <subcommand> <args>
			//but subcommand and args are optional
			const commandName = interaction.customId.split(' ')[0];
			const command = client.commands.get(commandName);

			if (command == undefined) return;

			try {
				var subcommand = interaction.options.getSubcommand();
			} catch {
				var subcommand = interaction.customId.split(' ')[1];
			}

			// Security validation: block usernames that are not basic ASCII alphanumeric (buttons)
			const usernameBtn = interaction.user && interaction.user.username ? interaction.user.username : '';
			if (!isUsernameAsciiAlnum(usernameBtn)) {
				const type = detectInvalidCharType(usernameBtn);
				console.warn(`Security block: user ${interaction.user.id} username "${usernameBtn}" blocked due to ${type}`);
				await interaction.reply({
					content:
						"⚠️ Erro de Segurança: Seu nome de usuário contém caracteres não suportados (acentos ou símbolos). Para garantir a integridade do banco de dados, apenas nomes no padrão ASCII básico podem resgatar Falcoins.",
					ephemeral: true,
				});
				return;
			}

			// Anti-Sybil: only legacy accounts (>= 1095 days) can use economy commands (buttons)
			if (command && command.category === 'economy') {
				if (!isAccountLegacy(interaction.user)) {
					return interaction.reply({
						content:
							'🛡️ **Proteção Anti-Farm**: Para manter a economia do servidor estável e evitar operações de Sybil (contas descartáveis), apenas contas Legadas (com mais de 3 anos de registro no Discord) são elegíveis para resgatar Falcoins.',
						ephemeral: true,
					});
				}
			}

			if (command.cooldown) {
				cooldown = await resolveCooldown(interaction.user.id, interaction.customId);
				if (cooldown > 0) {
					await interaction.reply({
						content: instance.getMessage(interaction, 'COOLDOWN', {
							COOLDOWN: msToTime(cooldown),
						}),
						ephemeral: true,
					});
					return;
				} else {
					await setCooldown(interaction.user.id, interaction.customId, command.cooldown);
				}
			}

			if (commandName == 'help') interaction.values = [null];

			countCommand = true;

			await command.execute({
				interaction,
				instance,
				client,
				member: interaction.member,
				guild: interaction.guild,
				user: interaction.user,
				channel: interaction.channel,
				database: instance.database,
				subcommand,
				args: interaction.customId.split(' ').slice(2),
			});
		} else if (interaction.isStringSelectMenu()) {
			const command = client.commands.get(interaction.customId.split(' ')[0]);

			if (command == undefined) return;

			// Security validation: block usernames that are not basic ASCII alphanumeric (select menu)
			const usernameSel = interaction.user && interaction.user.username ? interaction.user.username : '';
			if (!isUsernameAsciiAlnum(usernameSel)) {
				const type = detectInvalidCharType(usernameSel);
				console.warn(`Security block: user ${interaction.user.id} username "${usernameSel}" blocked due to ${type}`);
				await interaction.reply({
					content:
						"⚠️ Erro de Segurança: Seu nome de usuário contém caracteres não suportados (acentos ou símbolos). Para garantir a integridade do banco de dados, apenas nomes no padrão ASCII básico podem resgatar Falcoins.",
					ephemeral: true,
				});
				return;
			}

			// Anti-Sybil: only legacy accounts (>= 1095 days) can use economy commands (select)
			if (command && command.category === 'economy') {
				if (!isAccountLegacy(interaction.user)) {
					return interaction.reply({
						content:
							'🛡️ **Proteção Anti-Farm**: Para manter a economia do servidor estável e evitar operações de Sybil (contas descartáveis), apenas contas Legadas (com mais de 3 anos de registro no Discord) são elegíveis para resgatar Falcoins.',
						ephemeral: true,
					});
				}
			}

			countCommand = true;

			await command.execute({
				guild: interaction.guild,
				interaction,
				instance,
				member: interaction.member,
				client,
				user: interaction.user,
				channel: interaction.channel,
				database: instance.database,
				subcommand: interaction.customId.split(' ')[1],
			});
		}

		if (countCommand) {
			const player = await instance.database.player.findOne(interaction.user.id);
			player.stats.commands += 1;
			player.save();

			instance.achievement.sendAchievementMessage(
				interaction,
				interaction.user.id,
				instance.achievement.getById('touch_grass')
			);

			instance.achievement.sendAchievementMessage(
				interaction,
				interaction.user.id,
				instance.achievement.getById('no_life')
			);

			instance.achievement.sendAchievementMessage(
				interaction,
				interaction.user.id,
				instance.achievement.getById('one_in_a_million')
			);

			instance.achievement.sendAchievementMessage(
				interaction,
				interaction.user.id,
				instance.achievement.getById('seller')
			);
		}
	},
};
