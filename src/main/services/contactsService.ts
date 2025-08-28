import { GmailAuthService } from '../auth/authService'
import { logInfo, logError } from '../../shared/logger'

interface GmailContact {
  email: string
  name?: string
}

export class ContactsService {
  private gmailAuthService: GmailAuthService

  constructor(gmailAuthService: GmailAuthService) {
    this.gmailAuthService = gmailAuthService
  }

  async fetchContacts(limit = 100): Promise<GmailContact[]> {
    try {
      logInfo(`[ContactsService] Starting to fetch contacts with limit: ${limit}`)

      // Use Gmail API to get frequently contacted emails
      const gmail = await this.gmailAuthService.getGmailClient()

      // Fetch sent emails to extract recipients
      const response = await gmail.users.messages.list({
        userId: 'me',
        q: 'in:sent',
        maxResults: limit
      })

      const messageIds = response.data.messages || []
      logInfo(`[ContactsService] Found ${messageIds.length} sent messages to process`)

      const contacts = new Map<string, GmailContact>()

      // Fetch each message to extract recipients
      for (const message of messageIds.slice(0, Math.min(50, messageIds.length))) {
        try {
          const msg = await gmail.users.messages.get({
            userId: 'me',
            id: message.id!,
            format: 'metadata',
            metadataHeaders: ['To', 'From']
          })

          const headers = msg.data.payload?.headers || []
          const toHeader = headers.find((h) => h.name === 'To')?.value || ''

          // Parse email addresses from To header
          const emailRegex = /([^<\s]+@[^>\s]+)/g
          const nameEmailRegex = /"?([^"<]+)"?\s*<([^>]+)>/g

          let match
          while ((match = nameEmailRegex.exec(toHeader)) !== null) {
            const [, name, email] = match
            if (!contacts.has(email)) {
              contacts.set(email, { email, name: name.trim() })
              logInfo(`[ContactsService] Found contact: ${name.trim()} <${email}>`)
            }
          }

          // Also try simple email regex
          toHeader.split(',').forEach((part) => {
            const emails = part.match(emailRegex)
            if (emails) {
              emails.forEach((email) => {
                if (!contacts.has(email)) {
                  contacts.set(email, { email })
                  logInfo(`[ContactsService] Found contact (email only): ${email}`)
                }
              })
            }
          })
        } catch (error) {
          console.error('Error fetching message:', error)
        }
      }

      const contactList = Array.from(contacts.values())
      logInfo(`[ContactsService] Successfully collected ${contactList.length} unique contacts`)

      // Log first 5 contacts as sample
      if (contactList.length > 0) {
        logInfo('[ContactsService] Sample contacts:')
        contactList.slice(0, 5).forEach((contact, index) => {
          logInfo(`  ${index + 1}. ${contact.name || 'No name'} <${contact.email}>`)
        })
      }

      return contactList
    } catch (error) {
      logError(error as Error, 'CONTACTS_FETCH_ERROR')
      throw error
    }
  }
}
