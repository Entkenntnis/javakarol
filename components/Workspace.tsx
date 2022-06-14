import {
  faBook,
  faCode,
  faDiagramProject,
  faExternalLinkAlt,
  faShare,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import clsx from 'clsx'
import { ReflexElement, ReflexSplitter, ReflexContainer } from 'react-reflex'

import { openMenu } from '../lib/commands/menu'
import { closeModal, openModal } from '../lib/commands/modal'
import { useCore } from '../lib/state/core'
import { Diagram } from './Diagram'
import { EditArea } from './EditArea'
import { Examples } from './Examples'
import { FaIcon } from './FaIcon'
import { FileInput } from './FileInput'
import { Ping } from './Ping'
import { Player } from './Player'
import { Privacy } from './Privacy'
import { Reference } from './Reference'
import { Share } from './Share'

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
            <div className="ml-1 my-1">
              <button
                className="hover:bg-gray-100 rounded px-2"
                onClick={() => {
                  openModal(core, 'diagram')
                }}
              >
                <FaIcon
                  icon={faDiagramProject}
                  className="text-xs"
                  style={{ verticalAlign: 0 }}
                />{' '}
                Klassendiagramm
              </button>
              <span className="border-l border-gray-300 mx-1"></span>

              <button
                className="hover:bg-gray-100 rounded px-2"
                onClick={() => {
                  openModal(core, 'reference')
                }}
              >
                <FaIcon
                  icon={faBook}
                  className="text-xs"
                  style={{ verticalAlign: 0 }}
                />{' '}
                API-Referenz
              </button>
              <span className="border-l border-gray-300 mx-1"></span>
              <button
                className="hover:bg-gray-100 rounded px-2"
                onClick={() => {
                  openModal(core, 'examples')
                }}
              >
                <FaIcon
                  icon={faCode}
                  className="text-xs"
                  style={{ verticalAlign: 0 }}
                />{' '}
                Beispiele
              </button>
              <span className="border-l border-gray-300 mx-3"></span>
              <button
                className="px-2 rounded bg-yellow-100 hover:bg-yellow-200"
                onClick={() => {
                  openModal(core, 'share')
                }}
              >
                <FaIcon
                  icon={faShare}
                  className="text-sm"
                  style={{ verticalAlign: 0 }}
                />{' '}
                Code teilen
              </button>
              <span className="border-l border-gray-300 mx-3"></span>
            </div>
            <div className="mr-1 my-1">
              <span className="border-l border-gray-300 mx-3"></span>
              <a
                className="hover:underline text-blue-600"
                href="https://github.com/Entkenntnis/javakarol#readme"
                target="_blank"
                rel="noreferrer"
              >
                GitHub{' '}
                <FaIcon
                  icon={faExternalLinkAlt}
                  className="text-xs"
                  style={{ verticalAlign: 0 }}
                />
              </a>
              <span className="border-l border-gray-300 mx-3 mr-1"></span>
              <button
                className="hover:bg-gray-100 rounded px-2"
                onClick={() => {
                  openModal(core, 'privacy')
                }}
              >
                Datenschutz
              </button>
            </div>
          </div>
        </div>
        {core.ws.ui.modal !== 'none' && (
          <div
            className={clsx(
              'absolute inset-0 bg-gray-600 bg-opacity-30 flex justify-around',
              'items-center z-[200]'
            )}
            onClick={() => {
              closeModal(core)
            }}
          >
            <div
              onClick={(e) => {
                e.stopPropagation()
              }}
              className={clsx(
                core.ws.ui.modal == 'share' || core.ws.ui.modal == 'privacy'
                  ? 'absolute mx-auto bg-white opacity-100 rounded z-[300] mb-[15vh] max-h-[75vh] overflow-auto'
                  : 'absolute top-6 inset-x-10 bottom-16 bg-white rounded overflow-auto'
              )}
              style={{ width: modalWidths[core.ws.ui.modal] }}
            >
              {core.ws.ui.modal == 'share' && <Share />}
              {core.ws.ui.modal == 'privacy' && <Privacy />}
              {core.ws.ui.modal == 'diagram' && <Diagram />}
              {core.ws.ui.modal == 'reference' && <Reference />}
              {core.ws.ui.modal == 'examples' && <Examples />}
              <div
                className="absolute top-2 right-2  cursor-pointer hover:bg-gray-100 px-2 py-0.5 rounded"
                onClick={() => closeModal(core)}
              >
                <FaIcon icon={faXmark} /> Schließen
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

const modalWidths = {
  share: 400,
  privacy: 600,
  diagram: '',
  reference: '',
  examples: '',
}
