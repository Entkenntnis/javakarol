import { CoreState, WorkspaceState, World } from './types'

export function createDefaultCoreState(): CoreState {
  return {
    workSpace: createWorkspace(),
  }
}

function createWorkspace(): WorkspaceState {
  return {
    world: createWorld(0, 0, 0),
    code: `
public class Programm {

  public static void main(String[] args) {
    Welt welt = new Welt();
    Roboter karol = new Roboter(welt);
    karol.Hinlegen();
    karol.Schritt();
    karol.LinksDrehen(4);
  }
}
`,
    ui: {
      messages: [],
      gutter: 0,
      gutterReturns: [],
      state: 'loading',
      needsTextRefresh: false,
      errorMessages: [],
      modal: 'none',
    },
    jvm: {},
  }
}

export function createWorld(dimX: number, dimY: number, height: number): World {
  const world: World = {
    dimX,
    dimY,
    height,
    karol: {
      x: 0,
      y: 0,
      dir: 'south',
    },
    bricks: Array(dimY)
      .fill(0)
      .map(() => Array(dimX).fill(0)),

    marks: Array(dimY)
      .fill(0)
      .map(() => Array(dimX).fill(false)),
    blocks: Array(dimY)
      .fill(0)
      .map(() => Array(dimX).fill(false)),
  }
  return world
}
