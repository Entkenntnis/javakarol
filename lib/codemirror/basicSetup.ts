import {
  keymap,
  drawSelection,
  highlightActiveLine,
  EditorView,
  Command,
  Decoration,
  DecorationSet,
  ViewPlugin,
  ViewUpdate,
  lineNumbers,
  highlightActiveLineGutter,
} from '@codemirror/view'
import { EditorState, Compartment, Range } from '@codemirror/state'
import {
  indentOnInput,
  continuedIndent,
  indentNodeProp,
  LRLanguage,
  syntaxTree,
  defaultHighlightStyle,
  syntaxHighlighting,
} from '@codemirror/language'
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentSelection,
  indentWithTab,
  selectAll,
} from '@codemirror/commands'
import {
  autocompletion,
  completionKeymap,
  CompletionSource,
} from '@codemirror/autocomplete'
import { linter, lintKeymap } from '@codemirror/lint'
import { styleTags, tags as t } from '@lezer/highlight'

import { parser } from './parser/parser.js'

const parserWithMetadata = parser.configure({
  props: [
    styleTags({
      Command: t.atom,
      RepeatStart: t.keyword,
      RepeatEnd: t.keyword,
      RepeatAlwaysKey: t.keyword,
      RepeatWhileKey: t.keyword,
      RepeatTimesKey: t.keyword,
      IfKey: t.keyword,
      ThenKey: t.keyword,
      IfEndKey: t.keyword,
      ElseKey: t.keyword,
      CmdStart: t.keyword,
      CmdEnd: t.keyword,
      CmdName: t.comment,
      Times: t.strong,
      Comment: t.meta,
      Condition: t.className,
      Not: t.strong,
      SpecialCommand: t.strong,
      CondStart: t.keyword,
      CondEnd: t.keyword,
      CondName: t.emphasis,
      TF: t.typeName,
      Return: t.unit,
      CustomRef: t.variableName,
    }),
    indentNodeProp.add({
      Repeat: continuedIndent({ except: /^\s*endewiederhole(\s|$)/ }),
      IfThen: continuedIndent({ except: /^\s*(endewenn|sonst)(\s|$)/ }),
      Cmd: continuedIndent({ except: /^\s*endeAnweisung(\s|$)/ }),
    }),
  ],
})

const exampleLanguage = LRLanguage.define({
  parser: parserWithMetadata,
  languageData: {
    indentOnInput: /^\s*(ende(wiederhole|wenn|Anweisung)|sonst)/,
    autocomplete: buildMyAutocomplete(),
  },
})

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
  }
  return true
}

export const basicSetup = (props: BasicSetupProps) => [
  lineNumbers(),
  highlightActiveLineGutter(),
  history(),
  drawSelection(),
  indentOnInput(),
  syntaxHighlighting(defaultHighlightStyle),
  highlightActiveLine(),
  keymap.of([
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
  autocompletion(),
  EditorState.tabSize.of(2),
  editable.of(EditorView.editable.of(true)),
  exampleLanguage,
  linter(props.l),
  Theme,
  myHighlightPlugin,
]

const generalOptions = [
  { label: 'Schritt' },
  { label: 'LinksDrehen' },
  { label: 'RechtsDrehen' },
  { label: 'Hinlegen' },
  { label: 'Aufheben' },
  { label: 'MarkeSetzen', boost: 2 },
  { label: 'MarkeLöschen' },
  { label: 'wiederhole' },
  { label: 'endewiederhole' },
  { label: 'wenn' },
  { label: 'endewenn' },
  { label: 'sonst' },
  { label: 'Anweisung' },
  { label: 'endeAnweisung' },
  { label: 'Unterbrechen' },
  { label: 'Beenden' },
]

const conditions = [
  { label: 'IstWand' },
  { label: 'NichtIstWand' },
  { label: 'IstZiegel' },
  { label: 'NichtIstZiegel' },
  { label: 'IstMarke' },
  { label: 'NichtIstMarke' },
]

const span = /[a-zA-Z_0-9äöüÄÜÖß]*$/

function buildMyAutocomplete(): CompletionSource {
  return (context) => {
    const token = context.matchBefore(/[a-zA-Z_0-9äöüÄÜÖß]+$/)
    const tree = syntaxTree(context.state)

    const around = tree.resolve(context.pos)
    const endingHere = around.resolve(context.pos, -1)

    let pos = context.pos - (token?.text.length ?? 0)
    while (
      pos > 0 &&
      [' ', '\n'].includes(context.state.doc.sliceString(pos - 1, pos))
    ) {
      pos--
    }

    const lastEndedNode = tree.resolve(pos, -1)

    // debug
    /*const cursor = tree.cursor()
    console.log('-- tree start --')
    do {
      console.log(`Node ${cursor.name} from ${cursor.from} to ${cursor.to}`)
    } while (cursor.next())
    console.log('-- tree end --')

    console.log('around', around.name)
    console.log('endingHere', endingHere.name)
    console.log('pos', context.pos)

    console.log('ending of previous', pos)
    console.log('last ended node', lastEndedNode.name)

    console.log('-- debug end --')*/
    // debug

    if (around.name == 'Comment') return null // no completion within comments

    if (around.name == 'CmdName' || endingHere.name == 'CmdName') return null // no completion in function name

    let options = generalOptions.map((o) => ({ ...o }))

    const pendings: ('repeat' | 'if' | 'cmd')[] = []

    const c = tree.cursor()
    do {
      if (c.name == 'CmdName') {
        const code = context.state.doc.sliceString(c.from, c.to)
        options.push({ label: code })
      }
      if (c.name == 'RepeatStart' && c.to <= pos) {
        pendings.push('repeat')
      }
      if (c.name == 'RepeatEnd' && c.to <= pos) {
        if (pendings[pendings.length - 1] == 'repeat') {
          pendings.pop()
        }
      }
      if (c.name == 'IfKey' && c.to <= pos) {
        pendings.push('if')
      }
      if (c.name == 'IfEndKey' && c.to <= pos) {
        if (pendings[pendings.length - 1] == 'if') {
          pendings.pop()
        }
      }
      if (c.name == 'CmdStart' && c.to <= pos) {
        pendings.push('cmd')
      }
      if (c.name == 'CmdEnd' && c.to <= pos) {
        if (pendings[pendings.length - 1] == 'cmd') {
          pendings.pop()
        }
      }
    } while (c.next())

    const last = pendings.pop()

    if (last == 'repeat') {
      options.forEach((o) => {
        if (o.label == 'endewiederhole') {
          o.boost = 3
        }
      })
    }

    if (last == 'cmd') {
      options.forEach((o) => {
        if (o.label == 'endeAnweisung') {
          o.boost = 3
        }
      })
    }

    if (last == 'if') {
      options.forEach((o) => {
        if (o.label == 'endewenn') {
          o.boost = 3
        }
      })
    }

    if (lastEndedNode.name == 'RepeatStart') {
      options = [{ label: 'solange' }]
    } else if (
      lastEndedNode.name == 'IfKey' ||
      lastEndedNode.name == 'RepeatWhileKey'
    ) {
      options = conditions
    } else if (lastEndedNode.name == 'Times') {
      options = [{ label: 'mal' }]
    } else if (
      lastEndedNode.name == 'Condition' &&
      lastEndedNode.parent?.name == 'IfThen'
    ) {
      options = [{ label: 'dann' }]
    }

    return token || context.explicit
      ? {
          from: token ? token.from : context.pos,
          options,
          span,
        }
      : null
  }
}

const colorMark = Decoration.mark({ class: 'text-[#9a4603]' })

const myHighlightPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet

    constructor(view: EditorView) {
      this.decorations = Decoration.none
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        const ranges: Range<Decoration>[] = []
        const availableCommands: string[] = []
        syntaxTree(update.view.state).iterate({
          enter: (node) => {
            if (node.name == 'CmdName') {
              const str = Array.from(
                update.view.state.doc.slice(node.from, node.to)
              )[0]

              availableCommands.push(str)
            }
          },
        })
        syntaxTree(update.view.state).iterate({
          enter: (node) => {
            if (node.name == 'CustomRef') {
              const str = Array.from(
                update.view.state.doc.slice(node.from, node.to)
              )[0]
              if (availableCommands.includes(str)) {
                ranges.push(colorMark.range(node.from, node.to))
              }
            }
          },
        })
        this.decorations = Decoration.set(ranges)
      }
    }
  },
  {
    decorations: (v) => v.decorations,
  }
)
