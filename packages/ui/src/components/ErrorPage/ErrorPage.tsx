import { tr } from '../../i18n';
import { cx } from '../../internal/util';
import { Button } from '../Button/Button';
import { codeText } from '../InlineCode/InlineCode';

const ERR_COPY: Record<number, [string, string]> = {
  404: ['找不到這個頁面', '網址可能打錯了，或這個頁面已經移除。'],
  500: ['伺服器暫時無法回應', '這個問題已經記錄下來，請稍後重新整理再試。'],
  403: ['沒有權限查看這個頁面', '請向管理員申請權限，或切換成有權限的帳號。'],
};

export interface ErrorPageProps {
  /** 404, 403 and 500 come with their own title and sentence. */
  code: number;
  /** Default: the standard wording for the code, e.g. 「找不到這個頁面」 for 404. */
  title?: string;
  /** One sentence on what happened and what to do; `backticks` are code. */
  description?: string;
  /** Default: history.back(). */
  onBack?: () => void;
  /** Called by 「回到首頁」 instead of following homeHref. */
  onHome?: () => void;
  /** Default '/'. */
  homeHref?: string;
  /** Extra class on the root element. */
  className?: string;
}

/** A whole page for 404, 403 and 500: the code, a title, one sentence, then 「回上一頁」 and 「回首頁」. */
export function ErrorPage({ code, title, description, onBack, onHome, homeHref = '/', className }: ErrorPageProps) {
  const copy = ERR_COPY[code];
  return (
    <main className={cx('ui-errorpage', className)}>
      <div className="ui-errorpage-code" aria-hidden="true">
        {code}
      </div>
      <h1 className="ui-errorpage-title">{title || (copy ? tr(copy[0]) : tr('發生錯誤'))}</h1>
      <p className="ui-errorpage-desc">{codeText(description || (copy ? tr(copy[1]) : ''))}</p>
      <div className="ui-errorpage-actions">
        <Button onClick={onBack ?? (() => history.back())}>{tr('回上一頁')}</Button>
        <Button variant="primary" onClick={onHome ?? (() => (location.href = homeHref))}>
          {tr('回首頁')}
        </Button>
      </div>
    </main>
  );
}
