require("dotenv").config();

const express = require("express");
const { Client, Intents } = require("discord.js-selfbot-v13");
const fs = require("fs");

// Setup Express (for UptimeRobot keep-alive)
const app = express();
app.get("/", (req, res) => res.send("Bot is running!"));
app.listen(3000, () => console.log("🌍 Web server is live"));

// ====CONFIG=====
const TOKEN = process.env.TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID; //fem ch id
const USER_ID = process.env.USER_ID; //cg id
const NOTIFY_USER = process.env.NOTIFY_USER; //slowpoke user id
const LOG_FILE = "user_message_log.csv";
// ===============

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.MESSAGE_CONTENT, // Only works with v14; for v13 remove this line
    ],
    partials: ["CHANNEL"],
});

if (!fs.existsSync(LOG_FILE)) {
    fs.writeFileSync(LOG_FILE, "Timestamp,Channel,User,Message\n", {
        encoding: "utf8",
    });
}

client.once("ready", () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    if (message.channel.id === CHANNEL_ID && message.author.id === USER_ID) {
        const timestamp = new Date().toISOString();
        const channelName = message.channel.name;
        const userTag = `${message.author.tag}`;
        const content = message.content.replace(/"/g, '""');

        const logLine = `"${timestamp}","${channelName}","${userTag}","${content}"\n`;

        fs.appendFileSync(LOG_FILE, logLine, { encoding: "utf-8" });

        console.log(`💾 Logged: ${userTag} in #${channelName} at ${timestamp}`);

        try {
            const notifyUser = await client.users.fetch(NOTIFY_USER);
            await notifyUser.send(
                `🔔 **New Message Detected**\n👤 User: ${userTag}\n💬 Message: ${message.content}\n#️⃣ Channel: #${channelName}\n🕒 Time: ${timestamp}`,
            );
            console.log(`📩 Notified ${notifyUser.tag}`);
        } catch (err) {
            console.error("❌ Failed to send DM:", err);
        }
    }
});

client.login(TOKEN);
