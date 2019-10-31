import { Typeform, createClient } from '@typeform/api-client';

import { FormValidation } from '../definitions';
import { to } from '../to';

export const validateTheme = async (submissionThemeUrl: string, exampleThemeUrl: string): Promise<FormValidation> => {
  const tfClient = createClient();
  const submissionId = submissionThemeUrl.substring(submissionThemeUrl.length - 6);
  const exampleId = exampleThemeUrl.substring(exampleThemeUrl.length - 6);
  let submissionError: Error, submissionTheme: Typeform.Theme, exampleError: Error, exampleTheme: Typeform.Theme;
  const result: FormValidation = {
    valid: true,
    message: [`Your form's theme looks as expected, way to go!`]
  };

  [submissionError, submissionTheme] = await to(tfClient.themes.get({ id: submissionId }));
  [exampleError, exampleTheme] = await to(tfClient.themes.get({ id: exampleId }));
  if (submissionError) {
    return {
      valid: false,
      message: ['Submission does not have a valid Typeform theme, is it set to private?']
    };
  } else if (exampleError) {
    return {
      valid: false,
      message: ['Example is not a valid Typeform theme.']
    };
  }

  const failed = () => {
    if (result.valid) {
      result.valid = false;
      result.message = [`When validating your form's theme, we noticed you failed this part of the test. Please fix the below issues, then we can regrade you:`];
    }
  }

  // Check font
  if (submissionTheme.font !== exampleTheme.font) {
    failed();
    result.message.push(`Your font of "${submissionTheme.font}" did not matched the expected font of "${exampleTheme.font}".`);
  }

  // Check if has transparent button
  if (submissionTheme.has_transparent_button !== exampleTheme.has_transparent_button) {
    failed();
    result.message.push(`Your buttons ${submissionTheme.has_transparent_button ? 'are' : 'aren\'t'} transparent, we expected them to ${exampleTheme.has_transparent_button ? 'be' : 'not be'} transparent.`);
  }

  // Check example color
  if (submissionTheme.colors.answer !== exampleTheme.colors.answer) {
    failed();
    result.message.push(`Your answer's color was "${submissionTheme.colors.answer}", we expected it to be "${exampleTheme.colors.answer}".`);
  }

  // Check background
  if (!(submissionTheme.background && exampleTheme.background) && (submissionTheme.background || exampleTheme.background)) {
    failed();
    result.message.push(`Your form ${submissionTheme.background ? 'did' : 'did not'} have a background image, we expected there to ${exampleTheme.background ? 'be' : 'not be'} a background image.`);
  } else if (submissionTheme.colors.background !== exampleTheme.colors.background) {
    failed();
    result.message.push(`Your background's color was "${submissionTheme.colors.background}", we expected it to be "${exampleTheme.colors.background}".`);
  }

  // Check button color
  if (submissionTheme.colors.button !== exampleTheme.colors.button) {
    failed();
    result.message.push(`Your button's color was "${submissionTheme.colors.button}", we expected it to be "${exampleTheme.colors.button}".`);
  }

  // Check question color
  if (submissionTheme.colors.question !== exampleTheme.colors.question) {
    failed();
    result.message.push(`Your question's color was "${submissionTheme.colors.question}", we expected it to be "${exampleTheme.colors.question}".`);
  }

  return result
}