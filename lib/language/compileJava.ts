import { ensureSyntaxTree } from '@codemirror/language'
import { Diagnostic } from '@codemirror/lint'
import { EditorView } from '@codemirror/view'

export function compileJava(view: EditorView) {
  const tree = ensureSyntaxTree(view.state, 1000000, 1000)
  const warnings: Diagnostic[] = []

  if (tree) {
    const cursor = tree.cursor()
    console.log('-- tree start --')
    do {
      console.log(`Node ${cursor.name} from ${cursor.from} to ${cursor.to}`)

      if (cursor.type.isError) {
        warnings.push({
          from: cursor.from - 2,
          to: Math.min(cursor.to + 2, view.state.doc.length - 1),
          severity: 'error',
          message: 'Parse Error',
        })
      }
    } while (cursor.next())
    console.log('-- tree end --')
  }

  return { warnings, output: '' }
}
