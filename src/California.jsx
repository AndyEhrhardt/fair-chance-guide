import { askAboutOffer, REVIEW_DATE, sources } from './guidance/california.js'

const unsure = ['unsure', 'Not sure']
const yesNo = [['yes', 'Yes'], ['no', 'No'], unsure]

function OptionalSelect({ label, field, answers, update, options = yesNo }) {
  return <label className="field-label">{label} <em>Optional</em>
    <select value={answers[field] || ''} onChange={e => update(field, e.target.value)}>
      <option value="">Choose an answer</option>
      {options.map(([value, name]) => <option key={value} value={value}>{name}</option>)}
    </select>
  </label>
}

export function CaliforniaWorkQuestion(props) {
  return <OptionalSelect {...props} field="caLegalCheck"
    label="Has the employer said a law requires a criminal check or hiring restriction for this specific position?" />
}

export function CaliforniaProcessQuestions({ answers, update }) {
  const props = { answers, update }
  const offers = [['none', 'No conviction-based decision about an offer']]
  if (answers.hiringStage !== 'decision') offers.push(['considering', 'The employer may withdraw my conditional offer because of a conviction'])
  offers.push(['withdrawn', 'The employer withdrew my conditional offer because of a conviction'], unsure)
  return <>
    {answers.goal === 'asked' && <OptionalSelect {...props} field="caAskedBefore" label="Did the employer ask about convictions before making a conditional offer?" />}
    {askAboutOffer(answers.hiringStage) && <OptionalSelect {...props} field="caOfferDecision" label="What has the employer said about a conditional offer?" options={offers} />}
    {askAboutOffer(answers.hiringStage) && answers.caOfferDecision === 'considering' && answers.hiringStage !== 'decision' &&
      <OptionalSelect {...props} field="caWrittenNotice" label="Have you received a written preliminary decision about withdrawing the offer?" />}
    <OptionalSelect {...props} field="caReportSource" label="Who is doing or has done the background check?"
      options={[['outside', 'An outside background-reporting company'], ['internal', 'The employer searched on its own'], ['none', 'No check that I know of'], unsure]} />
    {answers.caReportSource === 'outside' && <>
      <OptionalSelect {...props} field="reportReceived" label="Did you receive a copy of the background report?" options={[['Yes', 'Yes'], ['No', 'No'], ['Not sure', 'Not sure']]} />
      <OptionalSelect {...props} field="caReportError" label="Do you suspect a mistake or missing information in that report?" />
    </>}
  </>
}

const reviewedOn = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(REVIEW_DATE + 'T00:00:00Z'))

export function CaliforniaResults({ guide }) {
  return <div className="results-layout">
    <section className="results-main" aria-label="Your California guidance">
      <h2>What applies to your situation</h2>
      {guide.cards.map(card => <article className="result-card state-card" key={card.id}>
        <div className="result-card-top"><span>{card.label}</span></div>
        <h3>{card.title}</h3>
        <div className="result-body">
          <p>{card.text}</p>
          {card.detail && <p className="answer-detail">{card.detail}</p>}
          <div className="context-note"><strong>Next step</strong> {card.action}</div>
          <div className="rule-sources">
            <span>Sources checked <time dateTime={REVIEW_DATE}>{reviewedOn}</time></span>
            {card.sources.map(id => <a key={id} href={sources[id].url} target="_blank" rel="noreferrer">{sources[id].name}</a>)}
          </div>
        </div>
      </article>)}
    </section>
    <aside className="next-steps-panel">
      <h2>Questions to verify</h2>
      {guide.review.map(note => <p className="review-question" key={note}>{note}</p>)}
      <a href={sources.scope.url} target="_blank" rel="noreferrer">Find help from California’s Civil Rights Department</a>
    </aside>
  </div>
}
