import { ensureSyntaxTree } from '@codemirror/language'
import { Diagnostic } from '@codemirror/lint'
import { EditorView } from '@codemirror/view'
import { ClassFile, Compiler } from '../java/compiler'

import { Core } from '../state/core'
import { hidePreview } from './preview'

export function lint(core: Core, view: EditorView) {
  if (core.ws.ui.state == 'running' || !view) {
    return [] // auto formatting, ignore
  }
  // good place to sync code with state
  const code = view.state.doc.sliceString(0)
  core.mutateWs((state) => {
    state.code = code
  })

  const tree = ensureSyntaxTree(view.state, 1000000, 1000)

  let warnings: Diagnostic[] = []
  let output: ClassFile | undefined = undefined

  if (tree) {
    const compiler = new Compiler(tree, view.state.doc)
    compiler.compile()
    warnings = compiler.warnings
    output = compiler.classFile
  }

  warnings.sort((a, b) => a.from - b.from)

  if (warnings.length == 0 && output) {
    core.mutateWs(({ ui, jvm }) => {
      ui.state = 'ready'
      jvm.classfile = output
    })
    /*setTimeout(() => {
      execPreview(core)
    }, 10)*/
    console.log('classfile', output)
  } else {
    core.mutateWs(({ vm, ui }) => {
      vm.bytecode = undefined
      vm.pc = 0
      ui.state = 'error'
      ui.errorMessages = warnings
        .map(
          (w) => `Zeile ${view.state.doc.lineAt(w.from).number}: ${w.message}`
        )
        .filter(function (item, i, arr) {
          return arr.indexOf(item) == i
        })
      //ui.preview = undefined
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

export function toggleHideKarol(core: Core) {
  if (window.location.hostname === 'localhost' && core.ws.type == 'free') {
    core.mutateWs((ws) => {
      ws.ui.hideKarol = !ws.ui.hideKarol
    })
    if (core.ws.ui.hideKarol) {
      hidePreview(core)
    }
  }
}
