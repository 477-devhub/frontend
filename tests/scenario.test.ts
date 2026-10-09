import test from 'node:test'
import assert from 'node:assert/strict'
import { LocalProvider } from '../src/console/localProvider'
import scenario from '../src/fixtures/demo-scenario.json'
import type { DemoScenario } from '../src/scenario/types'
test('one grouped event, only CAM2 highlighted, other regions unassigned',async()=>{
 const p=new LocalProvider(structuredClone(scenario) as DemoScenario)
 await p.loadScene(3);const s=await p.getSnapshot()
 assert.equal(s.active_count,1);assert.equal(s.incidents[0].primary_cam,'CAM_02')
 assert.deepEqual(s.incidents[0].related_cams,['CAM_01','CAM_03'])
 assert.equal(s.cameras.find(c=>c.id==='CAM_02')?.status,'incident')
 for(const id of ['CAM_01','CAM_03'])assert.notEqual(s.cameras.find(c=>c.id===id)?.status,'incident')
 assert.ok(scenario.cameras.slice(3).every(c=>c.role==='unassigned'))
 await p.ack('SCENE-A',{action:'verify'},'verify')
 assert.equal((await p.getSnapshot()).active_count,0)
})
test('CAM6 numeric risk candidate can be disabled with no extra event',async()=>{
 for(const enabled of [true,false]){
  const config=structuredClone(scenario) as DemoScenario;config.incidents[1].enabled=enabled
  const p=new LocalProvider(config);await p.loadScene(5);const s=await p.getSnapshot()
  assert.equal(s.active_count,enabled?2:1)
  const c=s.cameras.find(c=>c.id==='CAM_06')
  assert.equal(c?.status==='incident',enabled)
  if(enabled){const i=s.incidents.find(i=>i.primary_cam==='CAM_06');assert.equal(i?.risk,71);assert.equal(i?.needs_human_review,false)}
 }
})
