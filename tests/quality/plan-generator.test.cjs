const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const src=fs.readFileSync(path.resolve(__dirname,'../../sport/coach/plan/plan.js'),'utf8');
function expression(variable){
  const patterns={
    taper:/\btaper\s*=\s*([^,;]+)/,
    deload:/\bdeload\s*=\s*([^,;]+)/,
    volume:/\bvolume\s*=\s*(Math\.round\([^;]+?\))\s*,longShare/,
  };
  const match=src.match(patterns[variable]||new RegExp('\\bconst\\s+'+variable+'\\s*=\\s*([^;]+);'));
  assert.ok(match,'Expression métier introuvable : '+variable);
  return match[1];
}
function evaluate(variable,context){return vm.runInNewContext(expression(variable),context)}
test('Générateur: deux dernières semaines signalées comme affûtage',()=>{
  const weeks=12;
  for(let w=0;w<weeks;w++)assert.equal(evaluate('taper',{w,weeks}),w>=10);
});
test('Générateur: réduction d’affûtage calculée depuis la formule applicative',()=>{
  const weeks=12;
  assert.equal(evaluate('factor',{taper:true,w:10,weeks,deload:false}),.75);
  assert.equal(evaluate('factor',{taper:true,w:11,weeks,deload:false}),.55);
});
test('Générateur: semaine allégée tous les quatre cycles hors première',()=>{
  for(let w=0;w<12;w++)assert.equal(evaluate('deload',{w}),w>0&&w%4===3);
});
test('Générateur: croissance plafonnée à 1,25 dans la formule actuelle',()=>{
  assert.ok(evaluate('growth',{w:0})===1);
  assert.ok(evaluate('growth',{w:100})<=1.25);
});
test('Générateur: sortie longue marathon plafonnée à 32 km',()=>{
  for(const volume of [20,40,70,120,200]){
    const km=evaluate('longKm',{kind:'marathon',volume,longShare:.32});
    assert.ok(km<=32,'Sortie longue dépasse 32 km');
    assert.ok(km>=6);
  }
});
test('Générateur: volume hebdomadaire de référence non négatif',()=>{
  for(const w of [0,3,7,11]){
    const weeks=12,taper=w>=weeks-2,deload=w>0&&w%4===3;
    const growth=evaluate('growth',{w});
    const factor=evaluate('factor',{w,weeks,taper,deload});
    const volume=evaluate('volume',{base:40,growth,factor});
    assert.ok(Number.isInteger(volume)&&volume>=0);
  }
});
test('Générateur: validation explicite et prise en compte Garmin sans modification automatique',()=>{
  assert.match(src,/acceptPlan.*addEventListener/);
  assert.match(src,/recoveryCaution/);
  assert.match(src,/proposedSessions\s*=\s*proposed/);
});
