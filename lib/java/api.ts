import {
  brick,
  createWorldCmd,
  forward,
  left,
  resetMark,
  right,
  setMark,
} from '../commands/world'
import { Core } from '../state/core'

const execSpeed = 100

interface ApiMethod {
  invoke: (stack: any[], core: Core) => Promise<void>
}

export const javaKarolApi: { [key: string]: ApiMethod } = {
  Welt_constructor: {
    invoke: async (stack, core) => {
      createWorldCmd(core, 5, 5, 6)
      stack.push('placeholder_Welt')
      await sleep(execSpeed)
    },
  },
  Welt_constructor_int_int: {
    invoke: async (stack, core) => {
      const y = stack.pop()
      const x = stack.pop()
      createWorldCmd(core, x, y, 6)
      stack.push('placeholder_Welt')
      await sleep(execSpeed)
    },
  },
  Welt_constructor_int_int_int: {
    invoke: async (stack, core) => {
      const h = stack.pop()
      const y = stack.pop()
      const x = stack.pop()
      createWorldCmd(core, x, y, h)
      stack.push('placeholder_Welt')
      await sleep(execSpeed)
    },
  },
  Roboter_constructor_Welt: {
    invoke: async (stack, core) => {
      stack.push('placeholder_Roboter')
      stack.pop()
      await sleep(execSpeed)
    },
  },
  Roboter_Hinlegen: {
    invoke: async (stack, core) => {
      brick(core)
      await sleep(execSpeed)
    },
  },
  Roboter_Hinlegen_int: {
    invoke: async (stack, core) => {
      const val = stack.pop()
      for (let i = 0; i < val; i++) {
        brick(core)
        await sleep(execSpeed)
      }
    },
  },
  Roboter_Schritt: {
    invoke: async (stack, core) => {
      forward(core)
      await sleep(execSpeed)
    },
  },
  Roboter_Schritt_int: {
    invoke: async (stack, core) => {
      const val = stack.pop()
      for (let i = 0; i < val; i++) {
        forward(core)
        await sleep(execSpeed)
      }
    },
  },
  Roboter_LinksDrehen: {
    invoke: async (stack, core) => {
      left(core)
      await sleep(execSpeed)
    },
  },
  Roboter_LinksDrehen_int: {
    invoke: async (stack, core) => {
      const val = stack.pop()
      for (let i = 0; i < val; i++) {
        left(core)
        await sleep(execSpeed)
      }
    },
  },
  Roboter_RechtsDrehen: {
    invoke: async (stack, core) => {
      right(core)
      await sleep(execSpeed)
    },
  },
  Roboter_RechtsDrehen_int: {
    invoke: async (stack, core) => {
      const val = stack.pop()
      for (let i = 0; i < val; i++) {
        right(core)
        await sleep(execSpeed)
      }
    },
  },
  Roboter_MarkeSetzen: {
    invoke: async (stack, core) => {
      setMark(core)
      await sleep(execSpeed)
    },
  },
  Roboter_MarkeLoeschen: {
    invoke: async (stack, core) => {
      resetMark(core)
      await sleep(execSpeed)
    },
  },
}

const sleep = (milliseconds: number) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}
