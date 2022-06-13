// Takes a syntax tree and outputs a class file

import { Diagnostic } from '@codemirror/lint'
import { Text } from '@codemirror/state'
import { Tree, SyntaxNodeRef } from '@lezer/common'
import { javaKarolApi } from './api'

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

interface ObjectArgument {
  type: 'Object'
  class: string
  id: string
}

type ArgumentList = (IntArgument | StringArgument | ObjectArgument)[]

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
        let args: ArgumentList = []
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
                  {
                    type: 'ArgumentList',
                    count: 1,
                    check: (n) => {
                      args = this.parseArguments(n, frame)
                      return true
                    },
                  },
                ],
              },
            ],
          },
        ])
        const argStr = args
          .map((arg) => {
            if (arg.type == 'Object') {
              return arg.class
            }
            return arg.type
          })
          .join('_')
        args.forEach((arg) => {
          if (arg.type == 'Object') {
            this.classFile.bytecode.push({
              type: 'load-from-frame',
              identifier: arg.id,
            })
          }
        })
        const identifier = `${type}_constructor${argStr && `_${argStr}`}`
        if (javaKarolApi[identifier]) {
          this.classFile.bytecode.push({
            type: 'invoke-api-method',
            identifier,
          })
        } else {
          this.addWarning('Funktion nicht gefunden', cursor)
        }
        frame.store(id, { type: 'object', class: type })
        this.classFile.bytecode.push({ type: 'store-to-frame', identifier: id })
      } else if (type == 'ExpressionStatement') {
        this.debug(cursor)
        let object = ''
        let methodName = ''
        let args: ArgumentList = []
        this.ensure(cursor, [
          {
            type: 'MethodInvocation',
            count: 1,
            children: [
              {
                type: 'Identifier',
                count: 1,
                check: (n) => {
                  object = this.ctoc(n)
                  return true
                },
              },
              {
                type: 'MethodName',
                count: 1,
                children: [
                  {
                    type: 'Identifier',
                    count: 1,
                    check: (n) => {
                      methodName = this.ctoc(n)
                      return true
                    },
                  },
                ],
              },
              {
                type: 'ArgumentList',
                count: 1,
                check: (n) => {
                  args = this.parseArguments(n, frame)
                  return true
                },
              },
            ],
          },
        ])
        const argStr = args
          .map((arg) => {
            if (arg.type == 'Object') {
              return arg.class
            }
            return arg.type
          })
          .join('_')
        args.forEach((arg) => {
          if (arg.type == 'Object') {
            this.classFile.bytecode.push({
              type: 'load-from-frame',
              identifier: arg.id,
            })
          }
        })
        const entry = frame.load(object)
        if (entry && entry.type == 'object') {
          const identifier = `${entry.class}_${methodName}${
            argStr && `_${argStr}`
          }`
          if (javaKarolApi[identifier]) {
            this.classFile.bytecode.push({
              type: 'invoke-api-method',
              identifier,
            })
          } else {
            this.addWarning('Funktion nicht gefunden', cursor)
          }
        } else {
          this.addWarning('Variable nicht gefunden', cursor)
        }
      } else {
        this.addWarning(`Unbekannter Ausdruck "${type}"`, cursor)
      }
    } while (cursor.nextSibling())
  }

  parseArguments(node: SyntaxNodeRef, frame: Frame): ArgumentList {
    const args: ArgumentList = []

    const cursor = node.node.cursor()
    if (cursor.firstChild()) {
      do {
        const t = cursor.type.name
        if (t == '(' || t == ')' || t == ',') continue
        if (t == 'Identifier') {
          const id = this.ctoc(cursor)
          const entry = frame.load(id)
          if (!entry) {
            this.addWarning(`Unbekannte Variable "${id}"`, cursor)
          } else {
            args.push({ type: 'Object', class: entry.class, id }) // TODO: hier kann auch ein anderer Typ als Object sein
          }
        } else if (t == 'IntegerLiteral') {
          args.push({ type: 'int', val: parseInt(this.ctoc(cursor)) })
        } else {
          this.addWarning(`Unbekanntes Argument "${t}"`, cursor)
        }
      } while (cursor.nextSibling())
    }

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
