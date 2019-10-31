import { Typeform } from '@typeform/api-client';

import { FormValidation } from '../definitions';

export const validateFields = (submission: Typeform.Form, example: Typeform.Form): FormValidation => {
  const result: FormValidation = {
    valid: true,
    message: [`All the right types of questions and choices seem to be in place.`]
  };

  const failed = () => {
    if (result.valid) {
      result.valid = false;
      result.message = ['When validating your questions, we noticed you failed this part of the test. Please fix the below issues, then we can regrade you:'];
    }
  }

  // Are there welcome screens?
  if (!!submission.welcome_screens !== !!example.welcome_screens) {
    failed();
    result.message.push(`We ${!!example.welcome_screens ? 'did' : 'did not'} expect a welcome screen, there ${!!submission.welcome_screens ? 'was' : 'was not'} a welcome screen.`);
  }

  // Are there enough welcome screens?
  if (!!submission.welcome_screens && !!example.welcome_screens && submission.welcome_screens.length !== example.welcome_screens.length) {
    failed();
    result.message.push(`We expected ${example.welcome_screens.length} welcome screen(s), there were ${submission.welcome_screens.length}.`);
  }

  // Are there enough form fields?
  if (submission.fields.length !== example.fields.length) {
    failed();
    result.message.push(`We expected ${example.fields.length} form field(s), there were ${submission.fields.length}.`);
  }

  // Are there thank you screens?
  if (!!submission.thankyou_screens !== !!example.thankyou_screens) {
    failed();
    result.message.push(`We ${!!example.thankyou_screens ? 'did' : 'did not'} expected thank you screen, there ${!!submission.thankyou_screens ? 'was' : 'was not'} a thank you screen.`);
  }

  // Are there enough thank you screens?
  if (!!submission.thankyou_screens && !!example.thankyou_screens && submission.thankyou_screens.length !== example.thankyou_screens.length) {
    failed();
    result.message.push(`We expected ${example.thankyou_screens.length} thank you screen(s), there were ${submission.thankyou_screens.length}.`);
  }

  // We can't test the fields until there are enough
  if (submission.fields.length !== example.fields.length) {
    result.message.push(`We can\'t test your form fields or the answer options you provide until you fix the above issues.`);
    return result;
  }

  // Compare the fields
  for (let i = 0; i < submission.fields.length; i++) {
    const efield = example.fields[i];
    const sfield = submission.fields[i];

    if (sfield.type !== efield.type) {
      failed();
      result.message.push(`We expected question number ${i + 1} to be a "${efield.type}", but it was a "${sfield.type}", please check your question with a ref of "${sfield.ref}".`);
    }

    // Compare the choices of the questions, if there are any choices
    if (['dropdown', 'multiple_choice', 'picture_choice'].includes(sfield.type)) {
      if (sfield.properties.choices.length !== efield.properties.choices.length) {
        failed();
        result.message.push(`We expected question number ${i + 1} to be have ${efield.properties.choices.length} choices, but there were ${sfield.properties.choices.length}, please check the choices of the question with a ref of "${sfield.ref}".`)
      }
    }
  }

  // Are there hidden fields?
  if (!!submission.hidden !== !!example.hidden) {
    failed();
    result.message.push(`We ${!!example.hidden ? 'did' : 'did not'} expected hidden fields, there ${!!submission.hidden ? 'were' : 'were not'} hidden fields.`);
  }

  // Are there enough hidden fields?
  if (!!submission.hidden && !!example.hidden && submission.hidden.length !== example.hidden.length) {
    failed();
    result.message.push(`We expected ${example.hidden.length} hidden fields, there were ${submission.hidden.length}.`);
  }

  // Check if hidden field exists.
  if (!!submission.hidden && !!example.hidden) {
    example.hidden.forEach((eHidden) => {
      if (!submission.hidden.includes(eHidden)) {
        failed();
        result.message.push(`We expected a hidden field with the name "${eHidden}", but it did not exist.`);
      }
    });
  }

  return result
}