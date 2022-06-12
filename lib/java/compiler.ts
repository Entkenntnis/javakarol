// Takes a syntax tree and outputs a class file

import { cursorCharRight } from '@codemirror/commands'
import { Diagnostic } from '@codemirror/lint'
import { Text } from '@codemirror/state'
import { Tree, SyntaxNodeRef } from '@lezer/common'

export interface ClassFile {
  bytecode: Instruction[]
}

type Instruction = LoadInstruction | StoreInstruction | ApiInstruction

interface LoadInstruction {
  type: 'load-from-frame'
  identifier: string
}

interface StoreInstruction {
  type: 'store-to-frame'
  identifier: string
}

interface ApiInstruction {
  type: 'invoke-api-method'
  identifier: string
}

interface Rule {
  type: string
  count: number
  check?: (node: SyntaxNodeRef) => boolean
  children?: Rule[]
}

interface IntArgument {
  type: 'int'
  val: number
}

interface StringArgument {
  type: 'String'
  val: string
}

type ArgumentList = (IntArgument | StringArgument)[]

type FrameEntry = ObjectEntry

class Frame {
  data: { [key: string]: FrameEntry }

  constructor() {
    this.data = {}
  }

  has(key: string) {
    return this.data[key] !== undefined
  }

  load(key: string) {
    return this.data[key]
  }

  store(key: string, entry: FrameEntry) {
    this.data[key] = entry
  }
}

interface ObjectEntry {
  type: 'object'
  class: string
}

export class Compiler {
  warnings: Diagnostic[]
  tree: Tree
  doc: Text
  classFile: ClassFile

  constructor(tree: Tree, doc: Text) {
    this.warnings = []
    this.tree = tree
    this.doc = doc
    this.classFile = { bytecode: [] }
  }

  compile() {
    // pass 1
    this.checkForErrorNodes()

    if (this.warnings.length > 0) return // don't continue after error (but it this good??)

    // pass 2 - ensure current strict schema and get to main block
    const mainBlock = this.findMainBlock()

    if (!mainBlock) return

    // pass 3 - compile block
    this.compileBlock(mainBlock)
  }

  compileBlock(block: SyntaxNodeRef) {
    const cursor = block.node.cursor()
    cursor.firstChild()
    const frame = new Frame()
    do {
      const type = cursor.type.name
      if (type == '{' || type == '}' || type == ';') continue
      if (type.includes('Comment')) continue
      if (type == 'LocalVariableDeclaration') {
        let type = ''
        let id = ''
        this.ensure(cursor, [
          {
            type: 'TypeName',
            count: 1,
            check: (n) => {
              type = this.ctoc(n)
              return true
            },
          },
          {
            type: 'VariableDeclarator',
            count: 1,
            children: [
              {
                type: 'Definition',
                count: 1,
                check: (n) => {
                  id = this.ctoc(n)
                  return true
                },
              },
              { type: 'AssignOp', count: 1 },
              {
                type: 'ObjectCreationExpression',
                count: 1,
                children: [
                  { type: 'new', count: 1 },
                  {
                    type: 'TypeName',
                    count: 1,
                    check: (n) => {
                      const val = this.ctoc(n)
                      if (val !== type) {
                        this.addWarning(`Typfehler, erwarte "${type}"`, n)
                      }
                      return val == type
                    },
                  },
                  { type: 'ArgumentList', count: 1 }, // ignore at the moment
                ],
              },
            ],
          },
        ])
        // step 1: api method invocation for constructor
        this.classFile.bytecode.push({
          type: 'invoke-api-method',
          identifier: `${type}_constructor`,
        })
        frame.store(id, { type: 'object', class: type })
        // step 2: store to frame
        this.classFile.bytecode.push({ type: 'store-to-frame', identifier: id })
      } else if (type == 'ExpressionStatement') {
      } else {
        this.addWarning(`Unbekannter Ausdruck "${type}"`, cursor)
      }
    } while (cursor.nextSibling())
  }

  parseArguments(node: SyntaxNodeRef): ArgumentList {
    const args: ArgumentList = []

    return args
  }

  findMainBlock(): SyntaxNodeRef | undefined {
    let block: SyntaxNodeRef | undefined = undefined
    this.ensure(this.tree.topNode, [
      {
        type: 'ClassDeclaration',
        count: 1,

        children: [
          {
            type: 'ClassBody',
            count: 1,
            children: [
              {
                type: 'MethodDeclaration',
                count: 1,
                children: [
                  {
                    type: 'Modifiers',
                    count: 1,
                    children: [
                      { type: 'public', count: 1 },
                      { type: 'static', count: 1 },
                    ],
                  },
                  { type: 'void', count: 1 },
                  {
                    type: 'Definition',
                    count: 1,
                    check: (n) => {
                      if (!(this.ctoc(n) == 'main')) {
                        this.addWarning('Erwarte Methode "main"', n)
                        return false
                      }
                      return true
                    },
                  },
                  {
                    type: 'FormalParameters',
                    count: 1,
                    children: [
                      {
                        type: 'FormalParameter',
                        count: 1,
                        children: [
                          {
                            type: 'ArrayType',
                            count: 1,
                            children: [
                              {
                                type: 'TypeName',
                                count: 1,
                                check: (n) => {
                                  if (!(this.ctoc(n) == 'String')) {
                                    this.addWarning('Erwarte Typ "String"', n)
                                    return false
                                  }
                                  return true
                                },
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                  {
                    type: 'Block',
                    count: 1,
                    check: (n) => {
                      block = n
                      return true
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    ])
    return block
  }

  ensure(node: SyntaxNodeRef, rules: Rule[]) {
    const compiler = this
    rules.forEach((rule) => {
      const matches = node.node.getChildren(rule.type)
      if (matches.length !== rule.count) {
        this.addWarning(
          `${rule.type}: ${matches.length} von ${rule.count}`,
          node
        )
        this.debug(node)
        return
      }
      if (rule.check) {
        const checker = rule.check.bind(this)
        if (!matches.every((n) => checker(n))) {
          return
        }
      }
      if (rule.children) {
        for (const m of matches) {
          this.ensure(m, rule.children)
        }
      }
    })
  }

  checkForErrorNodes() {
    const cursor = this.tree.cursor()
    do {
      if (cursor.type.isError) {
        this.addWarning('Syntaxfehler', cursor)
      }
    } while (cursor.next())
  }

  debug(node: SyntaxNodeRef, msg?: string) {
    if (msg) {
      console.log(`START: ${msg}`)
    }

    const cursor = node.node.cursor()
    do {
      if (cursor.to > node.to) break
      console.log(cursor.type.name, cursor.from, cursor.to, this.ctoc(cursor))
    } while (cursor.next())

    if (msg) {
      console.log(`END: ${msg}`)
    }
  }

  ctoc(node: SyntaxNodeRef) {
    return this.doc.sliceString(node.from, node.to)
  }

  addWarning(message: string, node: SyntaxNodeRef) {
    let from = node.from
    let to = node.to
    if (from == to) {
      from -= 2
      to += 2
    }
    const length = this.doc.length
    this.warnings.push({
      from: Math.max(0, from),
      to: Math.min(to, length - 1),
      severity: 'error',
      message,
    })
  }
}

/*const warnings: Diagnostic[] = []

  if (tree) {
    const cursor = tree.cursor()
    do {
      //console.log(`Node ${cursor.name} from ${cursor.from} to ${cursor.to}`)

      if (cursor.type.isError) {
        addWarning('Syntaxfehler', cursor)
      }
    } while (cursor.next())

    if (warnings.length == 0) {
      handleProgramNode(tree.cursor())
    }

    /*const cursor = tree.cursor()
    console.log('-- tree start --')
    do {
      console.log(`Node ${cursor.name} from ${cursor.from} to ${cursor.to}`)

      if (cursor.type.isError) {
        addWarning('Parse Error', cursor)
      }
    } while (cursor.next())
    console.log('-- tree end --')*/

// top-level must be class declaration
/*const tlCursor = tree.cursor()
    if (tlCursor.type.name !== 'Program') {
      addWarning('Uff, sollte definitiv nicht passieren', tlCursor)
    } else {
      const classes = tlCursor.node.getChildren('ClassDeclaration')
      if (classes.length == 0) {
        addWarning('Erwarte Klasse', tlCursor)
      } else if (classes.length > 1) {
        addWarning('Maximal eine Klasse', classes[1].cursor())
      } else {
        // suche nach Methoden
        const classCursor = classes[0].cursor()
        classCursor.lastChild()
        classCursor.firstChild()
        do {
          console.log('within class', classCursor.type.name)
        } while (classCursor.nextSibling())
      }
    }
  }

  function handleProgramNode(c: TreeCursor) {
    const origCursor = c.node.cursor()
    if (!c.firstChild()) {
      // empty program
      console.log('empty code')
      return
    }
    const classes = []

    do {
      if (c.type.name.includes('Comment')) continue

      if (c.type.name !== 'ClassDeclaration') {
        addWarning('Ausdruck hier nicht erlaubt, erwarte Klasse', c)
      } else {
        classes.push(c.node)
      }
    } while (c.nextSibling())
    if (classes.length == 0) {
      addWarning('Keine Klasse gefunden, erwarte "public class"', origCursor)
      return
    }
    if (classes.length > 1) {
      addWarning(
        'Mehrere klassen gefunden, erwarte genau eine Klasse',
        classes[1].cursor()
      )
      return
    }
    handleClassDeclaration(classes[0].cursor())
  }

  function handleClassDeclaration(c: TreeCursor) {
    c.firstChild()
    do {
      if (c.type.name == 'Definition') {
        console.log('class-name:', ctoc(c))
      }
      if (c.type.name == 'ClassBody') {
        handleClassBody(c.node.cursor())
      }
    } while (c.nextSibling())
  }

  function handleClassBody(c: TreeCursor) {
    const origCursor = c.node.cursor()
    c.firstChild()
    const methods = []
    do {
      //console.log(c.type.name)

      if (c.type.name == '{' || c.type.name == '}') continue

      if (c.type.name !== 'MethodDeclaration') {
        addWarning('Ausdruck hier nicht erlaubt, erwarte Methode', c)
      } else {
        methods.push(c.node)
      }
    } while (c.nextSibling())

    if (methods.length > 1) {
      addWarning('Erwarte nur eine Methode "main"', origCursor)
      return
    }

    if (methods.length == 0 || !methodIsMain(methods[0])) {
      addWarning(
        'Erwarte Methode "public static void main(String[] args)"',
        origCursor
      )
      return
    }
    const block = methods[0].getChild('Block')
    if (!block) {
      addWarning('Methode hat keinen Inhalt, erwarte "{}"', methods[0].cursor())
      return
    }
    handleMainBody(block.cursor())
  }

  function methodIsMain(node: SyntaxNode) {
    const c = node.cursor()
    const modifiers = node.getChild('Modifiers')
    if (modifiers) {
      const mods = ctoc(modifiers.cursor()).split(/\s+/)
      mods.sort()
      if (mods[0] == 'public' && mods[1] == 'static') {
        const name = node.getChild('Definition')
        if (name) {
          const namestr = ctoc(name.cursor())
          if (namestr == 'main') {
            const parameters = node.getChild('FormalParameters')
            if (parameters) {
              const p = parameters.getChildren('FormalParameter')
              if (p.length == 1) {
                const arrayType = p[0].firstChild
                if (arrayType?.type.name == 'ArrayType') {
                  const typename = arrayType.getChild('TypeName')
                  if (typename) {
                    if (ctoc(typename.cursor()) == 'String') {
                      if (node.getChild('void')) {
                        return true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    return false
  }

  function handleMainBody(c: TreeCursor) {
    c.firstChild()
    c.iterate((n) => {
      console.log(n.type.name)
      return true
    })
  }*/
