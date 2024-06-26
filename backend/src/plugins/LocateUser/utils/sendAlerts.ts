import { Snowflake } from "discord.js";
import { GuildPluginData } from "knub";
import { resolveMember } from "../../../utils.js";
import { LocateUserPluginType } from "../types.js";
import { moveMember } from "./moveMember.js";
import { sendWhere } from "./sendWhere.js";

export async function sendAlerts(pluginData: GuildPluginData<LocateUserPluginType>, userId: string) {
  const triggeredAlerts = await pluginData.state.alerts.getAlertsByUserId(userId);
  const member = await resolveMember(pluginData.client, pluginData.guild, userId);
  if (!member) return;

  triggeredAlerts.forEach((alert) => {
    const prepend = `<@!${alert.requestor_id}>, an alert requested by you has triggered!\nReminder: \`${alert.body}\`\n`;
    const txtChannel = pluginData.guild.channels.resolve(alert.channel_id as Snowflake);
    if (txtChannel?.isTextBased()) {
      sendWhere(pluginData, member, txtChannel, prepend);
      if (alert.active) {
        moveMember(pluginData, alert.requestor_id, member, txtChannel);
      }
    }
  });
}
