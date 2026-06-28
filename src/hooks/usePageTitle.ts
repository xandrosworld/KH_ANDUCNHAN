import { useEffect } from 'react';

/**
 * Sets the document title dynamically for each page.
 * Format: "Page Name | Sổ Đỏ Vạn Phúc"
 * Resets to default on unmount.
 */
export function usePageTitle(title?: string) {
  useEffect(() => {
    const defaultTitle = 'Sổ Đỏ Vạn Phúc | Hệ thống quản lý nhà đất';
    if (title) {
      document.title = `${title} | Sổ Đỏ Vạn Phúc`;
    } else {
      document.title = defaultTitle;
    }
    return () => {
      document.title = defaultTitle;
    };
  }, [title]);
}
