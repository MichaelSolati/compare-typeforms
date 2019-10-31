export interface FormValidation {
  valid: boolean;
  message: string[];
  data?: any;
}

export interface TestResult {
  example: string;
  submission: string;
  pass: boolean;
  feedback: string;
  tests: {
    valid_forms?: FormValidation;
    valid_theme?: FormValidation;
    valid_fields?: FormValidation;
    valid_logic?: FormValidation;
  }
}