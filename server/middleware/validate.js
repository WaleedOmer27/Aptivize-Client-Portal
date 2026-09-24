/**
 * middleware/validate.js
 *
 * A thin wrapper around express-validator's validationResult().
 * Import `validate` and pass it an array of express-validator chains.
 *
 * Usage:
 *   import { body, param } from 'express-validator';
 *   import validate from '../middleware/validate.js';
 *
 *   router.post(
 *     '/foo',
 *     validate([
 *       body('name').trim().notEmpty().withMessage('Name is required.'),
 *       body('email').isEmail().normalizeEmail().withMessage('Valid email required.'),
 *     ]),
 *     myController,
 *   );
 *
 * On failure returns:
 *   HTTP 422 { success: false, errors: [{ field, message }] }
 */

import { validationResult } from 'express-validator';

/**
 * @param {import('express-validator').ValidationChain[]} rules
 * @returns {import('express').RequestHandler[]}
 */
const validate = (rules) => [
  // 1. Run every validation chain in parallel
  ...rules,

  // 2. Check the result — if any failed, bail out with 422
  (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) return next();

    const formatted = errors.array().map((e) => ({
      field:   e.path ?? e.param ?? 'unknown',
      message: e.msg,
    }));

    return res.status(422).json({
      success: false,
      message: 'Validation failed.',
      errors:  formatted,
    });
  },
];

export default validate;
