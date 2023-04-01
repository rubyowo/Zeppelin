import { GuildMember } from "discord.js";
import escapeStringRegexp from "escape-string-regexp";
import { ExtendedMatchParams, GuildPluginData } from "knub";
import { StrictMessageContent } from "../../../utils";
import { TagsPluginType, TTagCategory } from "../types";

import { renderTagFromString } from "./renderTagFromString";

interface BaseResult {
  renderedContent: StrictMessageContent;
  tagName: string;
}

type ResultWithCategory = BaseResult & {
  categoryName: string;
  category: TTagCategory;
};

type ResultWithoutCategory = BaseResult & {
  categoryName: null;
  category: null;
};

type Result = ResultWithCategory | ResultWithoutCategory;

export async function matchAndRenderTagFromString(
  pluginData: GuildPluginData<TagsPluginType>,
  str: string,
  member: GuildMember,
  extraMatchParams: ExtendedMatchParams = {},
): Promise<Result | null> {
  const config = await pluginData.config.getMatchingConfig({
    ...extraMatchParams,
    member,
  });

  // Hard-coded tags in categories
  for (const [name, category] of Object.entries(config.categories)) {
    const canUse = category.can_use != null ? category.can_use : config.can_use;
    if (canUse !== true) continue;

    const prefix = category.prefix != null ? category.prefix : config.prefix;
    if (prefix !== "" && !str.startsWith(prefix)) continue;

    const withoutPrefix = str.slice(prefix.length);

    for (const [tagName, tagBody] of Object.entries(category.tags)) {
      const regex = new RegExp(`^${escapeStringRegexp(tagName)}(?:\\s|$)`);
      if (regex.test(withoutPrefix)) {
        const renderedContent = await renderTagFromString(
          pluginData,
          str,
          prefix,
          tagName,
          category.tags[tagName],
          member,
        );

        if (renderedContent == null) {
          return null;
        }

        return {
          renderedContent,
          tagName,
          categoryName: name,
          category,
        };
      }
    }
  }

  // Dynamic and Aliased tags
  if (config.can_use !== true) {
    return null;
  }

  const tagPrefix = config.prefix;
  if (!str.startsWith(tagPrefix)) {
    return null;
  }

  const tagNameMatch = str.slice(tagPrefix.length).match(/^\S+/);
  if (tagNameMatch === null) {
    return null;
  }

  const tagName = tagNameMatch[0];
  const dynamicTag = await pluginData.state.tags.find(tagName);
  const aliasedTag = await pluginData.state.tagaliases.find(tagName);
  const tag = dynamicTag ?? (await pluginData.state.tags.find(aliasedTag?.tag));

  if (!tag) {
    return null;
  }

  const renderedTagContent = await renderTagFromString(pluginData, str, tagPrefix, tagName, tag.body, member);

  if (renderedTagContent == null) {
    return null;
  }

  return {
    renderedContent: renderedTagContent,
    tagName: tagName,
    categoryName: null,
    category: null,
  };
}
