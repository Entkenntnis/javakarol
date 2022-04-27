import { EditorView } from '@codemirror/view'

import { compile } from '../language/compiler'
import { Core } from '../state/core'
import { execPreview } from './preview'
import { patch } from './vm'

export function lint(core: Core, view: EditorView) {
  if (core.ws.ui.state == 'running' || !view) {
    return [] // auto formatting, ignore
  }
  // good place to sync code with state
  const code = view.state.doc.sliceString(0)
  core.mutateWs((state) => {
    if (state.type == 'level') {
      state.code = code
    } else {
      if (!state.ui.needsTextRefresh) {
        state.tabs[state.currentTab] = code
        console.log('saving code to tab', code, state.currentTab)
      }
    }
  })

  const { warnings, output } = compile(view)

  if (warnings.length == 0) {
    patch(core, output)
    setTimeout(() => {
      execPreview(core)
    }, 10)
  } else {
    core.mutateWs(({ vm, ui }) => {
      vm.bytecode = undefined
      vm.pc = 0
      ui.state = 'error'
      ui.preview = undefined
    })
  }
  return warnings
}

export function setLoading(core: Core) {
  if (core.ws.ui.state == 'running') {
    return // auto formatting, ignore
  }
  core.mutateWs(({ ui }) => {
    ui.state = 'loading'
  })
}
