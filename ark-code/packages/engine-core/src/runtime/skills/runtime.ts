export async function runSkill(name: string, args: string): Promise<string> {
  return `${name}${args ? ` ${args}` : ''}`
}
