import { Components } from './../../utils/components.js';
import { Category, PermissionGuard, RateLimit, TIME_UNIT } from '@discordx/utilities';
import {
  ArgsOf,
  Bot,
  ButtonComponent,
  Guard,
  On,
  SimpleCommand,
  SimpleCommandMessage,
  Slash,
  SlashGroup,
} from 'discordx';
import { Discord } from 'discordx';

import { getPluginsBot } from '../../utils/config.js';
import ChatbotShema from '../../database/models/chatbot-channel.js';
import GuildDB from '../../database/models/guild.js';
import { ButtonInteraction, Collection, CommandInteraction, Message, TextChannel } from 'discord.js';
import fs from 'fs';
import { createSetupWizard } from '../../utils/setupWizard.js';
import chatbotChannel from '../../database/models/chatbot-channel.js';
import { SplayBot } from '../../utils/types.js';

import { bot } from '../../bot.js';

import filter from 'leo-profanity';
import transcripts, { ExportReturnType } from 'discord-html-transcripts';
import { Schema } from 'mongoose';

filter.loadDictionary('en');
export const currentChatbotJobs: Collection<string, { userId: string; timer: NodeJS.Timeout }> = new Collection();

@Discord()
@Bot(...getPluginsBot('chatbot'))
@Category('setup')
@SlashGroup({
  name: 'setup',
  description: 'Various commands setup up my various features. 🛠️',
})
@SlashGroup('setup')
export class Chatbot {
  @Guard(
    RateLimit(TIME_UNIT.seconds, 30, {
      rateValue: 3,
    }),
    PermissionGuard(['ManageChannels']),
  )
  @SimpleCommand({
    name: 'setup chatbot',
    description: 'Set a channel for talking with me 💬',
  })
  async chatbotMessage(command: SimpleCommandMessage) {
    createSetupWizard(
      command,
      'Chatbot',
      {
        createCallback() { },
        options: [],
      },
      chatbotChannel,
    );
  }

  @Slash({
    name: 'chatbot',
    description: 'Set a channel for talking with me 💬',
  })
  @Guard(
    RateLimit(TIME_UNIT.seconds, 30, {
      rateValue: 3,
    }),
    PermissionGuard(['ManageChannels']),
  )
  async chatbotSlash(command: CommandInteraction) {
    createSetupWizard(
      command,
      'Chatbot',
      {
        createCallback() { },
        options: [],
      },
      chatbotChannel,
    );
  }

  @SimpleCommand({
    name: 'setup chatbotprofane',
    description: 'Toggle the chatbot ability to use swear words 🔥',
  })
  @Guard(
    RateLimit(TIME_UNIT.seconds, 30, {
      rateValue: 3,
    }),
    PermissionGuard(['ManageChannels']),
  )
  async chatbotProfane(command: SimpleCommandMessage) {
    let guild = await GuildDB.findOne({ Guild: command.message.guildId });
    if (!guild)
      guild = new GuildDB({
        Guild: command.message.guildId,
      });

    if (!(guild.isPremium === 'true')) {
      bot.extras.errNormal(
        {
          error:
            'This guild is not a premium. \n You can buy it for just $3.99 [here](https://www.patreon.com/xsaitokungx)',
        },
        command,
      );
    }

    let state = guild.chatbotFilter;
    state = !state;
    guild.chatbotFilter = state;
    await guild.save();
    bot.extras.succNormal(
      {
        text: `Succesfully set the chatbot filter to \`${state}\``,
      },
      command,
    );
  }

  @Slash({
    name: 'chatbotprofane',
    description: 'Toggle the chatbot ability to use swear words 🔥',
  })
  @Guard(
    RateLimit(TIME_UNIT.seconds, 30, {
      rateValue: 3,
    }),
    PermissionGuard(['ManageChannels']),
  )
  async chatbotProfaneSlash(command: CommandInteraction) {
    let guild = await GuildDB.findOne({ Guild: command.guildId });
    if (!guild)
      guild = new GuildDB({
        Guild: command.guildId,
      });
    let state = guild.chatbotFilter;
    state = !state;
    guild.chatbotFilter = state;
    await guild.save();
    bot.extras.succNormal(
      {
        text: `Succesfully set the chatbot filter to \`${state}\``,
      },
      command,
    );
  }

  @On()
  async messageCreate([message]: ArgsOf<'messageCreate'>, client: SplayBot) {
    if (message.author.bot || message.author.id === client.user!.id) return;

    const data = await client.extras.getChannel(ChatbotShema, message.guildId!, message.channel.id);

    if (!data) return;

    if (
      currentChatbotJobs.has(message.channel.id) &&
      currentChatbotJobs.get(message.channel.id)!.userId === message.author.id
    ) {
      currentChatbotJobs.get(message.channel.id)!.timer.refresh();
    } else if (currentChatbotJobs.has(message.channel.id)) {
      clearTimeout(currentChatbotJobs.get(message.channel.id)!.timer);
      currentChatbotJobs.delete(message.channel.id);
      message.channel.sendTyping();
      //wait for 3 seconds for old job to finish
      await new Promise((resolve) => setTimeout(resolve, 3000));
      currentChatbotJobs.set(message.channel.id, {
        userId: message.author.id,
        timer: setTimeout(() => currentChatbotJobs.delete(message.channel.id), 10000),
      });

      chabotJob(message, client);
    } else {
      currentChatbotJobs.set(message.channel.id, {
        userId: message.author.id,
        timer: setTimeout(() => currentChatbotJobs.delete(message.channel.id), 10000),
      });
      message.channel.sendTyping();
      chabotJob(message, client);
    }
  }
  @ButtonComponent({
    id: 'smartmode',
  })
  @Guard(
    RateLimit(TIME_UNIT.minutes, 1, {
      rateValue: 1,
      ephemeral: true,
    }),
    PermissionGuard(['ManageMessages'], {
      ephemeral: true,
    }),
  )
  async enableSmartMode(interaction: ButtonInteraction) {
    await interaction.reply({
      content: `Please wait... I'm checking premission`,
      ephemeral: true,
    });
    const isPremium = await bot.extras.isPremium(interaction.guildId!);
    if (!isPremium)
      return interaction.editReply({
        content:
          '**This is a PREMIUM only feature.**\n You can get premium for just **$3.99** [here](https://www.patreon.com/xsaitokungx) \n Or \n **Boost** my support [server](http://88.99.90.219:28013/support)',
      });
    else {
      const data = await bot.extras.getChannel(ChatbotShema, interaction.guildId!, interaction.channel!.id);
      if (!data)
        return interaction.editReply({
          content: 'This channel is not a Chatbot channel and hence I am unable to enable smart mode.',
        });
      data.Smart = true;
      data.save();

      return interaction.editReply({
        content: 'Successfully enabled smart mode.',
      });
    }
  }

  @ButtonComponent({
    id: 'disablesmartmode',
  })
  @Guard(
    RateLimit(TIME_UNIT.minutes, 1, {
      rateValue: 1,
      ephemeral: true,
    }),
    PermissionGuard(['ManageMessages'], {
      ephemeral: true,
    }),
  )
  async disableSmartMode(interaction: ButtonInteraction) {
    await interaction.reply({
      content: `Please wait... I'm checking premission`,
      ephemeral: true,
    });

    const data = await bot.extras.getChannel(ChatbotShema, interaction.guildId!, interaction.channel!.id);
    if (!data)
      return interaction.editReply({
        content: 'This channel is not a Chatbot channel and hence I am unable to enable smart mode.',
      });
    data.Smart = false;
    data.save();

    return interaction.editReply({
      content: 'Successfully disabled smart mode.',
    });
  }

  @ButtonComponent({
    id: 'sharechatbot',
  })
  @Guard(
    RateLimit(TIME_UNIT.minutes, 1, {
      rateValue: 1,
      ephemeral: true,
    }),
    PermissionGuard(['ManageMessages'], {
      ephemeral: true,
    }),
  )
  sharechatbot(interaction: ButtonInteraction) {
    const components = new Components();
    components.addButton('confirm', 'Secondary', 'confirmsharechatbot-' + interaction.message.id);
    interaction.reply({
      content: `Hi there.\n\n By procedding you agree to share the last **15** messages of this channel from that message with me onto a link which is available to **everyone.**`,
      components: components,
      flags: 1 << 6,
    });
  }

  @ButtonComponent({
    id: /confirmsharechatbot-/gm,
  })
  @Guard(
    RateLimit(TIME_UNIT.minutes, 1, {
      rateValue: 1,
      ephemeral: true,
    }),
    PermissionGuard(['ManageMessages'], {
      ephemeral: true,
    }),
  )
  async confirmsharechatbot(interaction: ButtonInteraction) {
    const messageId = interaction.customId.split('-')[1];
    await interaction.reply({
      content: `Please wait... I'm generating the link... ETA: 1 minute`,
      flags: 1 << 6,
    });

    const message = await interaction.channel!.messages.fetch(messageId);
    const msgs: Collection<string, Message> = (
      await interaction.channel!.messages.fetch({ limit: 15, before: `${message.id}` })
    ).sort((a, b) => a.createdTimestamp - b.createdTimestamp);

    msgs.set(messageId, message);

    const transcript = await transcripts.generateFromMessages(msgs, interaction.channel as unknown as TextChannel, {
      favicon: 'http://88.99.90.219:28013/logo.webp',
      footerText: 'Splay',
      poweredBy: false,
      returnType: ExportReturnType.String,
    });
    let randomId = Math.random().toString(36).substring(2, 20);
    try {
      if (fs.existsSync('./src/website/public/transcripts/' + randomId + '.html')) {
        randomId = Math.random().toString(36).substring(2, 20);
      }
    } catch (e) { }
    fs.writeFileSync('./src/website/public/transcripts/' + randomId + '.html', transcript);

    const link = `http://88.99.90.219:28013/transcripts/${randomId}.html`;

    const components = new Components();
    components.addButton('Link', 'Link', link);
    interaction.editReply({
      content: `Click the button below to share the link with everyone.`,
      components: components,
    });
  }

  @ButtonComponent({
    id: 'profane',
  })
  profaneButton(interaction: ButtonInteraction) {
    interaction.reply({
      content: `Hi there. It seems that I have quite a potty mouth. \n Premium servers can disable this using \`s+setup chatbotprofane\`. \n You can get premium for just **$3.99** [here](https://www.patreon.com/xsaitokungx) \n Or \n **Boost** my support [server](http://88.99.90.219:28013/support)`,
      flags: 1 << 6,
    });
  }
}

export async function chabotJob(message: Message, client: SplayBot) {
  if (message.author.bot || message.author.id === client.user!.id) return;

  while (true) {
    if (currentChatbotJobs.has(message.channel.id)) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } else break;
  }

  let guild = await GuildDB.findOne({
    Guild: message.guildId,
  });
  if (!guild) guild = new GuildDB({ Guild: message.guildId });

  const contexts: { content: string; name: string; type: string }[] = [];
  let m: Collection<string, Message> = new Collection();
  let msgs: Collection<string, Message> = new Collection();
  if (message.channel.messages.cache.size < 10) {
    m = (await message.channel.messages.fetch({ limit: 30 })).sort((a, b) => a.createdTimestamp - b.createdTimestamp);
  } else {
    m = message.channel.messages.cache.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
  }
  for (const [_id, msg] of m) {
    const lastMessage = msgs.last();

    if (
      lastMessage &&
      lastMessage.author.id == msg.author.id &&
      lastMessage.content &&
      lastMessage.content.length > 0
    ) {
      lastMessage.content += `\n${msg.content}`;
      msgs.set(lastMessage.id, lastMessage);
    } else {
      if (
        msg &&
        msg.content &&
        msg.content.length > 0 &&
        (msg.author.id != message.author?.id ? msg.createdTimestamp < message.createdTimestamp : true)
      )
        msgs.set(msg.id, msg);
    }
  }

  msgs = msgs.sort((a, b) => b.createdTimestamp - a.createdTimestamp);

  try {
    msgs.forEach((msg) => {
      msg = bot.extras.replaceMentions(msg);
      if (msg.content && msg.content.length > 0 && contexts.length < 10)
        contexts.push({
          content: msg.content,
          name: msg.author.username,
          type: msg.author.id != bot.user?.id ? 'user' : 'bot',
        });
    });
  } catch (e) {
    //ignore error
  }

  let smartMode = false;

  if (guild.isPremium === 'true') {
    const data = await bot.extras.getChannel(ChatbotShema, message.guildId!, message.channel!.id);
    if (data) smartMode = data.Smart!;
  }

  const url = `http://88.99.90.219:28013/chatbot`;

  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contexts: contexts, username: message.author.username, smart: smartMode }),
  };
  message.channel.sendTyping();
  fetch(url, options)
    .then((res) => res.text())
    .then(async (json) => {
      const s = [
        '\n\n\n **Check Out: Story Generation** \n `/story generate prompt:<your story idea>` \n\n || discord.gg/j4YwfmEtbx for more info ||',
      ];

      console.log(`BOT`.blue.bold, `>>`.white, `Chatbot Used`.red);

      const randomNumber = Math.floor(Math.random() * 30);
      json = randomNumber == 0 ? (json ?? '') + s[0] : json;
      const component = new Components();
      component.addButton('Upvote', 'Link', 'https://top.gg/bot/851061262943256578/votes');
      component.addButton('Support', 'Link', 'https://discord.gg/j4YwfmEtbx');
      component.addButton('Premium', 'Link', 'http://88.99.90.219:28013/premium');
      component.addButton('Commands', 'Link', 'http://88.99.90.219:28015/commands');
      component.addButton('Share', 'Secondary', 'sharechatbot');
      if (!smartMode) component.addButton('Enable Smart Mode', 'Secondary', 'smartmode');
      else component.addButton('Disable Smart Mode', 'Secondary', 'disablesmartmode');
      if (guild!.chatbotFilter) {
        if (filter.check(json)) {
          component.addButton('Why $$$$ ?', 'Secondary', 'profane');
          json = filter.clean(json, '$');
        }
      }

      message.reply({
        content: json.replace('@{{user}}', `${message.author}`),
        components: component,
      });
    });
}
