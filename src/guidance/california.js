// Source-check date for the rules in this module. Update only after checking the cited material.
export const REVIEW_DATE = '2026-11-10'

export const sources = {
  scope: { name: 'California Civil Rights Department · Fair Chance Act', url: 'https://calcivilrights.ca.gov/fair-chance-act/' },
  faq: { name: 'California Civil Rights Department · Applicant FAQ (PDF)', url: 'https://calcivilrights.ca.gov/wp-content/uploads/sites/32/2022/11/Fair-Chance-Act-FAQ_ENG.pdf' },
  regulation: { name: 'California regulation · 2 CCR § 11017.1 (approved text, PDF)', url: 'https://calcivilrights.ca.gov/wp-content/uploads/sites/32/2025/06/Notice-of-Approval-regulations-automated-employment-decision-systems.pdf' },
  complaint: { name: 'California Civil Rights Department · File a complaint', url: 'https://calcivilrights.ca.gov/complaintprocess/how-to-file-a-complaint/' },
  ftc: { name: 'Federal Trade Commission · Employer background checks', url: 'https://consumer.ftc.gov/articles/employer-background-checks-and-your-rights' },
  fcra: { name: 'Fair Credit Reporting Act · 15 U.S.C. § 1681b(b)', url: 'https://uscode.house.gov/us/usc/t15/s1681b/' },
  dispute: { name: 'Fair Credit Reporting Act · 15 U.S.C. § 1681i(a)', url: 'https://uscode.house.gov/us/usc/t15/s1681i/' },
  finalReport: { name: 'Fair Credit Reporting Act · 15 U.S.C. § 1681m(a)', url: 'https://uscode.house.gov/us/usc/t15/s1681m/' },
  eeocSize: { name: 'U.S. Equal Employment Opportunity Commission · Private employer coverage', url: 'https://www.eeoc.gov/coverage-businessprivate-employers' },
  eeoc: { name: 'U.S. Equal Employment Opportunity Commission · Criminal records', url: 'https://www.eeoc.gov/employers/small-business/criminal-records' },
}

export function askAboutOffer(stage) {
  return ['conditional', 'background', 'decision'].includes(stage)
}

function stateCoverage(a) {
  if (a.employerType !== 'private') return {
    status: 'sector', title: 'Confirm the rules for this employer', reason: 'This detailed pathway covers hiring by private companies. Other employers, including staffing agencies, may also be covered, but their arrangements need a separate check.',
    action: 'Identify who is hiring you and ask the California Civil Rights Department (CRD) which rules cover that arrangement.',
  }
  if (a.employerSize === '1-4') return {
    status: 'small', title: 'The size you selected is below the usual state threshold', reason: 'The statewide Fair Chance Act generally covers employers with at least five employees. You selected one to four. City rules and federal background-report rights may still matter.',
    action: 'Check the size of the whole employer and the rules for the city or county where the job is based.',
  }
  if (!['5-14', '15-49', '50+'].includes(a.employerSize)) return {
    status: 'unknown', title: 'Check how many people the employer has', reason: 'California’s usual threshold is five employees. The staff you see at one location may be only part of the company.',
    action: 'Ask whether the employer has at least five employees in total. Save any notice or application while you check.',
  }
  if (a.caLegalCheck === 'yes' || a.caLegalCheck === 'unsure' || a.jobDuties?.includes('license') ||
      ['Healthcare', 'Education or childcare', 'Security or public safety', 'Finance or banking'].includes(a.jobArea) ||
      a.jobDuties?.some(duty => ['care', 'health', 'security'].includes(duty))) return {
    status: 'exception', title: 'Check whether a special rule covers this position', reason: 'The reported employer size meets the usual threshold. A law requiring screening or restricting hiring for this particular role can change the result. A job title or an employer’s policy alone does not establish an exemption.',
    action: 'Ask which law applies to the duties of this position. If the answer is unclear, check with CRD or the relevant licensing agency.',
  }
  return { status: 'ordinary', title: 'California private-sector hiring', reason: 'You selected a private company with at least five employees. These statewide rules assume ordinary hiring. Exceptions include positions as farm labor contractors and jobs for which another law requires criminal screening or restricts hiring.' }
}

function federalReportRules(a, finalDecision) {
  const outside = a.caReportSource === 'outside'
  if (!outside) {
    const checking = a.hiringStage === 'background' || a.goal === 'check' || a.reportReceived === 'No'
    if (!checking || a.caReportSource === 'none') return []
    const internal = a.caReportSource === 'internal'
    return [{
      id: 'report-source', label: 'Federal · Check the source',
      title: internal ? 'An employer’s own search follows a different path' : 'Find out who supplied the information',
      text: 'The federal reporting-company process described by the FTC applies when an employer uses an outside background-reporting company. An employer can also look up records itself.',
      action: internal ? 'Ask which record was used and how to send a correction to the employer.' : 'Ask who produced the report and how to get a copy. Return to this guide if you learn it came from an outside company.',
      sources: ['ftc'],
    }]
  }
  const rules = []
  if (a.caReportError === 'yes') rules.push({
    id: 'dispute', label: 'Federal · Report accuracy', title: 'Dispute the error with the reporting company',
    text: 'You can challenge inaccurate or incomplete information, including a record that belongs to someone else or a missing case outcome. The reporting company generally must reinvestigate a dispute at no charge.',
    action: 'Identify the incorrect entry and the correction you want. Send supporting copies to the reporting company, keep proof, and tell the employer you are disputing it. Ask the company to send the corrected report to the employer.',
    sources: ['ftc', 'dispute'],
  })
  const transport = a.jobArea === 'Transportation or delivery' || a.jobDuties?.includes('driving')
  if (transport || a.employerType === 'federal') {
    rules.push({
      id: 'special-report', label: 'Federal · Procedure to verify', title: 'Check which federal notice process applies',
      text: 'Certain regulated transportation jobs with entirely remote applications and certain federal national-security determinations have special procedures. The employer type or job category alone cannot establish an exception.',
      action: 'Ask which reporting company and notice procedure were used for this job. Keep the report and any notice together.',
      sources: ['fcra', 'ftc'],
    })
    return rules
  }
  if (finalDecision) rules.push({
    id: 'report-final', label: 'Federal · After a decision', title: 'Look for the reporting company’s contact details',
    text: 'If an outside report contributed to a rejection, the employer must identify the reporting company, explain that the company did not make the hiring decision, and tell you about your dispute and free-copy rights.',
    action: 'Save the adverse-action notice. You can request a free copy from the reporting company within 60 days of receiving that notice and dispute errors directly with the company.',
    sources: ['ftc', 'finalReport'],
  })
  else rules.push({
    id: 'report-before', label: 'Federal · Outside background check', title: 'Know what you should receive before a report-based rejection',
    text: 'For ordinary hiring, the employer generally must give a separate written disclosure and get written permission before ordering the report. Before taking adverse action based even partly on it, the employer must give you a copy and a summary of your federal rights.',
    action: a.reportReceived === 'Yes' ? 'Compare the report with your own records and keep the summary of rights.' : 'If the employer is considering rejecting you based on the report, ask for the report and the summary of rights now.',
    sources: ['ftc', 'fcra'],
  })
  return rules
}

export function californiaGuide(a) {
  const coverage = stateCoverage(a)
  const cards = []
  const review = []
  const early = ['application', 'interview'].includes(a.hiringStage)
  const offer = askAboutOffer(a.hiringStage) ? a.caOfferDecision : ''
  const atRisk = offer === 'considering' && a.hiringStage !== 'decision'
  const finalOffer = offer === 'withdrawn'
  const finalDecision = finalOffer || a.hiringStage === 'decision'
  const restrictedRecord = a.recordType === 'arrest' || (a.recordType === 'conviction' && a.recordStatus?.some(status => ['sealed', 'dismissed', 'expunged'].includes(status)))
  const askedEarly = a.goal === 'asked' && a.caAskedBefore === 'yes'

  if (coverage.status !== 'ordinary') {
    cards.push({ id: 'coverage-' + coverage.status, label: 'California · Coverage to verify', title: coverage.title, text: coverage.reason, action: coverage.action, sources: ['scope', 'faq'] })
    review.push('Confirm state coverage before relying on an offer-response period. If a notice has arrived, keep it and seek help promptly.')
  } else {
    if (atRisk) cards.push({
      id: 'preliminary', label: 'California · Conditional offer', title: 'You have a chance to respond before a final withdrawal',
      text: 'If the employer makes a preliminary decision based on a conviction, it must identify the conviction in writing, include the conviction-history report if there is one, and explain how and when you can respond. You can point out mistakes or offer evidence of rehabilitation or other circumstances. The employer must consider your response before deciding.',
      action: a.caWrittenNotice === 'yes' ? 'Keep the notice and its delivery details. Reply to the employer in writing and keep a copy of your response.' : 'Ask whether a preliminary decision has been made and request the written notice, any report, and the response instructions.',
      sources: ['faq', 'regulation'],
    })
    if (atRisk && a.caWrittenNotice === 'yes') cards.push({
      id: 'response-time', label: 'California · Response period', title: 'Check the deadline on the preliminary notice',
      text: 'A covered employer must allow at least five business days from receipt of the notice. To obtain at least five additional business days for an accuracy dispute, notify the employer in writing within the initial five business days that you dispute the information and are taking specific steps to get supporting evidence.',
      action: 'If disputing an entry, tell the employer which entry you dispute and what you are doing to verify it. Also contact the reporting company if it supplied the report.',
      sources: ['regulation'],
    })
    if (atRisk && a.caWrittenNotice !== 'yes') review.push('It is unclear whether a written preliminary notice has arrived. Check your messages and mail and ask for the response date in writing.')
    if (atRisk && a.caWrittenNotice === 'yes') review.push('Delivery method can affect when notice counts as received. Check the notice and confirm the response date promptly. This guide does not calculate a personal deadline.')
    if (finalOffer) cards.push({
      id: 'final-offer', label: 'California · Final decision', title: 'Check the final written notice for reconsideration options',
      text: 'If a covered employer finally withdraws an offer based at least partly on conviction history, it must send a written decision. It must describe any existing way to seek reconsideration and tell you of your right to file a complaint with CRD.',
      action: 'Keep the offer, both notices, and anything you sent in response. Check for a reconsideration procedure or contact CRD about the complaint process.',
      sources: ['faq', 'complaint'],
    })
    if (early || askedEarly) cards.push({
      id: 'early', label: 'California · Before a conditional offer', title: askedEarly ? 'You reported a conviction question before an offer' : 'When can a conviction question come up?',
      text: 'In ordinary covered hiring, the employer generally must wait until it makes a conditional offer before asking about or considering conviction history. This includes questions on an application and during interviews.',
      action: askedEarly || a.goal === 'asked' ? 'Keep the exact question, the date, and the application or interview notes. Ask whether a conditional offer had been made. CRD can help you review the timing.' : 'Keep a copy of the application and note when an offer is made, so you can compare the sequence if a question comes up.',
      sources: ['scope', 'faq'],
    })
    if (!restrictedRecord && (a.hiringStage === 'conditional' || atRisk || finalOffer)) {
      const dates = []
      if (a.conductAgo && a.conductAgo !== 'Not sure') dates.push('Time since the conduct: ' + a.conductAgo.toLowerCase() + '.')
      if (a.sentenceAgo === 'Still completing it') dates.push('You are still completing the sentence.')
      else if (a.sentenceAgo && a.sentenceAgo !== 'Not sure') dates.push('Time since sentence completion: ' + a.sentenceAgo.toLowerCase() + '.')
      cards.push({
        id: 'assessment', label: 'California · Job-specific review', title: finalOffer ? 'What the employer should have weighed' : 'How the employer must assess a conviction',
        text: 'Before denying a job because of a conviction, a covered employer must assess its relationship to the actual work. The assessment weighs the conduct and its seriousness, time since the conduct and completion of the sentence, and the duties of the job.',
        detail: dates.join(' '),
        action: 'Use the job description to identify the duties involved. If you choose to respond, examples of recent work, training, or references can explain what has changed.',
        sources: ['faq', 'regulation'],
      })
    }
    if (restrictedRecord) cards.push({
      id: 'record-limits', label: 'California · Type of record', title: 'Verify the outcome shown for this record',
      text: 'Covered employers generally cannot consider arrests that ended without a conviction or convictions that were legally sealed, dismissed, or expunged. Pending cases and certain health-facility positions have different rules.',
      action: 'Compare the reported outcome with your court disposition. If they differ, keep a copy showing the outcome and ask for a correction.',
      sources: ['faq'],
    })
    if (!cards.length) cards.push({
      id: 'stage-unknown', label: 'California · Hiring stage', title: 'Establish where the decision stands',
      text: 'A background check alone does not tell you if a conditional offer has been made or withdrawn. Different protections apply before an offer, during review of a conviction, and after a final decision.',
      action: 'Ask whether there was a conditional offer and whether a conviction led to a preliminary or final decision. Request any notices in writing.',
      sources: ['faq'],
    })
  }
  const reportCards = federalReportRules(a, finalDecision)
  if (coverage.status === 'ordinary' && !atRisk && a.caReportSource === 'outside' && a.caReportError === 'yes') cards.unshift(...reportCards)
  else cards.push(...reportCards)
  if (a.employerType === 'private' && ['15-49', '50+'].includes(a.employerSize)) cards.push({
    id: 'equal-treatment', label: 'Federal · Equal treatment', title: 'Employers must apply their standards fairly',
    text: 'Title VII bars covered employers from treating applicants with similar records differently because of race or national origin. Private employers generally meet its size threshold with at least 15 employees for 20 calendar weeks in the current or previous year.',
    action: 'If you noticed different treatment, keep the job posting, the stated reason, and any relevant correspondence. The EEOC can help you check coverage.',
    sources: ['eeoc', 'eeocSize'],
  })
  if (a.recordType === 'pending' || a.recordType === 'juvenile' || a.recordStatus?.some(s => ['pardoned', 'certificate'].includes(s))) {
    review.push('The specific case outcome or relief document matters. This guide has not determined how pending or juvenile matters, pardons, or certificates apply to your record. Ask CRD or a qualified legal-aid provider before deciding what to disclose.')
  }
  review.push('City and county rules may add protections. Local ordinances and California background-reporting statutes beyond the Fair Chance Act are outside this statewide review.')
  return { coverage, cards, review }
}
