import React, { useState, useEffect } from 'react'
import { useEmailStore } from '@/store/emailStore'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, X, UserPlus, Trash2 } from 'lucide-react'

export function WhitelistManager(): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')

  const { whitelistContacts, addWhitelistContact, removeWhitelistContact, clearWhitelist } =
    useEmailStore()

  useEffect(() => {
    const handleOpen = () => setIsOpen(true)
    window.addEventListener('openWhitelistManager', handleOpen)
    return () => window.removeEventListener('openWhitelistManager', handleOpen)
  }, [])

  const filteredContacts = whitelistContacts.filter(
    (contact) =>
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contact.name && contact.name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleAddContact = (): void => {
    if (newEmail && newEmail.includes('@')) {
      addWhitelistContact({
        email: newEmail,
        name: newName || undefined,
        source: 'manual'
      })
      setNewEmail('')
      setNewName('')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Whitelist Manager</DialogTitle>
          <DialogDescription>
            Manage your email whitelist. Only emails from these contacts will be shown when the
            whitelist is active.
          </DialogDescription>
        </DialogHeader>

        {/* Add New Contact */}
        <div className="space-y-2 rounded-lg border p-4">
          <h3 className="text-sm font-semibold">Add New Contact</h3>
          <div className="flex gap-2">
            <Input
              placeholder="Email address"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddContact()}
            />
            <Input
              placeholder="Name (optional)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddContact()}
              className="max-w-[200px]"
            />
            <Button onClick={handleAddContact} disabled={!newEmail || !newEmail.includes('@')}>
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Contact List */}
        <ScrollArea className="h-[300px] rounded-lg border">
          <div className="p-4">
            {filteredContacts.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground">
                {searchQuery ? 'No contacts found' : 'No contacts in whitelist'}
              </p>
            ) : (
              <div className="space-y-2">
                {filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">{contact.name || contact.email}</p>
                        {contact.source === 'gmail' && (
                          <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                            Gmail
                          </span>
                        )}
                      </div>
                      {contact.name && (
                        <p className="truncate text-sm text-muted-foreground">{contact.email}</p>
                      )}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeWhitelistContact(contact.email)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs border rounded-full px-2.5 py-0.5">
              {whitelistContacts.length} contacts
            </span>
            <span className="text-xs border rounded-full px-2.5 py-0.5 text-orange-500 border-orange-500">
              {whitelistContacts.filter((c) => c.source === 'gmail').length} from Gmail
            </span>
          </div>
          {whitelistContacts.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirm('Are you sure you want to clear all contacts?')) {
                  clearWhitelist()
                }
              }}
            >
              <Trash2 className="mr-1 h-3 w-3" />
              Clear All
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
