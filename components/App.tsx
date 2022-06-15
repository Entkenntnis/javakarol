import Head from 'next/head'
import { useEffect } from 'react'

import { useCore } from '../lib/state/core'
import { Workspace } from './Workspace'
import { loadProject } from '../lib/commands/load'

export function App() {
  const core = useCore()

  useEffect(() => {
    void loadProject(core)
  }, [core])

  return (
    <>
      <Head>
        <title>JavaKarol</title>
      </Head>
      <div className="w-full h-full min-w-[900px] relative overflow-hidden">
        <Workspace />
      </div>
    </>
  )
}
