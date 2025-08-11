import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kysely, PostgresDialect, Transaction } from 'kysely';
import { Pool } from 'pg';
import { initDb } from './transaction.utils';
import { Database } from './types';
import { AsyncLocalStorage } from 'node:async_hooks';

type DBInstance = Kysely<Database>;
type DBOrTransaction = DBInstance | Transaction<Database>;

@Injectable()
export class DbService implements OnModuleInit, OnModuleDestroy {
  private db: Kysely<Database>;

  private readonly als = new AsyncLocalStorage<Transaction<Database>>();

  constructor(private readonly configService: ConfigService) {
    this.db = new Kysely<Database>({
      dialect: new PostgresDialect({
        pool: new Pool({
          host: this.configService.get<string>('DB_HOST'),
          port: this.configService.get<number>('DB_PORT'),
          database: this.configService.get<string>('DB_NAME'),
          user: this.configService.get<string>('DB_USER'),
          password: this.configService.get<string>('DB_PASSWORD'),
        }),
      }),
    });

    initDb(this.db)
  }

  getActiveTrx(): DBOrTransaction {

    const trx = this.als.getStore();

    if (trx) {
        return trx;
    }

    return this.db;
  }

  async runInTransaction<T>(cb: () => Promise<T>) {
    if (this.als.getStore() !== undefined) {
        return await cb()
    }

    return this.db.transaction().execute(async (trx) => {
        return this.als.run(trx, async () => await cb())
    })
  }

  onModuleInit() {
    console.log('✅ Database connection initialized');
  }

  onModuleDestroy() {
    console.log('🛑 Closing database connection');
    return this.db.destroy();
  }
}
