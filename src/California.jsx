import { askAboutOffer } from './guidance/california.js'
import { OptionalSelect, ReportQuestions } from './DetailedGuidance.jsx'

const unsure = ['unsure', 'Not sure']

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
    <ReportQuestions {...props} sourceField="caReportSource" errorField="caReportError" />
  </>
}
