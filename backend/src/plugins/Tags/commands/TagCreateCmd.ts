import { commandTypeHelpers as ct } from "../../../commandTypes";
import { sendErrorMessage, sendSuccessMessage } from "../../../pluginUtils";
import { parseTemplate, TemplateParseError } from "../../../templateFormatter";
import { tagsCmd } from "../types";

export const TagCreateCmd = tagsCmd({
  trigger: "tag",
  permission: "can_create",

  signature: {
    tag: ct.string(),
    body: ct.string({ catchAll: true }),
    alias: ct.bool({ option: true, isSwitch: true }),
  },

  async run({ message: msg, args, pluginData }) {
    const prefix = pluginData.config.get().prefix;

    if (args.alias) {
      if ((await pluginData.state.tags.find(args.tag)) || (await pluginData.state.tagaliases.find(args.tag))) {
        sendErrorMessage(pluginData, msg.channel, "A tag with that name already exists!");
        return;
      }
      const alias = await pluginData.state.tagaliases.find(args.body);
      if (alias) {
        await pluginData.state.tagaliases.createOrUpdate(args.tag, alias.tag, msg.author.id);
        sendSuccessMessage(
          pluginData,
          msg.channel,
          `Alias set! Use it with: \`${prefix}${args.tag}\`
**NOTE**: The tag you provided was an alias, however It\'s been corrected.`,
        );
        return;
      }
      await pluginData.state.tagaliases.createOrUpdate(args.tag, args.body, msg.author.id);
      sendSuccessMessage(pluginData, msg.channel, `Alias set! Use it with: \`${prefix}${args.tag}\``);
      return;
    }

    try {
      parseTemplate(args.body);
    } catch (e) {
      if (e instanceof TemplateParseError) {
        sendErrorMessage(pluginData, msg.channel, `Invalid tag syntax: ${e.message}`);
        return;
      } else {
        throw e;
      }
    }

    await pluginData.state.tags.createOrUpdate(args.tag, args.body, msg.author.id);

    sendSuccessMessage(pluginData, msg.channel, `Tag set! Use it with: \`${prefix}${args.tag}\``);
  },
});
