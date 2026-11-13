"use strict";
const FIXOS = { PBNC: 4.95, EENC: 1.51, PBNG: 6.25, EENG: 2.25 };
const fmt = n => Number(n).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2});
const get = id => document.getElementById(id);
const num = id => Number(get(id).value);
function showError(id,msg){const el=get(id);el.textContent=msg;el.style.display="block";}
function clearError(id){const el=get(id);el.textContent="";el.style.display="none";}
function validate(ids,errorId){
  clearError(errorId);
  for(const id of ids){
    const el=get(id), v=el.value.trim(), n=Number(v);
    if(v==="" || !Number.isFinite(n)){showError(errorId,"Preencha todos os campos com valores numéricos válidos e tente novamente.");el.focus();return false;}
    if(el.type==="number" && (n < Number(el.min || 0) || (el.max!=="" && n>Number(el.max)))){
      showError(errorId,`Valor inválido em "${el.previousElementSibling.textContent}". Verifique os limites e tente novamente.`);el.focus();return false;
    }
  }
  return true;
}
function patient(species,pa,age,activity,ecc){
  let NEM;
  if(species==="gato") NEM=100;
  else if(activity===2) NEM=95;
  else NEM=({1:140,2:130,3:105})[age];
  const isDog=species==="cao";
  const PM=isDog?Math.pow(pa,0.75):Math.pow(pa,0.67);
  const PBneed=PM*(isDog?FIXOS.PBNC:FIXOS.PBNG);
  const EEneed=PM*(isDog?FIXOS.EENC:FIXOS.EENG);
  const END=NEM*PM;
  return {species,pa,age,activity,ecc,NEM,PM,PBneed,EEneed,END,
    eccText:ecc>5?`Sobrepeso: ${fmt((ecc-5)*10)}%`:ecc<5?`Subpeso: ${fmt((5-ecc)*10)}%`:"Escore Ideal!"};
}
function food(p,em,pba,eea){
  const ration=1000*p.END/em;
  const protein=pba*ration/1000, fat=eea*ration/1000;
  return {em,pba,eea,ration,protein,fat,proteinDiff:p.PBneed-protein,fatDiff:p.EEneed-fat};
}
function metric(label,value){return `<div class="metric"><span class="name">${label}</span><strong>${value}</strong></div>`;}
function diffText(value,kind,suffix=""){
  const abs=Math.abs(value);
  if(Math.abs(value)<1e-9)return "Não houve déficit nem acréscimo.";
  const nutrient=kind==="proteina"?"Proteico":"de Extrato Etéreo";
  return value>0?`Déficit ${nutrient}: ${fmt(abs)}${suffix}`:`Acréscimo ${nutrient}: ${fmt(abs)}${suffix}`;
}
function patientResults(p){
  return `<h3>Necessidades do animal</h3><div class="result-grid">
  ${metric("Espécie",p.species==="cao"?"Cão":"Gato")}
  ${metric("Peso",`${fmt(p.pa)} kg`)}${metric("Escore Corporal",fmt(p.ecc))}
  ${metric("Classificação do ECC",p.eccText)}
  ${metric("Peso Metabólico",fmt(p.PM))}
  ${metric("Energia Necessária Diária",`${fmt(p.END)} kcal/dia`)}
  ${metric("Proteína Necessária Diária",`${fmt(p.PBneed)} g/dia`)}
  ${metric("Extrato Etéreo Necessário Diário",`${fmt(p.EEneed)} g/dia`)}
  </div>`;
}
function oneResult(p,f){
  return patientResults(p)+`<h3 style="margin-top:20px">Resultado da ração</h3><div class="result-grid">
  ${metric("Ração Necessária",`${fmt(f.ration)} g/dia`)}
  ${metric("Proteína na Ração",`${fmt(f.protein)} g/dia`)}
  ${metric("Extrato Etéreo na Ração",`${fmt(f.fat)} g/dia`)}
  ${metric("Balanço proteico",diffText(f.proteinDiff,"proteina"))}
  ${metric("Balanço de extrato etéreo",diffText(f.fatDiff,"gordura"))}
  </div>`;
}
function compareResult(p,f1,f2){
  const n1=p.species==="cao"?"DPCF":"DPGF", n2=p.species==="cao"?"DECF":"DEGF";
  return patientResults(p)+`<h3 style="margin-top:20px">Comparação entre as rações</h3>
  <table><thead><tr><th>Indicador</th><th>Ração 1</th><th>Ração 2</th></tr></thead><tbody>
  <tr><td>Ração necessária (g/dia)</td><td>${fmt(f1.ration)}</td><td>${fmt(f2.ration)}</td></tr>
  <tr><td>Proteína na ração (g/dia)</td><td>${fmt(f1.protein)}</td><td>${fmt(f2.protein)}</td></tr>
  <tr><td>Extrato etéreo na ração (g/dia)</td><td>${fmt(f1.fat)}</td><td>${fmt(f2.fat)}</td></tr>
  <tr><td>Balanço proteico</td><td>${diffText(f1.proteinDiff,"proteina")}</td><td>${diffText(f2.proteinDiff,"proteina")}</td></tr>
  <tr><td>Balanço de extrato etéreo</td><td>${diffText(f1.fatDiff,"gordura")}</td><td>${diffText(f2.fatDiff,"gordura")}</td></tr>
  </tbody></table>
  <div class="result-grid">
  ${metric("Diferença proteica entre rações",`${fmt(f1.protein-f2.protein)} g/dia`)}
  ${metric("Diferença de extrato etéreo entre rações",`${fmt(f1.fat-f2.fat)} g/dia`)}
  </div>`;
}
function commonValues(suffix){
  return patient(get("species"+suffix).value,num("pa"+suffix),num("age"+suffix),num("activity"+suffix),num("ecc"+suffix));
}
const ids1=["pa1","ecc1","em","pba","eea"];
const ids2=["pa2","ecc2","em1","pba1","eea1","em2","pba2","eea2"];
get("form1").addEventListener("submit",e=>{
  e.preventDefault();get("results1").style.display="none";
  if(!validate(ids1,"error1"))return;
  const p=commonValues("1"), f=food(p,num("em"),num("pba"),num("eea"));
  get("results1").innerHTML=oneResult(p,f);get("results1").style.display="block";
});
get("form2").addEventListener("submit",e=>{
  e.preventDefault();get("results2").style.display="none";
  if(!validate(ids2,"error2"))return;
  const p=commonValues("2"), f1=food(p,num("em1"),num("pba1"),num("eea1")), f2=food(p,num("em2"),num("pba2"),num("eea2"));
  get("results2").innerHTML=compareResult(p,f1,f2);get("results2").style.display="block";
});
for(const [btn,panel] of [["btn1","tab1"],["btn2","tab2"]]){
  get(btn).addEventListener("click",()=>{
    document.querySelectorAll(".tab").forEach(b=>b.setAttribute("aria-selected",String(b.id===btn)));
    document.querySelectorAll(".panel").forEach(p=>p.classList.toggle("active",p.id===panel));
  });
}
get("form1").addEventListener("reset",()=>{get("results1").style.display="none";clearError("error1");});
get("form2").addEventListener("reset",()=>{get("results2").style.display="none";clearError("error2");});
