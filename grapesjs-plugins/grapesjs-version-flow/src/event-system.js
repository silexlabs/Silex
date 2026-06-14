export default class EventSystem {
  constructor(editor) {
    this.editor = editor;
    this.eventPrefix = 'version:';
  }

  emit(eventName, payload = {}) {
    const fullEventName = eventName.startsWith(this.eventPrefix) 
      ? eventName 
      : `${this.eventPrefix}${eventName}`;
    
    this.editor.trigger(fullEventName, payload);
    
    // Also emit on the editor's event bus for external listeners
    if (this.editor.getModel) {
      this.editor.getModel().trigger(fullEventName, payload);
    }
  }

  on(eventName, callback) {
    const fullEventName = eventName.startsWith(this.eventPrefix) 
      ? eventName 
      : `${this.eventPrefix}${eventName}`;
    
    return this.editor.on(fullEventName, callback);
  }

  off(eventName, callback) {
    const fullEventName = eventName.startsWith(this.eventPrefix) 
      ? eventName 
      : `${this.eventPrefix}${eventName}`;
    
    return this.editor.off(fullEventName, callback);
  }

  once(eventName, callback) {
    const fullEventName = eventName.startsWith(this.eventPrefix) 
      ? eventName 
      : `${this.eventPrefix}${eventName}`;
    
    const wrappedCallback = (...args) => {
      this.off(fullEventName, wrappedCallback);
      callback(...args);
    };
    
    return this.on(fullEventName, wrappedCallback);
  }
}