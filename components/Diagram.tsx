export function Diagram() {
  return (
    <>
      <h1 className="m-3 mb-10 text-xl font-bold">Klassendiagramm</h1>
      <div className="flex justify-around mb-10">
        <div className="pt-10">
          <div className="border-2 border-gray-700 h-auto">
            <div className="border-b-2 p-2 bg-gray-200 border-gray-700 text-center">
              Welt
            </div>
            <div className="h-4 border-b-2 border-gray-700"></div>
            <div className="p-2">
              <p>+ Welt()</p>
              <p>+ Welt(int, int)</p>
              <p>+ Welt(int, int, int)</p>
            </div>
          </div>
        </div>
        <div>
          <div className="border-2 border-gray-700">
            <div className="border-b-2 p-2 bg-gray-200 border-gray-700 text-center">
              Roboter
            </div>
            <div className="h-4 border-b-2 border-gray-700"></div>
            <div className="p-2">
              <p>+ Roboter(Welt)</p>
              <div className="h-2"></div>
              <p>+ Schritt()</p>
              <p>+ LinksDrehen()</p>
              <p>+ RechtsDrehen()</p>
              <p>+ Hinlegen()</p>
              <p>+ Aufheben()</p>
              <p>+ MarkeSetzen()</p>
              <p>+ MarkeLoeschen()</p>
              <div className="h-2"></div>
              <p>+ Schritt(int)</p>
              <p>+ LinksDrehen(int)</p>
              <p>+ RechtsDrehen(int)</p>
              <p>+ Hinlegen(int)</p>
              <p>+ Aufheben(int)</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
