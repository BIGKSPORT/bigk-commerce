import {ClubRulesContent} from '@/components/club-rules-content';
import {clubConfig} from '@/lib/club';
export const dynamic='force-dynamic';
export default function ClubRules(){return <ClubRulesContent waitDays={clubConfig().waitDays}/>;}
