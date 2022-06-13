import {
  keymap,
  drawSelection,
  highlightActiveLine,
  EditorView,
  Command,
  lineNumbers,
  highlightActiveLineGutter,
  highlightSpecialChars,
} from '@codemirror/view'
import { EditorState, Compartment } from '@codemirror/state'
import {
  indentOnInput,
  syntaxHighlighting,
  bracketMatching,
  HighlightStyle,
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
import { tags } from '@lezer/highlight'

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

const defaultHighlightStyle = HighlightStyle.define([
  { tag: tags.meta, color: '#7a757a' },
  { tag: tags.link, textDecoration: 'underline' },
  { tag: tags.heading, textDecoration: 'underline', fontWeight: 'bold' },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.strong, fontWeight: 'bold' },
  { tag: tags.strikethrough, textDecoration: 'line-through' },
  { tag: tags.keyword, color: '#708' },
  {
    tag: [
      tags.atom,
      tags.bool,
      tags.url,
      tags.contentSeparator,
      tags.labelName,
    ],
    color: '#219',
  },
  { tag: [tags.literal, tags.inserted], color: '#164' },
  { tag: [tags.string, tags.deleted], color: '#a11' },
  { tag: [tags.regexp, tags.escape, tags.special(tags.string)], color: '#e40' },
  { tag: tags.definition(tags.variableName), color: '#00f' },
  { tag: tags.local(tags.variableName), color: '#30a' },
  { tag: [tags.typeName, tags.namespace], color: '#085' },
  { tag: tags.className, color: '#167' },
  { tag: [tags.special(tags.variableName), tags.macroName], color: '#256' },
  { tag: tags.definition(tags.propertyName), color: '#00c' },
  { tag: tags.comment, color: '#940' },
  { tag: tags.invalid, color: '#f00' },
  { tag: tags.variableName, color: '#00f' },
  { tag: tags.function(tags.variableName), color: '#cc7000' },
])

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
  highlightSpecialChars(),
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
