// Turns report/cucumber_report.json into an HTML report (charts per feature and per status).
import { existsSync } from 'node:fs'
import reporter from 'cucumber-html-reporter'

if (!existsSync('report/cucumber_report.json')) {
  console.error('Aucun rapport JSON à convertir : la suite Cucumber ne s’est pas exécutée.')
  process.exit(1)
}

reporter.generate({
  theme: 'bootstrap',
  jsonFile: 'report/cucumber_report.json',
  output: 'report/cucumber_report.html',
  reportSuiteAsScenarios: true,
  launchReport: false,
  metadata: {
    'Test Environment': process.env.API_URL ?? 'http://localhost:3000',
  },
})
