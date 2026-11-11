import { OptionalSelect, ReportQuestions } from './DetailedGuidance.jsx'
import { askAboutDecision, hasFinalDecision, isPrivateEmployer } from './guidance/minnesota.js'

export function MinnesotaWorkQuestion(props) {
  if (!isPrivateEmployer(props.answers.employerType) && props.answers.employerType !== 'government') return null
  return <OptionalSelect {...props} field="mnRequirement" label="Has the employer identified a law requiring this job’s criminal-history check?"
    options={[['law', 'Yes, it identified a legal requirement'], ['policy', 'It mentioned only company policy'], ['none', 'No requirement was mentioned'], ['unsure', 'Not sure']]} />
}

export function MinnesotaProcessQuestions({ answers, update }) {
  const props = { answers, update }
  const outcomes = [['none', 'No record-based decision that I know of']]
  if (answers.hiringStage !== 'decision') outcomes.push(['considering', 'The employer is considering rejecting me or withdrawing an offer because of my record'])
  outcomes.push(['final', 'The employer denied the job or withdrew the offer because of my record'], ['unsure', 'Not sure'])
  const knownEmployer = isPrivateEmployer(answers.employerType) || answers.employerType === 'government'
  return <>
    {answers.goal === 'asked' && knownEmployer && <OptionalSelect {...props} field="mnInquiry" label="What had happened when criminal history first came up?"
      options={[
        ['before-interview', 'I was asked before being selected for an interview'],
        ['selected', 'I was asked after being selected for an interview'],
        ['all-applicants', 'Everyone was asked in an initial screening interview'],
        ['before-offer', 'No interview was used and I was asked before a conditional offer'],
        ['after-offer', 'No interview was used and I was asked after a conditional offer'],
        ['notice', 'I saw a general policy notice without a question about my own record'],
        ['unsure', 'Not sure'],
      ]} />}
    {askAboutDecision(answers.hiringStage) && <OptionalSelect {...props} field="mnDecision" label="What has the employer said about a decision based on your record?" options={outcomes} />}
    <ReportQuestions {...props} sourceField="mnReportSource" errorField="mnReportError" />
    {knownEmployer && answers.mnReportSource === 'outside' && answers.reportReceived !== 'Yes' &&
      <OptionalSelect {...props} field="mnCopyRequest" label="Did you request a free copy on the employer’s report disclosure?" />}
    {answers.mnReportSource === 'outside' && hasFinalDecision(answers) &&
      <OptionalSelect {...props} field="mnReportBasis" label="Did the employer say information in the outside report contributed to its final decision?" />}
  </>
}
