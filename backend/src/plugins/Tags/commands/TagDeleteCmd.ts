import { commandTypeHelpers as ct } from "../../../commandTypes";
import { tagsCmd } from "../types";
import { deleteTag } from "../util/deleteTag";

export const TagDeleteCmd = tagsCmd({
  trigger: "tag delete",
  permission: "can_create",

  signature: {
    tag: ct.string(),
  },

  async run({ message: msg, args, pluginData }) {
    deleteTag(pluginData, msg.channel, args.tag);
  },
});
