import { getLang } from '../i18n';
import './caseScreenMotion.css';

type Run = { stopped: boolean };
type Scene = { file: string; ru: string; en: string; focus: string };
const scenes: Record<string, Scene[]> = {
  'ai-agents': [
    { file: 'agents-review.png', ru: 'Черновик рисков готов к проверке', en: 'Risk draft ready for review', focus: 'overview' },
    { file: 'agents-review.png', ru: 'Риски и обоснования — в одном реестре', en: 'Risks and rationale in one registry', focus: 'risks' },
    { file: 'agents-review.png', ru: 'Паспорт версии сохраняет контекст', en: 'The version passport retains context', focus: 'passport' },
  ],
  'stop-spam': [
    { file: 'spam-welcome.png', ru: 'Спокойное знакомство с продуктом', en: 'A calm product introduction', focus: 'welcome' },
    { file: 'spam-sms-setup.png', ru: 'Настройка фильтра — по шагам', en: 'Filter setup, step by step', focus: 'setup' },
    { file: 'spam-sms-setup.png', ru: 'Переход в настройки одним действием', en: 'Open Settings in one action', focus: 'settings' },
  ],
  'community': [
    { file: 'community-publication.png', ru: 'Публикация собирает историю в одном кадре', en: 'A publication frames the whole story', focus: 'publication' },
    { file: 'community-publication.png', ru: 'Аудиоверсия и реакции — рядом с материалом', en: 'Audio and reactions stay close to the story', focus: 'engagement' },
    { file: 'community-publication.png', ru: 'Темы помогают продолжить исследование города', en: 'Topics invite further city exploration', focus: 'topics' },
  ],
  'moderator-dashboard': [
    { file: 'moderator-queue.png', ru: 'Очередь показывает статус каждой проверки', en: 'The queue exposes every review status', focus: 'moderator-queue' },
    { file: 'moderator-profile.png', ru: 'Профиль собирает контекст пользователя', en: 'The profile gathers user context', focus: 'moderator-profile' },
    { file: 'moderator-confirm.png', ru: 'Ответственное действие требует подтверждения', en: 'A consequential action requires confirmation', focus: 'moderator-confirm' },
  ],
};
const label = (s: Scene) => getLang() === 'ru' ? s.ru : s.en;

export function screenMarkup(id: string) {
  const list = scenes[id];
  const alt = id === 'ai-agents' ? 'Реестр рисков ИИ-агентов' : id === 'community' ? 'Сообщество — карточка публикации' : id === 'moderator-dashboard' ? 'Кабинет модератора' : 'Стоп Спам — настройка защиты';
  return `<div class="dm sm sm--${id}" data-focus="${list[0].focus}">
    <div class="sm-viewport"><div class="sm-camera">${[...new Set(list.map(s => s.file))].map((file, i) => `<img class="sm-screen${i === 0 ? ' is-current' : ''}" data-file="${file}" src="${import.meta.env.BASE_URL}cases/figma/${file}" alt="${alt}" decoding="async">`).join('')}</div></div>
    <div class="sm-director"><p class="sm-caption">${label(list[0])}</p><div class="sm-controls" role="group" aria-label="${getLang() === 'ru' ? 'Состояния интерфейса' : 'Interface states'}">${list.map((s, i) => `<button type="button" data-shot="${i}" aria-label="${label(s)}" aria-pressed="${i === 0}"><span>0${i + 1}</span><i></i></button>`).join('')}</div></div>
  </div>`;
}

export async function screenPlay(id: string, root: HTMLElement, run: Run) {
  const list = scenes[id];
  const select = (index: number) => {
    const shot = list[index];
    root.dataset.focus = shot.focus;
    root.querySelectorAll<HTMLElement>('.sm-screen').forEach(img => img.classList.toggle('is-current', img.dataset.file === shot.file));
    root.querySelector<HTMLElement>('.sm-caption')!.textContent = label(shot);
    root.querySelectorAll<HTMLElement>('[data-shot]').forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
  };
  root.querySelectorAll<HTMLButtonElement>('[data-shot]').forEach(button => {
    button.onclick = () => { run.stopped = true; select(Number(button.dataset.shot)); };
  });
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches) { select(1); return; }
  select(0);
  // Short cancellable beats: closing a case or scrolling away never advances its old scene.
  for (let index = 1; index < list.length; index++) {
    for (let tick = 0; tick < 32; tick++) {
      await new Promise(resolve => window.setTimeout(resolve, 100));
      if (run.stopped) return;
      if (reduced.matches) { select(1); return; }
      if (document.hidden) { tick--; continue; }
    }
    select(index);
  }
}
