import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle("Learning Managment System")
    .addBearerAuth()
    .addTag("Auth")
    .addTag("Users")
    .addTag("Courses")
    .addTag("Categories")
    .addTag("Homework")
    .addTag("Questions")
    .addTag("Sections")
    .addTag("Upload")
    .build()

  const documentFactory = () => SwaggerModule.createDocument(app, config)
  SwaggerModule.setup("swagger", app, documentFactory)


  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
