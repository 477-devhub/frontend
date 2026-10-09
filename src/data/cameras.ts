// HACKATHON-DAY: bundled images are local mock previews, not streamed evidence.
import cam01 from '../assets/cam01.jpg'
import cam02 from '../assets/cam02.jpg'
import cam03 from '../assets/cam03.jpg'
import cam04 from '../assets/cam04.jpg'
import cam05 from '../assets/cam05.jpg'
import cam06 from '../assets/cam06.jpg'
import cam07 from '../assets/cam07.jpg'
import cam08 from '../assets/cam08.jpg'
import cam09 from '../assets/cam09.jpg'
import fall from '../assets/cam08-fall.jpg'
import fight from '../assets/cam05-fight.jpg'
import crouch from '../assets/cam04-crouch.jpg'
const PREVIEWS:Record<string,string>={CAM_01:cam01,CAM_02:cam02,CAM_03:cam03,CAM_04:cam04,CAM_05:cam05,CAM_06:cam06,CAM_07:cam07,CAM_08:cam08,CAM_09:cam09}
const EVENTS:Record<string,string>={CAM_04:crouch,CAM_05:fight,CAM_08:fall}
export const camLabel=(id:string) => id.replace('CAM_','CAM ')
export const previewFor=(id:string,incident=false):string | undefined => incident ? EVENTS[id] ?? PREVIEWS[id] : PREVIEWS[id]
