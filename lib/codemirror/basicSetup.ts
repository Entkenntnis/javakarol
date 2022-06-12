import {
  keymap,
  drawSelection,
  highlightActiveLine,
  EditorView,
  Command,
  lineNumbers,
  highlightActiveLineGutter,
} from '@codemirror/view'
import { EditorState, Compartment } from '@codemirror/state'
import {
  indentOnInput,
  syntaxHighlighting,
  bracketMatching,
  defaultHighlightStyle,
} from '@codemirror/language'
import {
  cursorDocEnd,
  defaultKeymap,
  history,
  historyKeymap,
  indentSelection,
  indentWithTab,
  selectAll,
} from '@codemirror/commands'
import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
} from '@codemirror/autocomplete'
import { linter, lintKeymap } from '@codemirror/lint'
import { java } from '@codemirror/lang-java'

const Theme = EditorView.theme({
  '&': {
    outline: 'none !important',
  },
  '.cm-gutters': {
    minHeight: '300px',
    minWidth: '30px',
    display: 'flex',
    justifyContent: 'end',
  },
  '.cm-scroller': {
    overflowX: 'initial !important',
    fontFamily: 'Hack, monospace',
  },
  '.cm-completionLabel': {
    fontFamily: 'Hack, monospace',
  },
})

export const editable = new Compartment()

interface BasicSetupProps {
  l: Parameters<typeof linter>[0]
}

export const autoFormat: Command = (view) => {
  // auto format
  const selection = view.state.selection
  selectAll(view)
  indentSelection(view)
  if (selection.main.to < view.state.doc.length) {
    view.dispatch({ selection })
  } else {
    cursorDocEnd(view)
  }
  return true
}

export function setEditable(view?: EditorView, value?: boolean) {
  if (view) {
    view.dispatch({
      effects: editable.reconfigure(EditorView.editable.of(value ?? false)),
    })
  }
}

export const basicSetup = (props: BasicSetupProps) => [
  lineNumbers(),
  highlightActiveLineGutter(),
  history(),
  drawSelection(),
  indentOnInput(),
  syntaxHighlighting(defaultHighlightStyle),
  highlightActiveLine(),
  bracketMatching(),
  closeBrackets(),
  autocompletion(),
  keymap.of([
    ...closeBracketsKeymap,
    ...defaultKeymap,
    ...historyKeymap,
    ...lintKeymap,
    ...completionKeymap,
    indentWithTab,
    {
      key: 'Ctrl-s',
      run: autoFormat,
    },
  ]),
  EditorState.tabSize.of(2),
  editable.of(EditorView.editable.of(true)),
  java(),
  linter(props.l),
  Theme,
  EditorView.lineWrapping,
]
