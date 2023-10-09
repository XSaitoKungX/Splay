import express from 'express';
import { SplayBot } from '../utils/types';
import path from 'path';
export default function website(client: SplayBot) {
  const app = express();
  const port = 28103;

  app.use(express.json());
  app.use(express.static('./src/website/public'));
  app.set('view engine', 'ejs');

  const renderTemplate = (res: any, req: any, template: any, data = {}) => {
    const baseData = {
      options: {
        name: 'Splay',
        url: '',
        alert: null,
        alerterror: null,
      },
      guilds: client.guilds.cache.size,
      members: client.guilds.cache.reduce((a: any, b: any) => a + b.memberCount - 1, 0),
    };
    res.render(path.resolve(`./src/website/views/${template}`), Object.assign(baseData, data));
  };

  app.get('/', async (req, res) => {
    renderTemplate(res, req, 'index.ejs');
  });

  app.get('/invite', async (req, res) => {
    res.redirect(
      `https://discordapp.com/oauth2/authorize?client_id=${client.user!.id}&scope=bot&PermissionsBitField=8`,
    );
  });
  app.get('/invite/discord', async (req, res) => {
    res.redirect(
      `https://discordapp.com/oauth2/authorize?client_id=${client.user!.id}&scope=bot&PermissionsBitField=8`,
    );
  });
  app.get('/support', async (req, res) => {
    res.redirect('https://discord.gg/j4YwfmEtbx');
  });

  app.get('/privacy-policy', async (req, res) => {
    renderTemplate(res, req, 'privacy-policy.ejs');
  });

  app.get('/premium', async (req, res) => {
    renderTemplate(res, req, 'premium.ejs');
  });
  app.get('/recommended', async (req, res) => {
    renderTemplate(res, req, 'recommended.ejs');
  });
  app.listen(port, () => {
    return console.log(`http://88.99.90.219:28013:${port}`);
  });
}
