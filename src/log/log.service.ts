import { Injectable } from "@nestjs/common";
import { Transactional } from "../db/transaction.utils";
import { v7 } from 'uuid'
import { DbService } from "../db/db.service";

@Injectable()
export class LogService {
  constructor(private dbService: DbService) {
  }

  @Transactional()
  async log(message: string) {
    return await this.dbService.getActiveTrx().insertInto('log').values({
        id: v7(),
        text: message,
        date: new Date()
      }).execute()
  }
}
