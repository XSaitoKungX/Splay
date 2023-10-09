import { dirname, importx } from '@discordx/importer';
import type { Interaction, Message } from 'discord.js';
import { ActivityType, IntentsBitField } from 'discord.js';
import permissions from './utils/permissions.js';
import { Client, MetadataStorage } from 'discordx';
import { ClusterClient, getInfo } from 'discord-hybrid-sharding';
import { connect } from './database/connect.js';
import { SplayBot } from './utils/types.js';

import chatBotSchema from './database/models/chatbot-channel.js';
import GuildDB from './database/models/guild.js';
import { getConfig } from './utils/config.js';
import colors from 'colors';
import dotenv from 'dotenv';
import { additionalProps } from './utils/extras.js';
import website from './website/index.js';
import filter from 'leo-profanity';
import { chabotJob, currentChatbotJobs } from './plugins/setup/chatbot.js';
import createDashboard from './dashboard/index.js';
filter.loadDictionary('en');
dotenv.config();
permissions();
connect();
const config = getConfig(process.env.DISCORD_TOKEN!)!;

// @ts-expect-error
export const bot: SplayBot = new Client({
    intents: [
        IntentsBitField.Flags.AutoModerationConfiguration,
        IntentsBitField.Flags.AutoModerationExecution,
        IntentsBitField.Flags.DirectMessageReactions,
        IntentsBitField.Flags.DirectMessageTyping,
        IntentsBitField.Flags.DirectMessages,
        IntentsBitField.Flags.GuildEmojisAndStickers,
        IntentsBitField.Flags.GuildIntegrations,
        IntentsBitField.Flags.GuildInvites,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessageReactions,
        IntentsBitField.Flags.GuildMessageTyping,
        IntentsBitField.Flags.GuildMessageTyping,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildModeration,
        IntentsBitField.Flags.GuildPresences,
        IntentsBitField.Flags.GuildScheduledEvents,
        IntentsBitField.Flags.GuildVoiceStates,
        IntentsBitField.Flags.GuildWebhooks,
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.MessageContent
    ],
    silent: true,
    simpleCommand: {
        prefix: async (message) => {
            if (process.env.DEV === 'true' && message.channelId != '1158461434880073859') return['fadfasdfasdfsadfsdfsd'];
            if (message.author.bot || message.author.id == bot.user?.id) return['fadfasdfasdfsadfsdfsd'];

            let guild = await GuildDB.findOne({
                Guild: message.guildId
            });

            if (!guild) guild = new GuildDB({ Guild: message.guildId });
            if (!guild.Prefix) {
                guild.Prefix = config.prefix;
                guild.save();
            }

            if (message.mentions.users.has(bot.botId)) {
                return [guild.Prefix, `<@!${bot.botId}>`, `<@${bot.botId}>`, ''];
            }

            return [guild.Prefix ?? config.prefix, `<@!${bot.user?.id}>`, `<@${bot.user?.id}>`];
        },
        responses: {
            async notFound(message) {
                if (message.author.bot || message.author.id === bot.user!.id) return;

                if (
                    currentChatbotJobs.has(message.channel.id) &&
                    currentChatbotJobs.get(message.channel.id)!.userId === message.author.id
                ) {
                    currentChatbotJobs.get(message.channel.id)!.timer.refresh();
                } else if (currentChatbotJobs.has(message.channel.id)) {
                    clearTimeout(currentChatbotJobs.get(message.channel.id)!.timer);
                    currentChatbotJobs.delete(message.channel.id);
                    message.channel.sendTyping();

                    // wait for 3 seconds for old job to finish
                    await new Promise((resolve) => setTimeout(resolve, 3000));
                    currentChatbotJobs.set(message.channel.id, {
                        userId: message.author.id,
                        timer: setTimeout(() => currentChatbotJobs.delete(message.channel.id), 10000),
                    });

                    chabotJob(message, bot);
                } else {
                    currentChatbotJobs.set(message.channel.id, {
                        userId: message.author.id,
                        timer: setTimeout(() => currentChatbotJobs.delete(message.channel.id), 10000),
                    });
                    
                    message.channel.sendTyping();
                    chabotJob(message, bot);
                }
            },
        },
    },
    shards: getInfo().SHARD_LIST,
    shardCount: getInfo().TOTAL_SHARDS,
    botId: config.name,
});

bot.config = config;
bot.cluster = new ClusterClient(bot);
bot.extras = additionalProps(bot);

bot.once('ready', async () => {
    await bot.initApplicationCommands();
    console.log(colors.green(`Bot has been successfully started as ${bot.config.name} and is ready for use`));

    bot.cluster!.send({ ready: true });
    async function updateTopGGStats() {
        console.log(colors.bgRed.red('Updating top.gg Stats...'));
        await fetch(`https://top.gg/api/bots/${bot.user!.id}/stats`, {
            method: 'POST',
            headers: { Authorization: process.env.TOPGG_TOKEN! },
            body: new URLSearchParams({
                server_count: `${bot.guilds.cache.size}`,
                shard_count: `${bot.cluster.info.TOTAL_SHARDS}`,
            }),
        }).then((res) => {
            res.text().then((data) => {
                console.log(data);
            });
        });
    }

    updateTopGGStats();

    setInterval(updateTopGGStats, 60 * 1000 * 10);

    if (bot.user!.username.includes('Splay')) {
        website(bot);
        createDashboard(bot);
    }
});

bot.on('shardReady', async (id) => {
    bot.user?.setPresence({
        status: 'online',
        activities: [
            {
                name: `${nFormatter(bot.guilds.cache.size, 2)} ${bot.guilds.cache.size > 1 ? 'servers' : 'server'} | Shard ${id}`,
                type: ActivityType.Watching,
            },
        ],
        afk: true,
        shardId: id,
    });

    setInterval(() => {
        bot.user?.setPresence({
            status: 'online',
            activities: [
                {
                    name: `${nFormatter(bot.guilds.cache.size, 2)} ${bot.guilds.cache.size > 1 ? 'servers' : 'server'} | Shard ${id}`,
                    type: ActivityType.Watching,
                },
            ],
            afk: true,
            shardId: id,
        });
    }, 60 * 1000 * 10);
});

bot.on('interactionCreate', async (interaction: Interaction) => {
    if (interaction.isCommand()) await interaction.deferReply();
    bot.executeInteraction(interaction);
});

bot.on('messageCreate', (message: Message) => {
    bot.executeCommand(message);
});

async function run() {
    await importx(`${dirname(import.meta.url)}/plugins/**/*.{ts,js}`);
    MetadataStorage.instance.build().then(() => {
        bot.login(config.token);
    });
}

run();

process.on('unhandledRejection', (reason: Error) => {
    if (
        reason.stack && (
            reason.stack.includes('Missing Access') ||
            reason.stack.includes('Missing Permissions') ||
            reason.stack.includes('Reaction Blocked') ||
            reason.stack.includes('Unknown Message')
        )
    )
    return;

    console.log('\n\n\n\n\n=== unhandled Rejection ==='.toUpperCase().yellow);
    console.log('Reason: ', reason.stack ? String(reason.stack) : String(reason));
    console.log('=== unhandled Rejection ===\n\n\n\n\n'.toUpperCase().yellow);
});

process.on('uncaughtException', (err) => {
    console.log('\n\n\n\n\n\n=== uncaught Exception ==='.toUpperCase().yellow);
    console.log('Exception: ', err.stack ? err.stack : err);
    console.log('=== uncaught Exception ===\n\n\n\n\n'.toUpperCase().yellow);
});

process.on('uncaughtExceptionMonitor', (err) => {
    if (
        err.stack && (
            err.stack.includes('Missing Access') ||
            err.stack.includes('Missing Permissions') ||
            err.stack.includes('Reaction Blocked') ||
            err.stack.includes('Unknown Message')
        )
    )
    return;

    console.log('=== uncaught Exception Monitor ==='.toUpperCase().yellow);
    console.log('Exception: ', err.stack ? err.stack : err);
    console.log('=== uncaught Exception Monitor ==='.toUpperCase().yellow);
});

const builtins = {
    log: console.log,
    warn: console.warn,
    error: console.error,
};

for (const printFunction in builtins) {
  //@ts-expect-error
  console[printFunction] = function () {
    // builtins[printFunction].apply(console, [...arguments]);
    try {
      const message = [...arguments]
        .reduce((accumulator, current) => `${accumulator}  ${current} `, '')
        .replace(/\s+$/, '')
        .toString()
        .split('\n');
      for (const line of message) {
        bot.cluster!.send({ log: line });
      }
    } catch (e) {
      console.error(e);
    }
  };
}

function nFormatter(num: number, digits: number) {
    const lookup = [
        { value: 1, symbol: '' },
        { value: 1e3, symbol: 'k' },
        { value: 1e6, symbol: 'M' },
        { value: 1e9, symbol: 'G' },
        { value: 1e12, symbol: 'T' },
        { value: 1e15, symbol: 'P' },
        { value: 1e18, symbol: 'E' },
    ];

    const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
    const item = lookup
        .slice()
        .reverse()
        .find(function (item) {
            return num >= item.value;
        });

    return item ? (num / item.value).toFixed(digits).replace(rx, '3.99€') + item.symbol : '0';
}