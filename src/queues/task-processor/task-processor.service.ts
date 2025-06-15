import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { TasksService } from '../../modules/tasks/tasks.service';
import { TaskStatus } from '../../modules/tasks/enums/task-status.enum';

@Injectable()
@Processor('task-processing')
export class TaskProcessorService extends WorkerHost {
  private readonly logger = new Logger(TaskProcessorService.name);

  constructor(private readonly tasksService: TasksService) {
    super();
  }

  async process(job: Job): Promise<any> {
    this.logger.debug(`Processing job ${job.id} of type ${job.name}`);
    try {
      switch (job.name) {
        case 'task-status-update':
          return await this.handleStatusUpdate(job);
        case 'process-overdue-task':
          return await this.handleOverdueTask(job);
        default:
          this.logger.warn(`Unknown job type: ${job.name}`);
          return { success: false, error: 'Unknown job type' };
      }
    } catch (error) {
      this.logger.error(`Error processing job ${job.id}: ${error instanceof Error ? error.message : error}`);
      // Optionally: job.moveToFailed({ message: error.message }, true);
      throw error;
    }
  }

  private async handleStatusUpdate(job: Job) {
    const { taskId, status } = job.data;
    if (!taskId || !status) {
      this.logger.warn(`Missing required data for status update: ${JSON.stringify(job.data)}`);
      return { success: false, error: 'Missing required data' };
    }

    // Validate status
    if (!Object.values(TaskStatus).includes(status)) {
      this.logger.warn(`Invalid status value: ${status}`);
      return { success: false, error: 'Invalid status value' };
    }

    try {
      const task = await this.tasksService.updateStatus(taskId, status);
      this.logger.log(`Task ${taskId} status updated to ${status}`);
      return { success: true, taskId: task.id, newStatus: task.status };
    } catch (error:any) {
      this.logger.error(`Failed to update status for task ${taskId}: ${error.message}`);
      throw error;
    }
  }

  private async handleOverdueTask(job: Job) {
    const { taskId } = job.data;
    if (!taskId) {
      this.logger.warn('No taskId provided for overdue task processing');
      return { success: false, error: 'Missing taskId' };
    }

    try {
      // Example: mark as overdue or send notification
      const updatedTask = await this.tasksService.updateStatus(taskId, TaskStatus.PENDING);
      this.logger.log(`Marked task ${taskId} as OVERDUE`);
      return { success: true, taskId: taskId, newStatus: TaskStatus.PENDING };
    } catch (error:any) {
      this.logger.error(`Failed to process overdue task ${taskId}: ${error.message}`);
      throw error;
    }
  }
}