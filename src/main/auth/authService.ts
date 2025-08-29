import { BrowserWindow, ipcMain } from 'electron'
import { google, gmail_v1, people_v1 } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import { logInfo, logError } from '../../shared/logger'
import { AUTH_IPC_CHANNELS } from '../../shared/types/auth'
import { AccountService } from '../services/AccountService'
import type { CreateAccountInput } from '../../shared/types/account'

interface AuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
}

export class GmailAuthService {
  private oauth2Client: OAuth2Client
  private config: AuthConfig
  private accountService: AccountService
  private currentUserEmail: string | null = null

  constructor() {
    this.config = {
      clientId: process.env.GMAIL_CLIENT_ID || '',
      clientSecret: process.env.GMAIL_CLIENT_SECRET || '',
      redirectUri: process.env.GMAIL_REDIRECT_URI || 'http://localhost:3000/auth/callback'
    }

    this.oauth2Client = new google.auth.OAuth2(
      this.config.clientId,
      this.config.clientSecret,
      this.config.redirectUri
    )

    this.accountService = AccountService.getInstance()
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      // Get the first active account
      const accounts = await this.accountService.getActiveAccounts()
      if (accounts.length === 0) {
        logInfo('No active accounts found')
        return false
      }

      // For now, use the first account
      const accountInfo = accounts[0]
      const accountWithTokens = await this.accountService.getAccountWithTokens(accountInfo.email)

      if (!accountWithTokens) {
        return false
      }

      this.oauth2Client.setCredentials({
        access_token: accountWithTokens.accessToken,
        refresh_token: accountWithTokens.refreshToken,
        expiry_date: accountWithTokens.expiresAt.getTime()
      })

      try {
        await this.oauth2Client.getAccessToken()
        this.currentUserEmail = accountWithTokens.email
        logInfo('Successfully verified access token')
        return true
      } catch (error) {
        logError('Failed to get access token:', error)
        return false
      }
    } catch (error) {
      logError('Error checking authentication:', error)
      return false
    }
  }

  async getAuthUrl(): Promise<string> {
    // Check if OAuth credentials are configured
    if (
      !this.config.clientId ||
      this.config.clientId === 'your_client_id_here' ||
      !this.config.clientId.includes('.apps.googleusercontent.com')
    ) {
      throw new Error(
        'Gmail OAuth is not configured. Please set GMAIL_CLIENT_ID in your .env file. You need to create a Google Cloud project and enable Gmail API.'
      )
    }

    if (!this.config.clientSecret || this.config.clientSecret === 'your_client_secret_here') {
      throw new Error(
        'Gmail OAuth is not configured. Please set GMAIL_CLIENT_SECRET in your .env file.'
      )
    }

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/contacts.readonly'
      ],
      prompt: 'consent'
    })
  }

  async handleAuthCallback(code: string): Promise<void> {
    try {
      logInfo('Exchanging auth code for tokens...')
      const { tokens } = await this.oauth2Client.getToken(code)
      logInfo('Received tokens:', {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        expiryDate: tokens.expiry_date
      })

      this.oauth2Client.setCredentials(tokens)

      // Get user email from Gmail API
      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client })
      const profile = await gmail.users.getProfile({ userId: 'me' })
      const userEmail = profile.data.emailAddress

      if (!userEmail) {
        throw new Error('Unable to get user email address')
      }

      // Save account to Realm database
      if (tokens.access_token && tokens.refresh_token && tokens.expiry_date) {
        const accountInput: CreateAccountInput = {
          email: userEmail,
          provider: 'gmail',
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: new Date(tokens.expiry_date)
        }

        await this.accountService.saveAccount(accountInput)
        this.currentUserEmail = userEmail
        logInfo(`Account saved to database for ${userEmail}`)
      }

      logInfo('Account authenticated successfully')
    } catch (error) {
      logError('Auth callback error:', error)
      throw new Error('Failed to exchange authorization code')
    }
  }

  async getGmailClient(): Promise<gmail_v1.Gmail> {
    if (!this.currentUserEmail) {
      // Try to get the first active account
      const accounts = await this.accountService.getActiveAccounts()
      if (accounts.length === 0) {
        throw new Error('Not authenticated. Please authenticate first.')
      }
      this.currentUserEmail = accounts[0].email
    }

    const accountWithTokens = await this.accountService.getAccountWithTokens(this.currentUserEmail)
    if (!accountWithTokens) {
      throw new Error('Not authenticated. Please authenticate first.')
    }

    this.oauth2Client.setCredentials({
      access_token: accountWithTokens.accessToken,
      refresh_token: accountWithTokens.refreshToken,
      expiry_date: accountWithTokens.expiresAt.getTime()
    })

    return google.gmail({ version: 'v1', auth: this.oauth2Client })
  }

  async getUserEmail(): Promise<string> {
    if (!this.currentUserEmail) {
      const accounts = await this.accountService.getActiveAccounts()
      if (accounts.length === 0) {
        throw new Error('No authenticated user')
      }
      this.currentUserEmail = accounts[0].email
    }
    return this.currentUserEmail
  }

  async refreshAccessToken(): Promise<void> {
    try {
      if (!this.currentUserEmail) {
        throw new Error('No authenticated user')
      }

      const accountWithTokens = await this.accountService.getAccountWithTokens(
        this.currentUserEmail
      )
      if (!accountWithTokens) {
        throw new Error('No account found')
      }

      this.oauth2Client.setCredentials({
        refresh_token: accountWithTokens.refreshToken
      })

      const { credentials } = await this.oauth2Client.refreshAccessToken()

      if (credentials.access_token && credentials.expiry_date) {
        await this.accountService.updateTokens(
          this.currentUserEmail,
          credentials.access_token,
          accountWithTokens.refreshToken, // Keep the same refresh token
          new Date(credentials.expiry_date)
        )
        logInfo('Access token refreshed successfully')
      }
    } catch (error) {
      logError('Failed to refresh token:', error)
      throw new Error('Failed to refresh access token')
    }
  }

  async getPeopleClient(): Promise<people_v1.People> {
    const isAuth = await this.isAuthenticated()
    if (!isAuth) {
      throw new Error('Not authenticated')
    }

    return google.people({ version: 'v1', auth: this.oauth2Client })
  }

  async hasContactsScope(): Promise<boolean> {
    try {
      const accessToken = this.oauth2Client.credentials.access_token
      logInfo(
        `[AuthService] Checking contacts scope with token: ${accessToken ? 'present' : 'missing'}`
      )

      if (!accessToken) {
        logError('No access token available for scope check')
        return false
      }

      const tokenInfo = await this.oauth2Client.getTokenInfo(accessToken)
      logInfo(`[AuthService] Token scopes: ${JSON.stringify(tokenInfo.scopes)}`)

      const hasScope =
        tokenInfo.scopes?.includes('https://www.googleapis.com/auth/contacts.readonly') || false
      logInfo(`[AuthService] Has contacts scope: ${hasScope}`)

      return hasScope
    } catch (error) {
      logError('Error checking contacts scope:', error)
      return false
    }
  }

  async logout(): Promise<void> {
    try {
      if (this.currentUserEmail) {
        await this.accountService.deactivateAccount(this.currentUserEmail)
        this.currentUserEmail = null
        this.oauth2Client.setCredentials({})
        logInfo('User logged out successfully')
      } else {
        logInfo('No active user to logout')
      }
    } catch (error) {
      logError('Error during logout:', error)
    }
  }
}

export function setupAuthHandlers(authService: GmailAuthService): void {
  ipcMain.handle(AUTH_IPC_CHANNELS.AUTH_CHECK, async () => {
    return authService.isAuthenticated()
  })

  ipcMain.handle('auth:start', async () => {
    const authUrl = await authService.getAuthUrl()

    const authWindow = new BrowserWindow({
      width: 600,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    })

    authWindow.loadURL(authUrl)

    return new Promise((resolve, reject) => {
      authWindow.webContents.on('will-redirect', async (event, url) => {
        if (url.startsWith(authService['config'].redirectUri)) {
          event.preventDefault()

          const urlParams = new URL(url)
          const code = urlParams.searchParams.get('code')
          const error = urlParams.searchParams.get('error')

          authWindow.close()

          if (error) {
            reject(new Error(`Authentication failed: ${error}`))
            return
          }

          if (code) {
            try {
              await authService.handleAuthCallback(code)
              resolve({ success: true })
            } catch (error) {
              reject(error)
            }
          }
        }
      })

      authWindow.on('closed', () => {
        reject(new Error('Authentication cancelled'))
      })
    })
  })

  ipcMain.handle('auth:logout', async () => {
    await authService.logout()
  })
}
