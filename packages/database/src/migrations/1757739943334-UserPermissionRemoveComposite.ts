import type { MigrationInterface, QueryRunner } from 'typeorm';

export class UserPermissionRemoveComposite1757739943334 implements MigrationInterface {
    name = 'UserPermissionRemoveComposite1757739943334';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`users\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`diffs\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`diffs\` CHANGE \`applied_at\` \`applied_at\` datetime NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`links\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`tags\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`notes\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`workspaces\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`workspaces\` CHANGE \`description\` \`description\` text NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`user_permissions\` DROP FOREIGN KEY \`user_permissions_user_id_fk\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`user_permissions\` DROP FOREIGN KEY \`user_permissions_workspace_id_fk\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`user_permissions\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`user_permissions\` DROP PRIMARY KEY
        `);
        await queryRunner.query(`
            ALTER TABLE \`user_permissions\`
            ADD PRIMARY KEY (\`id\`, \`workspace_id\`)
        `);
        await queryRunner.query(`
            ALTER TABLE \`user_permissions\` DROP PRIMARY KEY
        `);
        await queryRunner.query(`
            ALTER TABLE \`user_permissions\`
            ADD PRIMARY KEY (\`id\`)
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX \`user_permissions_user_id_workspace_id\` ON \`user_permissions\` (\`user_id\`, \`workspace_id\`)
        `);
        await queryRunner.query(`
            ALTER TABLE \`user_permissions\`
            ADD CONSTRAINT \`user_permissions_user_id_fk\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`user_permissions\`
            ADD CONSTRAINT \`user_permissions_workspace_id_fk\` FOREIGN KEY (\`workspace_id\`) REFERENCES \`workspaces\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`user_permissions\` DROP FOREIGN KEY \`user_permissions_workspace_id_fk\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`user_permissions\` DROP FOREIGN KEY \`user_permissions_user_id_fk\`
        `);
        await queryRunner.query(`
            DROP INDEX \`user_permissions_user_id_workspace_id\` ON \`user_permissions\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`user_permissions\` DROP PRIMARY KEY
        `);
        await queryRunner.query(`
            ALTER TABLE \`user_permissions\`
            ADD PRIMARY KEY (\`id\`, \`workspace_id\`)
        `);
        await queryRunner.query(`
            ALTER TABLE \`user_permissions\` DROP PRIMARY KEY
        `);
        await queryRunner.query(`
            ALTER TABLE \`user_permissions\`
            ADD PRIMARY KEY (\`id\`, \`user_id\`, \`workspace_id\`)
        `);
        await queryRunner.query(`
            ALTER TABLE \`user_permissions\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`user_permissions\`
            ADD CONSTRAINT \`user_permissions_workspace_id_fk\` FOREIGN KEY (\`workspace_id\`) REFERENCES \`workspaces\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`user_permissions\`
            ADD CONSTRAINT \`user_permissions_user_id_fk\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`workspaces\` CHANGE \`description\` \`description\` text NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`workspaces\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`notes\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`tags\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`links\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`diffs\` CHANGE \`applied_at\` \`applied_at\` datetime NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`diffs\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            ALTER TABLE \`users\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL DEFAULT 'NULL'
        `);
    }
}
