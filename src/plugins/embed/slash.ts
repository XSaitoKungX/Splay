import { PermissionGuard, RateLimit, TIME_UNIT } from '@discordx/utilities';
import { Bot, Guard, SlashGroup } from 'discordx';
import { Discord, Slash, SlashOption } from 'discordx';

import { bot } from '../../bot.js';
import { getPluginsBot } from '../../utils/config.js';
import { ApplicationCommandOptionType, CommandInteraction, TextChannel } from 'discord.js';

@Discord()
@Bot(...getPluginsBot('embed'))
@Guard(
  RateLimit(TIME_UNIT.seconds, 30, {
    rateValue: 3,
  }),
  PermissionGuard(['ManageMessages']),
)
@SlashGroup({
  name: 'embed',
  description: 'Commands to edit and create embeds. 📝',
})
@SlashGroup('embed')
export class BumpReminder {
  @Slash({
    name: 'create',
    description: 'Create an embed. 📝',
  })
  async create(
    @SlashOption({
      name: 'channel',
      description: 'Channel to send the message in.',
      type: ApplicationCommandOptionType.Channel,
      required: true,
    })
    channel: TextChannel,
    command: CommandInteraction,
  ) {
    bot.extras.createInterface(command, '_ _', {
      callback: async (data) => {
        const config = await bot.extras.getEmbedConfig({
          guild: command.guild!,
          user: command.user,
        });
        channel.send(bot.extras.generateEmbedFromData(config, data));
        command.reply({ content: 'Successfully sent embed in ' + channel.toString() });
      },
    });
  }

  @Slash({
    name: 'edit',
    description: 'Edit a message sent by me. 📑',
  })
  async edit(
    @SlashOption({
      name: 'channel',
      description: 'Channel the message is in.',
      type: ApplicationCommandOptionType.Channel,
      required: true,
    })
    channel: TextChannel,
    @SlashOption({
      name: 'messageid',
      description: 'The id of the message to edit. 📑',
      type: ApplicationCommandOptionType.String,
      required: true,
    })
    messageId: string,
    command: CommandInteraction,
  ) {
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

    bot.extras.createInterface(command, '', {
      ...embed,
      content: message.content,
      callback: async (data) => {
        const config = await bot.extras.getEmbedConfig({
          guild: command.guild!,
          user: command.user,
        });
        message.edit(bot.extras.generateEmbedFromData(config, data));
        command.reply({ content: 'Successfully edited message. \n🔗 Link: ' + message.url });
      },
    });
  }

  @Slash({
    name: 'variables',
    description: 'Different variables for embeds. 📑',
  })
  async delete(command: CommandInteraction) {
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
