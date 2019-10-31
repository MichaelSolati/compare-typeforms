import { Typeform, createClient } from '@typeform/api-client';

import { FormValidation } from '../definitions';
import { to } from '../to';

export const validateForms = async (submission: string, example: string): Promise<FormValidation> => {
  const tfClient = createClient();
  let submissionError: Error, submissionForm: Typeform.Form, answersError: Error, answersForm: Typeform.Form;

  if (submission.length !== 6) {
    return {
      valid: false,
      message: ['Submission is not a valid Typeform.']
    };
  } else if (example.length !== 6) {
    return {
      valid: false,
      message: ['Example is not a valid Typeform.']
    };
  }

  if (submission === example) {
    return {
      valid: false,
      message: ['You can not compare a form to itself.']
    };
  }

  [submissionError, submissionForm] = await to(tfClient.forms.get({ uid: submission }));
  [answersError, answersForm] = await to(tfClient.forms.get({ uid: example }));
  if (submissionError) {
    return {
      valid: false,
      message: ['Submission is not a valid Typeform form, is it set to private?']
    };
  } else if (answersError) {
    return {
      valid: false,
      message: ['Answer is not a valid Typeform form, is it set to private?']
    };
  }

  return {
    valid: true,
    message: [],
    data: {
      submissionForm,
      answersForm,
      submission,
      answers: example
    }
  }
}