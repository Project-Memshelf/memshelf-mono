import * as fs from 'node:fs';
import * as path from 'node:path';
import { Project } from 'ts-morph';

interface JobInfo {
    fileName: string;
    exportName: string;
    jobName: string;
}

function generateJobService(): void {
    const project = new Project({
        tsConfigFilePath: path.join(__dirname, '../tsconfig.json'),
    });

    // Scan jobs directory for .ts files
    const jobsDir = path.join(__dirname, '../src/jobs');
    const jobFiles = fs
        .readdirSync(jobsDir)
        .filter((file) => file.endsWith('.ts'))
        .map((file) => file.replace('.ts', ''));

    const jobInfo: JobInfo[] = [];

    // Parse each job file to extract job definitions
    for (const jobFile of jobFiles) {
        const jobPath = path.join(jobsDir, `${jobFile}.ts`);
        const sourceFile = project.addSourceFileAtPath(jobPath);

        // Find exported job definition (should end with 'Job')
        const jobExport = sourceFile.getExportedDeclarations().get(`${jobFile}Job`);

        if (jobExport && jobExport.length > 0) {
            jobInfo.push({
                fileName: jobFile,
                exportName: `${jobFile}Job`,
                jobName: `${jobFile}Job.name`, // We'll read this at runtime
            });
        }
    }

    if (jobInfo.length === 0) {
        console.log('⚠️  No job definitions found');
        return;
    }

    // Generate JobQueue class and jobDefinitions array
    const serviceCode = generateServiceClass(jobInfo);
    const definitionsCode = generateJobDefinitions(jobInfo);

    // Write to generated directory
    const generatedDir = path.join(__dirname, '../src/generated');
    if (!fs.existsSync(generatedDir)) {
        fs.mkdirSync(generatedDir, { recursive: true });
    }

    fs.writeFileSync(path.join(generatedDir, 'JobQueue.ts'), serviceCode);
    fs.writeFileSync(path.join(generatedDir, 'jobDefinitions.ts'), definitionsCode);

    console.log(`✅ Generated JobQueue with ${jobInfo.length} job types:`);
    jobInfo.forEach((job) => {
        console.log(`   - ${job.fileName}Job`);
    });
}

function generateServiceClass(jobInfo: JobInfo[]): string {
    const importStatements = jobInfo
        .map((job) => `import { ${job.exportName} } from '../jobs/${job.fileName}';`)
        .join('\n');

    const methods = jobInfo
        .map((job) => {
            const baseName = job.exportName.replace('Job', '');
            const capitalizedBaseName = baseName.charAt(0).toUpperCase() + baseName.slice(1);
            const methodName = `queue${capitalizedBaseName}`;
            const scheduleMethodName = `schedule${capitalizedBaseName}`;

            return `
  /**
   * Queue ${job.exportName} for immediate processing with validation
   */
  async ${methodName}(data: z.infer<typeof ${job.exportName}.schema>): Promise<Job> {
    await this.ensureConnection();
    this.logger?.info({ data }, 'Queuing ${job.exportName}');
    
    // Validate data before queuing
    const validated = ${job.exportName}.schema.parse(data);
    const job = this.agenda.now(${job.exportName}.name, validated);
    
    this.logger?.info({ jobName: ${job.exportName}.name }, '${job.exportName} queued successfully');
    return job;
  }

  /**
   * Schedule ${job.exportName} for later processing with validation
   */
  async ${scheduleMethodName}(when: string | Date, data: z.infer<typeof ${job.exportName}.schema>): Promise<Job> {
    await this.ensureConnection();
    this.logger?.info({ when, data }, 'Scheduling ${job.exportName}');
    
    // Validate data before queuing
    const validated = ${job.exportName}.schema.parse(data);
    const job = this.agenda.schedule(when, ${job.exportName}.name, validated);
    
    this.logger?.info({ jobName: ${job.exportName}.name, when }, '${job.exportName} scheduled successfully');
    return job;
  }`;
        })
        .join('\n');

    return `import { Agenda, Job } from 'agenda';
import { z } from 'zod';
import type { Logger } from 'pino';
${importStatements}

/**
 * Type-safe job queue with Zod validation for queuing and scheduling jobs
 * This file is auto-generated - do not edit manually
 */
export class JobQueue {
  constructor(private agenda: Agenda, private logger?: Logger) {}

  /**
   * Ensure Agenda is connected to MongoDB before operations
   */
  private async ensureConnection(): Promise<void> {
    if (!this.agenda._collection) {
      this.logger?.debug('Waiting for Agenda MongoDB connection...');
      await new Promise<void>(resolve => {
        const checkReady = () => {
          if (this.agenda._collection) {
            this.logger?.debug('Agenda MongoDB connection established');
            resolve();
          } else {
            setTimeout(checkReady, 100);
          }
        };
        checkReady();
      });
    }
  }
${methods}

  /**
   * Start processing jobs (used by workers)
   */
  async start(): Promise<void> {
    await this.agenda.start();
  }

  /**
   * Stop processing jobs
   */
  async stop(): Promise<void> {
    await this.agenda.stop();
  }
}`;
}

function generateJobDefinitions(jobInfo: JobInfo[]): string {
    const importStatements = jobInfo
        .map((job) => `import { ${job.exportName} } from '../jobs/${job.fileName}';`)
        .join('\n');

    const arrayItems = jobInfo.map((job) => `    ${job.exportName}`).join(',\n');

    return `${importStatements}

/**
 * Array of all job definitions for registration with Agenda
 * This file is auto-generated - do not edit manually
 */
export const jobDefinitions = [
${arrayItems}
];`;
}

// Run codegen
generateJobService();
