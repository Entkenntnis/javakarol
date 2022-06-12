import { Core } from '../state/core'
import { abort } from './vm'
import { onWorldChange } from './world'

export function openMenu(core: Core) {
  core.mutateCore((state) => {
    state.showMenu = true
    if (state.inviteMenu) {
      state.inviteMenu = false
    }
  })
  abort(core)
}

export function closeMenu(core: Core) {
  core.mutateCore((state) => {
    state.showMenu = false
  })
}

export function switchToEditor(core: Core) {
  core.mutateCore((state) => {
    state.showMenu = false
    state.puzzleWorkspace = undefined
  })
}
