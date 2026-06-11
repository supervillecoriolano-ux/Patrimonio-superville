// ============================================================
// script.js — Utilitários SUPERVILLE (Firebase Firestore)
// ============================================================
import { db } from './firebase-config.js';
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, getDocs, onSnapshot, addDoc, serverTimestamp, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── Constantes ──
export const SENHA_ADMIN     = '1234';
export const HORAS_DEVOLUCAO = 14;

// ── Escape HTML ──
export function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Data/Hora ──
export function agora() {
  const d = new Date();
  return {
    data: d.toLocaleDateString('pt-BR'),
    hora: d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}),
    ts:   d.getTime()
  };
}

// ── Toast ──
export function showToast(msg, tipo='ok') {
  const old = document.getElementById('_toast');
  if (old) old.remove();
  const icone = tipo==='ok'
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
  const t = document.createElement('div');
  t.id = '_toast';
  t.className = 'toast'+(tipo==='erro'?' erro':'');
  t.innerHTML = icone+`<span>${msg}</span>`;
  document.body.appendChild(t);
  requestAnimationFrame(()=>requestAnimationFrame(()=>t.classList.add('show')));
  setTimeout(()=>{t.classList.remove('show');setTimeout(()=>t.remove(),400);},3500);
}

// ── Modal ──
export function abrirModal(id)  { document.getElementById(id).classList.add('active');    document.body.style.overflow='hidden'; }
export function fecharModal(id) { document.getElementById(id).classList.remove('active'); document.body.style.overflow=''; }

// ── Badge HTML ──
export function badgeHTML(status) {
  const map = { 'Disponível':'badge-disponivel','Em uso':'badge-uso','Manutenção':'badge-manutencao','Atrasado':'badge-atrasado' };
  return `<span class="badge ${map[status]||'badge-disponivel'}">${esc(status)}</span>`;
}

// ── Tipo badge ──
export function tipoBadge(tipo) {
  const map = { 'Retirada':'tipo-retirada','Devolução':'tipo-devolucao' };
  return `<span class="badge ${map[tipo]||''}">${esc(tipo)}</span>`;
}

// ── Spinner ──
export function spinner() {
  return `<div class="loading"><div class="spinner"></div><span>Carregando...</span></div>`;
}

// ══════════════════════════════════════════
// FIREBASE FIRESTORE — funções de dados
// ══════════════════════════════════════════

// ── Obter uso ativo de um patrimônio ──
export async function getUsoAtivo(id) {
  try {
    const snap = await getDoc(doc(db,'usos_ativos', id));
    return snap.exists() ? snap.data() : null;
  } catch { return null; }
}

// ── Salvar uso ativo ──
export async function setUsoAtivo(id, dados) {
  await setDoc(doc(db,'usos_ativos', id), dados);
}

// ── Remover uso ativo ──
export async function removerUsoAtivo(id) {
  await deleteDoc(doc(db,'usos_ativos', id));
}

// ── Obter todos os usos ativos ──
export async function getTodosUsos() {
  const snap = await getDocs(collection(db,'usos_ativos'));
  const map = {};
  snap.forEach(d => { map[d.id] = d.data(); });
  return map;
}

// ── Listener em tempo real dos usos ativos ──
export function listenUsos(callback) {
  return onSnapshot(collection(db,'usos_ativos'), snap => {
    const map = {};
    snap.forEach(d => { map[d.id] = d.data(); });
    callback(map);
  });
}

// ── Adicionar ao histórico ──
export async function addHistorico(patrimonioId, reg) {
  await addDoc(collection(db,'historico', patrimonioId, 'movimentacoes'), {
    ...reg, criadoEm: serverTimestamp()
  });
}

// ── Obter histórico de um patrimônio ──
export async function getHistorico(patrimonioId) {
  try {
    const q = query(
      collection(db,'historico', patrimonioId, 'movimentacoes'),
      orderBy('criadoEm','desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data());
  } catch { return []; }
}

// ── Bloqueados ──
export async function getBloqueados() {
  const snap = await getDocs(collection(db,'bloqueados'));
  return snap.docs.map(d => ({id:d.id, ...d.data()}));
}

export async function addBloqueado(dados) {
  const chave = dados.nome.toLowerCase().trim()+'_'+dados.setor.toLowerCase().trim();
  await setDoc(doc(db,'bloqueados', chave), dados);
}

export async function removerBloqueado(nome, setor) {
  const chave = nome.toLowerCase().trim()+'_'+setor.toLowerCase().trim();
  await deleteDoc(doc(db,'bloqueados', chave));
}

export async function estaBloqueado(nome, setor) {
  const chave = nome.toLowerCase().trim()+'_'+setor.toLowerCase().trim();
  const snap = await getDoc(doc(db,'bloqueados', chave));
  return snap.exists();
}

// ── Calcular status ──
export function calcStatusComUso(uso) {
  if (!uso) return 'Disponível';
  const horas = (Date.now() - uso.ts) / 3600000;
  return horas > HORAS_DEVOLUCAO ? 'Atrasado' : 'Em uso';
}

// ── Verificar e registrar atrasos ──
export async function verificarAtrasos(usos) {
  for (const [id, uso] of Object.entries(usos)) {
    const horas = (Date.now() - uso.ts) / 3600000;
    if (horas > HORAS_DEVOLUCAO) {
      await addBloqueado({
        nome: uso.nome, setor: uso.setor,
        patrimonioId: id, modelo: uso.modelo||'',
        horaRetirada: uso.hora, dataRetirada: uso.data
      });
    }
  }
}

// ── Câmera helpers ──
export async function iniciarCamera(videoEl, boxEl) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:'user'},audio:false});
    videoEl.srcObject = stream;
    boxEl.classList.add('ativa');
    return stream;
  } catch(e) {
    showToast('Não foi possível acessar a câmera: '+e.message, 'erro');
    return null;
  }
}

export function pararStream(stream) {
  if (stream) stream.getTracks().forEach(t=>t.stop());
}

export function capturarFoto(videoEl, canvasEl) {
  const w = videoEl.videoWidth  || videoEl.offsetWidth  || 320;
  const h = videoEl.videoHeight || videoEl.offsetHeight || 240;
  canvasEl.width  = w;
  canvasEl.height = h;
  const ctx = canvasEl.getContext('2d');
  // Sem espelho - foto normal
  ctx.drawImage(videoEl, 0, 0, w, h);
  return canvasEl.toDataURL('image/jpeg', 0.7);
}

// ── Editar dados do patrimônio no Firestore ──
export async function salvarEdicaoPatrimonio(id, dados) {
  await setDoc(doc(db,'patrimonios_override', id), dados);
}

export async function getEdicaoPatrimonio(id) {
  const snap = await getDoc(doc(db,'patrimonios_override', id));
  return snap.exists() ? snap.data() : null;
}
