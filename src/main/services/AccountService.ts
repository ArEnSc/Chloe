import { safeStorage } from 'electron'
import { getDatabase } from '../db/database'
import { AccountDocument } from '../db/AccountDocument'
import { logInfo, logError } from '../../shared/logger'
import { randomUUID } from 'crypto'
import type {
  Account,
  AccountTokens,
  AccountInfo,
  CreateAccountInput
} from '../../shared/types/account'

export class AccountService {
  /**
   * Save or update account information in Realm with encrypted tokens
   */
  async saveAccount(accountInput: CreateAccountInput): Promise<string> {
    try {
      const db = await getDatabase()
      if (!db) {
        throw new Error('Database not available')
      }

      // Encrypt sensitive tokens
      const encryptedAccessToken = safeStorage
        .encryptString(accountInput.accessToken)
        .toString('base64')
      const encryptedRefreshToken = safeStorage
        .encryptString(accountInput.refreshToken)
        .toString('base64')

      let accountId: string = ''

      await db.write(() => {
        // Check if account already exists
        const existingAccount = db
          .objects<AccountDocument>('Account')
          .filtered('email = $0', accountInput.email)[0]

        if (existingAccount) {
          // Update existing account - DO NOT modify the id field
          accountId = existingAccount.id
          existingAccount.encryptedAccessToken = encryptedAccessToken
          existingAccount.encryptedRefreshToken = encryptedRefreshToken
          existingAccount.tokenExpiresAt = accountInput.expiresAt
          existingAccount.updatedAt = new Date()
          existingAccount.isActive = true

          logInfo(`Updated account for ${accountInput.email}`)
        } else {
          // Create new account
          const newAccountId = randomUUID()
          accountId = newAccountId
          db.create<AccountDocument>('Account', {
            id: newAccountId,
            email: accountInput.email,
            provider: accountInput.provider,
            encryptedAccessToken,
            encryptedRefreshToken,
            tokenExpiresAt: accountInput.expiresAt,
            lastSync: new Date(),
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          })

          logInfo(`Created new account for ${accountInput.email}`)
        }
      })

      return accountId
    } catch (error) {
      logError('Error saving account:', error)
      throw error
    }
  }

  /**
   * Get account info without sensitive tokens (for IPC)
   */
  async getAccountInfo(email: string): Promise<AccountInfo | null> {
    try {
      const db = await getDatabase()
      if (!db) return null

      const account = db.objects<AccountDocument>('Account').filtered('email = $0', email)[0]

      if (!account) return null

      return {
        id: account.id,
        email: account.email,
        provider: account.provider as 'gmail' | 'outlook' | 'other',
        isActive: account.isActive,
        lastSync: account.lastSync,
        tokenExpiresAt: account.tokenExpiresAt
      }
    } catch (error) {
      logError('Error getting account info:', error)
      return null
    }
  }

  /**
   * Get account with decrypted tokens (for internal use only)
   */
  async getAccountWithTokens(email: string): Promise<(Account & AccountTokens) | null> {
    try {
      const db = await getDatabase()
      if (!db) return null

      const account = db.objects<AccountDocument>('Account').filtered('email = $0', email)[0]

      if (!account) return null

      // Decrypt tokens
      const accessToken = safeStorage.decryptString(
        Buffer.from(account.encryptedAccessToken, 'base64')
      )
      const refreshToken = safeStorage.decryptString(
        Buffer.from(account.encryptedRefreshToken, 'base64')
      )

      return {
        id: account.id,
        email: account.email,
        provider: account.provider as 'gmail' | 'outlook' | 'other',
        isActive: account.isActive,
        lastSync: account.lastSync,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
        accessToken,
        refreshToken,
        expiresAt: account.tokenExpiresAt
      }
    } catch (error) {
      logError('Error getting account with tokens:', error)
      return null
    }
  }

  /**
   * Get all active accounts (without tokens for IPC)
   */
  async getActiveAccounts(): Promise<AccountInfo[]> {
    try {
      const db = await getDatabase()
      if (!db) return []

      const accounts = db.objects<AccountDocument>('Account').filtered('isActive = true')

      return accounts.map((account) => ({
        id: account.id,
        email: account.email,
        provider: account.provider as 'gmail' | 'outlook' | 'other',
        isActive: account.isActive,
        lastSync: account.lastSync,
        tokenExpiresAt: account.tokenExpiresAt
      }))
    } catch (error) {
      logError('Error getting active accounts:', error)
      return []
    }
  }

  /**
   * Update account tokens
   */
  async updateTokens(
    email: string,
    accessToken: string,
    refreshToken: string,
    expiresAt: Date
  ): Promise<void> {
    try {
      const db = await getDatabase()
      if (!db) return

      const encryptedAccessToken = safeStorage.encryptString(accessToken).toString('base64')
      const encryptedRefreshToken = safeStorage.encryptString(refreshToken).toString('base64')

      await db.write(() => {
        const account = db.objects<AccountDocument>('Account').filtered('email = $0', email)[0]

        if (account) {
          account.encryptedAccessToken = encryptedAccessToken
          account.encryptedRefreshToken = encryptedRefreshToken
          account.tokenExpiresAt = expiresAt
          account.updatedAt = new Date()
        }
      })

      logInfo(`Updated tokens for ${email}`)
    } catch (error) {
      logError('Error updating tokens:', error)
      throw error
    }
  }

  /**
   * Update last sync info
   */
  async updateLastSync(email: string, historyId?: string): Promise<void> {
    try {
      const db = await getDatabase()
      if (!db) return

      await db.write(() => {
        const account = db.objects<AccountDocument>('Account').filtered('email = $0', email)[0]

        if (account) {
          account.lastSync = new Date()
          if (historyId) {
            account.lastHistoryId = historyId
          }
          account.updatedAt = new Date()
        }
      })
    } catch (error) {
      logError('Error updating last sync:', error)
    }
  }

  /**
   * Get last history ID for batch syncing
   */
  async getLastHistoryId(email: string): Promise<string | undefined> {
    try {
      const db = await getDatabase()
      if (!db) return undefined

      const account = db.objects<AccountDocument>('Account').filtered('email = $0', email)[0]

      return account?.lastHistoryId
    } catch (error) {
      logError('Error getting last history ID:', error)
      return undefined
    }
  }

  /**
   * Deactivate account (soft delete)
   */
  async deactivateAccount(email: string): Promise<void> {
    try {
      const db = await getDatabase()
      if (!db) return

      await db.write(() => {
        const account = db.objects<AccountDocument>('Account').filtered('email = $0', email)[0]

        if (account) {
          account.isActive = false
          account.updatedAt = new Date()
        }
      })

      logInfo(`Deactivated account ${email}`)
    } catch (error) {
      logError('Error deactivating account:', error)
      throw error
    }
  }
}
