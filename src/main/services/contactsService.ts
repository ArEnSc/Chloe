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

      // Check if user has contacts permission
      const hasPermission = await this.gmailAuthService.hasContactsScope()
      if (!hasPermission) {
        logError('User does not have contacts permission', 'CONTACTS_PERMISSION_MISSING')
        throw new Error('Please re-authenticate to grant contact permissions. Go to Settings and log out, then log back in.')
      }

      const people = await this.gmailAuthService.getPeopleClient()
      const allContacts = new Map<string, GmailContact>()

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
      } catch (error) {
        if ((error as any)?.message?.includes('insufficient authentication scopes')) {
          logError(error as Error, 'CONTACTS_PERMISSION_ERROR')
          throw new Error('Please re-authenticate to grant contact permissions. Go to Settings and log out, then log back in.')
        }
        logError(error as Error, 'REGULAR_CONTACTS_FETCH_ERROR')
        throw error
      }

      // Then, fetch "Other contacts" (auto-collected from emails)
      try {
        logInfo('[ContactsService] Fetching auto-collected contacts...')
        const otherContacts = await this.fetchOtherContacts(people, limit)
        otherContacts.forEach((contact) => {
          if (contact.email && !allContacts.has(contact.email.toLowerCase())) {
            allContacts.set(contact.email.toLowerCase(), contact)
          }
        })
        logInfo(`[ContactsService] Found ${otherContacts.length} auto-collected contacts`)
      } catch (error) {
        if ((error as any)?.message?.includes('insufficient authentication scopes')) {
          logError(error as Error, 'CONTACTS_PERMISSION_ERROR')
          throw new Error('Please re-authenticate to grant contact permissions. Go to Settings and log out, then log back in.')
        }
        logError(error as Error, 'OTHER_CONTACTS_FETCH_ERROR')
        // Don't throw for other contacts errors, we can still use regular contacts
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
}