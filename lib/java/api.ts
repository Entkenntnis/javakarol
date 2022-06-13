import { brick, createWorldCmd, forward, left } from '../commands/world'
import { Core } from '../state/core'

interface ApiMethod {
  invoke: (stack: any[], core: Core) => Promise<void>
}

export const javaKarolApi: { [key: string]: ApiMethod } = {
  Welt_constructor: {
    invoke: async (stack, core) => {
      createWorldCmd(core, 5, 5, 6)
      await sleep(500)
    },
  },
  Roboter_constructor_Welt: {
    invoke: async (stack, core) => {
      stack.pop()
      await sleep(500)
    },
  },
  Roboter_Hinlegen: {
    invoke: async (stack, core) => {
      brick(core)
      await sleep(500)
    },
  },
  Roboter_Schritt: {
    invoke: async (stack, core) => {
      forward(core)
      await sleep(500)
    },
  },
  Roboter_LinksDrehen_int: {
    invoke: async (stack, core) => {
      console.log('links')
      stack.pop()
      const val = 4
      console.log(val)
      for (let i = 0; i < val; i++) {
        left(core)
        await sleep(500)
      }
    },
  },
}

const sleep = (milliseconds: number) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}
