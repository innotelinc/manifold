import {
  mapValues,
  groupBy,
  sumBy,
  sum,
  sortBy,
  debounce,
  uniqBy,
} from 'lodash'
import { useState, useMemo } from 'react'
import { charities, Charity as CharityType } from 'common/charity'
import { CharityCard } from 'web/components/charity/charity-card'
import { Col } from 'web/components/layout/col'
import { Spacer } from 'web/components/layout/spacer'
import { Page } from 'web/components/page'
import { SiteLink } from 'web/components/site-link'
import { Title } from 'web/components/title'
import { getAllCharityTxns } from 'web/lib/firebase/txns'
import { formatMoney, manaToUSD } from 'common/util/format'
import { quadraticMatches } from 'common/quadratic-funding'
import { Txn } from 'common/txn'

export async function getStaticProps() {
  const txns = await getAllCharityTxns()
  const totals = mapValues(groupBy(txns, 'toId'), (txns) =>
    sumBy(txns, (txn) => txn.amount)
  )
  const totalRaised = sum(Object.values(totals))
  const sortedCharities = sortBy(charities, [
    (charity) => (charity.tags?.includes('Featured') ? 0 : 1),
    (charity) => -totals[charity.id],
  ])
  const matches = quadraticMatches(txns, totalRaised)
  const numDonors = uniqBy(txns, (txn) => txn.fromId).length

  return {
    props: {
      totalRaised,
      charities: sortedCharities,
      matches,
      txns,
      numDonors,
    },
    revalidate: 60,
  }
}

type Stat = {
  name: string
  stat: string
}

function DonatedStats(props: { stats: Stat[] }) {
  const { stats } = props
  return (
    <dl className="mt-3 grid grid-cols-1 gap-5 rounded-lg bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400 p-4 sm:grid-cols-3">
      {stats.map((item) => (
        <div
          key={item.name}
          className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6"
        >
          <dt className="truncate text-sm font-medium text-gray-500">
            {item.name}
          </dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900">
            {item.stat}
          </dd>
        </div>
      ))}
    </dl>
  )
}

export default function Charity(props: {
  totalRaised: number
  charities: CharityType[]
  matches: { [charityId: string]: number }
  txns: Txn[]
  numDonors: number
}) {
  const { totalRaised, charities, matches, numDonors } = props

  const [query, setQuery] = useState('')
  const debouncedQuery = debounce(setQuery, 50)

  const filterCharities = useMemo(
    () =>
      charities.filter(
        (charity) =>
          charity.name.toLowerCase().includes(query.toLowerCase()) ||
          charity.preview.toLowerCase().includes(query.toLowerCase()) ||
          charity.description.toLowerCase().includes(query.toLowerCase()) ||
          (charity.tags as string[])?.includes(query.toLowerCase())
      ),
    [charities, query]
  )

  return (
    <Page>
      <Col className="w-full rounded px-4 py-6 sm:px-8 xl:w-[125%]">
        <Col className="">
          <Title className="!mt-0" text="Manifold for Charity" />
          <span className="text-gray-600">
            Donate your winnings: every {formatMoney(100)} you contribute turns
            into $1 USD to your chosen charity!
          </span>
          <DonatedStats
            stats={[
              {
                name: 'Raised by Manifold users',
                stat: manaToUSD(totalRaised),
              },
              {
                name: 'Number of donors',
                stat: `${numDonors}`,
              },
              {
                name: 'Matched via quadratic funding',
                stat: manaToUSD(sum(Object.values(matches))),
              },
            ]}
          />
          <Spacer h={10} />

          <input
            type="text"
            onChange={(e) => debouncedQuery(e.target.value)}
            placeholder="Find a charity"
            className="input input-bordered mb-6 w-full"
          />
        </Col>
        <div className="grid max-w-xl grid-flow-row grid-cols-1 gap-4 lg:max-w-full lg:grid-cols-2 xl:grid-cols-3">
          {filterCharities.map((charity) => (
            <CharityCard
              charity={charity}
              key={charity.name}
              match={matches[charity.id]}
            />
          ))}
        </div>
        {filterCharities.length === 0 && (
          <div className="text-center text-gray-500">
            😢 We couldn't find that charity...
          </div>
        )}

        <iframe
          height="405"
          src="https://manifold.markets/embed/ManifoldMarkets/total-donations-for-manifold-for-go"
          title="Total donations for Manifold for Charity this May (in USD)"
          frameBorder="0"
          className="m-10 w-full rounded-xl bg-white p-10"
        ></iframe>

        <div className="mt-10 text-gray-500">
          Don't see your favorite charity? Recommend it by emailing
          charity@manifold.markets!
          <br />
          <br />
          <span className="italic">
            Notes:
            <br />
            - Manifold is not affiliated with non-Featured charities; we're just
            fans of their work!
            <br />
            - As Manifold itself is a for-profit entity, your contributions will
            not be tax deductible.
            <br />- Donation matches are courtesy of{' '}
            <SiteLink href="https://ftxfuturefund.org/" className="font-bold">
              the FTX Future Fund
            </SiteLink>
            , and are allocated via{' '}
            <SiteLink href="https://wtfisqf.com/" className="font-bold">
              quadratic funding
            </SiteLink>
            .
            <br />- Donations + matches are wired once each quarter.
          </span>
        </div>
      </Col>
    </Page>
  )
}
