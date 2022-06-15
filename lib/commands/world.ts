import { Core } from '../state/core'
import { createWorld } from '../state/create'
import { Heading, World } from '../state/types'
import { addMessage } from './messages'

export function forward(core: Core) {
  const { world } = core.ws
  const { karol, bricks } = world
  const { dir } = karol
  const target = move(karol.x, karol.y, dir, world)

  if (!target) {
    addMessage(core, 'Karol kann sich nicht in diese Richtung bewegen.')
    return false
  }

  const currentBrickCount = bricks[karol.y][karol.x]
  const targetBrickCount = bricks[target.y][target.x]

  if (Math.abs(currentBrickCount - targetBrickCount) > 1 /* constant ... */) {
    addMessage(core, 'Karol kann diese Höhe nicht überwinden.')
    return false
  }

  core.mutateWs(({ world }) => {
    world.karol.x = target.x
    world.karol.y = target.y
  })
  return true
}

export function left(core: Core) {
  core.mutateWs(({ world }) => {
    world.karol.dir = turnLeft(world.karol.dir)
  })
}

export function right(core: Core) {
  core.mutateWs(({ world }) => {
    world.karol.dir = turnRight(world.karol.dir)
  })
}

export function brick(core: Core) {
  const { world } = core.ws
  const { karol, bricks, height } = world
  const pos = move(karol.x, karol.y, karol.dir, world)

  if (!pos) {
    addMessage(core, 'Karol kann hier keinen Ziegel aufstellen.')
    return false
  }

  if (bricks[pos.y][pos.x] >= height) {
    addMessage(core, 'Maximale Stapelhöhe erreicht.')
    return false
  }

  core.mutateWs((state) => {
    state.world.bricks[pos.y][pos.x] = world.bricks[pos.y][pos.x] + 1
  })
  return true
}

export function unbrick(core: Core) {
  const { world } = core.ws
  const { karol, bricks } = world
  const pos = move(karol.x, karol.y, karol.dir, world)

  if (!pos) {
    addMessage(core, 'Karol kann hier keine Ziegel aufheben.')
    return false
  }

  if (bricks[pos.y][pos.x] <= 0) {
    addMessage(core, 'Keine Ziegel zum Aufheben')
    return false
  }

  core.mutateWs((state) => {
    state.world.bricks[pos.y][pos.x] = world.bricks[pos.y][pos.x] - 1
  })
  return true
}

export function setMark(core: Core) {
  const { world } = core.ws
  const karol = world.karol

  core.mutateWs(({ world }) => {
    world.marks[world.karol.y][world.karol.x] = true
  })
  return true
}

export function resetMark(core: Core) {
  const { world } = core.ws
  const karol = world.karol

  core.mutateWs(({ world }) => {
    world.marks[world.karol.y][world.karol.x] = false
  })
  return true
}

export function toggleBlock(core: Core) {
  const { world } = core.ws
  const { karol, blocks, bricks, marks } = world
  const pos = moveRaw(karol.x, karol.y, karol.dir, world)

  if (!pos) {
    addMessage(core, 'Karol kann hier keinen Quader aufstellen.')
    return false
  }

  if (blocks[pos.y][pos.x]) {
    core.mutateWs(({ world }) => {
      world.blocks[pos.y][pos.x] = false
    })
    return true
  } else {
    if (bricks[pos.y][pos.x] > 0) {
      addMessage(core, 'Karol kann keinen Quader auf Ziegel stellen.')
      return false
    }
    if (marks[pos.y][pos.x]) {
      addMessage(core, 'Karol kann keinen Quader auf eine Marke stellen.')
      return false
    }
    core.mutateWs(({ world }) => {
      world.blocks[pos.y][pos.x] = true
    })
    return true
  }
}

export function move(x: number, y: number, dir: Heading, world: World) {
  const pos = moveRaw(x, y, dir, world)
  if (pos && !world.blocks[pos.y][pos.x]) {
    return pos
  }
}

export function moveRaw(x: number, y: number, dir: Heading, world: World) {
  if (dir == 'east') {
    if (x + 1 < world.dimX) {
      return { x: x + 1, y }
    }
  }
  if (dir == 'west') {
    if (x > 0) {
      return { x: x - 1, y }
    }
  }
  if (dir == 'south') {
    if (y + 1 < world.dimY) {
      return { x, y: y + 1 }
    }
  }
  if (dir == 'north') {
    if (y > 0) {
      return { x, y: y - 1 }
    }
  }
}

export function reverse(h: Heading) {
  return { north: 'south', south: 'north', east: 'west', west: 'east' }[
    h
  ] as Heading
}

export function turnLeft(h: Heading) {
  return {
    north: 'west',
    west: 'south',
    south: 'east',
    east: 'north',
  }[h] as Heading
}

export function turnRight(h: Heading) {
  return {
    north: 'east',
    east: 'south',
    south: 'west',
    west: 'north',
  }[h] as Heading
}

export function createWorldCmd(core: Core, x: number, y: number, z: number) {
  core.mutateWs((state) => {
    state.world = createWorld(x, y, z)
  })
}
