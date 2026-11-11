import { federalReportRules, reportSources } from './federalReports.js'

export const REVIEW_DATE = '2026-11-11'
const law = (section, title) => ({
  name: 'Minnesota § ' + section + ' · ' + title,
  url: 'https://www.revisor.mn.gov/statutes/cite/' + section,
})

export const sources = {
  ...reportSources,
  timing: law('364.021', 'Timing of criminal-history questions'),
  exceptions: law('364.09', 'Exceptions and mandatory checks'),
  enforcement: law('364.06', 'Public and private complaint procedures'),
  publicReview: law('364.03', 'Public employment and rehabilitation'),
  publicRecords: law('364.04', 'Records restricted in public hiring'),
  publicDenial: law('364.05', 'Written notice of a public-employment denial'),
  disclosure: law('13C.02', 'Employment report disclosure and copy'),
  adverse: law('13C.03', 'Notice after an adverse decision'),
  screening: law('332.70', 'Correction of criminal screening records'),
  mdhr: { name: 'Minnesota Department of Human Rights · Criminal background checks', url: 'https://mn.gov/mdhr/employers/criminal-background/' },
  intake: { name: 'Minnesota Department of Human Rights · Report a private-employer hiring question', url: 'https://mn.gov/mdhr/intake/btbform/' },
  technical: { name: 'Minnesota Department of Human Rights · Hiring examples (PDF)', url: 'https://mn.gov/mdhr/assets/Technical%20Guidance%20364.021_tcm1061-213501.pdf' },
}

export function isPrivateEmployer(type) {
  return ['private', 'nonprofit', 'staffing'].includes(type)
}

export function askAboutDecision(stage) {
  return ['conditional', 'background', 'decision'].includes(stage)
}

export function hasFinalDecision(a) {
  return a.hiringStage === 'decision' || (askAboutDecision(a.hiringStage) && a.mnDecision === 'final')
}

function timingCard(a, privateEmployer) {
  const event = a.goal === 'asked' ? a.mnInquiry : ''
  const reference = privateEmployer ? ['timing', 'intake'] : ['timing', 'enforcement']
  if (['before-interview', 'before-offer', 'all-applicants'].includes(event)) {
    const messages = {
      'before-interview': ['The question came before interview selection', 'For an ordinary covered job that uses interviews, the employer must wait until it has chosen you for an interview before asking about or considering criminal history.'],
      'before-offer': ['With no interview, the conditional offer matters', 'You said this hiring process has no interview. For an ordinary covered position, the employer must make a conditional offer before asking about or considering your criminal history.'],
      'all-applicants': ['Check whether the first screening was open to everyone', 'Minnesota’s human rights agency distinguishes an initial screen given to every applicant from selecting someone to interview. Calling the first screen an interview does not by itself permit an early criminal-history question.'],
    }
    const [title, text] = messages[event]
    return { id: 'early-' + event, label: 'Minnesota · Timing of the question', title, text,
      action: privateEmployer ? 'Keep the exact question and a dated copy of the application or screening message. You can report a possible early inquiry to the Minnesota Department of Human Rights.' : 'Keep the question and the dates. Ask the hiring authority about the public-employment grievance process.',
      sources: event === 'all-applicants' ? [...reference, 'technical'] : reference }
  }
  if (event === 'notice') return {
    id: 'policy-notice', label: 'Minnesota · Job posting', title: 'Was it a notice or a question about you?',
    text: 'An employer may tell applicants that a law or company policy disqualifies people with a particular history from a particular position. Asking you to disclose your own history is a separate step subject to the timing rule.',
    action: 'Save the wording. Check whether the posting only described a policy or also required you to answer a personal criminal-history question.',
    sources: ['timing', 'technical'],
  }
  if (event === 'selected' || event === 'after-offer') return {
    id: 'timing-reached', label: 'Minnesota · Hiring stage', title: event === 'selected' ? 'Selection for an interview changes the timing' : 'The question came after a conditional offer',
    text: event === 'selected' ? 'You said the employer had already selected you for an interview. For an ordinary covered position, Minnesota’s waiting period generally ends at selection, even if the interview has yet to take place.' : 'You said the employer did not interview and had already made a conditional offer. That is generally the point when this Minnesota timing rule permits a criminal-history inquiry.',
    action: 'Keep the invitation or offer. If the employer raises a concern, ask which entry it is considering and which job duties it relates to.',
    sources: ['timing', 'mdhr'],
  }
  return {
    id: 'timing', label: 'Minnesota · Applying for work', title: 'When can a Minnesota employer ask about your record?',
    text: 'For an ordinary covered job, criminal-history questions or consideration generally begin once the employer selects you for an interview. If it does not interview, it must wait until a conditional offer. The statute sets no minimum employee count for this timing rule.',
    action: 'Check the sequence: application, interview selection, conditional offer, and first record question. Save the posting and any invitation or offer.',
    sources: ['timing', 'mdhr'],
  }
}

function stateReportCards(a, finalDecision) {
  if (a.mnReportSource !== 'outside') return []
  const cards = []
  if (a.mnReportError === 'yes') {
    const relief = a.recordStatus?.some(s => ['sealed', 'expunged', 'pardoned'].includes(s))
    cards.push({
      id: 'mn-dispute', label: 'Minnesota · Report error', title: 'Ask the screening company to correct the criminal record',
      text: 'For a business that collects criminal records for a fee, Minnesota provides a free dispute process. The service must review relevant evidence and notify you of the outcome within 30 days after receiving the dispute. A dispute can end early if the service reasonably finds it frivolous and explains why.',
      detail: relief ? 'You selected sealing, expungement or a pardon. A screening service that knows a record has that status must promptly delete it.' : '',
      action: 'Identify the incorrect entry and the official outcome. Send supporting copies to the screening company, keep proof of receipt, and tell the employer about the dispute.',
      sources: ['screening', 'ftc'],
    })
  }
  if (finalDecision && a.mnReportBasis === 'yes') {
    cards.push({
      id: 'mn-adverse', label: 'Minnesota · Report-based decision', title: 'Request the report in writing after a denial',
      text: 'You said the outside report contributed to the final decision. The employer must tell you about its use, identify the reporting agency and explain your correction rights. If you did not already receive a copy, the notice must explain your right to one. The agency must supply a free copy within five days after receiving your written request.',
      action: 'Send the written request to the reporting agency named in the notice. Keep the notice, your request and its delivery date.',
      sources: ['adverse'],
    })
  } else if (finalDecision && a.mnReportBasis !== 'no') {
    cards.push({
      id: 'decision-basis', label: 'Minnesota · Fact to confirm', title: 'Find out whether the report affected the decision',
      text: 'An outside check and a rejection can occur in the same hiring process. Minnesota’s adverse-action notice depends on whether information in the report contributed to the decision.',
      action: 'Ask whether the employer relied on the report and which company supplied it. Keep any notice you received.',
      sources: ['adverse'],
    })
  }
  if (!finalDecision || a.reportReceived !== 'Yes') cards.push({
    id: 'mn-copy', label: 'Minnesota · Your report copy', title: a.mnCopyRequest === 'yes' && a.reportReceived !== 'Yes' ? 'Check when the company sent the report to the employer' : 'Look for the free-copy checkbox',
    text: 'For a job you specifically applied for, the employer generally must give written disclosure before obtaining an outside consumer report. The form must let you request a copy. If you request it, the reporting company must send your free copy within 24 hours of giving the report to the employer.',
    action: a.reportReceived === 'Yes' ? 'Keep your copy and compare each entry with the official record.' : a.mnCopyRequest === 'yes' ? 'Keep your copy request. Ask whether the employer has received the report and when the screening company sent your copy.' : 'Look for the checkbox on the disclosure, return your request, and keep a copy for yourself.',
    sources: ['disclosure'],
  })
  return cards
}

export function minnesotaGuide(a) {
  const cards = []
  const review = []
  const privateEmployer = isPrivateEmployer(a.employerType)
  const publicEmployer = a.employerType === 'government'
  const scoped = privateEmployer || publicEmployer
  const claimedDuty = a.mnRequirement === 'law' || a.mnRequirement === 'unsure'
  const ordinary = scoped && !claimedDuty
  const finalDecision = hasFinalDecision(a)
  const recordDecision = askAboutDecision(a.hiringStage) && (a.mnDecision === 'final' || (a.mnDecision === 'considering' && a.hiringStage !== 'decision'))
  if (!ordinary) {
    cards.push({
      id: 'coverage', label: 'Minnesota · Coverage check', title: scoped ? 'Verify the legal requirement for this position' : 'Confirm which employer and rules cover the job',
      text: scoped ? 'An employer with a statutory duty to check or consider criminal history can be exempt from Minnesota’s ordinary timing rule. Chapter 364 also has specific exclusions, including school districts. A company policy by itself does not establish a statutory duty.' : 'Federal agencies, federal contractors and an unidentified hiring employer can follow different rules. This guide cannot determine which Minnesota timing requirements apply from that answer.',
      action: scoped ? 'Ask for the specific law, the duties it covers, and when it requires the check. Keep the employer’s explanation.' : 'Confirm who will employ you and whether this job has a legally required screening process.',
      sources: ['timing', 'exceptions', 'technical'],
    })
  } else if (a.goal === 'asked' || a.goal === 'prepare' || !askAboutDecision(a.hiringStage)) {
    cards.push(timingCard(a, privateEmployer))
  }
  if (ordinary && privateEmployer && (recordDecision || (finalDecision && a.goal === 'denied'))) {
    const detail = a.recordType === 'conviction' && a.conductAgo && a.conductAgo !== 'Not sure'
      ? 'Time you selected since the conduct: ' + a.conductAgo.toLowerCase() + '.' : ''
    cards.push({
      id: finalDecision ? 'private-final' : 'private-offer', label: 'Minnesota · Private hiring', title: finalDecision ? 'Find out what the employer relied on' : 'Ask what concern is putting the offer at risk',
      text: 'Minnesota’s ban-the-box rule controls the timing of a criminal-history inquiry. It does not itself set a private employer’s response deadline or guarantee a job. The state human rights agency advises employers to consider the actual duties, seriousness of the conduct and elapsed time.',
      detail,
      action: finalDecision ? 'Keep the offer and rejection. Ask which record and job duty were involved and whether a background-reporting company supplied the information.' : 'Ask which entry and job duty concern the employer, whether the decision is still open, and when you can respond. Share a correction or relevant work experience if you choose.',
      sources: ['timing', 'mdhr'],
    })
  }
  if (ordinary && publicEmployer && a.recordType === 'conviction' && !a.recordStatus?.includes('expunged')) {
    if (a.mnDecision === 'final' && finalDecision) cards.push({
      id: 'public-denial', label: 'Minnesota · Public employment', title: 'Check the hiring authority’s written denial',
      text: 'For a covered Minnesota public job denied even partly because of a prior conviction, the hiring authority must give written reasons, the applicable grievance procedure, the earliest reapplication date, and notice that rehabilitation evidence will be considered on reapplication.',
      action: 'Ask for the written decision and grievance instructions. Keep the reapplication date and your evidence together.',
      sources: ['publicDenial', 'enforcement', 'exceptions'],
    })
    cards.push({
      id: 'public-review', label: 'Minnesota · Public employment', title: 'How a conviction relates to public job duties',
      text: 'For a covered public position, a conviction generally must directly relate to the job before it can disqualify an applicant. The authority considers the offense and actual duties. Even when related, evidence of sufficient rehabilitation and present fitness matters.',
      action: 'Ask which duties the conviction affects. Consider bringing evidence of current fitness, work history or completion of supervision. Check whether an occupational exception applies.',
      sources: ['publicReview', 'exceptions'],
    })
  }
  if (ordinary && publicEmployer && (a.recordType === 'arrest' || a.recordStatus?.includes('expunged'))) cards.push({
    id: 'public-record', label: 'Minnesota · Public employment', title: 'Verify the outcome the public employer is considering',
    text: 'For covered public-employment applications, Minnesota restricts use of arrests without a valid conviction, legally annulled or expunged convictions, and misdemeanors for which jail cannot be imposed.',
    action: 'Compare the entry with the court’s disposition or order. Ask the hiring authority which record it used and whether the position falls under a statutory exception.',
    sources: ['publicRecords', 'exceptions'],
  })

  if (!cards.length) cards.push(timingCard(a, privateEmployer))
  const stateReports = scoped ? stateReportCards(a, finalDecision) : []
  if (a.mnReportSource === 'outside' && a.mnReportError === 'yes') cards.unshift(...stateReports)
  else cards.push(...stateReports)
  const federal = federalReportRules(a, { source: a.mnReportSource, error: a.mnReportError, finalDecision })
  cards.push(...federal.filter(card => !(card.id === 'report-final' && a.mnReportBasis === 'no')))

  if (scoped && a.mnReportSource === 'outside' && a.mnReportError === 'yes') review.push('Minnesota law treats a screening service that complies with applicable federal Fair Credit Reporting Act provisions as compliant with § 332.70. Check which dispute procedure the company is following.')
  if (a.employerType === 'staffing') review.push('Confirm whether the agency or its client ordered the check. A client’s screening duty does not automatically authorize the staffing agency to ask every applicant about criminal history.')
  if (publicEmployer || a.jobDuties?.some(duty => ['care', 'license', 'health', 'security'].includes(duty))) review.push('Check the specific position before relying on the ordinary rule. Public safety, school districts, certain background studies and professional licensing can follow different statutes.')
  if (a.recordStatus?.some(s => ['sealed', 'expunged', 'pardoned'].includes(s))) review.push('Check the actual court order or pardon and which records it covers. A timing range alone cannot establish whether a particular employer may see the record.')
  review.push('This guide covers statewide hiring rules. Local ordinances, employer-specific policies and individual deadlines may need a separate check.')
  return { cards, review, coverage: {
    title: !ordinary ? 'Minnesota coverage needs a check' : publicEmployer ? 'Minnesota public employment' : 'Minnesota private-sector hiring',
    reason: !ordinary ? 'Verify the employer or legal screening duty before relying on the usual timing rule. Outside-report rights are considered separately.' : 'The statewide timing rule generally applies regardless of employer size. The hiring sequence and any statutory exception matter.',
  } }
}
