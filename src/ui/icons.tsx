import type { ReactNode } from 'react'

const base = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const

const make = (d: ReactNode) => () => <svg {...base}>{d}</svg>

export const IconToday = make(<><rect className="f" x="3.5" y="5" width="17" height="15.5" rx="3.5" /><path d="M8 3v4M16 3v4M3.5 10h17" /><circle cx="12" cy="15" r="1.6" fill="currentColor" stroke="none" /></>)
export const IconList = make(<><circle className="f" cx="12.5" cy="12" r="8" /><path d="M4.5 12a8 8 0 1 0 2.4-5.7M4 4.2v3.4h3.4" /><path d="M12.5 8v4.4l2.9 1.8" /></>)
export const IconPill = make(<><g transform="rotate(45 12 12)"><rect className="f" x="8" y="2.5" width="8" height="19" rx="4" /><path d="M8 12h8" /></g></>)
export const IconChart = make(<><rect className="f" x="3.5" y="12" width="4" height="8.5" rx="1.4" /><rect className="f" x="10" y="7" width="4" height="13.5" rx="1.4" /><rect className="f" x="16.5" y="3.5" width="4" height="17" rx="1.4" /></>)
export const IconDoc = make(<><path className="f" d="M14 3H7.5A2.5 2.5 0 0 0 5 5.5v13A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5V8z" /><path d="M14 3v3.5A1.5 1.5 0 0 0 15.5 8H19M8.8 12.5h6.4M8.8 16.5h6.4" /></>)
export const IconGear = make(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>)
export const IconBack = make(<path d="m15 18-6-6 6-6" />)
export const IconPlus = make(<path d="M12 5v14M5 12h14" />)
export const IconUp = make(<path d="m6 15 6-6 6 6" />)
export const IconDown = make(<path d="m6 9 6 6 6-6" />)
export const IconEye = make(<><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>)
export const IconEyeOff = make(<><path d="M17.9 17.9A10.6 10.6 0 0 1 12 19c-6.4 0-10-7-10-7a18 18 0 0 1 5.1-5.9M9.9 5.2A10 10 0 0 1 12 5c6.4 0 10 7 10 7a18 18 0 0 1-2.2 3.2M1 1l22 22" /></>)
export const IconShare = make(<><path d="M12 15V3M7 8l5-5 5 5" /><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" /></>)
export const IconDownload = make(<><path d="M12 3v12M7 10l5 5 5-5" /><path d="M5 21h14" /></>)
export const IconMail = make(<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>)
export const IconChat = make(<path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 21l2.1-5.6A8.4 8.4 0 1 1 21 11.5z" />)
export const IconCode = make(<path d="m8 8-4 4 4 4M16 8l4 4-4 4" />)
export const IconNext = make(<path d="m9 18 6-6-6-6" />)
export const IconClose = make(<path d="M18 6 6 18M6 6l12 12" />)
export const IconFilter = make(<path d="M3 5h18l-7 8.5V19l-4 2v-7.5z" />)
export const IconCheck = make(<path d="m5 12.5 4.5 4.5L19 7.5" />)
export const IconTrash = make(<><path d="M4 7h16M10 11v6M14 11v6" /><path d="M6 7l1 13h10l1-13M9 7V4h6v3" /></>)
export const IconSliders = make(<><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></>)
export const IconPaw = make(<><circle cx="7" cy="9" r="1.8" /><circle cx="11" cy="5.5" r="1.8" /><circle cx="15.5" cy="6.5" r="1.8" /><circle cx="18" cy="11" r="1.8" /><path d="M8.5 16.5c0-2.5 2-4.5 4-4.5s4.5 2 4.5 4.5-1.8 3-4 3-4.5-.5-4.5-3z" /></>)
export const IconEyeOpen = make(<><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><circle cx="12" cy="14" r="2.2" /></>)
export const IconBulb = make(<><path className="f" d="M9 17.5h6M9.5 21h5M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.4 1.1 2.3v1.4h5v-1.4c0-.9.4-1.7 1.1-2.3A6 6 0 0 0 12 3z" /><path d="M9 17.5h6M9.5 21h5M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.4 1.1 2.3v1.4h5v-1.4c0-.9.4-1.7 1.1-2.3A6 6 0 0 0 12 3z" /></>)
