export type TokenBox = { v: 1; kdf: string; iterations: number; salt: string; iv: string; data: string }
export const AUTH_FILE: string
export const MIN_PASSWORD: number
export function lockToken(token: string, password: string, iterations?: number): Promise<TokenBox>
export function unlockToken(box: TokenBox | null | undefined, password: string): Promise<string>
