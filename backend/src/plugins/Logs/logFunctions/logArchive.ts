import { GuildTextBasedChannel } from "discord.js";
import { GuildPluginData } from "knub";
import { LogType } from "../../../data/LogType";
import { createTypedTemplateSafeValueContainer } from "../../../templateFormatter";
import { resolveChannelIds } from "../../../utils/resolveChannelIds";
import { channelToTemplateSafeChannel } from "../../../utils/templateSafeObjects";
import { LogsPluginType } from "../types";
import { log } from "../util/log";

interface LogArchiveData {
  channel: GuildTextBasedChannel;
  count: number;
  archiveUrl: string;
}

export function logArchive(pluginData: GuildPluginData<LogsPluginType>, data: LogArchiveData) {
  return log(
    pluginData,
    LogType.ARCHIVE,
    createTypedTemplateSafeValueContainer({
      channel: channelToTemplateSafeChannel(data.channel),
      count: data.count,
      archiveUrl: data.archiveUrl,
    }),
    {
      ...resolveChannelIds(data.channel),
    },
  );
}
