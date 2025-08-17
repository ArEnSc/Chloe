import Realm from 'realm'

export class AccountDocument extends Realm.Object<AccountDocument> {
  id!: string
  email!: string
  provider!: 'gmail' | 'outlook' | 'other'
  // Encrypted tokens stored as base64 strings
  encryptedAccessToken!: string
  encryptedRefreshToken!: string
  tokenExpiresAt!: Date
  // Account metadata
  lastSync!: Date
  lastHistoryId?: string // For Gmail batch syncing
  isActive!: boolean
  createdAt!: Date
  updatedAt!: Date

  static schema: Realm.ObjectSchema = {
    name: 'Account',
    primaryKey: 'id',
    properties: {
      id: 'string',
      email: { type: 'string', indexed: true },
      provider: 'string',
      encryptedAccessToken: 'string',
      encryptedRefreshToken: 'string',
      tokenExpiresAt: 'date',
      lastSync: { type: 'date', default: new Date() },
      lastHistoryId: 'string?',
      isActive: { type: 'bool', default: true },
      createdAt: { type: 'date', default: new Date() },
      updatedAt: { type: 'date', default: new Date() }
    }
  }
}