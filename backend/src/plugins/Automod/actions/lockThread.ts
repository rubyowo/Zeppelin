import { AnyThreadChannel } from "discord.js";
import z from "zod/v4";
import { noop } from "../../../utils.js";
import { automodAction } from "../helpers.js";

export const LockThreadAction = automodAction({
  configSchema: z.strictObject({}),

  async apply({ pluginData, contexts }) {
    const threads = contexts
      .filter((c) => c.message?.channel_id)
      .map((c) => pluginData.guild.channels.cache.get(c.message!.channel_id))
      .filter((c): c is AnyThreadChannel => (c?.isThread() && c?.editable) ?? false);

    for (const thread of threads) {
      await thread.setLocked().catch(noop);
    }
  },
});
