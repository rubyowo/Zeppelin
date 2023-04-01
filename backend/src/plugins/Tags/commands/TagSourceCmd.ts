import moment from "moment-timezone";
import { commandTypeHelpers as ct } from "../../../commandTypes";
import { getBaseUrl, sendErrorMessage } from "../../../pluginUtils";
import { tagsCmd } from "../types";
import { deleteTag } from "../util/deleteTag";

export const TagSourceCmd = tagsCmd({
  trigger: "tag",
  permission: "can_create",

  signature: {
    tag: ct.string(),

    delete: ct.bool({ option: true, shortcut: "d", isSwitch: true }),
  },

  async run({ message: msg, args, pluginData }) {
    if (args.delete) {
      deleteTag(pluginData, msg.channel, args.tag);
      return;
    }

    const alias = await pluginData.state.tagaliases.find(args.tag);
    const tag = await pluginData.state.tags.find(alias?.tag || args.tag);

    if (!tag) {
      sendErrorMessage(pluginData, msg.channel, "No tag with that name");
      return;
    }

    const archiveId = await pluginData.state.archives.create(tag.body, moment.utc().add(10, "minutes"));
    const url = pluginData.state.archives.getUrl(getBaseUrl(pluginData), archiveId);

    msg.channel.send(`Tag source:\n${url}`);
  },
});
