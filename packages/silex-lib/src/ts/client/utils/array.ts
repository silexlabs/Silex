
export function insertAt<T>(array: T[], index: number, ...values: T[]) {
  return [
    ...array.slice(0, index),
    ...values,
    ...array.slice(index),
  ]
}

