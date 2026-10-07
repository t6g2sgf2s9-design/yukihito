import { YukinatorPortrait,type PortraitVariant } from './yukinator/YukinatorPortrait';
export function Character({message,variant='question'}:{message:string;variant?:PortraitVariant}) {
 return <div className="character-scene"><span className="sparkle sparkle-one" aria-hidden="true">✧</span><span className="sparkle sparkle-two" aria-hidden="true">❄</span><YukinatorPortrait variant={variant}/><div className="speech" aria-live="polite">{message}</div></div>;
}
