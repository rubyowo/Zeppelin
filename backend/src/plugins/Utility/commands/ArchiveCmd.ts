import { Message, Snowflake } from "discord.js";
import { commandTypeHelpers as ct } from "../../../commandTypes";
import { SavedMessage } from "../../../data/entities/SavedMessage";
import { getBaseUrl, sendErrorMessage, sendSuccessMessage } from "../../../pluginUtils";
import { SECONDS, noop } from "../../../utils";
import { LogsPlugin } from "../../Logs/LogsPlugin";
import { utilityCmd } from "../types";

const ARCHIVE_COMMAND_DELETE_DELAY = 10 * SECONDS;

export const ArchiveCmd = utilityCmd({
  trigger: ["archive"],
  description: "Save a number of recent messages",
  usage: "!archive 20",
  permission: "can_archive",

  signature: {
    count: ct.number(),
    channel: ct.channelId({ option: true, shortcut: "c" }),
    user: ct.userId({ option: true, shortcut: "u" }),
    bots: ct.switchOption({ def: false, shortcut: "b" }),
    "to-id": ct.anyId({ option: true, shortcut: "id" }),
  },

  async run({ message: msg, args, pluginData }) {
    if (args.count <= 0) {
      sendErrorMessage(pluginData, msg.channel, `Archive count must be more than 1`); // TODO: Set a limit for this
      return;
    }
    const targetChannel = args.channel ? pluginData.guild.channels.cache.get(args.channel as Snowflake) : msg.channel;
    if (!targetChannel?.isTextBased()) {
      sendErrorMessage(pluginData, msg.channel, `Invalid channel specified`);
      return;
    }

    if (targetChannel.id !== msg.channel.id) {
      const configForTargetChannel = await pluginData.config.getMatchingConfig({
        userId: msg.author.id,
        member: msg.member,
        channelId: targetChannel.id,
        categoryId: targetChannel.parentId,
      });
      if (configForTargetChannel.can_archive !== true) {
        sendErrorMessage(pluginData, msg.channel, `Missing permissions to use archive on that channel`);
        return;
      }
    }

    const archivingMessage = msg.channel.send("Archiving...");

    const messagesToArchive: Message[] = [];
    let beforeId = msg.id;
    const upToMsgId = args["to-id"];
    let foundId = false;

    while (messagesToArchive.length < args.count) {
      const potentialMessages = await targetChannel.messages.fetch({
        before: beforeId,
        limit: 100,
      });
      if (potentialMessages.size === 0) break;

      const filtered: Message[] = [];
      for (const message of potentialMessages.values()) {
        if (args.user && message.author.id !== args.user) continue;
        if (args.bots && !message.author.bot) continue;
        if (upToMsgId != null && message.id < upToMsgId) {
          foundId = true;
          break;
        }
        filtered.push(message);
      }
      const remaining = args.count - messagesToArchive.length;
      const withoutOverflow = filtered.slice(0, remaining);
      messagesToArchive.push(...withoutOverflow);

      beforeId = potentialMessages.lastKey()!;
      if (foundId) {
        break;
      }
    }

    let responseMsg: Message | undefined;
    if (messagesToArchive.length > 0) {
      // Save to-be-archived messages that were missing from the database
      const existingStored = await pluginData.state.savedMessages.getMultiple(messagesToArchive.map((m) => m.id));
      const alreadyStored = existingStored.map((stored) => stored.id);
      const messagesToStore = messagesToArchive.filter((potentialMsg) => !alreadyStored.includes(potentialMsg.id));
      await pluginData.state.savedMessages.createFromMessages(messagesToStore);

      const savedMessagesToArchive = await pluginData.state.savedMessages.getMultiple(
        messagesToArchive.map((m) => m.id),
      );
      const savedMessages = Array.from(savedMessagesToArchive).sort((a: SavedMessage, b: SavedMessage) =>
        a.id > b.id ? 1 : -1,
      );

      // Create an archive
      const archiveId = await pluginData.state.archives.createFromSavedMessages(savedMessages, pluginData.guild);
      const baseUrl = getBaseUrl(pluginData);
      const archiveUrl = pluginData.state.archives.getUrl(baseUrl, archiveId);

      pluginData.getPlugin(LogsPlugin).logArchive({
        channel: targetChannel,
        count: savedMessages.length,
        archiveUrl,
      });

      let responseText = `Archived ${messagesToArchive.length} ${
        messagesToArchive.length === 1 ? "message" : "messages"
      }`;
      if (targetChannel.id !== msg.channel.id) {
        responseText += ` in <#${targetChannel.id}>: ${archiveUrl}`;
      }

      responseMsg = await sendSuccessMessage(pluginData, msg.channel, responseText);
    } else {
      const responseText = `Found no messages to archive!`;
      responseMsg = await sendErrorMessage(pluginData, msg.channel, responseText);
    }

    await (await archivingMessage).delete();

    if (targetChannel.id === msg.channel.id) {
      // Delete the !archive command and the bot response if a different channel wasn't specified
      // (so as not to spam the cleaned channel with the command itself)
      setTimeout(() => {
        msg.delete().catch(noop);
        responseMsg?.delete().catch(noop);
      }, ARCHIVE_COMMAND_DELETE_DELAY);
    }
  },
});
