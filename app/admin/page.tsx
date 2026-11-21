import {Backoffice} from '@/components/backoffice';
export default function Admin(){return <Backoffice v2Enabled={process.env.BACKOFFICE_V2_ENABLED==='true'}/>}
