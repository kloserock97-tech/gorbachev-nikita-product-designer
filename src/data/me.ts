import { getLang } from "../i18n";
import ruMe from "./me.ru";

/* Тексты домашней страницы на экране ретро-компьютера (src/scene/portfolioScreen.ts)
   и выпадающего меню Work (src/ui/workMenu.ts). Только данные — правятся без кода.

   Источники фактов: cv-nikita-gorbachev-2026.md, блок About (Main page/EN/Hero screen.en.html),
   research/Approved/PRD.md, кейсы — Main cases/EN. Язык английский, как вся страница холма.
   v21 (правка Никиты): без локации, хэндла, опыта работы и плиток кейсов — кейсы живут в главе
   «Кейсы» и в меню Work; контакты — рабочие.
   v27: русский двойник — me.ru.ts; экран перерисовывается при смене языка (portfolioScreen.ts). */
/** значки хобби — рисуются в portfolioScreen.ts (icon) */
export type HobbyIcon = "music" | "game" | "cube" | "spark";

const me = {
  windowTitle: "Nikita Gorbachev | Home Page",
  address: "http://www.nikita-gorbachev.com/about.htm",
  site: "Nikita's Home Page",
  tagline: "Product Designer",
  nav: ["About me", "Now", "Hobbies", "Contact"],
  /* заголовки разделов на самой странице (полоски-плашки) */
  sections: ["About me", "What I'm doing now", "Three principles", "Hobbies", "Contact"],
  photo: "ui/portrait.jpg",

  profile: [
    ["Name", "Nikita Gorbachev"],
    ["Occupation", "Product Designer"],
    ["Languages", "Russian — native, English — professional working proficiency"],
  ],

  /* v101: история — массив абзацев: wrap() не понимает переносов строк */
  story: [
    "Hi! I'm Nikita, a product designer. Like most designers, I started with drawing. Back in school I made my first concepts in Blender and Illustrator. Yes, I made the famous Blender donut too. And a shaman's hut, which I was a bit prouder of.",
    "Then I went to study at the Moscow University of the Ministry of Internal Affairs and even managed to work in criminal investigation. But design didn't let go. I kept drawing and making my own things, sure it was just a hobby. That you could earn a living designing interfaces and grow in it never even crossed my mind.",
    "Then, little by little, I got my first order on a freelance marketplace. Then a second, then a third. Project by project I built up experience, all the way to my first job at an agency.",
    "From there I made it all the way to big companies, in big tech and fintech. I'm genuinely proud of that.",
  ],

  now: [
    "Today I'm a product designer. I make products for regular people, sometimes with AI inside, and I build them in code myself. Besides the screens, I care about why someone came and whether they'll come back tomorrow.",
    "Last stop: GRIF AI. Open to product design roles.",
  ],

  /* v101: «Три принципа» — между «Чем занят сейчас» и жёлтой заметкой; в меню nav и в кнопки первого экрана не входят */
  principlesIntro: "Over five-plus years in product I've settled on three principles. They keep me from getting bored and from shipping nonsense.",
  principles: [
    { title: "Always experiment.", text: "Experiments are how I learn. Unreal Engine, three.js, AI agents: when something new comes out, I want to get my hands on it. Some of these experiments live in my pet projects." },
    { title: "Check with numbers.", text: "A good-looking screen proves nothing yet. I want to know it worked: people got to the end, came back, did it faster. So after release I look at the numbers." },
    { title: "In design for good.", text: "I left criminal investigation for design and haven't regretted it once. I really do care where the profession is going." },
  ],

  hobbies: [
    { icon: "music" as HobbyIcon, text: "I take drum lessons and play electric guitar. Loudly." },
    { icon: "game" as HobbyIcon, text: "I love Unreal Engine: I try to make my own games and I've worked on games released on Steam." },
    { icon: "cube" as HobbyIcon, text: "3D in Blender, ever since school. This hill is one of those builds." },
    { icon: "spark" as HobbyIcon, text: "Working out what will hook a person so they come back. Fine, that one is my actual job." },
  ],

  quote: "Did it work? Show me the numbers.",

  contacts: [
    ["E-mail", "kloserock97@gmail.com"],
    ["Telegram", "@Gorbachev_Nikita_Designer"],
    ["LinkedIn", "nikita-gorbachev-productdesigner"],
  ],
};

export default me;

/** тексты экрана на текущем языке */
export function getMe(): typeof me {
  return getLang() === "ru" ? ruMe : me;
}
