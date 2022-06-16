import { Text } from '@codemirror/state'
import { parser } from '@lezer/java'
import { Compiler } from '../lib/java/compiler'

test('Invalid world constructor', () => {
  shouldNotCompile(`
  public class Programm {

    public static void main(String[] args) {
      Welt welt = new Welt(4);
    }
  }
  `)
})

function shouldNotCompile(program: string) {
  const doc = Text.of(program.split('\n'))
  const tree = parser.parse(doc.sliceString(0))
  const compiler = new Compiler(tree, doc)
  compiler.compile()
  expect(compiler.warnings.length).toBeGreaterThan(0)
}

export {}
