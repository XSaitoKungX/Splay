import { Category, RateLimit, TIME_UNIT } from '@discordx/utilities';
import { Bot, ButtonComponent, Guard, SimpleCommandMessage } from 'discordx';
import { Discord, SimpleCommand, SimpleCommandOption, SimpleCommandOptionType } from 'discordx';
import GuildDB from '../../database/models/guild.js';
import { bot } from '../../bot.js';
import { getPluginsBot } from '../../utils/config.js';
import filter from 'leo-profanity';

import { AttachmentBuilder, ButtonInteraction } from 'discord.js';
filter.loadDictionary('en');
import Topgg from '@top-gg/sdk';
import { Components } from '../../utils/components.js';
const api = new Topgg.Api(process.env.TOPGG_TOKEN!);
@Discord()
@Bot(...getPluginsBot('story'))
@Category('story')
@Guard(
  RateLimit(TIME_UNIT.seconds, 30, {
    rateValue: 3,
  }),
)
export class Story {
  @SimpleCommand({
    name: 'story generate',
    description: 'Create a AI generated story 🖌️',
  })
  async imagine(
    @SimpleCommandOption({
      name: 'prompt',
      description: 'What to write a story about?',
      type: SimpleCommandOptionType.String,
    })
    prompt: string | undefined,
    command: SimpleCommandMessage,
  ) {
    const ctx = command.message;
    prompt = command.argString;
    if (!ctx.guild) return;

    if (!prompt)
      return bot.extras.errUsage(
        {
          usage: 's+story generate <prompt>',
        },
        command,
      );

    let guild = await GuildDB.findOne({ Guild: ctx.guild.id });
    if (!guild)
      guild = new GuildDB({
        Guild: ctx.guild.id,
      });
    if (!(guild.isPremium === 'true')) {
      if (!(await api.hasVoted(ctx.author.id)))
        return ctx.reply({
          content:
            'Please **[vote](https://top.gg/bot/851061262943256578/votes)** for me to access this command and then try again. \n\n **Premium servers can bypass this**\n You can get premium for just **$3.99** [here](https://www.patreon.com/xsaitokungx) \n Or \n **Boost** my support [server](http://88.99.90.219:28013/support)',

          components: new Components()
            .addButton('Upvote', 'Link', 'https://top.gg/bot/851061262943256578/votes')
            .addButton('Premium', 'Link', 'http://88.99.90.219:28013/premium')
            .addButton('Support', 'Link', 'https://discord.gg/j4YwfmEtbx'),
        });
      if (filter.check(prompt))
        return ctx.reply({
          content:
            'This prompt is either profane, nfsw or both. \n\n **Premium servers can bypass this**\n You can get premium for just **$3.99** [here](https://www.patreon.com/xsaitokungx) \n Or \n **Boost** my support [server](http://88.99.90.219:28013/support)',
          components: new Components()
            .addButton('Premium', 'Link', 'http://88.99.90.219:28013/premium')
            .addButton('Support', 'Link', 'https://discord.gg/j4YwfmEtbx'),
        });
    }
    const id = ctx.id;
    const comp = new Components();
    comp.addButton('Choice 1', 'Secondary', 'generate-' + id + '-1');
    comp.addButton('Choice 2', 'Secondary', 'generate-' + id + '-2');
    comp.addButton('Choice 3', 'Secondary', 'generate-' + id + '-3');
    comp.addButton('Choice 4', 'Secondary', 'generate-' + id + '-4');

    ctx.reply({
      content: 'Generating...',
    });
    try {
      while (true) {
        const response = await (await fetch(`http://88.99.90.219:28013/chatbot/story?id=${id}&text=${prompt}`)).json();

        let image;
        try {
          image = new AttachmentBuilder(Buffer.from(response.image, 'base64'), {
            name: 'image0.png',
          });
        } catch {
          console.log('error with image');
        }

        const messageContent = response.story + '\n\n\n' + response.options.join('\n');
        const paragraphs = messageContent.split('\n\n');
        const contents: string[] = [''];

        for (let i = 0; i < paragraphs.length; i++) {
          const paragraph = paragraphs[i];
          const content = contents[contents.length - 1];

          const text = content + '\n\n' + paragraph;
          if (text.length > 1500) contents.push(paragraph);
          else contents[contents.length - 1] = text;
        }

        for (let i = 0; i < contents.length; i++) {
          if (i == 0 && i != contents.length - 1) {
            await ctx
              .reply({
                content: contents[i],
              })
              .catch((e) => {
                console.error(e);
              });
          } else if (i == contents.length - 1) {
            await ctx.channel
              .send({
                content: contents[i],
                files: image ? [image] : [],
                components: comp,
              })
              .catch((e) => {
                console.error(e);
              });
          } else {
            await ctx.channel
              .send({
                content: contents[i],
              })
              .catch((e) => {
                console.error(e);
              });
          }
        }

        return;
      }
    } catch (e) {
      console.error(e);
    }
  }

  @ButtonComponent({
    id: /generate-\d+-\d/gm,
  })
  async generate(ctx: ButtonInteraction) {
    ctx.reply({
      content: 'Generating...',
    });
    const ids = ctx.customId.split('-');
    const comp = new Components();
    comp.addButton('Choice 1', 'Secondary', 'generate-' + ids[1] + '-1');
    comp.addButton('Choice 2', 'Secondary', 'generate-' + ids[1] + '-2');
    comp.addButton('Choice 3', 'Secondary', 'generate-' + ids[1] + '-3');
    comp.addButton('Choice 4', 'Secondary', 'generate-' + ids[1] + '-4');

    const response = await (await fetch(`http://88.99.90.219:28013/chatbot/story?id=${ids[1]}&text=${ids[2]}`)).json();

    let image;
    try {
      image = new AttachmentBuilder(Buffer.from(response.image, 'base64'), {
        name: 'image0.png',
      });
    } catch {
      console.log('error with image');
    }
    const messageContent = response.story + '\n\n\n' + response.options.join('\n');
    const paragraphs = messageContent.split('\n\n');
    const contents: string[] = [''];

    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i];
      const content = contents[contents.length - 1];

      const text = content + '\n\n' + paragraph;
      if (text.length > 1500) contents.push(paragraph);
      else contents[contents.length - 1] = text;
    }

    for (let i = 0; i < contents.length; i++) {
      if (i == 0 && i != contents.length - 1) {
        await ctx.editReply({
          content: contents[i],
        });
      } else if (i == contents.length - 1) {
        if (i != 0)
          await ctx
            .channel!.send({
              content: contents[i],
              files: image ? [image] : [],
              components: comp,
            })
            .catch((e) => {
              console.error(e);
            });
        else
          await ctx.editReply({
            content: contents[i],
            files: image ? [image] : [],
            components: comp,
          });
      } else {
        await ctx
          .channel!.send({
            content: contents[i],
          })
          .catch((e) => {
            console.error(e);
          });
      }
    }

    await ctx.followUp({
      content: `<@${ctx.user.id}> Done!`,
    });
  }
}
