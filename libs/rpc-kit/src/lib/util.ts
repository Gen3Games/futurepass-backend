export function unreachable(_x: never): never {
  throw new Error(`This should be unreachable!`)
}
