// Deterministically writes synthetic schema fixtures only; never reads source data.
const fs=require('node:fs'), path=require('node:path');
const root=path.resolve(__dirname,'..');
const sha='a'.repeat(64), uuid='123e4567-e89b-42d3-a456-426614174001';
function put(group,kind,name,value){const d=path.join(root,'fixtures/v2.3.12',group,kind);fs.mkdirSync(d,{recursive:true});fs.writeFileSync(path.join(d,name+'.json'),JSON.stringify(value)+'\n','utf8');}
function negs(group,base){put(group,'negative','missing_required',Object.fromEntries(Object.entries(base).slice(1)));put(group,'negative','wrong_type',{...base,schema_version:7});put(group,'negative','unknown_property',{...base,unknown_fixture_property:true});}
const rules={schema_version:'1.0',source_manifest_sha256:sha,rules:[{rule_id:'bad_row',severity:'blocking',blocking:true,description:'synthetic fixture',row_class:'rejected',value_type:'unknown'}]};
const registry={schema_version:'1.0',registry_id:'synthetic',source_manifest_sha256:sha,fields:Array.from({length:50},(_,i)=>({field_name:'f'+i,source_file:'cat.tsv',source_column_index:i,source_label:'F'+i,scope:'unknown',value_type:'unknown',nullable:true,parse_rule:'opaque',type_range:{kind:'unbounded'},snapshot_observed_range:{kind:'unbounded'},semantic_status:'unverified',evidence_refs:[]}))};
const expected={schema_version:'1.0',source_manifest_sha256:sha,anomaly_rules_sha256:sha,anomalies:[{rule_id:'bad_row',source_id:'cat',physical_line:2,byte_offset:4,raw_line_sha256:sha,observed_column_count:3,expected_column_count:4}]};
const disposition={schema_version:'1.0',disposition_uuid:uuid,build_id:'build-fixture',anomaly_key:{source_id:'cat',physical_line:2,byte_offset:4,rule_id:'bad_row',raw_line_sha256:sha,anomaly_key_sha256:sha},disposition:'acknowledged',comment:'synthetic',actor_uuid:uuid,created_at_utc:'2026-11-26T00:00:00Z',severity:'blocking',blocking:true,exit_code:14};
const row={schema_version:'1.0',build_id:'build-fixture',build_sequence:1,source:{source_id:'cat',path:'source/cat.tsv',byte_length:4,sha256:sha},physical_line:1,byte_offset:0,line_eol:'LF',row_class:'header_row',primary_reason:null,raw_line_base64:'YQ==',payload_byte_length:1,eol_byte_length:1,raw_fields:['a'],fields:[{index:0,name:'a',raw:'a',parsed:'a',presence:'present',parse_status:'parsed',parse_rule:'identity'}]};
const event={schema_version:'1.0',event_type:'sealed',event_uuid:uuid,event_sequence:1,created_at_utc:'2026-11-26T00:00:00Z',actor_uuid:uuid,build_id:'build-fixture',build_sequence:1,manifest_sha256:sha,inventory_sha256:sha,error_id:null};
const header={schema_version:'1.0',source_id:'cat',path:'source/cat.tsv',header_policy:'required',evidence_sha256:sha,expected_columns:['a']};
const sequence={schema_version:'1.0',next_sequence:2,updated_at_utc:'2026-11-26T00:00:00Z',last_allocation_sha256:sha};
const failure={schema_version:'1.0',build_id:'build-fixture',build_sequence:1,allocation_uuid:uuid,failed_at_utc:'2026-11-26T00:00:00Z',stage:'parse',error_id:'PARSE_FAILED',diagnostics:[],staging_path:'builds/.staging/build-fixture',diagnostic_path:'diagnostics/failed/build-fixture',original_os_error:null};
const recovery={schema_version:'1.0',recovery_uuid:uuid,recovery_type:'parsed_current',created_at_utc:'2026-11-26T00:00:00Z',operator_id:'synthetic',evidence:['synthetic evidence'],decision:'restore prior pointer',damaged_bytes_sha256:sha,preserved_bytes_path:'state/recoveries/x/corrupt.bin',missing_marker:null};
const allocation={schema_version:'1.0',event_type:'allocated',build_sequence:1,build_id:'build-00000000000000000001-123e4567-e89b-42d3-a456-426614174001',allocation_uuid:uuid,owner_uuid:uuid,created_at_utc:'2026-11-26T00:00:00Z',spec_version:'2.3.12'};
const pointer={schema_version:'1.0',generation:1,publication_state:'published',active_build_id:allocation.build_id,parsed_path:`builds/${allocation.build_id}/parsed/`,build_manifest_sha256:sha,published_at_utc:'2026-11-26T00:00:00Z',publisher_uuid:uuid};
const inventory={schema_version:'1.0',build_id:allocation.build_id,entries:[{path:'parsed/cat.jsonl',object_kind:'file',byte_length:1,sha256:sha,file_id:'synthetic-1',hardlink_count:1,streams:['::$DATA'],reparse_point:false}]};
for(const [g,o] of Object.entries({anomaly_rules:rules,field_registry:registry,expected_anomalies:expected,anomaly_disposition:disposition,parsed_artifacts:row,lifecycle_event:event,source_header_contract:header,build_sequence:sequence,failure_record:failure,recovery_record:recovery,allocation_record:allocation,parsed_current:pointer,seal_inventory:inventory})){
 put(g,'positive','valid',o);negs(g,o);
 const bad={...o}; if(g==='anomaly_rules') bad.rules=[{...o.rules[0],severity:'super'}];
 if(g==='field_registry') bad.fields=o.fields.slice(0,49);
 if(g==='expected_anomalies') bad.anomalies=[{...o.anomalies[0],physical_line:0}];
 if(g==='anomaly_disposition') bad.disposition='erase_blocking';
 if(g==='parsed_artifacts') bad.raw_line_base64='%%%';
 if(g==='lifecycle_event') bad.event_uuid='not-a-uuid';
 if(g==='source_header_contract') bad.header_policy='sometimes';
 if(g==='build_sequence') bad.next_sequence=0;
 if(g==='failure_record') bad.stage='unknown-stage';
 if(g==='recovery_record') bad.recovery_type='unknown-recovery';
 if(g==='allocation_record') bad.event_type='building';
 if(g==='parsed_current') bad.publication_state='candidate';
 if(g==='seal_inventory') bad.entries[0].reparse_point=true;
 put(g,'negative','invalid_constraint',bad);
}
const manifest=JSON.parse(fs.readFileSync(path.join(root,'fixtures/v2.3.12/build_manifest/positive/candidate.json'),'utf8'));
const candidateWithUnknown=structuredClone(manifest);candidateWithUnknown.unknown_fixture_property=true;put('build_manifest','negative','unknown_property',candidateWithUnknown);
for(const [name,mutate] of [
 ['missing_required',x=>{delete x.owner_uuid}],
 ['wrong_type',x=>{x.build_sequence='1'}],
 ['wrong_enum',x=>{x.record_class='draft'}],
 ['invalid_uuid',x=>{x.owner_uuid='123e4567-e89b-12d3-a456-426614174001'}]
]){const x=structuredClone(manifest);mutate(x);put('build_manifest','negative',name,x);}
const complete=JSON.parse(fs.readFileSync(path.join(root,'fixtures/v2.3.12/build_manifest/positive/complete.json'),'utf8'));
complete.unknown_fixture_property=true;put('build_manifest','negative','complete_unknown_property',complete);
