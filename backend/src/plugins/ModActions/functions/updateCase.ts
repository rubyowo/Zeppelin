import { Message } from "discord.js";
import { CaseTypes } from "../../../data/CaseTypes.js";
import { Case } from "../../../data/entities/Case.js";
import { sendErrorMessage, sendSuccessMessage } from "../../../pluginUtils.js";
import { CasesPlugin } from "../../../plugins/Cases/CasesPlugin.js";
import { LogsPlugin } from "../../Logs/LogsPlugin.js";
import { formatReasonWithAttachments } from "./formatReasonWithAttachments.js";

export async function updateCase(pluginData, msg: Message, args) {
  let theCase: Case | undefined;
  if (args.caseNumber != null) {
    theCase = await pluginData.state.cases.findByCaseNumber(args.caseNumber);
  } else {
    theCase = await pluginData.state.cases.findLatestByModId(msg.author.id);
  }

  if (!theCase) {
    sendErrorMessage(pluginData, msg.channel, "Case not found");
    return;
  }

  if (!args.note && msg.attachments.size === 0) {
    sendErrorMessage(pluginData, msg.channel, "Text or attachment required");
    return;
  }

  const note = formatReasonWithAttachments(args.note, [...msg.attachments.values()]);

  const casesPlugin = pluginData.getPlugin(CasesPlugin);
  await casesPlugin.createCaseNote({
    caseId: theCase.id,
    modId: msg.author.id,
    body: note,
  });

  pluginData.getPlugin(LogsPlugin).logCaseUpdate({
    mod: msg.author,
    caseNumber: theCase.case_number,
    caseType: CaseTypes[theCase.type],
    note,
  });

  sendSuccessMessage(pluginData, msg.channel, `Case \`#${theCase.case_number}\` updated`);
}
