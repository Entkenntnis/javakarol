import clsx from 'clsx'
import { ReactNode, useState } from 'react'

export function Examples() {
  const [exampleIndex, setExampleIndex] = useState(0)

  return (
    <>
      <div className="flex h-full flex-col">
        <h1 className="m-3 mb-4 text-xl font-bold">Beispiele</h1>
        <div className="flex overflow-auto">
          <div className="bg-gray-50">
            <ul className="ml-3">
              {examples.map((e, i) => (
                <li
                  key={e.title}
                  onClick={() => {
                    setExampleIndex(i)
                  }}
                  className={clsx(
                    'cursor-pointer hover:bg-gray-200 p-2',
                    i == exampleIndex && 'bg-gray-200'
                  )}
                >
                  {e.title}
                </li>
              ))}
            </ul>
          </div>
          <div className="m-3 mt-1 w-full overflow-auto">
            <h2 className="font-bold text-lg mb-4">
              {examples[exampleIndex].title}
            </h2>
            {examples[exampleIndex].description}
            {examples[exampleIndex].img && (
              <img
                src={examples[exampleIndex].img}
                alt="Ausgabe"
                className="p-2"
              />
            )}
            <pre className="mt-4 border-2 p-3 w-full">
              <code>{examples[exampleIndex].code}</code>
            </pre>
          </div>
        </div>
      </div>
    </>
  )
}

interface ExampleDate {
  title: string
  description: ReactNode
  code: string
  img?: string
}

const examples: ExampleDate[] = [
  {
    title: 'Erste Schritte', // http://localhost:3000/?id=QsygDWRNQ
    description: (
      <>
        <p>
          Das hier ist eine erste Grundstruktur von Robot Karol. Es enthält alle
          nötigen äußeren Element und lässt Karol einmal im Kreis durch die Welt
          spazieren.
        </p>
      </>
    ),
    code: `public class Programm {

  public static void main(String[] args) {
    Welt welt = new Welt();
    Roboter karol = new Roboter(welt);

    karol.Schritt();
    karol.Schritt();
    karol.Schritt();
    karol.Schritt();
    karol.LinksDrehen();

    karol.Schritt();
    karol.Schritt();
    karol.Schritt();
    karol.Schritt();
    karol.LinksDrehen();

    karol.Schritt();
    karol.Schritt();
    karol.Schritt();
    karol.Schritt();
    karol.LinksDrehen();

    karol.Schritt();
    karol.Schritt();
    karol.Schritt();
    karol.Schritt();
    karol.LinksDrehen();
  }
}
`,
    img: '/examples/ersteSchritte.png',
  },
  {
    title: 'Ziegel und Marken', // http://localhost:3000/?id=wydkjfi5C
    description: (
      <>
        <p>Beispiel für die Nutzung von Ziegeln und Marken:</p>
      </>
    ),
    code: `public class Programm {

  public static void main(String[] args) {
    Welt welt = new Welt();
    Roboter karol = new Roboter(welt);

    karol.LinksDrehen();
    karol.MarkeSetzen();
    karol.Hinlegen();
    karol.Schritt();
    karol.Schritt();
    karol.MarkeSetzen();
    karol.Hinlegen();
    karol.Schritt();
    karol.Schritt();
    karol.MarkeSetzen();
    karol.RechtsDrehen();
  }
}
`,
    img: '/examples/ziegelundmarken.png',
  },
  {
    title: 'Welt erzeugen', // http://localhost:3000/?id=jYp6LHbwe
    description: (
      <>
        <p>
          Bei der Erzeugung einer neuen Welt kann die Breite, Länge und Höhe
          angegeben werden:
        </p>
      </>
    ),
    code: `public class Programm {

  public static void main(String[] args) {
    Welt welt = new Welt(15, 5, 10);
    Roboter karol = new Roboter(welt);
  }
}`,
    img: '/examples/welterzeugen.png',
  },
  {
    title: 'Befehle mit Parameter', // http://localhost:3000/?id=X424tqwEN
    description: (
      <>
        <p>
          Die Befehle Schritt, LinksDrehen, RechtsDrehen, Hinlegen und Aufheben
          können mit einem Parameter mehrfach ausgeführt werden:
        </p>
      </>
    ),
    code: `public class Programm {

  public static void main(String[] args) {
    Welt welt = new Welt(10, 5, 10);
    Roboter karol = new Roboter(welt);
    karol.Schritt(3);
    karol.Hinlegen(10);
    karol.LinksDrehen();
    karol.Schritt(9);
    karol.RechtsDrehen();
    karol.Hinlegen(10);
    karol.RechtsDrehen();
    karol.Schritt(5);
    karol.LinksDrehen(21);
  }
}`,
    img: '/examples/befehleparameter.png',
  },
]
