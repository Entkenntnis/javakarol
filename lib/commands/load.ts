import { Core } from '../state/core'
import { deserialize } from './json'

export async function loadProject(core: Core) {
  const parameterList = new URLSearchParams(window.location.search)

  const id = parameterList.get('id')

  if (id) {
    try {
      const res = await fetch(`https://stats-karol.arrrg.de/load/${id}`)
      const text = await res.text()
      deserialize(core, text)
    } catch (e) {
      alert(e)
    }
  }
}
