import { Typeform } from '@typeform/api-client';
import * as _ from 'lodash';

import { FormValidation } from '../definitions';

export const validateLogic = (submission: Typeform.Form, example: Typeform.Form): FormValidation => {
  const e2sRefs: Map<string, string> = new Map();
  const eLogicJumps: Typeform.Logic[] = example.logic;
  const sLogicJumps: Typeform.Logic[] = submission.logic;
  let s2eLogicJumps: Typeform.Logic[] = [];
  let s2eLogicJumpsString = JSON.stringify(sLogicJumps);

  const result: FormValidation = {
    valid: true,
    message: [`All the right logic for your fields seem to be in place.`]
  };

  const failed = () => {
    if (result.valid) {
      result.valid = false;
      result.message = [`When validating your form's logic, we noticed you failed this part of the test. Please fix the below issues, then we can regrade you:`];
    }
  }

  // Is there supposed to be no logic?
  if (!submission.logic && !example.logic) {
    return result;
  }

  // Is there any logic?
  if (!!submission.logic !== !!example.logic) {
    failed();
    result.message.push(`We ${!!example.logic ? 'did' : 'did not'} expected logic jumps in your form, there ${!!submission.logic ? 'was' : 'was no'} logic jumps in your form.`);
    return result;
  }

  // Is there enough logic?
  if (!!submission.logic && !!example.logic && submission.logic.length !== example.logic.length) {
    failed();
    result.message.push(`We expected ${example.logic.length} logic jumps, there were ${submission.logic.length}.`);
  }

  // Iterate over fields, create a map, and modify the the submissions logic to look like the examples (so we can test them)
  for (let i = 0; i < example.fields.length; i++) {
    const eField = example.fields[i];
    const sField = submission.fields[i];
    const eRef = eField.ref;
    const sRef = sField.ref;

    e2sRefs.set(eRef, sRef);
    s2eLogicJumpsString = s2eLogicJumpsString.replace(new RegExp(sRef, 'g'), eRef);

    // Modify choices as well
    if (['dropdown', 'multiple_choice', 'picture_choice'].includes(eField.type)) {
      for (let o = 0; o < eField.properties.choices.length; o++) {
        const eChoice = eField.properties.choices[o].ref;
        const sChoice = sField.properties.choices[o].ref;
        e2sRefs.set(eChoice, sChoice);
        s2eLogicJumpsString = s2eLogicJumpsString.replace(new RegExp(sRef, 'g'), eRef);
      }
    }
  }

  // Also iterate over thankyou_screens
  if (example.thankyou_screens) {
    for (let i = 0; i < example.thankyou_screens.length; i++) {
      const eTy = example.thankyou_screens[i];
      const sTy = submission.thankyou_screens[i];
      const eRef = eTy.ref;
      const sRef = sTy.ref;

      e2sRefs.set(eRef, sRef);
      s2eLogicJumpsString = s2eLogicJumpsString.replace(new RegExp(sRef, 'g'), eRef);
    }
  }

  s2eLogicJumps = JSON.parse(s2eLogicJumpsString);

  // Map the hidden fields, just in case
  if (example.hidden) {
    example.hidden.forEach((h) => e2sRefs.set(h, h));
  }

  // Does each field have enough actions? We check here because it's easier to map the logic based on refs after they're changed
  s2eLogicJumps.forEach((s2eLogic) => {
    const eLogic = eLogicJumps.find((elj) => elj.ref === s2eLogic.ref);
    if (eLogic.actions.length !== s2eLogic.actions.length) {
      failed();
      result.message.push(`We expected the "${s2eLogic.type}" with a ref of "${e2sRefs.get(s2eLogic.ref)}" to have ${eLogic.actions.length} action(s), however it had ${s2eLogic.actions.length}`);
    }
  });

  // Validate the logic jumps
  eLogicJumps.forEach((eLogicJump) => {
    const sLogicJump = s2eLogicJumps.find((slj) => slj.ref === eLogicJump.ref);
    if (!sLogicJump) {
      failed();
      result.message.push(`We expected to find logic jumps for a ${eLogicJump.type} with the ref of ${eLogicJump.ref}, we couldn't find any.`);
    } else {
      // If we found the logic jumps for the field let's check the jumps
      eLogicJump.actions.forEach((eAction) => {
        const sAction = sLogicJump.actions.find((sa) => _.isEqual(eAction, sa));
        if (!sAction) {
          failed();
          result.message.push(`We expected the "${eLogicJump.type}" with a ref of "${e2sRefs.get(eLogicJump.ref)}" to have a(n) "${eAction.action}" behavior based on "${eAction.condition.op}" condition.`);
        }
      });
    }
  });

  return result;
}