const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
require('dotenv').config();

const commands = [
    new SlashCommandBuilder().setName("verify")
        .setDescription("Start the verification process")
        .addStringOption(option => 
            option.setName("email")
                .setDescription("Your registered email address")
                .setRequired(true)),
    new SlashCommandBuilder().setName("submit-otp")
        .setDescription("Submit OTP to complete verification")
        .addStringOption(option => 
            option.setName("otp")
                .setDescription("The OTP sent to your email")
                .setRequired(true))
]
    .map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(process.env.BOT_TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();
