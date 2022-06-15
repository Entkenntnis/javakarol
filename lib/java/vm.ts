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
          if (returnValue !== undefined) {
            this.stack.push(returnValue)
          }
        } catch (e) {}
      } else if (instr.type == 'push-constant') {
        this.stack.push(instr.val)
      } else if (instr.type == 'pop-from-stack') {
        this.stack.pop()
      }

      if (this.stopper) {
        setTimeout(this.stopper, 0)
        this.stopper = undefined
        console.log('stop running')
        return
      }

      this.pc++
    }
  }

  async stop() {
    if (this.breakSleep) {
      console.log('break sleep')
      setTimeout(this.breakSleep, 0)
    }
    await new Promise<void>((res) => {
      console.log('set stopper')
      this.stopper = res
    })
  }
}

const sleep = (milliseconds: number) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}
