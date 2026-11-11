import { OptionalSelect, ReportQuestions } from './DetailedGuidance.jsx'
import { hasOfferStage } from './guidance/newYork.js'

export function NewYorkLocation(props) {
  return <OptionalSelect {...props} field="nyArea" label="Where in New York will you work?"
    options={[['nyc', 'New York City (Bronx, Brooklyn, Manhattan, Queens or Staten Island)'], ['elsewhere', 'Elsewhere in New York State'], ['unsure', 'Not sure or work location varies']]} />
}

export function NewYorkProcessQuestions({ answers, update }) {
  const props = { answers, update }
  const city = answers.nyArea === 'nyc'
  const offers = [['none', 'No record-based decision about an offer']]
  if (answers.hiringStage !== 'decision') offers.push(['considering', 'The employer may withdraw my conditional offer because of my record'])
  offers.push(['final', 'The employer withdrew my conditional offer because of my record'], ['unsure', 'Not sure'])
  return <>
    {answers.goal === 'asked' && <OptionalSelect {...props} field="nyAskedBefore" label="Did the employer ask about your criminal history before a conditional offer?" />}
    {hasOfferStage(answers.hiringStage) && <OptionalSelect {...props} field="nyOfferDecision" label="What has the employer said about a conditional offer?" options={offers} />}
    {city && hasOfferStage(answers.hiringStage) && answers.hiringStage !== 'decision' && answers.nyOfferDecision === 'considering' &&
      <OptionalSelect {...props} field="nyMaterials" label="Which Fair Chance materials have you received?"
        options={[['both', 'Both the criminal-history inquiry and the written analysis'], ['one', 'Only one of the two'], ['neither', 'Neither'], ['unsure', 'Not sure']]} />}
    <ReportQuestions {...props} sourceField="nyReportSource" errorField="nyReportError" />
  </>
}
