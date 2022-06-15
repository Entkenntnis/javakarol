import { ensureSyntaxTree } from '@codemirror/language'
import { Diagnostic } from '@codemirror/lint'
import { EditorView } from '@codemirror/view'

import { ClassFile, Compiler } from '../java/compiler'
import { Core } from '../state/core'

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
    // console.log('classfile', output)
  } else {
    core.mutateWs(({ ui }) => {
      ui.state = 'error'
      ui.errorMessages = warnings
        .map(
          (w) => `Zeile ${view.state.doc.lineAt(w.from).number}: ${w.message}`
        )
        .filter(function (item, i, arr) {
          return arr.indexOf(item) == i
        })
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
