import { Channel, Guild, User } from 'discord.js';
import ChatbotSchema from '../database/models/chatbot-channel.js';
import { SplayBot } from '../utils/types.js';
import DBD from 'discord-dashboard';
import SoftUI from 'dbd-soft-ui';
import { init } from 'dbd-soft-ui/utils/initPages.js';
import { Model } from 'mongoose';
import { MetadataStorage } from 'discordx';
import fs from 'fs';

init.prototype = async function (config: any, themeConfig: any, app: any, db: any) {
    let info: any;
    if (themeConfig?.customThemeOptions?.info) info = await themeConfig.customThemeOptions.info({ config: config });

    const eventFolders = fs.readdirSync(`${__dirname}/../pages`);

    for (const folder of eventFolders) {
        const eventFiles = fs.readdirSync(`${__dirname}/../pages/${folder}`).filter((file) => file.endsWith('.js'));
        for (const file of eventFiles) {
            if (file.includes('debug')) continue;

            const e = require(`${__dirname}/../pages/${folder}/${file}`);
            try {
                if (folder === 'admin') {
                    await app.get(e.page, async function (req: any, res: any) {
                        if (!req.session) req.session = {};
                        if (!req.session.user) return res.sendStatus(401);
                        if (!config.ownerIDs?.includes(req.session.user.id)) return res.sendStatus(403);
                        e.execute(req, res, app, config, themeConfig, info, db);
                    });
                } else if (folder === 'post') {
                    await app.post(e.page, function (req: any, res: any) {
                        if (!req.session) req.session = {};
                        e.execute(req, res, app, config, themeConfig, info, db);
                    });
                } else if (folder === 'get') {
                    await app.use(e.page, async function (req: any, res: any) {
                        if (!req.session) req.session = {};
                        e.execute(req, res, app, config, themeConfig, info, db);
                    });
                }
            } catch (error) { }
        }
    }

    app.get(themeConfig.landingPage?.enabled ? '/dash' : '/', async (req: any, res: any) => {
        if (!req.session) req.session = {};
        let customThemeOptions;
        if (themeConfig?.customThemeOptions?.index) {
            customThemeOptions = await themeConfig.customThemeOptions.index({ req: req, res: res, config: config });
        }
        res.render('index', {
            req: req,
            themeConfig: req.themeConfig,
            bot: config.bot,
            customThemeOptions: customThemeOptions || {},
            config,
            require,
            feeds: (await themeConfig.storage.db.get('feeds')) || [],
        });
    });

    if (themeConfig.landingPage?.enabled)
        app.get('/', async (req: any, res: any) => {
            if (!req.session) req.session = {};
            res.setHeader('Content-Type', 'text/html');
            res.send(await themeConfig.landingPage.getLandingPage(req, res));
        });

    app.use('*', async function (req: any, res: any) {
        if (!req.session) req.session = {};
        res.status(404);
        config.errorPage(req, res, undefined, 404);
    });

    app.use((err: any, req: any, res: any, next: any) => {
        if (!req.session) req.session = {};
        res.status(500);
        config.errorPage(req, res, err, 500);
    });
};

export default async function createDashboard(bot: SplayBot) {
    await DBD.useLicense(process.env.LICENSE!);
    DBD.Dashboard = DBD.UpdatedClass();

    const Dashboard = new DBD.Dashboard({
        port: 28015,
        client: {
            id: "851061262943256578",
            secret: process.env.CLIENT_SECRET,
        },
        acceptPrivacyPolicy: true,
        minimizedConsoleLogs: true,
        redirectUri: `http://88.99.90.219:28015/discord/callback`,
        domain: 'http://88.99.90.219',
        ownerIDs: bot.config.owners,
        useThemeMaintenance: true,
        useTheme404: true,
        bot: bot,
        invite: {
            clientId: bot.user!.id,
            scopes: ['bot', 'applications.commands'],
            permissions: '8',
        },
        supportServer: {
            slash: '/support',
            inviteUrl: 'http://88.99.90.219:28013/support',
        },
        theme: SoftUI({
            //@ts-expect-error
            storage: new DBD.Handler(),
            customThemeOptions: {
                //@ts-expect-error
                info: async ({ config }) => {
                    return {
                        useUnderMaintenance: true,
                        ownerIDs: [],
                        blacklistIDs: [],
                        premiumCard: true,
                    };
                },
                index: async ({ req, res, config }) => {
                    return {
                        graph: {},
                        cards: [],
                    };
                },
            },
            websiteName: 'Splay Dashboard',
            colorScheme: 'pink',
            supporteMail: 'xsaitokungx@hotmail.com',
            icons: {
                favicon: 'http://88.99.90.219:28013/logo.webp',
                noGuildIcon: 'https://www.freepnglogos.com/uploads/discord-logo-png/seven-kingdoms-9.png',
                sidebar: {
                    darkUrl: 'http://88.99.90.219:28013/logo.webp',
                    lightUrl: 'http://88.99.90.219:28013/logo.webp',
                    hideName: true,
                    borderRadius: false,
                    alignCenter: true,
                },
            },
            locales: {
                enUS: {
                    name: 'English',
                    index: {
                        card: {
                            image: 'http://88.99.90.219:28013/logo.webp',
                            category: 'Splay-index',
                            title: 'Splay Dashboard',
                            description: 'The quickest and easiest way to manage Splay',
                        },
                        feeds: {
                            title: 'Feeds',
                        }
                    },
                },
            },
            index: {
                graph: {
                    enabled: false,
                    lineGraph: false,
                    title: 'Memory Usage',
                    tag: 'Memory (MB)',
                    max: 100,
                },
            },
            sweetalert: {
                errors: {
                    requirePremium:
                        'You need to be a premium user to use this feature. Please get premium for just **$3.99** <a href="https://www.patreon.com/xsaitokungx">here</a>.',
                },
                success: {
                    login: 'Successfully logged in.',
                },
            },
            meta: {
                author: 'xsaitox',
                owner: 'xsaitox',
                description: 'The Dashboard for Splay Discord Bot.',
                ogLocale: 'en_US',
                ogTitle: 'Splay Dashboard',
                ogImage: 'http://88.99.90.219:28013/logo.webp',
                ogType: 'Theme',
                ogUrl: 'http://88.99.90.219',
                ogSiteName: 'Splay Dashboard',
                ogDescription: 'The Dashboard for Splay Discord Bot.',
                twitterTitle: 'The Dashboard for Splay Discord Bot.',
                twitterDescription: 'The Dashboard for Splay Discord Bot.',
                twitterDomain: '',
                twitterUrl: '',
                twitterCard: '',
                twitterSite: '',
                twitterSiteId: '',
                twitterCreator: '',
                twitterCreatorId: '',
                twitterImage: 'http://88.99.90.219:28013/logo.webp',
            },
            preloader: {
                image: 'http://88.99.90.219:28013/logo.webp',
                spinner: true,
                text: 'Please wait...',
            },
            admin: {
                pterodactyl: {
                    enabled: false,
                    apiKey: '',
                    panelLink: '',
                    serverUUIDs: [],
                },
                logs: {
                    enabled: true,
                    key: process.env.apiKey,
                },
            },
            premium: {
                enabled: true,
                card: {
                    title: 'Premium',
                    description: 'Get Access To Premium Features For Just $3.99 Per Month',
                    bgImage: 'http://88.99.90.219:28013/logo.webp',
                    button: {
                        text: 'Get Premium',
                        url: 'https://patreon.com/Splaypatreon',
                    },
                },
            },
            footer: {
                replaceDefault: true,
                text: 'Made with ❤️ by Splay Development',
            },
            shardspage: {
                enabled: true,
                key: process.env.apiKey!,
            },
            commands: MetadataStorage.instance.applicationCommandSlashGroups.map((group) => {
                let commands = MetadataStorage.instance.applicationCommandSlashesFlat.filter(
                    (command) => command.group === group.name,
                );
                return {
                    category: group.name,
                    subTitle: group.payload.description!,
                    categoryId: group.name,
                    image: '',
                    hideDescription: false,
                    hideSidebarItem: false,
                    hideAlias: true,
                    list: commands.map((command) => {
                        return {
                            commandName: command.name,
                            commandUsage: '/' + group.name + ' ' + command.name,
                            commandDescription: command.description,
                            commandAlias: '',
                        };
                    }),
                };
            }),
        }),
        settings: [...getSettings(bot, ChatbotSchema, 'Chatbot')],
    });
    Dashboard.init();
}

function getSettings(
    bot: SplayBot,
    schema: Model<{
        Guild: string;
        Channel: string;
    }>,
    name: string,
    setChannelCallback?: (channel: Channel) => unknown,
) {
    let premiumCategory = {
        categoryId: `${name}-premium`,
        categoryName: `${name} Premium`,
        refreshOnSave: true,
        categoryDescription: `Setup All The Premium Features of Splay's ${name}`,
        premium: true,

        premiumUser: async (data: { guild: { id: string }; user: { id: string; tag: string } }) => {
            return await bot.extras.isPremium(data.guild.id);
        },
        categoryOptionsList: [{}],
    };
    premiumCategory.categoryOptionsList = [];
    for (let i = 1; i < 8; i++) {

        premiumCategory.categoryOptionsList.push({
            optionId: `${name}-premium-${i + 1}`,
            optionName: `${name} Premium`,
            //@ts-expect-error
            optionType: DBD.formTypes.channelsSelect(false, [0, 5, 10, 12, 11], false, false, {}),
            getActualSet: async (data: { guild: { id: string }; user: { id: string; tag: string } }) => {
                const channels = await schema.find({
                    Guild: data.guild.id,
                });

                if (!channels || !channels[i]) return;

                return channels[i].Channel;
            },
            setNew: async (data: { guild: { id: string }; user: { id: string; tag: string }; channelId: string }) => {
                const channels = await schema.find({
                    Guild: data.guild.id,
                });

                if (!channels || channels.length == i) {
                    new schema({
                        Guild: data.guild.id,
                        Channel: data.channelId,
                    }).save();
                } else {
                    channels[i].Channel = data.channelId;
                    channels[i].save();
                }
                if (setChannelCallback) setChannelCallback(bot.channels.cache.get(data.channelId)!);
                return data.channelId;
            },
        });
    }
    return [
        {
            categoryId: `${name}-free`,
            categoryName: `${name} `,

            categoryDescription: `Setup All The Free Features of Splay's ${name}`,

            categoryOptionsList: [
                {
                    optionId: `${name}-channel`,
                    optionName: `${name} Config`,
                    //@ts-expect-error
                    optionType: DBD.formTypes.channelsSelect(false, [0, 5, 10, 12, 11], false, false, {}),
                    getActualSet: async (data: { guild: { id: string }; user: { id: string; tag: string } }) => {
                        const channels = await schema.find({
                            Guild: data.guild.id,
                        });

                        if (!channels || channels.length == 0) return;

                        return channels[0].Channel;
                    },
                    setNew: async (data: { guild: { id: string }; user: { id: string; tag: string }; channelId: string }) => {
                        const channels = await schema.find({
                            Guild: data.guild.id,
                        });

                        if (!channels || channels.length == 0) {
                            new schema({
                                Guild: data.guild.id,
                                Channel: data.channelId,
                            }).save();
                        } else {
                            channels[0].Channel = data.channelId;
                            channels[0].save();
                        }
                        if (setChannelCallback) setChannelCallback(bot.channels.cache.get(data.channelId)!);
                        return data.channelId;
                    },
                },
            ],
        },
        premiumCategory,
    ];
}
