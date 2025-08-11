import { AsyncLocalStorage } from 'node:async_hooks';
import type { Kysely, Transaction } from 'kysely';
import { Database } from './types';
import { DbService } from './db.service';

type DBInstance = Kysely<Database>;
type DBOrTransaction = DBInstance | Transaction<any>;

const transactionStorage = new AsyncLocalStorage<DBOrTransaction>();
let dbInstance: DBInstance | null = null;

/**
 * Initialize the DB instance for transaction management
 */
export function initDb(db: DBInstance) {
  dbInstance = db;
}

/**
 * Get current DB or active transaction
 */
export function getCurrentDb(): DBOrTransaction {
  if (!dbInstance) {
    throw new Error('DB instance not initialized. Call initDb() first.');
  }
  return transactionStorage.getStore() ?? dbInstance;
}

/**
 * Runs a function within a transaction.
 * Creates a new transaction if none is active, otherwise reuses the current one.
 */
export async function withTransaction<T>(
  fn: (trx: Transaction<Database>) => Promise<T>
): Promise<T> {
  if (!dbInstance) {
    throw new Error('DB instance not initialized. Call initDb() first.');
  }

  const existingContext = transactionStorage.getStore();

  if (existingContext) {
    // Already in a transaction → reuse it
    return fn(existingContext as Transaction<any>);
  }

  // No active transaction → create a new one
  return dbInstance.transaction().execute(async (trx) => {
    return transactionStorage.run(trx, async () => {
      return fn(trx);
    });
  });
}

/**
 * Decorator to run a method within a database transaction.
 * Reuses existing transaction if one is active, otherwise starts a new one.
 */
export function Transactional(dbServiceName = 'dbService'): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    if (typeof originalMethod !== 'function') {
      throw new Error('@Transactional can only be applied to methods.');
    }

    descriptor.value = async function (...args: any[]) {
        // @ts-ignore
        const dbService = this[dbServiceName] as DbService; 

      // Use the shared withTransaction utility
      return await withTransaction(async (trx) => {
        if (!dbService) {
            throw new Error('DbService is not available on object')
        }
        
        // Bind the original method to ensure `this` is preserved
        // and pass through the transaction if the method expects it
        // (optional: inject trx if needed, see advanced version below)
        return await dbService.runInTransaction(() => {
            return originalMethod.apply(this, args)
        });
      });
    };

    return descriptor;
  };
}