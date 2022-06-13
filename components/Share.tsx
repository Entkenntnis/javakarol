import { faSpinner } from '@fortawesome/free-solid-svg-icons'
import { useState } from 'react'
import { closeModal } from '../lib/commands/modal'
import { share } from '../lib/commands/share'
import { useCore } from '../lib/state/core'
import { FaIcon } from './FaIcon'

export function Share() {
  const [pending, setPending] = useState(false)
  const [id, setId] = useState('')
  const core = useCore()
  return (
    <>
      <h1 className="m-3 mb-6 text-xl font-bold">Teilen</h1>
      <p className="m-3 mb-6">
        Du kannst deinen Code freigeben und mit anderen Personen teilen. Dazu
        wird der Code auf dem Server gespeichert und ein eindeutiger Link
        erstellt:
      </p>
      {id ? (
        <div className="px-3 mb-6">
          <input
            className="border w-full border-yellow-300 outline-none border-2"
            value={`${window.location.protocol}//${window.location.host}/?id=${id}`}
            readOnly
          />
          <button
            className="px-2 py-0.5 rounded mt-7 bg-gray-100"
            onClick={() => {
              closeModal(core)
            }}
          >
            Schließen
          </button>
        </div>
      ) : (
        <button
          className="px-2 py-0.5 bg-yellow-200 hover:bg-yellow-300 rounded ml-3 mb-6"
          onClick={async () => {
            setPending(true)
            try {
              const id = await share(core)
              setId(id)
            } catch (e) {
              alert('Fehler: ' + e)
            }
          }}
          disabled={pending}
        >
          {pending ? (
            <>
              <FaIcon icon={faSpinner} className="animate-spin" /> wird geladen
              ...
            </>
          ) : (
            `Link erstellen`
          )}
        </button>
      )}
    </>
  )
}
