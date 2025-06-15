import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsPositive, IsString, IsUUID } from 'class-validator';
import { TaskStatus } from '../enums/task-status.enum';
import { TaskPriority } from '../enums/task-priority.enum';

export class TaskQueryDto {
  @ApiPropertyOptional({ enum: TaskStatus, description: 'Filter by task status' })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: TaskPriority, description: 'Filter by task priority' })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ example: 1, description: 'Page number for pagination', default: 1 })
  @IsOptional()
  @IsPositive()
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, description: 'Number of items per page', default: 10 })
  @IsOptional()
  @IsPositive()
  limit?: number = 10;

  @ApiPropertyOptional({ 
    example: 'createdAt', 
    description: 'Field to sort by (createdAt, updatedAt, etc)',
    enum: ['createdAt', 'updatedAt', 'title', 'dueDate']
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ example: 'DESC', description: 'Sort direction (ASC or DESC)' })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';
}

export class TaskStatusDto { 
  @ApiPropertyOptional({ enum: TaskStatus })
  @IsEnum(TaskStatus)
  status: TaskStatus;
}

export class IdParamDto {
  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;
}
