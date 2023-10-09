import { Category, PermissionGuard, RateLimit, TIME_UNIT } from '@discordx/utilities';
import { Bot, Guard, SimpleCommandMessage } from 'discordx';
import { Discord, SimpleCommand, SimpleCommandOption, SimpleCommandOptionType } from 'discordx';
import { bot } from '../../bot.js';
import { getPluginsBot } from '../../utils/config.js';
import { TextChannel } from 'discord.js';

@Discord()
@Bot(...getPluginsBot('embed'))
@Category('embed')
@Guard(
    RateLimit(TIME_UNIT.seconds, 30, {
        rateValue: 3,
    }),
    PermissionGuard(['ManageMessages']),
)
export class Embed {
    @SimpleCommand({
        name: 'createembed',
        aliases: ['embedcreate'],
        description: 'Create a custom embed. 📝',
    })
    async create(
        @SimpleCommandOption({
            name: 'channel',
            description: 'Channel to send the embed in.',
            type: SimpleCommandOptionType.Channel,
        })
        channel: TextChannel | undefined,
        command: SimpleCommandMessage,
    ) {
        if (!channel)
            return bot.extras.errUsage(
                {
                    usage: '+createembed <channel>',
                },
                command,
            );

        bot.extras.createInterface(command.message, '_ _', {
            callback: async (data) => {
                const config = await bot.extras.getEmbedConfig({
                    guild: command.message.guild!,
                    user: command.message.author,
                });
                channel.send(bot.extras.generateEmbedFromData(config, data));
                command.message.reply({ content: 'Successfully sent embed in ' + channel.toString() });
            },
        });
    }

    @SimpleCommand({
        name: 'editembed',
        description: 'Edit a message sent by me. 📝',
    })
    async editembed(
        @SimpleCommandOption({
            name: 'channel',
            description: 'Channel in which the message is in.',
            type: SimpleCommandOptionType.String,
        })
        channel: TextChannel | undefined,
        @SimpleCommandOption({
            name: 'messageid',
            description: 'The message id of the message to edit.',
            type: SimpleCommandOptionType.String,
        })
        messageId: string | undefined,
        command: SimpleCommandMessage,
    ) {
        if (!messageId || !channel)
            return bot.extras.errUsage(
                {
                    usage: '+editembed <channel> <messageid>',
                },
                command,
            );

        const message = await channel.messages.fetch(messageId);
        if (!message)
            return bot.extras.errNormal(
                {
                    error:
                        'No message found! \n Make sure the channel is the same channel as the message and the message id is correct',
                },
                command,
            );

        const embed = message.embeds && message.embeds.length > 0 ? message.embeds[0] : {};

        bot.extras.createInterface(command.message, '', {
            ...embed,
            content: message.content,
            callback: async (data) => {
                const config = await bot.extras.getEmbedConfig({
                    guild: command.message.guild!,
                    user: command.message.author,
                });
                message.edit(bot.extras.generateEmbedFromData(config, data));
                command.message.reply({ content: 'Successfully edited message. \n🔗 Link: ' + message.url });
            },
        });
    }

    @SimpleCommand({
        name: 'embedvariables',
        description: 'Different variables for you to use. 📝',
        aliases: ['embedvariable', 'variablesembed'],
    })
    async variables(command: SimpleCommandMessage) {
        bot.extras.embed(
            {
                title: `Variables for you to use.`,
                desc: `
            <:LMAO:867393923084320848> **User Variables**
           __Variable <:bluearrow:1140239016776695818> Description <:bluearrow:1140239016776695818> 
           \`{user:username}\` <:bluearrow:1140239016776695818> User's Name 
           \`{user:discriminator}\` <:bluearrow:1140239016776695818> User's Discriminator
           \`{user:tag}\` <:bluearrow:1140239016776695818> User's Tag
           \`{user:mention}\` <:bluearrow:1140239016776695818> User ping
           \`{user:invites}\` <:bluearrow:1140239016776695818> Number of users invited
           \`{user:invites:left}\` <:bluearrow:1140239016776695818> Number of users left after inviting
           \`{user:level}\` <:bluearrow:1140239016776695818> User's level
           \`{user:xp}\` <:bluearrow:1140239016776695818> User's xp
           \`{user:rank}\` <:bluearrow:1140239016776695818> User's rank
           \`{user:avatar}\` <:bluearrow:1140239016776695818> Link to user's avatar
           <a:flowersflower:1127289171891998882> **Inviter Variables** *The user who invited the user*
           \`{inviter:username}\` <:bluearrow:1140239016776695818> User's Name 
           \`{inviter:discriminator}\` <:bluearrow:1140239016776695818> User's Discriminator
           \`{inviter:tag}\` <:bluearrow:1140239016776695818> User's Tag
           \`{inviter:mention}\` <:bluearrow:1140239016776695818> User ping
           \`{inviter:invites}\` <:bluearrow:1140239016776695818> Number of users invited
           \`{inviter:invites:left}\` <:bluearrow:1140239016776695818> Number of users left after inviting
           \`{inviter:level}\` <:bluearrow:1140239016776695818> User's level
           \`{inviter:xp}\` <:bluearrow:1140239016776695818> User's xp
           \`{inviter:rank}\` <:bluearrow:1140239016776695818> User's rank
           \`{inviter:avatar}\` <:bluearrow:1140239016776695818> Link to user's avatar
           <:zerotwoheart:867393922207842304> **Server Variables**
           \`{guild:name}\` <:bluearrow:1140239016776695818> Server's Name
           \`{guild:owner}\` <:bluearrow:1140239016776695818> Ping to the server's owner
           \`{guild:members}\` <:bluearrow:1140239016776695818> Number of users in this server.
           \`{guild:tier}\` <:bluearrow:1140239016776695818> Server's boosting tier
           \`{guild:description}\` <:bluearrow:1140239016776695818> Server's description
           \`{guild:boosts}\` <:bluearrow:1140239016776695818>The number of boosts this server has
           \`{guild:rules}\` <:bluearrow:1140239016776695818> The ping of the channel setup for rules
           \`{guild:icon}\` <:bluearrow:1140239016776695818> Link to server's icon
           \`{guild:banner}\` <:bluearrow:1140239016776695818> Link to server's banner
  
  
           **Remove remove this click on \`Set/Delete Description\` and then send \`cancel\`.**
          `,
            },
            command,
        );
    }
}
