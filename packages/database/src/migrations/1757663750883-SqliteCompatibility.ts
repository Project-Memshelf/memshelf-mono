import type { MigrationInterface, QueryRunner } from 'typeorm';

export class SqliteCompatibility1757663750883 implements MigrationInterface {
    name = 'SqliteCompatibility1757663750883';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`diffs\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`diffs\` DROP COLUMN \`applied_at\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`diffs\`
            ADD \`applied_at\` datetime NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`links\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`users\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`user_permissions\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`workspaces\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`workspaces\` CHANGE \`description\` \`description\` text NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`notes\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`notes\` DROP COLUMN \`content\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`notes\`
            ADD \`content\` text NOT NULL DEFAULT ''
        `);
        await queryRunner.query(`
            ALTER TABLE \`tags\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`tags\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`notes\` DROP COLUMN \`content\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`notes\`
            ADD \`content\` longtext NOT NULL DEFAULT ''''
        `);
        await queryRunner.query(`
            ALTER TABLE \`notes\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`workspaces\` CHANGE \`description\` \`description\` text NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`workspaces\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`user_permissions\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`users\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`links\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`diffs\` DROP COLUMN \`applied_at\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`diffs\`
            ADD \`applied_at\` timestamp NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`diffs\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL DEFAULT 'NULL'
        `);
    }
}
