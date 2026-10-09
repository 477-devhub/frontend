import test from 'node:test'
import assert from 'node:assert/strict'
import { cameraHighlight } from '../src/console/highlightPolicy'
import examples from '../src/fixtures/backend-api-v1.2.json'
test('candidate border is strictly above 65 and camera-independent',()=>{
 const base={...examples.incident_demo,primary_cam:'CAM_06',level:'HIGH',needs_human_review:false}
 for(const risk of [0,64,65])assert.equal(cameraHighlight('CAM_06',{...base,risk} as any),undefined)
 assert.equal(cameraHighlight('CAM_06',{...base,risk:66} as any),'amber')
 assert.equal(cameraHighlight('CAM_05',{...base,primary_cam:'CAM_05',risk:70} as any),'amber')
})
test('only open representative highlighted; review is independent of risk',()=>{
 const base={...examples.incident_demo,primary_cam:'CAM_02',related_cams:['CAM_01','CAM_03'],level:'CRITICAL',risk:89}
 assert.equal(cameraHighlight('CAM_02',base as any),'signal')
 assert.equal(cameraHighlight('CAM_01',base as any),undefined)
 assert.equal(cameraHighlight('CAM_03',base as any),undefined)
 assert.equal(cameraHighlight('CAM_02',{...base,status:'acked'} as any),undefined)
 assert.equal(cameraHighlight('CAM_02',{...base,risk:null,level:'UNKNOWN',needs_human_review:true} as any),'indigo')
 assert.equal(cameraHighlight('CAM_02',{...base,risk:70,level:'HIGH',needs_human_review:true} as any),'amber')
})
