import { IpcRendererEvent } from 'electron'

interface ElectronAPI {
  ipcRenderer: {
    invoke(channel: string, ...args: unknown[]): Promise<unknown>
    on(channel: string, listener: (event: IpcRendererEvent, ...args: unknown[]) => void): void
    off(channel: string, listener: (event: IpcRendererEvent, ...args: unknown[]) => void): void
    once(channel: string, listener: (event: IpcRendererEvent, ...args: unknown[]) => void): void
    send(channel: string, ...args: unknown[]): void
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
  }
}
