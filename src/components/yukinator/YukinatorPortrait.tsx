export type PortraitVariant='start'|'question'|'guess'|'result';
export function YukinatorPortrait({variant='question'}:{variant?:PortraitVariant}) {
 return <img className={`yukinator-portrait portrait-${variant}`} src="/yukinator/character.png" alt="ゆきネーター" decoding="async"/>;
}
