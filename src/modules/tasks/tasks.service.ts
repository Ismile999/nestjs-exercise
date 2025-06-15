import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskQueryDto, TaskStatusDto, IdParamDto } from './dto/task-query.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { TaskStatus } from './enums/task-status.enum';
import { TaskPriority } from './enums/task-priority.enum';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectQueue('task-processing')
    private taskQueue: Queue,
    private dataSource: DataSource,
  ) { }

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const task = this.tasksRepository.create(createTaskDto);
      const savedTask = await queryRunner.manager.save(task);

      await this.taskQueue.add('task-status-update', {
        taskId: savedTask.id,
        status: savedTask.status,
      });

      await queryRunner.commitTransaction();
      return savedTask;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException('Failed to create task');
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(
    query: TaskQueryDto
  ): Promise<{ data: Task[]; count: number; page: number; limit: number }> {
    const queryBuilder = this.tasksRepository.createQueryBuilder('task')
      .leftJoinAndSelect('task.user', 'user');

    let { status, priority, page = 1, limit = 10, sortBy, sortOrder } = query;

    if (status) {
      queryBuilder.andWhere('task.status = :status', { status });
    }

    if (priority) {
      queryBuilder.andWhere('task.priority = :priority', { priority });
    }

    const [tasks, count] = await queryBuilder
      .orderBy(`task.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data: tasks, count, page, limit };
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
  
    try {
      // Fetch the task
      const task = await queryRunner.manager.findOne(Task, { where: { id } });
  
      if (!task) {
        throw new NotFoundException(`Task not found`);
      }
  
      const originalStatus = task.status;
  
      // Update only defined fields
      for (const key of Object.keys(updateTaskDto) as (keyof UpdateTaskDto)[]) {
        if (updateTaskDto[key] !== undefined) {
          (task as any)[key] = updateTaskDto[key];
        }
      }      
  
      const updatedTask = await queryRunner.manager.save(task);

      if(!updatedTask){
        throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
      }
  
      if (originalStatus !== updatedTask.status) {
        await this.taskQueue.add('task-status-update', {
          taskId: updatedTask.id,
          status: updatedTask.status,
        });
      }
  
      await queryRunner.commitTransaction();
      return updatedTask;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      // Optionally log error here for debugging
      throw new HttpException('Failed to update task', HttpStatus.FORBIDDEN);
    } finally {
      await queryRunner.release();
    }
  }  

  async remove(id: string): Promise<void> {
    const result = await this.tasksRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Task not found`);
    }
  }

  async findByStatus(status: TaskStatus): Promise<Task[]> {
    return this.tasksRepository.find({
      where: { status },
    });
  }

  async updateStatus(id: string, status: TaskStatus): Promise<Task> {
    const task = await this.findOne(id);
    task.status = status;
    return this.tasksRepository.save(task);
  }

  /**
   * Batch process tasks: supports 'complete' (set status to COMPLETED) and 'delete'.
   * @param operations { tasks: string[], action: string }
   * @returns Array of results for each task
   */
  async batchProcess(operations: { tasks: string[]; action: string }) {
    const { tasks: taskIds, action } = operations;

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      throw new BadRequestException('No task IDs provided');
    }

    // Fetch all tasks in one query
    const foundTasks = await this.tasksRepository.find({
      where: { id: In(taskIds) },
    });

    const foundTaskIds = foundTasks.map(task => task.id);
    const notFoundIds = taskIds.filter(id => !foundTaskIds.includes(id));
    const results = [];

    switch (action) {
      case 'complete':
        // Bulk update
        await this.tasksRepository.update(
          { id: In(foundTaskIds) },
          { status: TaskStatus.COMPLETED }
        );
        // Optionally, add jobs to queue for status update
        for (const id of foundTaskIds) {
          await this.taskQueue.add('task-status-update', { taskId: id, status: TaskStatus.COMPLETED });
        }
        for (const id of foundTaskIds) {
          results.push({ taskId: id, success: true, result: 'completed' });
        }
        break;

      case 'delete':
        // Bulk delete
        await this.tasksRepository.delete({ id: In(foundTaskIds) });
        for (const id of foundTaskIds) {
          results.push({ taskId: id, success: true, result: 'deleted' });
        }
        break;

      default:
        throw new BadRequestException(`Unknown action: ${action}`);
    }

    // Add not found results
    for (const id of notFoundIds) {
      results.push({ taskId: id, success: false, error: 'Task not found' });
    }

    return results;
  }
}