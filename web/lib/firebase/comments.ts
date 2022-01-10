import { doc, collection, onSnapshot, setDoc } from 'firebase/firestore'

import { db } from './init'
import { User } from '../../../common/user'
import { Comment } from '../../../common/comment'
export type { Comment }

export async function createComment(
  contractId: string,
  betId: string,
  text: string,
  commenter: User
) {
  const ref = doc(getCommentsCollection(contractId), betId)
  return await setDoc(ref, {
    contractId,
    betId,
    text,
    createdTime: Date.now(),
    userName: commenter.name,
    userUsername: commenter.username,
    userAvatarUrl: commenter.avatarUrl,
  })
}

function getCommentsCollection(contractId: string) {
  return collection(db, 'contracts', contractId, 'comments')
}

export function listenForComments(
  contractId: string,
  setComments: (comments: Comment[]) => void
) {
  return onSnapshot(getCommentsCollection(contractId), (snap) => {
    const comments = snap.docs.map((doc) => doc.data() as Comment)

    comments.sort((c1, c2) => c1.createdTime - c2.createdTime)

    setComments(comments)
  })
}

// Return a map of betId -> comment
export function mapCommentsByBetId(comments: Comment[]) {
  const map: Record<string, Comment> = {}
  for (const comment of comments) {
    map[comment.betId] = comment
  }
  return map
}
