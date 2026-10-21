import { useSyncExternalStore } from 'react'
import { tags } from '../../lib/tags'

/** Every paper tag the scene has pinned up, drawn over the picture */
export function Tags() {
  const listed = useSyncExternalStore(tags.subscribe, tags.read)
  return (
    <div className="tags" aria-hidden="true">
      {listed.map(({ id, shown, content }) => (
        <div key={id} className="tag-anchor" ref={(element) => tags.attach(id, element)}>
          <div className="tag" data-shown={shown}>
            {content}
          </div>
        </div>
      ))}
    </div>
  )
}
