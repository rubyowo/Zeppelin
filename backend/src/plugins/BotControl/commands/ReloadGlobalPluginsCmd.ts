import { isStaffPreFilter } from "../../../pluginUtils.js";
import { getActiveReload, setActiveReload } from "../activeReload.js";
import { botControlCmd } from "../types.js";

export const ReloadGlobalPluginsCmd = botControlCmd({
  trigger: "bot_reload_global_plugins",
  permission: null,
  config: {
    preFilters: [isStaffPreFilter],
  },

  async run({ pluginData, message }) {
    if (getActiveReload()) return;

    const guildId = "guild" in message.channel ? message.channel.guild.id : null;
    if (!guildId) {
      void message.channel.send("This command can only be used in a server");
      return;
    }

    setActiveReload(guildId, message.channel.id);
    await message.channel.send("Reloading global plugins...");

    pluginData.getKnubInstance().reloadGlobalContext();
  },
});
