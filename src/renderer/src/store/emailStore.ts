import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { ipc } from '@renderer/lib/ipc'
import { EMAIL_IPC_CHANNELS } from '@shared/types/email'
import { logInfo, logError } from '@shared/logger'
import { ERROR_MESSAGES } from '@renderer/shared/constants'
import type { Email as EmailType } from '@shared/types/email'
export interface Email {
  id: string
  threadId: string
  subject: string
  from: {
    name: string
    email: string
  }
  to: {
    name: string
    email: string
  }[]
  cc?: {
    name: string
    email: string
  }[]
  date: Date
  snippet: string
  body: string
  cleanBody?: string
  isRead: boolean
  isStarred: boolean
  isImportant: boolean
  labels: string[]
  attachments?: {
    id: string
    filename: string
    mimeType: string
    size: number
  }[]
  categorizedAttachments?: {
    images: Array<{ id: string; filename: string; mimeType: string; size: number }>
    pdfs: Array<{ id: string; filename: string; mimeType: string; size: number }>
    videos: Array<{ id: string; filename: string; mimeType: string; size: number }>
    others: Array<{ id: string; filename: string; mimeType: string; size: number }>
  }
}

export interface EmailFolder {
  id: string
  name: string
  icon?: string
  count: number
  type: 'system' | 'custom'
}

interface EmailState {
  emails: Email[]
  folders: EmailFolder[]
  selectedFolderId: string
  selectedEmailId: string | null
  selectedAutomatedTask: string | null
  searchQuery: string
  isLoading: boolean
  isInitialLoad: boolean
  isInitialized: boolean
  error: string | null
  lastSyncTime: Date | null
  syncProgress: {
    current: number
    total: number
    phase: 'fetching' | 'processing' | 'saving'
    message: string
  } | null

  // Pagination
  currentPage: number
  pageSize: number
  totalPages: number

  // Panel sizes
  folderListWidth: number
  emailListWidth: number

  // Actions
  setEmails: (emails: Email[]) => void
  setLastSyncTime: (time: Date) => void
  addEmail: (email: Email) => void
  updateEmail: (id: string, updates: Partial<Email>) => void
  deleteEmail: (id: string) => void
  moveToTrash: (id: string) => void
  clearAllEmails: () => void

  setFolders: (folders: EmailFolder[]) => void
  selectFolder: (folderId: string) => void
  selectEmail: (emailId: string | null) => void
  selectAutomatedTask: (taskId: string | null) => void

  markAsRead: (id: string) => void
  markAsUnread: (id: string) => void
  toggleStar: (id: string) => void
  toggleImportant: (id: string) => void

  setSearchQuery: (query: string) => void
  setLoading: (loading: boolean) => void
  setInitialLoad: (loading: boolean) => void
  setError: (error: string | null) => void
  setSyncProgress: (progress: EmailState['syncProgress']) => void

  // Pagination actions
  setCurrentPage: (page: number) => void
  setPageSize: (size: number) => void
  nextPage: () => void
  previousPage: () => void

  // Panel size actions
  setPanelSizes: (folderListWidth: number, emailListWidth: number) => void

  // Computed
  getFilteredEmails: () => Email[]
  getPaginatedEmails: () => Email[]
  updateTotalPages: () => void
  getSelectedEmail: () => Email | null

  // Sync actions
  initializeEmailSync: () => Promise<void>
  syncEmails: () => Promise<void>
}

const defaultFolders: EmailFolder[] = [
  { id: 'inbox', name: 'Inbox', type: 'system', count: 0 },
  { id: 'important', name: 'Starred', type: 'system', count: 0 },
  { id: 'sent', name: 'Sent', type: 'system', count: 0 },
  { id: 'drafts', name: 'Drafts', type: 'system', count: 0 },
  { id: 'trash', name: 'Trash', type: 'system', count: 0 }
]

export const useEmailStore = create<EmailState>()(
  devtools(
    persist(
      (set, get) => ({
        emails: [],
        folders: defaultFolders,
        selectedFolderId: 'inbox',
        selectedEmailId: null,
        selectedAutomatedTask: null,
        searchQuery: '',
        isLoading: false,
        isInitialLoad: true,
        isInitialized: false,
        error: null,
        lastSyncTime: null,
        syncProgress: null,

        // Pagination state
        currentPage: 1,
        pageSize: 50,
        totalPages: 1,

        // Panel sizes
        folderListWidth: 256,
        emailListWidth: 384,

        setEmails: (emails) => {
          const pageSize = get().pageSize
          const totalPages = Math.ceil(emails.length / pageSize)
          logInfo(
            `setEmails: Received ${emails.length} emails, pageSize: ${pageSize}, totalPages: ${totalPages}`
          )
          set({ emails, totalPages, currentPage: 1 })
        },
        setLastSyncTime: (time) => set({ lastSyncTime: time }),

        addEmail: (email) =>
          set((state) => ({
            emails: [email, ...state.emails]
          })),

        updateEmail: (id, updates) =>
          set((state) => ({
            emails: state.emails.map((email) =>
              email.id === id ? { ...email, ...updates } : email
            )
          })),

        deleteEmail: (id) =>
          set((state) => ({
            emails: state.emails.filter((email) => email.id !== id),
            selectedEmailId: state.selectedEmailId === id ? null : state.selectedEmailId
          })),

        moveToTrash: (id) =>
          set((state) => ({
            emails: state.emails.map((email) =>
              email.id === id ? { ...email, labels: ['trash'] } : email
            )
          })),

        clearAllEmails: () => {
          set({
            emails: [],
            selectedEmailId: null,
            totalPages: 1,
            currentPage: 1
          })
        },

        setFolders: (folders) => set({ folders }),

        selectFolder: (folderId) =>
          set({
            selectedFolderId: folderId,
            selectedEmailId: null,
            selectedAutomatedTask: null,
            currentPage: 1
          }),

        selectEmail: (emailId) => set({ selectedEmailId: emailId }),

        selectAutomatedTask: (taskId) =>
          set({
            selectedAutomatedTask: taskId,
            selectedFolderId: '',
            selectedEmailId: null,
            currentPage: 1
          }),

        markAsRead: (id) => {
          set((state) => ({
            emails: state.emails.map((email) =>
              email.id === id ? { ...email, isRead: true } : email
            )
          }))
          // Sync to database
          if (ipc.isAvailable()) {
            ipc.invoke(EMAIL_IPC_CHANNELS.EMAIL_MARK_AS_READ, id).catch(logError)
          }
        },

        markAsUnread: (id) =>
          set((state) => ({
            emails: state.emails.map((email) =>
              email.id === id ? { ...email, isRead: false } : email
            )
          })),

        toggleStar: (id) => {
          set((state) => ({
            emails: state.emails.map((email) =>
              email.id === id ? { ...email, isStarred: !email.isStarred } : email
            )
          }))
          // Sync to database
          if (ipc.isAvailable()) {
            ipc.invoke(EMAIL_IPC_CHANNELS.EMAIL_TOGGLE_STAR, id).catch(logError)
          }
        },

        toggleImportant: (id) =>
          set((state) => ({
            emails: state.emails.map((email) =>
              email.id === id ? { ...email, isImportant: !email.isImportant } : email
            )
          })),

        setSearchQuery: (query) => {
          set({ searchQuery: query, currentPage: 1 })
        },
        setLoading: (loading) => set({ isLoading: loading }),
        setInitialLoad: (loading) => set({ isInitialLoad: loading }),
        setError: (error) => set({ error }),
        setSyncProgress: (progress) => set({ syncProgress: progress }),

        // Pagination actions
        setCurrentPage: (page) => set({ currentPage: page }),
        setPageSize: (size) => {
          const emails = get().emails
          const totalPages = Math.ceil(emails.length / size)
          set({ pageSize: size, totalPages, currentPage: 1 })
        },
        nextPage: () => {
          const { currentPage, totalPages } = get()
          if (currentPage < totalPages) {
            set({ currentPage: currentPage + 1 })
          }
        },
        previousPage: () => {
          const currentPage = get().currentPage
          if (currentPage > 1) {
            set({ currentPage: currentPage - 1 })
          }
        },

        setPanelSizes: (folderListWidth, emailListWidth) => {
          set({ folderListWidth, emailListWidth })
        },

        getFilteredEmails: () => {
          const state = get()
          let filtered = state.emails

          // Filter by folder
          switch (state.selectedFolderId) {
            case 'inbox':
              filtered = filtered.filter(
                (email) => !email.labels.includes('trash') && !email.labels.includes('sent')
              )
              break
            case 'important':
              filtered = filtered.filter((email) => email.isStarred)
              break
            case 'trash':
              filtered = filtered.filter((email) => email.labels.includes('trash'))
              break
            case 'sent':
              filtered = filtered.filter((email) => email.labels.includes('sent'))
              break
            default:
              filtered = filtered.filter((email) => email.labels.includes(state.selectedFolderId))
          }

          // Filter by search query
          if (state.searchQuery) {
            const query = state.searchQuery.toLowerCase()
            filtered = filtered.filter(
              (email) =>
                email.subject.toLowerCase().includes(query) ||
                email.snippet.toLowerCase().includes(query) ||
                email.from.name.toLowerCase().includes(query) ||
                email.from.email.toLowerCase().includes(query)
            )
          }

          // Sort by date
          return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        },

        getPaginatedEmails: () => {
          const state = get()
          const filtered = state.getFilteredEmails()
          const start = (state.currentPage - 1) * state.pageSize
          const end = start + state.pageSize

          return filtered.slice(start, end)
        },

        updateTotalPages: () => {
          const state = get()
          const filtered = state.getFilteredEmails()
          const totalPages = Math.ceil(filtered.length / state.pageSize)
          if (totalPages !== state.totalPages) {
            set({ totalPages })
          }
        },

        getSelectedEmail: () => {
          const state = get()
          return state.emails.find((email) => email.id === state.selectedEmailId) || null
        },

        initializeEmailSync: async () => {
          const state = get()

          // Only initialize once
          if (state.isInitialized) {
            return
          }

          set({ isInitialized: true, error: null })

          try {
            // Fetch emails from local cache first
            if (ipc.isAvailable()) {
              const emails = await ipc.invoke<EmailType[]>(EMAIL_IPC_CHANNELS.EMAIL_FETCH)
              set({ emails: emails as Email[], isInitialLoad: false })
              logInfo(`[EmailStore] Loaded ${emails.length} emails from local cache`)

              // Set up event listeners
              const handleNewEmails = (_event: unknown, emails: EmailType[]): void => {
                set({ emails: emails as Email[] })
              }

              const handleSyncComplete = async (
                _event: unknown,
                data: { timestamp: string; count: number }
              ): Promise<void> => {
                set({ lastSyncTime: new Date(data.timestamp) })
                // Fetch updated emails from database after sync completes
                try {
                  const emails = await ipc.invoke<EmailType[]>(EMAIL_IPC_CHANNELS.EMAIL_FETCH)
                  set({ emails: emails as Email[] })
                } catch (error) {
                  logError(error as Error, 'EMAIL_FETCH_AFTER_SYNC_ERROR')
                }
              }

              const handleSyncProgress = (
                _event: unknown,
                progress: { current: number; total: number; phase: string; message: string } | null
              ): void => {
                set({ syncProgress: progress })
              }

              // Set up listeners
              ipc.on(
                EMAIL_IPC_CHANNELS.EMAIL_NEW_EMAILS,
                handleNewEmails as (...args: unknown[]) => void
              )
              ipc.on(
                EMAIL_IPC_CHANNELS.EMAIL_SYNC_COMPLETE,
                handleSyncComplete as (...args: unknown[]) => void
              )
              ipc.on(
                EMAIL_IPC_CHANNELS.EMAIL_SYNC_PROGRESS,
                handleSyncProgress as (...args: unknown[]) => void
              )

              // Start polling
              await ipc.invoke(EMAIL_IPC_CHANNELS.EMAIL_START_POLLING)
              logInfo('[EmailStore] Started email polling')

              // Trigger immediate sync on startup
              logInfo('[EmailStore] Triggering initial sync with Gmail')
              get().syncEmails()
            }
          } catch (error) {
            logError(error as Error, 'EMAIL_INIT_ERROR')
            set({
              error: error instanceof Error ? error.message : ERROR_MESSAGES.EMAIL_FETCH_FAILED,
              isInitialLoad: false
            })
          }
        },

        syncEmails: async () => {
          set({ isLoading: true, error: null })

          try {
            const result = await ipc.invoke<{ success: boolean; timestamp: string }>(
              EMAIL_IPC_CHANNELS.EMAIL_SYNC
            )

            if (result.success && result.timestamp) {
              set({ lastSyncTime: new Date(result.timestamp) })
              // Fetch updated emails from database
              const emails = await ipc.invoke<EmailType[]>(EMAIL_IPC_CHANNELS.EMAIL_FETCH)
              set({ emails: emails as Email[] })
            }
          } catch (error) {
            logError(error as Error, 'EMAIL_SYNC_ERROR')
            set({
              error: error instanceof Error ? error.message : ERROR_MESSAGES.EMAIL_SYNC_FAILED
            })
          } finally {
            set({ isLoading: false })
          }
        }
      }),
      {
        name: 'email-store',
        partialize: (state) => ({
          selectedFolderId: state.selectedFolderId,
          searchQuery: state.searchQuery,
          folderListWidth: state.folderListWidth,
          emailListWidth: state.emailListWidth
        })
      }
    )
  )
)
