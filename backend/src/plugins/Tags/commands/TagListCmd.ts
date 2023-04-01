import escapeStringRegexp from "escape-string-regexp";
import { commandTypeHelpers as ct } from "../../../commandTypes";
import { createChunkedMessage } from "../../../utils";
import { tagsCmd } from "../types";

export const TagListCmd = tagsCmd({
    trigger: ["tag list", "tags", "taglist"],
    permission: "can_list",

    signature: {
        search: ct.string({ required: false }),
        noaliases: ct.boot({ option: true, switch: true }),
        aliasesfor: ct.string({ option: true, shortcut: "aliases" }),
    },

    async run({ message: msg, args, pluginData }) {
        const tags = await pluginData.state.tags.all();
        if (tags.length === 0) {
            msg.channel.send(`No tags created yet! Use \`tag create\` command to create one.`);
            return;
        }

        const prefix = (await pluginData.config.getForMessage(msg)).prefix;
        const searchRegex = args.search ? new RegExp([...args.search].map((s) => escapeStringRegexp(s)).join(".*")) : null;

        if (args.aliasesfor) {
            const tag = await pluginData.state.tags.find(args.aliasesfor);
            if (!tag) {
                msg.channel.send("That tag doesn't exist!");
                return;
            }

            const aliasesForTag = await pluginData.state.tagaliases.findAllByTag(args.aliasesfor);

            if (!aliasesForTag) {
                msg.channel.send("No aliases for that tag exist!");
                return;
            }

            const aliasesNames = aliasesForTag.map((alias) => alias?.alias).sort();
            const filteredTags = args.search ? aliasesNames.filter((tag) => searchRegex!.test(tag)) : aliasesNames;

            if (filteredTags.length === 0) {
                msg.channel.send("No aliases matched the filter");
                return;
            }

            const tagGroups = filteredTags.reduce((obj, tag) => {
                const tagUpper = tag.toUpperCase();
                const key = /[A-Z]/.test(tagUpper[0]) ? tagUpper[0] : "#";
                if (!(key in obj)) {
                    obj[key] = [];
                }
                obj[key].push(tag);
                return obj;
            }, {});

            const tagList = Object.keys(tagGroups)
                .sort()
                .map((key) => `[${key}] ${tagGroups[key].join(", ")}`)
                .join("\n");

            createChunkedMessage(
                msg.channel,
                `Available aliases for tag \`${tag.tag}\` (use with ${prefix}alias): \`\`\`${tagList}\`\`\``,
            );
            return;
        }

        const tagNames = tags.map((tag) => tag.tag).sort();

        const aliasNames = !args.noaliases
            ? (await pluginData.state.tagaliases.all()).map((alias) => `${alias.alias} (${alias.tag})`).sort()
            : [];
        const tagAndAliasNames = [...tagNames, ...aliasNames].sort();

        const filteredTags = args.search ? tagAndAliasNames.filter((tag) => searchRegex!.test(tag)) : tagAndAliasNames;

        if (filteredTags.length === 0) {
            msg.channel.send("No tags matched the filter");
            return;
        }

        const tagGroups = filteredTags.reduce((obj, tag) => {
            const tagUpper = tag.toUpperCase();
            const key = /[A-Z]/.test(tagUpper[0]) ? tagUpper[0] : "#";
            if (!(key in obj)) {
                obj[key] = [];
            }
            obj[key].push(tag);
            return obj;
        }, {});

        const tagList = Object.keys(tagGroups)
            .sort()
            .map((key) => `[${key}] ${tagGroups[key].join(", ")}`)
            .join("\n");

        createChunkedMessage(
            msg.channel,
            `Available tags ${args.noaliases ? "" : "(including aliases)"} (use with ${prefix}tag): \`\`\`${tagList}\`\`\``,
        );
    },
});
