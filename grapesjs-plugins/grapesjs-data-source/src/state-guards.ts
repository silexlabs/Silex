/**
 * Guards for MCP data-source:* commands so a missing state is an error.
 */

export function requireExistingState(stateId: string, ids: string[]): void {
  if (!ids.includes(stateId)) {
    const list = ids.length ? ids.join(', ') : '(none)'
    throw new Error(`State "${stateId}" is not on the selected element. Its states are: ${list}. Use data-source:get-states to list existing states.`)
  }
}
