import { ActivityType, Embed } from "discord.js";
import { GuildPluginData } from "knub";
import { SavedMessage } from "../../../data/entities/SavedMessage.js";
import { renderUsername, resolveMember } from "../../../utils.js";
import { DeepMutable } from "../../../utils/typeUtils.js";
import { AutomodPluginType } from "../types.js";

type TextTriggerWithMultipleMatchTypes = {
  match_messages: boolean;
  match_embeds: boolean;
  match_visible_names: boolean;
  match_usernames: boolean;
  match_nicknames: boolean;
  match_custom_status: boolean;
  match_polls: boolean;
};

export type MatchableTextType = "message" | "embed" | "visiblename" | "username" | "nickname" | "customstatus" | "poll";

type YieldedContent = [MatchableTextType, string];

/**
 * Generator function that allows iterating through matchable pieces of text of a SavedMessage
 */
export async function* matchMultipleTextTypesOnMessage(
  pluginData: GuildPluginData<AutomodPluginType>,
  trigger: TextTriggerWithMultipleMatchTypes,
  msg: SavedMessage,
): AsyncIterableIterator<YieldedContent> {
  const member = await resolveMember(pluginData.client, pluginData.guild, msg.user_id);
  if (!member) return;

  if (trigger.match_messages && msg.data.content) {
    yield ["message", msg.data.content];
  }

  if (trigger.match_embeds && msg.data.embeds?.length) {
    const copiedEmbed: DeepMutable<Embed> = JSON.parse(JSON.stringify(msg.data.embeds[0]));
    if (copiedEmbed.video) {
      copiedEmbed.description = ""; // The description is not rendered, hence it doesn't need to be matched
    }
    yield ["embed", JSON.stringify(copiedEmbed)];
  }

  if (trigger.match_visible_names) {
    yield ["visiblename", member.displayName || msg.data.author.username];
  }

  if (trigger.match_usernames) {
    yield ["username", renderUsername(msg.data.author.username, msg.data.author.discriminator)];
  }

  if (trigger.match_nicknames && member.nickname) {
    yield ["nickname", member.nickname];
  }

  for (const activity of member.presence?.activities ?? []) {
    if (activity.type === ActivityType.Custom) {
      yield ["customstatus", `${activity.emoji} ${activity.name}`];
      break;
    }
  }

  if (trigger.match_polls && msg.data.poll) {
    yield ["poll", JSON.stringify(msg.data.poll)];
  }
}
