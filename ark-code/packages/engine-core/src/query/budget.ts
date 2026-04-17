export function checkMaxTurns(turnCount: number, maxTurns: number | undefined): boolean {
  return maxTurns !== undefined && turnCount >= maxTurns
}
