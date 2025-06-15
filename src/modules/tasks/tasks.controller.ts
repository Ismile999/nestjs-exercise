import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, HttpException, HttpStatus, UseInterceptors } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskQueryDto, TaskStatusDto, IdParamDto } from './dto/task-query.dto';
import { BatchProcessDto } from './dto/task-batch.dto';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { TaskStatus } from './enums/task-status.enum';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';

@ApiTags('tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard, RateLimitGuard)
@RateLimit({ limit: 10, windowMs: 60000 })
@ApiBearerAuth()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(createTaskDto);
  }

  @Get()
  @ApiOperation({ summary: 'Find all tasks with optional filtering' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'sortOrder', required: false })
  async findAll(@Query() query: TaskQueryDto) {
    // Pass filtering and pagination parameters to the service
    return this.tasksService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get task statistics' })
  @ApiQuery({ name: 'status', enum: TaskStatus, required: true })
  async findByStatus(@Query() statusDto: TaskStatusDto) {
    return this.tasksService.findByStatus(statusDto.status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find a task by ID' })
  async findOne(@Param('id') params: IdParamDto) {
    const task = await this.tasksService.findOne(params.id);
    if (!task) {
      throw new HttpException('Task not found', HttpStatus.NOT_FOUND);
    }
    return task;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    const updated = await this.tasksService.update(id, updateTaskDto);
    if (!updated) {
      throw new HttpException('Task not found', HttpStatus.NOT_FOUND);
    }
    return updated;
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.tasksService.remove(id);
   
    return { success: true };
  }

  @Post('batch')
  async batchProcess(@Body() operations: BatchProcessDto) {
    // Use bulk or parallel processing in the service
    return this.tasksService.batchProcess(operations);
  }
}
