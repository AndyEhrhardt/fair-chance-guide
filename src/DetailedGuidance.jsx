const unsure = ['unsure', 'Not sure']
const yesNo = [['yes', 'Yes'], ['no', 'No'], unsure]

export function OptionalSelect({ label, field, answers, update, options = yesNo }) {
  return <label className="field-label">{label} <em>Optional</em>
    <select value={answers[field] || ''} onChange={e => update(field, e.target.value)}>
      <option value="">Choose an answer</option>
      {options.map(([value, name]) => <option key={value} value={value}>{name}</option>)}
    </select>
  </label>
}

export function ReportQuestions({ answers, update, sourceField, errorField }) {
  const props = { answers, update }
  return <>
    <OptionalSelect {...props} field={sourceField} label="Who is doing or has done the background check?"
      options={[['outside', 'An outside background-reporting company'], ['internal', 'The employer searched on its own'], ['none', 'No check that I know of'], unsure]} />
    {answers[sourceField] === 'outside' && <>
      <OptionalSelect {...props} field="reportReceived" label="Did you receive a copy of the background report?" options={[['Yes', 'Yes'], ['No', 'No'], ['Not sure', 'Not sure']]} />
      <OptionalSelect {...props} field={errorField} label="Do you suspect a mistake or missing information in that report?" />
    </>}
  </>
}

const dateFormat = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

export function DetailedResults({ guide, jurisdiction, sources, reviewDate, help }) {
  const reviewedOn = dateFormat.format(new Date(reviewDate + 'T00:00:00Z'))
  return <div className="results-layout">
    <section className="results-main" aria-label={`Your ${jurisdiction} guidance`}>
      <h2>What applies to your situation</h2>
      {guide.cards.map(card => <article className="result-card state-card" key={card.id}>
        <div className="result-card-top"><span>{card.label}</span></div>
        <h3>{card.title}</h3>
        <div className="result-body">
          <p>{card.text}</p>
          {card.detail && <p className="answer-detail">{card.detail}</p>}
          <div className="context-note"><strong>Next step</strong> {card.action}</div>
          <div className="rule-sources">
            <span>Sources checked <time dateTime={reviewDate}>{reviewedOn}</time></span>
            {card.sources.map(id => <a key={id} href={sources[id].url} target="_blank" rel="noreferrer">{sources[id].name}</a>)}
          </div>
        </div>
      </article>)}
    </section>
    <aside className="next-steps-panel">
      <h2>Questions to verify</h2>
      {guide.review.map(note => <p className="review-question" key={note}>{note}</p>)}
      <a href={help.url} target="_blank" rel="noreferrer">{help.name}</a>
    </aside>
  </div>
}
