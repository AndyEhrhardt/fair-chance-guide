import test from 'node:test'
import assert from 'node:assert/strict'
import { minnesotaGuide, sources, REVIEW_DATE } from '../src/guidance/minnesota.js'

const base = {
  state: 'Minnesota', goal: 'asked', employerType: 'private', employerSize: '1-4',
  jobArea: 'Retail or customer service', jobDuties: [], recordType: 'conviction',
  recordStatus: [], conductAgo: '4–6 years', sentenceAgo: '1–3 years',
  hiringStage: 'application', mnRequirement: 'none',
}
const run = changes => minnesotaGuide({ ...base, ...changes })
const card = (g, id) => g.cards.find(c => c.id === id)
const outside = { hiringStage: 'background', goal: 'check', mnReportSource: 'outside' }
const adverse = { ...outside, hiringStage: 'decision', mnReportBasis: 'yes' }

test('selection for an interview is the boundary, regardless of workforce size', () => {
  for (const employerSize of ['1-4', '5-14', '15-49', '50+', 'unknown']) {
    assert.ok(card(run({ employerSize, mnInquiry: 'before-interview' }), 'early-before-interview'))
    assert.ok(card(run({ employerSize, mnInquiry: 'selected' }), 'timing-reached'))
  }
})

test('no-interview hiring waits for the conditional offer', () => {
  assert.ok(card(run({ mnInquiry: 'before-offer' }), 'early-before-offer'))
  assert.match(card(run({ mnInquiry: 'after-offer' }), 'timing-reached').text, /conditional offer/)
})

test('initial screens for every applicant and general notices are distinct cases', () => {
  const screen = card(run({ mnInquiry: 'all-applicants' }), 'early-all-applicants')
  assert.ok(screen.sources.includes('technical'))
  assert.deepEqual(run({ mnInquiry: 'notice' }).cards.map(c => c.id), ['policy-notice'])
})

test('a later-stage applicant can flag an earlier question; changing the goal ignores old history', () => {
  const later = { hiringStage: 'conditional', mnInquiry: 'before-interview' }
  assert.ok(card(run(later), 'early-before-interview'))
  assert.ok(!card(run({ ...later, goal: 'denied' }), 'early-before-interview'))
})

test('legal duties and unknown employers require verification; a company policy alone is insufficient', () => {
  for (const overrides of [{ mnRequirement: 'law' }, { mnRequirement: 'unsure' }, { employerType: 'federal' }, { employerType: 'unknown' }]) {
    const g = run({ ...overrides, mnInquiry: 'before-interview' })
    assert.ok(card(g, 'coverage'))
    assert.ok(!card(g, 'early-before-interview'))
  }
  assert.ok(card(run({ mnRequirement: 'policy', mnInquiry: 'before-interview' }), 'early-before-interview'))
})

test('staffing agencies and private nonprofits receive private-employer timing guidance', () => {
  for (const employerType of ['staffing', 'nonprofit']) {
    const g = run({ employerType, mnInquiry: 'before-interview' })
    assert.ok(card(g, 'early-before-interview').sources.includes('intake'))
  }
  assert.match(run({ employerType: 'staffing' }).review.join(' '), /agency or its client/)
})

test('a private offer at risk gives a practical response without a state five-day waiting period', () => {
  const g = run({ goal: 'denied', hiringStage: 'conditional', mnDecision: 'considering' })
  assert.match(card(g, 'private-offer').action, /when you can respond/)
  assert.match(card(g, 'private-offer').detail, /4–6 years/)
  assert.ok(!card(g, 'public-denial'))
  assert.doesNotMatch(JSON.stringify(g), /five business days/i)
})

test('an outside report triggers a free-copy checkbox with the correct 24-hour starting event', () => {
  const g = run({ ...outside, mnCopyRequest: 'yes', reportReceived: 'No' })
  const c = card(g, 'mn-copy')
  assert.match(c.text, /24 hours of giving the report to the employer/)
  assert.match(c.action, /whether the employer has received/)
  assert.ok(card(g, 'report-before'))
})

test('a reporting-company error or verified relief gets state and federal dispute guidance', () => {
  const g = run({ ...outside, mnReportError: 'yes', recordStatus: ['sealed'] })
  assert.equal(g.cards[0].id, 'mn-dispute')
  assert.match(g.cards[0].text, /30 days after receiving the dispute/)
  assert.match(g.cards[0].detail, /delete/)
  assert.ok(card(g, 'dispute'))
  assert.match(g.review.join(' '), /332\.70/)
})

test('final report-based action is separate from an open decision or unknown basis', () => {
  const g = run(adverse)
  assert.match(card(g, 'mn-adverse').text, /five days after receiving your written request/)
  assert.ok(card(g, 'report-final'))
  for (const mnReportBasis of ['', 'unsure']) {
    const unverified = run({ ...adverse, mnReportBasis })
    assert.ok(card(unverified, 'decision-basis') && !card(unverified, 'mn-adverse'))
  }
  const unrelated = run({ ...adverse, mnReportBasis: 'no' })
  assert.ok(!card(unrelated, 'mn-adverse') && !card(unrelated, 'report-final'))
  assert.ok(!card(run({ ...outside, mnDecision: 'considering', mnReportBasis: 'yes' }), 'mn-adverse'))
})

test('internal, absent and unconfirmed sources cannot inherit an outside-report dispute or deadline', () => {
  for (const mnReportSource of ['internal', 'none', '', 'unsure']) {
    const g = run({ ...adverse, mnReportSource, mnReportError: 'yes' })
    assert.ok(!g.cards.some(c => ['mn-dispute', 'mn-adverse', 'mn-copy', 'dispute', 'report-final'].includes(c.id)))
    assert.ok(card(g, 'timing'))
  }
})

test('screening exemption alone does not remove independent commercial-report rights', () => {
  const g = run({ ...outside, mnRequirement: 'law', mnReportError: 'yes' })
  assert.ok(card(g, 'coverage') && card(g, 'mn-dispute') && card(g, 'dispute'))
  const unknown = run({ ...outside, employerType: 'federal', mnReportError: 'yes' })
  assert.ok(card(unknown, 'special-report') && !card(unknown, 'mn-copy'))
})

test('public-sector written reasons require a reported conviction-based final decision', () => {
  const publicJob = { employerType: 'government', goal: 'denied', hiringStage: 'decision' }
  const g = run({ ...publicJob, mnDecision: 'final' })
  assert.ok(card(g, 'public-denial') && card(g, 'public-review'))
  for (const extra of [{ mnDecision: '' }, { mnDecision: 'final', recordType: 'arrest' }, { mnDecision: 'final', mnRequirement: 'law' }]) {
    assert.ok(!card(run({ ...publicJob, ...extra }), 'public-denial'))
  }
  assert.ok(!card(run({ ...publicJob, employerType: 'private', mnDecision: 'final' }), 'public-denial'))
})

test('record limits for public jobs do not become private-employer rules', () => {
  for (const extra of [{ recordType: 'arrest' }, { recordStatus: ['expunged'] }]) {
    assert.ok(card(run({ employerType: 'government', ...extra }), 'public-record'))
    assert.ok(!card(run(extra), 'public-record'))
  }
})

test('matched guidance includes a concrete action and official source on every card', () => {
  for (const extra of [{}, outside, adverse, { ...outside, mnReportError: 'yes' },
    ...['before-interview', 'selected', 'before-offer', 'all-applicants', 'after-offer', 'notice'].map(mnInquiry => ({ mnInquiry })),
    { employerType: 'unknown' }, { employerType: 'government', hiringStage: 'decision', mnDecision: 'final' }]) {
    for (const c of run(extra).cards) {
      assert.ok(c.action && c.sources.length)
      for (const key of c.sources) assert.ok(new URL(sources[key].url).hostname.endsWith('.gov'))
    }
  }
  assert.equal(REVIEW_DATE, '2026-11-11')
})

