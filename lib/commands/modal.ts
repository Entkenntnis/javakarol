import { Core } from '../state/core'

export function closeModal(core: Core) {
  core.mutateWs((ws) => {
    ws.ui.modal = 'none'
  })
}

export function openModal(
  core: Core,
  modal: Exclude<Core['ws']['ui']['modal'], 'none'>
) {
  core.mutateWs((ws) => {
    ws.ui.modal = modal
  })
}
