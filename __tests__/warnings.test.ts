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

test('Syntax error', () => {
  shouldNotCompile(`
  public class Programm {

    public static void main(String[] args) {
      Welt welt = new Welt()
    }
  }
  `)
})

test('No main block', () => {
  shouldNotCompile(`
  public class Programm {
    
  }
  `)
})

test('Type mismatch on var decl', () => {
  shouldNotCompile(`
  public class Programm {
    public static void main(String[] args) {
      Welt welt = new Weltt();
    }
  }
  `)
})

test('While condition not boolean', () => {
  shouldNotCompile(`
  public class Programm {
    public static void main(String[] args) {
      while(1) {}
    }
  }
  `)
})

test('Unknown expression', () => {
  shouldNotCompile(`
  public class Programm {
    public static void main(String[] args) {
      label: ;
    }
  }
  `)
})

test('Unknown variable', () => {
  shouldNotCompile(`
  public class Programm {
    public static void main(String[] args) {
      int x = k;
    }
  }
  `)
})

test('Unknown api method', () => {
  shouldNotCompile(`
  public class Programm {
    public static void main(String[] args) {
      Welt welt = new Welt();
      Roboter karol = new Roboter(welt);
      karol.Schritt(welt);
    }
  }
  `)
})

test('Invoke method on unknown identifier', () => {
  shouldNotCompile(`
  public class Programm {
    public static void main(String[] args) {
      Welt welt = new Welt();
      Roboter karol = new Roboter(welt);
      karo.Schritt();
    }
  }
  `)
})

test('Wrong argument types for arithmetic', () => {
  shouldNotCompile(`
  public class Programm {
    public static void main(String[] args) {
      int z = 4 / true;
    }
  }
  `)
})

test('Missing operand', () => {
  shouldNotCompile(`
  public class Programm {
    public static void main(String[] args) {
      int z = 4 /;
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
