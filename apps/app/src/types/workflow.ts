export interface Workflow {
  id: string
  name: string
  linearIssueKey: string
  github?: {
    owner: string
    repo: string
    prNumber: number
  }
}

export interface Actor {
  id: string
  displayName: string
  handle: string
  type: 'human' | 'charlie' | 'bot'
}

export interface Event {
  id: string
  ts: string
  provider: 'linear' | 'github'
  type: string
  workflowId: string
  sequence: number
  actor: Actor
  entity: {
    kind: string
    provider: string
    id?: string
    key?: string
    title?: string
    url?: string
    owner?: string
    repo?: string
    number?: number
  }
  payload?: any
}