import { Text } from '@codemirror/state'
import { parser } from '@lezer/java'

import { Compiler } from '../lib/java/compiler'
import { JavaVM } from '../lib/java/vm'
import { Core } from '../lib/state/core'
import { createDefaultCoreState } from '../lib/state/create'

function createNewCore() {
  const coreState = createDefaultCoreState()
  const ref = { current: { state: coreState } }
  return new Core(() => {}, ref)
}

test('Abort vm', async () => {
  const program = `
  public class Programm {
    public static void main(String[] args) {
      Welt welt = new Welt(100, 1, 1);
      Roboter karol = new Roboter(welt);
      karol.VerzoegerungSetzen(100);
      karol.LinksDrehen();
      karol.Schritt(100);
    }
  }`
  const doc = Text.of(program.split('\n'))
  const tree = parser.parse(doc.sliceString(0))
  const compiler = new Compiler(tree, doc)
  compiler.compile()
  expect(compiler.warnings.length).toBe(0)
  const core = createNewCore()
  const jvm = new JavaVM(compiler.classFile, core)
  //jvm.testMode = true
  jvm.run()
  await new Promise((r) => setTimeout(r, 500))
  await jvm.stop()
  expect(core.ws.world.karol.x).toBeLessThan(10)
})

export {} // make tsc happy
