// ============================================================
// script.js - Funções utilitárias do Sistema SUPERVILLE
// ============================================================

// ---- Retornar status formatado ----
function getStatusClass(status) {
  const map = {
    'Em uso':      'status-em-uso',
    'Disponível':  'status-disponivel',
    'Manutenção':  'status-manutencao'
  };
  return map[status] || 'status-disponivel';
}

// ---- Formatar tipo de movimentação ----
function getTipoClass(tipo) {
  const map = {
    'Retirada':      'tipo-retirada',
    'Devolução':     'tipo-devolucao',
    'Transferência': 'tipo-transferencia'
  };
  return map[tipo] || '';
}

// ---- Obter movimentações de um patrimônio ----
function getMovimentacoes(patrimonioId) {
  const key = `movimentacoes_${patrimonioId}`;
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

// ---- Salvar movimentação ----
function salvarMovimentacao(patrimonioId, dados) {
  const movs = getMovimentacoes(patrimonioId);
  movs.unshift(dados); // mais recente primeiro
  localStorage.setItem(`movimentacoes_${patrimonioId}`, JSON.stringify(movs));
}

// ---- Exibir toast de notificação ----
function showToast(mensagem, tipo = 'success') {
  // Remove toast anterior
  const old = document.getElementById('toast');
  if (old) old.remove();

  const icon = tipo === 'success'
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;

  const toast = document.createElement('div');
  toast.id = 'toast';
  toast.className = `toast${tipo === 'error' ? ' error' : ''}`;
  toast.innerHTML = `${icon}<span>${mensagem}</span>`;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('show'));
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// ---- Data/Hora atual formatada ----
function agora() {
  const d = new Date();
  const data = d.toLocaleDateString('pt-BR');
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return { data, hora };
}

// ---- Escapar HTML para segurança ----
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---- Editar patrimônio (salva no localStorage sobrescrevendo) ----
function salvarEdicao(id, dados) {
  const overrides = JSON.parse(localStorage.getItem('patrimonios_override') || '{}');
  overrides[id] = dados;
  localStorage.setItem('patrimonios_override', JSON.stringify(overrides));
}

// ---- Obter dados de patrimônio (com override) ----
function getPatrimonio(id) {
  const overrides = JSON.parse(localStorage.getItem('patrimonios_override') || '{}');
  const base = patrimonios.find(p => p.id === id);
  if (!base) return null;
  return overrides[id] ? { ...base, ...overrides[id] } : { ...base };
}

// ---- Todos os patrimônios (com overrides aplicados) ----
function getTodosPatrimonios() {
  const overrides = JSON.parse(localStorage.getItem('patrimonios_override') || '{}');
  return patrimonios.map(p => overrides[p.id] ? { ...p, ...overrides[p.id] } : { ...p });
}
