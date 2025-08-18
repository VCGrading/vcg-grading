import { useEffect } from 'react'

export default function Head({ title, description, image }: { title?: string; description?: string; image?: string }) {
  useEffect(() => {
    if (title) document.title = title
    const set = (name: string, content?: string) => {
      if (!content) return
      let m = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null
      if (!m) { m = document.createElement('meta'); m.setAttribute('name', name); document.head.appendChild(m) }
      m.setAttribute('content', content)
    }
    const setProp = (property: string, content?: string) => {
      if (!content) return
      let m = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null
      if (!m) { m = document.createElement('meta'); m.setAttribute('property', property); document.head.appendChild(m) }
      m.setAttribute('content', content)
    }
    set('description', description)
    setProp('og:title', title); setProp('og:description', description); setProp('og:image', image)
    setProp('twitter:card', image ? 'summary_large_image' : 'summary')
    setProp('twitter:title', title); setProp('twitter:description', description); setProp('twitter:image', image)
  }, [title, description, image])
  return null
}
