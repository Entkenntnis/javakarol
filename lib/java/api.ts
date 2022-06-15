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
  invoke: (context: {
    obj: any
    args: any[]
    core: Core
    stack: any[]
    sleep: (ms: number) => Promise<void>
  }) => Promise<any>
}

export const javaKarolApi: { [key: string]: ApiMethod } = {
  Welt_constructor: {
    invoke: async ({ core, sleep }) => {
      createWorldCmd(core, 5, 5, 6)
      await sleep(execSpeed)
      return 'placeholder_Welt'
    },
  },
  Welt_constructor_int_int: {
    invoke: async ({ core, args, sleep }) => {
      const [x, y] = args
      createWorldCmd(core, x, y, 6)
      await sleep(execSpeed)
      return 'placeholder_Welt'
    },
  },
  Welt_constructor_int_int_int: {
    invoke: async ({ args, core, sleep }) => {
      const [x, y, h] = args
      createWorldCmd(core, x, y, h)
      await sleep(execSpeed)
      return 'placeholder_Welt'
    },
  },
  Roboter_constructor_Welt: {
    invoke: async ({ sleep }) => {
      await sleep(execSpeed)
      return 'placeholder_Roboter'
    },
  },
  Roboter_Hinlegen: {
    invoke: async ({ core, sleep }) => {
      brick(core)
      await sleep(execSpeed)
    },
  },
  Roboter_Hinlegen_int: {
    invoke: async ({ core, args, sleep }) => {
      const [val] = args
      for (let i = 0; i < val; i++) {
        brick(core)
        await sleep(execSpeed)
      }
    },
  },
  Roboter_Schritt: {
    invoke: async ({ core, sleep }) => {
      forward(core)
      await sleep(execSpeed)
    },
  },
  Roboter_Schritt_int: {
    invoke: async ({ core, args, sleep }) => {
      const [val] = args
      for (let i = 0; i < val; i++) {
        forward(core)
        await sleep(execSpeed)
      }
    },
  },
  Roboter_LinksDrehen: {
    invoke: async ({ core, sleep }) => {
      left(core)
      await sleep(execSpeed)
    },
  },
  Roboter_LinksDrehen_int: {
    invoke: async ({ core, args, sleep }) => {
      const [val] = args
      for (let i = 0; i < val; i++) {
        left(core)
        await sleep(execSpeed)
      }
    },
  },
  Roboter_RechtsDrehen: {
    invoke: async ({ core, sleep }) => {
      right(core)
      await sleep(execSpeed)
    },
  },
  Roboter_RechtsDrehen_int: {
    invoke: async ({ core, args, sleep }) => {
      const [val] = args
      for (let i = 0; i < val; i++) {
        right(core)
        await sleep(execSpeed)
      }
    },
  },
  Roboter_MarkeSetzen: {
    invoke: async ({ core, sleep }) => {
      setMark(core)
      await sleep(execSpeed)
    },
  },
  Roboter_MarkeLoeschen: {
    invoke: async ({ core, sleep }) => {
      resetMark(core)
      await sleep(execSpeed)
    },
  },
}
