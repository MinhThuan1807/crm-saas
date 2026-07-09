import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import envConfig from './common/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import  cookieParser from 'cookie-parser';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet()) 
  app.use(cookieParser());
  app.enableCors({
    origin: envConfig.FRONTEND_URL || 'http://localhost:3000',
    // origin: true,
    credentials: true,
  });

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('CRM SaaS API')
    .setDescription('API documentation cho hệ thống CRM SaaS')
    .setVersion('1.0')
    .addCookieAuth('accessToken')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  // Clean up the OpenAPI doc for proper Zod schema representation
  const cleanedDocument = cleanupOpenApiDoc(document);
  SwaggerModule.setup('api-docs', app, cleanedDocument, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = envConfig.PORT  || 3001;
  await app.listen(port);
  console.log("Server running on port:", port);
  console.log(`Swagger: http://localhost:${port}/api-docs`);
}
bootstrap();

