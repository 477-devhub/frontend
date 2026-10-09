import test from 'node:test'
import assert from 'node:assert/strict'
import { acceptSnapshot, candidateTone, isClosed, needsReview, type Candidate, type RuntimeSnapshot } from '../src/runtime/model'

const candidate = (changes: Partial<Candidate> = {}): Candidate => ({ candidate_id:'one', camera_id:'CAM_04', reason_codes:['MOTION_CHANGE'], status:'DETECTED', human_disposition:null, first_seen_pts:3, last_pts:3, merge_count:0, job_status:'queued_p1', t1:100, t2:100.01, t3:null, t4:null, t5:null, ai_source:'live', error:null, assessment:null, stage1:null, ...changes })
const snapshot = (revision: number, frame: string, instance = 'first'): RuntimeSnapshot => ({ instance, revision, phase:'PLAYING', mode:'LIVE_REPLAY_MODE', ai_enabled:true, cameras:[], frames:{CAM_04:frame}, candidates:[], queue:{p1:0,p4:0} })
test('preliminary and normal estimates remain visible without high-risk promotion', () => {
  for (const status of ['DETECTED','SCREENING','ANALYZING','AI_NORMAL_ESTIMATE'] as const) {
    const c = candidate({status}); assert.equal(isClosed(c),false); assert.equal(needsReview(c),false); assert.equal(candidateTone(c),'amber')
  }
})
test('failure and uncertainty route to human review; danger estimate gets a distinct priority', () => {
  for (const status of ['ERROR','REQUIRES_REVIEW'] as const) assert.equal(candidateTone(candidate({status})),'indigo')
  assert.equal(needsReview(candidate({status:'AI_DANGER_ESTIMATE'})),true)
  assert.equal(candidateTone(candidate({status:'AI_DANGER_ESTIMATE'})),'signal')
})
test('human disposition takes precedence over late AI danger; review request is not closed', () => {
  for (const human_disposition of ['reviewed','dismissed'] as const) {
    const c = candidate({human_disposition,status:'AI_DANGER_ESTIMATE'})
    assert.equal(isClosed(c),true); assert.equal(needsReview(c),false); assert.equal(candidateTone(c),undefined)
  }
  assert.equal(needsReview(candidate({human_disposition:'requires_review'})),true)
})
test('frames advance at equal revision, stale results do not regress state, restart accepts lower revision', () => {
  const old = snapshot(5,'old'), next = snapshot(5,'new')
  assert.equal(acceptSnapshot(old,next).frames.CAM_04,'new')
  assert.equal(acceptSnapshot(next,snapshot(4,'stale')),next)
  assert.equal(acceptSnapshot(next,snapshot(0,'restart','second')).instance,'second')
})
