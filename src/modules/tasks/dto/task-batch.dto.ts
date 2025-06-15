import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayNotEmpty, IsString, IsIn } from 'class-validator';

export class BatchProcessDto {
  @ApiProperty({
    type: [String],
    example: ['123e4567-e89b-12d3-a456-426614174000', '223e4567-e89b-12d3-a456-426614174001'],
    description: 'Array of Task IDs to process'
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  tasks: string[];

  @ApiProperty({
    example: 'complete',
    description: 'Batch action to perform (e.g., "complete", "delete")',
    enum: ['complete', 'delete']
  })
  @IsString()
  @IsIn(['complete', 'delete'])
  action: string;
}