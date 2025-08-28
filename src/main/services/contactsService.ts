import { GmailAuthService } from '../auth/authService'
import { logInfo, logError } from '../../shared/logger'
import type { people_v1 } from 'googleapis'

interface GmailContact {
  email: string
  name?: string
}

export class ContactsService {
  private gmailAuthService: GmailAuthService

  constructor(gmailAuthService: GmailAuthService) {
    this.gmailAuthService = gmailAuthService
  }

  /**
   * Fetch contacts using Google People API
   * This gets both manually added contacts and auto-collected "Other contacts"
   */
  async fetchContacts(limit = 100): Promise<GmailContact[]> {
    try {
      logInfo(`[ContactsService] Starting to fetch contacts with limit: ${limit}`)

      const allContacts = new Map<string, GmailContact>()
      let hasPermissionError = false

      try {
        const people = await this.gmailAuthService.getPeopleClient()

        // First, fetch regular contacts
        try {
          logInfo('[ContactsService] Fetching regular contacts...')
          const regularContacts = await this.fetchRegularContacts(people, limit)
          regularContacts.forEach((contact) => {
            if (contact.email) {
              allContacts.set(contact.email.toLowerCase(), contact)
            }
          })
          logInfo(`[ContactsService] Found ${regularContacts.length} regular contacts`)
        } catch (error: any) {
          if ((error as any)?.message?.includes('insufficient authentication scopes')) {
            hasPermissionError = true
            logError(error as Error, 'CONTACTS_PERMISSION_ERROR')
          } else {
            logError(error as Error, 'REGULAR_CONTACTS_FETCH_ERROR')
          }
        }

        // Then, fetch "Other contacts" (auto-collected from emails)
        if (!hasPermissionError) {
          try {
            logInfo('[ContactsService] Fetching auto-collected contacts...')
            const otherContacts = await this.fetchOtherContacts(people, limit)
            otherContacts.forEach((contact) => {
              if (contact.email && !allContacts.has(contact.email.toLowerCase())) {
                allContacts.set(contact.email.toLowerCase(), contact)
              }
            })
            logInfo(`[ContactsService] Found ${otherContacts.length} auto-collected contacts`)
          } catch (error: any) {
            if ((error as any)?.message?.includes('insufficient authentication scopes')) {
              hasPermissionError = true
              logError(error as Error, 'CONTACTS_PERMISSION_ERROR')
            } else {
              logError(error as Error, 'OTHER_CONTACTS_FETCH_ERROR')
            }
          }
        }
      } catch (error) {
        // If we can't even get the People client, fall back to Gmail parsing
        logError(error as Error, 'PEOPLE_CLIENT_ERROR')
        hasPermissionError = true
      }

      // If we have permission errors, fall back to parsing sent emails
      if (hasPermissionError && allContacts.size === 0) {
        logInfo('[ContactsService] Falling back to Gmail sent email parsing...')
        const gmailContacts = await this.fetchContactsFromGmail(limit)
        gmailContacts.forEach((contact) => {
          if (contact.email) {
            allContacts.set(contact.email.toLowerCase(), contact)
          }
        })
      }

      const contactList = Array.from(allContacts.values())
      logInfo(
        `[ContactsService] Successfully collected ${contactList.length} total unique contacts`
      )

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

  /**
   * Fetch regular contacts from Google Contacts
   */
  private async fetchRegularContacts(
    people: people_v1.People,
    limit: number
  ): Promise<GmailContact[]> {
    const contacts: GmailContact[] = []
    let nextPageToken: string | undefined

    do {
      const response = await people.people.connections.list({
        resourceName: 'people/me',
        pageSize: Math.min(limit - contacts.length, 100),
        personFields: 'names,emailAddresses',
        pageToken: nextPageToken
      })

      const connections = response.data.connections || []

      for (const person of connections) {
        const emails = person.emailAddresses || []
        const names = person.names || []
        const primaryName = names.find((n) => n.metadata?.primary) || names[0]
        const displayName = primaryName?.displayName || ''

        // Add each email address as a separate contact entry
        for (const emailObj of emails) {
          if (emailObj.value) {
            contacts.push({
              email: emailObj.value,
              name: displayName || undefined
            })
          }
        }
      }

      nextPageToken = response.data.nextPageToken || undefined
    } while (nextPageToken && contacts.length < limit)

    return contacts
  }

  /**
   * Fetch "Other contacts" (auto-collected from email interactions)
   */
  private async fetchOtherContacts(
    people: people_v1.People,
    limit: number
  ): Promise<GmailContact[]> {
    const contacts: GmailContact[] = []
    let nextPageToken: string | undefined

    do {
      const response = await people.otherContacts.list({
        pageSize: Math.min(limit - contacts.length, 100),
        readMask: 'names,emailAddresses',
        pageToken: nextPageToken
      })

      const otherContacts = response.data.otherContacts || []

      for (const person of otherContacts) {
        const emails = person.emailAddresses || []
        const names = person.names || []
        const primaryName = names[0]
        const displayName = primaryName?.displayName || ''

        // Add each email address as a separate contact entry
        for (const emailObj of emails) {
          if (emailObj.value) {
            contacts.push({
              email: emailObj.value,
              name: displayName || undefined
            })
          }
        }
      }

      nextPageToken = response.data.nextPageToken || undefined
    } while (nextPageToken && contacts.length < limit)

    return contacts
  }

  /**
   * Fallback: Fetch contacts by parsing sent emails from Gmail
   */
  private async fetchContactsFromGmail(limit = 100): Promise<GmailContact[]> {
    try {
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
          const nameEmailRegex = /"?([^"<,]+)"?\s*<([^>]+)>/g

          // Split by comma first to handle multiple recipients
          const recipients = toHeader.split(',').map((r) => r.trim())

          for (const recipient of recipients) {
            // Reset regex lastIndex for each recipient
            nameEmailRegex.lastIndex = 0
            const match = nameEmailRegex.exec(recipient)
            if (match) {
              const [, name, email] = match
              const cleanName = name.trim().replace(/^["']|["']$/g, '') // Remove quotes
              if (!contacts.has(email)) {
                contacts.set(email, { email, name: cleanName })
                logInfo(`[ContactsService] Found contact: ${cleanName} <${email}>`)
              }
            } else {
              // Try simple email regex if no name/email pattern matches
              const emails = recipient.match(emailRegex)
              if (emails) {
                emails.forEach((email) => {
                  if (!contacts.has(email)) {
                    contacts.set(email, { email })
                    logInfo(`[ContactsService] Found contact (email only): ${email}`)
                  }
                })
              }
            }
          }
        } catch (error) {
          console.error('Error fetching message:', error)
        }
      }

      return Array.from(contacts.values())
    } catch (error) {
      logError(error as Error, 'GMAIL_CONTACTS_FETCH_ERROR')
      throw error
    }
  }
}
