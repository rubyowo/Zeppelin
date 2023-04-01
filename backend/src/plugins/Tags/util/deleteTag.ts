import { TextChannel } from "discord.js";
import { GuildPluginData } from "knub";

import { sendErrorMessage, sendSuccessMessage } from "../../../pluginUtils";
import { TagsPluginType } from "../types";

export async function deleteTag(pluginData: GuildPluginData<TagsPluginType>, channel: TextChannel, tagname: string) {
  const tag = await pluginData.state.tags.find(tagname);
  const alias = await pluginData.state.tagaliases.find(tagname);

  if (!tag && !alias) {
    sendErrorMessage(pluginData, channel, "No tag with that name.");
    return;
  }

  if (!tag) {
    await pluginData.state.tagaliases.delete(tagname);
    return sendSuccessMessage(pluginData, channel, "Alias deleted!");
  }

  const aliasesOfTag = await pluginData.state.tagaliases.findAllByTag(tagname);
  if (aliasesOfTag) {
    await Promise.all(aliasesOfTag.map((alias) => pluginData.state.tagaliases.delete(alias.alias)));
  }
  await pluginData.state.tags.delete(tagname);

  sendSuccessMessage(pluginData, channel, "Tag deleted!");
}
