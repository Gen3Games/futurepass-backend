export class ConcatIfArray<T> {
  protected items: T[]

  constructor(items?: T[]) {
    this.items = items ?? []
  }

  concatIf(condition: boolean, item: T): ConcatIfArray<T> {
    return new ConcatIfArray(condition ? this.items.concat(item) : this.items)
  }

  get value(): T[] {
    return this.items
  }
}
