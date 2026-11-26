// Reproduces N1 against the preserved v2.3.11 inline manifest schema.
// Usage: node scripts/repro_v2_3_11_manifest_schema.cjs PIPELINE_SPEC_v2.3.11.md
const fs=require('node:fs');
const Ajv2020=require('ajv/dist/2020').default;
const addFormats=require('ajv-formats');
const text=fs.readFileSync(process.argv[2],'utf8');
const rest=text.split('### 7.1 build_manifest.json schema')[1];
if(!rest) throw new Error('v2.3.11 manifest schema heading not found');
const match=rest.match(/^    \{[\s\S]*?^    \}/m);
if(!match) throw new Error('indented v2.3.11 JSON schema block not found');
const json=match[0].split(/\r?\n/).map(x=>x.startsWith('    ')?x.slice(4):x).join('\n');
const schema=JSON.parse(json);
const sha='a'.repeat(64), uuid='123e4567-e89b-42d3-a456-426614174000';
const files=Array.from({length:10},(_,i)=>({path:`source/${i}.tsv`,sha256:sha,origin:i<9?'upstream':'local_generated',rights_class:i<9?'game_source_data':'local_generated_metadata'}));
const base={schema_version:'1.0',spec_version:'2.3.11',record_class:'provisional',build_state:'candidate',build_id:`build-${'0'.repeat(19)}1-${uuid}`,build_sequence:1,created_at_utc:'2026-11-26T00:00:00Z',owner_uuid:uuid,source:{manifest_sha256:sha,record_class:'provisional',bootstrap_trust:'first_use',snapshot_commit:null,step0_status:'pending',files},execution:{scope:'partial',pipeline_revision:'v2.3.11',selected_ids:[1]}};
const complete={...base,record_class:'formal',build_state:'complete',source:{...base.source,record_class:'formal',bootstrap_trust:'anchored',snapshot_commit:'a'.repeat(40),step0_status:'formal'},execution:{scope:'full',pipeline_revision:'v2.3.11',selected_ids:[]},completed_at_utc:'2026-11-26T00:01:00Z',configuration_inputs:['field_registry','anomaly_rules','expected_anomalies'].map(x=>({path:`registry/${x}.json`,schema_version:'1.0',byte_length:1,sha256:sha})),artifacts:[{path:'parsed/cats.jsonl',byte_length:1,sha256:sha,kind:'parsed'}],statistics:{blocking_count:0,isolated_rows:0,unexpected_isolated_rows:0,files:[]},gate_results:[{gate_id:'all',status:'PASS',evidence_sha256:sha}],test_results:[{test_id:'all',status:'PASS',evidence_sha256:sha}]};
const ajv=new Ajv2020({strict:false,allErrors:true});
addFormats(ajv);
const validate=ajv.compile(schema);
for(const [fixture,data] of [['candidate',base],['complete',complete]]){
 const valid=validate(data);
 console.log(JSON.stringify({fixture,valid,errors:validate.errors?.slice(0,5)}));
}
