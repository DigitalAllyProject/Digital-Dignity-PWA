/*
 * Simple test script for Data Broker Opt‑Out Helper.
 *
 * Run with: node test.js
 *
 * This script tests the broker parsing logic on a small sample of README
 * content to ensure sections are correctly extracted.
 */
const assert = require('assert');

// Sample markdown to test parsing
const sampleReadme = `\n    ###  ExampleBroker\n    You can opt out by visiting the site and filling out the form. Contact <privacy@example.com> if you have issues.\n\n    ###  SecondBroker\n    Call 123-456-7890 or email <support@second.com> to request removal.\n`;

function sanitizeInstructions(md) {
  let text = md.replace(/\[(.*?)\]\((.*?)\)/g, '$1 ($2)');
  text = text.replace(/[*_`]/g, '');
  text = text.replace(/<([^>]+)>/g, '$1');
  return text.trim();
}

function parseBrokers(section) {
  const brokerList = [];
  const headingRegex = /^\s*###\s+(.+)$/gm;
  let match;
  const indices = [];
  while ((match = headingRegex.exec(section)) !== null) {
    indices.push({ index: match.index, name: match[1].trim() });
  }
  for (let i = 0; i < indices.length; i++) {
    const headerMatch = section.slice(indices[i].index).match(/^\s*###\s+.+\n/);
    const offset = headerMatch ? headerMatch[0].length : 0;
    const start = indices[i].index + offset;
    const end = (i + 1 < indices.length) ? indices[i + 1].index : section.length;
    const name = indices[i].name;
    const instructions = section.slice(start, end).trim();
    const emailMatches = [];
    const emailRegex = /<([^>]+@[^>]+)>/g;
    let em;
    while ((em = emailRegex.exec(instructions)) !== null) {
      emailMatches.push(em[1]);
    }
    const phoneMatches = [];
    const phoneRegex = /\b\d{3}-\d{3}-\d{4}\b/g;
    let ph;
    while ((ph = phoneRegex.exec(instructions)) !== null) {
      phoneMatches.push(ph[0]);
    }
    brokerList.push({ name, instructions: sanitizeInstructions(instructions), emails: emailMatches, phones: phoneMatches });
  }
  return brokerList;
}

const result = parseBrokers(sampleReadme);

assert.strictEqual(result.length, 2, 'Should parse two brokers');
assert.strictEqual(result[0].name, 'ExampleBroker', 'First broker name should be ExampleBroker');
assert.strictEqual(result[0].emails[0], 'privacy@example.com', 'Extract email from ExampleBroker');
assert.strictEqual(result[1].phones[0], '123-456-7890', 'Extract phone from SecondBroker');

console.log('All tests passed');