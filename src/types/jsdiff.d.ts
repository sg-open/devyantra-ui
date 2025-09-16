declare module 'jsdiff' {
  export interface Change {
    value: string
    added?: boolean
    removed?: boolean
    count?: number
  }

  export interface PatchOptions {
    ignoreCase?: boolean
    ignoreWhitespace?: boolean
    newlineIsToken?: boolean
    context?: number
  }

  export function diffChars(oldStr: string, newStr: string, options?: PatchOptions): Change[]
  export function diffWords(oldStr: string, newStr: string, options?: PatchOptions): Change[]
  export function diffLines(oldStr: string, newStr: string, options?: PatchOptions): Change[]
  export function createTwoFilesPatch(
    oldFileName: string,
    newFileName: string,
    oldStr: string,
    newStr: string,
    oldHeader?: string,
    newHeader?: string,
    options?: PatchOptions
  ): string
}