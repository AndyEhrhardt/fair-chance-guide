import { useMemo, useState } from 'react'
import './App.css'

const STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
  'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
  'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
  'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
  'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
  'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
  'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
  'West Virginia', 'Wisconsin', 'Wyoming', 'District of Columbia',
]

const STEP_LABELS = ['Goal', 'Location', 'Work', 'Record', 'Timing', 'Process']

const INITIAL_ANSWERS = {
  goal: '',
  state: '',
  city: '',
  employerType: '',
  employerSize: '',
  jobArea: '',
  jobDuties: [],
  recordType: '',
  recordLevel: '',
  recordCategory: '',
  recordStatus: [],
  conductAgo: '',
  sentenceAgo: '',
  support: [],
  hiringStage: '',
  reportReceived: '',
}

const OPTIONS = {
  goal: [
    ['prepare', 'Planning ahead', 'I want to understand the rules before I apply.'],
    ['asked', 'I was asked about my record', 'I want to know whether the timing seems right.'],
    ['check', 'A background check is happening', 'I want to understand the process and my rights.'],
    ['denied', 'An offer or job was affected', 'I was rejected, an offer was withdrawn, or I lost a job.'],
  ],
  employerType: [
    ['private', 'Private company'],
    ['government', 'State or local government'],
    ['federal', 'Federal government or contractor'],
    ['staffing', 'Staffing or temp agency'],
    ['nonprofit', 'Nonprofit organization'],
    ['unknown', 'Not sure'],
  ],
  employerSize: [
    ['1-4', '1–4 employees'],
    ['5-14', '5–14 employees'],
    ['15-49', '15–49 employees'],
    ['50+', '50+ employees'],
    ['unknown', 'Not sure'],
  ],
  recordType: [
    ['conviction', 'Conviction'],
    ['pending', 'Pending charge or case'],
    ['arrest', 'Arrest without conviction'],
    ['juvenile', 'Juvenile matter'],
    ['unknown', 'Not sure'],
  ],
  hiringStage: [
    ['application', 'Application or early interview'],
    ['interview', 'Later interview, no offer yet'],
    ['conditional', 'After a conditional offer'],
    ['background', 'During a background check'],
    ['decision', 'After a rejection or withdrawn offer'],
  ],
}

const JOB_AREAS = [
  'Office or administration', 'Construction or skilled trades',
  'Transportation or delivery', 'Food service or hospitality',
  'Retail or customer service', 'Healthcare', 'Education or childcare',
  'Finance or banking', 'Technology', 'Warehouse or manufacturing',
  'Security or public safety', 'Another field',
]

const JOB_DUTIES = [
  ['money', 'Money or financial accounts'],
  ['driving', 'Driving or vehicles'],
  ['care', 'Children or vulnerable people'],
  ['health', 'Healthcare access'],
  ['homes', 'Private homes'],
  ['security', 'Security or weapons'],
  ['license', 'Professional license'],
  ['none', 'None of these / not sure'],
]

const RECORD_LEVELS = ['Felony', 'Misdemeanor', 'Violation or infraction', 'Not sure']
const RECORD_CATEGORIES = [
  'Property', 'Financial or fraud', 'Violence or threat', 'Drug-related',
  'Driving-related', 'Public order', 'Another category', 'Prefer not to say',
]
const RECORD_STATUSES = [
  ['sealed', 'Sealed'], ['expunged', 'Expunged'], ['dismissed', 'Dismissed'],
  ['pardoned', 'Pardoned'], ['certificate', 'Certificate of relief or good conduct'],
  ['none', 'None of these'], ['unknown', 'Not sure'],
]
const TIME_OPTIONS = [
  'Less than 1 year', '1–3 years', '4–6 years', '7–10 years',
  'More than 10 years', 'Not sure',
]
const SENTENCE_OPTIONS = ['Still completing it', ...TIME_OPTIONS]
const SUPPORT_OPTIONS = [
  ['work', 'Work history'], ['education', 'Education or training'],
  ['references', 'References'], ['service', 'Community involvement'],
  ['treatment', 'Treatment or support program'], ['none', 'None yet / prefer not to say'],
]

const SOURCES = {
  eeoc: 'https://www.eeoc.gov/employers/small-business/criminal-records',
  ftc: 'https://consumer.ftc.gov/articles/employer-background-checks-and-your-rights',
  california: 'https://calcivilrights.ca.gov/fair-chance-act/employment-rights/',
  newYork: 'https://dol.ny.gov/individuals-who-are-justice-involved',
  nyc: 'https://www.nyc.gov/site/cchr/law/fair-chance-act.page',
}

function MarkIcon({ type = 'check' }) {
  const paths = {
    check: <path d="m5 12 4 4L19 6" />,
    lock: <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    back: <><path d="M19 12H5" /><path d="m11 18-6-6 6-6" /></>,
    shield: <><path d="M12 3 5 6v5c0 4.8 2.8 8.1 7 10 4.2-1.9 7-5.2 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>,
    reset: <><path d="M4 4v6h6" /><path d="M5.6 15a7 7 0 1 0 .5-7.5L4 10" /></>,
    external: <><path d="M14 4h6v6" /><path d="M10 14 20 4" /><path d="M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5" /></>,
  }
  return <svg className="mark-icon" aria-hidden="true" viewBox="0 0 24 24">{paths[type]}</svg>
}

function ChoiceCards({ name, options, value, onChange, columns = 2 }) {
  return (
    <div className={`choice-grid cols-${columns}`} role="radiogroup" aria-label={name}>
      {options.map(([optionValue, label, description]) => (
        <button
          type="button"
          role="radio"
          className={`choice-card ${value === optionValue ? 'selected' : ''}`}
          aria-checked={value === optionValue}
          key={optionValue}
          onClick={() => onChange(optionValue)}
        >
          <span className="choice-indicator"><span /></span>
          <span>
            <strong>{label}</strong>
            {description && <small>{description}</small>}
          </span>
        </button>
      ))}
    </div>
  )
}

function MultiSelect({ options, values, onChange }) {
  const toggle = (value) => {
    const exclusives = ['none', 'unknown']
    if (values.includes(value)) {
      onChange(values.filter((item) => item !== value))
      return
    }
    if (exclusives.includes(value)) {
      onChange([value])
      return
    }
    onChange([...values.filter((item) => !exclusives.includes(item)), value])
  }

  return (
    <div className="chip-grid">
      {options.map(([value, label]) => (
        <button
          type="button"
          className={`select-chip ${values.includes(value) ? 'selected' : ''}`}
          aria-pressed={values.includes(value)}
          key={value}
          onClick={() => toggle(value)}
        >
          <span className="chip-check"><MarkIcon /></span>{label}
        </button>
      ))}
    </div>
  )
}

function Welcome({ onStart }) {
  return (
    <main className="welcome page-shell">
      <section className="hero-copy">
        <div className="eyebrow"><span /> Private by design</div>
        <h1>A clearer path through hiring rules.</h1>
        <p className="hero-lead">
          Answer a few general questions to see which hiring protections may matter—without sharing your name, employer, or case details.
        </p>
        <button className="primary-button hero-button" type="button" onClick={onStart}>
          Start my private check <MarkIcon type="arrow" />
        </button>
        <p className="microcopy"><MarkIcon type="lock" /> Your answers stay in this tab and are never saved.</p>
      </section>

      <aside className="promise-card" aria-label="Privacy promise">
        <div className="promise-top">
          <div className="shield-badge"><MarkIcon type="shield" /></div>
          <span>MVP privacy promise</span>
        </div>
        <h2>Useful guidance.<br />No identity required.</h2>
        <div className="promise-list">
          <div><MarkIcon /><span><strong>No account</strong>No email, login, or profile</span></div>
          <div><MarkIcon /><span><strong>No identifying details</strong>No name, birth date, case number, or employer name</span></div>
          <div><MarkIcon /><span><strong>No saved answers</strong>Reset or refresh and your answers disappear</span></div>
        </div>
        <div className="promise-note">This prototype provides general information—not legal advice.</div>
      </aside>

      <section className="how-it-works" aria-labelledby="how-title">
        <div>
          <span className="section-kicker">How it works</span>
          <h2 id="how-title">A few broad details. A more relevant starting point.</h2>
        </div>
        <div className="mini-steps">
          <div><span>1</span><p><strong>Tell us the setting</strong>State, job area, and hiring stage</p></div>
          <div><span>2</span><p><strong>Describe the record broadly</strong>Category and approximate timing</p></div>
          <div><span>3</span><p><strong>Get a practical summary</strong>Questions to ask and official sources</p></div>
        </div>
      </section>
    </main>
  )
}

function StepContent({ step, answers, update }) {
  if (step === 0) {
    return <>
      <div className="step-heading"><span>First, tell us your goal</span><h1>What would be most helpful today?</h1><p>This helps us focus the result on the right point in the hiring process.</p></div>
      <ChoiceCards name="Your goal" options={OPTIONS.goal} value={answers.goal} onChange={(value) => update('goal', value)} />
    </>
  }

  if (step === 1) {
    return <>
      <div className="step-heading"><span>Location</span><h1>Where is the job located?</h1><p>State and city rules can be different. This is about the job—not your home address.</p></div>
      <div className="form-stack">
        <label className="field-label">State or district <strong>Required</strong>
          <select value={answers.state} onChange={(event) => update('state', event.target.value)}>
            <option value="">Choose a state</option>
            {STATES.map((state) => <option key={state}>{state}</option>)}
          </select>
        </label>
        <label className="field-label">City or county <em>Optional</em>
          <input value={answers.city} onChange={(event) => update('city', event.target.value)} placeholder="For example, New York City" autoComplete="off" />
          <small>Don’t enter a street address. City-level rules can add protections.</small>
        </label>
      </div>
    </>
  }

  if (step === 2) {
    return <>
      <div className="step-heading"><span>Work</span><h1>Tell us about the job—not the employer.</h1><p>We only need broad details to understand which responsibilities and coverage rules may matter.</p></div>
      <div className="form-stack compact">
        <fieldset>
          <legend>Type of employer <strong>Required</strong></legend>
          <ChoiceCards name="Employer type" options={OPTIONS.employerType} value={answers.employerType} onChange={(value) => update('employerType', value)} columns={3} />
        </fieldset>
        <div className="two-fields">
          <label className="field-label">Approximate employer size <strong>Required</strong>
            <select value={answers.employerSize} onChange={(event) => update('employerSize', event.target.value)}>
              <option value="">Choose a range</option>
              {OPTIONS.employerSize.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
            </select>
          </label>
          <label className="field-label">Job area <strong>Required</strong>
            <select value={answers.jobArea} onChange={(event) => update('jobArea', event.target.value)}>
              <option value="">Choose a job area</option>
              {JOB_AREAS.map((area) => <option key={area}>{area}</option>)}
            </select>
          </label>
        </div>
        <fieldset>
          <legend>Does the job involve any of these? <em>Choose any</em></legend>
          <MultiSelect options={JOB_DUTIES} values={answers.jobDuties} onChange={(value) => update('jobDuties', value)} />
        </fieldset>
      </div>
    </>
  }

  if (step === 3) {
    return <>
      <div className="step-heading"><span>Record</span><h1>Describe the record in broad terms.</h1><p>No statute, case number, court, or description of what happened is needed.</p></div>
      <div className="form-stack compact">
        <fieldset>
          <legend>What kind of record is most relevant? <strong>Required</strong></legend>
          <ChoiceCards name="Record type" options={OPTIONS.recordType} value={answers.recordType} onChange={(value) => update('recordType', value)} columns={3} />
        </fieldset>
        {answers.recordType === 'conviction' && <div className="two-fields">
          <label className="field-label">Level <em>Optional</em>
            <select value={answers.recordLevel} onChange={(event) => update('recordLevel', event.target.value)}>
              <option value="">Choose one</option>
              {RECORD_LEVELS.map((level) => <option key={level}>{level}</option>)}
            </select>
          </label>
          <label className="field-label">General category <em>Optional</em>
            <select value={answers.recordCategory} onChange={(event) => update('recordCategory', event.target.value)}>
              <option value="">Choose one</option>
              {RECORD_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
            </select>
          </label>
        </div>}
        <fieldset>
          <legend>Does any status apply? <em>Choose any</em></legend>
          <MultiSelect options={RECORD_STATUSES} values={answers.recordStatus} onChange={(value) => update('recordStatus', value)} />
        </fieldset>
      </div>
    </>
  }

  if (step === 4) {
    return <>
      <div className="step-heading"><span>Timing and context</span><h1>About how much time has passed?</h1><p>Approximate ranges are enough. We don’t ask how long you were incarcerated.</p></div>
      <div className="form-stack compact">
        <div className="two-fields">
          <label className="field-label">Since the conduct occurred <strong>Required</strong>
            <select value={answers.conductAgo} onChange={(event) => update('conductAgo', event.target.value)}>
              <option value="">Choose a range</option>
              {TIME_OPTIONS.map((time) => <option key={time}>{time}</option>)}
            </select>
          </label>
          <label className="field-label">Since the sentence was completed <strong>Required</strong>
            <select value={answers.sentenceAgo} onChange={(event) => update('sentenceAgo', event.target.value)}>
              <option value="">Choose a range</option>
              {SENTENCE_OPTIONS.map((time) => <option key={time}>{time}</option>)}
            </select>
            <small>Include probation or parole. Choose “not sure” if this doesn’t apply.</small>
          </label>
        </div>
        <fieldset>
          <legend>What positive context could you share if needed? <em>Optional</em></legend>
          <MultiSelect options={SUPPORT_OPTIONS} values={answers.support} onChange={(value) => update('support', value)} />
        </fieldset>
      </div>
    </>
  }

  return <>
    <div className="step-heading"><span>Hiring process</span><h1>Where are you in the process?</h1><p>The timing of a question or decision can change which protections apply.</p></div>
    <div className="form-stack compact">
      <ChoiceCards name="Hiring stage" options={OPTIONS.hiringStage} value={answers.hiringStage} onChange={(value) => update('hiringStage', value)} columns={2} />
      {(answers.hiringStage === 'background' || answers.hiringStage === 'decision') && <fieldset>
        <legend>Did you receive a copy of the background report? <em>Optional</em></legend>
        <div className="inline-options">
          {['Yes', 'No', 'Not sure'].map((value) => <button type="button" key={value} className={answers.reportReceived === value ? 'selected' : ''} onClick={() => update('reportReceived', value)}>{value}</button>)}
        </div>
      </fieldset>}
    </div>
  </>
}

function isNewYorkCity(city) {
  return /new york|nyc|brooklyn|queens|bronx|staten island|manhattan/i.test(city)
}

function ResultCard({ tone, label, title, children, source }) {
  return <article className={`result-card ${tone || ''}`}>
    <div className="result-card-top"><span>{label}</span>{source && <a href={source} target="_blank" rel="noreferrer">Official source <MarkIcon type="external" /></a>}</div>
    <h3>{title}</h3>
    <div className="result-body">{children}</div>
  </article>
}

function Results({ answers, onEdit, onReset }) {
  const reviewed = answers.state === 'California' || answers.state === 'New York'
  const nyc = answers.state === 'New York' && isNewYorkCity(answers.city)
  const preOffer = ['application', 'interview'].includes(answers.hiringStage)
  const backgroundStage = ['background', 'decision'].includes(answers.hiringStage) || ['check', 'denied'].includes(answers.goal)
  const protectedStatus = answers.recordStatus.some((status) => ['sealed', 'expunged', 'dismissed', 'pardoned'].includes(status))

  const nextSteps = useMemo(() => {
    const steps = []
    if (preOffer) steps.push('Keep a dated copy or screenshot of any question asking about criminal history.')
    if (backgroundStage) steps.push('Ask which background-reporting company was used and request a copy of the report.')
    if (answers.reportReceived === 'No') steps.push('Ask for the report and the written summary of your rights before a final decision is made.')
    if (protectedStatus) steps.push('Confirm that the record’s sealed, expunged, dismissed, or pardoned status appears correctly on the report.')
    if (answers.support.length && !answers.support.includes('none')) steps.push('Gather the positive context you selected so it is ready if an individualized review occurs.')
    steps.push('Use the official links below to confirm the current rule before taking action.')
    return steps
  }, [answers, backgroundStage, preOffer, protectedStatus])

  const tags = [answers.state, answers.jobArea, OPTIONS.hiringStage.find(([value]) => value === answers.hiringStage)?.[1]].filter(Boolean)

  return <main className="results page-shell">
    <section className="result-hero">
      <div>
        <div className="eyebrow light"><span /> Your private summary</div>
        <h1>Here’s what may matter most.</h1>
        <p>This is a starting point based on broad answers. It does not predict what an employer will do.</p>
        <div className="summary-tags">{tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
      </div>
      <div className={`coverage-card ${reviewed ? 'reviewed' : ''}`}>
        <span className="coverage-icon"><MarkIcon type={reviewed ? 'shield' : 'lock'} /></span>
        <div><small>Coverage level</small><strong>{reviewed ? 'Reviewed jurisdiction sources' : 'Federal guidance only'}</strong><p>{reviewed ? 'Includes an official state source.' : 'State-specific rules are not yet reviewed in this MVP.'}</p></div>
      </div>
    </section>

    <div className="results-layout">
      <section className="results-main" aria-label="Your guidance">
        <h2>What the rules focus on</h2>
        <ResultCard label="Federal baseline" title="The record should be considered in relation to the job—not in the abstract." source={SOURCES.eeoc}>
          <p>EEOC guidance points employers toward the nature of the conduct, the time that has passed, and the nature and responsibilities of the job.</p>
          {answers.jobDuties.length > 0 && !answers.jobDuties.includes('none') && <div className="context-note"><strong>Why we asked about duties:</strong> Your selections help identify the actual responsibilities an employer may compare with a record.</div>}
        </ResultCard>

        {answers.state === 'California' && <ResultCard tone="state-card" label="California" title={preOffer ? 'A covered employer generally should not ask yet.' : 'An individualized assessment may be required.'} source={SOURCES.california}>
          <p>California’s Fair Chance Act generally covers employers with five or more employees, delays conviction-history questions until after a conditional offer, and requires a job-related individualized assessment before an offer is withdrawn.</p>
          {answers.employerSize === '1-4' && <div className="context-note warning"><strong>Coverage note:</strong> You selected 1–4 employees, below the state law’s general five-employee threshold. Other rules may still apply.</div>}
          {(answers.recordType === 'arrest' || protectedStatus) && <div className="context-note"><strong>Record-status flag:</strong> California restricts consideration of arrests without conviction and certain sealed, dismissed, expunged, or otherwise eradicated records.</div>}
        </ResultCard>}

        {answers.state === 'New York' && <ResultCard tone="state-card" label={nyc ? 'New York City' : 'New York State'} title={nyc && preOffer ? 'NYC generally delays criminal-history questions until after a conditional offer.' : 'The employer must evaluate the record in relation to the specific job.'} source={nyc ? SOURCES.nyc : SOURCES.newYork}>
          <p>New York Article 23-A generally limits record-based denial to situations involving a direct relationship to the job or an unreasonable risk, after considering factors such as duties, time, age at the conduct, seriousness, and rehabilitation.</p>
          {!nyc && <div className="context-note warning"><strong>Local rules can add protection:</strong> Entering the job’s city helps distinguish New York City’s Fair Chance Act from the statewide framework.</div>}
        </ResultCard>}

        {!reviewed && <ResultCard tone="pending-card" label={`${answers.state} · research pending`} title="This MVP is not making a state-law claim here.">
          <p>State and city rules can be more protective than the federal baseline. Until this jurisdiction is reviewed against official sources, use this result as a question list—not a statement of local law.</p>
        </ResultCard>}

        {backgroundStage && <ResultCard label="Background report" title="You may have rights to see and dispute the report." source={SOURCES.ftc}>
          <p>When an employer uses a third-party background report, federal law generally requires written permission and specific steps before and after an adverse decision, including access to the report and information about disputing errors.</p>
        </ResultCard>}
      </section>

      <aside className="next-steps-panel">
        <span className="section-kicker">Practical next steps</span>
        <h2>A short checklist</h2>
        <ol>{nextSteps.map((item, index) => <li key={item}><span>{index + 1}</span><p>{item}</p></li>)}</ol>
        <div className="privacy-reminder"><MarkIcon type="lock" /><p><strong>Still private</strong>Your answers were not saved or sent anywhere.</p></div>
      </aside>
    </div>

    <section className="source-strip">
      <div><span className="section-kicker">Source shelf</span><h2>Read the official guidance</h2><p>Rules change. These links are the authority behind this prototype.</p></div>
      <div className="source-links">
        <a href={SOURCES.eeoc} target="_blank" rel="noreferrer">EEOC criminal-record guidance <MarkIcon type="external" /></a>
        <a href={SOURCES.ftc} target="_blank" rel="noreferrer">FTC background-check rights <MarkIcon type="external" /></a>
        {answers.state === 'California' && <a href={SOURCES.california} target="_blank" rel="noreferrer">California Fair Chance Act <MarkIcon type="external" /></a>}
        {answers.state === 'New York' && <a href={nyc ? SOURCES.nyc : SOURCES.newYork} target="_blank" rel="noreferrer">{nyc ? 'NYC Fair Chance Act' : 'New York Article 23-A'} <MarkIcon type="external" /></a>}
      </div>
    </section>

    <div className="result-actions">
      <button type="button" className="secondary-button" onClick={onEdit}><MarkIcon type="back" /> Change my answers</button>
      <button type="button" className="text-button" onClick={onReset}><MarkIcon type="reset" /> Clear everything and start over</button>
    </div>
    <p className="disclaimer"><strong>Important:</strong> Fair Chance Guide provides general educational information, not legal advice. Laws and coverage depend on the facts and can change. Consult an attorney or official enforcement agency for advice about a specific situation.</p>
  </main>
}

function App() {
  const [started, setStarted] = useState(false)
  const [step, setStep] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const [answers, setAnswers] = useState(INITIAL_ANSWERS)

  const update = (field, value) => setAnswers((current) => ({ ...current, [field]: value }))
  const reset = () => {
    setAnswers(INITIAL_ANSWERS)
    setStep(0)
    setShowResults(false)
    setStarted(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const canContinue = [
    Boolean(answers.goal),
    Boolean(answers.state),
    Boolean(answers.employerType && answers.employerSize && answers.jobArea),
    Boolean(answers.recordType),
    Boolean(answers.conductAgo && answers.sentenceAgo),
    Boolean(answers.hiringStage),
  ][step]

  const next = () => {
    if (!canContinue) return
    if (step === STEP_LABELS.length - 1) {
      setShowResults(true)
    } else {
      setStep((current) => current + 1)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return <div className="app">
    <header className="site-header">
      <button className="brand" type="button" onClick={reset} aria-label="Fair Chance Guide home">
        <span className="brand-mark"><MarkIcon type="shield" /></span>
        <span>Fair Chance <strong>Guide</strong></span>
        <small>MVP</small>
      </button>
      <div className="header-privacy"><MarkIcon type="lock" /> No personal information collected</div>
    </header>

    {!started && !showResults && <Welcome onStart={() => setStarted(true)} />}

    {started && !showResults && <main className="wizard page-shell">
      <div className="progress-wrap">
        <div className="progress-copy"><span>Step {step + 1} of {STEP_LABELS.length}</span><strong>{STEP_LABELS[step]}</strong></div>
        <div className="progress-track" role="progressbar" aria-valuemin="1" aria-valuemax={STEP_LABELS.length} aria-valuenow={step + 1}><span style={{ width: `${((step + 1) / STEP_LABELS.length) * 100}%` }} /></div>
        <div className="step-labels">{STEP_LABELS.map((label, index) => <span key={label} className={index <= step ? 'active' : ''}>{label}</span>)}</div>
      </div>

      <section className="wizard-card">
        <StepContent step={step} answers={answers} update={update} />
        <div className="wizard-actions">
          <button type="button" className="back-button" disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))}><MarkIcon type="back" /> Back</button>
          <button type="button" className="primary-button" disabled={!canContinue} onClick={next}>{step === STEP_LABELS.length - 1 ? 'See my guide' : 'Continue'} <MarkIcon type="arrow" /></button>
        </div>
      </section>
      <p className="wizard-privacy"><MarkIcon type="lock" /> Nothing you enter here is stored. Refreshing this page clears the form.</p>
    </main>}

    {showResults && <Results answers={answers} onEdit={() => { setShowResults(false); setStep(0) }} onReset={reset} />}

    <footer className="site-footer"><span>Fair Chance Guide · Prototype</span><span>Private by default · Educational information only</span></footer>
  </div>
}

export default App
