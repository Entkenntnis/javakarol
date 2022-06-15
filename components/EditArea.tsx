import { EditorView } from '@codemirror/view'
import { useEffect, useRef } from 'react'
import clsx from 'clsx'
import {
  faArrowRight,
  faArrowTurnUp,
  faCircleExclamation,
  faPlay,
  faSpinner,
  faStop,
} from '@fortawesome/free-solid-svg-icons'
import { forceLinting } from '@codemirror/lint'
import { cursorDocEnd } from '@codemirror/commands'

import { autoFormat, setEditable } from '../lib/codemirror/basicSetup'
import { useCore } from '../lib/state/core'
import { FaIcon } from './FaIcon'
import { Editor } from './Editor'
import { textRefreshDone } from '../lib/commands/json'
import { runProgram, stopVM } from '../lib/commands/jvm'
import { addMessage } from '../lib/commands/messages'

export function EditArea() {
  const core = useCore()

  const codeState = core.ws.ui.state

  const view = useRef<EditorView>()

  useEffect(() => {
    if (core.ws.ui.needsTextRefresh && view.current) {
      view.current.dispatch({
        changes: {
          from: 0,
          to: view.current.state.doc.length,
          insert: core.ws.code,
        },
      })
      forceLinting(view.current)
      textRefreshDone(core)
    }
  })

  useEffect(() => {
    if (codeState == 'ready') {
      setEditable(view.current, true)
    }
  }, [codeState])

  return (
    <>
      <div className="w-full text-base h-full flex flex-col outline-none">
        {renderEditor()}
        {core.ws.ui.state == 'error' && (
          <div className="bg-white flex border-t">
            <div className="w-full overflow-auto min-h-[47px] max-h-[200px]">
              <div className="flex justify-between mt-[9px]">
                <div className="px-3 pb-1 pt-0">
                  <p className="mb-2">
                    <FaIcon
                      icon={faCircleExclamation}
                      className="text-red-600 mr-2"
                    />
                    Beim Einlesen des Programms sind folgende Probleme
                    aufgetreten:
                  </p>
                  {core.ws.ui.errorMessages.map((err, i) => (
                    <p className="mb-2" key={err + i.toString()}>
                      {err}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )

  function renderEditor() {
    return (
      <div className="flex h-full overflow-y-auto relative">
        <div className="absolute top-2 right-0   z-50">
          {core.ws.ui.state == 'running' || core.ws.ui.state == 'stopping' ? (
            <button
              className="bg-red-400 rounded px-2 py-0.5 mr-2 hover:bg-red-500 transition-colors"
              onClick={() => {
                stopVM(core).then(() => {
                  addMessage(core, 'Ausführung abgebrochen.')
                })
              }}
              disabled={core.ws.ui.state == 'stopping'}
            >
              {core.ws.ui.state == 'stopping' ? (
                <FaIcon icon={faSpinner} className="animate-spin-slow" />
              ) : (
                <FaIcon icon={faStop} />
              )}{' '}
              Stopp
            </button>
          ) : (
            <button
              className={clsx(
                'bg-green-300 rounded px-2 py-0.5 mr-2 transition-colors',
                'hover:bg-green-400',
                'disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40'
              )}
              disabled={
                core.ws.ui.state == 'error' || core.ws.ui.state == 'loading'
              }
              onClick={() => {
                if (view.current) {
                  autoFormat(view.current)
                  setEditable(view.current, false)
                  view.current.contentDOM.blur()
                }
                runProgram(core)
              }}
            >
              {core.ws.ui.state == 'loading' ? (
                <FaIcon icon={faSpinner} className="animate-spin-slow" />
              ) : (
                <FaIcon icon={faPlay} />
              )}{' '}
              Start
            </button>
          )}
        </div>
        <div className="w-full overflow-auto h-full flex">
          {codeState == 'running' ? (
            <div
              data-label="gutter"
              className="w-8 h-full relative flex-shrink-0"
            >
              {core.ws.ui.gutter > 0 && (
                <div
                  className="text-blue-500 absolute w-5 h-5 left-1.5"
                  style={{
                    top: `${4 + (core.ws.ui.gutter - 1) * 22.4 - 2}px`,
                  }}
                >
                  <FaIcon icon={faArrowRight} />
                </div>
              )}{' '}
              {Array.from(new Set(core.ws.ui.gutterReturns)).map((pos, i) => (
                <div
                  key={i}
                  className="text-yellow-300 absolute w-5 h-5 left-2"
                  style={{
                    top: `${4 + (pos - 1) * 22.4 - 2}px`,
                  }}
                >
                  <FaIcon icon={faArrowTurnUp} className="rotate-180" />
                </div>
              ))}
            </div>
          ) : (
            <div className="w-8 h-full relative flex-shrink-0"></div>
          )}
          <div className="w-full h-full flex flex-col">
            <Editor innerRef={view} />
            <div
              className="flex-grow flex"
              onClick={() => {
                if (view.current) {
                  cursorDocEnd(view.current)
                  view.current.focus()
                }
              }}
            >
              <div className="w-[30px] border-r h-full bg-neutral-100 border-[#ddd] flex-grow-0 flex-shrink-0"></div>
              <div className="w-full cursor-text"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
