import Realm from 'realm'
import { app } from 'electron'
import { join } from 'path'
import { logInfo, logError, logWarning } from '../../shared/logger'
import { EmailDocument } from './EmailDocument'
import { AccountDocument } from './AccountDocument'

// Re-export for backward compatibility
export { EmailDocument, AccountDocument }

// Global database instance
let realmInstance: Realm | null = null

export async function createDatabase(): Promise<Realm | null> {
  // If already initialized, return the instance
  if (realmInstance && !realmInstance.isClosed) {
    return realmInstance
  }

  try {
    logInfo('Creating new Realm database instance...')

    // Get app data path for database storage
    const dbPath = join(app.getPath('userData'), 'chloe.realm')
    logInfo('Database path:', dbPath)

    // Create Realm instance with persistence
    realmInstance = await Realm.open({
      path: dbPath,
      schema: [EmailDocument, AccountDocument],
      schemaVersion: 4,
      onMigration: (oldRealm, newRealm) => {
        logInfo(
          'Database migration from version',
          oldRealm.schemaVersion,
          'to',
          newRealm.schemaVersion
        )
      }
    })

    logInfo('Database created successfully')
    logInfo('Database path:', realmInstance.path)
    logInfo('Schema version:', realmInstance.schemaVersion)

    return realmInstance
  } catch (error) {
    logError('Error creating database:', error)
    logError('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })

    // Log the error but don't throw - let the app continue without database
    logWarning('App will continue without database functionality')
    return null
  }
}

export async function getDatabase(): Promise<Realm | null> {
  // Always go through createDatabase to ensure proper initialization
  const db = await createDatabase()
  if (!db) {
    logWarning('getDatabase: Database is not available')
  }
  return db
}

export async function closeDatabase(): Promise<void> {
  if (realmInstance && !realmInstance.isClosed) {
    realmInstance.close()
    realmInstance = null
    logInfo('Database closed successfully')
  }
}
