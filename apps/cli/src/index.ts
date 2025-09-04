#!/usr/bin/env bun
import { createRepoConfig } from '@repo/shared-core';
import { createContainer } from '@repo/shared-services';
import { Command } from 'commander';
import { createDevCommand } from './commands';

async function main() {
    // Create global configuration
    const config = createRepoConfig({
        logger: {
            name: 'Memshelf-CLI',
        },
    });

    // Create DI container
    const container = createContainer(config);

    // Initialize CLI program
    const program = new Command();

    program
        .name('memshelf')
        .description('Memshelf CLI application for managing your digital memory shelf')
        .version('1.0.0');

    // Add command modules
    program.addCommand(createDevCommand(container));

    // Global options
    program
        .option('--verbose', 'Enable verbose output')
        .option('--quiet', 'Suppress non-error output')
        .hook('preAction', (thisCommand) => {
            if (thisCommand.opts().verbose) {
                process.env.LOG_LEVEL = 'debug';
            } else if (thisCommand.opts().quiet) {
                process.env.LOG_LEVEL = 'error';
            }
        });

    // Error handling
    program.exitOverride();

    try {
        await program.parseAsync(process.argv);
    } catch (error: unknown) {
        if (error instanceof Error && 'code' in error) {
            if (error.code === 'commander.help' || error.code === 'commander.helpDisplayed') {
                process.exit(0);
            }
            if (error.code === 'commander.version') {
                process.exit(0);
            }
        }

        console.error('❌ CLI Error:', error);
        process.exit(1);
    }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

// Handle SIGINT and SIGTERM gracefully
const gracefulShutdown = (signal: string) => {
    console.log(`\n📝 Received ${signal}, shutting down gracefully...`);
    process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Run the CLI
main().catch((error) => {
    console.error('❌ Failed to start CLI:', error);
    process.exit(1);
});
