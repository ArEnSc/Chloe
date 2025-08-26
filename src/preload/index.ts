import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

// Simple IPC bridge without unnecessary channel validation
const electronAPI = {
  ipcRenderer: {
    invoke: (channel: string, ...args: unknown[]) => ipcRenderer.invoke(channel, ...args),
    on: (channel: string, listener: (event: IpcRendererEvent, ...args: unknown[]) => void) => {
      ipcRenderer.on(channel, listener)
    },
    off: (channel: string, listener: (event: IpcRendererEvent, ...args: unknown[]) => void) => {
      ipcRenderer.off(channel, listener)
    },
    once: (channel: string, listener: (event: IpcRendererEvent, ...args: unknown[]) => void) => {
      ipcRenderer.once(channel, listener)
    },
    send: (channel: string, ...args: unknown[]) => {
      ipcRenderer.send(channel, ...args)
    }
  }
}

// Custom APIs for renderer
const api = {}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
