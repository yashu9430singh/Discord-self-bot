require("dotenv").config();

const express = require("express");
const { Client, Intents } = require("discord.js-selfbot-v13");
const fs = require("fs");

// ================= EXPRESS SERVER =================
const app = express();
app.get("/", (req, res) => res.send("Bot is running!"));
app.listen(3000, () => console.log("🌍 Web server is live"));

// ================= CONFIG =================
const TOKEN = process.env.TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID; // Channel to monitor
const USER_ID = process.env.USER_ID; // User to monitor
const NOTIFY_USER = process.env.NOTIFY_USER; // User to notify via DM
const LOG_FILE = "user_message_log.csv";

// Ensure CSV file exists
if (!fs.existsSync(LOG_FILE)) {
    fs.writeFileSync(LOG_FILE, "Timestamp,Channel,User,Message\n", {
        encoding: "utf8",
    });
}

// ================= DISCORD CLIENT =================
const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
    ],
    partials: ["CHANNEL"],
});

client.once("ready", () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
});

// ================= MESSAGE LOGGING =================
client.on("messageCreate", async (message) => {
    // Ignore bots and self
    if (message.author.bot) return;

    if (message.channel.id === CHANNEL_ID && message.author.id === USER_ID) {
        const timestamp = new Date().toISOString();
        const channelName = message.channel.name;
        const userTag = `${message.author.tag}`;
        const content = message.content.replace(/"/g, '""');

        // Append to CSV
        const logLine = `"${timestamp}","${channelName}","${userTag}","${content}"\n`;
        fs.appendFileSync(LOG_FILE, logLine, { encoding: "utf-8" });

        console.log(`💾 Logged: ${userTag} in #${channelName} at ${timestamp}`);

        // Notify user via DM
        try {
            const notifyUser = await client.users.fetch(NOTIFY_USER);
            await notifyUser.send(
                `🔔 **New Message Detected**\n` +
                `👤 User: ${userTag}\n` +
                `💬 Message: ${message.content}\n` +
                `#️⃣ Channel: #${channelName}\n` +
                `🕒 Time: ${timestamp}`
            );
            console.log(`📩 Notified ${notifyUser.tag}`);
        } catch (err) {
            console.error("❌ Failed to send DM:", err);
        }
    }
});

// ================= LOGIN =================
client.login(TOKEN).catch(err => {
    console.error("❌ Failed to login:", err);
});
