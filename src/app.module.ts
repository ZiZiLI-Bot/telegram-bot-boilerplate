import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { TelegramModule } from './telegram/telegram.module';

@Module({
  imports: [
    // dbOrmModuleAsync,
    TelegramModule,
    // RedisModule.forRoot({
    //   config: {
    //     host: process.env.REDIS_HOST,
    //     port: parseInt(process.env.REDIS_PORT),
    //     db: parseInt(process.env.REDIS_DATABASE_NUMBER),
    //   },
    // }),
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
