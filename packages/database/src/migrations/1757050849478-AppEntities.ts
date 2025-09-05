import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AppEntities1757050849478 implements MigrationInterface {
    name = 'AppEntities1757050849478';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX \`users_email\` ON \`users\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`users\` CHANGE \`email\` \`api_key\` varchar(255) NOT NULL
        `);
        await queryRunner.query(`
            CREATE TABLE \`diffs\` (
                \`id\` varchar(36) NOT NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`deleted_at\` datetime(6) NULL,
                \`note_id\` varchar(255) NOT NULL,
                \`position\` int NOT NULL,
                \`length\` int NOT NULL DEFAULT '0',
                \`new_text\` text NOT NULL DEFAULT '',
                \`applied_at\` timestamp NULL,
                INDEX \`diffs_created_at\` (\`created_at\`),
                INDEX \`diffs_note_id\` (\`note_id\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`links\` (
                \`id\` varchar(36) NOT NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`deleted_at\` datetime(6) NULL,
                \`source_note_id\` varchar(255) NOT NULL,
                \`target_note_id\` varchar(255) NOT NULL,
                \`link_text\` varchar(500) NOT NULL,
                \`position\` int NOT NULL,
                INDEX \`links_created_at\` (\`created_at\`),
                INDEX \`links_source_note_id\` (\`source_note_id\`),
                INDEX \`links_target_note_id\` (\`target_note_id\`),
                UNIQUE INDEX \`links_source_note_id_target_note_id_position\` (\`source_note_id\`, \`target_note_id\`, \`position\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`user_permissions\` (
                \`user_id\` varchar(255) NOT NULL,
                \`workspace_id\` varchar(255) NOT NULL,
                \`can_write\` tinyint NOT NULL DEFAULT 0,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`user_id\`, \`workspace_id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`workspaces\` (
                \`id\` varchar(36) NOT NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`deleted_at\` datetime(6) NULL,
                \`name\` varchar(255) NOT NULL,
                \`description\` text NULL,
                INDEX \`workspaces_created_at\` (\`created_at\`),
                UNIQUE INDEX \`workspaces_name\` (\`name\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`notes\` (
                \`id\` varchar(36) NOT NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`deleted_at\` datetime(6) NULL,
                \`workspace_id\` varchar(255) NOT NULL,
                \`title\` varchar(500) NOT NULL,
                \`content\` longtext NOT NULL DEFAULT '',
                \`version\` int NOT NULL,
                INDEX \`notes_created_at\` (\`created_at\`),
                INDEX \`notes_workspace_id\` (\`workspace_id\`),
                INDEX \`notes_title\` (\`title\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`note_tags\` (
                \`note_id\` varchar(255) NOT NULL,
                \`tag_id\` varchar(255) NOT NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`note_id\`, \`tag_id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`tags\` (
                \`id\` varchar(36) NOT NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`deleted_at\` datetime(6) NULL,
                \`name\` varchar(100) NOT NULL,
                \`display_name\` varchar(100) NOT NULL,
                INDEX \`tags_created_at\` (\`created_at\`),
                UNIQUE INDEX \`tags_name\` (\`name\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            CREATE TABLE \`workspace_tags\` (
                \`workspace_id\` varchar(255) NOT NULL,
                \`tag_id\` varchar(255) NOT NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`workspace_id\`, \`tag_id\`)
            ) ENGINE = InnoDB
        `);
        await queryRunner.query(`
            ALTER TABLE \`users\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`users\` DROP COLUMN \`api_key\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`users\`
            ADD \`api_key\` varchar(255) NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`users\`
            ADD UNIQUE INDEX \`users_api_key\` (\`api_key\`)
        `);
        await queryRunner.query(`
            CREATE INDEX \`users_created_at\` ON \`users\` (\`created_at\`)
        `);
        await queryRunner.query(`
            ALTER TABLE \`diffs\`
            ADD CONSTRAINT \`diffs_note_id_fk\` FOREIGN KEY (\`note_id\`) REFERENCES \`notes\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`links\`
            ADD CONSTRAINT \`links_source_note_id_fk\` FOREIGN KEY (\`source_note_id\`) REFERENCES \`notes\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`links\`
            ADD CONSTRAINT \`links_target_note_id_fk\` FOREIGN KEY (\`target_note_id\`) REFERENCES \`notes\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`user_permissions\`
            ADD CONSTRAINT \`user_permissions_user_id_fk\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`user_permissions\`
            ADD CONSTRAINT \`user_permissions_workspace_id_fk\` FOREIGN KEY (\`workspace_id\`) REFERENCES \`workspaces\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`notes\`
            ADD CONSTRAINT \`notes_workspace_id_fk\` FOREIGN KEY (\`workspace_id\`) REFERENCES \`workspaces\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`note_tags\`
            ADD CONSTRAINT \`note_tags_note_id_fk\` FOREIGN KEY (\`note_id\`) REFERENCES \`notes\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`note_tags\`
            ADD CONSTRAINT \`note_tags_tag_id_fk\` FOREIGN KEY (\`tag_id\`) REFERENCES \`tags\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`workspace_tags\`
            ADD CONSTRAINT \`workspace_tags_workspace_id_fk\` FOREIGN KEY (\`workspace_id\`) REFERENCES \`workspaces\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE \`workspace_tags\`
            ADD CONSTRAINT \`workspace_tags_tag_id_fk\` FOREIGN KEY (\`tag_id\`) REFERENCES \`tags\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`workspace_tags\` DROP FOREIGN KEY \`workspace_tags_tag_id_fk\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`workspace_tags\` DROP FOREIGN KEY \`workspace_tags_workspace_id_fk\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`note_tags\` DROP FOREIGN KEY \`note_tags_tag_id_fk\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`note_tags\` DROP FOREIGN KEY \`note_tags_note_id_fk\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`notes\` DROP FOREIGN KEY \`notes_workspace_id_fk\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`user_permissions\` DROP FOREIGN KEY \`user_permissions_workspace_id_fk\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`user_permissions\` DROP FOREIGN KEY \`user_permissions_user_id_fk\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`links\` DROP FOREIGN KEY \`links_target_note_id_fk\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`links\` DROP FOREIGN KEY \`links_source_note_id_fk\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`diffs\` DROP FOREIGN KEY \`diffs_note_id_fk\`
        `);
        await queryRunner.query(`
            DROP INDEX \`users_created_at\` ON \`users\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`users\` DROP INDEX \`users_api_key\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`users\` DROP COLUMN \`api_key\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`users\`
            ADD \`api_key\` varchar(255) NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE \`users\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL DEFAULT 'NULL'
        `);
        await queryRunner.query(`
            DROP TABLE \`workspace_tags\`
        `);
        await queryRunner.query(`
            DROP INDEX \`tags_name\` ON \`tags\`
        `);
        await queryRunner.query(`
            DROP INDEX \`tags_created_at\` ON \`tags\`
        `);
        await queryRunner.query(`
            DROP TABLE \`tags\`
        `);
        await queryRunner.query(`
            DROP TABLE \`note_tags\`
        `);
        await queryRunner.query(`
            DROP INDEX \`notes_title\` ON \`notes\`
        `);
        await queryRunner.query(`
            DROP INDEX \`notes_workspace_id\` ON \`notes\`
        `);
        await queryRunner.query(`
            DROP INDEX \`notes_created_at\` ON \`notes\`
        `);
        await queryRunner.query(`
            DROP TABLE \`notes\`
        `);
        await queryRunner.query(`
            DROP INDEX \`workspaces_name\` ON \`workspaces\`
        `);
        await queryRunner.query(`
            DROP INDEX \`workspaces_created_at\` ON \`workspaces\`
        `);
        await queryRunner.query(`
            DROP TABLE \`workspaces\`
        `);
        await queryRunner.query(`
            DROP TABLE \`user_permissions\`
        `);
        await queryRunner.query(`
            DROP INDEX \`links_source_note_id_target_note_id_position\` ON \`links\`
        `);
        await queryRunner.query(`
            DROP INDEX \`links_target_note_id\` ON \`links\`
        `);
        await queryRunner.query(`
            DROP INDEX \`links_source_note_id\` ON \`links\`
        `);
        await queryRunner.query(`
            DROP INDEX \`links_created_at\` ON \`links\`
        `);
        await queryRunner.query(`
            DROP TABLE \`links\`
        `);
        await queryRunner.query(`
            DROP INDEX \`diffs_note_id\` ON \`diffs\`
        `);
        await queryRunner.query(`
            DROP INDEX \`diffs_created_at\` ON \`diffs\`
        `);
        await queryRunner.query(`
            DROP TABLE \`diffs\`
        `);
        await queryRunner.query(`
            ALTER TABLE \`users\` CHANGE \`api_key\` \`email\` varchar(255) NOT NULL
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX \`users_email\` ON \`users\` (\`email\`)
        `);
    }
}
