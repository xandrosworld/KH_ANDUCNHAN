import { useState, useCallback } from 'react';
import { Link2, ExternalLink, Check, Share2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface SocialSharePanelProps {
  url: string;
  title: string;
  description?: string;
  youtubeUrl?: string;
}

/* ── Tiny brand SVG icons (inline to avoid external dependency) ── */
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const XTwitterIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.882 0 1.441 1.441 0 012.882 0z"/>
  </svg>
);

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

type CopyStatus = 'idle' | 'copied' | 'tiktok' | 'instagram' | 'douyin' | 'kuaishou' | 'bilibili' | 'iqiyi' | 'tencentvideo' | 'youku' | 'xiaohongshu' | 'wechat';

const isMobileDevice = () =>
  /Android|iPhone|iPad|iPod/i.test(window.navigator.userAgent);

const openPlatform = (appUrl: string, webUrl: string) => {
  if (!isMobileDevice()) {
    window.open(webUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  let didLeavePage = false;
  const fallback = window.setTimeout(() => {
    if (!didLeavePage && document.visibilityState === 'visible') {
      window.location.href = webUrl;
    }
  }, 900);

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      didLeavePage = true;
      window.clearTimeout(fallback);
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange, { once: true });

  try {
    window.location.href = appUrl;
  } catch {
    window.clearTimeout(fallback);
    window.location.href = webUrl;
  }
};

const SocialSharePanel = ({ url, title, description, youtubeUrl }: SocialSharePanelProps) => {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle');
  const { t } = useLanguage();
  const copiedOpening = (platform: string) => t('share.copiedOpening').replace('{platform}', platform);

  const encodedUrl = encodeURIComponent(url);
  const shareText = description
    ? `${title} - ${description.slice(0, 100)}`
    : title;
  const encodedText = encodeURIComponent(shareText);
  const encodedShareWithUrl = encodeURIComponent(`${shareText} ${url}`);
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
  const whatsappShareUrl = `https://wa.me/?text=${encodedShareWithUrl}`;

  const copyToClipboard = useCallback(async (statusLabel: CopyStatus = 'copied') => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback: try deprecated execCommand
      const ta = document.createElement('textarea');
      ta.value = url;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopyStatus(statusLabel);
    setTimeout(() => setCopyStatus('idle'), 2500);
  }, [url]);

  const handleFacebookShare = () => {
    openPlatform(
      `fb://facewebmodal/f?href=${encodeURIComponent(facebookShareUrl)}`,
      facebookShareUrl,
    );
  };

  const handleTwitterShare = () => {
    openPlatform(
      `twitter://post?message=${encodedShareWithUrl}`,
      twitterShareUrl,
    );
  };

  const handleWhatsAppShare = () => {
    openPlatform(
      `whatsapp://send?text=${encodedShareWithUrl}`,
      whatsappShareUrl,
    );
  };

  const handleTikTokShare = async () => {
    await copyToClipboard('tiktok');
    openPlatform('snssdk1233://', 'https://www.tiktok.com/');
  };

  const handleInstagramShare = async () => {
    await copyToClipboard('instagram');
    openPlatform('instagram://app', 'https://www.instagram.com/');
  };

  const handleDouyinShare = async () => {
    await copyToClipboard('douyin');
    openPlatform('snssdk1128://', 'https://www.douyin.com/');
  };

  const handleKuaishouShare = async () => {
    await copyToClipboard('kuaishou');
    openPlatform('kwai://', 'https://www.kuaishou.com/');
  };

  const handleBilibiliShare = async () => {
    await copyToClipboard('bilibili');
    openPlatform('bilibili://', 'https://www.bilibili.com/');
  };

  const handleIqiyiShare = async () => {
    await copyToClipboard('iqiyi');
    openPlatform('iqiyi://', 'https://www.iq.com/');
  };

  const handleTencentVideoShare = async () => {
    await copyToClipboard('tencentvideo');
    openPlatform('tenvideo://', 'https://v.qq.com/');
  };

  const handleYoukuShare = async () => {
    await copyToClipboard('youku');
    openPlatform('youku://', 'https://www.youku.tv/');
  };

  const handleXiaohongshuShare = async () => {
    await copyToClipboard('xiaohongshu');
    openPlatform('xhsdiscover://', 'https://www.xiaohongshu.com/');
  };

  const handleWechatShare = async () => {
    await copyToClipboard('wechat');
    openPlatform('weixin://', 'https://web.wechat.com/');
  };

  const handleYouTubeOpen = () => {
    if (!youtubeUrl) return;
    openPlatform(youtubeUrl, youtubeUrl);
  };

  const btnBase =
    'flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 border cursor-pointer min-w-0';

  return (
    <div className="py-4" data-testid="social-share-panel">
      <div className="flex items-center gap-2 mb-3">
        <Share2 className="w-4 h-4 text-[#F6D37A]" />
        <span className="text-[14px] font-semibold text-[#F6D37A]">{t('share.title')}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {/* Facebook */}
        <button
          type="button"
          onClick={handleFacebookShare}
          aria-label="Share on Facebook"
          className={`${btnBase} bg-[#1877F2]/10 border-[#1877F2]/25 text-[#6AAEF7] hover:bg-[#1877F2]/20 hover:border-[#1877F2]/40`}
          data-testid="share-facebook"
        >
          <FacebookIcon />
          <span className="hidden sm:inline">Facebook</span>
        </button>

        {/* X / Twitter */}
        <button
          type="button"
          onClick={handleTwitterShare}
          aria-label="Share on X"
          className={`${btnBase} bg-white/[0.06] border-white/[0.12] text-[#D7DAE3] hover:bg-white/[0.1] hover:border-white/[0.2]`}
          data-testid="share-twitter"
        >
          <XTwitterIcon />
          <span className="hidden sm:inline">X</span>
        </button>

        {/* WhatsApp */}
        <button
          type="button"
          onClick={handleWhatsAppShare}
          aria-label="Share on WhatsApp"
          className={`${btnBase} bg-[#25D366]/10 border-[#25D366]/25 text-[#5FE89D] hover:bg-[#25D366]/20 hover:border-[#25D366]/40`}
          data-testid="share-whatsapp"
        >
          <WhatsAppIcon />
          <span className="hidden sm:inline">WhatsApp</span>
        </button>

        {/* TikTok — copy link */}
        <button
          type="button"
          onClick={handleTikTokShare}
          aria-label="Copy listing link and open TikTok"
          className={`${btnBase} ${
            copyStatus === 'tiktok'
              ? 'bg-white/[0.08] border-white/[0.18] text-[#D7DAE3]'
              : 'bg-white/[0.06] border-white/[0.12] text-[#D7DAE3] hover:bg-white/[0.1] hover:border-white/[0.2]'
          }`}
          data-testid="share-tiktok"
        >
          <TikTokIcon />
          <span className="hidden sm:inline">
            {copyStatus === 'tiktok' ? copiedOpening('TikTok') : 'TikTok'}
          </span>
        </button>

        {/* Instagram — copy link */}
        <button
          type="button"
          onClick={handleInstagramShare}
          aria-label="Copy listing link and open Instagram"
          className={`${btnBase} ${
            copyStatus === 'instagram'
              ? 'bg-gradient-to-r from-[#833AB4]/10 via-[#FD1D1D]/10 to-[#F77737]/10 border-[#E1306C]/35 text-[#E1306C]'
              : 'bg-gradient-to-r from-[#833AB4]/10 via-[#FD1D1D]/10 to-[#F77737]/10 border-[#E1306C]/25 text-[#E1306C] hover:from-[#833AB4]/20 hover:via-[#FD1D1D]/20 hover:to-[#F77737]/20 hover:border-[#E1306C]/40'
          }`}
          data-testid="share-instagram"
        >
          <InstagramIcon />
          <span className="hidden sm:inline">
            {copyStatus === 'instagram' ? copiedOpening('Instagram') : 'Instagram'}
          </span>
        </button>

        {/* ── Chinese Platforms ── */}
        {/* Douyin */}
        <button
          type="button"
          onClick={handleDouyinShare}
          aria-label="Copy link and open Douyin"
          className={`${btnBase} ${
            copyStatus === 'douyin'
              ? 'bg-white/[0.08] border-white/[0.18] text-[#D7DAE3]'
              : 'bg-white/[0.06] border-white/[0.12] text-[#D7DAE3] hover:bg-white/[0.1] hover:border-white/[0.2]'
          }`}
          data-testid="share-douyin"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
          <span className="hidden sm:inline">
            {copyStatus === 'douyin' ? t('share.copied') : 'Douyin'}
          </span>
        </button>

        {/* Kuaishou */}
        <button
          type="button"
          onClick={handleKuaishouShare}
          aria-label="Copy link and open Kuaishou"
          className={`${btnBase} ${
            copyStatus === 'kuaishou'
              ? 'bg-[#FF4906]/15 border-[#FF4906]/35 text-[#FF7A47]'
              : 'bg-[#FF4906]/10 border-[#FF4906]/25 text-[#FF7A47] hover:bg-[#FF4906]/20 hover:border-[#FF4906]/40'
          }`}
          data-testid="share-kuaishou"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M18.315 12.264c2.33 0 4.218 1.88 4.218 4.2V19.8c0 2.32-1.888 4.2-4.218 4.2h-6.202a4.218 4.218 0 0 1-4.023-2.938l-3.676 1.833a2.04 2.04 0 0 1-2.731-.903 2.015 2.015 0 0 1-.216-.907v-5.94a2.03 2.03 0 0 1 2.035-2.024 2.044 2.044 0 0 1 .919.218l3.673 1.85a4.218 4.218 0 0 1 4.02-2.925zm-.062 2.162h-6.078c-1.153 0-2.09.921-2.108 2.065v3.247c0 1.148.925 2.081 2.073 2.1h6.113c1.153 0 2.09-.922 2.109-2.065v-3.247a2.104 2.104 0 0 0-2.074-2.1zM4.18 15.72a.554.554 0 0 0-.555.542v3.734a.556.556 0 0 0 .798.496l.01-.004 3.463-1.756V17.51l-3.467-1.73a.557.557 0 0 0-.249-.06zM9.28 0a5.667 5.667 0 0 1 4.98 2.965 4.921 4.921 0 0 1 3.36-1.317c2.714 0 4.913 2.177 4.913 4.863 0 2.686-2.2 4.863-4.912 4.863a4.921 4.921 0 0 1-3.996-2.034 5.651 5.651 0 0 1-4.345 2.034c-3.131 0-5.67-2.546-5.67-5.687C3.61 2.546 6.149 0 9.28 0zm8.34 3.926c-1.441 0-2.61 1.157-2.61 2.585s1.169 2.585 2.61 2.585c1.443 0 2.612-1.157 2.612-2.585s-1.169-2.585-2.611-2.585zM9.28 2.287a3.395 3.395 0 0 0-3.39 3.4c0 1.877 1.518 3.4 3.39 3.4a3.395 3.395 0 0 0 3.39-3.4c0-1.878-1.518-3.4-3.39-3.4z"/></svg>
          <span className="hidden sm:inline">
            {copyStatus === 'kuaishou' ? t('share.copied') : 'Kuaishou'}
          </span>
        </button>

        {/* Bilibili */}
        <button
          type="button"
          onClick={handleBilibiliShare}
          aria-label="Copy link and open Bilibili"
          className={`${btnBase} ${
            copyStatus === 'bilibili'
              ? 'bg-[#00A1D6]/15 border-[#00A1D6]/35 text-[#5BC8F0]'
              : 'bg-[#00A1D6]/10 border-[#00A1D6]/25 text-[#5BC8F0] hover:bg-[#00A1D6]/20 hover:border-[#00A1D6]/40'
          }`}
          data-testid="share-bilibili"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c0-.373.129-.689.386-.947.258-.257.574-.386.947-.386zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373z"/></svg>
          <span className="hidden sm:inline">
            {copyStatus === 'bilibili' ? t('share.copied') : 'Bilibili'}
          </span>
        </button>

        {/* iQIYI */}
        <button
          type="button"
          onClick={handleIqiyiShare}
          aria-label="Copy link and open iQIYI"
          className={`${btnBase} ${
            copyStatus === 'iqiyi'
              ? 'bg-[#00BE06]/15 border-[#00BE06]/35 text-[#5FE89D]'
              : 'bg-[#00BE06]/10 border-[#00BE06]/25 text-[#5FE89D] hover:bg-[#00BE06]/20 hover:border-[#00BE06]/40'
          }`}
          data-testid="share-iqiyi"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M4.763 2.193c.391-.19.854-.166 1.222.064l9.065 5.673a.46.46 0 0 1 0 .778L5.985 14.38a1.142 1.142 0 0 1-1.222.063A1.154 1.154 0 0 1 4.16 13.4V3.236c0-.435.229-.852.603-1.043zM6.635 15.89c.391-.19.854-.166 1.222.064l9.065 5.673a.46.46 0 0 1 0 .778l-9.065 5.672a1.142 1.142 0 0 1-1.222.063 1.154 1.154 0 0 1-.603-1.043V16.932c0-.435.229-.852.603-1.043z" transform="scale(.75) translate(3 -2)"/></svg>
          <span className="hidden sm:inline">
            {copyStatus === 'iqiyi' ? t('share.copied') : 'iQIYI'}
          </span>
        </button>

        {/* Tencent Video */}
        <button
          type="button"
          onClick={handleTencentVideoShare}
          aria-label="Copy link and open Tencent Video"
          className={`${btnBase} ${
            copyStatus === 'tencentvideo'
              ? 'bg-[#FF6A10]/15 border-[#FF6A10]/35 text-[#FFA05C]'
              : 'bg-[#FF6A10]/10 border-[#FF6A10]/25 text-[#FFA05C] hover:bg-[#FF6A10]/20 hover:border-[#FF6A10]/40'
          }`}
          data-testid="share-tencentvideo"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M21.395 15.035a40 40 0 0 0-.803-2.264l-1.079-2.695c.001-.032.014-.562.014-.836C19.526 4.632 17.351 0 12 0S4.474 4.632 4.474 9.241c0 .274.013.804.014.836l-1.08 2.695a39 39 0 0 0-.802 2.264c-1.021 3.283-.69 4.643-.438 4.673.54.065 2.103-2.472 2.103-2.472 0 1.469.756 3.387 2.394 4.771-.612.188-1.363.479-1.845.835-.434.32-.379.646-.301.778.343.578 5.883.369 7.482.189 1.6.18 7.14.389 7.483-.189.078-.132.132-.458-.301-.778-.483-.356-1.233-.646-1.846-.836 1.637-1.384 2.393-3.302 2.393-4.771 0 0 1.563 2.537 2.103 2.472.251-.03.581-1.39-.438-4.673"/></svg>
          <span className="hidden sm:inline">
            {copyStatus === 'tencentvideo' ? t('share.copied') : 'Tencent Video'}
          </span>
        </button>

        {/* Youku */}
        <button
          type="button"
          onClick={handleYoukuShare}
          aria-label="Copy link and open Youku"
          className={`${btnBase} ${
            copyStatus === 'youku'
              ? 'bg-[#1F95E5]/15 border-[#1F95E5]/35 text-[#6BBEF7]'
              : 'bg-[#1F95E5]/10 border-[#1F95E5]/25 text-[#6BBEF7] hover:bg-[#1F95E5]/20 hover:border-[#1F95E5]/40'
          }`}
          data-testid="share-youku"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M2 12c0 5.523 4.477 10 10 10s10-4.477 10-10S17.523 2 12 2 2 6.477 2 12zm7.5-4.5L16 12l-6.5 4.5v-9z"/></svg>
          <span className="hidden sm:inline">
            {copyStatus === 'youku' ? t('share.copied') : 'Youku'}
          </span>
        </button>

        {/* Xiaohongshu (RED) */}
        <button
          type="button"
          onClick={handleXiaohongshuShare}
          aria-label="Copy link and open Xiaohongshu"
          className={`${btnBase} ${
            copyStatus === 'xiaohongshu'
              ? 'bg-[#FE2C55]/15 border-[#FE2C55]/35 text-[#FF6B87]'
              : 'bg-[#FE2C55]/10 border-[#FE2C55]/25 text-[#FF6B87] hover:bg-[#FE2C55]/20 hover:border-[#FE2C55]/40'
          }`}
          data-testid="share-xiaohongshu"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M22.405 9.879c.002.016.01.02.07.019h.725a.797.797 0 0 0 .78-.972.794.794 0 0 0-.884-.618.795.795 0 0 0-.692.794c0 .101-.002.666.001.777zm-11.509 4.808c-.203.001-1.353.004-1.685.003a2.528 2.528 0 0 1-.766-.126.025.025 0 0 0-.03.014L7.7 16.127a.025.025 0 0 0 .01.032c.111.06.336.124.495.124.66.01 1.32.002 1.981 0 .01 0 .02-.006.023-.015l.712-1.545a.025.025 0 0 0-.024-.036zM.477 9.91c-.071 0-.076.002-.076.01a.834.834 0 0 0-.01.08c-.027.397-.038.495-.234 3.06-.012.24-.034.389-.135.607-.026.057-.033.042.003.112.046.092.681 1.523.787 1.74.008.015.011.02.017.02.008 0 .033-.026.047-.044.147-.187.268-.391.371-.606.306-.635.44-1.325.486-1.706.014-.11.021-.22.03-.33l.204-2.616.022-.293c.003-.029 0-.033-.03-.034zm7.203 3.757a1.427 1.427 0 0 1-.135-.607c-.004-.084-.031-.39-.235-3.06a.443.443 0 0 0-.01-.082c-.004-.011-.052-.008-.076-.008h-1.48c-.03.001-.034.005-.03.034l.021.293c.076.982.153 1.964.233 2.946.05.4.186 1.085.487 1.706.103.215.223.419.37.606.015.018.037.051.048.049.02-.003.742-1.642.804-1.765.036-.07.03-.055.003-.112zm3.861-.913h-.872a.126.126 0 0 1-.116-.178l1.178-2.625a.025.025 0 0 0-.023-.035l-1.318-.003a.148.148 0 0 1-.135-.21l.876-1.954a.025.025 0 0 0-.023-.035h-1.56c-.01 0-.02.006-.024.015l-.926 2.068c-.085.169-.314.634-.399.938a.534.534 0 0 0-.02.191.46.46 0 0 0 .23.378.981.981 0 0 0 .46.119h.59c.041 0-.688 1.482-.834 1.972a.53.53 0 0 0-.023.172.465.465 0 0 0 .23.398c.15.092.342.12.475.12l1.66-.001c.01 0 .02-.006.023-.015l.575-1.28a.025.025 0 0 0-.024-.035z"/>  </svg>
          <span className="hidden sm:inline">
            {copyStatus === 'xiaohongshu' ? t('share.copied') : 'Xiaohongshu'}
          </span>
        </button>

        {/* WeChat */}
        <button
          type="button"
          onClick={handleWechatShare}
          aria-label="Copy link and open WeChat"
          className={`${btnBase} ${
            copyStatus === 'wechat'
              ? 'bg-[#07C160]/15 border-[#07C160]/35 text-[#5FE89D]'
              : 'bg-[#07C160]/10 border-[#07C160]/25 text-[#5FE89D] hover:bg-[#07C160]/20 hover:border-[#07C160]/40'
          }`}
          data-testid="share-wechat"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.007-.27-.018-.407-.033zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982z"/></svg>
          <span className="hidden sm:inline">
            {copyStatus === 'wechat' ? t('share.copied') : 'WeChat'}
          </span>
        </button>

        {/* YouTube — open video if available */}
        {youtubeUrl && (
          <button
            type="button"
            onClick={handleYouTubeOpen}
            aria-label="Open property video on YouTube"
            className={`${btnBase} bg-[#FF0000]/10 border-[#FF0000]/25 text-[#FF6B6B] hover:bg-[#FF0000]/20 hover:border-[#FF0000]/40`}
            data-testid="share-youtube"
          >
            <YouTubeIcon />
            <span className="hidden sm:inline">YouTube</span>
            <ExternalLink className="w-3 h-3 opacity-50" />
          </button>
        )}

        {/* Copy Link */}
        <button
          type="button"
          onClick={() => copyToClipboard('copied')}
          className={`${btnBase} ${
            copyStatus === 'copied'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              : 'bg-[#B88717]/10 border-[#B88717]/25 text-[#F6D37A] hover:bg-[#B88717]/20 hover:border-[#B88717]/40'
          }`}
          data-testid="share-copy-link"
        >
          {copyStatus === 'copied' ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
          <span className="hidden sm:inline">
            {copyStatus === 'copied' ? t('share.copied') : t('share.copyLink')}
          </span>
        </button>
      </div>
    </div>
  );
};

export default SocialSharePanel;
