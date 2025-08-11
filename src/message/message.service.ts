import { Inject, Injectable } from '@nestjs/common';
import { Message } from './message.entity';
import { Transactional, withTransaction } from '../db/transaction.utils';
import { v7 } from 'uuid';
import { LogService } from '../log/log.service';
import { DbService } from '../db/db.service';

@Injectable()
export class MessageService {
  constructor(
    private readonly logService: LogService,
    private readonly dbService: DbService
  ) {
  }

  @Transactional()
  async createMessage(content: string): Promise<Message> {
      const message: Message = { 
        id: v7(),
        content,
        date: new Date()
      }

      const result = await this.dbService.getActiveTrx().insertInto('message').values(message).execute()

      // вызываем LogService, он не знает о текущей транзакции напрямую
      await this.logService.log('Создано сообщение')

      return message
  }

  @Transactional()
  async getAllMessages(): Promise<Message[]> {
    return await this.dbService.getActiveTrx().selectFrom('message').selectAll().execute()
  }
}
