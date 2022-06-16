import {
  brick,
  createWorldCmd,
  forward,
  left,
  move,
  moveRaw,
  resetMark,
  right,
  setMark,
} from '../commands/world'
import { Core } from '../state/core'
import { FrameEntry } from './compiler'

const createWorldDelay = 100

interface Robot {
  execDelayMs: number
}

interface ApiMethod {
  invoke: (context: {
    obj: any
    args: any[]
    core: Core
    stack: any[]
    sleep: (ms: number) => Promise<void>
  }) => Promise<any>
  return?: FrameEntry
}

export const javaKarolApi: { [key: string]: ApiMethod } = {
  Welt_constructor: {
    invoke: async ({ core, sleep }) => {
      createWorldCmd(core, 5, 5, 6)
      await sleep(createWorldDelay)
      return 'placeholder_Welt'
    },
  },
  Welt_constructor_int_int: {
    invoke: async ({ core, args, sleep }) => {
      const [x, y] = args
      createWorldCmd(core, x, y, 6)
      await sleep(createWorldDelay)
      return 'placeholder_Welt'
    },
  },
  Welt_constructor_int_int_int: {
    invoke: async ({ args, core, sleep }) => {
      const [x, y, h] = args
      createWorldCmd(core, x, y, h)
      await sleep(createWorldDelay)
      return 'placeholder_Welt'
    },
  },
  Roboter_constructor_Welt: {
    invoke: async ({ sleep }): Promise<Robot> => {
      await sleep(createWorldDelay)
      const robot: Robot = { execDelayMs: 120 }
      return robot
    },
  },
  Roboter_VerzoegerungSetzen_int: {
    invoke: async ({ args, obj }) => {
      const [ms] = args
      const robot = obj as Robot
      robot.execDelayMs = ms
    },
  },
  Roboter_Hinlegen: {
    invoke: async ({ core, sleep, obj }) => {
      const robot = obj as Robot
      brick(core)
      await sleep(robot.execDelayMs)
    },
  },
  Roboter_Hinlegen_int: {
    invoke: async ({ core, args, sleep, obj }) => {
      const robot = obj as Robot
      const [val] = args
      for (let i = 0; i < val; i++) {
        brick(core)
        await sleep(robot.execDelayMs)
      }
    },
  },
  Roboter_Schritt: {
    invoke: async ({ core, sleep, obj }) => {
      const robot = obj as Robot
      forward(core)
      await sleep(robot.execDelayMs)
    },
  },
  Roboter_Schritt_int: {
    invoke: async ({ core, args, sleep, obj }) => {
      const robot = obj as Robot
      const [val] = args
      for (let i = 0; i < val; i++) {
        forward(core)
        await sleep(robot.execDelayMs)
      }
    },
  },
  Roboter_LinksDrehen: {
    invoke: async ({ core, sleep, obj }) => {
      const robot = obj as Robot
      left(core)
      await sleep(robot.execDelayMs)
    },
  },
  Roboter_LinksDrehen_int: {
    invoke: async ({ core, args, sleep, obj }) => {
      const robot = obj as Robot
      const [val] = args
      for (let i = 0; i < val; i++) {
        left(core)
        await sleep(robot.execDelayMs)
      }
    },
  },
  Roboter_RechtsDrehen: {
    invoke: async ({ core, sleep, obj }) => {
      const robot = obj as Robot
      right(core)
      await sleep(robot.execDelayMs)
    },
  },
  Roboter_RechtsDrehen_int: {
    invoke: async ({ core, args, sleep, obj }) => {
      const robot = obj as Robot
      const [val] = args
      for (let i = 0; i < val; i++) {
        right(core)
        await sleep(robot.execDelayMs)
      }
    },
  },
  Roboter_MarkeSetzen: {
    invoke: async ({ core, sleep, obj }) => {
      const robot = obj as Robot
      setMark(core)
      await sleep(robot.execDelayMs)
    },
  },
  Roboter_MarkeLoeschen: {
    invoke: async ({ core, sleep, obj }) => {
      const robot = obj as Robot
      resetMark(core)
      await sleep(robot.execDelayMs)
    },
  },
  Roboter_IstWand: {
    invoke: async ({ core }): Promise<boolean> => {
      const { x, y, dir } = core.ws.world.karol
      const newpos = move(x, y, dir, core.ws.world)
      return !newpos
    },
    return: { type: 'boolean' },
  },
  Roboter_IstZiegel: {
    invoke: async ({ core }): Promise<boolean> => {
      const { x, y, dir } = core.ws.world.karol
      const newpos = moveRaw(x, y, dir, core.ws.world)
      if (!newpos) {
        return false
      } else {
        const count = core.ws.world.bricks[newpos.y][newpos.x]
        return count > 0
      }
    },
    return: { type: 'boolean' },
  },
  Roboter_IstMarke: {
    invoke: async ({ core }): Promise<boolean> => {
      const { x, y, dir } = core.ws.world.karol
      return core.ws.world.marks[y][x]
    },
    return: { type: 'boolean' },
  },
}
