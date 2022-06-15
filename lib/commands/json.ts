import { Core } from '../state/core'
import { stopVM } from './jvm'

export function serialize(core: Core) {
  const { code } = core.ws
  return { code }
}

export function deserialize(core: Core, file?: string) {
  try {
    let { code }: { code: string } = JSON.parse(file ?? '{}')
    stopVM(core)
    core.mutateWs((state) => {
      state.code = code
      state.ui.needsTextRefresh = true
    })
  } catch (e) {
    alert(e ?? 'Laden fehlgeschlagen')
  }
}

export function textRefreshDone(core: Core) {
  core.mutateWs((ws) => {
    ws.ui.needsTextRefresh = false
  })
}
