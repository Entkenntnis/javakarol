import { faTrashCan } from '@fortawesome/free-solid-svg-icons'
import clsx from 'clsx'

import { resetOutput } from '../lib/commands/jvm'
import { useCore } from '../lib/state/core'
import { FaIcon } from './FaIcon'
import { View } from './View'

export function Player() {
  const core = useCore()

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex-grow h-full min-h-0 relative">
        <div
          className={clsx(
            'flex-grow overflow-auto flex flex-col justify-center h-full',
            core.ws.world.dimX == 0 && 'bg-gray-50'
          )}
        >
          <div className="min-h-0 w-full">
            <div
              tabIndex={1}
              className={clsx(
                'mb-32 mt-12 w-max h-max mx-auto',
                'outline-none'
              )}
            >
              <div className={clsx(core.ws.world.dimX == 0 && 'hidden')}>
                <View world={core.ws.world} wireframe={false} />
              </div>
              {core.ws.world.dimX == 0 && (
                <img
                  src="/robotE.png"
                  alt="Karol sagt hallo"
                  className="mx-auto opacity-40"
                />
              )}
            </div>
          </div>
          {core.ws.world.dimX !== 0 && (
            <div className="absolute bottom-2 left-2 bg-gray-100">
              {core.ws.ui.messages.map((m) => (
                <div key={`${m.ts}`}>
                  {m.text}
                  {m.count > 1 && <span> (x{m.count})</span>}
                </div>
              ))}
            </div>
          )}

          <div className="absolute right-2 top-2">
            {core.ws.ui.messages.length > 0 && core.ws.ui.state == 'ready' && (
              <button
                className="px-2 bg-gray-100 hover:bg-gray-200 rounded h-[25px]"
                onClick={() => {
                  resetOutput(core)
                }}
              >
                <FaIcon icon={faTrashCan} /> Ausgabe löschen
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
