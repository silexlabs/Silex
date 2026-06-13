import { Notification } from './Notification'

/**
 * @fileoverview Storage class
 * Stores the notifications in the local storage
 */

export class Storage {
  constructor(private storeKey?: string) {}
  
  getAll(): any[] {
    if(!this.storeKey) return []
    return JSON.parse(localStorage.getItem(this.storeKey) || '[]')
  }
  
  save(data: Notification[]) {
    if(!this.storeKey) return
    localStorage.setItem(this.storeKey, JSON.stringify(data.map(n => ({
      message: n.message,
      type: n.type,
      componentId: n.componentId,
      group: n.group,
      timeout: n.options?.timeout
    }))))
  }
}
