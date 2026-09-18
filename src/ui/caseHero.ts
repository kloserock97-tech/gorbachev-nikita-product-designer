import { getLang } from '../i18n';
import './caseHero.css';

const words = (ru: string, en: string) => getLang() === 'ru' ? ru : en;
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const lines = '<i></i><i></i><i></i>';

/** Product metaphors and exact Figma exports, with no invented product metrics. */
export function heroAccent(id: string, label: string) {
  const scenes: Record<string, string> = {
    'grif-ai': `<div class="mh-orbit"><span>Calendar</span><span>Mail</span><span>Notes</span></div><div class="mh-orb"><b>g.</b></div><div class="mh-action"><small>${words('КОНТЕКСТ СОБРАН','CONTEXT CONNECTED')}</small><strong>${words('Следующий шаг готов.','Your next move. Ready.')}</strong><span>${words('Вы решаете — ассистент действует','You decide. Your assistant acts.')} <b>↗</b></span></div>`,
    'ai-agents': `<div class="mh-docs"><div>ZIP${lines}</div><div>DOC${lines}</div></div><div class="mh-scanner"><span></span></div><div class="mh-report"><small>${words('ОЦЕНКА РИСКОВ','RISK ASSESSMENT')}</small><strong>${words('Всё под контролем.','Clarity. In control.')}</strong><div><i></i>${words('Промпт-инъекции','Prompt injection')}<b>!</b></div><div><i></i>${words('Отказ ИИ-платформы','AI platform failure')}<b>!</b></div><footer>✓ ${words('Решение с обоснованием','Decisions with context')}</footer></div>`,
    'community': `<div class="mh-story mh-story--back"><span>МОСКВА</span><div class="mh-city"><i></i><i></i><i></i><i></i></div></div><div class="mh-story mh-story--front"><small>${words('ГОРОД В ГОЛОСАХ ЛЮДЕЙ','A CITY TOLD BY ITS PEOPLE')}</small><strong>${words('У каждого места<br>есть история.','Every place<br>has a story.')}</strong><div class="mh-story-lines">${lines}</div><footer><span>● ● ●</span> ${words('Читать · Делиться · Обсуждать','Read · Share · Discuss')}</footer></div>`,
    'moderator-dashboard': `<div class="mh-queue"><div>${words('Комментарии','Comments')}${lines}</div><div>${words('Публикации','Stories')}${lines}</div><div>${words('Жалобы','Reports')}${lines}</div></div><div class="mh-verdict"><span>✓</span><small>${words('ОДНО РАБОЧЕЕ ПРОСТРАНСТВО','ONE WORKSPACE')}</small><strong>${words('Порядок<br>в потоке.','Order.<br>In the flow.')}</strong></div>`,
    'stop-spam': `<div class="mh-call mh-call--one">↙ ${words('Неизвестный номер','Unknown caller')}</div><div class="mh-call mh-call--two">↙ ${words('Нежелательный звонок','Unwanted call')}</div><img class="mh-shield mh-shield--asset" src="${import.meta.env.BASE_URL}cases/figma/spam-shield.png" width="400" height="400" alt=""><div class="mh-caption"><strong>${words('Ваше спокойствие.','Your peace of mind.')}</strong><span>${words('Защита начинается с первого шага','Protection starts with the first step')}</span></div>`,
    'electronic-house': `<div class="mh-building"><div class="mh-roof"></div><div class="mh-windows">${Array.from({length:12},(_,i)=>`<i style="--n:${i}"></i>`).join('')}</div></div><div class="mh-service mh-service--one">↗ ${words('Заявки','Requests')}</div><div class="mh-service mh-service--two">✓ ${words('Голосования','Voting')}</div><div class="mh-service mh-service--three">≋ ${words('Показания','Readings')}</div><div class="mh-caption"><strong>${words('Дом. Всё рядом.','Home. All connected.')}</strong></div>`,
  };
  scenes.community = `<div class="mh-publication-back"></div><img class="mh-publication" src="${import.meta.env.BASE_URL}cases/figma/community-publication.png" width="612" height="492" alt="">`;
  const actual = id === 'ai-agents' || id === 'moderator-dashboard';
  const base = import.meta.env.BASE_URL + 'cases/figma/';
  const frames = id === 'moderator-dashboard'
    ? '<img src="' + base + 'moderator-queue.png" width="1440" height="1156" alt=""><img class="mh-film-next" src="' + base + 'moderator-confirm.png" width="1440" height="861" alt="">'
    : '<img src="' + base + 'agents-review.png" width="760" height="475" alt="">';
  const filmKicker = id === 'moderator-dashboard' ? words('ОЧЕРЕДЬ · КОНТЕКСТ · РЕШЕНИЕ', 'QUEUE · CONTEXT · DECISION') : words('ОТ КОНТЕКСТА К РЕШЕНИЮ', 'FROM CONTEXT TO DECISION');
  const filmTitle = id === 'moderator-dashboard' ? words('Проверка без потери контекста.', 'Review without losing context.') : words('Риски становятся понятными.', 'Make risks clear.');
  const film = '<div class="mh-film"><div class="mh-film-window">' + frames + '</div></div><div class="mh-film-title"><small>' + filmKicker + '</small><strong>' + filmTitle + '</strong></div>';
  return `<figure class="mh mh--${id}${actual ? ' mh--film' : ''}" aria-label="${esc(label)}"><div class="mh-art" aria-hidden="true">${actual ? film : scenes[id] ?? ''}</div></figure>`;
}

export function mountHero(root: HTMLElement, scroller: HTMLElement) {
  const figures = [...root.querySelectorAll<HTMLElement>('.mh')];
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const sync = () => figures.forEach(el => {
    el.classList.toggle('mh-still', media.matches);
    el.classList.toggle('mh-paused', document.hidden || el.dataset.visible !== 'true');
  });
  const io = new IntersectionObserver(entries => { entries.forEach(e => (e.target as HTMLElement).dataset.visible = String(e.isIntersecting)); sync(); }, {root: scroller});
  figures.forEach(el => io.observe(el));
  document.addEventListener('visibilitychange', sync); media.addEventListener('change', sync); sync();
  return () => { io.disconnect(); document.removeEventListener('visibilitychange', sync); media.removeEventListener('change', sync); };
}
