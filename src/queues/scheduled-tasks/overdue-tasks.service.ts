import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Task } from '../../modules/tasks/entities/task.entity';
import { TaskStatus } from '../../modules/tasks/enums/task-status.enum';

@Injectable()
export class OverdueTasksService {
  private readonly logger = new Logger(OverdueTasksService.name);

  constructor(
    @InjectQueue('task-processing')
    private taskQueue: Queue,
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async checkOverdueTasks() {
    this.logger.debug('Checking for overdue tasks...');

    const now = new Date();

    // Fetch overdue tasks in batches if needed
    const overdueTasks = await this.tasksRepository.find({
      where: {
        dueDate: LessThan(now),
        status: TaskStatus.PENDING,
      },
      select: ['id'], // Only fetch the ID to save memory
    });

    this.logger.log(`Found ${overdueTasks.length} overdue tasks`);

    if (overdueTasks.length === 0) {
      this.logger.debug('No overdue tasks found.');
      return;
    }

    // Use addBulk for efficiency
    const jobs = overdueTasks.map(task => ({
      name: 'process-overdue-task',
      data: { taskId: task.id },
    }));

    try {
      await this.taskQueue.addBulk(jobs);
      this.logger.log(`Queued ${jobs.length} overdue tasks for processing`);
    } catch (error: any) {
      this.logger.error(`Failed to queue overdue tasks: ${error.message}`);
    }

    this.logger.debug('Overdue tasks check completed');
  }
}