// L6 — THE FOUR GATES. The keystone is an AND of these; each is asserted on
// its own so a regression localizes to the failing gate, per patient.
//
//   is_high_confidence_prediction   (calibrated AND not spurious)
//   is_falsifiability_backed
//   is_ancestry_transport_safe
//   predicted_value > 0
//
// RED today: served by /api/predictions/:id (501). Loop 1 turns these green.

import { test, before, after, describe } from 'node:test';
import { PATIENTS, GATES, KEYSTONE } from '../oracle/dag-oracle.js';
import { CONTRACT } from './contract.js';
import { startServer, stopServer, assertAppSurfaces, getJson } from './server-fixture.js';

const GATE_FIELDS = [
  'is_high_confidence_prediction',
  'is_falsifiability_backed',
  'is_ancestry_transport_safe',
];

describe('L6 · GATES · each of the four keystone gates, per patient', () => {
  before(startServer);
  after(stopServer);

  for (const p of PATIENTS) {
    const g = GATES[p.prediction];
    for (const field of GATE_FIELDS) {
      test(`${p.key} · ${p.name} · ${field} = ${g[field]}`, async () => {
        await assertAppSurfaces(
          CONTRACT.gates.endpoint(p),
          field,
          g[field],
          KEYSTONE[p.prediction].witness,
        );
      });
    }

    // The 4th gate is "predicted_value > 0" — assert the served scalar's sign.
    test(`${p.key} · ${p.name} · predicted_value ${g.predicted_value_positive ? '> 0' : '= 0'}`, async () => {
      const { status, body } = await getJson(CONTRACT.gates.endpoint(p));
      if (status !== 200) {
        throw new Error(
          `App does not yet surface predicted_value (HTTP ${status}). Wire /api/predictions/:id to read vw_individual_predictions.`,
        );
      }
      const positive = Number(body.predicted_value) > 0;
      if (positive !== g.predicted_value_positive) {
        throw new Error(
          `Expected predicted_value ${g.predicted_value_positive ? '>0' : '=0'} but app served ${body.predicted_value}. Witness: ${KEYSTONE[p.prediction].witness}`,
        );
      }
    });
  }

  // Cross-check: the keystone equals the AND of the four gates the app serves.
  for (const p of PATIENTS) {
    test(`${p.key} · ${p.name} · keystone == AND(4 gates) as served by the app`, async () => {
      const { status, body } = await getJson(CONTRACT.keystone.endpoint(p));
      if (status !== 200) {
        throw new Error(`App does not yet surface the prediction panel (HTTP ${status}).`);
      }
      const andOfGates =
        body.is_high_confidence_prediction === true &&
        body.is_falsifiability_backed === true &&
        body.is_ancestry_transport_safe === true &&
        Number(body.predicted_value) > 0;
      if (andOfGates !== body.is_clinically_actionable) {
        throw new Error(
          `Keystone (${body.is_clinically_actionable}) must equal AND of the 4 served gates (${andOfGates}).`,
        );
      }
    });
  }
});
