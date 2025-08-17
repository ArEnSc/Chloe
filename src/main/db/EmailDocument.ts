import Realm from 'realm'

export class EmailDocument extends Realm.Object<EmailDocument> {
  id!: string
  threadId!: string
  from!: string
  to!: string[]
  subject!: string
  body!: string
  snippet!: string
  date!: Date
  labels!: string[]
  attachments!: unknown[]
  isRead!: boolean
  isStarred!: boolean
  isImportant!: boolean
  syncedAt!: Date

  static schema: Realm.ObjectSchema = {
    name: 'Email',
    primaryKey: 'id',
    properties: {
      id: 'string',
      threadId: 'string',
      from: { type: 'string', indexed: true },
      to: 'string[]',
      subject: 'string',
      body: 'string',
      snippet: 'string',
      date: { type: 'date', indexed: true },
      labels: 'string[]',
      attachments: 'mixed[]',
      isRead: { type: 'bool', default: false },
      isStarred: { type: 'bool', default: false },
      isImportant: { type: 'bool', default: false },
      syncedAt: { type: 'date', default: new Date() }
    }
  }
}
