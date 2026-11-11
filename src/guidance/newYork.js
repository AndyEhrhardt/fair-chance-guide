import { federalReportRules, reportSources } from './federalReports.js'

export const REVIEW_DATE = '2026-11-11'

const statute = (section, label) => ({
  name: label, url: 'https://www.nysenate.gov/legislation/laws/' + section,
})

export const sources = {
  ...reportSources,
  size: statute('COR/750', 'New York Correction Law § 750 · Who is covered'),
  scope: statute('COR/751', 'New York Correction Law § 751 · Scope and legal bars'),
  assessment: statute('COR/752', 'New York Correction Law § 752 · Conviction-based decisions'),
  factors: statute('COR/753', 'New York Correction Law § 753 · Factors and certificates'),
  reasons: statute('COR/754', 'New York Correction Law § 754 · Written reasons for denial'),
  records: statute('EXC/296', 'New York Executive Law § 296(15)–(16) · Record protections'),
  reportCopy: statute('GBS/380-G', 'New York General Business Law § 380-g(d) · Copy of Article 23-A'),
  ag: { name: 'New York Attorney General · Barriers to re-entry', url: 'https://ag.ny.gov/publications/barriers-re-entry' },
  courts: { name: 'New York Courts · Clean Slate and sealing', url: 'https://www.nycourts.gov/cleanslate' },
  dhr: { name: 'New York State Division of Human Rights · Report discrimination', url: 'https://dhr.ny.gov/report' },
  city: { name: 'NYC Commission on Human Rights · Fair Chance guidance', url: 'https://www.nyc.gov/site/cchr/law/fair-chance-act.page' },
  cityRule: { name: 'NYC Commission on Human Rights · Commission rules, chapter 2', url: 'https://www.nyc.gov/site/cchr/law/title-47-chapter-2.page' },
  citySize: { name: 'NYC Commission on Human Rights · Employer fact sheet', url: 'https://www.nyc.gov/site/cchr/media/fair-chance-employers.page' },
}

export const nyEmployerSizes = [
  ['1-3', '1–3 employees'], ['4-9', '4–9 employees'], ['10-14', '10–14 employees'],
  ['15-49', '15–49 employees'], ['50+', '50+ employees'], ['unknown', 'Not sure'],
]

export function hasOfferStage(stage) {
  return ['conditional', 'background', 'decision'].includes(stage)
}

function assessScope(a) {
  const privateCompany = a.employerType === 'private'
  const stateSize = ['10-14', '15-49', '50+'].includes(a.employerSize)
  const citySize = stateSize || a.employerSize === '4-9'
  const specialized = a.nyLegalRule === 'yes' || a.nyLegalRule === 'unsure' ||
    a.jobArea === 'Security or public safety' || a.jobDuties?.includes('license')
  const ordinary = privateCompany && !specialized
  return {
    ordinary, state: ordinary && stateSize, city: ordinary && citySize && a.nyArea === 'nyc',
    sizeKnown: nyEmployerSizes.some(([value]) => value === a.employerSize && value !== 'unknown'),
    specialized,
  }
}

function coverageCard(a, scope) {
  if (!scope.ordinary) return {
    id: 'scope-role', label: 'New York · Coverage check', title: 'Check the rule for this employer and position',
    text: a.employerType !== 'private' ? 'This guide covers ordinary private-company applicants. Public jobs, staffing arrangements and federal positions can follow different processes.' : 'A licensing rule or a law specific to this position can affect timing or impose a hiring restriction. An employer’s routine screening policy does not establish a legal bar.',
    action: 'Identify the actual duties and ask which law applies to this position. A certificate or pardon may remove some legal bars. Bring that question to the state Division of Human Rights or a legal-aid provider.',
    sources: ['scope', 'size', 'city', 'dhr'],
  }
  if (scope.state) return null
  return {
    id: 'scope-size', label: 'New York State · Employer size', title: scope.sizeKnown ? 'Check which protections cover this smaller employer' : 'Confirm the employer’s size',
    text: 'Article 23-A defines a private employer as having at least ten employees. ' + (scope.sizeKnown ? 'Your range is below that threshold. Other state record protections and federal report rights can still matter.' : 'Your answer does not establish that threshold. NYC’s separate hiring process generally begins at four workers for jobs in the city.'),
    action: 'Ask about the employer’s total workforce, including other locations. For a small NYC business, check how owners and workers count with the city commission.',
    sources: ['size', 'records', 'citySize'],
  }
}

const supportNames = { work: 'work history', education: 'training or education', references: 'references', service: 'community involvement', treatment: 'a support program' }

function assessmentCard(a, city) {
  const details = []
  if (a.conductAgo && a.conductAgo !== 'Not sure') details.push('Time since the conduct: ' + a.conductAgo.toLowerCase() + '.')
  const evidence = (a.support || []).map(key => supportNames[key]).filter(Boolean)
  if (evidence.length) details.push('Examples you selected: ' + evidence.join(', ') + '.')
  return {
    id: 'conviction-review', label: city ? 'New York City · Prior conviction' : 'New York State · Prior conviction',
    title: 'How does the conviction relate to this particular job?',
    text: 'A covered employer generally needs a direct connection to the work or an unreasonable risk to people or property to deny a job because of a previous conviction. It must weigh the job duties, how the offense bears on them, its seriousness, your age at the time, elapsed time, rehabilitation, safety and property interests, and the state policy favoring employment.',
    detail: details.join(' '), action: 'Use the job description to explain which duties you can perform. If you wish, share examples of work, training or references since the offense.',
    sources: city ? ['city', 'assessment', 'factors'] : ['assessment', 'factors'],
  }
}

function cityProcess(a, decision) {
  if (decision === 'final') return {
    id: 'city-final', label: 'NYC · Final decision', title: 'Ask for the final decision in writing',
    text: 'If the employer still withdraws a conditional offer because of a record after the Fair Chance review, it must communicate its final decision in writing within a reasonable time. It must consider the information the applicant supplied during the response period.',
    action: 'Save the offer, criminal-history inquiry, written analysis, your reply and the final decision. Contact the NYC Commission on Human Rights if a step appears to be missing.',
    sources: ['city', 'cityRule'],
  }
  const both = a.nyMaterials === 'both'
  return {
    id: both ? 'city-response' : 'city-materials', label: 'NYC · Conditional offer',
    title: both ? 'You have time to respond to the employer’s analysis' : 'Ask for both parts of the Fair Chance review',
    text: 'Before a covered employer withdraws an offer because of a conviction or pending case, it must share the criminal-history information it used and its written Fair Chance Analysis. It must hold the position open for a reasonable response period of at least five business days from receipt of both.',
    action: both ? 'Keep both documents and note when each arrived. Check the response date, correct inaccuracies and explain how the job duties relate to your record. Keep a copy of your reply.' : 'Request any missing inquiry or analysis and confirm the response date. A warning or a report alone does not establish when the city response period began.',
    sources: ['cityRule', 'city'],
  }
}

export function newYorkGuide(a) {
  const scope = assessScope(a)
  const cards = []
  const review = []
  const preOffer = ['application', 'interview'].includes(a.hiringStage)
  const askedEarly = a.goal === 'asked' && a.nyAskedBefore === 'yes'
  const selectedDecision = hasOfferStage(a.hiringStage) ? a.nyOfferDecision : ''
  const decision = a.hiringStage === 'decision' && selectedDecision === 'considering' ? '' : selectedDecision
  const finalDecision = a.hiringStage === 'decision' || decision === 'final'
  const statuses = a.recordStatus || []
  const protectedOutcome = ['arrest', 'juvenile'].includes(a.recordType) || statuses.some(s => ['sealed', 'expunged', 'dismissed'].includes(s))
  const prior = a.recordType === 'conviction' && !protectedOutcome
  const pending = a.recordType === 'pending' && !protectedOutcome
  const coverage = coverageCard(a, scope)
  if (coverage && !scope.city) cards.push(coverage)

  if (scope.city && (prior || pending) && ['considering', 'final'].includes(decision)) cards.push(cityProcess(a, decision))
  if (scope.state && prior && !scope.city && decision === 'considering') cards.push({
    id: 'state-offer', label: 'New York State · Conditional offer', title: 'Respond to the concern about your conditional offer',
    text: 'If a previous conviction may cost you the offer, the covered employer must weigh the Article 23-A factors before denying the job on that basis. The state assessment rule does not set a standard pre-decision response window.',
    action: 'Ask which conviction and job duties caused concern, whether the decision is still open and when you can reply. Send any relevant correction or evidence of good conduct and keep your response.',
    sources: ['assessment', 'factors', 'scope'],
  })
  if (scope.state && prior && finalDecision) cards.push({
    id: 'written-reasons', label: 'New York State · Job denied', title: 'You can request the reasons in writing',
    text: 'A previously convicted applicant denied employment can request a written explanation from an employer covered by Article 23-A. The employer has 30 days from the request to provide it.',
    action: 'Send a dated request: “Please provide the written reasons for denying my application under New York Correction Law § 754.” Keep a copy and proof of delivery.',
    sources: ['reasons', 'size'],
  })
  if (protectedOutcome) cards.push({
    id: 'record-outcome', label: 'New York State · Record outcome', title: 'Check the legal outcome of the case',
    text: 'State law generally restricts questions and adverse decisions about favorably terminated accusations, youthful-offender adjudications and specified sealed records. Some jobs have statutory access or exceptions. A broad description such as “juvenile” does not establish the precise disposition.',
    action: 'Check the court disposition or sealing order before deciding what to disclose. If an outside report shows a different outcome, ask the reporting company to correct it.',
    sources: ['records', 'courts'],
  })
  if (scope.ordinary && (preOffer || askedEarly)) {
    if (scope.city) cards.push({
      id: 'city-early', label: 'NYC · Before an offer', title: askedEarly ? 'You reported a criminal-history question before an offer' : 'Criminal-history questions generally come after a conditional offer',
      text: 'For a covered NYC job, the employer generally must assess your other qualifications and make a conditional offer before asking about convictions or pending cases, including in an application or interview.',
      action: 'Save the exact wording, the job posting and any offer. Note the order of events and ask the city commission about the timing if the question came first.',
      sources: ['city', 'citySize'],
    })
    else cards.push({
      id: 'local-timing', label: 'New York State · Timing', title: 'Check the rule where the work will take place',
      text: 'Article 23-A addresses how employers consider convictions. The timing of a question can depend on a local law, the kind of record and the position. The statewide assessment rule alone does not establish that an early question was unlawful.',
      action: 'Save the question and confirm the work location. Check the local human rights agency before deciding how to answer.',
      sources: ['assessment', 'records', 'ag'],
    })
  }
  if (prior && (scope.state || scope.city)) {
    cards.push(assessmentCard(a, scope.city && !scope.state))
    if (statuses.includes('certificate')) cards.push({
      id: 'certificate', label: 'New York · Certificate', title: 'Check which conviction your certificate covers',
      text: 'Under the Article 23-A factors, a Certificate of Relief from Disabilities or a Certificate of Good Conduct creates a presumption of rehabilitation for the offenses it covers. The employer still assesses the job and the other factors.',
      action: 'Check the certificate’s exact title and covered offenses. If relevant, offer a copy with your response to the employer.',
      sources: scope.city ? ['factors', 'city'] : ['factors'],
    })
  }
  if (pending) cards.push({
    id: 'pending', label: scope.city ? 'NYC · Pending case' : 'New York State · Pending case',
    title: scope.city ? 'A pending case gets a separate city review' : 'Confirm how the pending case is classified',
    text: scope.city ? 'A covered NYC employer considering a pending case after a conditional offer must weigh the city’s pending-case factors, including the job duties, seriousness of the alleged conduct, whether you were 25 or younger at the time, and evidence of good conduct. Prior convictions require a separate analysis.' : 'Article 23-A addresses previous convictions. State protections for cases resolved in your favor depend on the actual disposition. A case still pending raises a different question.',
    action: 'Check the current case status and ask which record the employer used. If the case was resolved, get the disposition before responding.',
    sources: scope.city ? ['city', 'cityRule'] : ['scope', 'records'],
  })
  const reports = federalReportRules(a, { source: a.nyReportSource, error: a.nyReportError, finalDecision })
  if (a.nyReportSource === 'outside' && a.nyReportError === 'yes' && decision !== 'considering') cards.unshift(...reports)
  else cards.push(...reports)
  if (a.nyReportSource === 'outside' && a.recordType === 'conviction') cards.push({
    id: 'report-article', label: 'New York State · Background report', title: 'Look for a copy of Article 23-A',
    text: 'If a reporting company supplies the employer a report containing conviction information covered by General Business Law § 380-g(d), the requester must give you a printed or electronic copy of Article 23-A.',
    action: 'Ask for the Article 23-A notice and check whether the entry belongs to you and shows its current outcome.',
    sources: ['reportCopy'],
  })
  if (coverage && scope.city) cards.push(coverage)
  if (!cards.length) cards.push({
    id: 'clarify', label: 'New York State · Facts to confirm', title: 'Find out which record and hiring stage are involved',
    text: 'A pending charge, a previous conviction and a sealed matter can lead to different guidance. An employer starting a check does not establish that a decision has been made.',
    action: 'Ask whether there was a conditional offer, what information the employer used and whether a decision is final. You can change your answers when you know.',
    sources: ['records', 'assessment', 'ag'],
  })

  if (a.nyArea !== 'nyc') review.push(a.nyArea === 'elsewhere' ? 'This guide covers statewide rules for your job. Other New York cities and counties can have additional hiring rules that have not been reviewed here.' : 'The work location is uncertain. Confirm whether the job is in one of New York City’s five boroughs before relying on a city-specific rule.')
  else if (!scope.city) review.push('NYC coverage needs confirmation. Check the employer’s workforce and any position-specific exception with the city commission before relying on a city response period.')
  else review.push('NYC coverage depends on the work location, how workers count and any legal exception for the position. Confirm these facts if the job is remote, licensed or subject to mandatory screening.')
  if (statuses.includes('sealed') || statuses.includes('expunged') || statuses.includes('pardoned') || a.sentenceAgo === 'More than 10 years') review.push('Elapsed time or a pardon alone does not establish that a record has been sealed. Confirm the court’s actual disposition and which employers may access it.')
  return { cards, review, coverage: {
    title: scope.city ? 'New York State and NYC' : 'New York State',
    reason: scope.city ? 'The job is in NYC and your selected workforce range meets the city’s usual four-worker threshold. State and city rules are identified separately below.' : (scope.state ? 'Your selected company size meets Article 23-A’s ten-employee threshold for ordinary private-sector jobs.' : 'The guide identifies the coverage questions raised by your answers. Federal background-report rights are evaluated separately.'),
  } }
}
