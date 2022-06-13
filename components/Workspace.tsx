import {
  faBook,
  faCode,
  faDiagramProject,
  faExternalLinkAlt,
  faShare,
} from '@fortawesome/free-solid-svg-icons'
import clsx from 'clsx'
import { ReflexElement, ReflexSplitter, ReflexContainer } from 'react-reflex'

import { openMenu } from '../lib/commands/menu'
import { useCore } from '../lib/state/core'
import { EditArea } from './EditArea'
import { FaIcon } from './FaIcon'
import { FileInput } from './FileInput'
import { Ping } from './Ping'
import { Player } from './Player'

export function Workspace() {
  const core = useCore()

  return (
    <>
      {core.ws.type == 'puzzle' && core.ws.preMode && (
        <div className="absolute inset-0 bg-gray-400/60 z-20"></div>
      )}
      <FileInput />
      {core.ws.type == 'free' && (
        <button
          className={clsx(
            'absolute right-1 top-1 rounded z-10',
            'px-2 py-0.5 bg-blue-300 hover:bg-blue-400 hidden'
          )}
          onClick={() => {
            openMenu(core)
          }}
        >
          Menü
          {core.state.inviteMenu && <Ping />}
        </button>
      )}
      {core.ws.type == 'puzzle' &&
        !core.ws.preMode &&
        core.ws.progress < 100 &&
        core.ws.ui.state !== 'running' && (
          <div className="absolute right-1 top-1  z-10">
            {core.ws.code.trim() !== core.puzzle.code.trim() &&
              core.ws.progress > 0 && (
                <button
                  className="px-2 py-0.5 bg-yellow-300 hover:bg-yellow-400 rounded mr-2"
                  onClick={() => {
                    openMenu(core)
                    core.setWsToStorage(
                      core.puzzle.id,
                      core.ws.world,
                      core.ws.code
                    )
                  }}
                >
                  Speichern &amp; schließen
                </button>
              )}
            <button
              className={clsx(
                'rounded',
                'px-2 py-0.5 bg-blue-300 hover:bg-blue-400'
              )}
              onClick={() => {
                if (
                  core.ws.type == 'puzzle' &&
                  core.ws.code.trim() !== core.puzzle.code.trim() &&
                  core.ws.progress > 0
                ) {
                  const val = confirm(
                    'Ungespeicherte Änderungen gehen verloren. Fortfahren?'
                  )
                  if (val) {
                    core.deleteWsFromStorage(core.puzzle.id)
                  } else {
                    return
                  }
                }
                openMenu(core)
              }}
            >
              Schließen
            </button>
          </div>
        )}
      <div className="h-full">
        <div className="h-[calc(100vh-40px)]">
          <ReflexContainer orientation="vertical" windowResizeAware>
            <ReflexElement className="h-full" minSize={300}>
              <EditArea />
            </ReflexElement>

            <ReflexSplitter style={{ width: 3 }} />

            <ReflexElement minSize={200}>
              <Player />
            </ReflexElement>
          </ReflexContainer>
        </div>
        <div className="bg-white flex border-t h-[40px] flex-shrink-0">
          <div className="w-full overflow-auto my-auto flex justify-between">
            <div className="ml-3 my-1">
              <button className="hover:underline">
                <FaIcon
                  icon={faDiagramProject}
                  className="text-xs"
                  style={{ verticalAlign: 0 }}
                />{' '}
                Klassendiagramm
              </button>
              <span className="border-l border-gray-300 mx-3"></span>
              <FaIcon
                icon={faBook}
                className="text-xs"
                style={{ verticalAlign: 0 }}
              />{' '}
              <button className="hover:underline">API-Referenz</button>
              <span className="border-l border-gray-300 mx-3"></span>
              <FaIcon
                icon={faCode}
                className="text-xs"
                style={{ verticalAlign: 0 }}
              />{' '}
              <button className="hover:underline">Beispiele</button>
              <span className="border-l border-gray-300 mx-3"></span>
              <button className="px-2 rounded bg-yellow-100 hover:bg-yellow-200">
                <FaIcon
                  icon={faShare}
                  className="text-sm"
                  style={{ verticalAlign: 0 }}
                />{' '}
                Code teilen
              </button>
              <span className="border-l border-gray-300 mx-3"></span>
            </div>
            <div className="mr-3 my-1">
              <span className="border-l border-gray-300 mx-3"></span>
              <button className="hover:underline text-blue-600">
                GitHub{' '}
                <FaIcon
                  icon={faExternalLinkAlt}
                  className="text-xs"
                  style={{ verticalAlign: 0 }}
                />
              </button>
              <span className="border-l border-gray-300 mx-3"></span>
              <button className="hover:underline">Datenschutz</button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
