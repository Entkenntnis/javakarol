import { Text } from '@codemirror/state'
import { parser } from '@lezer/java'

import { Compiler } from '../lib/java/compiler'
import { JavaVM } from '../lib/java/vm'
import { Core } from '../lib/state/core'
import { createDefaultCoreState } from '../lib/state/create'
import { World } from '../lib/state/types'

test('Create new world', async () => {
  await testProgram(
    `
  public class Programm {

    public static void main(String[] args) {
      Welt welt = new Welt(10, 10);
      Roboter karol = new Roboter(welt);
    }
  }
  `,
    (world) => {
      expect(world.dimX).toBe(10)
      expect(world.dimY).toBe(10)
    }
  )
})

test('Create new world width height', async () => {
  await testProgram(
    `
  public class Programm {

    public static void main(String[] args) {
      Welt welt = new Welt(10, 10, 2);
      Roboter karol = new Roboter(welt);
    }
  }
  `,
    (world) => {
      expect(world.dimX).toBe(10)
      expect(world.dimY).toBe(10)
      expect(world.height).toBe(2)
    }
  )
})

test('Moving Karol around', async () => {
  await testProgram(
    `
  public class Programm {

    public static void main(String[] args) {
      Welt welt = new Welt(10, 10);
      Roboter karol = new Roboter(welt);
      karol.Schritt();
      karol.LinksDrehen();
      karol.Schritt(4);
    }
  }
  `,
    (world) => {
      expect(world.karol.x).toBe(4)
      expect(world.karol.y).toBe(1)
    }
  )
})

test('Set und remove marks', async () => {
  await testProgram(
    `
  public class Programm {

    public static void main(String[] args) {
      Welt welt = new Welt();
      Roboter karol = new Roboter(welt);
      karol.MarkeSetzen();
      karol.Schritt();
      karol.MarkeSetzen();
      karol.MarkeLoeschen();
    }
  }
  `,
    (world) => {
      expect(world.karol.x).toBe(0)
      expect(world.karol.y).toBe(1)
      expect(world.marks[0][0]).toBe(true)
      expect(world.marks[1][0]).toBe(false)
    }
  )
})

test('Bricks', async () => {
  await testProgram(
    `
  public class Programm {

    public static void main(String[] args) {
      Welt welt = new Welt();
      Roboter karol = new Roboter(welt);
      karol.Hinlegen();
      karol.LinksDrehen();
      karol.Hinlegen(4);
    }
  }
  `,
    (world) => {
      expect(world.bricks[1][0]).toBe(1)
      expect(world.bricks[0][1]).toBe(4)
    }
  )
})

test('Turning', async () => {
  await testProgram(
    `
  public class Programm {

    public static void main(String[] args) {
      Welt welt = new Welt();
      Roboter karol = new Roboter(welt);
      karol.LinksDrehen();
    }
  }
  `,
    (world) => {
      expect(world.karol.dir).toBe('east')
    }
  )
})

test('Turning more', async () => {
  await testProgram(
    `
  public class Programm {

    public static void main(String[] args) {
      Welt welt = new Welt();
      Roboter karol = new Roboter(welt);
      karol.LinksDrehen();
      karol.RechtsDrehen();
      karol.LinksDrehen(4);
      karol.RechtsDrehen(4);
    }
  }
  `,
    (world) => {
      expect(world.karol.dir).toBe('south')
    }
  )
})

test('Set delay', async () => {
  await testProgram(
    `
  public class Programm {

    public static void main(String[] args) {
      Welt welt = new Welt();
      Roboter karol = new Roboter(welt);
      karol.VerzoegerungSetzen(300);
    }
  }
  `,
    (world) => {
      expect(world.karol.dir).toBe('south')
    }
  )
})

test('Run till wall', async () => {
  await testProgram(
    `
  public class Programm {

    public static void main(String[] args) {
      Welt welt = new Welt(10, 10);
      Roboter karol = new Roboter(welt);
      while (!karol.IstWand()) {
        karol.Schritt();
      }
    }
  }
  `,
    (world) => {
      expect(world.karol.y).toBe(9)
    }
  )
})

test('Run circle', async () => {
  await testProgram(
    `
  public class Programm {

    public static void main(String[] args) {
      Welt welt = new Welt(10, 10);
      Roboter karol = new Roboter(welt);
      karol.MarkeSetzen();
      karol.Schritt();
      while (!karol.IstMarke()) {
        while (!karol.IstWand()) {
          karol.Schritt();
        }
        karol.LinksDrehen();
      }
    }
  }
  `,
    (world) => {
      expect(world.karol.x).toBe(0)
      expect(world.karol.y).toBe(0)
    }
  )
})

test('Run circle with brick condition', async () => {
  await testProgram(
    `
  public class Programm {

    public static void main(String[] args) {
      Welt welt = new Welt(10, 10);
      Roboter karol = new Roboter(welt);
      while (!karol.IstZiegel()) {
        karol.Hinlegen();
        while (!karol.IstWand()) {
          karol.Schritt();
        }
        karol.IstZiegel(); // wall should be false
        karol.LinksDrehen();
      }
    }
  }
  `,
    (world) => {
      expect(world.karol.x).toBe(0)
      expect(world.karol.y).toBe(0)
      expect(world.bricks[8][9]).toBe(1)
    }
  )
})

test('Arithmetic', async () => {
  await testProgram(
    `
  public class Programm {

    public static void main(String[] args) {
      Welt welt = new Welt(10, 10);
      Roboter karol = new Roboter(welt);
      int x = 6 + 4 * 9;
      int y = x / 7;
      int z = y - 3;
      karol.Schritt(z);
    }
  }
  `,
    (world) => {
      expect(world.karol.y).toBe(3)
    }
  )
})

test('Comparison less than', async () => {
  await testProgram(
    `
  public class Programm {

    public static void main(String[] args) {
      Welt welt = new Welt(10, 10);
      Roboter karol = new Roboter(welt);
      int i = 0;
      while (i < 2) {
        karol.Schritt();
        i++;
      }
    }
  }
  `,
    (world) => {
      expect(world.karol.y).toBe(2)
    }
  )
})

test('Comparison less-eq and neq', async () => {
  await testProgram(
    `
  public class Programm {

    public static void main(String[] args) {
      Welt welt = new Welt(10, 10);
      Roboter karol = new Roboter(welt);
      int i = 0;
      while (!(i >= 2)) {
        karol.Schritt();
        i++;
      }
    }
  }
  `,
    (world) => {
      expect(world.karol.y).toBe(2)
    }
  )
})

test('Comparison less-eq and neq', async () => {
  await testProgram(
    `
  public class Programm {

    public static void main(String[] args) {
      Welt welt = new Welt(10, 10);
      Roboter karol = new Roboter(welt);
      int i = 0;
      while (-2 <= -i) {
        karol.Schritt();
        i++;
      }
    }
  }
  `,
    (world) => {
      expect(world.karol.y).toBe(3)
    }
  )
})

test('Comparison greater than', async () => {
  await testProgram(
    `
  public class Programm {

    public static void main(String[] args) {
      Welt welt = new Welt(10, 10);
      Roboter karol = new Roboter(welt);
      int i = 0;
      while (3 > i) {
        karol.Schritt();
        i++;
      }
    }
  }
  `,
    (world) => {
      expect(world.karol.y).toBe(3)
    }
  )
})

test('Logic Operators', async () => {
  await testProgram(
    `
  public class Programm {

    public static void main(String[] args) {
      Welt welt = new Welt(10, 10);
      Roboter karol = new Roboter(welt);
      int i = 0;
      while (i == 0 || i == 1 || i == 2) {
        karol.Schritt();
        i++;
      }
    }
  }
  `,
    (world) => {
      expect(world.karol.y).toBe(3)
    }
  )
})

test('Block variable declaration', async () => {
  await testProgram(
    `
  public class Programm {

    public static void main(String[] args) {
      Welt welt = new Welt(10, 10);
      Roboter karol = new Roboter(welt);
      int i = 0;
      while (i == 0 || i == 1 || i == 2) {
        int j = 1;
        karol.Schritt(j);
        i = i + 1;
      }
    }
  }
  `,
    (world) => {
      expect(world.karol.y).toBe(3)
    }
  )
})

test('Boolean and string literals', async () => {
  await testProgram(
    `
  public class Programm {

    public static void main(String[] args) {
      Welt welt = new Welt(10, 10);
      Roboter karol = new Roboter(welt);
      String s = "test";
      int i = 0;
      while (true && (false || i < 3)) {
        i++;
        karol.Schritt();
      }
    }
  }
  `,
    (world) => {
      expect(world.karol.y).toBe(3)
    }
  )
})

test('Inequality', async () => {
  await testProgram(
    `
  public class Programm {

    public static void main(String[] args) {
      Welt welt = new Welt(10, 10);
      Roboter karol = new Roboter(welt);
      int i = 0;
      while (i != 3) {
        i++;
        karol.Schritt();
      }
    }
  }
  `,
    (world) => {
      expect(world.karol.y).toBe(3)
    }
  )
})

test('Update expression pre/postfix', async () => {
  await testProgram(
    `
  public class Programm {

    public static void main(String[] args) {
      Welt welt = new Welt(10, 10);
      Roboter karol = new Roboter(welt);
      int i = 0;
      while (i != 3) {
        ++i;
        i--;
        i++;
        --i;
        i++;
        karol.Schritt();
      }
    }
  }
  `,
    (world) => {
      expect(world.karol.y).toBe(3)
    }
  )
})

test('Assignment expressions', async () => {
  await testProgram(
    `
  public class Programm {

    public static void main(String[] args) {
      Welt welt = new Welt(10, 10);
      Roboter karol = new Roboter(welt);
      int i = 1;
      i += 1;
      i *= 2;
      i /= 2;
      i -= 1;
      karol.Schritt(i);
    }
  }
  `,
    (world) => {
      expect(world.karol.y).toBe(1)
    }
  )
})

test('Assignment in different blocks', async () => {
  await testProgram(
    `
  public class Programm {

    public static void main(String[] args) {
      Welt welt = new Welt(10, 10);
      Roboter karol = new Roboter(welt);
      while (false) {
        int i = 3;
      }
      while (false) {
        int i = 4;
      }
    }
  }
  `,
    (world) => {}
  )
})

test('Continue statement', async () => {
  await testProgram(
    `
  public class Programm {

    public static void main(String[] args) {
      Welt welt = new Welt(10, 10);
      Roboter karol = new Roboter(welt);
      int i = 0;
      while (i < 4) {
        i++;
        karol.Schritt();
        continue;
        i++;
      }
    }
  }
  `,
    (world) => {
      expect(world.karol.y).toBe(4)
    }
  )
})

test('Break statement', async () => {
  await testProgram(
    `
  public class Programm {

    public static void main(String[] args) {
      Welt welt = new Welt(10, 10);
      Roboter karol = new Roboter(welt);
      while (true) {
        karol.Schritt();
        karol.Schritt();
        break;
        karol.Schritt();
        karol.Schritt();
      }
    }
  }
  `,
    (world) => {
      expect(world.karol.y).toBe(2)
    }
  )
})

test('Blocks', async () => {
  await testProgram(
    `
  public class Programm {

    public static void main(String[] args) {
      Welt welt = new Welt(10, 10);
      Roboter karol = new Roboter(welt);
      {
        int i = 0;
      }
      {
        int i = 1;
      }
    }
  }
  `,
    (world) => {}
  )
})

test('Blocks', async () => {
  await testProgram(
    `
  public class Programm {

    public static void main(String[] args) {
      Welt welt = new Welt(10, 10);
      Roboter karol = new Roboter(welt);
      karol.Schritt(10 % 4);
    }
  }
  `,
    (world) => {
      expect(world.karol.y).toBe(2)
    }
  )
})

async function testProgram(program: String, check: (world: World) => void) {
  const doc = Text.of(program.split('\n'))
  const tree = parser.parse(doc.sliceString(0))
  const compiler = new Compiler(tree, doc)
  compiler.compile()
  expect(compiler.warnings.length).toBe(0)
  const core = createNewCore()
  const jvm = new JavaVM(compiler.classFile, core)
  jvm.testMode = true
  await jvm.run()
  check(core.ws.world)
}

function createNewCore() {
  const coreState = createDefaultCoreState()
  const ref = { current: { state: coreState } }
  return new Core(() => {}, ref)
}

export {} // make tsc happy
