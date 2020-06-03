
/**
 * insert a value in a copy of an array and returns the copy
 */
export function insertAt<T>(array: T[], index: number, ...values: T[]) {
  return [
    ...array.slice(0, index),
    ...values,
    ...array.slice(index),
  ]
}

/**
 * flat is missing on array in UT because silex is compatible with node 10
 * TODO: ask for a different version of node for the runtime and the build
 */
export const flat = (arr) => arr.reduce((acc, val) => acc.concat(val), [])
