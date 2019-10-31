import * as express from 'express';
import { Typeform } from '@typeform/api-client';
import { AddressInfo } from 'net';

import { validateForms } from './tests/validate-forms';
import { validateTheme } from './tests/validate-theme';
import { validateFields } from './tests/validate-fields';
import { validateLogic } from './tests/validate-logic';

const generateGrade = (data: any, res: express.Response) => {
  const tests = Object.getOwnPropertyNames(data.tests);
  data['pass'] = tests.reduce((pass: boolean, e: string) => (pass && data.tests[e].valid), true);
  data['feedback'] = tests.reduce((message: string, e: string) => {
    return ((message.length > 0) ? (message + '\n\n') : '') + data.tests[e].message.join('\n');
  }, '');
  return res.send(data)
};

const app = express();

app.get('/:example/:submission', async (req, res) => {
  const { example, submission } = req.params;
  const result: any = { example, submission, tests: {} };
  let submissionForm: Typeform.Form, answersForm: Typeform.Form;

  // Test one, are the forms real? Do they exist?
  const validatedForms = await validateForms(result.submission, result.example);
  if (validatedForms.valid) {
    answersForm = validatedForms.data.answersForm;
    submissionForm = validatedForms.data.submissionForm;
    result['submission'] = validatedForms.data.submission;
    delete validatedForms.data;
  }
  result.tests.valid_forms = validatedForms;

  // Our tests can not continue if we fail here
  if (!validatedForms.valid) {
    return generateGrade(result, res);
  }

  // Test two, validate the theme
  const submissionThemeUrl = (typeof submissionForm.theme === 'string') ? submissionForm.theme : submissionForm.theme.href;
  const answerThemeUrl = (typeof answersForm.theme === 'string') ? answersForm.theme : answersForm.theme.href;
  const validatedTheme = await validateTheme(submissionThemeUrl, answerThemeUrl);
  result.tests.valid_theme = validatedTheme;

  // Test three, validate the fields, are there the right amount? Do they match up?
  const validatedFields = validateFields(submissionForm, answersForm);
  result.tests.valid_fields = validatedFields;

  // Our tests can not continue if we fail here
  if (!validatedFields.valid) {
    return generateGrade(result, res);
  }

  // Test four, validate the logic
  const validatedLogic = validateLogic(submissionForm, answersForm);
  result.tests.valid_logic = validatedLogic;

  return generateGrade(result, res);
});

// listen for requests :)
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + (listener.address() as AddressInfo).port);
});