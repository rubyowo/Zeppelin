import { User } from "discord.js";
import { GuildPluginData } from "knub";
import { LogType } from "../../../data/LogType.js";
import { createTypedTemplateSafeValueContainer } from "../../../templateFormatter.js";
import { UnknownUser } from "../../../utils.js";
import { userToTemplateSafeUser } from "../../../utils/templateSafeObjects.js";
import { LogsPluginType } from "../types.js";
import { log } from "../util/log.js";

export interface LogMemberTimedBanData {
  mod: User | UnknownUser;
  user: User | UnknownUser;
  banTime: string;
  caseNumber: number;
  reason: string;
  notifyResult: string | undefined;
}

export function logMemberTimedBan(pluginData: GuildPluginData<LogsPluginType>, data: LogMemberTimedBanData) {
  return log(
    pluginData,
    LogType.MEMBER_TIMED_BAN,
    createTypedTemplateSafeValueContainer({
      mod: userToTemplateSafeUser(data.mod),
      user: userToTemplateSafeUser(data.user),
      banTime: data.banTime,
      caseNumber: data.caseNumber,
      reason: data.reason,
      notifyResult: data.notifyResult,
    }),
    {
      userId: data.user.id,
      bot: data.user instanceof User ? data.user.bot : false,
    },
  );
}
