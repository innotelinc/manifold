import { Editor } from '@tiptap/react'
import { DOMAIN } from 'common/envs/constants'
import { useState } from 'react'
import { Button } from '../buttons/button'
import { RichContent } from '../widgets/editor'
import { Col } from '../layout/col'
import { Modal } from '../layout/modal'
import { Row } from '../layout/row'
import { Spacer } from '../layout/spacer'

type EmbedPattern = {
  // Regex should have a single capture group.
  regex: RegExp
  rewrite: (text: string) => string
}

const embedPatterns: EmbedPattern[] = [
  {
    regex: /^(<iframe.*<\/iframe>)$/,
    rewrite: (text: string) => text,
  },
  {
    regex: /^https?:\/\/manifold\.markets\/([^\/]+\/[^\/]+)/,
    rewrite: (slug) =>
      `<iframe src="https://manifold.markets/embed/${slug}"></iframe>`,
  },
  {
    regex: /^https?:\/\/twitter\.com\/.*\/status\/(\d+)/,
    // Hack: append a leading 't', to prevent tweetId from being interpreted as a number.
    // If it's a number, there may be numeric precision issues.
    rewrite: (id) => `<tiptap-tweet tweetid="t${id}"></tiptap-tweet>`,
  },
  {
    regex: /^https?:\/\/www\.youtube\.com\/watch\?v=([^&]+)/,
    rewrite: (id) =>
      `<iframe src="https://www.youtube.com/embed/${id}"></iframe>`,
  },
  // Also rewrite youtube links like `https://youtu.be/IOlKZDgyQRQ`
  {
    regex: /^https?:\/\/youtu\.be\/([^&]+)/,
    rewrite: (id) =>
      `<iframe src="https://www.youtube.com/embed/${id}"></iframe>`,
  },
  {
    regex: /^https?:\/\/www\.metaculus\.com\/questions\/(\d+)/,
    rewrite: (id) =>
      `<iframe src="https://www.metaculus.com/questions/embed/${id}"></iframe>`,
  },
  {
    regex: /^(https?:\/\/www\.figma\.com\/(?:file|proto)\/[^\/]+\/[^\/]+)/,
    rewrite: (url) =>
      `<iframe src="https://www.figma.com/embed?embed_host=manifold&url=${url}"></iframe>`,
  },
  // Twitch is a bit annoying, since it requires the `&parent=DOMAIN` to match
  {
    // Twitch: https://www.twitch.tv/videos/1445087149
    regex: /^https?:\/\/www\.twitch\.tv\/videos\/(\d+)/,
    rewrite: (id) =>
      `<iframe src="https://player.twitch.tv/?video=${id}&parent=${DOMAIN}"></iframe>`,
  },
  {
    // Twitch: https://www.twitch.tv/sirsalty
    regex: /^https?:\/\/www\.twitch\.tv\/([^\/]+)/,
    rewrite: (channel) =>
      `<iframe src="https://player.twitch.tv/?channel=${channel}&parent=${DOMAIN}"></iframe>`,
  },
  {
    // Strawpoll: https://strawpoll.com/polls/PbZqoPJelnN
    regex: /^https?:\/\/strawpoll\.com\/polls\/(\w+)/,
    rewrite: (id) =>
      `<iframe src="https://strawpoll.com/embed/polls/${id}"></iframe>`,
  },
  {
    regex: /^(https?:\/\/.*)/,
    rewrite: (url) => `<iframe src="${url}"></iframe>`,
  },
]

function embedCode(text: string) {
  for (const pattern of embedPatterns) {
    const match = text.match(pattern.regex)
    if (match) {
      return pattern.rewrite(match[1])
    }
  }
  return null
}

export function EmbedModal(props: {
  editor: Editor | null
  open: boolean
  setOpen: (open: boolean) => void
}) {
  const { editor, open, setOpen } = props
  const [input, setInput] = useState('')
  const embed = embedCode(input)

  return (
    <Modal open={open} setOpen={setOpen}>
      <Col className="gap-2 rounded bg-white p-6">
        <label
          htmlFor="embed"
          className="block text-sm font-medium text-gray-700"
        >
          Embed a Youtube video, Tweet, or other link
        </label>
        <input
          type="text"
          name="embed"
          id="embed"
          className="block w-full rounded-md border-gray-300 shadow-sm placeholder:text-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        {/* Preview the embed if it's valid */}
        {embed ? <RichContent content={embed} /> : <Spacer h={2} />}

        <Row className="gap-2">
          <Button
            disabled={!embed}
            onClick={() => {
              if (editor && embed) {
                editor.chain().insertContent(embed).run()
                console.log('editorjson', editor.getJSON())
                setInput('')
                setOpen(false)
              }
            }}
          >
            Embed
          </Button>
          <Button
            color="gray"
            onClick={() => {
              setInput('')
              setOpen(false)
            }}
          >
            Cancel
          </Button>
        </Row>
      </Col>
    </Modal>
  )
}
