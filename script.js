// ============================================================
// script.js — Utilitários compartilhados SUPERVILLE
// ============================================================

// ── Constantes ──
const SENHA_ADMIN     = '1234';
const HORAS_DEVOLUCAO = 14; // prazo máximo em horas

// ── Helpers de escape ──
function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Data/Hora atual ──
function agora() {
  const d = new Date();
  const data = d.toLocaleDateString('pt-BR');
  const hora = d.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
  const iso  = d.toISOString();
  return { data, hora, iso, ts: d.getTime() };
}

// ── Toast ──
function showToast(msg, tipo = 'ok') {
  const old = document.getElementById('_toast');
  if (old) old.remove();
  const icone = tipo === 'ok'
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
  const t = document.createElement('div');
  t.id = '_toast';
  t.className = 'toast' + (tipo === 'erro' ? ' erro' : '');
  t.innerHTML = icone + `<span>${msg}</span>`;
  document.body.appendChild(t);
  requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('show')));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 3000);
}

// ── Modal helpers ──
function abrirModal(id)  { document.getElementById(id).classList.add('active');    document.body.style.overflow = 'hidden'; }
function fecharModal(id) { document.getElementById(id).classList.remove('active'); document.body.style.overflow = ''; }

// ── LocalStorage: usos ativos ──
// Chave: uso_ativo_{patrimonioId}
// Valor: { nome, setor, data, hora, ts, fotoBase64, bloqueado }
function getUsoAtivo(id)          { try { return JSON.parse(localStorage.getItem(`uso_ativo_${id}`)); } catch { return null; } }
function setUsoAtivo(id, dados)   { localStorage.setItem(`uso_ativo_${id}`, JSON.stringify(dados)); }
function removerUsoAtivo(id)      { localStorage.removeItem(`uso_ativo_${id}`); }

// ── LocalStorage: histórico de movimentações ──
function getHistorico(id)         { try { return JSON.parse(localStorage.getItem(`historico_${id}`)) || []; } catch { return []; } }
function addHistorico(id, reg)    { const h = getHistorico(id); h.unshift(reg); localStorage.setItem(`historico_${id}`, JSON.stringify(h)); }

// ── LocalStorage: bloqueados (nome+setor que não devolveram) ──
function getBloqueados()          { try { return JSON.parse(localStorage.getItem('bloqueados')) || []; } catch { return []; } }
function addBloqueado(dados)      {
  const lista = getBloqueados();
  const chave = dados.nome.toLowerCase().trim() + '|' + dados.setor.toLowerCase().trim();
  if (!lista.find(b => (b.nome.toLowerCase().trim()+'|'+b.setor.toLowerCase().trim()) === chave)) {
    lista.push(dados);
    localStorage.setItem('bloqueados', JSON.stringify(lista));
  }
}
function removerBloqueado(nome, setor) {
  const chave = nome.toLowerCase().trim() + '|' + setor.toLowerCase().trim();
  const lista = getBloqueados().filter(b => (b.nome.toLowerCase().trim()+'|'+b.setor.toLowerCase().trim()) !== chave);
  localStorage.setItem('bloqueados', JSON.stringify(lista));
}
function estaBloqueado(nome, setor) {
  const chave = nome.toLowerCase().trim() + '|' + setor.toLowerCase().trim();
  return getBloqueados().some(b => (b.nome.toLowerCase().trim()+'|'+b.setor.toLowerCase().trim()) === chave);
}

// ── Calcular status de um patrimônio ──
function calcStatus(id) {
  const uso = getUsoAtivo(id);
  if (!uso) return 'Disponível';
  const agora_ts = Date.now();
  const horas = (agora_ts - uso.ts) / 3600000;
  if (horas > HORAS_DEVOLUCAO) return 'Atrasado';
  return 'Em uso';
}

// ── Badge HTML ──
function badgeHTML(status) {
  const map = {
    'Disponível': 'badge-disponivel',
    'Em uso':     'badge-uso',
    'Manutenção': 'badge-manutencao',
    'Atrasado':   'badge-atrasado',
  };
  return `<span class="badge ${map[status] || 'badge-disponivel'}">${esc(status)}</span>`;
}

// ── Badge tipo movimentação ──
function tipoBadge(tipo) {
  const map = { 'Retirada':'tipo-retirada', 'Devolução':'tipo-devolucao', 'Transferência':'tipo-transferencia' };
  return `<span class="badge ${map[tipo]||''}">${esc(tipo)}</span>`;
}

// ── Todos os patrimônios com status calculado ──
function getTodosComStatus() {
  return patrimonios.map(p => ({ ...p, status: calcStatus(p.id) }));
}

// ── Verificar e registrar bloqueados por atraso ──
function verificarAtrasos() {
  patrimonios.forEach(p => {
    const uso = getUsoAtivo(p.id);
    if (!uso) return;
    const horas = (Date.now() - uso.ts) / 3600000;
    if (horas > HORAS_DEVOLUCAO) {
      addBloqueado({ nome: uso.nome, setor: uso.setor, patrimonioId: p.id, modelo: p.modelo, horaRetirada: uso.hora, dataRetirada: uso.data });
    }
  });
}

// Verificar atrasos ao carregar qualquer página
document.addEventListener('DOMContentLoaded', verificarAtrasos);
