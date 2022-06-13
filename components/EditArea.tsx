import { EditorView } from '@codemirror/view'
import { useEffect, useRef } from 'react'
import clsx from 'clsx'
import { ReflexContainer, ReflexElement, ReflexSplitter } from 'react-reflex'
import {
  faArrowRight,
  faArrowTurnUp,
  faCheckCircle,
  faCircleExclamation,
  faExternalLink,
  faExternalLinkAlt,
  faPlay,
  faShare,
  faSpinner,
  faStop,
} from '@fortawesome/free-solid-svg-icons'
import { forceLinting } from '@codemirror/lint'
import { cursorDocEnd } from '@codemirror/commands'

import { autoFormat, setEditable } from '../lib/codemirror/basicSetup'
import { useCore } from '../lib/state/core'
import { abort, confirmStep, run, setSpeed } from '../lib/commands/vm'
import { FaIcon } from './FaIcon'
import { execPreview, hidePreview, showPreview } from '../lib/commands/preview'
import { submit_event } from '../lib/stats/submit'
import { openMenu } from '../lib/commands/menu'
import { Editor } from './Editor'
import { textRefreshDone } from '../lib/commands/json'
import { leavePreMode } from '../lib/commands/puzzle'
import { focusWrapper } from '../lib/commands/focus'
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
        {core.ws.type == 'puzzle' && (
          <ReflexContainer
            orientation="horizontal"
            windowResizeAware
            className="h-full"
          >
            <ReflexElement minSize={100} propagateDimensions={true}>
              {core.ws.progress < 100 ? (
                <div className="h-full flex flex-col z-50 relative bg-white">
                  <div className="p-3 overflow-y-auto">
                    {core.puzzle.description}
                    {core.ws.preMode && (
                      <p className="text-center mt-5 mb-5">
                        <button
                          className="px-3 py-0.5 rounded z-10 bg-blue-200 mr-4"
                          onClick={() => {
                            openMenu(core)
                          }}
                        >
                          zurück
                        </button>
                        <button
                          className="bg-green-300 px-3 py-0.5 rounded z-10"
                          onClick={() => {
                            leavePreMode(core)
                            focusWrapper(core)
                          }}
                        >
                          Los
                        </button>
                      </p>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 h-5 bg-gradient-to-t from-white"></div>
                  </div>
                </div>
              ) : (
                <div className="h-full p-3 text-center flex justify-center items-center">
                  <div>
                    <p>
                      <FaIcon
                        icon={faCheckCircle}
                        className="text-3xl text-green-400"
                      />
                    </p>
                    <p className="mt-4 mb-6">Super gemacht!</p>
                    <p>
                      <button
                        onClick={() => {
                          openMenu(core)
                        }}
                        className="bg-blue-200 px-2 py-0.5 rounded"
                      >
                        weiter
                      </button>
                    </p>
                  </div>
                </div>
              )}
            </ReflexElement>
            <ReflexSplitter style={{ height: 3 }} />

            <ReflexElement minSize={100}>{renderEditor()}</ReflexElement>
          </ReflexContainer>
        )}
        {core.ws.type == 'free' && renderEditor()}
        {core.ws.ui.state == 'error' && (
          <div className="bg-white flex border-t">
            <div className="w-full overflow-auto min-h-[47px] max-h-[200px]">
              <div className="flex justify-between mt-[9px]">
                {renderProgramControl()}
              </div>
            </div>
          </div>
        )}
        <div className="bg-white flex border-t h-[40px]">
          <div className="w-full overflow-auto my-auto">
            <div className="ml-2 my-1">
              <button className="hover:underline">Klassendiagramm</button>
              <span className="border-l border-gray-300 mx-3"></span>
              <button className="hover:underline">API-Referenz</button>
              <span className="border-l border-gray-300 mx-3"></span>
              <button className="hover:underline">Beispiele</button>
              <span className="border-l border-gray-300 mx-3"></span>
              <button className="hover:underline">
                <FaIcon icon={faShare} className="text-sm" /> Code teilen
              </button>
            </div>
          </div>
        </div>
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
                stopVM(core)
                addMessage(core, 'Ausführung abgebrochen.')
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
                submit_event(`run_${core.ws.type}`, core)
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

  function renderProgramControl() {
    if (core.ws.type == 'puzzle' && core.ws.progress == 100) return null
    if (codeState == 'ready' || codeState == 'running') {
      if (
        core.ws.type == 'free' &&
        !core.ws.jvm.classfile /*|| core.ws.vm.bytecode.length == 0*/
      ) {
        return (
          <div className="m-[11px] mt-[2px]">
            Schreibe ein Programm für JavaKarol im Editor.
          </div>
        )
      } else {
        return (
          <>
            <span>
              <select
                className="h-7 mr-2 ml-2"
                value={core.ws.settings.speed}
                onChange={(e) => {
                  setSpeed(core, e.target.value)
                }}
              >
                <option value="turbo">Turbo</option>
                <option value="fast">schnell</option>
                <option value="slow">langsam</option>
                <option value="step">Einzelschritt</option>
              </select>
              {/*codeState == 'ready' && (
                <label className="ml-2">
                  <input
                    type="checkbox"
                    className="inline-block"
                    checked={core.ws.ui.showPreview}
                    onChange={(e) => {
                      if (e.target.checked) {
                        showPreview(core)
                        focusWrapper(core)
                        execPreview(core)
                      } else {
                        hidePreview(core)
                        focusWrapper(core)
                      }
                    }}
                  />
                  <span className="underline ml-2">V</span>orschau
                </label>
                  )*/}
            </span>
            {codeState == 'running' ? (
              <span>
                <button
                  className="bg-red-400 rounded px-2 py-0.5 mr-2 hover:bg-red-500 transition-colors"
                  onClick={() => {
                    abort(core)
                  }}
                >
                  <span className="underline">S</span>topp
                </button>{' '}
                {core.ws.settings.speed == 'step' && (
                  <button
                    className={clsx(
                      'bg-yellow-400 rounded px-2 py-0.5 mr-2 transition-colors',
                      'hover:bg-yellow-500'
                    )}
                    onClick={() => {
                      confirmStep(core)
                    }}
                  >
                    Weiter
                  </button>
                )}
              </span>
            ) : null}
          </>
        )
      }
    }

    if (codeState == 'loading') {
      return (
        <button
          className="bg-green-50 rounded px-2 py-0.5 m-1 mt-0 text-gray-400 ml-2"
          disabled
        >
          ... wird eingelesen
        </button>
      )
    }

    if (codeState == 'error') {
      return (
        <div className="px-3 pb-1 pt-0">
          <p className="mb-2">
            <FaIcon icon={faCircleExclamation} className="text-red-600 mr-2" />
            Beim Einlesen des Programms sind folgende Probleme aufgetreten:
          </p>
          {core.ws.ui.errorMessages.map((err, i) => (
            <p className="mb-2" key={err + i.toString()}>
              {err}
            </p>
          ))}
        </div>
      )
    }

    return <div>unbekannt</div>
  }
}
