require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers, 
        GatewayIntentBits.GuildMessages
    ],
    failIfNotExists: false,
    retryLimit: 5
});

const BASE_URL = "https://gdsc-vnrvjiet-backend-updated-tau.vercel.app/discord/users/";
const SECRET_KEY = "FBKNa5P4uqvRPULB";
const ALLOWED_CHANNEL_ID = "1305591660213702717";

const userVerificationState = new Map();

client.once("ready", () => {
    console.log("Bot is online!");
});

const fetchUserData = async (email) => {
    try {
        const response = await axios.get(`${BASE_URL}?email=${email}&secretKey=${SECRET_KEY}`);
        if (!response.data.payload || response.data.payload === null) {
            return null;
        }
        return response.data.payload;
    } catch (error) {
        console.error("Error fetching user data:", error);
        return null;
    }
};

client.on("interactionCreate", async interaction => {
    if (!interaction.isCommand()) return;

    if (interaction.channelId !== ALLOWED_CHANNEL_ID) {
        return interaction.reply({ 
            content: "Please use this command in the designated verification channel.",
            ephemeral: true 
        });
    }

    if (interaction.commandName === "verify") {
        const email = interaction.options.getString("email");
        
        const userData = await fetchUserData(email);
        
        if (!userData) {
            return interaction.reply({ 
                content: "No user found with that email.",
                ephemeral: true 
            });
        }

        userVerificationState.set(interaction.user.id, {
            email,
            userData,
            timestamp: Date.now()
        });

        return interaction.reply({ 
            content: "Email verified! Please use `/submit-otp` command with the OTP sent to your email.",
            ephemeral: true 
        });
    }

    if (interaction.commandName === "submit-otp") {
        const userState = userVerificationState.get(interaction.user.id);
        
        if (!userState) {
            return interaction.reply({ 
                content: "Please verify your email first using the `/verify` command.",
                ephemeral: true 
            });
        }

        if (Date.now() - userState.timestamp > 5 * 60 * 1000) {
            userVerificationState.delete(interaction.user.id);
            return interaction.reply({ 
                content: "Verification timeout. Please start over with `/verify`.",
                ephemeral: true 
            });
        }

        const otpInput = interaction.options.getString("otp");
        
        if (userState.userData.otp !== otpInput) {
            return interaction.reply({ 
                content: "Invalid OTP!",
                ephemeral: true 
            });
        }

        const rolesToAssign = userState.userData.domains.map(domain => {
            return interaction.guild.roles.cache.find(role => 
                role.name.toLowerCase() === domain.toLowerCase()
            );
        }).filter(role => role);

        if (rolesToAssign.length > 0) {
            try {
                const member = await interaction.guild.members.fetch(interaction.user.id);
                await member.roles.add(rolesToAssign);
                userVerificationState.delete(interaction.user.id);
                return interaction.reply({
                    content: `Successfully verified and roles assigned based on your interests: ${userState.userData.domains.join(", ")}`,
                    ephemeral: true
                });
            } catch (error) {
                console.error("Error assigning roles:", error);
                return interaction.reply({ 
                    content: "There was an error assigning roles. Please contact a server administrator for help.",
                    ephemeral: true 
                });
            }
        } else {
            userVerificationState.delete(interaction.user.id);
            return interaction.reply({ 
                content: "No valid roles found for your domains.",
                ephemeral: true 
            });
        }
    }
});

client.on("error", (error) => {
    console.error("Discord client error:", error);
    client.destroy();
    client.login(process.env.BOT_TOKEN);
});

client.on("disconnect", () => {
    console.log("Bot disconnected! Attempting to reconnect...");
    client.login(process.env.BOT_TOKEN);
});

process.on("unhandledRejection", (error) => {
    console.error("Unhandled promise rejection:", error);
});

process.on("uncaughtException", (error) => {
    console.error("Uncaught exception:", error);
});

client.login(process.env.BOT_TOKEN);
