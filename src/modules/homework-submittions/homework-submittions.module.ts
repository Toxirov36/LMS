import { Module } from '@nestjs/common';
import { HomeworkSubmissionController } from './homework-submittions.controller';
import { HomeworkSubmissionService } from './homework-submittions.service';

@Module({
  controllers: [HomeworkSubmissionController],
  providers: [HomeworkSubmissionService],
  exports: [HomeworkSubmissionService],
})
export class HomeworkSubmissionModule {}