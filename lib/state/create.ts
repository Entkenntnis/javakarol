import {
  CoreState,
  WorkspaceState,
  WorkspaceStateBase,
  WorkspaceStateFreeMode,
  World,
} from './types'

export function createDefaultCoreState(): CoreState {
  return {
    showMenu: false,
    enableStats: true,
    editorWorkspace: createFreeModeWorkspaceState(),
    inviteMenu: true,
    inviteStart: true,
    done: [],
  }
}

export function createFreeModeWorkspaceState(): WorkspaceStateFreeMode {
  const ws: WorkspaceState = {
    ...createBaseWorkspace(),
    type: 'free',
  }
  return ws
}

function createBaseWorkspace(): WorkspaceStateBase {
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
      wireframe: false,
      needsTextRefresh: false,
      preview: undefined,
      showPreview: true,
      shouldFocusWrapper: false,
      hideKarol: false,
      keepWorldPreference: false,
      errorMessages: [],
    },
    vm: {
      pc: 0,
      frames: [{}],
      callstack: [],
      needsConfirmation: false,
      confirmation: false,
    },
    jvm: {},
    settings: {
      speed: 'fast',
    },
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
