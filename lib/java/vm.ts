import { Core } from '../state/core'
import { javaKarolApi } from './api'
import { ClassFile } from './compiler'

export class JavaVM {
  classFile: ClassFile
  core: Core
  stack: any[]
  pc: number
  frame: { [key: string]: any }
  stopper?: () => void
  breakSleep?: () => void

  constructor(cf: ClassFile, core: Core) {
    this.classFile = cf
    this.core = core
    this.stack = []
    this.pc = 0
    this.frame = {}
  }

  async run() {
    while (this.pc < this.classFile.bytecode.length) {
      const instr = this.classFile.bytecode[this.pc]

      // console.log(instr, this.stack, this.frame)

      this.core.mutateWs((ws) => {
        ws.ui.gutter = instr.line
      })

      if (instr.type == 'load-from-frame') {
        this.stack.push(this.frame[instr.identifier])
      } else if (instr.type == 'store-to-frame') {
        this.frame[instr.identifier] = this.stack.pop()
      } else if (instr.type == 'invoke-api-method') {
        const parts = instr.identifier.split('_')
        let args = []
        let obj = undefined
        if (parts[1] !== 'constructor') {
          obj = this.stack.pop()
        }
        for (let i = 0; i < parts.length - 2; i++) {
          args.push(this.stack.pop())
        }
        args.reverse()
        const vm = this
        try {
          const returnValue = await javaKarolApi[instr.identifier].invoke({
            stack: this.stack,
            core: this.core,
            args,
            obj,
            sleep: (ms: number) =>
              new Promise((res) => {
                if (this.stopper) throw 'time to abort'
                vm.breakSleep = () => {
                  vm.breakSleep = undefined
                  res()
                }
                setTimeout(() => {
                  vm.breakSleep = undefined
                  res()
                }, ms)
              }),
          })
          //console.log('return value', instr.identifier, returnValue)
          if (returnValue !== undefined) {
            this.stack.push(returnValue)
          }
        } catch (e) {}
      } else if (instr.type == 'push-constant') {
        this.stack.push(instr.val)
      } else if (instr.type == 'drop-from-stack') {
        this.stack.pop()
      } else if (instr.type == 'add') {
        const right = this.stack.pop()
        const left = this.stack.pop()
        this.stack.push(left + right)
      } else if (instr.type == 'subtract') {
        const right = this.stack.pop()
        const left = this.stack.pop()
        this.stack.push(left - right)
      } else if (instr.type == 'multiply') {
        const right = this.stack.pop()
        const left = this.stack.pop()
        this.stack.push(left * right)
      } else if (instr.type == 'integer-divide') {
        const right = this.stack.pop()
        const left = this.stack.pop()
        const res = left / right
        this.stack.push(Math.sign(res) * Math.floor(Math.abs(res)))
      } else if (instr.type == 'jump') {
        this.pc = instr.target
        continue
      } else if (instr.type == 'jump-if-false') {
        const val = this.stack.pop()
        if (val === false) {
          await sleep(0)
          this.pc = instr.target
          continue
        }
      } else if (instr.type == 'compare-less-than') {
        const right = this.stack.pop()
        const left = this.stack.pop()
        this.stack.push(left < right)
      } else if (instr.type == 'compare-less-eq') {
        const right = this.stack.pop()
        const left = this.stack.pop()
        this.stack.push(left <= right)
      } else if (instr.type == 'compare-greater-than') {
        const right = this.stack.pop()
        const left = this.stack.pop()
        this.stack.push(left > right)
      } else if (instr.type == 'compare-greater-eq') {
        const right = this.stack.pop()
        const left = this.stack.pop()
        this.stack.push(left >= right)
      } else if (instr.type == 'invert-boolean') {
        const val = this.stack.pop()
        this.stack.push(!val)
      } else if (instr.type == 'negate-int') {
        const val = this.stack.pop()
        this.stack.push(-val)
      } else if (instr.type == 'compare') {
        const right = this.stack.pop()
        const left = this.stack.pop()
        this.stack.push(left === right)
      } else if (instr.type == 'duplicate-stack-top') {
        const val = this.stack.pop()
        this.stack.push(val)
        this.stack.push(val)
      }

      if (this.stopper) {
        setTimeout(this.stopper, 0)
        this.stopper = undefined
        return
      }

      this.pc++
    }
  }

  async stop() {
    if (this.breakSleep) {
      setTimeout(this.breakSleep, 0)
    }
    await new Promise<void>((res) => {
      this.stopper = res
    })
  }
}

const sleep = (milliseconds: number) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}
