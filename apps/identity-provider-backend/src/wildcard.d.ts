declare module 'wildcard' {
  class WildcardMatcher {
    constructor(text: string, separator?: RegExp | string)

    match(
      input: string | string[] | Record<string, unknown>
    ): boolean | string[] | Record<string, unknown>

    private classifyPart(part: string): string | RegExp
  }

  function wildcard(
    text: string,
    test?: string | string[] | Record<string, unknown>,
    separator?: RegExp | string
  ): WildcardMatcher | boolean | string[] | Record<string, unknown>

  export = wildcard
}
