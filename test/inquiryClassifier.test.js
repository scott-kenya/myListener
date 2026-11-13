import test from 'node:test';
import assert from 'node:assert/strict';
import { checkMessageForKeywords } from '../src/utils/inquiryClassifier.js';

const accepted = [
  'Looking for a 2-bedroom apartment in Westlands',
  'Anyone with an Airbnb in Nyali for this weekend?',
  'Natafuta nyumba Kileleshwa',
  'Nahitaji chumba Bamburi',
  'I need accommodation in Nyali for three nights'
];
const rejected = [
  'Beautiful furnished apartment available in Westlands',
  'Luxury Airbnb, swimming pool, Wi-Fi, call for bookings',
  'Our apartments are now available in Nyali',
  'Looking for property agents in Westlands',
  'Available in Bamburi. Contact us for rates',
  'Anyone know a good restaurant in Nyali?'
];

for (const message of accepted) {
  test(`accepts genuine inquiry: ${message}`, () => {
    const result = checkMessageForKeywords(message);
    assert.equal(result?.isQualifiedInquiry, true);
  });
}
for (const message of rejected) {
  test(`rejects non-inquiry / advert: ${message}`, () => {
    assert.equal(checkMessageForKeywords(message), null);
  });
}
test('rejects messages without a supported area', () => {
  assert.equal(checkMessageForKeywords('Looking for a 2-bedroom Airbnb in Kilimani'), null);
});
