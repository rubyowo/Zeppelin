import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateTagAliasesTable1656591396528 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    queryRunner.createTable(
      new Table({
        name: "tagaliases",
        columns: [
          { name: "guild_id", type: "bigint", isPrimary: true },
          { name: "alias", type: "varchar", length: "64", isPrimary: true },
          { name: "tag", type: "varchar", length: "64", isPrimary: true },
          { name: "user_id", type: "bigint" },
          { name: "created_at", type: "datetime", default: "NOW()" },
        ],
        indices: [
          { columnNames: ["guild_id"] },
          { columnNames: ["alias"] },
          { columnNames: ["tag"] },
          { columnNames: ["user_id"] },
          { columnNames: ["created_at"] },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    queryRunner.dropTable("tagaliases");
  }
}
