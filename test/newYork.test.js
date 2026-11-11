import test from 'node:test'
import assert from 'node:assert/strict'
import { newYorkGuide, nyEmployerSizes, REVIEW_DATE, sources } from '../src/guidance/newYork.js'

const base = {
  state: 'New York', nyArea: 'elsewhere', goal: 'asked', employerType: 'private',
  employerSize: '10-14', jobArea: 'Retail or customer service', jobDuties: [],
  recordType: 'conviction', recordStatus: [], conductAgo: '4–6 years',
  sentenceAgo: '1–3 years', support: ['work', 'references'], hiringStage: 'application',
}
const run = changes => newYorkGuide({ ...base, ...changes })
const ids = guide => guide.cards.map(card => card.id)
const card = (guide, key) => guide.cards.find(c => c.id === key)
const atRisk = { hiringStage: 'conditional', nyOfferDecision: 'considering' }
const city = { nyArea: 'nyc', employerSize: '4-9' }

test('statewide early question gets local timing check plus the ten-employee assessment', () => {
  const g = run({ nyAskedBefore: 'yes' })
  assert.deepEqual(ids(g), ['local-timing', 'conviction-review'])
  assert.match(card(g, 'conviction-review').detail, /4–6 years/)
  assert.match(card(g, 'conviction-review').detail, /work history, references/)
})

test('location is explicit, including when a text field contains a misleading substring', () => {
  for (const nyArea of ['', 'unsure', 'elsewhere']) {
    const g = run({ nyArea, city: 'New York Mills', ...atRisk, nyMaterials: 'both' })
    assert.equal(g.coverage.title, 'New York State')
    assert.ok(!ids(g).some(id => id.startsWith('city-')))
    assert.match(g.review[0], nyArea === 'elsewhere' ? /additional hiring rules/ : /location is uncertain/)
  }
})

test('the four-worker city threshold and ten-person state threshold branch independently', () => {
  const expected = [
    ['1-3', false, false], ['4-9', true, false], ['10-14', true, true],
    ['15-49', true, true], ['50+', true, true], ['unknown', false, false],
  ]
  assert.deepEqual(nyEmployerSizes.map(([value]) => value), expected.map(([value]) => value))
  for (const [employerSize, cityRule, stateRule] of expected) {
    const early = ids(run({ ...city, employerSize }))
    const denied = ids(run({ ...city, employerSize, hiringStage: 'decision' }))
    assert.equal(early.includes('city-early'), cityRule)
    assert.equal(denied.includes('written-reasons'), stateRule)
  }
})

test('statewide conditional offer yields a practical response and no city response period', () => {
  const g = run(atRisk)
  assert.deepEqual(ids(g), ['state-offer', 'conviction-review'])
  assert.match(g.cards[0].action, /when you can reply/)
  assert.doesNotMatch(JSON.stringify(g.cards), /five business days/i)
})

test('statewide denial starts a 30-day employer response only upon request', () => {
  const g = run({ hiringStage: 'decision' })
  assert.match(card(g, 'written-reasons').text, /30 days from the request/)
  assert.ok(!card(g, 'city-final'))
})

test('NYC distinguishes receipt of both documents from missing or partial materials', () => {
  for (const nyMaterials of ['', 'one', 'neither', 'unsure', 'both']) {
    const g = run({ ...city, ...atRisk, nyMaterials })
    const key = nyMaterials === 'both' ? 'city-response' : 'city-materials'
    assert.match(card(g, key).text, /five business days from receipt of both/)
    assert.ok(!card(g, 'written-reasons'))
  }
})

test('city final written decision can coexist with statewide written reasons for 10+', () => {
  const g = run({ ...city, employerSize: '10-14', hiringStage: 'decision', nyOfferDecision: 'final', nyMaterials: 'both' })
  assert.ok(card(g, 'city-final') && card(g, 'written-reasons'))
  assert.ok(!card(g, 'city-response'))
})

test('a certificate is matched only to a potentially usable prior conviction', () => {
  assert.match(card(run({ recordStatus: ['certificate'] }), 'certificate').text, /presumption of rehabilitation/)
  for (const changes of [{ recordType: 'pending' }, { recordStatus: ['sealed', 'certificate'] }]) {
    assert.ok(!card(run(changes), 'certificate'))
  }
})

test('NYC pending-case factors do not imply a conviction, including in the offer review', () => {
  const g = run({ ...city, ...atRisk, recordType: 'pending', nyMaterials: 'both' })
  assert.ok(card(g, 'pending') && card(g, 'city-response'))
  assert.ok(!card(g, 'conviction-review') && !card(g, 'written-reasons'))
  assert.match(card(g, 'pending').text, /25 or younger/)
  assert.equal(card(run({ recordType: 'pending' }), 'pending').label.startsWith('New York State'), true)
})

test('special dispositions stay conditional and elapsed time never deems a record sealed', () => {
  for (const changes of [{ recordType: 'arrest' }, { recordType: 'juvenile' }, { recordStatus: ['sealed'] }]) {
    const g = run(changes)
    assert.ok(card(g, 'record-outcome') && !card(g, 'conviction-review'))
  }
  const old = run({ sentenceAgo: 'More than 10 years' })
  assert.ok(!card(old, 'record-outcome'))
  assert.match(old.review.join(' '), /actual disposition/)
})

test('uncertain size or employer type does not block an independent outside-report dispute', () => {
  for (const changes of [{ employerSize: 'unknown' }, { employerType: 'staffing' }, { nyLegalRule: 'yes' }, { jobDuties: ['license'] }]) {
    const g = run({ ...city, ...atRisk, ...changes, nyMaterials: 'both', nyReportSource: 'outside', nyReportError: 'yes' })
    assert.ok(card(g, 'dispute') && card(g, 'report-before') && card(g, 'report-article'))
    assert.ok(!card(g, 'city-response') && !card(g, 'written-reasons'))
  }
})

test('an internal search or missing provider suppresses stale third-party dispute answers', () => {
  for (const nyReportSource of ['internal', 'none', '', 'unsure']) {
    const g = run({ hiringStage: 'background', nyReportSource, nyReportError: 'yes' })
    assert.ok(!card(g, 'dispute') && !card(g, 'report-article'))
    assert.equal(Boolean(card(g, 'report-source')), nyReportSource !== 'none')
  }
})

test('dates, source links and practical actions appear across the supported paths', () => {
  const scenarios = [{}, city, atRisk, { ...city, ...atRisk }, { ...city, ...atRisk, nyMaterials: 'both' },
    { recordType: 'pending' }, { recordType: 'juvenile' }, { recordStatus: ['certificate'] },
    { ...city, employerSize: '10-14', hiringStage: 'decision', nyOfferDecision: 'final', nyReportSource: 'outside' },
    { employerSize: 'unknown', nyReportSource: 'outside', nyReportError: 'yes' },
    { employerType: 'government' }, { hiringStage: 'background', recordType: 'unknown' }]
  assert.equal(REVIEW_DATE, '2026-11-11')
  for (const changes of scenarios) {
    const { cards, review } = run(changes)
    assert.ok(cards.length && review.length)
    for (const item of cards) {
      assert.ok(item.action && item.sources.length)
      for (const source of item.sources) assert.match(new URL(sources[source].url).hostname, /\.gov$/)
    }
  }
})
