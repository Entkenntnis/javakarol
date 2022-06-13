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
        console.log(instr.identifier)
        await javaKarolApi[instr.identifier].invoke(this.stack, this.core)
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
    await new Promise<void>((res) => {
      this.stopper = res
    })
  }
}
