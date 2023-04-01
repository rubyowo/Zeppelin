import { getRepository, Repository } from "typeorm";

import { BaseGuildRepository } from "./BaseGuildRepository";
import { TagAlias } from "./entities/TagAlias";

export class GuildTagAliases extends BaseGuildRepository {
  private tagaliases: Repository<TagAlias>;

  constructor(guildId) {
    super(guildId);
    this.tagaliases = getRepository(TagAlias);
  }

  async all(): Promise<TagAlias[]> {
    return this.tagaliases.find({
      where: {
        guild_id: this.guildId,
      },
    });
  }

  async find(alias): Promise<TagAlias | undefined> {
    return this.tagaliases.findOne({
      where: {
        guild_id: this.guildId,
        alias,
      },
    });
  }

  async findAllByTag(tag): Promise<TagAlias[] | null> {
    const aliasesForTag = await this.tagaliases.find({
      where: {
        guild_id: this.guildId,
        tag,
      },
    });
    return aliasesForTag.length > 0 ? aliasesForTag : null;
  }

  async createOrUpdate(alias, tag, userId) {
    const existingTagAlias = await this.find(alias);
    if (existingTagAlias) {
      await this.tagaliases
        .createQueryBuilder()
        .update()
        .set({
          tag,
          user_id: userId,
          created_at: () => "NOW()",
        })
        .where("guild_id = :guildId", { guildId: this.guildId })
        .andWhere("alias = :alias", { alias })
        .execute();
    } else {
      await this.tagaliases.insert({
        guild_id: this.guildId,
        user_id: userId,
        alias,
        tag,
      });
    }
  }

  async delete(alias) {
    await this.tagaliases.delete({
      guild_id: this.guildId,
      alias,
    });
  }
}
