import { Contract } from 'common/contract'
import { useGroupsWhereUserHasRole } from 'web/hooks/use-group-supabase'
import Link from 'next/link'
import { useState } from 'react'
import { useUser } from 'web/hooks/use-user'
import { PencilIcon, PlusIcon } from '@heroicons/react/solid'
import { Modal } from 'web/components/layout/modal'
import { Col } from 'web/components/layout/col'
import { ContractTopicsList } from 'web/components/topics/contract-topics-list'
import { useAdminOrMod } from 'web/hooks/use-admin'
import { filterDefined } from 'common/util/array'
import { Group, groupPath, Topic } from 'common/group'
import { track } from 'web/lib/service/analytics'
import { removeEmojis } from 'common/util/string'
import { Tooltip } from '../widgets/tooltip'
import { SPICE_MARKET_TOOLTIP } from 'common/envs/constants'
import { Row } from '../layout/row'
import { SpiceCoin } from 'web/public/custom-components/spiceCoin'

const DashboardLink = (props: {
  dashboard: { slug: string; title: string }
}) => {
  const { dashboard } = props
  return (
    <Link
      className="text-teal-700 hover:underline active:underline"
      href={`/news/${dashboard.slug}`}
    >
      {dashboard.title}
    </Link>
  )
}

const TopicLink = (props: { topic: Topic; contractId: string }) => {
  const { topic, contractId } = props
  return (
    <Link
      key={topic.id}
      className="text-ink-500 hover:underline active:underline"
      href={groupPath(topic.slug)}
      onClick={() => {
        track('click category pill on market', {
          contractId: contractId,
          categoryName: topic.name,
        })
      }}
    >
      {removeEmojis(topic.name)}
    </Link>
  )
}

type TopicRowProps = {
  contract: Contract
  dashboards: { slug: string; title: string }[]
  topics: Topic[]
  isSpiceMarket: boolean
}

export function MarketTopics(props: TopicRowProps) {
  const [open, setOpen] = useState(false)
  const { contract, topics, dashboards, isSpiceMarket } = props
  const user = useUser()
  const isCreator = contract.creatorId === user?.id
  const adminGroups = useGroupsWhereUserHasRole(user?.id)
  const isMod = useAdminOrMod()
  const canEdit = isMod || isCreator || (adminGroups && adminGroups.length > 0)
  const onlyGroups = !isMod && !isCreator ? adminGroups : undefined

  const canEditGroup = (group: Group) =>
    isCreator ||
    isMod ||
    // if user has admin role in that group
    !!(adminGroups && adminGroups.some((g) => g.group_id === group.id))
  return (
    <>
      <div className="group mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium sm:text-sm">
        {isSpiceMarket && (
          <Link href="/browse?p=1&f=open">
            <Tooltip text={SPICE_MARKET_TOOLTIP}>
              <Row className="text-2xs select-none items-center gap-1 whitespace-nowrap rounded-full bg-amber-200 px-1.5 font-semibold text-amber-700 transition-colors hover:bg-amber-300 dark:hover:bg-amber-100">
                <SpiceCoin /> Prize Market
              </Row>
            </Tooltip>
          </Link>
        )}
        {dashboards.map((d) => (
          <DashboardLink key={d.slug} dashboard={d} />
        ))}
        {topics.map((t) => (
          <TopicLink key={t.id} topic={t} contractId={contract.id} />
        ))}
        {user && canEdit && (
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setOpen(true)
            }}
            className="hover:bg-ink-400/20 text-ink-500 -ml-2 flex items-center rounded-md px-2 text-xs sm:invisible sm:text-sm sm:group-hover:visible"
          >
            {topics.length ? (
              <PencilIcon className="h-4 w-4" />
            ) : (
              <>
                <PlusIcon className="mr-1 h-3 " /> Topics
              </>
            )}
          </button>
        )}
      </div>
      <Modal open={open} setOpen={setOpen} size={'md'}>
        <Col
          className={
            'bg-canvas-0 max-h-[70vh] min-h-[20rem] overflow-auto rounded p-6'
          }
        >
          <ContractTopicsList
            canEdit={!!canEdit}
            contract={contract}
            onlyGroupIds={
              onlyGroups
                ? filterDefined(onlyGroups.map((g) => g.group_id))
                : undefined
            }
            canEditGroup={canEditGroup}
          />
        </Col>
      </Modal>
    </>
  )
}
