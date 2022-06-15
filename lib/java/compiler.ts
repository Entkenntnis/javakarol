import { Diagnostic } from '@codemirror/lint'
import { Text } from '@codemirror/state'
import { Tree, SyntaxNodeRef } from '@lezer/common'

import { javaKarolApi } from './api'

export interface ClassFile {
  bytecode: Instruction[]
}

type Instruction =
  | LoadInstruction
  | StoreInstruction
  | ApiInstruction
  | ConstantInstruction
  | PopInstruction

interface LoadInstruction {
  type: 'load-from-frame'
  identifier: string
  line: number
}

interface StoreInstruction {
  type: 'store-to-frame'
  identifier: string
  line: number
}

interface ApiInstruction {
  type: 'invoke-api-method'
  identifier: string
  line: number
}

interface ConstantInstruction {
  type: 'push-constant'
  val: any
  line: number
}

interface PopInstruction {
  type: 'pop-from-stack'
  line: number
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

type ArgumentList = FrameEntry[]

type FrameEntry = ObjectEntry | IntEntry | StringEntry | NeverEntry

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
  type: 'Object'
  class: string
}

interface IntEntry {
  type: 'int'
}

interface StringEntry {
  type: 'String'
}

interface NeverEntry {
  type: 'never' // if something fails
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
        let declType = ''
        let id = ''
        let variableDeclarator: SyntaxNodeRef = cursor
        this.ensure(cursor, [
          {
            type: 'VariableDeclarator',
            count: 1,
            check: (n) => {
              variableDeclarator = n
              return true
            },
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
            ],
          },
        ])
        if (cursor.node.getChild('TypeName')) {
          declType = this.ctoc(cursor.node.getChild('TypeName')!)
        } else if (cursor.node.getChild('PrimitiveType')) {
          declType = this.ctoc(cursor.node.getChild('PrimitiveType')!)
        }
        if (variableDeclarator.node.lastChild) {
          const line = this.doc.lineAt(cursor.from).number
          const entry = this.compileExpression(
            variableDeclarator.node.lastChild,
            frame
          )
          if (entry.type !== 'never') {
            const entryType = entry.type == 'Object' ? entry.class : entry.type
            if (entryType !== declType) {
              this.addWarning(
                `Typfehler, erwarte ${declType} statt ${entryType}`,
                cursor
              )
            }
          }
          frame.store(id, entry)
          this.classFile.bytecode.push({
            type: 'store-to-frame',
            identifier: id,
            line,
          })
        }
      } else if (type == 'ExpressionStatement') {
        const subcursor = cursor.node.cursor()
        if (subcursor.firstChild()) {
          if (subcursor.type.name !== ';') {
            const entry = this.compileExpression(subcursor, frame)
            const line = this.doc.lineAt(subcursor.from).number
            if (entry.type !== 'never') {
              this.classFile.bytecode.push({ type: 'pop-from-stack', line }) // ignore value
            }
          }
        }
      } else {
        this.addWarning(`Unbekannter Ausdruck "${type}"`, cursor)
      }
    } while (cursor.nextSibling())
  }

  compileExpression(node: SyntaxNodeRef, frame: Frame): FrameEntry {
    const line = this.doc.lineAt(node.from).number
    if (node.type.name == 'IntegerLiteral') {
      this.classFile.bytecode.push({
        type: 'push-constant',
        val: parseInt(this.ctoc(node)),
        line,
      })
      return { type: 'int' }
    }
    if (node.type.name == 'StringLiteral') {
      this.classFile.bytecode.push({
        type: 'push-constant',
        val: this.ctoc(node),
        line,
      })
      return { type: 'String' }
    }
    if (node.type.name == 'Identifier') {
      const id = this.ctoc(node)
      const frameEntry = frame.load(id)
      if (!frameEntry) {
        this.addWarning(`Unbekannte Variable ${id}`, node)
        return { type: 'never' }
      }
      this.classFile.bytecode.push({
        type: 'load-from-frame',
        identifier: id,
        line,
      })
      return frameEntry
    }
    if (node.type.name == 'ObjectCreationExpression') {
      let argListNode = node
      let classType = ''
      this.ensure(node, [
        { type: 'new', count: 1 },
        {
          type: 'TypeName',
          count: 1,
          check: (n) => {
            classType = this.ctoc(n)
            return true
          },
        },
        {
          type: 'ArgumentList',
          count: 1,
          check: (n) => {
            argListNode = n //this.parseArguments(n, frame)
            return true
          },
        },
      ])
      const argList = this.parseArguments(argListNode, frame)
      const argStr = argList
        .map((arg) => {
          if (arg.type == 'Object') {
            return arg.class
          }
          return arg.type
        })
        .join('_')
      const identifier = `${classType}_constructor${argStr && `_${argStr}`}`
      if (javaKarolApi[identifier]) {
        this.classFile.bytecode.push({
          type: 'invoke-api-method',
          identifier,
          line,
        })
      } else {
        this.addWarning('Funktion nicht gefunden', node)
      }
      return { type: 'Object', class: classType }
    }
    if (node.type.name == 'MethodInvocation') {
      let object = ''
      let methodName = ''
      let argListNode = node
      this.ensure(node, [
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
            argListNode = n
            return true
          },
        },
      ])
      const argList = this.parseArguments(argListNode, frame)
      const argStr = argList
        .map((arg) => {
          if (arg.type == 'Object') {
            return arg.class
          }
          return arg.type
        })
        .join('_')

      const entry = frame.load(object) // future: static methods are not nicely handled yet
      if (entry && entry.type == 'Object') {
        const identifier = `${entry.class}_${methodName}${
          argStr && `_${argStr}`
        }`
        if (javaKarolApi[identifier]) {
          this.classFile.bytecode.push({
            type: 'load-from-frame',
            identifier: object,
            line,
          })
          this.classFile.bytecode.push({
            type: 'invoke-api-method',
            identifier,
            line,
          })
        } else {
          this.addWarning('Funktion nicht gefunden', node)
        }
      } else {
        this.addWarning('Variable nicht gefunden', node)
      }
      return { type: 'never' }
    }
    this.addWarning(`Unbekannter Ausdruck ${node.type.name}`, node)
    return { type: 'never' }
  }

  parseArguments(node: SyntaxNodeRef, frame: Frame): ArgumentList {
    const args: ArgumentList = []

    const cursor = node.node.cursor()
    if (cursor.firstChild()) {
      do {
        const t = cursor.type.name
        if (t == '(' || t == ')' || t == ',') continue
        args.push(this.compileExpression(cursor, frame))
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
