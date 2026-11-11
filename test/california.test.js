import test from 'node:test'
import assert from 'node:assert/strict'
import { californiaGuide, sources, REVIEW_DATE } from '../src/guidance/california.js'

const applicant = {
  state: 'California', employerType: 'private', employerSize: '5-14',
  jobArea: 'Retail or customer service', jobDuties: [], goal: 'prepare',
  recordType: 'conviction', recordStatus: [], conductAgo: '4–6 years',
  sentenceAgo: '1–3 years', hiringStage: 'application',
}
const result = changes => californiaGuide({ ...applicant, ...changes })
const ids = guide => guide.cards.map(card => card.id)

test('early conviction question for a private employer with at least five employees', () => {
  const guide = result({ goal: 'asked', caAskedBefore: 'yes' })
  assert.equal(guide.coverage.status, 'ordinary')
  assert.deepEqual(ids(guide), ['early'])
  assert.match(guide.cards[0].action, /exact question/)
  assert.doesNotMatch(guide.cards[0].text, /violated/)
})

test('a later hiring stage can still surface an explicitly reported early question', () => {
  assert.deepEqual(ids(result({ hiringStage: 'conditional', goal: 'asked', caAskedBefore: 'yes' })), ['early', 'assessment'])
  assert.deepEqual(ids(result({ hiringStage: 'conditional', goal: 'prepare', caAskedBefore: 'yes' })), ['assessment'])
})

test('conditional offer without a preliminary decision does not start a response period', () => {
  const guide = result({ hiringStage: 'conditional' })
  assert.deepEqual(ids(guide), ['assessment'])
  assert.match(guide.cards[0].detail, /4–6 years/)
  assert.match(guide.cards[0].detail, /1–3 years/)
})

test('a preliminary decision with written notice gives minimum periods and extension conditions', () => {
  const guide = result({ hiringStage: 'conditional', caOfferDecision: 'considering', caWrittenNotice: 'yes' })
  assert.deepEqual(ids(guide), ['preliminary', 'response-time', 'assessment'])
  const rule = guide.cards[1]
  for (const term of ['from receipt', 'additional business days', 'in writing', 'specific steps']) assert.ok(rule.text.includes(term))
  assert.match(guide.review.join(' '), /Delivery method/)
})

test('verbal concern or missing notice prompts a request without assigning a deadline', () => {
  for (const caWrittenNotice of ['no', 'unsure', '']) {
    const guide = result({ hiringStage: 'background', caOfferDecision: 'considering', caWrittenNotice })
    assert.ok(!ids(guide).includes('response-time'))
    assert.match(guide.cards[0].action, /request the written notice/)
  }
})

test('final withdrawal gives final-notice and report rights, suppressing a stale preliminary answer', () => {
  const guide = result({ hiringStage: 'decision', caOfferDecision: 'withdrawn', caWrittenNotice: 'yes', caReportSource: 'outside' })
  assert.deepEqual(ids(guide), ['final-offer', 'assessment', 'report-final'])
  assert.match(guide.cards[0].action, /reconsideration/)
  assert.match(guide.cards.at(-1).action, /60 days/)
})

test('third-party report error prioritizes a dispute without assuming an offer or denial', () => {
  const guide = result({ hiringStage: 'background', goal: 'check', caReportSource: 'outside', caReportError: 'yes' })
  assert.equal(ids(guide)[0], 'dispute')
  assert.ok(ids(guide).includes('report-before'))
  assert.ok(!ids(guide).includes('response-time'))
  assert.match(guide.cards[0].action, /reporting company/)
})

test('uncertain employer size and small employer preserve independent federal report rights', () => {
  for (const [employerSize, status] of [['unknown', 'unknown'], ['', 'unknown'], ['1-4', 'small']]) {
    const guide = result({ employerSize, hiringStage: 'conditional', caOfferDecision: 'considering', caWrittenNotice: 'yes', caReportSource: 'outside', caReportError: 'yes' })
    assert.equal(guide.coverage.status, status)
    assert.deepEqual(ids(guide), ['coverage-' + status, 'dispute', 'report-before'])
  }
})

test('scope and screening exceptions need verification rather than a categorical exemption', () => {
  for (const [changes, status] of [
    [{ employerType: 'staffing' }, 'sector'], [{ employerType: 'government' }, 'sector'],
    [{ caLegalCheck: 'yes' }, 'exception'], [{ caLegalCheck: 'unsure' }, 'exception'],
    [{ jobDuties: ['license'] }, 'exception'], [{ jobArea: 'Healthcare' }, 'exception'],
  ]) {
    const guide = result({ ...changes, hiringStage: 'conditional', caOfferDecision: 'considering', caWrittenNotice: 'yes' })
    assert.equal(guide.coverage.status, status)
    assert.ok(!ids(guide).includes('response-time'))
  }
})

test('internal, absent, and unconfirmed providers never trigger an outside-company dispute', () => {
  for (const caReportSource of ['internal', '', 'unsure', 'none']) {
    const guide = result({ hiringStage: 'background', caReportSource, caReportError: 'yes' })
    assert.ok(!ids(guide).some(id => ['dispute', 'report-before', 'report-final'].includes(id)))
    assert.equal(ids(guide).includes('report-source'), caReportSource !== 'none')
  }
})

test('a possible transportation exception is flagged without removing a report dispute', () => {
  const guide = result({ jobDuties: ['driving'], caReportSource: 'outside', caReportError: 'yes' })
  assert.ok(ids(guide).includes('special-report'))
  assert.ok(ids(guide).includes('dispute'))
  assert.ok(!ids(guide).includes('report-before'))
})

test('record restrictions and unresolved relief are distinguished from an ordinary conviction', () => {
  const sealed = result({ hiringStage: 'conditional', recordStatus: ['sealed'] })
  assert.deepEqual(ids(sealed), ['record-limits'])
  const pending = result({ recordType: 'pending' })
  assert.ok(!ids(pending).includes('record-limits'))
  assert.match(pending.review.join(' '), /pending or juvenile/)
})

test('sources and practical actions exist for each published rule', () => {
  const observed = new Map()
  for (const changes of [
    {}, { employerType: 'unknown' }, { employerSize: '1-4' }, { employerSize: 'unknown' }, { caLegalCheck: 'yes' },
    { recordType: 'arrest' }, { hiringStage: 'background' }, { hiringStage: 'conditional', caOfferDecision: 'considering', caWrittenNotice: 'yes' },
    { hiringStage: 'decision', caOfferDecision: 'withdrawn', caReportSource: 'outside', caReportError: 'yes' },
    { caReportSource: 'outside' }, { jobDuties: ['driving'], caReportSource: 'outside' }, { employerSize: '15-49' },
  ]) {
    for (const card of result(changes).cards) observed.set(card.id, card)
  }
  assert.equal(observed.size, 17)
  assert.match(REVIEW_DATE, /^\d{4}-\d{2}-\d{2}$/)
  for (const card of observed.values()) {
    assert.ok(card.action && card.text && card.sources.length)
    for (const key of card.sources) assert.match(new URL(sources[key].url).hostname, /\.gov$/)
  }
})

