import { JavaVM } from '../java/vm'
import { Core } from '../state/core'
import { addMessage } from './messages'
import { createWorldCmd } from './world'

export function runProgram(core: Core) {
  core.mutateWs((ws) => {
    ws.ui.state = 'running'
  })
  if (core.ws.jvm.classfile) {
    const now = new Date()
    const vm = new JavaVM(core.ws.jvm.classfile, core)
    core.jvm = vm
    core.mutateWs((ws) => {
      ws.ui.messages = []
    })
    addMessage(
      core,
      `[${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}:${now
        .getSeconds()
        .toString()
        .padStart(2, '0')}] Programm gestartet.`
    )
    vm.run().finally(() => {
      core.mutateWs((ws) => {
        ws.ui.state = 'ready'
      })
      addMessage(core, 'Ausführung beendet.')
    })
  }
}

export function resetOutput(core: Core) {
  createWorldCmd(core, 0, 0, 0)
}

export async function stopVM(core: Core) {
  core.mutateWs((ws) => {
    ws.ui.state = 'stopping'
  })
  if (core.jvm) {
    await core.jvm.stop()
    core.mutateWs((ws) => {
      ws.ui.state = 'ready'
    })
  }
}
