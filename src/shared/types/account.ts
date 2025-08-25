// Shared account types between main and renderer processes

export interface Account {
  id: string
  email: string
  provider: 'gmail' | 'outlook' | 'other'
  isActive: boolean
  lastSync: Date
  createdAt: Date
  updatedAt: Date
}

export interface AccountTokens {
  accessToken: string
  refreshToken: string
  expiresAt: Date
}

// Type for IPC communication - doesn't include sensitive tokens
export interface AccountInfo {
  id: string
  email: string
  provider: 'gmail' | 'outlook' | 'other'
  isActive: boolean
  lastSync: Date
  tokenExpiresAt: Date
}

// Type for creating/updating accounts
export interface CreateAccountInput {
  email: string
  provider: 'gmail' | 'outlook' | 'other'
  accessToken: string
  refreshToken: string
  expiresAt: Date
}

// IPC channel names for account operations
export const ACCOUNT_IPC_CHANNELS = {
  GET_ACCOUNTS: 'account:get-all',
  GET_ACTIVE_ACCOUNTS: 'account:get-active',
  GET_ACCOUNT: 'account:get-one',
  CREATE_ACCOUNT: 'account:create',
  UPDATE_TOKENS: 'account:update-tokens',
  UPDATE_LAST_SYNC: 'account:update-last-sync',
  DEACTIVATE_ACCOUNT: 'account:deactivate',
  ACCOUNT_UPDATED: 'account:updated' // For notifications
} as const
