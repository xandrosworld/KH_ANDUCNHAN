import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { title?: string };

function SvgIcon({ title, children, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden={title ? undefined : true} role={title ? 'img' : undefined} {...props}>
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function SvpUserIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M12 12.2a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4.8 20.2c.8-3.6 3.4-5.5 7.2-5.5s6.4 1.9 7.2 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </SvgIcon>
  );
}

export function SvpPhoneIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M7.3 4.5 9 4.1c.7-.2 1.3.2 1.5.9l.6 2.2c.2.6 0 1.2-.5 1.6l-1 .8a11.5 11.5 0 0 0 4.8 4.8l.8-1c.4-.5 1-.7 1.6-.5l2.2.6c.7.2 1.1.8.9 1.5l-.4 1.7c-.3 1.2-1.3 2-2.5 1.8C10.6 17.7 6.3 13.4 5.5 7c-.2-1.2.6-2.2 1.8-2.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </SvgIcon>
  );
}

export function SvpMailIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M4.5 7.2h15v9.6h-15V7.2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="m5.2 8 6.8 5 6.8-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </SvgIcon>
  );
}

export function SvpLockIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M7 10.4V8.2a5 5 0 0 1 10 0v2.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M5.5 10.4h13v9h-13v-9Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 14v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </SvgIcon>
  );
}

export function SvpGiftIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M4.5 9h15v10h-15V9Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M3.8 6.2h16.4V9H3.8V6.2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 6.2V19M8.4 6.1C6.8 5 6.7 3.5 7.8 3c1.7-.8 3 1 4.2 3.2M15.6 6.1C17.2 5 17.3 3.5 16.2 3c-1.7-.8-3 1-4.2 3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </SvgIcon>
  );
}

export function SvpEyeIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M3.5 12s3-5 8.5-5 8.5 5 8.5 5-3 5-8.5 5-8.5-5-8.5-5Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 14.6a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z" stroke="currentColor" strokeWidth="1.8" />
    </SvgIcon>
  );
}

export function SvpEyeOffIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="m4 4 16 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8.7 6.8A9.6 9.6 0 0 1 12 6.2c5.5 0 8.5 5.8 8.5 5.8a15 15 0 0 1-2.3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M14.5 14.2A2.9 2.9 0 0 1 9.8 9.5M6.1 8.3A14.8 14.8 0 0 0 3.5 12s3 5.8 8.5 5.8c1.2 0 2.3-.3 3.3-.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </SvgIcon>
  );
}

export function SvpLoginIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M9 6.2V5a2 2 0 0 1 2-2h7v18h-7a2 2 0 0 1-2-2v-1.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.5 12h9.2M9.8 8.9 13 12l-3.2 3.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </SvgIcon>
  );
}

export function SvpHouseIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="m4 11 8-6.5 8 6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.2 10.3v9h11.6v-9" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M10 19v-5h4v5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </SvgIcon>
  );
}

export function SvpSearchHomeIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="m4.5 11 6-4.7 6 4.7v5.8h-6.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.2 18.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4ZM10.5 16.5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </SvgIcon>
  );
}

export function SvpPeopleIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M9.5 11a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4ZM3.8 19c.7-3.1 2.8-4.6 5.7-4.6 3 0 5 1.5 5.8 4.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 11.3a2.7 2.7 0 1 0-1.3-5.1M15.6 14.4c2.4.2 4 1.7 4.6 4.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </SvgIcon>
  );
}

export function SvpExpertIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M12 4.2 14 8l4.2.6-3 3  .7 4.2L12 13.8l-3.8 2 .7-4.2-3-3L10 8l2-3.8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M5.5 20c1.2-2.3 3.4-3.4 6.5-3.4s5.3 1.1 6.5 3.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </SvgIcon>
  );
}

export function SvpBriefcaseIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M8.5 7V5.8A1.8 1.8 0 0 1 10.3 4h3.4a1.8 1.8 0 0 1 1.8 1.8V7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4.5 7h15v11.5h-15V7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M4.8 11.5c4.2 1.8 10.2 1.8 14.4 0M12 11.3v2.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </SvgIcon>
  );
}

export function SvpCrownIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M4.5 9.2 8.2 13l3.8-7 3.8 7 3.7-3.8-1.2 9.1H5.7L4.5 9.2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M7 20h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </SvgIcon>
  );
}

export function SvpShieldIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M12 3.5 18.5 6v5.2c0 4.1-2.5 7-6.5 9.3-4-2.3-6.5-5.2-6.5-9.3V6L12 3.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="m8.8 12 2.2 2.1 4.4-4.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </SvgIcon>
  );
}

export function SvpBoltIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M13.2 3.5 5.5 13h5.7l-.4 7.5 7.7-9.8h-5.6l.3-7.2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </SvgIcon>
  );
}

export function SvpTargetIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 16.4a4.4 4.4 0 1 0 0-8.8 4.4 4.4 0 0 0 0 8.8Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 13.2a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4Z" fill="currentColor" />
    </SvgIcon>
  );
}

export function SvpMapPinIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 12.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4Z" stroke="currentColor" strokeWidth="1.8" />
    </SvgIcon>
  );
}

export function SvpHandshakeIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M7.5 13.4 4.8 10.7a2.3 2.3 0 0 1 0-3.2l1.3-1.3 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m12.8 10.8 1.3-1.3a2.4 2.4 0 0 1 3.3 0l1.8 1.8a2.3 2.3 0 0 1 0 3.2l-1.4 1.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m8.6 14.3 3.2 3.2c.6.6 1.5.6 2.1 0l.2-.2.4.4c.6.6 1.6.6 2.2 0 .6-.6.6-1.6 0-2.2l-4.3-4.3-1.5 1.5a2.2 2.2 0 0 1-3.1 0l-.2-.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </SvgIcon>
  );
}

export function SvpGoogleIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M21 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5.1a4.4 4.4 0 0 1-1.9 2.9v2.4h3.1c1.8-1.7 2.7-4.1 2.7-7Z" fill="#4285F4" />
      <path d="M12 21c2.6 0 4.8-.9 6.3-2.4l-3.1-2.4c-.8.6-1.9.9-3.2.9-2.5 0-4.7-1.7-5.4-4H3.4v2.5A9.5 9.5 0 0 0 12 21Z" fill="#34A853" />
      <path d="M6.6 13.1a5.7 5.7 0 0 1 0-3.6V7H3.4a9.5 9.5 0 0 0 0 8.6l3.2-2.5Z" fill="#FBBC05" />
      <path d="M12 6.1c1.4 0 2.7.5 3.7 1.4l2.7-2.7A9.1 9.1 0 0 0 12 2.5 9.5 9.5 0 0 0 3.4 7l3.2 2.5c.7-2.3 2.9-4 5.4-4Z" fill="#EA4335" />
    </SvgIcon>
  );
}

export function SvpFacebookIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M21 12a9 9 0 1 0-10.4 8.9v-6.3H8.3V12h2.3V9.9c0-2.3 1.4-3.6 3.5-3.6 1 0 2 .2 2 .2v2.2H15c-1.1 0-1.5.7-1.5 1.4V12H16l-.4 2.6h-2.1v6.3A9 9 0 0 0 21 12Z" fill="#1877F2" />
      <path d="m15.6 14.6.4-2.6h-2.5v-1.9c0-.7.4-1.4 1.5-1.4h1.1V6.5s-1-.2-2-.2c-2.1 0-3.5 1.3-3.5 3.6V12H8.3v2.6h2.3v6.3a9.6 9.6 0 0 0 2.9 0v-6.3h2.1Z" fill="#fff" />
    </SvgIcon>
  );
}

export function SvpAppleIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M16.2 12.3c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.6-1.3-.1-2.4.7-3.1.7-.6 0-1.6-.7-2.7-.7-1.4 0-2.6.8-3.4 2-1.4 2.5-.4 6.2 1.1 8.2.7 1 1.5 2.1 2.6 2.1 1 0 1.4-.7 2.7-.7 1.2 0 1.6.7 2.7.7s1.9-1 2.5-2c.8-1.2 1.1-2.3 1.1-2.4 0 0-2.3-.9-2.3-3.1ZM14.2 6.2c.6-.7.9-1.6.8-2.5-.8 0-1.8.5-2.4 1.2-.5.6-.9 1.5-.8 2.4.9.1 1.8-.4 2.4-1.1Z" fill="currentColor" />
    </SvgIcon>
  );
}

export function SvpZaloIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <rect x="2.8" y="4.2" width="18.4" height="15.1" rx="4.6" fill="#0068FF" />
      <path d="M7.2 19.2 5.4 22v-3.1c-1.6-.7-2.6-2.1-2.6-3.8V8.8c0-2.5 2-4.6 4.6-4.6h9.2c2.5 0 4.6 2 4.6 4.6v5.9c0 2.5-2 4.6-4.6 4.6H7.2Z" fill="#0068FF" />
      <text x="12" y="14.1" textAnchor="middle" fill="#fff" fontFamily="Arial, Helvetica, sans-serif" fontSize="5.8" fontWeight="800">
        Zalo
      </text>
    </SvgIcon>
  );
}
