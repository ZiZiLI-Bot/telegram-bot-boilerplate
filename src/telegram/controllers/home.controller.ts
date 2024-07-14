import axios from 'axios';
import { Action, Ctx, Message, On, Start, Update } from 'nestjs-telegraf';
import { Markup, Scenes } from 'telegraf';

type TRoles = {
  rules: {
    pathPattern: string;
    apiPath: string;
  }[];
};

type TActions = {
  title: string;
  icon: string;
  description: string;
  label: string;
  links: {
    actions: {
      label: string;
      href: string;
    }[];
  };
};

@Update()
export class HomeController {
  @Start()
  async onStart(@Ctx() ctx: Scenes.SceneContext) {
    await ctx.reply('Welcome to the Blinks Bot! Please send me a URL');
  }

  @On('text')
  async HearAllMessage(
    @Ctx() ctx: Scenes.SceneContext,
    @Message()
    msg: {
      message_id: number;
      text: string;
      reply_to_message: { message_id: number; text: string };
    },
  ) {
    try {
      // Get actions instructions from the Blinks URL
      const baseURL = new URL(msg.text);
      const { data: rule } = await axios.get<TRoles>(
        `https://${baseURL.hostname}/actions.json`,
      );
      const fixedPart =
        rule.rules[0].pathPattern.split('*')[0] + baseURL.search;
      const path = baseURL.pathname;
      const fixedPartIndex = path.indexOf(fixedPart);
      const remainingPath = path.substring(fixedPartIndex + fixedPart.length);

      // Get actions raw
      let actionURL = '';

      if (baseURL.hostname === 'dial.to') {
        actionURL = baseURL.searchParams
          .get('action')
          .replace('solana-action:', '');
      } else {
        actionURL =
          rule.rules[0].apiPath.split('/')[0] === 'https:'
            ? rule.rules[0].apiPath.split('*')[0] +
              (remainingPath + baseURL.search).trim()
            : `https://${baseURL.hostname}${rule.rules[0].apiPath.split('*')[0]}${(remainingPath + baseURL.search).trim()}`;
      }

      const { data: action } = await axios.get<TActions>(actionURL);

      // render actions
      const keyboard = Markup.inlineKeyboard(
        action.links.actions.map((act) => [
          Markup.button.callback(act.label, 'action_' + act.label),
        ]),
      );
      await ctx.replyWithPhoto(action.icon, {
        ...keyboard,
        caption: `
        *${action.title}*
        ${action.description}
        `,
        parse_mode: 'Markdown',
      });

      return;
    } catch (e) {
      console.log(e);
      await ctx.reply('Invalid URL');
      return;
    }
  }

  @Action(/action_(.*)/)
  async handleButtonActions(
    @Ctx()
    ctx: Scenes.SceneContext<Scenes.SceneSessionData> & { match: string[] },
  ) {
    const action = ctx.match[1];
    await ctx.reply(`You clicked on ${action}`);
  }
}
