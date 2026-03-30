import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './core/database/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { AuthService } from './modules/auth/auth.service';
import { AuthModule } from './modules/auth/auth.module';
import { CoursesModule } from './modules/courses/courses.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ExamService } from './modules/exam/exam.service';
import { ExamController } from './modules/exam/exam.controller';
import { ExamModule } from './modules/exam/exam.module';
import { HomeworkModule } from './modules/homework/homework.module';
import { LessonsService } from './modules/lessons/lessons.service';
import { LessonsController } from './modules/lessons/lessons.controller';
import { LessonsModule } from './modules/lessons/lessons.module';
import { QuestionsModule } from './modules/questions/questions.module';
import { RatingsService } from './modules/ratings/ratings.service';
import { RatingsController } from './modules/ratings/ratings.controller';
import { RatingsModule } from './modules/ratings/ratings.module';
import { SectionsModule } from './modules/sections/sections.module';
import { UploadController } from './modules/upload/upload.controller';
import { UploadModule } from './modules/upload/upload.module';
import { LessonGroupsModule } from './modules/lesson-groups/lesson-groups.module';
import { PurchasedCoursesService } from './modules/purchased-courses/purchased-courses.service';
import { PurchasedCoursesController } from './modules/purchased-courses/purchased-courses.controller';
import { PurchasedCoursesModule } from './modules/purchased-courses/purchased-courses.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal:true,
      envFilePath: '.env'
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    CoursesModule,
    CategoriesModule,
    ExamModule,
    HomeworkModule,
    LessonsModule,
    QuestionsModule,
    RatingsModule,
    SectionsModule,
    UploadModule,
    LessonGroupsModule,
    PurchasedCoursesModule
  ],
  providers: [AuthService, ExamService, LessonsService, RatingsService, PurchasedCoursesService],
  controllers: [ExamController, LessonsController, RatingsController, UploadController, PurchasedCoursesController],
})
export class AppModule {}
