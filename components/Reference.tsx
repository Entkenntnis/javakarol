export function Reference() {
  return (
    <>
      <h1 className="m-3 mb-6 text-xl font-bold">API-Referenz</h1>
      <h2 className="m-3 text-lg font-bold">Klasse Welt</h2>
      <p className="m-3">
        Robot Karol lebt in einem Objekt der Klasse Welt. Es wird normalerweise
        immer eine Welt erstellt.
      </p>
      <div className="m-3 mb-6">
        <table className="border-collapse border table-fixed w-full">
          <thead>
            <tr>
              <th className="border w-[200px] text-left p-2">Konstruktor</th>
              <th className="border text-left p-2">Beschreibung</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border text-left p-2 font-mono">Welt()</td>
              <td className="border text-left p-2">
                Erzeugt eine neue Welt mit folgender Standardgröße: Breite 4,
                Länge 4, Höhe 6.
              </td>
            </tr>
            <tr>
              <td className="border text-left p-2 font-mono">
                Welt(int breite, int laenge)
              </td>
              <td className="border text-left p-2">
                Erzeugt eine neue Welt mit der angegebenen Breite und Länge und
                der Standardhöhe 6.
              </td>
            </tr>
            <tr>
              <td className="border text-left p-2 font-mono">
                Welt(int breite, int laenge, int hoehe)
              </td>
              <td className="border text-left p-2">
                Erzeugt eine neue Welt mit der angegebenen Breite, Länge und
                Höhe.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <h2 className="m-3 mb-4 text-lg font-bold">Klasse Roboter</h2>{' '}
      <p className="m-3">
        Ein Roboter-Objekt in einer Welt, kann auf viele Arten gesteuert werden.
      </p>
      <div className="m-3 mb-6">
        <table className="border-collapse border table-fixed w-full">
          <thead>
            <tr>
              <th className="border w-[200px] text-left p-2">Konstruktor</th>
              <th className="border text-left p-2">Beschreibung</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border text-left p-2 font-mono">
                Roboter(Welt welt)
              </td>
              <td className="border text-left p-2">
                Erzeugt einen neuen Roboter in der angegebenen Welt.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="m-3 mb-6">
        <table className="border-collapse border table-fixed w-full">
          <thead>
            <tr>
              <th className="border w-[200px] text-left p-2">Methode</th>
              <th className="border text-left p-2">Beschreibung</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border text-left p-2 font-mono">Schritt()</td>
              <td className="border text-left p-2">
                Karol geht einen Schritt.
              </td>
            </tr>{' '}
            <tr>
              <td className="border text-left p-2 font-mono">LinksDrehen()</td>
              <td className="border text-left p-2">
                Karol dreht sich 90 Grad nach links.
              </td>
            </tr>{' '}
            <tr>
              <td className="border text-left p-2 font-mono">RechtsDrehen()</td>
              <td className="border text-left p-2">
                Karol dreht sich 90 Grad nach rechts.
              </td>
            </tr>
            <tr>
              <td className="border text-left p-2 font-mono">Hinlegen()</td>
              <td className="border text-left p-2">
                Karol legt auf das Feld vor sich einen Ziegel.
              </td>
            </tr>
            <tr>
              <td className="border text-left p-2 font-mono">Aufheben()</td>
              <td className="border text-left p-2">
                Karol hebt einen Ziegel vor sich auf.
              </td>
            </tr>
            <tr>
              <td className="border text-left p-2 font-mono">MarkeSetzen()</td>
              <td className="border text-left p-2">
                Karol setzt unter sich eine Marke.
              </td>
            </tr>
            <tr>
              <td className="border text-left p-2 font-mono">
                MarkeLoeschen()
              </td>
              <td className="border text-left p-2">
                Karol entfernt eine Marke unter sich.
              </td>
            </tr>
            <tr>
              <td className="border text-left p-2 font-mono">
                Schritt(int anzahl)
              </td>
              <td className="border text-left p-2">
                Karol geht mehrere Schritte.
              </td>
            </tr>{' '}
            <tr>
              <td className="border text-left p-2 font-mono">
                LinksDrehen(int anzahl)
              </td>
              <td className="border text-left p-2">
                Karol dreht sich mehrfach 90 Grad nach links.
              </td>
            </tr>{' '}
            <tr>
              <td className="border text-left p-2 font-mono">
                RechtsDrehen(int anzahl)
              </td>
              <td className="border text-left p-2">
                Karol dreht sich mehrfach 90 Grad nach rechts.
              </td>
            </tr>
            <tr>
              <td className="border text-left p-2 font-mono">
                Hinlegen(int anzahl)
              </td>
              <td className="border text-left p-2">
                Karol legt auf das Feld vor sich mehrere Ziegel.
              </td>
            </tr>
            <tr>
              <td className="border text-left p-2 font-mono">
                Aufheben(int anzahl)
              </td>
              <td className="border text-left p-2">
                Karol hebt mehrere Ziegel vor sich auf.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  )
}
