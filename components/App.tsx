import Head from 'next/head'
import { useEffect } from 'react'

import { useCore } from '../lib/state/core'
import { Workspace } from './Workspace'
import { submit_event } from '../lib/stats/submit'
import { loadProject } from '../lib/commands/load'
import { FileInput } from './FileInput'

export function App() {
  const core = useCore()

  useEffect(() => {
    submit_event('visit', core)
    void loadProject(core)
  }, [core])

  return (
    <>
      <Head>
        <title>{getTitle()}</title>
      </Head>
      <div className="w-full h-full min-w-[900px] relative overflow-hidden">
        <FileInput />
        <Workspace />
      </div>
    </>
  )

  function getTitle() {
    if (core.state.projectTitle) {
      return `${core.state.projectTitle} - JavaKarol`
    } else {
      return 'JavaKarol'
    }
  }
}
