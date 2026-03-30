import { Module } from '@nestjs/common';
import { LessonGroupController } from './lesson-groups.controller';
import { LessonGroupService } from './lesson-groups.service';

@Module({
  controllers: [LessonGroupController],
  providers: [LessonGroupService]
})
export class LessonGroupsModule {}