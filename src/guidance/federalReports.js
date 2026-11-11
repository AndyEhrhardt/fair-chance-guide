export const reportSources = {
  ftc: { name: 'Federal Trade Commission · Employer background checks', url: 'https://consumer.ftc.gov/articles/employer-background-checks-and-your-rights' },
  fcra: { name: 'Fair Credit Reporting Act · 15 U.S.C. § 1681b(b)', url: 'https://uscode.house.gov/us/usc/t15/s1681b/' },
  dispute: { name: 'Fair Credit Reporting Act · 15 U.S.C. § 1681i(a)', url: 'https://uscode.house.gov/us/usc/t15/s1681i/' },
  finalReport: { name: 'Fair Credit Reporting Act · 15 U.S.C. § 1681m(a)', url: 'https://uscode.house.gov/us/usc/t15/s1681m/' },
}

export function federalReportRules(a, { source, error, finalDecision }) {
  const outside = source === 'outside'
  if (!outside) {
    const checking = a.hiringStage === 'background' || a.goal === 'check' || a.reportReceived === 'No'
    if (!checking || source === 'none') return []
    const internal = source === 'internal'
    return [{
      id: 'report-source', label: 'Federal · Check the source',
      title: internal ? 'An employer’s own search follows a different path' : 'Find out who supplied the information',
      text: 'The federal reporting-company process described by the FTC applies when an employer uses an outside background-reporting company. An employer can also look up records itself.',
      action: internal ? 'Ask which record was used and how to send a correction to the employer.' : 'Ask who produced the report and how to get a copy. Return to this guide if you learn it came from an outside company.',
      sources: ['ftc'],
    }]
  }
  const rules = []
  if (error === 'yes') rules.push({
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
