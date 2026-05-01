import type { Canvas } from 'fabric'

export type AvnacCommandHandler<TPayload = unknown, TResult = unknown> = (
  payload: TPayload,
) => TResult | Promise<TResult>

export interface AvnacCommandRegistry {
  register<TPayload = unknown, TResult = unknown>(
    id: string,
    handler: AvnacCommandHandler<TPayload, TResult>,
  ): () => void
  run<TPayload = unknown, TResult = unknown>(
    id: string,
    payload?: TPayload,
  ): Promise<TResult>
  has(id: string): boolean
  list(): string[]
}

export interface AvnacEditorContext {
  canvas: Canvas
  fabric: typeof import('fabric')
  commands: AvnacCommandRegistry
  getArtboard(): { width: number; height: number }
  requestPersist(): void
  notifyChange(): void
}

export interface AvnacEditorPlugin {
  id: string
  name?: string
  install(ctx: AvnacEditorContext): void | (() => void)
}

export function createAvnacCommandRegistry(): AvnacCommandRegistry {
  const handlers = new Map<string, AvnacCommandHandler>()

  return {
    register(id, handler) {
      handlers.set(id, handler as AvnacCommandHandler)
      return () => {
        if (handlers.get(id) === handler) handlers.delete(id)
      }
    },

    async run(id, payload) {
      const handler = handlers.get(id)
      if (!handler) {
        throw new Error(`AVNAC command not registered: ${id}`)
      }
      return await handler(payload) as never
    },

    has(id) {
      return handlers.has(id)
    },

    list() {
      return [...handlers.keys()]
    },
  }
}
