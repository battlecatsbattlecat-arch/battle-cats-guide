// Validation-only harness. Requires Node.js and Ajv 8 with ajv-formats.
const fs = require('node:fs');
const path = require('node:path');
const Ajv2020 = require('ajv/dist/2020').default;
const addFormats = require('ajv-formats');
const root = path.resolve(__dirname, '..');
const ajv = new Ajv2020({allErrors:true, strict:true, allowUnionTypes:true});
addFormats(ajv);
const specs = [
  ['build_manifest', 'build_manifest.schema.json'],
  ['build_sequence', 'build_sequence.schema.json'],
  ['field_registry', 'field_registry.schema.json'],
  ['anomaly_rules', 'anomaly_rules.schema.json'],
  ['expected_anomalies', 'expected_anomalies.schema.json'],
  ['anomaly_disposition', 'anomaly_disposition.schema.json'],
  ['parsed_artifacts', 'parsed_artifacts.schema.json'],
  ['lifecycle_event', 'lifecycle_event.schema.json'],
  ['source_header_contract', 'source_header_contract.schema.json']
  ,['failure_record','failure_record.schema.json']
  ,['recovery_record','recovery_record.schema.json']
  ,['allocation_record','allocation_record.schema.json']
  ,['parsed_current','parsed_current.schema.json']
  ,['seal_inventory','seal_inventory.schema.json']
];
let count=0, failures=0;
for (const [name,file] of specs) {
  const schema=JSON.parse(fs.readFileSync(path.join(root,'schemas/v2.3.12',file),'utf8'));
  const validate=ajv.compile(schema);
  for (const kind of ['positive','negative']) {
    const dir=path.join(root,'fixtures/v2.3.12',name,kind);
    if (!fs.existsSync(dir)) continue;
    for (const fixture of fs.readdirSync(dir).filter(x=>x.endsWith('.json')).sort()) {
      count++;
      const doc=JSON.parse(fs.readFileSync(path.join(dir,fixture),'utf8'));
      const actual=validate(doc), expected=kind==='positive';
      const ok=actual===expected;
      if (!ok) failures++;
      console.log(`${ok?'PASS':'FAIL'} ${name}/${kind}/${fixture}: expected ${expected?'valid':'invalid'}, got ${actual?'valid':'invalid'}`);
      if (!ok && validate.errors) console.log(JSON.stringify(validate.errors));
    }
  }
}
console.log(`RESULT fixtures=${count} failures=${failures}`);
process.exitCode=failures?1:0;
