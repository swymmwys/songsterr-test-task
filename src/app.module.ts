import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DbModule } from './db/db.module';
import { MessageModule } from './message/message.module';
import { LogModule } from './log/log.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // No need to import ConfigModule elsewhere
    }),
    DbModule,
    LogModule,
    MessageModule,
  ],
})
export class AppModule {}
